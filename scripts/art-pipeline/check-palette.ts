// Verify a PNG contains only palette colors (+ fully transparent pixels).
// Exits nonzero and lists offending colors if any off-palette pixel is found.
//
// Usage:
//   corepack pnpm exec tsx scripts/art-pipeline/check-palette.ts <in.png> <palette.json>

import { readFileSync } from "node:fs";
import { PNG } from "pngjs";
import { loadPalette, rgbToHex, type Palette } from "./palette.ts";

export interface Offender {
  hex: string;
  count: number;
  firstX: number;
  firstY: number;
}

export interface CheckResult {
  ok: boolean;
  totalPixels: number;
  offPalettePixels: number;
  offenders: Offender[];
}

export function checkPalette(png: PNG, palette: Palette): CheckResult {
  const allowed = new Set(palette.colors.map((c) => c.hex));
  const { width, height, data } = png;
  const offenders = new Map<string, Offender>();
  let offCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const a = data[idx + 3] ?? 0;
      if (a === 0) continue; // fully transparent is always allowed
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      if (a !== 255) {
        // Partial alpha should never survive the reduce step; flag it distinctly.
        const key = `partial-alpha:${String(a)}`;
        const existing = offenders.get(key);
        if (existing) {
          existing.count++;
        } else {
          offenders.set(key, {
            hex: `rgba(${String(r)},${String(g)},${String(b)},${String(a)})`,
            count: 1,
            firstX: x,
            firstY: y,
          });
        }
        offCount++;
        continue;
      }
      const hex = rgbToHex({ r, g, b });
      if (!allowed.has(hex)) {
        const existing = offenders.get(hex);
        if (existing) {
          existing.count++;
        } else {
          offenders.set(hex, { hex, count: 1, firstX: x, firstY: y });
        }
        offCount++;
      }
    }
  }

  return {
    ok: offCount === 0,
    totalPixels: width * height,
    offPalettePixels: offCount,
    offenders: Array.from(offenders.values()).sort((a, b) => b.count - a.count),
  };
}

function main(): void {
  const [pngPath, palettePath] = process.argv.slice(2);
  if (!pngPath || !palettePath) {
    console.error("Usage: tsx check-palette.ts <in.png> <palette.json>");
    process.exit(1);
  }
  const palette = loadPalette(palettePath);
  const png = PNG.sync.read(readFileSync(pngPath));
  const result = checkPalette(png, palette);

  if (result.ok) {
    console.log(
      `check-palette: OK — ${pngPath} (${String(result.totalPixels)} pixels, palette-clean)`,
    );
    return;
  }

  console.error(
    `check-palette: FAIL — ${pngPath}: ${String(result.offPalettePixels)}/${String(result.totalPixels)} off-palette pixels`,
  );
  for (const offender of result.offenders.slice(0, 25)) {
    console.error(
      `  ${offender.hex}  count=${String(offender.count)}  first@(${String(offender.firstX)},${String(offender.firstY)})`,
    );
  }
  if (result.offenders.length > 25) {
    console.error(`  ...and ${String(result.offenders.length - 25)} more distinct offenders`);
  }
  process.exit(1);
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
