/* HRA candidate technical requirements check (public page).
   Self-contained: loads only Firebase app + Firestore to ADD one result. Firestore rules allow nothing else
   from this page (no reading, no changes, no deletes). The web keys below are public by design. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FIREBASE = {
  apiKey: "AIzaSyCil1W-ab6RniMUIAN_7Ye_q6jOmRc4mFA",
  authDomain: "hra-dashboard-d8fa9.firebaseapp.com",
  projectId: "hra-dashboard-d8fa9",
  appId: "1:726901435741:web:f255b432ef64ecca9a4cb4"
};
const MIN = { down: 10, up: 10 };                // HRA minimums (Mbps)
const CF = "https://speed.cloudflare.com";        // Cloudflare's public speed test servers (nearest location worldwide)

const $ = (s) => document.querySelector(s);
const show = (id) => { for (const s of ["#s1", "#s2", "#s3", "#s4"]) $(s).hidden = s !== id; window.scrollTo({ top: 0, behavior: "smooth" }); };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const R = { name: "", email: "", position: "", dev: null };

/* ---------- Step 1 ---------- */
$("#who").addEventListener("submit", async (e) => {
  e.preventDefault();
  R.name = $("#name").value.trim(); R.email = $("#email").value.trim(); R.position = $("#position").value.trim();
  const err = !R.name ? "Please enter your full name." : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(R.email) ? "Please enter a valid email." : !$("#consent").checked ? "Please accept to share your results." : "";
  $("#err1").textContent = err; if (err) return;
  R.dev = await detectDevice(); renderDevice(); show("#s2");
});

/* ---------- Step 2: device ---------- */
async function detectDevice() {
  const ua = navigator.userAgent || "", uad = navigator.userAgentData;
  let platform = uad?.platform || "", os = "Unknown", win11 = "unknown", version = "";
  const chromebook = /CrOS/.test(ua) || /chrome ?os/i.test(platform);
  const mobile = uad?.mobile || /Android|iPhone|iPad|iPod/i.test(ua);
  if (uad?.getHighEntropyValues) { try { const h = await uad.getHighEntropyValues(["platformVersion"]); version = h.platformVersion || ""; } catch {} }
  if (chromebook) { os = "ChromeOS (Chromebook)"; win11 = "no"; }
  else if (mobile) { os = /iPhone|iPad|iPod/.test(ua) ? "iPhone / iPad" : "Android phone or tablet"; win11 = "no"; }
  else if (platform === "Windows" && version) { const major = parseInt(version, 10); win11 = major >= 13 ? "yes" : "no"; os = major >= 13 ? "Windows 11" : "Windows 10 or older"; }
  else if (/Windows NT 10/.test(ua)) { os = "Windows 10 or 11"; win11 = "unknown"; }
  else if (/Windows/.test(ua)) { os = "Older Windows"; win11 = "no"; }
  else if (/Mac OS X|Macintosh/.test(ua)) { os = "macOS"; win11 = "no"; }
  else if (/Linux/.test(ua)) { os = "Linux"; win11 = "no"; }
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  return { os, win11, chromebook, mobile, browser, cores: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0, ua: ua.slice(0, 380) };
}
function renderDevice() {
  const d = R.dev;
  const osPill = d.win11 === "yes" ? ["ok", "Meets requirement"] : d.win11 === "no" ? ["bad", "Doesn't meet requirement"] : ["warn", "Couldn't confirm Windows 11"];
  $("#dev").innerHTML = `
    <div><span>Operating system</span><b>${esc(d.os)} · <span class="pill ${osPill[0]}">${osPill[1]}</span></b></div>
    <div><span>Chromebook</span><b class="pill ${d.chromebook ? "bad" : "ok"}">${d.chromebook ? "Yes (not supported)" : "No"}</b></div>
    ${d.mobile ? `<div><span>Device</span><b class="pill bad">Phone or tablet: please use your work computer</b></div>` : ""}`;
}
$("#go").addEventListener("click", () => {
  if (!$("#cpu").value || !$("#ram").value) { $("#err2").textContent = "Please choose your processor and memory (or “Not sure”)."; return; }
  $("#err2").textContent = ""; show("#s3"); runTest();
});

/* ---------- Step 3: speed test ---------- */
const ARC = 377;
function gauge(mbps) { const v = Math.min(1, Math.log10(1 + mbps) / Math.log10(1 + 300)); $("#arc").style.strokeDashoffset = String(ARC * (1 - v)); $("#num").textContent = mbps >= 100 ? Math.round(mbps) : mbps.toFixed(1); }
const now = () => performance.now();
const bust = () => `&r=${Math.random().toString(36).slice(2)}`;

