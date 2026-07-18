// char_nikolai — retired army colonel (logistics/armored). Direct pixel authoring.
// Design card: art/direction/character_cards/nikolai.md
// Template: art/direction/character_template.md (structure copied from
// art/source/char/arkady.ts, the approved pilot).
//
// Run: corepack pnpm exec tsx art/source/char/nikolai.ts
// Emits sheet + per-pose PNGs + silhouette into art/review_queue/char/.
//
// Card highlights baked in:
// - Widest shoulders in the room, rectangular monolith, NO neck indent — the
//   head sits directly in the shoulder mass (near-zero visible neck).
// - Parade-rigid: the head does not turn independently — every pose shares
//   the torso's own lean shift rather than an extra head-only offset.
// - Both feet planted flat, square to the table; jacket stays buttoned in
//   every pose in this package (only the mid-night-break scene opens it,
//   out of scope for this static set).
// - Medal case and tea glass are anchored table props (spec section 4) —
//   never drawn into the character.

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
const STAND_CROWN = 6; // 88 px standing
const SEAT_CROWN = 27; // 67 px seated crown-to-floor

// Palette roles (from the design card)
const OUTLINE = "soot_0";
const JACKET_LIT = "olive_2";
const JACKET_SHD = "olive_1";
const JACKET_DEEP = "olive_0";
const SHIRT = "cream_2";
const TROUSER_LIT = "soot_2";
const TROUSER_SHD = "soot_1";
const SKIN = "flesh_1"; // mids only — flesh_0 is the dominant plane (card)
const SKIN_SHD = "flesh_0"; // largest coverage of the cast
const CAPILLARY = "red_0"; // 1-2 px broken-capillary tone, cheeks/nose only
const HAIR_LIT = "soot_4";
const HAIR_SHD = "soot_3";
const BOOT = OUTLINE; // polished black boots
const BOOT_HI = "soot_3";

// ---------------------------------------------------------------- helpers (copied verbatim, see arkady.ts / lev.ts)
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
// 14w x 16h, facing left 3/4, EXPLICITLY outlined (o) — hand-drawn identity
// asset. Wide square skull, flat cheekbones, short flat forehead; full
// iron-gray hair cut short, brushed flat left-to-right (no bald patch);
// straight horizontal brow bar low over the eyes (single 1px line); broad
// once-broken nose reads as a flat straight block at the front edge (not a
// curved profile); small close-set ear; heavy wide jaw with jowl corner;
// trimmed straight moustache no wider than the mouth. Skin: flesh_0 is the
// dominant plane (weathered red-brown, largest coverage of the cast),
// flesh_1 a narrower mid band, 1-2 px red_0 capillary flecks on cheek/nose.
const HEAD_LEGEND: Record<string, string> = {
  o: OUTLINE,
  H: HAIR_LIT,
  h: HAIR_SHD,
  f: SKIN,
  s: SKIN_SHD,
  r: CAPILLARY,
  E: SKIN_SHD, // small close-set ear
  m: HAIR_SHD, // moustache
};

// prettier-ignore
const HEAD_BASE = [
  "...oooooooo...", // r0  short flat-topped hair, brushed flat
  "..oHHHHHHHho..", // r1  hair mass, lit crown-left / shade back
  ".oHHhffhHHho..", // r2  short forehead onset; hairline low
  ".offsssshHho..", // r3  flat short forehead; hair thick at back
  ".offsssssho...", // r4  brow ridge onset; flat cheekbone starts
  "offooooooEo...", // r5  straight horizontal brow bar (1px line); ear top
  "ofsssrsssoEo..", // r6  eye row; single capillary fleck on cheek; ear body
  "ofssssssooEo..", // r7  cheekbone; ear body
  "oosssoffsoho..", // r8  broad flattened nose bridge starts (flesh_1 block)
  "oossooffsoo...", // r9  nose block continues, straight (once-broken)
  "oosssrssoo....", // r10 nose base; capillary fleck; jowl corner (flesh_0)
  ".ommmmmoo.....", // r11 trimmed straight moustache, no wider than mouth
  ".osssssoo.....", // r12 mouth row / upper jowl
  ".ossssssoo....", // r13 heavy wide jaw; jowl corner plane
  "..ossssoo.....", // r14 jaw underside
  "...ooooo......", // r15 jaw base, no chin taper (square)
];

interface FaceOpts {
  blink?: boolean;
  talk?: boolean;
  hooded?: boolean;
}

