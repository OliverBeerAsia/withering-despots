// Box-downsample a PNG by an integer factor to the canonical 640x360 native
// art resolution, then map every output pixel to the nearest color in the
// locked palette (art/palette/wd-palette-v1.json, schema in palette.ts).
//
// Usage:
//   corepack pnpm exec tsx scripts/art-pipeline/reduce.ts <in.png> <out.png> <palette.json> [factor]
//
// If [factor] is omitted it is derived from the input size (input must be
// exactly factor*640 by factor*360 for some positive integer factor).
//
// Alpha handling:
//   - Each output pixel averages a factor x factor block using alpha-weighted
//     (premultiplied) color averaging, so transparent source pixels never
//     bleed black/garbage color into the average.
//   - A block with zero total alpha becomes fully transparent (alpha 0),
//     color channels zeroed.
//   - Otherwise alpha is snapped to 0 or 255 by a 50% threshold on the
//     average alpha; color is only computed (and palette-mapped) when the
//     result is opaque.

import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { loadPalette, nearestPaletteColor, hexToRgb, type Palette } from "./palette.ts";

export const NATIVE_WIDTH = 640;
export const NATIVE_HEIGHT = 360;

export interface ReduceOptions {
  inPath: string;
  outPath: string;
  palette: Palette;
  factor?: number;
}

export function reduceBuffer(png: PNG, palette: Palette, factorOverride?: number): PNG {
  const { width, height, data } = png;
  const factor = factorOverride ?? deriveFactor(width, height);
  if (width !== factor * NATIVE_WIDTH || height !== factor * NATIVE_HEIGHT) {
    throw new Error(
      `reduce: input ${String(width)}x${String(height)} does not equal factor(${String(factor)})*${String(NATIVE_WIDTH)}x${String(NATIVE_HEIGHT)}`,
    );
  }

  const out = new PNG({ width: NATIVE_WIDTH, height: NATIVE_HEIGHT });
  const paletteRgbCache = new Map<string, ReturnType<typeof hexToRgb>>();

  for (let oy = 0; oy < NATIVE_HEIGHT; oy++) {
    for (let ox = 0; ox < NATIVE_WIDTH; ox++) {
      let sumA = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      const blockPixels = factor * factor;

      for (let by = 0; by < factor; by++) {
        for (let bx = 0; bx < factor; bx++) {
          const x = ox * factor + bx;
          const y = oy * factor + by;
          const idx = (width * y + x) << 2;
          const r = data[idx] ?? 0;
          const g = data[idx + 1] ?? 0;
          const b = data[idx + 2] ?? 0;
          const a = data[idx + 3] ?? 0;
          sumA += a;
          sumR += r * a;
          sumG += g * a;
          sumB += b * a;
        }
      }

      const outIdx = (NATIVE_WIDTH * oy + ox) << 2;
      const avgAlpha = sumA / blockPixels; // 0..255
      if (sumA === 0 || avgAlpha < 128) {
        out.data[outIdx] = 0;
        out.data[outIdx + 1] = 0;
        out.data[outIdx + 2] = 0;
        out.data[outIdx + 3] = 0;
        continue;
      }

      const unpremulR = sumR / sumA;
      const unpremulG = sumG / sumA;
      const unpremulB = sumB / sumA;
      const nearest = nearestPaletteColor({ r: unpremulR, g: unpremulG, b: unpremulB }, palette);
      let rgb = paletteRgbCache.get(nearest.id);
      if (!rgb) {
        rgb = hexToRgb(nearest.hex);
        paletteRgbCache.set(nearest.id, rgb);
      }
      out.data[outIdx] = rgb.r;
      out.data[outIdx + 1] = rgb.g;
      out.data[outIdx + 2] = rgb.b;
      out.data[outIdx + 3] = 255;
    }
  }

  return out;
}

function deriveFactor(width: number, height: number): number {
  const fx = width / NATIVE_WIDTH;
  const fy = height / NATIVE_HEIGHT;
  if (!Number.isInteger(fx) || !Number.isInteger(fx) || fx !== fy || fx <= 0) {
    throw new Error(
      `reduce: cannot derive integer factor from ${String(width)}x${String(height)} for target ${String(NATIVE_WIDTH)}x${String(NATIVE_HEIGHT)} (fx=${String(fx)}, fy=${String(fy)})`,
    );
  }
  return fx;
}

export function reduce(opts: ReduceOptions): void {
  const input = PNG.sync.read(readFileSync(opts.inPath));
  const output = reduceBuffer(input, opts.palette, opts.factor);
  writeFileSync(opts.outPath, PNG.sync.write(output));
}

function main(): void {
  const [inPath, outPath, palettePath, factorStr] = process.argv.slice(2);
  if (!inPath || !outPath || !palettePath) {
    console.error("Usage: tsx reduce.ts <in.png> <out.png> <palette.json> [factor]");
    process.exit(1);
  }
  const palette = loadPalette(palettePath);
  const factor = factorStr ? parseInt(factorStr, 10) : undefined;
  reduce(
    factor !== undefined ? { inPath, outPath, palette, factor } : { inPath, outPath, palette },
  );
  console.log(`reduce: wrote ${outPath} (${String(NATIVE_WIDTH)}x${String(NATIVE_HEIGHT)})`);
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  try {
    main();
  } catch (err: unknown) {
    console.error(err);
    process.exit(1);
  }
}
