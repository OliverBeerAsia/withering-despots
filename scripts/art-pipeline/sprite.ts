// Indexed pixel-canvas helper library for character/prop artists.
// Pixels are addressed by palette id (never raw hex) so authored art always
// stays on-palette by construction. Import SpriteCanvas from artist scripts
// in art/source/char/ etc.
//
// Example:
//   const canvas = new SpriteCanvas(32, 48, palette);
//   canvas.rect(4, 4, 8, 8, "amber_2");
//   canvas.line(0, 0, 31, 47, "graphite_1");
//   canvas.floodFill(10, 10, "dull_cream_1");
//   canvas.writePNG("art/source/char/arkady_master.png");

import { writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import { hexToRgb, paletteColorMap, type Palette } from "./palette.ts";

export interface RectOptions {
  fill?: boolean; // default true; false draws a 1px outline only
}

export class SpriteCanvas {
  readonly width: number;
  readonly height: number;
  private readonly palette: Palette;
  private readonly colorMap: Map<string, string>;
  /** null = transparent pixel; otherwise a palette id. */
  private readonly grid: (string | null)[];

  constructor(width: number, height: number, palette: Palette) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error(`SpriteCanvas: invalid dimensions ${String(width)}x${String(height)}`);
    }
    this.width = width;
    this.height = height;
    this.palette = palette;
    this.colorMap = paletteColorMap(palette);
    this.grid = new Array<string | null>(width * height).fill(null);
  }

  /** The palette this canvas was constructed with. */
  getPalette(): Palette {
    return this.palette;
  }

  private assertPaletteId(id: string): void {
    if (!this.colorMap.has(id)) {
      throw new Error(`SpriteCanvas: unknown palette id "${id}"`);
    }
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  private index(x: number, y: number): number {
    return y * this.width + x;
  }

  setPixel(x: number, y: number, paletteId: string | null): void {
    if (!this.inBounds(x, y)) return; // silently clip, consistent with rect/line drawing off-canvas
    if (paletteId !== null) this.assertPaletteId(paletteId);
    this.grid[this.index(x, y)] = paletteId;
  }

  getPixel(x: number, y: number): string | null {
    if (!this.inBounds(x, y)) return null;
    const v = this.grid[this.index(x, y)];
    return v === undefined ? null : v;
  }

  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    paletteId: string,
    options: RectOptions = {},
  ): void {
    this.assertPaletteId(paletteId);
    const fill = options.fill ?? true;
    if (fill) {
      for (let py = y; py < y + h; py++) {
        for (let px = x; px < x + w; px++) {
          this.setPixel(px, py, paletteId);
        }
      }
    } else {
      this.line(x, y, x + w - 1, y, paletteId);
      this.line(x, y + h - 1, x + w - 1, y + h - 1, paletteId);
      this.line(x, y, x, y + h - 1, paletteId);
      this.line(x + w - 1, y, x + w - 1, y + h - 1, paletteId);
    }
  }

  /** Bresenham line, inclusive of both endpoints. */
  line(x0: number, y0: number, x1: number, y1: number, paletteId: string): void {
    this.assertPaletteId(paletteId);
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;

    for (;;) {
      this.setPixel(x, y, paletteId);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /** 4-directional flood fill starting at (x,y), replacing contiguous matching pixels. */
  floodFill(x: number, y: number, paletteId: string): void {
    this.assertPaletteId(paletteId);
    if (!this.inBounds(x, y)) return;
    const target = this.getPixel(x, y);
    if (target === paletteId) return;

    const stack: Array<[number, number]> = [[x, y]];
    while (stack.length > 0) {
      const next = stack.pop();
      if (!next) break;
      const [px, py] = next;
      if (!this.inBounds(px, py)) continue;
      if (this.getPixel(px, py) !== target) continue;
      this.setPixel(px, py, paletteId);
      stack.push([px + 1, py]);
      stack.push([px - 1, py]);
      stack.push([px, py + 1]);
      stack.push([px, py - 1]);
    }
  }

  clear(): void {
    this.grid.fill(null);
  }

  toPNG(): PNG {
    const png = new PNG({ width: this.width, height: this.height });
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const id = this.grid[this.index(x, y)];
        const outIdx = (this.width * y + x) << 2;
        if (id === null || id === undefined) {
          png.data[outIdx] = 0;
          png.data[outIdx + 1] = 0;
          png.data[outIdx + 2] = 0;
          png.data[outIdx + 3] = 0;
          continue;
        }
        const hex = this.colorMap.get(id);
        if (!hex) throw new Error(`SpriteCanvas: palette id "${id}" not found at write time`);
        const rgb = hexToRgb(hex);
        png.data[outIdx] = rgb.r;
        png.data[outIdx + 1] = rgb.g;
        png.data[outIdx + 2] = rgb.b;
        png.data[outIdx + 3] = 255;
      }
    }
    return png;
  }

  writePNG(path: string): void {
    writeFileSync(path, PNG.sync.write(this.toPNG()));
  }
}