function headDetails(c: SpriteCanvas, hx: number, hy: number, o: FaceOpts = {}): void {
  // eyes: low-set behind the straight brow bar.
  if (o.blink || o.hooded) {
    c.setPixel(hx + 3, hy + 6, SKIN_SHD);
    c.setPixel(hx + 7, hy + 6, SKIN_SHD);
  } else {
    c.setPixel(hx + 3, hy + 6, OUTLINE);
    c.setPixel(hx + 7, hy + 6, OUTLINE);
  }
  // mouth sits just under the moustache line.
  if (o.talk) {
    c.setPixel(hx + 2, hy + 12, OUTLINE);
    c.setPixel(hx + 3, hy + 12, OUTLINE);
  } else {
    c.setPixel(hx + 2, hy + 12, OUTLINE);
  }
}

/**
 * Head sits directly in the shoulder mass — NO neck indent (card). Only a
 * thin 1-2 px collar sliver shows between the jaw and the buttoned collar;
 * no long neck column like the rest of the cast.
 */
function drawHeadLayer(l: SpriteCanvas, hx: number, hy: number, collarY: number): void {
  for (let y = hy + 15; y <= collarY + 1; y++) {
    l.setPixel(hx + 3, y, SKIN);
    l.setPixel(hx + 4, y, SKIN_SHD);
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

/** Torso mass: shoulders 26 px wide (cx±13) — widest of the cast, rectangular monolith, minimal waist taper. */
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
      half = 11; // barrel chest — shoulders start wide immediately
    else if (i === 1) half = 13;
    else if (t < 0.7)
      half = Math.round(13 - 2 * (t / 0.7)); // minimal taper to waist 11
    else half = Math.round(11 + 2 * ((t - 0.7) / 0.3)); // pelvis 13 — unbroken block
    const shift = Math.round(lean * (1 - t));
    const back = t > 0.82 && o.bottom === undefined ? 1 : 0;
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
  // buttoned collar: a narrow cream shirt sliver at the throat only —
  // jacket stays buttoned the whole way down in this package.
  const colX = cx - 2;
  c.setPixel(colX + px(1), shoulderY + 1, SHIRT);
  // buttoned closure line — stops above the lap so the seated thigh reads
  for (let i = 2; i <= rows - 7; i++) c.setPixel(colX + px(i), shoulderY + i, JACKET_DEEP);
  // coat hem shadow along the bottom row + short side vent (QA: hem break)
  for (let dx = -12; dx <= 12; dx++) c.setPixel(cx + dx + px(rows), shoulderY + rows, JACKET_DEEP);
  for (let i = rows - 5; i <= rows - 1; i++) c.setPixel(cx + 9 + px(i), shoulderY + i, JACKET_DEEP);
  // middle button strains slightly — 1 px pull-fold each side, mid torso
  const midI = Math.round(rows * 0.55);
  c.setPixel(colX - 1 + px(midI), shoulderY + midI, JACKET_DEEP);
  c.setPixel(colX + 1 + px(midI), shoulderY + midI, JACKET_DEEP);
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
}

function drawArmLayer(l: SpriteCanvas, a: ArmSpec, handDir = -1): void {
  const sleeve = a.lit ? JACKET_LIT : JACKET_SHD;
  if (a.sx !== undefined && a.sy !== undefined) limb(l, a.sx, a.sy, a.ex, a.ey, 4, sleeve); // thick arm, big bones
  const dx = Math.abs(a.hx - a.ex);
  const dy = Math.abs(a.hy - a.ey);
  if (dx > dy) {
    for (let i = 0; i <= dx; i++) {
      const x = a.ex + Math.sign(a.hx - a.ex) * i;
      const y = Math.round(a.ey + (a.hy - a.ey) * (i / dx));
      l.setPixel(x, y - 1, sleeve);
      l.setPixel(x, y, sleeve);
      l.setPixel(x, y + 1, sleeve);
    }
  } else {
    limb(l, a.ex, a.ey, a.hx, a.hy, 4, sleeve);
  }
  // big square hands, thick wrists (card).
  if (handDir === 0) {
    for (let dyh = 0; dyh <= 2; dyh++) {
      l.setPixel(a.hx - 1, a.hy + dyh, dyh === 0 ? SKIN : SKIN_SHD);
      l.setPixel(a.hx, a.hy + dyh, SKIN_SHD);
      l.setPixel(a.hx + 1, a.hy + dyh, SKIN_SHD);
    }
  } else {
    for (let dxh = 0; dxh <= 2; dxh++) {
      l.setPixel(a.hx + handDir * dxh, a.hy - 1, dxh === 1 ? SKIN : SKIN_SHD);
      l.setPixel(a.hx + handDir * dxh, a.hy, SKIN_SHD);
      l.setPixel(a.hx + handDir * dxh, a.hy + 1, SKIN_SHD);
    }
  }
}

function armDetails(c: SpriteCanvas, a: ArmSpec): void {
  c.setPixel(a.hx, a.hy - 2, SHIRT); // 1 px shirt cuff at the wrist
}

/** Both feet planted flat, square — near/far legs symmetric, no tucked foot. */
function drawSeatedLegLayer(
  l: SpriteCanvas,
  hipX: number,
  kneeX: number,
  footX: number,
  toe: number,
  lit: boolean,
): void {
  const trouser = lit ? TROUSER_LIT : TROUSER_SHD;
  const thighTop = SEAT_Y - 6; // heavier thigh mass
  for (let y = thighTop; y <= SEAT_Y; y++) {
    span(l, kneeX - 3, hipX, y, y === thighTop ? TROUSER_LIT : trouser);
  }
  limb(l, kneeX, SEAT_Y + 1, footX, FOOT_Y - 3, 5, trouser); // thick shin, square knee
  for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) {
    span(l, footX - toe + (FOOT_Y - y) * 2, footX + 3, y, BOOT); // +heel block (QA: stub feet)
  }
}

