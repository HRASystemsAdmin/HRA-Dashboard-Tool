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

function toast(msg, color) {
  const el = document.createElement("div");
  el.className = "toast";
  if (color) el.style.setProperty("--tc", color);
  el.innerHTML = `<i></i><span>${esc(msg)}</span>`;
  $("#toasts").appendChild(el);
  setTimeout(() => { el.classList.add("is-leaving"); setTimeout(() => el.remove(), 380); }, 3600);
}

/* --------------------------------------------------------------------------
   Data stores
   -------------------------------------------------------------------------- */
function createDemoStore() {
  const KEY = "hra_demo_tickets_v2", UKEY = "hra_demo_user_v1", FKEY = "hra_demo_files_v1";
  const loadFiles = () => { try { return JSON.parse(localStorage.getItem(FKEY)) || {}; } catch { return {}; } };
  const listeners = new Set();
  let onUser = () => {};
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} emit(); };
  const emit = () => listeners.forEach((fn) => fn());
  addEventListener("storage", (e) => { if (e.key === KEY) emit(); });

  const people = {
    member: { uid: "demo-member", email: MEMBERS[0] || "employee@demo.local", name: "Jordan Reyes", role: "member" },
    admin:  { uid: "demo-admin",  email: ADMINS[0]  || "admin@demo.local",    name: "Alex Morgan",  role: "admin" }
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
  if (state.unsub) { state.unsub(); state.unsub = null; }
  closeAll(true);
  state.tickets = []; state.loaded = false; state.known.clear();

  if (!u) {
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
  renderTypes();
  renderAll();
  showView("view-app");
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
    if (t.closest("[data-action='signout']")) { state.store.signOut(); return; }
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
    if (e.target.dataset?.boardSearch) {
      const id = e.target.dataset.boardSearch;
      boardState[id].search = e.target.value;
      renderBoard(BOARDS.find((b) => b.id === id));
    }
    e.target.closest?.(".field.is-invalid")?.classList.remove("is-invalid");
  });

  document.addEventListener("keydown", (e) => {
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
        const tile = e.target.closest?.(".type-tile");
        if (tile) {
          const r = tile.getBoundingClientRect();
          tile.style.setProperty("--mx", e.clientX - r.left + "px");
          tile.style.setProperty("--my", e.clientY - r.top + "px");
        }
      });
    });
  }

  addEventListener("resize", () => $$(".tabs, .seg").forEach(moveIndicator));
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
