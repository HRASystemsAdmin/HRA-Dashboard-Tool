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

const STATUS = {
  open:        { label: "Submitted",   n: 0, color: "var(--s-open)" },
  in_progress: { label: "In progress", n: 1, color: "var(--s-progress)" },
  completed:   { label: "Completed",   n: 2, color: "var(--s-done)" }
};

const ICONS = {
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
  const db = fsMod.getFirestore(app);
  const col = fsMod.collection(db, "tickets");

  return {
    demo: false,
    init(cb) {
      authMod.onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: lower(u.email), name: u.displayName || nameFromEmail(u.email) } : null));
    },
    signIn: (email, pw) => authMod.signInWithEmailAndPassword(auth, email, pw),
    signOut: () => authMod.signOut(auth),
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
    async getPrefs(uid) {
      const snap = await fsMod.getDoc(fsMod.doc(db, "user_prefs", uid));
      return snap.exists() ? snap.data() : {};
    },
    setPrefs(uid, data) {
      return fsMod.setDoc(fsMod.doc(db, "user_prefs", uid), data, { merge: true });
    },
    watchPipeline(cb) {
      let clients = [], meta = null;
      const u1 = fsMod.onSnapshot(fsMod.collection(db, "workable_clients"),
        (snap) => { clients = snap.docs.map((d) => ({ id: d.id, ...d.data() })); cb(clients, meta); },
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
  state.tab = "mine";

  $("#user-name").textContent = state.user.name;
  $("#user-role").textContent = isAdmin ? "Admin" : "Team member";
  $("#user-avatar").textContent = initials(state.user.name);
  buildBoards();
  const h = new Date().getHours();
  $("#greeting").textContent = `${h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, ${state.user.name.split(" ")[0]}`;

  setTab("mine", true);
  stopPipeline();
  renderTypes();
  renderAll();
  showView("view-app");
  $('[data-tool="insights"]').hidden = !isAdmin;
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
        toast(`New request from ${t.createdBy?.name || "a colleague"}`, "var(--s-open)");
        flashIds.add(t.id);
      } else if (prev && prev !== t.status && t.createdBy?.uid === state.user.uid && t.assignee?.email !== state.user.email) {
        toast(`${ref(t.id)} is now ${STATUS[t.status].label.toLowerCase()}`, STATUS[t.status].color);
        flashIds.add(t.id);
      }
    }
  }
  state.known = new Map(list.map((t) => [t.id, t.status]));
  state.tickets = list;
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

function renderTypes() {
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
  $("#type-tiles").classList.toggle("is-stacked", tiles.length >= 3);
  $("#type-tiles").innerHTML = tiles.map((t) => `
    <button class="type-tile" data-new="${esc(t.open)}">
      <span class="type-icon">${ICONS[t.icon] || ICONS.spark}</span>
      <span>
        <span class="type-name" style="display:block">${esc(t.label)}</span>
        <span class="type-blurb" style="display:block">${esc(t.blurb)}</span>
      </span>
      <span class="type-go" aria-hidden="true">${ICONS.plus}</span>
    </button>`).join("");
}

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
      : empty("No open requests", "Choose a request type above to send your first one.");
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
    boardState[b.id] = { filter: "active", search: "" };
    ind.insertAdjacentHTML("beforebegin", `<button class="tab" data-tab="${b.id}" data-board-tab><span class="tab-long">${esc(b.label)}</span><span class="tab-short">${esc(b.short)}</span> <span class="tab-count is-zero" id="${b.id}-count">0</span></button>`);
    $(".main").insertAdjacentHTML("beforeend", boardPanelHTML(b));
    $(".main").lastElementChild.dataset.board = b.id;
  }
}

