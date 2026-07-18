// char_gennady — factory turner / union organizer (direct pixel authoring).
// Design card: art/direction/character_cards/gennady.md
// Structural template: art/source/char/arkady.ts (art/direction/character_template.md).
//
// Run: corepack pnpm exec tsx art/source/char/gennady.ts
// Emits sheet + per-pose PNGs + silhouette into art/review_queue/char/.
//
// Card-specific deviations from the arkady template (see character_cards/gennady.md):
// - No jacket: open shirt + unbuttoned sleeveless vest. Torso built from
//   VEST teal (dark, dominant mass) with a wide open-collar SHIRT strip down
//   the front (2 buttons open) instead of a buttoned suit + tie.
// - Sleeves rolled hard ABOVE the elbow: a short cream cuff stub sits at the
//   very top of every forearm (breaks the dark vest mass "at the elbows" per
//   card), then the forearm itself is BARE SKIN (flesh_2-lit, thickest of the
//   cast, w=5) all the way to the wrist — never suit-colored sleeve fabric.
// - Permanent forward lean baked in as a lean baseline (BASE_LEAN) on every
//   seated pose, not just lean_in.
// - Right hand (= nearArm, the gesturing/table hand) carries the old injury
//   (index finger 1px short/bent) in every pose that shows it, per card
//   "prohibited changes".
// - Signature pose: full slap+point gesture (flat near hand slapping the
//   table, far hand extended pointing with the wooden folding ruler prop),
//   not a single raised finger.
// - Standing: shirt untucks 2px on the right (card construction note).
// - Small creased factory-photo pocket detail stamped on every torso.
// - Wider (24px) shoulders, thicker forearms, solid-belly torso taper, no
//   suit fold line (open shirt has no pressed-jacket closure).

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPalette } from "../../../scripts/art-pipeline/palette.ts";
import { SpriteCanvas } from "../../../scripts/art-pipeline/sprite.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "art/review_queue/char");
const palette = loadPalette(join(ROOT, "art/palette/wd-palette-v1.json"));

// ---------------------------------------------------------------- constants
const VERSION = "v001";
const FRAME_W = 48;
const FRAME_H = 96;
const FOOT_Y = 93; // last shoe row (locked, all characters)
const SEAT_Y = 69; // pelvis bottom row / seat plane (locked, all characters)
const STAND_CROWN = 10; // 93-84+1: 84px standing height (card)
const SEAT_CROWN = 30; // 93-64+1: 64px seated crown-to-floor (card)

// Palette roles (from the design card)
const OUTLINE = "soot_0";
const SHIRT_LIT = "cream_3";
const SHIRT_BODY = "cream_2";
const SHIRT_SHD = "cream_1";
const VEST_LIT = "teal_1";
const VEST_SHD = "teal_0";
const TROUSER_LIT = "soot_2";
const TROUSER_SHD = "soot_1";
const BELT_LIT = "wood_1";
const BELT_SHD = "wood_0";
const SOLE = "soot_1";
const SKIN = "flesh_1"; // base plane
const SKIN_SHD = "flesh_0"; // shadow plane
const SKIN_HI = "flesh_2"; // forearms + brow: "he works lit" (card exception)
const HAIR_LIT = "soot_3";
const HAIR_SHD = "soot_2";
const STUBBLE = "soot_2"; // 1-day jaw shadow, same value as hair shade
const SCAR = "soot_1"; // knuckle scar ticks
const PHOTO_LIT = "cream_2";
const PHOTO_SHD = "soot_2";
const RULER = "cream_2";

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
// 11w x 15h, facing left 3/4, EXPLICITLY outlined (o) — identity asset,
// hand-drawn not auto-outlined. Broad pentagon face, wide cheekbones, heavy
// wide jaw/chin, coarse short dark-gray hair receding at temples ONLY (not
// the full top like arkady), medium ear. SKIN PLANES (card default, NOT
// inverted like arkady): flesh_1 (f) is the dominant face plane; flesh_0 (s)
// shadow plane toward hair/jaw edge; flesh_2 (F) small highlight on brow only
// in the head map (forearms carry the larger flesh_2 area, see arms).
const HEAD_LEGEND: Record<string, string> = {
  o: OUTLINE,
  H: HAIR_LIT,
  h: HAIR_SHD,
  f: SKIN,
  s: SKIN_SHD,
  F: SKIN_HI,
  E: SKIN_SHD, // ear inner
};

