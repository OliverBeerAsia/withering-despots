# Long pauses and inhabited room (2026-07-18)

## Objective

Add varied 10 to 60 second pauses, more patron interaction, and restrained ambient sound and motion without changing the existing room, systems, cast, or outcome.

## Visual problem

Make long quiet beats feel inhabited without turning the room into constant generic animation.

## Decisions

- Recorded the bounded design in `docs/superpowers/specs/2026-07-18-long-pauses-ambience-design.md`.
- Long holds remain presentation-only and fully skippable.
- A visible Continue control will make a minute-long beat player-controlled.
- Pause and hidden-tab state must freeze remaining presentation time.
- Added a separate Full, Brief, and Immediate pacing preference rather than coupling reading pace to reduced motion.
- Kept all motion on whole native pixels and inside existing character sheets and prop sprites.
- Required sparse deterministic room audio rather than random or constant foley.
- Kept significant audio caption-ready and required the receiver relay click to reach the semantic caption surface.

## Team review

- Pacing design audited the existing 8 second cap and supplied an exact 10 to 60 second node map.
- Narrative design added eight patron exchanges without changing clock cost, attention, claims, or endings.
- Visual implementation replaced near-constant breathing with long stillness cycles, asynchronous blinks, rare posture settles, and rare glass nudges.
- Audio implementation added deterministic ventilation and refrigeration bed plus sparse glass, chair, and relay cues.
- Historical review added primary-supported ventilation, conditional refrigeration, furniture, and blown-glass ledger rows.
- QA review identified pause-menu and hidden-tab timer consumption as the main blocker before long holds can ship.

## Historical constraints

- Ventilation is a quiet service-zone bed, not a loud fan in the room.
- Refrigeration remains a restrained plausible composite without an exact model or placement claim.
- Chair and glass cues are sparse and socially motivated.
- Telephone cadence and behind-counter arrangement remain provisional.
- Television and radio/music remain distinct sources.

## Implementation

- Added 34 authored presentation holds from 10 to 60 seconds.
- Added Full, Brief, and Immediate dialogue-pacing preferences.
- Added a visible Continue control and preserved panel click, Space, and Enter skipping.
- Added a deterministic presentation timer that freezes under Pause and a hidden document.
- Added eight patron exchanges across Galina, Lev, Nikolai, Arkady, and Gennady.
- Replaced frequent shared idle motion with character-specific stillness, asynchronous blinks, rare one-frame posture settles, and two rare whole-pixel glass nudges.
- Added synthesized ventilation and refrigeration with deterministic glass, chair, and telephone-relay cues.
- Added separate room-ambience and low-effects settings and a semantic caption for the significant relay click.
- Added four historical-ledger entries for ventilation, conditional refrigeration, furniture, and blown glassware.
- No new raster art, generated image, prompt run, camera, room geometry, palette, location, verb, meter, inventory, or historical branch was introduced.

## Commands and evidence

- `corepack pnpm format:check`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: 65 passed.
- `corepack pnpm test:content`: 18 passed.
- `corepack pnpm test:simulation`: 12 passed.
- `corepack pnpm build`: pass.
- Focused Phase 2 browser run: 7 passed.
- Canonical snapshot update: 18 passed; added `post-report-held` at 1920 by 1080 and 1366 by 768.
- Final pair 1: 28 browser tests and 18 visual comparisons passed.
- Final pair 2: 28 browser tests and 18 visual comparisons passed.
- Final pair 3: 28 browser tests and 18 visual comparisons passed.
- Inspected the new held state and opening state at original resolution in both canonical viewports.

## Visual defect table

| Region            | Category      |                          Severity | Violated invariant                                     | Observation                                                                            | Smallest correction                                            | Owner layer    |
| ----------------- | ------------- | --------------------------------: | ------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------- |
| Held dialogue     | Composition   |                  pass-observation | Quiet time remains player-controlled                   | The room remains dominant and Continue is clear without resembling a countdown.        | None.                                                          | UI             |
| Seated patrons    | Motion        |                         corrected | Stillness outweighs nonessential motion                | The earlier shared breathing loop made the room mechanically busy.                     | Use character-specific 16 to 58 second schedules.              | Scene          |
| Table props       | Motion        |                  pass-observation | Motion stays on whole pixels and returns to anchors    | Two glasses nudge rarely and reset exactly.                                            | None.                                                          | Scene          |
| Reduced motion    | Accessibility |                  pass-observation | Nonessential movement must freeze                      | Canonical captures remain stable and pure selectors return neutral frames and offsets. | None.                                                          | Scene and UI   |
| Sound caption     | Readability   |                  pass-observation | Significant off-screen audio is available semantically | Telephone relay metadata reaches a restrained status caption.                          | None.                                                          | Audio and UI   |
| Wider art package | Governance    | high, open outside this objective | Production art needs complete approval history         | Existing review-queue assets remain outside full production approval.                  | Continue package-by-package review in the later art milestone. | Art production |

## Touched inventory

The checkout has no Git metadata, so this is the explicit task inventory.

- `.logs/2026-07-18-long-pauses-ambience.md`
- `README.md`
- `content/phase-2-sample.json`
- `content/schemas/phase-2-sample.schema.json`
- `docs/ASSET_MANIFEST.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/superpowers/specs/2026-07-18-long-pauses-ambience-design.md`
- `research/HISTORICAL_LEDGER.csv`
- `research/source_notes/2026-07-18_atmosphere-pass.md`
- `src/app/bootstrap.ts`
- `src/audio/RoomAmbience.ts`
- `src/narrative/types.ts`
- `src/scene/PixelBarScene.ts`
- `src/styles/main.css`
- `src/ui/NarrativeOverlay.ts`
- `src/ui/PresentationBeat.ts`
- `tests/content/PhaseTwoContent.test.ts`
- `tests/e2e/phase-two.narrative.spec.ts`
- `tests/simulation/PhaseTwoNarrativeSimulation.test.ts`
- `tests/unit/NarrativePacing.test.ts`
- `tests/unit/PixelBarScenePresentation.test.ts`
- `tests/unit/RoomAmbience.test.ts`
- `tests/visual/phase-two.visual.spec.ts`
- `tests/visual/snapshots/PHASE_2_REVIEW.md`
- Ten Phase 2 snapshot PNGs: opening dialogue, opening maintenance, attention window, post-report quiet, and post-report held at both canonical viewports.

## Gate status

Runtime and bounded visual-gate result: `PASS`.

Open compromises remain outside this objective: the wider review-queue art package is not production-approved, the telephone placement and relay behavior remain plausible composites, and the exact refrigerator placement and audibility remain unverified.
