// char_lev — retired broadcast/TV engineer. Direct pixel authoring.
// Design card: art/direction/character_cards/lev.md
// Template: art/direction/character_template.md (structure copied from
// art/source/char/arkady.ts, the approved pilot).
//
// Run: corepack pnpm exec tsx art/source/char/lev.ts
// Emits sheet + per-pose PNGs + silhouette into art/review_queue/char/.
//
// Card highlights baked in:
// - Shortest of cast, permanent stoop (never straightens, even standing).
// - Head tilted 1 px toward sound sources; perched forward on the seat by 2 px.
// - Round-square face gathered around large round glasses (two silhouette
//   notches); big ears kept visible; bald crown + untidy horseshoe fringe.
// - Glasses never come off (frame soot_0, lens soot_1) in any pose.
// - Signature: pocket radio held to the ear, eyes elsewhere (drawn as a small
//   held prop in the near hand — a personal held item, not a table prop).

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPalette } from "../../../scripts/art-pipeline/palette.ts";
import { SpriteCanvas } from "../../../scripts/art-pipeline/sprite.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "art/review_queue/char");
const palette = loadPalette(join(ROOT, "art/palette/wd-palette-v1.json"));

// ---------------------------------------------------------------- constants
const VERSION = "v002";
const FRAME_W = 48;
const FRAME_H = 96;
const FOOT_Y = 93; // last shoe row
const SEAT_Y = 69; // pelvis bottom row (seat plane, 24 px above foot line)
const STAND_CROWN = 14; // 80 px standing (stooped, card-locked)
const SEAT_CROWN = 34; // 60 px seated crown-to-floor (card-locked)

// Palette roles (from the design card)
const OUTLINE = "soot_0";
const JACKET_LIT = "olive_2";
const JACKET_SHD = "olive_1";
const JACKET_DEEP = "olive_0";
const SHIRT = "cream_2";
const SHIRT_SHD = "cream_1";
const TROUSER_LIT = "soot_2";
const TROUSER_SHD = "soot_1";
const SKIN = "flesh_1"; // base — balanced with flesh_0, not inverted (card: ruddy-warm)
const SKIN_SHD = "flesh_0"; // generous shadow plane
const SKIN_HI = "flesh_2"; // crown / nose tip / glasses-lit cheek glints
const FRINGE_LIT = "soot_4";
const FRINGE_SHD = "soot_3";
const STUBBLE = "soot_4"; // sparse jaw fleck over flesh_0
const GLASSES_FRAME = OUTLINE;
const GLASSES_LENS = "soot_1"; // QA: cyan is CRT-reserved; dark glass, no glow
const SHOE_LIT = "wood_1";
const SHOE_SHD = "wood_0";
const RADIO_BODY = "soot_2";
const RADIO_DIAL = "soot_4";

// ---------------------------------------------------------------- helpers (copied verbatim, see arkady.ts)
function blit(
  c: SpriteCanvas,
  x: number,
  y: number,
  rows: string[],
  legend: Record<string, string>,
): void {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? "";
    for (let q = 0; q < row.length; q++) {
      const ch = row[q];
      if (ch === "." || ch === " " || ch === undefined) continue;
      const id = legend[ch];
      if (!id) throw new Error(`blit: no legend entry for "${ch}"`);
      c.setPixel(x + q, y + r, id);
    }
  }
}

function span(c: SpriteCanvas, x0: number, x1: number, y: number, id: string): void {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) c.setPixel(x, y, id);
}

function inlineOutline(c: SpriteCanvas): void {
  const edge: Array<[number, number]> = [];
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (c.getPixel(x, y) === null) continue;
      if (
        c.getPixel(x - 1, y) === null ||
        c.getPixel(x + 1, y) === null ||
        c.getPixel(x, y - 1) === null ||
        c.getPixel(x, y + 1) === null
      ) {
        edge.push([x, y]);
      }
    }
  }
  for (const [x, y] of edge) c.setPixel(x, y, OUTLINE);
}

