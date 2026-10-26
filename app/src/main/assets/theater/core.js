// StoryGlow Theater — core: math, colour, camera, parallax layers, particles.
// World units: y 0 (top) .. 1000 (bottom); ground line ~ GROUND. x roughly 0..2000.
"use strict";

const GROUND = 780;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- utils
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function easeInOut(t) { t = clamp(t, 0, 1); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

// deterministic RNG so scenery is identical every frame
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}

// colours as [r,g,b]
function hex(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function rgba(c, a = 1) { return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }

// ---------------------------------------------------------------- skies / palettes
// sil = silhouette (foreground) colour, haze = far atmosphere, light = key light (rim + glows)
const SKIES = {
  night:  { top: "#070b1f", mid: "#17204a", bot: "#36407a", haze: "#3d4680", light: "#cdd8ff", sil: "#04050c", body: "moon", stars: 1 },
  deepnight: { top: "#04060f", mid: "#0c1230", bot: "#1d2450", haze: "#232a58", light: "#b9c8ff", sil: "#020308", body: "moon", stars: 1 },
  dusk:   { top: "#1c1745", mid: "#6a3a6c", bot: "#f2905c", haze: "#a86476", light: "#ffb37a", sil: "#120a18", body: "sunlow", stars: .3 },
  dawn:   { top: "#2a3a6c", mid: "#9a8ab6", bot: "#f7c79c", haze: "#bea6b8", light: "#ffe2b8", sil: "#18131f", body: "sunrise", stars: 0 },
  day:    { top: "#5f9dc4", mid: "#a5cfd0", bot: "#efe6b8", haze: "#9fc2ac", light: "#fff4c6", sil: "#0d1712", body: "sun", stars: 0 },
  gloom:  { top: "#17221f", mid: "#2f4842", bot: "#62806a", haze: "#4b695d", light: "#dcf3c2", sil: "#060c0a", body: "none", stars: 0 },
  sweet:  { top: "#3b2357", mid: "#a65d8c", bot: "#ffc9a3", haze: "#c98aa0", light: "#ffe6c4", sil: "#1a0f1c", body: "sunlow", stars: .2 },
  ember:  { top: "#120504", mid: "#3b0f08", bot: "#7a2a10", haze: "#5a2414", light: "#ffb060", sil: "#070201", body: "none", stars: 0 },
  hearth: { top: "#1a0e08", mid: "#3a2014", bot: "#6b3a1e", haze: "#4a2a18", light: "#ffc27a", sil: "#0a0503", body: "none", stars: 0 },
  lake:   { top: "#4b86b5", mid: "#9cc6d6", bot: "#f3e8c4", haze: "#a7c6c4", light: "#fff6d2", sil: "#0e1a1c", body: "sun", stars: 0 },
};
function skyOf(name) {
  const s = SKIES[name] || SKIES.night;
  if (!s._c) s._c = { top: hex(s.top), mid: hex(s.mid), bot: hex(s.bot), haze: hex(s.haze), light: hex(s.light), sil: hex(s.sil) };
  return s;
}

// ---------------------------------------------------------------- camera / view
class View {
  constructor(ctx, w, h) { this.ctx = ctx; this.resize(w, h); this.cx = 1000; this.cy = 500; this.z = 1; }
  resize(w, h) { this.w = w; this.h = h; this.base = h / 1000; }
  // f = parallax factor: 0 → fixed to screen, 1 → moves with the stage, >1 → foreground
  layer(f) {
    const z = 1 + (this.z - 1) * f;
    const cx = 1000 + (this.cx - 1000) * f;
    const cy = 500 + (this.cy - 500) * f;
    const s = this.base * z;
    this.ctx.setTransform(s, 0, 0, s, this.w / 2 - cx * s, this.h / 2 - cy * s);
  }
  screen() { this.ctx.setTransform(1, 0, 0, 1, 0, 0); }
  // visible world-x range for a layer (for culling / tiling)
  span(f) {
    const z = 1 + (this.z - 1) * f; const cx = 1000 + (this.cx - 1000) * f;
    const half = (this.w / (this.base * z)) / 2;
    return [cx - half, cx + half];
  }
}

// ---------------------------------------------------------------- particles
class Particles {
  constructor(kind, n, seed) {
    this.kind = kind; const r = rng(seed); this.p = [];
    for (let i = 0; i < n; i++) this.p.push({ x: r(), y: r(), z: .4 + r() * .9, a: r() * TAU, s: r() });
  }
  draw(ctx, view, t, sky, strength = 1) {
    const k = this.kind, L = sky._c.light;
    view.screen();
    const W = view.w, H = view.h, u = view.base;
    for (const q of this.p) {
      let x, y, r, al;
      switch (k) {
        case "fireflies": {
          x = (q.x * W + Math.sin(t * .3 * q.z + q.a) * 40 * u) % W; y = H * (.45 + q.y * .45) + Math.sin(t * .5 + q.a * 3) * 25 * u;
          r = (2 + q.s * 2.5) * u; al = (.5 + .5 * Math.sin(t * (1.5 + q.s * 2) + q.a)) * .9 * strength;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
          g.addColorStop(0, `rgba(255,240,170,${al})`); g.addColorStop(1, "rgba(255,240,170,0)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 6, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(255,252,220,${al})`; ctx.beginPath(); ctx.arc(x, y, r * .7, 0, TAU); ctx.fill();
          break;
        }
        case "motes": {
          x = ((q.x + t * .006 * q.z) % 1) * W; y = ((q.y + t * .004 * q.z + Math.sin(t * .4 + q.a) * .01) % 1) * H;
          r = (1 + q.s * 2) * u * q.z; al = (.25 + .35 * Math.sin(t * .8 + q.a)) * strength;
          ctx.fillStyle = rgba(L, Math.max(0, al)); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          break;
        }
        case "leaves": {
          const fall = (q.y + t * .035 * q.z) % 1.1 - .05;
          x = ((q.x + Math.sin(t * .6 + q.a) * .03 + t * .01) % 1) * W; y = fall * H;
          ctx.save(); ctx.translate(x, y); ctx.rotate(t * (1 + q.s) + q.a); ctx.scale(1, Math.sin(t * 2 + q.a));
          ctx.fillStyle = rgba(mixc([150, 90, 40], sky._c.sil, .35), .85 * strength);
          ctx.beginPath(); ctx.ellipse(0, 0, 7 * u * q.z, 3.5 * u * q.z, 0, 0, TAU); ctx.fill(); ctx.restore();
          break;
        }
        case "snow": {
          x = ((q.x + Math.sin(t * .5 + q.a) * .01) % 1) * W; y = ((q.y + t * .03 * q.z) % 1) * H;
          ctx.fillStyle = `rgba(255,255,255,${.8 * strength})`; ctx.beginPath(); ctx.arc(x, y, (1.5 + q.s * 2.5) * u * q.z, 0, TAU); ctx.fill();
          break;
        }
        case "embers": {
          const rise = 1 - ((q.y + t * .05 * q.z) % 1);
          x = (q.x * W + Math.sin(t * 1.3 + q.a) * 20 * u); y = rise * H;
          al = (rise) * .9 * strength; r = (1.5 + q.s * 2) * u;
          ctx.fillStyle = `rgba(255,${150 + q.s * 80 | 0},60,${al})`; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          break;
        }
        case "sparkle": {
          x = q.x * W; y = H * (.35 + q.y * .5); al = Math.max(0, Math.sin(t * (2 + q.s * 3) + q.a)) * strength;
          r = (4 + q.s * 6) * u * al;
          ctx.strokeStyle = `rgba(255,250,220,${al})`; ctx.lineWidth = 1.2 * u;
          ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
          break;
        }
        case "rain": {
          x = (q.x * W + t * 40 * u) % W; y = ((q.y + t * .9 * q.z) % 1) * H;
          ctx.strokeStyle = `rgba(200,215,240,${.35 * strength})`; ctx.lineWidth = 1.2 * u;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4 * u, y + 22 * u); ctx.stroke();
          break;
        }
      }
    }
  }
}

// ---------------------------------------------------------------- sky painter
const _stars = (() => { const r = rng(77); const a = []; for (let i = 0; i < 160; i++) a.push([r(), r() * .62, r(), r()]); return a; })();

function paintSky(ctx, view, t, sky, opts = {}) {
  const c = sky._c;
  view.screen();
  const W = view.w, H = view.h;
  const g = ctx.createLinearGradient(0, 0, 0, H * .82);
  g.addColorStop(0, rgba(c.top)); g.addColorStop(.55, rgba(c.mid)); g.addColorStop(1, rgba(c.bot));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  if (sky.stars) for (const s of _stars) {
    const a = sky.stars * (.35 + .65 * (.5 + .5 * Math.sin(t * (.6 + s[3] * 1.4) + s[2] * 20)));
    ctx.fillStyle = `rgba(255,252,235,${a * (1 - s[1])})`;
    ctx.fillRect(s[0] * W, s[1] * H, 1 + s[2] * 1.6, 1 + s[2] * 1.6);
  }

  // celestial body, slightly parallaxed
  view.layer(.04);
  const body = opts.body || sky.body;
  if (body === "moon") {
    const mx = opts.moonX ?? 1320, my = opts.moonY ?? 190, mr = 46;
    const halo = ctx.createRadialGradient(mx, my, mr * .8, mx, my, mr * 7);
    halo.addColorStop(0, "rgba(220,230,255,.35)"); halo.addColorStop(1, "rgba(220,230,255,0)");
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(mx, my, mr * 7, 0, TAU); ctx.fill();
    ctx.fillStyle = "#f4f1e2"; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(200,196,180,.35)";
    ctx.beginPath(); ctx.arc(mx - 14, my - 8, 9, 0, TAU); ctx.arc(mx + 12, my + 14, 7, 0, TAU); ctx.arc(mx + 6, my - 18, 5, 0, TAU); ctx.fill();
  } else if (body === "sun" || body === "sunlow" || body === "sunrise") {
    const sx = opts.sunX ?? (body === "sun" ? 1350 : 640), sy = body === "sun" ? 170 : (body === "sunlow" ? 600 : 640);
    const sr = body === "sun" ? 55 : 80;
    const col = body === "sun" ? [255, 246, 214] : body === "sunlow" ? [255, 170, 100] : [255, 210, 160];
    const halo = ctx.createRadialGradient(sx, sy, sr * .5, sx, sy, sr * 9);
    halo.addColorStop(0, rgba(col, .55)); halo.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, sr * 9, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
  }

  // soft cloud bands
  if (opts.clouds !== false) {
    view.layer(.08);
    const cl = mixc(c.mid, c.light, .25);
    for (let i = 0; i < 5; i++) {
      const x = ((i * 530 + t * (6 + i * 2)) % 3200) - 600, y = 120 + (i % 3) * 70;
      ctx.fillStyle = rgba(cl, sky.body === "moon" ? .08 : .14);
      ctx.beginPath(); ctx.ellipse(x, y, 260, 26, 0, 0, TAU); ctx.ellipse(x + 140, y - 16, 170, 20, 0, 0, TAU); ctx.fill();
    }
  }
}

// colour of a scenery layer at depth d (0 = far/haze, 1 = foreground silhouette)
function depthColor(sky, d) { return mixc(sky._c.haze, sky._c.sil, clamp(d, 0, 1)); }

// soft horizontal mist band
function mist(ctx, view, sky, y, height, alpha, f = .5) {
  view.layer(f);
  const [a, b] = view.span(f);
  const g = ctx.createLinearGradient(0, y - height, 0, y + height);
  const col = mixc(sky._c.haze, sky._c.light, .3);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(.5, rgba(col, alpha)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.fillRect(a - 50, y - height, b - a + 100, height * 2);
}

// radial glow (windows, fires, ovens, pebbles)
function glow(ctx, x, y, r, col, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

// screen-space light shafts (god rays)
function lightShafts(ctx, view, t, sky, strength = 1, fromX = .7) {
  view.screen();
  const W = view.w, H = view.h; const L = sky._c.light;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 5; i++) {
    const x0 = W * (fromX + (i - 2) * .06) + Math.sin(t * .2 + i) * 10;
    const spread = W * (.08 + i * .015);
    const a = (.05 + .03 * Math.sin(t * .5 + i * 1.7)) * strength;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgba(L, a)); g.addColorStop(1, rgba(L, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x0 - 10, 0); ctx.lineTo(x0 + 10, 0); ctx.lineTo(x0 - W * .25 + spread, H); ctx.lineTo(x0 - W * .25 - spread, H); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function vignette(ctx, view, strength = .55) {
  view.screen();
  const W = view.w, H = view.h;
  const g = ctx.createRadialGradient(W / 2, H * .48, Math.min(W, H) * .25, W / 2, H * .5, Math.max(W, H) * .78);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
