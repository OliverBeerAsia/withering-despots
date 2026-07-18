# Pixel-art redesign — finisher pass (2026-07-17)

Scope: QA defect fixes on the Phase 2 pixel-art redesign, snapshot re-baseline,
`corepack pnpm check` green, final canonical shot package.

## Defects fixed

### P0

- **Arkady levitating over table A (seat-01).** North seats project the sitter's
  knees/feet above the tabletop's far rim in this camera. Moved Arkady to the
  table A east chair (`anchor-seat-02`) and Lev (same latent defect at table B)
  to `anchor-seat-06` in `src/scene/PixelBarScene.ts` `characterPlacements()`.
  Unoccupied north chairs (tables A/B/D/E) are now drawn pushed-in
  (`art/source/env/seat_back.svg`): seat bar tucked behind the tabletop far rim,
  no floating legs. Smoke no longer intersects any figure.
- **Bar counter read as a ramp.** Reworked counter in
  `art/source/env/bg_mid.svg` + matching occluder in `furniture_front.svg`,
  keeping the blockout footprint (rear top edge 95,163-245,168 preserves the
  staff waist-cut; floor line 72,280-255,272 unchanged): taller constant-height
  panelled front face with under-lip shadow and left end seam, grain seams along
  the top, and clutter (2 beer taps, drying glasses, folded rag, service tray,
  ring marks). Stools rebuilt at bar height (~42px seat) so they hold scale.
- **'fi' ligature corruption ("Arst").** Pixelify Sans variable TTF ships a
  broken fi/ffi glyph. Added `font-variant-ligatures: none` +
  `font-feature-settings: "liga" 0, "clig" 0` at `:root` in
  `src/styles/main.css`. "Read the room first." now renders correctly.
- **Nikolai split by a furniture post.** The seat-08 (405,200) chair front legs
  lived in `furniture_front` and painted over Nikolai (seat-09, nearer). Moved
  that chair's front part into `seat_back` (`chair_front_empty` group) so nearer
  figures paint over it. Coat rework in `art/source/char/nikolai.ts` (v002):
  near leg now layered over the coat (lap/leg break with auto-outline), closure
  line stops above the lap, hem shadow + side vent added, boots got heels.

### P1

- **Attention cards.** Rebuilt as small worn-paper tags sized to their text
  (max-width 11rem, min 44px targets kept), offset beside their subjects with a
  hard pixel pointer arm (`::after` clip-path triangle) aimed at TV / Arkady /
  Galina; inset paper-mid edge-wear per ui_style_guide. `src/styles/main.css`
  (`.narrative-attention-offer`, `.attention-target-*`). No subject is occluded.
- **TV event lighting invisible.** `fx_tv_light_mask` (v002,
  `art/source/props/fx.ts`) is now a solid stepped beam: rim glow around the
  housing, cone from the aperture toward table B, light pool on table B's top —
  no dither. `PixelBarScene` adds a steady soot_0 ambient dim (alpha 0.32,
  `eventDim`) while the attention window is open and keeps the mask on for the
  whole event (alpha 0.75/0.55 bright/dim frames, steady under reduced motion).
  State reads instantly; photosensitivity-safe (no strobe).
- **Particle noise.** The cyan "confetti" was the old dithered TV halo; the teal
  dashed stream was the old door overlay. Both rebuilt as coherent solid shapes
  (door: bright glass seam + clean floor wedge, teal_0/teal_1/cyan; composited
  at alpha 0.7). No stray single pixels remain.
- **Galina/Sasha necks.** `galina.ts`/`sasha.ts` (v002): necks widened one
  column, standing head-forward offset reduced 2px -> 1px. Head now sits on the
  neck, no stalk/kink.
- **Lev's cyan eyes.** `lev.ts` (v002): glasses lens id `cyan_0` -> `soot_1`
  (cyan is CRT-reserved). Dark-glass read preserved.

### P2

- **Dialogue panel.** Tightened: max-height 46% -> 40%, padding/choice
  gaps/nameplate margins reduced. The seated table row stays visible during
  dialogue (verified in opening shot).
- **Wall clock.** Redrawn as octagon polygons in `bg_far.svg` — reduces to a
  crisp hard-edged pixel ring (SVG circles dithered through the 4x reduce).
- **Table pedestals.** Unified across all five tables in `bg_mid.svg`: short
  tapered column (+lit left edge, dark right edge) + 2-3px base plate; heights
  cut (e.g. C/E 55px -> 31px) so tabletops sit at seated-hand height. Floor
  shadows in `bg_far.svg` moved/shrunk to match. Table D keeps 2 wire repairs.
- **Smoke.** `fx_smoke_wisp_0*` (v002): chains of solid 2-3px puffs on an
  S-curve instead of 1px dither; 3-frame drift preserved.
- **Recapture QA.** Sasha/Galina (and all patron) close crops recaptured
  centered with full heads; phone-shelf brackets extended/grounded in
  `bg_mid.svg` (the "detached bracket" cluster).

## Assets shipped (all palette-clean via check-palette.ts)

- `public/assets/env/{bg_far,bg_mid,seat_back,furniture_front}.png` — rebuilt
  via rasterize(2560x1440) -> reduce(640x360) pipeline; v002 PNGs + sidecars in
  `art/review_queue/env/` and `art/approved/env/`.
- `public/assets/char/{galina,sasha,lev,nikolai}.png` — v002 sheets (+ poses,
  silhouettes, sidecars in `art/review_queue/char/`). Arkady/Gennady pixels
  unchanged.
- `public/assets/fx/{tv_light_mask,door_light_overlay,smoke_wisp_01..03}.png` —
  v002 (review copies in `art/review_queue/props/`).

## Code changed

- `src/scene/PixelBarScene.ts` — seat-02/seat-06 placements, `eventDim`
  overlay, tvLight/doorLight alpha + steady event visibility.
- `src/styles/main.css` — ligature kill, attention tags, dialogue tightening.
- `art/source/env/*.svg`, `art/source/char/{galina,sasha,lev,nikolai}.ts`,
  `art/source/props/fx.ts` — as above.

## Verification

- `corepack pnpm check` green end-to-end (format, lint, typecheck, unit,
  content, simulation, build, e2e, visual). Prettier failures were repo-wide
  pre-existing; fixed with `prettier --write` (formatting only).
- Visual snapshots re-baselined once (`test:visual --update-snapshots`),
  12/12 pass. No test logic weakened; no assertions changed.
- Final canonical shots in `tests/screenshots/redesign/final/`: opening-room
  (1920+1366), keyboard-focus, empty-room-clean, attention-window,
  tv-event-lighting, dialogue-longest-line, summary-screen, six centered patron
  close crops.

## Open defects deferred

- Counter top is still a wide slanted plane (blockout geometry); clutter,
  paneling and the tall front face fix the read, but a true re-projection of the
  counter would need a new blockout — out of scope for this pass.
- North-seat chair pattern remains geometrically awkward for OCCUPIED seats;
  only Nikolai still uses one (seat-09) and reads acceptably. If a future pass
  moves him, seat-10/seat-11 are free.
- "Listen to Arkady" tag pointer aims slightly above Arkady's head at 1920;
  cosmetic, within a tag-width of the subject.
- Attention-offer hit targets shrank to text size (min 44px kept); if design
  wants larger click zones over subjects, add transparent padding rather than
  reverting the card size.
- Table D pedestal keeps its wire-repair rings; at a glance it can still read
  slightly segmented (intentional wear per environment notes).
