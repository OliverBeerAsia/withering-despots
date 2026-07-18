// Integer-upscale a PNG (nearest neighbor, no interpolation) by factor N for
// visual inspection of native-resolution pixel art at readable size.
//
// Usage:
//   corepack pnpm exec tsx scripts/art-pipeline/preview.ts <in.png> <out.png> <N>

import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";

export function upscale(png: PNG, factor: number): PNG {
  if (!Number.isInteger(factor) || factor <= 0) {
    throw new Error(`preview: factor must be a positive integer, got ${String(factor)}`);
  }
  const { width, height, data } = png;
  const out = new PNG({ width: width * factor, height: height * factor });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (width * y + x) << 2;
      const r = data[srcIdx] ?? 0;
      const g = data[srcIdx + 1] ?? 0;
      const b = data[srcIdx + 2] ?? 0;
      const a = data[srcIdx + 3] ?? 0;

      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const ox = x * factor + dx;
          const oy = y * factor + dy;
          const outIdx = (out.width * oy + ox) << 2;
          out.data[outIdx] = r;
          out.data[outIdx + 1] = g;
          out.data[outIdx + 2] = b;
          out.data[outIdx + 3] = a;
        }
      }
    }
  }

  return out;
}

export function preview(inPath: string, outPath: string, factor: number): void {
  const input = PNG.sync.read(readFileSync(inPath));
  const output = upscale(input, factor);
  writeFileSync(outPath, PNG.sync.write(output));
}

function main(): void {
  const [inPath, outPath, factorStr] = process.argv.slice(2);
  if (!inPath || !outPath || !factorStr) {
    console.error("Usage: tsx preview.ts <in.png> <out.png> <N>");
    process.exit(1);
  }
  const factor = parseInt(factorStr, 10);
  preview(inPath, outPath, factor);
  console.log(`preview: wrote ${outPath} (${String(factor)}x upscale)`);
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
