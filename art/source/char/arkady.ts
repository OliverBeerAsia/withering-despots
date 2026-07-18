// char_arkady — pilot character package (direct pixel authoring).
// Design card: art/direction/character_cards/arkady.md
// Template doc: art/direction/character_template.md (this script IS the template).
//
// Run: corepack pnpm exec tsx art/source/char/arkady.ts
// Emits sheet + per-pose PNGs + silhouette into art/review_queue/char/.
//
// Conventions (all characters — see character_template.md):
// - Frame 48x96. FOOT_Y=93 (last shoe row). Standing crown y=4 (90 px tall).
//   Seated crown y=26 (68 px crown-to-floor), pelvis bottom row on SEAT_Y=69
//   (seat plane = 24 px above foot line, environment_notes.md Scale).
// - Facing LEFT (toward table) in 3/4. Light from upper-left (pendant).
// - LAYERED build: each body part is drawn in fill colors on its own layer,
//   inlineOutline() converts that layer's edge pixels to soot_0, then layers
//   composite back-to-front. Overlaps therefore self-separate with ink lines.
//   Order: far arm, far leg, near leg, torso, neck+head, near arm.
// - Facial/clothing detail pixels stamped after compositing.
// - Palette ids only. No chair/table pixels.

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPalette } from "../../../scripts/art-pipeline/palette.ts";
import { SpriteCanvas } from "../../../scripts/art-pipeline/sprite.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "art/review_queue/char");
const palette = loadPalette(join(ROOT, "art/palette/wd-palette-v1.json"));

// ---------------------------------------------------------------- constants
const VERSION = "v002"; // v002: rework — skin planes inverted per card (flesh_0 dominant)
const FRAME_W = 48;
const FRAME_H = 96;
const FOOT_Y = 93; // last shoe row
const SEAT_Y = 69; // pelvis bottom row (seat plane, 24 px above foot line)
const STAND_CROWN = 4; // 90 px standing
const SEAT_CROWN = 26; // 68 px crown-to-floor

// Palette roles (from the design card)
const OUTLINE = "soot_0";
const SUIT_LIT = "soot_3";
const SUIT_SHD = "soot_2";
const SUIT_FOLD = "soot_1";
const SHIRT = "cream_3";
const SHIRT_SHD = "cream_2";
const TIE = "olive_0";
const SKIN = "flesh_1"; // small lit strip ONLY (palest of cast)
const SKIN_SHD = "flesh_0"; // dominant face/hand plane
const SKIN_HI = "flesh_2";
const SKIN_COOL = "soot_3"; // cooled shadow edges (gray undertone)
const HAIR_LIT = "soot_4";
const HAIR_SHD = "soot_3";
const SHOE_HI = "soot_3";

// ---------------------------------------------------------------- helpers
/** Blit an ASCII pixel map. legend maps char -> palette id; '.'/' ' = skip. */
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

/** Horizontal span, inclusive. */
function span(c: SpriteCanvas, x0: number, x1: number, y: number, id: string): void {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) c.setPixel(x, y, id);
}

/** Convert every filled pixel touching transparency (4-dir) to soot_0. */
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

/** Draw a part on its own layer, outline it, composite onto target. */
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

/** Silhouette: every filled pixel -> soot_0. */
function toSilhouette(c: SpriteCanvas): void {
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (c.getPixel(x, y) !== null) c.setPixel(x, y, OUTLINE);
    }
  }
}

/** Vertical-ish limb: horizontal spans of width w centered on lerped x. */
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
// 11w x 15h, facing left 3/4, EXPLICITLY outlined (o) — the identity asset
// is hand-drawn, not auto-outlined. Long narrow oval, high flat forehead
// (deep M-recession, scalp shows), thin white-gray hair combed back, large
// flat high-set ear, hollow cheek plane, long thin straight nose (juts at
// r8-r10), narrow receding chin with 1 px flesh_0 sag underneath.
// SKIN PLANES (card Identity, palest of cast): flesh_0 (s) is the DOMINANT
// face plane; flesh_1 (f) only a narrow lit strip on the front profile edge;
// shadow edges toward hair/ear/jaw cooled with soot_3 (c); flesh_2 1-2 px.
const HEAD_LEGEND: Record<string, string> = {
  o: OUTLINE,
  H: HAIR_LIT,
  h: HAIR_SHD,
  f: SKIN,
  s: SKIN_SHD,
  c: SKIN_COOL,
  F: SKIN_HI,
  E: SKIN_SHD, // ear inner
};