async function latency() {
  const t = [];
  for (let i = 0; i < 12; i++) { const s = now(); await fetch(`${CF}/__down?bytes=0${bust()}`, { cache: "no-store" }); t.push(now() - s); }
  const v = t.slice(2).sort((a, b) => a - b); const med = v[Math.floor(v.length / 2)];
  const jit = t.slice(3).reduce((a, x, i) => a + Math.abs(x - t[i + 2]), 0) / (t.length - 3);
  return { ping: Math.round(med), jitter: Math.round(jit) };
}
async function download(seconds = 8) {
  let bytes = 0, stop = false; const start = now();
  const tick = setInterval(() => { const s = (now() - start) / 1000; if (s > .3) { const m = bytes * 8 / s / 1e6; gauge(m); $("#ld").textContent = m.toFixed(1); } }, 200);
  const worker = async () => {
    let size = 1e6;
    while (!stop) {
      const res = await fetch(`${CF}/__down?bytes=${Math.round(size)}${bust()}`, { cache: "no-store" });
      const rd = res.body.getReader();
      while (true) { const { done, value } = await rd.read(); if (done) break; bytes += value.length; if (stop) { rd.cancel().catch(() => {}); break; } }
      size = Math.min(size * 2, 50e6);
    }
  };
  const ws = [worker(), worker(), worker(), worker()];
  await new Promise((r) => setTimeout(r, seconds * 1000)); stop = true; clearInterval(tick);
  await Promise.allSettled(ws.map((w) => Promise.race([w, new Promise((r) => setTimeout(r, 1500))])));
  return bytes * 8 / ((now() - start) / 1000) / 1e6;
}
async function upload(seconds = 8) {
  const chunk = new Uint8Array(4e6); for (let i = 0; i < chunk.length; i += 65536) crypto.getRandomValues(chunk.subarray(i, Math.min(i + 65536, chunk.length)));
  let bytes = 0, stop = false; const start = now();
  const tick = setInterval(() => { const s = (now() - start) / 1000; if (s > .5) { const m = bytes * 8 / s / 1e6; gauge(m); $("#lu").textContent = m.toFixed(1); } }, 200);
  const worker = async () => { let size = 250e3; while (!stop) { const body = chunk.subarray(0, Math.round(size)); await fetch(`${CF}/__up?${bust().slice(1)}`, { method: "POST", body, cache: "no-store" }); bytes += body.length; size = Math.min(size * 2, chunk.length); } };
  const ws = [worker(), worker(), worker()];
  await new Promise((r) => setTimeout(r, seconds * 1000)); stop = true; clearInterval(tick);
  await Promise.allSettled(ws.map((w) => Promise.race([w, new Promise((r) => setTimeout(r, 2500))])));
  return bytes * 8 / ((now() - start) / 1000) / 1e6;
}
async function runTest() {
  try {
    $("#phase").textContent = "Measuring latency…"; gauge(0); ["#lp", "#ld", "#lu"].forEach((s) => ($(s).textContent = "–"));
    let loc = "", colo = "";
    try { const t = await (await fetch(`${CF}/cdn-cgi/trace`, { cache: "no-store" })).text(); loc = (t.match(/loc=(\w+)/) || [])[1] || ""; colo = (t.match(/colo=(\w+)/) || [])[1] || ""; } catch {}
    const { ping, jitter } = await latency(); $("#lp").textContent = ping;
    $("#phase").textContent = "Testing download…"; const down = await download(); $("#ld").textContent = down.toFixed(1);
    $("#phase").textContent = "Testing upload…"; gauge(0); const up = await upload(); $("#lu").textContent = up.toFixed(1);
    finish({ down: +down.toFixed(1), up: +up.toFixed(1), ping, jitter, loc, colo });
  } catch (e) {
    console.error(e);
    $("#phase").textContent = "The test couldn't finish. Please check your connection and try again.";
    setTimeout(() => show("#s2"), 2500);
  }
}