function legDetails(c: SpriteCanvas, kneeX: number): void {
  for (let y = SEAT_Y + 3; y <= FOOT_Y - 4; y++) c.setPixel(kneeX, y, TROUSER_LIT); // pressed crease
  c.setPixel(kneeX - 4, FOOT_Y - 1, BOOT_HI); // polish glint (toe)
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

const CX = 26; // seated torso center — sits square to the table (card)

function drawPose(c: SpriteCanvas, pose: Pose): void {
  if (pose === "standing") return drawStanding(c);
  if (pose === "signature") return drawSignature(c);
  const breath = pose === "seated_listen_breath" ? -1 : 0;
  const face: FaceOpts = {
    blink: pose === "seated_listen_blink",
    talk: pose === "seated_talk",
    hooded: pose === "exhausted",
  };
  const exhausted = pose === "exhausted";
  // parade-rigid: modest lean range (the torso barely turns at the table).
  const lean = pose === "lean_in" ? -2 : pose === "lean_back" ? 1 : 0;
  const drop = exhausted ? 1 : 0;

  const torsoTop = SEAT_CROWN + 15 + breath; // shoulders y42 nominal — no neck indent
  // head does not turn independently: it shares the torso's OWN shift, not
  // an extra head-only offset (card: "the whole torso turns").
  const headFwd = -4; // fixed 3/4 offset, does not vary by pose
  const headDown = exhausted ? 2 : 0;
  const shift = Math.round(lean * 0.95);
  const hx = CX - 6 + headFwd + shift;
  const hy = SEAT_CROWN + breath + headDown + drop;

  let farArm: ArmSpec;
  let nearArm: ArmSpec;
  if (exhausted) {
    farArm = { ex: CX - 3 + shift, ey: SEAT_Y - 5, hx: CX - 7, hy: SEAT_Y - 6, lit: false };
    nearArm = { ex: CX - 4 + shift, ey: SEAT_Y - 8, hx: CX - 11, hy: SEAT_Y - 6, lit: true };
  } else if (pose === "lean_back") {
    farArm = { ex: CX - 2 + shift, ey: SEAT_Y - 8, hx: CX - 6, hy: SEAT_Y - 9, lit: false };
    nearArm = { ex: CX - 3 + shift, ey: SEAT_Y - 10, hx: CX - 9, hy: SEAT_Y - 8, lit: true };
  } else if (pose === "lean_in") {
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 13, hx: CX - 9, hy: SEAT_Y - 15, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 12, hx: CX - 14, hy: SEAT_Y - 15, lit: true };
  } else {
    // listen/talk: hands squared flat on the table edge, aligned (card: aligns
    // glass square with the table edge — same squared-hand instinct).
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 13, hx: CX - 9, hy: SEAT_Y - 14, lit: false };
    nearArm = { ex: CX - 4 + shift, ey: SEAT_Y - 12, hx: CX - 13, hy: SEAT_Y - 14, lit: true };
  }

  layer(c, (l) => drawArmLayer(l, farArm));
  layer(c, (l) => drawSeatedLegLayer(l, CX + 6, 20, 21, 4, false)); // far leg, flat
  layer(c, (l) => drawTorso(l, CX, torsoTop, { lean, drop }));
  // near leg painted OVER the coat (QA: the buttoned block had no lap/leg
  // separation) — the auto-outline splits thigh from coat skirt.
  layer(c, (l) => drawSeatedLegLayer(l, CX + 5, 12, 12, 6, true));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, -1));

  headDetails(c, hx, hy, face);
  torsoDetails(c, CX, torsoTop, { lean, drop });
  legDetails(c, 12);
  armDetails(c, farArm);
  armDetails(c, nearArm);
}