// prettier-ignore
const HEAD_BASE = [
  "..oooooo...", // r0
  ".oFHHHHHo..", // r1 bright bald front scalp (M-recession), lit crown
  ".ofshHHHHo.", // r2 high flat forehead; dark strand combed back
  ".ofsscHHHo.", // r3 cool edge under hairline
  ".ofssscHhoo", // r4 occiput mass; ear top cap
  ".ofsssschEo", // r5 large flat ear, set high; cooled rear edge
  ".ofsssschEo", // r6 brow row
  ".ofsssscoEo", // r7 eye row
  "ofssssscoo.", // r8 nose juts; whole cheek one flesh_0 plane
  "oFsssssco..", // r9 nose ridge highlight (flesh_2, 1 px)
  "oosssssco..", // r10 nose tip; cooled jaw shade edge
  ".ofssssco..", // r11 under nose; 1 px lit lip front
  ".ossssco...", // r12 mouth row
  "..ofsso....", // r13 narrow receding chin, lit front pixel
  "...osso....", // r14 loose skin under chin (flesh_0 sag)
];

interface FaceOpts {
  blink?: boolean;
  talk?: boolean;
  hooded?: boolean; // exhausted lids
}

/** Facial details, stamped AFTER compositing so they sit on top. */
function headDetails(c: SpriteCanvas, hx: number, hy: number, o: FaceOpts = {}): void {
  // brow: thin, high, habitually slightly raised (polite attention)
  c.setPixel(hx + 3, hy + 6, HAIR_SHD);
  c.setPixel(hx + 6, hy + 6, HAIR_SHD);
  // eyes: front 1 px off the profile edge, rear at the cheek line.
  // Lids are soot_3 (cool) — flesh_0 lids would vanish on the flesh_0 face.
  if (o.blink || o.hooded) {
    c.setPixel(hx + 3, hy + 7, SKIN_COOL);
    c.setPixel(hx + 6, hy + 7, SKIN_COOL);
  } else {
    c.setPixel(hx + 3, hy + 7, OUTLINE);
    c.setPixel(hx + 6, hy + 7, OUTLINE);
  }
  // mouth
  if (o.talk) {
    c.setPixel(hx + 3, hy + 12, OUTLINE);
    c.setPixel(hx + 4, hy + 12, OUTLINE);
  } else {
    c.setPixel(hx + 3, hy + 12, OUTLINE);
  }
}

/** Neck+head layer: neck first (auto-outlined), explicit head map on top. */
function drawHeadLayer(l: SpriteCanvas, hx: number, hy: number, collarY: number): void {
  // long thin neck, 3 px so 1 px flesh survives the outline pass;
  // the surviving center pixel is flesh_0 (palest of cast, no flesh_1 base)
  for (let y = hy + 12; y <= collarY + 1; y++) {
    l.setPixel(hx + 4, y, SKIN);
    l.setPixel(hx + 5, y, SKIN_SHD);
    l.setPixel(hx + 6, y, SKIN_SHD);
  }
  blit(l, hx, hy, HEAD_BASE, HEAD_LEGEND);
}

// ---------------------------------------------------------------- torso
interface TorsoOpts {
  lean?: number; // px shift at shoulders (+right/-left), eased to 0 at pelvis
  drop?: number; // shoulders sag down (exhausted)
  open?: boolean; // jacket unbuttoned (scripted exhausted pose only)
  bottom?: number; // last torso row (SEAT_Y seated, hip for standing)
  taper?: number; // extra waist pinch for standing
}

