/* HRA candidate technical requirements check (public page).
   Self-contained: loads only Firebase app + Firestore to ADD one result. Firestore rules allow nothing else
   from this page (no reading, no changes, no deletes). The web keys below are public by design. */
// Firebase loads only when the result is sent, so the test itself always works.
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
import SpeedTest from "./speedtest.js";   // Cloudflare's official speed test engine (same as speed.cloudflare.com)

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
const R = { name: "", position: "", dev: null };

/* ---------- Step 1 ---------- */
$("#who").addEventListener("submit", async (e) => {
  e.preventDefault();
  R.name = $("#name").value.trim(); R.position = $("#position").value.trim();
  const err = !R.name ? "Please enter your full name." : !$("#consent").checked ? "Please accept to share your results." : "";
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
  else if (platform === "Windows" && version) { const major = parseInt(version, 10); win11 = major >= 13 ? "yes" : "no"; os = major >= 13 ? "Windows 11" : major >= 1 ? "Windows 10" : "Older Windows"; }
  else if (/Windows NT 10/.test(ua)) { os = "Windows (version confirmed by screenshot)"; win11 = "unknown"; }
  else if (/Windows/.test(ua)) { os = "Older Windows"; win11 = "no"; }
  else if (/Mac OS X|Macintosh/.test(ua)) { os = "macOS"; win11 = "no"; }
  else if (/Linux/.test(ua)) { os = "Linux"; win11 = "no"; }
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  return { os, win11, chromebook, mobile, browser, cores: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0, ua: ua.slice(0, 380) };
}
function renderDevice() {
  const d = R.dev;
  const osPill = d.win11 === "yes" ? ["ok", "Meets requirement"] : d.win11 === "no" ? ["bad", "Windows 11 is required"] : ["warn", "Confirmed from your screenshot"];
  $("#dev").innerHTML = `
    <div><span>Operating system</span><b>${esc(d.os)} · <span class="pill ${osPill[0]}">${osPill[1]}</span></b></div>
    <div><span>Chromebook</span><b class="pill ${d.chromebook ? "bad" : "ok"}">${d.chromebook ? "Yes (not supported)" : "No"}</b></div>
    ${d.mobile ? `<div><span>Device</span><b class="pill bad">Phone or tablet: please use your work computer</b></div>` : ""}`;
}
/* ---------- System specifications screenshot: shrunk and compressed in the browser (about 150–400 KB) ---------- */
let SHOT = "";
const MAX_SHOT = 520000;   // characters of the compressed image; the database rule allows up to 700,000
async function compressImage(file) {
  if (!file || !/^image\//.test(file.type)) throw new Error("Please choose an image (PNG or JPG).");
  if (file.size > 25e6) throw new Error("That image is too large. Please take a screenshot instead.");
  const url = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("That image couldn't be read.")); i.src = url; });
  let scale = Math.min(1, 1600 / img.width), q = 0.82, out = "";
  for (let k = 0; k < 8; k++) {
    const c = document.createElement("canvas"); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    out = c.toDataURL("image/jpeg", q);
    if (out.length <= MAX_SHOT) return out;
    if (q > 0.55) q -= 0.1; else scale *= 0.8;
  }
  throw new Error("That image is too large. Please take a smaller screenshot.");
}
async function takeShot(file) {
  const drop = $("#drop"); drop.classList.add("is-busy"); $("#err2").textContent = "";
  try { SHOT = await compressImage(file); $("#shot-prev").src = SHOT; $("#drop-empty").hidden = true; $("#drop-full").hidden = false; }
  catch (e) { $("#err2").textContent = e.message; }
  finally { drop.classList.remove("is-busy"); }
}
$("#shot").addEventListener("change", (e) => { if (e.target.files[0]) takeShot(e.target.files[0]); e.target.value = ""; });
$("#drop").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("#shot").click(); } });
$("#drop").addEventListener("dragover", (e) => { e.preventDefault(); $("#drop").classList.add("is-over"); });
$("#drop").addEventListener("dragleave", () => $("#drop").classList.remove("is-over"));
$("#drop").addEventListener("drop", (e) => { e.preventDefault(); $("#drop").classList.remove("is-over"); const f = [...(e.dataTransfer?.files || [])].find((x) => x.type.startsWith("image/")); if (f) takeShot(f); });
$("#shot-x").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); SHOT = ""; $("#shot-prev").removeAttribute("src"); $("#drop-full").hidden = true; $("#drop-empty").hidden = false; });
document.addEventListener("paste", (e) => { if ($("#s2").hidden) return; const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith("image/")); if (f) { e.preventDefault(); takeShot(f); } });

