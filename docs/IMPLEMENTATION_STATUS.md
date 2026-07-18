# Implementation Status

Updated: 2026-07-18

## Current gate

Phase 0 and Phase 1 passed on 2026-07-16. Phase 2 passed on 2026-07-17. The default build now runs a provisional atmosphere-deepening sample from 19:25 to 19:45, while `/?phase=1` preserves the ten-action interaction graybox.

The 2026-07-18 pass remains inside the Phase 2 proof. It deepens the existing room without claiming the later vertical-slice milestones. The camera, 640 by 360 native grid, room geometry, five verbs, cast, attention window, claims, summaries, and fixed historical outcome are unchanged.

## Milestone checklist

- [x] Phase 0: repository skeleton and deterministic toolchain
- [x] Phase 1: graybox room and five-verb interaction
- [x] Phase 2: narrative, claim, event, and save systems
- [ ] Phase 3A: historical visual research and geometry lock
- [ ] Phase 3B: empty-room visual target
- [ ] Phase 3C: canonical character and seated-pose gate
- [ ] Phase 3D: interface and memory-vignette target
- [ ] Phase 4: vertical slice content
- [ ] Phase 5: evaluation and rewrite
- [ ] Phase 6: full production
- [ ] Phase 7: release preparation

Later milestones remain open. The default route now uses the existing v002 pixel environment and character sheets, but the wider art package is not yet fully approved. Dialogue remains provisional. This pass adds reviewed-in-context presentation code, a review-status CRT mask, and original synthesized diegetic music. It does not claim final art, production dialogue, or full-night content.

## Atmosphere-deepening pass

- Content: 54 dialogue nodes and 86 choices. Eight new patron exchanges let Sasha stay with Galina, Lev, Nikolai, Arkady, and Gennady without changing the route's public history.
- Room rhythm: opening maintenance, a signal-and-service interval, the existing broadcast attention window, and a post-report quiet interval.
- Authored pacing: 34 varied holds from 10 to 60 seconds. A visible Continue control, panel click, Space, or Enter reveals the next choices early. Full, Brief, and Immediate pacing preferences are separate from reduced motion. Pause and hidden-tab state freeze the remaining hold, and presentation time never changes the deterministic room clock.
- Television: persistent `music_low`, `signal_unstable`, `signal_clear`, `bulletin`, and `after_report` states, with local CRT light and no full-room dim.
- Audio: three original 71 to 75 second instrumental cues remain in fixed order. A second deterministic room layer adds quiet synthesized ventilation and refrigeration with sparse glass, chair, and telephone-relay cues 24 to 49 seconds apart. Music, room ambience, and incidental-effect reduction have separate settings. The significant relay cue reaches a semantic sound caption.
- Activity state: stock notebook, glass, photograph, television, television volume, radio music, and Nikolai's tea persist through save and restore.
- Staging: conservative reuse of existing lean, signature, and exhausted poses. Seated patrons now remain still for most of each 16 to 58 second character-specific cycle, with asynchronous blinks and rare one-frame posture settles. Two table glasses make rare whole-pixel nudges and return to their anchors. Reduced motion freezes these additions.
- Historical support: service practice, media behavior, weather, music restraint, and material-culture decisions are recorded in the historical ledger and the 2026-07-18 atmosphere source note.
- Scope held: no new location, free walking, inventory, drink crafting, new verb, new meter, room repaint, or changed historical outcome.

## Phase 2 gate evidence

