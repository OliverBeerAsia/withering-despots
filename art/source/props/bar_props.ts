// Bar hand-props — direct pixel authoring (spec §4, ART_BIBLE §7 prop separation).
// Faceted glasses, tea glass in its metal holder, ashtray, Galina's stock notebook,
// Gennady's factory photograph, telephone. Each is an isolated table/hand prop with
// a base-center (or hold) anchor recorded in its sidecar JSON — placement/scale is
// the engine's job, not this script's.
//
// Run: corepack pnpm exec tsx art/source/props/bar_props.ts
// Emits PNGs to art/review_queue/props/. Sidecar JSON authored separately (matches
// the existing env/char convention — see art/review_queue/env/*.json).

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPalette } from "../../../scripts/art-pipeline/palette.ts";
import { SpriteCanvas } from "../../../scripts/art-pipeline/sprite.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "art/review_queue/props");
const palette = loadPalette(join(ROOT, "art/palette/wd-palette-v1.json"));
const VERSION = "v001";

const OUTLINE = "soot_0";

// ---------------------------------------------------------------- helpers (mirrors
// art/source/char/arkady.ts's layer/inlineOutline pattern — kept local, small props
// don't warrant a shared abstraction yet).
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

function span(c: SpriteCanvas, x0: number, x1: number, y: number, id: string): void {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) c.setPixel(x, y, id);
}

function ellipseFill(
  c: SpriteCanvas,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  id: string,
): void {
  for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
    for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) c.setPixel(cx + x, cy + y, id);
    }
  }
}

/** Faceted-tumbler body: lerped trapezoid, vertical facet bands (light/mid/dark). */
function drawFacetedBody(
  l: SpriteCanvas,
  cx: number,
  topY: number,
  rows: number,
  topHalf: number,
  botHalf: number,
  bands: { light: string; mid: string; dark: string },
): void {
  for (let i = 0; i < rows; i++) {
    const t = rows === 1 ? 0 : i / (rows - 1);
    const half = topHalf + (botHalf - topHalf) * t;
    const x0 = Math.round(cx - half);
    const x1 = Math.round(cx + half);
    const w = x1 - x0;
    for (let x = x0; x <= x1; x++) {
      const ratio = w === 0 ? 0.5 : (x - x0) / w;
      const id =
        ratio < 0.25
          ? bands.light
          : ratio < 0.55
            ? bands.mid
            : ratio < 0.8
              ? bands.dark
              : bands.mid;
      l.setPixel(x, topY + i, id);
    }
  }
}

// ================================================================== glasses
// Classic Soviet 10-12-facet tumbler (граненый стакан), empty/clear. Light upper-
// left: left band lit (soot_4), center mid (soot_3), right band dark (soot_2, shadow
// facet) — mirrors the character convention (lit = near/left).
const GLASS_BANDS = { light: "soot_4", mid: "soot_3", dark: "soot_2" };

function drawFacetedGlass(
  frameW: number,
  frameH: number,
  topHalf: number,
  botHalf: number,
  rows: number,
): SpriteCanvas {
  const c = new SpriteCanvas(frameW, frameH, palette);
  const cx = Math.floor(frameW / 2);
  const topY = frameH - 1 - rows - 1; // 1px base foot below body
  layer(c, (l) => drawFacetedBody(l, cx, topY, rows, topHalf, botHalf, GLASS_BANDS));
  // base foot ring, slightly narrower than the last body row
  layer(c, (l) =>
    span(l, Math.round(cx - botHalf) + 1, Math.round(cx + botHalf) - 1, frameH - 1, "soot_1"),
  );
  // rim glint: 2px cream_3 catch-light on the lit (left) facet band, top of body
  c.setPixel(Math.round(cx - topHalf * 0.55), topY + 1, "cream_3");
  c.setPixel(Math.round(cx - topHalf * 0.55), topY + 2, "cream_3");
  return c;
}

// ================================================================== tea glass + holder
// Podstakannik: openwork metal holder around the lower 2/3 of a glass filled with
// dark tea. Handle to the right (side, not front) so it silhouettes clean.
const TEA_BANDS = { light: "amber_2", mid: "amber_1", dark: "amber_0" };

