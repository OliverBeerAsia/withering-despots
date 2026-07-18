# Phase 2 work log

Date: 2026-07-17
Objective: Build the deterministic narrative, claim, event, and save systems with a provisional sample scene only.
Stopping condition: Stop when the Phase 2 narrative-system acceptance gate passes.

## Scope

- Externalized data for characters, dialogue graphs, claims, chapters, events, attention windows, interaction objects, localization, epilogues, and historical-ledger links.
- Typed conditions, effects, transactions, deterministic scheduling, provenance-aware choices, save migration, save/restore, and rendering-independent simulation.
- One provisional 10 to 15 minute sample scene with Sasha, Galina, Arkady, Lev, Nikolai, and Gennady placeholders.
- No final room, production dialogue, production character art, memory-vignette art, audio production, or later-phase content.

## Visual problem

Fit provisional dialogue and attention controls into the approved graybox without changing room geometry or blocking subtitle-safe space.

## Expert review lanes

- Narrative architecture and Phase 1 integration.
- Provisional scene structure and character differentiation.
- Schema, reference, reachability, localization, and ledger validation.
- Save versioning, migration, checksum, and replay equivalence.
- Unit, content, simulation, browser, and visual acceptance tests.
- Keyboard, focus, live-region, text-scaling, and save/load accessibility.
- Historical claim and source-ledger boundary.
- Adversarial review for attention scarcity, bartender identity, chamber tension, replay value, and exposition risk.

## Decisions

- Phase 1 remains a regression route rather than becoming the Phase 2 state model.
- Phase 2 gets a separate rendering-independent narrative core. The fixed room remains a projection of that state.
- JSON remains the content format for this milestone. It avoids adding a production parser dependency while preserving strict schema validation and externalized content.
- The sample scene may use short functional prose, but it remains explicitly provisional in metadata and must not contain development commentary in player-facing text.

## Commands and outcomes

- Read the Phase 2 prompt, required milestone sections, narrative design, technical architecture, content examples, visual-gate skill, current engine, validators, UI, and tests.
- Searched project memory for prior repository traps. The useful reminder was to keep port-binding failures separate from product failures and report each verification lane independently.
- Built a strict JSON schema and semantic loader for the Phase 2 sample. The validator rejects bad references, missing locale or ledger links, impossible conditions, orphaned claims, invalid object states, and unreachable graph content before startup.
- Ran 500 deterministic completed paths. All 34 authored nodes were reached and both interpretation routes preserved the same public result.
- Fixed one scheduler-preempted dialogue node by routing the private exchange directly into its attention window.
- Fixed save validation so claim-derived knowledge is accepted as a known content reference. Unit save tests now cover opening, dialogue, attention, completion, migration, checksum, and next-command equivalence.
- Ran unit, content, simulation, lint, and type checks during integration. Final browser and visual checks remain in progress.
- Opened the running Phase 2 build in a headed browser. Startup completed with no console errors or warnings after forcing a clean Vite dependency optimisation.
- Captured and reviewed opening dialogue, three-way attention, fragment-safe wording, and public-summary states at 1920 by 1080 and 1366 by 768. The eight final captures are stored under `tests/screenshots/phase-2-final-*.png`.
- The first visual review found that the ending summary could cover the focused Finish control before completion. Summary selection now requires completed mode. The corrected summary route passed at both viewports.
- Ran the complete `corepack pnpm check` gate after integration. Formatting, linting, type checking, 32 unit assertions, 15 content assertions, 11 simulation assertions, production build, 22 browser tests, and 12 visual comparisons passed.
- Recorded the new permanent art direction across `AGENTS.md`, `PLAN.md`, the art bible, narrative design, art scorecard, and visual QA. Phase 3 must prove an original 640 by 360 pixel-art-esque target with integer scaling and no imitation of another game's layout or assets.
- Reopened the validated build at `http://127.0.0.1:4173/` for user play. The preview returned HTTP 200. The Phase 1 comparison route remains at `http://127.0.0.1:4173/?phase=1`.

## Defects and unresolved questions

- A first live preview used stale Vite dependency output and returned missing Pixi chunks. Restarting with a forced dependency optimisation corrected it. This was a preview-cache fault, not a product failure.
- The first runtime graph had one scheduler-preempted node. The node was removed and all three exits now open the attention window directly. Runtime exploration reaches every remaining node.
- Save validation initially rejected claim-derived knowledge. The accepted knowledge-ID set now includes repository claim IDs.
- The initial visual route included a scheduler-preempted Hold choice. The route was corrected to respect the scheduler opening attention immediately.
- The first browser dependency cache contained stale Pixi chunks. A forced Vite optimisation corrected the local preview.
- A corrected browser test rerun first hit a macOS Chromium MachPort sandbox denial. The required escalated run passed and confirmed this was not a product defect.
- The opening tone and Sasha's player fantasy remain later creative steering questions. Phase 2 can test structure without locking either choice as production voice.
- Later visual work must reduce attention-label coverage at 1366 by 768 once final gestures exist, and make the photograph's face-up and face-down states independently readable.
