// StoryGlow Theater — shot timeline, camera, transitions, player UI, read-along captions.
"use strict";

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const buf = document.createElement("canvas");
const bctx = buf.getContext("2d");
const view = new View(ctx, 1, 1);
const bview = new View(bctx, 1, 1);

const SHOTS = (window.STORY && window.STORY.shots) || [];
const TRANSCRIPT = window.TRANSCRIPT || { segments: [] };
SHOTS.sort((a, b) => a.t - b.t);
// the script is written in absolute audio seconds; convert per-shot timings to shot-relative
if (window.STORY.absolute) for (const s of SHOTS) {
  for (const a of s.cast || []) { for (const k of a.keys) k.t = Math.max(0, k.t - s.t); if (a.until !== undefined) a.until -= s.t; if (a.from !== undefined) a.from -= s.t; }
  if (s.anim) for (const k in s.anim) { s.anim[k][2] -= s.t; s.anim[k][3] -= s.t; }
  if (s.flash) s.flash[0] -= s.t;
}
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].t : (window.STORY.duration || s.t + 30); s._fx = (s.fx || []).map(([k, n, str], j) => ({ p: new Particles(k, n, 100 + i * 7 + j), str: str ?? 1 })); });

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight;
  for (const c of [canvas, buf]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + "px"; c.style.height = h + "px"; }
  // portrait phones: show a bit more height of the world by zooming out slightly
  view.resize(canvas.width, canvas.height); bview.resize(buf.width, buf.height);
}
window.addEventListener("resize", resize); resize();

function shotIndexAt(t) { let i = 0; while (i < SHOTS.length - 1 && SHOTS[i + 1].t <= t) i++; return i; }

function autoY(z) { return GROUND - .3 * (1000 / z); }
function camAt(shot, lt, v) {
  const portrait = v.w < v.h;
  const dur = Math.max(1, shot.end - shot.t);
  const from = shot.cam?.from || { x: 1000, y: 500, z: 1 }, to = shot.cam?.to || from;
  const k = easeInOut(lt / dur);
  let z = lerp(from.z ?? 1, to.z ?? 1, k);
  let x = lerp(from.x ?? 1000, to.x ?? from.x ?? 1000, k);
  let y = lerp(from.y ?? autoY(from.z ?? 1), to.y ?? (from.y !== undefined && to === from ? from.y : autoY(to.z ?? 1)), k);
  // keep framing sensible in portrait: zoom in a touch, centre on the action
  if (portrait) {
    z *= shot.cam?.pz ?? 1.45;
    if (shot.cam?.px !== undefined) x = lerp(shot.cam.px, shot.cam.px2 ?? shot.cam.px, k);
    else {
      const f = focus(shot, lt);
      if (f) { x = f.x; const fit = ((v.w / v.h) * 1000) / (f.spread + 300); z = clamp(Math.min(z, fit), .8, z); }
    }
    y = GROUND - .3 * (1000 / z) - (shot.cam?.lift ?? 0);
  } else {
    z *= 1.05;
  }
  // slow breathing drift so nothing is ever perfectly still
  return { x: x + Math.sin(lt * .21) * 6, y: y + Math.sin(lt * .17) * 4, z };
}

// where the characters are (for portrait framing): average x of the people on stage
function focus(shot, lt) {
  const xs = [];
  for (const a of shot.cast || []) {
    if (a.nofocus || CAST[a.who]?.kind === "bird" || CAST[a.who]?.kind === "flock" || CAST[a.who]?.kind === "mouse") continue;
    if ((a.until !== undefined && lt > a.until) || (a.from !== undefined && lt < a.from)) continue;
    xs.push(evalActor(a, lt).x);
  }
  if (shot.cam?.focus !== undefined) xs.push(shot.cam.focus);
  if (!xs.length) return null;
  const lo = Math.min(...xs), hi = Math.max(...xs);
  return { x: (lo + hi) / 2, spread: hi - lo };
}

