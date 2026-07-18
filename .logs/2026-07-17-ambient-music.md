# Ambient Soviet-era music (2026-07-17) — agent final report (verified, accepted)

Diegetic background music: gentle public-domain arrangements voiced as the bar's
radio/TV speaker. Web Audio API only — no dependencies, no audio asset files, no
rights exposure (compositions only, all composers PD; our own arrangements).

## Files

- NEW `src/audio/pieces.ts` — 4 arrangements as note(freq/beats) + sparse
  accompaniment: Swan Lake Act II "Scene" (B minor; apt to the 1991 coup TV loop),
  Korobeiniki (E minor), Kalinka gentle verse (A minor, not the fast refrain),
  Ochi Chornye (D minor). Equal-tempered frequencies via pitch→MIDI table.
- NEW `src/audio/AmbientMusic.ts` — soft sine/triangle voices with envelopes →
  HP300Hz→LP3400Hz radio band → master gain 0.12 (sits under dialogue). Slow LFO
  pitch wow (~0.7 Hz, 7 cents), quiet pink-noise hiss bed, shuffled playlist,
  8–20 s hiss gap between pieces, ~2 s fades. AudioContext gesture-gated
  (first pointerdown/keydown); suspends on document hidden; `setEnabled()` toggle.
- NEW `tests/unit/AmbientPieces.test.ts` — non-empty pieces, positive durations,
  pitches 100–2000 Hz, unique ids.
- `src/app/bootstrap.ts` — narrative branch only; Phase 1 graybox untouched.
- `src/ui/NarrativeOverlay.ts` — "Background music" checkbox in the settings
  fieldset (same markup/44px/focus pattern), default ON, persisted in the settings
  localStorage record (older records default ON); persisted-off honoured before
  audio starts.

## Verification (all run on the final shared-file state)

typecheck / lint / build / format:check / unit (36) — PASS.
e2e 21/22 — the single failure was the pacing task's choice-reveal timing at
1366×768, not audio (settings-dialog test passes both viewports; zero console
errors under the strict afterEach). Audio smoke (temp Playwright script, since
deleted): AudioContext created only after gesture, state running, toggle
suspends/resumes output, setting persists. 6/6 PASS.

Decision: no permanent audio e2e — the settings e2e covers the user-facing
contract; the piece-data unit test is the durable artifact.
