# Session handoff — pixel-art redesign + polish (2026-07-17)

State of the repo at the end of this working session, written so the next session
(human or agent) can pick up without the chat transcript.

## What shipped today

1. **Full pixel-art redesign** of the Phase 2 narrative sample (approved spec:
   `docs/superpowers/specs/2026-07-17-pixel-art-redesign-design.md`).
   17-agent production pipeline: palette + design cards (`art/direction/`,
   `art/palette/wd-palette-v1.json`), art toolkit (`scripts/art-pipeline/`),
   layered environment from the blockout (`art/source/env/*.svg` →
   `art/approved/env/`), six direct-pixel character packages
   (`art/source/char/*.ts` → `art/approved/char/`), props/FX, worn-paper UI
   reskin (Pixelify Sans body + Press Start 2P headers, vendored OFL fonts in
   `public/fonts/`), sprite scene renderer (`src/scene/PixelBarScene.ts`,
   integer-scaled 640×360). QA + finisher log: `.logs/pixel-art-redesign.md`
   (includes deferred defects: counter re-projection, north-seat pattern,
   attention-tag pointer nit).
2. **Desktop dialogue spacing**: choice gap 0.9rem / margin-top 1rem (user
   request; preserved at ≥1280×720 only).
3. **Ambient Soviet-era music** — done, verified, accepted.
   Report: `.logs/2026-07-17-ambient-music.md`.
4. **Dialogue pacing beats + conversation-window overflow fix** — implemented;
   in final stabilization (see open items).
   Report (agent writes on completion): `.logs/2026-07-17-dialogue-pacing-and-window.md`.
   Key facts: presentation-layer only (engine/save/sim untouched);
   POST_CHOICE_HOLD_MS=1400, INTER_CONVERSATION_HOLD_MS=3000, stagger 120ms;
   click/Space/Enter skips; `data-beat` attribute exposes hold state.
   Overflow root cause: below 1280×720 the stage renders 1× (640×360) and the
   old panel sizing never fit; new mid-tier media query
   `(max-width:1279px),(max-height:719px)` tightens the panel; visible pixel
   scrollbar as safety net; roving focus scrolls into view.

## Open items (next session, in priority order)

1. **Pacing e2e flake gate (in flight at session end).** Beats made some
   assertions race Playwright's 5s timeout under CPU load (e.g. attention window
   after silence arrives ~3s late by design; margins too thin). Pacing agent was
   instructed: make tests beat-deterministic via the skip mechanism or data-beat
   waits (no timeout inflation), audit the whole phase-two spec, decide on the
   Vite HMR websocket console-error noise honestly, then prove 3 consecutive
   clean full-spec runs at BOTH chromium-1366x768 and chromium-1920x1080.
   If its report/log file is missing, this is unfinished.
2. **4 pre-existing visual-regression failures** (opening-dialogue +
   fragment-wording, both viewports): sub-pixel text shift, proven unrelated to
   today's feature work (fails on pristine code too) — likely font-metric
   nondeterminism vs the baselines captured by the finisher. Either stabilize
   font loading before capture or re-baseline once, deliberately.
3. **Deferred art defects** from `.logs/pixel-art-redesign.md` (counter
   re-projection needs a new blockout decision; cosmetic nits).
4. Future content phases: door-open/dawn lighting states, memory-vignette art,
   audio foley/ambience beds (manifest §7).

## How to verify current state

```sh
corepack pnpm check          # full gate
corepack pnpm dev            # play; music starts after first click/keypress
```

Canonical screenshots: `tests/screenshots/redesign/final/`.
Music toggle: pause menu → settings → "Background music".
Phase 1 graybox comparison route: `/?phase=1`.