function layer(target: SpriteCanvas, draw: (l: SpriteCanvas) => void): void {
  const l = new SpriteCanvas(target.width, target.height, palette);
  draw(l);
  inlineOutline(l);
  for (let y = 0; y < l.height; y++) {
    for (let x = 0; x < l.width; x++) {
      const id = l.getPixel(x, y);
      if (id !== null) target.setPixel(x, y, id);
    }
  }
}

function toSilhouette(c: SpriteCanvas): void {
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (c.getPixel(x, y) !== null) c.setPixel(x, y, OUTLINE);
    }
  }
}

function limb(
  c: SpriteCanvas,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  w: number,
  id: string,
): void {
  const steps = Math.abs(y1 - y0);
  for (let i = 0; i <= steps; i++) {
    const y = y0 + Math.sign(y1 - y0 || 1) * i;
    const x = Math.round(x0 + (x1 - x0) * (steps === 0 ? 0 : i / steps));
    span(c, x - Math.floor(w / 2), x - Math.floor(w / 2) + w - 1, y, id);
  }
}

// ---------------------------------------------------------------- head
// 13w x 15h, facing left 3/4, EXPLICITLY outlined (o) — hand-drawn identity
// asset. Round-square short face gathered around large round glasses (two
// lens notches read at silhouette scale); bald dome with untidy horseshoe
// fringe of curly gray at the back/sides; big ear kept prominent at the
// occiput edge; short fleshy upturned nose juts hard at the front edge;
// soft round small chin. Skin: flesh_1 base BALANCED with generous flesh_0
// shadow (ruddy-warm, not inverted like arkady) with flesh_2 glints on the
// bald crown, nose tip, and glasses-lit cheek.
const HEAD_LEGEND: Record<string, string> = {
  o: OUTLINE,
  H: FRINGE_LIT,
  h: FRINGE_SHD,
  f: SKIN,
  s: SKIN_SHD,
  F: SKIN_HI,
  g: GLASSES_FRAME,
  G: GLASSES_LENS,
  E: SKIN_SHD, // ear inner
  u: STUBBLE,
};

// prettier-ignore
const HEAD_BASE = [
  "....oooooo...", // r0  bald crown top, narrow dome
  "...oFFFFFho..", // r1  bright bald dome, flesh_2 glint; fringe edge (h) at back
  "..oFFfffHho..", // r2  dome; fringe patch onset at back (H)
  "..offffHHho..", // r3  forehead flat; fringe thickens toward back
  ".offssHHhhoo.", // r4  brow ridge begins; ear starts poking out (back bump)
  ".ogGgsgGghEEo", // r5  glasses: L lens, bridge, R lens; ear body sticks out
  ".ofGgsgGgsEEo", // r6  eye row behind glasses; ear body
  ".ossssssssEo.", // r7  cheek; glasses lower rim; ear tapering
  "ossssssssso..", // r8  cheek plane
  "fsssssssso...", // r9  nose bridge; front nose edge juts (flesh_1 tip)
  "ossssssso....", // r10 short fleshy upturned nose tip
  ".ossssso.....", // r11 under nose
  "..ouuuo......", // r12 mouth row; stubble fleck across jaw
  "...oso.......", // r13 soft round jaw, small chin
  "....oso......", // r14 chin underside
];

interface FaceOpts {
  blink?: boolean;
  talk?: boolean;
  hooded?: boolean;
}

function headDetails(c: SpriteCanvas, hx: number, hy: number, o: FaceOpts = {}): void {
  // heavy mobile brow, drawn 1 px thick directly above the lenses — the
  // expressive feature above the glasses (card: habitually slightly raised).
  c.setPixel(hx + 3, hy + 4, OUTLINE);
  c.setPixel(hx + 4, hy + 4, OUTLINE);
  c.setPixel(hx + 7, hy + 4, OUTLINE);
  // eyes behind the lenses; glasses never come off. Open: lens stays dark
  // (glasses glare, "eyes elsewhere"). Blink/hooded: lens dims to skin-shadow.
  if (o.blink || o.hooded) {
    c.setPixel(hx + 3, hy + 5, SKIN_SHD);
    c.setPixel(hx + 3, hy + 6, SKIN_SHD);
    c.setPixel(hx + 7, hy + 5, SKIN_SHD);
    c.setPixel(hx + 7, hy + 6, SKIN_SHD);
  }
  if (o.talk) {
    c.setPixel(hx + 3, hy + 12, OUTLINE);
    c.setPixel(hx + 4, hy + 12, OUTLINE);
  } else {
    c.setPixel(hx + 4, hy + 12, OUTLINE);
  }
}