/** Torso mass: shoulders 17 px wide (cx±8), sloped 1st row, waist pinch. */
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
      half = 5; // shoulder slope
    else if (i === 1) half = 7;
    else if (t < 0.62)
      half = Math.round(8 - 3.5 * (t / 0.62)); // to waist 4.5
    else half = Math.round(4.5 + 1.5 * ((t - 0.62) / 0.38)); // pelvis 6
    const shift = Math.round(lean * (1 - t));
    const back = t > 0.78 && o.bottom === undefined ? 1 : 0; // seat spread back
    const x0 = cx - half + shift + back;
    const x1 = cx + half + shift + back;
    const split = cx + 1 + shift;
    span(l, x0, Math.min(split, x1), y, SUIT_LIT);
    if (split + 1 <= x1) span(l, split + 1, x1, y, SUIT_SHD);
  }
}

/** Jacket/shirt/tie details after compositing. */
function torsoDetails(c: SpriteCanvas, cx: number, top: number, o: TorsoOpts = {}): void {
  const lean = o.lean ?? 0;
  const drop = o.drop ?? 0;
  const bottom = o.bottom ?? SEAT_Y;
  const shoulderY = top + drop;
  const rows = bottom - shoulderY;
  const px = (i: number) => Math.round(lean * (1 - i / rows));
  // closure line sits left of center (3/4 view); further forward when the
  // jacket hangs open (exhausted) so the shirt strip reads at the chest front
  const colX = cx - (o.open ? 5 : 3);
  // collar: cream shirt, buttoned to the top
  c.setPixel(colX + px(1), shoulderY + 1, SHIRT);
  c.setPixel(colX + 1 + px(1), shoulderY + 1, SHIRT_SHD);
  // narrow dark tie, 1 px, ends ~55% down
  const tieEnd = Math.round(rows * 0.55);
  for (let i = 2; i <= tieEnd; i++) c.setPixel(colX + px(i), shoulderY + i, TIE);
  if (o.open) {
    // unbuttoned: shirt strip beside the hanging closure edge
    for (let i = 2; i <= rows - 3; i++) {
      const x = colX + px(i);
      c.setPixel(x + 1, shoulderY + i, SHIRT);
      c.setPixel(x + 2, shoulderY + i, SHIRT_SHD);
    }
  } else {
    // pressed jacket: closure fold below the tie (long unbroken planes otherwise)
    for (let i = tieEnd + 1; i <= rows - 2; i++) {
      c.setPixel(colX + px(i), shoulderY + i, SUIT_FOLD);
    }
  }
}

// ---------------------------------------------------------------- limbs
interface ArmSpec {
  sx?: number;
  sy?: number; // shoulder joint; omit to draw forearm only
  ex: number;
  ey: number; // elbow
  hx: number;
  hy: number; // wrist
  lit: boolean;
}

/**
 * Arm layer: 3 px sleeve, cuff+hand included so they share the outline.
 * Seated poses draw the FOREARM ONLY (upper arm reads as part of the pressed
 * jacket plane); poses that lift the arm clear of the torso pass sx/sy.
 */
function drawArmLayer(l: SpriteCanvas, a: ArmSpec, handDir = -1): void {
  const sleeve = a.lit ? SUIT_LIT : SUIT_SHD;
  if (a.sx !== undefined && a.sy !== undefined) limb(l, a.sx, a.sy, a.ex, a.ey, 3, sleeve);
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
    limb(l, a.ex, a.ey, a.hx, a.hy, 3, sleeve);
  }
  // Hand blocks: flesh_0 dominant (card: flesh_1 base kept small) — a single
  // flesh_1 pixel at the lit top/front knuckle, all other fills flesh_0.
  if (handDir === 0) {
    // hanging hand (standing): 2w x 3h below the wrist
    for (let dyh = 0; dyh <= 2; dyh++) {
      l.setPixel(a.hx - 1, a.hy + dyh, dyh === 0 ? SKIN : SKIN_SHD);
      l.setPixel(a.hx, a.hy + dyh, SKIN_SHD);
    }
  } else {
    // resting hand: 3x2 flesh block past the wrist (outlined with the arm)
    for (let dxh = 0; dxh <= 2; dxh++) {
      l.setPixel(a.hx + handDir * dxh, a.hy - 1, dxh === 1 ? SKIN : SKIN_SHD);
      l.setPixel(a.hx + handDir * dxh, a.hy, SKIN_SHD);
    }
  }
}

