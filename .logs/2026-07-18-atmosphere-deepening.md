# Atmosphere deepening (2026-07-18)

## Objective

Slow and deepen the current Phase 2 sample through authored room activity, persistent television and music state, restrained visual atmosphere, and existing poses and props. Preserve the current composition, five verbs, cast, and historical outcome.

## Decisions

- Recorded the bounded implementation spec in `docs/superpowers/specs/2026-07-18-atmosphere-deepening-design.md`.
- Kept the approved v002 environment, fixed camera, native grid, palette, and room geometry unchanged.
- Rejected a new free-roam mode, new location, new verbs, inventory play, drink crafting, and broad decorative repainting for this pass.
- Replaced the design goal of uniform longer UI delay with node-authored skippable rhythm and practical room intervals.
- Marked the randomized folk-standard playlist for replacement with deterministic original diegetic cues.
- Required television state to persist independently from attention outcome.

## Baseline commands and results

- Required project bibles and the repository visual-gate skill read.
- Current approved art, review-queue assets, source art, sidecars, canonical captures, content, scene, UI, audio, and test suite audited.
- `corepack pnpm check`: formatting, lint, type checking, 36 unit tests, 15 content tests, 11 simulation tests, and build passed. The browser stage could not start because the already-open game occupied port 4173.
- After stopping the user-facing server, `corepack pnpm test:e2e`: 22 passed.
- `corepack pnpm test:visual`: 8 passed and 4 pre-existing font-metric baseline comparisons failed. Failures were the opening-dialogue and fragment-wording captures at both 1920 by 1080 and 1366 by 768. This matches the unresolved defect already recorded in `.logs/2026-07-17-session-handoff.md`.

## Screenshots reviewed

- Opening room at 1920 by 1080 and 1366 by 768.
- TV event lighting at 1920 by 1080.
- Attention window, summary, longest-line, keyboard-focus, and six character close crops from the redesign package.
- The saved attention and summary manual captures are unstyled and invalid as final visual evidence.

## Baseline defects

- TV event light reads as a projector cone and uses a full-room dim, contrary to local CRT-light direction.
- TV state is hardcoded to the attention window and missed outcome.
- In-game reduced motion does not control Pixi TV flicker, smoke, or character idles.
- Smoke cycles too quickly and regularly for the intended room rhythm.
- Existing lean-in, lean-back, and signature character frames are unused.
- Audio uses unseeded random playlist order and generic folk standards.
- Implementation status and Phase 2 visual review documents describe an older graybox/no-audio state.
- The checkout has no `.git` metadata, so touched-set proof must use an explicit file inventory rather than Git diff.

## Research conclusions

- Slow the room through changed objects, posture, sound, light, and availability, not empty waiting.
- Use original diegetic music sparsely, leave deliberate ambience-only intervals, and reserve `Swan Lake` for a specific ledgered event.
- Historically defensible activity includes counter checks, receipts, ashtrays on request, telephone access, stock notes, glass handling, radio/TV comparison, and controlled cleaning intervals.

## Implementation completed

- Extended the deterministic sample from 19:25 to 19:45.
- Added 12 provisional room nodes and 13 practical choices across all five existing verbs.
- Added opening maintenance, signal and service, and post-report quiet intervals.
- Added authored skippable holds from 2.4 to 6.5 seconds without changing the authoritative clock or save state.
- Added durable television, television-volume, radio-music, and tea states.
- Replaced the randomized standards playlist with three original 71 to 75 second cues in fixed order and deterministic receiver hiss.
- Added scene-controlled `instrumental_low`, `lowered`, and `silent` music modes.
- Added audio pause and resume, preserved the player's enable setting separately from scene silence, and prevented duplicate playback loops.
- Removed the full-room TV dim and projector cone. Integrated the v003 local CRT mask from the review queue.
- Reused existing lean, signature, and exhausted character frames conservatively.
- Slowed smoke cadence and wired the in-game reduced-motion setting to Pixi TV, smoke, and character motion.
- Added source-backed and conservatively marked atmosphere entries to the historical ledger.

