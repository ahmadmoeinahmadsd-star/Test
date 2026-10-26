// StoryGlow Theater — articulated silhouette characters.
// Angles: limbs measured from straight down, positive = toward the way the figure faces.
"use strict";

const CAST = {
  hansel:     { h: 112, kind: "boy" },
  gretel:     { h: 106, kind: "girl" },
  father:     { h: 172, kind: "man" },
  stepmother: { h: 162, kind: "woman" },
  witch:      { h: 140, kind: "witch" },
  whitebird:  { h: 22, kind: "bird", color: [250, 250, 245], glow: true },
  birds:      { h: 14, kind: "flock" },
  duck:       { h: 120, kind: "duck" },
  mouse:      { h: 26, kind: "mouse" },
};

// ---------------------------------------------------------------- poses
const BASE = { hip: 0, lean: 0, head: 0, lT: 0, lK: 0, rT: 0, rK: 0, lA: .05, lE: .1, rA: -.05, rE: .1, rot: 0, rootY: 0, headFlip: false };

function walkPose(p, amp = .45, kneeAmt = .9) {
  const s = Math.sin(p), c = Math.cos(p);
  return {
    hip: -Math.abs(c) * .018, lean: .05,
    lT: s * amp, lK: Math.max(0, -s) * kneeAmt + .1, rT: -s * amp, rK: Math.max(0, s) * kneeAmt + .1,
    lA: -s * amp * .8, lE: .25, rA: s * amp * .8, rE: .25,
  };
}

