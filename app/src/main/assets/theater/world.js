// StoryGlow Theater — scenery: procedural silhouette landscapes, buildings, interiors.
"use strict";

const _cache = new Map();
function cached(key, make) { if (!_cache.has(key)) _cache.set(key, make()); return _cache.get(key); }

// ---------------------------------------------------------------- shape builders (Path2D)
function hillPath(seed, baseY, amp, x0 = -1600, x1 = 3600) {
  return cached(`hill${seed}|${baseY}|${amp}`, () => {
    const r = rng(seed), p = new Path2D();
    const f1 = .002 + r() * .002, f2 = .006 + r() * .004, o1 = r() * 10, o2 = r() * 10;
    p.moveTo(x0, 1200);
    for (let x = x0; x <= x1; x += 20) p.lineTo(x, baseY - amp * (.6 * Math.sin(x * f1 + o1) + .4 * Math.sin(x * f2 + o2)));
    p.lineTo(x1, 1200); p.closePath(); return p;
  });
}

function addPine(p, x, base, h, r) {
  const w = h * (.22 + r() * .06), tiers = 5 + (r() * 3 | 0);
  p.rect(x - h * .018, base - h * .2, h * .036, h * .2 + 40);
  for (let i = 0; i < tiers; i++) {
    const k = i / tiers, y = base - h * .12 - k * h * .85, tw = w * (1 - k * .8);
    p.moveTo(x, y - h * .2); p.lineTo(x - tw - r() * 6, y + 6); p.lineTo(x - tw * .4, y); p.lineTo(x + tw * .4, y); p.lineTo(x + tw + r() * 6, y + 6); p.closePath();
  }
}

function addBroadTree(p, x, base, h, r, lean = 0) {
  // tapered trunk
  const tw = h * .045;
  p.moveTo(x - tw * 1.6, base + 30); p.quadTo(x - tw, base - h * .3, x - tw * .6 + lean, base - h * .55);
  p.lineTo(x + tw * .6 + lean, base - h * .55); p.quadTo(x + tw, base - h * .3, x + tw * 1.6, base + 30); p.closePath();
  // branches
  for (let i = 0; i < 4; i++) {
    const by = base - h * (.35 + i * .08), dir = i % 2 ? 1 : -1, len = h * (.18 + r() * .1);
    p.moveTo(x + lean * .6, by); p.quadTo(x + dir * len * .5 + lean, by - len * .25, x + dir * len + lean, by - len * .5);
    p.lineTo(x + dir * len + lean, by - len * .5 + 4); p.quadTo(x + dir * len * .5 + lean, by - len * .2 + 6, x + lean * .6, by + 10); p.closePath();
  }
  // foliage clumps
  const cx = x + lean, cy = base - h * .72, R = h * .26;
  for (let i = 0; i < 14; i++) {
    const a = r() * TAU, d = r() * R * .85;
    const rr = R * (.35 + r() * .3);
    const px = cx + Math.cos(a) * d * 1.25, py = cy + Math.sin(a) * d * .75;
    p.moveTo(px + rr, py); p.arc(px, py, rr, 0, TAU);
  }
}

function treeline(seed, kind, baseY, count, hMin, hMax, x0 = -1400, x1 = 3400) {
  return cached(`tl${seed}|${kind}|${baseY}|${count}|${hMin}|${hMax}`, () => {
    const r = rng(seed), p = new Path2D();
    for (let i = 0; i < count; i++) {
      const x = lerp(x0, x1, (i + r() * .8) / count), h = lerp(hMin, hMax, r()), b = baseY + r() * 20;
      const k = kind === "mixed" ? (r() < .5 ? "pine" : "broad") : kind;
      if (k === "pine") addPine(p, x, b, h, r); else addBroadTree(p, x, b, h, r, (r() - .5) * 20);
    }
    p.rect(x0, baseY + 10, x1 - x0, 400);
    return p;
  });
}

