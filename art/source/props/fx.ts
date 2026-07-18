// FX overlays (spec §4, ASSET_MANIFEST §2): smoke wisps + two light masks.
//
// SpriteCanvas pixels are binary alpha (0 or 255) — there is no true partial-alpha
// blend available to authored art. "Low alpha" / soft falloff is faked the way
// pixel-art fx conventionally does it: sparse stochastic dithering, density
// falling off with distance from the source. Engine composites these as normal
// alpha-blended PNGs; the sparse coverage IS the opacity.
//
// - fx_smoke_wisp_01/02/03: subtle asynchronous drifting curls (soot tones only,
//   per environment_notes "smoke should not erase faces").
// - fx_tv_light_mask: 640x360, localized cyan glow radiating from the TV screen
//   aperture (native 471-520,59-88, center ~495,73) toward table B / the east
//   patron (environment_notes Light logic #3 — "affects nearby faces only during
//   bright frames"). Engine-blended, photosensitivity-safe (soft, small radius).
// - env_bar_door_light_overlay: 640x360, localized teal_0->cyan_0 streak from the
//   street door leaf (native x537-569,y99-218) sweeping onto the near floor.
//
// Run: corepack pnpm exec tsx art/source/props/fx.ts

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPalette } from "../../../scripts/art-pipeline/palette.ts";
import { SpriteCanvas } from "../../../scripts/art-pipeline/sprite.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "art/review_queue/props");
const palette = loadPalette(join(ROOT, "art/palette/wd-palette-v1.json"));
const FX_VERSION = "v002";
const TV_VERSION = "v003";

function noise(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 2246822519;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 1000) / 1000;
}

// ================================================================== smoke wisps
// A single lazy S-curl rising and dissipating (density -> 0 near the top). Each
// frame nudges the curl and reseeds the dither so a 3-frame loop reads as drift,
// not a repeating stamp.
const SMOKE_W = 14;
const SMOKE_H = 26;

function drawSmokeWisp(seed: number, driftX: number, driftY: number): SpriteCanvas {
  // QA rework: no stochastic single-pixel dither (read as scratches at 1x).
  // The wisp is a short chain of solid 2-3px puffs riding a lazy S-curve;
  // puffs shrink and lighten as they rise, and each frame's drift/seed shifts
  // the chain so the 3-frame loop reads as slow drift.
  const c = new SpriteCanvas(SMOKE_W, SMOKE_H, palette);
  const PUFFS = 5;
  for (let i = 0; i < PUFFS; i++) {
    const t = i / (PUFFS - 1); // 0 at base -> 1 at top
    const y = Math.round(SMOKE_H - 3 - t * (SMOKE_H - 5)) - (driftY > 2 ? 1 : 0);
    const curl = Math.sin((t + noise(i, 0, seed) * 0.2) * Math.PI * 1.4) * 3;
    const x = Math.round(SMOKE_W / 2 + curl + driftX * (1 - t));
    const big = t < 0.45; // lower puffs are fuller
    // core
    c.setPixel(x, y, "soot_4");
    c.setPixel(x + 1, y, "soot_4");
    if (big) {
      c.setPixel(x, y + 1, "soot_3");
      c.setPixel(x + 1, y + 1, "soot_3");
      c.setPixel(x + 2, y, "soot_3");
    } else if (t < 0.9) {
      c.setPixel(x + (noise(i, 1, seed) < 0.5 ? -1 : 2), y, "soot_3");
    }
  }
  return c;
}

// ================================================================== tv light mask
// 640x360 canvas, dithered radial falloff centered on the screen aperture,
// biased down-left toward table B (native ~440,200) / anchor-patron-east
// (~437,170) per environment_notes Light logic #3.
const CANVAS_W = 640;
const CANVAS_H = 360;