function renderShot(c, v, shot, t) {
  const lt = t - shot.t;
  const sky = skyOf(shot.sky || "night");
  const world = WORLDS[shot.world] || WORLDS.woods;
  const cam = camAt(shot, lt, v);
  v.cx = cam.x; v.cy = cam.y; v.z = cam.z;
  const P = { ...(shot.P || {}) };
  // world params can be animated: P.anim = {key: [from, to, t0, t1]}
  if (shot.anim) for (const key in shot.anim) { const [a, b, t0, t1] = shot.anim[key]; P[key] = lerp(a, b, smooth((lt - t0) / Math.max(.01, t1 - t0))); }

  c.save();
  world.back(c, v, t, sky, P);
  const cast = (shot.cast || []).slice().sort((a, b) => (a.depth ?? 1) - (b.depth ?? 1));
  for (const a of cast) { if ((a.until !== undefined && lt > a.until) || (a.from !== undefined && lt < a.from)) continue; drawActor(c, v, sky, a, lt, t); }
  world.front(c, v, t, sky, P);
  for (const f of shot._fx) f.p.draw(c, v, t, sky, f.str);
  if (shot.flash) { const [ft, fd] = shot.flash; const k = 1 - clamp((lt - ft) / fd, 0, 1); if (lt >= ft && k > 0) { v.screen(); c.fillStyle = `rgba(255,170,100,${k * .38})`; c.fillRect(0, 0, v.w, v.h); } }
  vignette(c, v, shot.vignette ?? .6);
  c.restore();
}

function render(t) {
  if (!SHOTS.length) return;
  const i = shotIndexAt(t), shot = SHOTS[i];
  const fade = shot.fade ?? 1.4;
  const lt = t - shot.t;
  renderShot(ctx, view, shot, t);
  // cross-fade from the previous shot
  if (i > 0 && lt < fade && fade > 0) {
    renderShot(bctx, bview, SHOTS[i - 1], t);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - smooth(lt / fade); ctx.drawImage(buf, 0, 0); ctx.restore();
  }
  // fade from black at the very start
  if (t < 2) { view.screen(); ctx.fillStyle = `rgba(0,0,0,${1 - t / 2})`; ctx.fillRect(0, 0, view.w, view.h); }
}

// ---------------------------------------------------------------- captions
const capEl = document.getElementById("caption");
let capOn = true, lastSeg = -1, lastWord = -2;
function captionAt(t) {
  if (!capOn) { capEl.style.opacity = 0; return; }
  const segs = TRANSCRIPT.segments;
  let i = -1; for (let j = 0; j < segs.length; j++) { if (segs[j].start <= t + .05) i = j; else break; }
  const seg = segs[i];
  if (!seg || t > seg.end + 1.5) { capEl.style.opacity = 0; lastSeg = -1; return; }
  if (i !== lastSeg) {
    capEl.innerHTML = (seg.words && seg.words.length ? seg.words.map((w, k) => `<span data-k="${k}">${w.w}</span>`).join(" ") : seg.text);
    lastSeg = i; lastWord = -2;
  }
  capEl.style.opacity = 1;
  if (seg.words) {
    let wi = -1; for (let k = 0; k < seg.words.length; k++) if (seg.words[k].s <= t) wi = k;
    if (wi !== lastWord) { capEl.querySelectorAll("span").forEach((s, k) => s.className = k < wi ? "said" : k === wi ? "now" : ""); lastWord = wi; }
  }
}

// ---------------------------------------------------------------- player
// Audio: inside the Android app the phone plays the MP3 natively (reliable seeking) and reports its
// position here; in a browser we use the <audio> element.
class NativeAudio {
  constructor(n) { this.n = n; this.base = 0; this.at = performance.now(); this.paused = true; this.ls = {}; this._dur = (n.duration() || 0) / 1000; }
  get duration() { return this._dur; }
  get currentTime() { return this.paused ? this.base : this.base + (performance.now() - this.at) / 1000; }
  set currentTime(t) { this.n.seek(Math.round(t * 1000)); this.base = t; this.at = performance.now(); }
  play() { this.n.play(); this.base = this.currentTime; this.at = performance.now(); this.paused = false; this.emit("play"); return Promise.resolve(); }
  pause() { this.base = this.currentTime; this.n.pause(); this.paused = true; this.emit("pause"); }
  sync(ms, playing, durMs) {
    if (durMs) { const had = this._dur; this._dur = durMs / 1000; if (!had) this.emit("loadedmetadata"); }
    this.base = ms / 1000; this.at = performance.now();
    if (playing === this.paused) { this.paused = !playing; this.emit(playing ? "play" : "pause"); }
  }
  addEventListener(n, f) { (this.ls[n] = this.ls[n] || []).push(f); }
  emit(n) { (this.ls[n] || []).forEach((f) => f()); }
}
const audio = window.StoryGlowNative ? new NativeAudio(window.StoryGlowNative) : document.getElementById("audio");
window.__sync = (ms, playing, dur) => audio.sync && audio.sync(ms, playing, dur);
if (window.StoryGlowNative) setTimeout(buildTicks, 0);
const ui = document.getElementById("ui");
const playBtn = document.getElementById("play");
const bar = document.getElementById("bar"), fillEl = document.getElementById("fill"), ticks = document.getElementById("ticks");
const timeEl = document.getElementById("time"), chapEl = document.getElementById("chapter");
const startEl = document.getElementById("start");
const params = new URLSearchParams(location.search);
const PREVIEW = params.has("t");