// prettier-ignore
const HEAD_BASE = [
  "..oooooo...", // r0 hair crown
  ".oHHHHHHo..", // r1 full coarse hair band (recedes at temples only, not top)
  ".oHhHHHHo..", // r2
  ".ofHhHHho..", // r3 temple recede: forehead skin peeks at front edge
  ".offshHho..", // r4 forehead broadens; ear cap starts rear
  ".offsshHEo.", // r5 brow ridge row; ear top
  "offsssshEo.", // r6 eye row; wide skull
  "offsssshEo.", // r7 cheekbone row (widest, broad pentagon)
  "offsssshEo.", // r8 cheek plane continues wide
  "oFFsssshEo.", // r9 nose bulge front (2px highlight); ear still present
  "oFsssssho..", // r10 nose tip; ear ends
  ".ofssssoo..", // r11 under nose, jaw still broad
  ".osssssoo..", // r12 mouth row, heavy wide jaw
  "..ofsssoo..", // r13 heavy wide chin
  "...ooosoo..", // r14 undershot jaw bottom bump
];

interface FaceOpts {
  blink?: boolean;
  talk?: boolean;
  hooded?: boolean; // exhausted lids
}

/** Facial details, stamped AFTER compositing so they sit on top. */
function headDetails(c: SpriteCanvas, hx: number, hy: number, o: FaceOpts = {}): void {
  // brow: thick, dark, expressive — right (front, hx+3) sits 1px higher than
  // the left (rear, hx+6): "often one raised".
  c.setPixel(hx + 3, hy + 4, HAIR_SHD);
  c.setPixel(hx + 4, hy + 4, HAIR_SHD);
  c.setPixel(hx + 6, hy + 5, HAIR_SHD);
  c.setPixel(hx + 7, hy + 5, HAIR_SHD);
  // eyes
  if (o.blink || o.hooded) {
    c.setPixel(hx + 3, hy + 6, SKIN_SHD);
    c.setPixel(hx + 6, hy + 6, SKIN_SHD);
  } else {
    c.setPixel(hx + 3, hy + 6, OUTLINE);
    c.setPixel(hx + 6, hy + 6, OUTLINE);
  }
  // mouth (wide, undershot jaw reads as slightly open-set even resting)
  if (o.talk) {
    c.setPixel(hx + 2, hy + 12, OUTLINE);
    c.setPixel(hx + 3, hy + 12, OUTLINE);
  } else {
    c.setPixel(hx + 2, hy + 12, OUTLINE);
  }
  // 1-day stubble dusting along the jaw (clean-shaven but never smooth)
  c.setPixel(hx + 2, hy + 11, STUBBLE);
  c.setPixel(hx + 3, hy + 13, STUBBLE);
  c.setPixel(hx + 4, hy + 13, STUBBLE);
  // cauliflower irregularity, left ear (rear ear in this 3/4 view), 1px bump
  c.setPixel(hx + 9, hy + 6, SKIN_SHD);
}

/** Neck+head layer: neck first (auto-outlined), explicit head map on top. */
function drawHeadLayer(l: SpriteCanvas, hx: number, hy: number, collarY: number): void {
  // strong thick neck, 5px so shading planes survive the outline pass
  for (let y = hy + 12; y <= collarY + 1; y++) {
    l.setPixel(hx + 3, y, SKIN_HI);
    l.setPixel(hx + 4, y, SKIN);
    l.setPixel(hx + 5, y, SKIN);
    l.setPixel(hx + 6, y, SKIN_SHD);
    l.setPixel(hx + 7, y, SKIN_SHD);
  }
  blit(l, hx, hy, HEAD_BASE, HEAD_LEGEND);
}

// ---------------------------------------------------------------- torso
interface TorsoOpts {
  lean?: number; // px shift at shoulders (+right/-left), eased to 0 at pelvis
  drop?: number; // shoulders sag down (exhausted)
  bottom?: number; // last torso row (SEAT_Y seated, hip for standing)
}

