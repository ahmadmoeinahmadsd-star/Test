// Hansel and Gretel — shot script, timed to the LibriVox recording (absolute audio seconds).
// In a product this script would be generated per book by a language model from the book text;
// for this demo it was written ahead of time.
"use strict";
(() => {
const S = [];
const shot = (o) => S.push(o);
// A(who, [opts], [t, x, act, {face, y, extras}], ...)
function A(who, ...rest) {
  let o = {}; if (rest.length && !Array.isArray(rest[0])) o = rest.shift();
  return { who, ...o, keys: rest.map(([t, x, act, ex]) => ({ t, x, act, ...(ex || {}) })) };
}
const cam = (x, z, x2, z2) => ({ from: { x, z }, to: { x: x2 ?? x, z: z2 ?? z } });
const L = { face: -1 }, R = { face: 1 };
const AXE = { extras: { axe: true } }, CRUTCH = { extras: { crutch: true } };
const H = 1180; // cottage x

// ------------------------------------------------------------------ opening
shot({ t: 0, world: "title", sky: "night", P: { title: "Hansel and Gretel", subtitle: "from the Brothers Grimm" }, cam: cam(1000, 1, 1040, 1.08), fx: [["fireflies", 16], ["motes", 30, .6]], fade: 0 });

shot({ t: 30.5, chapter: "The woodcutter's family", world: "cottage", sky: "dusk", P: {}, cam: cam(1050, 1, 1120, 1.25), fx: [["fireflies", 10, .5]],
  cast: [A("father", [30.5, 880, "chop", { ...AXE, face: 1 }]),
         A("stepmother", [30.5, 1250, "stand", L]),
         A("hansel", [30.5, 960, "walk"], [35, 1040, "stand", L]),
         A("gretel", [30.5, 1000, "walk"], [35, 1090, "stand", L])] });

shot({ t: 37.9, world: "cottage", sky: "dusk", P: {}, cam: cam(1030, 1.6, 1050, 1.75), fx: [["fireflies", 12, .6]],
  cast: [A("hansel", [37.9, 980, "talk", R]), A("gretel", [37.9, 1080, "talk", L])] });

shot({ t: 42.3, world: "cottage", sky: "dusk", P: { window: false }, cam: cam(1150, 1.3, 1100, 1.45), fx: [["leaves", 18]],
  cast: [A("father", [42.3, 980, "sad", R]), A("hansel", { depth: .97 }, [42.3, 1100, "sad", L]), A("gretel", { depth: .97 }, [42.3, 1150, "sad", L])] });

// ------------------------------------------------------------------ the plan (parents' bedroom)
shot({ t: 53.0, chapter: "A cruel plan", world: "bedroom", sky: "night", P: {}, cam: cam(870, 1.25, 870, 1.45), fx: [["motes", 20, .4]],
  cast: [A("father", { ground: -100 }, [53, 960, "sad", L], [59.2, 960, "talk", L], [72.9, 960, "sad", L]),
         A("stepmother", { ground: -100 }, [53, 770, "stand", R])] });

shot({ t: 72.9, world: "bedroom", sky: "night", P: {}, cam: { from: { x: 800, z: 1.55 }, to: { x: 820, z: 1.7 }, px: 790 },
  cast: [A("father", { ground: -100 }, [72.9, 960, "sad", L]), A("stepmother", { ground: -100 }, [72.9, 770, "talk", R])] });

shot({ t: 98.3, world: "bedroom", sky: "night", P: {}, cam: { from: { x: 930, z: 1.55 }, to: { x: 920, z: 1.7 }, px: 950 },
  cast: [A("father", { ground: -100 }, [98.3, 960, "talk", L]), A("stepmother", { ground: -100 }, [98.3, 770, "stand", R])] });

shot({ t: 113.9, world: "bedroom", sky: "night", P: {}, cam: cam(860, 1.45, 870, 1.55),
  cast: [A("father", { ground: -100 }, [113.9, 960, "sad", L], [127.9, 960, "talk", L]), A("stepmother", { ground: -100 }, [113.9, 770, "talk", R], [122.7, 770, "stand", R])] });

shot({ t: 134.8, chapter: "The children overhear", world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(330, 1.7, 310, 1.85),
  cast: [A("hansel", [134.8, 300, "listen", R]), A("gretel", [134.8, 240, "listen", R]),
         A("father", { ground: -100 }, [134.8, 960, "stand", L]), A("stepmother", { ground: -100 }, [134.8, 770, "stand", R])] });

shot({ t: 144.5, world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(280, 1.9, 280, 2.05),
  cast: [A("gretel", [144.5, 240, "huddle", R]), A("hansel", [144.5, 320, "stand", L], [150.9, 320, "talk", L])] });

shot({ t: 161.0, world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(400, 1.5, 300, 1.6),
  cast: [A("gretel", [161, 230, "sleep", R]),
         A("hansel", [161, 330, "stand", L], [163.5, 330, "sneak", L], [168.5, 170, "sneak", L]),
         A("father", { ground: -112 }, [161, 830, "sleep", R]), A("stepmother", { ground: -112 }, [161, 1010, "sleep", L])] });

// ------------------------------------------------------------------ silver pebbles
shot({ t: 170.3, chapter: "Silver pebbles", world: "cottage", sky: "night", P: { door: "open", pebbles: [820, 1500], shine: 1 }, cam: cam(1150, 1.15, 1100, 1.5), fx: [["fireflies", 12, .5]],
  cast: [A("hansel", [170.3, 1240, "sneak", L], [176, 1080, "stand", L], [179.1, 1060, "crouch", { face: -1, extras: { pebble: true } }])] });

shot({ t: 185.3, world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(280, 1.9, 270, 2.0),
  cast: [A("gretel", [185.3, 230, "sit", R], [192.6, 230, "sleep", R]), A("hansel", [185.3, 330, "talk", L], [192.6, 330, "sleep", L])] });

shot({ t: 198.2, world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(400, 1.4, 340, 1.55),
  cast: [A("gretel", [198.2, 230, "sleep", R], [203.5, 230, "sit", R]), A("hansel", [198.2, 330, "sleep", L], [204, 330, "sit", L]),
         A("stepmother", [198.2, 760, "walk", L], [202.5, 470, "talk", L], [204.3, 470, "point", L])] });

shot({ t: 210.3, world: "cottage", sky: "dawn", P: { door: "open" }, cam: cam(1120, 1.55, 1100, 1.7), fx: [["motes", 25, .6]],
  cast: [A("stepmother", [210.3, 1210, "offer", { face: -1, extras: { bread: true } }], [213.2, 1210, "talk", L]),
         A("hansel", [210.3, 1050, "stand", R]), A("gretel", [210.3, 1120, "stand", R], [220.6, 1120, "crumble", { face: 1, extras: { bread: true } }])] });

// ------------------------------------------------------------------ into the forest
shot({ t: 227.3, chapter: "Into the forest", world: "cottage", sky: "dawn", P: {}, cam: cam(1000, 1.05, 820, 1.15), fx: [["motes", 30, .6]],
  cast: [A("father", [227.3, 1080, "carry", { face: -1, extras: { axe: true } }], [236, 640]),
         A("stepmother", [227.3, 1140, "walk", L], [236, 700]),
         A("gretel", [227.3, 1200, "walk", L], [236, 780]),
         A("hansel", [227.3, 1260, "walk", L], [233.5, 1000, "walk", L], [236, 900])] });

shot({ t: 236.4, world: "cottage", sky: "dawn", P: { cat: true }, cam: { from: { x: 900, z: 1.25 }, to: { x: 960, z: 1.4 }, px: 820 },
  cast: [A("hansel", [236.4, 820, "stand", R], [239.6, 820, "stand", R]),
         A("father", [236.4, 560, "walk", L], [240, 520, "stand", L], [242.5, 520, "talk", R]),
         A("stepmother", [236.4, 480, "walk", L], [240, 440, "stand", L])] });

shot({ t: 254.2, world: "cottage", sky: "dawn", P: { cat: true }, cam: cam(1050, 1.35, 1150, 1.6),
  cast: [A("hansel", [254.2, 900, "point", R], [257, 900, "talk", L]), A("father", [254.2, 640, "stand", R])] });

shot({ t: 263.4, world: "cottage", sky: "dawn", P: {}, cam: { from: { x: 700, z: 1.5 }, to: { x: 720, z: 1.6 }, px: 650 },
  cast: [A("stepmother", [263.4, 620, "talk", R]), A("hansel", [263.4, 840, "stand", L])] });

shot({ t: 270.8, world: "woods", sky: "day", P: { pebbles: [1500, 700], pebbleTo: 1500 }, anim: { pebbleTo: [1500, 760, 270.8, 282] },
  cam: { from: { x: 1250, z: 1.4 }, to: { x: 950, z: 1.5 } }, fx: [["motes", 40], ["leaves", 10]],
  cast: [A("hansel", [270.8, 1500, "walk", { face: -1, extras: { pebble: true } }], [282.2, 760]),
         A("gretel", [270.8, 1380, "walk", L], [282.2, 640]),
         A("father", { nofocus: true }, [270.8, 1100, "carry", { face: -1, extras: { axe: true } }], [282.2, 360]),
         A("stepmother", { nofocus: true }, [270.8, 1000, "walk", L], [282.2, 260])] });

// ------------------------------------------------------------------ the first fire
shot({ t: 282.2, chapter: "Left in the woods", world: "woods", sky: "day", P: {}, cam: cam(1000, 1.25, 1000, 1.35), fx: [["motes", 40], ["leaves", 8]],
  cast: [A("father", [282.2, 860, "talk", { face: 1, extras: { axe: true } }]), A("stepmother", [282.2, 780, "stand", R]),
         A("hansel", [282.2, 1080, "stand", L]), A("gretel", [282.2, 1150, "stand", L])] });

shot({ t: 294.1, world: "woods", sky: "day", P: { brush: 1040, brushScale: 0 }, anim: { brushScale: [0, 1, 294.1, 299] }, cam: cam(1040, 1.6, 1040, 1.7), fx: [["motes", 40]],
  cast: [A("hansel", [294.1, 940, "crouch", R]), A("gretel", [294.1, 1150, "crouch", L])] });

shot({ t: 299.0, world: "woods", sky: "day", P: { brush: 1040, fire: 1040, fireScale: 0 }, anim: { fireScale: [0, 1.2, 299.2, 302], brushScale: [1, 0, 300, 302.5] }, cam: cam(1040, 1.4, 1000, 1.3), fx: [["motes", 30], ["embers", 14, .6]],
  cast: [A("father", [299, 880, "stand", { face: 1, extras: { axe: true } }]), A("stepmother", [299, 800, "stand", R], [300.7, 800, "talk", R]),
         A("hansel", [299, 1160, "stand", L]), A("gretel", [299, 1220, "stand", L]),
         A("father", { nofocus: true }, [309.6, 880, "carry", { face: -1, extras: { axe: true } }], [319, 200]),
         A("stepmother", { nofocus: true }, [309.6, 800, "walk", L], [319, 120])].map((a, i) => i === 0 ? { ...a, until: 309.6 } : i === 1 ? { ...a, until: 309.6 } : i >= 4 ? { ...a, from: 309.6 } : a) });

shot({ t: 319.2, world: "woods", sky: "day", P: { fire: 1040, fireScale: 1.1 }, cam: cam(1040, 1.75, 1040, 1.9), fx: [["motes", 30], ["embers", 12, .6]],
  cast: [A("hansel", [319.2, 930, "sit", R], [321.8, 930, "eat", { face: 1, extras: { bread: true } }]), A("gretel", [319.2, 1150, "sit", L], [322.5, 1150, "eat", { face: -1, extras: { bread: true } }])] });

shot({ t: 325.6, world: "woods", sky: "day", P: { knock: 1500, fire: 900, fireScale: 1 }, cam: { from: { x: 1000, z: 1.25 }, to: { x: 1400, z: 1.5 }, px: 1000, px2: 1450 }, fx: [["motes", 30], ["leaves", 12]],
  cast: [A("hansel", [325.6, 800, "listen", R]), A("gretel", [325.6, 1000, "listen", R])] });

shot({ t: 341.8, world: "woods", sky: "dusk", P: { fire: 1040, fireScale: 1, dying: 0 }, anim: { dying: [0, .8, 344, 350] }, cam: cam(1040, 1.7, 1040, 1.9), fx: [["fireflies", 10, .4]],
  cast: [A("hansel", [341.8, 930, "huddle", R], [345, 930, "sleep", R]), A("gretel", [341.8, 1150, "huddle", L], [345.5, 1150, "sleep", L])] });

// ------------------------------------------------------------------ the way home by moonlight
shot({ t: 350.4, chapter: "Moonlight", world: "deep", sky: "deepnight", P: { fire: 1040, fireScale: 1, dying: .9, moonY: 900 }, cam: cam(1040, 1.7, 1040, 1.8), fx: [["embers", 6, .4], ["fireflies", 8, .5]],
  cast: [A("hansel", [350.4, 930, "sleep", R], [352, 930, "sit", R], [360.7, 930, "talk", R]), A("gretel", [350.4, 1150, "sleep", L], [353, 1150, "huddle", L], [354.9, 1150, "sad", L])] });

shot({ t: 369.8, world: "deep", sky: "night", P: { pebbles: [700, 1900], shine: 0, moonY: 820 }, anim: { moonY: [820, 230, 369.8, 375], shine: [0, 1, 372, 376] }, cam: cam(1000, 1.25, 1050, 1.35), fx: [["fireflies", 16]],
  cast: [A("hansel", [369.8, 900, "stand", R], [372.4, 960, "walk", R], [382, 1300]), A("gretel", [369.8, 820, "stand", R], [372.4, 890, "walk", R], [382, 1230])] });

shot({ t: 382.3, world: "deep", sky: "night", P: { pebbles: [300, 2000], moonY: 200 }, cam: { from: { x: 800, z: 1.15 }, to: { x: 1300, z: 1.15 } }, fx: [["fireflies", 20]],
  cast: [A("hansel", [382.3, 600, "walk", R], [384.6, 760]), A("gretel", [382.3, 530, "walk", R], [384.6, 690])] });

shot({ t: 384.6, world: "cottage", sky: "dawn", P: { pebbles: [400, 1150] }, cam: cam(900, 1.1, 1050, 1.3), fx: [["motes", 30, .6]],
  cast: [A("hansel", [384.6, 500, "walk", R], [389.2, 1080, "stand", R], [389.5, 1080, "point", R]), A("gretel", [384.6, 430, "walk", R], [389.2, 1010, "stand", R])] });

shot({ t: 389.2, world: "cottage", sky: "dawn", P: { door: "open" }, cam: cam(1150, 1.55, 1170, 1.7),
  cast: [A("stepmother", [389.2, 1240, "stand", L], [392.4, 1240, "talk", L]), A("hansel", [389.2, 1080, "stand", R]), A("gretel", [389.2, 1010, "sad", R])] });

shot({ t: 403.6, world: "cottage", sky: "dawn", P: { door: "open" }, cam: cam(1100, 1.6, 1100, 1.8), fx: [["motes", 30, .7]],
  cast: [A("father", [403.6, 1250, "walk", L], [405.5, 1150, "hug", L]), A("hansel", [403.6, 1060, "hug", R]), A("gretel", [403.6, 1000, "hug", R])] });

// ------------------------------------------------------------------ hard times again
shot({ t: 413.2, chapter: "Hard times again", world: "cottage", sky: "dusk", P: { window: false }, cam: cam(1150, 1.05, 1180, 1.2), fx: [["leaves", 22]] });

shot({ t: 418.2, world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(820, 1.35, 840, 1.5), fx: [["motes", 16, .4]],
  cast: [A("stepmother", { ground: -100 }, [418.2, 770, "talk", R], [438.6, 770, "stand", R], [447.5, 770, "talk", R]),
         A("father", { ground: -100 }, [418.2, 960, "stand", L], [438.6, 960, "sad", L])] });

shot({ t: 467.3, world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(300, 1.8, 290, 1.9),
  cast: [A("hansel", [467.3, 310, "listen", R]), A("gretel", [467.3, 240, "listen", R])] });

shot({ t: 472.9, world: "bedroom", sky: "night", P: { kidsBed: true }, cam: cam(300, 1.7, 260, 1.85),
  cast: [A("gretel", [472.9, 230, "sleep", R]), A("hansel", [472.9, 330, "sneak", L], [477, 220, "push", L], [485.7, 300, "walk", R], [487.5, 320, "talk", L])] });

shot({ t: 496.3, world: "cottage", sky: "dawn", P: { door: "open" }, cam: cam(1120, 1.55, 1100, 1.7), fx: [["motes", 25, .6]],
  cast: [A("stepmother", [496.3, 1210, "offer", { face: -1, extras: { bread: true } }], [503, 1210, "stand", L]),
         A("hansel", [496.3, 1050, "stand", R], [501.1, 1050, "sad", R]), A("gretel", [496.3, 1120, "stand", R])] });

shot({ t: 506.8, world: "cottage", sky: "dawn", P: { crumbs: [1150, 600], crumbTo: 1150, pigeon: true }, anim: { crumbTo: [1150, 840, 506.8, 516] },
  cam: { from: { x: 1050, z: 1.15 }, to: { x: 900, z: 1.3 } },
  cast: [A("father", { nofocus: true }, [506.8, 950, "carry", { face: -1, extras: { axe: true } }], [516, 560, "stand", L], [516.4, 560, "talk", R]),
         A("stepmother", { nofocus: true }, [506.8, 880, "walk", L], [516, 480, "stand", L]),
         A("hansel", [506.8, 1150, "walk", { face: -1, extras: { bread: true } }], [516, 840, "stand", R], [522, 840, "point", R], [525, 840, "talk", L])] });

shot({ t: 529.3, world: "cottage", sky: "dawn", P: { pigeon: true }, cam: { from: { x: 700, z: 1.5 }, to: { x: 720, z: 1.6 }, px: 640 },
  cast: [A("stepmother", [529.3, 620, "talk", R]), A("hansel", [529.3, 840, "stand", L])] });

shot({ t: 535.6, world: "woods", sky: "day", P: { crumbs: [1500, 600], crumbTo: 1500 }, anim: { crumbTo: [1500, 700, 535.6, 543] }, cam: cam(1200, 1.5, 900, 1.6), fx: [["motes", 30], ["leaves", 10]],
  cast: [A("hansel", [535.6, 1500, "walk", { face: -1, extras: { bread: true } }], [543.3, 700])] });

// ------------------------------------------------------------------ deeper into the forest
shot({ t: 543.3, chapter: "Deeper into the forest", world: "deep", sky: "gloom", P: {}, cam: cam(1200, 1.05, 900, 1.15), fx: [["motes", 30, .6]],
  cast: [A("stepmother", [543.3, 1300, "walk", L], [550.9, 820]), A("father", [543.3, 1380, "carry", { face: -1, extras: { axe: true } }], [550.9, 900]),
         A("gretel", [543.3, 1480, "walk", L], [550.9, 1000]), A("hansel", [543.3, 1560, "walk", L], [550.9, 1080])] });

shot({ t: 550.9, world: "deep", sky: "gloom", P: { fire: 1040, fireScale: 0 }, anim: { fireScale: [0, 1.15, 551, 554] }, cam: cam(1000, 1.3, 1000, 1.4), fx: [["embers", 10, .6]],
  cast: [A("stepmother", { until: 559.1 }, [550.9, 820, "stand", R], [553.7, 820, "talk", R]), A("father", { until: 559.1 }, [550.9, 900, "sad", { face: 1, extras: { axe: true } }]),
         A("stepmother", { from: 559.1, nofocus: true }, [559.1, 820, "walk", L], [566, 150]), A("father", { from: 559.1, nofocus: true }, [559.1, 900, "carry", { face: -1, extras: { axe: true } }], [566, 230]),
         A("hansel", [550.9, 1140, "sit", L]), A("gretel", [550.9, 1210, "sit", L])] });

shot({ t: 566.9, world: "deep", sky: "gloom", P: { fire: 1040, fireScale: 1 }, cam: cam(1040, 1.8, 1040, 1.95), fx: [["embers", 10, .6]],
  cast: [A("gretel", [566.9, 1150, "sit", L], [568.5, 1150, "offer", { face: -1, extras: { bread: true } }]), A("hansel", [566.9, 930, "sad", R], [571, 930, "eat", R])] });

shot({ t: 574.3, world: "deep", sky: "dusk", P: { fire: 1040, fireScale: 1, dying: 0 }, anim: { dying: [0, .9, 574.3, 580] }, cam: cam(1040, 1.6, 1040, 1.8),
  cast: [A("hansel", [574.3, 930, "sleep", R]), A("gretel", [574.3, 1150, "sleep", L])] });

shot({ t: 580.4, world: "deep", sky: "deepnight", P: { moonY: 900 }, anim: { moonY: [900, 260, 595, 600] }, cam: cam(1040, 1.7, 1040, 1.6), fx: [["fireflies", 10, .4]],
  cast: [A("hansel", [580.4, 930, "sleep", R], [582, 930, "sit", R], [584, 960, "talk", R]), A("gretel", [580.4, 1150, "sleep", L], [583, 1150, "huddle", L])] });

shot({ t: 600.4, chapter: "The birds", world: "woods", sky: "dawn", P: { crumbs: [600, 1500], eaten: 0 }, anim: { eaten: [0, 1, 601, 607] }, cam: cam(1050, 1.4, 1050, 1.3), fx: [["motes", 30]],
  cast: [A("birds", { count: 12 }, [600.4, 1050, "stand", R], [606.4, 1050, "fly", R])] });

shot({ t: 609.1, world: "deep", sky: "night", P: { moonY: 220 }, cam: cam(1100, 1.3, 1300, 1.3), fx: [["fireflies", 14]],
  cast: [A("hansel", [609.1, 900, "walk", R], [611, 990, "talk", L], [612.8, 990, "walk", R], [615.8, 1150]), A("gretel", [609.1, 820, "walk", R], [615.8, 1080])] });

shot({ t: 615.8, chapter: "Lost", world: "deep", sky: "gloom", P: { berries: 1060 }, cam: cam(900, 1.3, 1050, 1.6), fx: [["motes", 25, .5]],
  cast: [A("hansel", [615.8, 700, "walk", R], [625.3, 1010, "crouch", R], [628.1, 1010, "eat", R]), A("gretel", [615.8, 630, "walk", R], [625.3, 1100, "crouch", L], [628.1, 1100, "eat", L])] });

shot({ t: 630.5, world: "deep", sky: "deepnight", P: { moonY: 260 }, cam: cam(1040, 1.6, 1040, 1.75), fx: [["fireflies", 10, .5]],
  cast: [A("hansel", [630.5, 960, "sad", R], [634.6, 960, "sleep", R]), A("gretel", [630.5, 1090, "sad", L], [634.6, 1090, "sleep", L])] });

// ------------------------------------------------------------------ the white bird
shot({ t: 640.3, chapter: "The white bird", world: "deep", sky: "dawn", P: {}, cam: cam(900, 1.25, 1100, 1.35), fx: [["motes", 30, .6]],
  cast: [A("gretel", [640.3, 760, "sad", R], [644.6, 760, "walk", R], [656.7, 1100]), A("hansel", [640.3, 840, "sad", R], [644.6, 840, "walk", R], [656.7, 1180])] });

shot({ t: 656.7, world: "deep", sky: "day", P: { bough: 1150 }, cam: { from: { x: 1050, y: 520, z: 1.3 }, to: { x: 1080, y: 500, z: 1.45 }, focus: 1180, lift: 120 }, fx: [["motes", 40]],
  cast: [A("whitebird", [656.7, 1180, "perch", { face: -1, y: 352 }], [668.6, 1180, "perch", { face: -1, y: 352 }], [670.4, 1180, "fly", { face: 1, y: 352 }], [675, 1700, "fly", { y: 450 }]),
         A("hansel", [656.7, 960, "listen", R], [662.8, 960, "stand", R], [671.5, 960, "walk", R], [675, 1300]),
         A("gretel", [656.7, 890, "listen", R], [662.8, 890, "stand", R], [672, 890, "walk", R], [675, 1200])] });

shot({ t: 675.0, chapter: "The house of bread and cake", world: "candy", sky: "sweet", P: {}, cam: cam(1000, 1.0, 1100, 1.15), fx: [["sparkle", 18, .7], ["motes", 30]],
  cast: [A("whitebird", [675, 700, "fly", { y: 380 }], [676.5, 1150, "fly", { y: 330 }], [677.6, 1150, "perch", { face: -1, y: 338 }]),
         A("hansel", [675, 500, "walk", R], [681.8, 860, "stand", R]), A("gretel", [675, 420, "walk", R], [681.8, 790, "stand", R])] });

shot({ t: 681.8, world: "candy", sky: "sweet", P: {}, cam: { from: { x: 1150, y: 430, z: 1.9 }, to: { x: 1150, y: 600, z: 1.8 }, px: 1150, pz: 1.6 }, fx: [["sparkle", 24, .9], ["motes", 20]],
  cast: [A("whitebird", [681.8, 1150, "perch", { face: -1, y: 338 }])] });

shot({ t: 689.4, world: "candy", sky: "sweet", P: { bitten: 0 }, cam: cam(980, 1.6, 1000, 1.75), fx: [["sparkle", 18, .7]],
  cast: [A("hansel", [689.4, 900, "talk", R], [700.8, 950, "reach", R], [704.6, 950, "eat", { face: 1, extras: { cake: true } }]),
         A("gretel", [689.4, 830, "stand", R], [706.5, 1040, "walk", R], [708, 1040, "eat", { face: 1, extras: { cake: true } }])] });

shot({ t: 710.9, world: "candy", sky: "sweet", P: { witchWindow: 0 }, anim: { witchWindow: [0, 1, 711, 714] }, cam: cam(1100, 1.75, 1100, 1.9), fx: [["sparkle", 10, .5]],
  cast: [A("hansel", [710.9, 950, "stand", R], [721.8, 950, "talk", R], [730, 950, "eat", { face: 1, extras: { cake: true } }]),
         A("gretel", [710.9, 1040, "stand", R], [721.8, 1040, "talk", R], [730, 1040, "eat", { face: 1, extras: { cake: true } }])] });

shot({ t: 736.5, world: "candy", sky: "sweet", P: { bitten: 1 }, cam: cam(1000, 1.6, 1000, 1.7), fx: [["sparkle", 16, .6]],
  cast: [A("hansel", [736.5, 950, "reach", R], [741, 950, "eat", { face: 1, extras: { cake: true } }]), A("gretel", [736.5, 1040, "eat", R], [746, 1040, "sit", { face: 1, extras: { cake: true } }])] });

// ------------------------------------------------------------------ the old woman
shot({ t: 750.4, chapter: "The old woman", world: "candy", sky: "sweet", P: { door: "open" }, cam: cam(1050, 1.4, 1060, 1.6), fx: [["motes", 20]],
  cast: [A("witch", [750.4, 1150, "stand", L], [752.3, 1150, "creep", { face: -1, extras: { crutch: true } }], [760, 1110, "stand", { face: -1, extras: { crutch: true } }]),
         A("hansel", [750.4, 950, "eat", R], [760.1, 950, "cower", R]), A("gretel", [750.4, 1010, "sit", R], [760.1, 880, "cower", R])] });

shot({ t: 768.1, world: "candy", sky: "sweet", P: { door: "open" }, cam: cam(1040, 1.7, 1060, 1.85),
  cast: [A("witch", [768.1, 1120, "talk", { face: -1, extras: { crutch: true } }], [782.6, 1120, "creep", { face: 1, extras: { crutch: true } }], [787, 1170]),
         A("hansel", [768.1, 960, "stand", R], [782.6, 960, "walk", R], [787, 1100]), A("gretel", [768.1, 890, "stand", R], [782.6, 890, "walk", R], [787, 1040])] });

shot({ t: 787.1, chapter: "A warm welcome", world: "witchhouse", sky: "hearth", P: { table: true, cage: false, heat: .35 }, cam: cam(960, 1.5, 960, 1.65), fx: [["motes", 20, .6]],
  cast: [A("hansel", [787.1, 860, "eat", R]), A("gretel", [787.1, 1120, "eat", L]), A("witch", { nofocus: true }, [787.1, 1300, "stand", { face: -1, extras: { crutch: true } }])] });

shot({ t: 796.4, world: "witchhouse", sky: "hearth", P: { beds: true, cage: false, heat: .25 }, cam: cam(540, 1.5, 560, 1.65), fx: [["sparkle", 14, .4], ["motes", 16, .5]],
  cast: [A("hansel", { until: 799 }, [796.4, 250, "walk", R], [799, 330]), A("gretel", { until: 799.5 }, [796.4, 560, "walk", R], [799.5, 650]), A("hansel", { from: 799, ground: -68 }, [799, 385, "sleep", R]), A("gretel", { from: 799.5, ground: -68 }, [799.5, 705, "sleep", R])] });

shot({ t: 809.0, chapter: "The wicked witch", world: "witchhouse", sky: "ember", P: { cage: false, heat: 1, ovenOpen: 1 }, cam: cam(1200, 1.4, 1250, 1.75), fx: [["embers", 30]],
  cast: [A("witch", [809, 1100, "stand", { face: 1, extras: { crutch: true } }], [813, 1100, "talk", { face: -1, extras: { crutch: true } }])] });

shot({ t: 835.8, world: "candy", sky: "night", P: { door: "open" }, cam: cam(1100, 1.7, 1100, 1.95), fx: [["fireflies", 8, .4]],
  cast: [A("witch", [835.8, 1110, "peer", { face: -1, extras: { crutch: true } }], [848.6, 1110, "talk", { face: -1, extras: { crutch: true } }])] });

// ------------------------------------------------------------------ Hansel in the stable
shot({ t: 858.0, chapter: "Hansel is caged", world: "witchhouse", sky: "hearth", P: { beds: true, cage: false, heat: .3 }, cam: cam(560, 1.5, 600, 1.65),
  cast: [A("hansel", { ground: -68 }, [858, 385, "sleep", R]), A("gretel", { ground: -68 }, [858, 705, "sleep", R]),
         A("witch", [858, 1000, "creep", { face: -1, extras: { crutch: true } }], [862.6, 880, "peer", L], [868.7, 880, "talk", L])] });

shot({ t: 874.8, world: "witchhouse", sky: "ember", P: { heat: .6, cageOpen: true }, cam: cam(800, 1.4, 650, 1.55),
  cast: [A("witch", { until: 880.2 }, [874.8, 1000, "creep", L], [880.2, 640]), A("hansel", { until: 880.2 }, [874.8, 940, "cower", L], [880.2, 580])] });

shot({ t: 880.2, world: "witchhouse", sky: "ember", P: { heat: .6 }, cam: cam(560, 1.8, 560, 1.95),
  cast: [A("hansel", [880.2, 520, "hold", R], [883.4, 520, "cower", R]), A("witch", [880.2, 760, "stand", L])] });

shot({ t: 887.4, world: "witchhouse", sky: "hearth", P: { beds: true, cage: false, heat: .5 }, cam: cam(700, 1.6, 680, 1.75),
  cast: [A("gretel", { ground: -68 }, [887.4, 705, "sleep", R], [891.5, 705, "sit", R]), A("witch", [887.4, 840, "grope", L], [891.5, 840, "talk", L], [896.2, 840, "point", R])] });

shot({ t: 905.9, world: "witchhouse", sky: "hearth", P: { cauldron: 950, cage: false, heat: .4 }, cam: cam(950, 1.7, 950, 1.85), fx: [["motes", 16, .5]],
  cast: [A("gretel", [905.9, 860, "sad", R], [910.4, 860, "crouch", R])] });

shot({ t: 916.0, world: "witchhouse", sky: "hearth", P: { heat: .4 }, cam: cam(600, 1.6, 700, 1.7),
  cast: [A("hansel", [916, 520, "eat", { face: 1, extras: { cake: true } }]), A("gretel", [916, 820, "sad", L])] });

shot({ t: 922.6, chapter: "The bone", world: "witchhouse", sky: "ember", P: { heat: .5 }, cam: cam(620, 1.8, 600, 2.0),
  cast: [A("witch", [922.6, 900, "creep", { face: -1, extras: { crutch: true } }], [926, 740, "grope", L], [942.1, 740, "talk", L]),
         A("hansel", [922.6, 560, "stand", R], [932.9, 600, "offer", { face: 1, extras: { bone: true } }])] });

shot({ t: 947.6, world: "witchhouse", sky: "ember", P: { heat: .7 }, cam: cam(800, 1.35, 850, 1.5), fx: [["embers", 14, .6]],
  cast: [A("witch", [947.6, 900, "creep", { face: 1, extras: { crutch: true } }], [951, 1050, "creep", { face: -1, extras: { crutch: true } }], [954, 900, "creep", { face: 1, extras: { crutch: true } }], [956.8, 980, "talk", L]),
         A("gretel", [947.6, 760, "stand", R], [961.9, 760, "sad", R]), A("hansel", { nofocus: true }, [947.6, 520, "hold", R])] });

shot({ t: 968.1, world: "witchhouse", sky: "hearth", P: { cauldron: 1000, cage: false, heat: .5 }, cam: cam(900, 1.6, 980, 1.75), fx: [["motes", 16, .4]],
  cast: [A("gretel", [968.1, 700, "carry", R], [975, 920, "sad", R], [978.2, 920, "talk", R]), A("witch", { from: 988 }, [988, 1180, "talk", { face: -1, extras: { crutch: true } }])] });

// ------------------------------------------------------------------ the oven
shot({ t: 998.3, chapter: "The oven", world: "witchhouse", sky: "ember", P: { cauldron: 700, heat: .8, cage: false }, cam: cam(900, 1.3, 1000, 1.4), fx: [["embers", 20]],
  cast: [A("gretel", [998.3, 640, "crouch", R]), A("witch", [998.3, 1150, "stand", L], [1006.3, 1150, "talk", L])] });

shot({ t: 1014.8, world: "witchhouse", sky: "ember", P: { heat: 1, cage: false }, cam: cam(1200, 1.4, 1300, 1.55), fx: [["embers", 34]],
  cast: [A("gretel", [1014.8, 900, "walk", R], [1018, 1120, "stand", R], [1023, 1120, "cower", R]), A("witch", [1014.8, 760, "creep", { face: 1, extras: { crutch: true } }], [1018, 980, "talk", R], [1023.1, 980, "point", R])] });

shot({ t: 1031.5, world: "witchhouse", sky: "ember", P: { heat: 1, cage: false }, cam: cam(1050, 2.0, 1060, 2.2), fx: [["embers", 20]],
  cast: [A("witch", [1031.5, 1000, "talk", R], [1036, 1000, "peer", R]), A("gretel", { from: 1039.9 }, [1039.9, 1140, "talk", L])] });

shot({ t: 1052.9, world: "witchhouse", sky: "ember", P: { heat: 1, cage: false }, cam: cam(1250, 1.5, 1300, 1.7), fx: [["embers", 30]],
  cast: [A("witch", [1052.9, 1040, "talk", { face: 1, extras: { crutch: true } }], [1056.6, 1040, "creep", R], [1059.2, 1230, "peer", R]),
         A("gretel", [1052.9, 1120, "stand", L], [1056, 1010, "walk", R], [1059, 1100, "stand", R])] });

shot({ t: 1063.9, world: "witchhouse", sky: "ember", P: { heat: 1, cage: false, ovenOpen: 1 }, anim: { ovenOpen: [1, 0, 1067.8, 1068.8] }, flash: [1068.4, .9],
  cam: cam(1290, 1.7, 1320, 1.8), fx: [["embers", 40]],
  cast: [A("witch", { until: 1066.2 }, [1063.9, 1235, "fall", R], [1066.2, 1350]), A("gretel", [1063.9, 1110, "push", R], [1065.5, 1190, "push", R], [1067.5, 1220, "push", R])] });

shot({ t: 1073.3, world: "witchhouse", sky: "ember", P: { heat: 1.4, cage: false, ovenOpen: 0 }, cam: cam(1250, 1.4, 1150, 1.3), fx: [["embers", 50]],
  cast: [A("gretel", [1073.3, 1180, "cower", R], [1077.3, 1150, "run", L], [1084, 500])] });

shot({ t: 1084.7, chapter: "Free!", world: "witchhouse", sky: "hearth", P: { heat: .8 }, cam: cam(800, 1.4, 600, 1.6),
  cast: [A("gretel", [1084.7, 1000, "run", L], [1088.4, 700, "talk", L]), A("hansel", [1084.7, 520, "hold", R])] });

shot({ t: 1090.3, world: "witchhouse", sky: "hearth", P: { heat: .8, cageOpen: true }, cam: cam(650, 1.6, 700, 1.75), fx: [["sparkle", 12, .5]],
  cast: [A("hansel", [1090.3, 520, "joy", R], [1095.5, 520, "run", R], [1098, 690, "dance", R], [1100.6, 690, "hug", R], [1102.9, 690, "dance", R], [1106, 760]),
         A("gretel", [1090.3, 720, "joy", L], [1100.6, 740, "hug", L], [1102.9, 740, "dance", L], [1106, 820])] });

shot({ t: 1106.3, chapter: "Pearls and jewels", world: "witchhouse", sky: "hearth", P: { treasure: 1000, cage: false, heat: .3 }, cam: cam(1000, 1.7, 1000, 1.9), fx: [["sparkle", 24]],
  cast: [A("hansel", [1106.3, 870, "walk", R], [1110.9, 900, "crouch", R], [1116.9, 900, "talk", { face: 1, extras: { jewels: true } }], [1120.6, 900, "crouch", R]),
         A("gretel", [1106.3, 1180, "walk", L], [1110.9, 1100, "crouch", L], [1124.1, 1100, "talk", { face: -1, extras: { jewels: true } }], [1128.2, 1100, "crouch", L])] });

shot({ t: 1131.7, world: "woods", sky: "day", P: {}, cam: cam(900, 1.4, 1150, 1.4), fx: [["motes", 40], ["leaves", 8]],
  cast: [A("hansel", [1131.7, 760, "talk", L], [1134.4, 760, "walk", R], [1138.4, 1200]), A("gretel", [1131.7, 680, "stand", R], [1134.4, 680, "walk", R], [1138.4, 1120])] });

// ------------------------------------------------------------------ the white duck
shot({ t: 1138.4, chapter: "The white duck", world: "lake", sky: "lake", P: { leftShore: 700 }, cam: cam(800, 1.2, 760, 1.35), fx: [["motes", 20]],
  cast: [A("hansel", [1138.4, 300, "walk", R], [1142, 640, "stand", R], [1143.7, 640, "talk", L]), A("gretel", [1138.4, 230, "walk", R], [1142, 570, "stand", R], [1151.2, 570, "talk", R], [1154.1, 570, "point", R]),
         A("duck", { ground: -70, nofocus: true }, [1138.4, 1350, "swim", L], [1160, 1150, "swim", L])] });

shot({ t: 1160.6, world: "lake", sky: "lake", P: { leftShore: 700 }, cam: cam(780, 1.55, 780, 1.7), fx: [["sparkle", 10, .5]],
  cast: [A("gretel", [1160.6, 600, "joy", R], [1166.9, 600, "talk", R]), A("hansel", [1160.6, 530, "stand", R]),
         A("duck", { ground: -70 }, [1160.6, 1150, "swim", L], [1179.9, 830, "swim", L])] });

shot({ t: 1179.9, world: "lake", sky: "lake", P: { leftShore: 700 }, cam: cam(760, 1.7, 780, 1.85),
  cast: [A("duck", { ground: -70 }, [1179.9, 830, "swim", L], [1182.3, 800, "swim", R]),
         A("hansel", { until: 1182.3 }, [1179.9, 650, "walk", R], [1182.3, 790]), A("hansel", { from: 1182.3, ground: -68 }, [1182.3, 800, "ride", R]),
         A("gretel", [1179.9, 590, "stand", R], [1188.4, 590, "talk", R])] });

shot({ t: 1197.2, world: "lake", sky: "lake", P: { leftShore: 600, rightShore: 1600 }, cam: { from: { x: 900, z: 1.25 }, to: { x: 1250, z: 1.3 } }, fx: [["motes", 20]],
  cast: [A("duck", { ground: -70 }, [1197.2, 800, "swim", R], [1202, 1350]), A("hansel", { ground: -68 }, [1197.2, 800, "ride", R], [1202, 1350, "ride", R]),
         A("gretel", { nofocus: true }, [1197.2, 520, "stand", R])] });

// ------------------------------------------------------------------ home
shot({ t: 1202.1, chapter: "Home", world: "woods", sky: "day", P: { shafts: 1.4 }, cam: cam(800, 1.3, 1100, 1.35), fx: [["motes", 40], ["leaves", 10]],
  cast: [A("hansel", [1202.1, 500, "walk", R], [1208, 1100]), A("gretel", [1202.1, 430, "walk", R], [1208, 1030])] });

shot({ t: 1208.0, world: "cottage", sky: "day", P: {}, cam: cam(900, 1.0, 1000, 1.15), fx: [["motes", 30]],
  cast: [A("hansel", [1208, 300, "walk", R], [1213, 520, "run", R], [1216.4, 1150]), A("gretel", [1208, 230, "walk", R], [1213, 450, "run", R], [1216.4, 1080])] });

shot({ t: 1216.4, world: "home", sky: "hearth", P: {}, cam: cam(1000, 1.6, 1000, 1.8), fx: [["motes", 20, .6]],
  cast: [A("father", [1216.4, 1100, "sad", L], [1217.5, 1100, "hug", L]), A("hansel", [1216.4, 760, "run", R], [1217.5, 990, "hug", R]), A("gretel", [1216.4, 700, "run", R], [1218, 930, "hug", R])] });

shot({ t: 1229.7, world: "home", sky: "hearth", P: { jewels: 0 }, anim: { jewels: [0, 1, 1229.7, 1240] }, cam: cam(900, 1.6, 900, 1.7), fx: [["sparkle", 30]],
  cast: [A("gretel", [1229.7, 760, "crouch", { face: 1, extras: { jewels: true } }]), A("hansel", [1229.7, 960, "stand", L], [1235.1, 960, "crumble", { face: -1, extras: { jewels: true } }]),
         A("father", [1229.7, 1150, "joy", L])] });

shot({ t: 1241.8, world: "home", sky: "hearth", P: { jewels: 1 }, cam: cam(1000, 1.4, 1000, 1.55), fx: [["sparkle", 30], ["motes", 20, .6]],
  cast: [A("father", [1241.8, 1080, "hug", L]), A("hansel", [1241.8, 900, "dance", R], [1244.6, 880, "hug", R]), A("gretel", [1241.8, 840, "joy", R], [1244.6, 830, "hug", R])] });

shot({ t: 1249.7, chapter: "The end", world: "title", sky: "night", P: { title: "The End", subtitle: "“There runs a mouse…”" }, cam: cam(1000, 1, 1000, 1.06), fx: [["fireflies", 16], ["motes", 30, .6]],
  cast: [A("mouse", [1252, 300, "scurry", R], [1256, 1700])] });

window.STORY = { absolute: true, duration: 1275.74, title: "Hansel and Gretel", shots: S };
})();
