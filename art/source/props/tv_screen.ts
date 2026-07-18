// TV screen states — sized to the transparent aperture in env_bar_bg_mid's TV
// housing (art/source/env/bg_mid.svg: "screen aperture x471-520 y59-88" = 49x29
// native px, top-left at (471,59)). The housing shell + cyan_0 static rim live in
// bg_mid; this script only fills the aperture hole with the screen-state prop.
//
// States: off, static (2 alternating frames), broadcast glow (2 alternating
// frames). Static/glow pairs are near-equal average luminance and differ only in
// noise/scanline position — photosensitivity-safe per ART_BIBLE §9 lighting logic
// ("CRT light should affect nearby faces only during bright frames") and the
// spec's engine-blended, non-strobing flicker requirement. No legible imagery
// (ART_BIBLE §7: never render legible content) — pure abstract phosphor fields.
//
// Run: corepack pnpm exec tsx art/source/props/tv_screen.ts

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPalette } from "../../../scripts/art-pipeline/palette.ts";
import { SpriteCanvas } from "../../../scripts/art-pipeline/sprite.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = join(ROOT, "art/review_queue/props");
const palette = loadPalette(join(ROOT, "art/palette/wd-palette-v1.json"));
const VERSION = "v001";

const W = 49;
const H = 29;

/** Deterministic hash-based pseudo-random in [0,1), seeded per-pixel + frame. */
function noise(x: number, y: number, seed: number): number {
  let h = x * 374761393 + y * 668265263 + seed * 2246822519;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 1000) / 1000;
}

function vignetteFalloff(x: number, y: number): number {
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const dx = (x - cx) / cx;
  const dy = (y - cy) / cy;
  return Math.min(1, Math.sqrt(dx * dx + dy * dy)); // 0 center -> ~1 corner
}

function drawOff(): SpriteCanvas {
  const c = new SpriteCanvas(W, H, palette);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = vignetteFalloff(x, y);
      c.setPixel(x, y, v > 0.75 ? "soot_0" : "soot_1");
    }
  }
  // faint dead-glass reflection streak, upper-left to center (soot_2, cool off state)
  for (let i = 0; i < 14; i++) {
    const x = 4 + i;
    const y = 3 + Math.round(i * 0.4);
    if (x < W && y < H) c.setPixel(x, y, "soot_2");
  }
  return c;
}

function drawStatic(seed: number): SpriteCanvas {
  const c = new SpriteCanvas(W, H, palette);
  const tones = ["soot_0", "soot_1", "cyan_0", "cyan_1", "cyan_2"];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = vignetteFalloff(x, y);
      const n = noise(x, y, seed);
      // brighter tones rarer (cyan_2 only ~8% of pixels), darker tones dominate
      // toward the vignette edge so the tube shape still reads through the noise.
      let idx: number;
      if (n < 0.08) idx = 4;
      else if (n < 0.24) idx = 3;
      else if (n < 0.5) idx = 2;
      else if (n < 0.75) idx = 1;
      else idx = 0;
      if (v > 0.7 && idx > 2) idx = 2; // clamp brightness near corners
      if (v > 0.9) idx = 0;
      c.setPixel(x, y, tones[idx]);
    }
  }
  return c;
}

function drawBroadcastGlow(seed: number, scanOffset: number): SpriteCanvas {
  const c = new SpriteCanvas(W, H, palette);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = vignetteFalloff(x, y);
      let id: string;
      if (v < 0.35) id = "cyan_2";
      else if (v < 0.65) id = "cyan_1";
      else if (v < 0.9) id = "cyan_0";
      else id = "soot_0";
      // subtle scanlines: every other row (offset per frame) one step darker
      if ((y + scanOffset) % 2 === 0) {
        if (id === "cyan_2") id = "cyan_1";
        else if (id === "cyan_1") id = "cyan_0";
      }
      // faint noise grain so the glow isn't a flat gradient
      if (noise(x, y, seed) < 0.05 && id === "cyan_1") id = "cyan_2";
      c.setPixel(x, y, id);
    }
  }
  return c;
}

function main(): void {
  mkdirSync(OUT, { recursive: true });
  const frames: Array<[string, SpriteCanvas]> = [
    ["prop_tv_screen_off", drawOff()],
    ["prop_tv_screen_static_a", drawStatic(11)],
    ["prop_tv_screen_static_b", drawStatic(97)],
    ["prop_tv_screen_broadcast_glow_a", drawBroadcastGlow(5, 0)],
    ["prop_tv_screen_broadcast_glow_b", drawBroadcastGlow(53, 1)],
  ];
  for (const [id, canvas] of frames) {
    canvas.writePNG(join(OUT, `${id}_${VERSION}.png`));
    console.log(`tv_screen: wrote ${id}_${VERSION}.png (${canvas.width}x${canvas.height})`);
  }
}

main();
