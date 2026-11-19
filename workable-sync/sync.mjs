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
import crypto from "node:crypto";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSPECT = process.argv.includes("--inspect");
const RESTART = process.argv.includes("--restart-full-load");
const SUGGEST = process.argv.includes("--suggest-ams");          // preview + suggested account manager per client   // forget progress and start the first load over
const DRY = process.argv.includes("--dry-run") || process.argv.includes("--suggest-ams");   // build everything, print a summary, write nothing
const ONLY = (process.env.SYNC_CLIENT || "").trim();          // refresh a single client (from the Refresh button)
const REQUESTED_BY = (process.env.SYNC_REQUESTED_BY || "").trim() || "schedule";
// Safety settings (see WORKABLE-SETUP.md → "Testing safely")
const GENTLE = (process.env.WORKABLE_GENTLE ?? "1") !== "0";          // 1 request every 3 seconds, stop on any slow-down
const MAX_CALLS = Number(process.env.WORKABLE_MAX_REQUESTS || (GENTLE ? 400 : 0)) || 0;  // hard cap per run (0 = none)
const SHOW_NAMES = process.env.SHOW_NAMES === "1" || process.argv.includes("--inspect") || process.argv.includes("--suggest-ams"); // public logs: hide job/client names unless asked

/* ---------- config (shared with the web page) ---------- */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "config.js"), "utf8"), sandbox);
const CFG = sandbox.window.HRA_CONFIG.workable;
if (!CFG) fail("config.js has no workable section.");

const SUB = (process.env.WORKABLE_SUBDOMAIN || "").trim();
const TOKEN = (process.env.WORKABLE_TOKEN || "").trim();
if (!SUB || !TOKEN) fail("Set the WORKABLE_SUBDOMAIN and WORKABLE_TOKEN secrets.");
const BASE = (process.env.WORKABLE_API_BASE || `https://${SUB}.workable.com/spi/v3`).replace(/\/$/, "");  // override only for local testing

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
   Workable allows account tokens 10 requests per 10 seconds (HTTP 429 above that), and other
   apps on the same Workable account (whatever uses the other existing tokens) may share that limit.
   Power BI is not one of them: it reads Workable's BI Data Link database, not the API.
   Gentle mode (default): 1 request every 3 seconds (about 30% of the limit), waits whenever
   Workable reports few requests left, and STOPS the run at the first "slow down" (429) instead
   of retrying, so it never competes with other apps. */