const duration = () => (isFinite(audio.duration) && audio.duration > 0 ? audio.duration : (window.STORY.duration || 1));
function fmt(s) { s = Math.max(0, s | 0); return `${(s / 60) | 0}:${String(s % 60).padStart(2, "0")}`; }

function chapterAt(t) { let c = null; for (const s of SHOTS) if (s.chapter && s.t <= t + .01) c = s.chapter; return c; }
function buildTicks() {
  ticks.innerHTML = "";
  for (const s of SHOTS) if (s.chapter) { const d = document.createElement("i"); d.style.left = (100 * s.t / duration()) + "%"; ticks.appendChild(d); }
}
audio.addEventListener("loadedmetadata", buildTicks);

let uiTimer = 0;
function showUI() { ui.classList.remove("hide"); clearTimeout(uiTimer); uiTimer = setTimeout(() => { if (!audio.paused) ui.classList.add("hide"); }, 3500); }
document.getElementById("tap").addEventListener("click", () => { if (ui.classList.contains("hide")) showUI(); else ui.classList.add("hide"); });
playBtn.addEventListener("click", (e) => { e.stopPropagation(); audio.paused ? audio.play() : audio.pause(); showUI(); });
document.getElementById("back").addEventListener("click", (e) => { e.stopPropagation(); audio.currentTime = Math.max(0, audio.currentTime - 15); showUI(); });
document.getElementById("fwd").addEventListener("click", (e) => { e.stopPropagation(); audio.currentTime = Math.min(duration(), audio.currentTime + 15); showUI(); });
document.getElementById("cc").addEventListener("click", (e) => { e.stopPropagation(); capOn = !capOn; e.currentTarget.classList.toggle("off", !capOn); showUI(); });
audio.addEventListener("play", () => { playBtn.textContent = "❚❚"; showUI(); });
audio.addEventListener("pause", () => { playBtn.textContent = "▶"; ui.classList.remove("hide"); });
function seekFrom(ev) { const r = bar.getBoundingClientRect(); const x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left; audio.currentTime = clamp(x / r.width, 0, 1) * duration(); showUI(); }
let dragging = false;
bar.addEventListener("pointerdown", (e) => { e.stopPropagation(); dragging = true; seekFrom(e); });
window.addEventListener("pointermove", (e) => { if (dragging) seekFrom(e); });
window.addEventListener("pointerup", () => dragging = false);
startEl.addEventListener("click", () => { startEl.classList.add("gone"); document.body.classList.remove("idle"); audio.play().catch(() => {}); showUI(); });

function frame() {
  const t = PREVIEW ? previewT : audio.currentTime;
  render(t);
  captionAt(t);
  const d = duration();
  fillEl.style.width = (100 * t / d) + "%";
  timeEl.textContent = `${fmt(t)} / ${fmt(d)}`;
  const ch = chapterAt(t); if (ch && chapEl.textContent !== ch) chapEl.textContent = ch;
  if (!PREVIEW) requestAnimationFrame(frame);
}

// preview / screenshot support: index.html?t=123.4
let previewT = parseFloat(params.get("t") || "0");
window.renderAt = (t) => { previewT = t; frame(); };
if (PREVIEW) { document.body.classList.remove("idle"); startEl.style.display = "none"; ui.style.display = "none"; document.getElementById("top").style.display = "none"; frame(); }
else requestAnimationFrame(frame);
