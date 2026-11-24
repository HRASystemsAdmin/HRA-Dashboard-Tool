/* ==========================================================================
   Request Center · app logic
   Data layer: Firebase (Auth + Firestore) when configured, otherwise a demo
   store in localStorage so the page can be previewed right away.
   ========================================================================== */

const CFG = window.HRA_CONFIG;
const DEMO = !CFG.firebase || !CFG.firebase.apiKey;
const lower = (s) => String(s || "").trim().toLowerCase();
const ADMINS = (CFG.admins || []).map(lower);
const MEMBERS = (CFG.members || []).map(lower);
const SUPERS = (CFG.superAdmins || []).map(lower);

const STATUS = {
  open:        { label: "Submitted",   n: 0, color: "var(--s-open)" },
  in_progress: { label: "In progress", n: 1, color: "var(--s-progress)" },
  completed:   { label: "Completed",   n: 2, color: "var(--s-done)" }
};

const ICONS = {
  userminus: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9.5" cy="8" r="3.5"/><path d="M3 20a6.5 6.5 0 0 1 13 0M16 11h6"/></svg>',
  bot:    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="11" rx="3.5"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5"/><circle cx="12" cy="3.5" r="1"/><path d="M2 12v3M22 12v3"/></svg>',
  coins:  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9" cy="7" rx="6" ry="2.6"/><path d="M3 7v4c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6V7"/><path d="M3 11v4c0 1.4 2.7 2.6 6 2.6 1 0 2-.1 2.8-.3"/><circle cx="17" cy="16" r="4.5"/><path d="M17 14v4M15.5 16h3"/></svg>',
  ledger: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M12 6.5v5M10.3 7.8c0-.7.8-1.2 1.7-1.2s1.7.4 1.7 1.1c0 1.6-3.4.9-3.4 2.4 0 .7.8 1.2 1.7 1.2s1.7-.5 1.7-1.2"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/><path d="M15 3.5a6 6 0 0 1 5.5 5.5"/><path d="M15 7a2.5 2.5 0 0 1 2 2"/></svg>',
  queue: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M4 12h10M4 18h7"/><circle cx="18" cy="6" r="1.4"/><circle cx="18" cy="12" r="1.4"/><path d="M18 16v5M15.5 18.5h5"/></svg>',
  userplus: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="8" r="4"/><path d="M3 21a7 7 0 0 1 12.5-4.3"/><path d="M19 14v6M16 17h6"/></svg>',
  spark: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8.5l1.2 2.3 2.3 1.2-2.3 1.2L12 15.5l-1.2-2.3L8.5 12l2.3-1.2z"/></svg>',
  plus:  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13l2.5-7.5A2 2 0 0 1 7.4 4h9.2a2 2 0 0 1 1.9 1.5L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/></svg>',
  clip:  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2L9.8 17.5a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/></svg>',
  upload: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>',
  mail:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/></svg>',
  x:     '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  user:  '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const toDate = (v) => (v && typeof v.toDate === "function") ? v.toDate() : (v ? new Date(v) : new Date());
const ref = (id) => "HRA-" + String(id).slice(0, 6).toUpperCase();
const nameFromEmail = (e) => lower(e).split("@")[0].split(/[._-]/).filter(Boolean).map((p) => p[0].toUpperCase() + p.slice(1)).join(" ") || "Colleague";
const initials = (n) => String(n).split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "?";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function ago(v) {
  const d = toDate(v), s = (Date.now() - d.getTime()) / 1000;
  if (s < 45) return "just now";
  if (s < 3600) return Math.round(s / 60) + " min ago";
  if (s < 86400) return Math.round(s / 3600) + " h ago";
  if (s < 86400 * 6) return Math.round(s / 86400) + " d ago";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}
const fullDate = (v) => toDate(v).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

function toast(msg, color, action) {
  const el = document.createElement("div");
  el.className = "toast";
  if (color) el.style.setProperty("--tc", color);
  el.innerHTML = `<i></i><span>${esc(msg)}</span>${action ? `<button type="button" class="toast-action">${esc(action.label)}</button>` : ""}`;
  const close = () => { el.classList.add("is-leaving"); setTimeout(() => el.remove(), 380); };
  if (action) $(".toast-action", el).addEventListener("click", () => { action.fn(); close(); });
  $("#toasts").appendChild(el);
  setTimeout(close, action ? 6000 : 3600);
}

/* --------------------------------------------------------------------------
   Data stores
   -------------------------------------------------------------------------- */
const bcListeners = new Set(), logListeners = new Set(), trListeners = new Set(), profListeners = new Set(), setListeners = new Set();
function createDemoStore() {
  const KEY = "hra_demo_tickets_v3", UKEY = "hra_demo_user_v2", FKEY = "hra_demo_files_v1";
  const loadFiles = () => { try { return JSON.parse(localStorage.getItem(FKEY)) || {}; } catch { return {}; } };
  const listeners = new Set();
  let onUser = () => {};
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} emit(); };
  const emit = () => listeners.forEach((fn) => fn());
  addEventListener("storage", (e) => { if (e.key === KEY) emit(); });

  const people = {
    member: { uid: "demo-member", email: MEMBERS[0] || "employee@demo.local", name: "Jen Omohundro", role: "member" },
    admin:  { uid: "demo-admin",  email: ADMINS[0]  || "admin@demo.local",    name: "Juan Rochin",  role: "admin" }
  };

  if (!localStorage.getItem(KEY)) {
    const now = Date.now(), m = people.member, a = people.admin;
    const by = { uid: m.uid, email: m.email, name: m.name };
    save([
      { id: "a1f3c9e2", type: "phone_queue", title: "Add Priya Shah to phone queues", status: "in_progress",
        fields: { members: "Priya Shah", emails: "priya.shah@company.com", permissions: ["Access", "Download"], notes: "Recruiting queue, starts Monday." },
        createdBy: by, assignee: { name: a.name, email: a.email }, createdAt: now - 86400e3 * 1.2, updatedAt: now - 3600e3 * 5,
        history: [{ status: "open", at: new Date(now - 86400e3 * 1.2).toISOString(), by: m.name }, { status: "in_progress", at: new Date(now - 3600e3 * 5).toISOString(), by: a.name, note: "Setting this up now." }] },
      { id: "b7d20e41", type: "general", title: "Laptop can't connect to the office printer", status: "open",
        fields: { subject: "Laptop can't connect to the office printer", description: "It shows offline since yesterday. Restarted twice.", priority: "Soon" },
        createdBy: by, assignee: null, createdAt: now - 3600e3 * 3, updatedAt: now - 3600e3 * 3,
        history: [{ status: "open", at: new Date(now - 3600e3 * 3).toISOString(), by: m.name }] },
      { id: "c0e88a5b", type: "general", title: "Update my email signature", status: "completed",
        fields: { subject: "Update my email signature", description: "New title: Senior Recruiter.", priority: "Normal" },
        createdBy: by, assignee: { name: a.name, email: a.email }, createdAt: now - 86400e3 * 4, updatedAt: now - 86400e3 * 3,
        history: [{ status: "open", at: new Date(now - 86400e3 * 4).toISOString(), by: m.name }, { status: "in_progress", at: new Date(now - 86400e3 * 3.5).toISOString(), by: a.name }, { status: "completed", at: new Date(now - 86400e3 * 3).toISOString(), by: a.name, note: "Done. Restart Outlook to see it." }] }
    ]);
  }

  return {
    demo: true,
    init(cb) {
      onUser = cb;
      let u = null; try { u = JSON.parse(localStorage.getItem(UKEY)); } catch {}
      setTimeout(() => onUser(u), 300);
    },
    async signIn() { throw { code: "demo" }; },
    signInAs(role) { const u = people[role]; localStorage.setItem(UKEY, JSON.stringify(u)); onUser(u); },
    async signOut() { localStorage.removeItem(UKEY); onUser(null); },
    async reset() { throw { code: "demo" }; },
    async create(t) {
      const id = Math.random().toString(36).slice(2, 10);
      const now = Date.now();
      save([{ ...t, id, createdAt: now, updatedAt: now }, ...load()]);
      return id;
    },
    watch(scope, user, cb) {
      const fn = () => cb(scope === "all" ? load() : load().filter((t) => t.createdBy?.uid === user.uid));
      listeners.add(fn); fn();
      return () => listeners.delete(fn);
    },
    async update(id, patch, entry) {
      save(load().map((t) => t.id === id ? { ...t, ...patch, updatedAt: Date.now(), history: [...(t.history || []), entry] } : t));
    },
    async putChunk(ticketId, chunkId, data) {
      const files = loadFiles();
      files[ticketId + "/" + chunkId] = data;
      try { localStorage.setItem(FKEY, JSON.stringify(files)); }
      catch { throw { code: "demo-quota" }; }
    },
    async getChunk(ticketId, chunkId) {
      const d = loadFiles()[ticketId + "/" + chunkId];
      if (d == null) throw { code: "not-found" };
      return d;
    },
    async setEmailStatus(id, emailStatus) {
      save(load().map((t) => t.id === id ? { ...t, emailStatus } : t));
    },
    async getPrefs(uid) { try { return JSON.parse(localStorage.getItem("hra_prefs_" + uid)) || {}; } catch { return {}; } },
    // Candidate tech checks (demo)
    watchTech(cb) {
      if (!localStorage.getItem("hra_demo_tech")) {
        const mk = (n, e, p, down, up, ping, os, w, cb2, cpu, ram, res, band, days, loc) => ({ id: "t" + Math.random().toString(36).slice(2, 8), v: 1, name: n, email: e, position: p, down, up, ping, jitter: 4, loc, colo: "", os, win11: w, chromebook: cb2, browser: "Chrome", cores: 8, mem: 8, cpu, ram, band, result: res, ua: "", createdAt: new Date(Date.now() - days * 86400e3).toISOString() });
        localStorage.setItem("hra_demo_tech", JSON.stringify([
          mk("Maria Fernanda Ruiz", "mf.ruiz@gmail.com", "Recruiter", 92.4, 41.2, 18, "Windows 11", "yes", false, "i5-14", "16", "pass", "Excellent", 0.2, "MX"),
          mk("Kevin Otieno", "kotieno@outlook.com", "Sourcer · Holly", 18.7, 6.3, 64, "Windows 11", "yes", false, "i7-14", "16", "fail", "Below minimum", 1, "KE"),
          mk("Ana Lucía Torres", "analucia.t@gmail.com", "Recruiter", 35.1, 17.9, 33, "Windows 10 or 11", "unknown", false, "unsure", "16", "review", "Good", 2, "CO"),
          mk("Joseph Mensah", "jmensah@yahoo.com", "Admin assistant", 54.0, 22.5, 41, "ChromeOS (Chromebook)", "no", true, "other", "8", "fail", "Excellent", 4, "GH")
        ]));
      }
      const fn = (e) => { if (!e || e.key === "hra_demo_tech") cb(JSON.parse(localStorage.getItem("hra_demo_tech") || "[]")); };
      addEventListener("storage", fn); setTimeout(() => fn(), 0); return () => removeEventListener("storage", fn);
    },
    async deleteTech(id) { const a = JSON.parse(localStorage.getItem("hra_demo_tech") || "[]").filter((x) => x.id !== id); localStorage.setItem("hra_demo_tech", JSON.stringify(a)); dispatchEvent(new StorageEvent("storage", { key: "hra_demo_tech" })); },
    // Open jobs report (demo)
    async getJobsReport() {
      const jobs = (PL.clients || []).flatMap((c, ci) => [...new Set((c.candidates || []).map((r) => r.role))].slice(0, 3).map((t, i) => {
        const rows = (c.candidates || []).filter((r) => r.role === t);
        return { shortcode: `D${ci}${i}`, title: t, client: c.name, location: c.location || "", opened: new Date(Date.now() - (20 + ci * 9 + i * 13) * 86400e3).toISOString(), url: "",
          applicants: rows.length * 6, submitted: rows.length, inProcess: rows.filter((r) => r.status === "in_process").length, interviews: rows.filter((r) => r.interviewAt).length, hires: rows.filter((r) => r.status === "hired").length, lastSubmitted: rows.map((r) => r.submitted).sort().pop() || "" };
      }));
      return { jobs, updatedAt: new Date().toISOString(), fresh: true };
    },
    // Team notes (demo)
    async addTeamNote(clientId, candId, note) { const key = "hra_demo_edits_" + clientId; const d = JSON.parse(localStorage.getItem(key) || "{}"); d.notes = d.notes || {}; (d.notes[candId] = d.notes[candId] || []).push(note); localStorage.setItem(key, JSON.stringify(d)); dispatchEvent(new StorageEvent("storage", { key })); },
    async removeTeamNote(clientId, candId, note) { const key = "hra_demo_edits_" + clientId; const d = JSON.parse(localStorage.getItem(key) || "{}"); d.notes = d.notes || {}; d.notes[candId] = (d.notes[candId] || []).filter((n) => !(n.at === note.at && n.byUid === note.byUid)); localStorage.setItem(key, JSON.stringify(d)); dispatchEvent(new StorageEvent("storage", { key })); },
    // Manual start dates (demo)
    async getEdits(clientId) { try { return JSON.parse(localStorage.getItem("hra_demo_edits_" + clientId)) || {}; } catch { return {}; } },
    watchEdits(clientId, cb) {
      const key = "hra_demo_edits_" + clientId;
      const fn = (e) => { if (!e || e.key === key) { try { cb(JSON.parse(localStorage.getItem(key)) || {}); } catch { cb({}); } } };
      addEventListener("storage", fn); setTimeout(() => fn(), 0); return () => removeEventListener("storage", fn);
    },
    async saveStart(clientId, candId, date, by) {
      const key = "hra_demo_edits_" + clientId; const d = JSON.parse(localStorage.getItem(key) || "{}"); d.starts = d.starts || {};
      if (date) d.starts[candId] = { startDate: date, by, at: new Date().toISOString() }; else delete d.starts[candId];
      localStorage.setItem(key, JSON.stringify(d)); dispatchEvent(new StorageEvent("storage", { key }));
    },
    // Org chart (demo)
    watchOrg(cb) {
      const fn = (e) => { if (!e || e.key === "hra_demo_org") { try { cb(JSON.parse(localStorage.getItem("hra_demo_org")) || null); } catch { cb(null); } } };
      addEventListener("storage", fn); setTimeout(() => fn(), 0);
      return () => removeEventListener("storage", fn);
    },
    async saveOrg(data) { localStorage.setItem("hra_demo_org", JSON.stringify(data)); dispatchEvent(new StorageEvent("storage", { key: "hra_demo_org" })); },
    // Settings (demo)
    watchSettings(cb) {
      const read = () => { try { return JSON.parse(localStorage.getItem("hra_demo_settings")) || {}; } catch { return {}; } };
      const fn = (e) => { if (!e || e.key === "hra_demo_settings") cb(read()); };
      addEventListener("storage", fn); setListeners.add(fn); setTimeout(() => fn(), 0);
      return () => { removeEventListener("storage", fn); setListeners.delete(fn); };
    },
    async saveSettings(data) {
      const cur = JSON.parse(localStorage.getItem("hra_demo_settings") || "{}");
      localStorage.setItem("hra_demo_settings", JSON.stringify({ ...cur, ...data, tools: { ...(cur.tools || {}), ...(data.tools || {}) } }));
      setListeners.forEach((fn) => fn());
    },
    // Profiles (demo)
    watchProfiles(cb) {
      const read = () => { try { return JSON.parse(localStorage.getItem("hra_demo_profiles")) || {}; } catch { return {}; } };
      const fn = (e) => { if (!e || e.key === "hra_demo_profiles") cb(Object.entries(read()).map(([uid, d]) => ({ uid, ...d }))); };
      addEventListener("storage", fn); profListeners.add(fn); setTimeout(() => fn(), 0);
      return () => { removeEventListener("storage", fn); profListeners.delete(fn); };
    },
    async saveProfile(uid, data) {
      const all = JSON.parse(localStorage.getItem("hra_demo_profiles") || "{}");
      all[uid] = { ...(all[uid] || {}), ...data };
      try { localStorage.setItem("hra_demo_profiles", JSON.stringify(all)); } catch { throw { code: "demo-quota" }; }
      profListeners.forEach((fn) => fn());
    },
    // Training (demo: shared between tabs of this browser)
    watchTraining(uid, all, cb) {
      const read = () => { try { return JSON.parse(localStorage.getItem("hra_demo_training_v1")) || null; } catch { return null; } };
      if (!read()) localStorage.setItem("hra_demo_training_v1", JSON.stringify(seedTraining()));
      const emit = () => { const d = read() || { progress: {}, notes: [] }; cb(all ? Object.values(d.progress) : (d.progress[uid] ? [d.progress[uid]] : []), all ? d.notes : d.notes.filter((n) => n.traineeUid === uid)); };
      const fn = (e) => { if (!e || e.key === "hra_demo_training_v1") emit(); };
      addEventListener("storage", fn); trListeners.add(fn); setTimeout(emit, 0);
      return () => { removeEventListener("storage", fn); trListeners.delete(fn); };
    },
    async saveProgress(uid, data) {
      const d = JSON.parse(localStorage.getItem("hra_demo_training_v1")) || { progress: {}, notes: [] };
      const cur = d.progress[uid] || {};
      const courses = { ...(cur.courses || {}) };
      for (const [k, v] of Object.entries(data.courses || {})) courses[k] = { ...(courses[k] || {}), ...v, done: { ...(courses[k]?.done || {}), ...(v.done || {}) }, quiz: { ...(courses[k]?.quiz || {}), ...(v.quiz || {}) }, watched: { ...(courses[k]?.watched || {}), ...(v.watched || {}) } };
      d.progress[uid] = { ...cur, ...data, courses };
      localStorage.setItem("hra_demo_training_v1", JSON.stringify(d)); trListeners.forEach((fn) => fn());
    },
    watchPrivate(uid, cb) {
      const key = "hra_demo_trprivate_" + uid;
      const emit = () => { try { cb(JSON.parse(localStorage.getItem(key)) || {}); } catch { cb({}); } };
      const fn = (e) => { if (!e || e.key === key) emit(); };
      addEventListener("storage", fn); setTimeout(emit, 0);
      return () => removeEventListener("storage", fn);
    },
    async savePrivateNote(uid, courseId, stepId, text) {
      const key = "hra_demo_trprivate_" + uid;
      const d = JSON.parse(localStorage.getItem(key)) || {};
      d.notes = d.notes || {}; d.notes[courseId] = d.notes[courseId] || {};
      if (text) d.notes[courseId][stepId] = { text, at: new Date().toISOString() }; else delete d.notes[courseId][stepId];
      localStorage.setItem(key, JSON.stringify(d));
    },
    async addNote(n) {
      const d = JSON.parse(localStorage.getItem("hra_demo_training_v1")) || { progress: {}, notes: [] };
      d.notes.unshift({ ...n, id: Math.random().toString(36).slice(2, 10) });
      localStorage.setItem("hra_demo_training_v1", JSON.stringify(d)); trListeners.forEach((fn) => fn());
    },
    async deleteProgress(uid) {
      const d = JSON.parse(localStorage.getItem("hra_demo_training_v1")) || { progress: {}, notes: [] };
      delete d.progress[uid]; localStorage.setItem("hra_demo_training_v1", JSON.stringify(d)); trListeners.forEach((fn) => fn());
    },
    async deleteNote(id) {
      const d = JSON.parse(localStorage.getItem("hra_demo_training_v1")) || { progress: {}, notes: [] };
      d.notes = d.notes.filter((n) => n.id !== id); localStorage.setItem("hra_demo_training_v1", JSON.stringify(d)); trListeners.forEach((fn) => fn());
    },
    async deletePrivate(uid) { localStorage.removeItem("hra_demo_trprivate_" + uid); dispatchEvent(new StorageEvent("storage", { key: "hra_demo_trprivate_" + uid })); },
    watchOpenQuestions(cb) {
      const emit = () => { const d = JSON.parse(localStorage.getItem("hra_demo_training_v1") || "null") || { notes: [] }; cb(d.notes.filter((n) => n.status === "open")); };
      const fn = (e) => { if (!e || e.key === "hra_demo_training_v1") emit(); };
      addEventListener("storage", fn); trListeners.add(fn); setTimeout(emit, 0);
      return () => { removeEventListener("storage", fn); trListeners.delete(fn); };
    },
    async replyNote(id, reply, patch) {
      const d = JSON.parse(localStorage.getItem("hra_demo_training_v1")) || { progress: {}, notes: [] };
      d.notes = d.notes.map((n) => n.id === id ? { ...n, ...patch, replies: [...(n.replies || []), reply] } : n);
      localStorage.setItem("hra_demo_training_v1", JSON.stringify(d)); trListeners.forEach((fn) => fn());
    },
    // All-employees alert (demo: shared between tabs of this browser)
    watchBroadcast(cb) {
      const read = () => { try { return JSON.parse(localStorage.getItem("hra_demo_broadcast")) || null; } catch { return null; } };
      const fn = (e) => { if (!e || e.key === "hra_demo_broadcast") cb(read()); };
      addEventListener("storage", fn); bcListeners.add(fn); setTimeout(() => cb(read()), 0);
      return () => { removeEventListener("storage", fn); bcListeners.delete(fn); };
    },
    async setBroadcast(data) { localStorage.setItem("hra_demo_broadcast", JSON.stringify(data)); bcListeners.forEach((fn) => fn()); },
    watchAlertLog(cb) {
      const read = () => { try { return JSON.parse(localStorage.getItem("hra_demo_alert_log")) || []; } catch { return []; } };
      if (!localStorage.getItem("hra_demo_alert_log")) {
        const d = (h) => new Date(Date.now() - h * 3600e3).toISOString();
        localStorage.setItem("hra_demo_alert_log", JSON.stringify([
          { id: "seed-fest", active: false, level: "festive", title: "Shout-out to Jen Omohundro for 5 hires this month! 🎉", message: "Amazing work Jen. Thank you for everything you do for our clients.", startedAt: d(26), endsAt: d(22), by: "Juan Rochin", byUid: "demo-admin" },
          { id: "seed-maint", active: false, level: "warning", title: "Scheduled maintenance tonight", message: "Workable may be unavailable from 9 to 10 PM. Save your work.", startedAt: d(74), endsAt: d(73), by: "Juan Rochin", byUid: "demo-admin" }
        ]));
      }
      const fn = (e) => { if (!e || e.key === "hra_demo_alert_log") cb(read()); };
      addEventListener("storage", fn); logListeners.add(fn); setTimeout(() => cb(read()), 0);
      return () => { removeEventListener("storage", fn); logListeners.delete(fn); };
    },
    async logAlert(a) {
      let list = []; try { list = JSON.parse(localStorage.getItem("hra_demo_alert_log")) || []; } catch {}
      const i = list.findIndex((x) => x.id === a.id);
      if (i >= 0) list[i] = { ...list[i], ...a }; else list.unshift(a);
      localStorage.setItem("hra_demo_alert_log", JSON.stringify(list.slice(0, 50))); logListeners.forEach((fn) => fn());
    },
    async setPrefs(uid, data) { const cur = await this.getPrefs(uid); localStorage.setItem("hra_prefs_" + uid, JSON.stringify({ ...cur, ...data })); },
    async addAttachments(id, metas) {
      save(load().map((t) => t.id === id ? { ...t, attachments: [...(t.attachments || []), ...metas], updatedAt: Date.now() } : t));
    },
    async remove(t) {
      const files = loadFiles();
      Object.keys(files).forEach((k) => { if (k.startsWith(t.id + "/")) delete files[k]; });
      try { localStorage.setItem(FKEY, JSON.stringify(files)); } catch {}
      save(load().filter((x) => x.id !== t.id));
    }
  };
}

async function createFirebaseStore() {
  const V = "10.12.2", base = `https://www.gstatic.com/firebasejs/${V}/`;
  const [appMod, authMod, fsMod] = await Promise.all([
    import(base + "firebase-app.js"),
    import(base + "firebase-auth.js"),
    import(base + "firebase-firestore.js")
  ]);
  const app = appMod.initializeApp(CFG.firebase);
  const auth = authMod.getAuth(app);
  // Offline persistence: the browser keeps a local copy, so reloads/returns within 30 minutes only pay for
  // documents that changed (Firestore billing). Shared across tabs. Falls back to normal mode if unavailable.
  let db;
  try { db = fsMod.initializeFirestore(app, { localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }) }); }
  catch (e) { console.warn("Offline persistence unavailable, using normal mode", e); db = fsMod.getFirestore(app); }
  const col = fsMod.collection(db, "tickets");

  return {
    demo: false,
    init(cb) {
      authMod.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: lower(u.email), name: u.displayName || nameFromEmail(u.email) } : null));
    },
    signIn: (email, pw) => authMod.signInWithEmailAndPassword(auth, email, pw),
    // Sign out also erases the local copy of the data from this browser (it contains candidate information).
    signOut: async () => {
      await authMod.signOut(auth);
      try { await fsMod.terminate(db); await fsMod.clearIndexedDbPersistence(db); } catch (e) { console.warn("Local cache not cleared (another tab may be open)", e); }
      location.reload();
    },
    reset: (email) => authMod.sendPasswordResetEmail(auth, email),
    async create(t) {
      const r = await fsMod.addDoc(col, { ...t, createdAt: fsMod.serverTimestamp(), updatedAt: fsMod.serverTimestamp() });
      return r.id;
    },
    watch(scope, user, cb) {
      const q = scope === "all" ? col : fsMod.query(col, fsMod.where("createdBy.uid", "==", user.uid));
      return fsMod.onSnapshot(q,
        (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => {
          console.error(err);
          toast(err.code === "permission-denied"
            ? "This account can't read requests. Check the access lists in firestore.rules."
            : "Couldn't load requests. Check your connection and refresh.", "#E2632B");
        });
    },
    update(id, patch, entry) {
      return fsMod.updateDoc(fsMod.doc(db, "tickets", id), { ...patch, updatedAt: fsMod.serverTimestamp(), history: fsMod.arrayUnion(entry) });
    },
    // Files live in tickets/{id}/chunks as base64 pieces, so no Cloud Storage (or billing) is needed.
    putChunk(ticketId, chunkId, data) {
      return fsMod.setDoc(fsMod.doc(db, "tickets", ticketId, "chunks", chunkId), { data });
    },
    async getChunk(ticketId, chunkId) {
      const snap = await fsMod.getDoc(fsMod.doc(db, "tickets", ticketId, "chunks", chunkId));
      if (!snap.exists()) throw { code: "not-found" };
      return snap.data().data;
    },
    watchTraining(uid, all, cb) {
      let progress = [], notes = [];
      const pq = all ? fsMod.collection(db, "training_progress") : fsMod.doc(db, "training_progress", uid);
      const u1 = all
        ? fsMod.onSnapshot(pq, (s) => { progress = s.docs.map((d) => ({ uid: d.id, ...d.data() })); cb(progress, notes); }, (e) => trDbError(e, "load"))
        : fsMod.onSnapshot(pq, (s) => { progress = s.exists() ? [{ uid: s.id, ...s.data() }] : []; cb(progress, notes); }, (e) => trDbError(e, "load"));
      const nq = all ? fsMod.collection(db, "training_notes") : fsMod.query(fsMod.collection(db, "training_notes"), fsMod.where("traineeUid", "==", uid));
      const u2 = fsMod.onSnapshot(nq, (s) => { notes = s.docs.map((d) => ({ id: d.id, ...d.data() })); cb(progress, notes); }, (e) => trDbError(e, "questions"));
      return () => { u1(); u2(); };
    },
    saveProgress(uid, data) { return fsMod.setDoc(fsMod.doc(db, "training_progress", uid), data, { merge: true }); },
    watchPrivate(uid, cb) { return fsMod.onSnapshot(fsMod.doc(db, "training_private", uid), (s) => cb(s.exists() ? s.data() : {}), (e) => trDbError(e, "notes")); },
    savePrivateNote(uid, courseId, stepId, text) {
      const ref = fsMod.doc(db, "training_private", uid);
      if (text) return fsMod.setDoc(ref, { notes: { [courseId]: { [stepId]: { text, at: new Date().toISOString() } } } }, { merge: true });
      return fsMod.setDoc(ref, { notes: { [courseId]: { [stepId]: fsMod.deleteField() } } }, { merge: true });
    },
    addNote(n) { return fsMod.addDoc(fsMod.collection(db, "training_notes"), n); },
    deleteProgress(uid) { return fsMod.deleteDoc(fsMod.doc(db, "training_progress", uid)); },
    deleteNote(id) { return fsMod.deleteDoc(fsMod.doc(db, "training_notes", id)); },
    deletePrivate(uid) { return fsMod.deleteDoc(fsMod.doc(db, "training_private", uid)); },
    watchOpenQuestions(cb) {
      const q = fsMod.query(fsMod.collection(db, "training_notes"), fsMod.where("status", "==", "open"));
      return fsMod.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => trDbError(e, "questions"));
    },
    replyNote(id, reply, patch) { return fsMod.updateDoc(fsMod.doc(db, "training_notes", id), { ...patch, replies: fsMod.arrayUnion(reply) }); },
    addTeamNote(clientId, candId, note) { return fsMod.setDoc(fsMod.doc(db, "pipeline_edits", clientId), { notes: { [candId]: fsMod.arrayUnion(note) }, updatedAt: new Date().toISOString() }, { merge: true }); },
    removeTeamNote(clientId, candId, note) { return fsMod.setDoc(fsMod.doc(db, "pipeline_edits", clientId), { notes: { [candId]: fsMod.arrayRemove(note) }, updatedAt: new Date().toISOString() }, { merge: true }); },
    watchTech(cb) { return fsMod.onSnapshot(fsMod.query(fsMod.collection(db, "techchecks"), fsMod.orderBy("createdAt", "desc"), fsMod.limit(300)), (q) => cb(q.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.()?.toISOString() || "" }))), (e) => { console.warn("Tech checks unavailable", e); cb([], e); }); },
    deleteTech(id) { return fsMod.deleteDoc(fsMod.doc(db, "techchecks", id)); },
    async getJobsReport() { const d = await fsMod.getDoc(fsMod.doc(db, "workable_meta", "jobs")); return d.exists() ? d.data() : null; },
    async getEdits(clientId) { const d = await fsMod.getDoc(fsMod.doc(db, "pipeline_edits", clientId)); return d.exists() ? d.data() : {}; },
    watchEdits(clientId, cb) { return fsMod.onSnapshot(fsMod.doc(db, "pipeline_edits", clientId), (d) => cb(d.exists() ? d.data() : {}), (e) => { console.warn("Start dates unavailable", e); cb({}); }); },
    saveStart(clientId, candId, date, by) { return fsMod.setDoc(fsMod.doc(db, "pipeline_edits", clientId), { starts: { [candId]: date ? { startDate: date, by, at: new Date().toISOString() } : fsMod.deleteField() }, updatedAt: new Date().toISOString() }, { merge: true }); },
    watchOrg(cb) { return fsMod.onSnapshot(fsMod.doc(db, "org", "chart"), (d) => cb(d.exists() ? d.data() : null), (e) => { console.warn("Org chart unavailable", e); cb(null, e); }); },
    saveOrg(data) { return fsMod.setDoc(fsMod.doc(db, "org", "chart"), data); },
    watchSettings(cb) {
      return fsMod.onSnapshot(fsMod.doc(db, "settings", "tools"), (s) => cb(s.exists() ? s.data() : {}), (e) => console.warn("Settings unavailable", e));
    },
    saveSettings(data) { return fsMod.setDoc(fsMod.doc(db, "settings", "tools"), data, { merge: true }); },
    watchProfiles(cb) {
      return fsMod.onSnapshot(fsMod.collection(db, "profiles"), (s) => cb(s.docs.map((d) => ({ uid: d.id, ...d.data() }))), (e) => console.warn("Profiles unavailable", e));
    },
    saveProfile(uid, data) { return fsMod.setDoc(fsMod.doc(db, "profiles", uid), data, { merge: true }); },
    watchBroadcast(cb) {
      return fsMod.onSnapshot(fsMod.doc(db, "broadcast", "current"), (snap) => cb(snap.exists() ? snap.data() : null), (e) => console.warn("Alerts unavailable", e));
    },
    setBroadcast(data) { return fsMod.setDoc(fsMod.doc(db, "broadcast", "current"), data); },
    watchAlertLog(cb) {
      const q = fsMod.query(fsMod.collection(db, "broadcast_log"), fsMod.orderBy("startedAt", "desc"), fsMod.limit(30));
      return fsMod.onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data())), (e) => console.warn("Alert history unavailable", e));
    },
    logAlert(a) { return fsMod.setDoc(fsMod.doc(db, "broadcast_log", a.id), a, { merge: true }); },
    async getPrefs(uid) {
      const snap = await fsMod.getDoc(fsMod.doc(db, "user_prefs", uid));
      return snap.exists() ? snap.data() : {};
    },
    setPrefs(uid, data) {
      return fsMod.setDoc(fsMod.doc(db, "user_prefs", uid), data, { merge: true });
    },
    async getPipelineOnce() {
      const [cs, ms] = await Promise.all([fsMod.getDocs(fsMod.collection(db, "workable_clients")), fsMod.getDoc(fsMod.doc(db, "workable_meta", "status"))]);
      return { clients: mergeClientParts(cs.docs.map((d) => ({ id: d.id, ...d.data() }))), meta: ms.exists() ? ms.data() : null };
    },
    watchPipeline(cb) {
      let clients = [], meta = null;
      const u1 = fsMod.onSnapshot(fsMod.collection(db, "workable_clients"),
        (snap) => { clients = mergeClientParts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); cb(clients, meta); },
        (err) => { console.error(err); cb(clients, { error: err.code }); });
      const u2 = fsMod.onSnapshot(fsMod.doc(db, "workable_meta", "status"),
        (snap) => { meta = snap.exists() ? snap.data() : null; cb(clients, meta); }, () => {});
      return () => { u1(); u2(); };
    },
    setEmailStatus(id, emailStatus) {
      return fsMod.updateDoc(fsMod.doc(db, "tickets", id), { emailStatus, updatedAt: fsMod.serverTimestamp() });
    },
    addAttachments(id, metas) {
      return fsMod.updateDoc(fsMod.doc(db, "tickets", id), { attachments: fsMod.arrayUnion(...metas), updatedAt: fsMod.serverTimestamp() });
    },
    async remove(t) {
      const ids = (t.attachments || []).flatMap((a) => Array.from({ length: a.chunks || 0 }, (_, n) => `${a.id}_${n}`));
      for (let i = 0; i < ids.length; i += 400) {
        const b = fsMod.writeBatch(db);
        ids.slice(i, i + 400).forEach((c) => b.delete(fsMod.doc(db, "tickets", t.id, "chunks", c)));
        await b.commit();
      }
      await fsMod.deleteDoc(fsMod.doc(db, "tickets", t.id));
    }
  };
}

/* --------------------------------------------------------------------------
   State
   -------------------------------------------------------------------------- */
const state = {
  store: null,
  user: null,
  isAdmin: false,
  tickets: [],
  loaded: false,
  tab: "mine",
  mineFilter: "active",
  search: "",
  openId: null,
  known: new Map(),   // id -> status, for live change notifications
  unsub: null
};

const mine = () => state.tickets.filter((t) => t.createdBy?.uid === state.user.uid);

/* --------------------------------------------------------------------------
   Views
   -------------------------------------------------------------------------- */
function showView(id) {
  $$(".view").forEach((v) => { v.hidden = v.id !== id; v.classList.remove("is-entering"); });
  const view = $("#" + id);
  const targets = id === "view-app"
    ? $$(".panel.is-active > *, .topbar-inner > *", view)
    : $$(".login-card > *", view);
  targets.forEach((el, i) => { el.classList.add("reveal"); el.style.setProperty("--d", i); });
  void view.offsetWidth;
  view.classList.add("is-entering");
  document.body.classList.toggle("has-app", id === "view-app");
  setTimeout(() => view.classList.remove("is-entering"), 1400);
  requestAnimationFrame(() => $$(".tabs, .seg").forEach(moveIndicator));
}

function hideBoot() {
  const b = $("#boot");
  if (b && !b.classList.contains("is-done")) { b.classList.add("is-done"); setTimeout(() => b.remove(), 700); }
}

/* --------------------------------------------------------------------------
   Auth flow
   -------------------------------------------------------------------------- */
function handleUser(u) {
  if (typeof CT !== "undefined") Object.assign(CT, { built: false, q: "", cat: "", open: null });
  const ctRoot = document.getElementById("contacts-root"); if (ctRoot) ctRoot.innerHTML = "";
  if (state.unsub) { state.unsub(); state.unsub = null; }
  closeAll(true);
  state.tickets = []; state.loaded = false; state.known.clear();

  if (!u) {
    ORG.unsub?.(); Object.assign(ORG, { unsub: null, data: null, started: false });
    stopSettings();
    stopProfiles();
    stopTraining();
    stopHelper();
    stopAlerts();
    stopPipeline();
    state.user = null;
    showView("view-login");
    hideBoot();
    return;
  }

  const email = lower(u.email);
  const isAdmin = u.role ? u.role === "admin" : ADMINS.includes(email);
  const isMember = isAdmin || (u.role ? true : MEMBERS.includes(email));

  if (!isMember) {
    $("#denied-email").textContent = email;
    showView("view-denied");
    hideBoot();
    return;
  }

  state.user = { uid: u.uid, email, name: u.name || nameFromEmail(email) };
  state.isAdmin = isAdmin;
  state.isSuper = isAdmin && SUPERS.includes(email);
  state.tab = "mine";

  state.user.baseName = state.user.name;
  refreshUserUI();
  buildBoards();
  startProfiles();

  setTab("mine", true);
  stopPipeline();
  renderTypes();
  renderAll();
  showView("view-app");
  $('[data-tool="insights"]').hidden = !isAdmin;
  $('[data-tool="org"]').hidden = !isAdmin;
  $("#alert-btn").hidden = !isAdmin;
  $("#user-role").textContent = state.isSuper ? "Super admin" : isAdmin ? "Admin" : "Team member";
  startSettings();
  startAlerts();
  startHelper();
  startTraining();
  const sp = $("#rail-sharepoint");
  if (sp) { sp.href = CFG.links?.sharepoint || "#"; sp.hidden = !CFG.links?.sharepoint; }
  let savedTool = "requests";
  try { savedTool = localStorage.getItem(TOOL_KEY) || "requests"; } catch {}
  setTool(savedTool, true);
  hideBoot();

  state.unsub = state.store.watch(isAdmin ? "all" : "mine", state.user, onTickets);
}

function onTickets(list) {
  const first = !state.loaded;
  list.sort((a, b) => toDate(b.createdAt) - toDate(a.createdAt));

  if (!first) {
    for (const t of list) {
      const prev = state.known.get(t.id);
      if (prev === undefined && state.isAdmin && t.createdBy?.uid !== state.user.uid) {
        notify({ kind: "ticket", title: "New request", body: `${t.createdBy?.name || "A colleague"}: ${t.title}`, action: () => { setTool("requests"); openTicket(t.id); } });
        flashIds.add(t.id);
      } else if (prev && prev !== t.status && t.createdBy?.uid === state.user.uid && t.assignee?.email !== state.user.email) {
        if (t.status === "completed") notify({ kind: "done", title: "Request completed", body: `${ref(t.id)}: ${t.title}`, action: () => { setTool("requests"); openTicket(t.id); } });
        else toast(`${ref(t.id)} is now ${STATUS[t.status].label.toLowerCase()}`, STATUS[t.status].color);
        flashIds.add(t.id);
      }
    }
  }
  state.known = new Map(list.map((t) => [t.id, t.status]));
  state.tickets = list;
  setTimeout(refreshBell, 0);
  if (currentTool === "super") setTimeout(renderSuper, 0);
  state.loaded = true;
  if (first) {
    const m = location.hash.match(/^#r-([A-Za-z0-9]+)$/);
    if (m && list.some((t) => t.id === m[1])) setTimeout(() => openTicket(m[1]), 250);
  }
  renderAll();
  if (state.openId) renderDrawer();
}
const flashIds = new Set();

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */
const GROUPS = CFG.groups || {};
const canUseType = (t) => t && (!t.adminOnly || state.isAdmin);
function typeLabel(key) {
  const t = CFG.requestTypes[key];
  if (!t) return "Request";
  const g = t.group && GROUPS[t.group];
  return g ? `${g.label}: ${t.short || t.label}` : t.label;
}

function typeOptions() {
  const tiles = [], seen = new Set();
  for (const [key, t] of Object.entries(CFG.requestTypes)) {
    if (!canUseType(t)) continue;
    const g = t.group && GROUPS[t.group];
    if (g) {
      if (seen.has(t.group)) continue;
      seen.add(t.group);
      tiles.push({ open: "group:" + t.group, icon: g.icon, label: g.label, blurb: g.blurb });
    } else tiles.push({ open: key, icon: t.icon, label: t.label, blurb: t.blurb });
  }
  return tiles;
}
function renderTypes() {
  const tiles = typeOptions();
  $("#type-tiles").innerHTML = `
    <button type="button" class="create-cta" data-new="picker">
      <span class="create-cta-shine" aria-hidden="true"></span>
      <span class="create-cta-plus" aria-hidden="true">${ICONS.plus}</span>
      <span class="create-cta-text"><strong>Create a ticket</strong><small>Phone queues, access, QuickBooks, Indeed credits or anything else</small></span>
      <span class="create-cta-icons" aria-hidden="true">${tiles.slice(0, 5).map((t, i) => `<i style="--i:${i}">${ICONS[t.icon] || ICONS.spark}</i>`).join("")}</span>
    </button>`;
}
function openPicker(dir) {
  const tiles = typeOptions();
  pending.length = 0;
  swapModal(`
    <div class="tkp">
      <div class="tkp-head"><h2 id="modal-title">What do you need?</h2><p>Choose one to get started.</p></div>
      <div class="tkp-grid" role="list">
        ${tiles.map((t, i) => `<button type="button" class="tkp-opt" data-new="${esc(t.open)}" role="listitem" style="--i:${i}">
          <span class="tkp-ico">${ICONS[t.icon] || ICONS.spark}</span>
          <span class="tkp-text"><strong>${esc(t.label)}</strong><small>${esc(t.blurb)}</small></span>
          <span class="tkp-go" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>
        </button>`).join("")}
      </div>
    </div>`, dir);
  $("#modal")?.classList.add("is-picker");
  setTimeout(() => $(".tkp-opt")?.focus({ preventScroll: true }), 320);
}
const backToPicker = `<button type="button" class="back-link" data-new="picker" data-dir="back"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>All request types</button>`;

function track(status) {
  const n = STATUS[status]?.n ?? 0;
  const nodes = [0, 1, 2].map((i) => `<span class="node ${i <= n ? "is-on" : ""} ${i === n && n < 2 ? "is-now" : ""}" data-n="${i}"></span>`).join("");
  const labels = Object.values(STATUS).map((s, i) => `<span class="${i === n ? "is-now" : ""}">${s.label}</span>`).join("");
  return `<div class="track" data-status="${status}" style="--p:${n / 2}">
    <div class="track-line"><span class="track-fill"></span>${nodes}</div>
    <div class="track-labels">${labels}</div>
  </div>`;
}

function row(t, i, adminView) {
  const type = CFG.requestTypes[t.type];
  const urgent = t.fields?.priority === "Urgent" && t.status !== "completed";
  const meta = [
    `<span class="t-ref">${ref(t.id)}</span>`,
    `<span>${esc(typeLabel(t.type))}</span>`,
    adminView ? `<span>${ICONS.user}${esc(t.createdBy?.name || "")}</span>` : "",
    `<span>${ICONS.clock}${ago(t.createdAt)}</span>`,
    t.attachments?.length ? `<span>${ICONS.clip}${t.attachments.length} file${t.attachments.length > 1 ? "s" : ""}</span>` : "",
    t.assignee && t.status !== "open" ? `<span>Handled by ${esc(t.assignee.name)}</span>` : "",
    urgent ? `<span class="t-urgent">Urgent</span>` : ""
  ].join("");
  const flash = flashIds.has(t.id) ? " is-flash" : "";
  return `<li class="ticket${flash}" data-id="${esc(t.id)}" data-status="${t.status}" style="--i:${Math.min(i, 12)}" tabindex="0" role="button" aria-label="Open ${esc(t.title)}">
    <div class="t-main">
      <p class="t-title">${esc(t.title)}</p>
      <div class="t-meta">${meta}</div>
    </div>
    ${track(t.status)}
  </li>`;
}

function skeleton() {
  return Array.from({ length: 3 }, () => `<li class="skeleton"><span class="sk" style="width:55%"></span><span class="sk" style="width:32%"></span></li>`).join("");
}

function empty(title, text) {
  return `<li class="empty"><div class="empty-mark">${ICONS.inbox}</div><strong>${esc(title)}</strong>${esc(text)}</li>`;
}

function matchFilter(t, f) {
  if (f === "all") return true;
  if (f === "active") return t.status !== "completed";
  return t.status === f;
}

function renderMine() {
  const list = $("#mine-list");
  if (!state.loaded) { list.innerHTML = skeleton(); return; }
  const items = mine().filter((t) => matchFilter(t, state.mineFilter));
  list.innerHTML = items.length
    ? items.map((t, i) => row(t, i, false)).join("")
    : state.mineFilter === "completed"
      ? empty("Nothing completed yet", "Finished requests will show up here.")
      : empty("No open requests", "Select “Create a ticket” to send your first one.");
}

const PRI = { Urgent: 0, Soon: 1 };

/* Admin boards: the main queue plus one tab per "adminTab" in config.js */
function getBoards() {
  const tabs = {};
  for (const [key, t] of Object.entries(CFG.requestTypes)) {
    if (!t.adminTab) continue;
    const id = t.adminTab.id;
    tabs[id] ||= { id, label: t.adminTab.label, short: t.adminTab.short || t.adminTab.label, blurb: t.adminTab.blurb || "", types: [] };
    tabs[id].types.push(key);
  }
  const separate = Object.values(tabs).flatMap((b) => b.types);
  return [
    { id: "queue", label: "Admin queue", short: "Queue", blurb: "Take a request to show it's in progress, then complete it when it's done.", match: (t) => !separate.includes(t.type) },
    ...Object.values(tabs).map((b) => ({ ...b, match: (t) => b.types.includes(t.type) }))
  ];
}
let BOARDS = [];
const boardState = {};

function boardPanelHTML(b) {
  return `<div class="panel" data-panel="${b.id}">
    <div class="hero hero-compact">
      <h1 class="hero-title">${esc(b.id === "queue" ? "Admin queue" : b.label)}</h1>
      <p class="hero-sub">${esc(b.blurb)}</p>
    </div>
    <div class="meters">
      <button class="meter" data-filter="open"><span class="meter-num" data-count="open">0</span><span class="meter-label">Submitted</span><span class="meter-bar s-open"></span></button>
      <button class="meter" data-filter="in_progress"><span class="meter-num" data-count="in_progress">0</span><span class="meter-label">In progress</span><span class="meter-bar s-progress"></span></button>
      <button class="meter" data-filter="completed"><span class="meter-num" data-count="completed">0</span><span class="meter-label">Completed</span><span class="meter-bar s-done"></span></button>
    </div>
    <div class="section-head section-head-tools">
      <div class="seg" id="${b.id}-filter" role="tablist" aria-label="Filter ${esc(b.label)}">
        <button class="seg-btn is-active" data-filter="active">Active</button>
        <button class="seg-btn" data-filter="open">Submitted</button>
        <button class="seg-btn" data-filter="in_progress">In progress</button>
        <button class="seg-btn" data-filter="completed">Completed</button>
        <span class="seg-indicator" aria-hidden="true"></span>
      </div>
      <label class="search">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>
        <input type="search" data-board-search="${b.id}" placeholder="Search name, reference or text" aria-label="Search ${esc(b.label)}" />
      </label>
    </div>
    <ul class="tickets" id="${b.id}-list"></ul>
  </div>`;
}

function buildBoards() {
  $$("[data-board-tab]").forEach((el) => el.remove());
  $$(".panel[data-board]").forEach((el) => el.remove());
  BOARDS = state.isAdmin ? getBoards() : [];
  const ind = $("#tabs .tab-indicator");
  for (const b of BOARDS) {
    boardState[b.id] = { filter: "active", search: "", archive: false };
    ind.insertAdjacentHTML("beforebegin", `<button class="tab" data-tab="${b.id}" data-board-tab><span class="tab-long">${esc(b.label)}</span><span class="tab-short">${esc(b.short)}</span> <span class="tab-count is-zero" id="${b.id}-count">0</span></button>`);
    $(".main").insertAdjacentHTML("beforeend", boardPanelHTML(b));
    $(".main").lastElementChild.dataset.board = b.id;
  }
}

function renderBoard(b) {
  const st = boardState[b.id];
  const panel = $(`.panel[data-panel="${b.id}"]`);
  const all = state.tickets.filter(b.match);
  const archived = all.filter((t) => t.archived);
  const pool = all.filter((t) => !t.archived);
  const counts = { open: 0, in_progress: 0, completed: 0 };
  pool.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
  $$("[data-count]", panel).forEach((el) => countTo(el, counts[el.dataset.count]));

  const qc = $("#" + b.id + "-count");
  if (qc.textContent !== String(counts.open)) { qc.classList.remove("bump"); void qc.offsetWidth; qc.classList.add("bump"); }
  qc.textContent = counts.open;
  qc.classList.toggle("is-zero", counts.open === 0);

  const list = $("#" + b.id + "-list");
  if (!state.loaded) { list.innerHTML = skeleton(); return; }
  panel.classList.toggle("is-archive", st.archive);
  const link = $(".archive-link", panel) || (() => { list.insertAdjacentHTML("afterend", `<button type="button" class="archive-link" data-archive-view="${b.id}"></button>`); return $(".archive-link", panel); })();
  link.innerHTML = st.archive ? `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>Back to ${esc(b.id === "queue" ? "the queue" : b.label)}` : `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></svg>Archive${archived.length ? ` · ${archived.length}` : ""}`;
  link.hidden = !st.archive && !archived.length;
  const s = lower(st.search);
  const items = (st.archive ? archived : pool)
    .filter((t) => st.archive || matchFilter(t, st.filter))
    .filter((t) => !s || lower([ref(t.id), t.title, t.createdBy?.name, t.createdBy?.email, JSON.stringify(t.fields || {})].join(" ")).includes(s))
    .sort((a, b2) => {
      if (a.status !== "completed" && b2.status !== "completed") {
        const p = (PRI[a.fields?.priority] ?? 2) - (PRI[b2.fields?.priority] ?? 2);
        if (p) return p;
      }
      return toDate(b2.createdAt) - toDate(a.createdAt);
    });
  list.innerHTML = (st.archive ? `<li class="archive-banner"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></svg><span><strong>Archived requests</strong> Open one to restore it.</span></li>` : "") + (items.length
    ? items.map((t, i) => row(t, i, true)).join("")
    : st.archive ? empty("The archive is empty", "Archived requests will show up here.")
    : s ? empty("No matches", "Try a name, a reference like HRA-1A2B3C, or fewer words.")
        : empty(b.id === "queue" ? "The queue is clear" : `No ${b.label.toLowerCase()} requests`, "New requests appear here the moment they're sent."));
}

function renderQueue() {
  if (!state.isAdmin) return;
  BOARDS.forEach(renderBoard);
}

function renderAll() {
  renderMine();
  renderQueue();
  flashIds.clear();
}

function countTo(el, to) {
  const from = Number(el.textContent) || 0;
  if (from === to) return;
  if (reduceMotion) { el.textContent = to; return; }
  const start = performance.now(), dur = 700;
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* --------------------------------------------------------------------------
   Tabs & segmented controls
   -------------------------------------------------------------------------- */
function moveIndicator(group) {
  const active = $(".is-active", group), ind = $(".tab-indicator, .seg-indicator", group);
  if (!active || !ind || active.hidden) return;
  ind.style.width = active.offsetWidth + "px";
  ind.style.transform = `translateX(${active.offsetLeft}px)`;
}

function setTab(tab, silent) {
  state.tab = tab;
  $$(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
  $$(".panel").forEach((p) => p.classList.toggle("is-active", p.dataset.panel === tab));
  moveIndicator($("#tabs"));
  requestAnimationFrame(() => $$(".panel.is-active .seg").forEach(moveIndicator));
  if (!silent) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

function setSeg(groupId, filter) {
  const g = $("#" + groupId);
  $$(".seg-btn", g).forEach((b) => b.classList.toggle("is-active", b.dataset.filter === filter));
  moveIndicator(g);
  if (groupId === "mine-filter") { state.mineFilter = filter; renderMine(); }
  else {
    const id = groupId.replace(/-filter$/, "");
    if (boardState[id]) boardState[id].filter = filter;
    const b = BOARDS.find((x) => x.id === id);
    if (b) renderBoard(b);
  }
}

/* --------------------------------------------------------------------------
   Overlays
   -------------------------------------------------------------------------- */
let lastFocus = null;
function openOverlay(el) {
  lastFocus = document.activeElement;
  el.hidden = false;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-open")));
}
function closeOverlay(el, instant) {
  if (el.hidden) return;
  el.classList.remove("is-open");
  const done = () => { el.hidden = true; if ($$(".overlay:not([hidden])").length === 0) document.body.style.overflow = ""; };
  instant ? done() : setTimeout(done, 240);
  if (el.id === "drawer") state.openId = null;
  if (el.id === "tr-drawer") TRS.drawerUid = null;
  if (!instant && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
function closeAll(instant) { $$(".overlay").forEach((o) => closeOverlay(o, instant)); }

/* --------------------------------------------------------------------------
   New request
   -------------------------------------------------------------------------- */
const CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
const itemName = (it) => typeof it === "string" ? it : it.name;
const isDataField = (f) => f.type !== "heading";

function pickerHTML(f, i) {
  return `<div class="field picker" data-field="${f.name}" data-picker="${f.name}" style="--i:${i}">
    <button type="button" class="picker-head" aria-expanded="false" data-toggle-picker>
      <span class="picker-title">${esc(f.label)}</span>
      <span class="picker-count" hidden>0</span>
      <span class="picker-chev" aria-hidden="true">${CHEV}</span>
    </button>
    <div class="picker-body"><div class="picker-inner">
      <ul class="picker-rows"></ul>
      <div class="picker-add"></div>
    </div></div>
  </div>`;
}

function refreshPicker(wrap) {
  const f = findField(wrap.dataset.picker);
  const chosen = $$(".pick-row", wrap).map((r) => r.dataset.item);
  // Items with options can be added more than once (e.g. two license types); plain items only once.
  const left = f.items.filter((it) => typeof it === "object" || !chosen.includes(itemName(it)));
  $(".picker-add", wrap).innerHTML = left.length
    ? `<label class="pick-add"><span class="pick-plus" aria-hidden="true">${ICONS.plus.replace(/18/g, "14")}</span>
        <select class="pick-select" aria-label="${esc(f.addLabel || "Add")}">
          <option value="">${esc(f.addLabel || "Add an item")}</option>
          ${left.map((it) => `<option>${esc(itemName(it))}</option>`).join("")}
        </select></label>`
    : `<p class="pick-done">Everything in this section has been added.</p>`;
  const c = $(".picker-count", wrap);
  c.textContent = chosen.length;
  c.hidden = !chosen.length;
}

function addPick(wrap, name) {
  const f = findField(wrap.dataset.picker);
  const it = f.items.find((x) => itemName(x) === name);
  if (!it) return;
  const opts = typeof it === "object" && it.options;
  const li = document.createElement("li");
  li.className = "pick-row";
  li.dataset.item = name;
  li.innerHTML = `<span class="pick-name">${esc(name)}</span>
    ${opts ? `<select class="pick-value" aria-label="${esc(name)} option"><option value="">Choose an option</option>${opts.map((o) => `<option>${esc(o)}</option>`).join("")}</select>` : `<span class="pick-yes">Added</span>`}
    <button type="button" class="file-x" data-unpick aria-label="Remove ${esc(name)}">${ICONS.x}</button>`;
  $(".picker-rows", wrap).appendChild(li);
  refreshPicker(wrap);
  wrap.classList.remove("is-invalid");
  (opts ? $(".pick-value", li) : $(".pick-select", wrap))?.focus({ preventScroll: true });
}

function togglePicker(wrap, open) {
  const head = $(".picker-head", wrap);
  const now = open ?? head.getAttribute("aria-expanded") !== "true";
  head.setAttribute("aria-expanded", String(now));
  wrap.classList.toggle("is-open", now);
}

let currentType = null;
const findField = (name) => CFG.requestTypes[currentType]?.fields.find((f) => f.name === name);

function applyShowIf(form) {
  const type = CFG.requestTypes[form.dataset.type];
  type.fields.filter((f) => f.showIf).forEach((f) => {
    const wrap = $(`[data-field="${f.name}"]`, form);
    const src = form.elements[f.showIf.field];
    const show = src && src.value === f.showIf.equals;
    if (wrap.hidden === !show) return;
    wrap.hidden = !show;
    if (show) { wrap.classList.add("is-revealed"); setTimeout(() => wrap.classList.remove("is-revealed"), 500); }
  });
}

function fieldHTML(f, i) {
  if (f.type === "heading") return `<div class="form-section" style="--i:${i}"><h3>${esc(f.label)}</h3>${f.hint ? `<p>${esc(f.hint)}</p>` : ""}</div>`;
  if (f.type === "picker") return pickerHTML(f, i);
  const id = "f-" + f.name;
  const req = f.required ? "required" : "";
  const label = `<span class="field-label">${esc(f.label)}${f.required ? "" : '<span class="opt">optional</span>'}</span>`;
  let control;
  switch (f.type) {
    case "textarea":
      control = `<textarea id="${id}" name="${f.name}" ${req} placeholder="${esc(f.placeholder || "")}"></textarea>`; break;
    case "select":
      control = `<select id="${id}" name="${f.name}" ${req}>${f.required && f.options.length > 3 || f.blank ? '<option value="">Choose one</option>' : ""}${(f.options || []).map((o) => `<option>${esc(o)}</option>`).join("")}</select>`; break;
    case "chips": {
      const opts = f.optionsFrom ? (CFG[f.optionsFrom] || []) : (f.options || []);
      control = `<div class="chips" data-chips="${f.name}" role="group" aria-label="${esc(f.label)}">${opts.map((o) => `<button type="button" class="chip" aria-pressed="false" data-value="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
      return `<div class="field" data-field="${f.name}" style="--i:${i}">${label}${control}</div>`;
    }
    case "checks": {
      const locked = f.locked || [];
      control = `<div class="checks" data-checks="${f.name}" role="group" aria-label="${esc(f.label)}">${(f.options || []).map((o) => {
        const lk = locked.includes(o);
        return `<label class="check${lk ? " is-locked" : ""}"><input type="checkbox" value="${esc(o)}" ${lk ? "checked disabled" : ""} /><span class="box" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span><span>${esc(o)}</span></label>`;
      }).join("")}</div>`;
      return `<div class="field" data-field="${f.name}" style="--i:${i}">${label}${control}</div>`;
    }
    default: {
      const t = ["date", "email", "url", "tel"].includes(f.type) ? f.type : "text";
      const list = f.suggestions ? `list="${id}-list"` : "";
      control = `<input id="${id}" name="${f.name}" type="${t}" ${req} ${list} autocomplete="off" placeholder="${esc(f.placeholder || "")}" />`
        + (f.suggestions ? `<datalist id="${id}-list">${f.suggestions.map((o) => `<option value="${esc(o)}"></option>`).join("")}</datalist>` : "");
    }
  }
  const hide = f.showIf ? " hidden" : "";
  return `<label class="field" data-field="${f.name}" style="--i:${i}"${hide}>${label}${control}</label>`;
}

function swapModal(html, dir) {
  const body = $("#modal-body");
  body.innerHTML = html;
  if (dir && !reduceMotion) {
    body.classList.remove("swap-fwd", "swap-back"); void body.offsetWidth;
    body.classList.add(dir === "back" ? "swap-back" : "swap-fwd");
  }
  const m = $("#modal");
  if (m.hidden) openOverlay(m);
  else $("#modal .sheet").scrollTop = 0;
}

function openGroup(groupKey, dir) {
  const g = GROUPS[groupKey];
  const options = Object.entries(CFG.requestTypes).filter(([, t]) => t.group === groupKey && canUseType(t));
  if (!g || !options.length) return;
  pending.length = 0;
  swapModal(`
    ${backToPicker}
    <div class="modal-head">
      <span class="type-icon">${ICONS[g.icon] || ICONS.spark}</span>
      <div><h2 id="modal-title">${esc(g.label)}</h2><p>${esc(g.question || "Choose a request type.")}</p></div>
    </div>
    <div class="choices" role="list">
      ${options.map(([key, t], i) => `
        <button type="button" class="choice" data-pick="${esc(key)}" role="listitem" style="--i:${i}">
          <span class="choice-icon">${ICONS[t.icon] || ICONS.spark}</span>
          <span class="choice-text"><span class="choice-name">${esc(t.label)}</span><span class="choice-blurb">${esc(t.blurb)}</span></span>
          <span class="choice-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></span>
        </button>`).join("")}
    </div>`, dir);
  setTimeout(() => $(".choice")?.focus({ preventScroll: true }), 300);
}

function openNew(key, dir) {
  if (key === "picker") { openPicker(dir); return; }
  $("#modal")?.classList.remove("is-picker");
  if (key.startsWith("group:")) { openGroup(key.slice(6), dir); return; }
  const type = CFG.requestTypes[key];
  if (!canUseType(type)) return;
  pending.length = 0;
  const back = type.group && GROUPS[type.group]
    ? `<button type="button" class="back-link" data-new="group:${esc(type.group)}" data-dir="back"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>${esc(GROUPS[type.group].label)}</button>`
    : backToPicker;
  swapModal(`
    ${back}
    <div class="modal-head">
      <span class="type-icon">${ICONS[type.icon] || ICONS.spark}</span>
      <div><h2 id="modal-title">${esc(type.label)}</h2><p>${esc(type.blurb)}</p></div>
    </div>
    <form class="modal-form" id="new-form" data-type="${esc(key)}" novalidate>
      ${type.fields.map(fieldHTML).join("")}
      ${dropzoneHTML(type.fields.length)}
      <p class="form-error" id="new-error" role="alert"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary"><span class="btn-text">Send request</span><span class="spinner" aria-hidden="true"></span></button>
      </div>
    </form>`, dir);
  currentType = key;
  const form = $("#new-form");
  $$("[data-picker]", form).forEach(refreshPicker);
  applyShowIf(form);
  setTimeout(() => $("#new-form input, #new-form textarea")?.focus({ preventScroll: true }), 350);
}

async function submitNew(form) {
  const key = form.dataset.type, type = CFG.requestTypes[key];
  if (!canUseType(type)) return;
  const data = {};
  let firstBad = null;

  for (const f of type.fields.filter(isDataField)) {
    const wrap = $(`[data-field="${f.name}"]`, form);
    if (wrap.hidden) { data[f.name] = ""; continue; }
    let v, bad = false;
    if (f.type === "chips") v = $$(`.chip[aria-pressed="true"]`, wrap).map((c) => c.dataset.value);
    else if (f.type === "checks") v = $$("input:checked", wrap).map((c) => c.value);
    else if (f.type === "picker") {
      v = $$(".pick-row", wrap).map((r) => {
        const sel = $(".pick-value", r);
        if (sel && !sel.value) { bad = true; sel.classList.add("is-missing"); }
        return sel ? `${r.dataset.item}: ${sel.value}` : r.dataset.item;
      }).filter((x, i, arr) => arr.indexOf(x) === i);
      if (bad) togglePicker(wrap, true);
    }
    else v = String(form.elements[f.name].value || "").trim();
    data[f.name] = v;
    bad = bad || (f.required && (Array.isArray(v) ? v.length === 0 : !v));
    wrap.classList.remove("is-invalid");
    if (bad) { void wrap.offsetWidth; wrap.classList.add("is-invalid"); firstBad ||= wrap; }
  }
  if (firstBad) {
    $("#new-error").textContent = $(".is-missing", firstBad) ? "Choose an option for each item you added, or remove it." : "Fill in the highlighted fields to send this request.";
    ($(".is-missing, input, textarea, select, .chip", firstBad))?.focus();
    firstBad.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    return;
  }

  showReview(form, data);
}

/* ---- review step: show what will be sent before sending ---- */
function reviewRowsHTML(type, data) {
  return type.fields.filter(isDataField).map((f) => {
    const v = displayValue(f, data[f.name]);
    if (!v) return "";
    return `<div class="detail${f.type === "picker" ? " detail-list" : ""}"><dt>${esc(f.label)}</dt><dd>${esc(v)}</dd></div>`;
  }).join("");
}

function showReview(form, data) {
  const type = CFG.requestTypes[form.dataset.type];
  const files = pending.length
    ? `<h3 class="drawer-h">Attachments</h3><ul class="files review-files">${pending.map((f) => fileItemHTML(f, false)).join("")}</ul>`
    : "";
  const mail = type.emailTo ? `<p class="sent-note">${ICONS.mail}${OUTLOOK ? `After you confirm, your email app opens with these details addressed to ${esc(type.emailTo)}, ready for you to check and send.` : `These details will also be emailed to ${esc(type.emailTo)}.`}</p>` : "";
  const view = document.createElement("div");
  view.className = "review";
  view.id = "review";
  view.innerHTML = `
    <div class="review-head">
      <h3>Check everything before sending</h3>
      <p>Select Edit to change anything. Nothing is sent until you select Confirm and send.</p>
    </div>
    <dl class="details review-details">${reviewRowsHTML(type, data)}</dl>
    ${files}
    ${mail}
    <p class="form-error" id="review-error" role="alert"></p>
    <div class="modal-actions">
      <button type="button" class="btn btn-ghost" data-review-edit>Edit</button>
      <button type="button" class="btn btn-primary" data-confirm-send><span class="btn-text">Confirm and send</span><span class="spinner" aria-hidden="true"></span></button>
    </div>`;
  form.hidden = true;
  $(".back-link", $("#modal-body"))?.setAttribute("hidden", "");
  form.after(view);
  reviewData = data;
  $("#modal .sheet").scrollTop = 0;
  if (!reduceMotion) { const b = $("#modal-body"); b.classList.remove("swap-fwd", "swap-back"); void b.offsetWidth; b.classList.add("swap-fwd"); }
  setTimeout(() => $("[data-confirm-send]", view)?.focus({ preventScroll: true }), 250);
}
let reviewData = null;

function editFromReview() {
  $("#review")?.remove();
  const form = $("#new-form");
  form.hidden = false;
  $(".back-link", $("#modal-body"))?.removeAttribute("hidden");
  const b = $("#modal-body"); b.classList.remove("swap-fwd", "swap-back"); void b.offsetWidth; if (!reduceMotion) b.classList.add("swap-back");
  $("#modal .sheet").scrollTop = 0;
}

async function sendNew() {
  const form = $("#new-form"), view = $("#review");
  if (!form || !view || !reviewData) return;
  const data = reviewData;
  const key = form.dataset.type, type = CFG.requestTypes[key];
  const btn = $("[data-confirm-send]", view);
  if (btn.classList.contains("is-loading")) return;
  $("[data-review-edit]", view).disabled = true;
  btn.classList.add("is-loading");
  const by = state.user.name;
  try {
    const id = await state.store.create({
      type: key,
      title: type.title(data).slice(0, 160),
      fields: data,
      status: "open",
      createdBy: { uid: state.user.uid, email: state.user.email, name: state.user.name },
      assignee: null,
      attachments: [],
      history: [{ status: "open", at: new Date().toISOString(), by }]
    });
    flashIds.add(id);
    renderAll();

    let uploadNote = "";
    if (pending.length) {
      const bar = showUploadProgress(view, btn);
      try {
        await uploadFiles(id, pending.slice(), (k) => bar(k));
      } catch (e) {
        console.error(e);
        uploadNote = `<p class="warn">The request was sent, but the attachments didn't upload${e?.code === "demo-quota" ? " (demo storage in this browser is full)" : ""}. Open the request and select Add files to try again.</p>`;
      }
      pending.length = 0;
    }
    let emailNote = "";
    if (type.emailTo) {
      $(".btn-text", btn).textContent = OUTLOOK ? "Opening email" : "Sending email";
      const r = await emailRequest(id);
      const draftBtns = `<div class="draft-actions"><button type="button" class="btn-mini" data-draft="${esc(id)}">${ICONS.mail}Open email again</button><button type="button" class="btn-mini" data-copy-details="${esc(id)}">Copy details</button></div>`;
      if (r.startsWith?.("opened")) emailNote = `<div class="sent-note draft-note">${ICONS.mail}<span>${
        r === "opened" ? `Your email app should now be open with a message to <strong>${esc(type.emailTo)}</strong>. Check the details and click <strong>Send</strong>.`
        : r === "opened-copied" ? `Your email app should now be open with a message to <strong>${esc(type.emailTo)}</strong>. The details were too long for one link, so they're copied: click in the message, paste (Ctrl+V), check, and click <strong>Send</strong>.`
        : `Your email app should now be open with a message to <strong>${esc(type.emailTo)}</strong>. Select Copy details below, paste into the message, and click <strong>Send</strong>.`
      }<br>Nothing opened? Use the button below.${draftBtns}</span></div>`;
      else emailNote = r === "sent"
        ? `<p class="sent-note">${ICONS.mail}The details were emailed to ${esc(type.emailTo)}.</p>`
        : r === "not-configured"
          ? `<p class="sent-note">${ICONS.mail}Email isn't set up yet, so nothing was sent to ${esc(type.emailTo)}. An admin can send it from the request once it is.</p>`
          : `<p class="warn">The request was sent, but the email to ${esc(type.emailTo)} didn't go through. An admin can resend it from the request.</p>`;
    }
    $("#modal-body").innerHTML = `
      <div class="success">
        <svg viewBox="0 0 90 90" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle class="ring" cx="45" cy="45" r="38"/><path class="tick" d="M29 46l11 11 22-24"/>
        </svg>
        <h2 id="modal-title">Request sent</h2>
        <p>Your reference is <strong>${ref(id)}</strong>. You'll see it move to in progress as soon as someone takes it.</p>
        ${uploadNote}
        ${emailNote}
        <button class="btn btn-primary" data-close>Done</button>
      </div>`;
    if (state.mineFilter === "completed") setSeg("mine-filter", "active");
    if (state.tab !== "mine") setTab("mine");
  } catch (e) {
    console.error(e);
    btn.classList.remove("is-loading");
    $("[data-review-edit]", view).disabled = false;
    $("#review-error").textContent = e?.code === "permission-denied"
      ? "Your account isn't allowed to send requests. Ask an admin to add you."
      : "The request didn't send. Check your connection and try again.";
  }
}

/* --------------------------------------------------------------------------
   Attachments
   Files are stored in Firestore (tickets/{id}/chunks) as base64 pieces under
   the 1 MB document limit, so the free Firebase plan is enough.
   -------------------------------------------------------------------------- */
const ATT = Object.assign({ maxFiles: 8, maxSizeMB: 5 }, CFG.attachments || {});
const CHUNK = 750000;                 // base64 characters per Firestore document
const pending = [];                   // files staged in the new-request form
const fileCache = new Map();          // ticketId/fileId -> object URL
const touch = matchMedia("(pointer: coarse)").matches;

const newId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? Math.round(b / 1024) + " KB" : (b / 1048576).toFixed(1) + " MB";
const isImage = (t) => /^image\/(png|jpe?g|webp|gif|bmp)$/i.test(t || "");
const extOf = (n) => (String(n).match(/\.([a-z0-9]{1,5})$/i)?.[1] || "file").toUpperCase();
const blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });

function loadImage(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
    img.src = url;
  });
}
async function resize(blob, max, type = "image/jpeg", q = 0.85) {
  const img = await loadImage(blob);
  const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, type, q));
}

async function prepareFile(file) {
  let blob = file, type = file.type || "application/octet-stream";
  let name = file.name && file.name !== "image.png" ? file.name : `Screenshot ${new Date().toLocaleString().replace(/[/:]/g, "-")}.png`;
  // Large photos and screenshots are scaled down so they upload fast and stay under the size limit.
  if (isImage(type) && !/gif/i.test(type) && file.size > 1.2 * 1048576) {
    blob = await resize(file, 2200, "image/jpeg", 0.86);
    type = "image/jpeg";
    name = name.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
  }
  if (blob.size > ATT.maxSizeMB * 1048576) throw { code: "too-big", name };
  let thumb = null;
  if (isImage(type)) { try { thumb = await blobToDataURL(await resize(blob, 360, "image/jpeg", 0.72)); } catch {} }
  return { id: newId(), blob, name, type, size: blob.size, thumb };
}

async function uploadFiles(ticketId, files, onProgress) {
  const total = files.reduce((n, f) => n + f.size, 0) || 1;
  let done = 0;
  const metas = [];
  for (const f of files) {
    const b64 = (await blobToDataURL(f.blob)).split(",")[1] || "";
    const n = Math.max(1, Math.ceil(b64.length / CHUNK));
    for (let i = 0; i < n; i++) {
      await state.store.putChunk(ticketId, `${f.id}_${i}`, b64.slice(i * CHUNK, (i + 1) * CHUNK));
      done += f.size / n;
      onProgress?.(done / total);
    }
    metas.push({ id: f.id, name: f.name, type: f.type, size: f.size, chunks: n, thumb: f.thumb || null, by: state.user.name, at: new Date().toISOString() });
  }
  await state.store.addAttachments(ticketId, metas);
  return metas;
}

async function fetchFile(ticketId, a) {
  const key = ticketId + "/" + a.id;
  if (fileCache.has(key)) return fileCache.get(key);
  const parts = await Promise.all(Array.from({ length: a.chunks || 1 }, (_, i) => state.store.getChunk(ticketId, `${a.id}_${i}`)));
  const bin = atob(parts.join(""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: a.type }));
  fileCache.set(key, url);
  return url;
}

async function downloadAttachment(ticketId, a, btn) {
  btn?.classList.add("is-loading");
  try {
    const url = await fetchFile(ticketId, a);
    const link = Object.assign(document.createElement("a"), { href: url, download: a.name });
    document.body.appendChild(link); link.click(); link.remove();
  } catch (e) {
    console.error(e);
    toast("That file couldn't be loaded. It may have been removed.", "#E2632B");
  } finally { btn?.classList.remove("is-loading"); }
}

/* ---- staging in the new-request form ---- */
function dropzoneHTML(i) {
  const hint = touch ? "Take a photo or choose files." : "Drag files here, browse, or paste a screenshot (Ctrl+V).";
  return `<div class="field" data-field="__files" style="--i:${i}">
    <span class="field-label">Attachments<span class="opt">optional, up to ${ATT.maxFiles} files, ${ATT.maxSizeMB} MB each</span></span>
    <div class="drop" tabindex="0" role="button" aria-label="Add attachments">
      <input type="file" multiple hidden class="drop-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.zip,.msg,.eml" />
      <span class="drop-icon">${ICONS.upload}</span>
      <span class="drop-text"><strong>${touch ? "Add files" : "Add files or screenshots"}</strong><span>${hint}</span></span>
    </div>
    <ul class="files" id="pending-files"></ul>
  </div>`;
}

function fileItemHTML(f, removable) {
  const preview = f.thumb ? `<img src="${f.thumb}" alt="" />` : `<span class="file-ext">${esc(extOf(f.name))}</span>`;
  return `<li class="file" data-file="${esc(f.id)}">
    <span class="file-prev">${preview}</span>
    <span class="file-meta"><span class="file-name">${esc(f.name)}</span><span class="file-size">${fmtSize(f.size)}</span></span>
    ${removable ? `<button type="button" class="file-x" data-unstage="${esc(f.id)}" aria-label="Remove ${esc(f.name)}">${ICONS.x}</button>` : ""}
  </li>`;
}

function renderPending() {
  const ul = $("#pending-files");
  if (ul) ul.innerHTML = pending.map((f) => fileItemHTML(f, true)).join("");
}

async function stage(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  const room = ATT.maxFiles - pending.length;
  if (room <= 0) { toast(`You can attach up to ${ATT.maxFiles} files.`, "#E2632B"); return; }
  if (files.length > room) toast(`Only ${room} more file${room > 1 ? "s" : ""} can be added.`, "#E2632B");
  for (const file of files.slice(0, room)) {
    try { pending.push(await prepareFile(file)); renderPending(); }
    catch (e) { toast(e?.code === "too-big" ? `${e.name} is over ${ATT.maxSizeMB} MB. Compress it or share a link instead.` : `${file.name || "That file"} couldn't be added.`, "#E2632B"); }
  }
  $('[data-field="__files"]')?.classList.remove("is-invalid");
}

function showUploadProgress(form, btn) {
  const wrap = document.createElement("div");
  wrap.className = "upload";
  wrap.innerHTML = `<span class="upload-label">Uploading attachments</span><span class="upload-track"><span class="upload-fill"></span></span>`;
  $(".modal-actions", form).before(wrap);
  $(".btn-text", btn).textContent = "Uploading";
  return (k) => { $(".upload-fill", wrap).style.width = Math.round(k * 100) + "%"; };
}

/* ---- drawer section ---- */
function canAttach(t) { return state.isAdmin || t.createdBy?.uid === state.user.uid; }

function attachmentsHTML(t) {
  const list = t.attachments || [];
  if (!list.length && !canAttach(t)) return "";
  const imgs = list.filter((a) => a.thumb);
  const docs = list.filter((a) => !a.thumb);
  return `<div class="att">
    <div class="att-head">
      <h3 class="drawer-h">Attachments${list.length ? ` <span class="att-count">${list.length}</span>` : ""}</h3>
      ${canAttach(t) && list.length < ATT.maxFiles * 3 ? `<button type="button" class="btn-mini" data-addfiles>${ICONS.clip}Add files</button>
        <input type="file" multiple hidden id="drawer-files" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx,.zip,.msg,.eml" />` : ""}
    </div>
    <div class="upload" id="drawer-upload" hidden><span class="upload-label">Uploading</span><span class="upload-track"><span class="upload-fill"></span></span></div>
    ${imgs.length ? `<div class="att-grid">${imgs.map((a) => `
      <button type="button" class="att-thumb" data-view="${esc(a.id)}" aria-label="View ${esc(a.name)}"><img src="${a.thumb}" alt="" loading="lazy" /></button>`).join("")}</div>` : ""}
    ${docs.length ? `<ul class="files">${docs.map((a) => `
      <li class="file">
        <span class="file-prev"><span class="file-ext">${esc(extOf(a.name))}</span></span>
        <span class="file-meta"><span class="file-name">${esc(a.name)}</span><span class="file-size">${fmtSize(a.size)}, added by ${esc(a.by || "")}</span></span>
        <button type="button" class="btn-mini" data-dl="${esc(a.id)}"><span class="btn-text">Download</span><span class="spinner" aria-hidden="true"></span></button>
      </li>`).join("")}</ul>` : ""}
    ${!list.length ? `<p class="att-empty">No files yet. Add screenshots or documents that help explain the request.</p>` : ""}
  </div>`;
}

async function addFilesToTicket(fileList) {
  const t = state.tickets.find((x) => x.id === state.openId);
  if (!t || !fileList.length) return;
  const room = ATT.maxFiles;
  const prepared = [];
  for (const file of [...fileList].slice(0, room)) {
    try { prepared.push(await prepareFile(file)); }
    catch (e) { toast(e?.code === "too-big" ? `${e.name} is over ${ATT.maxSizeMB} MB.` : `${file.name} couldn't be added.`, "#E2632B"); }
  }
  if (!prepared.length) return;
  const box = $("#drawer-upload");
  if (box) box.hidden = false;
  try {
    await uploadFiles(t.id, prepared, (k) => { const f = $("#drawer-upload .upload-fill"); if (f) f.style.width = Math.round(k * 100) + "%"; });
    toast(`${prepared.length} file${prepared.length > 1 ? "s" : ""} added to ${ref(t.id)}`, "var(--s-done)");
  } catch (e) {
    console.error(e);
    toast(e?.code === "demo-quota" ? "Demo storage in this browser is full. Delete a request to free space." : "The files didn't upload. Check your connection and try again.", "#E2632B");
  } finally { const b = $("#drawer-upload"); if (b) b.hidden = true; }
}

/* ---- image viewer ---- */
const viewer = { ticketId: null, list: [], i: 0 };
async function openViewer(ticketId, attId) {
  const t = state.tickets.find((x) => x.id === ticketId);
  viewer.ticketId = ticketId;
  viewer.list = (t?.attachments || []).filter((a) => a.thumb);
  viewer.i = Math.max(0, viewer.list.findIndex((a) => a.id === attId));
  const lb = $("#lightbox");
  if (lb.hidden) openOverlay(lb);
  showViewerImage();
}
async function showViewerImage() {
  const a = viewer.list[viewer.i];
  if (!a) return;
  const img = $("#lb-img");
  $("#lb-name").textContent = a.name;
  $("#lb-count").textContent = viewer.list.length > 1 ? `${viewer.i + 1} of ${viewer.list.length}` : "";
  $$(".lb-nav").forEach((b) => b.hidden = viewer.list.length < 2);
  img.src = a.thumb;
  img.classList.add("is-loading");
  try {
    const url = await fetchFile(viewer.ticketId, a);
    if (viewer.list[viewer.i] === a) img.src = url;
  } catch { toast("The full-size image couldn't be loaded.", "#E2632B"); }
  img.classList.remove("is-loading");
}
function stepViewer(d) {
  if (viewer.list.length < 2) return;
  viewer.i = (viewer.i + d + viewer.list.length) % viewer.list.length;
  showViewerImage();
}

/* --------------------------------------------------------------------------
   Confirm dialog
   -------------------------------------------------------------------------- */
function confirmDialog({ title, body, confirm, danger = true }) {
  return new Promise((resolve) => {
    const el = $("#confirm");
    $("#confirm-title").textContent = title;
    $("#confirm-text").innerHTML = body;
    const ok = $("#confirm-ok");
    ok.className = "btn " + (danger ? "btn-danger-solid" : "btn-primary");
    $(".btn-text", ok).textContent = confirm;
    ok.classList.remove("is-loading");
    openOverlay(el);
    setTimeout(() => $("#confirm-cancel").focus(), 60);
    const finish = (v) => { cleanup(); resolve(v); };
    const onOk = () => finish(true);
    const onCancel = (e) => { if (e.type === "keydown" && e.key !== "Escape") return; finish(false); closeOverlay(el); };
    const onBackdrop = (e) => { if (e.target === el) { finish(false); closeOverlay(el); } };
    function cleanup() {
      ok.removeEventListener("click", onOk);
      $("#confirm-cancel").removeEventListener("click", onCancel);
      el.removeEventListener("click", onBackdrop);
      document.removeEventListener("keydown", onCancel);
    }
    ok.addEventListener("click", onOk);
    $("#confirm-cancel").addEventListener("click", onCancel);
    el.addEventListener("click", onBackdrop);
    document.addEventListener("keydown", onCancel);
  });
}

/* Offboarding: per-system checklist on the ticket; every tick is written to the ticket history (audit trail) */
function checklistHTML(t) {
  const items = CFG.requestTypes[t.type]?.checklist; if (!items?.length) return "";
  const done = t.checklist || {}, n = items.filter((i) => done[i]).length, all = n === items.length;
  return `<section class="ob">
    <div class="ob-head"><h3 class="drawer-h">Access removed</h3><span class="ob-count${all ? " is-done" : ""}">${n} of ${items.length}</span></div>
    <div class="ob-bar"><span style="width:${Math.round(n / items.length * 100)}%"></span></div>
    <div class="ob-list">${items.map((i) => `<button type="button" class="ob-item${done[i] ? " is-on" : ""}" ${state.isAdmin ? `data-ob="${esc(i)}"` : "disabled"} aria-pressed="${Boolean(done[i])}">
      <span class="st-box"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
      <span class="ob-name">${esc(i)}</span>${done[i] ? `<small>${esc(done[i].by?.split(" ")[0] || "")} · ${esc(new Date(done[i].at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }))}</small>` : ""}</button>`).join("")}</div>
    ${all && t.status !== "completed" ? `<p class="ob-ready">All access removed. Mark the request as completed when you're done.</p>` : ""}
  </section>`;
}
async function toggleChecklist(item) {
  const t = state.tickets.find((x) => x.id === state.openId); if (!t || !state.isAdmin) return;
  const cl = { ...(t.checklist || {}) }; const on = !cl[item];
  if (on) cl[item] = { by: state.user.name, at: new Date().toISOString() }; else delete cl[item];
  t.checklist = cl; renderDrawer();
  try { await state.store.update(t.id, { checklist: cl }, { status: t.status, by: state.user.name, at: new Date().toISOString(), note: `${on ? "Access removed" : "Unticked"}: ${item}` }); }
  catch (e) { console.error(e); toast("Couldn't save. Check your connection.", "#E2632B"); }
}

async function archiveTicket(on) {
  const t = state.tickets.find((x) => x.id === state.openId);
  if (!t || !state.isAdmin) return;
  const now = new Date().toISOString();
  try {
    await state.store.update(t.id, { archived: on, archivedAt: on ? now : null, archivedBy: on ? state.user.name : null },
      { status: t.status, by: state.user.name, at: now, note: on ? "Archived" : "Restored from archive" });
    closeOverlay($("#drawer"));
    toast(on ? `${ref(t.id)} archived` : `${ref(t.id)} restored`, on ? "var(--muted)" : "var(--s-done)");
  } catch (e) {
    console.error(e);
    toast("That didn't save. Check your connection and try again.", "#E2632B");
  }
}

async function deleteTicket() {
  const t = state.tickets.find((x) => x.id === state.openId);
  if (!t) return;
  const n = t.attachments?.length || 0;
  const yes = await confirmDialog({
    title: "Delete this request?",
    body: `<strong>${ref(t.id)}</strong> “${esc(t.title)}” will be permanently deleted${n ? `, along with its ${n} attachment${n > 1 ? "s" : ""}` : ""}. This can’t be undone.`,
    confirm: "Delete permanently"
  });
  if (!yes) return;
  const ok = $("#confirm-ok");
  ok.classList.add("is-loading");
  try {
    await state.store.remove(t);
    closeOverlay($("#confirm"));
    closeOverlay($("#drawer"));
    toast(`${ref(t.id)} deleted`, "var(--muted)");
  } catch (e) {
    console.error(e);
    ok.classList.remove("is-loading");
    closeOverlay($("#confirm"));
    toast(e?.code === "permission-denied" ? "This request can't be deleted until it's completed." : "The request wasn't deleted. Check your connection and try again.", "#E2632B");
  }
}

/* --------------------------------------------------------------------------
   Email (EmailJS) — request types with "emailTo" in config.js send their
   details by email when submitted. Admins can resend from the request.
   -------------------------------------------------------------------------- */
const MAIL = CFG.email || {};
const mailReady = () => Boolean(MAIL.publicKey && MAIL.serviceId && MAIL.templateId);
let emailjsLib = null;

function loadEmailJS() {
  if (window.emailjs) return Promise.resolve(window.emailjs);
  if (emailjsLib) return emailjsLib;
  emailjsLib = new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4.4.1/dist/email.min.js";
    sc.onload = () => { window.emailjs.init({ publicKey: MAIL.publicKey }); res(window.emailjs); };
    sc.onerror = () => { emailjsLib = null; rej(new Error("EmailJS failed to load")); };
    document.head.appendChild(sc);
  });
  return emailjsLib;
}

function displayValue(f, v) {
  if (Array.isArray(v)) v = v.join(f.type === "picker" ? "\n" : ", ");
  if (f.type === "url" && v && !/^https?:\/\//i.test(v)) v = "https://" + v;
  if (f.type === "date" && v) v = new Date(v + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return v;
}

function emailParams(t) {
  const type = CFG.requestTypes[t.type];
  const rows = [["Reference", ref(t.id)], ["Requested by", `${t.createdBy?.name} (${t.createdBy?.email})`]]
    .concat(type.fields.filter(isDataField)
      .filter((f) => !(f.type === "picker" || f.showIf) || displayValue(f, t.fields?.[f.name]))
      .map((f) => [f.label, displayValue(f, t.fields?.[f.name]) || "Not provided"]));
  const n = t.attachments?.length || 0;
  const base = (MAIL.siteUrl || location.href.split("#")[0]).replace(/index\.html$/, "").replace(/\/?$/, "/");
  const link = base + "#r-" + t.id;
  return {
    to_email: type.emailTo,
    reply_to: t.createdBy?.email || "",
    subject: `${typeLabel(t.type)}: ${t.title.replace(/^New employee:\s*/i, "")} (${ref(t.id)})`,
    request_type: typeLabel(t.type),
    reference: ref(t.id),
    requested_by: t.createdBy?.name || "",
    requested_by_email: t.createdBy?.email || "",
    submitted_at: toDate(t.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }),
    details_text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    details_html: rows.map(([k, v], i) =>
      `<tr><td style="padding:10px 14px;border-top:${i ? "1px solid #E4EBF5" : "0"};color:#62789A;font-size:13px;width:38%;vertical-align:top">${esc(k)}</td>` +
      `<td style="padding:10px 14px;border-top:${i ? "1px solid #E4EBF5" : "0"};color:#0A1E3F;font-size:14px;font-weight:600;white-space:pre-wrap">${esc(v)}</td></tr>`).join(""),
    attachments_note: n ? `${n} attachment${n > 1 ? "s are" : " is"} saved with the request.` : "",
    request_link: link,
    logo_url: base + "assets/logo.png"
  };
}

const OUTLOOK = (MAIL.method || "outlook") === "outlook";
const MAILTO_LIMIT = 1900;   // some email apps cut off longer mailto links

function plainBody(t) {
  const type = CFG.requestTypes[t.type];
  const p = emailParams(t);
  const lines = [`${p.request_type} (${p.reference})`, `Submitted by ${p.requested_by} on ${p.submitted_at}`, ""];
  for (const f of type.fields.filter(isDataField)) {
    const v = t.fields?.[f.name];
    if (f.type === "picker") {
      if (Array.isArray(v) && v.length) { lines.push("", `${f.label}:`); v.forEach((x) => lines.push(`  - ${x}`)); }
      continue;
    }
    const dv = displayValue(f, v);
    if (dv) lines.push(`${f.label}: ${dv}`);
  }
  if (p.attachments_note) lines.push("", p.attachments_note);
  lines.push("", `Open in Request Center: ${p.request_link}`);
  return lines.join("\n");
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {}
  try {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove(); return ok;
  } catch { return false; }
}

// Opens the person's email app with everything filled in. Returns "opened" or "opened-copied" (body too long, copied instead).
async function openDraft(t) {
  const type = CFG.requestTypes[t.type];
  const p = emailParams(t);
  const full = plainBody(t);
  let body = full, mode = "opened";
  const enc = (s) => encodeURIComponent(s).replace(/%20/g, "%20");
  const build = (b) => `mailto:${encodeURIComponent(type.emailTo).replace(/%40/g, "@")}?subject=${enc(p.subject)}&body=${enc(b)}`;
  if (build(full).length > MAILTO_LIMIT) {
    const copied = await copyText(full);
    body = copied
      ? `The full details of ${p.reference} are copied to the clipboard.\nClick here and paste them (Ctrl+V), then send.\n\n`
      : `Some email apps can't take the full details in one link.\nOpen ${p.request_link} and select Copy details, then paste them here.\n\n`;
    mode = copied ? "opened-copied" : "opened-short";
  }
  const a = Object.assign(document.createElement("a"), { href: build(body) });
  document.body.appendChild(a); a.click(); a.remove();
  await state.store.setEmailStatus(t.id, { sent: true, method: "outlook", to: type.emailTo, at: new Date().toISOString(), by: state.user.name }).catch(() => {});
  return mode;
}

async function emailRequest(id) {
  const t = state.tickets.find((x) => x.id === id);
  const type = t && CFG.requestTypes[t.type];
  if (!t || !type?.emailTo) return "skipped";
  if (OUTLOOK) return openDraft(t);
  if (!mailReady()) return "not-configured";
  try {
    const lib = await loadEmailJS();
    await lib.send(MAIL.serviceId, MAIL.templateId, emailParams(t));
    await state.store.setEmailStatus(id, { sent: true, to: type.emailTo, at: new Date().toISOString(), by: state.user.name }).catch(() => {});
    return "sent";
  } catch (e) {
    console.error("Email failed", e);
    await state.store.setEmailStatus(id, { sent: false, to: type.emailTo, at: new Date().toISOString(), by: state.user.name }).catch(() => {});
    return "failed";
  }
}

function emailHTML(t) {
  const type = CFG.requestTypes[t.type];
  if (!type?.emailTo) return "";
  const st = t.emailStatus;
  const line = !st ? `Not emailed yet. Details go to ${esc(type.emailTo)}.`
    : st.method === "outlook" ? `Email to ${esc(st.to)} was opened in ${esc(st.by || "someone")}'s email app on ${fullDate(st.at)}.`
    : st.sent ? `Emailed to ${esc(st.to)} on ${fullDate(st.at)}.`
    : `The email to ${esc(st.to)} didn't go through on ${fullDate(st.at)}.`;
  const cls = st?.sent ? "is-sent" : st ? "is-failed" : "";
  return `<div class="mailbox ${cls}">
    <span class="mailbox-icon">${ICONS.mail}</span>
    <span class="mailbox-text">${line}</span>
    ${OUTLOOK && canAttach(t)
      ? `<span class="mailbox-btns"><button type="button" class="btn-mini" data-draft="${esc(t.id)}">${st ? "Open email again" : "Open email"}</button><button type="button" class="btn-mini" data-copy-details="${esc(t.id)}">Copy details</button></span>`
      : state.isAdmin ? `<button type="button" class="btn-mini" data-resend><span class="btn-text">${st?.sent ? "Send again" : "Send email"}</span><span class="spinner" aria-hidden="true"></span></button>` : ""}
  </div>`;
}

async function resendEmail(btn) {
  const id = state.openId;
  if (!mailReady()) { toast("Email isn't set up yet. Add your EmailJS keys to config.js.", "#E2632B"); return; }
  btn.classList.add("is-loading");
  const r = await emailRequest(id);
  btn.classList.remove("is-loading");
  toast(r === "sent" ? `Details emailed for ${ref(id)}` : "The email didn't go through. Check the EmailJS settings and try again.", r === "sent" ? "var(--s-done)" : "#E2632B");
  renderDrawer();
}

/* --------------------------------------------------------------------------
   Drawer (request details + admin actions)
   -------------------------------------------------------------------------- */
function openTicket(id) {
  state.openId = id;
  renderDrawer();
  openOverlay($("#drawer"));
}

function renderDrawer() {
  const t = state.tickets.find((x) => x.id === state.openId);
  if (!t) { closeOverlay($("#drawer")); return; }
  const type = CFG.requestTypes[t.type];
  const keepNote = $("#admin-note")?.value || "";

  const rows = (type?.fields || []).filter(isDataField).map((f) => {
    const v = displayValue(f, t.fields?.[f.name]);
    return v ? `<div class="detail${f.type === "picker" ? " detail-list" : ""}"><dt>${esc(f.label)}</dt><dd>${esc(v)}</dd></div>` : "";
  }).join("");

  const history = (t.history || []).slice().reverse().map((h) => `
    <li style="--sc:${STATUS[h.status]?.color || "var(--navy)"}">
      <strong>${esc(STATUS[h.status]?.label || h.status)}</strong> by ${esc(h.by || "")}
      <div class="when">${fullDate(h.at)}</div>
      ${h.note ? `<span class="note">${esc(h.note)}</span>` : ""}
    </li>`).join("");

  let admin = "";
  if (state.isAdmin) {
    const actions = {
      open:        `<button class="btn btn-primary" data-set="in_progress">Take request</button><button class="btn btn-success" data-set="completed">Complete</button>`,
      in_progress: `<button class="btn btn-success" data-set="completed">Complete</button><button class="btn btn-ghost" data-set="open">Move back to submitted</button>`,
      completed:   t.archived
        ? `<button class="btn btn-primary" data-archive="0">Restore from archive</button>`
        : `<button class="btn btn-ghost" data-set="in_progress">Reopen</button><button class="btn btn-ghost btn-archive" data-archive="1"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/></svg>Archive</button>`
    }[t.status];
    admin = `
      <div class="admin-box">
        <label class="field"><span class="field-label">Note to ${esc(t.createdBy?.name?.split(" ")[0] || "requester")}<span class="opt">optional, sent with the update</span></span>
          <textarea id="admin-note" rows="2" placeholder="e.g. Added to both queues, calls start routing tomorrow"></textarea>
        </label>
        <div class="admin-actions">${actions}</div>
      </div>`;
  }


  $("#drawer-body").innerHTML = `
    <div class="drawer-top">
      <span class="pill" data-status="${t.status}">${STATUS[t.status].label}</span>${t.archived ? `<span class="pill pill-archived">Archived</span>` : ""}
      <span class="t-ref">${ref(t.id)}</span>
    </div>
    <h2 class="drawer-title" id="drawer-title">${esc(t.title)}</h2>
    ${track(t.status)}
    <dl class="details">
      <div class="detail"><dt>Requested by</dt><dd>${esc(t.createdBy?.name)}${state.isAdmin ? ` <span style="color:var(--muted)">${esc(t.createdBy?.email)}</span>` : ""}</dd></div>
      <div class="detail"><dt>Type</dt><dd>${esc(typeLabel(t.type))}</dd></div>
      ${rows}
      ${(CFG.requestTypes[t.type]?.standardInfo || []).map((info) => `<div class="detail detail-std"><dt>${esc(info.label)}</dt><dd><ul class="std-lines">${(info.lines || []).map(([k, v]) => `<li><strong>${esc(k)}</strong><span>${esc(v)}</span></li>`).join("")}</ul></dd></div>`).join("")}
    </dl>
    ${checklistHTML(t)}
    ${emailHTML(t)}
    ${attachmentsHTML(t)}
    <h3 class="drawer-h">Activity</h3>
    <ul class="timeline">${history}</ul>
    ${admin}`;
  const note = $("#admin-note");
  if (note) note.value = keepNote;
}

async function setStatus(status, btn) {
  const t = state.tickets.find((x) => x.id === state.openId);
  if (!t) return;
  const note = ($("#admin-note")?.value || "").trim();
  btn.classList.add("is-loading");
  const patch = { status };
  if (status === "in_progress" || status === "completed") patch.assignee = t.assignee && t.status !== "open" ? t.assignee : { name: state.user.name, email: state.user.email };
  if (status === "open") patch.assignee = null;
  try {
    const entry = { status, at: new Date().toISOString(), by: state.user.name };
    if (note) entry.note = note;
    $("#admin-note") && ($("#admin-note").value = "");
    await state.store.update(t.id, patch, entry);
    toast(status === "completed" ? `${ref(t.id)} completed` : status === "in_progress" ? `${ref(t.id)} is in progress` : `${ref(t.id)} moved back to submitted`, STATUS[status].color);
    flashIds.add(t.id);
    renderAll();
    if (status === "completed") setTimeout(() => closeOverlay($("#drawer")), 420);
  } catch (e) {
    console.error(e);
    btn.classList.remove("is-loading");
    toast("The update didn't save. Check your connection and try again.", "#E2632B");
  }
}

/* --------------------------------------------------------------------------
   Events
   -------------------------------------------------------------------------- */
function bind() {
  // Login
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget, err = $("#login-error"), btn = $('button[type="submit"]', f);
    const email = f.email.value.trim(), pw = f.password.value;
    err.textContent = "";
    if (!email || !pw) { err.textContent = "Enter your work email and password."; return; }
    btn.classList.add("is-loading");
    try { await state.store.signIn(email, pw); }
    catch (ex) {
      const map = {
        "demo": "Firebase isn't connected yet, so use the demo buttons below.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/wrong-password": "Email or password is incorrect.",
        "auth/user-not-found": "Email or password is incorrect.",
        "auth/invalid-email": "That email address isn't valid.",
        "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
        "auth/network-request-failed": "No connection. Check your network and try again."
      };
      err.textContent = map[ex?.code] || "Sign in didn't work. Try again.";
    } finally { btn.classList.remove("is-loading"); }
  });

  $("#forgot-btn").addEventListener("click", async () => {
    const email = $("#login-form").email.value.trim();
    const err = $("#login-error");
    if (!email) { err.textContent = "Enter your work email first, then select Forgot password."; return; }
    try { await state.store.reset(email); err.textContent = ""; toast("Password reset email sent", "var(--s-done)"); }
    catch (ex) { err.textContent = ex?.code === "demo" ? "Password reset works once Firebase is connected." : "Couldn't send the reset email. Check the address."; }
  });

  $$("[data-demo]").forEach((b) => b.addEventListener("click", () => state.store.signInAs(b.dataset.demo)));

  // Global clicks
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.matches?.("input[type=file]")) return;
    // ---- Training ----
    const trOpen = t.closest("[data-tr-open]"); if (trOpen) { openCourse(trOpen.dataset.trOpen); return; }
    if (t.closest("[data-tr-soon]")) { toast("This course is coming soon.", "var(--s-progress)"); return; }
    const trView = t.closest("[data-tr-view]"); if (trView) { TRS.view = trView.dataset.trView; renderTraining(); return; }
    if (t.closest("[data-tr-exit]")) { TRS.view = "home"; TRS.course = null; TRS.panel = false; renderTraining(); window.scrollTo({ top: 0 }); return; }
    if (t.closest("[data-tr-next]")) { nextStep(); return; }
    if (t.closest("[data-tr-prev]")) { goStep(TRS.idx - 1, "back"); return; }
    const trGo = t.closest("[data-tr-goto]"); if (trGo) { const i = Number(trGo.dataset.trGoto); if (trGo.hasAttribute("data-tr-panel-go")) TRS.panel = false; goStep(i, i < TRS.idx ? "back" : "fwd"); return; }
    if (t.closest("[data-tr-restart]")) { goStep(0, "back"); return; }
    if (t.closest("[data-tr-confirm]")) { const st = courseSteps(TRS.course)[TRS.idx]; const L = TRS.local[st.id] || (TRS.local[st.id] = {}); L.confirmed = !L.confirmed; renderPlayer(true); return; }
    const trPick = t.closest("[data-tr-pick]"); if (trPick) { const st = courseSteps(TRS.course)[TRS.idx]; const L = TRS.local[st.id] || (TRS.local[st.id] = {}); L.pick = Number(trPick.dataset.trPick); delete L.wrong; renderPlayer(true); return; }
    if (t.closest("[data-tr-check]")) {
      const st = courseSteps(TRS.course)[TRS.idx]; const L = TRS.local[st.id] || (TRS.local[st.id] = {});
      if (L.pick === undefined) return;
      L.attempts = (L.attempts || 0) + 1;
      if (L.pick === st.answer) { L.correct = true; delete L.wrong; renderPlayer(true); if (!reduceMotion) { const ok = $(".tp-opt.is-right"); ok?.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 450, easing: "cubic-bezier(.34,1.56,.64,1)" }); } }
      else { L.wrong = L.pick; renderPlayer(true); $(".tp-opt.is-wrong")?.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 350 }); }
      return;
    }
    const trRev = t.closest("[data-tr-reveal]"); if (trRev) { const st = courseSteps(TRS.course)[TRS.idx]; const L = TRS.local[st.id] || (TRS.local[st.id] = {}); const i = Number(trRev.dataset.trReveal); L.revealed = [...new Set([...(L.revealed || []), i])]; trRev.classList.add("is-open"); const left = st.items.length - L.revealed.length; const h = $(".tp-hint"); if (h) h.textContent = left ? `${left} left to reveal` : "Nice! You've revealed them all."; if (!left && st.callout) renderPlayer(true); const nb = $("[data-tr-next]"); if (nb) nb.disabled = !canContinue(st); return; }
    const trW = t.closest("[data-tr-watch]"); if (trW) {
      const st = courseSteps(TRS.course)[TRS.idx]; const L = TRS.local[st.id] || (TRS.local[st.id] = {});
      const i = Number(trW.dataset.trWatch); const w = watchedSet(st);
      if (!trW.href && w.has(i)) { L.watched = (L.watched || []).filter((x) => x !== i); const saved = (progFor(state.user.uid, TRS.course.id).watched?.[st.id] || []).filter((x) => x !== i); saveStep(TRS.course, { watched: { [st.id]: saved } }); }
      else { L.watched = [...new Set([...(L.watched || []), i])]; saveStep(TRS.course, { watched: { [st.id]: [...new Set([...w, i])] } }); }
      setTimeout(() => renderPlayer(true), trW.href ? 150 : 0);
      if (!trW.href) e.preventDefault();
      return;
    }
    if (t.closest("[data-tr-walk]")) { const st = courseSteps(TRS.course)[TRS.idx]; const L = TRS.local[st.id] || (TRS.local[st.id] = {}); L.shown = Math.min((L.shown || 1) + 1, st.items.length); renderPlayer(true); return; }
    if (t.closest("[data-tr-questions]")) { TRS.panelTab = "questions"; if (TRS.view === "player") { TRS.panel = true; renderPlayer(true); } else openTrainingQuestions(); return; }
    if (t.closest("[data-tr-panel-close]")) { TRS.panel = false; renderPlayer(true); return; }
    const trPtab = t.closest("[data-tr-ptab]"); if (trPtab) { TRS.panelTab = trPtab.dataset.trPtab; renderQuestionsPanel(); return; }
    if (t.closest("[data-tr-manage]")) { openManageTraining(); return; }
    const tmB = t.closest("[data-tm]"); if (tmB) { runManage(tmB.dataset.tm, tmB); return; }
    const trPx = t.closest("[data-tr-pptx]"); if (trPx) { downloadCoursePptx(trPx.dataset.trPptx, trPx); return; }
    if (t.closest("[data-tr-note-toggle]")) { const btn = t.closest("[data-tr-note-toggle]"), sec = $(".tp-mynote"); const open = !sec.classList.contains("is-open"); sec.classList.toggle("is-open", open); btn.classList.toggle("is-on", open); TRS.noteOpen = open; btn.setAttribute("aria-expanded", String(open)); if (open) setTimeout(() => $("#tr-mynote")?.focus(), 250); return; }
    if (t.closest("[data-tr-more]")) { TRS.moreOpen = !TRS.moreOpen; const m = $(".tp-menu"); if (m) m.hidden = !TRS.moreOpen; t.closest("[data-tr-more]").setAttribute("aria-expanded", String(TRS.moreOpen)); return; }
    const trOP = t.closest("[data-tr-open-panel]"); if (trOP) { TRS.moreOpen = false; TRS.panelTab = trOP.dataset.trOpenPanel; TRS.panel = true; renderPlayer(true); return; }
    if (TRS.moreOpen && !t.closest(".tp-more-wrap")) { TRS.moreOpen = false; const m = $(".tp-menu"); if (m) m.hidden = true; $("[data-tr-more]")?.setAttribute("aria-expanded", "false"); }
    if (t.closest("[data-tr-ask]")) { TRS.askOpen = !TRS.askOpen; const box = $(".tp-askbox"); t.closest("[data-tr-ask]").classList.toggle("is-on", TRS.askOpen); if (box) { box.hidden = !TRS.askOpen; if (TRS.askOpen) $("#tr-ask-text")?.focus(); } return; }
    if (t.closest("[data-tr-ask-cancel]")) { TRS.askOpen = false; const box = $(".tp-askbox"); if (box) box.hidden = true; return; }
    if (t.closest("[data-tr-ask-send]")) { sendQuestion(); return; }
    const tqS = t.closest("[data-tq-send]"); if (tqS) { replyToNote(tqS.dataset.tqSend); return; }
    const tqR = t.closest("[data-tq-resolve]"); if (tqR) { replyToNote(tqR.dataset.tqResolve, true); return; }
    const trT = t.closest("[data-tr-trainee]"); if (trT) { renderTraineeDrawer(trT.dataset.trTrainee); openOverlay($("#tr-drawer")); return; }
    const trdS = t.closest("[data-trd-send]"); if (trdS) { sendManagerNote(trdS.dataset.trdSend); return; }
    if (t.closest("[data-rail-toggle]")) { toggleRail(); return; }
    const inSync = t.closest("[data-in-sync]"); if (inSync) { if (!IN.loading) loadInsightsData(inSync); return; }
    if (t.closest("[data-pl-top]")) { t.closest(".pl-scroll-box")?.querySelector("[data-pl-scroll]")?.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); return; }
    const suM = t.closest("[data-su-mode]"); if (suM) { const [id, mode] = suM.dataset.suMode.split(":"); if (toolMode(id) !== mode) setToolMode(id, mode, suM); return; }
    const suE = t.closest("[data-su-erase]"); if (suE) { eraseArchived(suE); return; }
    if (t.closest("[data-range-clear]")) { PL.range = { preset: "all", from: "", to: "" }; saveRange(); PL.animate = true; renderPipeline(); return; }
    if (t.closest("[data-profile]")) { openProfile(); return; }
    if (t.closest("[data-prof-pick]")) { $("#prof-file")?.click(); return; }
    if (t.closest("[data-prof-remove]")) { PRF.photo = null; $("#prof-img").textContent = initials($("#prof-name").value || state.user.name); $(".prof-avatar").classList.remove("has-photo"); t.closest("[data-prof-remove]").remove(); return; }
    const pSave = t.closest("[data-prof-save]"); if (pSave) { saveProfile(pSave); return; }
    if (t.closest("[data-hp-toggle]")) { toggleHelper(); return; }
    if (t.closest("[data-hp-clear]")) { HP.msgs = []; try { sessionStorage.removeItem("hra_helper_" + state.user.uid); } catch {} renderHelper(); $("#hp-q")?.focus(); return; }
    const hpAsk = t.closest("[data-hp-ask]"); if (hpAsk) { askHelper(hpAsk.dataset.hpAsk); return; }
    const hpPipe = t.closest("[data-hp-pipe]"); if (hpPipe) {
      const [am, client] = hpPipe.dataset.hpPipe.split("|");
      toggleHelper(false); setTool("pipeline");
      setTimeout(() => { if (am) PL.am = am; PL.client = client || null; PL.animate = true; renderPipeline(); }, 200);
      return;
    }
    const hpNote = t.closest("[data-hp-note]"); if (hpNote) {
      const [client, id] = hpNote.dataset.hpNote.split("|");
      const am = PL.ams.find((a) => (a.clients || []).some((n) => sameName(n, client)));
      toggleHelper(false); setTool("pipeline");
      setTimeout(() => { if (am) PL.am = am.name; PL.client = client; renderPipeline(); setTimeout(() => openNote(id), 250); }, 200);
      return;
    }
    const hpTool = t.closest("[data-hp-tool]"); if (hpTool) { toggleHelper(false); setTool(hpTool.dataset.hpTool); return; }
    const hpReq = t.closest("[data-hp-request]"); if (hpReq) { toggleHelper(false); setTool("requests"); setTimeout(() => openNew(hpReq.dataset.hpRequest), 250); return; }
    const hpPer = t.closest("[data-hp-person]"); if (hpPer) {
      toggleHelper(false); setTool("contacts");
      setTimeout(() => { const c = $(`.fc[data-person="${hpPer.dataset.hpPerson}"]`); if (c) { c.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }); if (!c.classList.contains("is-flipped")) setTimeout(() => flipCard(c, true), 280); } }, 200);
      return;
    }
    if (t.closest("[data-hp-contacts]")) { toggleHelper(false); setTool("contacts"); return; }
    if (t.closest("[data-alert-compose]")) { openAlertComposer(); return; }
    if (t.closest("[data-alert-end]")) { endAlert(); return; }
    if (t.closest("[data-alert-ack]")) { ackTakeover(); return; }
    if (t.closest("[data-alert-more]")) { if (AL.cur) showTakeover(AL.cur); return; }
    const tpl = t.closest("[data-ac-tpl]"); if (tpl) { const x = ALERT_TEMPLATES[Number(tpl.dataset.acTpl)]; Object.assign(AL.draft, { level: x.level, minutes: x.minutes, title: x.title, message: x.message }); openAlertComposer(); return; }
    const lvB = t.closest("[data-ac-level]"); if (lvB) {
      AL.draft.level = lvB.dataset.acLevel;
      $$("[data-ac-level]").forEach((b) => { const on = b === lvB; b.classList.toggle("is-on", on); b.setAttribute("aria-checked", String(on)); });
      const sb = $(".ac-send"); if (sb) { sb.classList.toggle("is-festive", AL.draft.level === "festive"); $(".btn-text", sb).textContent = AL.draft.level === "festive" ? "Celebrate with everyone 🎉" : "Send to everyone"; }
      renderPreview(); return;
    }
    const mnB = t.closest("[data-ac-min]"); if (mnB) { AL.draft.minutes = Number(mnB.dataset.acMin); $$("[data-ac-min]").forEach((b) => b.setAttribute("aria-pressed", String(b === mnB))); renderPreview(); return; }
    if (t.closest("[data-notif-panel]")) { const p = $("#notif-pop"), open = p.hidden; NH.view = "list"; renderNotifPanel(); p.hidden = !open; $("#bell-btn").setAttribute("aria-expanded", String(open)); return; }
    const npT = t.closest("[data-np]"); if (npT) { NP[npT.dataset.np] = !NP[npT.dataset.np]; saveNP(); renderNotifPanel(); return; }
    const npM = t.closest("[data-np-mode]"); if (npM) { if (npM.dataset.npMode === "windows") enableWindows(); else { NP.mode = "dashboard"; saveNP(); renderNotifPanel(); refreshBell(); } return; }
    if (t.closest("[data-np-enable]")) { enableWindows(); return; }
    const ncV = t.closest("[data-nc-view]"); if (ncV) { NH.view = ncV.dataset.ncView; renderNotifPanel(); return; }
    if (t.closest("[data-nc-clear]")) {
      const n = notifItems().length;
      $("#notif-pop").hidden = true; $("#bell-btn").setAttribute("aria-expanded", "false");
      confirmDialog({ title: "Delete all notifications?", body: `This clears all ${n} notification${n === 1 ? "" : "s"} from your list. New ones will still show up here.`, confirm: "Delete all", danger: true }).then((yes) => {
        if (!yes) return;
        closeOverlay($("#confirm"));
        NH.read = { all: new Date().toISOString(), ids: [], cleared: new Date().toISOString() };
        saveRead(); refreshBell(); toast("Notifications cleared", "var(--muted)");
      });
      return;
    }
    if (t.closest("[data-nc-readall]")) { NH.read = { ...NH.read, all: new Date().toISOString(), ids: [] }; saveRead(); refreshBell(); renderNotifPanel(); return; }
    const ncI = t.closest("[data-nc]"); if (ncI) {
      const it = notifItems().find((x) => x.id === ncI.dataset.nc);
      if (!NH.read.ids.includes(ncI.dataset.nc)) { NH.read.ids.push(ncI.dataset.nc); saveRead(); }
      $("#notif-pop").hidden = true; $("#bell-btn").setAttribute("aria-expanded", "false"); refreshBell();
      it?.open(); return;
    }
    if (t.closest("[data-np-test]")) {
      unlockAudio();
      const kind = state.isAdmin ? "ticket" : "done";
      if (windowsReady()) {
        chime(kind);
        const ok = desktopNotify({ kind, title: "HRA Dashboard test", body: "Windows notifications are working. This is how alerts and request updates will appear." }, true);
        toast(ok ? "Test sent to Windows. Look at the bottom-right corner of your screen." : "The browser couldn't show a Windows notification.", ok ? "var(--s-progress)" : "#E2632B");
      } else {
        notify({ kind, title: "Test notification", body: "This is how notifications look inside the dashboard." });
        if (NP.mode === "windows") setTimeout(() => toast(desktopState() === "denied" ? "Windows notifications are blocked for this site in your browser settings." : "Select Windows above and allow notifications to get them outside the dashboard.", "#E0A800"), 600);
      }
      return;
    }
    if (!t.closest(".notif-wrap") && $("#notif-pop") && !$("#notif-pop").hidden) { $("#notif-pop").hidden = true; $("#bell-btn").setAttribute("aria-expanded", "false"); }
    const ddT = t.closest("[data-dd-toggle]");
    if (ddT) {
      const dd = ddT.closest(".dd"), open = !dd.classList.contains("is-open");
      closeDropdowns(dd);
      dd.classList.toggle("is-open", open); ddT.setAttribute("aria-expanded", String(open));
      if (open) ($(".dd-opt.is-selected", dd) || $(".dd-opt", dd))?.focus();
      return;
    }
    const ddO = t.closest("[data-dd-opt]");
    if (ddO) { const dd = ddO.closest(".dd"); closeDropdowns(); $(".dd-trigger", dd)?.focus(); ddSelect(dd.dataset.dd, ddO.dataset.ddOpt); return; }
    if (!t.closest(".dd")) closeDropdowns();
    const wr = t.closest("[data-w-remove]"); if (wr) { removeWidget(wr.dataset.wRemove); return; }
    const wt = t.closest("[data-w-toggle]"); if (wt) {
      const id = wt.dataset.wToggle; const was = IN.removed.has(id);
      was ? IN.removed.delete(id) : IN.removed.add(id); saveInsightsLayout(); IN.animate = false; renderInsights();
      if (was) $(`[data-widget="${id}"]`)?.classList.add("is-added");
      $(`[data-w-toggle="${id}"]`)?.focus(); return;
    }
    if (t.closest("[data-w-reset]")) { IN.removed = defaultRemoved(); saveInsightsLayout(); IN.animate = true; renderInsights(); toast("Dashboard reset to the default layout", "var(--s-progress)"); return; }
    if (t.closest("[data-in-customize]")) { IN.pop = IN.pop === "customize" ? null : "customize"; const pop = $(".cust-pop"); if (pop) pop.hidden = IN.pop !== "customize"; $("[data-in-customize]").setAttribute("aria-expanded", String(IN.pop === "customize")); return; }
    if (IN.pop && !t.closest(".cust-pop")) { IN.pop = null; const pop = $(".cust-pop"); if (pop) pop.hidden = true; $("[data-in-customize]")?.setAttribute("aria-expanded", "false"); }
    const ts = t.closest("[data-tsort]"); if (ts) { const k = ts.dataset.tsort; IN.tsort = { key: k, dir: IN.tsort.key === k ? -IN.tsort.dir : (k === "name" ? 1 : -1) }; IN.animate = false; renderInsights(); return; }
    if (t.closest("[data-action='signout']")) { state.store.signOut(); return; }
    const hb = t.closest("[data-hub]"); if (hb) { setTool(hb.dataset.hub); return; }
    if (t.closest("[data-rail-more]")) { setRailMore(!$("#rail-more")?.classList.contains("is-open")); return; }
    const tool = t.closest("[data-tool]"); if (tool) { setTool(tool.dataset.tool); return; }
    const ctTry = t.closest("[data-ct-try]"); if (ctTry) { CT.q = ctTry.dataset.ctTry; CT.cat = ""; $("#ct-q").value = CT.q; renderContactList(); $("#ct-q").focus(); return; }
    const ctP = t.closest("[data-ct-person]"); if (ctP) {
      const card = ctP.closest(".fc"), on = !card.classList.contains("is-flipped");
      if (on) $$(".fc.is-flipped").forEach((c) => { if (c !== card) flipCard(c, false); });
      flipCard(card, on); return;
    }
    if (t.closest("[data-ct-request]")) { setTool("requests"); setTimeout(() => openNew("general"), 250); return; }
    const ctCopy = t.closest("[data-ct-copy]"); if (ctCopy) { copyText(ctCopy.dataset.ctCopy).then((ok) => toast(ok ? `Copied ${ctCopy.dataset.ctCopy}` : "Couldn't copy the email", ok ? "var(--s-done)" : "#E2632B")); return; }
    const rpP = t.closest("[data-range-preset]"); if (rpP) { PL.range = { preset: rpP.dataset.rangePreset, from: "", to: "" }; PL.pop = null; saveRange(); PL.animate = true; renderPipeline(); $('[data-pop="range"]')?.focus(); return; }
    if (t.closest("[data-range-apply]")) {
      let f = $("#rp-from")?.value || "", to = $("#rp-to")?.value || "";
      if (!f && !to) { $("#rp-sum").textContent = "Pick a start and end date"; $("#rp-sum").classList.add("is-warn"); return; }
      if (f && to && f > to) [f, to] = [to, f];
      PL.range = { preset: "custom", from: f, to }; PL.pop = null; saveRange(); PL.animate = true; renderPipeline(); $('[data-pop="range"]')?.focus(); return;
    }
    const stF = t.closest(".st-pop [data-status-filter]"); if (stF) { const k = stF.dataset.statusFilter; PL.filter.has(k) ? PL.filter.delete(k) : PL.filter.add(k); renderSheet(); return; }
    if (t.closest("[data-status-clear]")) { PL.filter.clear(); PL.pop = null; renderSheet(); return; }
    const tnA = t.closest("[data-tn-add]"); if (tnA) { addTeamNote(tnA.dataset.tnAdd, tnA); return; }
    const tnD = t.closest("[data-tn-del]"); if (tnD) { deleteTeamNote(tnD.dataset.tnDel, tnD.dataset.tnAt); return; }
    const sdB = t.closest("[data-sd]"); if (sdB) { openStartPicker(sdB); return; }
    const sdC = t.closest("[data-sd-clear]"); if (sdC) { saveStartDate(sdC.dataset.sdClear, ""); return; }
    const clP = t.closest("[data-cl-pick]"); if (clP) { PL.pop = null; PL.clQ = ""; PL.animate = true; PL.client = clP.dataset.clPick; PL.filter.clear(); PL.search = ""; PL.colFilters = {}; renderPipeline(); return; }
    const clH = t.closest("[data-cl-hide]"); if (clH) { const name = clH.dataset.clHide; toggleHiddenClient(name); if (sameName(name, PL.client) && PL.hidden.has(name)) PL.client = null; renderPipeline(); return; }
    if (t.closest("[data-cl-hidden]")) { PL.clShowHidden = !PL.clShowHidden; renderClientList(amClients()); return; }
    const popBtn = t.closest("[data-pop]"); if (popBtn) { PL.pop = PL.pop === popBtn.dataset.pop ? null : popBtn.dataset.pop; renderPipeline(); if (PL.pop === "am") $(".am-option.is-selected")?.focus(); return; }
    const colT = t.closest("[data-col-toggle]"); if (colT) { const c = PL.cols.find((x) => x.key === colT.dataset.colToggle); if (c) { c.on = !c.on; saveColPrefs(); renderSheet(); $(`[data-col-toggle="${c.key}"]`)?.focus(); } return; }
    if (t.closest("[data-cols-reset]")) { PL.cols = defaultCols(); saveColPrefs(); renderSheet(); toast("Columns reset to the spreadsheet layout", "var(--s-progress)"); return; }
    const amb = t.closest("[data-am]"); if (amb) { PL.pop = null; PL.animate = true; PL.am = amb.dataset.am; PL.client = null; PL.filter.clear(); PL.search = ""; PL.colFilters = {}; renderPipeline(); $('[data-pop="am"]')?.focus(); return; }
    if (t.closest(".pop")) return;
    if (PL.pop) { PL.pop = null; renderPipeline(); }
    const ct = t.closest("[data-client]"); if (ct) { PL.animate = true; PL.client = ct.dataset.client; PL.filter.clear(); PL.search = ""; PL.colFilters = {}; renderPipeline(); return; }
    if (t.closest("[data-colf-clear]")) { PL.colFilters = {}; renderSheet(); return; }
    const sf = t.closest("[data-status-filter]"); if (sf) { const k = sf.dataset.statusFilter; PL.filter.has(k) ? PL.filter.delete(k) : PL.filter.add(k); renderSheet(); return; }
    if (t.closest("[data-sort-toggle]")) { PL.newest = !PL.newest; renderSheet(); return; }
    const dlw = t.closest("[data-pl-download]"); if (dlw) { downloadWorkbook(dlw); return; }
    const nb = t.closest("[data-note]"); if (nb) { openNote(nb.dataset.note); return; }
    const colBtn = t.closest("[data-collapse]"); if (colBtn) { toggleCollapse(colBtn); return; }
    const wk = t.closest("[data-week]"); if (wk) {
      const i = Number(wk.dataset.week);
      if (PL.weeksAll) { PL.weeksAll = false; PL.weekSel = [i]; }
      else if (PL.weekSel.includes(i)) { if (PL.weekSel.length > 1) PL.weekSel = PL.weekSel.filter((x) => x !== i); else { toast("Keep at least one week selected", "#E0A800"); return; } }
      else PL.weekSel = [...PL.weekSel, i].sort((a, b) => a - b);
      saveViewPrefs({ pipelineWeekSel: PL.weekSel }); renderSheet(); return;
    }
    if (t.closest("[data-weeks-all]")) { PL.weeksAll = !PL.weeksAll; renderSheet(); if (!PL.weeksAll) $(".sourcing")?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }); return; }
    const ser = t.closest("[data-series]"); if (ser) { const k = ser.dataset.series; IN.hidden.has(k) ? IN.hidden.delete(k) : IN.hidden.add(k); if (IN.hidden.size === 3) IN.hidden.delete(k); ser.classList.toggle("is-off", IN.hidden.has(k)); ser.setAttribute("aria-pressed", String(!IN.hidden.has(k))); drawTrend(); return; }
    const dim = t.closest("[data-in-dim]"); if (dim) { IN.dim = dim.dataset.inDim; IN.showAll = false; IN.animate = true; renderInsights(); return; }
    const pickE = t.closest("[data-in-pick]"); if (pickE) {
      const v = pickE.dataset.inPick, k = IN.dim === "am" ? "am" : IN.dim;
      if (k === "am") { IN.am = IN.am === v ? "" : v; IN.client = ""; IN.recruiter = ""; }
      else if (k === "client") { IN.client = IN.client === v ? "" : v; IN.recruiter = ""; }
      else IN.recruiter = IN.recruiter === v ? "" : v;
      IN.animate = true; renderInsights(); return;
    }
    if (t.closest("[data-in-more]")) { IN.showAll = !IN.showAll; IN.animate = true; renderInsights(); return; }
    if (t.closest("[data-in-clear]")) { IN.am = IN.client = IN.recruiter = ""; IN.animate = true; renderInsights(); return; }
    const tab = t.closest(".tab"); if (tab) { setTab(tab.dataset.tab); return; }
    const seg = t.closest(".seg-btn"); if (seg) { setSeg(seg.closest(".seg").id, seg.dataset.filter); return; }
    const meter = t.closest(".meter"); if (meter) { setSeg(meter.closest(".panel").dataset.panel + "-filter", meter.dataset.filter); return; }
    const nw = t.closest("[data-new]"); if (nw) { openNew(nw.dataset.new, nw.dataset.dir); return; }
    const pick = t.closest("[data-pick]"); if (pick) { openNew(pick.dataset.pick, "fwd"); return; }
    if (t.closest("[data-review-edit]")) { editFromReview(); return; }
    if (t.closest("[data-confirm-send]")) { sendNew(); return; }
    const ph = t.closest("[data-toggle-picker]"); if (ph) { togglePicker(ph.closest(".picker")); return; }
    const up = t.closest("[data-unpick]"); if (up) {
      const wrap = up.closest(".picker"), li = up.closest(".pick-row");
      li.classList.add("is-leaving");
      setTimeout(() => { li.remove(); refreshPicker(wrap); }, 200);
      return;
    }
    const chip = t.closest(".chip"); if (chip) {
      chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
      chip.closest(".field")?.classList.remove("is-invalid");
      return;
    }
    const set = t.closest("[data-set]"); if (set) { setStatus(set.dataset.set, set); return; }
    if (t.closest("[data-delete]")) { deleteTicket(); return; }
    const obI = t.closest("[data-ob]"); if (obI) { toggleChecklist(obI.dataset.ob); return; }
    const arc = t.closest("[data-archive]"); if (arc) { archiveTicket(arc.dataset.archive === "1"); return; }
    const arcV = t.closest("[data-archive-view]"); if (arcV) { const b = BOARDS.find((x) => x.id === arcV.dataset.archiveView); if (b) { boardState[b.id].archive = !boardState[b.id].archive; renderBoard(b); $(`.panel[data-panel="${b.id}"]`)?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" }); } return; }
    const rs = t.closest("[data-resend]"); if (rs) { resendEmail(rs); return; }
    const dr = t.closest("[data-draft]"); if (dr) {
      const tk = state.tickets.find((x) => x.id === dr.dataset.draft);
      if (tk) openDraft(tk).then((m) => { if (m === "opened-copied") toast("Details copied. Paste them into the email.", "var(--s-progress)"); if (state.openId) renderDrawer(); });
      return;
    }
    const cp = t.closest("[data-copy-details]"); if (cp) {
      const tk = state.tickets.find((x) => x.id === cp.dataset.copyDetails);
      if (tk) copyText(plainBody(tk)).then((ok) => toast(ok ? "Details copied" : "Couldn't copy. Select the text in the request instead.", ok ? "var(--s-done)" : "#E2632B"));
      return;
    }
    const drop = t.closest(".drop"); if (drop) { $(".drop-input", drop).click(); return; }
    const un = t.closest("[data-unstage]"); if (un) {
      const i = pending.findIndex((f) => f.id === un.dataset.unstage);
      if (i > -1) pending.splice(i, 1);
      const li = un.closest(".file"); li.classList.add("is-leaving"); setTimeout(renderPending, 220);
      return;
    }
    if (t.closest("[data-addfiles]")) { $("#drawer-files")?.click(); return; }
    const dl = t.closest("[data-dl]"); if (dl) {
      const tk = state.tickets.find((x) => x.id === state.openId);
      const a = tk?.attachments?.find((x) => x.id === dl.dataset.dl);
      if (a) downloadAttachment(tk.id, a, dl);
      return;
    }
    const view = t.closest("[data-view]"); if (view) { openViewer(state.openId, view.dataset.view); return; }
    if (t.closest("[data-lb]")) { stepViewer(Number(t.closest("[data-lb]").dataset.lb)); return; }
    if (t.closest("[data-lb-download]")) {
      const a = viewer.list[viewer.i]; if (a) downloadAttachment(viewer.ticketId, a, t.closest("[data-lb-download]"));
      return;
    }
    const row = t.closest(".ticket"); if (row) { openTicket(row.dataset.id); return; }
    if (t.closest("[data-close]")) { closeOverlay(t.closest(".overlay")); return; }
    if (t.classList.contains("overlay") && t.id !== "confirm") closeOverlay(t);
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches?.("[data-sd-input]")) { saveStartDate(e.target.dataset.sdInput, e.target.value); return; }
    if (e.target.id === "pl-from" || e.target.id === "pl-to") {
      PL.range[e.target.id === "pl-from" ? "from" : "to"] = e.target.value;
      if (PL.range.from && PL.range.to && PL.range.from > PL.range.to) [PL.range.from, PL.range.to] = [PL.range.to, PL.range.from];
      saveRange(); PL.animate = true; renderPipeline();
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id === "hp-form") { e.preventDefault(); const i = $("#hp-q"); const v = i.value; i.value = ""; askHelper(v); return; }
    if (e.target.id === "ac-form") { e.preventDefault(); sendAlert($(".ac-send", e.target)); return; }
    if (e.target.id === "new-form") { e.preventDefault(); submitNew(e.target); }
  });

  document.addEventListener("change", (e) => {
    if (e.target.classList?.contains("pick-select") && e.target.value) { addPick(e.target.closest(".picker"), e.target.value); return; }
    if (e.target.classList?.contains("pick-value")) e.target.classList.remove("is-missing");
    if (e.target.closest?.("#new-form")) applyShowIf($("#new-form"));
    if (e.target.classList?.contains("drop-input")) { stage(e.target.files); e.target.value = ""; }
    if (e.target.id === "drawer-files") { addFilesToTicket([...e.target.files]); e.target.value = ""; }
  });

  // Drag and drop onto the drop zone; block the browser from opening files dropped elsewhere.
  ["dragenter", "dragover"].forEach((ev) => document.addEventListener(ev, (e) => {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    const d = e.target.closest?.(".drop");
    $$(".drop.is-over").forEach((x) => x !== d && x.classList.remove("is-over"));
    if (d) d.classList.add("is-over");
  }));
  document.addEventListener("dragleave", (e) => { const d = e.target.closest?.(".drop"); if (d && !d.contains(e.relatedTarget)) d.classList.remove("is-over"); });
  document.addEventListener("drop", (e) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    $$(".drop.is-over").forEach((x) => x.classList.remove("is-over"));
    if (!$("#modal").hidden && $(".drop")) stage(e.dataTransfer.files);
    else if (!$("#drawer").hidden && $("#drawer-files")) addFilesToTicket([...e.dataTransfer.files]);
  });

  // Paste a screenshot straight into the form or an open request.
  document.addEventListener("paste", (e) => {
    const files = [...(e.clipboardData?.files || [])];
    if (!files.length) return;
    if (!$("#modal").hidden && $(".drop")) { e.preventDefault(); stage(files); toast(files.length > 1 ? "Files added" : "Screenshot added", "var(--s-progress)"); }
    else if (!$("#drawer").hidden && $("#drawer-files") && $("#confirm").hidden) { e.preventDefault(); addFilesToTicket(files); }
  });

  document.addEventListener("input", (e) => {
    if (e.target.matches?.("[data-sd-input]")) return;
    if (e.target.id === "cl-q") { PL.clQ = e.target.value; renderClientList(amClients()); return; }

    if (e.target.id === "rp-from" || e.target.id === "rp-to") {
      const a = $("#rp-from").value, b = $("#rp-to").value, sum = $("#rp-sum"); $(".rp-custom")?.classList.add("is-on");
      sum.classList.remove("is-warn");
      sum.textContent = a && b ? `${dayCount(a <= b ? a : b, a <= b ? b : a)} days selected` : a ? `From ${shortRange({ s: a, e: "9999-12-31" }).replace("From ", "")} onward` : b ? `Up to ${shortRange({ s: "0000-01-01", e: b }).replace("Until ", "")}` : "Pick a start and end date";
      return;
    }
    if (e.target.id === "ac-title" || e.target.id === "ac-msg") { if (AL.draft) { AL.draft.title = $("#ac-title").value; AL.draft.message = $("#ac-msg").value; renderPreview(); $("#ac-error").textContent = ""; } return; }
    if (e.target.id === "tr-mynote") { const st = courseSteps(TRS.course)[TRS.idx]; queueNoteSave(TRS.course.id, st.id, e.target.value); return; }
    if (e.target.id === "ct-q") { CT.q = e.target.value; CT.open = null; renderContactList(); return; }
    if (e.target.id === "pl-search") {
      PL.search = e.target.value;
      const pos = e.target.selectionStart;
      renderSheet();
      const inp = $("#pl-search"); inp.focus(); try { inp.setSelectionRange(pos, pos); } catch {}
      return;
    }
    if (e.target.dataset?.boardSearch) {
      const id = e.target.dataset.boardSearch;
      boardState[id].search = e.target.value;
      renderBoard(BOARDS.find((b) => b.id === id));
    }
    e.target.closest?.(".field.is-invalid")?.classList.remove("is-invalid");
  });

  document.addEventListener("pointerdown", (e) => { const g = e.target.closest?.("[data-col-grip]"); if (g) startColDrag(e, g); });

  document.addEventListener("keydown", (e) => {
    if (IN.pop && e.key === "Escape") { IN.pop = null; const pop = $(".cust-pop"); if (pop) pop.hidden = true; $("[data-in-customize]")?.focus(); return; }
    if (e.key === "/" && currentTool === "contacts" && !e.target.closest?.("input, textarea, select, [contenteditable]")) { e.preventDefault(); $("#ct-q")?.focus(); return; }
    if (e.key === "Escape" && e.target.id === "ct-q" && e.target.value) { e.target.value = ""; CT.q = ""; renderContactList(); return; }
    if (e.key === "Escape" && $(".alert-takeover")) { ackTakeover(); return; }
    if (currentTool === "training" && TRS.view === "player" && !e.target.closest?.("input, textarea, select") && !$(".overlay.is-open")) {
      if (e.key === "ArrowRight") { const b = $("[data-tr-next]"); if (b && !b.disabled) { e.preventDefault(); nextStep(); } return; }
      if (e.key === "ArrowLeft" && TRS.idx > 0) { e.preventDefault(); goStep(TRS.idx - 1, "back"); return; }
    }
    if (e.key === "Enter" && e.target.matches?.("[data-tq-input]")) { e.preventDefault(); replyToNote(e.target.dataset.tqInput); return; }
    if (e.key === "Escape" && HP.open && !$(".overlay.is-open")) { toggleHelper(false); $("#hp-bubble")?.focus(); return; }
    const openDd = $(".dd.is-open");
    if (openDd && e.key === "Escape") { closeDropdowns(); $(".dd-trigger", openDd)?.focus(); e.stopPropagation(); return; }
    if (openDd && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      const opts = $$(".dd-opt", openDd); const i = opts.indexOf(document.activeElement);
      opts[(i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length]?.focus(); e.preventDefault(); return;
    }
    // Pipeline popovers: Escape closes; arrows move through the account manager list and columns
    if (e.key === "Enter" && (e.target.id === "rp-from" || e.target.id === "rp-to")) { e.preventDefault(); $("[data-range-apply]")?.click(); return; }
    if (PL.pop && e.key === "Escape") { const which = PL.pop; PL.pop = null; renderPipeline(); $(`[data-pop="${which}"]`)?.focus(); e.stopPropagation(); return; }
    if (PL.pop === "am" && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      const opts = $$(".am-option"); const i = opts.indexOf(document.activeElement);
      const n = opts[(i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length]; n?.focus(); e.preventDefault(); return;
    }
    if (!PL.pop && e.target.matches?.('[data-pop="am"]') && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); PL.pop = "am"; renderPipeline(); $(".am-option.is-selected")?.focus(); return; }
    const grip = e.target.closest?.("[data-col-grip]");
    if (grip && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); moveCol(grip.closest(".col-item").dataset.col, e.key === "ArrowUp" ? -1 : 1); return; }
    if (e.key === "Escape") { const o = $$(".overlay:not([hidden])").pop(); if (o && o.id !== "confirm") closeOverlay(o); }
    if (!$("#lightbox").hidden && (e.key === "ArrowRight" || e.key === "ArrowLeft")) stepViewer(e.key === "ArrowRight" ? 1 : -1);
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("drop")) { e.preventDefault(); $(".drop-input", e.target).click(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("ticket")) { e.preventDefault(); openTicket(e.target.dataset.id); }
  });

  // Ripple
  document.addEventListener("pointerdown", (e) => {
    const b = e.target.closest(".btn");
    if (!b || reduceMotion) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(span);
    setTimeout(() => span.remove(), 650);
  });

  // Pointer light (fine pointers only)
  if (matchMedia("(pointer: fine)").matches && !reduceMotion) {
    const amb = $(".ambient"); let raf = 0;
    addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        amb.style.setProperty("--cx", e.clientX + "px");
        amb.style.setProperty("--cy", e.clientY + "px");
        const fc = e.target.closest?.(".fc:not(.fc-am)");
        $$(".fc.is-tilting").forEach((c) => { if (c !== fc) { c.classList.remove("is-tilting"); c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); } });
        if (fc) { const r = fc.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          fc.classList.add("is-tilting"); fc.style.setProperty("--ry", (x * 10).toFixed(2) + "deg"); fc.style.setProperty("--rx", (-y * 8).toFixed(2) + "deg");
          fc.style.setProperty("--mx", (x + .5) * 100 + "%"); fc.style.setProperty("--my", (y + .5) * 100 + "%"); }
        const tile = e.target.closest?.(".type-tile, .ct-card");
        if (tile) {
          const r = tile.getBoundingClientRect();
          tile.style.setProperty("--mx", e.clientX - r.left + "px");
          tile.style.setProperty("--my", e.clientY - r.top + "px");
        }
      });
    });
  }

  addEventListener("resize", () => { $$(".tabs, .seg").forEach(moveIndicator); moveRailGlow(); });
  // Donut: hovering a legend item or a segment highlights both
  document.addEventListener("pointerover", (e) => {
    const k = e.target.closest?.("[data-seg-key]")?.dataset.segKey || e.target.closest?.("[data-seg]")?.dataset.seg;
    const d = e.target.closest?.(".donut"); if (!d) return;
    d.classList.toggle("is-hovering", Boolean(k));
    $$("[data-seg], [data-seg-key]", d).forEach((x) => x.classList.toggle("is-hot", (x.dataset.seg || x.dataset.segKey) === k));
  });
  document.fonts?.ready.then(() => $$(".tabs, .seg").forEach(moveIndicator));
  setInterval(() => { if (state.user && state.loaded) renderAll(); }, 60000); // keep "x min ago" fresh
}

/* --------------------------------------------------------------------------
   Start
   -------------------------------------------------------------------------- */
(async function start() {
  bind();
  try {
    state.store = DEMO ? createDemoStore() : await createFirebaseStore();
  } catch (e) {
    console.error(e);
    $("#boot").innerHTML = `<p style="color:var(--muted);text-align:center;max-width:32ch">The Request Center couldn't start. Check your connection and refresh the page.</p>`;
    return;
  }
  $("#demo-entry").hidden = !state.store.demo;
  state.store.init(handleUser);
})();

/* ==========================================================================
   Tools rail
   ========================================================================== */
const TOOL_KEY = "hra_tool";
let currentTool = "requests";

/* Expandable "More" group at the bottom of the sidebar (remembered) */
function setRailMore(open, quiet) {
  const box = $("#rail-more"), btn = $("[data-rail-more]"); if (!box || !btn) return;
  box.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", String(open)); btn.classList.toggle("is-open", open);
  btn.setAttribute("aria-label", open ? "Hide more tools" : "Show more tools"); btn.title = open ? "Hide" : "More tools";
  if (!quiet) { try { localStorage.setItem("hra_rail_more", open ? "1" : "0"); } catch {} }
  setTimeout(moveRailGlow, 320);
}
(() => { let v = "0"; try { v = localStorage.getItem("hra_rail_more") || "0"; } catch {} setRailMore(v === "1", true); })();

function moveRailGlow() {
  const active = $("#rail .rail-item.is-active"), glow = $("#rail .rail-glow");
  if (!active || !glow) return;
  const horizontal = getComputedStyle($("#rail")).flexDirection === "row";
  glow.style.transform = horizontal ? `translateX(${active.offsetLeft}px)` : `translateY(${active.offsetTop}px)`;
  glow.style.width = active.offsetWidth + "px";
  glow.style.height = active.offsetHeight + "px";
}

/* ---------- Collapsible sidebar ---------- */
function applyRail(collapsed, animate) {
  const html = document.documentElement, btn = $("#rail-toggle"), rail = $(".rail");
  html.classList.toggle("rail-collapsed", collapsed);
  html.classList.remove("rail-settled");
  if (btn) { btn.setAttribute("aria-expanded", String(!collapsed)); btn.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar"); btn.title = collapsed ? "Expand sidebar" : "Collapse sidebar"; }
  const glow = $("#rail .rail-glow");
  if (animate && !reduceMotion) {
    if (rail && !$(".rail-edge", rail)) rail.insertAdjacentHTML("beforeend", '<span class="rail-edge" aria-hidden="true"></span>');
    rail?.classList.remove("is-moving"); void rail?.offsetWidth; rail?.classList.add("is-moving");
    btn?.classList.remove("is-pulse"); void btn?.offsetWidth; btn?.classList.add("is-pulse");
    glow?.classList.add("is-resizing");
    const t0 = performance.now();
    const follow = (now) => { moveRailGlow(); if (now - t0 < 450) requestAnimationFrame(follow); else { glow?.classList.remove("is-resizing"); rail?.classList.remove("is-moving"); if (html.classList.contains("rail-collapsed")) html.classList.add("rail-settled"); window.dispatchEvent(new Event("resize")); } };
    requestAnimationFrame(follow);
  } else {
    moveRailGlow();
    if (collapsed) html.classList.add("rail-settled");
  }
}
function toggleRail() {
  const collapsed = !document.documentElement.classList.contains("rail-collapsed");
  try { localStorage.setItem("hra_rail_collapsed", collapsed ? "1" : "0"); } catch {}
  applyRail(collapsed, true);
}
try { if (localStorage.getItem("hra_rail_collapsed") === "1") document.documentElement.classList.add("rail-collapsed", "rail-settled"); } catch {}

/* ---------- Super admin: tool switches ---------- */
const TOOLS = [
  { id: "requests", label: "Request Center", desc: "Tickets and requests", modes: ["all", "admins", "off", "maint"] },
  { id: "pipeline", label: "Client Pipeline", desc: "Candidates per client, from Workable", modes: ["all", "admins", "off", "maint"] },
  { id: "insights", label: "Insights", desc: "Performance numbers (admins only)", modes: ["admins", "off", "maint"], base: "admins" },
  { id: "org", label: "Org chart", desc: "Who reports to whom (admins only)", modes: ["admins", "off", "maint"], base: "admins" },
  { id: "training", label: "Training", desc: "Courses and team progress", modes: ["all", "admins", "off", "maint"] },
  { id: "contacts", label: "Who to contact", desc: "The contact directory", modes: ["all", "admins", "off", "maint"] },
  { id: "techcheck", label: "Tech checks", desc: "Candidate internet & computer results", modes: ["all", "admins", "off", "maint"] },
  { id: "sharepoint", label: "SharePoint link", desc: "Link to the team site", modes: ["all", "admins", "off"] },
  { id: "helper", label: "HRA Helper", desc: "The chat bubble", modes: ["all", "admins", "off"] }
];
const MODE_LABEL = { all: "Everyone", admins: "Admins only", off: "Only me", maint: "Maintenance" };
const MODE_EFFECT = { all: "Visible to everyone", admins: "Hidden from members", off: "Hidden from everyone except you", maint: "Others see a maintenance screen" };
const SET = { tools: {}, unsub: null };
const toolMode = (id) => { const t = TOOLS.find((x) => x.id === id); const m = SET.tools[id]; return t && t.modes.includes(m) ? m : (t?.base || "all"); };
function toolAccess(id) {
  const t = TOOLS.find((x) => x.id === id); if (!t) return "on";
  if ((id === "insights" || id === "org") && !state.isAdmin) return "hidden";
  const m = toolMode(id);
  if (state.isSuper) return "on";
  if (m === "all") return "on";
  if (m === "admins") return state.isAdmin ? "on" : "hidden";
  if (m === "maint") return "maint";
  return "hidden";
}
function firstOpenTool() {
  for (const t of ["requests", "pipeline", "training", "contacts", "insights"]) if (toolAccess(t) !== "hidden") return t;
  return "requests";
}
function applyAccess() {
  if (!state.user) return;
  for (const t of TOOLS) {
    const acc = toolAccess(t.id), m = toolMode(t.id);
    const item = t.id === "sharepoint" ? $("#rail-sharepoint") : t.id === "helper" ? null : $(`#rail [data-tool="${t.id}"]`);
    if (item) {
      item.hidden = acc === "hidden" || (t.id === "sharepoint" && !CFG.links?.sharepoint);
      item.classList.toggle("is-restricted", state.isSuper && m !== (t.base || "all"));
      item.dataset.flag = state.isSuper && m !== (t.base || "all") ? MODE_LABEL[m] : "";
      if (item.dataset.flag) item.title = `${t.label}: ${MODE_LABEL[m]} (only you see it this way)`; else item.removeAttribute("title");
    }
    if (t.id === "helper") { const am = $('#rail [data-tool="am"]'); if (am) am.hidden = !hubOpen().length; }
    if (t.id === "helper") { const h = $("#helper"); if (h) h.hidden = acc !== "on"; if (acc !== "on" && HP.open) toggleHelper(false); }
    const panel = $(`[data-tool-panel="${t.id}"]`);
    if (panel) {
      const maint = acc === "maint";
      panel.classList.toggle("is-maint", maint);
      let cover = $(":scope > .maint-cover", panel);
      if (maint && !cover) panel.insertAdjacentHTML("afterbegin", `<div class="maint-cover"><span class="maint-ico"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a4 4 0 0 0 5 5L13 18l-3 3-4-4 3-3 6.5-6.5a4 4 0 0 0-1-1z"/></svg></span><h2>${esc(t.label)} is under maintenance</h2><p>We're making some improvements. Please check back soon.</p></div>`);
      if (!maint) cover?.remove();
    }
  }
  const su = $('#rail [data-tool="super"]'); if (su) su.hidden = !state.isSuper;
  const oj = $("#pl-openjobs"); if (oj) oj.hidden = !state.isAdmin;
  if (currentTool && currentTool !== "super" && toolAccess(currentTool) === "hidden") setTool(firstOpenTool(), true);
  moveRailGlow();
}
function startSettings() {
  SET.unsub?.();
  SET.unsub = state.store.watchSettings((d) => { SET.tools = d?.tools || {}; applyAccess(); if (currentTool === "super") renderSuper(); });
}
function stopSettings() { SET.unsub?.(); SET.unsub = null; SET.tools = {}; }

const SUPER_ICONS = {
  requests: '<path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/>',
  pipeline: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M9 9.5V20"/>',
  insights: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 techcheck: '<path d="M3.5 18a8.5 8.5 0 1 1 17 0"/><path d="M12 18l4-6"/><circle cx="12" cy="18" r="1.3"/>',
  org: '<rect x="9" y="3" width="6" height="5" rx="1.5"/><rect x="3" y="16" width="6" height="5" rx="1.5"/><rect x="15" y="16" width="6" height="5" rx="1.5"/><path d="M12 8v4M6 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>',
  training: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  contacts: '<path d="M6 4h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z"/><circle cx="12.5" cy="9" r="2"/><path d="M9.5 13.5a3 3 0 0 1 6 0"/>',
  sharepoint: '<circle cx="11" cy="8" r="5"/><circle cx="16.5" cy="14" r="4"/><circle cx="10" cy="17" r="3"/>',
  helper: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>'
};
function peopleList() {
  const all = [...new Set([...SUPERS, ...ADMINS, ...MEMBERS])];
  return all.map((e) => {
    const p = PROF.byEmail.get(e);
    return { email: e, name: p?.name || nameFromEmail(e), uid: p?.uid, role: SUPERS.includes(e) && ADMINS.includes(e) ? "super" : ADMINS.includes(e) ? "admin" : "member", hasProfile: Boolean(p) };
  }).sort((a, b) => ({ super: 0, admin: 1, member: 2 }[a.role] - { super: 0, admin: 1, member: 2 }[b.role]) || a.name.localeCompare(b.name));
}
function renderSuper() {
  const root = $("#super-root"); if (!root || !state.isSuper) return;
  const people = peopleList();
  const count = (r) => people.filter((p) => p.role === r).length;
  const archived = state.tickets.filter((t) => t.archived);
  const oldest = archived.map((t) => t.archivedAt || "").filter(Boolean).sort()[0];
  const ROLE = { super: "Super admin", admin: "Admin", member: "Member" };
  root.innerHTML = `
    <div class="su">
      <header class="su-head"><h1 class="hero-title">Super admin</h1><p class="hero-sub">Only you can see this page.</p></header>

      <section class="su-card">
        <div class="su-card-head"><h2>Tools</h2><p>Choose who can see each tool. Changes apply right away for everyone who's signed in.</p></div>
        <div class="su-tools">${TOOLS.map((t) => { const m = toolMode(t.id); return `
          <div class="su-tool">
            <span class="su-tool-ico">${svgI(SUPER_ICONS[t.id] || "", 19)}</span>
            <span class="su-tool-text"><strong>${esc(t.label)}</strong><small>${esc(MODE_EFFECT[m])}</small></span>
            <div class="su-seg" role="radiogroup" aria-label="${esc(t.label)} visibility">${t.modes.map((x) => `<button type="button" role="radio" aria-checked="${x === m}" class="${x === m ? "is-on" : ""} m-${x}" data-su-mode="${t.id}:${x}">${esc(x === "admins" && t.id === "insights" ? "Admins" : MODE_LABEL[x])}</button>`).join("")}</div>
          </div>`; }).join("")}</div>
      </section>

      <section class="su-card">
        <div class="su-card-head"><h2>People</h2><p>${people.length} ${people.length === 1 ? "person has" : "people have"} access: ${count("super")} super admin, ${count("admin")} admin${count("admin") === 1 ? "" : "s"}, ${count("member")} member${count("member") === 1 ? "" : "s"}.</p></div>
        <div class="su-people">${people.map((p) => `
          <div class="su-person"><span class="ldr-avatar su-av">${avatarInner(p.name, p.uid, p.email)}</span>
            <span class="su-person-text"><strong>${esc(p.name)}</strong><small>${esc(p.email)}</small></span>
            ${p.hasProfile ? "" : `<span class="su-hint">No profile yet</span>`}
            <span class="su-role is-${p.role}">${ROLE[p.role]}</span></div>`).join("")}</div>
        <p class="su-note">To add someone or change an access type, update the lists in <code>config.js</code> and <code>firestore.rules</code> (then publish the rules), and add their login in Firebase → Authentication.</p>
      </section>

      <section class="su-card">
        <div class="su-card-head"><h2>Archived requests</h2><p>${archived.length ? `${archived.length} archived request${archived.length === 1 ? "" : "s"}${oldest ? `, the oldest archived ${esc(ago(oldest))}` : ""}. Erasing deletes them and their attachments for good.` : "The archive is empty."}</p></div>
        <div class="su-actions"><button type="button" class="btn su-danger" data-su-erase ${archived.length ? "" : "disabled"}><span class="btn-text">Erase ${archived.length || ""} archived request${archived.length === 1 ? "" : "s"}</span><span class="spinner" aria-hidden="true"></span></button></div>
      </section>
    </div>`;
}
async function setToolMode(id, mode, btn) {
  const prev = SET.tools[id];
  SET.tools = { ...SET.tools, [id]: mode };
  applyAccess(); renderSuper();
  try { await state.store.saveSettings({ tools: { [id]: mode }, updatedAt: new Date().toISOString(), updatedBy: state.user.name }); toast(`${TOOLS.find((t) => t.id === id).label}: ${MODE_LABEL[mode]}`, "var(--s-done)"); }
  catch (e) { console.error(e); SET.tools = { ...SET.tools, [id]: prev }; applyAccess(); renderSuper(); toast(e?.code === "permission-denied" ? "Saving is blocked. Publish the latest firestore.rules." : "That didn't save. Check your connection.", "#E2632B"); }
}
async function eraseArchived(btn) {
  const list = state.tickets.filter((t) => t.archived);
  if (!list.length) return;
  const yes = await confirmDialog({ title: `Erase ${list.length} archived request${list.length === 1 ? "" : "s"}?`, body: "They'll be deleted for good, including any attachments. This can't be undone.", confirm: "Erase", danger: true });
  if (!yes) return;
  closeOverlay($("#confirm"));
  btn.classList.add("is-loading"); btn.disabled = true;
  let ok = 0, failed = 0;
  for (const t of list) { try { await state.store.remove(t); ok++; } catch (e) { console.error(e); failed++; } }
  toast(failed ? `${ok} erased, ${failed} couldn't be deleted` : `${ok} archived request${ok === 1 ? "" : "s"} erased`, failed ? "#E2632B" : "var(--s-done)");
  renderSuper();
}

/* ---------- Profiles: display name + photo ---------- */
const PROF = { byUid: new Map(), byEmail: new Map(), unsub: null };
function avatarInner(name, uid, email) {
  const p = (uid && PROF.byUid.get(uid)) || (email && PROF.byEmail.get(lower(email)));
  return p?.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy" decoding="async"/>` : esc(initials(p?.name || name || "?"));
}
const displayName = (name, uid, email) => ((uid && PROF.byUid.get(uid)) || (email && PROF.byEmail.get(lower(email))))?.name || name;
function refreshUserUI() {
  if (!state.user) return;
  const me = PROF.byUid.get(state.user.uid);
  state.user.name = me?.name || state.user.baseName || state.user.name;
  $("#user-name").textContent = state.user.name;
  $("#user-role").textContent = state.isSuper ? "Super admin" : state.isAdmin ? "Admin" : "Team member";
  const av = $("#user-avatar"); av.innerHTML = avatarInner(state.user.name, state.user.uid, state.user.email); av.classList.toggle("has-photo", Boolean(me?.photo));
  const h = new Date().getHours();
  $("#greeting").textContent = `${h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, ${state.user.name.split(" ")[0]}`;
}
function startProfiles() {
  PROF.unsub?.();
  PROF.unsub = state.store.watchProfiles((list) => {
    PROF.byUid = new Map((list || []).map((p) => [p.uid, p]));
    PROF.byEmail = new Map((list || []).filter((p) => p.email).map((p) => [lower(p.email), p]));
    refreshUserUI();
    if (currentTool === "training") renderTraining();
  });
}
function stopProfiles() { PROF.unsub?.(); PROF.unsub = null; PROF.byUid = new Map(); PROF.byEmail = new Map(); }

const PRF = { photo: undefined };
function openProfile() {
  const me = PROF.byUid.get(state.user.uid) || {};
  PRF.photo = undefined; // undefined = unchanged, null = removed, string = new
  const photo = me.photo || null;
  $("#modal")?.classList.remove("is-picker");
  swapModal(`<div class="prof">
    <div class="prof-stage">
      <span class="prof-ring" aria-hidden="true"></span>
      <button type="button" class="prof-avatar${photo ? " has-photo" : ""}" data-prof-pick aria-label="Change your photo">
        <span class="prof-img" id="prof-img">${photo ? `<img src="${esc(photo)}" alt=""/>` : esc(initials(state.user.name))}</span>
        <span class="prof-cam" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg><small>Change photo</small></span>
      </button>
      <input type="file" id="prof-file" accept="image/png,image/jpeg,image/webp,image/heic" hidden />
    </div>
    <h2 id="modal-title" class="prof-title">Your profile</h2>
    <p class="prof-hint">Drop a photo on the circle, or click it to choose one. It's resized automatically.</p>
    <label class="field"><span class="field-label">Your name</span><input id="prof-name" maxlength="60" value="${esc(state.user.name)}" autocomplete="name" /></label>
    <div class="prof-email">${esc(state.user.email)} · ${state.isAdmin ? "Admin" : "Team member"}</div>
    <p class="form-error" id="prof-error" role="alert"></p>
    <div class="modal-actions">
      ${photo ? `<button type="button" class="btn btn-ghost prof-remove" data-prof-remove>Remove photo</button>` : ""}
      <button type="button" class="btn btn-ghost" data-close>Cancel</button>
      <button type="button" class="btn btn-primary" data-prof-save><span class="btn-text">Save</span><span class="spinner" aria-hidden="true"></span></button>
    </div>
  </div>`);
  const av = $(".prof-avatar");
  ["dragenter", "dragover"].forEach((ev) => av.addEventListener(ev, (e) => { e.preventDefault(); av.classList.add("is-drop"); }));
  ["dragleave", "drop"].forEach((ev) => av.addEventListener(ev, (e) => { e.preventDefault(); av.classList.remove("is-drop"); }));
  av.addEventListener("drop", (e) => { const f = e.dataTransfer?.files?.[0]; if (f) loadProfilePhoto(f); });
  $("#prof-file").addEventListener("change", (e) => { const f = e.target.files?.[0]; if (f) loadProfilePhoto(f); });
}
async function loadProfilePhoto(file) {
  const err = $("#prof-error");
  if (!/^image\//.test(file.type)) { err.textContent = "Please choose an image (JPG or PNG)."; return; }
  if (file.size > 15 * 1024 * 1024) { err.textContent = "That image is too large. Please pick one under 15 MB."; return; }
  err.textContent = "";
  try {
    const url = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const S = 256, c = document.createElement("canvas"); c.width = S; c.height = S;
    const ctx = c.getContext("2d"), side = Math.min(img.width, img.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
    let q = 0.86, out = c.toDataURL("image/jpeg", q);
    while (out.length > 60000 && q > 0.5) { q -= 0.08; out = c.toDataURL("image/jpeg", q); }
    PRF.photo = out;
    const box = $("#prof-img"); box.innerHTML = `<img src="${out}" alt=""/>`;
    const av = $(".prof-avatar"); av.classList.add("has-photo"); av.classList.remove("is-pop"); void av.offsetWidth; av.classList.add("is-pop");
  } catch (e) { console.error(e); err.textContent = "That image couldn't be read. Try a JPG or PNG."; }
}
async function saveProfile(btn) {
  const name = $("#prof-name").value.trim().replace(/\s+/g, " ");
  if (!name) { $("#prof-error").textContent = "Please enter your name."; $("#prof-name").focus(); return; }
  btn.classList.add("is-loading"); btn.disabled = true;
  const data = { name, email: state.user.email, updatedAt: new Date().toISOString() };
  if (PRF.photo !== undefined) data.photo = PRF.photo;
  try {
    await state.store.saveProfile(state.user.uid, data);
    const cur = PROF.byUid.get(state.user.uid) || {};
    PROF.byUid.set(state.user.uid, { ...cur, ...data, uid: state.user.uid }); PROF.byEmail.set(lower(state.user.email), PROF.byUid.get(state.user.uid));
    refreshUserUI();
    closeOverlay($("#modal"));
    toast("Profile saved", "var(--s-done)");
  } catch (e) {
    console.error(e); btn.classList.remove("is-loading"); btn.disabled = false;
    $("#prof-error").textContent = e?.code === "permission-denied" ? "Saving is blocked. An admin needs to publish the latest firestore.rules." : "Your profile couldn't be saved. Check your connection and try again.";
  }
}

/* Account Manager Dashboard: one sidebar item, three tools behind a switcher */
const HUB = [
  { id: "pipeline", label: "Client Pipeline", icon: '<path d="M4 5h16M4 12h16M4 19h10"/>' },
  { id: "training", label: "Training", icon: '<path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11.5V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.5"/>' },
  { id: "techcheck", label: "Tech checks", icon: '<path d="M3.5 18a8.5 8.5 0 1 1 17 0"/><path d="M12 18l4-6"/><circle cx="12" cy="18" r="1.3"/>' }
];
const HUB_KEY = "hra_hub_last";
const hubOpen = () => HUB.filter((h) => toolAccess(h.id) !== "hidden");
function renderHubNav(id) {
  const nav = $("#hub-nav"); if (!nav) return;
  const inHub = HUB.some((h) => h.id === id), list = hubOpen();
  nav.hidden = !inHub || list.length < 2;
  if (nav.hidden) return;
  nav.innerHTML = `<span class="hub-title">Account Manager Dashboard</span><div class="hub-seg" role="tablist"><span class="hub-pill" aria-hidden="true"></span>${list.map((h) => `<button type="button" class="hub-btn${h.id === id ? " is-on" : ""}" role="tab" aria-selected="${h.id === id}" data-hub="${h.id}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${h.icon}</svg>${h.label}<span class="hub-badge" data-hub-badge="${h.id}" hidden></span></button>`).join("")}</div>`;
  updateTrainingBadge();
  requestAnimationFrame(() => moveHubPill(true));
}
function moveHubPill(instant) {
  const on = $("#hub-nav .hub-btn.is-on"), pill = $("#hub-nav .hub-pill"); if (!on || !pill) return;
  if (instant) pill.style.transition = "none";
  pill.style.width = on.offsetWidth + "px"; pill.style.transform = `translateX(${on.offsetLeft - 4}px)`;
  if (instant) { void pill.offsetWidth; pill.style.transition = ""; }
}
addEventListener("resize", () => moveHubPill(true));

function setTool(id, silent) {
  if (id === "am") { const last = (() => { try { return localStorage.getItem(HUB_KEY); } catch { return ""; } })(); const list = hubOpen(); id = (list.find((h) => h.id === last) || list[0] || { id: "requests" }).id; }
  if (!$(`[data-tool-panel="${id}"]`)) id = "requests";
  if ((id === "insights" || id === "org") && !state.isAdmin) id = "requests";
  if (id === "super" && !state.isSuper) id = "requests";
  if (id !== "super" && toolAccess(id) === "hidden") id = firstOpenTool();
  const changed = id !== currentTool;
  currentTool = id;
  try { localStorage.setItem(TOOL_KEY, id); } catch {}
  const inHub = HUB.some((h) => h.id === id);
  if (inHub) { try { localStorage.setItem(HUB_KEY, id); } catch {} }
  $$("#rail .rail-item").forEach((b) => { const on = b.dataset.tool === id || (b.dataset.tool === "am" && inHub); b.classList.toggle("is-active", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  if ($("#rail-more .rail-item.is-active")) setRailMore(true, true);
  renderHubNav(id);
  $$("[data-tool-panel]").forEach((m) => {
    const on = m.dataset.toolPanel === id;
    m.hidden = !on;
    if (on && changed && !reduceMotion) { m.classList.remove("tool-in"); void m.offsetWidth; m.classList.add("tool-in"); }
  });
  $(".topbar").classList.toggle("is-tool-pipeline", id !== "requests");
  moveRailGlow();
  if (id !== "pipeline" && PL.unsub) pausePipeline();
  if (id !== "techcheck" && TC.unsub) { TC.unsub(); TC.unsub = null; }   // results stream only while the page is open
  if (id === "techcheck") startTech();
  if (id === "pipeline") startPipeline();
  if (id === "insights") { IN.animate = true; startInsights(); }
  if (id === "training") { renderTraining(); } else { document.body.classList.remove("in-course"); stopTeamWatch(); }
  if (id === "super") renderSuper();
  if (id === "org") startOrg();
  if (id === "contacts") { renderContacts(); if (!silent && matchMedia("(pointer: fine)").matches) setTimeout(() => $("#ct-q")?.focus({ preventScroll: true }), 350); }
  if (id === "requests") requestAnimationFrame(() => $$(".tabs, .seg").forEach(moveIndicator));
  if (!silent) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

/* ==========================================================================
   Dropdown (shared by the pipeline and Insights)
   ========================================================================== */
const CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function ddHTML(id, { label, value, options, align = "left", wide = false, triggerText = "", triggerIcon = "", primary = false }) {
  const cur = triggerText ? { label: triggerText } : options.find((o) => String(o.value) === String(value)) || options[0] || { label: "" };
  return `<div class="dd dd-${align}${wide ? " dd-wide" : ""}" data-dd="${esc(id)}">
    <button type="button" class="dd-trigger${primary ? " is-primary" : ""}" data-dd-toggle aria-haspopup="listbox" aria-expanded="false">
      ${triggerIcon}${label ? `<span class="dd-label">${esc(label)}</span>` : ""}<span class="dd-value">${esc(cur.label)}</span>
      <span class="dd-chev" aria-hidden="true">${CHEV}</span>
    </button>
    <div class="dd-menu pop" role="listbox" aria-label="${esc(label || "Options")}">
      ${options.map((o) => `<button type="button" role="option" class="dd-opt${String(o.value) === String(value) ? " is-selected" : ""}" data-dd-opt="${esc(String(o.value))}" aria-selected="${String(o.value) === String(value)}">
        ${o.dot ? `<span class="dd-dot" style="background:${o.dot}"></span>` : ""}<span class="dd-opt-text"><span>${esc(o.label)}</span>${o.sub ? `<small>${esc(o.sub)}</small>` : ""}</span><span class="dd-check">${CHECK}</span>
      </button>`).join("")}
    </div>
  </div>`;
}
function closeDropdowns(except) {
  $$(".dd.is-open").forEach((d) => { if (d !== except) { d.classList.remove("is-open"); $(".dd-trigger", d)?.setAttribute("aria-expanded", "false"); } });
}
function ddSelect(id, value) {
  if (id === "weeks") {
    const n = value === "all" ? 99 : Number(value) || 2;
    const total = (clientDoc(PL.client)?.sourcing || []).length || 8;
    PL.weekSel = Array.from({ length: Math.min(n, total) }, (_, i) => i);
    PL.weeksAll = false;
    saveViewPrefs({ pipelineWeekSel: PL.weekSel }); renderSheet(); return;
  }
  if (id === "tr-course") { TRS.teamCourse = value; renderTeam(); return; }
  if (id === "range") {
    PL.range.preset = value;
    if (value === "custom" && !PL.range.from && !PL.range.to) { const t = new Date(), a = new Date(); a.setDate(a.getDate() - 29); PL.range.from = isoDay(a); PL.range.to = isoDay(t); }
    saveRange(); PL.animate = true; renderPipeline(); return;
  }
  if (id.startsWith("in-")) { onInsightsSelect(id.slice(3), value); }
}

/* ==========================================================================
   Client Pipeline (Workable)
   ========================================================================== */
const WK = CFG.workable || {};
const PSTATUS = {
  passed:       { label: "Client has passed on this candidate", short: "Client passed", fill: "FFFFFF", bar: "#A3B1C6" },
  in_process:   { label: "In Process", short: "In process", fill: "FFF2CC", bar: "#E0A800" },
  no_show:      { label: "Interview No Show", short: "No show", fill: "FA8E8E", bar: "#E5484D" },
  hired:        { label: "Hired", short: "Hired", fill: "D9EAD3", bar: "#2F9E44" },
  fell_through: { label: "Hired no-show or quit/fired/declined offer", short: "Fell through", fill: "CFE2F3", bar: "#3B82C4" }
};
// Every column a person can show. The first nine are the spreadsheet's columns, in its order.
const PL_COLS = [
  { key: "name",        label: "Name of Candidate Submitted",     w: 12,   xw: 24, locked: true },
  { key: "role",        label: "Role Submitted for (Job Title)",  w: 12,   xw: 30 },
  { key: "dAM",         label: "Date Submitted to AM",            w: 7.9,  xw: 14, date: true },
  { key: "submitted",   label: "Date Submitted to HM",            w: 7.9,  xw: 14, date: true },
  { key: "dIR",         label: "Date HM Interview Requested",     w: 7.9,  xw: 14, date: true },
  { key: "dIS",         label: "Date HM Interview Scheduled",     w: 7.9,  xw: 14, date: true },
  { key: "dOP",         label: "Date Moved to Offer Prep",        w: 7.9,  xw: 14, date: true },
  { key: "dOA",         label: "Date Offer Accepted",             w: 7.9,  xw: 14, date: true },
  { key: "startDate",   label: "Start Date",                      w: 8.5,  xw: 16, date: true, manual: true },
  { key: "recruiter",   label: "Recruiter",                       w: 8.5,  xw: 16 },
  { key: "stage",       label: "Workable Status",                 w: 10,   xw: 22 },
  { key: "notes",       label: "Recruiter Notes",                 w: 13.5,   xw: 60, wrap: true },
  { key: "statusLabel", label: "Status",                          w: 8,    xw: 18 },
  { key: "daysOpen",    label: "Days since submitted",            w: 6,    xw: 12, extra: true, num: true }
];
const COL_BY_KEY = Object.fromEntries(PL_COLS.map((c) => [c.key, c]));
const defaultCols = () => PL_COLS.map((c) => ({ key: c.key, on: !c.extra }));

function cellValue(r, key) {
  if (key === "statusLabel") return PSTATUS[r.status]?.short || "";
  if (key === "startDate") return PL.edits?.[r.id]?.startDate || "";
  if (key === "stage") return r.stage ? r.stage + (r.dq ? " (disqualified)" : "") : "";
  if (key === "daysOpen") {
    if (!r.submitted) return "";
    const [y, m, d] = r.submitted.slice(0, 10).split("-").map(Number);
    return Math.max(0, Math.floor((Date.now() - new Date(y, m - 1, d)) / 86400e3));
  }
  return r[key] ?? "";
}
function visibleCols() {
  const list = (PL.cols || defaultCols()).filter((c) => c.on && COL_BY_KEY[c.key]).map((c) => COL_BY_KEY[c.key]);
  return list.length ? list : [COL_BY_KEY.name];
}

/* ---- per-person column layout: saved to their account (and cached in this browser) ---- */
function normalizeCols(saved) {
  if (Array.isArray(saved) && saved.some((c) => ["interview", "hired", "roleHired"].includes(c?.key))) return defaultCols();
  const known = (Array.isArray(saved) ? saved : []).filter((c) => COL_BY_KEY[c?.key]);
  const missing = PL_COLS.filter((c) => !known.some((k) => k.key === c.key)).map((c) => ({ key: c.key, on: !c.extra && !known.length }));
  const out = [...known.map((c) => ({ key: c.key, on: Boolean(c.on) })), ...missing];
  const name = out.find((c) => c.key === "name"); if (name) name.on = true;
  return out;
}
async function loadColPrefs() {
  const key = "hra_cols_" + state.user.uid;
  try { const cached = JSON.parse(localStorage.getItem(key)); if (cached) PL.cols = normalizeCols(cached); } catch {}
  try {
    const v = JSON.parse(localStorage.getItem("hra_view_" + state.user.uid)) || {};
    if (Array.isArray(v.pipelineWeekSel) && v.pipelineWeekSel.length) PL.weekSel = v.pipelineWeekSel.map(Number);
    if (Array.isArray(v.pipelineCollapsed)) PL.collapsed = new Set(v.pipelineCollapsed);
    if (Array.isArray(v.pipelineHidden)) PL.hidden = new Set(v.pipelineHidden);
    if (v.pipelineRange?.preset) PL.range = { preset: v.pipelineRange.preset, from: v.pipelineRange.from || "", to: v.pipelineRange.to || "" };
  } catch {}
  if (!PL.cols) PL.cols = defaultCols();
  try {
    const prefs = await state.store.getPrefs(state.user.uid);
    if (Array.isArray(prefs?.pipelineWeekSel) && prefs.pipelineWeekSel.length) { PL.weekSel = prefs.pipelineWeekSel.map(Number); if (PL.started) renderSheet(); }
    if (Array.isArray(prefs?.pipelineCollapsed)) { PL.collapsed = new Set(prefs.pipelineCollapsed); if (PL.started) renderSheet(); }
    if (prefs?.pipelineColumns) { PL.cols = normalizeCols(prefs.pipelineColumns); try { localStorage.setItem(key, JSON.stringify(PL.cols)); } catch {} if (PL.started) renderSheet(); }
  } catch (e) { console.warn("Column preferences not loaded", e); }
}
function saveViewPrefs(data) {
  try { localStorage.setItem("hra_view_" + state.user.uid, JSON.stringify({ ...(JSON.parse(localStorage.getItem("hra_view_" + state.user.uid)) || {}), ...data })); } catch {}
  state.store.setPrefs(state.user.uid, data).catch((e) => console.warn(e));
}
let colSaveTimer = null;
function saveColPrefs() {
  try { localStorage.setItem("hra_cols_" + state.user.uid, JSON.stringify(PL.cols)); } catch {}
  clearTimeout(colSaveTimer);
  colSaveTimer = setTimeout(() => state.store.setPrefs(state.user.uid, { pipelineColumns: PL.cols }).catch((e) => console.warn(e)), 600);
}
const PL = { colFilters: {}, hidden: new Set(), clQ: "", clShowHidden: false, range: { preset: "all", from: "", to: "" }, weekSel: [0, 1], weeksAll: false, collapsed: new Set(), pop: null, cols: null, animate: true, started: false, clients: [], meta: null, ams: [], am: null, client: null, filter: new Set(), search: "", newest: false, unsub: null, timer: null };

const fmtDay = (iso) => { if (!iso) return ""; const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number); return y ? `${m}/${d}/${y}` : String(iso); };
const sameName = (a, b) => lower(a) === lower(b);

function buildAms() {
  let ams = PL.store === "demo" ? demoAms() : (WK.accountManagers || []).map((a) => ({ ...a }));
  const assigned = new Set(ams.flatMap((a) => (a.clients || []).map(lower)));
  const loose = PL.clients.filter((c) => !assigned.has(lower(c.name))).map((c) => c.name);
  if (loose.length) ams.push({ name: "Unassigned", email: "", clients: loose, unassigned: true });
  ams.forEach((a) => { a.isMe = Boolean(a.email) && lower(a.email) === state.user.email; });
  return ams;
}

function startPipeline() {
  if (PL.started) return;
  PL.started = true;
  PL.cols = null;
  loadColPrefs();
  PL.testData = !state.store.demo && Boolean(WK.testData);
  PL.store = state.store.demo || PL.testData ? "demo" : "firebase";
  renderPipelineLoading();
  if (PL.store === "demo") {
    const synced = new Date(Date.now() - 11 * 60e3).toISOString();
    setTimeout(() => onPipelineData(demoClients().map((c) => ({ ...c, updatedAt: synced })), { ok: true, lastSync: synced, demo: true, test: PL.testData }), 160);
  } else {
    PL.unsub = state.store.watchPipeline(onPipelineData);
  }
  clearInterval(PL.timer);
  PL.timer = setInterval(renderSync, 30e3);
}

/* Leaving Client Pipeline: drop the live connection (data stays on screen for Insights/helper).
   Coming back within 30 minutes only costs the documents that changed, thanks to offline persistence. */
function pausePipeline() {
  PL.unsub?.(); PL.unsub = null; PL.started = false;
  clearInterval(PL.timer);
}

function stopPipeline() {
  Object.assign(IN, { am: "", client: "", recruiter: "", showAll: false, animate: true, data: null, pop: null, removed: defaultRemoved(), loadedAt: null, loading: false });
  insightsLayoutLoaded = false;
  PL.unsub?.(); PL.unsub = null; clearInterval(PL.timer);
  Object.assign(PL, { pop: null, cols: null, started: false, clients: [], meta: null, ams: [], am: null, client: null, filter: new Set(), search: "" });
}

function onPipelineData(clients, meta) {
  if (!PL.clients.length) PL.animate = true;
  PL.clients = clients || [];
  PL.meta = meta || null;
  PL.ams = buildAms();
  if (!PL.am || !PL.ams.some((a) => a.name === PL.am)) {
    // open on: me → an account manager with synced clients (or "Unassigned" if that's where the data is) → the first one
    const hasData = (a) => (a.clients || []).some((n) => PL.clients.some((c) => sameName(c.name, n) && (c.candidates || []).length));
    PL.am = (PL.ams.find((a) => a.isMe && hasData(a)) || PL.ams.find(hasData) || PL.ams.find((a) => a.isMe) || PL.ams[0])?.name || null;
  }
  renderPipeline();
  if (currentTool === "insights") renderInsights();
}

function amObj() { return PL.ams.find((a) => a.name === PL.am); }
function amClients() {
  const am = amObj();
  return (am?.clients || []).map((n) => PL.clients.find((c) => sameName(c.name, n)) || { name: n, candidates: [], sourcing: [], empty: true });
}

const clientDoc = (name) => PL.clients.find((c) => sameName(c.name, name));
function freshness() {
  const times = [PL.meta?.lastSync, PL.meta?.lastClientSync?.at, clientDoc(PL.client)?.updatedAt].filter(Boolean).map((t) => new Date(t).getTime());
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

/* Large clients are saved in parts (<id>__p2, __p3…) to stay under Firestore's 1 MB record limit; join them back. */
function mergeClientParts(list) {
  const parts = new Map();
  for (const d of list) if (d.partOf) { if (!parts.has(d.partOf)) parts.set(d.partOf, []); parts.get(d.partOf).push(d); }
  return list.filter((d) => !d.partOf).map((d) => {
    const extra = (parts.get(d.id) || []).sort((a, b) => (a.part || 0) - (b.part || 0));
    return extra.length ? { ...d, candidates: [...(d.candidates || []), ...extra.flatMap((p) => p.candidates || [])] } : d;
  });
}

function renderSync() {
  const el = $("#pl-sync"); if (!el) return;
  const m = PL.meta ? { ...PL.meta, lastSync: freshness() || PL.meta.lastSync } : null;
  el.className = "sync-chip";
  if (m?.running) {
    el.classList.add("is-running");
    $("span", el).textContent = "Updating from Workable";
    return;
  }
  if (m?.error === "permission-denied") { el.classList.add("is-bad"); $("span", el).textContent = "No access to Workable data"; return; }
  if (m?.mode === "first-load" && m.firstLoad?.total) { el.classList.add("is-wait"); $("span", el).textContent = `First load in progress: ${m.firstLoad.done} of ${m.firstLoad.total} jobs`; return; }
  if (!m || !m.lastSync) {
    if (m && PL.clients.length) { $("span", el).textContent = `${PL.clients.length} client${PL.clients.length === 1 ? "" : "s"} loaded, full sync pending`; el.title = "Some clients were refreshed one at a time; the first full load hasn't run yet."; return; }
    el.classList.add("is-wait"); $("span", el).textContent = PL.store === "demo" ? "Demo data" : "Waiting for first sync"; return;
  }
  if (m.ok === false) { el.classList.add("is-bad"); $("span", el).textContent = `Last sync failed, showing ${ago(m.lastSync)} data`; el.title = m.message || ""; return; }
  const mins = (Date.now() - new Date(m.lastSync)) / 60e3;
  if (mins > (WK.syncEveryMinutes || 30) * 6) el.classList.add("is-wait");
  $("span", el).textContent = m.test ? "Test data (made up)" : `${m.demo ? "Demo data, synced" : "Synced"} ${ago(m.lastSync)}`;
  el.title = m.lastSync ? `Last Workable sync: ${fullDate(m.lastSync)}` : "";
}

function renderPipelineLoading() {
  $("#pl-ams").innerHTML = `<span class="am-trigger is-skel"><span class="sk" style="width:150px"></span></span>`;
  $("#pl-clients").innerHTML = "";
  $("#pl-sheet").innerHTML = `<div class="sheet-card">${skeleton()}</div>`;
  renderSync();
}

function renderPipeline() {
  renderSync();
  const panel = $('[data-tool-panel="pipeline"]');
  let tb = $(".pl-testbar", panel);
  if (PL.meta?.test) {
    if (!tb) { panel.insertAdjacentHTML("afterbegin", `<div class="pl-testbar"><span class="pl-testbar-ico">${MSGR_ICONS.info}</span><div><strong>Test data</strong><span>These clients and candidates are made up, so you can try everything safely.${state.isAdmin ? " Admins: set <code>workable.testData</code> to <code>false</code> in config.js once Workable is connected." : ""}</span></div></div>`); }
  } else tb?.remove();
  const amsEl = $("#pl-ams");
  if (!PL.ams.length) {
    amsEl.innerHTML = "";
    $("#pl-clients").innerHTML = "";
    $("#pl-sheet").innerHTML = `<div class="sheet-card">${empty("No account managers set up yet", "Add account managers and their clients in config.js, under workable.accountManagers.").replace(/<li/g, "<div").replace(/<\/li>/g, "</div>")}</div>`;
    return;
  }
  const cur = amObj();
  const open = PL.pop === "am";
  const amLine = (a) => `<span class="am-avatar">${esc(a.unassigned ? "?" : initials(a.name))}</span>
      <span class="am-text"><span class="am-name">${esc(a.name)}</span><span class="am-sub">${(a.clients || []).length} client${(a.clients || []).length === 1 ? "" : "s"}</span></span>
      ${a.isMe ? `<span class="am-you">You</span>` : ""}`;
  amsEl.innerHTML = `
    <div class="am-select${open ? " is-open" : ""}">
      <button type="button" class="am-trigger${cur?.isMe ? " is-me" : ""}" data-pop="am" aria-haspopup="listbox" aria-expanded="${open}" aria-labelledby="pl-am-label">
        ${cur ? amLine(cur) : ""}
        <span class="am-chev" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>
      </button>
      <div class="am-menu pop" role="listbox" aria-label="Account managers" ${open ? "" : "hidden"}>
        ${PL.ams.map((a, i) => `
          <button type="button" role="option" class="am-option${a.name === PL.am ? " is-selected" : ""}${a.isMe ? " is-me" : ""}${a.unassigned ? " is-loose" : ""}" data-am="${esc(a.name)}" aria-selected="${a.name === PL.am}" style="--i:${i}">
            ${amLine(a)}
            <span class="am-check" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
          </button>`).join("")}
      </div>
    </div>`;

  const list = amClients();
  const visible = list.filter((c) => !PL.hidden.has(c.name));
  if (!PL.client || !list.some((c) => sameName(c.name, PL.client)) || (PL.hidden.has(PL.client) && visible.length)) PL.client = (visible[0] || list[0])?.name || null;
  renderClientPicker(list);
  $("#pl-download").disabled = !list.length;
  renderSheet();
}

/* ---------- Column filters: a small list of the values that exist in that column ---------- */
const COLF_BLANK = "(Blank)";
function colfValue(r, key) {
  const col = COL_BY_KEY[key]; let v = cellValue(r, key);
  if (col?.date) { if (!v || !/^\d{4}-\d{2}/.test(v)) return COLF_BLANK; const [y, m] = v.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString([], { month: "short", year: "numeric" }); }
  v = String(v ?? "").split("\n")[0].trim();
  return v ? (v.length > 70 ? v.slice(0, 70) + "…" : v) : COLF_BLANK;
}
function colfRows() {
  const c = clientDoc(PL.client); const rb = rangeBounds();
  return (c?.candidates || []).filter((r) => !rb || inRange(r, rb));
}
function openColf(key, anchor) {
  closeColf();
  const col = COL_BY_KEY[key]; if (!col) return;
  const counts = new Map();
  for (const r of colfRows()) { const v = colfValue(r, key); counts.set(v, (counts.get(v) || 0) + 1); }
  let vals = [...counts.entries()];
  if (col.date) vals.sort((a, b) => a[0] === COLF_BLANK ? 1 : b[0] === COLF_BLANK ? -1 : new Date("1 " + b[0]) - new Date("1 " + a[0]));
  else vals.sort((a, b) => a[0] === COLF_BLANK ? 1 : b[0] === COLF_BLANK ? -1 : b[1] - a[1] || a[0].localeCompare(b[0]));
  const sel = new Set(PL.colFilters[key] || []);
  const pop = document.createElement("div");
  pop.className = "colf-pop pop"; pop.id = "colf-pop"; pop.dataset.key = key;
  pop.innerHTML = `<div class="colf-head"><strong>${esc(col.label)}</strong>${sel.size ? `<button type="button" class="link-btn" data-colf-reset>Clear</button>` : ""}</div>
    ${vals.length > 8 ? `<label class="search colf-search"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg><input type="search" id="colf-q" placeholder="Search" autocomplete="off"/></label>` : ""}
    <div class="colf-list">${vals.length ? vals.map(([v, n], i) => `<button type="button" class="colf-opt${sel.has(v) ? " is-on" : ""}" data-colf-val="${esc(v)}" style="--i:${Math.min(i, 12)}"><span class="st-box"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="colf-v${v === COLF_BLANK ? " is-blank" : ""}" title="${esc(v)}">${esc(v)}</span><span class="st-n">${n}</span></button>`).join("") : `<p class="colf-none">Nothing to filter yet.</p>`}</div>`;
  document.body.appendChild(pop);
  const r = anchor.getBoundingClientRect(), w = 300;
  pop.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.right - w + 8)) + "px";
  pop.style.top = Math.min(r.bottom + 8, window.innerHeight - 140) + "px";
  pop.style.maxHeight = Math.max(160, window.innerHeight - r.bottom - 24) + "px";
  anchor.classList.add("is-open");
  setTimeout(() => $("#colf-q")?.focus(), 30);
}
function closeColf() { $("#colf-pop")?.remove(); $$(".colf-btn.is-open").forEach((b) => b.classList.remove("is-open")); }
function toggleColfValue(key, v) {
  const set = new Set(PL.colFilters[key] || []); set.has(v) ? set.delete(v) : set.add(v);
  if (set.size) PL.colFilters[key] = [...set]; else delete PL.colFilters[key];
  renderSheet();
  const btn = $(`[data-colf="${key}"]`); if (btn) openColf(key, btn);
}
document.addEventListener("click", (e) => {
  const t = e.target; if (!(t instanceof Element)) return;
  const b = t.closest("[data-colf]"); if (b) { e.stopPropagation(); $("#colf-pop")?.dataset.key === b.dataset.colf ? closeColf() : openColf(b.dataset.colf, b); return; }
  const pop = t.closest("#colf-pop");
  if (pop) { const o = t.closest("[data-colf-val]"); if (o) toggleColfValue(pop.dataset.key, o.dataset.colfVal); if (t.closest("[data-colf-reset]")) { delete PL.colFilters[pop.dataset.key]; renderSheet(); closeColf(); } return; }
  if ($("#colf-pop")) closeColf();
}, true);
document.addEventListener("input", (e) => { if (e.target.id !== "colf-q") return; const q = lower(e.target.value); $$("#colf-pop .colf-opt").forEach((o) => { o.hidden = q && !lower(o.dataset.colfVal).includes(q); }); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#colf-pop")) closeColf();
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.target.id === "tn-text") { e.preventDefault(); $("[data-tn-add]")?.click(); }
});
document.addEventListener("scroll", (e) => { if ($("#colf-pop") && !e.target?.closest?.("#colf-pop")) closeColf(); }, true);

const slug = (s) => lower(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "client";
/* ---------- Manual start dates: one small Firebase record per client, read only for the client on screen ---------- */
function watchClientEdits() {
  const id = PL.client ? slug(PL.client) : "";
  if (id === PL.editsFor) return;
  PL.editsUnsub?.(); PL.edits = {}; PL.teamNotes = {}; PL.editsFor = id;
  if (!id) return;
  PL.editsUnsub = state.store.watchEdits(id, (d) => {
    PL.edits = d?.starts || {}; PL.teamNotes = d?.notes || {};
    if (currentTool === "pipeline") renderSheet();
    if (PL.noteOpen && !$("#note-modal")?.hidden) renderNoteBody(PL.noteOpen);
  });
}
function openStartPicker(btn) {
  const id = btn.dataset.sd, cur = PL.edits?.[id]?.startDate || "";
  const td = btn.closest("td");
  td.innerHTML = `<span class="sd-edit"><input type="date" value="${esc(cur)}" data-sd-input="${esc(id)}" aria-label="Start date"/>${cur ? `<button type="button" class="sd-clear" data-sd-clear="${esc(id)}" aria-label="Remove start date" title="Remove">×</button>` : ""}</span>`;
  const inp = td.querySelector("input"); inp.focus(); try { inp.showPicker?.(); } catch {}
  inp.addEventListener("blur", () => setTimeout(() => { if (!td.contains(document.activeElement)) renderSheet(); }, 150));
}
async function saveStartDate(id, date) {
  const cid = slug(PL.client || "");
  PL.edits = { ...PL.edits }; if (date) PL.edits[id] = { startDate: date, by: state.user.name }; else delete PL.edits[id];
  renderSheet();
  try { await state.store.saveStart(cid, id, date, state.user.name); toast(date ? "Start date saved" : "Start date removed", "var(--s-done)"); }
  catch (e) { console.error(e); toast(e?.code === "permission-denied" ? "Saving is blocked. Publish the latest firestore.rules." : "Couldn't save the start date.", "#E2632B"); }
}

/* ---------- One client selector (replaces the row of tabs) ---------- */
function clientStats(c) {
  const inR = (c.candidates || []).filter((r) => inRange(r));
  const last = (c.candidates || []).map((r) => r.submitted || "").filter(Boolean).sort().pop() || "";
  const days = last ? Math.floor((Date.now() - new Date(last + "T12:00:00")) / 86400e3) : null;
  return { n: inR.length, live: inR.filter((r) => r.status === "in_process").length, last, days, inactive: days == null || days > 60 };
}
function clientRowHTML(c, isHidden) {
  const st = clientStats(c), cur = sameName(c.name, PL.client);
  const when = st.last ? (st.days === 0 ? "today" : st.days === 1 ? "yesterday" : st.days < 60 ? `${st.days} days ago` : new Date(st.last + "T12:00:00").toLocaleDateString([], { month: "short", year: "numeric" })) : "no submissions";
  return `<div class="cl-row${cur ? " is-current" : ""}${isHidden ? " is-hidden" : ""}">
    <button type="button" class="cl-pick" data-cl-pick="${esc(c.name)}" role="option" aria-selected="${cur}">
      <span class="cl-name">${esc(c.name)}${st.inactive && !isHidden ? `<em class="cl-inactive">Inactive</em>` : ""}</span>
      <span class="cl-meta">${st.live ? `<b><i></i>${st.live} in process</b> · ` : ""}${st.n} submitted · last ${esc(when)}</span>
    </button>
    <button type="button" class="cl-hide" data-cl-hide="${esc(c.name)}" title="${isHidden ? "Show this client again" : "Hide this client (only for you)"}" aria-label="${isHidden ? "Show" : "Hide"} ${esc(c.name)}">${isHidden ? `<span>Show</span>` : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3.2 3.8M6.4 7.6C4.2 9.2 3 12 3 12s4 6 9 6a8.6 8.6 0 0 0 3.4-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>`}</button>
  </div>`;
}
function renderClientList(list) {
  const box = $("#cl-list"); if (!box) return;
  const q = lower(PL.clQ.trim());
  const match = (c) => !q || lower(c.name).includes(q);
  const shown = list.filter((c) => !PL.hidden.has(c.name) && match(c));
  const hidden = list.filter((c) => PL.hidden.has(c.name) && match(c));
  box.innerHTML = (shown.length ? shown.map((c) => clientRowHTML(c, false)).join("") : `<p class="cl-empty">${q ? "No clients match." : "All clients are hidden."}</p>`)
    + (hidden.length ? `<button type="button" class="cl-hidden-head${PL.clShowHidden || q ? " is-open" : ""}" data-cl-hidden>Hidden clients <b>${hidden.length}</b><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
      ${PL.clShowHidden || q ? hidden.map((c) => clientRowHTML(c, true)).join("") : ""}` : "");
}
function renderClientPicker(list) {
  const el = $("#pl-clients"); if (!el) return;
  const c = list.find((x) => sameName(x.name, PL.client));
  const open = PL.pop === "client";
  const st = c ? clientStats(c) : null;
  const hiddenN = list.filter((x) => PL.hidden.has(x.name)).length;
  el.innerHTML = list.length ? `<div class="cl-select${open ? " is-open" : ""}">
      <button type="button" class="cl-trigger" data-pop="client" aria-haspopup="listbox" aria-expanded="${open}">
        <span class="cl-trigger-label">Client <em>${list.length - hiddenN} of ${list.length}</em></span>
        <span class="cl-trigger-name">${esc(c?.name || "Choose a client")}</span>
        ${st?.live ? `<span class="cl-live"><i></i>${st.live}</span>` : ""}
        <svg class="cl-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="cl-menu pop" ${open ? "" : "hidden"}>
        <label class="search cl-search"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg><input id="cl-q" type="search" placeholder="Find a client" value="${esc(PL.clQ)}" autocomplete="off"/></label>
        <div class="cl-list" id="cl-list" role="listbox" aria-label="Clients"></div>
        <p class="cl-foot">Hiding a client only changes your own view.</p>
      </div>
    </div>` : "";
  if (open) { renderClientList(list); setTimeout(() => { const q = $("#cl-q"); if (q && document.activeElement !== q) q.focus(); $(".cl-row.is-current")?.scrollIntoView({ block: "nearest" }); }, 30); }
}
function toggleHiddenClient(name) {
  PL.hidden.has(name) ? PL.hidden.delete(name) : PL.hidden.add(name);
  saveViewPrefs({ pipelineHidden: [...PL.hidden] });
  toast(PL.hidden.has(name) ? `${name} hidden. Find it under “Hidden clients”.` : `${name} is visible again`, "var(--s-progress)");
}

/* re-render the table when crossing the compact-date width */
{ let wasCompact = null, t = null; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { const c = compactDates(); if (wasCompact !== null && c !== wasCompact && currentTool === "pipeline") renderSheet(); wasCompact = c; }, 150); }); }

/* ---------- Candidate table inner scroll: fades + back-to-top ---------- */
function plScrollState(el) {
  const box = el?.closest(".pl-scroll-box"); if (!box) return;
  const up = el.scrollTop > 4, down = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
  box.classList.toggle("can-up", up); box.classList.toggle("can-down", down); box.classList.toggle("show-top", el.scrollTop > 320);
}
document.addEventListener("scroll", (e) => { if (e.target?.matches?.("[data-pl-scroll]")) plScrollState(e.target); }, true);
new MutationObserver(() => $$("[data-pl-scroll]").forEach(plScrollState)).observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("resize", () => $$("[data-pl-scroll]").forEach(plScrollState));

/* ---------- Date range ---------- */
const RANGE_OPTS = [
  { value: "all", label: "All dates" }, { value: "week", label: "This week" }, { value: "30", label: "Last 30 days" },
  { value: "month", label: "This month" }, { value: "lastmonth", label: "Last month" }, { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" }, { value: "custom", label: "Custom dates…" }
];
function rangeBounds(r = PL.range || {}) {
  const t = new Date(), iso = isoDay;
  const mk = (a, b) => ({ s: iso(a), e: iso(b) });
  switch (r.preset) {
    case "week": { const a = new Date(t); a.setDate(a.getDate() - ((a.getDay() + 6) % 7)); return mk(a, t); }
    case "30": { const a = new Date(t); a.setDate(a.getDate() - 29); return mk(a, t); }
    case "90": { const a = new Date(t); a.setDate(a.getDate() - 89); return mk(a, t); }
    case "month": return mk(new Date(t.getFullYear(), t.getMonth(), 1), t);
    case "lastmonth": return mk(new Date(t.getFullYear(), t.getMonth() - 1, 1), new Date(t.getFullYear(), t.getMonth(), 0));
    case "year": return mk(new Date(t.getFullYear(), 0, 1), t);
    case "custom": return (r.from || r.to) ? { s: r.from || "0000-01-01", e: r.to || "9999-12-31" } : null;
    default: return null;
  }
}
const inRange = (row, b = rangeBounds()) => !b || (row.submitted && row.submitted.slice(0, 10) >= b.s && row.submitted.slice(0, 10) <= b.e);
function rangeLabel(b = rangeBounds()) {
  if (!b) return "";
  const f = (d) => d.startsWith("0000") || d.startsWith("9999") ? "" : new Date(d + "T12:00:00").toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const a = f(b.s), z = f(b.e);
  return a && z ? `${a} – ${z}` : a ? `From ${a}` : `Until ${z}`;
}
function saveRange() { saveViewPrefs({ pipelineRange: PL.range }); }
const shortRange = (b) => {
  if (!b) return "";
  const f = (d, y) => new Date(d + "T12:00:00").toLocaleDateString([], { month: "short", day: "numeric", ...(y ? { year: "numeric" } : {}) });
  const sameYear = b.s.slice(0, 4) === b.e.slice(0, 4);
  if (b.s.startsWith("0000")) return `Until ${f(b.e, true)}`;
  if (b.e.startsWith("9999")) return `From ${f(b.s, true)}`;
  return `${f(b.s, !sameYear)} – ${f(b.e, true)}`;
};
const dayCount = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400e3) + 1;
function rangeButtonLabel() {
  const r = PL.range || {};
  if (r.preset === "custom") return shortRange(rangeBounds()) || "Custom dates";
  return (RANGE_OPTS.find((o) => o.value === r.preset) || RANGE_OPTS[0]).label;
}
function rangePopHTML() {
  const r = PL.range || {}, cur = rangeBounds();
  const from = r.preset === "custom" ? r.from : cur?.s || "", to = r.preset === "custom" ? r.to : cur?.e || "";
  const presets = RANGE_OPTS.filter((o) => o.value !== "custom");
  return `<div class="range-pop pop" role="dialog" aria-label="Choose a date range">
    <div class="rp-presets" role="listbox" aria-label="Quick ranges">
      ${presets.map((o, i) => { const b = rangeBounds({ preset: o.value }); const on = r.preset === o.value;
        return `<button type="button" role="option" aria-selected="${on}" class="rp-preset${on ? " is-on" : ""}" data-range-preset="${o.value}" style="--i:${i}">
          <span><strong>${esc(o.label)}</strong>${b ? `<small>${esc(shortRange(b))}</small>` : `<small>Every candidate</small>`}</span>
          <svg class="rp-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>`; }).join("")}
    </div>
    <div class="rp-custom${r.preset === "custom" ? " is-on" : ""}">
      <div class="rp-custom-head"><strong>Custom range</strong><small>By the date each candidate was submitted</small></div>
      <label class="rp-field"><span>From</span><input type="date" id="rp-from" value="${esc(from)}" /></label>
      <label class="rp-field"><span>To</span><input type="date" id="rp-to" value="${esc(to)}" /></label>
      <p class="rp-sum" id="rp-sum">${from && to ? `${dayCount(from <= to ? from : to, from <= to ? to : from)} days selected` : "Pick a start and end date"}</p>
      <div class="rp-actions"><button type="button" class="btn btn-ghost btn-mini" data-range-preset="all">Clear</button><button type="button" class="btn btn-primary btn-mini" data-range-apply>Apply</button></div>
    </div>
  </div>`;
}

function renderSheet() {
  watchClientEdits();
  const el = $("#pl-sheet");
  const c = amClients().find((x) => sameName(x.name, PL.client));
  if (!c) { el.innerHTML = `<div class="sheet-card">${emptyBlock("No clients for this account manager", "Add client names to this account manager in config.js.")}</div>`; return; }
  const extra = (WK.clients || {})[c.name] || {};
  const allRows = c.candidates || [];
  const rb = rangeBounds();
  const rows = rb ? allRows.filter((r) => inRange(r, rb)) : allRows;
  const counts = Object.fromEntries(Object.keys(PSTATUS).map((k) => [k, rows.filter((r) => r.status === k).length]));
  const s = lower(PL.search);
  let shown = rows.filter((r) => (!PL.filter.size || PL.filter.has(r.status)) && (!s || lower([r.name, r.role, r.recruiter, r.notes, r.interview, r.hired].join(" ")).includes(s)));
  // column filters: each column keeps a set of chosen values (dates grouped by month)
  const cf = Object.entries(PL.colFilters).filter(([, v]) => v && v.length);
  if (cf.length) shown = shown.filter((r) => cf.every(([k, vals]) => vals.includes(colfValue(r, k))));
  shown = shown.slice().sort((a, b) => (a.submitted || "").localeCompare(b.submitted || "") * (PL.newest ? -1 : 1));
  const interviewed = rows.filter((r) => /^y/i.test(r.interview || "")).length;
  const loc = c.location || extra.location, hrs = c.hours || extra.hours;
  const cols = visibleCols();
  const totalW = cols.reduce((n, col) => n + col.w, 0);

  el.innerHTML = `
    <div class="sheet-card">
      <header class="sheet-head">
        <div class="sheet-title">
          <h2>${esc(c.name)}</h2>
          ${loc ? `<span class="sheet-tag">${esc(loc)}</span>` : ""}${hrs ? `<span class="sheet-tag">${esc(hrs)}</span>` : ""}
          ${rb ? `<span class="range-chip"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>Submitted ${esc(rangeLabel(rb))}<button type="button" data-range-clear aria-label="Show all dates" title="Show all dates"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></span>` : ""}
        </div>
        <dl class="sheet-stats">
          <div><dt>Submitted</dt><dd>${rows.length}</dd></div>
          <div><dt>Interviews</dt><dd>${interviewed}</dd></div>
          <div><dt>In process</dt><dd>${counts.in_process}</dd></div>
          <div class="is-hired"><dt>Hired</dt><dd>${counts.hired}</dd></div>
        </dl>
      </header>

      ${collapseHead("candidates", "Submitted candidates", `${shown.length === rows.length ? rows.length : `${shown.length} of ${rows.length}`}`)}
      ${Object.keys(PL.colFilters).length ? `<div class="colf-bar"><span>Filtered by ${Object.keys(PL.colFilters).length} column${Object.keys(PL.colFilters).length === 1 ? "" : "s"}</span><button type="button" class="btn btn-ghost btn-mini" data-colf-clear>Clear filters</button></div>` : ""}
      <div class="collapse${PL.collapsed.has("candidates") ? " is-closed" : " is-settled"}" data-collapse-body="candidates"><div class="collapse-inner">
      <div class="sheet-tools">
        <div class="st-wrap">
          <button type="button" class="st-btn${PL.filter.size ? " is-active" : ""}" data-pop="status" aria-haspopup="dialog" aria-expanded="${PL.pop === "status"}">
            <span class="st-dots">${(PL.filter.size ? [...PL.filter] : Object.keys(PSTATUS)).slice(0, 5).map((k) => `<i style="--bar:${PSTATUS[k].bar}"></i>`).join("")}</span>
            <span>${PL.filter.size === 0 ? "All statuses" : PL.filter.size === 1 ? esc(PSTATUS[[...PL.filter][0]].short) : `${PL.filter.size} statuses`}</span>
            <svg class="range-chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          ${PL.pop === "status" ? `<div class="st-pop pop" role="dialog" aria-label="Filter by status">
            ${Object.entries(PSTATUS).map(([k, v], i) => `<button type="button" class="st-opt${PL.filter.has(k) ? " is-on" : ""}" data-status-filter="${k}" aria-pressed="${PL.filter.has(k)}" style="--bar:${v.bar};--sw:#${v.fill};--i:${i}"><span class="st-box"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="st-sw"></span><span class="st-name">${esc(v.short)}</span><span class="st-n">${counts[k]}</span></button>`).join("")}
            ${PL.filter.size ? `<button type="button" class="st-clear" data-status-clear>Show all statuses</button>` : ""}
          </div>` : ""}
        </div>
        <div class="sheet-tools-right">
          <div class="range-wrap">
            <button type="button" class="range-btn${rb ? " is-active" : ""}" data-pop="range" aria-haspopup="dialog" aria-expanded="${PL.pop === "range"}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg><span>${esc(rangeButtonLabel())}</span><svg class="range-chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button>
            ${PL.pop === "range" ? rangePopHTML() : ""}
          </div>
          <div class="cols-wrap">
            <button type="button" class="btn-mini" data-pop="cols" aria-haspopup="dialog" aria-expanded="${PL.pop === "cols"}">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="4" width="17" height="16" rx="2.5"/><path d="M9.5 4v16M15 4v16"/></svg>Columns<span class="cols-n">${cols.length}</span>
            </button>
            ${PL.pop === "cols" ? colsPopHTML() : ""}
          </div>
          <button type="button" class="btn-mini" data-sort-toggle title="Change order">${PL.newest ? "Newest first" : "Oldest first"}</button>
          <label class="search search-sm">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>
            <input type="search" id="pl-search" value="${esc(PL.search)}" placeholder="Search candidates" aria-label="Search candidates" />
          </label>
        </div>
      </div>

      ${!c.empty && allRows.length && !rows.length
        ? `<div class="range-empty">${emptyBlock("No candidates in this date range", `Nobody was submitted to ${c.name} ${rangeLabel(rb).toLowerCase().startsWith("from") || rangeLabel(rb).toLowerCase().startsWith("until") ? rangeLabel(rb).toLowerCase() : "between " + rangeLabel(rb)}.`)}<button type="button" class="btn btn-ghost" data-range-clear>Show all dates</button></div>`
        : c.empty || !rows.length
        ? emptyBlock("No submitted candidates yet", c.empty ? "Workable has no jobs matched to this client yet. Check the client name or the job's department in Workable." : "Candidates appear here once they reach a submitted stage in Workable.")
        : `<div class="pl-scroll-box"><div class="pl-table-wrap pl-scroll" data-pl-scroll><table class="pl-table${PL.animate ? " is-enter" : ""}" style="--tw:${Math.max(600, Math.round(cols.reduce((t, c) => t + c.w, 0) * 9))}px">
            <colgroup>${cols.map((col) => `<col style="width:${(col.w / totalW * 100).toFixed(2)}%">`).join("")}</colgroup>
            <thead><tr>${cols.map((col) => `<th class="col-${col.key}" scope="col"><span class="th-in"><span class="th-label">${esc(col.label)}</span><button type="button" class="colf-btn${PL.colFilters[col.key]?.length ? " is-on" : ""}" data-colf="${col.key}" aria-label="Filter ${esc(col.label)}" title="Filter">${PL.colFilters[col.key]?.length ? `<b>${PL.colFilters[col.key].length}</b>` : ""}<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6 7v6l-4 2v-8z"/></svg></button></span></th>`).join("")}</tr></thead>
            <tbody>${shown.length ? shown.map((r, i) => `
              <tr class="pl-row" data-status="${r.status}" style="--sw:#${PSTATUS[r.status]?.fill || "FFFFFF"};--bar:${PSTATUS[r.status]?.bar || "#A3B1C6"};--i:${Math.min(i, 18)}" title="${esc(PSTATUS[r.status]?.label || "")}">
                ${cols.map((col, ci) => cellHTML(r, col, ci === 0)).join("")}
              </tr>`).join("") : `<tr><td colspan="${cols.length}" class="pl-none">No candidates match. Clear the filters or search.</td></tr>`}
            </tbody></table></div><button type="button" class="pl-top" data-pl-top aria-label="Back to the top of the list" title="Back to top"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button></div>`}
      </div></div>
    </div>

    ${sourcingHTML(c)}`;
  PL.animate = false;
}

// On narrower screens the 13 columns need compact dates: 11/30/25 instead of 11/30/2025.
const compactDates = () => window.innerWidth < 1700;
function fmtDayFit(v) { const f = fmtDay(v); return compactDates() ? f.replace(/\/(\d{2})(\d{2})$/, "/$2") : f; }
function cellHTML(r, col, first) {
  let v = cellValue(r, col.key);
  if (col.date && /^\d{4}-/.test(v || "")) v = fmtDayFit(v);
  if (first) {
    const inner = col.key === "name" && r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(v)}</a>` : esc(v);
    return `<th scope="row" class="col-${col.key}">${inner}</th>`;
  }
  const tn = (PL.teamNotes?.[r.id] || []).length;
  if (col.key === "notes" && !v && tn) return `<td class="col-notes"><button type="button" class="note-btn" data-note="${esc(r.id)}" aria-label="Team notes for ${esc(r.name)}"><span class="tn-badge" title="${tn} team note${tn === 1 ? "" : "s"}">${tn} team note${tn === 1 ? "" : "s"}</span></button></td>`;
  if (col.key === "notes") return v
    ? `<td class="col-notes"><button type="button" class="note-btn" data-note="${esc(r.id)}" aria-label="Read the full notes for ${esc(r.name)}">${tn ? `<span class="tn-badge" title="${tn} team note${tn === 1 ? "" : "s"}">${tn}</span>` : ""}<span class="notes">${esc(v)}</span><span class="note-open" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></span></button></td>`
    : `<td class="col-notes"></td>`;
  if (col.key === "startDate") return `<td class="col-startDate"><button type="button" class="sd-cell${v ? " has-date" : ""}" data-sd="${esc(r.id)}" title="${v ? "Change the start date" : "Add a start date"}">${v ? esc(v) : `<span class="sd-add"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Add</span>`}</button></td>`;
  if (col.key === "statusLabel") return `<td class="col-statusLabel"><span class="st-dot" style="--bar:${PSTATUS[r.status]?.bar}"></span>${esc(v)}</td>`;
  return `<td class="col-${col.key}${col.num ? " num" : ""}${col.date ? " is-date" : ""}">${esc(v)}</td>`;
}

const GRIP = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
function colsPopHTML() {
  return `<div class="cols-pop pop" role="dialog" aria-label="Choose columns">
    <div class="cols-head">
      <strong>Columns</strong>
      <button type="button" class="link-btn" data-cols-reset>Reset to spreadsheet</button>
    </div>
    <p class="cols-hint">Drag to reorder, switch to show or hide. Saved to your account.</p>
    <ul class="cols-list" id="cols-list">
      ${PL.cols.map((c, i) => {
        const def = COL_BY_KEY[c.key];
        return `<li class="col-item${c.on ? " is-on" : ""}" data-col="${c.key}">
          <button type="button" class="col-grip" data-col-grip aria-label="Move ${esc(def.label)}" title="Drag, or use the arrow keys">${GRIP}</button>
          <span class="col-label">${esc(def.label)}${def.extra ? `<span class="col-new">Extra</span>` : ""}</span>
          ${def.locked
            ? `<span class="col-lock" title="Always shown">Always on</span>`
            : `<button type="button" class="switch" role="switch" aria-checked="${c.on}" data-col-toggle="${c.key}" aria-label="Show ${esc(def.label)}"><span></span></button>`}
        </li>`;
      }).join("")}
    </ul>
  </div>`;
}

function moveCol(key, delta) {
  const i = PL.cols.findIndex((c) => c.key === key), j = i + delta;
  if (i < 0 || j < 0 || j >= PL.cols.length) return;
  const [it] = PL.cols.splice(i, 1); PL.cols.splice(j, 0, it);
  saveColPrefs(); renderSheet();
  $(`#cols-list [data-col="${key}"] .col-grip`)?.focus();
}

// Pointer-based drag so it works with mouse, touch and pen.
function startColDrag(e, grip) {
  const li = grip.closest(".col-item"), list = li.parentElement;
  e.preventDefault();
  li.classList.add("is-dragging"); list.classList.add("is-sorting");
  document.body.classList.add("is-col-dragging");
  const move = (ev) => {
    if (ev.pointerId !== e.pointerId) return;
    ev.preventDefault();
    // auto-scroll the list near its edges
    const lr = list.getBoundingClientRect();
    if (ev.clientY < lr.top + 24) list.scrollTop -= 12; else if (ev.clientY > lr.bottom - 24) list.scrollTop += 12;
    const items = [...list.children].filter((x) => x !== li);
    const after = items.find((x) => { const r = x.getBoundingClientRect(); return ev.clientY < r.top + r.height / 2; });
    const first = [...list.children].map((x) => [x, x.getBoundingClientRect().top]);
    after ? list.insertBefore(li, after) : list.appendChild(li);
    // FLIP: animate the items that moved
    first.forEach(([x, top]) => { if (x === li) return; const d = top - x.getBoundingClientRect().top; if (d) { x.animate([{ transform: `translateY(${d}px)` }, { transform: "none" }], { duration: 180, easing: "cubic-bezier(.16,1,.3,1)" }); } });
  };
  const up = (ev) => {
    if (ev && ev.pointerId !== e.pointerId) return;
    window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    li.classList.remove("is-dragging"); list.classList.remove("is-sorting");
    document.body.classList.remove("is-col-dragging");
    const order = [...list.children].map((x) => x.dataset.col);
    PL.cols.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    saveColPrefs(); renderSheet();
  };
  window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
}

function openNote(id) {
  PL.noteOpen = String(id);
  if (!renderNoteBody(id)) return;
  openOverlay($("#note-modal"));
  setTimeout(() => $("#note-modal .sheet-close")?.focus(), 60);
}
function renderNoteBody(id) {
  const c = clientDoc(PL.client);
  const r = (c?.candidates || []).find((x) => String(x.id) === String(id));
  if (!r) return false;
  const st = PSTATUS[r.status] || PSTATUS.in_process;
  const D = (k) => (r[k] ? fmtDay(r[k]) : "");
  const fields = [["Submitted to AM", D("dAM")], ["Submitted to HM", D("submitted")], ["Interview requested", D("dIR")], ["Interview scheduled", D("dIS")],
    ["Offer prep", D("dOP")], ["Offer accepted", D("dOA")], ["Start date", cellValue(r, "startDate") ? fmtDay(cellValue(r, "startDate")) : ""], ["Recruiter", r.recruiter], ["Workable status", cellValue(r, "stage")]].filter(([, v]) => v);
  const team = (PL.teamNotes?.[r.id] || []).slice().sort((x, y) => String(y.at).localeCompare(String(x.at)));
  const draft = $("#tn-text")?.value || "";
  $("#note-body").innerHTML = `
    <div class="note-head">
      <span class="note-status" style="--sw:#${st.fill};--bar:${st.bar}"><i></i>${esc(st.short)}</span>
      <h2 id="note-title">${esc(r.name)}</h2>
      <p class="note-sub"><span>${esc(r.role)}</span><span class="note-sep" aria-hidden="true"></span><span>${esc(c.name)}</span></p>
    </div>
    <h3 class="tn-h">Recruiter notes <small>from Workable</small></h3>
    <div class="note-text">${esc(r.notes || "No notes in Workable.")}</div>
    <h3 class="tn-h">Team notes</h3>
    <div class="tn-add"><textarea id="tn-text" rows="2" maxlength="1000" placeholder="Add a note">${esc(draft)}</textarea><button type="button" class="btn btn-primary btn-mini" data-tn-add="${esc(r.id)}">Add note</button></div>
    <div class="tn-list">${team.length ? team.map((n, i) => `<div class="tn-item" style="--i:${i}"><div class="tn-meta"><strong>${esc(n.by || "Someone")}</strong><span>${esc(ago(n.at))}</span>${n.byUid === state.user.uid || state.isAdmin ? `<button type="button" class="tn-del" data-tn-del="${esc(r.id)}" data-tn-at="${esc(n.at)}" aria-label="Delete this note" title="Delete">×</button>` : ""}</div><p>${esc(n.text)}</p></div>`).join("") : `<p class="tn-empty">No team notes yet.</p>`}</div>
    <dl class="note-meta">${fields.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    ${r.link ? `<a class="btn btn-ghost note-link" href="${esc(r.link)}" target="_blank" rel="noopener">Open in Workable</a>` : ""}`;
  return true;
}
async function addTeamNote(candId, btn) {
  const ta = $("#tn-text"); const text = (ta?.value || "").trim();
  if (!text) { ta?.focus(); return; }
  const note = { text, by: state.user.name, byUid: state.user.uid, at: new Date().toISOString() };
  btn.disabled = true;
  PL.teamNotes = { ...PL.teamNotes, [candId]: [...(PL.teamNotes?.[candId] || []), note] };
  ta.value = ""; renderNoteBody(candId); renderSheet();
  try { await state.store.addTeamNote(slug(PL.client || ""), candId, note); toast("Note added", "var(--s-done)"); }
  catch (e) { console.error(e); toast(e?.code === "permission-denied" ? "Saving is blocked. Publish the latest firestore.rules." : "Couldn't save the note.", "#E2632B"); }
}
async function deleteTeamNote(candId, at) {
  const note = (PL.teamNotes?.[candId] || []).find((n) => n.at === at); if (!note) return;
  PL.teamNotes = { ...PL.teamNotes, [candId]: (PL.teamNotes[candId] || []).filter((n) => n !== note) };
  renderNoteBody(candId); renderSheet();
  try { await state.store.removeTeamNote(slug(PL.client || ""), candId, note); }
  catch (e) { console.error(e); toast("Couldn't delete the note.", "#E2632B"); }
}

function emptyBlock(title, text) {
  return `<div class="empty"><div class="empty-mark">${ICONS.inbox}</div><strong>${esc(title)}</strong>${esc(text)}</div>`;
}

function collapseHead(key, title, count) {
  const open = !PL.collapsed.has(key);
  return `<button type="button" class="section-toggle" data-collapse="${key}" aria-expanded="${open}">
    <span class="st-title">${esc(title)}</span>${count !== "" ? `<span class="st-count">${esc(count)}</span>` : ""}
    <span class="st-hint">${open ? "Hide" : "Show"}</span>
    <span class="st-chev" aria-hidden="true">${CHEV}</span>
  </button>`;
}

function toggleCollapse(btn) {
  const key = btn.dataset.collapse;
  const body = $(`[data-collapse-body="${key}"]`);
  const open = PL.collapsed.has(key);          // was closed, now opening
  open ? PL.collapsed.delete(key) : PL.collapsed.add(key);
  btn.setAttribute("aria-expanded", String(open));
  $(".st-hint", btn).textContent = open ? "Hide" : "Show";
  if (body) {
    body.classList.remove("is-settled");
    body.classList.toggle("is-closed", !open);
    if (open) setTimeout(() => { if (!PL.collapsed.has(key)) body.classList.add("is-settled"); }, reduceMotion ? 0 : 300);
  }
  saveViewPrefs({ pipelineCollapsed: [...PL.collapsed] });
}

const weekName = (i, iso) => i === 0 ? "This week" : i === 1 ? "Last week" : `Week ending ${fmtDay(iso).replace(/\/\d{4}$/, "")}`;
function selectedWeeks(all) {
  if (PL.weeksAll) return all.map((w, i) => [w, i]);
  const sel = PL.weekSel.filter((i) => i < all.length);
  return (sel.length ? sel : [0]).sort((a, b) => a - b).map((i) => [all[i], i]);
}

function sourcingHTML(c) {
  const all = c.sourcing || [];
  if (!all.length) return "";
  const picked = selectedWeeks(all);
  const selSet = new Set(PL.weekSel);
  const presets = [1, 2, 4].filter((k) => k < all.length).map((k) => ({ value: k, label: k === 1 ? "This week only" : `Last ${k} weeks` }));
  presets.push({ value: "all", label: `All ${all.length} weeks` });
  return `<div class="sourcing">
    ${collapseHead("sourcing", "Weekly sourcing numbers", PL.weeksAll ? `All ${all.length} weeks` : `${picked.length} of ${all.length} weeks`)}
    <div class="collapse${PL.collapsed.has("sourcing") ? " is-closed" : " is-settled"}" data-collapse-body="sourcing"><div class="collapse-inner">
      <div class="week-picker">
        <div class="wk-chips" role="group" aria-label="Weeks to show">
          ${all.map((w, i) => `<button type="button" class="wk-chip${(PL.weeksAll || selSet.has(i)) ? " is-on" : ""}" data-week="${i}" aria-pressed="${PL.weeksAll || selSet.has(i)}">
            <span class="wk-dot" aria-hidden="true"></span><span class="wk-name">${esc(i < 2 ? weekName(i) : fmtDay(w.weekEnding).replace(/\/\d{4}$/, ""))}</span>
          </button>`).join("")}
        </div>
        ${ddHTML("weeks", { label: "Quick pick", value: "", align: "right", options: presets, triggerText: "Choose" })}
      </div>
      <div class="sourcing-grid">
        ${picked.map(([w, i], k) => `
          <div class="sheet-card sourcing-card" style="--i:${k}">
            <div class="sourcing-week"><span>${esc(i < 2 ? weekName(i) + ", ending " + fmtDay(w.weekEnding) : "Week ending " + fmtDay(w.weekEnding))}</span><span class="sourcing-total">${(w.rows || []).reduce((t, r) => t + (Number(r.sourced) || 0), 0)} sourced</span></div>
            ${w.rows?.length ? `<div class="pl-table-wrap"><table class="pl-table pl-mini">
              <thead><tr><th scope="col">Day and role</th><th scope="col"># Sourced</th><th scope="col">Screened</th><th scope="col">Submitted</th></tr></thead>
              <tbody>${w.rows.map((r) => `<tr><th scope="row">${esc(r.day)} <span class="muted">${esc(r.role)}</span></th><td class="num">${r.sourced || ""}</td><td>${esc((r.screened || []).join(", "))}</td><td>${esc((r.submitted || []).join(", "))}</td></tr>`).join("")}</tbody>
            </table></div>` : `<p class="muted sourcing-none">No sourcing activity recorded this week.</p>`}
          </div>`).join("")}
      </div>
      ${all.length > 1 ? `<button type="button" class="show-all-weeks" data-weeks-all>${PL.weeksAll ? `Show only my selected weeks (${PL.weekSel.length})` : `Show all ${all.length} weeks`}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${PL.weeksAll ? 180 : 0}deg)"><path d="M6 9l6 6 6-6"/></svg></button>` : ""}
    </div></div>
  </div>`;
}

/* ---------- Excel export (same layout as the Weekly Hiring Update) ---------- */
let excelLib = null;
function loadExcel() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (excelLib) return excelLib;
  excelLib = new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
    sc.onload = () => res(window.ExcelJS);
    sc.onerror = () => { excelLib = null; rej(new Error("ExcelJS failed to load")); };
    document.head.appendChild(sc);
  });
  return excelLib;
}

async function downloadWorkbook(btn) {
  const am = amObj(), clients = amClients();
  if (!am || !clients.length) return;
  btn.classList.add("is-loading");
  try {
    const ExcelJS = await loadExcel();
    const wb = new ExcelJS.Workbook();
    wb.creator = "HRA Dashboard";
    const thin = { style: "thin", color: { argb: "FFB7B7B7" } };
    const box = { top: thin, left: thin, bottom: thin, right: thin };
    const fill = (hex) => ({ type: "pattern", pattern: "solid", fgColor: { argb: "FF" + hex } });
    const used = new Set();

    // manual start dates live in Firebase per client: load them for every client in this workbook
    const editsByClient = {};
    await Promise.all(clients.map(async (c) => { try { editsByClient[c.name] = (await state.store.getEdits(slug(c.name)))?.starts || {}; } catch { editsByClient[c.name] = {}; } }));
    const screenEdits = PL.edits;
    for (const c of clients) {
      PL.edits = editsByClient[c.name] || {};
      let name = c.name.replace(/[\[\]:*?/\\]/g, " ").slice(0, 31).trim() || "Client";
      while (used.has(name)) name = name.slice(0, 28) + " " + (used.size + 1);
      used.add(name);
      const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 2 }] });
      const xcols = visibleCols();
      const lastCol = String.fromCharCode(64 + Math.min(xcols.length, 26));
      ws.columns = xcols.map((col) => ({ width: col.xw }));
      const extra = (WK.clients || {})[c.name] || {};
      const loc = c.location || extra.location, hrs = c.hours || extra.hours;

      ws.mergeCells(`A1:${xcols.length > 1 ? lastCol : "B"}1`);
      const t = ws.getCell("A1");
      t.value = `${c.name}${loc ? ` (${loc})` : ""}${hrs ? ` ${hrs}` : ""}${rangeBounds() ? `  ·  Submitted ${rangeLabel()}` : ""}`;
      t.font = { bold: true, size: 16, name: "Arial" }; t.fill = fill("FFF2CC");
      ws.getRow(1).height = 26;

      const head = ws.getRow(2);
      xcols.forEach((col, i) => { const cell = head.getCell(i + 1); cell.value = col.label; cell.font = { bold: true, name: "Arial" }; cell.fill = fill("CFE2F3"); cell.border = box; cell.alignment = { vertical: "middle", wrapText: true }; });
      head.height = 32;

      let r = 3;
      for (const row of (c.candidates || []).filter((r) => inRange(r)).sort((a, b) => (a.submitted || "").localeCompare(b.submitted || ""))) {
        const xr = ws.getRow(r++);
        xcols.forEach((col, i) => {
          const k = col.key;
          const cell = xr.getCell(i + 1);
          let v = cellValue(row, k);
          if (v === "" || v == null) v = "";
          if (col.date && /^\d{4}-\d{2}-\d{2}/.test(v)) { const [y, m, d] = v.slice(0, 10).split("-").map(Number); v = new Date(Date.UTC(y, m - 1, d)); cell.numFmt = "m/d/yyyy"; }
          cell.value = v;
          cell.font = { name: "Arial", size: 10 };
          cell.fill = fill(PSTATUS[row.status]?.fill || "FFFFFF");
          cell.border = box;
          cell.alignment = { vertical: "top", wrapText: Boolean(col.wrap) };
        });
      }

      r += 3;
      for (const v of Object.values(PSTATUS)) {
        ws.mergeCells(`A${r}:B${r}`);
        const cell = ws.getCell(`A${r}`);
        cell.value = v.label; cell.fill = fill(v.fill); cell.border = box; cell.font = { name: "Arial", size: 10 };
        r++;
      }

      for (const [w] of selectedWeeks(c.sourcing || [])) {
        r += 2;
        ws.mergeCells(`A${r}:E${r}`);
        ws.getCell(`A${r}`).value = "Weekly Sourcing Numbers"; ws.getCell(`A${r}`).font = { bold: true, name: "Arial" };
        r++;
        const hdr = ws.getRow(r++);
        [`WE ${fmtDay(w.weekEnding)}`, "# Candidates Sourced", "Name of Candidates Screened", "Name of Candidates Submitted", "Recruiter Notes"].forEach((v, i) => {
          const cell = hdr.getCell(i + 1); cell.value = v; cell.font = { bold: true, name: "Arial", size: 10 }; cell.fill = fill("CFE2F3"); cell.border = box; cell.alignment = { wrapText: true };
        });
        for (const sr of w.rows || []) {
          const xr = ws.getRow(r++);
          [`${sr.day} - ${sr.role}`, sr.sourced || "", (sr.screened || []).join(", "), (sr.submitted || []).join(", "), ""].forEach((v, i) => {
            const cell = xr.getCell(i + 1); cell.value = v; cell.border = box; cell.font = { name: "Arial", size: 10 }; cell.alignment = { wrapText: true, vertical: "top" };
          });
        }
      }
      r += 2;
      ws.getCell(`A${r}`).value = `Generated from Workable on ${new Date().toLocaleString()}${PL.meta?.lastSync ? ` (data synced ${fullDate(PL.meta.lastSync)})` : ""}`;
      ws.getCell(`A${r}`).font = { italic: true, size: 9, color: { argb: "FF7A869A" }, name: "Arial" };
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const d = new Date();
    const rbx = rangeBounds();
    PL.edits = screenEdits;
    const fname = `Weekly Hiring Update - ${am.name}${rbx ? ` - ${rangeLabel(rbx).replace(/,/g, "")}` : ""} - ${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}.xlsx`.replace(/[\\/:*?"<>|]/g, "-");
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: fname });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(`Downloaded ${clients.length} client sheet${clients.length > 1 ? "s" : ""}`, "var(--s-done)");
  } catch (e) {
    console.error(e);
    toast("The spreadsheet couldn't be created. Check your connection and try again.", "#E2632B");
  } finally { btn.classList.remove("is-loading"); }
}

/* ---------- demo data (fictional; real candidate data never ships with the page) ---------- */
function demoAms() {
  return [
    { name: "Jennifer Whittle", email: "jennifer.whittle@demo.local", clients: ["Northwind Plumbing", "Summit Heating & Air", "Harbor Drain & Sewer"] },
    { name: "Jen Omohundro",    email: state.store?.demo ? (MEMBERS[0] || "employee@demo.local") : "jomohundro@hunterrecruitment.net", clients: ["Bright Spark Electric", "Evergreen Climate", "Copperline Plumbing"] },
    { name: "Katlin O’Steen",  email: "katlin.osteen@demo.local",    clients: ["Lakeside Home Builders", "Redwood Roofing"] },
    { name: "Megan Whitmyer",   email: "mwhitmyer@hunterrecruitment.net", clients: ["Blue Ridge HVAC", "Keystone Electric"] }
  ];
}

// A year of fictional activity so the pipeline and Insights have something real-looking to show.
function demoClients() {
  let seed = 11;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const first = ["Avery", "Blake", "Cameron", "Dakota", "Elliot", "Finley", "Gray", "Harper", "Jules", "Kendall", "Logan", "Morgan", "Noel", "Parker", "Quinn", "Rowan", "Sawyer", "Toby", "Val", "Wren", "Micah", "Reese", "Shay", "Tatum"];
  const last = ["Adler", "Brennan", "Castillo", "Dorsey", "Ellison", "Fairbanks", "Gallo", "Hendrix", "Ibarra", "Jansen", "Kowalski", "Lindqvist", "Marsh", "Novak", "Ortega", "Pruitt", "Quintero", "Rhodes", "Sterling", "Thorne", "Vance", "Whitaker"];
  // recruiter: [name, skill] (skill nudges interview and hire odds so the leaderboard has a story)
  const R = { sam: ["Sam Carter", 1.25], riley: ["Riley Park", 1.0], casey: ["Casey Nguyen", .85], jordan: ["Jordan Ellis", 1.1], dana: ["Dana Ruiz", .95], avery: ["Avery Cole", 1.15] };
  const defs = [
    ["Northwind Plumbing", "Austin, TX", "15 hours/wk", ["Residential Service Plumber", "CSR", "Inside Sales"], ["sam", "riley"], 1.2],
    ["Summit Heating & Air", "Quincy, MA", "20 hours/wk", ["HVAC Service Technician", "HVAC Comfort Advisor"], ["casey", "sam"], 1.0],
    ["Harbor Drain & Sewer", "Buffalo, NY", "4 hours/wk", ["Sewer Technician", "Dispatcher"], ["dana"], .6],
    ["Bright Spark Electric", "Romeo, MI", "10 hours/wk", ["Journeyman Electrician", "Generator Technician"], ["jordan", "casey"], .9],
    ["Evergreen Climate", "Elgin, IL", "20 hours/wk", ["HVAC Tech", "Lead HVAC Installer"], ["avery", "jordan"], 1.1],
    ["Copperline Plumbing", "Arlington Heights, IL", "30 hours/wk", ["Service Plumber", "Sewer Technician"], ["sam", "avery"], 1.3],
    ["Lakeside Home Builders", "Chattanooga, TN", "20 hours/wk", ["Project Manager", "Production Manager"], ["riley"], .7],
    ["Redwood Roofing", "Sacramento, CA", "10 hours/wk", ["Roofing Foreman", "Estimator"], ["dana", "riley"], .8],
    ["Blue Ridge HVAC", "Asheville, NC", "15 hours/wk", ["HVAC Service Technician", "CSR"], ["avery", "casey"], 1.0],
    ["Keystone Electric", "Harrisburg, PA", "15 hours/wk", ["Residential Electrician", "Service Manager"], ["jordan", "dana"], .9]
  ];
  const notesBy = {
    passed: ["HM passed. Rejection sent.", "Pass, not enough residential experience.", "Commute too far per client.", "Client passed after phone screen.", "Salary expectations too high for the role."],
    in_process: ["Submitted to HM, waiting for feedback.", "Client likes the resume, scheduling next step.", "2nd interview being scheduled.", "Background check in progress."],
    no_show: ["No show to in person interview.", "No call no show to Zoom.", "Confirmed the day before, then didn't show."],
    hired: ["Offer accepted. Great culture fit, the team loved him.", "Started Monday, going well.", "Offer accepted after second interview with the owner."],
    fell_through: ["Declined offer for higher pay elsewhere.", "Accepted, then no show on first day.", "Current employer countered and he stayed."]
  };
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const iso = (d) => { const x = new Date(today.getTime() - d * 86400e3); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const md = (d) => { const x = new Date(today.getTime() - d * 86400e3); return `${x.getMonth() + 1}/${x.getDate()}`; };

  return defs.map(([name, location, hours, roles, recs, volume], ci) => {
    const n = Math.round((22 + rnd() * 20) * volume);
    const candidates = Array.from({ length: n }, (_, i) => {
      // more activity in recent months, plus a spring bump
      const daysAgo = Math.floor(Math.pow(rnd(), 1.35) * 360);
      const [recruiter, skill] = R[pick(recs)];
      const role = pick(roles);
      const interviewed = rnd() < .5 * skill;
      let status;
      if (daysAgo < 14) status = rnd() < .75 ? "in_process" : "passed";
      else if (!interviewed) status = rnd() < .9 ? "passed" : "in_process";
      else {
        const r = rnd() / skill;
        status = r < .30 ? "hired" : r < .40 ? "fell_through" : r < .54 ? "no_show" : r < .64 && daysAgo < 45 ? "in_process" : "passed";
      }
      const ivDay = daysAgo - (2 + Math.floor(rnd() * 6));
      const hireDay = ivDay - (5 + Math.floor(rnd() * 16));
      const reachedInterview = interviewed && ivDay >= 0;
      const isHire = (status === "hired" || status === "fell_through") && hireDay >= 0;
      if ((status === "hired" || status === "fell_through") && !isHire) status = "in_process";
      return {
        id: `d${ci}-${i}`, name: `${pick(first)} ${pick(last)}`, role, submitted: iso(daysAgo),
        interview: reachedInterview ? `Y - ${pick(["In person", "Zoom", "Phone"])} ${md(ivDay)}` : status === "passed" && rnd() < .6 ? "N" : "",
        interviewAt: reachedInterview ? iso(ivDay) : "",
        hired: status === "hired" ? "Y" : status === "fell_through" ? "N - " + pick(["declined offer", "no show day 1", "stayed with employer"]) : "",
        hiredAt: isHire ? iso(hireDay) : "",
        roleHired: status === "hired" ? role : "",
        startDate: status === "hired" ? iso(Math.max(hireDay - 14, -21)) : "",
        recruiter, notes: pick(notesBy[status]) + (rnd() < .3 ? `\n${md(Math.max(daysAgo - 3, 0))} Follow-up: ${pick(["candidate confirmed availability", "client asked for a second interview", "sent reminder text", "references checked, all positive"])}.` : ""),
        status, link: "",
        dAM: iso(daysAgo + 1 + Math.floor(rnd() * 3)),
        dIR: reachedInterview ? iso(ivDay + 1) : "",
        dIS: reachedInterview ? iso(ivDay) : "",
        dOP: isHire ? iso(hireDay + 3) : "",
        dOA: status === "hired" ? iso(hireDay + 1) : "",
        stage: status === "hired" ? "Hired" : status === "in_process" ? (reachedInterview ? "Hiring Mgr Interview Scheduled" : "Submitted to Hiring Manager") : status === "fell_through" ? "Offer Prep/Made" : "Submitted to Hiring Manager",
        dq: status === "passed" || status === "no_show" || status === "fell_through"
      };
    }).sort((a, b) => a.submitted.localeCompare(b.submitted));

    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + ((5 - weekEnd.getDay() + 7) % 7));
    const sourcing = Array.from({ length: 8 }, (_, w) => {
      const end = new Date(weekEnd.getTime() - w * 7 * 86400e3);
      return {
        weekEnding: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`,
        rows: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].flatMap((day) => roles.slice(0, 2).map((role) => ({
          day, role, sourced: Math.floor(rnd() * 14 * volume), screened: rnd() < .35 ? [`${pick(first)} ${pick(last)}`] : [], submitted: rnd() < .2 ? [`${pick(first)} ${pick(last)}`] : []
        })))
      };
    });
    return { id: `demo-${ci}`, name, location, hours, candidates, sourcing };
  });
}

/* ==========================================================================
   Insights (admins only): a summary of the Client Pipeline data
   ========================================================================== */
const IN_WIDGETS = [
  { id: "k_submitted", label: "Submitted", group: "Numbers" },
  { id: "k_interviews", label: "Interviews", group: "Numbers" },
  { id: "k_hires", label: "Hires", group: "Numbers" },
  { id: "k_rate", label: "Hire rate", group: "Numbers" },
  { id: "k_ivrate", label: "Interview rate", group: "Numbers", off: true },
  { id: "k_days", label: "Days to hire", group: "Numbers" },
  { id: "k_noshows", label: "No-shows", group: "Numbers" },
  { id: "k_fell", label: "Fell through", group: "Numbers", off: true },
  { id: "trend", label: "Activity over time", group: "Charts and tables" },
  { id: "funnel", label: "Hiring funnel", group: "Charts and tables" },
  { id: "board", label: "Leaderboard", group: "Charts and tables" },
  { id: "donut", label: "Where candidates ended up", group: "Charts and tables" },
  { id: "table", label: "Performance table", group: "Charts and tables", off: true }
];
const defaultRemoved = () => new Set(IN_WIDGETS.filter((w) => w.off).map((w) => w.id));
const IN = { removed: defaultRemoved(), pop: null, tsort: { key: "hires", dir: -1 }, period: "180d", am: "", client: "", recruiter: "", dim: "recruiter", metric: "hires", hidden: new Set(), showAll: false, ro: null, animate: true };
const PERIODS = [
  { value: "30d", label: "Last 30 days", days: 30 }, { value: "90d", label: "Last 90 days", days: 90 },
  { value: "180d", label: "Last 6 months", days: 182 }, { value: "365d", label: "Last 12 months", days: 365 },
  { value: "ytd", label: "Year to date" }, { value: "all", label: "All time" }
];
const METRICS = {
  hires:      { label: "Hires", short: "hires", color: "#F26A26", fmt: "int" },
  submitted:  { label: "Submitted", short: "submitted", color: "#00377F", fmt: "int" },
  interviews: { label: "Interviews", short: "interviews", color: "#2D6BFF", fmt: "int" },
  rate:       { label: "Hire rate", short: "hire rate", color: "#0E9F7E", fmt: "pct" }
};
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseDay = (s) => { const [y, m, d] = String(s).slice(0, 10).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); };
const addDays = (s, n) => { const d = parseDay(s); d.setDate(d.getDate() + n); return isoDay(d); };
const dayDiff = (a, b) => Math.round((parseDay(b) - parseDay(a)) / 86400e3);

function insightRows() {
  const amOf = (client) => PL.ams.find((a) => !a.unassigned && (a.clients || []).some((n) => sameName(n, client)))?.name || "Unassigned";
  return PL.clients.flatMap((c) => (c.candidates || []).map((r) => ({ ...r, client: c.name, am: amOf(c.name), recruiter: (r.recruiter || "").trim() || "Not recorded" })));
}
function periodRange(rows) {
  const e = isoDay(new Date());
  const p = PERIODS.find((x) => x.value === IN.period) || PERIODS[2];
  let s;
  if (p.days) s = addDays(e, -(p.days - 1));
  else if (p.value === "ytd") s = `${new Date().getFullYear()}-01-01`;
  else s = rows.reduce((m, r) => (r.submitted && r.submitted < m ? r.submitted : m), e);
  const len = dayDiff(s, e) + 1;
  return { s, e, len, prev: p.value === "all" ? null : { s: addDays(s, -len), e: addDays(s, -1) } };
}
function filteredRows(rows) {
  return rows.filter((r) => (!IN.am || r.am === IN.am) && (!IN.client || sameName(r.client, IN.client)) && (!IN.recruiter || r.recruiter === IN.recruiter));
}
const isY = (r) => /^y/i.test(r.interview || "") || Boolean(r.interviewAt);
function metricsFor(rows, rg) {
  const inR = (d) => Boolean(d) && d >= rg.s && d <= rg.e;
  const cohort = rows.filter((r) => inR(r.submitted));
  const hiresRows = rows.filter((r) => r.status === "hired" && inR(r.hiredAt || r.submitted));
  const days = hiresRows.filter((r) => r.hiredAt && r.submitted).map((r) => dayDiff(r.submitted, r.hiredAt)).filter((d) => d >= 0);
  return {
    submitted: cohort.length,
    interviews: rows.filter((r) => inR(r.interviewAt || (isY(r) ? r.submitted : ""))).length,
    hires: hiresRows.length,
    rate: cohort.length ? cohort.filter((r) => r.status === "hired").length / cohort.length : null,
    days: days.length ? days.reduce((a, b) => a + b, 0) / days.length : null,
    noShows: rows.filter((r) => r.status === "no_show" && inR(r.interviewAt || r.submitted)).length,
    fell: rows.filter((r) => r.status === "fell_through" && inR(r.hiredAt || r.submitted)).length,
    cohort
  };
}
function bucketsFor(rg) {
  const out = [];
  if (rg.len <= 120) {
    let d = parseDay(rg.s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));     // Monday
    while (isoDay(d) <= rg.e) {
      const s = isoDay(d), e = addDays(s, 6);
      out.push({ s, e, label: `${d.getMonth() + 1}/${d.getDate()}`, long: `Week of ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` });
      d.setDate(d.getDate() + 7);
    }
  } else {
    let d = parseDay(rg.s); d.setDate(1);
    while (isoDay(d) <= rg.e) {
      const s = isoDay(d), end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
      out.push({ s, e: isoDay(end), label: d.toLocaleDateString(undefined, { month: "short" }), long: d.toLocaleDateString(undefined, { month: "long", year: "numeric" }) });
      d.setMonth(d.getMonth() + 1);
    }
  }
  return out;
}
function seriesFor(rows, buckets) {
  return {
    submitted: buckets.map((b) => rows.filter((r) => r.submitted >= b.s && r.submitted <= b.e).length),
    interviews: buckets.map((b) => rows.filter((r) => { const d = r.interviewAt || (isY(r) ? r.submitted : ""); return d && d >= b.s && d <= b.e; }).length),
    hires: buckets.map((b) => rows.filter((r) => r.status === "hired" && (r.hiredAt || r.submitted) >= b.s && (r.hiredAt || r.submitted) <= b.e).length)
  };
}
const fmtMetric = (v, fmt) => v == null ? "–" : fmt === "pct" ? `${Math.round(v * 100)}%` : fmt === "days" ? `${Math.round(v)}` : String(Math.round(v));

let insightsLayoutLoaded = false;
function startInsights() {
  // Insights reads the pipeline data once (no live connection) unless Client Pipeline is already live in this session.
  if (!PL.started && !IN.loadedAt) loadInsightsData();
  if (!insightsLayoutLoaded) { insightsLayoutLoaded = true; loadInsightsLayout(); }
  renderInsights();
}
async function loadInsightsData(btn) {
  const demo = state.store.demo || Boolean(WK.testData);
  if (PL.started || demo) {                       // live or demo data is already current: just recalculate
    if (!PL.started) startPipeline();
    IN.loadedAt = new Date().toISOString(); IN.animate = true;
    if (btn) { await new Promise((r) => setTimeout(r, 450)); toast("Insights is up to date", "var(--s-done)"); }
    renderInsights(); return;
  }
  IN.loading = true; btn?.classList.add("is-loading"); renderInsights();
  try {
    const { clients, meta } = await state.store.getPipelineOnce();
    PL.store = "firebase";
    IN.loadedAt = new Date().toISOString(); IN.animate = true;
    onPipelineData(clients, meta);
    if (btn) toast("Insights updated with the latest data", "var(--s-done)");
  } catch (e) {
    console.error(e); toast("Couldn't load the latest data. Check your connection and try again.", "#E2632B");
  } finally { IN.loading = false; btn?.classList.remove("is-loading"); renderInsights(); }
}

function onInsightsSelect(key, value) {
  if (key === "export") { exportInsights(value); return; }
  if (key === "period") IN.period = value;
  if (key === "am") { IN.am = value; IN.client = ""; IN.recruiter = ""; }
  if (key === "client") { IN.client = value; IN.recruiter = ""; }
  if (key === "recruiter") IN.recruiter = value;
  if (key === "metric") IN.metric = value;
  IN.showAll = false; IN.animate = true;
  renderInsights();
}

function renderInsights() {
  const root = $("#insights-root");
  if (!root || currentTool !== "insights") return;
  if (!PL.clients.length) {
    root.innerHTML = `<div class="in-hero"><div><h1 class="hero-title">Insights</h1><p class="hero-sub">Loading pipeline data</p></div></div><div class="kpis">${Array.from({ length: 6 }, () => `<div class="kpi"><span class="sk" style="width:60%"></span><span class="sk" style="width:40%;height:28px;margin-top:12px"></span></div>`).join("")}</div>`;
    return;
  }
  const all = insightRows();
  const rows = filteredRows(all);
  const rg = periodRange(all);
  const cur = metricsFor(rows, rg);
  const prevRaw = rg.prev ? metricsFor(rows, rg.prev) : null;
  const prev = prevRaw && prevRaw.submitted ? prevRaw : null;     // no comparison when the previous period has no data
  const buckets = bucketsFor(rg);
  const series = seriesFor(rows, buckets);
  IN.data = { rows, rg, buckets, series, cur };

  // filter options
  const amOpts = [{ value: "", label: "All account managers" }, ...PL.ams.filter((a) => !a.unassigned).map((a) => ({ value: a.name, label: a.name, sub: `${(a.clients || []).length} clients` }))];
  const clientPool = all.filter((r) => !IN.am || r.am === IN.am);
  const clientOpts = [{ value: "", label: "All clients" }, ...[...new Set(clientPool.map((r) => r.client))].sort().map((n) => ({ value: n, label: n }))];
  const recPool = clientPool.filter((r) => !IN.client || sameName(r.client, IN.client));
  const recOpts = [{ value: "", label: "All recruiters" }, ...[...new Set(recPool.map((r) => r.recruiter))].sort().map((n) => ({ value: n, label: n }))];
  const chips = [["am", IN.am], ["client", IN.client], ["recruiter", IN.recruiter]].filter(([, v]) => v);

  const kpi = (key, label, value, prevValue, fmt, opts = {}) => {
    let delta = "";
    if (prevValue != null && value != null && !opts.noDelta && !(fmt !== "pct" && prevValue === 0 && value > 0)) {
      const diff = fmt === "pct" ? (value - prevValue) * 100 : prevValue ? ((value - prevValue) / prevValue) * 100 : 0;
      const good = opts.lowerBetter ? diff < 0 : diff > 0;
      const flat = Math.abs(diff) < 0.5;
      delta = `<span class="kpi-delta ${flat ? "is-flat" : good ? "is-up" : "is-down"}" title="Compared with the previous ${rg.len} days">${flat ? "No change" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(Math.round(diff))}${fmt === "pct" ? " pts" : "%"}`}</span>`;
    }
    return `<div class="kpi" style="--accent:${opts.color || "#00377F"};--i:${opts.i || 0}">
      <div class="kpi-top"><span class="kpi-label">${esc(label)}</span></div>
      <div class="kpi-row"><div class="kpi-value" data-count="${value == null ? "" : value}" data-fmt="${fmt}">${fmtMetric(value, fmt)}</div>${delta}</div>
      <div class="kpi-foot">${opts.foot || ""}</div>
      ${opts.spark ? `<svg class="kpi-spark" data-spark="${opts.spark}" preserveAspectRatio="none" viewBox="0 0 100 30" aria-hidden="true"></svg>` : ""}
    </div>`;
  };

  const removeBtn = (id, label) => `<button type="button" class="w-remove" data-w-remove="${id}" aria-label="Remove ${esc(label)}" title="Remove from my dashboard"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  const kpiW = (id, ...args) => IN.removed.has(id) ? "" : kpi(...args).replace('<div class="kpi"', `<div class="kpi" data-widget="${id}"`).replace('<div class="kpi-top">', `${removeBtn(id, args[1])}<div class="kpi-top">`);
  const ivRate = (r) => r.submitted ? r.cohort.filter(isY).length / r.submitted : null;
  const kpisHTML = [
    kpiW("k_submitted", "submitted", "Submitted", cur.submitted, prev?.submitted, "int", { color: "#00377F", spark: "submitted", i: 0, foot: "candidates sent to clients" }),
    kpiW("k_interviews", "interviews", "Interviews", cur.interviews, prev?.interviews, "int", { color: "#2D6BFF", spark: "interviews", i: 1, foot: "client interviews held" }),
    kpiW("k_hires", "hires", "Hires", cur.hires, prev?.hires, "int", { color: "#F26A26", spark: "hires", i: 2, foot: "offers accepted" }),
    kpiW("k_rate", "rate", "Hire rate", cur.rate, prev?.rate, "pct", { color: "#0E9F7E", i: 3, foot: "of submitted candidates hired" }),
    kpiW("k_ivrate", "ivrate", "Interview rate", ivRate(cur), prev ? ivRate(prev) : null, "pct", { color: "#4F7BD9", i: 4, foot: "of submitted candidates interviewed" }),
    kpiW("k_days", "days", "Days to hire", cur.days, prev?.days, "days", { color: "#7C5CFF", i: 5, lowerBetter: true, foot: "average, submitted to hired" }),
    kpiW("k_noshows", "noShows", "No-shows", cur.noShows, prev?.noShows, "int", { color: "#E5484D", i: 6, lowerBetter: true, foot: "missed client interviews" }),
    kpiW("k_fell", "fell", "Fell through", cur.fell, prev?.fell, "int", { color: "#3B82C4", i: 7, lowerBetter: true, foot: "declined, no-show or left after offer" })
  ].join("");
  const card = (id, cls, inner) => IN.removed.has(id) ? "" : `<section class="in-card ${cls}" data-widget="${id}">${inner.replace('<header class="in-card-head">', `<header class="in-card-head">${removeBtn(id, IN_WIDGETS.find((w) => w.id === id).label)}`)}</section>`;
  const cardsHTML = [
    card("trend", "in-trend w-wide", `
        <header class="in-card-head">
          <div><h2>Activity over time</h2><p>${buckets.length && rg.len <= 120 ? "Weekly" : "Monthly"}, ${esc((PERIODS.find((p) => p.value === IN.period) || {}).label || "").toLowerCase()}</p></div>
          <div class="legend-toggles">
            ${["submitted", "interviews", "hires"].map((k) => `<button type="button" class="lt${IN.hidden.has(k) ? " is-off" : ""}" data-series="${k}" style="--c:${METRICS[k].color}" aria-pressed="${!IN.hidden.has(k)}"><i></i>${METRICS[k].label}</button>`).join("")}
          </div>
        </header>
        <div class="chart" id="in-chart"></div>`),
    card("funnel", "in-funnel", `
        <header class="in-card-head"><div><h2>Hiring funnel</h2><p>What happened to candidates submitted in this period</p></div></header>
        ${funnelHTML(cur.cohort)}`),
    card("board", "in-board w-wide", `
        <header class="in-card-head">
          <div><h2>Leaderboard</h2><p>Select a name to filter everything by it</p></div>
          <div class="in-board-tools">
            ${dimSegHTML()}
            ${ddHTML("in-metric", { label: "By", value: IN.metric, align: "right", options: Object.entries(METRICS).map(([k, m]) => ({ value: k, label: m.label, dot: m.color })) })}
          </div>
        </header>
        ${leaderboardHTML(all, rg)}`),
    card("donut", "in-donut", `
        <header class="in-card-head"><div><h2>Where candidates ended up</h2><p>Current status of this period's submissions</p></div></header>
        ${donutHTML(cur.cohort)}`),
    card("table", "in-table w-full", `
        <header class="in-card-head">
          <div><h2>Performance table</h2><p>Every ${IN.dim === "am" ? "account manager" : IN.dim} side by side. Select a column to sort.</p></div>
          <div class="in-board-tools">${dimSegHTML()}</div>
        </header>
        ${perfTableHTML(all, rg)}`)
  ].join("");
  const nothing = !kpisHTML && !cardsHTML;

  root.innerHTML = `
    <div class="in-hero">
      <div class="in-hero-text">
        <h1 class="hero-title">Insights</h1>
        <p class="hero-sub">How every client, account manager and recruiter is performing. Pick a period and drill in.</p>
      </div>
      <div class="in-hero-actions">
        <span class="sync-chip in-asof"><i></i><span>${PL.meta?.test ? "Test data" : PL.meta?.demo ? "Demo data" : "Data"} as of ${esc(ago(freshness() || new Date().toISOString()))}</span></span>
        <button type="button" class="in-syncnow${IN.loading ? " is-loading" : ""}" data-in-sync title="Load the latest Client Pipeline data into Insights"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7"/><path d="M18 3v4h-4M6 21v-4h4"/></svg><span>${IN.loading ? "Syncing…" : "Sync now"}</span></button>
        ${ddHTML("in-export", { value: "", align: "right", primary: true, triggerText: "Export to Excel", triggerIcon: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/></svg>', options: [
          { value: "view", label: "This view", sub: "The period and filters selected now" },
          { value: "archive", label: "Full archive", sub: "All time, every client, every candidate" }
        ] })}
      </div>
    </div>

    <div class="in-filters">
      ${ddHTML("in-period", { label: "Period", value: IN.period, options: PERIODS })}
      ${ddHTML("in-am", { label: "Account manager", value: IN.am, options: amOpts })}
      ${ddHTML("in-client", { label: "Client", value: IN.client, options: clientOpts })}
      ${ddHTML("in-recruiter", { label: "Recruiter", value: IN.recruiter, options: recOpts })}
      ${chips.length ? `<button type="button" class="link-btn in-clear" data-in-clear>Clear filters</button>` : ""}
      <div class="cust-wrap">
        <button type="button" class="btn-mini cust-btn" data-in-customize aria-haspopup="dialog" aria-expanded="${IN.pop === "customize"}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><path d="M17 14v6M14 17h6"/></svg>
          Customize<span class="cols-n">${IN_WIDGETS.filter((w) => !IN.removed.has(w.id)).length}</span>
        </button>
        ${customizePopHTML()}
      </div>
    </div>

    ${nothing ? `<div class="in-card in-nothing"><div class="empty"><div class="empty-mark">${ICONS.spark}</div><strong>Your dashboard is empty</strong>Use Customize to add numbers and charts back.</div></div>` : ""}
    ${kpisHTML ? (() => { const n = (kpisHTML.match(/data-widget=/g) || []).length; return `<div class="kpis" style="--n:${n};--half:${Math.ceil(n / 2)}">${kpisHTML}</div>`; })() : ""}
    ${cardsHTML ? `<div class="in-grid">${cardsHTML}</div>` : ""}`;

  requestAnimationFrame(() => {
    $$(".in-seg").forEach(moveIndicator);
    drawTrend();
    $$("[data-spark]", root).forEach((svg) => drawSpark(svg, series[svg.dataset.spark], svg.closest(".kpi").style.getPropertyValue("--accent")));
    if (IN.animate && !reduceMotion) {
      root.classList.remove("in-enter"); void root.offsetWidth; root.classList.add("in-enter");
      $$(".kpi-value[data-count]", root).forEach((el) => countUp(el));
      requestAnimationFrame(() => {
        $$(".funnel-bar, .ldr-bar, .pt-bar", root).forEach((b) => b.style.setProperty("--w", b.dataset.w));
        $$(".donut-seg", root).forEach((c) => c.style.strokeDasharray = c.dataset.dash);
      });
    } else {
      $$(".funnel-bar, .ldr-bar, .pt-bar", root).forEach((b) => b.style.setProperty("--w", b.dataset.w));
      $$(".donut-seg", root).forEach((c) => c.style.strokeDasharray = c.dataset.dash);
    }
    IN.animate = false;
  });

  if (!IN.ro && window.ResizeObserver) {
    let t = 0;
    IN.ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (currentTool === "insights") drawTrend(true); }, 120); });
    IN.ro.observe(root);
  }
}

function countUp(el) {
  const to = Number(el.dataset.count), fmt = el.dataset.fmt;
  if (!isFinite(to) || el.dataset.count === "") return;
  const start = performance.now(), dur = 1100;
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmtMetric(to * e, fmt);
    if (k < 1) requestAnimationFrame(step); else el.textContent = fmtMetric(to, fmt);
  };
  requestAnimationFrame(step);
}

function drawSpark(svg, values, color) {
  if (!values?.length) return;
  const max = Math.max(1, ...values), n = values.length;
  const pts = values.map((v, i) => [n === 1 ? 50 : (i / (n - 1)) * 100, 28 - (v / max) * 24]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("");
  const id = "sg" + Math.random().toString(36).slice(2, 7);
  svg.innerHTML = `<defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${line}L100,30L0,30Z" fill="url(#${id})" class="spark-area"/><path d="${line}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke" pathLength="1" class="spark-line"/>`;
}

function niceScale(v, ticks = 4) {
  const raw = Math.max(v, 1) / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.max(1, [1, 2, 2.5, 5, 10].map((f) => f * mag).find((x) => x >= raw && (x >= 1 ? Number.isInteger(x) : true)) || 10 * mag);
  return { step, max: step * Math.ceil(Math.max(v, 1) / step) };
}

function drawTrend(resizing) {
  const el = $("#in-chart"); if (!el || !IN.data) return;
  const { buckets, series } = IN.data;
  const W = Math.max(320, el.clientWidth), H = W < 520 ? 230 : 290;
  const P = { l: 38, r: 14, t: 16, b: 30 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const keys = ["submitted", "interviews", "hires"].filter((k) => !IN.hidden.has(k));
  const { step, max } = niceScale(Math.max(1, ...keys.flatMap((k) => series[k])));
  const n = buckets.length;
  const x = (i) => P.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => P.t + ih - (v / max) * ih;
  const smooth = (vals) => vals.map((v, i) => [x(i), y(v)]).reduce((d, p, i, a) => {
    if (!i) return `M${p[0]},${p[1]}`;
    const [px, py] = a[i - 1], cx = (px + p[0]) / 2;
    return d + ` C${cx},${py} ${cx},${p[1]} ${p[0]},${p[1]}`;
  }, "");
  const every = Math.max(1, Math.ceil(n / Math.floor(iw / 56)));
  const grid = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step).map((v) => `<line x1="${P.l}" x2="${W - P.r}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/><text x="${P.l - 8}" y="${y(v) + 4}" class="axis-y">${v}</text>`).join("");
  const xl = buckets.map((b, i) => (i % every === 0 || i === n - 1) ? `<text x="${x(i)}" y="${H - 8}" class="axis-x">${esc(b.label)}</text>` : "").join("");
  const paths = keys.map((k, si) => {
    const c = METRICS[k].color, d = smooth(series[k]);
    const area = k === "submitted" ? `<path d="${d} L${x(n - 1)},${P.t + ih} L${x(0)},${P.t + ih} Z" fill="url(#ga-${k})" class="tr-area"/>` : "";
    const dots = k === "hires" ? series[k].map((v, i) => v ? `<circle cx="${x(i)}" cy="${y(v)}" r="3.6" fill="#fff" stroke="${c}" stroke-width="2.2" class="tr-dot" style="--i:${i}"/>` : "").join("") : "";
    return `${area}<path d="${d}" fill="none" stroke="${c}" stroke-width="${k === "hires" ? 3 : 2.4}" ${k === "interviews" ? 'stroke-dasharray="1 0"' : ""} stroke-linecap="round" pathLength="1" class="tr-line" style="--d:${si * 120}ms"/>${dots}`;
  }).join("");
  el.innerHTML = `<svg class="${resizing ? "no-anim" : ""}" viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="Activity over time">
      <defs>${["submitted"].map((k) => `<linearGradient id="ga-${k}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${METRICS[k].color}" stop-opacity=".22"/><stop offset="1" stop-color="${METRICS[k].color}" stop-opacity="0"/></linearGradient>`).join("")}</defs>
      ${grid}${xl}${paths}
      <line class="tr-cross" x1="0" x2="0" y1="${P.t}" y2="${P.t + ih}" opacity="0"/>
      ${buckets.map((b, i) => `<rect class="tr-hit" data-b="${i}" x="${x(i) - (n === 1 ? iw / 2 : iw / (n - 1) / 2)}" y="${P.t}" width="${n === 1 ? iw : iw / (n - 1)}" height="${ih}" fill="transparent"/>`).join("")}
    </svg><div class="tr-tip" hidden></div>`;
  const svg = $("svg", el), tip = $(".tr-tip", el), cross = $(".tr-cross", el);
  const show = (i) => {
    const b = buckets[i];
    cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("opacity", "1");
    tip.innerHTML = `<strong>${esc(b.long)}</strong>${["submitted", "interviews", "hires"].map((k) => `<span><i style="background:${METRICS[k].color}"></i>${METRICS[k].label}<b>${series[k][i]}</b></span>`).join("")}`;
    tip.hidden = false;
    const left = Math.min(Math.max(x(i) / W * el.clientWidth - tip.offsetWidth / 2, 0), el.clientWidth - tip.offsetWidth);
    tip.style.transform = `translate(${left}px, 0)`;
  };
  svg.addEventListener("pointermove", (e) => { const r = e.target.closest?.(".tr-hit"); if (r) show(Number(r.dataset.b)); });
  svg.addEventListener("pointerleave", () => { tip.hidden = true; cross.setAttribute("opacity", "0"); });
}

function funnelHTML(cohort) {
  const sub = cohort.length, iv = cohort.filter(isY).length, hired = cohort.filter((r) => r.status === "hired").length;
  const steps = [["Submitted", sub, "#00377F"], ["Interviewed", iv, "#2D6BFF"], ["Hired", hired, "#F26A26"]];
  if (!sub) return `<p class="in-empty">No candidates were submitted in this period.</p>`;
  return `<div class="funnel">${steps.map(([l, v, c], i) => `
    ${i ? `<div class="funnel-conv"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>${steps[i - 1][1] ? Math.round(v / steps[i - 1][1] * 100) : 0}% moved on</div>` : ""}
    <div class="funnel-step" style="--c:${c};--i:${i}">
      <div class="funnel-label"><span>${l}</span><strong>${v}</strong></div>
      <div class="funnel-track"><div class="funnel-bar" data-w="${sub ? Math.max(v / sub * 100, v ? 4 : 0) : 0}%"></div></div>
    </div>`).join("")}</div>`;
}

function donutHTML(cohort) {
  const total = cohort.length;
  if (!total) return `<p class="in-empty">No candidates were submitted in this period.</p>`;
  let off = 0;
  const segs = Object.entries(PSTATUS).map(([k, v]) => {
    const n = cohort.filter((r) => r.status === k).length, pct = n / total * 100;
    const color = k === "passed" ? "#A3B1C6" : v.bar;
    const seg = { k, n, pct, color, label: v.short, off };
    off += pct;
    return seg;
  });
  return `<div class="donut">
    <svg viewBox="0 0 180 180" class="donut-svg" role="img" aria-label="Status breakdown">
      <circle cx="90" cy="90" r="68" class="donut-bg"/>
      ${segs.filter((s) => s.n).map((s, i) => `<circle cx="90" cy="90" r="68" pathLength="100" class="donut-seg" data-seg="${s.k}" stroke="${s.color}" data-dash="${Math.max(s.pct - .6, .4)} ${100 - Math.max(s.pct - .6, .4)}" style="stroke-dashoffset:${25 - s.off};--i:${i}"/>`).join("")}
      <text x="90" y="86" class="donut-total">${total}</text><text x="90" y="106" class="donut-cap">submitted</text>
    </svg>
    <ul class="donut-legend">${segs.map((s) => `<li data-seg-key="${s.k}"><i style="background:${s.color}"></i><span>${esc(s.label)}</span><b>${s.n}</b><em>${Math.round(s.pct)}%</em></li>`).join("")}</ul>
  </div>`;
}

function computeBoard(all, rg, dim = IN.dim) {
  const base = all.filter((r) => (!IN.am || dim === "am" || r.am === IN.am) && (!IN.client || dim === "client" || dim === "am" || sameName(r.client, IN.client)) && (!IN.recruiter || dim === "recruiter" || r.recruiter === IN.recruiter));
  const groups = new Map();
  base.forEach((r) => { const g = r[dim]; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r); });
  return [...groups.entries()].map(([name, rs]) => {
    const m = metricsFor(rs, rg);
    return { name, ...m, ivrate: m.submitted ? m.cohort.filter(isY).length / m.submitted : null };
  }).filter((e) => e.submitted || e.hires || e.interviews);
}

function dimSegHTML() {
  return `<div class="seg in-seg" role="tablist" aria-label="Group by">
    ${[["recruiter", "Recruiters"], ["am", "Account managers"], ["client", "Clients"]].map(([k, l]) => `<button class="seg-btn${IN.dim === k ? " is-active" : ""}" data-in-dim="${k}">${l}</button>`).join("")}
    <span class="seg-indicator" aria-hidden="true"></span>
  </div>`;
}

function leaderboardHTML(all, rg) {
  const key = IN.dim;
  const m = METRICS[IN.metric];
  const list = computeBoard(all, rg);
  list.forEach((e) => { e.value = IN.metric === "rate" ? (e.submitted >= 3 ? e.rate : null) : e[IN.metric]; });
  list.sort((a, b) => (b.value ?? -1) - (a.value ?? -1) || b.hires - a.hires || b.submitted - a.submitted);
  if (!list.length) return `<p class="in-empty">Nothing to rank in this period.</p>`;
  const top = Math.max(...list.map((e) => e.value || 0)) || 1;
  const selected = key === "recruiter" ? IN.recruiter : key === "am" ? IN.am : IN.client;
  const shown = IN.showAll ? list : list.slice(0, 7);
  return `<ol class="ldr">${shown.map((e, i) => `
      <li class="ldr-row${i < 3 && e.value ? " is-top ldr-" + (i + 1) : ""}${selected && e.name === selected ? " is-selected" : ""}" style="--i:${i};--c:${m.color}">
        <button type="button" class="ldr-btn" data-in-pick="${esc(e.name)}" aria-pressed="${selected === e.name}" title="${selected === e.name ? "Remove filter" : `Filter by ${esc(e.name)}`}">
          <span class="ldr-rank">${i < 3 && e.value ? `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 15.6 6.6 18.5l1.2-6L3.3 8.3l6.1-.7z" fill="currentColor"/></svg>` : i + 1}</span>
          <span class="ldr-avatar">${esc(initials(e.name))}</span>
          <span class="ldr-main">
            <span class="ldr-name">${esc(e.name)}</span>
            <span class="ldr-stats"><span>${e.submitted} submitted</span><span>${e.interviews} interview${e.interviews === 1 ? "" : "s"}</span><span>${e.hires} hire${e.hires === 1 ? "" : "s"}</span></span>
            <span class="ldr-track"><span class="ldr-bar" data-w="${e.value == null ? 0 : Math.max(e.value / top * 100, 2)}%"></span></span>
          </span>
          <span class="ldr-value">${fmtMetric(e.value, m.fmt)}<small>${e.value == null && IN.metric === "rate" ? "too few" : esc(e.value === 1 && m.fmt === "int" ? m.short.replace(/s$/, "") : m.short)}</small></span>
        </button>
      </li>`).join("")}</ol>
    ${list.length > 7 ? `<button type="button" class="link-btn ldr-more" data-in-more>${IN.showAll ? "Show top 7" : `Show all ${list.length}`}</button>` : ""}`;
}

const PT_COLS = [
  ["submitted", "Submitted", "int"], ["interviews", "Interviews", "int"], ["hires", "Hires", "int"], ["rate", "Hire rate", "pct"],
  ["ivrate", "Interview rate", "pct"], ["days", "Days to hire", "days"], ["noShows", "No-shows", "int"], ["fell", "Fell through", "int"]
];
function perfTableHTML(all, rg) {
  const list = computeBoard(all, rg);
  if (!list.length) return `<p class="in-empty">Nothing to show in this period.</p>`;
  const { key, dir } = IN.tsort;
  list.sort((a, b) => key === "name" ? a.name.localeCompare(b.name) * dir : ((a[key] ?? -1) - (b[key] ?? -1)) * dir || a.name.localeCompare(b.name));
  const tot = metricsFor(list.length ? filteredRows(insightRows()).filter((r) => list.some((e) => e.name === r[IN.dim])) : [], rg);
  tot.ivrate = tot.submitted ? tot.cohort.filter(isY).length / tot.submitted : null;
  const maxHires = Math.max(1, ...list.map((e) => e.hires));
  const th = (k, label) => `<th scope="col" class="${k === key ? "is-sorted" : ""}${k === "name" ? "" : " num"}"><button type="button" data-tsort="${k}">${esc(label)}<span class="pt-arrow" aria-hidden="true">${k === key ? (dir < 0 ? "▼" : "▲") : ""}</span></button></th>`;
  return `<div class="pl-table-wrap pt-wrap"><table class="pt">
    <thead><tr>${th("name", IN.dim === "am" ? "Account manager" : IN.dim === "client" ? "Client" : "Recruiter")}${PT_COLS.map(([k, l]) => th(k, l)).join("")}</tr></thead>
    <tbody>${list.map((e, i) => `<tr style="--i:${Math.min(i, 15)}">
      <th scope="row"><span class="pt-name"><span class="ldr-avatar pt-av">${esc(initials(e.name))}</span>${esc(e.name)}</span></th>
      ${PT_COLS.map(([k, , f]) => `<td class="num${k === "hires" ? " pt-hires" : ""}">${k === "hires" ? `<span class="pt-bar" data-w="${e.hires / maxHires * 100}%"></span>` : ""}<span>${fmtMetric(e[k], f)}</span></td>`).join("")}
    </tr>`).join("")}</tbody>
    <tfoot><tr><th scope="row">Total</th>${PT_COLS.map(([k, , f]) => `<td class="num">${fmtMetric(tot[k], f)}</td>`).join("")}</tr></tfoot>
  </table></div>`;
}

function customizePopHTML() {
  const groups = [...new Set(IN_WIDGETS.map((w) => w.group))];
  return `<div class="cols-pop cust-pop pop" role="dialog" aria-label="Customize dashboard" ${IN.pop === "customize" ? "" : "hidden"}>
    <div class="cols-head"><strong>Customize</strong><button type="button" class="link-btn" data-w-reset>Reset to default</button></div>
    <p class="cols-hint">Switch boxes on or off. Your layout is saved to your account.</p>
    ${groups.map((g) => `<div class="cust-group"><span class="cust-g">${esc(g)}</span>
      <ul class="cols-list">${IN_WIDGETS.filter((w) => w.group === g).map((w) => `
        <li class="col-item${IN.removed.has(w.id) ? "" : " is-on"}"><span class="col-label">${esc(w.label)}${w.off ? `<span class="col-new">New</span>` : ""}</span>
          <button type="button" class="switch" role="switch" aria-checked="${!IN.removed.has(w.id)}" data-w-toggle="${w.id}" aria-label="Show ${esc(w.label)}"><span></span></button></li>`).join("")}</ul></div>`).join("")}
  </div>`;
}

function saveInsightsLayout() {
  saveViewPrefs({ insightsRemoved: [...IN.removed] });
}
async function loadInsightsLayout() {
  try { const v = JSON.parse(localStorage.getItem("hra_view_" + state.user.uid)) || {}; if (Array.isArray(v.insightsRemoved)) IN.removed = new Set(v.insightsRemoved); } catch {}
  try { const p = await state.store.getPrefs(state.user.uid); if (Array.isArray(p?.insightsRemoved)) { IN.removed = new Set(p.insightsRemoved); renderInsights(); } } catch {}
}

function removeWidget(id) {
  const w = IN_WIDGETS.find((x) => x.id === id); if (!w) return;
  const el = $(`[data-widget="${id}"]`);
  const finish = () => { IN.removed.add(id); saveInsightsLayout(); renderInsights(); };
  if (el && !reduceMotion) { el.classList.add("is-removing"); setTimeout(finish, 280); } else finish();
  toast(`Removed ${w.label}`, "var(--muted)", { label: "Undo", fn: () => { IN.removed.delete(id); saveInsightsLayout(); IN.animate = false; renderInsights(); $(`[data-widget="${id}"]`)?.classList.add("is-added"); } });
}

/* ---------- Excel export of Insights ---------- */
async function exportInsights(kind) {
  const btn = $('[data-dd="in-export"] .dd-trigger');
  btn?.classList.add("is-loading");
  try {
    const ExcelJS = await loadExcel();
    const archive = kind === "archive";
    const allRows = insightRows();
    const saved = { period: IN.period, am: IN.am, client: IN.client, recruiter: IN.recruiter };
    if (archive) Object.assign(IN, { period: "all", am: "", client: "", recruiter: "" });
    const rows = filteredRows(allRows);
    const rg = periodRange(allRows);
    const cur = metricsFor(rows, rg);
    const prevRaw = rg.prev ? metricsFor(rows, rg.prev) : null;
    const prev = prevRaw && prevRaw.submitted ? prevRaw : null;
    const buckets = bucketsFor(archive ? { ...rg, len: 999 } : rg);
    const series = seriesFor(rows, buckets);
    const boards = { recruiter: computeBoard(allRows, rg, "recruiter"), am: computeBoard(allRows, rg, "am"), client: computeBoard(allRows, rg, "client") };
    const filters = { period: (PERIODS.find((p) => p.value === IN.period) || {}).label, am: IN.am, client: IN.client, recruiter: IN.recruiter };
    Object.assign(IN, saved);

    const wb = new ExcelJS.Workbook(); wb.creator = "HRA Dashboard"; wb.created = new Date();
    const NAVY = "FF00377F", thin = { style: "thin", color: { argb: "FFD5DEEA" } }, box = { top: thin, left: thin, bottom: thin, right: thin };
    const fill = (hex) => ({ type: "pattern", pattern: "solid", fgColor: { argb: hex.length === 6 ? "FF" + hex : hex } });
    const header = (ws, rowNum, labels) => { const r = ws.getRow(rowNum); labels.forEach((l, i) => { const c = r.getCell(i + 1); c.value = l; c.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial", size: 10 }; c.fill = fill(NAVY); c.border = box; c.alignment = { vertical: "middle", wrapText: true }; }); r.height = 24; };
    const body = (cell, fmt) => { cell.border = box; cell.font = { name: "Arial", size: 10 }; if (fmt === "pct") cell.numFmt = "0%"; if (fmt === "days") cell.numFmt = "0"; };
    const val = (v, fmt) => v == null ? "" : fmt === "days" ? Math.round(v) : v;
    const title = (ws, text, sub) => {
      ws.getCell("A1").value = text; ws.getCell("A1").font = { bold: true, size: 16, name: "Arial", color: { argb: NAVY } };
      ws.getCell("A2").value = sub; ws.getCell("A2").font = { italic: true, size: 10, name: "Arial", color: { argb: "FF62789A" } };
    };
    const subtitle = `Period: ${fmtDay(rg.s)} to ${fmtDay(rg.e)} (${filters.period})${filters.am ? `, account manager: ${filters.am}` : ""}${filters.client ? `, client: ${filters.client}` : ""}${filters.recruiter ? `, recruiter: ${filters.recruiter}` : ""}. Exported ${new Date().toLocaleString()}.`;

    // Summary
    const sum = wb.addWorksheet("Summary");
    sum.columns = [{ width: 30 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 46 }];
    title(sum, archive ? "HRA Insights, full archive" : "HRA Insights", subtitle);
    header(sum, 4, ["Measure", "This period", prev ? "Previous period" : "Previous period (no data)", "Change", "What it means"]);
    const K = [
      ["Submitted", cur.submitted, prev?.submitted, "int", "Candidates sent to clients"],
      ["Interviews", cur.interviews, prev?.interviews, "int", "Client interviews held"],
      ["Hires", cur.hires, prev?.hires, "int", "Offers accepted in the period"],
      ["Hire rate", cur.rate, prev?.rate, "pct", "Share of submitted candidates who were hired"],
      ["Interview rate", cur.submitted ? cur.cohort.filter(isY).length / cur.submitted : null, prev?.submitted ? prev.cohort.filter(isY).length / prev.submitted : null, "pct", "Share of submitted candidates who interviewed"],
      ["Average days to hire", cur.days, prev?.days, "days", "From submitted to hired"],
      ["No-shows", cur.noShows, prev?.noShows, "int", "Missed client interviews"],
      ["Fell through", cur.fell, prev?.fell, "int", "Declined, no-show or left after offer"]
    ];
    K.forEach(([l, a, b, f, note], i) => {
      const r = sum.getRow(5 + i);
      const cells = [l, val(a, f), prev ? val(b, f) : "", prev && a != null && b != null ? (f === "pct" ? a - b : b ? (a - b) / b : "") : "", note];
      cells.forEach((v, j) => { const c = r.getCell(j + 1); c.value = v; body(c, j === 1 || j === 2 ? f : null); if (j === 3) c.numFmt = f === "pct" ? '+0" pts";-0" pts"' : "+0%;-0%"; if (j === 3 && f === "pct" && v !== "") c.value = Math.round(v * 100); });
      r.getCell(1).font = { bold: true, name: "Arial", size: 10 };
    });
    const fr = 15;
    header(sum, fr, ["Hiring funnel", "Candidates", "Share of submitted"]);
    const sub = cur.cohort.length;
    [["Submitted", sub], ["Interviewed", cur.cohort.filter(isY).length], ["Hired", cur.cohort.filter((r) => r.status === "hired").length]].forEach(([l, n], i) => {
      const r = sum.getRow(fr + 1 + i); [l, n, sub ? n / sub : ""].forEach((v, j) => { const c = r.getCell(j + 1); c.value = v; body(c, j === 2 ? "pct" : null); });
    });
    const sr = fr + 6;
    header(sum, sr, ["Status of submitted candidates", "Candidates", "Share"]);
    Object.entries(PSTATUS).forEach(([k, st], i) => {
      const n = cur.cohort.filter((r) => r.status === k).length;
      const r = sum.getRow(sr + 1 + i); [st.label, n, sub ? n / sub : ""].forEach((v, j) => { const c = r.getCell(j + 1); c.value = v; body(c, j === 2 ? "pct" : null); });
      r.getCell(1).fill = fill(st.fill);
    });

    // Over time
    const ot = wb.addWorksheet("Over time");
    ot.columns = [{ width: 24 }, { width: 14 }, { width: 14 }, { width: 14 }];
    title(ot, "Activity over time", subtitle);
    header(ot, 4, [buckets.length && (archive ? false : rg.len <= 120) ? "Week" : "Month", "Submitted", "Interviews", "Hires"]);
    buckets.forEach((b, i) => { const r = ot.getRow(5 + i); [b.long, series.submitted[i], series.interviews[i], series.hires[i]].forEach((v, j) => body(Object.assign(r.getCell(j + 1), { value: v }))); });

    // Leaderboards
    const boardSheet = (name, list, label) => {
      const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 4 }] });
      ws.columns = [{ width: 28 }, ...PT_COLS.map(() => ({ width: 15 }))];
      title(ws, name, subtitle);
      header(ws, 4, [label, ...PT_COLS.map(([, l]) => l)]);
      list.sort((a, b) => b.hires - a.hires || b.submitted - a.submitted).forEach((e, i) => {
        const r = ws.getRow(5 + i);
        body(Object.assign(r.getCell(1), { value: e.name }));
        PT_COLS.forEach(([k, , f], j) => body(Object.assign(r.getCell(j + 2), { value: val(e[k], f) }), f));
      });
    };
    boardSheet("By recruiter", boards.recruiter, "Recruiter");
    boardSheet("By account manager", boards.am, "Account manager");
    boardSheet("By client", boards.client, "Client");

    // Candidates (raw data)
    const cw = wb.addWorksheet("Candidates", { views: [{ state: "frozen", ySplit: 4 }] });
    const CC = [["client", "Client", 26], ["am", "Account manager", 18], ["name", "Candidate", 22], ["role", "Role submitted", 26], ["submitted", "Date submitted", 13, "date"], ["interview", "Wants to interview, when", 24], ["interviewAt", "Interview date", 13, "date"], ["hired", "Hired (Y/N)", 18], ["hiredAt", "Hire date", 13, "date"], ["roleHired", "Role hired for", 22], ["startDate", "Start date", 13, "date"], ["recruiter", "Recruiter", 16], ["status", "Status", 16], ["stage", "Workable stage", 18], ["notes", "Notes", 60]];
    cw.columns = CC.map(([, , w]) => ({ width: w }));
    title(cw, archive ? "All candidates" : "Candidates in this view", subtitle);
    header(cw, 4, CC.map(([, l]) => l));
    const inR = (d) => d && d >= rg.s && d <= rg.e;
    const exportRows = rows.filter((r) => archive || inR(r.submitted) || inR(r.interviewAt) || inR(r.hiredAt)).sort((a, b) => (a.client.localeCompare(b.client)) || (a.submitted || "").localeCompare(b.submitted || ""));
    exportRows.forEach((row, i) => {
      const r = cw.getRow(5 + i);
      CC.forEach(([k, , , t], j) => {
        const c = r.getCell(j + 1);
        let v = k === "status" ? (PSTATUS[row.status]?.short || row.status) : row[k] ?? "";
        if (t === "date" && /^\d{4}-\d{2}-\d{2}/.test(v || "")) { const [y, m, d] = v.slice(0, 10).split("-").map(Number); v = new Date(Date.UTC(y, m - 1, d)); c.numFmt = "m/d/yyyy"; }
        c.value = v; body(c);
        c.fill = fill(PSTATUS[row.status]?.fill || "FFFFFF");
        c.alignment = { vertical: "top", wrapText: k === "notes" };
      });
    });
    cw.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: CC.length } };

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const d = new Date(), stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const fname = archive ? `HRA Insights - Full archive - ${stamp}.xlsx` : `HRA Insights - ${filters.period}${filters.am ? " - " + filters.am : ""}${filters.client ? " - " + filters.client : ""}${filters.recruiter ? " - " + filters.recruiter : ""} - ${stamp}.xlsx`;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: fname.replace(/[\\/:*?"<>|]/g, "-") });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(archive ? `Archive exported: ${exportRows.length} candidates` : `Exported ${exportRows.length} candidates and all summaries`, "var(--s-done)");
  } catch (e) {
    console.error(e);
    toast("The Excel file couldn't be created. Check your connection and try again.", "#E2632B");
  } finally { btn?.classList.remove("is-loading"); }
}

/* ==========================================================================
   Who to contact (directory from config.js → contacts)
   ========================================================================== */
const DIR = CFG.contacts || { categories: [], topics: [] };
const CT = { q: "", cat: "", open: null, built: false, hintTimer: null };
const CAT_ICONS = {
  chip:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/></svg>',
  key:    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/></svg>',
  people: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16.5 14.2A5 5 0 0 1 21.5 19"/></svg>',
  brief:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12.5h18"/></svg>',
  help:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>'
};
const CT_ICONS = {
  teams: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.5 9h7M8.5 12h4.5"/></svg>',
  mail:  '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  copy:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
};
function hl(text, words) {
  let out = esc(text);
  for (const w of words.filter((x) => x.length > 1)) {
    out = out.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![^<]*>)`, "gi"), "<mark>$1</mark>");
  }
  return out;
}
const PEOPLE = () => DIR.people || [];
function personScore(p, words) {
  if (!words.length) return 1;
  const name = lower(p.name), sum = lower([p.summary, p.role].join(" ")), handles = (p.handles || []).map(lower), keys = (p.keywords || []).map(lower);
  let score = 0;
  for (const w of words) {
    let hit = 0;
    if (name.includes(w)) hit = 6;
    else if (handles.some((h) => h.includes(w))) hit = 5;
    else if (keys.some((k) => k.startsWith(w) || (k.length >= 4 && w.startsWith(k)) || (w.length >= 4 && k.includes(w)))) hit = 5;
    else if (sum.includes(w)) hit = 3;
    if (!hit && w.length <= 2) continue;          // ignore tiny words like "my", "is"
    if (!hit) return 0;
    score += hit;
  }
  return score;
}
const CT_COLORS = { navy: ["#00377F", "#2D6BFF"], teal: ["#038387", "#36B6BA"], orange: ["#F26A26", "#FF9A5C"], purple: ["#7C3AED", "#A78BFA"], green: ["#0E9F7E", "#34C79E"] };
const ARROW_R = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const telHref = (v) => "tel:" + String(v).replace(/[^\d+]/g, "");

function renderContacts() {
  const root = $("#contacts-root");
  if (!root || currentTool !== "contacts") return;
  if (!CT.built) {
    CT.built = true;
    const hasExamples = PEOPLE().some((p) => p.example);
    root.innerHTML = `
      <div class="ct-hero">
        <h1 class="hero-title">Who to contact</h1>
        <p class="hero-sub">Find the right person in seconds. Search, or pick someone below to see how to reach them.</p>
        <label class="ct-search">
          <span class="ct-search-ico">${CT_ICONS.search}</span>
          <input type="search" id="ct-q" autocomplete="off" placeholder="What do you need help with?" aria-label="What do you need help with?" />
          <kbd class="ct-kbd" aria-hidden="true">/</kbd>
          <span class="ct-search-glow" aria-hidden="true"></span>
        </label>
        <div class="ct-try"><span>Try:</span>${["laptop", "password", "payroll", "time off", "dashboard"].map((x) => `<button type="button" class="ct-try-btn" data-ct-try="${esc(x)}">${esc(x)}</button>`).join("")}</div>
      </div>
      ${hasExamples && state.isAdmin ? `<div class="ct-note"><strong>Some details are placeholders</strong> (marked “Example”). Update them in <code>config.js</code> → <code>contacts</code>. Only admins see this note.</div>` : ""}
      <div class="fc-grid" id="ct-list" aria-live="polite"></div>
      <p class="ppl-foot" id="ct-foot"></p>`;
  }
  renderContactList();
}

function renderContactList() {
  const words = lower(CT.q).split(/\s+/).filter(Boolean);
  const list = PEOPLE().map((p, i) => ({ p, i, s: personScore(p, words) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i);
  const am = DIR.accountManager;
  const amScore = am ? personScore({ name: am.title, summary: am.summary, handles: [], keywords: am.keywords }, words) : 0;
  const autoFlip = words.length && list.length === 1 ? list[0].i : null;   // one match: flip it automatically
  if (autoFlip === null && words.length) CT.open = null;
  const el = $("#ct-list");
  el.innerHTML = `
    ${list.length ? list.map((x, k) => personHTML(x.p, x.i, k, words)).join("") : amScore ? "" : `<div class="ppl-none"><strong>No one matches “${esc(CT.q)}”</strong><span>Your account manager can point you in the right direction.</span></div>`}
    ${am && (!words.length || amScore || !list.length) ? `
      <article class="fc fc-am" style="--i:${list.length};--c1:#F26A26;--c2:#FF9A5C">
        <div class="fc-inner"><div class="fc-face fc-front fc-static">
          <span class="fc-shine" aria-hidden="true"></span>
          <span class="fc-av"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/></svg></span>
          <span class="fc-name">${hl(am.title, words)}</span>
          <span class="fc-sum">${hl(am.summary, words)}</span>
          <span class="fc-tags"><span>Process</span><span>Your work</span><span>Job details</span></span>
          <span class="fc-hint fc-hint-am">Reach out to them directly</span>
        </div></div>
      </article>` : ""}`;
  if (autoFlip !== null && CT.open !== autoFlip) { CT.open = null; setTimeout(() => { const c = $(`.fc[data-person="${autoFlip}"]`); if (c && !c.classList.contains("is-flipped")) flipCard(c, true); }, 380); }
  $("#ct-foot").innerHTML = DIR.footer ? `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>${esc(DIR.footer)}` : "";
}

const FLIP_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>';
function personHTML(p, idx, k, words) {
  const open = CT.open === idx;
  const [c1, c2] = CT_COLORS[p.color] || CT_COLORS.navy;
  return `<article class="fc${open ? " is-flipped" : ""}" style="--i:${k};--c1:${c1};--c2:${c2}" data-person="${idx}">
    <div class="fc-inner">
      <button type="button" class="fc-face fc-front" data-ct-person="${idx}" aria-label="${esc(p.name)}: see how to reach" ${open ? "inert" : ""}>
        <span class="fc-shine" aria-hidden="true"></span>
        ${p.example ? `<span class="ct-example fc-ex">Example</span>` : ""}
        <span class="fc-av">${esc(initials(p.name))}</span>
        <span class="fc-name">${hl(p.name, words)}</span>
        <span class="fc-sum">${hl(p.summary || "", words)}</span>
        <span class="fc-tags">${(p.handles || []).map((h) => `<span>${hl(h, words)}</span>`).join("")}</span>
        <span class="fc-hint">${FLIP_ICON}How to reach</span>
      </button>
      <div class="fc-face fc-back" ${open ? "" : "inert"} role="group" aria-label="How to reach ${esc(p.name)}">
        <span class="fc-shine" aria-hidden="true"></span>
        <div class="fc-back-head">
          <span class="fc-av fc-av-sm">${esc(initials(p.name))}</span>
          <span class="fc-back-title"><strong>${esc(p.name)}</strong><small>How to reach</small></span>
          <button type="button" class="fc-flipback" data-ct-person="${idx}" aria-label="Flip back" title="Flip back">${FLIP_ICON}</button>
        </div>
        <div class="fc-how">${(p.how || []).map((h) => howHTML(h, p)).join("")}</div>
      </div>
    </div>
  </article>`;
}

function flipCard(card, on) {
  const front = $(".fc-front", card), back = $(".fc-back", card);
  card.classList.toggle("is-flipped", on);
  card.classList.remove("is-flipping"); void card.offsetWidth; card.classList.add("is-flipping");
  setTimeout(() => card.classList.remove("is-flipping"), 800);
  if (on) { front.setAttribute("inert", ""); back.removeAttribute("inert"); setTimeout(() => $(".how-btn, .fc-flipback", back)?.focus({ preventScroll: true }), 260); }
  else { back.setAttribute("inert", ""); front.removeAttribute("inert"); setTimeout(() => front.focus({ preventScroll: true }), 260); }
  CT.open = on ? Number(card.dataset.person) : (CT.open === Number(card.dataset.person) ? null : CT.open);
}

function howHTML(h, p) {
  if (h.type === "request") return `<div class="how how-primary">
      <span class="how-ico">${MSGR_ICONS.ticket}</span>
      <span class="how-text"><strong>${esc(h.label || "Send a request")}</strong><small>${esc(h.detail || "Opens a request in the Request Center")}</small></span>
      <button type="button" class="how-btn" data-ct-request>Start request ${ARROW_R}</button></div>`;
  if (h.type === "link") return `<div class="how how-primary">
      <span class="how-ico"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></span>
      <span class="how-text"><strong>${esc(h.label || "Open website")}</strong><small>${esc(h.detail || h.url.replace(/^https?:\/\//, ""))}</small></span>
      <a class="how-btn" href="${esc(h.url)}" target="_blank" rel="noopener">Open ${ARROW_R}</a></div>`;
  if (h.type === "phone") return `<div class="how">
      <span class="how-ico">${CT_ICONS.phone}</span>
      <span class="how-text"><strong>Call on Zoom</strong><small>${esc(h.value)}</small></span>
      <span class="how-acts"><a class="how-btn" href="${esc(telHref(h.value))}">Call</a><button type="button" class="how-copy" data-ct-copy="${esc(h.value)}" aria-label="Copy number">${CT_ICONS.copy}</button></span></div>`;
  if (h.type === "email") return `<div class="how">
      <span class="how-ico">${CT_ICONS.mail}</span>
      <span class="how-text"><strong>Email</strong><small>${esc(h.value)}</small></span>
      <span class="how-acts"><a class="how-btn" href="mailto:${esc(h.value)}?subject=${encodeURIComponent("Question from " + (state.user?.name || "a teammate"))}">Email</a><button type="button" class="how-copy" data-ct-copy="${esc(h.value)}" aria-label="Copy email">${CT_ICONS.copy}</button></span></div>`;
  return "";
}

/* ==========================================================================
   Notifications: messenger-style pop-ups, chime, and Windows notifications
   ========================================================================== */
const NOTIF_KEY = "hra_notif_prefs";
const NP = Object.assign({ mode: "windows", sound: true }, (() => { try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) || {}; } catch { return {}; } })());
if (NP.mode !== "windows" && NP.mode !== "dashboard") NP.mode = "windows";
const windowsReady = () => NP.mode === "windows" && desktopState() === "granted";
const saveNP = () => { try { localStorage.setItem(NOTIF_KEY, JSON.stringify(NP)); } catch {} };
const desktopSupported = () => "Notification" in window;
const desktopState = () => !desktopSupported() ? "unsupported" : Notification.permission;   // default | granted | denied

let audioCtx = null;
function unlockAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} } if (audioCtx?.state === "suspended") audioCtx.resume().catch(() => {}); }
addEventListener("pointerdown", unlockAudio, { once: false, passive: true });
let chimeOut = null;
function chimeBus() {
  if (chimeOut) return chimeOut;
  const comp = audioCtx.createDynamicsCompressor();          // keeps overlapping notes from getting harsh
  comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
  const master = audioCtx.createGain(); master.gain.value = 1.6; // about 60% louder than before
  master.connect(comp).connect(audioCtx.destination);
  return (chimeOut = master);
}
function chime(kind) {
  if (!NP.sound || !audioCtx) return;
  const bus = chimeBus();
  const t0 = audioCtx.currentTime + 0.02;
  const tone = (freq, at, dur, vol = 0.16, type = "sine") => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0 + at);
    g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
    o.connect(g).connect(bus); o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
  };
  if (kind === "party") { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * .09, .3, .13)); tone(1568, .5, .5, .1); tone(2093, .62, .45, .07); return; }
  if (kind === "alert") { [0, .22, .44].forEach((d) => { tone(880, d, .16, .2, "triangle"); tone(660, d + .1, .14, .16, "triangle"); }); }
  else if (kind === "done") { tone(784, 0, .18); tone(1047, .12, .28); tone(1319, .24, .38, .12); }
  else { tone(988, 0, .2); tone(1319, .14, .36); }      // classic two-note "ding-dong" up
}

const MSGR_ICONS = {
  ticket: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z"/><path d="M12 9v4M10 11h4"/></svg>',
  done:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/></svg>',
  alert:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9.5 17h-19z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>',
  info:   '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg>',
  party:  '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 20.5l4.8-12.8 8 8z"/><path d="M8.3 7.7c2.2 2.2 4.6 5.6 4.4 7.6"/><path d="M14 3.5c.4 1.3-.2 2.4-1.4 2.9M20.5 10c-1.3-.4-2.4.2-2.9 1.4M17 3l.4 1.6M21 7l-1.6.4"/><circle cx="14.8" cy="8.8" r=".7" fill="currentColor"/><circle cx="19.5" cy="14.5" r=".7" fill="currentColor"/></svg>'
};

function messengerPopup({ kind = "info", title, body, action, sticky }) {
  const host = $("#msgr"); if (!host) return;
  while (host.children.length >= 3) host.firstElementChild.remove();
  const el = document.createElement("div");
  el.className = `msgr-win msgr-${kind}`;
  el.setAttribute("role", "alert");
  el.innerHTML = `
    <div class="msgr-bar"><span class="msgr-mark" aria-hidden="true"><svg viewBox="0 0 32 32" width="14" height="14"><rect width="32" height="32" rx="8" fill="#fff"/><path d="M10 8v16M22 8v16M10 16h12" stroke="#F26A26" stroke-width="3.6" stroke-linecap="round"/></svg></span>
      <span class="msgr-app">HRA Dashboard</span><span class="msgr-time">now</span>
      <button type="button" class="msgr-x" aria-label="Close notification"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <button type="button" class="msgr-body">
      <span class="msgr-ico">${MSGR_ICONS[kind] || MSGR_ICONS.info}</span>
      <span class="msgr-text"><strong></strong><span></span>${action ? `<em>Click to open</em>` : ""}</span>
    </button>
    <span class="msgr-life" aria-hidden="true"></span>`;
  $(".msgr-text strong", el).textContent = title;
  $(".msgr-text span", el).textContent = body || "";
  const close = () => { if (el.classList.contains("is-leaving")) return; el.classList.add("is-leaving"); setTimeout(() => el.remove(), 260); };
  $(".msgr-x", el).onclick = close;
  $(".msgr-body", el).onclick = () => { action?.(); close(); };
  const life = sticky ? 0 : kind === "alert" ? 14000 : 8000;
  if (life) {
    el.style.setProperty("--life", life + "ms");
    let timer = setTimeout(close, life);
    el.addEventListener("pointerenter", () => { clearTimeout(timer); el.classList.add("is-paused"); });
    el.addEventListener("pointerleave", () => { el.classList.remove("is-paused"); timer = setTimeout(close, 2500); });
  }
  host.appendChild(el);
}

function desktopNotify({ kind, title, body, action }, force) {
  if (desktopState() !== "granted") return false;
  if (!force && document.visibilityState === "visible" && document.hasFocus()) return false;   // they're already looking at the dashboard
  try {
    const n = new Notification(title, { body, icon: new URL("assets/logo.png", location.href).href, tag: kind + ":" + Date.now(), renotify: true, requireInteraction: kind === "alert" });
    n.onclick = () => { window.focus(); action?.(); n.close(); };
    return true;
  } catch (e) { console.warn("Notification failed", e); return false; }
}

// Old-Messenger style: flash the browser tab title while the dashboard isn't in front.
const BASE_TITLE = document.title;
let flashTimer = null, unseen = 0;
function flashTitle(text) {
  if (document.visibilityState === "visible" && document.hasFocus()) return;
  unseen++;
  clearInterval(flashTimer);
  let on = false;
  flashTimer = setInterval(() => { on = !on; document.title = on ? `🔴 (${unseen}) ${text}` : BASE_TITLE; }, 1000);
}
function stopFlash() { clearInterval(flashTimer); flashTimer = null; unseen = 0; document.title = BASE_TITLE; }
addEventListener("focus", stopFlash);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") stopFlash(); });

function notify(opts) {
  chime(opts.kind);
  // Windows first: shown in the Windows corner even while the dashboard is in front.
  const shown = windowsReady() && desktopNotify(opts, true);
  if (!shown) messengerPopup(opts);
  flashTitle(opts.kind === "alert" ? "URGENT alert" : opts.kind === "party" ? "🎉 Celebration" : opts.title);
  refreshBell();
}

/* ---- notification center (history) ---- */
const NH = { alerts: [], unsubLog: null, read: { all: null, ids: [], cleared: null }, view: "list" };
const readKey = () => "hra_notif_read_" + (state.user?.uid || "");
function loadRead() {
  try { const r = JSON.parse(localStorage.getItem(readKey())); if (r) NH.read = { all: r.all || null, ids: r.ids || [], cleared: r.cleared || null }; } catch {}
  state.store.getPrefs(state.user.uid).then((p) => { if (p?.notifRead) { NH.read = { all: p.notifRead.all || null, ids: p.notifRead.ids || [], cleared: p.notifRead.cleared || null }; refreshBell(); } }).catch(() => {});
}
function saveRead() {
  NH.read.ids = NH.read.ids.slice(-150);
  try { localStorage.setItem(readKey(), JSON.stringify(NH.read)); } catch {}
  state.store.setPrefs(state.user.uid, { notifRead: NH.read }).catch(() => {});
}
function notifItems() {
  if (!state.user) return [];
  const items = [];
  const since = Date.now() - 45 * 86400e3;
  for (const a of NH.alerts) {
    if (!a?.startedAt) continue;
    items.push({ id: "a:" + a.id, group: "important", kind: a.level === "festive" ? "party" : "alert", level: a.level,
      title: a.title, text: a.message || "", by: a.by, at: a.startedAt, live: alertActive(a), open: () => showTakeover(a, true) });
  }
  for (const t of state.tickets) {
    const created = toDate(t.createdAt).toISOString();
    if (state.isAdmin && t.createdBy?.uid !== state.user.uid && new Date(created).getTime() > since)
      items.push({ id: "n:" + t.id, group: "more", kind: "ticket", title: `${t.createdBy?.name || "Someone"} sent a request`, text: t.title, who: t.createdBy?.name, whoUid: t.createdBy?.uid, whoEmail: t.createdBy?.email, at: created, open: () => { setTool("requests"); openTicket(t.id); } });
    if (t.createdBy?.uid === state.user.uid) {
      const done = [...(t.history || [])].reverse().find((h) => h.status === "completed");
      if (t.status === "completed" && done?.at && new Date(done.at).getTime() > since)
        items.push({ id: "c:" + t.id + ":" + done.at, group: "more", kind: "done", title: "Your request was completed", text: `${ref(t.id)}: ${t.title}`, who: done.by, at: done.at, open: () => { setTool("requests"); openTicket(t.id); } });
    }
  }
  return items.filter((x) => !NH.read.cleared || x.at > NH.read.cleared).sort((x, y) => y.at.localeCompare(x.at)).slice(0, 60);
}
const isUnread = (it) => !(NH.read.all && it.at <= NH.read.all) && !NH.read.ids.includes(it.id);

function refreshBell() {
  const btn = $("#bell-btn"); if (!btn || !state.user) return;
  const n = notifItems().filter(isUnread).length;
  let badge = $(".bell-count", btn);
  if (!badge) { badge = document.createElement("span"); badge.className = "bell-count"; btn.appendChild(badge); }
  const prev = badge.textContent;
  badge.textContent = n > 9 ? "9+" : String(n);
  badge.hidden = !n;
  if (n && prev !== badge.textContent) { badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump"); }
  $(".bell-dot").hidden = Boolean(n) || !(NP.mode === "windows" && desktopState() === "default");
  if (!$("#notif-pop").hidden && NH.view === "list") renderNotifPanel();
}

function itemHTML(it) {
  const av = it.kind === "ticket" ? `<span class="nc-av nc-person">${avatarInner(it.who || "?", it.whoUid, it.whoEmail)}</span>`
    : `<span class="nc-av nc-${it.kind}${it.level ? " lv-" + it.level : ""}">${MSGR_ICONS[it.kind] || MSGR_ICONS.info}</span>`;
  return `<li><button type="button" class="nc-item${isUnread(it) ? " is-unread" : ""}" data-nc="${esc(it.id)}">
    <span class="nc-dot" aria-hidden="true"></span>${av}
    <span class="nc-body"><span class="nc-title">${esc(it.title)}</span>${it.text ? `<span class="nc-text">${esc(it.text)}</span>` : ""}
      <span class="nc-meta">${it.live ? `<span class="nc-live">Live now</span>` : ""}${esc(ago(it.at))}${it.by ? ` · from ${esc(it.by)}` : ""}</span></span>
  </button></li>`;
}

function notifPanelHTML() {
  if (NH.view === "settings") return settingsHTML();
  const items = notifItems();
  const imp = items.filter((x) => x.group === "important"), more = items.filter((x) => x.group === "more");
  const unread = items.filter(isUnread).length;
  const ask = NP.mode === "windows" && desktopState() === "default";
  return `<div class="nc-head"><strong>Notifications</strong>
      <span class="nc-tools">
        ${unread ? `<button type="button" class="link-btn" data-nc-readall>Mark all as read</button>` : ""}
        ${items.length ? `<button type="button" class="icon-btn nc-gear nc-clear" data-nc-clear aria-label="Delete all notifications" title="Delete all notifications"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg></button>` : ""}
        <button type="button" class="icon-btn nc-gear" data-nc-view="settings" aria-label="Notification settings" title="Settings"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>
      </span></div>
    ${ask ? `<div class="nc-ask"><span>${MSGR_ICONS.info}</span><span><strong>Get notifications in Windows</strong><small>See alerts and requests even when you're in another app.</small></span><button type="button" class="btn btn-primary btn-mini" data-np-enable>Turn on</button></div>` : ""}
    ${desktopState() === "denied" && NP.mode === "windows" ? `<div class="nc-ask is-warn"><span>${MSGR_ICONS.alert}</span><span><strong>Windows notifications are blocked</strong><small>Allow notifications for this site in your browser's site settings. Until then they show inside the dashboard.</small></span></div>` : ""}
    <div class="nc-scroll">
      ${items.length ? `
        ${imp.length ? `<div class="nc-sec">Important</div><ul class="nc-list">${imp.map(itemHTML).join("")}</ul>` : ""}
        ${more.length ? `<div class="nc-sec">More notifications</div><ul class="nc-list">${more.map(itemHTML).join("")}</ul>` : ""}`
      : `<div class="nc-empty">${MSGR_ICONS.info}<strong>You're all caught up</strong><span>Alerts and request updates will show up here.</span></div>`}
    </div>`;
}

function settingsHTML() {
  const ds = desktopState();
  const winSub = ds === "granted" ? "On. Shows in the corner of Windows, even when you're in another app." : ds === "denied" ? "Blocked in your browser. Allow notifications for this site in the browser's site settings." : ds === "unsupported" ? "Not supported in this browser." : "Needs your permission. Select it to allow.";
  return `<div class="nc-head"><button type="button" class="icon-btn nc-back" data-nc-view="list" aria-label="Back to notifications"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg></button><strong>Notification settings</strong></div>
    <div class="np-sec">Show notifications in</div>
    <div class="np-modes" role="radiogroup">
      <button type="button" role="radio" class="np-mode${NP.mode === "windows" ? " is-on" : ""}" aria-checked="${NP.mode === "windows"}" data-np-mode="windows" ${ds === "unsupported" ? "disabled" : ""}>
        <span class="np-mode-ico"><svg viewBox="0 0 21 21" width="18" height="18"><rect x="1" y="1" width="9" height="9" fill="currentColor"/><rect x="11" y="1" width="9" height="9" fill="currentColor"/><rect x="1" y="11" width="9" height="9" fill="currentColor"/><rect x="11" y="11" width="9" height="9" fill="currentColor"/></svg></span>
        <span><strong>Windows <em>Recommended</em></strong><small>${winSub}</small></span></button>
      <button type="button" role="radio" class="np-mode${NP.mode === "dashboard" ? " is-on" : ""}" aria-checked="${NP.mode === "dashboard"}" data-np-mode="dashboard">
        <span class="np-mode-ico">${MSGR_ICONS.info}</span>
        <span><strong>Inside the dashboard</strong><small>Pop-up windows in the corner of this page only.</small></span></button>
    </div>
    <ul class="np-list">
      <li class="np-row"><span class="np-label"><strong>Sound</strong><small>A short chime with each notification</small></span>
        <button type="button" class="switch" role="switch" aria-checked="${NP.sound}" data-np="sound" aria-label="Sound"><span></span></button></li>
    </ul>
    <button type="button" class="btn btn-ghost np-test" data-np-test>Send me a test</button>
    ${NP.mode === "windows" && ds === "granted" ? `<p class="np-note"><strong>Not seeing the test?</strong> Open Windows Settings → System → Notifications. Make sure your browser is turned on and Do not disturb is off.</p>` : ""}
    <p class="np-note">Notifications arrive while the dashboard is open in a browser tab, even minimized or behind other windows. Anything you miss is saved here in the notification list.</p>`;
}
function renderNotifPanel() { const p = $("#notif-pop"); if (p) p.innerHTML = notifPanelHTML(); }

async function enableWindows() {
  NP.mode = "windows"; saveNP();
  if (desktopState() === "default") {
    const r = await Notification.requestPermission();
    if (r === "granted") { desktopNotify({ kind: "info", title: "Notifications are on", body: "You'll see HRA Dashboard alerts and request updates here in Windows." }, true); toast("Windows notifications are on", "var(--s-done)"); }
    else toast("Windows notifications weren't allowed. They'll show inside the dashboard instead.", "#E0A800");
  }
  renderNotifPanel(); refreshBell();
}

/* ==========================================================================
   All-employees alert
   ========================================================================== */
const ALERT_LEVELS = {
  critical: { label: "Critical", tag: "URGENT" },
  warning:  { label: "Warning",  tag: "IMPORTANT" },
  info:     { label: "Notice",   tag: "NOTICE" },
  festive:  { label: "Festive",  tag: "CELEBRATE" }
};
const ALERT_DURATIONS = [[5, "5 minutes"], [10, "10 minutes"], [30, "30 minutes"], [60, "1 hour"], [240, "4 hours"], [0, "Until I turn it off"]];
const ALERT_TEMPLATES = [
  { name: "Microsoft outage", level: "critical", minutes: 0, title: "Outlook is down worldwide. It's not your account.",
    message: "Microsoft is having an outage. Please don't reset your password or reinstall anything. Emails will send once it's fixed. Use Zoom chat or text for anything urgent. We'll update you here." },
  { name: "System down", level: "critical", minutes: 60, title: "A system is down. We're working on it.",
    message: "[System name] isn't working right now. No action needed on your part. We'll post an update here when it's back." },
  { name: "Planned maintenance", level: "warning", minutes: 30, title: "Scheduled maintenance in progress",
    message: "[System name] may be unavailable until [time]. Save your work. Thanks for your patience." },
  { name: "🎉 Shout-out", level: "festive", minutes: 240, title: "Shout-out to [Name]! 🎉",
    message: "Huge congratulations to [Name] for [achievement]. Thank you for everything you do for the team!" },
  { name: "🎉 Day off", level: "festive", minutes: 0, title: "Surprise! [Day] is a day off for everyone 🎉",
    message: "Thank you for all your hard work. Enjoy the day, rest up, and we'll see you on [return day]." }
];
const AL = { cur: null, unsub: null, tick: null, seen: null, draft: null };
const alertActive = (a) => Boolean(a && a.active && (!a.endsAt || new Date(a.endsAt).getTime() > Date.now()));
const ackKey = (a) => "hra_alert_ack_" + a.id;
const fmtLeft = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}:${String(x).padStart(2, "0")}`; };

function startAlerts() {
  stopAlerts();
  loadRead();
  NH.unsubLog = state.store.watchAlertLog((list) => { NH.alerts = list || []; refreshBell(); });
  AL.unsub = state.store.watchBroadcast(onAlertData);
  AL.tick = setInterval(tickAlert, 1000);
  renderNotifPanel();
}
function stopAlerts() {
  NH.unsubLog?.(); NH.unsubLog = null; NH.alerts = []; NH.read = { all: null, ids: [], cleared: null }; NH.view = "list";
  AL.unsub?.(); AL.unsub = null; clearInterval(AL.tick); AL.cur = null; AL.seen = null;
  $("#alert-root").innerHTML = ""; document.body.classList.remove("has-alert");
}

function onAlertData(a) {
  const wasId = AL.cur?.id;
  AL.cur = a;
  if (alertActive(a) && a.id !== AL.seen) {
    AL.seen = a.id;
    const mine = a.byUid && a.byUid === state.user?.uid;
    let acked = false; try { acked = Boolean(localStorage.getItem(ackKey(a))); } catch {}
    if (!mine && !acked) {
      // Only Critical (red) alerts take over the screen. Warning, Notice and Festive show the banner only.
      if ((a.level || "critical") === "critical") showTakeover(a);
      else {
        try { localStorage.setItem(ackKey(a), "1"); } catch {}
        setTimeout(() => { const b = $("#alert-root .alert-banner"); if (b) { b.classList.remove("is-landing"); void b.offsetWidth; b.classList.add("is-landing"); setTimeout(() => b.classList.remove("is-landing"), 1200); } }, 700);
      }
      notify({ kind: a.level === "festive" ? "party" : "alert", title: a.level === "festive" ? `🎉 ${a.title}` : `${ALERT_LEVELS[a.level]?.tag || "ALERT"}: ${a.title}`, body: a.message || "", action: () => showTakeover(a, true) });
    }
  }
  if (!alertActive(a) && wasId && AL.cur?.id === wasId && !a?.active) $(".alert-takeover")?.remove();
  renderBanner();
  if ($("#alert-compose")) renderComposerLive();
}

function tickAlert() {
  const a = AL.cur;
  if (!a) return;
  if (a.active && a.endsAt && new Date(a.endsAt).getTime() <= Date.now()) { renderBanner(); $(".alert-takeover")?.remove(); return; }
  const left = $("#alert-left"); if (left && a.endsAt) left.textContent = fmtLeft(new Date(a.endsAt) - Date.now());
  const cl = $("#compose-left"); if (cl && a.endsAt) cl.textContent = fmtLeft(new Date(a.endsAt) - Date.now());
}

function renderBanner() {
  const root = $("#alert-root"); if (!root) return;
  const a = AL.cur, on = alertActive(a) && state.user;
  let bar = $(".alert-banner", root);
  if (!on) {
    if (bar) { bar.classList.add("is-leaving"); setTimeout(() => { bar.remove(); document.body.classList.remove("has-alert"); }, 280); }
    else document.body.classList.remove("has-alert");
    return;
  }
  const lv = ALERT_LEVELS[a.level] ? a.level : "critical";
  const html = `
    <div class="alert-stripes" aria-hidden="true"></div><div class="alert-shine" aria-hidden="true"></div>
    <div class="alert-inner">
      ${lv === "festive" ? `<div class="alert-confetti" aria-hidden="true">${confettiBits(26)}</div>` : ""}
      <span class="alert-siren" aria-hidden="true"><span class="siren-ring"></span><span class="siren-ring r2"></span>${lv === "festive" ? MSGR_ICONS.party : MSGR_ICONS.alert}</span>
      <span class="alert-tag">${esc(ALERT_LEVELS[lv].tag)}</span>
      <span class="alert-copy"><strong class="alert-title">${esc(a.title)}</strong>${a.message ? `<span class="alert-msg">${esc(a.message)}</span>` : ""}</span>
      <span class="alert-side">
        ${a.endsAt ? `<span class="alert-timer" title="This alert ends automatically"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span id="alert-left">${fmtLeft(new Date(a.endsAt) - Date.now())}</span></span>` : ""}
        ${a.message ? `<button type="button" class="alert-more" data-alert-more>Details</button>` : ""}
        ${state.isAdmin ? `<button type="button" class="alert-end" data-alert-end>End alert</button>` : ""}
      </span>
    </div>`;
  if (!bar) {
    bar = document.createElement("div");
    root.appendChild(bar);
  }
  bar.className = `alert-banner lv-${lv}`;
  bar.setAttribute("role", "alert");
  bar.innerHTML = html;
  document.body.classList.add("has-alert");
  const setH = () => { const b = $(".alert-banner:not(.is-leaving)", root); if (b) document.documentElement.style.setProperty("--alert-h", b.offsetHeight + "px"); };
  requestAnimationFrame(setH); setTimeout(setH, 300);
  if (!AL.ro && window.ResizeObserver) { AL.ro = new ResizeObserver(setH); }
  AL.ro?.disconnect(); AL.ro?.observe(bar);
}

function showTakeover(a, past) {
  $(".alert-takeover")?.remove();
  const lv = ALERT_LEVELS[a.level] ? a.level : "critical";
  const fest = lv === "festive";
  const el = document.createElement("div");
  el.className = `alert-takeover lv-${lv}`;
  el.dataset.alertId = a.id;
  el.innerHTML = `<div class="tk-card" role="alertdialog" aria-modal="true" aria-labelledby="tk-title">
      <div class="alert-stripes" aria-hidden="true"></div>
      <span class="tk-siren" aria-hidden="true"><span class="siren-ring"></span><span class="siren-ring r2"></span><span class="siren-ring r3"></span>${fest ? MSGR_ICONS.party : MSGR_ICONS.alert}</span>
      <span class="tk-tag">${esc(ALERT_LEVELS[lv].tag)} · ${past && !alertActive(a) ? "PAST MESSAGE" : "MESSAGE TO ALL EMPLOYEES"}</span>
      <h2 id="tk-title">${esc(a.title)}</h2>
      ${a.message ? `<p>${esc(a.message)}</p>` : ""}
      <span class="tk-from">From ${esc(a.by || "an admin")}, ${esc(past ? fullDate(a.startedAt) : new Date(a.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }))}</span>
      <button type="button" class="tk-ok" data-alert-ack>${fest ? "Woohoo! 🎉" : past ? "Close" : "Got it"}</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("is-open"));
  setTimeout(() => $(".tk-ok", el)?.focus(), 300);
  if (fest) setTimeout(() => confettiBurst(), 250);
}
function ackTakeover() {
  const el = $(".alert-takeover"); if (!el) return;
  if (el.classList.contains("lv-festive")) confettiBurst(true);
  if (el.dataset.alertId) { try { localStorage.setItem("hra_alert_ack_" + el.dataset.alertId, "1"); } catch {} }
  el.classList.add("is-closing");
  setTimeout(() => el.remove(), 340);
  $(".alert-banner")?.classList.add("is-landing");
  setTimeout(() => $(".alert-banner")?.classList.remove("is-landing"), 1200);
}

/* ---- confetti ---- */
const PARTY_COLORS = ["#F26A26", "#FFD23F", "#3BCEAC", "#2D6BFF", "#EE4266", "#9B5DE5", "#FFFFFF"];
function confettiBits(n) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const c = PARTY_COLORS[i % PARTY_COLORS.length], left = (i * 37) % 100, dur = 3 + (i % 5) * .7, delay = -((i * 0.53) % dur), round = i % 3 === 0;
    out += `<i style="left:${left}%;background:${c};animation-duration:${dur}s;animation-delay:${delay}s;${round ? "border-radius:50%;width:7px;height:7px;" : ""}"></i>`;
  }
  return out;
}
function confettiBurst(small) {
  if (reduceMotion) return;
  const cv = document.createElement("canvas");
  cv.className = "confetti-canvas";
  document.body.appendChild(cv);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = innerWidth, H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
  const N = small ? 90 : 220, parts = [];
  const spawn = (x, y, angle, spread, speed) => {
    const a = angle + (Math.random() - .5) * spread, v = speed * (.55 + Math.random() * .6);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: 6 + Math.random() * 6, h: 8 + Math.random() * 10, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      c: PARTY_COLORS[(Math.random() * PARTY_COLORS.length) | 0], shape: Math.random() < .3 ? "circle" : "rect", wob: Math.random() * 10 });
  };
  for (let i = 0; i < N / 2; i++) spawn(0, H * .75, -Math.PI / 3, .9, 17);          // left cannon
  for (let i = 0; i < N / 2; i++) spawn(W, H * .75, -Math.PI * 2 / 3, .9, 17);      // right cannon
  if (!small) for (let i = 0; i < 70; i++) spawn(Math.random() * W, -20, Math.PI / 2, .6, 3);   // top rain
  const start = performance.now();
  let last = start;
  const frame = (now) => {
    const t = now - start, k = Math.min(3, (now - last) / 16.67);   // time-based, so it looks the same at any frame rate
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += .32 * k; p.vx *= Math.pow(.992, k); p.vy *= Math.pow(.992, k);
      p.x += (p.vx + Math.sin((t / 200) + p.wob) * .6) * k; p.y += p.vy * k; p.r += p.vr * k;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.globalAlpha = Math.max(0, Math.min(1, 1 - (t - 2600) / 1200));
      if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(t / 120 + p.wob)), p.w, p.h * Math.abs(Math.cos(t / 120 + p.wob)) + 1);
      ctx.restore();
    }
    if (t < 3800) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame);
}

/* ---- composer (admins) ---- */
function openAlertComposer() {
  if (!state.isAdmin) return;
  AL.draft = AL.draft || { level: "critical", minutes: 10, title: "", message: "" };
  swapModal(`<div id="alert-compose">
    <div class="modal-head">
      <span class="type-icon ac-icon">${MSGR_ICONS.alert}</span>
      <div><h2 id="modal-title">Alert all employees</h2><p>Shows a banner on everyone's screen and sends them a notification.</p></div>
    </div>
    <div id="ac-live"></div>
    <div class="ac-templates"><span>Start from:</span>${ALERT_TEMPLATES.map((t, i) => `<button type="button" class="ct-try-btn" data-ac-tpl="${i}">${esc(t.name)}</button>`).join("")}</div>
    <form class="modal-form" id="ac-form" novalidate>
      <label class="field"><span class="field-label">Headline</span><input id="ac-title" maxlength="90" required placeholder="e.g. Outlook is down worldwide. It's not your account." value="${esc(AL.draft.title)}" /></label>
      <label class="field"><span class="field-label">Message<span class="opt">optional</span></span><textarea id="ac-msg" maxlength="320" placeholder="What's happening and what people should do">${esc(AL.draft.message)}</textarea></label>
      <div class="field"><span class="field-label">Look<span class="opt">Critical also shows a full-screen alert. The others show the banner only.</span></span>
        <div class="ac-levels" role="radiogroup" aria-label="Alert style">${Object.entries(ALERT_LEVELS).map(([k, v]) => `<button type="button" role="radio" class="ac-level lv-${k}${AL.draft.level === k ? " is-on" : ""}" aria-checked="${AL.draft.level === k}" data-ac-level="${k}"><i></i>${v.label}</button>`).join("")}</div></div>
      <div class="field"><span class="field-label">Show it for</span>
        <div class="chips">${ALERT_DURATIONS.map(([m, l]) => `<button type="button" class="chip" aria-pressed="${AL.draft.minutes === m}" data-ac-min="${m}">${l}</button>`).join("")}</div></div>
      <div class="field"><span class="field-label">Preview</span><div class="ac-preview" id="ac-preview"></div></div>
      <p class="form-error" id="ac-error" role="alert"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn ac-send${AL.draft.level === "festive" ? " is-festive" : ""}"><span class="btn-text">${AL.draft.level === "festive" ? "Celebrate with everyone 🎉" : "Send to everyone"}</span><span class="spinner" aria-hidden="true"></span></button>
      </div>
    </form>
  </div>`);
  renderComposerLive(); renderPreview();
  setTimeout(() => $("#ac-title")?.focus(), 300);
}
function renderComposerLive() {
  const box = $("#ac-live"); if (!box) return;
  const a = AL.cur;
  box.innerHTML = alertActive(a) ? `<div class="ac-live lv-${a.level}"><span class="ac-dot"></span><span><strong>Live now:</strong> ${esc(a.title)}${a.endsAt ? `<em>Ends in <span id="compose-left">${fmtLeft(new Date(a.endsAt) - Date.now())}</span></em>` : `<em>Until turned off</em>`}</span><button type="button" class="btn-mini" data-alert-end>End now</button></div>` : "";
}
function renderPreview() {
  const d = AL.draft, el = $("#ac-preview"); if (!el) return;
  el.innerHTML = `<div class="alert-banner is-preview lv-${d.level}"><div class="alert-stripes"></div><div class="alert-shine"></div>${d.level === "festive" ? `<div class="alert-confetti">${confettiBits(16)}</div>` : ""}<div class="alert-inner">
    <span class="alert-siren"><span class="siren-ring"></span>${d.level === "festive" ? MSGR_ICONS.party : MSGR_ICONS.alert}</span><span class="alert-tag">${ALERT_LEVELS[d.level].tag}</span>
    <span class="alert-copy"><strong class="alert-title">${esc(d.title || "Your headline appears here")}</strong>${d.message ? `<span class="alert-msg">${esc(d.message)}</span>` : ""}</span>
    ${d.minutes ? `<span class="alert-side"><span class="alert-timer">${d.minutes >= 60 ? d.minutes / 60 + "h 00m" : d.minutes + ":00"}</span></span>` : ""}</div></div>`;
}
async function sendAlert(btn) {
  const d = AL.draft;
  d.title = $("#ac-title").value.trim(); d.message = $("#ac-msg").value.trim();
  if (!d.title) { $("#ac-error").textContent = "Add a headline so people know what's happening."; $("#ac-title").focus(); return; }
  const yes = await confirmDialog({ title: "Alert everyone now?", body: `Everyone signed in to the dashboard will see <strong>${esc(d.title)}</strong> right away${d.minutes ? `, for ${esc(ALERT_DURATIONS.find(([m]) => m === d.minutes)[1])}` : " until you turn it off"}.`, confirm: "Send alert", danger: false });
  if (!yes) return;
  closeOverlay($("#confirm"));
  btn.classList.add("is-loading");
  const now = new Date();
  const data = { active: true, id: Math.random().toString(36).slice(2, 10) + now.getTime().toString(36), level: d.level, title: d.title, message: d.message,
    startedAt: now.toISOString(), endsAt: d.minutes ? new Date(now.getTime() + d.minutes * 60e3).toISOString() : null, by: state.user.name, byUid: state.user.uid };
  try {
    await state.store.setBroadcast(data);
    state.store.logAlert(data).catch((e) => console.warn("Alert not saved to history", e));
    AL.draft = null;
    closeOverlay($("#modal"));
    toast("Alert sent to everyone", "var(--s-done)");
  } catch (e) {
    console.error(e); btn.classList.remove("is-loading");
    $("#ac-error").textContent = e?.code === "permission-denied" ? "Only admins can send alerts." : "The alert didn't send. Check your connection and try again.";
  }
}
async function endAlert() {
  const a = AL.cur; if (!a) return;
  const yes = await confirmDialog({ title: "End this alert?", body: `The banner <strong>${esc(a.title)}</strong> will disappear for everyone.`, confirm: "End alert", danger: true });
  if (!yes) return;
  closeOverlay($("#confirm"));
  try {
    const ended = { ...a, active: false, endedAt: new Date().toISOString(), endedBy: state.user.name };
    await state.store.setBroadcast(ended);
    state.store.logAlert({ id: a.id, active: false, endedAt: ended.endedAt, endedBy: ended.endedBy }).catch(() => {});
    toast("Alert ended", "var(--muted)");
  }
  catch (e) { console.error(e); toast("Couldn't end the alert. Try again.", "#E2632B"); }
}

/* ==========================================================================
   Helper chat: routes problems to the right person or request form, and
   answers questions about the Client Pipeline
   ========================================================================== */
const HC = CFG.helper || {};
const HP = { msgs: [], open: false, busy: false };
const STOP = new Set(["what", "whats", "is", "our", "the", "a", "an", "for", "to", "of", "how", "do", "we", "where", "can", "find", "get", "hey", "hi", "hello", "please", "need", "about", "with", "on", "in", "and", "or", "it", "there", "this", "that", "you", "your", "does", "should", "be", "are", "any", "have", "has", "help", "question", "questions", "i", "my", "me", "im", "issue", "issues", "problem", "problems", "not", "working", "doesnt", "dont", "cant", "wont", "isnt"]);
const norm = (x) => String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'`´]/g, "").replace(/[^a-z0-9&\s]+/g, " ").replace(/\s+/g, " ").trim();
const stem = (w) => w.replace(/(ings|ing|ers|er|es|s)$/i, "");
const qWords = (q) => norm(q).split(" ").filter((w) => w && !STOP.has(w));
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + "s")}`;
const listJoin = (a) => a.length < 2 ? (a[0] || "") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1];

/* ---------- problem routing: people + request forms ---------- */
function personMatch(words, raw) {
  return PEOPLE().map((p, i) => {
    const handles = (p.handles || []).map(norm), keys = (p.keywords || []).map(norm), name = norm(p.name);
    let sc = 0;
    for (const k of keys) if (k.includes(" ") && raw.includes(k)) sc += 6;
    for (const w of words) {
      const st = stem(w);
      if (w.length > 2 && name.split(" ").includes(w)) sc += 6;
      else if (keys.some((k) => k === w || stem(k) === st) || handles.some((h) => h.split(" ").some((x) => stem(x) === st))) sc += 5;
    }
    return { p, i, s: sc };
  }).filter((x) => x.s >= 5).sort((a, b) => b.s - a.s)[0] || null;
}
function requestMatch(words, raw) {
  let best = null;
  for (const [key, t] of Object.entries(CFG.requestTypes)) {
    if (!canUseType(t)) continue;
    const keys = (t.keywords || []).map(norm), label = norm(t.label);
    let sc = 0;
    for (const k of keys) if (k.includes(" ") && raw.includes(k)) sc += 7;
    for (const w of words) { if (w.length > 2 && (keys.includes(w) || label.split(" ").includes(w))) sc += 5; }
    if (sc > (best?.sc || 0)) best = { key, t, sc };
  }
  return best && best.sc >= 5 ? best : null;
}

/* ---------- pipeline questions ---------- */
async function ensurePipeline() {
  if (!PL.started) startPipeline();
  for (let i = 0; i < 50 && !PL.clients.length; i++) await new Promise((r) => setTimeout(r, 100));
  return PL.clients.length > 0;
}
const GENERIC = new Set(["plumbing", "electric", "hvac", "air", "heating", "home", "services", "sewer", "drain", "and", "the", "builders", "roofing", "climate", "co", "inc", "llc"]);
function findEntity(qn, names, { tokens = true } = {}) {
  const padded = ` ${qn} `;
  const full = names.filter((n) => padded.includes(` ${norm(n)} `)).sort((a, b) => b.length - a.length);
  if (full.length) return { name: full[0] };
  if (!tokens) return null;
  const toks = new Set(qn.split(" "));
  const hits = names.filter((n) => norm(n).split(" ").some((t) => t.length >= 3 && !GENERIC.has(t) && toks.has(t)));
  if (hits.length === 1) return { name: hits[0] };
  if (hits.length > 1) return { ambiguous: hits, token: [...toks].find((t) => hits.every((h) => norm(h).split(" ").includes(t))) };
  return null;
}
function parsePeriod(qn) {
  const today = new Date(); const iso = isoDay;
  const mk = (s, e, label) => ({ s: iso(s), e: iso(e), label });
  if (/\btoday\b/.test(qn)) return mk(today, today, "today");
  if (/\bthis week\b/.test(qn)) { const s = new Date(today); s.setDate(s.getDate() - ((s.getDay() + 6) % 7)); return mk(s, today, "this week"); }
  if (/\blast week\b/.test(qn)) { const e = new Date(today); e.setDate(e.getDate() - ((e.getDay() + 6) % 7) - 1); const s = new Date(e); s.setDate(s.getDate() - 6); return mk(s, e, "last week"); }
  if (/\bthis month\b/.test(qn)) return mk(new Date(today.getFullYear(), today.getMonth(), 1), today, "this month");
  if (/\blast month\b/.test(qn)) return mk(new Date(today.getFullYear(), today.getMonth() - 1, 1), new Date(today.getFullYear(), today.getMonth(), 0), "last month");
  if (/\b(this year|ytd|year to date)\b/.test(qn)) return mk(new Date(today.getFullYear(), 0, 1), today, "this year");
  if (/\blast year\b/.test(qn)) return mk(new Date(today.getFullYear() - 1, 0, 1), new Date(today.getFullYear() - 1, 11, 31), "last year");
  const m = qn.match(/\b(last|past)\s+(\d{1,3})\s+(day|days|week|weeks|month|months)\b/);
  if (m) { const n = Number(m[2]) * (m[3].startsWith("week") ? 7 : m[3].startsWith("month") ? 30 : 1); const s = new Date(today); s.setDate(s.getDate() - n + 1); return mk(s, today, `the last ${m[2]} ${m[3]}`); }
  if (/\b(last|past) (quarter|3 months)\b/.test(qn)) { const s = new Date(today); s.setDate(s.getDate() - 89); return mk(s, today, "the last 90 days"); }
  return null;
}
const METRIC_WORDS = [
  ["noShows", /\bno ?shows?\b/, "no-show", "no-shows"],
  ["fell", /\bfell through|declined offers?|backed out\b/, "candidate who fell through", "candidates who fell through"],
  ["rate", /\bhire rate|conversion|success rate\b/, "", ""],
  ["hires", /\bhires?\b|\bhired\b|\bplacements?\b|\bplaced\b/, "hire", "hires"],
  ["interviews", /\binterview/, "interview", "interviews"],
  ["inProcess", /\bin process\b|\bactive\b|\bpending\b|\bopen\b|\bstill (in|going)\b/, "candidate in process", "candidates in process"],
  ["submitted", /\bsubmit|\bsubmissions?\b|\bsent\b|\bcandidates?\b/, "candidate submitted", "candidates submitted"]
];
function pipelineIntent(q) {
  const qn = norm(q);
  const rows = insightRows();
  const ams = PL.ams.filter((a) => !a.unassigned).map((a) => a.name);
  const clients = PL.clients.map((c) => c.name);
  const recruiters = [...new Set(rows.map((r) => r.recruiter))].filter((x) => x && x !== "Not recorded");
  const candidates = [...new Set(rows.map((r) => r.name))];
  const me = /\b(i|my|me|mine)\b/.test(qn) ? PL.ams.find((a) => a.isMe)?.name : null;

  const amE = findEntity(qn, ams), clE = findEntity(qn, clients), rcE = findEntity(qn, recruiters.filter((r) => !ams.includes(r))), cdE = findEntity(qn, candidates, { tokens: false });
  for (const e of [amE, rcE, clE]) if (e?.ambiguous) return { kind: "ambiguous", options: e.ambiguous, token: e.token, q };
  const am = amE?.name || (!clE && !rcE && me) || null, client = clE?.name || null, recruiter = rcE?.name || null, cand = cdE?.name || null;
  const metric = METRIC_WORDS.find(([, re]) => re.test(qn));
  const period = parsePeriod(qn);
  const pipeWords = /\b(clients?|accounts?|candidates?|hires?|hired|placements?|placed|submit\w*|interview\w*|pipeline|recruiters?|account managers?|no ?shows?|in process|status)\b/.test(qn);

  if (cand && !am && !client) return { kind: "candidate", name: cand };
  if (/\b(who|which)\b.*\b(account manager|am|manages|managing|handles)\b/.test(qn) && client) return { kind: "clientAm", client };
  if (/\b(most|best|top|leader|leading|highest|winning)\b/.test(qn) && (metric || /\bhires?\b/.test(qn))) {
    const dim = /\bclients?\b/.test(qn) ? "client" : /\baccount managers?\b|\bams?\b/.test(qn) ? "am" : "recruiter";
    return { kind: "top", dim, metric: metric?.[0] === "submitted" ? "submitted" : metric?.[0] || "hires", period, am, client };
  }
  if (/\bclients?\b|\baccounts\b/.test(qn) && (am || me) && !/\bhires?|submit|interview|candidates?\b/.test(qn)) return { kind: "amClients", am: am || me };
  if (metric && (am || client || recruiter || pipeWords)) return { kind: "count", metric: metric[0], period, am, client, recruiter };
  if ((am || client) && pipeWords) return { kind: am && !client ? "amClients" : "count", am, client, metric: "submitted", period };
  if (!am && !client && !recruiter && /\b(clients|account managers)\b/.test(qn) && /\bhow many|list|which|what\b/.test(qn)) return { kind: "overview" };
  return null;
}

function countFor(rows, metric, rg) {
  const m = metricsFor(rows, rg);
  if (metric === "inProcess") return rows.filter((r) => r.status === "in_process").length;
  return m[metric] ?? m.submitted;
}
const metricNoun = (metric, n) => { const w = METRIC_WORDS.find(([k]) => k === metric); return w ? plural(n, w[2], w[3]).replace(/^\d+ /, "") : ""; };

function pipelineAnswer(it) {
  const rows = insightRows();
  const allRg = { s: rows.reduce((m, r) => (r.submitted && r.submitted < m ? r.submitted : m), isoDay(new Date())), e: isoDay(new Date()) };
  const rg = it.period || allRg;
  const when = it.period ? ` ${it.period.label}` : it.metric === "inProcess" ? " right now" : " (all time)";
  const btn = (label, attrs) => `<button type="button" class="hp-action" ${attrs}><span class="hp-doc-ico">${ICONS.pipeline || '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M9 9.5V20"/></svg>'}</span><span class="hp-doc-text"><strong>${esc(label)}</strong><em>Open in Client Pipeline</em></span><span class="hp-doc-go">${ARROW_R}</span></button>`;
  const stat = (n, label) => `<div class="hp-stat"><span class="hp-stat-num" data-count="${n}">${n}</span><span class="hp-stat-label">${esc(label)}</span></div>`;
  const brk = (pairs) => pairs.length ? `<div class="hp-break">${pairs.map(([k, v], i) => `<div style="--i:${i}"><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div>` : "";

  if (it.kind === "ambiguous") {
    return `<div class="hp-bubble-text">Which one do you mean?</div><div class="hp-chips">${it.options.map((o) => `<button type="button" class="hp-chip" data-hp-ask="${esc(it.token ? norm(it.q).replace(new RegExp(`\\b${it.token}\\b`), norm(o)) : it.q + " " + o)}">${esc(o)}</button>`).join("")}</div>`;
  }
  if (it.kind === "overview") {
    const ams = PL.ams.filter((a) => !a.unassigned);
    return `<div class="hp-bubble-text">We have <strong>${plural(PL.clients.length, "client")}</strong> across <strong>${plural(ams.length, "account manager")}</strong>.</div>${brk(ams.map((a) => [a.name, (a.clients || []).length]))}`;
  }
  if (it.kind === "amClients") {
    const a = PL.ams.find((x) => x.name === it.am);
    if (!a) return null;
    const list = a.clients || [];
    const live = list.map((n) => [n, (clientDoc(n)?.candidates || []).filter((r) => r.status === "in_process").length]);
    return `<div class="hp-bubble-text">${a.isMe ? "You have" : `<strong>${esc(a.name)}</strong> has`} <strong>${plural(list.length, "client")}</strong> right now${list.length ? `: ${esc(listJoin(list))}.` : "."}</div>
      ${stat(list.length, list.length === 1 ? "client" : "clients")}${brk(live.map(([n, k]) => [n, `${k} in process`]))}
      ${btn(`${a.isMe ? "My" : a.name.split(" ")[0] + "’s"} clients`, `data-hp-pipe="${esc(a.name)}|"`)}`;
  }
  if (it.kind === "clientAm") {
    const am = PL.ams.find((a) => (a.clients || []).some((n) => sameName(n, it.client)));
    return `<div class="hp-bubble-text"><strong>${esc(it.client)}</strong> is managed by <strong>${esc(am?.name || "no one yet")}</strong>.</div>${am ? btn(it.client, `data-hp-pipe="${esc(am.name)}|${esc(it.client)}"`) : ""}`;
  }
  if (it.kind === "candidate") {
    const r = rows.filter((x) => x.name === it.name).sort((a, b) => (b.submitted || "").localeCompare(a.submitted || ""))[0];
    if (!r) return null;
    const st = PSTATUS[r.status] || PSTATUS.in_process;
    return `<div class="hp-bubble-text"><strong>${esc(r.name)}</strong> was submitted to <strong>${esc(r.client)}</strong> for ${esc(r.role)} on ${esc(fmtDay(r.submitted))}.</div>
      <div class="hp-cand" style="--sw:#${st.fill};--bar:${st.bar}"><span class="hp-cand-st"><i></i>${esc(st.short)}</span>
        ${[["Interview", r.interview], ["Hired", r.hired], ["Recruiter", r.recruiter]].filter(([, v]) => v).map(([k, v]) => `<span><small>${k}</small>${esc(v)}</span>`).join("")}
        ${r.notes ? `<p>${esc(r.notes.split("\n")[0])}</p>` : ""}</div>
      ${btn("Open their notes", `data-hp-note="${esc(r.client)}|${esc(r.id)}"`)}`;
  }
  if (it.kind === "top") {
    const list = computeBoard(rows, rg, it.dim).map((e) => ({ name: e.name, v: it.metric === "rate" ? e.rate : it.metric === "inProcess" ? null : e[it.metric] })).filter((e) => e.v != null && e.v > 0).sort((a, b) => b.v - a.v);
    if (!list.length) return `<div class="hp-bubble-text">No ${esc(metricNoun(it.metric, 2) || "results")}${esc(when)} yet.</div>`;
    const fmtV = (v) => it.metric === "rate" ? Math.round(v * 100) + "%" : v;
    const who = it.dim === "client" ? "client" : it.dim === "am" ? "account manager" : "recruiter";
    return `<div class="hp-bubble-text">🏆 <strong>${esc(list[0].name)}</strong> is the top ${who} for ${esc(it.metric === "rate" ? "hire rate" : metricNoun(it.metric, 2))}${esc(when)}, with <strong>${fmtV(list[0].v)}</strong>.</div>${brk(list.slice(0, 5).map((e, i) => [`${i + 1}. ${e.name}`, fmtV(e.v)]))}`;
  }
  if (it.kind === "count") {
    let pool = rows, subject = "Across all clients, there", btnHtml = "";
    if (it.client) { pool = rows.filter((r) => sameName(r.client, it.client)); subject = `<strong>${esc(it.client)}</strong>`; const am = PL.ams.find((a) => (a.clients || []).some((n) => sameName(n, it.client))); if (am) btnHtml = btn(it.client, `data-hp-pipe="${esc(am.name)}|${esc(it.client)}"`); }
    else if (it.am) { pool = rows.filter((r) => r.am === it.am); subject = `<strong>${esc(it.am)}</strong>’s clients`; btnHtml = btn(`${it.am.split(" ")[0]}’s clients`, `data-hp-pipe="${esc(it.am)}|"`); }
    if (it.recruiter) { pool = pool.filter((r) => r.recruiter === it.recruiter); subject = it.client || it.am ? `${subject}, recruiter <strong>${esc(it.recruiter)}</strong>,` : `<strong>${esc(it.recruiter)}</strong>`; }
    if (it.metric === "rate") {
      const m = metricsFor(pool, rg);
      return `<div class="hp-bubble-text">${subject} ${m.submitted ? `hired <strong>${Math.round((m.rate || 0) * 100)}%</strong> of submitted candidates` : "had no submitted candidates"}${esc(when)}.</div>${stat(Math.round((m.rate || 0) * 100), "% hire rate")}${btnHtml}`;
    }
    const n = countFor(pool, it.metric, rg);
    const noun = metricNoun(it.metric, n);
    const verbSubject = subject.startsWith("Across") ? `${subject} ${n === 1 ? "was" : "were"} <strong>${n} ${esc(noun)}</strong>` : `${subject} ${it.metric === "inProcess" ? "ha" + (subject.includes("’s clients") ? "ve" : "s") : "had"} <strong>${n} ${esc(noun)}</strong>`;
    const by = it.client ? "recruiter" : it.am || !it.recruiter ? "client" : "client";
    const groups = new Map();
    const inR = (d) => d && d >= rg.s && d <= rg.e;
    pool.forEach((r) => {
      const ok = it.metric === "inProcess" ? r.status === "in_process" : it.metric === "hires" ? r.status === "hired" && inR(r.hiredAt || r.submitted) : it.metric === "interviews" ? inR(r.interviewAt || (isY(r) ? r.submitted : "")) : it.metric === "noShows" ? r.status === "no_show" && inR(r.interviewAt || r.submitted) : it.metric === "fell" ? r.status === "fell_through" && inR(r.hiredAt || r.submitted) : inR(r.submitted);
      if (ok) groups.set(r[by], (groups.get(r[by]) || 0) + 1);
    });
    const pairs = [...groups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return `<div class="hp-bubble-text">${verbSubject}${esc(when)}.</div>${stat(n, `${noun}${when}`)}${pairs.length > 1 ? brk(pairs) : ""}${btnHtml}`;
  }
  return null;
}

/* ---------- answering ---------- */
async function answerFor(q) {
  const raw = norm(q), words = qWords(q);
  // Client Pipeline questions
  const looksPipeline = /\b(clients?|candidates?|hires?|hired|placements?|placed|submit\w*|interview\w*|pipeline|no ?shows?|in process|status of|account manager for|who manages|top recruiter|most hires|hire rate)\b/.test(raw);
  if (looksPipeline || PL.clients.length) {
    if (looksPipeline) await ensurePipeline();
    if (PL.clients.length) {
      const it = pipelineIntent(q);
      if (it) { const html = pipelineAnswer(it); if (html) return html; }
    }
  }
  // Problems → person and/or request form
  const person = personMatch(words, raw), req = requestMatch(words, raw);
  const out = [];
  if (person && (!req || person.s >= req.sc)) out.push(personAnswer(person.p, person.i));
  if (req) out.push(`<div class="hp-bubble-text">${out.length ? "Or send a request:" : "You can send a request for that:"}</div>
      <button type="button" class="hp-action" data-hp-request="${esc(req.key)}"><span class="hp-doc-ico">${ICONS[req.t.icon] || ICONS.spark}</span><span class="hp-doc-text"><strong>${esc(req.t.label)}</strong><small>${esc(req.t.blurb)}</small><em>Open the request form</em></span><span class="hp-doc-go">${ARROW_R}</span></button>`);
  if (person && req && person.s < req.sc) out.push(personAnswer(person.p, person.i, true));
  if (out.length) return out.join("");
  return `<div class="hp-bubble-text">I'm not sure about that one. I can help you <strong>find who to contact</strong>, <strong>pick the right request</strong>, or <strong>answer questions about the client pipeline</strong>. Try something like “my Outlook login isn't working” or “how many hires did we have this month?”</div>
    <div class="hp-chips"><button type="button" class="hp-chip" data-hp-contacts>See Who to contact</button><button type="button" class="hp-chip" data-hp-tool="requests">Browse requests</button></div>`;
}

function personAnswer(p, i, secondary) {
  const [c1, c2] = CT_COLORS[p.color] || CT_COLORS.navy;
  const acts = (p.how || []).map((h) => {
    if (h.type === "request") return `<button type="button" class="hp-mini" data-hp-request="general">${esc(h.label || "Send a request")}</button>`;
    if (h.type === "link") return `<a class="hp-mini" href="${esc(h.url)}" target="_blank" rel="noopener">${esc(h.label || "Open")} ↗</a>`;
    if (h.type === "phone") return `<a class="hp-mini" href="${esc(telHref(h.value))}">Call ${esc(h.value)}</a>`;
    if (h.type === "email") return `<a class="hp-mini hp-mini-ghost" href="mailto:${esc(h.value)}">Email</a>`;
    return "";
  }).join("");
  return `<div class="hp-bubble-text">${secondary ? "You can also reach" : "For that, reach out to"} <strong>${esc(p.name)}</strong>.</div>
    <div class="hp-person" style="--c1:${c1};--c2:${c2}">
      <div class="hp-person-top"><span class="hp-person-av">${esc(initials(p.name))}</span><span class="hp-doc-text"><strong>${esc(p.name)}</strong><small>${esc(p.summary || "")}</small></span></div>
      <div class="hp-person-acts">${acts}<button type="button" class="hp-mini hp-mini-ghost" data-hp-person="${i}">Details</button></div>
    </div>`;
}

function hpMsgHTML(m) {
  if (m.from === "me") return `<div class="hp-msg hp-me"><div class="hp-bubble-text">${esc(m.text)}</div></div>`;
  if (m.typing) return `<div class="hp-msg hp-bot"><div class="hp-bubble-text hp-typing"><i></i><i></i><i></i></div></div>`;
  return `<div class="hp-msg hp-bot">${m.html}</div>`;
}
function renderHelper() {
  const box = $("#hp-msgs"); if (!box) return;
  box.innerHTML = `<div class="hp-msg hp-bot"><div class="hp-bubble-text">${esc(HC.greeting || "Hi! What do you need?")}</div></div>` + HP.msgs.map(hpMsgHTML).join("");
  box.scrollTop = box.scrollHeight;
}
async function askHelper(q) {
  q = String(q || "").trim(); if (!q || HP.busy) return;
  HP.busy = true;
  HP.msgs.push({ from: "me", text: q }, { from: "bot", typing: true });
  renderHelper();
  const started = Date.now();
  let html;
  try { html = await answerFor(q); } catch (e) { console.error(e); html = `<div class="hp-bubble-text">Something went wrong on my side. Please try asking again.</div>`; }
  const wait = Math.max(0, (reduceMotion ? 0 : 600) - (Date.now() - started));
  await new Promise((r) => setTimeout(r, wait));
  HP.msgs.pop();
  HP.msgs.push({ from: "bot", html });
  HP.busy = false;
  renderHelper();
  $$("#hp-msgs .hp-msg:last-child .hp-stat-num").forEach((el) => { const to = Number(el.dataset.count); if (isFinite(to) && !reduceMotion) { el.dataset.fmt = "int"; countUp(el); } });
  try { sessionStorage.setItem("hra_helper_" + (state.user?.uid || ""), JSON.stringify(HP.msgs.slice(-30))); } catch {}
}
function toggleHelper(force) {
  HP.open = force ?? !HP.open;
  const panel = $("#hp-panel"), bubble = $("#hp-bubble");
  bubble.setAttribute("aria-expanded", String(HP.open));
  bubble.classList.toggle("is-open", HP.open);
  if (HP.open) {
    panel.hidden = false; requestAnimationFrame(() => panel.classList.add("is-open"));
    renderHelper();
    try { localStorage.setItem("hra_helper_seen", "1"); } catch {}
    bubble.classList.remove("is-new");
    if (matchMedia("(pointer: fine)").matches) setTimeout(() => $("#hp-q")?.focus(), 250);
  } else {
    panel.classList.remove("is-open"); setTimeout(() => { if (!HP.open) panel.hidden = true; }, 300);
  }
}
function startHelper() {
  const h = $("#helper"); if (!h) return;
  h.hidden = toolAccess("helper") !== "on";
  try { HP.msgs = JSON.parse(sessionStorage.getItem("hra_helper_" + state.user.uid)) || []; } catch { HP.msgs = []; }
  let seen = false; try { seen = Boolean(localStorage.getItem("hra_helper_seen")); } catch {}
  $("#hp-bubble").classList.toggle("is-new", !seen);
  $("#hp-title").textContent = HC.name || "HRA Helper";
}
function stopHelper() { HP.open = false; HP.msgs = []; const h = $("#helper"); if (h) { h.hidden = true; $("#hp-panel").hidden = true; $("#hp-panel").classList.remove("is-open"); } }

/* ==========================================================================
   Training: course catalog, step-by-step player, team progress for managers
   ========================================================================== */
const TR = window.HRA_TRAINING || { courses: [], categories: [], links: {}, trainers: [] };
const TRS = { team: { on: false, loaded: false, progress: [], notes: [], unsub: null }, openQ: [], unsubQ: null, knownQ: null, priv: {}, unsubPriv: null, panelTab: "questions", started: false, unsub: null, progress: [], notes: [], view: "home", course: null, idx: 0, dir: "fwd", local: {}, knownNotes: null, teamCourse: null, askOpen: false, panel: false };
const isTrainerMe = () => Boolean(state.user) && (state.isAdmin || (TR.trainers || []).map(lower).includes(state.user.email));
const svgI = (d, w = 22) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const TR_ICONS = {
  rocket: svgI('<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2"/><path d="M9 15l-3-3c1-4 4.5-8 12-9-1 7.5-5 11-9 12z"/><circle cx="14.5" cy="9.5" r="1.6"/>'),
  book: svgI('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>'),
  search: svgI('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>'),
  clock: svgI('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  layers: svgI('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
  cap: svgI('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'),
  video: svgI('<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l5-3v10l-5-3z"/>'),
  grid: svgI('<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>'),
  mail: svgI('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M4 7l8 6 8-6"/>'),
  home: svgI('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  folder: svgI('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  tool: svgI('<path d="M14.5 6.5a4 4 0 0 0 5 5L13 18l-3 3-4-4 3-3 6.5-6.5a4 4 0 0 0-1-1z"/>'),
  play: svgI('<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>'),
  coffee: svgI('<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>'),
  hands: svgI('<path d="M7 11V6a1.5 1.5 0 0 1 3 0v4M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L3 15.5a1.6 1.6 0 0 1 2.5-2L7 15"/>'),
  chart: svgI('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  award: svgI('<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>'),
  flag: svgI('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  check: svgI('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 18),
  lock: svgI('<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', 16),
  chat: svgI('<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>', 18),
  ext: svgI('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>', 16),
  back: svgI('<path d="M15 6l-6 6 6 6"/>', 18),
  next: svgI('<path d="M5 12h14M13 6l6 6-6 6"/>', 18)
};
const trColor = (c) => CT_COLORS[c] || CT_COLORS.navy;
const linkUrl = (key) => (TR.links || {})[key] || "";
const courseById = (id) => (TR.courses || []).find((c) => c.id === id && !c.hidden);
const visibleCourses = () => (TR.courses || []).filter((c) => !c.hidden);
function courseSteps(c) {
  const out = [];
  (c?.modules || []).forEach((m, mi) => (m.steps || []).forEach((st, si) => out.push({ ...st, moduleId: m.id, moduleTitle: m.title, mi, si })));
  return out;
}
function progDoc(uid) { return TRS.progress.find((p) => p.uid === uid) || TRS.team.progress.find((p) => p.uid === uid) || null; }
function progFor(uid, cid) { return progDoc(uid)?.courses?.[cid] || {}; }
function pctFor(c, p) {
  const steps = courseSteps(c); if (!steps.length) return 0;
  if (p.completedAt) return 100;
  const done = steps.filter((s) => p.done?.[s.id]).length;
  return Math.round(done / steps.length * 100);
}
function ring(pct, size = 54, stroke = 5, color = "var(--orange)") {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg class="tr-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(0,55,127,.1)" stroke-width="${stroke}"/>
    <circle class="tr-ring-fill" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="--c:${c}"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" class="tr-ring-t">${pct}%</text></svg>`;
}

const myNote = (cid, sid) => TRS.priv?.notes?.[cid]?.[sid]?.text || "";
const noteCount = (cid) => Object.values(TRS.priv?.notes?.[cid] || {}).filter((n) => n?.text).length;
let noteTimer = null;
function queueNoteSave(cid, sid, text) {
  TRS.priv.notes = TRS.priv.notes || {}; TRS.priv.notes[cid] = TRS.priv.notes[cid] || {};
  if (text) TRS.priv.notes[cid][sid] = { text, at: new Date().toISOString() }; else delete TRS.priv.notes[cid][sid];
  const st = $(".tp-mynote-status"); if (st) { st.textContent = "Saving…"; st.classList.remove("is-saved"); }
  clearTimeout(noteTimer);
  noteTimer = setTimeout(async () => {
    try { await state.store.savePrivateNote(state.user.uid, cid, sid, text.trim()); const s2 = $(".tp-mynote-status"); if (s2) { s2.textContent = "Saved"; s2.classList.add("is-saved"); } refreshNoteMarks(); }
    catch (e) { trDbError(e, "note"); const s2 = $(".tp-mynote-status"); if (s2) s2.textContent = "Not saved"; }
  }, 650);
}
function refreshNoteMarks() {
  const c = TRS.course; if (!c) return;
  $$(".tp-ol-step").forEach((b) => { const sid = b.dataset.sid; b.classList.toggle("has-note", Boolean(sid && myNote(c.id, sid))); });
  const n = noteCount(c.id); const t = $(".tp-dl-notes"); if (t) t.textContent = n ? `${n} note${n === 1 ? "" : "s"}` : "";
}

let trBlockedShown = false;
function trDbError(e, what) {
  console.error("Training " + (what || "") + " failed:", e);
  const blocked = e?.code === "permission-denied" || /permission|insufficient/i.test(String(e?.message || ""));
  if (blocked) {
    if (trBlockedShown) return; trBlockedShown = true;
    toast(state.isAdmin ? "Firebase blocked Training. Re-publish the latest firestore.rules (it must include training_progress)." : "Training can't save yet. Ask an admin to update the Firebase rules.", "#E2632B");
    const root = $("#training-root");
    if (root && state.isAdmin && !$(".tr-blocked")) root.insertAdjacentHTML("afterbegin", `<div class="tr-blocked">${MSGR_ICONS.alert}<div><strong>Training can't save: Firebase is blocking it.</strong><span>In Firebase → Firestore → Rules, paste the latest <code>firestore.rules</code> (it starts with “RULES VERSION: 2026-11-16”) and click Publish. Then reload this page.</span></div></div>`);
  } else toast("Your progress couldn't be saved. Check your internet connection and try again.", "#E2632B");
}

/* ---------- data ---------- */
function startTraining() {
  if (TRS.started) return;
  TRS.started = true;
  TRS.unsub = state.store.watchTraining(state.user.uid, false, onTrainingData);
  if (isTrainerMe()) TRS.unsubQ = state.store.watchOpenQuestions(onOpenQuestions);
  TRS.unsubPriv = state.store.watchPrivate(state.user.uid, (d) => {
    TRS.priv = d || {};
    if (currentTool === "training" && TRS.view === "player") { refreshNoteMarks(); if (TRS.panel && TRS.panelTab === "notes") renderQuestionsPanel(); }
  });
}
function stopTraining() {
  TRS.unsub?.(); TRS.unsubPriv?.(); TRS.unsubQ?.(); stopTeamWatch(); Object.assign(TRS, { openQ: [], unsubQ: null, knownQ: null, priv: {}, unsubPriv: null, started: false, unsub: null, progress: [], notes: [], view: "home", course: null, idx: 0, local: {}, knownNotes: null, askOpen: false, panel: false });
  const r = $("#training-root"); if (r) r.innerHTML = "";
}
function onTrainingData(progress, notes) {
  const prevKnown = TRS.knownNotes;
  TRS.progress = progress || [];
  TRS.notes = (notes || []).sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
  const known = new Map(TRS.notes.map((n) => [n.id, (n.replies || []).length]));
  if (prevKnown) {
    for (const n of TRS.notes) {
      const before = prevKnown.get(n.id);
      const last = (n.replies || []).slice(-1)[0];
      if (before === undefined) {
        if (n.from === "manager" && n.traineeUid === state.user.uid) notify({ kind: "info", title: `Note from ${n.byName || "your manager"}`, body: n.text, action: () => openTrainingQuestions() });
      } else if ((n.replies || []).length > before && last && last.byUid !== state.user.uid) {
        if (n.traineeUid === state.user.uid) notify({ kind: "done", title: "Your training question was answered", body: `${last.by}: ${last.text}`, action: () => openTrainingQuestions() });
      }
    }
  }
  TRS.knownNotes = known;
  updateTrainingBadge();
  if (currentTool === "training" && TRS.view !== "player") renderTraining();
  if (currentTool === "training" && TRS.view === "player" && TRS.panel) renderQuestionsPanel();
}
// Team data streams only while a manager is on the Team progress tab.
function startTeamWatch() {
  if (TRS.team.on || !isTrainerMe()) return;
  TRS.team.on = true; TRS.team.loaded = false;
  TRS.team.unsub = state.store.watchTraining(state.user.uid, true, (progress, notes) => {
    TRS.team.progress = progress || [];
    TRS.team.notes = (notes || []).sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""));
    TRS.team.loaded = true;
    if (currentTool === "training" && TRS.view === "team") renderTeam();
    if (!$("#tr-drawer")?.hidden && TRS.drawerUid) renderTraineeDrawer(TRS.drawerUid);
  });
}
function stopTeamWatch() {
  TRS.team.unsub?.();
  Object.assign(TRS.team, { on: false, loaded: false, progress: [], notes: [], unsub: null });
}
function onOpenQuestions(list) {
  const prev = TRS.knownQ;
  TRS.openQ = (list || []).filter((n) => n.from === "trainee" && n.traineeUid !== state.user.uid);
  if (prev) for (const n of TRS.openQ) {
    const before = prev.get(n.id), last = (n.replies || []).slice(-1)[0];
    const go = () => { setTool("training"); TRS.view = "team"; renderTraining(); };
    if (before === undefined) notify({ kind: "ticket", title: "Training question", body: `${n.traineeName}: ${n.text}`, action: go });
    else if ((n.replies || []).length > before && last && last.byUid !== state.user.uid) notify({ kind: "ticket", title: "Training reply", body: `${n.traineeName}: ${last.text}`, action: go });
  }
  TRS.knownQ = new Map(TRS.openQ.map((n) => [n.id, (n.replies || []).length]));
  updateTrainingBadge();
  if (currentTool === "training" && TRS.view === "home") renderTraining();
}
function updateTrainingBadge() {
  const open = isTrainerMe() ? TRS.openQ.length : 0, txt = open > 9 ? "9+" : String(open);
  const item = $('#rail [data-tool="am"]');
  if (item) { let b = $(".rail-badge", item); if (!b) { b = document.createElement("span"); b.className = "rail-badge"; $(".rail-icon", item).appendChild(b); } b.textContent = txt; b.hidden = !open; }
  const hb = $('[data-hub-badge="training"]'); if (hb) { hb.textContent = txt; hb.hidden = !open; }
}
function saveStep(c, patch) {
  const uid = state.user.uid, now = new Date().toISOString();
  const cur = progFor(uid, c.id);
  const course = { lastAt: now, ...patch };
  if (!cur.startedAt) course.startedAt = now;
  const data = { uid, name: state.user.name, email: state.user.email, lastAt: now, courses: { [c.id]: course } };
  // optimistic local update
  let doc = progDoc(uid);
  if (!doc) { doc = { uid, name: state.user.name, email: state.user.email, courses: {} }; TRS.progress.push(doc); }
  doc.courses = doc.courses || {};
  doc.courses[c.id] = { ...(doc.courses[c.id] || {}), ...course, done: { ...(doc.courses[c.id]?.done || {}), ...(course.done || {}) }, quiz: { ...(doc.courses[c.id]?.quiz || {}), ...(course.quiz || {}) }, watched: { ...(doc.courses[c.id]?.watched || {}), ...(course.watched || {}) } };
  doc.lastAt = now;
  state.store.saveProgress(uid, data).catch((e) => trDbError(e, "save"));
}

/* ---------- home (catalog) ---------- */
function renderTraining() {
  const root = $("#training-root"); if (!root || currentTool !== "training") return;
  if (TRS.view !== "player") document.body.classList.remove("in-course");
  startTraining();
  if (TRS.view === "team" && isTrainerMe()) { startTeamWatch(); return renderTeam(); }
  stopTeamWatch();
  if (TRS.view === "player" && TRS.course) return renderPlayer(true);
  TRS.view = "home";
  const avail = visibleCourses().filter((c) => !c.soon && c.modules);
  const mine = avail.map((c) => ({ c, p: progFor(state.user.uid, c.id) }));
  const resume = mine.filter((x) => x.p.startedAt && !x.p.completedAt).sort((a, b) => (b.p.lastAt || "").localeCompare(a.p.lastAt || ""))[0] || mine.find((x) => !x.p.startedAt) || mine[0] || null;
  const overall = mine.length ? Math.round(mine.reduce((t, x) => t + pctFor(x.c, x.p), 0) / mine.length) : 0;
  const doneCount = mine.filter((x) => x.p.completedAt).length;
  const openQ = TRS.openQ.length;
  root.innerHTML = `
    <div class="tr-hero">
      <div><h1 class="hero-title">Training</h1><p class="hero-sub">Go at your own pace. Your progress saves automatically.</p></div>
      <div class="tr-hero-side">
        ${isTrainerMe() ? `<div class="seg tr-seg"><button class="seg-btn is-active" data-tr-view="home">My training</button><button class="seg-btn" data-tr-view="team">Team progress${openQ ? `<span class="tab-count">${openQ}</span>` : ""}</button><span class="seg-indicator"></span></div>` : ""}
      </div>
    </div>
    ${resume ? continueCard(resume.c, resume.p) : ""}
    ${TRS.notes.some((n) => n.traineeUid === state.user.uid) ? `<button type="button" class="tr-myq" data-tr-questions>${TR_ICONS.chat}My questions and notes<span>${TRS.notes.filter((n) => n.traineeUid === state.user.uid).length}</span></button>` : ""}
    ${(() => {
      const cats = (TR.categories || []).map((cat) => ({ cat, list: visibleCourses().filter((c) => c.category === cat.id) })).filter((x) => x.list.length);
      const total = cats.reduce((t, x) => t + x.list.length, 0);
      if (total <= 1) return "";  // the big card above already covers a single course
      return cats.map(({ cat, list }) => `<section class="tr-cat">${cats.length > 1 ? `<h2>${esc(cat.label)}</h2>` : `<h2>All courses</h2>`}<div class="tr-grid">${list.map((c, i) => courseCard(c, i)).join("")}</div></section>`).join("");
    })()}`;
  requestAnimationFrame(() => $$(".tr-seg").forEach(moveIndicator));
}
function continueCard(c, p) {
  const steps = courseSteps(c), pct = pctFor(c, p);
  const next = steps[Math.min(p.current || 0, steps.length - 1)];
  const [c1, c2] = trColor(c.color);
  return `<button type="button" class="tr-continue" data-tr-open="${esc(c.id)}" style="--c1:${c1};--c2:${c2}">
    <span class="tr-continue-glow" aria-hidden="true"></span>
    <span class="tr-continue-ico">${TR_ICONS[c.icon] || TR_ICONS.book}</span>
    <span class="tr-continue-text"><small>${p.completedAt ? "Completed ✓" : p.startedAt ? "Pick up where you left off" : "Start here"}</small><strong>${esc(c.title)}</strong><span>${p.completedAt ? "Review it anytime" : p.startedAt ? `Next: ${esc(next?.title || "")}` : `${steps.length} short steps, about ${c.minutes || 15} minutes`}</span>
      <span class="tr-bar"><span style="--w:${pct}%"></span></span></span>
    <span class="tr-continue-go">${p.completedAt ? "Review" : p.startedAt ? "Continue" : "Start"} ${TR_ICONS.next}</span>
  </button>`;
}
function courseCard(c, i) {
  const [c1, c2] = trColor(c.color);
  const p = progFor(state.user.uid, c.id), pct = c.soon ? 0 : pctFor(c, p);
  const steps = c.soon ? 0 : courseSteps(c).length;
  const label = c.soon ? "Coming soon" : p.completedAt ? "Review" : p.startedAt ? "Continue" : "Start";
  return `<button type="button" class="tr-card${c.soon ? " is-soon" : ""}${p.completedAt ? " is-done" : ""}" ${c.soon ? 'data-tr-soon' : `data-tr-open="${esc(c.id)}"`} style="--c1:${c1};--c2:${c2};--i:${i}">
    <span class="tr-card-top"><span class="tr-card-ico">${TR_ICONS[c.icon] || TR_ICONS.book}</span>${c.soon ? `<span class="tr-soon">${TR_ICONS.lock}Coming soon</span>` : ring(pct, 46, 4, c1)}</span>
    <strong class="tr-card-title">${esc(c.title)}</strong>
    <span class="tr-card-sum">${esc(c.summary || "")}</span>
    <span class="tr-card-meta">${c.soon ? "" : `<span>${steps} steps</span><span>~${c.minutes || 15} min</span>`}${p.completedAt ? `<span class="tr-done-tag">${TR_ICONS.check}Completed</span>` : ""}</span>
    ${c.soon ? "" : `<span class="tr-card-go">${label} ${TR_ICONS.next}</span>`}
  </button>`;
}

/* ---------- player ---------- */
function openCourse(id, fromStart) {
  const c = courseById(id); if (!c || c.soon) return;
  const p = progFor(state.user.uid, id), steps = courseSteps(c);
  TRS.course = c; TRS.view = "player"; TRS.local = {}; TRS.askOpen = false; TRS.panel = false;
  TRS.idx = fromStart || p.completedAt ? 0 : Math.min(p.current || 0, steps.length - 1);
  TRS.dir = "fwd";
  if (!p.startedAt) saveStep(c, { current: TRS.idx });
  renderPlayer();
  window.scrollTo({ top: 0 });
}
function watchedSet(st) {
  const saved = progFor(state.user.uid, TRS.course?.id).watched?.[st.id] || [];
  return new Set([...saved, ...((TRS.local[st.id] || {}).watched || [])]);
}
// "7.51" = a video length (7:51). A whole number = minutes ("87" → "1 h 27 min").
const fmtMin = (m) => { if (m == null) return ""; const v = String(m); if (v.includes(".")) { const [a, b] = v.split("."); return `${a}:${b.padEnd(2, "0").slice(0, 2)}`; } const n = Number(v); return n >= 60 ? `${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60} min` : ""}` : `${n} min`; };
function stepDone(c, st) { return Boolean(progFor(state.user.uid, c.id).done?.[st.id]); }
function canContinue(st) {
  const L = TRS.local[st.id] || {};
  if (stepDone(TRS.course, st) && st.type !== "complete") return true;
  if (st.type === "action") return Boolean(L.confirmed);
  if (st.type === "quiz") return Boolean(L.correct);
  if (st.type === "values") return (L.revealed || []).length >= (st.items || []).length;
  if (st.type === "steps") return (L.shown || 1) >= (st.items || []).length;
  if (st.type === "resources") return st.optional || watchedSet(st).size >= (st.items || []).length;
  return true;
}
function renderPlayer(keepAnim) {
  const root = $("#training-root"); const c = TRS.course; if (!root || !c) return;
  document.body.classList.add("in-course");
  const steps = courseSteps(c), st = steps[TRS.idx], p = progFor(state.user.uid, c.id);
  const [c1, c2] = trColor(c.color);
  const pct = Math.round(TRS.idx / Math.max(1, steps.length - 1) * 100);
  const myQ = TRS.notes.filter((n) => n.traineeUid === state.user.uid && n.courseId === c.id).length;
  const note = st.type === "complete" ? "" : myNote(c.id, st.id);
  const noteOpen = TRS.noteOpen || Boolean(note);
  root.innerHTML = `
    <div class="tp tp-simple" style="--c1:${c1};--c2:${c2}">
      <header class="tp-top">
        <button type="button" class="tp-exit" data-tr-exit aria-label="Back to all courses">${TR_ICONS.back}<span>Courses</span></button>
        <div class="tp-title"><strong>${esc(c.title)}</strong><small>Step ${TRS.idx + 1} of ${steps.length} · ${esc(st.moduleTitle)}</small></div>
        <div class="tp-more-wrap">
          <button type="button" class="tp-more" data-tr-more aria-label="More options" aria-expanded="${Boolean(TRS.moreOpen)}">${svgI('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>', 20)}${myQ ? `<i>${myQ}</i>` : ""}</button>
          <div class="tp-menu" ${TRS.moreOpen ? "" : "hidden"}>
            <button type="button" data-tr-open-panel="outline">${svgI('<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>', 17)}Course outline</button>
            <button type="button" data-tr-open-panel="notes">${svgI('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', 17)}My notes</button>
            <button type="button" data-tr-open-panel="questions">${TR_ICONS.chat}My questions${myQ ? `<em>${myQ}</em>` : ""}</button>
            <button type="button" data-tr-pptx="${esc(c.id)}">${svgI('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/>', 17)}Download as PowerPoint</button>
          </div>
        </div>
      </header>
      <div class="tp-progress" aria-hidden="true"><span style="width:${Math.max(pct, 2)}%"></span></div>
      <main class="tp-stage">
        <article class="tp-card tp-${st.type} ${keepAnim ? "is-static" : "dir-" + TRS.dir}" data-step="${esc(st.id)}">${stepHTML(c, st)}</article>
        ${st.type === "complete" ? "" : `
        <div class="tp-tools">
          <button type="button" class="tp-tool${noteOpen ? " is-on" : ""}" data-tr-note-toggle aria-expanded="${noteOpen}">${svgI('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', 16)}${note ? "My note" : "Add a note"}</button>
          <button type="button" class="tp-tool${TRS.askOpen ? " is-on" : ""}" data-tr-ask aria-expanded="${Boolean(TRS.askOpen)}">${svgI('<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z"/>', 16)}Ask a question</button>
        </div>
        <section class="tp-mynote${noteOpen ? " is-open" : ""}">
          <div class="tp-mynote-body"><div><small class="tp-mynote-priv">Only you can see this</small><textarea id="tr-mynote" rows="3" maxlength="3000" placeholder="Write anything that helps you remember this step.">${esc(note)}</textarea><span class="tp-mynote-status">${note ? "Saved" : ""}</span></div></div>
        </section>
        <div class="tp-askbox" ${TRS.askOpen ? "" : "hidden"}><textarea id="tr-ask-text" rows="3" maxlength="600" placeholder="Ask your manager anything about “${esc(st.title)}”"></textarea><div><button type="button" class="btn btn-ghost btn-mini" data-tr-ask-cancel>Cancel</button><button type="button" class="btn btn-primary btn-mini" data-tr-ask-send>Send question</button></div></div>`}
      </main>
      ${st.type === "complete" ? "" : `<footer class="tp-nav">
        <button type="button" class="btn btn-ghost" data-tr-prev ${TRS.idx === 0 ? "disabled" : ""}>${TR_ICONS.back}Back</button>
        <button type="button" class="btn btn-primary tp-next" data-tr-next ${canContinue(st) ? "" : "disabled"}>${TRS.idx === steps.length - 2 ? "Finish" : "Continue"}${TR_ICONS.next}</button>
      </footer>`}
    </div>
    ${TRS.panel ? `<div class="tp-panel-scrim" data-tr-panel-close></div><aside class="tp-panel" id="tp-panel"></aside>` : ""}`;
  if (TRS.panel) renderQuestionsPanel();
  if (st.type === "complete" && !keepAnim) setTimeout(() => confettiBurst(), 350);
}
function linkBtn(l, primary) {
  if (!l) return "";
  if (l.course) return `<button type="button" class="${primary ? "tp-link is-primary" : "tp-link"}" data-tr-open="${esc(l.course)}">${esc(l.label)}${TR_ICONS.next}</button>`;
  if (l.url) return `<a class="${primary ? "tp-link is-primary" : "tp-link"}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}${TR_ICONS.ext}</a>`;
  const url = linkUrl(l.key) || linkUrl("teamSite");
  const fallback = !linkUrl(l.key);
  return `<a class="${primary ? "tp-link is-primary" : "tp-link"}" href="${esc(url)}" target="_blank" rel="noopener">${esc(l.label)}${TR_ICONS.ext}</a>${fallback && l.key !== "teamSite" && state.isAdmin ? `<small class="tp-fallback">Admins: this opens the Team Site until you add the direct link in training.js</small>` : ""}`;
}
function callout(co) { return co ? `<div class="tp-callout is-${co.tone || "info"}"><span>${co.tone === "warn" ? MSGR_ICONS.alert : MSGR_ICONS.info}</span><p>${esc(co.text)}</p></div>` : ""; }
function stepHTML(c, st) {
  const L = TRS.local[st.id] || (TRS.local[st.id] = {});
  const done = stepDone(c, st);
  const head = `<div class="tp-head"><span class="tp-kicker">${esc(st.moduleTitle)}</span><h2>${esc(st.title)}</h2>${st.text ? `<p class="tp-text">${esc(st.text)}</p>` : ""}</div>`;
  const vis = st.visual ? `<div class="tp-visual">${trVisual(st.visual)}</div>` : "";
  const bullets = st.bullets ? `<ul class="tp-bullets">${st.bullets.map((b, i) => `<li style="--i:${i}">${esc(b)}</li>`).join("")}</ul>` : "";
  const chips = st.chips ? `<div class="tp-chips">${st.chips.map((x, i) => `<span style="--i:${i}"><b>${i + 1}</b>${esc(x)}</span>`).join("")}</div>` : "";
  if (st.type === "content") return `${vis}${head}${bullets}${chips}${callout(st.callout)}${st.link ? `<div class="tp-links">${linkBtn(st.link, true)}</div>` : ""}`;
  if (st.type === "action") {
    const on = L.confirmed || done;
    return `${vis}${head}${bullets}${callout(st.callout)}
      <div class="tp-links">${st.link ? linkBtn(st.link, true) : ""}${(st.links || []).map((l) => linkBtn(l)).join("")}</div>
      <button type="button" class="tp-confirm${on ? " is-on" : ""}" data-tr-confirm aria-pressed="${on}"><span class="tp-check">${TR_ICONS.check}</span>${esc(st.confirm || "I've done this")}</button>`;
  }
  if (st.type === "quiz") {
    const answered = L.correct || done;
    return `${head}<p class="tp-q">${esc(st.question)}</p>
      <div class="tp-opts" role="radiogroup">${st.options.map((o, i) => {
        const cls = answered && i === st.answer ? " is-right" : L.wrong === i ? " is-wrong" : L.pick === i ? " is-pick" : "";
        return `<button type="button" role="radio" aria-checked="${L.pick === i}" class="tp-opt${cls}" data-tr-pick="${i}" ${answered ? "disabled" : ""}><span class="tp-opt-key">${String.fromCharCode(65 + i)}</span>${esc(o)}${answered && i === st.answer ? `<span class="tp-opt-ok">${TR_ICONS.check}</span>` : ""}</button>`;
      }).join("")}</div>
      ${answered ? `<div class="tp-feedback is-right">${TR_ICONS.check}<p><strong>${L.attempts > 1 ? "Got it!" : "Correct!"}</strong> ${esc(st.explain || "")}</p></div>`
        : L.wrong !== undefined ? `<div class="tp-feedback is-wrong">${MSGR_ICONS.alert}<p><strong>Not quite.</strong> Give it another try.</p></div>` : ""}
      ${answered ? "" : `<button type="button" class="btn btn-primary tp-checkbtn" data-tr-check ${L.pick === undefined ? "disabled" : ""}>Check answer</button>`}`;
  }
  if (st.type === "resources") {
    const w = watchedSet(st);
    return `${vis}${head}${bullets}<div class="tp-res">${st.items.map((it, i) => {
      const on = w.has(i) || done;
      const inner = `<span class="tp-res-ico">${it.url ? (/youtu|loom|video/i.test(it.url) ? TR_ICONS.play : TR_ICONS.ext) : TR_ICONS.book}</span>
        <span class="tp-res-text">${it.q ? `<small>${esc(it.q)}</small>` : ""}<strong>${esc(it.title)}</strong>${it.note ? `<em>${esc(it.note)}</em>` : ""}</span>
        ${it.minutes != null ? `<span class="tp-res-min">${esc(fmtMin(it.minutes))}</span>` : ""}<span class="tp-res-check">${TR_ICONS.check}</span>`;
      return it.url
        ? `<a class="tp-res-item${on ? " is-on" : ""}" href="${esc(it.url)}" target="_blank" rel="noopener" data-tr-watch="${i}" style="--i:${i}">${inner}</a>`
        : `<button type="button" class="tp-res-item${on ? " is-on" : ""}" data-tr-watch="${i}" style="--i:${i}">${inner}</button>`;
    }).join("")}</div>
      <p class="tp-hint">${st.optional ? `${w.size} of ${st.items.length} started. You can keep going and come back to these.` : w.size < st.items.length ? `Open each one to continue (${w.size} of ${st.items.length})` : "All done. Nice work!"}</p>${callout(st.callout)}${st.link ? `<div class="tp-links">${linkBtn(st.link, true)}</div>` : ""}`;
  }
  if (st.type === "values") {
    const rev = new Set(done ? st.items.map((_, i) => i) : (L.revealed || []));
    return `${vis}${head}<div class="tp-vals-grid" style="--n:${st.items.length}">${st.items.map((it, i) => `<button type="button" class="tp-val${rev.has(i) ? " is-open" : ""}" data-tr-reveal="${i}" style="--i:${i}">
        <span class="tp-val-inner"><span class="tp-val-front"><b class="${String(it.key).length > 2 ? "is-long" : ""}">${esc(it.key)}</b>${it.label ? `<span class="tp-val-label">${esc(it.label)}</span>` : ""}<small>Tap to reveal</small></span>
        <span class="tp-val-back"><span class="tp-val-ico">${TR_ICONS[it.icon] || TR_ICONS.flag}</span><strong>${esc(it.label || it.name)}</strong>${it.label && it.name && it.name !== it.label ? `<em class="tp-val-sub">${esc(it.name)}</em>` : ""}<span>${esc(it.text)}</span></span></span></button>`).join("")}</div>
      <p class="tp-hint">${rev.size < st.items.length ? `${st.items.length - rev.size} left to reveal` : "Nice! You've revealed them all."}</p>${rev.size >= st.items.length ? callout(st.callout) : ""}`;
  }
  if (st.type === "steps") {
    const shown = done ? st.items.length : (L.shown || 1);
    return `${head}<ol class="tp-walk">${st.items.map((it, i) => `<li class="${i < shown ? "is-shown" : ""}${i === shown - 1 && !done ? " is-now" : ""}"><span class="tp-walk-n">${i + 1}</span><span><strong>${esc(it.title)}</strong><small>${esc(it.text)}</small></span></li>`).join("")}</ol>
      ${shown < st.items.length ? `<button type="button" class="btn btn-ghost tp-walknext" data-tr-walk>Next step ${TR_ICONS.next}</button>` : ""}${shown >= st.items.length ? callout(st.callout) : ""}`;
  }
  if (st.type === "complete") {
    const p = progFor(state.user.uid, c.id), steps = courseSteps(c);
    const quizzes = steps.filter((x) => x.type === "quiz"), first = quizzes.filter((q) => p.quiz?.[q.id]?.firstTry).length;
    const mins = p.startedAt ? Math.max(1, Math.round((new Date(p.completedAt || Date.now()) - new Date(p.startedAt)) / 60000)) : null;
    return `<div class="tp-finish"><div class="tp-trophy">${TR_ICONS.award}</div><h2>${esc(st.title)}</h2><p class="tp-text">${esc(st.text)}</p>
      <div class="tp-stats"><div><b>${steps.length - 1}</b><small>steps completed</small></div><div><b>${first}/${quizzes.length}</b><small>quiz answers first try</small></div>${mins ? `<div><b>${mins < 120 ? mins + " min" : Math.round(mins / 60) + " h"}</b><small>total time</small></div>` : ""}</div>
      <div class="tp-finish-acts"><button type="button" class="btn btn-ghost" data-tr-pptx="${esc(c.id)}">${svgI('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1"/>', 16)}Download as PowerPoint</button><button type="button" class="btn btn-ghost" data-tr-restart>Review again</button><button type="button" class="btn btn-primary" data-tr-exit>Back to training ${TR_ICONS.next}</button></div></div>`;
  }
  return head;
}

/* ---------- mini illustrations ---------- */
function trVisual(v) {
  const [name, hi] = String(v).split(":");
  if (name === "hello") return `<div class="vz-hello${hi ? " is-" + hi : ""}"><span class="vz-orb o1"></span><span class="vz-orb o2"></span><span class="vz-orb o3"></span><img src="assets/icon-512.png" alt="" class="vz-hello-mark"/><span class="vz-hello-word">${esc(hi === "navy" ? "Let's learn" : hi === "teal" ? "Let's go" : "Welcome")}</span></div>`;
  if (name === "invoice") return `<div class="vz-invoice"><div class="vz-inv-head"><strong>HRA Invoice</strong><span>Contract Employees</span></div>
      <div class="vz-inv-grid"><span>Invoice date</span><b class="is-y">Monday you submit</b><span>Period of engagement</span><b class="is-y">Sunday – Saturday</b><span>Description</span><b class="is-y">Recruiting</b><span>Hours × rate</span><b class="is-y">40 × $00.00</b><span>Total</span><b class="is-calc">Calculates for you</b></div>
      <div class="vz-inv-send">${TR_ICONS.mail}<span>accounting@hunterrecruitment.net <small>cc Mindy · by 10:30 AM ET every Monday</small></span></div></div>`;
  if (name === "qb-timecard") {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    return `<div class="vz-qb"><div class="vz-qb-top"><strong>Time Entries</strong><span class="vz-qb-tab">Manual Time Card</span></div>
      <div class="vz-qb-row"><span>Customer</span><b>HRA</b><span>Service item</span><b>Operational Activities: HRA Time</b><span>Billable</span><b class="is-no">No</b></div>
      <div class="vz-qb-days">${days.map((d, i) => `<span style="--i:${i}"><small>${d}</small><b>8:00</b><em>HRA Training</em></span>`).join("")}<span class="vz-qb-total"><small>Total</small><b>40:00</b></span></div>
      <span class="vz-btn is-blue sm vz-qb-save">Save</span></div>`;
  }
  if (name === "jazz-portals") return `<div class="vz-portals"><div class="vz-portal"><span class="vz-portal-ico">HRA</span><strong>JazzHRA</strong><small>HRA reporting, and clients that don't have JazzHR</small></div><span class="vz-portal-or">or</span><div class="vz-portal is-b"><span class="vz-portal-ico">${TR_ICONS.home}</span><strong>Jazz Accounts Portal</strong><small>Clients that have their own JazzHR</small></div></div>`;
  if (name === "jazz-sig") return `<div class="vz-sigs"><div class="vz-sig sm"><span class="vz-sig-tag is-b">Client JazzHR</span><em>I look forward to speaking with you!</em><span>Sincerely,</span><strong>Your Name</strong><span>Recruitment Consultant</span><span>Client Zoom phone number</span><span>Client name</span><a>Scheduling link</a></div>
      <div class="vz-sig sm"><span class="vz-sig-tag">HRA JazzHR</span><em>I look forward to speaking with you!</em><span>Sincerely,</span><strong>Your Name</strong><span>Recruitment Consultant</span></div></div>`;
  if (name === "trades") return `<div class="vz-trades">${[["HVAC", "Heating, ventilation and air conditioning", "M4 14a8 8 0 0 1 16 0M12 6v2M5 9l1.5 1.5M19 9l-1.5 1.5M8 20h8M12 14v6"], ["Plumbing", "Water, drains, gas and water heaters", "M5 4h6v6H5zM8 10v6a3 3 0 0 0 3 3h8"], ["Electrical", "The longest trade to master", "M13 2L4 14h7l-1 8 9-12h-7z"]].map(([t, d, ic], i) => `<div style="--i:${i}"><span>${svgI(`<path d="${ic}"/>`, 26)}</span><strong>${t}</strong><small>${d}</small></div>`).join("")}</div>`;
  if (name === "levels") return `<div class="vz-levels">${["Apprentice", "Journeyman", "Master"].map((l, i) => `<div style="--i:${i};--h:${40 + i * 30}%"><span></span><strong>${l}</strong></div>`).join("")}</div>`;
  if (name === "lms-email") return `<div class="vz-split"><div class="vz-login"><span class="vz-brand">ZYWAVE</span><span class="vz-field">Username</span><span class="vz-btn is-blue">Log in</span><span class="vz-or">or</span><span class="vz-btn is-no">Continue with Microsoft</span><span class="vz-btn is-no">Continue with Google</span></div>
    <div class="vz-mail"><span class="vz-mail-from">notifications@learning.zywave.com</span><strong>New Learning Task Assigned</strong><span class="vz-line w80"></span><span class="vz-line w60"></span><span class="vz-line w70"></span><span class="vz-btn is-blue sm">Take training</span></div></div>`;
  if (name === "roadmap") return `<div class="vz-road"><svg viewBox="0 0 400 70" preserveAspectRatio="none"><path d="M10 50 C 80 10, 140 70, 200 35 S 320 10, 390 30" fill="none" stroke="url(#rg)" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8" class="vz-road-path"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#F26A26"/><stop offset="1" stop-color="#2D6BFF"/></linearGradient></defs></svg><span class="vz-flag">${TR_ICONS.flag}</span></div>`;
  if (name === "teamsite") {
    const tabs = ["HRA Team Site", "Recruiting", "Marketing", "Sales", "Human Resources", "Training", "Management", "Executive Team"];
    const btns = ["Our Team", "Community Passwords", "HRA Team Meetings"];
    return `<div class="vz-browser"><div class="vz-bar"><span></span><span></span><span></span><em>hunterrecruitmentnet.sharepoint.com</em></div>
      <div class="vz-sp"><span class="vz-sp-logo">RECRUITMENT ADVISORS</span><span class="vz-sp-name">SharePoint</span><span class="vz-sp-search"></span></div>
      <div class="vz-tabs">${tabs.map((t) => `<span class="${t === hi ? "is-hi" : ""}">${esc(t)}</span>`).join("")}</div>
      <div class="vz-page"><div class="vz-page-l"><span class="vz-hra">HRA</span><strong>HRA Team Site</strong><small>Welcome to All Things HRA!</small></div>
      <div class="vz-page-r">${btns.map((b) => `<span class="vz-spbtn${b === hi ? " is-hi" : ""}">${esc(b)}</span>`).join("")}</div></div>
      ${hi ? `<span class="vz-cursor" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 3l14 8-6 1.5L10 19z" fill="#0A1E3F" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></span>` : ""}</div>`;
  }
  if (name === "signature") return `<div class="vz-sig"><strong>Your Name</strong><span>Your Title</span><span>(000) 000-0000</span><a>you@hunterrecruitment.net</a><a>www.hunterrecruitment.net</a><em>“A New Way to Hire. Hunt with Distinction!”</em><img src="assets/logo.png" alt="Hunter Recruitment Advisors logo"/><span class="vz-sig-tag">Links ✓</span></div>`;
  if (name === "zoom-app") return `<div class="vz-zoom"><span class="vz-zoom-icon">zoom</span><div><strong>Zoom Workplace</strong><small>Phone, meetings and chat</small><span class="vz-btn is-blue sm">Download</span></div><span class="vz-zoom-check">${TR_ICONS.check}Already installed? You're set!</span></div>`;
  if (name === "zoom-bg") return `<div class="vz-cam"><span class="vz-cam-mark">Hunter</span><span class="vz-cam-person"></span><span class="vz-cam-bar"><i></i><i></i><i class="is-red"></i></span></div>`;
  if (name === "recruiting") return `<div class="vz-tiles">${["Workable", "JazzHR", "Indeed", "LinkedIn", "Canva", "Weekly Schedule"].map((t, i) => `<span class="${i === 0 ? "is-hi" : ""}" style="--i:${i}">${svgI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', 18)}${esc(t)}</span>`).join("")}</div>`;
  if (name === "it-flow") return `<div class="vz-flow"><span class="vz-node"><b>1</b>${TR_ICONS.hands}Your manager or Mindy</span><span class="vz-arrow"></span><span class="vz-node is-2"><b>2</b>${TR_ICONS.mail}it@hunterrecruitment.net</span></div>`;
  if (name === "explore") return `<div class="vz-explore">${["Our Team", "Training", "Recruiting", "Human Resources", "Marketing", "Sales"].map((t, i) => `<span style="--i:${i}">${esc(t)}</span>`).join("")}</div>`;
  return "";
}

/* ---------- player actions ---------- */
function goStep(i, dir) {
  const steps = courseSteps(TRS.course);
  TRS.idx = Math.max(0, Math.min(i, steps.length - 1)); TRS.dir = dir || "fwd"; TRS.askOpen = false; TRS.noteOpen = false; TRS.moreOpen = false;
  renderPlayer();
  $(".tp-stage")?.scrollTo?.({ top: 0 });
}
function nextStep() {
  const c = TRS.course, steps = courseSteps(c), st = steps[TRS.idx];
  if (!canContinue(st)) return;
  const now = new Date().toISOString(), patch = { done: { [st.id]: now }, current: Math.max(progFor(state.user.uid, c.id).current || 0, TRS.idx + 1) };
  const L = TRS.local[st.id];
  if (st.type === "quiz" && L && !progFor(state.user.uid, c.id).quiz?.[st.id]) patch.quiz = { [st.id]: { firstTry: (L.attempts || 1) === 1, attempts: L.attempts || 1 } };
  if (TRS.idx + 1 === steps.length - 1) { patch.completedAt = now; patch.done[steps[steps.length - 1].id] = now; }
  saveStep(c, patch);
  goStep(TRS.idx + 1, "fwd");
}

/* ---------- questions ---------- */
function openTrainingQuestions() {
  setTool("training");
  if (TRS.view !== "player") { const mineCourse = TRS.notes.find((n) => n.traineeUid === state.user.uid)?.courseId || (TR.courses || []).find((c) => !c.soon)?.id; if (mineCourse) openCourse(mineCourse); }
  TRS.panel = true; renderPlayer(true);
}
function renderQuestionsPanel() {
  const el = $("#tp-panel"); if (!el) return;
  const mine = TRS.notes.filter((n) => n.traineeUid === state.user.uid);
  const c = TRS.course, steps = c ? courseSteps(c) : [];
  const notes = c ? steps.map((x, i) => ({ x, i, t: myNote(c.id, x.id) })).filter((n) => n.t) : [];
  const tab = TRS.panelTab;
  const p = c ? progFor(state.user.uid, c.id) : {};
  const outline = c ? c.modules.map((m, mi) => `<div class="tp-ol-mod${steps[TRS.idx]?.mi === mi ? " is-now" : ""}"><span class="tp-ol-title">${esc(m.title)}</span>${steps.filter((x) => x.mi === mi).map((x) => {
      const i = steps.indexOf(x), done = p.done?.[x.id], reach = done || i <= (p.current || 0) || i <= TRS.idx;
      return `<button type="button" class="tp-ol-step${i === TRS.idx ? " is-now" : ""}${done ? " is-done" : ""}${myNote(c.id, x.id) ? " has-note" : ""}" data-sid="${esc(x.id)}" ${reach ? `data-tr-goto="${i}" data-tr-panel-go` : "disabled"}><span class="tp-ol-dot">${done ? TR_ICONS.check : ""}</span>${esc(x.title)}</button>`;
    }).join("")}</div>`).join("") : "";
  el.innerHTML = `<div class="tp-panel-head"><div class="seg tp-panel-seg"><button class="seg-btn${tab === "outline" ? " is-active" : ""}" data-tr-ptab="outline">Outline</button><button class="seg-btn${tab === "questions" ? " is-active" : ""}" data-tr-ptab="questions">Questions${mine.length ? `<span class="tab-count">${mine.length}</span>` : ""}</button><button class="seg-btn${tab === "notes" ? " is-active" : ""}" data-tr-ptab="notes">My notes${notes.length ? `<span class="tab-count">${notes.length}</span>` : ""}</button><span class="seg-indicator"></span></div>
    <button type="button" class="icon-btn" data-tr-panel-close aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
    <div class="tp-panel-list">${tab === "outline" ? `<div class="tp-outline-list">${outline}</div>` : tab === "notes"
      ? (notes.length ? `<p class="tp-panel-note">Only you can see these. They're included when you download the course as PowerPoint.</p>${notes.map((n) => `<button type="button" class="tp-noteitem" data-tr-goto="${n.i}" data-tr-panel-go><span>${esc(n.x.moduleTitle)} · ${esc(n.x.title)}</span><p>${esc(n.t)}</p></button>`).join("")}`
        : `<div class="nc-empty">${svgI('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', 30)}<strong>No notes yet</strong><span>Use “Add a personal note” under any step. Only you can see them.</span></div>`)
      : (mine.length ? mine.map((n) => noteThreadHTML(n, false)).join("") : `<div class="nc-empty">${TR_ICONS.chat}<strong>No questions yet</strong><span>Use “Have a question about this step?” on any step. Your manager gets it right away.</span></div>`)}</div>`;
  requestAnimationFrame(() => { $$(".tp-panel-seg").forEach(moveIndicator); $(".tp-panel .tp-ol-step.is-now")?.scrollIntoView({ block: "center" }); });
}
function noteThreadHTML(n, trainerView) {
  const msgs = [{ by: n.from === "manager" ? n.byName : n.traineeName, text: n.text, at: n.createdAt, mgr: n.from === "manager" }, ...(n.replies || []).map((r) => ({ by: r.by, text: r.text, at: r.at, mgr: r.role === "manager" }))];
  return `<div class="tq${n.status === "open" ? " is-open" : ""}" data-note-id="${esc(n.id)}">
    <div class="tq-top">${trainerView ? `<span class="tq-who"><span class="ldr-avatar tq-av">${avatarInner(n.traineeName || "?", n.traineeUid, n.traineeEmail)}</span><strong>${esc(n.traineeName)}</strong></span>` : ""}<span class="tq-step">${esc(n.courseTitle || "")}${n.stepTitle ? ` · ${esc(n.stepTitle)}` : ""}</span>${n.status === "open" ? `<span class="tq-badge">Waiting for reply</span>` : `<span class="tq-badge is-ok">Answered</span>`}</div>
    <div class="tq-msgs">${msgs.map((m) => `<div class="tq-msg${m.mgr ? " is-mgr" : ""}"><span class="tq-by">${esc(m.by || "")}${m.mgr ? " · Manager" : ""} <small>${esc(ago(m.at))}</small></span><p>${esc(m.text)}</p></div>`).join("")}</div>
    <div class="tq-reply"><input type="text" maxlength="600" placeholder="${trainerView ? "Write a reply" : "Reply"}" data-tq-input="${esc(n.id)}"/><button type="button" class="btn btn-primary btn-mini" data-tq-send="${esc(n.id)}">Send</button>
      ${trainerView && n.status === "open" ? `<button type="button" class="btn btn-ghost btn-mini" data-tq-resolve="${esc(n.id)}">Mark answered</button>` : ""}</div>
  </div>`;
}
async function sendQuestion() {
  const ta = $("#tr-ask-text"); const text = ta?.value.trim(); if (!text) { ta?.focus(); return; }
  const c = TRS.course, st = courseSteps(c)[TRS.idx];
  const now = new Date().toISOString();
  try {
    await state.store.addNote({ traineeUid: state.user.uid, traineeName: state.user.name, traineeEmail: state.user.email, courseId: c.id, courseTitle: c.title, stepId: st.id, stepTitle: st.title, from: "trainee", text, createdAt: now, updatedAt: now, status: "open", replies: [] });
    TRS.askOpen = false; renderPlayer(true);
    toast("Question sent. You'll get a notification when your manager replies.", "var(--s-done)");
  } catch (e) { trDbError(e, "question"); }
}
async function replyToNote(id, resolve) {
  const n = TRS.notes.find((x) => x.id === id) || TRS.team.notes.find((x) => x.id === id) || TRS.openQ.find((x) => x.id === id); if (!n) return;
  const input = $(`[data-tq-input="${CSS.escape(id)}"]`); const text = input?.value.trim();
  const trainer = isTrainerMe() && n.traineeUid !== state.user.uid;
  const now = new Date().toISOString();
  if (!text && !resolve) { input?.focus(); return; }
  try {
    const patch = { updatedAt: now, status: trainer ? "answered" : (n.from === "manager" ? "answered" : "open") };
    if (text) await state.store.replyNote(id, { by: state.user.name, byUid: state.user.uid, role: trainer ? "manager" : "trainee", text, at: now }, patch);
    else await state.store.replyNote(id, { by: state.user.name, byUid: state.user.uid, role: "manager", text: "Marked as answered.", at: now }, { updatedAt: now, status: "answered" });
    if (input) input.value = "";
  } catch (e) { console.error(e); toast("That didn't send. Try again.", "#E2632B"); }
}

/* ---------- team progress (managers) ---------- */
function roster(c) {
  const map = new Map();
  for (const p of TRS.team.progress) if (p.uid) map.set(lower(p.email || p.uid), { uid: p.uid, name: p.name || nameFromEmail(p.email || ""), email: p.email || "", p: p.courses?.[c.id] || {}, lastAt: p.lastAt });
  for (const e of [...MEMBERS]) if (!map.has(e)) map.set(e, { uid: null, name: nameFromEmail(e), email: e, p: {}, lastAt: null });
  return [...map.values()].filter((r) => r.uid !== state.user.uid || r.p.startedAt);
}
function traineeStatus(r) {
  if (r.p.completedAt) return ["done", "Completed"];
  if (!r.p.startedAt) return ["new", "Not started"];
  const idle = (Date.now() - new Date(r.p.lastAt || r.lastAt || 0)) / 86400e3;
  return idle > 3 ? ["stuck", `Idle ${Math.floor(idle)} days`] : ["active", "In progress"];
}
function renderTeam() {
  const root = $("#training-root");
  const avail = visibleCourses().filter((c) => !c.soon && c.modules);
  const c = courseById(TRS.teamCourse) || avail[0]; TRS.teamCourse = c?.id;
  if (!c) { root.innerHTML = ""; return; }
  const loading = !TRS.team.loaded;
  const steps = courseSteps(c), rows = loading ? [] : roster(c);
  const quizzes = steps.filter((x) => x.type === "quiz");
  const st = (k) => rows.filter((r) => traineeStatus(r)[0] === k).length;
  const openQ = loading ? TRS.openQ : TRS.team.notes.filter((n) => n.status === "open" && n.from === "trainee");
  root.innerHTML = `
    <div class="tr-hero">
      <div><h1 class="hero-title">Team progress</h1><p class="hero-sub">${esc(c.title)}</p></div>
      <div class="tr-hero-side"><div class="seg tr-seg"><button class="seg-btn" data-tr-view="home">My training</button><button class="seg-btn is-active" data-tr-view="team">Team progress${openQ.length ? `<span class="tab-count">${openQ.length}</span>` : ""}</button><span class="seg-indicator"></span></div>
      ${avail.length > 1 ? ddHTML("tr-course", { label: "Course", value: c.id, options: avail.map((x) => ({ value: x.id, label: x.title })) }) : ""}
      ${state.isAdmin ? `<button type="button" class="tr-manage" data-tr-manage ${loading ? "disabled" : ""} title="Reset progress, delete questions or notes">${svgI('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', 16)}Manage</button>` : ""}</div>
    </div>
    <div class="tr-stats">
      ${[["Team members", rows.length, "#00377F"], ["In progress", st("active") + st("stuck"), "#2D6BFF"], ["Completed", st("done"), "#0E9F7E"], ["Open questions", openQ.length, "#F26A26"]].map(([l, v, col], i) => `<div class="tr-stat" style="--accent:${col};--i:${i}"><b>${loading && i < 3 ? `<span class="sk" style="width:28px;height:22px;display:inline-block"></span>` : v}</b><span>${l}</span></div>`).join("")}
    </div>
    <div class="tr-team">
      <section class="in-card tr-roster">
        <header class="in-card-head"><div><h2>People</h2><p>Select someone to see details or send a note</p></div></header>
        ${loading ? `<div class="tr-rows">${Array.from({ length: 4 }, () => `<div class="tr-row"><span class="sk" style="width:40px;height:40px;border-radius:50%"></span><span class="tr-row-main"><span class="sk" style="width:40%"></span><span class="sk" style="width:70%;height:8px;margin-top:6px"></span></span></div>`).join("")}<p class="tr-loading">Loading team progress…</p></div>` : rows.length ? `<div class="tr-rows">${rows.sort((a, b) => ({ stuck: 0, active: 1, new: 2, done: 3 }[traineeStatus(a)[0]] - { stuck: 0, active: 1, new: 2, done: 3 }[traineeStatus(b)[0]])).map((r, i) => {
          const [sk, sl] = traineeStatus(r), pct = pctFor(c, r.p), cur = steps[Math.min(r.p.current || 0, steps.length - 1)];
          const qs = quizzes.filter((q) => r.p.quiz?.[q.id]); const first = qs.filter((q) => r.p.quiz[q.id].firstTry).length;
          return `<button type="button" class="tr-row" ${r.uid ? `data-tr-trainee="${esc(r.uid)}"` : "disabled"} style="--i:${i}">
            <span class="ldr-avatar">${avatarInner(r.name, r.uid, r.email)}</span>
            <span class="tr-row-main"><strong>${esc(displayName(r.name, r.uid, r.email))}</strong><small>${r.p.completedAt ? `Finished ${esc(ago(r.p.completedAt))}` : r.p.startedAt ? `${esc(cur?.title || "")} · active ${esc(ago(r.p.lastAt || r.lastAt))}` : "Hasn't started yet"}</small>
              <span class="tr-bar"><span style="--w:${pct}%"></span></span></span>
            <span class="tr-row-side"><span class="tr-pill is-${sk}">${esc(sl)}</span><b class="tr-pct">${pct}%</b></span>
          </button>`;
        }).join("")}</div>` : `<p class="in-empty">No team members yet. Add employees in config.js and Firebase.</p>`}
      </section>
      <section class="in-card tr-qs">
        <header class="in-card-head"><div><h2>Questions</h2><p>${openQ.length ? `${openQ.length} waiting for a reply` : "You're all caught up"}</p></div></header>
        <div class="tr-qlist">${(loading ? TRS.openQ : TRS.team.notes).length ? (loading ? TRS.openQ : TRS.team.notes).slice(0, 30).map((n) => noteThreadHTML(n, true)).join("") : `<p class="in-empty">${loading ? "Loading…" : "No questions yet."}</p>`}</div>
      </section>
    </div>`;
  requestAnimationFrame(() => $$(".tr-seg").forEach(moveIndicator));
}
function renderTraineeDrawer(uid) {
  TRS.drawerUid = uid;
  const c = courseById(TRS.teamCourse) || (TR.courses || []).find((x) => !x.soon);
  const doc = progDoc(uid); if (!doc) return;
  const p = doc.courses?.[c.id] || {}, steps = courseSteps(c), [sk, sl] = traineeStatus({ p, lastAt: doc.lastAt });
  const notes = TRS.team.notes.filter((n) => n.traineeUid === uid);
  $("#tr-drawer-body").innerHTML = `
    <div class="trd-head"><span class="ldr-avatar trd-av">${avatarInner(doc.name || "?", uid, doc.email)}</span><div><h2 id="trd-title">${esc(displayName(doc.name || "", uid, doc.email))}</h2><small>${esc(doc.email || "")}</small></div><span class="tr-pill is-${sk}">${esc(sl)}</span></div>
    <div class="trd-prog">${ring(pctFor(c, p), 72, 7)}<div><strong>${esc(c.title)}</strong><small>${p.startedAt ? `Started ${esc(ago(p.startedAt))}` : "Not started"}${p.lastAt ? ` · active ${esc(ago(p.lastAt))}` : ""}</small></div></div>
    <div class="trd-mods">${c.modules.map((m, mi) => `<div class="trd-mod"><strong>${esc(m.title)}</strong>${steps.filter((x) => x.mi === mi).map((x) => {
      const d = p.done?.[x.id], q = p.quiz?.[x.id];
      return `<span class="trd-step${d ? " is-done" : ""}"><i>${d ? TR_ICONS.check : ""}</i>${esc(x.title)}${q ? `<em class="${q.firstTry ? "is-ok" : "is-retry"}">${q.firstTry ? "First try" : `${q.attempts} tries`}</em>` : ""}</span>`;
    }).join("")}</div>`).join("")}</div>
    <h3 class="drawer-h">Send a note</h3>
    <div class="trd-note"><textarea id="trd-note-text" rows="3" maxlength="600" placeholder="Encourage them, or ask how it's going"></textarea><button type="button" class="btn btn-primary" data-trd-send="${esc(uid)}">Send note</button></div>
    ${notes.length ? `<h3 class="drawer-h">Conversation</h3>${notes.map((n) => noteThreadHTML(n, true)).join("")}` : ""}`;
}
async function sendManagerNote(uid) {
  const ta = $("#trd-note-text"); const text = ta?.value.trim(); if (!text) { ta?.focus(); return; }
  const doc = progDoc(uid); const c = courseById(TRS.teamCourse) || (TR.courses || []).find((x) => !x.soon);
  const p = doc?.courses?.[c.id] || {}, st = courseSteps(c)[Math.min(p.current || 0, courseSteps(c).length - 1)];
  const now = new Date().toISOString();
  try {
    await state.store.addNote({ traineeUid: uid, traineeName: doc?.name || "", traineeEmail: doc?.email || "", courseId: c.id, courseTitle: c.title, stepId: st?.id || "", stepTitle: st?.title || "", from: "manager", byName: state.user.name, byUid: state.user.uid, text, createdAt: now, updatedAt: now, status: "answered", replies: [] });
    ta.value = ""; toast(`Note sent to ${doc?.name || "them"}`, "var(--s-done)");
  } catch (e) { console.error(e); toast("The note didn't send. Try again.", "#E2632B"); }
}

/* ---------- demo seed ---------- */
function seedTraining() {
  const c = (TR.courses || []).find((x) => !x.soon && x.modules); if (!c) return { progress: {}, notes: [] };
  const steps = courseSteps(c), now = Date.now(), iso = (h) => new Date(now - h * 3600e3).toISOString();
  const mk = (uid, name, email, upto, lastH, startH, done) => {
    const d = {}; steps.slice(0, upto).forEach((s, i) => { d[s.id] = iso(startH - (startH - lastH) * (i / Math.max(upto, 1))); });
    const quiz = {}; steps.slice(0, upto).filter((s) => s.type === "quiz").forEach((s, i) => { quiz[s.id] = { firstTry: i % 3 !== 1, attempts: i % 3 !== 1 ? 1 : 2 }; });
    return { uid, name, email, lastAt: iso(lastH), courses: { [c.id]: { done: d, quiz, current: upto, startedAt: iso(startH), lastAt: iso(lastH), ...(done ? { completedAt: iso(lastH) } : {}) } } };
  };
  const progress = {
    "demo-t1": mk("demo-t1", "Avery Collins", "avery.collins@demo.local", 11, 2, 26, false),
    "demo-t2": mk("demo-t2", "Jordan Patel", "jordan.patel@demo.local", 7, 110, 140, false),
    "demo-t3": mk("demo-t3", "Sam Rivera", "sam.rivera@demo.local", steps.length, 30, 75, true)
  };
  const comm = steps.find((s) => s.id === "community") || steps[6];
  const notes = [
    { id: "dq1", traineeUid: "demo-t2", traineeName: "Jordan Patel", traineeEmail: "jordan.patel@demo.local", courseId: c.id, courseTitle: c.title, stepId: comm.id, stepTitle: comm.title, from: "trainee", text: "I can't see the Community Passwords button on the Team Site. Do I need special access?", createdAt: iso(112), updatedAt: iso(112), status: "open", replies: [] },
    { id: "dq2", traineeUid: "demo-t1", traineeName: "Avery Collins", traineeEmail: "avery.collins@demo.local", courseId: c.id, courseTitle: c.title, stepId: "zoom-phone", stepTitle: "The Zoom Phone platform", from: "trainee", text: "Zoom was already installed. Should I still download the latest version?", createdAt: iso(5), updatedAt: iso(3), status: "answered", replies: [{ by: "Juan Rochin", byUid: "demo-admin", role: "manager", text: "If it opens and you can sign in, you're good. Zoom updates itself.", at: iso(3) }] }
  ];
  return { progress, notes };
}

/* ---------- Download a course as PowerPoint ---------- */
function loadPptx() {
  if (window.PptxGenJS) return Promise.resolve(window.PptxGenJS);
  return new Promise((res, rej) => {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
    sc.onload = () => res(window.PptxGenJS); sc.onerror = () => rej(new Error("PowerPoint library didn't load"));
    document.head.appendChild(sc);
  });
}
async function imgData(url) {
  try { const r = await fetch(url); const b = await r.blob(); return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); } catch { return null; }
}
async function downloadCoursePptx(cid, btn) {
  const c = courseById(cid); if (!c) return;
  btn?.classList.add("is-loading"); btn && (btn.disabled = true);
  try {
    const PptxGenJS = await loadPptx();
    const logo = await imgData("assets/logo.png");
    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_WIDE";            // 13.33 x 7.5 in
    pres.author = state.user?.name || "HRA"; pres.company = "Hunter Recruitment Advisors"; pres.title = c.title;
    pres.theme = { headFontFace: "Calibri", bodyFontFace: "Calibri" };
    const O = "F26A26", N = "00377F", INK = "0A1E3F", MU = "62789A", LI = "F4F7FB", G = "0E9F7E", W = 13.333, H = 7.5;
    const steps = courseSteps(c), p = progFor(state.user.uid, c.id);
    const tb = (o) => ({ isTextBox: true, margin: 0, fontFace: "Calibri", ...o });
    const estH = (text, pt, w) => { const per = Math.max(10, Math.floor(w * 72 / (pt * 0.47))); const lines = String(text || "").split("\n").reduce((t, l) => t + Math.max(1, Math.ceil(l.length / per)), 0); return lines * pt * 1.3 / 72 + 0.05; };
    pres.defineSlideMaster({ title: "HRA Content", background: { color: "FFFFFF" },
      objects: [{ rect: { x: 0, y: 0, w: W, h: 0.12, fill: { color: O } } }, ...(logo ? [{ image: { data: logo, x: 0.6, y: H - 0.62, w: 1.55, h: 0.4 } }] : []),
        { text: { text: c.title, options: { x: 2.4, y: H - 0.55, w: 8, h: 0.3, fontSize: 10, color: MU, fontFace: "Calibri", margin: 0 } } }],
      slideNumber: { x: W - 1.1, y: H - 0.55, w: 0.6, h: 0.3, fontSize: 10, color: MU, align: "right" } });
    pres.defineSlideMaster({ title: "HRA Section", background: { color: N },
      objects: [{ rect: { x: 0, y: H - 0.12, w: W, h: 0.12, fill: { color: O } } }], slideNumber: { x: W - 1.1, y: H - 0.55, w: 0.6, h: 0.3, fontSize: 10, color: "B9C7DD", align: "right" } });

    // Title
    const t = pres.addSlide(); t.background = { color: O };
    t.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 0.6, w: 2.9, h: 0.95, fill: { color: "FFFFFF" }, rectRadius: 0.12, line: { color: "FFFFFF" } });
    if (logo) t.addImage({ data: logo, x: 0.85, y: 0.72, w: 2.6, h: 0.68 });
    t.addText("HRA TRAINING", tb({ x: 0.75, y: 2.35, w: 8, h: 0.4, fontSize: 14, bold: true, color: "FFE3D3", charSpacing: 3 }));
    t.addText(c.title, tb({ x: 0.75, y: 2.8, w: 11.5, h: 1.3, fontSize: 46, bold: true, color: "FFFFFF", valign: "top" }));
    t.addText(c.summary || "", tb({ x: 0.75, y: 4.15, w: 10.5, h: 0.9, fontSize: 18, color: "FFFFFF", valign: "top" }));
    t.addShape(pres.shapes.LINE, { x: 0.75, y: 5.55, w: 11.8, h: 0, line: { color: "FFFFFF", width: 1.5 } });
    t.addText(`Downloaded by ${state.user?.name || ""} on ${new Date().toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" })}${p.completedAt ? `  ·  Completed ${new Date(p.completedAt).toLocaleDateString()}` : ""}`, tb({ x: 0.75, y: 5.75, w: 11.8, h: 0.4, fontSize: 13, color: "FFFFFF" }));

    // Contents
    const ct = pres.addSlide({ masterName: "HRA Content" });
    ct.addText("What's in this course", tb({ x: 0.6, y: 0.5, w: 12, h: 0.7, fontSize: 30, bold: true, color: INK }));
    c.modules.forEach((m, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = 0.6 + col * 6.2, y = 1.55 + row * 1.25;
      ct.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.9, h: 1.0, fill: { color: LI }, line: { color: "E1E8F2" }, rectRadius: 0.1 });
      ct.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.22, w: 0.56, h: 0.56, fill: { color: O }, line: { color: O } });
      ct.addText(String(i + 1), tb({ x: x + 0.25, y: y + 0.22, w: 0.56, h: 0.56, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle" }));
      ct.addText(m.title, tb({ x: x + 1.05, y: y + 0.18, w: 4.6, h: 0.4, fontSize: 18, bold: true, color: INK }));
      ct.addText(`${m.steps.filter((x) => x.type !== "complete").length} steps`, tb({ x: x + 1.05, y: y + 0.58, w: 4.6, h: 0.3, fontSize: 12, color: MU }));
    });

    // Steps
    c.modules.forEach((m, mi) => {
      const sec = pres.addSlide({ masterName: "HRA Section" });
      sec.addText(`PART ${mi + 1}`, tb({ x: 0.9, y: 2.5, w: 10, h: 0.45, fontSize: 16, bold: true, color: "FFB088", charSpacing: 3 }));
      sec.addText(m.title, tb({ x: 0.9, y: 3.0, w: 11.5, h: 1.2, fontSize: 48, bold: true, color: "FFFFFF", valign: "top" }));
      m.steps.forEach((st) => {
        const s1 = pres.addSlide({ masterName: "HRA Content" });
        const note = myNote(c.id, st.id);
        const cw = note ? 8.1 : 12.1;
        let y = 0.42;
        if (st.type === "complete") {
          s1.addText(st.title, tb({ x: 0.6, y: 2.4, w: 12.1, h: 0.9, fontSize: 40, bold: true, color: O, align: "center" }));
          s1.addText(st.text || "", tb({ x: 1.6, y: 3.4, w: 10.1, h: 1, fontSize: 20, color: INK, align: "center", valign: "top" }));
          return;
        }
        s1.addText(m.title.toUpperCase(), tb({ x: 0.6, y, w: cw, h: 0.3, fontSize: 12, bold: true, color: O, charSpacing: 2 })); y += 0.38;
        const th = estH(st.title, 30, cw); s1.addText(st.title, tb({ x: 0.6, y, w: cw, h: th, fontSize: 30, bold: true, color: INK, valign: "top" })); y += th + 0.15;
        if (st.text) { const h = estH(st.text, 17, cw); s1.addText(st.text, tb({ x: 0.6, y, w: cw, h, fontSize: 17, color: "34455F", valign: "top" })); y += h + 0.2; }
        if (st.bullets?.length) {
          const items = st.bullets.map((b, i) => ({ text: b, options: { bullet: { indent: 18 }, breakLine: i < st.bullets.length - 1, paraSpaceAfter: 6 } }));
          const h = st.bullets.reduce((t, b) => t + estH(b, 16, cw - 0.3) + 0.08, 0.05);
          s1.addText(items, tb({ x: 0.65, y, w: cw - 0.05, h, fontSize: 16, color: INK, valign: "top" })); y += h + 0.15;
        }
        if (st.chips?.length) {
          let cx = 0.6, cy = y; const ch = 0.42;
          st.chips.forEach((chip, i) => { const w = Math.min(cw, 0.55 + chip.length * 0.11); if (cx + w > 0.6 + cw) { cx = 0.6; cy += ch + 0.12; }
            s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: cy, w, h: ch, fill: { color: "FFF1E8" }, line: { color: "FBD3BC" }, rectRadius: 0.2 });
            s1.addText(`${i + 1}. ${chip}`, tb({ x: cx, y: cy, w, h: ch, fontSize: 13, bold: true, color: "A3400B", align: "center", valign: "middle" })); cx += w + 0.12; });
          y = cy + ch + 0.25;
        }
        if (st.type === "quiz") {
          s1.addText(st.question, tb({ x: 0.6, y, w: cw, h: estH(st.question, 20, cw), fontSize: 20, bold: true, color: INK, valign: "top" })); y += estH(st.question, 20, cw) + 0.15;
          st.options.forEach((o, i) => { const ok = i === st.answer;
            s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: cw, h: 0.5, fill: { color: ok ? "E6F7F1" : LI }, line: { color: ok ? G : "E1E8F2", width: ok ? 1.5 : 0.75 }, rectRadius: 0.08 });
            s1.addText([{ text: `${String.fromCharCode(65 + i)}   `, options: { bold: true, color: ok ? G : MU } }, { text: o, options: { color: INK, bold: ok } }, ...(ok ? [{ text: "   ✓ Correct", options: { color: G, bold: true } }] : [])], tb({ x: 0.85, y, w: cw - 0.4, h: 0.5, fontSize: 15, valign: "middle" }));
            y += 0.6; });
          if (st.explain) { const h = estH(st.explain, 14, cw - 0.5) + 0.2; s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y: y + 0.05, w: cw, h, fill: { color: "EEF4FF" }, line: { color: "EEF4FF" }, rectRadius: 0.08 });
            s1.addText(st.explain, tb({ x: 0.85, y: y + 0.05, w: cw - 0.5, h, fontSize: 14, color: "1E4FA8", valign: "middle" })); y += h + 0.2; }
        }
        if (st.type === "values") {
          const n = st.items.length, gap = 0.18, w = (cw - gap * (n - 1)) / n, h = 3.6;
          st.items.forEach((it, i) => { const x = 0.6 + i * (w + gap);
            s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: "FFFFFF" }, line: { color: "FBD3BC", width: 1.25 }, rectRadius: 0.12 });
            s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + w / 2 - 0.4, y: y + 0.25, w: 0.8, h: 0.8, fill: { color: O }, line: { color: O }, rectRadius: 0.16 });
            s1.addText(it.key, tb({ x: x + w / 2 - 0.4, y: y + 0.25, w: 0.8, h: 0.8, fontSize: String(it.key).length > 2 ? 16 : 26, bold: true, color: "FFFFFF", align: "center", valign: "middle" }));
            s1.addText(it.label && it.label !== it.name ? [{ text: it.label, options: { breakLine: true, color: O, fontSize: 11 } }, { text: it.name, options: { color: INK } }] : it.name, tb({ x: x + 0.12, y: y + 1.15, w: w - 0.24, h: 0.65, fontSize: n > 5 ? 12.5 : 14, bold: true, color: INK, align: "center", valign: "top" }));
            s1.addText(it.text, tb({ x: x + 0.12, y: y + 1.85, w: w - 0.24, h: h - 2, fontSize: n > 5 ? 10 : 11, color: "4B5E7C", align: "center", valign: "top" })); });
          y += h + 0.2;
        }
        if (st.type === "resources") {
          const watched = new Set(p.watched?.[st.id] || []);
          const rowH = st.items.length > 5 ? 0.5 : 0.6, fs = st.items.length > 5 ? 12.5 : 14;
          st.items.forEach((it, i) => {
            const on = watched.has(i) || Boolean(p.done?.[st.id]);
            s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: cw, h: rowH - 0.08, fill: { color: on ? "E6F7F1" : LI }, line: { color: on ? G : "E1E8F2", width: 0.75 }, rectRadius: 0.08 });
            const runs = [{ text: `${on ? "☑" : "☐"}  `, options: { color: on ? G : MU, bold: true } }];
            if (it.q) runs.push({ text: `${it.q}:  `, options: { color: O, bold: true } });
            runs.push(it.url ? { text: it.title, options: { hyperlink: { url: it.url }, color: N, bold: true, underline: { style: "sng" } } } : { text: it.title, options: { color: INK, bold: true } });
            if (it.minutes != null) runs.push({ text: `   ${fmtMin(it.minutes)}`, options: { color: MU } });
            s1.addText(runs, tb({ x: 0.8, y, w: cw - 0.4, h: rowH - 0.08, fontSize: fs, valign: "middle" }));
            y += rowH;
          });
          y += 0.1;
        }
        if (st.type === "steps") {
          st.items.forEach((it, i) => { s1.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.05, w: 0.42, h: 0.42, fill: { color: O }, line: { color: O } });
            s1.addText(String(i + 1), tb({ x: 0.6, y: y + 0.05, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle" }));
            s1.addText([{ text: it.title, options: { bold: true, color: INK, breakLine: true } }, { text: it.text, options: { color: "4B5E7C" } }], tb({ x: 1.2, y, w: cw - 0.6, h: 0.62, fontSize: 14, valign: "top" }));
            y += 0.68; });
        }
        if (st.callout) { const h = estH(st.callout.text, 14, cw - 0.5) + 0.22, warn = st.callout.tone === "warn";
          s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: cw, h, fill: { color: warn ? "FFF4EC" : "EEF4FF" }, line: { color: warn ? "FBD3BC" : "D6E4FF" }, rectRadius: 0.08 });
          s1.addText(st.callout.text, tb({ x: 0.85, y, w: cw - 0.5, h, fontSize: 14, bold: true, color: warn ? "A3400B" : "1E4FA8", valign: "middle" })); y += h + 0.2; }
        const links = [...(st.link ? [st.link] : []), ...(st.links || [])];
        if (links.length) {
          const runs = []; links.forEach((l, i) => {
            if (l.course) runs.push({ text: `${l.label} (in Training)`, options: { color: N, bold: true } });
            else { const url = l.url || linkUrl(l.key) || linkUrl("teamSite"); runs.push({ text: `${l.label}  ↗`, options: { hyperlink: { url }, color: N, bold: true, underline: { style: "sng" } } }); }
            if (i < links.length - 1) runs.push({ text: "     " }); });
          s1.addText(runs, tb({ x: 0.6, y, w: cw, h: 0.4, fontSize: 15 })); y += 0.55;
        }
        if (st.type === "action") { const done = Boolean(p.done?.[st.id]);
          s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6, y, w: cw, h: 0.6, fill: { color: done ? "E6F7F1" : "FAFCFF" }, line: { color: done ? G : "CBD5E3", width: 1.25, dashType: done ? "solid" : "dash" }, rectRadius: 0.1 });
          s1.addText(`${done ? "☑" : "☐"}   ${st.confirm || "Done"}`, tb({ x: 0.85, y, w: cw - 0.5, h: 0.6, fontSize: 16, bold: true, color: done ? "0B6B55" : INK, valign: "middle" })); }
        if (note) {
          s1.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.0, y: 0.55, w: 3.75, h: 5.9, fill: { color: "FFF8DB" }, line: { color: "F2DE8A" }, rectRadius: 0.12 });
          s1.addText("MY NOTES", tb({ x: 9.25, y: 0.75, w: 3.3, h: 0.3, fontSize: 12, bold: true, color: "8A6400", charSpacing: 2 }));
          s1.addText(note, tb({ x: 9.25, y: 1.15, w: 3.3, h: 5.1, fontSize: 13, color: "4A3B00", valign: "top" }));
        }
      });
    });
    const name = `${c.title} - HRA Training.pptx`.replace(/[\\/:*?"<>|]/g, "-");
    // Rebuild the file without folder entries so it opens and co-edits cleanly from SharePoint/OneDrive.
    const raw = await pres.write({ outputType: "arraybuffer" });
    const zin = await window.JSZip.loadAsync(raw), zout = new window.JSZip();
    for (const [path, f] of Object.entries(zin.files)) { if (!f.dir) zout.file(path, await f.async("uint8array"), { createFolders: false }); }
    const blob = await zout.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("PowerPoint downloaded", "var(--s-done)");
  } catch (e) {
    console.error(e); toast("The PowerPoint couldn't be created. Check your connection and try again.", "#E2632B");
  } finally { btn?.classList.remove("is-loading"); if (btn) btn.disabled = false; }
}

/* ---------- Admin: manage training data ---------- */
function trPeople() {
  const map = new Map();
  for (const p of TRS.team.progress) if (p.uid) map.set(p.uid, { uid: p.uid, name: p.name || nameFromEmail(p.email || ""), email: p.email || "" });
  for (const n of TRS.team.notes) if (n.traineeUid && !map.has(n.traineeUid)) map.set(n.traineeUid, { uid: n.traineeUid, name: n.traineeName || "", email: n.traineeEmail || "" });
  if (!map.has(state.user.uid)) map.set(state.user.uid, { uid: state.user.uid, name: state.user.name, email: state.user.email });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function openManageTraining() {
  if (!state.isAdmin) return;
  const people = trPeople();
  const counts = { progress: TRS.team.progress.length, notes: TRS.team.notes.length };
  swapModal(`<div id="tr-manage">
    <div class="modal-head"><span class="type-icon tm-icon">${svgI('<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>', 22)}</span>
      <div><h2 id="modal-title">Manage training data</h2><p>Clean up test data or start someone over. These actions can't be undone.</p></div></div>
    <label class="field"><span class="field-label">Who</span>
      <select id="tm-who"><option value="__all">Everyone (${people.length} ${people.length === 1 ? "person" : "people"})</option>${people.map((p) => `<option value="${esc(p.uid)}">${esc(p.name)}${p.uid === state.user.uid ? " (you)" : ""}${p.email ? ` · ${esc(p.email)}` : ""}</option>`).join("")}</select></label>
    <div class="tm-actions">
      <div class="tm-act"><span class="tm-ico">${svgI('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', 20)}</span><div><strong>Reset progress</strong><small>Clears completed steps, quiz results and course completion. They'll start the course from the beginning.</small></div><button type="button" class="btn tm-btn" data-tm="progress">Reset</button></div>
      <div class="tm-act"><span class="tm-ico">${TR_ICONS.chat}</span><div><strong>Delete questions and answers</strong><small>Removes questions, replies and manager notes${counts.notes ? ` (${counts.notes} total right now)` : ""}.</small></div><button type="button" class="btn tm-btn" data-tm="questions">Delete</button></div>
      <div class="tm-act"><span class="tm-ico">${svgI('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', 20)}</span><div><strong>Delete personal notes</strong><small>Deletes the private notes people wrote on steps. You can delete them, but you can never read them.</small></div><button type="button" class="btn tm-btn" data-tm="notes">Delete</button></div>
    </div>
    <p class="form-error" id="tm-msg" role="status"></p>
    <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Done</button></div>
  </div>`);
}
async function runManage(kind, btn) {
  const who = $("#tm-who")?.value || "__all";
  const all = who === "__all";
  const person = all ? null : trPeople().find((p) => p.uid === who);
  const label = { progress: "reset training progress", questions: "delete questions and answers", notes: "delete personal notes" }[kind];
  const target = all ? "everyone" : (person?.uid === state.user.uid ? "you" : person?.name || "this person");
  const yes = await confirmDialog({ title: `${label.charAt(0).toUpperCase() + label.slice(1)}?`, body: `This will ${label} for <strong>${esc(target)}</strong>. It can't be undone.`, confirm: kind === "progress" ? "Reset" : "Delete", danger: true });
  if (!yes) return;
  closeOverlay($("#confirm"));
  btn.classList.add("is-loading"); btn.disabled = true;
  const uids = all ? trPeople().map((p) => p.uid) : [who];
  let n = 0, failed = 0;
  try {
    if (kind === "progress") for (const u of uids) { try { await state.store.deleteProgress(u); n++; } catch (e) { failed++; console.error(e); } }
    if (kind === "questions") for (const note of TRS.team.notes.filter((x) => all || x.traineeUid === who)) { try { await state.store.deleteNote(note.id); n++; } catch (e) { failed++; console.error(e); } }
    if (kind === "notes") for (const u of uids) { try { await state.store.deletePrivate(u); n++; } catch (e) { failed++; console.error(e); } }
    if (kind === "progress" && uids.includes(state.user.uid)) { TRS.progress = TRS.progress.filter((p) => p.uid !== state.user.uid); }
    if (kind === "notes" && uids.includes(state.user.uid)) { TRS.priv = {}; }
    const what = { progress: `Progress reset for ${all ? `${n} ${n === 1 ? "person" : "people"}` : target}`, questions: `${n} question${n === 1 ? "" : "s"} deleted`, notes: `Personal notes deleted for ${all ? `${n} ${n === 1 ? "person" : "people"}` : target}` }[kind];
    const msg = $("#tm-msg"); if (msg) { msg.textContent = failed ? `${what}. ${failed} couldn't be changed; make sure the latest firestore.rules is published.` : `${what}.`; msg.classList.toggle("is-ok", !failed); }
    toast(failed ? "Some items couldn't be changed" : what, failed ? "#E2632B" : "var(--s-done)");
  } finally { btn.classList.remove("is-loading"); btn.disabled = false; }
}

/* ==========================================================================
   Org chart (admins only). Imported from the employee list (Excel) into Firestore org/chart.
   ========================================================================== */
const ORG = { unassignedOpen: false, data: null, unsub: null, started: false, collapsed: new Set(), sel: null, q: "", zoom: 1, x: 0, y: 0, fitted: false, unOpen: (() => { try { return localStorage.getItem("hra_org_unassigned_open") === "1"; } catch { return false; } })() };
const ORG_STATUS = {
  "FT EE": { label: "Full-time employee", color: "#00377F" },
  "USC": { label: "USC", color: "#0E9F7E" },
  "RadarHire": { label: "RadarHire", color: "#7C3AED" },
  "Altezza": { label: "Altezza", color: "#E0A800" },
  "OSC": { label: "OSC", color: "#F26A26" },
  "Comrise": { label: "Comrise", color: "#DB2777" }
};
const orgColor = (st) => ORG_STATUS[st]?.color || "#62789A";
const orgNorm = (x) => String(x ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z' ]/g, " ").replace(/\s+/g, " ").trim();

function startOrg() {
  if (!ORG.started) {
    ORG.started = true;
    ORG.unsub = state.store.watchOrg((d, err) => { ORG.data = d; ORG.error = err ? (err.code || "error") : ""; ORG.fitted = false; if (currentTool === "org") renderOrg(); });
  }
  renderOrg();
}

/* Turn the spreadsheet rows into a tree. Handles short names ("Aaron"), nicknames ("Jen" → Jennifer),
   a title instead of a name ("Director"), self-reporting (the CEO) and missing managers. */
function buildOrg(people) {
  const P = people.map((p, i) => ({ ...p, id: "p" + i, name: String(p.name || "").trim(), title: String(p.title || "").trim(), status: String(p.status || "").trim(), manager: String(p.manager || "").trim(), kids: [] }));
  const notes = [];
  const findPerson = (m) => {
    const n = orgNorm(m); if (!n) return null;
    const exact = P.filter((p) => orgNorm(p.name) === n); if (exact.length === 1) return { list: exact };
    const parts = n.split(" "), first = parts[0], last = parts.slice(1).join(" ");
    if (last) {
      const nick = P.filter((p) => { const q = orgNorm(p.name).split(" "); return q.slice(1).join(" ") === last && (q[0].startsWith(first) || first.startsWith(q[0])); });
      if (nick.length === 1) return { list: nick };
    } else {
      const byFirst = P.filter((p) => orgNorm(p.name).split(" ")[0] === first); if (byFirst.length === 1) return { list: byFirst };
      const byTitle = P.filter((p) => orgNorm(p.title).split(" ").includes(first)); if (byTitle.length) return { list: byTitle, byTitle: true };
    }
    return null;
  };
  const roots = [], unassigned = [], groups = new Map();
  for (const p of P) {
    if (!p.manager) { unassigned.push(p); continue; }
    const hit = findPerson(p.manager);
    if (!hit) { unassigned.push(p); notes.push(`${p.name}: manager "${p.manager}" isn't on the list`); continue; }
    if (hit.list.length === 1) {
      const m = hit.list[0];
      if (m === p) { roots.push(p); continue; }
      p.parent = m; m.kids.push(p);
    } else {
      // several people match a title ("Director"): one shared card for them
      const key = hit.list.map((x) => x.id).join("+");
      if (!groups.has(key)) groups.set(key, { id: "g" + groups.size, group: true, leads: hit.list, label: p.manager, kids: [] });
      const g = groups.get(key); p.parent = g; g.kids.push(p);
    }
  }
  for (const g of groups.values()) {
    // the group sits where its leads sit (under their shared manager); the leads move into the group card
    const mgr = g.leads[0].parent;
    const sameMgr = g.leads.every((l) => l.parent === mgr);
    const host = sameMgr && mgr ? mgr : null;
    for (const l of g.leads) { if (l.parent) l.parent.kids = l.parent.kids.filter((k) => k !== l); else { const i = roots.indexOf(l); if (i >= 0) roots.splice(i, 1); } l.inGroup = g; }
    for (const l of g.leads) for (const k of l.kids) { k.parent = g; g.kids.push(k); } // anyone reporting to a lead by name joins the group too
    // "Director of Recruitment Operations" → "Directors of Recruitment Operations" (plural on the first word)
    g.title = g.leads.every((l) => l.title === g.leads[0].title) ? (g.leads.length > 1 ? g.leads[0].title.replace(/^(\S+?)(s?)(\s|$)/, (m, w, s2, sp) => w + "s" + sp) : g.leads[0].title) : g.label;
    if (host) { g.parent = host; host.kids.push(g); } else roots.push(g);
    notes.push(`"${g.label}" matches ${g.leads.length} people (${g.leads.map((l) => l.name).join(", ")}): shown as one shared card`);
  }
  if (!roots.length && P.length) roots.push(P[0]);
  const sortKids = (n) => { n.kids.sort((a, b) => (b.kids.length > 0) - (a.kids.length > 0) || String(a.name || a.title).localeCompare(String(b.name || b.title))); n.kids.forEach(sortKids); };
  roots.forEach(sortKids);
  const teamSize = (n) => n.kids.reduce((t, k) => t + 1 + teamSize(k) + (k.group ? k.leads.length - 1 : 0), 0);
  return { people: P, roots, unassigned, notes, teamSize, groups: [...groups.values()] };
}

function orgAvatar(p, size = "") {
  const prof = [...PROF.byUid.values()].find((x) => x.name && orgNorm(x.name) === orgNorm(p.name));
  return `<span class="oc-av${size}" style="--sc:${orgColor(p.status)}">${prof?.photo ? `<img src="${esc(prof.photo)}" alt=""/>` : esc(initials(p.name))}</span>`;
}
function orgCard(n, T) {
  const team = T.teamSize(n), direct = n.kids.length;
  const open = !ORG.collapsed.has(n.id);
  const hit = (p) => !ORG.q || orgNorm(p.name).includes(orgNorm(ORG.q)) || orgNorm(p.title).includes(orgNorm(ORG.q));
  if (n.group) {
    const any = n.leads.some(hit);
    return `<div class="oc-card oc-group${any ? "" : " is-dim"}${n.leads.some((l) => ORG.sel === l.id) ? " is-sel" : ""}" data-oc-id="${n.id}">
      <span class="oc-group-label">${esc(n.title)}</span>
      <div class="oc-leads">${n.leads.map((l) => `<button type="button" class="oc-lead${hit(l) ? "" : " is-dim"}${ORG.sel === l.id ? " is-sel" : ""}" data-oc-sel="${l.id}">${orgAvatar(l, " sm")}<span><strong>${esc(l.name)}</strong><small><i style="background:${orgColor(l.status)}"></i>${esc(l.status)}</small></span></button>`).join("")}</div>
      ${direct ? `<button type="button" class="oc-toggle${open ? "" : " is-closed"}" data-oc-toggle="${n.id}" title="${open ? "Hide" : "Show"} team">${team}</button>` : ""}
    </div>`;
  }
  return `<div class="oc-card${hit(n) ? "" : " is-dim"}${ORG.sel === n.id ? " is-sel" : ""}" data-oc-sel="${n.id}" data-oc-id="${n.id}" style="--sc:${orgColor(n.status)}" tabindex="0">
    ${orgAvatar(n)}
    <span class="oc-text"><strong>${esc(n.name)}</strong><small>${esc(n.title)}</small><em><i></i>${esc(n.status || "—")}</em></span>
    ${direct ? `<button type="button" class="oc-toggle${open ? "" : " is-closed"}" data-oc-toggle="${n.id}" title="${open ? "Hide" : "Show"} team (${direct} direct, ${team} total)">${team}</button>` : ""}
  </div>`;
}
/* Leaves (people with no reports) under the same manager are stacked in a compact column instead of a wide row. */
function orgBranch(n, T) {
  const open = !ORG.collapsed.has(n.id);
  const leaves = n.kids.filter((k) => !k.kids.length && !k.group), branches = n.kids.filter((k) => k.kids.length || k.group);
  const cols = leaves.length > 4 ? 2 : 1;
  const items = [
    ...(leaves.length ? [`<li class="oc-li oc-leafbox"><div class="oc-stack" style="--cols:${cols}">${leaves.map((k) => orgCard(k, T)).join("")}</div></li>`] : []),
    ...branches.map((k) => orgBranch(k, T))
  ];
  return `<li class="oc-li">${orgCard(n, T)}${n.kids.length && open ? `<ul class="oc-ul${items.length === 1 ? " is-single" : ""}">${items.join("")}</ul>` : ""}</li>`;
}

function renderOrg() {
  const root = $("#org-root"); if (!root || !state.isAdmin) return;
  const d = ORG.data;
  const head = (sub) => `<div class="hero oc-hero"><div><h1 class="hero-title">Org chart</h1><p class="hero-sub">${sub}</p></div>
    <div class="oc-actions">${state.isSuper ? `<button type="button" class="btn btn-ghost" data-oc-import>${svgI('<path d="M12 16V4M7.5 8.5L12 4l4.5 4.5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>', 16)}${d ? "Update from Excel" : "Import Excel"}</button><input type="file" id="oc-file" accept=".xlsx" hidden />` : ""}</div></div>`;
  if (!d?.people?.length) {
    root.innerHTML = `${head("Admins only. Build it from the employee list in Excel.")}
      <div class="oc-empty"><span class="oc-empty-ico">${svgI(SUPER_ICONS.org, 34)}</span><h2>No org chart yet</h2>
      ${state.isSuper ? `<p>Import the employee list (an Excel file with <strong>Name</strong>, <strong>Employee Status</strong>, <strong>Title</strong> and <strong>Manager</strong> columns). It's read in your browser and saved privately in Firebase for admins only, never on GitHub.</p>
      <button type="button" class="btn btn-primary" data-oc-import>Import Excel</button>` : `<p>The org chart hasn't been set up yet. The super admin imports it from the employee list.</p>`}${ORG.error ? `<p class="form-error">Couldn't load the org chart (${esc(ORG.error)}). Make sure the latest firestore.rules is published.</p>` : ""}</div>`;
    return;
  }
  const T = buildOrg(d.people);
  const byStatus = d.people.reduce((m, p) => (m[p.status || "—"] = (m[p.status || "—"] || 0) + 1, m), {});
  const managers = T.people.filter((p) => p.kids.length).length + T.groups.length;
  root.innerHTML = `${head(state.isSuper ? `${esc(d.fileName || "Employee list")} · updated ${esc(ago(d.importedAt))}${d.importedBy ? " by " + esc(d.importedBy) : ""}` : `Updated ${esc(ago(d.importedAt))}`)}
    <div class="oc-stats">
      <div><b>${d.people.length}</b><span>People</span></div>
      <div><b>${byStatus["FT EE"] || 0}</b><span>Full-time employees</span></div>
      <div><b>${d.people.length - (byStatus["FT EE"] || 0)}</b><span>Other status</span></div>
      <div><b>${managers}</b><span>Managers</span></div>
      ${T.unassigned.length ? `<div class="is-warn"><b>${T.unassigned.length}</b><span>No manager listed</span></div>` : ""}
    </div>
    <div class="oc-toolbar">
      <label class="search oc-search">${svgI('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>', 16)}<input id="oc-q" type="search" placeholder="Find a person or title" value="${esc(ORG.q)}" autocomplete="off"/></label>
      <span class="oc-spacer"></span>
      <div class="oc-zoom"><button type="button" data-oc-zoom="-" aria-label="Zoom out">−</button><button type="button" data-oc-zoom="fit" title="Fit to screen">${svgI('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', 15)}</button><button type="button" data-oc-zoom="+" aria-label="Zoom in">+</button><button type="button" data-oc-expand title="Expand or collapse all">${ORG.collapsed.size ? "Expand all" : "Collapse all"}</button></div>
    </div>
    <div class="oc-canvas" id="oc-canvas"><div class="oc-world" id="oc-world" style="transform:translate(${ORG.x}px,${ORG.y}px) scale(${ORG.zoom})"><ul class="oc-ul oc-top">${T.roots.map((r) => orgBranch(r, T)).join("")}</ul></div></div>
    ${T.unassigned.length ? `<section class="oc-unassigned${ORG.unOpen ? " is-open" : ""}">
      <button type="button" class="oc-un-head" data-oc-unassigned aria-expanded="${Boolean(ORG.unOpen)}"><h3>No manager listed <span>${T.unassigned.length}</span></h3><small>${state.isSuper ? "Add their manager in the spreadsheet, then use “Update from Excel”." : "Their manager isn't on the employee list yet."}</small><span class="oc-un-chev">${CHEV}</span></button>
      <div class="oc-un-body"><div><div class="oc-ugrid">${T.unassigned.map((p) => orgCard(p, T)).join("")}</div></div></div>
    </section>` : ""}
    ${T.notes.length && state.isSuper ? `<details class="oc-notes"><summary>How the list was read (${T.notes.length})</summary><ul>${T.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></details>` : ""}
    <aside class="oc-panel${ORG.sel ? " is-open" : ""}" id="oc-panel">${orgPanelHTML(T)}</aside>`;
  bindOrgCanvas();
  if (!ORG.fitted) { ORG.fitted = true; requestAnimationFrame(() => orgFit()); }
}
function orgPanelHTML(T) {
  const p = T.people.find((x) => x.id === ORG.sel); if (!p) return "";
  const boss = p.inGroup ? p.inGroup.parent : p.parent;
  const bossName = boss ? (boss.group ? boss.leads.map((l) => l.name).join(" & ") : boss.name) : "";
  const reports = p.inGroup ? p.inGroup.kids : p.kids;
  return `<button type="button" class="icon-btn oc-panel-x" data-oc-close aria-label="Close"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    <div class="oc-panel-head">${orgAvatar(p, " lg")}<h2>${esc(p.name)}</h2><p>${esc(p.title)}</p><span class="oc-chip is-on" style="--sc:${orgColor(p.status)}"><i></i>${esc(ORG_STATUS[p.status]?.label || p.status || "No status")}</span></div>
    <dl class="oc-dl"><div><dt>Reports to</dt><dd>${bossName ? esc(bossName) : (p.manager ? esc(p.manager) : "No manager listed")}</dd></div>
      ${p.inGroup ? `<div><dt>Shares the team with</dt><dd>${esc(p.inGroup.leads.filter((l) => l !== p).map((l) => l.name).join(", "))}</dd></div>` : ""}
      <div><dt>Direct reports</dt><dd>${reports.length}</dd></div><div><dt>Whole team</dt><dd>${T.teamSize(p.inGroup || p)}</dd></div></dl>
    ${reports.length ? `<h3 class="oc-panel-h">Direct reports</h3><div class="oc-plist">${reports.map((k) => k.group ? k.leads.map((l) => `<button type="button" data-oc-sel="${l.id}">${orgAvatar(l, " sm")}<span><strong>${esc(l.name)}</strong><small>${esc(l.title)}</small></span></button>`).join("") : `<button type="button" data-oc-sel="${k.id}">${orgAvatar(k, " sm")}<span><strong>${esc(k.name)}</strong><small>${esc(k.title)}</small></span></button>`).join("")}</div>` : ""}`;
}

/* Pan (drag) and zoom (buttons, Ctrl + wheel, pinch on trackpads) */
function orgApply() { const w = $("#oc-world"); if (w) w.style.transform = `translate(${ORG.x}px,${ORG.y}px) scale(${ORG.zoom})`; }
function orgFit() {
  const c = $("#oc-canvas"), w = $("#oc-world"); if (!c || !w) return;
  const prev = w.style.transform; w.style.transform = "none";
  const cw = c.clientWidth, wr = w.scrollWidth, hr = w.scrollHeight; w.style.transform = prev;
  ORG.zoom = Math.max(0.35, Math.min(1, (cw - 40) / wr));
  ORG.x = Math.max(20, (cw - wr * ORG.zoom) / 2); ORG.y = 24;
  c.style.height = Math.min(Math.max(hr * ORG.zoom + 60, 360), window.innerHeight * 0.78) + "px";
  w.classList.add("is-anim"); orgApply(); setTimeout(() => w.classList.remove("is-anim"), 350);
}
function orgZoomAt(f, cx, cy) {
  const z = Math.max(0.3, Math.min(1.8, ORG.zoom * f));
  ORG.x = cx - (cx - ORG.x) * (z / ORG.zoom); ORG.y = cy - (cy - ORG.y) * (z / ORG.zoom); ORG.zoom = z; orgApply();
}
function bindOrgCanvas() {
  const c = $("#oc-canvas"); if (!c || c.dataset.bound) return; c.dataset.bound = "1";
  let drag = null;
  c.addEventListener("pointerdown", (e) => { if (e.target.closest("button, .oc-card, input")) return; drag = { x: e.clientX - ORG.x, y: e.clientY - ORG.y }; c.setPointerCapture(e.pointerId); c.classList.add("is-drag"); });
  c.addEventListener("pointermove", (e) => { if (!drag) return; ORG.x = e.clientX - drag.x; ORG.y = e.clientY - drag.y; orgApply(); });
  const end = () => { drag = null; c.classList.remove("is-drag"); };
  c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
  c.addEventListener("wheel", (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const r = c.getBoundingClientRect(); orgZoomAt(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
}
function orgFocus(id) {
  const c = $("#oc-canvas"), el = $(`[data-oc-id="${id}"], [data-oc-sel="${id}"]`, c); if (!c || !el) return;
  const cr = c.getBoundingClientRect(), er = el.getBoundingClientRect();
  ORG.x += cr.left + cr.width / 2 - (er.left + er.width / 2); ORG.y += cr.top + cr.height / 3 - (er.top + er.height / 2);
  const w = $("#oc-world"); w.classList.add("is-anim"); orgApply(); setTimeout(() => w.classList.remove("is-anim"), 350);
}

/* Import: read the Excel file in the browser (ExcelJS), check it, preview, save to Firestore */
async function importOrgFile(file) {
  if (!state.isSuper) return;
  try {
    const Excel = await loadExcel();
    const wb = new Excel.Workbook(); await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0]; if (!ws) throw new Error("The file has no sheets.");
    const txt = (v) => (v && typeof v === "object" ? (v.text ?? v.result ?? (v.richText ? v.richText.map((r) => r.text).join("") : "")) : v ?? "").toString().trim();
    let headerRow = 0, cols = {};
    ws.eachRow((row, r) => {
      if (headerRow) return;
      const vals = Array.from(row.values, (v) => orgNorm(txt(v)));   // row.values has empty slots: fill them
      const find = (...names) => vals.findIndex((v) => names.some((n) => v === n || v.startsWith(n)));
      const name = find("name", "full name", "employee"), title = find("title", "job title", "position"), manager = find("manager", "reports to", "supervisor"), status = find("employee status", "status", "type");
      if (name > 0 && manager > 0) { headerRow = r; cols = { name, title, manager, status }; }
    });
    if (!headerRow) throw new Error("Couldn't find the Name and Manager columns in the first sheet.");
    const people = [];
    ws.eachRow((row, r) => {
      if (r <= headerRow) return;
      const g = (i) => (i > 0 ? txt(row.values[i]) : "");
      const p = { name: g(cols.name), title: g(cols.title), manager: g(cols.manager), status: g(cols.status) };
      if (p.name) people.push(p);
    });
    if (!people.length) throw new Error("No people found under the header row.");
    const T = buildOrg(people);
    const data = { people, fileName: file.name, importedAt: new Date().toISOString(), importedBy: state.user.name };
    swapModal(`<div class="oc-import"><div class="modal-head"><span class="type-icon">${svgI(SUPER_ICONS.org, 22)}</span><div><h2 id="modal-title">Import ${esc(file.name)}</h2><p>Check the summary, then save. It replaces the current org chart for all admins.</p></div></div>
      <div class="oc-imp-stats"><div><b>${people.length}</b><span>people</span></div><div><b>${T.roots.length}</b><span>at the top</span></div><div><b>${T.unassigned.length}</b><span>no manager</span></div></div>
      ${T.notes.length ? `<ul class="oc-imp-notes">${T.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : `<p class="oc-imp-ok">Every manager was matched.</p>`}
      <p class="oc-imp-private">Saved privately in Firebase for admins only. Nothing is uploaded to GitHub.</p>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button type="button" class="btn btn-primary" data-oc-save><span class="btn-text">Save org chart</span><span class="spinner" aria-hidden="true"></span></button></div></div>`);
    ORG.pending = data;
  } catch (e) { console.error(e); toast(e.message || "That file couldn't be read.", "#E2632B"); }
}
async function saveOrgImport(btn) {
  if (!ORG.pending) return;
  btn.classList.add("is-loading"); btn.disabled = true;
  try { await state.store.saveOrg(ORG.pending); ORG.pending = null; ORG.fitted = false; ORG.collapsed.clear(); ORG.sel = null; closeOverlay($("#modal")); toast("Org chart saved", "var(--s-done)"); }
  catch (e) { console.error(e); btn.classList.remove("is-loading"); btn.disabled = false; toast(e?.code === "permission-denied" ? "Saving is blocked. Publish the latest firestore.rules." : "Couldn't save. Check your connection.", "#E2632B"); }
}
document.addEventListener("click", (e) => {
  const t = e.target; if (!(t instanceof Element) || !t.closest("#org-root, #modal")) return;
  if (t.closest("[data-oc-import]")) { if (state.isSuper) $("#oc-file")?.click(); return; }
  if (t.closest("[data-oc-unassigned]")) { ORG.unOpen = !ORG.unOpen; try { localStorage.setItem("hra_org_unassigned_open", ORG.unOpen ? "1" : "0"); } catch {} const sec = t.closest(".oc-unassigned"); sec.classList.toggle("is-open", ORG.unOpen); t.closest("[data-oc-unassigned]").setAttribute("aria-expanded", String(ORG.unOpen)); return; }
  if (t.closest("[data-oc-save]")) { saveOrgImport(t.closest("[data-oc-save]")); return; }
  const tg = t.closest("[data-oc-toggle]"); if (tg) { const id = tg.dataset.ocToggle; ORG.collapsed.has(id) ? ORG.collapsed.delete(id) : ORG.collapsed.add(id); renderOrg(); return; }
  const sel = t.closest("[data-oc-sel]"); if (sel) { ORG.sel = ORG.sel === sel.dataset.ocSel && !sel.closest(".oc-panel") ? null : sel.dataset.ocSel; renderOrg(); if (ORG.sel) setTimeout(() => orgFocus(ORG.sel), 30); return; }
  if (t.closest("[data-oc-close]")) { ORG.sel = null; renderOrg(); return; }
  const z = t.closest("[data-oc-zoom]"); if (z) { const c = $("#oc-canvas"); const v = z.dataset.ocZoom; if (v === "fit") orgFit(); else orgZoomAt(v === "+" ? 1.15 : 0.87, c.clientWidth / 2, c.clientHeight / 2); return; }
  if (t.closest("[data-oc-expand]")) { if (ORG.collapsed.size) ORG.collapsed.clear(); else { const T = buildOrg(ORG.data.people); T.roots.forEach((r) => r.kids.forEach((k) => { if (k.kids.length) ORG.collapsed.add(k.id); })); } ORG.fitted = false; renderOrg(); return; }
});
document.addEventListener("change", (e) => { if (e.target.id === "oc-file" && e.target.files?.[0] && state.isSuper) { importOrgFile(e.target.files[0]); e.target.value = ""; } });
document.addEventListener("input", (e) => {
  if (e.target.id !== "oc-q") return;
  ORG.q = e.target.value; const pos = e.target.selectionStart;
  renderOrg(); const q = $("#oc-q"); q?.focus(); q?.setSelectionRange(pos, pos);
  if (ORG.q.trim()) { const T = buildOrg(ORG.data.people); const m = T.people.find((p) => orgNorm(p.name).includes(orgNorm(ORG.q)) || orgNorm(p.title).includes(orgNorm(ORG.q))); if (m) orgFocus(m.id); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && ORG.sel && currentTool === "org") { ORG.sel = null; renderOrg(); } if (e.key === "Enter" && e.target.matches?.(".oc-card[data-oc-sel]")) e.target.click(); });

/* ==========================================================================
   Workable Open Jobs Report (Excel), from the sync's daily open-jobs summary
   ========================================================================== */
function amForClient(name) { const a = (WK.accountManagers || []).find((m) => (m.clients || []).some((c) => sameName(c, name))); return a?.name || "Unassigned"; }
async function downloadOpenJobs(btn) {
  btn?.classList.add("is-loading"); if (btn) btn.disabled = true;
  try {
    const rep = await state.store.getJobsReport();
    if (!rep?.jobs?.length) { toast("No open jobs report yet. It's created by the next Workable sync (or a rebuild-pages run).", "#E2632B"); return; }
    const Excel = await loadExcel(); const wb = new Excel.Workbook(); wb.creator = "HRA Dashboard";
    const mon = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
    const jobs = rep.jobs.map((j) => ({ ...j, am: amForClient(j.client), days: j.opened ? Math.max(0, Math.floor((Date.now() - new Date(j.opened)) / 86400e3)) : "" }))
      .sort((a, b) => (a.am === "Unassigned") - (b.am === "Unassigned") || a.am.localeCompare(b.am) || a.client.localeCompare(b.client) || a.title.localeCompare(b.title));
    const navy = "FF00377F", line = { style: "thin", color: { argb: "FFDCE5F0" } }, box = { top: line, left: line, bottom: line, right: line };
    const ws = wb.addWorksheet("Open jobs", { views: [{ state: "frozen", ySplit: 3 }] });
    const cols = [["Account manager", 20], ["Client", 30], ["Job title", 34], ["Location", 20], ["Opened", 12], ["Days open", 10], ["Applicants (12 mo)", 12], ["Submitted", 11], ["In process", 11], ["Interviews", 11], ["Hires", 8], ["Last submission", 14], ["Link", 12]];
    ws.columns = cols.map(([, w]) => ({ width: w }));
    ws.mergeCells(1, 1, 1, cols.length);
    Object.assign(ws.getCell("A1"), { value: `Workable Open Jobs Report · week of ${mon.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })}` });
    ws.getCell("A1").font = { bold: true, size: 15, color: { argb: navy } }; ws.getRow(1).height = 26;
    ws.mergeCells(2, 1, 2, cols.length);
    ws.getCell("A2").value = `${jobs.length} open jobs · ${new Set(jobs.map((j) => j.client)).size} clients · data from Workable, updated ${new Date(rep.updatedAt).toLocaleString()}`;
    ws.getCell("A2").font = { size: 10, color: { argb: "FF62789A" } };
    const head = ws.getRow(3);
    cols.forEach(([l], i) => { const c = head.getCell(i + 1); c.value = l; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } }; c.alignment = { vertical: "middle", wrapText: true }; c.border = box; });
    head.height = 30;
    jobs.forEach((j, i) => {
      const r = ws.getRow(4 + i);
      const vals = [j.am, j.client, j.title, j.location, j.opened ? new Date(j.opened) : "", j.days, j.applicants, j.submitted, j.inProcess, j.interviews, j.hires, j.lastSubmitted ? new Date(j.lastSubmitted) : "", j.url ? { text: "Open", hyperlink: j.url } : ""];
      vals.forEach((v, k) => { const c = r.getCell(k + 1); c.value = v; c.border = box; c.alignment = { vertical: "top", wrapText: k < 4 }; if (i % 2) c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF6F9FD" } }; });
      [5, 12].forEach((k) => (r.getCell(k).numFmt = "m/d/yyyy"));
      if (j.url) r.getCell(13).font = { color: { argb: "FF2D6BFF" }, underline: true };
      if (j.days !== "" && j.days > 60) r.getCell(6).font = { bold: true, color: { argb: "FFB4232A" } };
    });
    ws.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3 + jobs.length, column: cols.length } };
    // summary by account manager
    const sm = wb.addWorksheet("By account manager");
    sm.columns = [{ width: 22 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 10 }];
    const sh = sm.getRow(1); ["Account manager", "Open jobs", "Clients", "In process", "Interviews", "Hires"].forEach((l, i) => { const c = sh.getCell(i + 1); c.value = l; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } }; c.border = box; });
    [...new Set(jobs.map((j) => j.am))].forEach((am, i) => { const js = jobs.filter((j) => j.am === am); const r = sm.getRow(2 + i);
      [am, js.length, new Set(js.map((j) => j.client)).size, js.reduce((t, j) => t + j.inProcess, 0), js.reduce((t, j) => t + j.interviews, 0), js.reduce((t, j) => t + j.hires, 0)].forEach((v, k) => { r.getCell(k + 1).value = v; r.getCell(k + 1).border = box; }); });
    const buf = await wb.xlsx.writeBuffer();
    const name = `Workable Open Jobs Report - ${mon.getMonth() + 1}-${mon.getDate()}-${mon.getFullYear()}.xlsx`;
    const url = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(`Open jobs report downloaded (${jobs.length} jobs)`, "var(--s-done)");
  } catch (e) { console.error(e); toast("Couldn't build the report. Check your connection.", "#E2632B"); }
  finally { btn?.classList.remove("is-loading"); if (btn) btn.disabled = false; }
}
document.addEventListener("click", (e) => { const b = e.target instanceof Element && e.target.closest("[data-ojr]"); if (b) downloadOpenJobs(b); });

/* ==========================================================================
   Candidate tech checks: results from the public /check/ page
   ========================================================================== */
const TC = { list: [], unsub: null, q: "", filter: "", error: "" };
const TC_CPU = { i3: "Core i3", i5: "Core i5", i7: "Core i7/i9", ultra: "Core Ultra", amd: "AMD Ryzen", other: "Other", unsure: "Not sure",
  "i5-14": "Core i5 14th gen+", "i7-14": "Core i7/i9 14th gen+", older: "Intel 13th gen or older" };   // last three: results from the first version
const TC_RAM = { "8": "8 GB or less", "16": "16 GB", "32": "32 GB+", unsure: "Not sure" };
const TC_RES = { pass: ["Meets requirements", "ok"], review: ["Needs review", "warn"], fail: ["Doesn't meet", "bad"] };
const tcLink = () => new URL("check/", location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "")).href;
// country name instead of a flag emoji (Windows shows flag emojis as two letters)
const tcCountry = (() => { let dn = null; try { dn = new Intl.DisplayNames(["en"], { type: "region" }); } catch {} return (cc) => (/^[A-Z]{2}$/.test(cc || "") ? (dn?.of(cc) || cc) : ""); })();
function startTech() {
  if (!TC.unsub) TC.unsub = state.store.watchTech((list, err) => { TC.list = list || []; TC.error = err ? (err.code || "error") : ""; if (currentTool === "techcheck") { renderTech(); wmRefresh(); } });
  renderTech();
  startWorldMap();
}
function renderTech() {
  const root = $("#tc-root"); if (!root) return;
  const q = lower(TC.q.trim());
  const rows = TC.list.filter((r) => (!TC.filter || r.result === TC.filter) && (!q || lower([r.name, r.position].join(" ")).includes(q)));
  const cnt = (k) => TC.list.filter((r) => r.result === k).length;
  // above 100 Mbps a browser test only proves "100+"; the measured value is in the tooltip
  const sp = (v, min) => `<span class="tc-sp${v < min ? " is-low" : ""}"${v >= 100 ? ` title="Measured ${esc(String(v))} Mbps (single-connection browser test)"` : ""}>${v >= 100 ? "100+" : esc(String(v))}</span>`;
  root.innerHTML = `
    <div class="hero tc-hero"><div><h1 class="hero-title">Tech checks</h1><p class="hero-sub">Candidates' internet speed and computer, against HRA's minimum requirements.</p></div>
      <div class="tc-actions"><button type="button" class="btn btn-ghost" data-tc-open>Open test page</button><button type="button" class="btn btn-primary" data-tc-copy>${svgI('<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', 16)}Copy candidate link</button></div></div>
    <div class="tc-reqs"><span><b>Internet</b> 10 Mbps down · 10 Mbps up</span><span><b>OS</b> Windows 10 or 11</span><span><b>CPU</b> Intel Core i5 or better</span><span><b>RAM</b> 16 GB+</span><span class="no"><b>No</b> Chromebooks</span></div>
    <div class="tc-bar">
      <div class="tc-tabs">${[["", "All", TC.list.length], ["pass", "Meets", cnt("pass")], ["review", "Review", cnt("review")], ["fail", "Doesn't meet", cnt("fail")]].map(([k, l, n]) => `<button type="button" class="tc-tab${TC.filter === k ? " is-on" : ""}" data-tc-filter="${k}">${l}<b>${n}</b></button>`).join("")}</div>
      <label class="search tc-search">${svgI('<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/>', 15)}<input id="tc-q" type="search" placeholder="Find a candidate" value="${esc(TC.q)}" autocomplete="off"/></label>
    </div>
    ${TC.error ? `<p class="form-error">Couldn't load results (${esc(TC.error)}). Make sure the latest firestore.rules is published.</p>` : ""}
    ${rows.length ? `<div class="tc-table-wrap"><table class="tc-table"><thead><tr><th>Candidate</th><th>Result</th><th>Down</th><th>Up</th><th>Ping</th><th>Computer</th><th>Tested</th>${state.isAdmin ? "<th></th>" : ""}</tr></thead><tbody>
      ${rows.map((r, i) => { const [rl, rc] = TC_RES[r.result] || ["—", ""]; return `<tr style="--i:${Math.min(i, 14)}">
        <td><strong>${esc(r.name)}</strong><small>${esc(r.position || "")}</small></td>
        <td><span class="tc-res is-${rc}">${esc(rl)}</span><small>${esc(r.band || "")}</small></td>
        <td>${sp(r.down, 10)}<small>Mbps</small></td><td>${sp(r.up, 10)}<small>Mbps</small></td><td>${esc(String(r.ping))}<small>ms</small></td>
        <td><span class="tc-dev${r.chromebook || r.win11 === "no" ? " is-low" : ""}">${esc(r.os || "")}</span><small>${esc(r.cpu === "other" && r.cpuOther ? r.cpuOther : TC_CPU[r.cpu] || r.cpu)} · ${esc(TC_RAM[r.ram] || r.ram)} <em>(self-reported)</em></small></td>
        <td>${esc(r.createdAt ? ago(r.createdAt) : "")}<small>${esc(tcCountry(r.loc))}</small></td>
        ${state.isAdmin ? `<td><button type="button" class="icon-btn tc-del" data-tc-del="${esc(r.id)}" title="Delete" aria-label="Delete result">${svgI('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', 15)}</button></td>` : ""}
      </tr>`; }).join("")}</tbody></table></div>`
    : `<div class="tc-empty"><h2>${TC.list.length ? "No matches" : "No results yet"}</h2><p>${TC.list.length ? "Try another search or filter." : "Send candidates the link. Their results appear here as soon as they finish the test."}</p></div>`}`;
}
document.addEventListener("click", async (e) => {
  const t = e.target; if (!(t instanceof Element) || !t.closest("#tc-root")) return;
  if (t.closest("[data-tc-copy]")) { try { await navigator.clipboard.writeText(tcLink()); toast("Candidate link copied", "var(--s-done)"); } catch { prompt("Copy this link:", tcLink()); } return; }
  if (t.closest("[data-tc-open]")) { window.open(tcLink(), "_blank", "noopener"); return; }
  const f = t.closest("[data-tc-filter]"); if (f) { TC.filter = f.dataset.tcFilter; renderTech(); return; }
  const d = t.closest("[data-tc-del]"); if (d && state.isAdmin) { if (!confirm("Delete this result?")) return; try { await state.store.deleteTech(d.dataset.tcDel); toast("Result deleted", "var(--s-done)"); } catch { toast("Couldn't delete.", "#E2632B"); } }
});
document.addEventListener("input", (e) => { if (e.target.id !== "tc-q") return; TC.q = e.target.value; const pos = e.target.selectionStart; renderTech(); const q = $("#tc-q"); q?.focus(); q?.setSelectionRange(pos, pos); });

/* ==========================================================================
   Global connectivity map (Tech checks page)
   Speed: Ookla Speedtest Global Index (via Wikipedia) · Power outages: World Bank Enterprise Surveys (via Our World in Data)
   Internet outages: IODA, Georgia Tech (last 30 days). Outside data is cached 24 h in this browser.
   ========================================================================== */
const WM = { collapsed: (() => { try { return localStorage.getItem("hra_wm_collapsed") === "1"; } catch { return false; } })(), layer: "speed", focus: "", built: false, data: { speed: null, power: null, net: null }, status: { power: "", net: "" }, vb: null, home: null };
const WM_FOCUS = [["MX", "Mexico"], ["US", "United States"], ["PH", "Philippines"]];
const WM_LAYERS = {
  speed: { label: "Internet speed", icon: '<path d="M3.5 18a8.5 8.5 0 1 1 17 0"/><path d="M12 18l4-6"/>',
    title: "Median fixed broadband download speed", src: () => `Ookla Speedtest Global Index, ${window.HRA_SPEED?.month || ""} (via Wikipedia, CC BY-SA). Fixed broadband; hover a country for mobile.`,
    bins: [[0, "Under 25 Mbps", "#F2B8B5"], [25, "25–50", "#FFE08A"], [50, "50–100", "#BFE6C9"], [100, "100–200", "#5CC28B"], [200, "200+", "#0E8A64"]] },
  power: { label: "Power outages", icon: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    title: "Power outages in a typical month (businesses)", src: () => "World Bank Enterprise Surveys, via Our World in Data. Latest survey year per country. The surveys cover mainly developing and emerging economies, so countries like the US, Canada and most of Western Europe have no data.",
    bins: [[0, "Under 0.5", "#FFF1E3"], [0.5, "0.5–2", "#FFD2A8"], [2, "2–5", "#FFA668"], [5, "5–15", "#F2713A"], [15, "15+", "#C2410C"]] },
  net: { label: "Internet outages", icon: '<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/><path d="M3 3l18 18"/>',
    title: "Internet outage events detected, last 30 days", src: () => "IODA, Georgia Tech Internet Outage Detection and Analysis. Live, last 30 days.",
    bins: [[0, "None detected", "#D9E6FF"], [1, "1–2", "#C9D6FF"], [3, "3–5", "#8FA8FF"], [6, "6–10", "#5470F0"], [11, "11+", "#2E3FB8"]] }
};
const wmBin = (layer, v) => { const b = WM_LAYERS[layer].bins; let i = 0; for (let k = 0; k < b.length; k++) if (v >= b[k][0]) i = k; return i; };
const wmCache = { get(k) { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v && Date.now() - v.at < 864e5 ? v : null; } catch { return null; } }, set(k, data) { try { localStorage.setItem(k, JSON.stringify({ at: Date.now(), data })); } catch {} } };
const wmScript = (src) => new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });

function startWorldMap() {
  if (window.HRA_WORLD && window.HRA_SPEED) { buildWorldMap(); return; }
  if (WM.loadingShapes) return; WM.loadingShapes = true;
  Promise.all([window.HRA_WORLD ? 0 : wmScript("assets/world-map.js"), window.HRA_SPEED ? 0 : wmScript("assets/world-speed.js")])
    .then(buildWorldMap).catch(() => { const el = $("#tc-map"); if (el) el.innerHTML = ""; });
}
function buildWorldMap() {
  const el = $("#tc-map"); if (!el || !window.HRA_WORLD) return;
  if (!WM.built) {
    const W = window.HRA_WORLD;
    WM.home = { x: 0, y: 0, w: W.w, h: W.h }; WM.vb = { ...WM.home };
    el.innerHTML = `<section class="wm${WM.collapsed ? " is-collapsed" : ""}">
      <div class="wm-head"><div><h2>Global connectivity</h2><p>Internet speed, power and internet reliability around the world.</p></div>
        <div class="wm-head-r"><div class="wm-seg" role="tablist"><span class="wm-pill" aria-hidden="true"></span>${Object.entries(WM_LAYERS).map(([k, L]) => `<button type="button" class="wm-btn${k === WM.layer ? " is-on" : ""}" data-wm-layer="${k}" role="tab"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.icon}</svg>${L.label}</button>`).join("")}</div>
        <button type="button" class="wm-toggle" data-wm-toggle aria-expanded="${!WM.collapsed}"><span>${WM.collapsed ? "Show" : "Hide"}</span><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></button></div></div>
      <div class="wm-collapse"><div class="wm-collapse-in">
      <div class="wm-focus" role="group" aria-label="Country">${[["", "All countries"], ...WM_FOCUS].map(([a2, n]) => `<button type="button" class="wm-chip${a2 === WM.focus ? " is-on" : ""}" data-wm-focus-btn="${a2}">${a2 ? `<b>${a2}</b>` : ""}${esc(n)}</button>`).join("")}</div>
      <div class="wm-body">
        <div class="wm-stage" id="wm-stage"><svg class="wm-svg" id="wm-svg" viewBox="0 0 ${W.w} ${W.h}" role="img" aria-label="World map"><g class="wm-g">${W.c.map((c) => `<path d="${c.d}" data-a2="${c.a2}" data-n="${esc(c.n)}" style="--d:${Math.round(((c.d.match(/M([\d.]+)/) || [0, 500])[1] / W.w) * 260)}ms"/>`).join("")}</g></svg>
          <div class="wm-zoom"><button type="button" data-wm-zoom="in" aria-label="Zoom in">+</button><button type="button" data-wm-zoom="out" aria-label="Zoom out">−</button><button type="button" data-wm-zoom="reset" aria-label="Reset view" title="Reset view"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button></div>
          <div class="wm-hint">Ctrl + scroll or pinch to zoom · drag to move</div>
          <div class="wm-tip" id="wm-tip" hidden></div><div class="wm-loading" id="wm-loading" hidden><span></span>Loading data…</div></div>
        <aside class="wm-side" id="wm-side"></aside>
      </div></div></div></section>`;
    WM.built = true;
    bindWmStage();
    requestAnimationFrame(() => { $(".wm")?.classList.add("is-in"); wmPill(true); });
  }
  wmRefresh();
}
function wmPill(instant) {
  const on = $(".wm-btn.is-on"), pill = $(".wm-pill"); if (!on || !pill) return;
  if (instant) pill.style.transition = "none";
  pill.style.width = on.offsetWidth + "px"; pill.style.transform = `translateX(${on.offsetLeft - 4}px)`;
  if (instant) { void pill.offsetWidth; pill.style.transition = ""; }
}
function wmSpeedData() {
  const S = window.HRA_SPEED; if (!S) return {};
  const out = {}; for (const [a2, v] of Object.entries(S.fixed)) out[a2] = { v, m: S.mobile[a2] };
  for (const [a2, m] of Object.entries(S.mobile)) if (!out[a2]) out[a2] = { v: null, m };
  return out;
}
async function wmLoad(layer) {
  if (layer === "speed") { WM.data.speed = WM.data.speed || wmSpeedData(); return; }
  if (WM.data[layer] || WM.status[layer] === "loading") return;
  const key = "hra_wm_" + layer + "_v1", hit = wmCache.get(key);
  if (hit) { WM.data[layer] = hit.data; return; }
  WM.status[layer] = "loading"; wmLoading(true);
  try {
    if (layer === "power") {
      const csv = await (await fetch("https://ourworldindata.org/grapher/power-outages-in-firms-per-month.csv?v=1&csvType=full&useColumnShortNames=true")).text();
      const lines = csv.trim().split(/\r?\n/), head = lines.shift().split(",");
      const iC = head.indexOf("code"), iY = head.indexOf("year"), iV = head.length - 1;
      const by3 = {};
      for (const ln of lines) { const c = ln.split(","); const code = c[iC], y = +c[iY], v = parseFloat(c[iV]); if (!/^[A-Z]{3}$/.test(code || "") || isNaN(v)) continue; if (!by3[code] || y > by3[code].y) by3[code] = { v, y }; }
      const out = {}; for (const ctry of window.HRA_WORLD.c) if (ctry.a3 && by3[ctry.a3]) out[ctry.a2] = { v: by3[ctry.a3].v, y: by3[ctry.a3].y };
      if (!Object.keys(out).length) throw new Error("No power data");
      WM.data.power = out; wmCache.set(key, out);
    } else {
      const until = Math.floor(Date.now() / 1000), from = until - 30 * 86400;
      const j = await (await fetch(`https://api.ioda.inetintel.cc.gatech.edu/v2/outages/summary?entityType=country&from=${from}&until=${until}&limit=300`)).json();
      const rows = Array.isArray(j) ? j : j.data || [];
      const out = {}; for (const r of rows) { const a2 = r?.entity?.code; if (/^[A-Z]{2}$/.test(a2 || "") && Number.isFinite(r.event_cnt)) out[a2] = { v: r.event_cnt }; }
      WM.data.net = out; wmCache.set(key, out);
    }
    WM.status[layer] = "";
  } catch (e) { console.warn("Map data unavailable:", layer, e); WM.status[layer] = "error"; }
  wmLoading(false);
}
function wmLoading(on) { const l = $("#wm-loading"); if (l) l.hidden = !on; }
const wmName = (a2) => tcCountry(a2) || a2;
function wmValue(layer, a2) {
  const d = (WM.data[layer] || {})[a2];
  if (layer === "speed") return d ? (d.v != null ? `${d.v.toFixed(1)} Mbps` : "No fixed data") : "No data";
  if (layer === "power") return d ? `${d.v.toFixed(1)} / month` : WM.status.power === "error" ? "Unavailable" : WM.data.power ? "Not surveyed" : "…";
  return d ? `${d.v} event${d.v === 1 ? "" : "s"}` : WM.status.net === "error" ? "Unavailable" : WM.data.net ? "None detected" : "…";
}
function wmProfile(a2) {
  const sp = (WM.data.speed || {})[a2], pw = (WM.data.power || {})[a2];
  const row = (icon, label, val, sub, tone) => `<div class="wm-metric${tone ? " is-" + tone : ""}"><span class="wm-mi"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></span><div><small>${label}</small><b>${esc(val)}</b>${sub ? `<em>${esc(sub)}</em>` : ""}</div></div>`;
  const speedTone = sp?.v == null ? "" : sp.v >= 100 ? "good" : sp.v >= 25 ? "ok" : "bad";
  const pTone = !pw ? "" : pw.v < 2 ? "good" : pw.v < 5 ? "ok" : "bad";
  const n = (WM.data.net || {})[a2]?.v || 0, nTone = !WM.data.net ? "" : n === 0 ? "good" : n <= 5 ? "ok" : "bad";
  return `<div class="wm-profile"><h3>${esc(wmName(a2))}</h3>
    ${row(WM_LAYERS.speed.icon, "Fixed broadband (median)", sp?.v != null ? `${sp.v.toFixed(1)} Mbps` : "No data", sp?.m != null ? `Mobile: ${sp.m.toFixed(1)} Mbps · ${window.HRA_SPEED?.month || ""}` : "", speedTone)}
    ${row(WM_LAYERS.power.icon, "Power outages (businesses)", pw ? `${pw.v.toFixed(1)} per month` : WM.status.power === "error" ? "Unavailable right now" : WM.data.power ? "Not surveyed" : "Loading…", pw ? `World Bank survey, ${pw.y}` : WM.data.power ? "Not covered by the World Bank survey" : "", pTone)}
    ${row(WM_LAYERS.net.icon, "Internet outages, last 30 days", WM.status.net === "error" ? "Unavailable right now" : WM.data.net ? (n ? `${n} event${n === 1 ? "" : "s"} detected` : "None detected") : "Loading…", "IODA, Georgia Tech", nTone)}
  </div>`;
}
async function wmRefresh() {
  if (!WM.built) return;
  const layer = WM.layer, focus = WM.focus;
  await wmLoad(layer);
  if (focus) { await Promise.all(["speed", "power", "net"].map(wmLoad)); }
  if (layer !== WM.layer || focus !== WM.focus) return;   // changed while loading
  const L = WM_LAYERS[layer], data = WM.data[layer] || {};
  $$(".wm-g path").forEach((p) => {
    const d = data[p.dataset.a2];
    let fill = "";
    if (d && d.v != null) fill = L.bins[wmBin(layer, d.v)][2];
    else if (layer === "net" && WM.data.net && p.dataset.a2) fill = L.bins[0][2];
    p.style.fill = fill;
    p.classList.toggle("is-sel", Boolean(focus) && p.dataset.a2 === focus);
  });
  $(".wm-g")?.classList.toggle("has-focus", Boolean(focus));
  const err = WM.status[layer] === "error";
  $("#wm-side").innerHTML = (focus ? wmProfile(focus) : `<h3>${esc(L.title)}</h3>
      <div class="wm-glance">${WM_FOCUS.map(([a2, n]) => `<button type="button" data-wm-focus-btn="${a2}" data-wm-focus="${a2}"><span>${esc(n)}</span><b>${esc(wmValue(layer, a2))}</b></button>`).join("")}</div>`)
    + `<div class="wm-legend">${L.bins.map((b) => `<span><i style="background:${b[2]}"></i>${esc(b[1])}</span>`).join("")}<span><i class="is-none"></i>No data</span></div>
    ${err ? `<p class="wm-err">Couldn't load this data right now. Try again later.</p>` : ""}
    <p class="wm-src">${esc(L.src())}</p>`;
}
/* ---- zoom & pan (viewBox), smooth and light ---- */
function wmSetVB(vb, animate) {
  const svg = $("#wm-svg"); if (!svg) return;
  const H = WM.home, w = Math.min(H.w, Math.max(H.w / 12, vb.w)), h = w * H.h / H.w;
  const x = Math.min(H.w - w * .25, Math.max(-w * .75, vb.x)), y = Math.min(H.h - h * .25, Math.max(-h * .75, vb.y));
  const to = { x, y, w, h };
  cancelAnimationFrame(WM.anim);
  if (!animate || reduceMotion) { WM.vb = to; svg.setAttribute("viewBox", `${x} ${y} ${w} ${h}`); return; }
  const from = { ...WM.vb }, t0 = performance.now(), dur = 420, ease = (t) => 1 - Math.pow(1 - t, 3);
  const step = (now) => { const t = Math.min(1, (now - t0) / dur), e = ease(t);
    WM.vb = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e };
    svg.setAttribute("viewBox", `${WM.vb.x} ${WM.vb.y} ${WM.vb.w} ${WM.vb.h}`); if (t < 1) WM.anim = requestAnimationFrame(step); };
  WM.anim = requestAnimationFrame(step);
}
function wmZoomAt(f, cx, cy, animate) { const v = WM.vb, w = v.w / f, h = v.h / f; wmSetVB({ x: cx - (cx - v.x) / f, y: cy - (cy - v.y) / f, w, h }, animate); }
function wmFocusBox(a2) {
  // predefined areas (contiguous US, Mexico, the whole Philippines); other countries: their main landmass
  const fb = window.HRA_WORLD?.focus?.[a2];
  if (fb) { const H = WM.home, pad = 0.12, bw = (fb[2] - fb[0]) * (1 + pad * 2), bh = (fb[3] - fb[1]) * (1 + pad * 2), w = Math.max(bw, bh * H.w / H.h), h = w * H.h / H.w; return { x: (fb[0] + fb[2]) / 2 - w / 2, y: (fb[1] + fb[3]) / 2 - h / 2, w, h }; }
  const p = $(`.wm-g path[data-a2="${a2}"]`); if (!p) return null;
  const subs = p.getAttribute("d").split("M").filter(Boolean).map((sp) => { const n = sp.match(/-?[\d.]+/g).map(Number); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (let i = 0; i < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } return { x0, y0, x1, y1, a: (x1 - x0) * (y1 - y0) }; });
  const big = subs.reduce((a, b) => (b.a > a.a ? b : a)), diag = Math.hypot(big.x1 - big.x0, big.y1 - big.y0), cx = (big.x0 + big.x1) / 2, cy = (big.y0 + big.y1) / 2;
  const near = subs.filter((s) => Math.hypot((s.x0 + s.x1) / 2 - cx, (s.y0 + s.y1) / 2 - cy) <= diag * 0.9);
  const b = near.reduce((m, s) => ({ x0: Math.min(m.x0, s.x0), y0: Math.min(m.y0, s.y0), x1: Math.max(m.x1, s.x1), y1: Math.max(m.y1, s.y1) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
  const H = WM.home, pad = 0.35, bw = (b.x1 - b.x0) * (1 + pad * 2), bh = (b.y1 - b.y0) * (1 + pad * 2);
  const w = Math.max(bw, bh * H.w / H.h, H.w / 10), h = w * H.h / H.w;
  return { x: (b.x0 + b.x1) / 2 - w / 2, y: (b.y0 + b.y1) / 2 - h / 2, w, h };
}
function wmSvgPoint(e) { const svg = $("#wm-svg"), r = svg.getBoundingClientRect(), v = WM.vb; return [v.x + (e.clientX - r.left) / r.width * v.w, v.y + (e.clientY - r.top) / r.height * v.h]; }
function bindWmStage() {
  const stage = $("#wm-stage"); if (!stage) return;
  let drag = null;
  stage.addEventListener("wheel", (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const [x, y] = wmSvgPoint(e); wmZoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, x, y, false); }, { passive: false });
  stage.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; drag = { sx: e.clientX, sy: e.clientY, vb: { ...WM.vb }, moved: false }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => { if (!drag) return; const r = stage.getBoundingClientRect(), dx = (e.clientX - drag.sx) / r.width * drag.vb.w, dy = (e.clientY - drag.sy) / r.height * drag.vb.h; if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) { drag.moved = true; stage.classList.add("is-drag"); } wmSetVB({ ...drag.vb, x: drag.vb.x - dx, y: drag.vb.y - dy }, false); });
  const end = () => { drag = null; stage.classList.remove("is-drag"); };
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
}
function wmSetFocus(a2) {
  WM.focus = a2;
  $$(".wm-chip").forEach((c) => c.classList.toggle("is-on", c.dataset.wmFocusBtn === a2));
  wmSetVB(a2 ? wmFocusBox(a2) || WM.home : WM.home, true);
  wmRefresh();
}
function wmTip(e, p) {
  const tip = $("#wm-tip"), stage = $("#wm-stage"); if (!tip || !stage) return;
  if (!p || stage.classList.contains("is-drag")) { tip.hidden = true; return; }
  const layer = WM.layer, a2 = p.dataset.a2, d = (WM.data[layer] || {})[a2];
  const name = tcCountry(a2) || p.dataset.n;
  let val = layer === "speed" ? "No data in the Speedtest Global Index" : layer === "power" ? "Not covered by the World Bank survey" : "No data";
  if (layer === "speed" && d) val = `${d.v != null ? `Fixed ${d.v.toFixed(1)} Mbps` : "Fixed: no data"}${d.m != null ? ` · Mobile ${d.m.toFixed(1)} Mbps` : ""}`;
  if (layer === "power" && d) val = `${d.v.toFixed(1)} outages / month · survey ${d.y}`;
  if (layer === "net") val = d ? `${d.v} outage event${d.v === 1 ? "" : "s"} · last 30 days` : WM.data.net && a2 ? "No outages detected · last 30 days" : "No data";
  tip.innerHTML = `<strong>${esc(name)}</strong><span>${esc(val)}</span>`; tip.hidden = false;
  const r = stage.getBoundingClientRect();
  const x = Math.min(e.clientX - r.left + 14, r.width - tip.offsetWidth - 8), y = Math.max(8, e.clientY - r.top - tip.offsetHeight - 12);
  tip.style.transform = `translate(${x}px, ${y}px)`;
}
document.addEventListener("pointermove", (e) => { const p = e.target instanceof Element && e.target.closest(".wm-g path"); if (p || !$("#wm-tip")?.hidden) wmTip(e, p || null); });
document.addEventListener("click", (e) => {
  const t = e.target; if (!(t instanceof Element) || !t.closest("#tc-map")) return;
  if (t.closest("[data-wm-toggle]")) {
    WM.collapsed = !WM.collapsed; try { localStorage.setItem("hra_wm_collapsed", WM.collapsed ? "1" : "0"); } catch {}
    const sec = $(".wm"), tg = t.closest("[data-wm-toggle]");
    sec.classList.toggle("is-collapsed", WM.collapsed); tg.setAttribute("aria-expanded", String(!WM.collapsed)); $("span", tg).textContent = WM.collapsed ? "Show" : "Hide";
    if (!WM.collapsed) setTimeout(() => wmPill(true), 30);
    return;
  }
  const b = t.closest("[data-wm-layer]");
  if (b) { WM.layer = b.dataset.wmLayer; $$(".wm-btn").forEach((x) => x.classList.toggle("is-on", x === b)); wmPill(); const svg = $("#wm-svg"); svg?.classList.remove("is-sweep"); void svg?.offsetWidth; svg?.classList.add("is-sweep"); wmRefresh(); return; }
  const f = t.closest("[data-wm-focus-btn]"); if (f) { wmSetFocus(f.dataset.wmFocusBtn); return; }
  const z = t.closest("[data-wm-zoom]"); if (z) { const v = WM.vb, cx = v.x + v.w / 2, cy = v.y + v.h / 2; if (z.dataset.wmZoom === "reset") wmSetVB(WM.focus ? wmFocusBox(WM.focus) : WM.home, true); else wmZoomAt(z.dataset.wmZoom === "in" ? 1.5 : 1 / 1.5, cx, cy, true); }
});
document.addEventListener("pointerover", (e) => { const li = e.target instanceof Element && e.target.closest("[data-wm-focus]"); $$(".wm-g path.is-focus").forEach((p) => p.classList.remove("is-focus")); if (li) $$(`.wm-g path[data-a2="${li.dataset.wmFocus}"]`).forEach((p) => p.classList.add("is-focus")); });
addEventListener("resize", () => wmPill(true));