let PACE_MS = Number(process.env.WORKABLE_PACE_MS) || (GENTLE ? 3000 : 1100);   // override only for local testing
const FULL_PACE_MS = Number(process.env.WORKABLE_FULL_PACE_MS || 5000);   // first load: even gentler (about 20% of Workable's limit)
let last = 0, calls = 0, minRemaining = Infinity, slowDowns = 0, rateLimit = 0;
const runStarted = Date.now();
class SafeStop extends Error {}
async function api(urlOrPath) {
  const url = urlOrPath.startsWith("http") ? urlOrPath : BASE + urlOrPath;
  for (let attempt = 1; attempt <= 6; attempt++) {
    if (MAX_CALLS && calls >= MAX_CALLS) throw new SafeStop(`Stopped safely after ${calls} requests (the safety cap for one run). Nothing is wrong; raise WORKABLE_MAX_REQUESTS when you're ready for a full sync.`);
    const wait = PACE_MS - (Date.now() - last);
    if (wait > 0) await sleep(wait);
    last = Date.now(); calls++;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" } });
    const remaining = Number(res.headers?.get?.("x-rate-limit-remaining"));
    const reset = Number(res.headers?.get?.("x-rate-limit-reset"));
    if (Number.isFinite(remaining)) minRemaining = Math.min(minRemaining, remaining);
    const lim = Number(res.headers?.get?.("x-rate-limit-limit"));
    if (Number.isFinite(lim) && lim > 0) rateLimit = lim;
    if (Number.isFinite(remaining) && remaining <= (GENTLE ? 4 : 0) && reset) {
      const resetMs = reset > 1e12 ? reset : reset * 1000;   // header may be seconds or milliseconds
      const until = resetMs - Date.now();
      if (until > 0 && until < 15000) await sleep(until + 300);
    }
    if (res.status === 429) {
      slowDowns++;
      if (GENTLE) throw new SafeStop("Workable asked us to slow down, probably because another tool or integration on your Workable account is using the API right now. The run stopped immediately so nothing else is affected. Try again at a quieter time.");
      await sleep(Math.min(10000, 2500 * attempt)); continue;
    }
    if (res.status >= 500) { await sleep(2000 * attempt); continue; }
    if (res.status === 401) fail("Workable rejected the token (401). It may have expired; create a new one and update WORKABLE_TOKEN.");
    if (res.status === 403) fail("Workable refused this request (403). Check the token has r_jobs and r_candidates.");
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Workable ${res.status} for ${url.replace(BASE, "")}`);
    return res.json();
  }
  throw new Error("Workable kept rate-limiting; try again later.");
}
function safetyReport() {
  const secs = Math.round((Date.now() - runStarted) / 1000);
  console.log("\n──────── Safety report ────────");
  console.log(`Mode: ${GENTLE ? `gentle (1 request every ${PACE_MS / 1000} s, stops on any slow-down)` : "normal"}${RUN_KIND ? ` · ${RUN_KIND}` : ""}`);
  console.log(`Workable requests used: ${calls}${MAX_CALLS ? ` (cap ${MAX_CALLS})` : ""}`);
  console.log(`Time taken: ${Math.floor(secs / 60)} min ${secs % 60} s`);
  console.log(`Lowest "requests left" Workable reported: ${Number.isFinite(minRemaining) ? `${minRemaining}${rateLimit ? ` of ${rateLimit} (per 10 seconds)` : ""}` : "not reported"}`);
  console.log(`Slow-down responses from Workable: ${slowDowns}`);
  console.log("Changes made in Workable: none (the token is read-only)");
  console.log("───────────────────────────────\n");
}
process.on("exit", safetyReport);
const nm = (s, kind = "item") => SHOW_NAMES ? s : `[${kind}]`;
let RUN_KIND = "";

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
  // Departments to leave out of the Client Pipeline entirely (for example HRA's own internal hiring).
  if ((CFG.ignoreDepartments || []).some((d) => lower(d) === lower(deptOf(job)))) return null;
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
  console.log("Reminder: this repo is public, so this log is too. After you've copied what you need, delete it: Actions → this run → ⋯ (top right) → Delete all logs.");
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
    submitted: day(subAct?.created_at || cand.created_at || cand.updated_at),   // no recorded move: use the application date (last-updated can be Workable housekeeping)
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
  if (process.env.SYNC_FAKE_DB && process.env.SYNC_FAKE_DB_MODULE) { _db = (await import(process.env.SYNC_FAKE_DB_MODULE)).fakeDb(process.env.SYNC_FAKE_DB); return _db; }  // local testing only
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) fail("Set the FIREBASE_SERVICE_ACCOUNT secret.");
  const { initializeApp, cert, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  if (!getApps().length) initializeApp({ credential: cert(JSON.parse(sa)) });
  _db = getFirestore();
  return _db;
}
const setStatus = async (data) => (await firestore()).collection("workable_meta").doc("status").set(data, { merge: true });

/* ---------- What the sync remembers between runs ----------
   sync_cache_jobs/{shortcode}: a compact copy of each job's candidates (stage moves, latest notes).
   sync_cache_meta/state: progress of the first load, the "changed since" cursor, client fingerprints.
   Both are closed to dashboard users by the Firestore rules (only this sync, using the service account, can read them). */
const CACHE = "sync_cache_jobs";
const stateRef = async () => (await firestore()).collection("sync_cache_meta").doc("state");
async function loadState() { const snap = await (await stateRef()).get(); return snap.exists ? snap.data() : {}; }
async function saveState(patch) { await (await stateRef()).set(patch, { merge: true }); }

const jobMeta = (job) => ({ shortcode: job.shortcode, title: job.title || "", client: clientForJob(job) || "", state: job.state || "", jobUpdated: job.updated_at || job.created_at || "" });
const inWindow = (e) => new Date(e.u || e.c || 0).getTime() > since;
const maxRankOf = (e) => Math.max(RANK[stageType(e.st)] || 0, ...(e.mv || []).map((x) => RANK[stageType(x.s)] || 0));

function compactCandidate(cand, acts, prev) {
  const moves = acts.filter((a) => a.stage_name).map((a) => ({ s: a.stage_name, at: a.created_at || "", m: a.member?.name || "" }))
    .sort((x, y) => String(x.at).localeCompare(String(y.at)));
  const e = {
    id: String(cand.id), n: cand.name || [cand.firstname, cand.lastname].filter(Boolean).join(" "), st: cand.stage || cand.stage_name || "",
    dq: Boolean(cand.disqualified), r: strip(cand.disqualification_reason || "").slice(0, 200), c: cand.created_at || "", u: cand.updated_at || "",
    h: cand.hired_at || "", l: cand.profile_url || "", mv: moves, cm: [], sd: prev?.sd || ""
  };
  if (maxRankOf(e) >= RANK.submitted) {
    e.cm = acts.filter((a) => lower(a.action) === "comment" && a.body).sort((x, y) => new Date(y.created_at) - new Date(x.created_at)).slice(0, 3)
      .map((a) => ({ b: strip(a.body).slice(0, 300), at: a.created_at || "", m: a.member?.name || "" }));
  }
  return e;
}
function entryToRow(e, job) {
  const cand = { id: e.id, name: e.n, stage: e.st, disqualified: e.dq, disqualification_reason: e.r, profile_url: e.l, updated_at: e.u, created_at: e.c, hired_at: e.h };
  const acts = [...(e.mv || []).map((x) => ({ action: "moved", stage_name: x.s, created_at: x.at, member: { name: x.m } })),
               ...(e.cm || []).map((x) => ({ action: "comment", body: x.b, created_at: x.at, member: { name: x.m } }))];
  const row = buildRow(cand, job, acts);
  if (e.sd) row.startDate = e.sd;
  return row;
}

/* ---------- Reading Workable efficiently ----------
   The first load is candidate-driven: the job list once, then candidates updated in the window (100 per request,
   no history; only candidates who applied within the window, since Workable's background housekeeping marks
   many old records as "updated"), then the full history ONLY for candidates the dashboard shows (reached "Submitted to Hiring
   Manager" or beyond) and for recently screened candidates (weekly sourcing numbers). Everyone else (for example
   Jeanie's screening conversations with candidates who were never submitted) costs no extra requests. */
const sourcingSince = () => Date.now() - Math.min(Math.max(CFG.sourcingWeeks || 8, 1), 26) * 7 * 86400e3 - 7 * 86400e3;
function needsHistory(cand) {
  const r = RANK[stageType(cand.stage || cand.stage_name || "")] || 0;
  if (r >= RANK.submitted) return true;
  return r >= RANK.screen && new Date(cand.updated_at || cand.created_at || 0).getTime() > sourcingSince();
}
const basicEntry = (cand) => compactCandidate(cand, []);
async function listAllJobs() {
  const jobs = [];
  for (const st of ["published", "closed", "archived"]) jobs.push(...await all(`/jobs?state=${st}&limit=100`, "jobs", 200));
  const seen = new Set();
  return jobs.filter((j) => j.shortcode && !seen.has(j.shortcode) && seen.add(j.shortcode));
}
const unknownStages = new Map();   // stage names seen in histories that config.js doesn't map
async function historyFor(id) {
  const acts = await all(`/candidates/${id}/activities?limit=100`, "activities", 10);
  for (const a of acts) if (a.stage_name && !stageType(a.stage_name)) unknownStages.set(a.stage_name, (unknownStages.get(a.stage_name) || 0) + 1);
  return acts;
}
function reportUnknownStages() {
  const ignore = new Set(["sourced", "applied", "initial contact made", "jeanie in screening", "ai opt out", "jeanie candidate not responsive", "jeanie candidate not interested", "phone screen scheduled", "candidate hold"]);
  const list = [...unknownStages.entries()].filter(([n]) => !ignore.has(lower(n))).sort((a, b) => b[1] - a[1]);
  if (!list.length) return;
  console.log("\nStage names found in candidate histories that config.js doesn't map (check whether any mean 'submitted', 'interview', 'offer' or 'hired'):");
  for (const [n, c] of list.slice(0, 40)) console.log(`  ${n}  (${c} moves)`);
}

async function saveJobCache(doc) {
  doc.cands = (doc.cands || []).filter(inWindow);
  doc.syncedAt = new Date().toISOString();
  // keep each job record under Firestore's 1 MB limit: drop notes of the oldest entries first, then the oldest non-submitted ones
  const size = () => Buffer.byteLength(JSON.stringify(doc));
  const byAge = () => doc.cands.slice().sort((x, y) => String(x.u || x.c).localeCompare(String(y.u || y.c)));
  for (const e of byAge()) { if (size() < 900_000) break; e.cm = []; }
  for (const e of byAge()) { if (size() < 900_000) break; if (maxRankOf(e) < RANK.submitted) doc.cands = doc.cands.filter((x) => x !== e); }
  await (await firestore()).collection(CACHE).doc(doc.shortcode).set(doc);
}

/* Pending changes, grouped per job and written in batches (keeps Firebase writes low). */
function makePending() { return new Map(); }
function addPending(pending, sc, entry) {
  if (!pending.has(sc)) pending.set(sc, new Map());
  const m = pending.get(sc); m.set(entry.id, { ...(m.get(entry.id) || {}), ...entry });
}
async function flushPending(pending, jobsMeta) {
  if (!pending.size) return new Set();
  const db = await firestore();
  const touched = new Set();
  for (const [sc, updates] of pending) {
    const snap = await db.collection(CACHE).doc(sc).get();
    const meta = jobsMeta[sc] || {};
    const doc = snap.exists ? snap.data() : { shortcode: sc, title: meta.title || "", client: meta.client || "", state: meta.state || "", jobUpdated: meta.jobUpdated || "", cands: [] };
    if (!doc.client && meta.client) Object.assign(doc, meta);
    const list = new Map((doc.cands || []).map((e) => [e.id, e]));
    for (const [id, upd] of updates) {
      const old = list.get(id) || {};
      const merged = { ...old, ...upd };
      if (!upd.mv?.length && old.mv?.length) merged.mv = old.mv;      // a stage-only refresh keeps the known history
      if (!upd.cm?.length && old.cm?.length) merged.cm = old.cm;
      list.set(id, merged);
    }
    doc.cands = [...list.values()];
    if (doc.client) { await saveJobCache(doc); touched.add(doc.client); }
  }
  pending.clear();
  return touched;
}
/* The job list (title + client per job) lives in sync_cache_meta/jobs_0, jobs_1… (2,000 jobs each). */
async function saveJobsMeta(map) {
  const db = await firestore();
  const entries = Object.entries(map);
  let i = 0;
  for (; i * 2000 < entries.length; i++) await db.collection("sync_cache_meta").doc(`jobs_${i}`).set({ jobs: Object.fromEntries(entries.slice(i * 2000, (i + 1) * 2000)) });
  await saveState({ jobsChunks: i });
}
async function loadJobsMeta() {
  const db = await firestore();
  const st = await loadState();
  const out = {};
  for (let i = 0; i < (st.jobsChunks || 0); i++) { const s = await db.collection("sync_cache_meta").doc(`jobs_${i}`).get(); if (s.exists) Object.assign(out, s.data().jobs || {}); }
  return out;
}
const jobMetaCompact = (j) => { const m = jobMeta(j); return { title: m.title, client: m.client, state: m.state, jobUpdated: m.jobUpdated }; };

/* ---------- Build each client's page from the remembered jobs ---------- */
function buildClient(name, jobDocs) {
  const weekEnd = (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + ((5 - d.getUTCDay() + 7) % 7)); return d; })();
  const weeks = Array.from({ length: Math.min(Math.max(CFG.sourcingWeeks || 8, 1), 26) }, (_, w) => w).map((w) => { const end = new Date(weekEnd.getTime() - w * 7 * 86400e3); return { end, start: new Date(end.getTime() - 4 * 86400e3) }; });
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const candidates = [], sourcing = new Map();
  for (const jd of jobDocs) {
    const job = { title: jd.title };
    const entries = (jd.cands || []).filter(inWindow);
    for (const e of entries) if (maxRankOf(e) >= RANK.submitted) candidates.push(entryToRow(e, job));
    for (const wk of weeks) {
      const key = day(wk.end.toISOString());
      const sheet = sourcing.get(key) || new Map(); sourcing.set(key, sheet);
      const inWeek = (iso) => { const t = new Date(iso).getTime(); return t >= wk.start.getTime() && t < wk.end.getTime() + 86400e3; };
      const bump = (iso, field, who) => {
        const d = new Date(iso); const k = `${d.getUTCDay()}|${jd.title}`;
        const r = sheet.get(k) || { dayIndex: d.getUTCDay(), day: DAYS[d.getUTCDay()], role: jd.title, sourced: 0, screened: [], submitted: [] };
        if (field === "sourced") r.sourced++; else if (who && !r[field].includes(who)) r[field].push(who);
        sheet.set(k, r);
      };
      for (const e of entries) {
        if (e.c && inWeek(e.c)) bump(e.c, "sourced");
        for (const m of e.mv || []) {
          if (!m.at || !inWeek(m.at)) continue;
          const t = stageType(m.s);
          if (t === "screen") bump(m.at, "screened", e.n);
          if (t === "submitted") bump(m.at, "submitted", e.n);
        }
      }
    }
  }
  candidates.sort((x, y) => x.submitted.localeCompare(y.submitted));
  const extra = (CFG.clients || {})[name] || {};
  return {
    name, location: extra.location || "", hours: extra.hours || "", candidates,
    sourcing: [...sourcing.entries()].sort((x, y) => y[0].localeCompare(x[0])).map(([weekEnding, m]) => ({
      weekEnding,
      rows: [...m.values()].filter((r) => r.dayIndex >= 1 && r.dayIndex <= 5).sort((x, y) => x.dayIndex - y.dayIndex || x.role.localeCompare(y.role)).map(({ dayIndex, ...r }) => r)
    }))
  };
}
const fingerprint = (obj) => crypto.createHash("sha1").update(JSON.stringify(obj)).digest("hex");
/* Writes a client only when something changed. Large clients are split into parts
   (workable_clients/<id>__p2, __p3...) so no record passes Firestore's 1 MB limit; the dashboard joins them back. */
async function writeClient(c, state, now) {
  const db = await firestore();
  const id = slug(c.name);
  const hash = fingerprint(c);
  const oldParts = state.parts?.[id] || 1;
  if (state.hashes?.[id] === hash) return { id, written: false, parts: oldParts, count: c.candidates.length };
  const PART = Number(process.env.SYNC_PART_BYTES) || 750_000;   // override only for local testing
  const chunks = [[]];
  let room = PART - Buffer.byteLength(JSON.stringify(c.sourcing));
  for (const row of c.candidates) {
    const sz = Buffer.byteLength(JSON.stringify(row)) + 2;
    if (room - sz < 0 && chunks.at(-1).length) { chunks.push([]); room = PART; }
    chunks.at(-1).push(row); room -= sz;
  }
  await db.collection("workable_clients").doc(id).set({ name: c.name, location: c.location, hours: c.hours, updatedAt: now, candidates: chunks[0], sourcing: c.sourcing, parts: chunks.length });
  for (let i = 1; i < chunks.length; i++) await db.collection("workable_clients").doc(`${id}__p${i + 1}`).set({ partOf: id, part: i + 1, updatedAt: now, candidates: chunks[i] });
  for (let i = chunks.length; i < oldParts; i++) await db.collection("workable_clients").doc(`${id}__p${i + 1}`).delete();
  state.hashes = { ...(state.hashes || {}), [id]: hash };
  state.parts = { ...(state.parts || {}), [id]: chunks.length };
  return { id, written: true, parts: chunks.length, count: c.candidates.length };
}
/* which = "all" (once a day, and after the first load) or a Set of client names that changed. */
async function rebuildClients(which, state) {
  const db = await firestore();
  const now = new Date().toISOString();
  let jobDocs = [];
  if (which === "all") jobDocs = (await db.collection(CACHE).get()).docs.map((d) => d.data());
  else for (const name of which) jobDocs.push(...(await db.collection(CACHE).where("client", "==", name).get()).docs.map((d) => d.data()));
  const byClient = new Map();
  for (const jd of jobDocs) { if (!jd.client) continue; if (!byClient.has(jd.client)) byClient.set(jd.client, []); byClient.get(jd.client).push(jd); }
  let written = 0, skipped = 0;
  const counts = { ...(state.counts || {}) };
  for (const [name, docs] of byClient) {
    const r = await writeClient(buildClient(name, docs), state, now);
    counts[r.id] = r.count;
    r.written ? written++ : skipped++;
  }
  if (which === "all") {
    const keep = new Set([...byClient.keys()].map(slug));
    for (const ref of await db.collection("workable_clients").listDocuments()) {
      const base = ref.id.split("__p")[0];
      if (!keep.has(base)) { await ref.delete(); delete counts[base]; if (state.hashes) delete state.hashes[base]; if (state.parts) delete state.parts[base]; }
    }
    state.lastRebuildDay = now.slice(0, 10);
  }
  state.counts = counts;
  console.log(`  Clients: ${written} updated, ${skipped} unchanged (skipped, no writes).`);
  return { written, skipped };
}

/* ---------- Run types ---------- */
async function firstLoad(state) {
  RUN_KIND = "first load (resumable)";
  PACE_MS = Math.max(PACE_MS, FULL_PACE_MS);
  let full = !RESTART && state.full?.phase ? state.full : null;
  const save = async () => saveState({ full: { ...full, jobs: null } });   // the job list is kept in its own records
  if (!full) {
    full = { phase: "jobs", startedAt: new Date().toISOString(), next: null, queue: [], qDone: 0, qTotal: 0, cands: 0, pages: 0, jobs: {} };
    Object.assign(state, { mode: "full", full, cursor: null, hashes: RESTART ? {} : state.hashes || {} });
    await saveState({ mode: "full", full: { ...full, jobs: null }, cursor: null });
    console.log(`First load started (last ${CFG.lookbackDays || 365} days).`);
  } else {
    full.jobs = await loadJobsMeta();
    console.log(`Resuming the first load at "${full.phase}" (${full.cands} candidates read, history ${full.qDone} of ${full.qTotal}).`);
  }
  const pending = makePending();
  try {
    if (full.phase === "jobs") {
      const jobs = await listAllJobs();
      full.jobs = Object.fromEntries(jobs.map((j) => [j.shortcode, jobMetaCompact(j)]).filter(([, m]) => m.client));
      await saveJobsMeta(full.jobs);
      full.phase = "candidates";
      full.next = `/candidates?created_after=${encodeURIComponent(new Date(since).toISOString())}&limit=100`;
      await save();
      console.log(`  Jobs: ${jobs.length} in Workable, ${Object.keys(full.jobs).length} belong to clients.`);
    }
    if (full.phase === "candidates") {
      while (full.next) {
        const data = await api(full.next);
        for (const c of data?.candidates || []) {
          const sc = c.job?.shortcode;
          if (!sc || !full.jobs[sc]) continue;
          full.cands++;
          addPending(pending, sc, basicEntry(c));
          if (needsHistory(c)) full.queue.push([String(c.id), sc]);
        }
        full.next = data?.paging?.next || null; full.pages++;
        if (full.pages % 40 === 0) { await flushPending(pending, full.jobs); await save(); console.log(`  … ${full.cands} candidates read, ${full.queue.length} need their history`); }
      }
      await flushPending(pending, full.jobs);
      full.phase = "history"; full.qTotal = full.queue.length; full.qDone = 0;
      await save();
      console.log(`  Candidates: ${full.cands} in the window; ${full.qTotal} need their history (submitted or recently screened).`);
    }
    if (full.phase === "history") {
      while (full.queue.length) {
        const [id, sc] = full.queue[0];
        const acts = await historyFor(id);
        const e = compactCandidate({ id, stage: "" }, acts);
        addPending(pending, sc, { id, mv: e.mv, cm: e.cm });
        full.queue.shift(); full.qDone++;
        if (full.qDone % 150 === 0) { await flushPending(pending, full.jobs); await save(); console.log(`  … history ${full.qDone} of ${full.qTotal}`); }
      }
      await flushPending(pending, full.jobs);
    }
  } finally {
    // Save the last batch, then record progress. If saving fails, progress is NOT recorded,
    // so the next run re-reads that batch instead of skipping it.
    let saved = true;
    try { await flushPending(pending, full.jobs); } catch (e) { saved = false; console.error("Could not save the last batch (it will be read again next run):", e.message); }
    if (saved) await saveState({ full: { ...full, jobs: null } });
    await setStatus({ running: false, mode: "first-load", firstLoad: { phase: full.phase, candidates: full.cands, done: full.qDone, total: full.qTotal || full.queue.length }, lastRunAt: new Date().toISOString(), apiCalls: calls });
  }
  // finished: change-only runs from now on, starting from when the first load began (10 minutes overlap)
  state.cursor = new Date(new Date(full.startedAt).getTime() - 10 * 60e3).toISOString();
  state.mode = "incremental"; state.full = null;
  await rebuildClients("all", state);
  await saveState({ mode: "incremental", cursor: state.cursor, full: null, hashes: state.hashes, parts: state.parts, counts: state.counts, lastRebuildDay: state.lastRebuildDay });
  reportUnknownStages();
  console.log(`\n✔ First load complete. From now on, runs only fetch what changed.`);
}

async function changesOnly(state) {
  RUN_KIND = "changes only";
  const runStart = new Date().toISOString();
  const after = encodeURIComponent(new Date(new Date(state.cursor).getTime() - 10 * 60e3).toISOString());
  const changedCands = await all(`/candidates?updated_after=${after}&limit=100`, "candidates", 50);
  const changedJobs = await all(`/jobs?updated_after=${after}&limit=100`, "jobs", 10);
  console.log(`Changes since last run: ${changedCands.length} candidates, ${changedJobs.length} jobs.`);
  const db = await firestore();
  const metas = {};
  for (const j of changedJobs) if (j.shortcode) metas[j.shortcode] = jobMetaCompact(j);
  const pending = makePending();
  let histories = 0;
  let oldSkipped = 0;
  for (const c of changedCands) {
    const sc = c.job?.shortcode; if (!sc) continue;
    if (new Date(c.created_at || 0).getTime() < since) { oldSkipped++; continue; }   // applied before the window: Workable housekeeping, not real work
    if (!metas[sc]) {
      const snap = await db.collection(CACHE).doc(sc).get();
      if (snap.exists) { const d = snap.data(); metas[sc] = { title: d.title, client: d.client, state: d.state, jobUpdated: d.jobUpdated }; }
      else { const j = await api(`/jobs/${sc}`); metas[sc] = j ? jobMetaCompact(j) : { client: "" }; }
    }
    if (!metas[sc].client) continue;
    const entry = basicEntry(c);
    if (needsHistory(c)) { const e = compactCandidate(c, await historyFor(c.id)); entry.mv = e.mv; entry.cm = e.cm; histories++; }
    addPending(pending, sc, entry);
  }
  // job renames / department changes
  for (const [sc, m] of Object.entries(metas)) if (!pending.has(sc) && changedJobs.some((j) => j.shortcode === sc)) {
    const snap = await db.collection(CACHE).doc(sc).get();
    if (snap.exists) { const d = snap.data(); const before = d.client; Object.assign(d, m); if (d.client) await saveJobCache(d); pending.set(sc, new Map()); if (before && before !== d.client) metas["__old_" + sc] = { client: before }; }
  }
  const touched = await flushPending(pending, metas);
  for (const [k, m] of Object.entries(metas)) if (k.startsWith("__old_") && m.client) touched.add(m.client);
  console.log(`  ${histories} candidates needed their history${oldSkipped ? `; ${oldSkipped} older records skipped (applied before the window)` : ""}.`);
  const today = runStart.slice(0, 10);
  const daily = state.lastRebuildDay !== today;   // once a day: refresh every client (weeks roll over, old entries age out)
  if (daily) console.log("  Daily refresh of all clients (no Workable requests needed).");
  if (daily || touched.size) await rebuildClients(daily ? "all" : touched, state);
  else console.log("  Nothing changed: no writes.");
  state.cursor = runStart;
  await saveState({ cursor: state.cursor, hashes: state.hashes || {}, parts: state.parts || {}, counts: state.counts || {}, lastRebuildDay: state.lastRebuildDay || "" });
}

async function oneClient(state) {
  RUN_KIND = "one client";
  const jobs = (await listAllJobs()).filter((j) => lower(clientForJob(j)) === lower(ONLY));
  console.log(`Refreshing only ${nm(`"${ONLY}"`, "client")} (${jobs.length} jobs), requested by ${REQUESTED_BY}`);
  const metas = Object.fromEntries(jobs.map((j) => [j.shortcode, jobMetaCompact(j)]));
  const pending = makePending();
  for (const j of jobs) {
    const cands = (await all(`/candidates?shortcode=${j.shortcode}&limit=100`, "candidates", 60)).filter((x) => new Date(x.updated_at || x.created_at || 0).getTime() > since);
    for (const c of cands) {
      const entry = basicEntry(c);
      if (needsHistory(c)) { const e = compactCandidate(c, await historyFor(c.id)); entry.mv = e.mv; entry.cm = e.cm; }
      addPending(pending, j.shortcode, entry);
    }
    await flushPending(pending, metas);
  }
  const name = jobs[0] ? clientForJob(jobs[0]) : ONLY;
  await rebuildClients(new Set([name]), state);
  await saveState({ hashes: state.hashes || {}, parts: state.parts || {}, counts: state.counts || {} });
  return name;
}

/* Suggested account managers: for each client, the people who moved its most recent submitted candidates
   to "Submitted to Hiring Manager". Usually that's the account manager; it's a suggestion to confirm. */
async function suggestAccountManagers(sample) {
  const per = Number(process.env.SUGGEST_SAMPLE) || 3;
  const byPerson = new Map(), unclear = [];
  console.log(`\nChecking who submits candidates (${per} most recent per client)…`);
  for (const [client, list] of [...sample.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const recent = list.sort((a, b) => String(b.u).localeCompare(String(a.u))).slice(0, per);
    const tally = new Map();
    for (const c of recent) {
      const acts = await historyFor(c.id);
      const mv = acts.filter((a) => a.stage_name && stageType(a.stage_name) === "submitted").sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      const who = mv?.member?.name; if (who) tally.set(who, (tally.get(who) || 0) + 1);
    }
    const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    const seen = ranked.reduce((t, [, n]) => t + n, 0);
    if (ranked.length && ranked[0][1] / seen >= 0.6) { const [who, n] = ranked[0]; if (!byPerson.has(who)) byPerson.set(who, []); byPerson.get(who).push(`${client} (${n}/${seen})`); }
    else unclear.push(`${client}${ranked.length ? ": " + ranked.map(([w, n]) => `${w} ${n}`).join(", ") : ": no submitter found"}`);
  }
  console.log("\nSuggested account managers (who moved recent candidates to a 'submitted' stage):");
  for (const [who, clients] of [...byPerson.entries()].sort((a, b) => b[1].length - a[1].length)) console.log(`  ${who}: ${clients.join(", ")}`);
  if (unclear.length) { console.log("  Not clear, please decide:"); unclear.forEach((u) => console.log(`    ${u}`)); }
  console.log("\nReady for config.js → workable.accountManagers (add each email, then check the lists):");
  console.log("accountManagers: [");
  for (const [who, clients] of byPerson) console.log(`  { name: ${JSON.stringify(who)}, email: "", clients: ${JSON.stringify(clients.map((c) => c.replace(/ \(\d+\/\d+\)$/, "")))} },`);
  console.log("],");
  reportUnknownStages();
  console.log("\nThis log shows client and team names: delete it after copying (Actions → this run → ⋯ → Delete all logs).");
}

/* Preview: reads the job list and the candidate list (no histories), saves nothing, and reports exactly how big
   the first load will be. Stops cleanly at the safety cap. */
async function preview() {
  RUN_KIND = "preview (nothing saved)";
  let stopped = "", pages = 0, cands = 0, queue = 0, jobCount = 0, clientJobs = {};
  const perClient = new Map(), sample = new Map();
  if (SUGGEST) RUN_KIND = "suggest account managers (nothing saved)";
  try {
    const jobs = await listAllJobs();
    jobCount = jobs.length;
    clientJobs = Object.fromEntries(jobs.map((j) => [j.shortcode, clientForJob(j)]).filter(([, c]) => c && (!ONLY || lower(c) === lower(ONLY))));
    console.log(`Preview: ${jobs.length} jobs in Workable, ${Object.keys(clientJobs).length} belong to clients${ONLY ? " (this client)" : ""}.`);
    let next = `/candidates?created_after=${encodeURIComponent(new Date(since).toISOString())}&limit=100`;
    while (next) {
      const data = await api(next);
      for (const c of data?.candidates || []) {
        const client = clientJobs[c.job?.shortcode]; if (!client) continue;
        cands++;
        if (needsHistory(c)) queue++;
        const r = RANK[stageType(c.stage || "")] || 0;
        if (SUGGEST && r >= RANK.submitted) { const list = sample.get(client) || []; list.push({ id: String(c.id), u: c.updated_at || c.created_at || "" }); sample.set(client, list); }
        if (r >= RANK.submitted) { const p = perClient.get(client) || { submitted: 0, interview: 0, offer: 0, hired: 0 }; p.submitted++; if (r >= RANK.interview) p.interview++; if (r >= RANK.offer) p.offer++; if (r >= RANK.hired) p.hired++; perClient.set(client, p); }
      }
      next = data?.paging?.next || null; pages++;
      if (pages % 50 === 0) console.log(`  … ${pages} pages read (${cands} candidates so far, ${Math.round((Date.now() - runStarted) / 60000)} min)`);
    }
  } catch (e) { if (e instanceof SafeStop) stopped = e.message; else throw e; }
  if (SUGGEST && !stopped) {
    try { await suggestAccountManagers(sample); } catch (e) { if (e instanceof SafeStop) stopped = e.message; else throw e; }
  }
  for (const [name, p] of [...perClient.entries()].sort((a, b) => b[1].submitted - a[1].submitted)) console.log(`  ${nm(name, "client")}: ${p.submitted} submitted, ${p.interview} interviewed, ${p.offer} offers, ${p.hired} hired (by current stage)`);
  const jobPages = Math.ceil(jobCount / 100) + 3;
  if (stopped) {
    console.log(`\n■ Partial preview: read ${pages} pages (${cands} candidates) before the safety cap. ${stopped}`);
    console.log(`So far ${queue} candidates would need their history. Raise the safety cap (for example 1500) to read the whole list and get an exact first-load size.`);
  } else {
    const total = jobPages + pages + queue;
    console.log(`\nCandidates who applied in the last ${CFG.lookbackDays || 365} days, on client jobs: ${cands} (${pages} pages).`);
    console.log(`Candidates whose history is needed (submitted or recently screened): ${queue}.`);
    console.log(`A full first load would need about ${total} requests (about ${Math.round(total * FULL_PACE_MS / 60000)} minutes at 1 request every ${FULL_PACE_MS / 1000} s). It can be spread over several runs.`);
  }
  console.log(`\nPreview finished: ${calls} API calls, nothing written.`);
}

async function sync() {
  const started = Date.now();
  if (DRY) return preview();
  const state = await loadState();
  await setStatus({ running: true, runScope: ONLY || "all", runStartedAt: new Date().toISOString(), runRequestedBy: REQUESTED_BY });
  if (ONLY) {
    const name = await oneClient(state);
    await setStatus({ running: false, ok: true, message: "", lastClientSync: { name, at: new Date().toISOString(), by: REQUESTED_BY, seconds: Math.round((Date.now() - started) / 1000) } });
    console.log(`\n✔ Refreshed ${nm(`"${name}"`, "client")} (${calls} API calls).`);
    return;
  }
  if (RESTART || state.mode !== "incremental" || !state.cursor) await firstLoad(state);
  else await changesOnly(state);
  const counts = state.counts || {};
  await setStatus({
    lastSync: new Date().toISOString(), ok: true, clients: Object.keys(counts).length, candidates: Object.values(counts).reduce((t, n) => t + n, 0),
    seconds: Math.round((Date.now() - started) / 1000), apiCalls: calls, message: "", running: false, runScope: "all", runRequestedBy: REQUESTED_BY, mode: "incremental", firstLoad: null
  });
}

(INSPECT ? inspect() : sync()).catch(async (e) => {
  if (e instanceof SafeStop) {
    console.log("\n■ " + e.message);
    if (!INSPECT && !DRY) console.log("Progress is saved. The next run continues where this one stopped.");
    try { if (!INSPECT && !DRY) await setStatus({ running: false, ok: true, message: "" }); } catch {}
    process.exitCode = 0; return;
  }
  console.error("✖ Sync failed:", e.message);
  try {
    if (!INSPECT && !DRY && (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.SYNC_FAKE_DB)) {
      await setStatus({ ok: false, running: false, message: e.message, failedAt: new Date().toISOString(), failedScope: ONLY || "all" });
    }
  } catch {}
  process.exit(1);
});