function trunks(seed, baseY, count, wMin, wMax, x0 = -1400, x1 = 3400) {
  return cached(`tr${seed}|${baseY}|${count}`, () => {
    const r = rng(seed), p = new Path2D();
    for (let i = 0; i < count; i++) {
      const x = lerp(x0, x1, (i + r() * .7) / count), w = lerp(wMin, wMax, r());
      p.moveTo(x - w * .7, baseY + 40); p.quadTo(x - w * .5, baseY - 300, x - w * .45, -200);
      p.lineTo(x + w * .45, -200); p.quadTo(x + w * .5, baseY - 300, x + w * .7, baseY + 40); p.closePath();
      // roots
      p.moveTo(x - w * .6, baseY + 10); p.quadTo(x - w * 1.4, baseY + 15, x - w * 1.8, baseY + 30); p.lineTo(x - w * .2, baseY + 30); p.closePath();
      p.moveTo(x + w * .6, baseY + 10); p.quadTo(x + w * 1.3, baseY + 18, x + w * 1.7, baseY + 30); p.lineTo(x + w * .2, baseY + 30); p.closePath();
      // a side branch
      if (r() < .6) { const by = baseY - 250 - r() * 200, d = r() < .5 ? -1 : 1; p.moveTo(x, by); p.quadTo(x + d * 90, by - 40, x + d * 180, by - 120); p.lineTo(x + d * 176, by - 110); p.quadTo(x + d * 80, by - 20, x, by + 18); p.closePath(); }
    }
    return p;
  });
}

function groundWithGrass(seed, baseY, x0 = -1600, x1 = 3600) {
  return cached(`gr${seed}|${baseY}`, () => {
    const r = rng(seed), p = new Path2D();
    p.moveTo(x0, 1300); p.lineTo(x0, baseY);
    for (let x = x0; x <= x1; x += 9) {
      const blade = r() < .35 ? 6 + r() * 16 : r() * 3;
      p.lineTo(x + 3, baseY - blade + Math.sin(x * .01) * 4); p.lineTo(x + 7, baseY + Math.sin(x * .01) * 4);
    }
    p.lineTo(x1, 1300); p.closePath(); return p;
  });
}

function ferns(seed, baseY, count, size, x0 = -1400, x1 = 3400) {
  return cached(`fe${seed}|${baseY}|${count}|${size}`, () => {
    const r = rng(seed), p = new Path2D();
    for (let i = 0; i < count; i++) {
      const x = lerp(x0, x1, r()), s = size * (.6 + r() * .7);
      if (r() < .5) { // bush
        for (let k = 0; k < 6; k++) { const px = x + (r() - .5) * s * 1.6, py = baseY - r() * s * .6, rr = s * (.3 + r() * .3); p.moveTo(px + rr, py); p.arc(px, py, rr, 0, TAU); }
      } else { // fern fronds
        for (let k = 0; k < 7; k++) {
          const a = -Math.PI / 2 + (k - 3) * .32, L = s * (.9 + r() * .5);
          const ex = x + Math.cos(a) * L, ey = baseY + Math.sin(a) * L;
          p.moveTo(x - 3, baseY); p.quadTo(x + Math.cos(a) * L * .5 - 8, baseY + Math.sin(a) * L * .6, ex, ey);
          p.quadTo(x + Math.cos(a) * L * .5 + 8, baseY + Math.sin(a) * L * .6, x + 3, baseY); p.closePath();
        }
      }
    }
    return p;
  });
}

function fill(ctx, path, col, a = 1) { ctx.fillStyle = rgba(col, a); ctx.fill(path); }

// ---------------------------------------------------------------- buildings & props

function cottage(ctx, x, base, sky, t, P = {}) {
  const sil = mixc(sky._c.sil, sky._c.haze, .12);
  const p = cached(`cottage`, () => {
    const p = new Path2D();
    p.rect(-150, -170, 300, 175);                         // walls
    p.moveTo(-190, -160); p.lineTo(0, -330); p.lineTo(190, -160); p.lineTo(170, -150); p.lineTo(0, -300); p.lineTo(-170, -150); p.closePath(); // roof
    p.moveTo(-185, -158); p.lineTo(0, -326); p.lineTo(185, -158); p.closePath();
    p.rect(70, -330, 38, 110);                            // chimney
    p.rect(-260, -60, 8, 65); p.rect(-235, -60, 8, 65); p.rect(-210, -60, 8, 65); p.rect(-265, -50, 70, 8); // fence
    p.rect(200, -55, 8, 60); p.rect(225, -55, 8, 60); p.rect(195, -45, 50, 8);
    // woodpile
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4 - i; j++) { p.moveTo(-120 + j * 26 + i * 13 + 13, -12 - i * 24); p.arc(-120 + j * 26 + i * 13, -12 - i * 24, 13, 0, TAU); }
    return p;
  });
  ctx.save(); ctx.translate(x, base);
  // smoke
  for (let i = 0; i < 7; i++) {
    const k = ((t * .12 + i / 7) % 1);
    ctx.fillStyle = rgba(mixc(sky._c.haze, sky._c.light, .3), .22 * (1 - k));
    ctx.beginPath(); ctx.arc(89 + Math.sin(t * .7 + i) * 18 * k + k * 60, -340 - k * 260, 18 + k * 50, 0, TAU); ctx.fill();
  }
  fill(ctx, p, sil);
  // window
  const lit = P.window !== false;
  if (lit) { glow(ctx, -70, -95, 160, [255, 190, 110], .35 + .05 * Math.sin(t * 3)); }
  ctx.fillStyle = lit ? "#ffcf7a" : rgba(mixc(sil, sky._c.haze, .3));
  ctx.fillRect(-105, -125, 70, 60);
  ctx.fillStyle = rgba(sil); ctx.fillRect(-72, -125, 5, 60); ctx.fillRect(-105, -98, 70, 5);
  // door
  if (P.door === "open") {
    glow(ctx, 55, -55, 200, [255, 190, 110], .4);
    ctx.fillStyle = "#ffcf7a"; ctx.fillRect(30, -120, 55, 122);
  } else { ctx.fillStyle = rgba(mixc(sil, [0, 0, 0], .4)); ctx.fillRect(30, -120, 55, 122); }
  // cat on the roof (Hansel "looks back at his white cat")
  if (P.cat) {
    ctx.fillStyle = "#f2efe6";
    ctx.beginPath(); ctx.ellipse(-60, -262, 22, 13, -.6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(-44, -282, 10, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-50, -290); ctx.lineTo(-47, -302); ctx.lineTo(-42, -291); ctx.moveTo(-40, -291); ctx.lineTo(-35, -300); ctx.lineTo(-34, -287); ctx.fill();
    ctx.strokeStyle = "#f2efe6"; ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-80, -252); ctx.quadTo(-100, -250 + Math.sin(t * 2) * 6, -96, -275); ctx.stroke();
  }
  ctx.restore();
}