function renderBoard(b) {
  const st = boardState[b.id];
  const panel = $(`.panel[data-panel="${b.id}"]`);
  const pool = state.tickets.filter(b.match);
  const counts = { open: 0, in_progress: 0, completed: 0 };
  pool.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
  $$("[data-count]", panel).forEach((el) => countTo(el, counts[el.dataset.count]));

  const qc = $("#" + b.id + "-count");
  if (qc.textContent !== String(counts.open)) { qc.classList.remove("bump"); void qc.offsetWidth; qc.classList.add("bump"); }
  qc.textContent = counts.open;
  qc.classList.toggle("is-zero", counts.open === 0);

  const list = $("#" + b.id + "-list");
  if (!state.loaded) { list.innerHTML = skeleton(); return; }
  const s = lower(st.search);
  const items = pool
    .filter((t) => matchFilter(t, st.filter))
    .filter((t) => !s || lower([ref(t.id), t.title, t.createdBy?.name, t.createdBy?.email, JSON.stringify(t.fields || {})].join(" ")).includes(s))
    .sort((a, b2) => {
      if (a.status !== "completed" && b2.status !== "completed") {
        const p = (PRI[a.fields?.priority] ?? 2) - (PRI[b2.fields?.priority] ?? 2);
        if (p) return p;
      }
      return toDate(b2.createdAt) - toDate(a.createdAt);
    });
  list.innerHTML = items.length
    ? items.map((t, i) => row(t, i, true)).join("")
    : s ? empty("No matches", "Try a name, a reference like HRA-1A2B3C, or fewer words.")
        : empty(b.id === "queue" ? "The queue is clear" : `No ${b.label.toLowerCase()} requests`, "New requests appear here the moment they're sent.");
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
  instant ? done() : setTimeout(done, 380);
  if (el.id === "drawer") state.openId = null;
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
  if (key.startsWith("group:")) { openGroup(key.slice(6), dir); return; }
  const type = CFG.requestTypes[key];
  if (!canUseType(type)) return;
  pending.length = 0;
  const back = type.group && GROUPS[type.group]
    ? `<button type="button" class="back-link" data-new="group:${esc(type.group)}" data-dir="back"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>${esc(GROUPS[type.group].label)}</button>`
    : "";
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
      completed:   `<button class="btn btn-ghost" data-set="in_progress">Reopen</button><button class="btn btn-danger" data-delete>${ICONS.trash.replace(/22/g, "17")}Delete request</button>`
    }[t.status];
    admin = `
      <div class="admin-box">
        <label class="field"><span class="field-label">Note to ${esc(t.createdBy?.name?.split(" ")[0] || "requester")}<span class="opt">optional, sent with the update</span></span>
          <textarea id="admin-note" rows="2" placeholder="e.g. Added to both queues, calls start routing tomorrow"></textarea>
        </label>
        <div class="admin-actions">${actions}</div>
      </div>`;
  }

  if (!state.isAdmin && t.status === "completed" && t.createdBy?.uid === state.user.uid) {
    admin = `
      <div class="owner-actions">
        <p>This request is complete. Delete it to keep your list tidy.</p>
        <button class="btn btn-danger" data-delete>${ICONS.trash.replace(/22/g, "17")}Delete request</button>
      </div>`;
  }

  $("#drawer-body").innerHTML = `
    <div class="drawer-top">
      <span class="pill" data-status="${t.status}">${STATUS[t.status].label}</span>
      <span class="t-ref">${ref(t.id)}</span>
    </div>
    <h2 class="drawer-title" id="drawer-title">${esc(t.title)}</h2>
    ${track(t.status)}
    <dl class="details">
      <div class="detail"><dt>Requested by</dt><dd>${esc(t.createdBy?.name)}${state.isAdmin ? ` <span style="color:var(--muted)">${esc(t.createdBy?.email)}</span>` : ""}</dd></div>
      <div class="detail"><dt>Type</dt><dd>${esc(typeLabel(t.type))}</dd></div>
      ${rows}
    </dl>
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
    if (status === "completed") setTimeout(() => closeOverlay($("#drawer")), 650);
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
    const tool = t.closest("[data-tool]"); if (tool) { setTool(tool.dataset.tool); return; }
    const ctCat = t.closest("[data-ct-cat]"); if (ctCat) { CT.cat = ctCat.dataset.ctCat; renderContactList(); return; }
    const ctTry = t.closest("[data-ct-try]"); if (ctTry) { CT.q = ctTry.dataset.ctTry; CT.cat = ""; $("#ct-q").value = CT.q; renderContactList(); $("#ct-q").focus(); return; }
    const ctOpen = t.closest("[data-ct-open]"); if (ctOpen) {
      const card = ctOpen.closest(".ct-card"), idx = Number(ctOpen.dataset.ctOpen), open = !card.classList.contains("is-open");
      $$(".ct-card.is-open").forEach((c) => { if (c !== card) { c.classList.remove("is-open"); $(".ct-more", c)?.setAttribute("aria-expanded", "false"); } });
      card.classList.toggle("is-open", open); ctOpen.setAttribute("aria-expanded", String(open)); CT.open = open ? idx : null; return;
    }
    const ctCopy = t.closest("[data-ct-copy]"); if (ctCopy) { copyText(ctCopy.dataset.ctCopy).then((ok) => toast(ok ? `Copied ${ctCopy.dataset.ctCopy}` : "Couldn't copy the email", ok ? "var(--s-done)" : "#E2632B")); return; }
    const popBtn = t.closest("[data-pop]"); if (popBtn) { PL.pop = PL.pop === popBtn.dataset.pop ? null : popBtn.dataset.pop; renderPipeline(); if (PL.pop === "am") $(".am-option.is-selected")?.focus(); return; }
    const colT = t.closest("[data-col-toggle]"); if (colT) { const c = PL.cols.find((x) => x.key === colT.dataset.colToggle); if (c) { c.on = !c.on; saveColPrefs(); renderSheet(); $(`[data-col-toggle="${c.key}"]`)?.focus(); } return; }
    if (t.closest("[data-cols-reset]")) { PL.cols = defaultCols(); saveColPrefs(); renderSheet(); toast("Columns reset to the spreadsheet layout", "var(--s-progress)"); return; }
    const amb = t.closest("[data-am]"); if (amb) { PL.pop = null; PL.animate = true; PL.am = amb.dataset.am; PL.client = null; PL.filter.clear(); PL.search = ""; renderPipeline(); $('[data-pop="am"]')?.focus(); return; }
    if (t.closest(".pop")) return;
    if (PL.pop) { PL.pop = null; renderPipeline(); }
    const ct = t.closest("[data-client]"); if (ct) { PL.animate = true; PL.client = ct.dataset.client; PL.filter.clear(); PL.search = ""; renderPipeline(); return; }
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

  document.addEventListener("submit", (e) => {
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
    const openDd = $(".dd.is-open");
    if (openDd && e.key === "Escape") { closeDropdowns(); $(".dd-trigger", openDd)?.focus(); e.stopPropagation(); return; }
    if (openDd && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      const opts = $$(".dd-opt", openDd); const i = opts.indexOf(document.activeElement);
      opts[(i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length]?.focus(); e.preventDefault(); return;
    }
    // Pipeline popovers: Escape closes; arrows move through the account manager list and columns
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

function moveRailGlow() {
  const active = $("#rail .rail-item.is-active"), glow = $("#rail .rail-glow");
  if (!active || !glow) return;
  const horizontal = getComputedStyle($("#rail")).flexDirection === "row";
  glow.style.transform = horizontal ? `translateX(${active.offsetLeft}px)` : `translateY(${active.offsetTop}px)`;
  glow.style.width = active.offsetWidth + "px";
  glow.style.height = active.offsetHeight + "px";
}

function setTool(id, silent) {
  if (!$(`[data-tool-panel="${id}"]`)) id = "requests";
  if (id === "insights" && !state.isAdmin) id = "requests";
  const changed = id !== currentTool;
  currentTool = id;
  try { localStorage.setItem(TOOL_KEY, id); } catch {}
  $$("#rail .rail-item").forEach((b) => { b.classList.toggle("is-active", b.dataset.tool === id); b.setAttribute("aria-current", b.dataset.tool === id ? "page" : "false"); });
  $$("[data-tool-panel]").forEach((m) => {
    const on = m.dataset.toolPanel === id;
    m.hidden = !on;
    if (on && changed && !reduceMotion) { m.classList.remove("tool-in"); void m.offsetWidth; m.classList.add("tool-in"); }
  });
  $(".topbar").classList.toggle("is-tool-pipeline", id !== "requests");
  moveRailGlow();
  if (id === "pipeline") startPipeline();
  if (id === "insights") { IN.animate = true; startInsights(); }
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
  { key: "name",        label: "Candidate Submitted",             w: 14,   xw: 24, locked: true },
  { key: "role",        label: "Role Submitted",                  w: 12.5, xw: 30 },
  { key: "submitted",   label: "Date Submitted",                  w: 8.5,  xw: 14, date: true },
  { key: "interview",   label: "Wants to Interview (Y/N), When?", w: 13.5, xw: 34, wrap: true },
  { key: "hired",       label: "Hired (Y/N)",                     w: 9,    xw: 22, wrap: true },
  { key: "roleHired",   label: "Role hired for",                  w: 10,   xw: 24 },
  { key: "startDate",   label: "Start Date",                      w: 8,    xw: 14, date: true },
  { key: "recruiter",   label: "Recruiter",                       w: 8,    xw: 16 },
  { key: "notes",       label: "Notes",                           w: 16.5, xw: 60, wrap: true },
  { key: "stage",       label: "Workable stage",                  w: 10,   xw: 22, extra: true },
  { key: "statusLabel", label: "Status",                          w: 9,    xw: 18, extra: true },
  { key: "daysOpen",    label: "Days since submitted",            w: 7,    xw: 12, extra: true, num: true }
];
const COL_BY_KEY = Object.fromEntries(PL_COLS.map((c) => [c.key, c]));
const defaultCols = () => PL_COLS.map((c) => ({ key: c.key, on: !c.extra }));

function cellValue(r, key) {
  if (key === "statusLabel") return PSTATUS[r.status]?.short || "";
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
const PL = { weekSel: [0, 1], weeksAll: false, collapsed: new Set(), pop: null, cols: null, animate: true, started: false, clients: [], meta: null, ams: [], am: null, client: null, filter: new Set(), search: "", newest: false, unsub: null, timer: null };

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
  PL.store = state.store.demo ? "demo" : "firebase";
  renderPipelineLoading();
  if (PL.store === "demo") {
    const synced = new Date(Date.now() - 11 * 60e3).toISOString();
    setTimeout(() => onPipelineData(demoClients().map((c) => ({ ...c, updatedAt: synced })), { ok: true, lastSync: synced, demo: true }), 450);
  } else {
    PL.unsub = state.store.watchPipeline(onPipelineData);
  }
  clearInterval(PL.timer);
  PL.timer = setInterval(renderSync, 30e3);
}

function stopPipeline() {
  Object.assign(IN, { am: "", client: "", recruiter: "", showAll: false, animate: true, data: null, pop: null, removed: defaultRemoved() });
  insightsLayoutLoaded = false;
  PL.unsub?.(); PL.unsub = null; clearInterval(PL.timer);
  Object.assign(PL, { pop: null, cols: null, started: false, clients: [], meta: null, ams: [], am: null, client: null, filter: new Set(), search: "" });
}

function onPipelineData(clients, meta) {
  if (!PL.clients.length) PL.animate = true;
  PL.clients = clients || [];
  PL.meta = meta || null;
  PL.ams = buildAms();
  if (!PL.am || !PL.ams.some((a) => a.name === PL.am)) PL.am = (PL.ams.find((a) => a.isMe) || PL.ams[0])?.name || null;
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
  const times = [PL.meta?.lastSync, clientDoc(PL.client)?.updatedAt].filter(Boolean).map((t) => new Date(t).getTime());
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
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
  if (!m || !m.lastSync) { el.classList.add("is-wait"); $("span", el).textContent = PL.store === "demo" ? "Demo data" : "Waiting for first sync"; return; }
  if (m.ok === false) { el.classList.add("is-bad"); $("span", el).textContent = `Last sync failed, showing ${ago(m.lastSync)} data`; el.title = m.message || ""; return; }
  const mins = (Date.now() - new Date(m.lastSync)) / 60e3;
  if (mins > (WK.syncEveryMinutes || 30) * 6) el.classList.add("is-wait");
  $("span", el).textContent = `${m.demo ? "Demo data, synced" : "Synced"} ${ago(m.lastSync)}`;
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
  if (!PL.client || !list.some((c) => sameName(c.name, PL.client))) PL.client = list[0]?.name || null;
  $("#pl-clients").innerHTML = list.map((c) => {
    const n = c.candidates?.length || 0;
    const live = (c.candidates || []).filter((r) => r.status === "in_process").length;
    return `<button type="button" role="tab" class="sheet-tab${sameName(c.name, PL.client) ? " is-active" : ""}" data-client="${esc(c.name)}" aria-selected="${sameName(c.name, PL.client)}">
      <span class="sheet-tab-name">${esc(c.name)}</span>
      <span class="sheet-tab-count" title="${live} in process of ${n} submitted">${live ? `<i></i>${live}` : n}</span>
    </button>`;
  }).join("");
  $("#pl-download").disabled = !list.length;
  renderSheet();
}

function renderSheet() {
  const el = $("#pl-sheet");
  const c = amClients().find((x) => sameName(x.name, PL.client));
  if (!c) { el.innerHTML = `<div class="sheet-card">${emptyBlock("No clients for this account manager", "Add client names to this account manager in config.js.")}</div>`; return; }
  const extra = (WK.clients || {})[c.name] || {};
  const rows = c.candidates || [];
  const counts = Object.fromEntries(Object.keys(PSTATUS).map((k) => [k, rows.filter((r) => r.status === k).length]));
  const s = lower(PL.search);
  let shown = rows.filter((r) => (!PL.filter.size || PL.filter.has(r.status)) && (!s || lower([r.name, r.role, r.recruiter, r.notes, r.interview, r.hired].join(" ")).includes(s)));
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
        </div>
        <dl class="sheet-stats">
          <div><dt>Submitted</dt><dd>${rows.length}</dd></div>
          <div><dt>Interviews</dt><dd>${interviewed}</dd></div>
          <div><dt>In process</dt><dd>${counts.in_process}</dd></div>
          <div class="is-hired"><dt>Hired</dt><dd>${counts.hired}</dd></div>
        </dl>
      </header>

      ${collapseHead("candidates", "Submitted candidates", `${shown.length === rows.length ? rows.length : `${shown.length} of ${rows.length}`}`)}
      <div class="collapse${PL.collapsed.has("candidates") ? " is-closed" : " is-settled"}" data-collapse-body="candidates"><div class="collapse-inner">
      <div class="sheet-tools">
        <div class="legend" role="group" aria-label="Filter by status">
          ${Object.entries(PSTATUS).map(([k, v]) => `
            <button type="button" class="legend-item${PL.filter.has(k) ? " is-on" : ""}" data-status-filter="${k}" aria-pressed="${PL.filter.has(k)}" style="--sw:#${v.fill};--bar:${v.bar}" title="${esc(v.label)}">
              <span class="legend-sw"></span><span class="legend-label">${esc(v.short)}</span><span class="legend-n">${counts[k]}</span>
            </button>`).join("")}
        </div>
        <div class="sheet-tools-right">
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

      ${c.empty || !rows.length
        ? emptyBlock("No submitted candidates yet", c.empty ? "Workable has no jobs matched to this client yet. Check the client name or the job's department in Workable." : "Candidates appear here once they reach a submitted stage in Workable.")
        : `<div class="pl-table-wrap"><table class="pl-table${PL.animate ? " is-enter" : ""}" style="min-width:${Math.max(600, cols.length * 92)}px">
            <colgroup>${cols.map((col) => `<col style="width:${(col.w / totalW * 100).toFixed(2)}%">`).join("")}</colgroup>
            <thead><tr>${cols.map((col) => `<th class="col-${col.key}" scope="col">${esc(col.label)}</th>`).join("")}</tr></thead>
            <tbody>${shown.length ? shown.map((r, i) => `
              <tr class="pl-row" data-status="${r.status}" style="--sw:#${PSTATUS[r.status]?.fill || "FFFFFF"};--bar:${PSTATUS[r.status]?.bar || "#A3B1C6"};--i:${Math.min(i, 18)}" title="${esc(PSTATUS[r.status]?.label || "")}">
                ${cols.map((col, ci) => cellHTML(r, col, ci === 0)).join("")}
              </tr>`).join("") : `<tr><td colspan="${cols.length}" class="pl-none">No candidates match. Clear the filters or search.</td></tr>`}
            </tbody></table></div>`}
      </div></div>
    </div>

    ${sourcingHTML(c)}`;
  PL.animate = false;
}

