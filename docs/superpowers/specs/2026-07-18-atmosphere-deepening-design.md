# Atmosphere deepening design

Date: 2026-07-18

## Objective

Deepen the current Phase 2 sample into a slower, more atmospheric proof without changing its core design direction.

The player should spend more time inhabiting the room through attention, service, tuning, observation, and deliberate waiting. Slowness must come from authored room activity and readable consequences, not compulsory empty delay.

## Preserved invariants

- Keep the fixed camera, approved room geometry, 640 by 360 native grid, palette, and existing character direction.
- Keep the five verbs: Observe, Speak, Serve, Tune, and Wait.
- Keep the current cast, fixed historical outcome, claim provenance, attention window, save determinism, and broad ending logic.
- Keep all new player-facing writing provisional and plainly within the room.
- Do not add a new location, free walking, inventory combinations, crafting, drink mixing, economy, meters, or real-time reaction pressure.
- Do not regenerate or repaint the full environment.
- Do not use generic Russian folk standards as atmospheric shorthand.

## Stopping condition

This pass stops when the current sample proves all of the following:

1. Three authored room intervals are present: opening maintenance, signal/service activity, and post-broadcast quiet.
2. Television state persists before, during, and after the attention event.
3. Diegetic music and receiver sound are deterministic and content-directed.
4. At least six practical actions use the existing verbs and change a prop, pose, light, sound, relationship, availability, or knowledge result within two actions.
5. The existing plot and summary families remain intact.
6. All presentation holds are skippable and no authored hold exceeds eight seconds.
7. The complete route remains keyboard accessible, saveable, and deterministic.
8. Canonical screenshots at 1920 by 1080 and 1366 by 768 show the opening TV state, service state, broadcast state, post-news quiet, keyboard focus, and reduced-motion state.

## Experience structure

### 1. The room before answers

- The television is already alive at low volume with an unstable picture.
- A restrained original diegetic instrumental phrase sits under receiver hiss.
- Galina checks stock while Sasha can inspect the room, steady the service rhythm, or listen through the phrase.
- No action is a no-op: television, notebook, glass, pose, or knowledge state changes.

### 2. Service under argument

- Preserve the current Gennady, Galina, Arkady, Lev, and Nikolai material.
- Add practical choices around tea, clearing, leaving a glass, watching hands, and attending to reception.
- Use the current unstable-glass and photograph pattern as the model: an immediate material response plus a later social or attention cost.

### 3. The signal rises

- Lev notices a reception change.
- The player may adjust the set, finish a service action, or keep listening to a patron.
- The current three-way attention window remains the central conflict.
- Missing the bulletin changes knowledge provenance, not whether the physical television exists.

### 4. After the report

- Music stops.
- The television remains on at low volume or weak signal.
- A long but skippable quiet beat uses receiver hum, room tone, a chair or glass sound, and changed posture.
- The player receives another Observe, Serve, Tune, or Wait choice before the final contradiction and summary.

## Stateful activity set

The smallest shippable set is:

- Observe the television reflection or Lev listening to the signal.
- Tune the unstable picture or leave it low.
- Open and inspect Galina's stock notebook.
- Serve tea or leave the existing glass in place.
- Clear or wipe the unstable glass state.
- Wait through the end of a short music phrase.
- Observe or preserve Gennady's photograph.
- Lower the television after the bulletin or leave it audible.

Each major practical choice must make another opportunity weaker, fragmentary, secondhand, or unavailable.

## Media state

Use existing serializable interaction-object state.

Television states:

- `music_low`
- `signal_unstable`
- `signal_clear`
- `bulletin`
- `after_report`

Television-volume states:

- `muted`
- `low`
- `normal`

Radio/music states:

- `instrumental_low`
- `lowered`
- `silent`

No state name asserts an exact television model, station schedule, recording, or archival wording.

## Audio direction

- Replace the shuffled folk-standard playlist with two or three original, restrained 60 to 90 second note-data pieces.
- Keep audio in the existing Web Audio implementation and small-receiver band.
- Use deterministic seeded or authored cue order. Audio variation may not affect narrative state.
- Reserve `Swan Lake` for a later explicitly scheduled, ledgered historical event. It is not part of this ambient pass.
- Separate music presence from receiver/room presence so silence after the report still has audible room life.
- Pause must suspend presentation audio and resume without duplicating timers.
- Significant non-speech cues require concise captions.

## Pacing direction

- Replace one uniform post-choice delay with optional node-level `presentation.holdMs` data.
- Ordinary line settling: 1.8 to 2.5 seconds.
- Practical action or music phrase: 2.5 to 4 seconds.
- Major-news quiet: 5 to 8 seconds.
- Click, Space, or Enter always collapses the remaining hold.
- Tests skip holds rather than increasing timeouts.
- In-world minutes remain authoritative and independent from presentation wall time.

## Visual direction

- Preserve all approved v002 environment structure.
- Drive the TV from durable television state, not `attentionOpen` alone.
- Replace the projector-like TV cone and full-room dim with a local CRT halo and small bounce patches confined to the TV wall and nearest table.
- Use existing character sheet poses: listen, lean in, lean back, signature, talk, and exhausted.
- Slow smoke to infrequent whole-pixel changes and freeze it for reduced motion.
- Do not add global haze, bloom, blur, decorative grain, propaganda, signage, or pseudo-text.
- Door light must depend on door state, not scene completion. Door and dawn expansion are deferred unless needed by the final quiet state and historically supported.

## Historical boundary

- New practical actions use generic, already represented object classes until ledgered.
- Add ledger coverage for the generic television behavior, faceted glass, ashtray, tea holder, stock notebook, and telephone before treating them as production-approved exact props.
- Broadcast wording remains original and fictionalized.
- Do not claim a precise program, schedule, price, device model, label, or recording without a source row.

## Implementation seams

- `content/phase-2-sample.json`: room intervals, media objects, practical branches, provisional text, and longer in-world span.
- `content/schemas/phase-2-sample.schema.json`: optional node presentation metadata.
- `src/narrative/types.ts` and content loading: typed presentation metadata.
- `src/ui/NarrativeOverlay.ts`: authored skippable holds, captions, media settings, pause semantics, and scene breathing.
- `src/audio/AmbientMusic.ts` and `src/audio/pieces.ts`: deterministic original diegetic music and receiver lifecycle.
- `src/scene/NarrativeGrayboxProjection.ts` and `src/scene/PixelBarScene.ts`: persistent TV/media state, existing pose reuse, restrained CRT light, slow atmosphere, and reduced-motion integration.
- Tests: unit, content, simulation, save, end-to-end, and visual coverage for every new state.
- Documentation: implementation status, historical ledger, visual review notes, asset metadata, and dated work log.

## Acceptance gates

- Formatting, linting, strict type checking, unit tests, content validation, simulation tests, build, Playwright end-to-end, and visual tests pass.
- Three consecutive final end-to-end runs pass without timeout inflation.
- Screenshots are manually inspected at both canonical resolutions.
- TV light stays local and readable; no projector cone or global blue wash remains.
- In-game reduced motion freezes Pixi flicker, smoke, and nonessential idle movement while preserving readable state.
- No uncaught console error, failed asset request, or missing fallback appears in canonical flows.
- Baseline visual failures are separated from new regressions and deliberately re-baselined only after manual approval.

## Explicit deferrals

- Full-night content, later chapters, memories, dawn, additional patrons, new character art, a new room, and final production dialogue.
- Full multi-bus production audio and final foley library beyond the minimal atmosphere proof.
- Structural counter or seating re-projection.
- Promotion of pre-existing review-queue character and prop assets without their separate approval work.
