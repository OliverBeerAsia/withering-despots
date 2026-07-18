# Phase 1 work log

Date: 2026-07-16  
Objective: Build the playable ten-minute deterministic graybox and five-verb interaction grammar only.  
Stopping condition: Stop when the Phase 1 graybox gate passes.

## Scope

- Geometric SVG, CSS, and PixiJS placeholder art only.
- One locked 1920 by 1080 camera with letterboxing.
- Four patron placeholders, Sasha movement anchors, five contextual verbs, one short placeholder exchange, one service branch, one attention conflict, deliberate waiting, and a clear graybox ending.
- No authored dialogue engine, claims, production story content, save system, final art, generated images, audio production, or later-phase systems.

## Visual problem

Make four patrons, the service counter, television, telephone, and attention conflict readable in one locked graybox camera without implying final art.

## Team plan

- Interaction architecture lead: deterministic state, commands, effects, timing, and attention resolution.
- Geometry lead: floor plan, locked perspective, anchors, safe areas, and visual risks.
- Accessibility lead: semantic contextual controls, focus flow, pause/settings boundary, and development diagnostics.
- Test lead: deterministic unit coverage, keyboard completion, hotspot geometry, scaling, and screenshot requirements.
- The lead agent owns content validation, integration, browser review, corrections, documentation, and the final gate.

## Commands and outcomes

- Read the Phase 1 brief and routed technical, historical, art, visual-QA, asset-manifest, environment-template, and skill instructions.
- `command -v npx`: passed at `/Users/home/.nvm/versions/node/v24.18.0/bin/npx`.
- `xmllint --noout art/blockout/bar_floor_plan.svg art/blockout/bar_perspective.svg`: passed in the geometry lane.
- `corepack pnpm typecheck`: passed after removing one unused type import from the integrated scene.
- `corepack pnpm exec tsx scripts/validate-content.ts`: could not create its local IPC pipe in the managed sandbox; reran through the approved `npx tsx` entry point.
- `npx tsx scripts/validate-content.ts`: initially failed loudly because the east and south patron hotspots overlapped by 55 by 65 logical pixels. The source layout was corrected, then both Phase 0 and Phase 1 content validated.
- `corepack pnpm test`: passed 10 unit assertions across the deterministic RNG and Phase 1 graybox engine.
- `corepack pnpm test:content`: passed 6 assertions, including valid layout and fail-loud duplicate, missing-anchor, overlap, and Phase 0 fixture cases.
- `corepack pnpm test:simulation`: passed 7 assertions, including both branch policies, exact completion time, and deterministic replay.
- SVG source correction: all 21 runtime anchor IDs now exist in both blockouts; perspective anchors match the runtime coordinates, with horizon and subtitle-safe bounds preserved.
- First final `corepack pnpm check` attempt stopped at lint because the visual test returned a void expression from a shorthand animation-frame callback. Expanded both callbacks into blocks, then restarted the complete gate.
- The next managed-sandbox attempt reached Playwright and failed to bind `127.0.0.1:4173` with `EPERM`. The complete command was rerun with the approved local-server permission.
- Final `corepack pnpm check`: passed formatting, linting, strict type checking, 12 unit assertions, 7 content assertions, 7 simulation assertions, repeated content validation, production build, 14 browser tests, and 4 visual comparisons.
- `npx tsx scripts/validate-content.ts`: independently validated `content/phase-0.json` and `content/graybox-layout.json` after the full gate.

## Visual review pass 1

- Captured `tests/screenshots/phase-1-pass-1-1920x1080.png` and `tests/screenshots/phase-1-pass-1-1366x768.png` from the deterministic populated state at 19:16.
- Four heads remained separated, the counter and five tables read as distinct masses, fixture and patron hotspots were disjoint, and the bottom subtitle-safe band remained clear.
- The collapsed debug panel obscured the television sight line, especially at 1366 by 768.
- Browser interaction found that Escape did not work until focus entered the overlay and that pointer focus could replace a hotspot before its click committed.
- Full observation table: `tests/visual/snapshots/PHASE_1_REVIEW.md`.

## Visual review pass 2

- Reduced the collapsed debug panel to summary width, moved keyboard shortcuts to the document boundary, and made focus tracking pointer-safe.
- Captured `tests/screenshots/phase-1-pass-2-1920x1080.png` and `tests/screenshots/phase-1-pass-2-1366x768.png`.
- Reinspection confirmed stable head separation, clear focus, preserved subtitle-safe space, visible television and telephone sight lines, and no hotspot overlap.
- `corepack pnpm test:e2e`: passed 10 browser tests across the two canonical projects after the correction pass.
- `corepack pnpm test:visual`: passed both corrected visual baselines.

## Integration and accessibility correction pass

- Replaced the bottom attention menu with two real spatial controls on the television and telephone. The conflict now lives in the room instead of behaving like a sixth verb.
- Removed `Focus` and `Complete` from the verb HUD. The player-facing grammar remains Observe, Speak, Serve, Tune, and Wait.
- Added geometric consequences for answering, silence, tea, vodka, missed broadcasts, missed calls, and completion. These are state proofs, not production feedback art.
- Bound the runtime room to the canonical polygon and anchor data. All 18 seat anchors, standing anchors, table anchors, fixtures, and Sasha routes now come from the validated layout.
- Corrected Sasha's draw order so she remains behind the counter and follows authored route points.
- Added a persistent live status region, keyboard focus restoration, 150 percent interface-text coverage, and pointer-safe pause/settings dialogs.
- Fixed native dialog replacement by closing any open dialog before rendering its successor.
- Replaced repeated PixiJS `Graphics.clear()` state redraws with persistent geometry whose visibility, tint, and position change deterministically. This removed black and cropped layers in rapid visual-test playback.
- `corepack pnpm test:e2e`: passed 14 browser tests across the two canonical projects after the correction pass.
- `corepack pnpm test:visual`: passed 4 canonical visual comparisons after the renderer correction.

## Final visual review

- Inspected the observe and attention-conflict captures at 1920 by 1080 and 1366 by 768 at original resolution.
- All four heads remain separated. Sasha is clearly occluded by the counter. The television and telephone are recognizable within three seconds.
- The attention choices are spatial controls. The subtitle-safe band remains clear and the 1366 by 768 composition retains readable labels and focus state.
- The tea cup and answered-exchange gesture visibly prove earlier choices in the attention-conflict state.
- Copied the approved blockout captures to `tests/screenshots/phase-1-final-*.png`. Approval is for Phase 1 geometry only, not production art.

## Defects, compromises, and unresolved questions

- Save-and-restore testing is not applicable in Phase 1 because Phase 0 intentionally created no save infrastructure.
- Corrected before browser review: `patron-east` and `patron-south` hotspot rectangles overlapped in the first layout draft.
- Corrected before browser review: first-draft SVGs used abbreviated phone/TV IDs and divergent Sasha/walk coordinates, so they did not yet serve as exact runtime sources of truth.
- The 18 seat markers remain placement aids, not final chair art.
- Tea increasing composure and vodka increasing intoxication are disposable graybox scaffolding. They are not a production morality or causality model.
- The structural loop is coherent, but Phase 1 does not prove that the finished game is fun or desirable across a full session. That requires authored material and later playtesting.
- No blocking art-direction choice is required for this geometric gate. Before later narrative and visual work, ask the user to steer the opening hook and Sasha's player fantasy.