const ACTS = {
  stand: (p) => ({ hip: Math.sin(p * .8) * .004, lA: .06, rA: -.04, lE: .12, rE: .1 }),
  walk: (p) => walkPose(p),
  run: (p) => { const w = walkPose(p, .85, 1.4); return { ...w, lean: .28, hip: -Math.abs(Math.cos(p)) * .04, lE: 1.3, rE: 1.3, lA: w.lA * 1.2, rA: w.rA * 1.2 }; },
  sneak: (p) => { const w = walkPose(p, .35, 1); return { ...w, hip: -.07, lean: .35, lK: w.lK + .5, rK: w.rK + .5, lA: .6, lE: .9, rA: .4, rE: .9 }; },
  creep: (p) => { const w = walkPose(p, .28, .8); return { ...w, hip: -.04, lean: .55, head: -.25, lA: 1.0 + Math.sin(p) * .1, lE: .2, rA: .2, rE: .5 }; },
  talk: (p) => ({ hip: Math.sin(p * .8) * .004, head: Math.sin(p * 2.2) * .06, lA: .1, lE: .2, rA: .55 + Math.sin(p * 1.7) * .35, rE: .9 + Math.sin(p * 2.3) * .3 }),
  sad: (p) => ({ hip: -.01, lean: .12, head: .45, lA: .1, lE: .05, rA: .05, rE: .05 }),
  listen: (p) => ({ hip: -.03, lean: .25, head: -.1 + Math.sin(p * .5) * .03, lA: .7, lE: 1.6, rA: .3, rE: 1.2, lK: .3, rK: .3, lT: .15, rT: -.1 }),
  lookback: (p) => ({ ...walkPose(p * .5, .2, .4), headFlip: true, head: -.1, rA: -.3, rE: .2 }),
  sit: (p) => ({ rootY: -.25 * 0, hip: -.24, lT: 1.45, lK: 1.55, rT: 1.35, rK: 1.45, lean: -.05 + Math.sin(p * .7) * .01, lA: .5, lE: .9, rA: .4, rE: 1.0, head: .1 }),
  huddle: (p) => ({ hip: -.26, lT: 1.9, lK: 2.5, rT: 1.8, rK: 2.4, lean: .35 + Math.sin(p * .6) * .015, head: .35, lA: 1.2, lE: 1.1, rA: 1.1, rE: 1.2 }),
  sleep: (p) => ({ rot: -Math.PI / 2, rootY: .07, lT: .05, rT: -.05, lK: .1, rK: .2, lA: .2, lE: .4, rA: -.1, rE: .3, head: -.15 + Math.sin(p * .5) * .01 }),
  crouch: (p) => { const b = Math.sin(p * 2); return { hip: -.12, lean: .9 + b * .08, head: .2, lT: .9, lK: 1.6, rT: .5, rK: 1.2, lA: 1.2 + b * .25, lE: .2, rA: .8, rE: .4 }; },
  crumble: (p) => ({ hip: 0, lean: .1, lA: .9 + Math.sin(p * 3) * .15, lE: .6, rA: .6, rE: .3, head: .25 }),
  reach: (p) => ({ hip: .02 + Math.sin(p * 2) * .006, lean: -.06, head: -.45, lA: 2.7 + Math.sin(p * 2) * .1, lE: .1, rA: 2.4 + Math.cos(p * 2) * .1, rE: .2, lT: .05, rT: -.05 }),
  eat: (p) => ({ hip: Math.sin(p * 3) * .004, head: Math.sin(p * 3) * .05, lA: 1.2 + Math.sin(p * 3) * .25, lE: 2.0, rA: .4, rE: .9 }),
  push: (p) => ({ hip: -.04, lean: .5, lT: .55, lK: .5, rT: -.5, rK: .2, lA: 1.55, lE: .05, rA: 1.45, rE: .1, head: -.15 }),
  fall: (p) => ({ hip: -.05, lean: .95, lT: .4, lK: .3, rT: -.6, rK: .5, lA: -2.2 + Math.sin(p * 4) * .4, lE: -.6, rA: -2.6 + Math.cos(p * 4) * .4, rE: -.4, head: -.5 }),
  hug: (p) => ({ hip: Math.sin(p) * .006, lean: .12, lA: 1.25, lE: 1.3, rA: 1.15, rE: 1.4, head: .15 }),
  cower: (p) => ({ hip: -.1, lean: .4, lK: .6, rK: .6, lT: .25, rT: -.05, lA: 2.3, lE: 2.2, rA: 2.0, rE: 2.3, head: .5 + Math.sin(p * 6) * .02 }),
  point: (p) => ({ lA: 1.6, lE: .02, rA: .1, rE: .2, head: -.05 }),
  joy: (p) => ({ hip: Math.abs(Math.sin(p * 2.5)) * .05, lA: 2.8 + Math.sin(p * 5) * .2, lE: .2, rA: 2.6 + Math.cos(p * 5) * .2, rE: .3, head: -.2 }),
  hold: (p) => ({ lA: 1.9, lE: .3 + Math.sin(p) * .05, rA: 2.0, rE: .25, head: -.2, hip: Math.sin(p) * .004 }),   // hands on the bars
  offer: (p) => ({ lA: 1.55, lE: 0, rA: .3, rE: .4, head: .05, hip: -.01 }),                                        // stretching out the bone
  grope: (p) => ({ hip: -.04, lean: .55, head: -.1, lA: 1.25 + Math.sin(p * 1.5) * .15, lE: .2, rA: .3, rE: .4, lT: .2, rT: -.1, lK: .3, rK: .2 }),
  chop: (p) => { const k = (Math.sin(p * 1.6) + 1) / 2; return { lean: .1 + k * .2, lA: 3.0 - k * 1.7, lE: .1, rA: 2.9 - k * 1.7, rE: .15, lT: .25, rT: -.25 }; },
  carry: (p) => ({ ...walkPose(p), lA: 2.6, lE: 2.3 }),
  ride: (p) => ({ hip: -.24 + Math.sin(p) * .006, lT: 1.5, lK: 1.6, rT: 1.4, rK: 1.5, lA: .9, lE: .5, rA: .7, rE: .5, head: -.1 }),
  peer: (p) => ({ hip: -.02, lean: .45, head: -.25 + Math.sin(p) * .05, lA: 1.0, lE: .3, rA: .4, rE: .5 }),
  dance: (p) => ({ ...walkPose(p * 1.4, .4, .8), hip: Math.abs(Math.sin(p * 2.8)) * .04, lA: 2.2 + Math.sin(p * 2.8) * .4, lE: .5, rA: 1.0 + Math.cos(p * 2.8) * .4, rE: .9, lean: -.05 }),
};