## Final visual review

- Inspected opening dialogue, opening maintenance, bulletin attention, post-report quiet, fragment-safe wording, and public summary at 1920 by 1080 and 1366 by 768.
- Rejected the v002 projector-cone CRT mask. The v003 mask reads as local housing, wall, and table response without a connecting beam.
- The first 1366 by 768 maintenance and quiet captures scrolled the speaker plate and room line away when the fourth choice held focus.
- Corrected the 2x compact panel height and choice spacing. The final captures retain the speaker, line, four actions, room, and television together.
- The fixed room, perspective, palette, character anchors, and five-verb interface remain unchanged.
- Integrated runtime visual result: `PASS` for this atmosphere proof.
- The v003 source asset remains `review` pending the project's human promotion checkpoint. The wider historical character and prop approval backlog is not claimed complete.

## Final verification

- `corepack pnpm format:check`: passed.
- `corepack pnpm lint`: passed.
- `corepack pnpm typecheck`: passed.
- `corepack pnpm test`: 53 passed.
- `corepack pnpm test:content`: 17 passed.
- `corepack pnpm test:simulation`: 12 passed, including 500 completed traces and executable-state discovery for all 46 nodes.
- `corepack pnpm build`: passed. Vite reports the existing advisory that the main minified chunk is slightly above 500 kB.
- Final browser and visual pair 1: 24 browser tests and 16 visual comparisons passed.
- Final combined pair 2: 40 passed.
- Final combined pair 3: 40 passed.
- No browser console errors or page errors were accepted outside the narrowly documented Vite development WebSocket exception.
- Relaunched the final build with Vite at `http://127.0.0.1:4173/`, confirmed HTTP 200, and opened it in the user's browser.

## Material file inventory

- Narrative and pacing: `content/phase-2-sample.json`, `content/schemas/phase-2-sample.schema.json`, `src/narrative/types.ts`, `src/ui/NarrativeOverlay.ts`.
- Scene integration: `src/app/bootstrap.ts`, `src/scene/NarrativeGrayboxProjection.ts`, `src/scene/PixelBarScene.ts`, `src/styles/main.css`.
- Audio: `src/audio/AmbientMusic.ts`, `src/audio/pieces.ts`.
- Art and prompt: `art/source/props/fx.ts`, `.prompts/runs/2026-07-18_fx_tv_light_mask_v003.md`, `art/review_queue/props/fx_tv_light_mask_v003.png`, `art/review_queue/props/fx_tv_light_mask_v003.json`, `public/assets/fx/tv_light_mask.png`.
- Research: `research/HISTORICAL_LEDGER.csv`, `research/source_notes/2026-07-18_atmosphere-pass.md`.
- Tests: pacing, audio, scene projection, narrative engine, save, content, simulation, browser, and visual route files plus twelve Phase 2 canonical baselines.
- Documentation: the atmosphere design specification, implementation status, asset manifest, README, Phase 2 visual review, and this log.
- The FX generator rewrote the existing v002 smoke and door review PNGs byte-for-byte. Their content did not change.
- No Git metadata exists in this checkout, so this inventory replaces a Git diff claim.

## Unresolved

- Pre-existing production assets outside the environment and Arkady package remain incompletely approved or sidecar-tracked.
- Exact visible prop models remain provisional until separately sourced.
- Human playtesting is still needed to decide whether the slower rhythm feels patient rather than merely longer.
- The abstract low-music television frame may still read as weak reception. Add a separately reviewed nonverbal program frame only if playtesting shows confusion.
- Telephone handling, door activity, food service, full-night progression, dawn, and additional patron routines remain deliberately deferred.

## Team lanes

- Game design pacing and authored rhythm.
- Narrative activity/content expansion.
- Historical material-culture and broadcast research.
- Deterministic diegetic audio.
- Pixel scene, CRT lighting, pose reuse, smoke, and reduced-motion integration.
- Test architecture and final visual QA.

This bounded atmosphere-deepening log is complete. The unresolved items above belong to later art approval, playtesting, and vertical-slice work.