/** Vest mass: 24px shoulders (half=12), solid belly (widens again low down).
 * Two-phase linear taper (shoulder->waist->belly), same shape as the arkady
 * template's suit taper — smooth single-direction steps only, no secondary
 * per-row offsets, so the silhouette edge reads clean at game scale. */
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
      half = 9; // shoulder slope
    else if (i === 1)
      half = 12; // full shoulder width (widest of the cast)
    else if (t < 0.62)
      half = Math.round(12 - 2.5 * (t / 0.62)); // to waist ~10
    else half = Math.round(9.5 + 1.5 * ((t - 0.62) / 0.38)); // solid belly, stays under shoulder width (wedge wider at top)
    const shift = Math.round(lean * (1 - t));
    const x0 = cx - half + shift;
    const x1 = cx + half + shift;
    const split = cx + 1 + shift;
    span(l, x0, Math.min(split, x1), y, VEST_LIT);
    if (split + 1 <= x1) span(l, split + 1, x1, y, VEST_SHD);
  }
}

/** Open shirt + vest details after compositing: no jacket, no tie. */
function torsoDetails(c: SpriteCanvas, cx: number, top: number, o: TorsoOpts = {}): void {
  const lean = o.lean ?? 0;
  const drop = o.drop ?? 0;
  const bottom = o.bottom ?? SEAT_Y;
  const shoulderY = top + drop;
  const rows = bottom - shoulderY;
  const px = (i: number) => Math.round(lean * (1 - i / rows));
  // open collar: wide cream shirt strip down the front (vest never closes,
  // 2 buttons open) — much wider than a buttoned collar+tie.
  const colX = cx - 4;
  for (let i = 1; i <= Math.round(rows * 0.45); i++) {
    const x = colX + px(i);
    c.setPixel(x, shoulderY + i, SHIRT_LIT);
    c.setPixel(x + 1, shoulderY + i, SHIRT_BODY);
    if (i > 1) c.setPixel(x + 2, shoulderY + i, SHIRT_SHD);
  }
  // creased factory photo tucked in the shirt pocket, chest front
  const pocketY = shoulderY + Math.round(rows * 0.28);
  const pocketX = colX + px(Math.round(rows * 0.28)) - 2;
  c.setPixel(pocketX, pocketY, PHOTO_LIT);
  c.setPixel(pocketX + 1, pocketY, PHOTO_SHD);
  c.setPixel(pocketX, pocketY + 1, PHOTO_SHD);
}

// ---------------------------------------------------------------- limbs
interface ArmSpec {
  sx?: number;
  sy?: number; // shoulder joint; omit to draw forearm only
  ex: number;
  ey: number; // elbow (rolled-sleeve point)
  hx: number;
  hy: number; // wrist
  lit: boolean; // near/front arm gets the "works lit" flesh_2 forearm
}

/**
 * Arm layer: rolled sleeve stub (cream, 2px) at the very top of the limb —
 * "sleeves rolled hard above the elbow ... breaks the dark mass at the
 * elbows" — then BARE forearm skin (w=5, thickest of the cast) to the wrist.
 * Seated poses draw the forearm only; poses that lift the arm clear of the
 * torso pass sx/sy and that whole shoulder->elbow segment is cream sleeve.
 */