function cellHTML(r, col, first) {
  let v = cellValue(r, col.key);
  if (col.date && /^\d{4}-/.test(v || "")) v = fmtDay(v);
  if (first) {
    const inner = col.key === "name" && r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(v)}</a>` : esc(v);
    return `<th scope="row" class="col-${col.key}">${inner}</th>`;
  }
  if (col.key === "notes") return v
    ? `<td class="col-notes"><button type="button" class="note-btn" data-note="${esc(r.id)}" aria-label="Read the full notes for ${esc(r.name)}"><span class="notes">${esc(v)}</span><span class="note-open" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-8 8"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg></span></button></td>`
    : `<td class="col-notes"></td>`;
  if (col.key === "statusLabel") return `<td class="col-statusLabel"><span class="st-dot" style="--bar:${PSTATUS[r.status]?.bar}"></span>${esc(v)}</td>`;
  return `<td class="col-${col.key}${col.num ? " num" : ""}">${esc(v)}</td>`;
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
  const c = clientDoc(PL.client);
  const r = (c?.candidates || []).find((x) => String(x.id) === String(id));
  if (!r) return;
  const st = PSTATUS[r.status] || PSTATUS.in_process;
  const fields = [["Date submitted", fmtDay(r.submitted)], ["Wants to interview", r.interview], ["Hired", r.hired], ["Role hired for", r.roleHired],
    ["Start date", /^\d{4}-/.test(r.startDate || "") ? fmtDay(r.startDate) : r.startDate], ["Recruiter", r.recruiter], ["Workable stage", r.stage]].filter(([, v]) => v);
  $("#note-body").innerHTML = `
    <div class="note-head">
      <span class="note-status" style="--sw:#${st.fill};--bar:${st.bar}"><i></i>${esc(st.short)}</span>
      <h2 id="note-title">${esc(r.name)}</h2>
      <p class="note-sub"><span>${esc(r.role)}</span><span class="note-sep" aria-hidden="true"></span><span>${esc(c.name)}</span></p>
    </div>
    <div class="note-text">${esc(r.notes || "No notes yet.")}</div>
    <dl class="note-meta">${fields.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
    ${r.link ? `<a class="btn btn-ghost note-link" href="${esc(r.link)}" target="_blank" rel="noopener">Open in Workable</a>` : ""}`;
  openOverlay($("#note-modal"));
  setTimeout(() => $("#note-modal .sheet-close")?.focus(), 60);
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
    if (open) setTimeout(() => { if (!PL.collapsed.has(key)) body.classList.add("is-settled"); }, reduceMotion ? 0 : 480);
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

    for (const c of clients) {
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
      t.value = `${c.name}${loc ? ` (${loc})` : ""}${hrs ? ` ${hrs}` : ""}`;
      t.font = { bold: true, size: 16, name: "Arial" }; t.fill = fill("FFF2CC");
      ws.getRow(1).height = 26;

      const head = ws.getRow(2);
      xcols.forEach((col, i) => { const cell = head.getCell(i + 1); cell.value = col.label; cell.font = { bold: true, name: "Arial" }; cell.fill = fill("CFE2F3"); cell.border = box; cell.alignment = { vertical: "middle", wrapText: true }; });
      head.height = 32;

      let r = 3;
      for (const row of (c.candidates || []).slice().sort((a, b) => (a.submitted || "").localeCompare(b.submitted || ""))) {
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
    const fname = `Weekly Hiring Update - ${am.name} - ${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear()}.xlsx`;
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
    { name: "Jen Omohundro",    email: MEMBERS[0] || "employee@demo.local", clients: ["Bright Spark Electric", "Evergreen Climate", "Copperline Plumbing"] },
    { name: "Katlin O’Steen",  email: "katlin.osteen@demo.local",    clients: ["Lakeside Home Builders", "Redwood Roofing"] },
    { name: "Megan Whitmyer",   email: "megan.whitmyer@demo.local",   clients: ["Blue Ridge HVAC", "Keystone Electric"] }
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
        status, link: ""
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
function startInsights() { startPipeline(); if (!insightsLayoutLoaded) { insightsLayoutLoaded = true; loadInsightsLayout(); } renderInsights(); }

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
        <span class="sync-chip in-asof"><i></i><span>${PL.meta?.demo ? "Demo data" : "Data"} as of ${esc(ago(freshness() || new Date().toISOString()))}</span></span>
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
const catOf = (id) => DIR.categories.find((c) => c.id === id) || { id, label: id, icon: "help" };

function contactScore(t, words) {
  if (!words.length) return 1;
  let score = 0;
  const title = lower(t.topic), desc = lower(t.description), keys = (t.keywords || []).map(lower), who = lower([t.contact?.name, t.contact?.role, t.backup?.name].join(" "));
  for (const w of words) {
    let hit = 0;
    if (title.includes(w)) hit = 6;
    else if (keys.some((k) => k.includes(w) || (w.length > 3 && w.includes(k)))) hit = 5;
    else if (desc.includes(w)) hit = 3;
    else if (who.includes(w)) hit = 2;
    if (!hit) return 0;                 // every word must match something
    score += hit;
  }
  return score;
}
function hl(text, words) {
  let out = esc(text);
  for (const w of words.filter((x) => x.length > 1)) {
    out = out.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![^<]*>)`, "gi"), "<mark>$1</mark>");
  }
  return out;
}
const mailHref = (t, person) => {
  const first = (person.name || "").split(" ")[0];
  const body = `Hi${first && !/support|team|admin|manager|coordinator|payroll|systems|your/i.test(person.name) ? " " + first : ""},\n\nI need help with: ${t.topic}\n\n` +
    ((t.tips || []).length ? (t.tips.map((x) => `${x}:\n`).join("\n") + "\n") : "") + `Thank you,\n${state.user?.name || ""}`;
  return `mailto:${encodeURIComponent(person.email).replace(/%40/g, "@")}?subject=${encodeURIComponent("Help needed: " + t.topic)}&body=${encodeURIComponent(body)}`;
};
const teamsHref = (t, person) => `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(person.email)}&message=${encodeURIComponent(`Hi! I need help with: ${t.topic}`)}`;

function renderContacts() {
  const root = $("#contacts-root");
  if (!root || currentTool !== "contacts") return;
  if (!CT.built) {
    CT.built = true;
    const hasExamples = DIR.topics.some((t) => t.example);
    root.innerHTML = `
      <div class="ct-hero">
        <h1 class="hero-title">Who to contact</h1>
        <p class="hero-sub">Tell us what you need help with. We'll show you exactly who to reach and the fastest way to do it.</p>
        <label class="ct-search">
          <span class="ct-search-ico">${CT_ICONS.search}</span>
          <input type="search" id="ct-q" autocomplete="off" placeholder="What do you need help with?" aria-label="What do you need help with?" />
          <kbd class="ct-kbd" aria-hidden="true">/</kbd>
          <span class="ct-search-glow" aria-hidden="true"></span>
        </label>
        <div class="ct-try" id="ct-try"><span>Try:</span>${["password reset", "Workable", "payroll", "new hire", "phone queue"].map((x) => `<button type="button" class="ct-try-btn" data-ct-try="${esc(x)}">${esc(x)}</button>`).join("")}</div>
      </div>
      ${hasExamples && state.isAdmin ? `<div class="ct-note"><strong>These are example entries.</strong> Replace them with your real people in <code>config.js</code> → <code>contacts</code>. Only admins see this note.</div>` : ""}
      <div class="ct-cats" id="ct-cats" role="tablist" aria-label="Topics"></div>
      <div class="ct-list" id="ct-list" aria-live="polite"></div>`;
  }
  renderContactList();
}

function renderContactList() {
  const words = lower(CT.q).split(/\s+/).filter(Boolean);
  const scored = DIR.topics.map((t, i) => ({ t, i, s: contactScore(t, words) })).filter((x) => x.s > 0);
  const counts = Object.fromEntries(DIR.categories.map((c) => [c.id, scored.filter((x) => x.t.category === c.id).length]));
  $("#ct-cats").innerHTML = [{ id: "", label: "All topics" }, ...DIR.categories].map((c) => `
    <button type="button" role="tab" class="ct-cat${CT.cat === c.id ? " is-active" : ""}" data-ct-cat="${esc(c.id)}" aria-selected="${CT.cat === c.id}" ${c.id && !counts[c.id] ? "disabled" : ""}>
      ${c.id ? `<span class="ct-cat-ico">${CAT_ICONS[c.icon] || CAT_ICONS.help}</span>` : ""}${esc(c.label)}<span class="ct-cat-n">${c.id ? counts[c.id] : scored.length}</span>
    </button>`).join("");
  const list = scored.filter((x) => !CT.cat || x.t.category === CT.cat).sort((a, b) => b.s - a.s || a.i - b.i);
  const el = $("#ct-list");
  if (!list.length) {
    const fallback = DIR.topics.find((t) => t.category === "general");
    el.innerHTML = `<div class="ct-empty">
        <div class="empty-mark">${CAT_ICONS.help}</div>
        <strong>No exact match for “${esc(CT.q)}”</strong>
        <p>Try a simpler word, or reach out here and they'll point you the right way.</p>
      </div>${fallback ? contactCard(fallback, 0, [], true) : ""}`;
    return;
  }
  el.innerHTML = list.map((x, k) => contactCard(x.t, k, words, false, DIR.topics.indexOf(x.t))).join("");
}

function contactCard(t, k, words, isFallback = false, idx = DIR.topics.indexOf(t)) {
  const cat = catOf(t.category), p = t.contact || {}, open = CT.open === idx;
  const btn = (href, icon, label, cls = "") => `<a class="ct-act ${cls}" href="${esc(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${icon}<span>${label}</span></a>`;
  return `<article class="ct-card${open ? " is-open" : ""}${isFallback ? " is-fallback" : ""}" style="--i:${Math.min(k, 12)}" data-ct-idx="${idx}">
    ${t.example ? `<span class="ct-example" title="Example entry. Replace in config.js">Example</span>` : ""}
    <div class="ct-top">
      <span class="ct-ico">${CAT_ICONS[cat.icon] || CAT_ICONS.help}</span>
      <div class="ct-topic">
        <span class="ct-catname">${esc(cat.label)}</span>
        <h2>${hl(t.topic, words)}</h2>
        <p>${hl(t.description || "", words)}</p>
      </div>
    </div>
    <div class="ct-person">
      <span class="ct-avatar">${esc(initials(p.name || "?"))}</span>
      <span class="ct-who"><span class="ct-reach">Reach out to</span><strong>${hl(p.name || "", words)}</strong>${p.role ? `<span class="ct-role">${esc(p.role)}</span>` : ""}</span>
      ${t.response ? `<span class="ct-time" title="Usual response time">${CT_ICONS.clock}${esc(t.response)}</span>` : ""}
    </div>
    <div class="ct-actions">
      ${p.teams && p.email ? btn(teamsHref(t, p), CT_ICONS.teams, "Teams chat", "is-primary") : ""}
      ${p.email ? btn(mailHref(t, p), CT_ICONS.mail, "Email") : ""}
      ${p.phone ? btn(`tel:${p.phone.replace(/[^\d+]/g, "")}`, CT_ICONS.phone, "Call") : ""}
      ${p.email ? `<button type="button" class="ct-act ct-copy" data-ct-copy="${esc(p.email)}" title="Copy ${esc(p.email)}">${CT_ICONS.copy}<span>Copy email</span></button>` : ""}
    </div>
    ${(t.tips || []).length || t.backup ? `
      <button type="button" class="ct-more" data-ct-open="${idx}" aria-expanded="${open}">
        <span>Before you reach out</span><span class="ct-more-chev">${CHEV}</span>
      </button>
      <div class="ct-detail"><div class="ct-detail-inner">
        ${(t.tips || []).length ? `<p class="ct-dlabel">Include this so they can help right away:</p>
          <ol class="ct-tips">${t.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
        ${t.backup ? `<p class="ct-backup">Not available? Try <strong>${esc(t.backup.name)}</strong>${t.backup.email ? ` at <a href="mailto:${esc(t.backup.email)}">${esc(t.backup.email)}</a>` : ""}.</p>` : ""}
      </div></div>` : ""}
  </article>`;
}