function gingerbreadHouse(ctx, x, base, sky, t, P = {}) {
  ctx.save(); ctx.translate(x, base);
  const dough = [92, 50, 28], dark = [40, 20, 12];
  const icing = [250, 240, 230];
  // body
  ctx.fillStyle = rgba(dough); ctx.fillRect(-190, -230, 380, 235);
  // roof made of cake, scalloped icing
  ctx.fillStyle = rgba([120, 62, 40]);
  ctx.beginPath(); ctx.moveTo(-240, -220); ctx.lineTo(0, -430); ctx.lineTo(240, -220); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(icing);
  ctx.beginPath(); ctx.moveTo(-250, -214); ctx.lineTo(0, -444); ctx.lineTo(250, -214); ctx.lineTo(236, -204); ctx.lineTo(0, -420); ctx.lineTo(-236, -204); ctx.closePath(); ctx.fill();
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.arc(i * 44, -214 + Math.abs(i) * 0, 13, 0, Math.PI); ctx.fill(); }
  // drips along the eaves
  for (let i = -8; i <= 8; i++) { const dx = i * 27; ctx.beginPath(); ctx.ellipse(dx, -205, 5, 9 + (i * 7 % 5 + 5), 0, 0, TAU); ctx.fill(); }
  // candies on the roof
  const candy = [[235, 70, 90], [80, 180, 120], [250, 200, 70], [120, 140, 240], [240, 120, 200]];
  for (let i = 0; i < 16; i++) {
    const k = i / 15, rx = lerp(-180, 180, k), ry = -240 - (180 - Math.abs(rx)) * 0.95 + 20;
    ctx.fillStyle = rgba(candy[i % candy.length]); ctx.beginPath(); ctx.arc(rx, ry, 11, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.beginPath(); ctx.arc(rx - 3, ry - 3, 3.5, 0, TAU); ctx.fill();
  }
  // walls: cookie tiles
  ctx.strokeStyle = rgba([150, 90, 55]); ctx.lineWidth = 3;
  for (let y = -200; y < 0; y += 45) for (let xx = -175; xx < 175; xx += 50) { ctx.beginPath(); ctx.roundRect(xx, y, 42, 36, 8); ctx.stroke(); }
  // sugar windows (clear sugar, glowing)
  const wglow = .55 + .1 * Math.sin(t * 2.2);
  for (const wx of [-120, 80]) {
    glow(ctx, wx + 20, -140, 150, [255, 200, 150], wglow * .5);
    ctx.fillStyle = `rgba(255,${210 + 20 * Math.sin(t * 2 + wx) | 0},170,.95)`; ctx.beginPath(); ctx.roundRect(wx, -180, 60, 75, 30); ctx.fill();
    ctx.strokeStyle = rgba(icing); ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx + 30, -180); ctx.lineTo(wx + 30, -105); ctx.moveTo(wx, -140); ctx.lineTo(wx + 60, -140); ctx.stroke();
  }
  // door
  ctx.fillStyle = P.door === "open" ? "#ffcf8a" : rgba(dark);
  if (P.door === "open") glow(ctx, 0, -60, 220, [255, 190, 120], .5);
  ctx.beginPath(); ctx.roundRect(-35, -125, 70, 128, [35, 35, 0, 0]); ctx.fill();
  ctx.strokeStyle = rgba(icing); ctx.lineWidth = 6; ctx.stroke();
  // candy-cane posts & lollipops
  for (const cx of [-240, 240]) {
    ctx.lineCap = "round"; ctx.lineWidth = 14; ctx.strokeStyle = "#f8f1ec";
    ctx.beginPath(); ctx.moveTo(cx, 5); ctx.lineTo(cx, -120); ctx.arc(cx + (cx < 0 ? 22 : -22), -120, 22, Math.PI, cx < 0 ? TAU : 0, cx > 0); ctx.stroke();
    ctx.strokeStyle = "#e0384e"; ctx.lineWidth = 14; ctx.setLineDash([10, 12]); ctx.lineDashOffset = 0;
    ctx.beginPath(); ctx.moveTo(cx, 5); ctx.lineTo(cx, -120); ctx.stroke(); ctx.setLineDash([]);
  }
  for (const [lx, c] of [[-300, candy[0]], [310, candy[3]], [-345, candy[2]]]) {
    ctx.strokeStyle = "#efe7dc"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(lx, 5); ctx.lineTo(lx, -90); ctx.stroke();
    ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.arc(lx, -105, 26, 0, TAU); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(lx, -105, 14, 0, 5); ctx.stroke();
  }
  // chimney with sweet smoke
  ctx.fillStyle = rgba([120, 62, 40]); ctx.fillRect(110, -400, 40, 110);
  ctx.fillStyle = rgba(icing); ctx.fillRect(104, -410, 52, 14);
  for (let i = 0; i < 6; i++) { const k = ((t * .1 + i / 6) % 1); ctx.fillStyle = `rgba(255,220,235,${.3 * (1 - k)})`; ctx.beginPath(); ctx.arc(130 + k * 50, -420 - k * 240, 16 + k * 40, 0, TAU); ctx.fill(); }
  // a bitten gap in the roof edge if the children have been nibbling
  if (P.bitten) { ctx.fillStyle = rgba(skyOf("sweet")._c.mid); ctx.beginPath(); ctx.arc(-150, -260, 26, 0, TAU); ctx.fill(); }
  ctx.restore();
}