- Current deterministic checks: formatting, linting, strict type checking, 65 unit assertions, 18 content assertions, 12 simulation assertions, and the production build pass on the long-pause build.
- Browser gate: three consecutive clean final pairs passed at both canonical viewports. Each pair covers 28 browser tests and 18 visual comparisons, including the real 60 second hold, pause and resume, early continuation, opening maintenance, and the held post-report room.
- Content: 54 authored dialogue nodes, five meaningful silences, six characters, four claims, one three-way attention window, one scheduled public event, seven interaction objects, and two summaries are externalized and runtime-validated.
- Reachability: 500 distinct completed paths run without uncaught errors. Per-node executable-state discovery reaches all 54 authored nodes.
- Determinism: scheduler ordering, condition and effect transactions, public history, save and restore, and the next command after restore remain reproducible.
- Provenance: direct, fragmentary, and second-hand knowledge produce different allowed wording. Direct-witness phrasing is absent when Sasha did not witness the claim.
- Accessibility: the scene completes with keyboard only and no pointer input. Meaningful silence, spatial attention, pause, settings, checkpoint save and load, focus restoration, reduced motion, and 150 percent interface text pass at both viewports.
- Visual gate: opening, attention, provenance wording, public-summary, and choice-free held states pass at 1920 by 1080 and 1366 by 768. Fourteen reviewed Phase 2 regression captures are stored under `tests/visual/snapshots/`.
- Scope: the canonical captures now exercise the pixel-art build. They approve integration states only and do not grant blanket approval to the remaining review-queue art package.

## Phase 2 deliverables

- Strict runtime schemas and semantic validation for characters, dialogue graphs, claims, chapters, events, attention windows, objects, localization, summaries, and ledger references.
- Pure deterministic narrative state, conditions, effects, scheduler, attention resolution, claim contradiction, relationship, object, and summary systems.
- Versioned canonical save codec with integrity checks, migration routing, browser storage adapters, and replay-equivalence tests.
- Rendering-independent simulation and bounded path exploration.
- Semantic narrative overlay with keyboard navigation, live status, pause and settings dialogs, text scaling, and checkpoint controls.
- Dated implementation, visual, and adversarial review records.

## Locked direction for Phase 3

The production target is now an original pixel-art-esque chamber drama. The documented art grid is 640 by 360, with integer presentation at both canonical captures. _Papers, Please_ is a quality bar for compact human writing, ordinary work under pressure, tactile feedback, clear consequences, and low-resolution readability. Its layouts, palette, typography, characters, interface positions, inspection loop, narrative structure, pixel clusters, and assets are not references to copy.

## Phase 1 gate evidence

- Complete check: formatting, linting, type checking, 12 unit assertions, 7 content assertions, 7 simulation assertions, production build, 14 browser tests, and 4 visual comparisons passed.
- Determinism: both branch policies end on the tenth action at exactly 19:25, and replay produces the same state.
- Content validation: canonical polygons, 18 seats, table and fixture anchors, standing anchors, patron hotspots, and Sasha routes validate and fail loudly on malformed fixtures.
- Accessibility: the ten-action loop completes with keyboard only; visible focus, native pause/settings dialogs, persistent status updates, time freeze, reduced motion, and 150 percent interface text pass browser checks.
- Canonical captures: final observe and attention-conflict states exist at 1920 by 1080 and 1366 by 768 under `tests/screenshots/phase-1-final-*.png`.
- Visual scope: these captures approve geometry and integration only. They are not approved production art.

## Phase 1 deliverables

- Strict TypeScript deterministic interaction engine and ten-action clock.
- Validated data-driven room geometry, anchors, hotspots, routes, and effects.
- Fixed-camera PixiJS blockout with persistent state geometry and semantic DOM controls.
- Observe, Speak, Serve, Tune, and Wait interaction grammar.
- Four patron targets, Sasha movement, one placeholder exchange, one service branch, deliberate silence, and one competing-media choice.
- Unit, content, simulation, browser, keyboard, accessibility, and visual regression coverage.
- SVG floor plan and locked perspective blockouts registered in the asset manifest.
- Dated implementation, visual, and adversarial review records.

## Scope boundary

Phase 2 remains a systemic proof. Its prose, claims, and summaries are provisional samples, not production dialogue. The atmosphere pass deliberately uses existing room art, characters, props, and system boundaries. The 500-path simulation proves safety and reachability, not that the scene is fun. Human playtests and the remaining asset approvals are still required before production voice or art is locked.
