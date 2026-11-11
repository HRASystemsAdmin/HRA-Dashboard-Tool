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
  const KEY = "hra_demo_tickets_v2", UKEY = "hra_demo_user_v1";
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
  queueFilter: "active",
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
  $("#tab-queue").hidden = !isAdmin;
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
  renderAll();
  if (state.openId) renderDrawer();
}
const flashIds = new Set();

/* --------------------------------------------------------------------------
   Rendering
   -------------------------------------------------------------------------- */
function renderTypes() {
  $("#type-tiles").innerHTML = Object.entries(CFG.requestTypes).map(([key, t]) => `
    <button class="type-tile" data-new="${esc(key)}">
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
    `<span>${esc(type?.label || "Request")}</span>`,
    adminView ? `<span>${ICONS.user}${esc(t.createdBy?.name || "")}</span>` : "",
    `<span>${ICONS.clock}${ago(t.createdAt)}</span>`,
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
function renderQueue() {
  if (!state.isAdmin) return;
  const counts = { open: 0, in_progress: 0, completed: 0 };
  state.tickets.forEach((t) => { if (counts[t.status] !== undefined) counts[t.status]++; });
  $$("[data-count]").forEach((el) => countTo(el, counts[el.dataset.count]));

  const qc = $("#queue-count");
  const waiting = counts.open;
  if (qc.textContent !== String(waiting)) { qc.classList.remove("bump"); void qc.offsetWidth; qc.classList.add("bump"); }
  qc.textContent = waiting;
  qc.classList.toggle("is-zero", waiting === 0);

  const list = $("#queue-list");
  if (!state.loaded) { list.innerHTML = skeleton(); return; }
  const s = lower(state.search);
  const items = state.tickets
    .filter((t) => matchFilter(t, state.queueFilter))
    .filter((t) => !s || lower([ref(t.id), t.title, t.createdBy?.name, t.createdBy?.email, JSON.stringify(t.fields || {})].join(" ")).includes(s))
    .sort((a, b) => {
      if (a.status !== "completed" && b.status !== "completed") {
        const p = (PRI[a.fields?.priority] ?? 2) - (PRI[b.fields?.priority] ?? 2);
        if (p) return p;
      }
      return toDate(b.createdAt) - toDate(a.createdAt);
    });
  list.innerHTML = items.length
    ? items.map((t, i) => row(t, i, true)).join("")
    : s ? empty("No matches", "Try a name, a reference like HRA-1A2B3C, or fewer words.")
        : empty("The queue is clear", "New requests appear here the moment they're sent.");
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
  else { state.queueFilter = filter; renderQueue(); }
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
function fieldHTML(f, i) {
  const id = "f-" + f.name;
  const req = f.required ? "required" : "";
  const label = `<span class="field-label">${esc(f.label)}${f.required ? "" : '<span class="opt">optional</span>'}</span>`;
  let control;
  switch (f.type) {
    case "textarea":
      control = `<textarea id="${id}" name="${f.name}" ${req} placeholder="${esc(f.placeholder || "")}"></textarea>`; break;
    case "select":
      control = `<select id="${id}" name="${f.name}" ${req}>${(f.options || []).map((o) => `<option>${esc(o)}</option>`).join("")}</select>`; break;
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
      control = `<input id="${id}" name="${f.name}" type="${t}" ${req} placeholder="${esc(f.placeholder || "")}" />`;
    }
  }
  return `<label class="field" data-field="${f.name}" style="--i:${i}">${label}${control}</label>`;
}

function openNew(key) {
  const type = CFG.requestTypes[key];
  if (!type) return;
  $("#modal-body").innerHTML = `
    <div class="modal-head">
      <span class="type-icon">${ICONS[type.icon] || ICONS.spark}</span>
      <div><h2 id="modal-title">${esc(type.label)}</h2><p>${esc(type.blurb)}</p></div>
    </div>
    <form class="modal-form" id="new-form" data-type="${esc(key)}" novalidate>
      ${type.fields.map(fieldHTML).join("")}
      <p class="form-error" id="new-error" role="alert"></p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary"><span class="btn-text">Send request</span><span class="spinner" aria-hidden="true"></span></button>
      </div>
    </form>`;
  openOverlay($("#modal"));
  setTimeout(() => $("#new-form input, #new-form textarea")?.focus({ preventScroll: true }), 350);
}

async function submitNew(form) {
  const key = form.dataset.type, type = CFG.requestTypes[key];
  const data = {};
  let firstBad = null;

  for (const f of type.fields) {
    const wrap = $(`[data-field="${f.name}"]`, form);
    let v;
    if (f.type === "chips") v = $$(`.chip[aria-pressed="true"]`, wrap).map((c) => c.dataset.value);
    else if (f.type === "checks") v = $$("input:checked", wrap).map((c) => c.value);
    else v = String(form.elements[f.name].value || "").trim();
    data[f.name] = v;
    const bad = f.required && (Array.isArray(v) ? v.length === 0 : !v);
    wrap.classList.remove("is-invalid");
    if (bad) { void wrap.offsetWidth; wrap.classList.add("is-invalid"); firstBad ||= wrap; }
  }
  if (firstBad) {
    $("#new-error").textContent = "Fill in the highlighted fields to send this request.";
    ($("input, textarea, select, .chip", firstBad))?.focus();
    return;
  }

  const btn = $('button[type="submit"]', form);
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
      history: [{ status: "open", at: new Date().toISOString(), by }]
    });
    flashIds.add(id);
    renderAll();
    $("#modal-body").innerHTML = `
      <div class="success">
        <svg viewBox="0 0 90 90" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle class="ring" cx="45" cy="45" r="38"/><path class="tick" d="M29 46l11 11 22-24"/>
        </svg>
        <h2 id="modal-title">Request sent</h2>
        <p>Your reference is <strong>${ref(id)}</strong>. You'll see it move to in progress as soon as someone takes it.</p>
        <button class="btn btn-primary" data-close>Done</button>
      </div>`;
    if (state.mineFilter === "completed") setSeg("mine-filter", "active");
    if (state.tab !== "mine") setTab("mine");
  } catch (e) {
    console.error(e);
    btn.classList.remove("is-loading");
    $("#new-error").textContent = e?.code === "permission-denied"
      ? "Your account isn't allowed to send requests. Ask an admin to add you."
      : "The request didn't send. Check your connection and try again.";
  }
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

  const rows = (type?.fields || []).map((f) => {
    let v = t.fields?.[f.name];
    if (Array.isArray(v)) v = v.join(", ");
    if (f.type === "url" && v && !/^https?:\/\//i.test(v)) v = "https://" + v;
    if (f.type === "date" && v) v = new Date(v + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    return v ? `<div class="detail"><dt>${esc(f.label)}</dt><dd>${esc(v)}</dd></div>` : "";
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
      completed:   `<button class="btn btn-ghost" data-set="in_progress">Reopen</button>`
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
      <span class="pill" data-status="${t.status}">${STATUS[t.status].label}</span>
      <span class="t-ref">${ref(t.id)}</span>
    </div>
    <h2 class="drawer-title" id="drawer-title">${esc(t.title)}</h2>
    ${track(t.status)}
    <dl class="details">
      <div class="detail"><dt>Requested by</dt><dd>${esc(t.createdBy?.name)}${state.isAdmin ? ` <span style="color:var(--muted)">${esc(t.createdBy?.email)}</span>` : ""}</dd></div>
      <div class="detail"><dt>Type</dt><dd>${esc(type?.label || t.type)}</dd></div>
      ${rows}
    </dl>
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
    if (t.closest("[data-action='signout']")) { state.store.signOut(); return; }
    const tab = t.closest(".tab"); if (tab) { setTab(tab.dataset.tab); return; }
    const seg = t.closest(".seg-btn"); if (seg) { setSeg(seg.closest(".seg").id, seg.dataset.filter); return; }
    const meter = t.closest(".meter"); if (meter) { setSeg("queue-filter", meter.dataset.filter); return; }
    const nw = t.closest("[data-new]"); if (nw) { openNew(nw.dataset.new); return; }
    const chip = t.closest(".chip"); if (chip) {
      chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
      chip.closest(".field")?.classList.remove("is-invalid");
      return;
    }
    const set = t.closest("[data-set]"); if (set) { setStatus(set.dataset.set, set); return; }
    const row = t.closest(".ticket"); if (row) { openTicket(row.dataset.id); return; }
    if (t.closest("[data-close]")) { closeOverlay(t.closest(".overlay")); return; }
    if (t.classList.contains("overlay")) closeOverlay(t);
  });

  document.addEventListener("submit", (e) => {
    if (e.target.id === "new-form") { e.preventDefault(); submitNew(e.target); }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "queue-search") { state.search = e.target.value; renderQueue(); }
    e.target.closest?.(".field.is-invalid")?.classList.remove("is-invalid");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { const o = $$(".overlay:not([hidden])").pop(); if (o) closeOverlay(o); }
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
