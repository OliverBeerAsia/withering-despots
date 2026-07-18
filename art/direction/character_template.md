# Character authoring template (pilot: arkady)

Authority: the approved pilot script `art/source/char/arkady.ts`. Copy its structure
exactly for every other character; only maps, metrics, and pose parameters change.
Read your design card in `art/direction/character_cards/<id>.md` first — all numbers
below have card-specific overrides there.

## Script structure (copy this order)

1. **Imports**: `SpriteCanvas` from `scripts/art-pipeline/sprite.ts`, `loadPalette`
   from `scripts/art-pipeline/palette.ts`. Palette ids only, never hex.
2. **Constants**: frame + palette role constants (named for the card's roles:
   `SUIT_LIT`, `SKIN_SHD`, ...). Change ids per card, keep the names.
3. **Helpers** (copy verbatim): `blit` (ASCII pixel maps), `span`, `limb`,
   `inlineOutline`, `layer`, `toSilhouette`.
4. **Head**: one explicit ASCII map (`HEAD_BASE`, ~11w x 15h) **including its own
   `o` outline** — the head is the identity asset, never auto-outlined. Expression
   variants are detail stamps (`headDetails`), never a second map.
5. **Torso / legs / arms**: procedural fills, auto-outlined per layer.
6. **Poses**: one `drawPose(canvas, pose)` assembling layers back-to-front.
7. **Output**: per-pose PNGs, sheet, silhouette, all to `art/review_queue/char/`.

## Frame & anchors (locked — same for all six characters)

- Frame **48x96** per pose; sheet stride 48, frame order:
  `seated_listen, seated_listen_breath, seated_listen_blink, seated_talk,
lean_in, lean_back, standing, signature, exhausted` (9 frames).
- `FOOT_Y = 93` — last shoe row (scene foot line).
- `SEAT_Y = 69` — pelvis bottom row = seat plane (24 px above foot line,
  environment_notes.md §Scale). Seated pelvis rows MUST end on this row.
- Standing crown `y = 93 - standing_height + 1` (arkady: 4 for 90 px).
- Seated crown `y = 93 - seated_crown_to_floor + 1` (arkady: 26 for 68 px).
- Tabletop plane = y54 (39 px), seated elbow rest ≈ y51 (42 px), knee at seat
  height (y64-69 thigh, knee front at x≈13 when facing left).
- Standing center x=24; seated torso center `CX=26`, facing LEFT (toward table).
  Head placed 2-3 px forward (left) of chest line per posture card.
- Runtime anchor (sidecar): `{x: seated torso center, y: 93}`.

## Layer order (seated)

`far forearm -> far leg -> near leg -> torso -> neck+head -> near forearm`.
Each layer is drawn in fills on its own canvas, `inlineOutline()` turns its edge
pixels to `soot_0`, then it is composited. Overlaps therefore self-separate with
1 px ink — this is what keeps limbs readable against the torso.

**Seated arms are forearm-only** (elbow emerges at the jacket's front edge ~CX-5,
y≈57): the upper arm stays inside the pressed-jacket plane. Only poses that lift
an arm clear of the torso (arkady's signature finger) draw shoulder+upper arm.

## Shading conventions

- Light source: pendant above the table, upper-LEFT. Split every mass at
  `cx+1`: lit id left, shade id right. One value step only — plane shading,
  no gradients, no dither.
- Outline: `soot_0` everywhere at silhouette edge (auto), plus hand-placed `o`
  in the head map. Interior part boundaries come from layer outlines, not extra
  lines.
- Folds: `*_FOLD` (one step darker than shade) used ONLY where the card allows —
  arkady is pressed cloth: a single closure line below the tie. Slouchier
  characters may add 2-3 short fold ticks; never texture.
- Skin: base `flesh_1`, shadow planes `flesh_0`, `flesh_2` highlights 1-2 px max
  (forehead/nose). Aged/pale faces cool their shadow edges with `soot_3` per card.
  **The card's Identity section owns the plane ratio** — arkady (palest of cast)
  INVERTS the default: `flesh_0` is the dominant face/hand/neck plane, `flesh_1`
  only a narrow lit strip on the front profile edge, `soot_3` edge column toward
  hair/ear/jaw. Verify by counting head-region pixels per plane before submitting.
- Detail stamps (eyes, brow, mouth, tie, cuffs, shoe glint) go AFTER compositing
  so they always sit on top. Eyes open = `soot_0`; blink/hooded = `flesh_0` —
  EXCEPT on flesh_0-dominant faces (arkady), where lids are `soot_3` so they
  don't vanish against the base plane.

## Poses & idle

- 7 canonical poses + 2 idle variants of `seated_listen`:
  - `_breath`: torso top and head shifted up exactly 1 px (pelvis/legs static).
  - `_blink`: identical geometry, lid pixels only. Engine plays blinks
    asynchronously; never bake a rhythm.
- `lean_in` = shoulders -3 px x, eased to 0 at pelvis (`lean` param); head +lean.
  `lean_back` = +2 px. `exhausted` = shoulders +1 px down, head bowed (+3 y,
  forward), hooded lids, jacket may open ONLY if the card scripts it.
- Hands: 3x2 resting block / 2x3 hanging block + 1 px cream cuff. No fingers
  except scripted gestures (1 px column).

## Deliverables per character

- `art/review_queue/char/char_<id>_pose_<pose>_v001.png` (9 files)
- `char_<id>_sheet_v001.png` + `char_<id>_sheet_v001.json` (schema: see
  arkady's — includes `frame`, `frames`, `metrics`, anchor at foot line)
- Rework loops bump the suffix (`v002`, ...) on ALL outputs via the script's
  `VERSION` constant; mark the old sidecars `"status": "superseded_by_v00N"`.
- `char_<id>_silhouette_v001.png` (+ json): standing + seated_listen frames run
  through `toSilhouette`. Check YOUR dominant silhouette feature against the
  card and against the other approved silhouettes before submitting.

## Self-gate workflow (mandatory, per pose)

write -> `corepack pnpm exec tsx art/source/char/<id>.ts` -> preview 8x
(`scripts/art-pipeline/preview.ts`) -> Read + critique against ART_BIBLE §8
people checklist -> fix -> repeat. Also inspect a 16x head crop and a 3x
(game-scale) frame before writing sidecars. Finish with
`scripts/art-pipeline/check-palette.ts` on every PNG — all must be palette-clean.