function drawArmLayer(l: SpriteCanvas, a: ArmSpec, handDir = -1, injured = false): void {
  const skinFill = a.lit ? SKIN_HI : SKIN;
  if (a.sx !== undefined && a.sy !== undefined) {
    limb(l, a.sx, a.sy, a.ex, a.ey, 5, SHIRT_BODY);
  }
  const dx = Math.abs(a.hx - a.ex);
  const dy = Math.abs(a.hy - a.ey);
  const cuffSteps = a.sx === undefined ? 2 : 0; // rolled cuff stub at elbow start
  if (dx > dy) {
    for (let i = 0; i <= dx; i++) {
      const x = a.ex + Math.sign(a.hx - a.ex) * i;
      const y = Math.round(a.ey + (a.hy - a.ey) * (i / dx));
      const id = i < cuffSteps ? SHIRT_BODY : skinFill;
      l.setPixel(x, y - 2, id);
      l.setPixel(x, y - 1, id);
      l.setPixel(x, y, id);
      l.setPixel(x, y + 1, id);
      l.setPixel(x, y + 2, id);
    }
  } else {
    const steps = Math.abs(a.hy - a.ey);
    for (let i = 0; i <= steps; i++) {
      const y = a.ey + Math.sign(a.hy - a.ey || 1) * i;
      const x = Math.round(a.ex + (a.hx - a.ex) * (steps === 0 ? 0 : i / steps));
      const id = i < cuffSteps ? SHIRT_BODY : skinFill;
      span(l, x - 2, x + 2, y, id);
    }
  }
  // hand blocks: flesh_1 base with a flesh_2 lit knuckle, soot_1 scar tick.
  // `injured` (right/near hand only, card): the outermost finger column is
  // bent down 1 row instead of extended, drawn flush against the rest of
  // the block so the old shop injury reads as part of the hand, not a
  // floating fleck.
  if (handDir === 0) {
    // hanging hand (standing): 3w x 3h below the wrist
    for (let dyh = 0; dyh <= 2; dyh++) {
      l.setPixel(a.hx - 1, a.hy + dyh, dyh === 0 ? SKIN_HI : SKIN);
      l.setPixel(a.hx, a.hy + dyh, SKIN);
      l.setPixel(a.hx + 1, a.hy + dyh, SKIN_SHD);
    }
    if (injured) {
      l.setPixel(a.hx + 1, a.hy, SCAR);
      l.setPixel(a.hx + 1, a.hy + 1, SKIN_SHD);
    }
  } else {
    // resting/gesturing hand: 4x2 flesh block (thick workman's hand)
    for (let dxh = 0; dxh <= 3; dxh++) {
      const bend = injured && dxh === 3; // index finger 1px short/bent
      l.setPixel(a.hx + handDir * dxh, a.hy - 1 + (bend ? 1 : 0), dxh <= 1 ? SKIN_HI : SKIN);
      if (!bend) l.setPixel(a.hx + handDir * dxh, a.hy, SKIN);
    }
    if (injured) l.setPixel(a.hx + handDir * 2, a.hy - 1, SCAR);
  }
}

/** One seated leg facing left: thigh slab, shin (knee -> footX), boot. */
function drawSeatedLegLayer(
  l: SpriteCanvas,
  hipX: number, // rear of thigh (under pelvis)
  kneeX: number, // front of knee
  footX: number, // ankle x
  toe: number, // shoe length ahead of the ankle
  lit: boolean,
): void {
  const trouser = lit ? TROUSER_LIT : TROUSER_SHD;
  const thighTop = SEAT_Y - 6;
  for (let y = thighTop; y <= SEAT_Y; y++) {
    span(l, kneeX - 3, hipX, y, y === thighTop ? TROUSER_LIT : trouser);
  }
  limb(l, kneeX, SEAT_Y + 1, footX, FOOT_Y - 3, 5, trouser); // shin
  // heavy factory boot pointing left, unpolished, 3 rows, blunt toe
  for (let y = FOOT_Y - 2; y <= FOOT_Y; y++) {
    span(l, footX - toe + (FOOT_Y - y) * 2, footX + 2, y, BELT_LIT);
  }
}

