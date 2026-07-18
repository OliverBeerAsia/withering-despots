// char_galina — pixel character package (direct pixel authoring).
// Design card: art/direction/character_cards/galina.md
// Template: art/direction/character_template.md, structural authority
// art/source/char/arkady.ts (approved pilot).
//
// Run: corepack pnpm exec tsx art/source/char/galina.ts
// Emits sheet + per-pose PNGs + silhouette into art/review_queue/char/.
//
// Conventions (see character_template.md):
// - Frame 48x96. FOOT_Y=93 (last shoe row), SEAT_Y=69 (seat plane, locked).
//   Standing crown y=12 (82 px tall). Seated crown y=32 (62 px crown-to-floor).
// - Facing LEFT (toward table/counter) in 3/4. Light from upper-left (pendant).
// - LAYERED build: each body part on its own layer, inlineOutline() turns its
//   edge pixels to soot_0, then layers composite back-to-front.
//   Order: far arm, far leg, near leg, torso, neck+head, near arm.
// - Palette ids only. No chair/table/counter pixels.

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
const SEAT_Y = 69; // pelvis bottom row (seat plane, locked across cast)
const STAND_CROWN = 12; // 82 px standing (93-82+1)
const SEAT_CROWN = 32; // 62 px seated crown-to-floor (93-62+1)

// Palette roles (from the design card)
const OUTLINE = "soot_0";
const DRESS_LIT = "teal_2";
const DRESS_MID = "teal_1";
const DRESS_SHD = "teal_0";
const APRON = "cream_2";
const APRON_SHD = "cream_1";
const APRON_STAIN = "amber_0";
const CARDIGAN = "olive_1";
const SKIN = "flesh_1"; // dominant base plane (card: flesh_1 base)
const SKIN_HI = "flesh_2"; // cheekbones/forearms lamplit
const SKIN_SHD = "flesh_0"; // restrained
const HAIR_LIT = "wood_2";
const HAIR_SHD = "wood_1";
const HAIR_GRAY = "soot_3"; // temple gray
const EARRING = "red_0";
const NOTEBOOK = "cream_2";
const PENCIL = "amber_2";
const SHOE = "soot_0";
const SHOE_HI = "soot_2";

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
// 13w x 14h, facing left 3/4, EXPLICITLY outlined (o) — the head is the
// identity asset, hand-drawn, never auto-outlined. Rounded-square broad
// face, HIGH TIGHT BUN a full 3 rows deep bulging clear of the skull at
// crown-back (dominant silhouette feature), small ear low under the bun
// with a dark earring dot. SKIN PLANES (card Identity): flesh_1 (f) is
// the DOMINANT face plane; flesh_2 (F) lamplit strip on forehead/cheekbone;
// flesh_0 (s) restrained, only tight shadow edge toward hair/jaw.
const HEAD_LEGEND: Record<string, string> = {
  o: OUTLINE,
  H: HAIR_LIT,
  h: HAIR_SHD,
  g: HAIR_GRAY,
  f: SKIN,
  F: SKIN_HI,
  s: SKIN_SHD,
  E: SKIN_SHD, // ear inner
  R: EARRING,
  p: PENCIL, // pencil tip tucked behind the ear, inside the hair mass
};

const HEAD_W = 13;
/** Build a fixed-width head row from [char,count] segments; asserts width. */
function row(...segs: Array<[string, number]>): string {
  const s = segs.map(([ch, n]) => ch.repeat(n)).join("");
  if (s.length !== HEAD_W) throw new Error(`row: length ${s.length} != ${HEAD_W}: "${s}"`);
  return s;
}

