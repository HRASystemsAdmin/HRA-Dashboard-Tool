/* ==========================================================================
   Workable → Firestore sync for the Client Pipeline tool.

   Runs in GitHub Actions (see .github/workflows/workable-sync.yml). Reads jobs,
   candidates and activity from the Workable API with a read-only token, shapes
   them into the same columns as the Weekly Hiring Update spreadsheet, and writes
   one Firestore document per client to "workable_clients".

   Environment (GitHub repository secrets):
     WORKABLE_SUBDOMAIN         e.g. "hunterrecruitment" for hunterrecruitment.workable.com
     WORKABLE_TOKEN             Workable API token with r_jobs and r_candidates
     FIREBASE_SERVICE_ACCOUNT   the service-account JSON from Firebase

   Modes:
     node workable-sync/sync.mjs            sync and write to Firestore
     node workable-sync/sync.mjs --inspect  print job titles, departments and stage
                                            names only (no candidate data), to help
                                            fill in config.js
     node workable-sync/sync.mjs --dry-run  read Workable and print counts per client,
                                            write nothing
   ========================================================================== */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSPECT = process.argv.includes("--inspect");
const DRY = process.argv.includes("--dry-run");   // build everything, print a summary, write nothing
const ONLY = (process.env.SYNC_CLIENT || "").trim();          // refresh a single client (from the Refresh button)
const REQUESTED_BY = (process.env.SYNC_REQUESTED_BY || "").trim() || "schedule";

/* ---------- config (shared with the web page) ---------- */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "config.js"), "utf8"), sandbox);
const CFG = sandbox.window.HRA_CONFIG.workable;
if (!CFG) fail("config.js has no workable section.");

const SUB = (process.env.WORKABLE_SUBDOMAIN || "").trim();
const TOKEN = (process.env.WORKABLE_TOKEN || "").trim();
if (!SUB || !TOKEN) fail("Set the WORKABLE_SUBDOMAIN and WORKABLE_TOKEN secrets.");
const BASE = `https://${SUB}.workable.com/spi/v3`;

const lower = (s) => String(s ?? "").trim().toLowerCase();
const stageSets = Object.fromEntries(Object.entries(CFG.stages || {}).map(([k, v]) => [k, new Set((v || []).map(lower))]));
const stageType = (name) => {
  const n = lower(name);
  for (const t of ["hired", "offer", "interview", "submitted", "screen"]) if (stageSets[t]?.has(n)) return t;
  return null;
};
const RANK = { screen: 1, submitted: 2, interview: 3, offer: 4, hired: 5 };
const lookbackMs = (CFG.lookbackDays || 365) * 86400e3;
const since = Date.now() - lookbackMs;