function drawTeaGlassHolder(): SpriteCanvas {
  const frameW = 13;
  const frameH = 17;
  const c = new SpriteCanvas(frameW, frameH, palette);
  const cx = 5;
  const topHalf = 3;
  const botHalf = 2;
  const rows = 11;
  const topY = 2;
  // glass body (tea-filled)
  layer(c, (l) => drawFacetedBody(l, cx, topY, rows, topHalf, botHalf, TEA_BANDS));
  // tea surface glint (liquid catches light at the rim)
  c.setPixel(cx - 1, topY + 1, "cream_3");
  // metal holder cradle: base ring + two side ribs + rim collar, wraps rows topY+5..topY+rows
  const holderTop = topY + 5;
  const holderBot = topY + rows;
  layer(c, (l) => {
    span(l, cx - topHalf - 1, cx + topHalf + 1, holderTop, "soot_3"); // rim collar
    for (let y = holderTop + 1; y <= holderBot; y++) {
      l.setPixel(cx - topHalf - 1, y, "soot_3"); // left rib (lit)
      l.setPixel(cx + topHalf + 1, y, "soot_2"); // right rib (shade)
    }
    span(l, cx - topHalf - 1, cx + topHalf + 1, holderBot + 1, "soot_2"); // base ring
  });
  // handle: C-loop off the right side
  layer(c, (l) => {
    l.line(cx + topHalf + 2, holderTop + 1, cx + topHalf + 4, holderTop + 3, "soot_3");
    l.line(cx + topHalf + 4, holderTop + 3, cx + topHalf + 4, holderBot - 1, "soot_3");
    l.line(cx + topHalf + 4, holderBot - 1, cx + topHalf + 2, holderBot + 1, "soot_3");
  });
  return c;
}

// ================================================================== ashtray
function drawAshtray(): SpriteCanvas {
  // Concentric ellipses painted directly (largest/darkest first) instead of the
  // layer()+inlineOutline() pattern — at this flat an aspect ratio, auto-outlining
  // eats the whole interior. The outer soot_0 ellipse itself reads as the contour.
  const frameW = 14;
  const frameH = 8;
  const c = new SpriteCanvas(frameW, frameH, palette);
  const cx = 7;
  const cy = 4;
  ellipseFill(c, cx, cy, 6, 3, "soot_0"); // contour
  ellipseFill(c, cx, cy, 5.3, 2.4, "soot_3"); // rim, lit metal
  ellipseFill(c, cx, cy, 4.3, 1.7, "soot_2"); // rim shade / inner wall
  ellipseFill(c, cx, cy, 3, 1, "soot_1"); // bowl recess
  // rim highlight arc (front-left catches lamp light)
  c.setPixel(cx - 4, cy - 1, "soot_4");
  c.setPixel(cx - 3, cy - 1, "soot_4");
  // two cigarette-rest notches cut into the rim
  c.setPixel(cx - 2, cy - 3, "soot_0");
  c.setPixel(cx + 2, cy - 3, "soot_0");
  // ash/butt hint in the bowl
  c.setPixel(cx, cy, "soot_4");
  return c;
}

// ================================================================== stock notebook
// Galina's: soft cream cover, rubber band, ruled page edge (card: soot_0 ruled edge).
function drawNotebook(): SpriteCanvas {
  const frameW = 12;
  const frameH = 10;
  const c = new SpriteCanvas(frameW, frameH, palette);
  layer(c, (l) => {
    l.rect(1, 1, 10, 8, "cream_2");
    l.rect(1, 1, 10, 1, "cream_3"); // lamplit top sheen
  });
  // ruled page edge (right side, thin cream_1/soot_0 stripes = stacked pages)
  for (let y = 2; y <= 8; y += 2) c.setPixel(10, y, "soot_0");
  for (let y = 3; y <= 8; y += 2) c.setPixel(10, y, "cream_1");
  // rubber band, diagonal
  c.setPixel(3, 2, "soot_1");
  c.setPixel(4, 3, "soot_1");
  c.setPixel(5, 4, "soot_1");
  c.setPixel(6, 5, "soot_1");
  c.setPixel(7, 6, "soot_1");
  c.setPixel(8, 7, "soot_1");
  // dog-eared corner, bottom-right
  c.setPixel(9, 8, "cream_1");
  c.setPixel(10, 8, "cream_0");
  return c;
}