function drawHeadLayer(l: SpriteCanvas, hx: number, hy: number, collarY: number): void {
  // short thick neck (compact frame)
  for (let y = hy + 13; y <= collarY + 1; y++) {
    l.setPixel(hx + 4, y, SKIN);
    l.setPixel(hx + 5, y, SKIN_SHD);
    l.setPixel(hx + 6, y, SKIN_SHD);
    l.setPixel(hx + 7, y, SKIN_SHD);
  }
  blit(l, hx, hy, HEAD_BASE, HEAD_LEGEND);
}

// ---------------------------------------------------------------- torso
interface TorsoOpts {
  lean?: number;
  drop?: number;
  bottom?: number;
}

/** Torso mass: shoulders 19 px wide (cx±9-10), compact wiry frame, waist pinch. */
function drawTorso(l: SpriteCanvas, cx: number, top: number, o: TorsoOpts = {}): void {
  const lean = o.lean ?? 0;
  const drop = o.drop ?? 0;
  const bottom = o.bottom ?? SEAT_Y;
  const shoulderY = top + drop;
  const rows = bottom - shoulderY;
  for (let i = 0; i <= rows; i++) {
    const y = shoulderY + i;
    const t = i / rows;
    let half: number;
    if (i === 0)
      half = 6; // narrow shoulder slope (small frame)
    else if (i === 1) half = 8;
    else if (t < 0.6)
      half = Math.round(9 - 4 * (t / 0.6)); // to waist 5
    else half = Math.round(5 + 1.5 * ((t - 0.6) / 0.4)); // pelvis 6.5
    const shift = Math.round(lean * (1 - t));
    const back = t > 0.78 && o.bottom === undefined ? 1 : 0;
    const x0 = cx - half + shift + back;
    const x1 = cx + half + shift + back;
    const split = cx + 1 + shift;
    span(l, x0, Math.min(split, x1), y, JACKET_LIT);
    if (split + 1 <= x1) span(l, split + 1, x1, y, JACKET_SHD);
  }
}

function torsoDetails(c: SpriteCanvas, cx: number, top: number, o: TorsoOpts = {}): void {
  const lean = o.lean ?? 0;
  const drop = o.drop ?? 0;
  const bottom = o.bottom ?? SEAT_Y;
  const shoulderY = top + drop;
  const rows = bottom - shoulderY;
  const px = (i: number) => Math.round(lean * (1 - i / rows));
  // jacket worn OPEN always (card: jacket is never buttoned) — shirt strip
  // shows the whole way down beside the open front edge.
  const colX = cx - 4;
  c.setPixel(colX + px(1), shoulderY + 1, SHIRT);
  c.setPixel(colX + 1 + px(1), shoulderY + 1, SHIRT_SHD);
  for (let i = 2; i <= rows - 2; i++) {
    const x = colX + px(i);
    c.setPixel(x + 1, shoulderY + i, SHIRT);
    c.setPixel(x + 2, shoulderY + i, SHIRT_SHD);
  }
  // rolled sleeves: a flesh cuff band replaces the jacket cuff detail — drawn
  // in armDetails instead so it composites over the sleeve fill.
  // chest pocket screwdriver: 2 px soot_4 + red_0 handle
  c.setPixel(cx - 6, shoulderY + 3, "soot_4");
  c.setPixel(cx - 6, shoulderY + 4, "red_1");
  // pocket bulge (radio) — deep jacket shade pixel low on the front
  c.setPixel(cx - 7, shoulderY + Math.round(rows * 0.5), JACKET_DEEP);
}

// ---------------------------------------------------------------- limbs
interface ArmSpec {
  sx?: number;
  sy?: number;
  ex: number;
  ey: number;
  hx: number;
  hy: number;
  lit: boolean;
  bare?: boolean; // rolled sleeve: forearm renders in skin, not cloth
}

/**
 * Sleeves rolled to the elbow (card: always, even under the jacket): the
 * forearm segment renders bare (skin) rather than cloth for seated poses.
 */