// prettier-ignore
const HEAD_BASE = [
  row([".", 4], ["H", 4], ["o", 1], [".", 4]),               // r0  bun crown, bulges clear of the skull
  row([".", 3], ["o", 1], ["H", 6], ["o", 1], [".", 2]),     // r1  bun body, full and round
  row([".", 2], ["o", 1], ["H", 1], ["h", 5], ["H", 1], ["g", 1], ["o", 1], [".", 1]), // r2 bun base, gray temple
  row([".", 1], ["o", 1], ["F", 6], ["h", 2], ["g", 1], ["o", 1], [".", 1]),           // r3 broad lit forehead
  row([".", 1], ["o", 1], ["f", 2], ["F", 4], ["h", 2], ["g", 1], ["E", 1], ["o", 1]), // r4 brow row; ear top
  row(["o", 1], ["f", 2], ["F", 4], ["s", 2], ["h", 1], ["E", 1], ["g", 1], ["o", 1]), // r5 eye row; ear body
  row(["o", 1], ["f", 2], ["F", 4], ["s", 3], ["E", 1], ["R", 1], ["o", 1]),           // r6 cheekbone; earring
  row(["o", 1], ["f", 5], ["s", 4], ["p", 1], ["E", 1], ["o", 1]),                     // r7 cheek; pencil tip; ear lobe
  row([".", 1], ["o", 1], ["F", 1], ["f", 2], ["s", 5], ["o", 1], [".", 2]),           // r8 medium straight nose
  row([".", 1], ["o", 1], ["f", 3], ["s", 3], ["o", 1], [".", 4]),                     // r9 nose base
  row([".", 2], ["o", 1], ["f", 2], ["s", 2], ["o", 1], [".", 5]),                     // r10 mouth row, level
  row([".", 2], ["o", 1], ["f", 2], ["s", 2], ["o", 1], [".", 5]),                     // r11 soft-but-set jaw
  row([".", 3], ["o", 1], ["f", 2], ["s", 1], ["o", 1], [".", 5]),                     // r12 jaw closing
  row([".", 4], ["o", 1], ["s", 2], ["o", 1], [".", 5]),                               // r13 chin/neck transition
];

interface FaceOpts {
  blink?: boolean;
  talk?: boolean;
  hooded?: boolean; // exhausted lids
}

/** Facial details, stamped AFTER compositing so they sit on top. */
function headDetails(c: SpriteCanvas, hx: number, hy: number, o: FaceOpts = {}): void {
  // brow: one skeptical 1 px arch, rear (back) side drawn one row higher
  c.setPixel(hx + 2, hy + 4, OUTLINE);
  c.setPixel(hx + 6, hy + 3, OUTLINE);
  // eyes: front near the profile edge, rear toward the cheek
  if (o.blink || o.hooded) {
    c.setPixel(hx + 2, hy + 5, SKIN_SHD);
    c.setPixel(hx + 7, hy + 5, SKIN_SHD);
  } else {
    c.setPixel(hx + 2, hy + 5, OUTLINE);
    c.setPixel(hx + 7, hy + 5, OUTLINE);
  }
  // mouth: level, held — gives nothing away
  c.setPixel(hx + 3, hy + 10, OUTLINE);
  if (o.talk) c.setPixel(hx + 4, hy + 10, OUTLINE);
}

/** Neck+head layer: neck first (auto-outlined), explicit head map on top. */
function drawHeadLayer(l: SpriteCanvas, hx: number, hy: number, collarY: number): void {
  // short solid neck (load-bearing build, not frail) — QA: widened to 5 px and
  // kept directly under the jaw so the head no longer perches on a thin stalk
  for (let y = hy + 12; y <= collarY + 1; y++) {
    l.setPixel(hx + 3, y, SKIN_HI);
    l.setPixel(hx + 4, y, SKIN_HI);
    l.setPixel(hx + 5, y, SKIN);
    l.setPixel(hx + 6, y, SKIN);
    l.setPixel(hx + 7, y, SKIN_SHD);
  }
  blit(l, hx, hy, HEAD_BASE, HEAD_LEGEND);
}

// ---------------------------------------------------------------- torso
interface TorsoOpts {
  lean?: number; // px shift at shoulders (+right/-left), eased to 0 at pelvis
  drop?: number; // shoulders sag down (exhausted)
  cardigan?: boolean; // olive cardigan draped over shoulders (after midnight)
  bottom?: number; // last torso row (SEAT_Y seated, hip for standing)
}

/** Torso mass: wide shoulders (solid build), broad hips. */
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
      half = 6; // shoulder slope
    else if (i === 1)
      half = 9; // wide shoulders (20 px card)
    else if (t < 0.55)
      half = Math.round(9 - 2.5 * (t / 0.55)); // to waist 6.5
    else half = Math.round(6.5 + 2 * ((t - 0.55) / 0.45)); // hips/pelvis 8.5
    const shift = Math.round(lean * (1 - t));
    const back = t > 0.78 && o.bottom === undefined ? 1 : 0; // seat spread back
    const x0 = cx - half + shift + back;
    const x1 = cx + half + shift + back;
    const split = cx + 1 + shift;
    span(l, x0, Math.min(split, x1), y, DRESS_LIT);
    if (split + 1 <= x1) span(l, split + 1, x1, y, DRESS_MID);
  }
}

