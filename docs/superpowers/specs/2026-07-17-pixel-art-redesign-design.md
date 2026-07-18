# Pixel-Art Redesign — Design Spec (approved 2026-07-17)

Transform the Phase 2 narrative sample from vector graybox into the locked production art
direction: original pixel-art chamber drama on a 640×360 grid, with the _Papers, Please_
quality bar (low-res readability, tactile UI, systemic weight) and this game's own identity.
Approach B was approved: vector-source environment over the existing blockout with
deterministic reduction; characters and props authored directly in pixel space; DOM UI
reskinned as worn administrative paper. Full art pipeline, agents self-gate, no copying of
Papers, Please layout/palette/typography/assets (ART_BIBLE §2 rule stands).

## 1. Canonical constraints

- Native art resolution **640×360**. Display at exact 3× (1920×1080) and exact 2× centred
  in 1366×768. Nearest-neighbor only, `roundPixels`, whole-pixel sprite positions.
- One locked palette: `art/palette/wd-palette-v1.json`, ≤32 colors. Schema:
  `{ "version": 1, "colors": [{ "id": "amber_2", "hex": "#RRGGBB", "role": "..." }] }`.
  Every approved PNG must pass the palette checker (no off-palette pixels).
- Geometry source of truth: `art/blockout/bar_perspective.svg` and
  `art/blockout/bar_floor_plan.json|svg`. Never re-invent perspective or seat anchors.
- Runtime anchors come from `content/graybox-layout.json`; interaction logic, hotspot
  geometry, save format, and e2e tests must not change.
- No text baked into art. Signage/labels stay SVG or DOM.
- Layer stack per docs/ASSET_MANIFEST.md §1; asset IDs + sidecar JSON per ART_BIBLE §15.
- Palette mood: ART_BIBLE §9 base palette (tobacco amber, honey-brown, dull cream,
  oxidized teal, dark olive, brick red accent, CRT cyan accent, graphite/soot), pushed one
  step darker and grayer than the graybox. Not PP's gray-green; not sepia; not neon.

## 2. Environment (Approach B)

- Author layered SVGs in `art/source/env/` traced over the blockout:
  `bg_far` (walls, ceiling, rear shelves), `bg_mid` (counter rear, tables, TV housing),
  `seat_back`, `furniture_front`, `foreground` (near counter edge, optional).
- Pipeline (scripts in `scripts/art-pipeline/`): rasterize SVG at 4× (2560×1440) →
  box-downsample to 640×360 → nearest-palette map → output to `art/review_queue/`.
- **Mandatory cluster-correction pass** after reduction: fix ragged edges, orphan pixels,
  crawling dither; verticals/horizontals must be clean pixel runs. Inspect at 100% and 800%.
- Light states: early-evening base + `fx_tv_light_mask` and door-light overlay as
  engine-blended masks (photosensitivity-safe, localized).
- Room reads worn-but-maintained: mismatched repairs, aged varnish, era-mixed fixtures.

## 3. Characters (direct pixel authoring)

- Six packages: sasha, galina, arkady, lev, nikolai, gennady. Standing height ~80–92 px
  at scene scale (5.5–6 head proportions); exact metrics set by the art director from the
  blockout's depth scale.
- Authored as scripts in `art/source/char/` emitting PNG sprite sheets (pngjs or similar),
  colors referenced by palette id, never raw hex.
- Per character: design card (from ART_BIBLE C0 list) → silhouette gate (all six
  distinguishable as pure black shapes; distinct hats/shoulders/bellies/postures) →
  master sprite → poses: seated_listen, seated_talk, lean_in, lean_back, standing,
  signature, exhausted. Idle: 2-frame breathing (1 px), asynchronous blink frames only.
- **Pilot rule:** Arkady's full package must pass the identity + seating gate before the
  other five are produced.
- Seating: pelvis on seat plane, plausible knees/feet, elbows clear of tabletops; chair
  provided by `seat_back`/`furniture_front` layers, never drawn into the character.

## 4. Props & FX

Slice props only, separate anchored sprites: faceted glasses (2 sizes), tea glass/holder,
metal ashtray, Galina's stock notebook, Gennady's glass + factory photo, telephone,
television (housing in bg_mid; screen states: off, static, broadcast glow frames).
Smoke: 2–3 slow asynchronous wisp overlays, subtle. TV light mask affects nearby faces
only during bright frames.

## 5. UI reskin

- Semantic DOM stays; all a11y behavior (150% text, high contrast, reduced motion,
  keyboard focus, 44px targets) is preserved.
- Type: OFL-licensed pixel font with Cyrillic coverage, vendored into `public/fonts/` with
  license file; rendered at integer multiples. System sans remains the large-text fallback.
  If no suitable font can be obtained offline, use the fallback stack and log it.
- Chrome: worn administrative paper — hard 2px borders, no border-radius, no blur
  shadows (1-step offset print shadows), ledger ruling on summary/journal panels,
  stamped-look speaker nameplates, dull cream/dark ink from the locked palette.
- Feedback: 1px press displacement + tone shift, hard pixel focus ring, ink-inversion
  hover on choices. Layout positions (HUD top-left, dialogue lower panel, in-scene
  attention offers) unchanged.

## 6. Rendering integration

- PixiJS renders the scene into a 640×360 target scaled by integer factor to the stage;
  nearest-neighbor scale mode.
- Replace the drawing internals of `src/scene/NarrativeGrayboxProjection.ts` with a
  sprite-based scene composed from approved layers/sprites, reading the same anchors
  from `content/graybox-layout.json`. Public interface and Phase 1 route (`/?phase=1`,
  old renderer) unchanged.
- Asset loading via Pixi Assets from `public/assets/`; approved PNGs are copied there
  with stable names.

## 7. Gates & acceptance

- Flow: `art/review_queue/<asset_id>/` → reviewer runs ART_BIBLE §8 defect checklist +
  palette check + in-game/native-scale inspection → `art/approved/` with sidecar JSON.
  Max one rework loop per asset before simplifying the asset (ART_BIBLE fallback rule).
- Final package: the ten canonical shots (ART_BIBLE §14), defect log in `.logs/`,
  visual snapshots re-baselined once at the end, `corepack pnpm check` green.

## 8. Production plan (agent team)

Phases (high-effort agents for direction/review, cheaper agents for execution):

1. **Direction** (high): palette JSON, character design cards, UI style guide,
   environment layer notes → `art/direction/`.
2. **Toolkit** (parallel with 1): `scripts/art-pipeline/` — rasterize (Playwright
   chromium), reduce+palette-map, palette checker, integer-upscale preview, all runnable
   via `corepack pnpm exec tsx`.
3. **Environment**: SVG layers → pipeline → correction → review gate.
4. **Pilot character**: Arkady package → review gate.
5. **Cast + props** (parallel, low-tier agents): remaining five characters from the
   approved template; props/FX.
6. **UI reskin** (parallel with 5): fonts + CSS.
7. **Integration**: sprite scene loader, lighting overlays, wiring.
8. **QA**: canonical shots, defect fixes, snapshot re-baseline, `pnpm check`.
