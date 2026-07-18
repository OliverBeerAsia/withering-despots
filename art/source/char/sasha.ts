// char_sasha — pixel character package (direct pixel authoring).
// Design card: art/direction/character_cards/sasha.md
// Template: art/direction/character_template.md, structural authority
// art/source/char/arkady.ts (approved pilot).
//
// Run: corepack pnpm exec tsx art/source/char/sasha.ts
// Emits sheet + per-pose PNGs + silhouette into art/review_queue/char/.
//
// Conventions (see character_template.md):
// - Frame 48x96. FOOT_Y=93 (last shoe row), SEAT_Y=69 (seat plane, locked).
//   Standing crown y=8 (86 px tall). Seated crown y=29 (65 px crown-to-floor,
//   rare per card — kept for pipeline completeness, standing is primary).
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
const STAND_CROWN = 8; // 86 px standing (93-86+1)
const SEAT_CROWN = 29; // 65 px seated crown-to-floor (93-65+1)

// Palette roles (from the design card)
const OUTLINE = "soot_0";
const SHIRT_LIT = "cream_3";
const SHIRT_MID = "cream_2";
const SHIRT_SHD = "cream_1";
const VEST_LIT = "olive_1";
const VEST_SHD = "olive_0";
const TROUSER_LIT = "soot_2";
const TROUSER_SHD = "soot_1";
const APRON = "cream_1";
const CLOTH = "cream_2";
const SKIN = "flesh_1"; // base
const SKIN_HI = "flesh_2"; // largest planes (forehead, cheek toward lamp)
const SKIN_SHD = "flesh_0"; // minimal
const HAIR_LIT = "soot_2";
const HAIR_SHD = "soot_1";
const SHOE = "soot_0";
const SHOE_HI = "soot_2";
const GLASS = "cyan_1"; // faceted glass, cool highlight against warm room

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
// 11w x 14h, facing left 3/4, EXPLICITLY outlined (o) — the head is the
// identity asset, hand-drawn, never auto-outlined. Oval face, slightly wide
// cheekbones, smooth planes (youngest of cast, no interior wrinkle lines),
// small straight nose, clean lightly pointed chin, level dark brow (no
// arch — stillness, not skepticism). Short practical bob above the collar,
// tucked behind the right (back, screen-right) ear — the ear stays visible
// below the hair edge. SKIN PLANES (card Identity): clearest of the cast —
// flesh_1 (f) base with the LARGEST flesh_2 (F) planes of any character
// (forehead, cheek toward lamp); flesh_0 (s) minimal, only a tight edge.
const HEAD_W = 11;
/** Build a fixed-width head row from [char,count] segments; asserts width. */
function row(...segs: Array<[string, number]>): string {
  const s = segs.map(([ch, n]) => ch.repeat(n)).join("");
  if (s.length !== HEAD_W) throw new Error(`row: length ${s.length} != ${HEAD_W}: "${s}"`);
  return s;
}

const HEAD_LEGEND: Record<string, string> = {
  o: OUTLINE,
  H: HAIR_LIT,
  h: HAIR_SHD,
  f: SKIN,
  F: SKIN_HI,
  s: SKIN_SHD,
  E: SKIN_SHD, // ear inner
};