function fail(msg) { console.error("✖ " + msg); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Workable API with polite throttling ----------
   Workable allows account tokens 10 requests per 10 seconds (HTTP 429 above that).
   We pace at about 9 per 10 seconds and also respect Workable's rate-limit headers. */
let last = 0, calls = 0;
async function api(urlOrPath) {
  const url = urlOrPath.startsWith("http") ? urlOrPath : BASE + urlOrPath;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const wait = 1100 - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now(); calls++;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
    const remaining = Number(res.headers?.get?.("x-rate-limit-remaining"));
    const reset = Number(res.headers?.get?.("x-rate-limit-reset"));
    if (remaining === 0 && reset) {
      const resetMs = reset > 1e12 ? reset : reset * 1000;   // header may be seconds or milliseconds
      const until = resetMs - Date.now();
      if (until > 0 && until < 15000) await sleep(until + 200);
    }
    if (res.status === 429) { await sleep(Math.min(10000, 2500 * attempt)); continue; }
    if (res.status >= 500) { await sleep(2000 * attempt); continue; }
    if (res.status === 401) fail("Workable rejected the token (401). It may have expired; create a new one and update WORKABLE_TOKEN.");
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Workable ${res.status} for ${url.replace(BASE, "")}`);
    return res.json();
  }
  throw new Error("Workable kept rate-limiting; the next scheduled run will try again.");
}

async function all(pathQ, key, maxPages = 40) {
  const out = [];
  let next = pathQ, pages = 0;
  while (next && pages < maxPages) {
    const data = await api(next);
    if (!data) break;
    out.push(...(data[key] || []));
    next = data.paging?.next || null;
    pages++;
  }
  return out;
}

/* ---------- helpers ---------- */
const strip = (html) => String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
const day = (iso) => (iso ? String(iso).slice(0, 10) : "");
const md = (iso) => { if (!iso) return ""; const d = new Date(iso); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
const slug = (s) => lower(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "client";
const hasWord = (text, words) => { const t = lower(text); return (words || []).some((w) => t.includes(lower(w))); };
const deptOf = (job) => typeof job.department === "string" ? job.department : (job.department?.name || (Array.isArray(job.department_hierarchy) ? job.department_hierarchy.at(-1)?.name : "") || "");

function clientForJob(job) {
  const overrides = CFG.clients || {};
  for (const [name, c] of Object.entries(overrides)) {
    if (c.shortcodes?.includes(job.shortcode)) return name;
    if (c.department && lower(c.department) === lower(deptOf(job))) return name;
    if (c.titleIncludes && lower(job.title).includes(lower(c.titleIncludes))) return name;
  }
  if (CFG.clientFrom === "title") {
    const all = new Set([...Object.keys(overrides), ...(CFG.accountManagers || []).flatMap((a) => a.clients || [])]);
    for (const name of all) if (lower(job.title).includes(lower(name))) return name;
    const parts = String(job.title).split(/\s[-–|]\s/);
    return parts.length > 1 ? parts.at(-1).trim() : null;
  }
  return deptOf(job).trim() || null;
}

/* ---------- inspect mode: structure only, no candidate data ---------- */
async function inspect() {
  const jobs = [...await all("/jobs?state=published&limit=100", "jobs"), ...await all("/jobs?state=closed&limit=100", "jobs", 5)];
  console.log(`\nJobs (${jobs.length}) — title | department | state | shortcode | matched client`);
  for (const j of jobs) console.log(`  ${j.title} | ${deptOf(j) || "(none)"} | ${j.state} | ${j.shortcode} | ${clientForJob(j) || "(no match)"}`);
  const stages = new Map();
  for (const j of jobs.slice(0, 25)) {
    const st = await api(`/jobs/${j.shortcode}/stages`);
    (st?.stages || []).forEach((s) => stages.set(s.name, (stages.get(s.name) || 0) + 1));
  }
  console.log("\nPipeline stage names used by your jobs (put these into config.js → workable.stages):");
  for (const [n, c] of stages) console.log(`  ${n}  (${c} jobs)  → ${stageType(n) || "not mapped"}`);
  const sample = jobs[0] && (await api(`/candidates?shortcode=${jobs[0].shortcode}&limit=1`))?.candidates?.[0];
  if (sample) console.log("\nCandidate fields available:", Object.keys(sample).join(", "));
  console.log(`\nDone with ${calls} API calls. No candidate names or details were printed.`);
}

/* ---------- build one candidate row (spreadsheet columns) ---------- */
function buildRow(cand, job, acts) {
  const stName = cand.stage || cand.stage_name || "";
  const type = stageType(stName);
  const moves = acts.filter((a) => lower(a.action).includes("move") || a.stage_name).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const firstInto = (t) => moves.find((a) => (RANK[stageType(a.stage_name)] || 0) >= RANK[t]);
  const reached = (t) => (RANK[type] || 0) >= RANK[t] || Boolean(firstInto(t));

  const subAct = firstInto("submitted");
  const intAct = firstInto("interview");
  const hireAct = firstInto("hired");
  const comments = acts.filter((a) => lower(a.action) === "comment" && a.body).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const reason = strip(cand.disqualification_reason || "");
  const textForWords = [reason, ...comments.slice(0, 3).map((c) => strip(c.body))].join(" ");
  const disq = Boolean(cand.disqualified);

  let status = "in_process";
  if (type === "hired") status = disq || hasWord(textForWords, CFG.fellThroughWords) ? "fell_through" : "hired";
  else if (disq && (type === "offer" || hasWord(textForWords, CFG.fellThroughWords) && reached("offer"))) status = "fell_through";
  else if (hasWord(textForWords, CFG.noShowWords) && reached("interview")) status = "no_show";
  else if (disq) status = "passed";

  let interview = "";
  if (reached("interview")) interview = `Y${intAct ? " - " + md(intAct.created_at) : ""}`;
  else if (disq) interview = "N";

  let hired = "";
  if (type === "hired" && status === "hired") hired = "Y";
  else if (type === "offer" && !disq) hired = "Offer";
  else if (status === "fell_through") hired = `N${reason ? " - " + reason : ""}`;

  const notes = [
    ...comments.slice(0, 2).map((c) => `${md(c.created_at)} ${c.member?.name ? c.member.name.split(" ")[0] + ": " : ""}${strip(c.body)}`),
    disq && reason ? `Disqualified: ${reason}` : ""
  ].filter(Boolean).join("\n").slice(0, 700);

  return {
    id: String(cand.id),
    name: cand.name || [cand.firstname, cand.lastname].filter(Boolean).join(" "),
    role: job.title,
    submitted: day(subAct?.created_at || cand.updated_at || cand.created_at),
    interview,
    hired,
    roleHired: type === "hired" ? job.title : "",
    startDate: "",
    recruiter: subAct?.member?.name || "",
    notes,
    status,
    interviewAt: day(intAct?.created_at || ""),
    hiredAt: day(hireAct?.created_at || cand.hired_at || (type === "hired" ? cand.updated_at : "") || ""),
    stage: stName,
    link: cand.profile_url || ""
  };
}

/* ---------- Firestore ---------- */
let _db = null;
async function firestore() {
  if (_db) return _db;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) fail("Set the FIREBASE_SERVICE_ACCOUNT secret.");
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (!getApps().length) initializeApp({ credential: cert(JSON.parse(sa)) });
  _db = getFirestore();
  return _db;
}
const setStatus = async (data) => (await firestore()).collection("workable_meta").doc("status").set(data, { merge: true });

/* ---------- sync ---------- */
async function sync() {
  const started = Date.now();
  if (!DRY) await setStatus({ running: true, runScope: ONLY || "all", runStartedAt: new Date().toISOString(), runRequestedBy: REQUESTED_BY });
  const allJobs = [
    ...await all("/jobs?state=published&limit=100", "jobs"),
    ...await all("/jobs?state=closed&limit=100", "jobs", 10)
  ].filter((j) => j.state === "published" || new Date(j.updated_at || j.created_at || 0).getTime() > since);
  const jobs = ONLY ? allJobs.filter((j) => lower(clientForJob(j)) === lower(ONLY)) : allJobs;
  if (ONLY) console.log(`Refreshing only "${ONLY}" (${jobs.length} matching jobs), requested by ${REQUESTED_BY}`);

  const clients = new Map();
  if (ONLY) clients.set(ONLY, { name: ONLY, candidates: [], sourcing: new Map() });
  const weekEnd = (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7)); return d; })();
  const weeks = Array.from({ length: Math.min(Math.max(CFG.sourcingWeeks || 8, 1), 26) }, (_, w) => w).map((w) => { const end = new Date(weekEnd.getTime() - w * 7 * 86400e3); return { end, start: new Date(end.getTime() - 4 * 86400e3) }; });
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const job of jobs) {
    let clientName = clientForJob(job);
    if (ONLY) clientName = ONLY;
    if (!clientName) { console.log(`  skip "${job.title}" (no client match)`); continue; }
    const c = clients.get(clientName) || { name: clientName, candidates: [], sourcing: new Map() };
    clients.set(clientName, c);

    const cands = (await all(`/candidates?shortcode=${job.shortcode}&limit=100`, "candidates", 30))
      .filter((x) => new Date(x.updated_at || x.created_at || 0).getTime() > since);
    const acts = await all(`/jobs/${job.shortcode}/activities?limit=100`, "activities", 30);
    const byCand = new Map();
    for (const a of acts) {
      const id = a.candidate?.id;
      if (!id) continue;
      if (!byCand.has(id)) byCand.set(id, []);
      byCand.get(id).push(a);
    }

    for (const cand of cands) {
      const ca = byCand.get(cand.id) || [];
      const maxRank = Math.max(RANK[stageType(cand.stage)] || 0, ...ca.map((a) => RANK[stageType(a.stage_name)] || 0));
      if (maxRank >= RANK.submitted) c.candidates.push(buildRow(cand, job, ca));
    }

    // Hired candidates: look up the offer start date (best effort)
    for (const row of c.candidates.filter((r) => r.role === job.title && r.status === "hired" && !r.startDate)) {
      const off = await api(`/candidates/${row.id}/offer`).catch(() => null);
      const sd = off?.offer?.start_date || off?.start_date || "";
      if (sd) row.startDate = day(sd);
    }

    // Weekly sourcing numbers (last two weeks, Monday to Friday)
    for (const wk of weeks) {
      const key = day(wk.end.toISOString());
      const sheet = c.sourcing.get(key) || new Map();
      c.sourcing.set(key, sheet);
      const inWeek = (iso) => { const t = new Date(iso).getTime(); return t >= wk.start.getTime() && t < wk.end.getTime() + 86400e3; };
      const bump = (iso, field, name) => {
        const d = new Date(iso); const k = `${d.getUTCDay()}|${job.title}`;
        const r = sheet.get(k) || { dayIndex: d.getUTCDay(), day: DAYS[d.getUTCDay()], role: job.title, sourced: 0, screened: [], submitted: [] };
        if (field === "sourced") r.sourced++; else if (name && !r[field].includes(name)) r[field].push(name);
        sheet.set(k, r);
      };
      cands.filter((x) => x.created_at && inWeek(x.created_at)).forEach((x) => bump(x.created_at, "sourced"));
      for (const a of acts) {
        if (!a.created_at || !inWeek(a.created_at) || !a.candidate?.name) continue;
        const t = stageType(a.stage_name);
        if (t === "screen") bump(a.created_at, "screened", a.candidate.name);
        if (t === "submitted") bump(a.created_at, "submitted", a.candidate.name);
      }
    }
    console.log(`  ✓ ${job.title} → ${clientName}: ${cands.length} candidates checked`);
  }

  if (DRY) {
    for (const c of clients.values()) {
      const counts = c.candidates.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});
      console.log(`  ${c.name}: ${c.candidates.length} submitted`, JSON.stringify(counts));
    }
    if (process.env.SYNC_PREVIEW_FILE) fs.writeFileSync(process.env.SYNC_PREVIEW_FILE, JSON.stringify([...clients.values()].map((c) => ({ ...c, sourcing: [...c.sourcing.entries()].map(([k, m]) => [k, [...m.values()]]) })), null, 1));
    console.log(`\nDry run finished: ${calls} API calls, nothing written.`);
    return;
  }

  /* ---------- write to Firestore ---------- */
  const db = await firestore();

  const now = new Date().toISOString();
  const written = new Set();
  let total = 0;
  for (const c of clients.values()) {
    const extra = (CFG.clients || {})[c.name] || {};
    c.candidates.sort((a, b) => a.submitted.localeCompare(b.submitted));
    const sourcing = [...c.sourcing.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([weekEnding, m]) => ({
      weekEnding,
      rows: [...m.values()].filter((r) => r.dayIndex >= 1 && r.dayIndex <= 5).sort((a, b) => a.dayIndex - b.dayIndex || a.role.localeCompare(b.role)).map(({ dayIndex, ...r }) => r)
    }));
    let doc = { name: c.name, location: extra.location || "", hours: extra.hours || "", updatedAt: now, candidates: c.candidates, sourcing };
    while (Buffer.byteLength(JSON.stringify(doc)) > 900_000 && doc.candidates.length > 50) doc.candidates = doc.candidates.slice(Math.ceil(doc.candidates.length * 0.1));
    const id = slug(c.name);
    await db.collection("workable_clients").doc(id).set(doc);
    written.add(id);
    total += doc.candidates.length;
  }
  if (ONLY) {
    await setStatus({ running: false, ok: true, message: "", lastClientSync: { name: ONLY, at: now, by: REQUESTED_BY, seconds: Math.round((Date.now() - started) / 1000) } });
    console.log(`\n✔ Refreshed "${ONLY}": ${total} submitted candidates (${jobs.length} jobs, ${calls} API calls).`);
    return;
  }
  const existing = await db.collection("workable_clients").listDocuments();
  for (const ref of existing) if (!written.has(ref.id)) await ref.delete();

  await db.collection("workable_meta").doc("status").set({
    lastSync: now, ok: true, clients: written.size, candidates: total, jobs: jobs.length,
    seconds: Math.round((Date.now() - started) / 1000), apiCalls: calls, message: "",
    running: false, runScope: "all", runRequestedBy: REQUESTED_BY
  });
  console.log(`\n✔ Synced ${total} submitted candidates across ${written.size} clients (${jobs.length} jobs, ${calls} API calls).`);
}

(INSPECT ? inspect() : sync()).catch(async (e) => {
  console.error("✖ Sync failed:", e.message);
  try {
    if (!INSPECT && !DRY && process.env.FIREBASE_SERVICE_ACCOUNT) {
      await setStatus({ ok: false, running: false, message: e.message, failedAt: new Date().toISOString(), failedScope: ONLY || "all" });
    }
  } catch {}
  process.exit(1);
});