$("#cpu").addEventListener("change", () => { const o = $("#cpu").value === "other"; $("#cpu-other-wrap").hidden = !o; if (o) $("#cpu-other").focus(); });
$("#go").addEventListener("click", () => {
  if (!$("#cpu").value || !$("#ram").value) { $("#err2").textContent = "Please choose your processor and memory (or “Not sure”)."; return; }
  if ($("#cpu").value === "other" && !$("#cpu-other").value.trim()) { $("#err2").textContent = "Please type which processor you have."; $("#cpu-other").focus(); return; }
  if (!SHOT) { $("#err2").textContent = "Please upload a screenshot of your system specifications."; $("#drop").focus(); return; }
  $("#err2").textContent = ""; show("#s3"); runTest();
});

/* ---------- Step 3: speed test ---------- */
const ARC = 377;
function gauge(mbps) { const v = Math.min(1, Math.log10(1 + mbps) / Math.log10(1 + 300)); $("#arc").style.strokeDashoffset = String(ARC * (1 - v)); $("#num").textContent = mbps >= 100 ? Math.round(mbps) : mbps.toFixed(1); }
const now = () => performance.now();

async function runTest() {
  $("#phase").textContent = "Measuring latency…"; gauge(0); ["#lp", "#ld", "#lu"].forEach((x) => ($(x).textContent = "–"));
  let loc = "", colo = "";
  try { const t = await (await fetch(`${CF}/cdn-cgi/trace`, { cache: "no-store" })).text(); loc = (t.match(/loc=(\w+)/) || [])[1] || ""; colo = (t.match(/colo=(\w+)/) || [])[1] || ""; } catch {}
  // results stay between the candidate and HRA: no reporting to Cloudflare's result logs
  const st = new SpeedTest({ autoStart: false, logAimApiUrl: null, logMeasurementApiUrl: null });
  let done = false;
  const guard = setTimeout(() => { if (!done) { done = true; st.pause?.(); fail(); } }, 150000);
  const mbps = (bps) => (bps ? bps / 1e6 : 0);
  st.onResultsChange = ({ type }) => {
    const r = st.results;
    if (type === "latency") { const l = r.getUnloadedLatency?.(); if (l) $("#lp").textContent = Math.round(l); }
    if (type === "download") { const d = mbps(r.getDownloadBandwidth?.()); if (d) { $("#phase").textContent = "Testing download…"; gauge(d); $("#ld").textContent = d.toFixed(1); } }
    if (type === "upload") { const u = mbps(r.getUploadBandwidth?.()); if (u) { $("#phase").textContent = "Testing upload…"; gauge(u); $("#lu").textContent = u.toFixed(1); } }
  };
  st.onError = (e) => console.warn("Speed test:", e);
  st.onFinish = (r) => {
    if (done) return; done = true; clearTimeout(guard);
    const down = mbps(r.getDownloadBandwidth?.()), up = mbps(r.getUploadBandwidth?.());
    if (!down || !up) { fail(); return; }
    finish({ down: +down.toFixed(1), up: +up.toFixed(1), ping: Math.round(r.getUnloadedLatency?.() || 0), jitter: Math.round(r.getUnloadedJitter?.() || 0), loc, colo });
  };
  try { st.play(); } catch (e) { console.error(e); done = true; clearTimeout(guard); fail(); }
}
function fail() {
  $("#phase").textContent = "The test couldn't finish. Please check your connection and try again.";
  setTimeout(() => show("#s2"), 2500);
}