/** Cuff detail after compositing: 1 px shirt cuff at the wrist. */
function armDetails(c: SpriteCanvas, a: ArmSpec): void {
  c.setPixel(a.hx, a.hy - 1, SHIRT);
}

/** One seated leg facing left: thigh slab, shin (knee -> footX), oxford. */
function drawSeatedLegLayer(
  l: SpriteCanvas,
  hipX: number, // rear of thigh (under pelvis)
  kneeX: number, // front of knee
  footX: number, // ankle x (== kneeX vertical shin; > kneeX tucked back)
  toe: number, // shoe length ahead of the ankle
  lit: boolean,
): void {
  const suit = lit ? SUIT_LIT : SUIT_SHD;
  const thighTop = SEAT_Y - 5;
  for (let y = thighTop; y <= SEAT_Y; y++) {
    span(l, kneeX - 2, hipX, y, y === thighTop ? SUIT_LIT : suit);
  }
  limb(l, kneeX, SEAT_Y + 1, footX, FOOT_Y - 3, 4, suit); // shin
  // narrow oxford pointing left, 3 rows, tapered toe
  for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) {
    span(l, footX - toe + (FOOT_Y - y) * 2, footX + 1, y, SUIT_SHD);
  }
}

function legDetails(c: SpriteCanvas, kneeX: number): void {
  for (let y = SEAT_Y + 3; y <= FOOT_Y - 4; y++) c.setPixel(kneeX, y, SUIT_LIT); // crease
  c.setPixel(kneeX - 4, FOOT_Y - 1, SHOE_HI); // polish glint
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

const CX = 26; // seated torso center

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

  const torsoTop = SEAT_CROWN + 19 + breath; // shoulders y45 nominal
  const headFwd = exhausted ? -4 : pose === "lean_in" ? -5 : pose === "lean_back" ? -1 : -3;
  const headDown = exhausted ? 3 : pose === "lean_in" ? 1 : 0;
  const hx = CX - 5 + headFwd + Math.round(lean * 0.8);
  const hy = SEAT_CROWN + breath + headDown + drop;

  const shift = Math.round(lean * 0.9);
  // arm targets: hands on table plane (y54 = 39 px tabletop) unless posed
  // otherwise. Seated arms are FOREARM-ONLY (elbow at the jacket's front
  // edge); the upper arm stays inside the pressed-suit plane.
  let farArm: ArmSpec;
  let nearArm: ArmSpec;
  if (pose === "signature") {
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 12, hx: CX - 9, hy: SEAT_Y - 14, lit: false };
    // raised arm lifts clear of the torso: full arm with shoulder
    nearArm = {
      sx: CX - 6 + shift,
      sy: torsoTop + 3,
      ex: CX - 8,
      ey: torsoTop + 10,
      hx: CX - 11,
      hy: torsoTop + 3,
      lit: true,
    };
  } else if (exhausted) {
    farArm = { ex: CX - 3 + shift, ey: SEAT_Y - 6, hx: CX - 8, hy: SEAT_Y - 7, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 10, hx: CX - 12, hy: SEAT_Y - 6, lit: true };
  } else if (pose === "lean_back") {
    farArm = { ex: CX - 2 + shift, ey: SEAT_Y - 8, hx: CX - 6, hy: SEAT_Y - 9, lit: false };
    nearArm = { ex: CX - 4 + shift, ey: SEAT_Y - 11, hx: CX - 9, hy: SEAT_Y - 8, lit: true };
  } else if (pose === "lean_in") {
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 13, hx: CX - 10, hy: SEAT_Y - 15, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 12, hx: CX - 14, hy: SEAT_Y - 15, lit: true };
  } else {
    // listen/talk: hands squared on the table edge
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 13, hx: CX - 9, hy: SEAT_Y - 14, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 12, hx: CX - 13, hy: SEAT_Y - 14, lit: true };
  }

  // ---- layered build, back to front
  layer(c, (l) => drawArmLayer(l, farArm));
  layer(c, (l) => drawSeatedLegLayer(l, CX + 5, 17, 19, 4, false)); // far leg, foot tucked
  layer(c, (l) => drawSeatedLegLayer(l, CX + 4, 13, 13, 7, true)); // near leg
  layer(c, (l) => drawTorso(l, CX, torsoTop, { lean, drop }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, pose === "signature" ? 0 : -1));

  // ---- details on top
  headDetails(c, hx, hy, face);
  torsoDetails(c, CX, torsoTop, { lean, drop, open: exhausted });
  legDetails(c, 13);
  armDetails(c, farArm);
  armDetails(c, nearArm);
  if (pose === "signature") {
    // one raised index finger while correcting a term (fist sits below wrist)
    c.setPixel(nearArm.hx - 1, nearArm.hy - 1, SKIN_SHD);
    c.setPixel(nearArm.hx - 1, nearArm.hy - 2, SKIN);
    c.setPixel(nearArm.hx - 1, nearArm.hy - 3, OUTLINE);
  }
}