const MOVING = new Set(["walk", "run", "sneak", "creep", "carry", "lookback", "dance", "scurry"]);
const STRIDE = { walk: .55, run: .9, sneak: .3, creep: .28, carry: .55, lookback: .4, dance: .45, scurry: 1.2 };

function poseFor(act, p) { return { ...BASE, ...(ACTS[act] || ACTS.stand)(p) }; }
function blendPose(a, b, k) {
  const o = {}; for (const key in BASE) o[key] = typeof BASE[key] === "number" ? lerp(a[key], b[key], k) : (k < .5 ? a[key] : b[key]);
  return o;
}

// ---------------------------------------------------------------- drawing
function seg(ctx, x1, y1, x2, y2, w) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function limb2(ctx, x, y, a1, l1, a2, l2, w1, w2) {
  const kx = x + Math.sin(a1) * l1, ky = y + Math.cos(a1) * l1;
  seg(ctx, x, y, kx, ky, w1);
  const ex = kx + Math.sin(a2) * l2, ey = ky + Math.cos(a2) * l2;
  seg(ctx, kx, ky, ex, ey, w2);
  return [ex, ey];
}

// Draws a humanoid at (0,0)=feet, facing +x, height H. col = fill colour string.
function drawHumanoid(ctx, kind, H, P, col, t, extra = {}) {
  ctx.save();
  ctx.translate(0, -P.rootY * H);
  if (P.rot) ctx.rotate(P.rot);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round";

  const child = kind === "boy" || kind === "girl";
  const headR = H * (child ? .095 : .07);
  const hipY = -H * (.48 + P.hip);
  const torsoL = H * (child ? .27 : .31);
  const thigh = H * .25, shin = H * .24, upper = H * .17, fore = H * .16;
  const legW = H * (child ? .07 : .065), armW = H * (child ? .055 : .05);
  const lean = P.lean;
  const shX = Math.sin(lean) * torsoL, shY = hipY - Math.cos(lean) * torsoL;
  const longSkirt = kind === "woman" || kind === "witch";

  // back limbs (slightly darker)
  ctx.save(); ctx.globalAlpha = .82;
  if (!longSkirt || P.rot) limb2(ctx, 0, hipY, P.rT, thigh, P.rT - P.rK, shin, legW, legW * .8);
  else limb2(ctx, 0, hipY, P.rT * .5, thigh, (P.rT - P.rK) * .5, shin, legW * .8, legW * .7);
  limb2(ctx, shX, shY, P.rA, upper, P.rA + P.rE, fore, armW, armW * .85);
  ctx.restore();

  // torso / clothes
  ctx.save(); ctx.translate(0, hipY); ctx.rotate(lean);
  if (kind === "girl") {
    ctx.beginPath(); ctx.moveTo(-H * .07, -torsoL); ctx.lineTo(H * .07, -torsoL);
    ctx.lineTo(H * .17, H * .2); ctx.quadraticCurveTo(0, H * .23, -H * .17, H * .2); ctx.closePath(); ctx.fill();
  } else if (kind === "woman") {
    ctx.beginPath(); ctx.moveTo(-H * .06, -torsoL); ctx.lineTo(H * .06, -torsoL);
    ctx.lineTo(H * .2, H * .46); ctx.quadraticCurveTo(0, H * .5, -H * .2, H * .46); ctx.closePath(); ctx.fill();
  } else if (kind === "witch") {
    ctx.beginPath(); ctx.moveTo(-H * .09, -torsoL * 1.05); ctx.quadraticCurveTo(H * .1, -torsoL * 1.15, H * .1, -torsoL * .6);
    ctx.lineTo(H * .22, H * .45);
    for (let i = 0; i < 6; i++) ctx.lineTo(H * (.22 - (i + .5) * .075), H * (.45 + (i % 2 ? .02 : -.03))); // ragged hem
    ctx.lineTo(-H * .24, H * .45); ctx.closePath(); ctx.fill();
  } else if (kind === "man") {
    ctx.beginPath(); ctx.roundRect(-H * .075, -torsoL * 1.02, H * .15, torsoL * 1.15, H * .04); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-H * .075, 0); ctx.lineTo(H * .075, 0); ctx.lineTo(H * .09, H * .14); ctx.lineTo(-H * .09, H * .14); ctx.closePath(); ctx.fill(); // coat skirt
  } else { // boy
    ctx.beginPath(); ctx.roundRect(-H * .07, -torsoL * 1.02, H * .14, torsoL * 1.1, H * .04); ctx.fill();
  }
  ctx.restore();

  // front limbs
  if (!longSkirt || P.rot) limb2(ctx, 0, hipY, P.lT, thigh, P.lT - P.lK, shin, legW, legW * .8);
  else limb2(ctx, 0, hipY, P.lT * .5, thigh, (P.lT - P.lK) * .5, shin, legW * .8, legW * .7);
  const hand = limb2(ctx, shX, shY, P.lA, upper, P.lA + P.lE, fore, armW, armW * .85);

  // head
  const nx = shX + Math.sin(lean) * H * .02, ny = shY - H * .015;
  const hx = nx + Math.sin(lean + P.head * .5) * headR * 1.25, hy = ny - Math.cos(lean) * headR * 1.25;
  seg(ctx, nx, ny + H * .01, hx, hy, H * .04);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(P.head * .6 + lean * .4); if (P.headFlip) ctx.scale(-1, 1);
  ctx.beginPath(); ctx.arc(0, 0, headR, 0, TAU); ctx.fill();
  // profile nose
  ctx.beginPath();
  if (kind === "witch") { ctx.moveTo(headR * .8, -headR * .3); ctx.quadraticCurveTo(headR * 1.9, headR * .1, headR * 1.5, headR * .7); ctx.lineTo(headR * .8, headR * .3); }
  else { ctx.moveTo(headR * .9, -headR * .15); ctx.lineTo(headR * 1.22, headR * .2); ctx.lineTo(headR * .9, headR * .3); }
  ctx.fill();
  if (kind === "witch") { // chin, hood, red eyes
    ctx.beginPath(); ctx.moveTo(headR * .5, headR * .7); ctx.lineTo(headR * 1.1, headR * 1.1); ctx.lineTo(headR * .2, headR * .95); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-headR * 1.5, headR * 1.6); ctx.quadraticCurveTo(-headR * 1.6, -headR * 1.6, headR * .4, -headR * 1.35); ctx.quadraticCurveTo(headR * .9, -headR * 1.1, headR * .7, -headR * .5); ctx.lineTo(-headR * .2, headR * 1.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,${50 + 30 * Math.sin(t * 3) | 0},40,.95)`; ctx.beginPath(); ctx.arc(headR * .45, -headR * .15, headR * .16, 0, TAU); ctx.fill();
    glow(ctx, headR * .45, -headR * .15, headR * .9, [255, 60, 40], .35);
  }
  ctx.fillStyle = col;
  if (kind === "boy") { // cap
    ctx.beginPath(); ctx.ellipse(-headR * .1, -headR * .55, headR * 1.05, headR * .55, -.1, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(headR * .7, -headR * .5, headR * .65, headR * .14, .1, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-headR * .9, -headR * .2, headR * .35, 0, TAU); ctx.fill();
  } else if (kind === "girl") { // braids that swing
    const sw = Math.sin(t * 4) * .15 + (extra.moving ? Math.sin(extra.phase) * .25 : 0);
    for (const o of [-.15, .15]) {
      ctx.save(); ctx.translate(-headR * .75, headR * o); ctx.rotate(.35 + sw);
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(0, headR * (.4 + k * .42), headR * .2, headR * .26, 0, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, -headR * .15, headR * 1.08, Math.PI * .9, Math.PI * 2.05); ctx.fill();
  } else if (kind === "man") { // woodcutter hat and beard
    ctx.beginPath(); ctx.moveTo(-headR * 1.2, -headR * .55); ctx.lineTo(headR * 1.3, -headR * .55); ctx.lineTo(headR * .7, -headR * .75); ctx.quadraticCurveTo(0, -headR * 1.9, -headR * .7, -headR * .75); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(headR * .2, headR * .3); ctx.quadraticCurveTo(headR * 1.0, headR * .5, headR * .6, headR * 1.45); ctx.quadraticCurveTo(-headR * .1, headR * 1.2, -headR * .3, headR * .5); ctx.closePath(); ctx.fill();
  } else if (kind === "woman") { // bun
    ctx.beginPath(); ctx.arc(-headR * .85, -headR * .55, headR * .55, 0, TAU); ctx.fill();
  }
  ctx.restore();

  // props in hand
  if (extra.crutch) { ctx.strokeStyle = col; seg(ctx, hand[0], hand[1], hand[0] + H * .08, 0, H * .025); ctx.beginPath(); ctx.ellipse(hand[0], hand[1] - H * .01, H * .045, H * .02, 0, 0, TAU); ctx.fill(); }
  if (extra.axe) {
    ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(-.9 + (P.lA - 2.6) * .5);
    seg(ctx, 0, H * .04, 0, -H * .32, H * .022);
    ctx.beginPath(); ctx.moveTo(0, -H * .3); ctx.lineTo(H * .1, -H * .34); ctx.lineTo(H * .1, -H * .22); ctx.lineTo(0, -H * .25); ctx.fill(); ctx.restore();
  }
  if (extra.bone) { ctx.fillStyle = "#e8e2d0"; ctx.save(); ctx.translate(hand[0], hand[1]); ctx.rotate(-.2); ctx.fillRect(0, -H * .012, H * .16, H * .024); ctx.beginPath(); ctx.arc(H * .16, -H * .014, H * .02, 0, TAU); ctx.arc(H * .16, H * .014, H * .02, 0, TAU); ctx.fill(); ctx.restore(); }
  if (extra.bread) { ctx.fillStyle = "#c99a5b"; ctx.beginPath(); ctx.ellipse(hand[0], hand[1], H * .05, H * .03, .3, 0, TAU); ctx.fill(); }
  if (extra.cake) { ctx.fillStyle = "#e9c48c"; ctx.beginPath(); ctx.arc(hand[0], hand[1], H * .045, 0, TAU); ctx.fill(); ctx.fillStyle = "#f6eee6"; ctx.beginPath(); ctx.arc(hand[0], hand[1] - H * .02, H * .03, Math.PI, TAU); ctx.fill(); }
  if (extra.pebble) { glow(ctx, hand[0], hand[1], H * .12, [220, 230, 255], .5); ctx.fillStyle = "#eef2ff"; ctx.beginPath(); ctx.arc(hand[0], hand[1], H * .025, 0, TAU); ctx.fill(); }
  if (extra.jewels) { glow(ctx, hand[0], hand[1], H * .2, [255, 210, 120], .5); for (let i = 0; i < 5; i++) { ctx.fillStyle = ["#ffd75a", "#f0506e", "#5ac8ff", "#ffffff", "#78f0a0"][i]; ctx.beginPath(); ctx.arc(hand[0] + (i - 2) * H * .02, hand[1] - (i % 2) * H * .02, H * .018, 0, TAU); ctx.fill(); } }
  ctx.restore();
}

function drawBird(ctx, H, p, col, glowIt, perched) {
  if (glowIt) glow(ctx, 0, -H * .3, H * 3, [255, 255, 240], .35);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(0, -H * .3, H * .55, H * .32, -.15, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(H * .5, -H * .62, H * .24, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(H * .7, -H * .66); ctx.lineTo(H * .98, -H * .6); ctx.lineTo(H * .7, -H * .55); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-H * .45, -H * .35); ctx.lineTo(-H * 1.1, -H * .55); ctx.lineTo(-H * 1.0, -H * .22); ctx.fill();
  const flap = perched ? -.2 + Math.sin(p * .5) * .05 : Math.sin(p) * 1.0;
  ctx.save(); ctx.translate(-H * .05, -H * .4); ctx.rotate(-flap);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-H * .4, -H * .9, -H * .95, -H * 1.0); ctx.quadraticCurveTo(-H * .5, -H * .3, 0, H * .12); ctx.fill(); ctx.restore();
  if (perched) { ctx.strokeStyle = col; ctx.lineWidth = H * .07; ctx.beginPath(); ctx.moveTo(0, -H * .05); ctx.lineTo(-H * .05, H * .1); ctx.moveTo(H * .15, -H * .05); ctx.lineTo(H * .15, H * .1); ctx.stroke(); }
}

function drawDuck(ctx, H, p, col) {
  const bob = Math.sin(p) * H * .03;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(0, -H * .2 + bob, H * .62, H * .26, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-H * .55, -H * .25 + bob); ctx.lineTo(-H * .85, -H * .48 + bob); ctx.lineTo(-H * .5, -H * .1 + bob); ctx.fill();
  ctx.lineCap = "round"; ctx.strokeStyle = col; ctx.lineWidth = H * .16;
  ctx.beginPath(); ctx.moveTo(H * .4, -H * .3 + bob); ctx.quadraticCurveTo(H * .62, -H * .55 + bob, H * .52, -H * .8 + bob); ctx.stroke();
  ctx.beginPath(); ctx.arc(H * .55, -H * .85 + bob, H * .14, 0, TAU); ctx.fill();
  ctx.fillStyle = "#f2a33a"; ctx.beginPath(); ctx.moveTo(H * .64, -H * .88 + bob); ctx.lineTo(H * .86, -H * .82 + bob); ctx.lineTo(H * .64, -H * .76 + bob); ctx.fill();
  ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(H * .58, -H * .89 + bob, H * .025, 0, TAU); ctx.fill();
  // wake ripples
  ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 2;
  for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(-H * .2 * i, -H * .02, H * (.5 + i * .3), H * .05 * i, 0, 0, TAU); ctx.globalAlpha = .5 / i; ctx.stroke(); }
  ctx.globalAlpha = 1;
}

function drawFlock(ctx, H, p, col, n = 9, pecking = true, t = 0) {
  const r = rng(91);
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const x = (r() - .5) * H * 30, ph = p + i;
    ctx.save(); ctx.translate(x, 0);
    if (pecking) {
      const d = Math.max(0, Math.sin(ph * 1.7)) * .7;
      ctx.rotate(d * .6);
      ctx.beginPath(); ctx.ellipse(0, -H * .4, H * .6, H * .38, -.1, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(H * .55, -H * .65, H * .28, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(H * .8, -H * .7); ctx.lineTo(H * 1.15, -H * .6); ctx.lineTo(H * .8, -H * .55); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-H * .5, -H * .45); ctx.lineTo(-H * 1.1, -H * .65); ctx.lineTo(-H * .9, -H * .3); ctx.fill();
    } else {
      const y = -H * (3 + r() * 8) - (t % 4) * 0;
      const f = Math.sin(ph * 3) * .9;
      ctx.translate(0, y);
      ctx.beginPath(); ctx.moveTo(-H * 1.2, -f * H); ctx.quadraticCurveTo(-H * .4, -H * .2, 0, 0); ctx.quadraticCurveTo(H * .4, -H * .2, H * 1.2, -f * H); ctx.quadraticCurveTo(H * .4, H * .2, 0, H * .3); ctx.quadraticCurveTo(-H * .4, H * .2, -H * 1.2, -f * H); ctx.fill();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- actor evaluation from keys
// keys: [{t, x, y?, act, face?, ...extras}]  — times relative to shot start
function evalActor(a, lt) {
  const ks = a.keys;
  let i = 0; while (i < ks.length - 1 && ks[i + 1].t <= lt) i++;
  const k0 = ks[i], k1 = ks[Math.min(i + 1, ks.length - 1)];
  const span = Math.max(.001, k1.t - k0.t);
  const raw = k1 === k0 ? 0 : clamp((lt - k0.t) / span, 0, 1);
  const moving = MOVING.has(k0.act) || k0.act === "fly" || k0.act === "swim";
  const u = moving ? raw : easeInOut(raw);
  const x = lerp(k0.x, k1.x ?? k0.x, u);
  const y = lerp(k0.y ?? 0, k1.y ?? k0.y ?? 0, u);
  // distance travelled → walk phase (no foot sliding)
  let dist = 0;
  for (let j = 0; j < i; j++) dist += Math.abs((ks[j + 1].x ?? ks[j].x) - ks[j].x);
  dist += Math.abs(x - k0.x);
  let face = k0.face ?? (k1.x !== undefined && k1.x !== k0.x ? Math.sign(k1.x - k0.x) : (a._lastFace || 1));
  a._lastFace = face;
  return { k0, k1, x, y, face, dist, raw, act: k0.act || "stand" };
}

function drawActor(ctx, view, sky, a, lt, shotT) {
  const st = evalActor(a, lt);
  const def = CAST[a.who] || CAST.hansel;
  const H = def.h * (a.scale || 1);
  const f = a.depth ?? 1;
  view.layer(f);

  const silCol = a.color ? rgba(a.color) : rgba(mixc(sky._c.sil, [0, 0, 0], .2));
  const rim = rgba(sky._c.light, .55);
  const lightDir = a.light ?? 1;

  let phase;
  if (MOVING.has(st.act)) phase = (st.dist / (H * (STRIDE[st.act] || .55))) * Math.PI;
  else phase = shotT * (st.act === "fly" ? 9 : 2.2) + (a.seed || 0);

  // blend pose briefly when the act changes
  let P = poseFor(st.act, phase);
  const prevAct = a.keys[Math.max(0, a.keys.indexOf(st.k0) - 1)]?.act;
  const sinceChange = lt - st.k0.t;
  if (prevAct && prevAct !== st.act && sinceChange < .5) P = blendPose(poseFor(prevAct, phase), P, smooth(sinceChange / .5));

  const extras = { ...(a.extras || {}), ...(st.k0.extras || {}), moving: MOVING.has(st.act), phase };
  ctx.save();
  ctx.translate(st.x, GROUND + (a.ground ?? 0) - st.y);
  ctx.scale(st.face, 1);

  const kind = def.kind;
  const paint = (col) => {
    if (kind === "bird") drawBird(ctx, H, phase, col, false, st.act === "perch");
    else if (kind === "flock") drawFlock(ctx, H, phase, col, a.count || 9, st.act !== "fly", shotT);
    else if (kind === "duck") drawDuck(ctx, H, phase, col);
    else if (kind === "mouse") { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -H * .4, H * .7, H * .4, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(H * .65, -H * .5, H * .3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(H * .5, -H * .85, H * .2, 0, TAU); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = H * .08; ctx.beginPath(); ctx.moveTo(-H * .65, -H * .35); ctx.quadraticCurveTo(-H * 1.4, -H * .9 + Math.sin(phase) * H * .3, -H * 2, -H * .4); ctx.stroke(); for (const lx of [-.3, .3]) { ctx.beginPath(); ctx.moveTo(H * lx, -H * .1); ctx.lineTo(H * lx + Math.sin(phase * 2 + lx * 9) * H * .2, 0); ctx.stroke(); } }
    else drawHumanoid(ctx, kind, H, P, col, shotT, extras);
  };
  if (kind === "bird" && def.glow) glow(ctx, 0, -H * .3, H * 4, [255, 255, 235], .3);

  if (kind !== "bird" && kind !== "duck" && kind !== "mouse") {
    // rim light: an offset copy in the key-light colour behind the silhouette
    ctx.save(); ctx.translate(lightDir * st.face * H * .012, -H * .006); paint(rim); ctx.restore();
  }
  paint(kind === "bird" || kind === "duck" ? rgba(def.color || [248, 248, 244]) : silCol);
  ctx.restore();
}