// prettier-ignore
const HEAD_BASE = [
  row([".", 2], ["o", 1], ["H", 6], ["o", 1], [".", 1]),        // r0  bob crown, low even hairline
  row([".", 1], ["o", 1], ["H", 7], ["h", 1], ["o", 1]),        // r1  bob body, full coverage above ear
  row(["o", 1], ["H", 1], ["F", 5], ["h", 2], ["E", 1], ["o", 1]), // r2 forehead lamplit plane; hair tucked back
  row(["o", 1], ["f", 1], ["F", 5], ["h", 1], ["E", 1], ["h", 1], ["o", 1]), // r3 brow row; ear emerges below hair
  row(["o", 1], ["f", 2], ["F", 4], ["s", 1], ["E", 1], ["h", 1], ["o", 1]), // r4 eye row; ear visible, tucked hair
  row(["o", 1], ["f", 1], ["F", 5], ["s", 2], ["E", 1], ["o", 1]),          // r5 wide cheekbone plane (flesh_2)
  row([".", 1], ["o", 1], ["f", 4], ["s", 1], ["o", 1], [".", 3]),          // r6 cheek, smooth, no wrinkle lines
  row([".", 1], ["o", 1], ["F", 1], ["f", 2], ["s", 1], ["o", 1], [".", 4]), // r7 small straight nose, 1px bridge hi
  row([".", 1], ["o", 1], ["f", 3], ["s", 1], ["o", 1], [".", 4]),          // r8 nose base, jaw still full (oval)
  row([".", 1], ["o", 1], ["f", 2], ["s", 1], ["o", 1], [".", 5]),          // r9 mouth row, level, no smile default
  row([".", 2], ["o", 1], ["f", 2], ["s", 1], ["o", 1], [".", 4]),          // r10 jaw, clean, gentle taper begins
  row([".", 3], ["o", 1], ["f", 1], ["s", 1], ["o", 1], [".", 4]),          // r11 lightly pointed chin
  row([".", 3], ["o", 1], ["s", 1], ["o", 1], [".", 5]),                    // r12 chin point
  row([".", 4], ["o", 2], [".", 5]),                                       // r13 chin/neck transition
];

interface FaceOpts {
  blink?: boolean;
  talk?: boolean;
  hooded?: boolean; // exhausted lids (rare for sasha, kept for pipeline parity)
}

/** Facial details, stamped AFTER compositing so they sit on top. */
function headDetails(c: SpriteCanvas, hx: number, hy: number, o: FaceOpts = {}): void {
  // brow: level, dark, 1 px — stillness, no arch
  c.setPixel(hx + 2, hy + 3, OUTLINE);
  c.setPixel(hx + 5, hy + 3, OUTLINE);
  // eyes: front near the profile edge, rear toward the cheek
  if (o.blink || o.hooded) {
    c.setPixel(hx + 2, hy + 4, SKIN_SHD);
    c.setPixel(hx + 5, hy + 4, SKIN_SHD);
  } else {
    c.setPixel(hx + 2, hy + 4, OUTLINE);
    c.setPixel(hx + 5, hy + 4, OUTLINE);
  }
  // mouth: level, still — never a default smile
  c.setPixel(hx + 3, hy + 9, OUTLINE);
  if (o.talk) c.setPixel(hx + 4, hy + 9, OUTLINE);
}

/** Neck+head layer: neck first (auto-outlined), explicit head map on top. */
function drawHeadLayer(l: SpriteCanvas, hx: number, hy: number, collarY: number): void {
  // slim young neck — QA: one column wider so the head-neck join reads vertical
  for (let y = hy + 11; y <= collarY + 1; y++) {
    l.setPixel(hx + 3, y, SKIN_HI);
    l.setPixel(hx + 4, y, SKIN);
    l.setPixel(hx + 5, y, SKIN);
    l.setPixel(hx + 6, y, SKIN_SHD);
  }
  blit(l, hx, hy, HEAD_BASE, HEAD_LEGEND);
}

// ---------------------------------------------------------------- torso
interface TorsoOpts {
  lean?: number; // px shift at shoulders (+right/-left), eased to 0 at pelvis
  drop?: number; // shoulders sag down (exhausted)
  bottom?: number; // last torso row (SEAT_Y seated, hip for standing)
}