function drawArmLayer(l: SpriteCanvas, a: ArmSpec, handDir = -1): void {
  const sleeve = a.lit ? JACKET_LIT : JACKET_SHD;
  const forearm = a.bare ? (a.lit ? SKIN : SKIN_SHD) : sleeve;
  if (a.sx !== undefined && a.sy !== undefined) limb(l, a.sx, a.sy, a.ex, a.ey, 3, sleeve);
  const dx = Math.abs(a.hx - a.ex);
  const dy = Math.abs(a.hy - a.ey);
  if (dx > dy) {
    for (let i = 0; i <= dx; i++) {
      const x = a.ex + Math.sign(a.hx - a.ex) * i;
      const y = Math.round(a.ey + (a.hy - a.ey) * (i / dx));
      l.setPixel(x, y - 1, forearm);
      l.setPixel(x, y, forearm);
      l.setPixel(x, y + 1, forearm);
    }
  } else {
    limb(l, a.ex, a.ey, a.hx, a.hy, 3, forearm);
  }
  if (handDir === 0) {
    for (let dyh = 0; dyh <= 2; dyh++) {
      l.setPixel(a.hx - 1, a.hy + dyh, dyh === 0 ? SKIN : SKIN_SHD);
      l.setPixel(a.hx, a.hy + dyh, SKIN_SHD);
    }
  } else {
    for (let dxh = 0; dxh <= 2; dxh++) {
      l.setPixel(a.hx + handDir * dxh, a.hy - 1, dxh === 1 ? SKIN : SKIN_SHD);
      l.setPixel(a.hx + handDir * dxh, a.hy, SKIN_SHD);
    }
  }
}

/** Rolled-sleeve elbow band (skin/cloth boundary) instead of a cream cuff. */
function armDetails(c: SpriteCanvas, a: ArmSpec): void {
  if (a.sx !== undefined && a.sy !== undefined) {
    c.setPixel(a.sx, Math.round((a.sy + a.ey) / 2), JACKET_DEEP);
  }
}

function drawSeatedLegLayer(
  l: SpriteCanvas,
  hipX: number,
  kneeX: number,
  footX: number,
  toe: number,
  lit: boolean,
): void {
  const trouser = lit ? TROUSER_LIT : TROUSER_SHD;
  const thighTop = SEAT_Y - 4; // shorter thigh (compact frame)
  for (let y = thighTop; y <= SEAT_Y; y++) {
    span(l, kneeX - 2, hipX, y, y === thighTop ? TROUSER_LIT : trouser);
  }
  limb(l, kneeX, SEAT_Y + 1, footX, FOOT_Y - 3, 4, trouser);
  for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) {
    span(l, footX - toe + (FOOT_Y - y) * 2, footX + 1, y, SHOE_LIT);
  }
}

function legDetails(c: SpriteCanvas, kneeX: number): void {
  c.setPixel(kneeX, SEAT_Y + 3, "soot_3"); // shiny worn patch at the knee
  c.setPixel(kneeX, SEAT_Y + 4, "soot_3");
  c.setPixel(kneeX - 4, FOOT_Y - 1, SHOE_SHD); // sole line
}

// ---------------------------------------------------------------- poses
type Pose =
  | "seated_listen"
  | "seated_listen_breath"
  | "seated_listen_blink"
  | "seated_talk"
  | "lean_in"
  | "lean_back"
  | "standing"
  | "signature"
  | "exhausted";

const CX = 24; // seated torso center — 2 px forward of arkady's 26 (perched forward on the seat)

