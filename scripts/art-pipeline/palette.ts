// Shared palette schema + color utilities for the pixel-art pipeline.
// Schema (spec section 1):
// { "version": 1, "colors": [{ "id": "amber_2", "hex": "#RRGGBB", "role": "..." }] }

import { readFileSync } from "node:fs";

export interface PaletteColor {
  id: string;
  hex: string;
  role?: string;
}

export interface Palette {
  version: number;
  colors: PaletteColor[];
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function loadPalette(path: string): Palette {
  const raw = readFileSync(path, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`Palette at ${path} is not an object`);
  }
  const obj = parsed as Record<string, unknown>;
  if (typeof obj["version"] !== "number") {
    throw new Error(`Palette at ${path} missing numeric "version"`);
  }
  if (!Array.isArray(obj["colors"])) {
    throw new Error(`Palette at ${path} missing "colors" array`);
  }
  const colors: PaletteColor[] = obj["colors"].map((entry, i) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Palette color at index ${String(i)} is not an object`);
    }
    const c = entry as Record<string, unknown>;
    if (typeof c["id"] !== "string" || typeof c["hex"] !== "string") {
      throw new Error(`Palette color at index ${String(i)} missing "id" or "hex"`);
    }
    const color: PaletteColor = { id: c["id"], hex: normalizeHex(c["hex"]) };
    if (typeof c["role"] === "string") {
      color.role = c["role"];
    }
    return color;
  });
  if (colors.length === 0) {
    throw new Error(`Palette at ${path} has zero colors`);
  }
  if (colors.length > 32) {
    console.warn(
      `Warning: palette at ${path} has ${String(colors.length)} colors (spec locks palette to <=32).`,
    );
  }
  return { version: obj["version"], colors };
}

export function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return withHash.toLowerCase();
}

export function hexToRgb(hex: string): RGB {
  const h = normalizeHex(hex);
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (v: number): string =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/** Squared Euclidean distance in RGB space (cheap, monotonic with distance). */
function distSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * Find the nearest palette color to an RGB triple by Euclidean distance.
 * Throws if the palette is empty (loadPalette already guards this).
 */
export function nearestPaletteColor(rgb: RGB, palette: Palette): PaletteColor {
  let best: PaletteColor | undefined;
  let bestDist = Infinity;
  for (const color of palette.colors) {
    const d = distSq(rgb, hexToRgb(color.hex));
    if (d < bestDist) {
      bestDist = d;
      best = color;
    }
  }
  if (!best) {
    throw new Error("nearestPaletteColor: palette has no colors");
  }
  return best;
}

export function paletteColorMap(palette: Palette): Map<string, string> {
  const map = new Map<string, string>();
  for (const color of palette.colors) {
    map.set(color.id, color.hex);
  }
  return map;
}