/** Torso mass: upright, straight shoulder line — slimmer than the men. */
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
    else if (i === 1)
      half = 8; // straight shoulder line (18 px card)
    else if (t < 0.55)
      half = Math.round(8 - 3 * (t / 0.55)); // to waist 5
    else half = Math.round(5 + 1.5 * ((t - 0.55) / 0.45)); // hip 6.5
    const shift = Math.round(lean * (1 - t));
    const back = t > 0.78 && o.bottom === undefined ? 1 : 0; // seat spread back
    const x0 = cx - half + shift + back;
    const x1 = cx + half + shift + back;
    const split = cx + 1 + shift;
    span(l, x0, Math.min(split, x1), y, SHIRT_LIT);
    if (split + 1 <= x1) span(l, split + 1, x1, y, SHIRT_MID);
  }
}

/** Waistcoat/apron/cloth details after compositing. */
function torsoDetails(c: SpriteCanvas, cx: number, top: number, o: TorsoOpts = {}): void {
  const lean = o.lean ?? 0;
  const drop = o.drop ?? 0;
  const bottom = o.bottom ?? SEAT_Y;
  const shoulderY = top + drop;
  const rows = bottom - shoulderY;
  const px = (i: number) => Math.round(lean * (1 - i / rows));
  // fitted waistcoat: tapers with the torso, olive, 3 buttons, collar open
  for (let i = 1; i <= rows; i++) {
    const y = shoulderY + i;
    const t = i / rows;
    const half = Math.round((t < 0.55 ? 8 - 3 * (t / 0.55) : 5 + 1.5 * ((t - 0.55) / 0.45)) - 1);
    const shift = px(i);
    if (i <= 1) continue; // open collar: bare shirt at the neckline
    span(c, cx - half + shift, cx - 1 + shift, y, VEST_LIT);
    span(c, cx + shift, cx + half + shift, y, VEST_SHD);
  }
  // open collar notch (1 button undone)
  c.setPixel(cx - 1 + px(1), shoulderY + 1, SHIRT_SHD);
  c.setPixel(cx + 1 + px(1), shoulderY + 1, SHIRT_SHD);
  // 3 buttons down the front seam
  for (const bi of [Math.round(rows * 0.35), Math.round(rows * 0.5), Math.round(rows * 0.65)]) {
    c.setPixel(cx + px(bi), shoulderY + bi, OUTLINE);
  }
  // half-apron at the waist with bar cloth tucked in, from ~60% down
  const apronTop = Math.round(rows * 0.62);
  for (let i = apronTop; i <= rows; i++) {
    const y = shoulderY + i;
    const t = i / rows;
    const half = Math.round((5 + 1.5 * ((t - 0.55) / 0.45)) * 0.85);
    const shift = px(i);
    span(c, cx - half + shift, cx + half - 1 + shift, y, APRON);
  }
  c.setPixel(cx - 2 + px(apronTop), shoulderY + apronTop, CLOTH); // cloth tucked in, breaking the hip line
  c.setPixel(cx - 3 + px(apronTop + 1), shoulderY + apronTop + 1, CLOTH);
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

/** Arm layer: shirt sleeve rolled below the elbow, bare forearm below that. */
function drawArmLayer(l: SpriteCanvas, a: ArmSpec, handDir = -1): void {
  const sleeve = a.lit ? SHIRT_LIT : SHIRT_MID;
  const skinTone = a.lit ? SKIN_HI : SKIN;
  if (a.sx !== undefined && a.sy !== undefined) {
    // upper arm + sleeve to just below the elbow (rolled), bare forearm below
    const midX = Math.round((a.sx + a.ex) / 2);
    const midY = Math.round((a.sy + a.ey) / 2);
    limb(l, a.sx, a.sy, midX, midY, 4, sleeve);
    limb(l, midX, midY, a.ex, a.ey, 3, skinTone);
    limb(l, a.ex, a.ey, a.hx, a.hy, 3, skinTone);
  } else {
    // forearm-only pose: bare forearm (sleeves already rolled above)
    const dx = Math.abs(a.hx - a.ex);
    const dy = Math.abs(a.hy - a.ey);
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
  // Hand blocks
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

/** One seated leg facing left: trouser thigh, trouser shin, flat lace-up. */
function drawSeatedLegLayer(
  l: SpriteCanvas,
  hipX: number,
  kneeX: number,
  footX: number,
  toe: number,
  lit: boolean,
): void {
  const trouser = lit ? TROUSER_LIT : TROUSER_SHD;
  const thighTop = SEAT_Y - 5;
  for (let y = thighTop; y <= SEAT_Y; y++) {
    span(l, kneeX - 2, hipX, y, y === thighTop ? TROUSER_LIT : trouser);
  }
  limb(l, kneeX, SEAT_Y + 1, footX, FOOT_Y - 3, 4, trouser); // straight trousers to the ankle
  for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) {
    span(l, footX - toe + (FOOT_Y - y) * 2, footX + 1, y, SHOE);
  }
}

function legDetails(c: SpriteCanvas, kneeX: number): void {
  c.setPixel(kneeX - 4, FOOT_Y - 1, SHOE_HI); // flat sole glint, silent soles
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

/** Glass and cloth held at chest height, still — the signature prop. */
function glassAndCloth(c: SpriteCanvas, gx: number, gy: number): void {
  // faceted glass, 3x4, cool highlight against the warm room
  span(c, gx, gx + 2, gy, GLASS);
  span(c, gx, gx + 2, gy + 1, GLASS);
  span(c, gx, gx + 2, gy + 2, GLASS);
  c.setPixel(gx + 1, gy, "cyan_2");
  c.setPixel(gx, gy + 3, OUTLINE);
  c.setPixel(gx + 1, gy + 3, OUTLINE);
  c.setPixel(gx + 2, gy + 3, OUTLINE);
  // cloth draped from the same hand
  c.setPixel(gx - 2, gy + 1, CLOTH);
  c.setPixel(gx - 2, gy + 2, CLOTH);
  c.setPixel(gx - 3, gy + 2, SHIRT_SHD);
}

function drawPose(c: SpriteCanvas, pose: Pose): void {
  if (pose === "standing" || pose === "signature") return drawStanding(c, pose);
  const breath = pose === "seated_listen_breath" ? -1 : 0;
  const face: FaceOpts = {
    blink: pose === "seated_listen_blink",
    talk: pose === "seated_talk",
    hooded: pose === "exhausted",
  };
  const exhausted = pose === "exhausted";
  const lean = pose === "lean_in" ? -3 : pose === "lean_back" ? 2 : 0;
  const drop = exhausted ? 1 : 0;

  const torsoTop = SEAT_CROWN + 14 + breath; // shoulders nominal (short young neck)
  const headFwd = exhausted ? -3 : pose === "lean_in" ? -4 : pose === "lean_back" ? -1 : -2;
  const headDown = exhausted ? 3 : pose === "lean_in" ? 1 : 0;
  const hx = CX - 4 + headFwd + Math.round(lean * 0.8);
  const hy = SEAT_CROWN + breath + headDown + drop;

  const shift = Math.round(lean * 0.9);
  let farArm: ArmSpec;
  let nearArm: ArmSpec;
  if (exhausted) {
    farArm = { ex: CX - 3 + shift, ey: SEAT_Y - 6, hx: CX - 8, hy: SEAT_Y - 7, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 10, hx: CX - 12, hy: SEAT_Y - 6, lit: true };
  } else if (pose === "lean_back") {
    farArm = { ex: CX - 2 + shift, ey: SEAT_Y - 8, hx: CX - 6, hy: SEAT_Y - 9, lit: false };
    nearArm = { ex: CX - 4 + shift, ey: SEAT_Y - 11, hx: CX - 9, hy: SEAT_Y - 8, lit: true };
  } else if (pose === "lean_in") {
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 13, hx: CX - 10, hy: SEAT_Y - 15, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 12, hx: CX - 14, hy: SEAT_Y - 15, lit: true };
  } else {
    // listen/talk: hands squared near the counter edge
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 13, hx: CX - 9, hy: SEAT_Y - 14, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 12, hx: CX - 13, hy: SEAT_Y - 14, lit: true };
  }

  // ---- layered build, back to front
  layer(c, (l) => drawArmLayer(l, farArm));
  layer(c, (l) => drawSeatedLegLayer(l, CX + 5, 17, 19, 4, false)); // far leg, tucked
  layer(c, (l) => drawSeatedLegLayer(l, CX + 4, 13, 13, 7, true)); // near leg
  layer(c, (l) => drawTorso(l, CX, torsoTop, { lean, drop }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  headDetails(c, hx, hy, face);
  torsoDetails(c, CX, torsoTop, { lean, drop });
  legDetails(c, 13);
  layer(c, (l) => drawArmLayer(l, nearArm, -1));
}

function drawStanding(c: SpriteCanvas, pose: "standing" | "signature"): void {
  const cx = 24;
  const torsoTop = STAND_CROWN + 14; // shoulders (short young neck)
  const hipY = STAND_CROWN + 46; // waistcoat hem
  const hx = cx - 4 - 1; // head 1 px forward of chest line (QA: neck kink)
  const hy = STAND_CROWN;
  const signature = pose === "signature";

  // upright, still, weight even on both feet
  const farArm: ArmSpec = {
    sx: cx + 6,
    sy: torsoTop + 3,
    ex: cx + 8,
    ey: torsoTop + 15,
    hx: cx + 9,
    hy: torsoTop + 27,
    lit: false,
  };
  // near arm: signature holds glass+cloth still at chest height; standing hangs at the side
  const nearArm: ArmSpec = signature
    ? {
        sx: cx - 6,
        sy: torsoTop + 3,
        ex: cx - 9,
        ey: torsoTop + 10,
        hx: cx - 10,
        hy: torsoTop + 9,
        lit: true,
      }
    : {
        sx: cx - 6,
        sy: torsoTop + 3,
        ex: cx - 8,
        ey: torsoTop + 15,
        hx: cx - 9,
        hy: torsoTop + 27,
        lit: true,
      };

  layer(c, (l) => drawArmLayer(l, farArm, 0));
  layer(c, (l) => {
    // far leg, straight, even weight
    limb(l, cx + 3, hipY, cx + 4, FOOT_Y - 3, 4, TROUSER_SHD);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) span(l, cx - 1 + (FOOT_Y - y) * 2, cx + 6, y, SHOE);
  });
  layer(c, (l) => {
    // near leg, straight, even weight
    limb(l, cx - 3, hipY, cx - 4, FOOT_Y - 3, 4, TROUSER_LIT);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) span(l, cx - 9 + (FOOT_Y - y) * 2, cx - 2, y, SHOE);
  });
  layer(c, (l) => drawTorso(l, cx, torsoTop, { bottom: hipY + 2 }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  headDetails(c, hx, hy, {});
  torsoDetails(c, cx, torsoTop, { bottom: hipY + 2 });
  c.setPixel(cx - 7, FOOT_Y - 1, SHOE_HI);
  c.setPixel(cx + 1, FOOT_Y - 1, SHOE_HI);
  layer(c, (l) => drawArmLayer(l, nearArm, signature ? 1 : 0));
  if (signature) glassAndCloth(c, nearArm.hx - 1, nearArm.hy - 2);
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
    frame.writePNG(join(OUT, `char_sasha_pose_${pose}_${VERSION}.png`));
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const id = frame.getPixel(x, y);
        if (id !== null) sheet.setPixel(i * FRAME_W + x, y, id);
      }
    }
  });
  sheet.writePNG(join(OUT, `char_sasha_sheet_${VERSION}.png`));

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
  sil.writePNG(join(OUT, `char_sasha_silhouette_${VERSION}.png`));
  console.log(`sasha: wrote ${POSES.length} poses + sheet + silhouette to ${OUT}`);
}

main();