function drawStanding(c: SpriteCanvas): void {
  const cx = 24;
  const torsoTop = STAND_CROWN + 16; // shoulders y22 — head sits directly in the shoulder mass
  const hipY = STAND_CROWN + 46; // hem y52
  const hx = cx - 6 - 4; // head forward of chest line, 3/4 facing
  const hy = STAND_CROWN;

  const farArm: ArmSpec = {
    sx: cx + 8,
    sy: torsoTop + 2,
    ex: cx + 9,
    ey: torsoTop + 16,
    hx: cx + 10,
    hy: torsoTop + 29,
    lit: false,
  };
  const nearArm: ArmSpec = {
    sx: cx - 8,
    sy: torsoTop + 2,
    ex: cx - 9,
    ey: torsoTop + 16,
    hx: cx - 10,
    hy: torsoTop + 29,
    lit: true,
  };

  layer(c, (l) => drawArmLayer(l, farArm, 0));
  layer(c, (l) => {
    limb(l, cx + 4, hipY, cx + 5, FOOT_Y - 3, 5, TROUSER_SHD);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) span(l, cx + (FOOT_Y - y) * 2, cx + 8, y, BOOT);
  });
  layer(c, (l) => {
    limb(l, cx - 4, hipY, cx - 5, FOOT_Y - 3, 5, TROUSER_LIT);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) span(l, cx - 10 + (FOOT_Y - y) * 2, cx - 2, y, BOOT);
  });
  layer(c, (l) => drawTorso(l, cx, torsoTop, { bottom: hipY + 2 }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, 0));

  headDetails(c, hx, hy, {});
  torsoDetails(c, cx, torsoTop, { bottom: hipY + 2 });
  for (let y = hipY + 5; y <= FOOT_Y - 4; y++) c.setPixel(cx - 5, y, TROUSER_LIT); // pressed crease
  c.setPixel(cx - 8, FOOT_Y - 1, BOOT_HI);
  c.setPixel(cx + 2, FOOT_Y - 1, BOOT_HI);
  armDetails(c, farArm);
  armDetails(c, nearArm);
}

/**
 * Signature: standing at attention facing the TV, hands at seams — heels
 * together, arms straight down (no elbow bend), chin level (not tilted into
 * the 3/4 table-facing lean the other poses share).
 */
function drawSignature(c: SpriteCanvas): void {
  const cx = 24;
  const torsoTop = STAND_CROWN + 16;
  const hipY = STAND_CROWN + 46;
  const hx = cx - 6 - 2; // less forward lean than standing — chin up, at attention
  const hy = STAND_CROWN - 1; // chin raised 1 px

  const farArm: ArmSpec = {
    ex: cx + 9,
    ey: torsoTop + 2,
    hx: cx + 9,
    hy: torsoTop + 29,
    lit: false,
  };
  const nearArm: ArmSpec = {
    ex: cx - 9,
    ey: torsoTop + 2,
    hx: cx - 9,
    hy: torsoTop + 29,
    lit: true,
  };

  layer(c, (l) => drawArmLayer(l, farArm, 0));
  layer(c, (l) => {
    // heels together — both legs drawn nearly on the same center line
    limb(l, cx + 2, hipY, cx + 2, FOOT_Y - 3, 5, TROUSER_SHD);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) span(l, cx - 1 + (FOOT_Y - y) * 2, cx + 5, y, BOOT);
  });
  layer(c, (l) => {
    limb(l, cx - 2, hipY, cx - 2, FOOT_Y - 3, 5, TROUSER_LIT);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) span(l, cx - 6 + (FOOT_Y - y) * 2, cx + 1, y, BOOT);
  });
  layer(c, (l) => drawTorso(l, cx, torsoTop, { bottom: hipY + 2 }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, 0));

  headDetails(c, hx, hy, {});
  torsoDetails(c, cx, torsoTop, { bottom: hipY + 2 });
  c.setPixel(cx - 2, FOOT_Y - 1, BOOT_HI);
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
    frame.writePNG(join(OUT, `char_nikolai_pose_${pose}_${VERSION}.png`));
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const id = frame.getPixel(x, y);
        if (id !== null) sheet.setPixel(i * FRAME_W + x, y, id);
      }
    }
  });
  sheet.writePNG(join(OUT, `char_nikolai_sheet_${VERSION}.png`));

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
  sil.writePNG(join(OUT, `char_nikolai_silhouette_${VERSION}.png`));
  console.log(`nikolai: wrote ${POSES.length} poses + sheet + silhouette to ${OUT}`);
}

main();