function campfire(ctx, x, base, t, scale = 1, dying = 0) {
  ctx.save(); ctx.translate(x, base); ctx.scale(scale, scale);
  const life = 1 - dying;
  glow(ctx, 0, -40, 380, [255, 150, 60], .45 * life + .05);
  ctx.fillStyle = "#1a0d06";
  ctx.save(); ctx.rotate(.25); ctx.fillRect(-60, -10, 120, 16); ctx.restore();
  ctx.save(); ctx.rotate(-.25); ctx.fillRect(-60, -10, 120, 16); ctx.restore();
  const cols = ["#d9441e", "#ff8b2a", "#ffd36a"];
  for (let k = 0; k < 3; k++) {
    const h = (90 - k * 25) * life * (1 + .15 * Math.sin(t * (9 + k * 3) + k)) + 6, w = 34 - k * 9;
    const lean = Math.sin(t * 5 + k) * 8;
    ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.moveTo(-w, -4);
    ctx.quadTo(-w * .9, -h * .5, lean, -h); ctx.quadTo(w * .9, -h * .5, w, -4); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function pebbleTrail(ctx, x0, x1, base, t, shine = 1, seed = 5) {
  const r = rng(seed);
  for (let x = x0; x < x1; x += 34 + r() * 20) {
    const y = base + 8 + r() * 20, rr = 5 + r() * 3;
    const tw = shine * (.6 + .4 * Math.sin(t * 2 + x * .05));
    glow(ctx, x, y, 34, [220, 230, 255], .35 * tw);
    ctx.fillStyle = `rgba(235,240,255,${.6 + .4 * tw})`; ctx.beginPath(); ctx.ellipse(x, y, rr * 1.3, rr, 0, 0, TAU); ctx.fill();
  }
}

function crumbs(ctx, x0, x1, base, eaten, seed = 9) {
  const r = rng(seed);
  for (let x = x0; x < x1; x += 40 + r() * 25) {
    if ((x - x0) / (x1 - x0) < eaten) continue;
    ctx.fillStyle = "#d8b07a"; ctx.beginPath(); ctx.arc(x, base + 10 + r() * 16, 4, 0, TAU); ctx.fill();
  }
}

function treasure(ctx, x, base, t, sky) {
  ctx.save(); ctx.translate(x, base);
  glow(ctx, 0, -60, 260, [255, 210, 120], .45);
  ctx.fillStyle = "#3a2210"; ctx.fillRect(-90, -70, 180, 75);
  ctx.fillStyle = "#5a3418"; ctx.beginPath(); ctx.moveTo(-95, -70); ctx.quadTo(0, -140, 95, -70); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#d9a441"; ctx.lineWidth = 6; ctx.strokeRect(-90, -70, 180, 75);
  const gems = [[255, 215, 90], [240, 80, 110], [90, 200, 255], [255, 255, 255], [120, 240, 160]];
  const r = rng(3);
  for (let i = 0; i < 26; i++) {
    const gx = (r() - .5) * 170, gy = -72 - r() * 40 + Math.abs(gx) * .25;
    ctx.fillStyle = rgba(gems[i % 5]); ctx.beginPath(); ctx.arc(gx, gy, 6 + r() * 5, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- worlds
// Each world: back() draws scenery behind the actors, front() draws foreground in front of them.

const WORLDS = {
  // Woodcutter's cottage at the edge of a great forest
  cottage: {
    back(ctx, v, t, sky, P) {
      paintSky(ctx, v, t, sky, P);
      v.layer(.15); fill(ctx, hillPath(11, 640, 60), depthColor(sky, .15));
      v.layer(.3); fill(ctx, treeline(12, "pine", 650, 60, 140, 260), depthColor(sky, .32));
      mist(ctx, v, sky, 650, 50, .25, .35);
      v.layer(.55); fill(ctx, treeline(13, "mixed", 700, 34, 260, 420), depthColor(sky, .6));
      v.layer(1);
      fill(ctx, groundWithGrass(14, GROUND), depthColor(sky, .92));
      cottage(ctx, P.houseX ?? 1180, GROUND + 4, sky, t, P);
      if (P.pebbles) pebbleTrail(ctx, P.pebbles[0], P.pebbles[1], GROUND, t, P.shine ?? 1);
    },
    front(ctx, v, t, sky, P) {
      v.layer(1.35); fill(ctx, ferns(15, GROUND + 120, 26, 120), depthColor(sky, 1));
    },
  },

  // Path into the woods (daylight), shafts of light
  woods: {
    back(ctx, v, t, sky, P) {
      paintSky(ctx, v, t, sky, P);
      v.layer(.2); fill(ctx, treeline(21, "pine", 600, 70, 200, 340), depthColor(sky, .25));
      mist(ctx, v, sky, 620, 70, .35, .3);
      v.layer(.45); fill(ctx, trunks(22, 690, 18, 30, 55), depthColor(sky, .5));
      v.layer(.7); fill(ctx, trunks(23, 740, 11, 50, 90), depthColor(sky, .74));
      if (!P.noShafts) lightShafts(ctx, v, t, sky, P.shafts ?? 1, P.shaftX ?? .72);
      v.layer(1); fill(ctx, groundWithGrass(24, GROUND), depthColor(sky, .9));
      if (P.pebbles) pebbleTrail(ctx, P.pebbles[0], P.pebbles[1], GROUND, t, P.shine ?? 1, 6);
      if (P.crumbs) crumbs(ctx, P.crumbs[0], P.crumbs[1], GROUND, P.eaten || 0);
      if (P.fire) campfire(ctx, P.fire, GROUND + 6, t, 1, P.dying || 0);
      if (P.knock) { // the branch the father tied to a dead tree, knocking in the wind
        const kx = P.knock, sw = Math.sin(t * 2.4) * .35;
        ctx.save(); v.layer(.7); ctx.translate(kx, 360); ctx.rotate(sw);
        ctx.fillStyle = rgba(depthColor(sky, .74)); ctx.fillRect(-6, 0, 12, 230); ctx.restore();
      }
    },
    front(ctx, v, t, sky, P) {
      v.layer(1.3); fill(ctx, ferns(25, GROUND + 110, 22, 130), depthColor(sky, 1));
      v.layer(1.7); fill(ctx, trunks(26, GROUND + 260, 3, 120, 160), depthColor(sky, 1));
    },
  },

  // Deep, dark forest — lost
  deep: {
    back(ctx, v, t, sky, P) {
      paintSky(ctx, v, t, sky, { ...P, clouds: false });
      v.layer(.2); fill(ctx, trunks(31, 650, 30, 18, 30), depthColor(sky, .22));
      mist(ctx, v, sky, 640, 90, .4, .25);
      v.layer(.4); fill(ctx, trunks(32, 690, 20, 30, 50), depthColor(sky, .45));
      mist(ctx, v, sky, 720, 60, .3, .5);
      v.layer(.65); fill(ctx, trunks(33, 740, 12, 55, 95), depthColor(sky, .7));
      v.layer(1); fill(ctx, groundWithGrass(34, GROUND), depthColor(sky, .92));
      if (P.crumbs) crumbs(ctx, P.crumbs[0], P.crumbs[1], GROUND, P.eaten || 0);
      if (P.fire) campfire(ctx, P.fire, GROUND + 6, t, 1, P.dying || 0);
      if (P.pebbles) pebbleTrail(ctx, P.pebbles[0], P.pebbles[1], GROUND, t, P.shine ?? 1, 8);
    },
    front(ctx, v, t, sky, P) {
      v.layer(1.3); fill(ctx, ferns(35, GROUND + 110, 26, 140), depthColor(sky, 1));
      v.layer(1.8); fill(ctx, trunks(36, GROUND + 280, 4, 140, 200), depthColor(sky, 1));
    },
  },

  // Clearing with the house made of bread and cake
  candy: {
    back(ctx, v, t, sky, P) {
      paintSky(ctx, v, t, sky, P);
      v.layer(.25); fill(ctx, treeline(41, "broad", 620, 40, 220, 330), depthColor(sky, .3));
      mist(ctx, v, sky, 640, 60, .3, .3);
      v.layer(.55); fill(ctx, treeline(42, "broad", 700, 22, 300, 460, -1400, 600), depthColor(sky, .6));
      v.layer(.55); fill(ctx, treeline(43, "broad", 700, 14, 300, 460, 1700, 3400), depthColor(sky, .6));
      v.layer(1); fill(ctx, groundWithGrass(44, GROUND), depthColor(sky, .88));
      gingerbreadHouse(ctx, P.houseX ?? 1150, GROUND + 4, sky, t, P);
    },
    front(ctx, v, t, sky, P) {
      v.layer(1.3); fill(ctx, ferns(45, GROUND + 115, 18, 120), depthColor(sky, 1));
    },
  },

  // Parents' bedroom at night (interior)
  bedroom: {
    back(ctx, v, t, sky, P) {
      v.screen(); ctx.fillStyle = "#0a0b16"; ctx.fillRect(0, 0, v.w, v.h);
      v.layer(1);
      // walls
      ctx.fillStyle = "#151829"; ctx.fillRect(-600, -200, 3200, 1400);
      ctx.fillStyle = "#0e1020"; for (let x = -500; x < 2600; x += 220) ctx.fillRect(x, -200, 26, 1400);
      ctx.fillStyle = "#0b0c18"; ctx.fillRect(-600, GROUND, 3200, 500);
      // window with moon
      ctx.save(); ctx.beginPath(); ctx.rect(1260, 260, 220, 260); ctx.clip();
      const g = ctx.createLinearGradient(0, 260, 0, 520); g.addColorStop(0, "#0b1230"); g.addColorStop(1, "#2c3770"); ctx.fillStyle = g; ctx.fillRect(1260, 260, 220, 260);
      ctx.fillStyle = "#f4f1e2"; ctx.beginPath(); ctx.arc(1400, 330, 26, 0, TAU); ctx.fill();
      ctx.fillStyle = "#1a2050"; ctx.fill(treeline(51, "pine", 520, 10, 60, 120, 1260, 1480));
      ctx.restore();
      ctx.strokeStyle = "#0c0d18"; ctx.lineWidth = 14; ctx.strokeRect(1260, 260, 220, 260);
      ctx.beginPath(); ctx.moveTo(1370, 260); ctx.lineTo(1370, 520); ctx.moveTo(1260, 390); ctx.lineTo(1480, 390); ctx.stroke();
      // moonbeam on the floor
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const mb = ctx.createLinearGradient(1300, 300, 900, GROUND + 100);
      mb.addColorStop(0, "rgba(180,200,255,.16)"); mb.addColorStop(1, "rgba(180,200,255,0)");
      ctx.fillStyle = mb; ctx.beginPath(); ctx.moveTo(1260, 260); ctx.lineTo(1480, 260); ctx.lineTo(1150, GROUND + 140); ctx.lineTo(760, GROUND + 140); ctx.closePath(); ctx.fill(); ctx.restore();
      // the parents' bed
      ctx.fillStyle = "#07070f";
      ctx.fillRect(560, GROUND - 120, 520, 120); ctx.fillRect(540, GROUND - 230, 30, 230); ctx.fillRect(1070, GROUND - 170, 26, 170);
      ctx.fillStyle = "#1f2440"; ctx.beginPath(); ctx.roundRect(575, GROUND - 150, 500, 50, 18); ctx.fill(); // blanket
      // a dying candle
      glow(ctx, 470, GROUND - 160, 160, [255, 180, 90], .22 + .04 * Math.sin(t * 7));
      ctx.fillStyle = "#e9dcc0"; ctx.fillRect(462, GROUND - 160, 14, 40); ctx.fillStyle = "#ffcc66"; ctx.beginPath(); ctx.ellipse(469, GROUND - 170, 5, 10, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#07070f"; ctx.fillRect(420, GROUND - 120, 100, 120);
    },
    front(ctx, v, t, sky, P) {
      // doorway the children listen from (left edge)
      v.layer(1); ctx.fillStyle = "#04040a"; ctx.fillRect(160, 180, 34, GROUND - 180); ctx.fillRect(330, 180, 34, GROUND - 180);
    },
  },

  // Inside the witch's house: oven, cage/stable, table
  witchhouse: {
    back(ctx, v, t, sky, P) {
      v.screen(); ctx.fillStyle = "#120806"; ctx.fillRect(0, 0, v.w, v.h);
      v.layer(.6);
      ctx.fillStyle = "#2a160e"; ctx.fillRect(-800, -300, 3600, 1600);
      ctx.fillStyle = "#1f100a"; for (let x = -700; x < 2800; x += 180) ctx.fillRect(x, -300, 20, 1600);
      // shelves with jars
      ctx.fillStyle = "#140906"; ctx.fillRect(250, 330, 360, 14); ctx.fillRect(250, 450, 360, 14);
      const r = rng(61);
      for (let i = 0; i < 10; i++) { ctx.fillStyle = `rgba(${120 + r() * 100 | 0},${80 + r() * 80 | 0},${40 + r() * 60 | 0},.7)`; ctx.fillRect(270 + i * 34, 330 - 30 - r() * 20, 22, 30 + r() * 20); }
      v.layer(1);
      ctx.fillStyle = "#170a06"; ctx.fillRect(-800, GROUND, 3600, 600);
      // big oven
      const ox = P.ovenX ?? 1350, open = P.ovenOpen ?? 1, heat = P.heat ?? .7;
      glow(ctx, ox, GROUND - 160, 520, [255, 120, 40], .35 * heat + .1 * Math.sin(t * 5) * heat);
      ctx.fillStyle = "#3b2418"; ctx.beginPath(); ctx.moveTo(ox - 220, GROUND); ctx.lineTo(ox - 220, GROUND - 260); ctx.quadTo(ox, GROUND - 420, ox + 220, GROUND - 260); ctx.lineTo(ox + 220, GROUND); ctx.fill();
      ctx.strokeStyle = "#24140c"; ctx.lineWidth = 3;
      for (let y = GROUND - 30; y > GROUND - 300; y -= 34) { ctx.beginPath(); ctx.moveTo(ox - 220, y); ctx.lineTo(ox + 220, y); ctx.stroke(); }
      ctx.fillStyle = `rgb(${255},${110 + 60 * Math.sin(t * 6) * heat | 0},30)`;
      ctx.beginPath(); ctx.roundRect(ox - 95, GROUND - 230, 190, 150, [80, 80, 6, 6]); ctx.fill();
      for (let k = 0; k < 4; k++) { ctx.fillStyle = ["#ffd56a", "#ff9a2e", "#e04a1c", "#ffe9a0"][k]; const fx = ox - 60 + k * 40, fh = 50 + 30 * Math.sin(t * 8 + k * 2); ctx.beginPath(); ctx.moveTo(fx - 22, GROUND - 82); ctx.quadTo(fx, GROUND - 82 - fh * 2, fx + 22, GROUND - 82); ctx.fill(); }
      // iron door (rotates shut)
      ctx.save(); ctx.translate(ox + 95, GROUND - 155); ctx.scale(lerp(1, .08, open), 1);
      ctx.fillStyle = "#1c1c20"; ctx.beginPath(); ctx.roundRect(-190, -75, 190, 150, [80, 80, 6, 6]); ctx.fill();
      ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
      // the stable / cage
      if (P.cage !== false) {
        const cx = P.cageX ?? 520;
        ctx.fillStyle = "#0d0604"; ctx.fillRect(cx - 160, GROUND - 330, 320, 20); ctx.fillRect(cx - 160, GROUND - 10, 320, 14);
        ctx.fillStyle = "#1a0d08"; for (let b = 0; b <= 8; b++) ctx.fillRect(cx - 160 + b * 39, GROUND - 330, 9, 330);
      }
      // table
      if (P.table) {
        ctx.fillStyle = "#1a0c06"; ctx.fillRect(820, GROUND - 160, 280, 20); ctx.fillRect(840, GROUND - 140, 18, 140); ctx.fillRect(1060, GROUND - 140, 18, 140);
        ctx.fillStyle = "#e9dcc0"; ctx.beginPath(); ctx.ellipse(900, GROUND - 168, 44, 12, 0, 0, TAU); ctx.ellipse(1020, GROUND - 168, 44, 12, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#c9873e"; ctx.beginPath(); ctx.ellipse(900, GROUND - 172, 30, 8, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#f6f1e6"; ctx.fillRect(990, GROUND - 205, 22, 34);
      }
      if (P.treasure) treasure(ctx, P.treasure, GROUND + 2, t, sky);
    },
    front(ctx, v, t, sky, P) {
      v.layer(1.25); ctx.fillStyle = "#070302";
      ctx.fillRect(-900, -400, 980, 1800); ctx.fillRect(2000, -400, 1200, 1800); // door frame edges
      ctx.fillRect(-900, -400, 4000, 300);
    },
  },

  // The great water with the white duck
  lake: {
    back(ctx, v, t, sky, P) {
      paintSky(ctx, v, t, sky, P);
      const wl = 640;
      v.layer(.2); fill(ctx, treeline(71, "mixed", wl - 10, 60, 90, 170), depthColor(sky, .3));
      // water
      v.layer(1);
      const [a, b] = v.span(1);
      const g = ctx.createLinearGradient(0, wl, 0, 1000);
      g.addColorStop(0, rgba(mixc(sky._c.bot, sky._c.light, .3))); g.addColorStop(.4, rgba(mixc(sky._c.mid, sky._c.top, .3))); g.addColorStop(1, rgba(mixc(sky._c.top, sky._c.sil, .5)));
      ctx.fillStyle = g; ctx.fillRect(a - 100, wl, b - a + 200, 600);
      // reflections & ripples
      ctx.strokeStyle = rgba(sky._c.light, .35); ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        const y = wl + 8 + Math.pow(i / 40, 1.6) * 360, x = ((i * 173 + t * (8 + i % 5 * 4)) % (b - a + 400)) + a - 200, L = 30 + (i % 7) * 18 * (1 + (y - wl) / 200);
        ctx.globalAlpha = .25 + .2 * Math.sin(t + i); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + L, y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // near shores left and right
      ctx.fillStyle = rgba(depthColor(sky, .9));
      ctx.beginPath(); ctx.moveTo(a - 200, GROUND - 30); ctx.quadTo(P.leftShore ?? 560, GROUND - 40, (P.leftShore ?? 560) + 80, 1100); ctx.lineTo(a - 200, 1100); ctx.fill();
      ctx.beginPath(); ctx.moveTo(b + 200, GROUND - 30); ctx.quadTo(P.rightShore ?? 1500, GROUND - 40, (P.rightShore ?? 1500) - 80, 1100); ctx.lineTo(b + 200, 1100); ctx.fill();
    },
    front(ctx, v, t, sky, P) {
      v.layer(1.35); fill(ctx, ferns(75, GROUND + 140, 14, 130), depthColor(sky, 1));
    },
  },

  // Title card: an open storybook glow
  title: {
    back(ctx, v, t, sky, P) {
      paintSky(ctx, v, t, sky, P);
      v.layer(.3); fill(ctx, treeline(81, "pine", 700, 70, 160, 300), depthColor(sky, .35));
      mist(ctx, v, sky, 700, 70, .35, .35);
      v.layer(.7); fill(ctx, treeline(82, "broad", 780, 26, 300, 520), depthColor(sky, .75));
    },
    front(ctx, v, t, sky, P) {
      v.screen();
      const W = v.w, H = v.h, s = Math.min(W, H) / 1000;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,240,215,.95)";
      ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 20 * s;
      ctx.font = `italic ${Math.round(46 * s * (W > H ? 1.4 : 1.6))}px Georgia, 'Times New Roman', serif`;
      ctx.fillText(P.title || "", W / 2, H * .42);
      ctx.font = `${Math.round(18 * s * (W > H ? 1.4 : 1.7))}px Georgia, serif`; ctx.fillStyle = "rgba(255,235,200,.8)";
      ctx.fillText(P.subtitle || "", W / 2, H * .42 + 52 * s * 1.6);
      ctx.shadowBlur = 0;
    },
  },
};