/* ---------- Step 4: score + send ---------- */
function band(down, up) {
  if (down >= 50 && up >= 20) return "Excellent";
  if (down >= 25 && up >= 15) return "Good";
  if (down >= MIN.down && up >= MIN.up) return "Meets minimum";
  return "Below minimum";
}
// One browser connection can't fill very fast lines, so above 100 Mbps we only vouch for "100+".
const fmtSpeed = (v) => (v >= 100 ? "100+ Mbps" : `${v} Mbps`);
function finish(sp) {
  const d = R.dev, cpu = $("#cpu").value, ram = $("#ram").value;
  const cpuOther = cpu === "other" ? $("#cpu-other").value.trim().slice(0, 60) : "";
  const cpuText = cpuOther || $("#cpu").selectedOptions[0].text, ramText = $("#ram").selectedOptions[0].text;
  const items = [
    { t: "Download speed", s: `Minimum ${MIN.down} Mbps`, v: fmtSpeed(sp.down), st: sp.down >= MIN.down ? "ok" : "bad" },
    { t: "Upload speed", s: `Minimum ${MIN.up} Mbps`, v: fmtSpeed(sp.up), st: sp.up >= MIN.up ? "ok" : "bad" },
    { t: "Latency", s: "Lower is better for calls", v: `${sp.ping} ms`, st: sp.ping <= 100 ? "ok" : sp.ping <= 200 ? "warn" : "bad", info: true },
    { t: "Operating system", s: "Windows 11", v: d.os, st: d.win11 === "yes" ? "ok" : d.win11 === "no" ? "bad" : "warn" },
    { t: "Not a Chromebook", s: "Chromebooks aren't supported", v: d.chromebook ? "Chromebook" : "OK", st: d.chromebook ? "bad" : "ok" },
    { t: "Processor (you selected)", s: "Intel Core i5 or better", v: cpuText, st: ["i5", "i7", "ultra"].includes(cpu) ? "ok" : cpu === "i3" ? "bad" : "warn" },
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
  $("#fastnote").hidden = !(sp.down >= 100 || sp.up >= 100);
  show("#s4");
  send({ ...sp, cpuOther, os: d.os, win11: d.win11, chromebook: d.chromebook, browser: d.browser, cores: d.cores, mem: d.mem, ua: d.ua, cpu, ram, band: b, result });
}
let db = null, fs = null;
async function send(r) {
  $("#sent").className = "sent"; $("#sent").textContent = "Sending your results…";
  try {
    if (!db) { const app = await import(FB + "firebase-app.js"); fs = await import(FB + "firebase-firestore.js"); db = fs.getFirestore(app.initializeApp(FIREBASE)); }
    const { collection, addDoc, serverTimestamp } = fs;
    let shot = "";
    if (SHOT) { try { shot = (await addDoc(collection(db, "techcheck_shots"), { img: SHOT, createdAt: serverTimestamp() })).id; } catch (e) { console.warn("Screenshot not saved", e); } }
    await addDoc(collection(db, "techchecks"), {
      v: 3, shot, name: R.name.slice(0, 100), position: R.position.slice(0, 150),
      down: r.down, up: r.up, ping: r.ping, jitter: r.jitter, loc: String(r.loc).slice(0, 10), colo: String(r.colo).slice(0, 10),
      os: r.os.slice(0, 40), win11: r.win11, chromebook: r.chromebook, browser: r.browser.slice(0, 40),
      cores: Math.min(256, Math.max(0, Math.round(r.cores))), mem: Math.min(64, Math.max(0, Number(r.mem) || 0)),
      cpu: r.cpu, cpuOther: r.cpuOther || "", ram: r.ram, band: r.band, result: r.result, ua: r.ua.slice(0, 380), createdAt: serverTimestamp()
    });
    $("#sent").textContent = "✓ Your results were sent to the HRA team.";
  } catch (e) {
    console.error(e);
    $("#sent").className = "sent bad"; $("#sent").textContent = "We couldn't send your results automatically. Please take a screenshot of this page and send it to your recruiter.";
  }
}
$("#again").addEventListener("click", () => show("#s2"));
