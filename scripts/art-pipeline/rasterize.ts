// Rasterize an SVG file to a PNG at an exact pixel size, deterministically,
// via Playwright chromium (no browser AA surprises from CSS scaling).
//
// Usage:
//   corepack pnpm exec tsx scripts/art-pipeline/rasterize.ts <in.svg> <out.png> <width> <height>
//
// The SVG's own width/height attributes are overwritten to the requested pixel
// size (viewBox is left untouched so content scales), the page viewport is set
// to exactly that size, deviceScaleFactor is pinned to 1, and the screenshot is
// taken with a transparent background so alpha is preserved.

import { readFileSync } from "node:fs";
import { chromium } from "playwright";

export interface RasterizeOptions {
  svgPath: string;
  outPath: string;
  width: number;
  height: number;
}

export async function rasterize(opts: RasterizeOptions): Promise<void> {
  const { svgPath, outPath, width, height } = opts;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(
      `rasterize: width/height must be positive integers, got ${String(width)}x${String(height)}`,
    );
  }
  const svgSource = readFileSync(svgPath, "utf-8");
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  svg { display: block; }
</style>
</head>
<body>${svgSource}</body>
</html>`;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(
      ({ w, h }: { w: number; h: number }) => {
        const svg = document.querySelector("svg");
        if (!svg) {
          throw new Error("rasterize: no <svg> element found in source file");
        }
        svg.setAttribute("width", String(w));
        svg.setAttribute("height", String(h));
      },
      { w: width, h: height },
    );
    await page.screenshot({ path: outPath, omitBackground: true });
    await page.close();
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const [svgPath, outPath, widthStr, heightStr] = process.argv.slice(2);
  if (!svgPath || !outPath || !widthStr || !heightStr) {
    console.error("Usage: tsx rasterize.ts <in.svg> <out.png> <width> <height>");
    process.exit(1);
  }
  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);
  await rasterize({ svgPath, outPath, width, height });
  console.log(`rasterize: wrote ${outPath} (${String(width)}x${String(height)})`);
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
