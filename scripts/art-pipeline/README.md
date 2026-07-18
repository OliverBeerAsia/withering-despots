# art-pipeline

Deterministic SVG→pixel-art toolkit for the pixel-art redesign (see
`docs/superpowers/specs/2026-07-17-pixel-art-redesign-design.md` §1–2).
All scripts run via `corepack pnpm exec tsx scripts/art-pipeline/<script>.ts ...`.

## Environment pipeline (Approach B)

```
art/source/env/*.svg
  -> rasterize.ts   (render at 4x: 2560x1440)
  -> reduce.ts      (box-downsample to 640x360 + nearest-palette map)
  -> [manual cluster-correction pass]
  -> check-palette.ts (must exit 0 before review)
  -> art/review_queue/<asset_id>/
```

## Scripts

### rasterize.ts

Render an SVG to a PNG at an exact pixel size via Playwright chromium. The SVG's
`width`/`height` attributes are overwritten to the target size (viewBox untouched),
viewport is pinned to that size, `deviceScaleFactor: 1`, screenshot with
`omitBackground: true` for alpha.

```
tsx scripts/art-pipeline/rasterize.ts art/source/env/bg_far.svg tmp/bg_far_4x.png 2560 1440
```

### reduce.ts

Box-downsample a PNG by an integer factor to the canonical **640x360** and map every
pixel to the nearest color in a palette JSON (`art/palette/wd-palette-v1.json`, schema
in `palette.ts`). Factor is auto-derived from input size (must be `factor*640` by
`factor*360`) or passed explicitly. Alpha-weighted (premultiplied) averaging avoids
black fringing from transparent source pixels; a block is fully transparent if summed
alpha is 0, otherwise alpha snaps to 0/255 at a 50% threshold.

```
tsx scripts/art-pipeline/reduce.ts tmp/bg_far_4x.png tmp/bg_far_640x360.png art/palette/wd-palette-v1.json
```

### check-palette.ts

Verify a PNG contains only palette colors (or fully transparent pixels). Exits nonzero
and lists offending colors (hex + count + first coordinate) if any pixel is off-palette
or has partial alpha (which should never survive `reduce.ts`).

```
tsx scripts/art-pipeline/check-palette.ts tmp/bg_far_640x360.png art/palette/wd-palette-v1.json
```

### preview.ts

Nearest-neighbor integer upscale of a PNG by N, for inspecting native-resolution art at
a readable size (spec requires inspection at 100% and 800%).

```
tsx scripts/art-pipeline/preview.ts tmp/bg_far_640x360.png tmp/bg_far_preview_8x.png 8
```

### sprite.ts

Library (not a CLI) for character/prop artists authoring directly in pixel space
(`art/source/char/*.ts`). `SpriteCanvas` is an indexed pixel grid addressed by palette
id — never raw hex — with `setPixel`, `rect(x,y,w,h,id,{fill})`, `line`, `floodFill`,
and `writePNG`.

```ts
import { SpriteCanvas } from "../../scripts/art-pipeline/sprite.ts";
import { loadPalette } from "../../scripts/art-pipeline/palette.ts";

const palette = loadPalette("art/palette/wd-palette-v1.json");
const canvas = new SpriteCanvas(32, 92, palette);
canvas.rect(10, 10, 12, 20, "honey_brown_1");
canvas.writePNG("art/source/char/arkady_master.png");
```

### palette.ts

Shared schema + utilities (not a CLI): `loadPalette`, `hexToRgb`, `rgbToHex`,
`nearestPaletteColor`, `paletteColorMap`. Palette schema:

```json
{ "version": 1, "colors": [{ "id": "amber_2", "hex": "#RRGGBB", "role": "..." }] }
```

Warns (does not fail) if a palette exceeds 32 colors — the spec's hard cap is enforced
by review, not by the toolkit.

## Notes

- All scripts are strict-TypeScript clean under the repo's `tsconfig.json`
  (`corepack pnpm typecheck` covers `scripts/**/*.ts`).
- No dependency on `art/palette/wd-palette-v1.json` existing yet; every script takes a
  palette path argument. Verified during build with a temporary 8-color test palette.
- Do not use these scripts to touch `src/` or `content/` — output only to
  `art/review_queue/`, `art/approved/`, or `public/assets/` per the spec's gate flow.