function drawPose(c: SpriteCanvas, pose: Pose): void {
  if (pose === "standing") return drawStanding(c);
  const breath = pose === "seated_listen_breath" ? -1 : 0;
  const face: FaceOpts = {
    blink: pose === "seated_listen_blink",
    talk: pose === "seated_talk",
    hooded: pose === "exhausted",
  };
  const exhausted = pose === "exhausted";
  const lean = pose === "lean_in" ? -3 : pose === "lean_back" ? 2 : 0;
  const drop = exhausted ? 1 : 0;

  const torsoTop = SEAT_CROWN + 17 + breath; // shoulders y51 nominal (short neck, compact frame)
  // permanent stoop: head always carried well forward, further than the cast
  // norm, plus the card's 1 px tilt toward sound (baked as a steady 1 px here).
  const headFwd = exhausted ? -6 : pose === "lean_in" ? -7 : pose === "lean_back" ? -3 : -5;
  const headDown = exhausted ? 3 : pose === "lean_in" ? 1 : 1; // stoop keeps head low even at rest
  const hx = CX - 5 + headFwd + Math.round(lean * 0.8);
  const hy = SEAT_CROWN + breath + headDown + drop - 1; // tilt: crown 1 px toward signal source

  const shift = Math.round(lean * 0.9);
  const bare = true; // sleeves always rolled to the elbow, even seated
  let farArm: ArmSpec;
  let nearArm: ArmSpec;
  if (pose === "signature") {
    // pocket radio held to the ear: near forearm raised, wrist near the head
    farArm = { ex: CX - 3 + shift, ey: SEAT_Y - 10, hx: CX - 7, hy: SEAT_Y - 11, lit: false, bare };
    nearArm = { ex: CX - 4 + shift, ey: SEAT_Y - 8, hx: hx + 2, hy: hy + 8, lit: true, bare };
  } else if (exhausted) {
    farArm = { ex: CX - 3 + shift, ey: SEAT_Y - 5, hx: CX - 7, hy: SEAT_Y - 6, lit: false, bare };
    nearArm = { ex: CX - 4 + shift, ey: SEAT_Y - 8, hx: CX - 10, hy: SEAT_Y - 5, lit: true, bare };
  } else if (pose === "lean_back") {
    farArm = { ex: CX - 2 + shift, ey: SEAT_Y - 7, hx: CX - 5, hy: SEAT_Y - 8, lit: false, bare };
    nearArm = { ex: CX - 3 + shift, ey: SEAT_Y - 9, hx: CX - 8, hy: SEAT_Y - 7, lit: true, bare };
  } else if (pose === "lean_in") {
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 12, hx: CX - 9, hy: SEAT_Y - 14, lit: false, bare };
    nearArm = {
      ex: CX - 5 + shift,
      ey: SEAT_Y - 11,
      hx: CX - 13,
      hy: SEAT_Y - 14,
      lit: true,
      bare,
    };
  } else {
    // listen/talk: two fingers of the near hand rest ready to tap the table
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 12, hx: CX - 8, hy: SEAT_Y - 13, lit: false, bare };
    nearArm = {
      ex: CX - 4 + shift,
      ey: SEAT_Y - 11,
      hx: CX - 12,
      hy: SEAT_Y - 13,
      lit: true,
      bare,
    };
  }

  layer(c, (l) => drawArmLayer(l, farArm));
  layer(c, (l) => drawSeatedLegLayer(l, CX + 5, 16, 18, 4, false));
  layer(c, (l) => drawSeatedLegLayer(l, CX + 4, 12, 12, 7, true));
  layer(c, (l) => drawTorso(l, CX, torsoTop, { lean, drop }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, pose === "signature" ? 0 : -1));

  headDetails(c, hx, hy, face);
  torsoDetails(c, CX, torsoTop, { lean, drop });
  legDetails(c, 12);
  armDetails(c, farArm);
  armDetails(c, nearArm);
  if (pose === "signature") {
    // pocket radio at the ear, hand-twisted wire antenna
    const rx = nearArm.hx;
    const ry = nearArm.hy;
    c.setPixel(rx, ry - 1, RADIO_BODY);
    c.setPixel(rx + 1, ry - 1, RADIO_BODY);
    c.setPixel(rx, ry - 2, RADIO_BODY);
    c.setPixel(rx + 1, ry - 2, RADIO_DIAL);
    c.setPixel(rx + 2, ry - 3, OUTLINE); // antenna wire stub
    c.setPixel(rx + 2, ry - 4, OUTLINE);
  }
}