function legDetails(c: SpriteCanvas, kneeX: number): void {
  for (let y = SEAT_Y + 4; y <= FOOT_Y - 4; y++) c.setPixel(kneeX, y, TROUSER_LIT); // seam crease
  c.setPixel(kneeX - 5, FOOT_Y - 1, SOLE); // unpolished sole edge, not a glint
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
const BASE_LEAN = -2; // permanent forward lean (card), applied to every seated pose

function drawPose(c: SpriteCanvas, pose: Pose): void {
  if (pose === "standing") return drawStanding(c);
  const breath = pose === "seated_listen_breath" ? -1 : 0;
  const face: FaceOpts = {
    blink: pose === "seated_listen_blink",
    talk: pose === "seated_talk",
    hooded: pose === "exhausted",
  };
  const exhausted = pose === "exhausted";
  // Distinct lean values per pose (not additive deltas) so lean_in/lean_back
  // read as clearly separate silhouettes rather than a muddy 1-3px nudge:
  // lean_in most forward, lean_back the one pose that goes positive (away
  // from the table — his only real recline), signature/exhausted/listen sit
  // on the permanent forward-lean baseline.
  const lean =
    pose === "lean_in" ? -6 : pose === "lean_back" ? 3 : pose === "signature" ? -3 : BASE_LEAN;
  const drop = exhausted ? 3 : 0; // shoulders sag hard when exhausted

  const torsoTop = SEAT_CROWN + 19 + breath; // shoulders nominal
  const headFwd = exhausted ? -2 : pose === "lean_in" ? -6 : pose === "lean_back" ? -1 : -4;
  const headDown = exhausted ? 6 : pose === "lean_in" ? 4 : 0; // exhausted: head bows hard
  const hx = CX - 5 + headFwd + Math.round(lean * 0.6);
  const hy = SEAT_CROWN + breath + headDown + drop;

  const shift = Math.round(lean * 0.9);
  // Arm targets: hands/elbows planted on the table plane (y54 = 39px above
  // floor). Card: elbows never intersect the tabletop plane — lean_in plants
  // them right at the edge (ey=53/54) rather than resting higher.
  let farArm: ArmSpec; // left hand
  let nearArm: ArmSpec; // right hand (carries the old injury)
  if (pose === "signature") {
    // slap + point: near (right) hand flat-slapped on the table; far (left)
    // hand lifted clear of the shoulder, extended forward pointing with the
    // folding ruler (shoulder anchor kept away from the collar so the two
    // arms don't collide into an unreadable blob).
    farArm = {
      sx: CX - 3 + shift,
      sy: torsoTop + 2,
      ex: CX - 7,
      ey: torsoTop + 7,
      hx: CX - 13,
      hy: torsoTop + 3,
      lit: false,
    };
    nearArm = { ex: CX - 5 + shift, ey: 55, hx: CX - 12, hy: 55, lit: true };
  } else if (exhausted) {
    farArm = { ex: CX - 3 + shift, ey: SEAT_Y - 6, hx: CX - 8, hy: SEAT_Y - 7, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 9, hx: CX - 12, hy: SEAT_Y - 6, lit: true };
  } else if (pose === "lean_back") {
    farArm = { ex: CX - 2 + shift, ey: SEAT_Y - 8, hx: CX - 6, hy: SEAT_Y - 9, lit: false };
    nearArm = { ex: CX - 4 + shift, ey: SEAT_Y - 11, hx: CX - 9, hy: SEAT_Y - 8, lit: true };
  } else if (pose === "lean_in") {
    farArm = { ex: CX - 5 + shift, ey: 53, hx: CX - 11, hy: 54, lit: false };
    nearArm = { ex: CX - 6 + shift, ey: 53, hx: CX - 15, hy: 54, lit: true };
  } else {
    // listen/talk: forearms squared on the table edge, forward lean baseline
    farArm = { ex: CX - 4 + shift, ey: SEAT_Y - 12, hx: CX - 9, hy: SEAT_Y - 13, lit: false };
    nearArm = { ex: CX - 5 + shift, ey: SEAT_Y - 11, hx: CX - 13, hy: SEAT_Y - 13, lit: true };
  }

  // ---- layered build, back to front
  layer(c, (l) => drawArmLayer(l, farArm));
  layer(c, (l) => drawSeatedLegLayer(l, CX + 6, 18, 20, 4, false)); // far leg, foot tucked
  layer(c, (l) => drawSeatedLegLayer(l, CX + 5, 13, 13, 8, true)); // near leg
  layer(c, (l) => drawTorso(l, CX, torsoTop, { lean, drop }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, -1, true));

  // ---- details on top
  headDetails(c, hx, hy, face);
  torsoDetails(c, CX, torsoTop, { lean, drop });
  legDetails(c, 13);
  if (pose === "signature") {
    // folding ruler in the left hand, extended forward past the fingertips
    span(c, farArm.hx - 5, farArm.hx, farArm.hy - 1, RULER);
    c.setPixel(farArm.hx - 5, farArm.hy - 1, OUTLINE); // hinge
    c.setPixel(farArm.hx - 2, farArm.hy - 1, OUTLINE); // hinge
  }
}

function drawStanding(c: SpriteCanvas): void {
  const cx = 24;
  const torsoTop = STAND_CROWN + 19; // shoulders
  const hipY = STAND_CROWN + 44; // shirt hem
  const hx = cx - 5 - 4; // head forward of chest line (leads with the chest)
  const hy = STAND_CROWN;

  const farArm: ArmSpec = {
    sx: cx + 7,
    sy: torsoTop + 4,
    ex: cx + 9,
    ey: torsoTop + 16,
    hx: cx + 9,
    hy: torsoTop + 29,
    lit: false,
  };
  const nearArm: ArmSpec = {
    sx: cx - 7,
    sy: torsoTop + 4,
    ex: cx - 9,
    ey: torsoTop + 16,
    hx: cx - 9,
    hy: torsoTop + 29,
    lit: true,
  };

  layer(c, (l) => drawArmLayer(l, farArm, 0));
  layer(c, (l) => {
    // far leg + boot
    limb(l, cx + 4, hipY, cx + 5, FOOT_Y - 3, 5, TROUSER_SHD);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++)
      span(l, cx - 1 + (FOOT_Y - y) * 2, cx + 8, y, BELT_SHD);
  });
  layer(c, (l) => {
    // near leg + boot, weight forward on the balls of the feet
    limb(l, cx - 4, hipY, cx - 3, FOOT_Y - 2, 5, TROUSER_LIT);
    for (let y = FOOT_Y - 2; y <= FOOT_Y; y++)
      span(l, cx - 10 + (FOOT_Y - y) * 2, cx - 2, y, BELT_LIT);
  });
  layer(c, (l) => drawTorso(l, cx, torsoTop, { bottom: hipY }));
  layer(c, (l) => drawHeadLayer(l, hx, hy, torsoTop + 1));
  layer(c, (l) => drawArmLayer(l, nearArm, 0, true));

  headDetails(c, hx, hy, {});
  torsoDetails(c, cx, torsoTop, { bottom: hipY });
  // belt buckle glint at the front hem (trousers, mostly hidden by the
  // untucked shirt/vest — a full belt bar would flatten the vest silhouette)
  c.setPixel(cx - 4, hipY, BELT_LIT);
  c.setPixel(cx - 3, hipY, BELT_SHD);
  // shirt untucks 2px on the right (card construction note)
  c.setPixel(cx + 9, hipY + 1, SHIRT_BODY);
  c.setPixel(cx + 10, hipY + 1, SHIRT_SHD);
  for (let y = hipY + 5; y <= FOOT_Y - 4; y++) c.setPixel(cx - 4, y, TROUSER_LIT); // crease
  c.setPixel(cx - 8, FOOT_Y - 1, SOLE);
  c.setPixel(cx + 2, FOOT_Y - 1, SOLE);
  armDetailsHanging(c, farArm);
  armDetailsHanging(c, nearArm);
}

/** Faint highlight seam on a hanging hand's back edge (standing pose only). */
function armDetailsHanging(c: SpriteCanvas, a: ArmSpec): void {
  c.setPixel(a.hx - 1, a.hy - 1, SKIN_HI);
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
    frame.writePNG(join(OUT, `char_gennady_pose_${pose}_${VERSION}.png`));
    for (let y = 0; y < FRAME_H; y++) {
      for (let x = 0; x < FRAME_W; x++) {
        const id = frame.getPixel(x, y);
        if (id !== null) sheet.setPixel(i * FRAME_W + x, y, id);
      }
    }
  });
  sheet.writePNG(join(OUT, `char_gennady_sheet_${VERSION}.png`));

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
  sil.writePNG(join(OUT, `char_gennady_silhouette_${VERSION}.png`));
  console.log(`gennady: wrote ${POSES.length} poses + sheet + silhouette to ${OUT}`);
}

main();