function drawTvLightMask(): SpriteCanvas {
  // Atmosphere pass: CRT light is reflected light, not a projector. Keep three
  // disconnected local responses only: a one-pixel housing rim, a shallow wall
  // bounce below the set, and a small crescent on the nearest tabletop. There
  // is deliberately no cone connecting the set to the table and no global dim.
  const c = new SpriteCanvas(CANVAS_W, CANVAS_H, palette);

  // 1) local glow rim around the housing (463-530, 50-105)
  const rim = { x0: 463, y0: 50, x1: 530, y1: 105 };
  for (let y = rim.y0; y <= rim.y1; y++) {
    for (let x = rim.x0; x <= rim.x1; x++) {
      const edge = x === rim.x0 || x === rim.x1 || y === rim.y0 || y === rim.y1;
      if (edge) {
        c.setPixel(x, y, "cyan_0");
      }
    }
  }

  // 2) shallow, stepped wall bounce directly below the set. It stops well
  // above the patron and table planes.
  for (let y = 106; y <= 123; y++) {
    const row = y - 106;
    const left = 474 - Math.floor(row / 6) * 2;
    const right = 519 + Math.floor(row / 8) * 2;
    for (let x = left; x <= right; x++) {
      const edge = x - left < 2 || right - x < 2 || row < 3;
      if (edge || (row < 8 && x >= 486 && x <= 507)) {
        c.setPixel(x, y, row < 4 && x >= 488 && x <= 505 ? "cyan_1" : "cyan_0");
      }
    }
  }

  // 3) a restrained reflected crescent on table B (anchor 440,200 native).
  // The patch stays left of Lev's seat anchor at x475.
  for (let y = 196; y <= 203; y++) {
    const ey = (y - 200) / 4;
    if (Math.abs(ey) > 1) {
      continue;
    }
    const hw = Math.round(17 * Math.sqrt(1 - ey * ey));
    const x0 = 440 - hw;
    const x1 = 440 + hw;
    for (let x = x0; x <= x1; x++) {
      const crescent = y >= 199 || x - x0 < 2 || x1 - x < 2;
      if (crescent) {
        c.setPixel(x, y, "cyan_0");
      }
    }
  }
  return c;
}

// ================================================================== door light overlay
// Localized cool streak from the street door leaf (native x537-569,y99-218)
// fanning onto the near floor toward the room's walk path.
function drawDoorLightOverlay(): SpriteCanvas {
  // QA rework: the dashed dithered stream read as teal noise by the door. Now a
  // coherent solid shaft: bright seam down the door glass, a stepped wedge of
  // streetlight spilling from the door base onto the near floor, ending in a
  // clean pool. Engine composites at partial alpha; no dither anywhere.
  const c = new SpriteCanvas(CANVAS_W, CANVAS_H, palette);
  const doorTopY = 104;
  const doorBotY = 213;

  // 1) seam of light along the door glass (solid, hugging the glazing bar)
  for (let y = doorTopY; y <= doorBotY; y++) {
    c.setPixel(551, y, "cyan_1");
    c.setPixel(552, y, "cyan_1");
    c.setPixel(553, y, "cyan_0");
    c.setPixel(554, y, "cyan_0");
  }

  // 2) wedge from the door base (537-569 at y~210) onto the floor, down-left
  const spillTop = 210;
  const spillBot = 252;
  for (let y = spillTop; y <= spillBot; y++) {
    const t = (y - spillTop) / (spillBot - spillTop);
    const left = Math.round((537 - t * 32) / 2) * 2;
    const right = Math.round((569 - t * 12) / 2) * 2;
    for (let x = left; x <= right; x++) {
      const inner = x > left + (right - left) * 0.35 && x < right - (right - left) * 0.15;
      c.setPixel(x, y, inner ? "teal_1" : "teal_0");
    }
  }
  return c;
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  const smoke: Array<[string, SpriteCanvas]> = [
    ["fx_smoke_wisp_01", drawSmokeWisp(3, 0, 0)],
    ["fx_smoke_wisp_02", drawSmokeWisp(41, 1, 2)],
    ["fx_smoke_wisp_03", drawSmokeWisp(88, -1, 4)],
  ];
  for (const [id, canvas] of smoke) {
    canvas.writePNG(join(OUT, `${id}_${FX_VERSION}.png`));
    console.log(`fx: wrote ${id}_${FX_VERSION}.png (${canvas.width}x${canvas.height})`);
  }

  const tvMask = drawTvLightMask();
  tvMask.writePNG(join(OUT, `fx_tv_light_mask_${TV_VERSION}.png`));
  console.log(`fx: wrote fx_tv_light_mask_${TV_VERSION}.png (${tvMask.width}x${tvMask.height})`);

  const doorLight = drawDoorLightOverlay();
  doorLight.writePNG(join(OUT, `env_bar_door_light_overlay_${FX_VERSION}.png`));
  console.log(
    `fx: wrote env_bar_door_light_overlay_${FX_VERSION}.png (${doorLight.width}x${doorLight.height})`,
  );
}

main();