function drawStanding(c: SpriteCanvas): void {
  // stoop persists even standing (card: never straightens his back) — torso
  // itself is baked with a forward lean (shoulders pulled toward the nose
  // side, eased out at the hips) plus the head carried well forward of the
  // chest line, so the whole figure reads as a permanent forward curve.
  const cx = 24;
  const stoop = -3; // shoulders shift toward the front (nose) side
  const torsoTop = STAND_CROWN + 18; // shoulders y32
  const hipY = STAND_CROWN + 42; // hem y56 (short frame)
  const hx = cx - 5 - 6 + stoop; // head well forward of chest line
  const hy = STAND_CROWN; // full 80 px locked height (crown to foot line)

  const farArm: ArmSpec = {
    sx: cx + 6 + stoop,
    sy: torsoTop + 3,
    ex: cx + 7 + stoop,
    ey: torsoTop + 13,
    hx: cx + 8 + stoop,
    hy: torsoTop + 24,
    lit: false,
    bare: true,
  };
  const nearArm: ArmSpec = {
    sx: cx - 6 + stoop,
    sy: torsoTop + 3,
    ex: cx - 7 + stoop,
    ey: torsoTop + 13,
    hx: cx - 8 + stoop,
    hy: torsoTop + 24,
    lit: true,
    bare: true,
  };

  layer(c, (l) => drawArmLayer(l, farArm, 0));
  layer(c, (l) => {
    limb(l, cx + 3, hipY, cx + 4, FOOT_Y - 3, 4, TROUSER_SHD);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++)
      span(l, cx - 1 + (FOOT_Y - y) * 2, cx + 6, y, SHOE_SHD);
  });
  layer(c, (l) => {
    limb(l, cx - 3, hipY, cx - 4, FOOT_Y - 3, 4, TROUSER_LIT);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++)
      span(l, cx - 9 + (FOOT_Y - y) * 2, cx - 2, y, SHOE_LIT);
  });
  layer(c, (l) => drawTorso(l, cx, torsoTop, { bottom: hipY + 2, lean: stoop }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, 0));

  headDetails(c, hx, hy, {});
  torsoDetails(c, cx, torsoTop, { bottom: hipY + 2, lean: stoop });
  for (let y = hipY + 4; y <= FOOT_Y - 4; y++) c.setPixel(cx - 4, y, "soot_3"); // worn crease/patch
  c.setPixel(cx - 7, FOOT_Y - 1, SHOE_SHD);
  c.setPixel(cx + 1, FOOT_Y - 1, SHOE_SHD);
  armDetails(c, farArm);
  armDetails(c, nearArm);
}

// ---------------------------------------------------------------- output
const POSES: Pose[] = [
  "seated_listen",
  "seated_listen_breath",
  "seated_listen_blink",
  "seated_talk",
  "lean_in",
  "lean_back",
  "standing",
  "signature",
  "exhausted",
];

function renderFrame(pose: Pose): SpriteCanvas {
  const c = new SpriteCanvas(FRAME_W, FRAME_H, palette);
  drawPose(c, pose);
  return c;
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  const sheet = new SpriteCanvas(FRAME_W * POSES.length, FRAME_H, palette);
  POSES.forEach((pose, i) => {
    const frame = renderFrame(pose);
    frame.writePNG(join(OUT, `char_lev_pose_${pose}_${VERSION}.png`));
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const id = frame.getPixel(x, y);
        if (id !== null) sheet.setPixel(i * FRAME_W + x, y, id);
      }
    }
  });
  sheet.writePNG(join(OUT, `char_lev_sheet_${VERSION}.png`));

  const sil = new SpriteCanvas(FRAME_W * 2, FRAME_H, palette);
  const standing = renderFrame("standing");
  const seated = renderFrame("seated_listen");
  toSilhouette(standing);
  toSilhouette(seated);
  for (let y = 0; y < FRAME_H; y++) {
    for (let x = 0; x < FRAME_W; x++) {
      const a = standing.getPixel(x, y);
      if (a !== null) sil.setPixel(x, y, a);
      const b = seated.getPixel(x, y);
      if (b !== null) sil.setPixel(FRAME_W + x, y, b);
    }
  }
  sil.writePNG(join(OUT, `char_lev_silhouette_${VERSION}.png`));
  console.log(`lev: wrote ${POSES.length} poses + sheet + silhouette to ${OUT}`);
}

main();