/** Dress/apron/cardigan details after compositing. */
function torsoDetails(c: SpriteCanvas, cx: number, top: number, o: TorsoOpts = {}): void {
  const lean = o.lean ?? 0;
  const drop = o.drop ?? 0;
  const bottom = o.bottom ?? SEAT_Y;
  const shoulderY = top + drop;
  const rows = bottom - shoulderY;
  const px = (i: number) => Math.round(lean * (1 - i / rows));
  // apron: full front, tapered to the body (not a flat slab), ties knotted,
  // tea-stained hem. Narrower than the torso so dress shows at the sides.
  for (let i = 3; i <= rows; i++) {
    const y = shoulderY + i;
    const t = i / rows;
    const half =
      t < 0.55 ? Math.round(4.5 - 1 * (t / 0.55)) : Math.round(3.5 + 1 * ((t - 0.55) / 0.45));
    const shift = px(i);
    span(c, cx - half + shift, cx + half - 1 + shift, y, i < rows - 2 ? APRON : APRON_SHD);
  }
  // apron neck loop
  c.setPixel(cx - 1 + px(2), shoulderY + 2, APRON_SHD);
  c.setPixel(cx + 1 + px(2), shoulderY + 2, APRON_SHD);
  // waist tie knot
  const knotI = Math.round(rows * 0.5);
  c.setPixel(cx - 2 + px(knotI), shoulderY + knotI, APRON_SHD);
  c.setPixel(cx + 2 + px(knotI), shoulderY + knotI, APRON_SHD);
  // tea stain pixels near hem
  c.setPixel(cx - 2 + px(rows - 3), shoulderY + rows - 3, APRON_STAIN);
  c.setPixel(cx + 1 + px(rows - 2), shoulderY + rows - 2, APRON_STAIN);
  if (o.cardigan) {
    // draped over shoulders, empty sleeves, after-midnight state
    span(c, cx - 9 + px(1), cx - 6 + px(1), shoulderY + 1, CARDIGAN);
    span(c, cx + 6 + px(1), cx + 9 + px(1), shoulderY + 1, CARDIGAN);
    for (let i = 2; i <= 6; i++) {
      c.setPixel(cx - 8 + px(i), shoulderY + i, CARDIGAN);
      c.setPixel(cx + 8 + px(i), shoulderY + i, CARDIGAN);
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

/** Arm layer: 4 px sleeve (pushed to mid-forearm, bare below), cuff omitted. */
function drawArmLayer(l: SpriteCanvas, a: ArmSpec, handDir = -1): void {
  const sleeve = a.lit ? DRESS_LIT : DRESS_MID;
  if (a.sx !== undefined && a.sy !== undefined) {
    // sleeve pushed to mid-forearm: dress from shoulder to elbow only
    limb(l, a.sx, a.sy, a.ex, a.ey, 4, sleeve);
    // bare forearm below the pushed sleeve
    limb(l, a.ex, a.ey, a.hx, a.hy, 3, a.lit ? SKIN_HI : SKIN);
  } else {
    // forearm-only pose: bare forearm (sleeves already pushed up)
    const dx = Math.abs(a.hx - a.ex);
    const dy = Math.abs(a.hy - a.ey);
    const skinTone = a.lit ? SKIN_HI : SKIN;
    if (dx > dy) {
      for (let i = 0; i <= dx; i++) {
        const x = a.ex + Math.sign(a.hx - a.ex) * i;
        const y = Math.round(a.ey + (a.hy - a.ey) * (i / dx));
        l.setPixel(x, y - 1, skinTone);
        l.setPixel(x, y, skinTone);
        l.setPixel(x, y + 1, skinTone);
      }
    } else {
      limb(l, a.ex, a.ey, a.hx, a.hy, 3, skinTone);
    }
  }
  // Hand blocks: flesh_1 dominant, flesh_2 lit knuckle.
  if (handDir === 0) {
    for (let dyh = 0; dyh <= 2; dyh++) {
      l.setPixel(a.hx - 1, a.hy + dyh, dyh === 0 ? SKIN_HI : SKIN);
      l.setPixel(a.hx, a.hy + dyh, SKIN);
    }
  } else {
    for (let dxh = 0; dxh <= 2; dxh++) {
      l.setPixel(a.hx + handDir * dxh, a.hy - 1, dxh === 1 ? SKIN_HI : SKIN);
      l.setPixel(a.hx + handDir * dxh, a.hy, SKIN);
    }
  }
}

/** One seated leg facing left: thigh slab, shin, low practical shoe w/ strap. */
function drawSeatedLegLayer(
  l: SpriteCanvas,
  hipX: number,
  kneeX: number,
  footX: number,
  toe: number,
  lit: boolean,
): void {
  const dress = lit ? DRESS_LIT : DRESS_MID;
  const thighTop = SEAT_Y - 5;
  for (let y = thighTop; y <= SEAT_Y; y++) {
    span(l, kneeX - 2, hipX, y, y === thighTop ? DRESS_LIT : dress);
  }
  limb(l, kneeX, SEAT_Y + 1, footX, FOOT_Y - 5, 4, lit ? SKIN_HI : SKIN); // bare shin, dress ends above knee
  // low shoe with ankle strap: a distinct block, not a tapered wedge
  for (let y = FOOT_Y - 4; y <= FOOT_Y - 2; y++) span(l, footX - 1, footX + 2, y, SHOE);
  for (let y = FOOT_Y - 1; y <= FOOT_Y; y++) span(l, footX - toe, footX + 2, y, SHOE);
}

function legDetails(c: SpriteCanvas, kneeX: number, footX: number): void {
  c.setPixel(footX, FOOT_Y - 3, SHOE_HI); // ankle strap
  c.setPixel(footX - 1, FOOT_Y - 1, SHOE_HI); // shoe highlight
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

// Notebook: 4x3 cream block with a ruled outline, held in the near hand.
// The pencil behind the ear is baked into HEAD_BASE (identity constant,
// always present), not stamped here.
function notebookProp(c: SpriteCanvas, nx: number, ny: number): void {
  span(c, nx, nx + 3, ny, NOTEBOOK);
  span(c, nx, nx + 3, ny + 1, NOTEBOOK);
  for (let dx = 0; dx <= 3; dx++) c.setPixel(nx + dx, ny + 2, OUTLINE);
  c.setPixel(nx - 1, ny, OUTLINE);
  c.setPixel(nx - 1, ny + 1, OUTLINE);
  c.setPixel(nx + 4, ny, OUTLINE);
  c.setPixel(nx + 4, ny + 1, OUTLINE);
}

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

  const torsoTop = SEAT_CROWN + 15 + breath; // shoulders nominal
  const headFwd = exhausted ? -3 : pose === "lean_in" ? -4 : pose === "lean_back" ? -1 : -2;
  const headDown = exhausted ? 3 : pose === "lean_in" ? 1 : 0;
  const hx = CX - 5 + headFwd + Math.round(lean * 0.8);
  const hy = SEAT_CROWN + breath + headDown + drop;

  const shift = Math.round(lean * 0.9);
  let farArm: ArmSpec;
  let nearArm: ArmSpec;
  if (pose === "signature") {
    // arms folded high across the chest: far forearm tucked low and mostly
    // hidden under the torso, near arm sweeps shoulder->elbow->across to
    // grip the opposite elbow, pencil hand tapping it.
    farArm = { ex: CX + 3 + shift, ey: torsoTop + 10, hx: CX - 3, hy: torsoTop + 7, lit: false };
    nearArm = {
      sx: CX - 6 + shift,
      sy: torsoTop + 4,
      ex: CX - 2 + shift,
      ey: torsoTop + 8,
      hx: CX + 4,
      hy: torsoTop + 6,
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
    // listen/talk: notebook held on the table edge, pencil hand marking it
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 13, hx: CX - 9, hy: SEAT_Y - 14, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 12, hx: CX - 13, hy: SEAT_Y - 14, lit: true };
  }

  // ---- layered build, back to front
  layer(c, (l) => drawArmLayer(l, farArm));
  layer(c, (l) => drawSeatedLegLayer(l, CX + 5, 17, 19, 4, false)); // far leg, tucked
  layer(c, (l) => drawSeatedLegLayer(l, CX + 4, 13, 13, 7, true)); // near leg
  layer(c, (l) => drawTorso(l, CX, torsoTop, { lean, drop, cardigan: exhausted }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  headDetails(c, hx, hy, face);
  torsoDetails(c, CX, torsoTop, { lean, drop, cardigan: exhausted }); // apron sits under folded/resting arm
  legDetails(c, 13, 13);
  // near arm drawn LAST so it (and any prop in the hand) sits on top of the apron
  layer(c, (l) => drawArmLayer(l, nearArm, pose === "signature" ? 1 : -1));
  if (!exhausted && pose !== "signature") {
    notebookProp(c, nearArm.hx - 3, nearArm.hy - 2);
  } else if (pose === "signature") {
    // pencil hand taps the opposite elbow
    c.setPixel(nearArm.hx, nearArm.hy - 1, OUTLINE);
  }
}

function drawStanding(c: SpriteCanvas): void {
  const cx = 24;
  const torsoTop = STAND_CROWN + 15; // shoulders
  const hipY = STAND_CROWN + 44; // dress hem
  const hx = cx - 5 - 1; // head 1 px forward of chest line (QA: was perched 2 px forward)
  const hy = STAND_CROWN;

  // weight on one hip: near leg straight/locked, far leg cocked out slightly
  const farArm: ArmSpec = {
    sx: cx + 7,
    sy: torsoTop + 3,
    ex: cx + 9,
    ey: torsoTop + 15,
    hx: cx + 10,
    hy: torsoTop + 26,
    lit: false,
  };
  const nearArm: ArmSpec = {
    sx: cx - 7,
    sy: torsoTop + 3,
    ex: cx - 9,
    ey: torsoTop + 15,
    hx: cx - 10,
    hy: torsoTop + 26,
    lit: true,
  };

  layer(c, (l) => drawArmLayer(l, farArm, 0));
  layer(c, (l) => {
    // far leg, weight-bearing, straight; dress hem to mid-shin, bare below
    limb(l, cx + 3, hipY, cx + 3, hipY + 6, 4, DRESS_MID);
    limb(l, cx + 3, hipY + 6, cx + 4, FOOT_Y - 5, 3, SKIN);
    for (let y = FOOT_Y - 4; y <= FOOT_Y - 2; y++) span(l, cx + 2, cx + 5, y, SHOE);
    for (let y = FOOT_Y - 1; y <= FOOT_Y; y++) span(l, cx - 1, cx + 5, y, SHOE);
  });
  layer(c, (l) => {
    // near leg, cocked out 1 px at the hip (weight-shift); bare shin
    limb(l, cx - 2, hipY, cx - 3, hipY + 6, 4, DRESS_LIT);
    limb(l, cx - 3, hipY + 6, cx - 4, FOOT_Y - 5, 3, SKIN_HI);
    for (let y = FOOT_Y - 4; y <= FOOT_Y - 2; y++) span(l, cx - 6, cx - 3, y, SHOE);
    for (let y = FOOT_Y - 1; y <= FOOT_Y; y++) span(l, cx - 9, cx - 3, y, SHOE);
  });
  layer(c, (l) => drawTorso(l, cx, torsoTop, { bottom: hipY + 2 }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, 0));

  headDetails(c, hx, hy, {});
  torsoDetails(c, cx, torsoTop, { bottom: hipY + 2 });
  c.setPixel(cx - 5, FOOT_Y - 3, SHOE_HI); // ankle strap, near foot
  c.setPixel(cx + 3, FOOT_Y - 3, SHOE_HI); // ankle strap, far foot
  c.setPixel(cx - 8, FOOT_Y - 1, SHOE_HI);
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
    frame.writePNG(join(OUT, `char_galina_pose_${pose}_${VERSION}.png`));
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const id = frame.getPixel(x, y);
        if (id !== null) sheet.setPixel(i * FRAME_W + x, y, id);
      }
    }
  });
  sheet.writePNG(join(OUT, `char_galina_sheet_${VERSION}.png`));

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
  sil.writePNG(join(OUT, `char_galina_silhouette_${VERSION}.png`));
  console.log(`galina: wrote ${POSES.length} poses + sheet + silhouette to ${OUT}`);
}

main();