function drawStanding(c: SpriteCanvas): void {
  const cx = 24;
  const torsoTop = STAND_CROWN + 19; // shoulders y23
  const hipY = STAND_CROWN + 47; // jacket hem y51
  const hx = cx - 5 - 3; // head 3 px forward of chest line
  const hy = STAND_CROWN;

  const farArm: ArmSpec = {
    sx: cx + 6,
    sy: torsoTop + 3,
    ex: cx + 8,
    ey: torsoTop + 15,
    hx: cx + 9,
    hy: torsoTop + 28,
    lit: false,
  };
  const nearArm: ArmSpec = {
    sx: cx - 6,
    sy: torsoTop + 3,
    ex: cx - 8,
    ey: torsoTop + 15,
    hx: cx - 9,
    hy: torsoTop + 28,
    lit: true,
  };

  layer(c, (l) => drawArmLayer(l, farArm, 0));
  layer(c, (l) => {
    // far leg + oxford
    limb(l, cx + 3, hipY, cx + 4, FOOT_Y - 3, 4, SUIT_SHD);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) {
      span(l, cx - 1 + (FOOT_Y - y) * 2, cx + 6, y, SUIT_SHD);
    }
  });
  layer(c, (l) => {
    // near leg + oxford
    limb(l, cx - 3, hipY, cx - 4, FOOT_Y - 3, 4, SUIT_LIT);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) {
      span(l, cx - 9 + (FOOT_Y - y) * 2, cx - 2, y, SUIT_SHD);
    }
  });
  layer(c, (l) => drawTorso(l, cx, torsoTop, { bottom: hipY + 2 }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, 0));

  headDetails(c, hx, hy, {});
  torsoDetails(c, cx, torsoTop, { bottom: hipY + 2 });
  for (let y = hipY + 5; y <= FOOT_Y - 4; y++) c.setPixel(cx - 4, y, SUIT_LIT); // crease
  c.setPixel(cx - 7, FOOT_Y - 1, SHOE_HI);
  c.setPixel(cx + 1, FOOT_Y - 1, SHOE_HI);
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
    frame.writePNG(join(OUT, `char_arkady_pose_${pose}_${VERSION}.png`));
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const id = frame.getPixel(x, y);
        if (id !== null) sheet.setPixel(i * FRAME_W + x, y, id);
      }
    }
  });
  sheet.writePNG(join(OUT, `char_arkady_sheet_${VERSION}.png`));

  // silhouette gate: standing + seated_listen, pure soot_0
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
  sil.writePNG(join(OUT, `char_arkady_silhouette_${VERSION}.png`));
  console.log(`arkady: wrote ${POSES.length} poses + sheet + silhouette to ${OUT}`);
}

main();