/* ---------- Step 4: score + send ---------- */
function band(down, up) {
  if (down >= 50 && up >= 20) return "Excellent";
  if (down >= 25 && up >= 15) return "Good";
  if (down >= MIN.down && up >= MIN.up) return "Meets minimum";
  return "Below minimum";
}
function finish(sp) {
  const d = R.dev, cpu = $("#cpu").value, ram = $("#ram").value;
  const cpuText = $("#cpu").selectedOptions[0].text, ramText = $("#ram").selectedOptions[0].text;
  const items = [
    { t: "Download speed", s: `Minimum ${MIN.down} Mbps`, v: `${sp.down} Mbps`, st: sp.down >= MIN.down ? "ok" : "bad" },
    { t: "Upload speed", s: `Minimum ${MIN.up} Mbps`, v: `${sp.up} Mbps`, st: sp.up >= MIN.up ? "ok" : "bad" },
    { t: "Latency", s: "Lower is better for calls", v: `${sp.ping} ms`, st: sp.ping <= 100 ? "ok" : sp.ping <= 200 ? "warn" : "bad", info: true },
    { t: "Operating system", s: "Windows 11", v: d.os, st: d.win11 === "yes" ? "ok" : d.win11 === "no" ? "bad" : "warn" },
    { t: "Not a Chromebook", s: "Chromebooks aren't supported", v: d.chromebook ? "Chromebook" : "OK", st: d.chromebook ? "bad" : "ok" },
    { t: "Processor (you selected)", s: "Intel Core i5, 14th gen or newer", v: cpuText, st: ["i5-14", "i7-14", "ultra"].includes(cpu) ? "ok" : cpu === "older" ? "bad" : "warn" },
    { t: "Memory (you selected)", s: "16 GB or more", v: ramText, st: ["16", "32"].includes(ram) ? "ok" : ram === "8" ? "bad" : "warn" }
  ];
  const required = items.filter((i) => !i.info);
  const result = required.some((i) => i.st === "bad") ? "fail" : required.some((i) => i.st === "warn") ? "review" : "pass";
  const b = band(sp.down, sp.up);
  const V = { pass: ["✓", "You meet our requirements", "Your results have been shared with the HRA team."], review: ["!", "Almost there: a few items need a quick review", "Our team will review the items marked in yellow with you."], fail: ["✕", "Some requirements aren't met yet", "See the items in red below. You can fix them and run the test again."] }[result];
  $("#verdict").className = `verdict ${result}`;
  $("#verdict").innerHTML = `<div class="ic">${V[0]}</div><div><h2>${V[1]}</h2><p>${V[2]}</p><span class="band">Internet: ${b}</span></div>`;
  $("#checks").innerHTML = items.map((i) => `<div class="chk ${i.st}"><span class="d">${i.st === "ok" ? "✓" : i.st === "bad" ? "✕" : "!"}</span><div class="t"><b>${esc(i.t)}</b><span>${esc(i.s)}</span></div><span class="v">${esc(i.v)}</span></div>`).join("");
  const slow = sp.down < MIN.down || sp.up < MIN.up;
  $("#advice").hidden = !slow;
  $("#advice").innerHTML = slow ? "<b>Tips to improve your speed:</b> connect with an Ethernet cable if possible, move closer to your Wi-Fi router, close other apps, videos or downloads, and run the test again." : "";
  show("#s4");
  send({ ...sp, os: d.os, win11: d.win11, chromebook: d.chromebook, browser: d.browser, cores: d.cores, mem: d.mem, ua: d.ua, cpu, ram, band: b, result });
}
let db = null;
async function send(r) {
  $("#sent").className = "sent"; $("#sent").textContent = "Sending your results…";
  try {
    db = db || getFirestore(initializeApp(FIREBASE));
    await addDoc(collection(db, "techchecks"), {
      v: 1, name: R.name.slice(0, 100), email: R.email.slice(0, 150), position: R.position.slice(0, 150),
      down: r.down, up: r.up, ping: r.ping, jitter: r.jitter, loc: String(r.loc).slice(0, 10), colo: String(r.colo).slice(0, 10),
      os: r.os.slice(0, 40), win11: r.win11, chromebook: r.chromebook, browser: r.browser.slice(0, 40),
      cores: Math.min(256, Math.max(0, Math.round(r.cores))), mem: Math.min(64, Math.max(0, Number(r.mem) || 0)),
      cpu: r.cpu, ram: r.ram, band: r.band, result: r.result, ua: r.ua.slice(0, 380), createdAt: serverTimestamp()
    });
    $("#sent").textContent = "✓ Your results were sent to the HRA team.";
  } catch (e) {
    console.error(e);
    $("#sent").className = "sent bad"; $("#sent").textContent = "We couldn't send your results automatically. Please take a screenshot of this page and send it to your recruiter.";
  }
}
$("#again").addEventListener("click", () => show("#s2"));