// ================================================================== factory photograph
// Gennady's: creased, never crisp — b/w brigade group in front of a lathe row,
// rendered as pure value shapes (ART_BIBLE §7: no legible detail, no faces).
function drawPhotograph(): SpriteCanvas {
  // Drawn with plain rects (no layer()/inlineOutline — that pass would eat the
  // cream_3 paper-mat border, since a filled rect's whole perimeter counts as
  // "edge"). Explicit outline -> mat -> image field, largest to smallest.
  const frameW = 11;
  const frameH = 9;
  const c = new SpriteCanvas(frameW, frameH, palette);
  c.rect(0, 0, 11, 9, "soot_0"); // contour / shadow under paper lip
  c.rect(0, 0, 10, 8, "cream_3"); // photo paper mat
  c.rect(1, 1, 9, 7, "soot_2"); // monochrome image field
  c.rect(1, 5, 9, 2, "soot_1"); // lathe row (dark mass, back of frame)
  // three tiny abstracted figure silhouettes
  c.setPixel(3, 3, "soot_0");
  c.setPixel(3, 4, "soot_0");
  c.setPixel(5, 3, "soot_0");
  c.setPixel(5, 4, "soot_0");
  c.setPixel(7, 3, "soot_0");
  c.setPixel(7, 4, "soot_0");
  // diagonal crease (creased, never crisp)
  for (let i = 0; i < 9; i++) c.setPixel(1 + i, 1 + Math.round(i * 0.75), "soot_1");
  // lifted corner fold
  c.setPixel(9, 1, "cream_1");
  c.setPixel(9, 2, "cream_0");
  return c;
}

// ================================================================== telephone
// Desk phone on the phone shelf (bg_mid x168-191). Dark bakelite body, handset
// resting on cradle prongs, dial with finger holes (no legible numerals), cord.
function drawTelephone(): SpriteCanvas {
  const frameW = 15;
  const frameH = 15;
  const c = new SpriteCanvas(frameW, frameH, palette);
  // base body
  layer(c, (l) => {
    l.rect(2, 6, 11, 8, "soot_1");
    l.rect(2, 6, 11, 1, "soot_2"); // top edge lit
  });
  // dial: small disc with finger holes
  layer(c, (l) => ellipseFill(l, 7, 10, 3, 3, "soot_3"));
  const holes: Array<[number, number]> = [
    [7, 8],
    [5, 9],
    [5, 11],
    [7, 12],
    [9, 11],
    [9, 9],
  ];
  for (const [hx, hy] of holes) c.setPixel(hx, hy, "soot_0");
  // handset resting across the top on two cradle prongs
  layer(c, (l) => {
    l.setPixel(3, 5, "soot_2"); // left prong
    l.setPixel(11, 5, "soot_2"); // right prong
  });
  layer(c, (l) => {
    ellipseFill(l, 4, 3, 2, 1, "soot_1"); // earpiece
    ellipseFill(l, 10, 3, 2, 1, "soot_1"); // mouthpiece
    span(l, 5, 9, 3, "soot_2"); // handset bar
  });
  c.setPixel(6, 2, "soot_3"); // handset top sheen
  // cord: soot_0 zigzag from handset to base side
  c.setPixel(2, 4, "soot_0");
  c.setPixel(1, 6, "soot_0");
  c.setPixel(2, 8, "soot_0");
  c.setPixel(1, 10, "soot_0");
  return c;
}

// ---------------------------------------------------------------- output
interface Prop {
  id: string;
  make: () => SpriteCanvas;
}

const PROPS: Prop[] = [
  { id: "prop_faceted_glass_small", make: () => drawFacetedGlass(9, 12, 3.2, 2.2, 8) },
  { id: "prop_faceted_glass_medium", make: () => drawFacetedGlass(11, 15, 4.2, 2.8, 10) },
  { id: "prop_tea_glass_holder", make: () => drawTeaGlassHolder() },
  { id: "prop_metal_ashtray", make: () => drawAshtray() },
  { id: "prop_stock_notebook", make: () => drawNotebook() },
  { id: "prop_factory_photograph", make: () => drawPhotograph() },
  { id: "prop_telephone", make: () => drawTelephone() },
];

function main(): void {
  mkdirSync(OUT, { recursive: true });
  for (const prop of PROPS) {
    const canvas = prop.make();
    canvas.writePNG(join(OUT, `${prop.id}_${VERSION}.png`));
    console.log(`bar_props: wrote ${prop.id}_${VERSION}.png (${canvas.width}x${canvas.height})`);
  }
}

main();
