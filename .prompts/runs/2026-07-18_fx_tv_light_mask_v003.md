# FX prompt and provenance: `fx_tv_light_mask_v003`

Date: 2026-07-18

## Single visual problem

Replace the theatrical CRT projector cone with local reflected television light while preserving the approved room geometry and palette.

## Canonical inputs

- `art/blockout/bar_perspective.svg`: immutable room geometry and TV/table placement.
- `art/source/env/bg_mid.svg`: TV housing aperture and table B surface.
- `art/direction/environment_notes.md`: local CRT-light rule.
- `art/palette/wd-palette-v1.json`: only permitted output colors.
- `art/review_queue/props/fx_tv_light_mask_v002.png`: rejected production candidate; projector-cone shape must not be retained.

## Deterministic construction request

Create one 640 by 360 transparent pixel-art light mask. Keep three disconnected responses only:

1. a one-pixel `cyan_0` rim around the existing TV housing;
2. a shallow stepped `cyan_0` and sparing `cyan_1` wall bounce directly below the set;
3. a small `cyan_0` reflected crescent on table B, left of Lev's seat anchor.

Do not create a beam or cone between the television and table. Do not dim or tint the whole room. Do not touch faces, furniture geometry, signage, or character pixels. Do not add bloom, blur, haze, grain, dither, pseudo-text, or off-palette pixels.

## Reproduction

Run:

```sh
corepack pnpm exec tsx art/source/props/fx.ts
```

The generator writes `art/review_queue/props/fx_tv_light_mask_v003.png`. It remains a review asset until integrated screenshots pass the visual gate.
