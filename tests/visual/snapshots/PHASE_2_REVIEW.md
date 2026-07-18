# Phase 2 atmosphere visual review

Date: 2026-07-18

These captures verify the atmosphere-deepened Phase 2 sample in the current pixel room. They approve the integrated review states, not the whole art package or final production dialogue.

## Direction held

- Fixed camera, 640 by 360 native grid, integer scaling, palette, room geometry, furniture, and character anchors are unchanged.
- No room repaint or full-scene generation was used.
- The persistent television uses authored room state rather than the attention menu.
- CRT light is local. The earlier full-room dim and projector cone are removed.
- Existing character poses are reused conservatively.
- New text remains semantic DOM text. No generated lettering is present.

## Canonical captures

| State                 | 1920 by 1080                                                    | 1366 by 768                                                   | Judgment                               |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Opening dialogue      | `chromium-1920x1080/phase-2-opening-dialogue-1920x1080.png`     | `chromium-1366x768/phase-2-opening-dialogue-1366x768.png`     | Pass                                   |
| Opening maintenance   | `chromium-1920x1080/phase-2-opening-maintenance-1920x1080.png`  | `chromium-1366x768/phase-2-opening-maintenance-1366x768.png`  | Pass after compact-viewport correction |
| Three-way attention   | `chromium-1920x1080/phase-2-attention-window-1920x1080.png`     | `chromium-1366x768/phase-2-attention-window-1366x768.png`     | Pass                                   |
| Post-report quiet     | `chromium-1920x1080/phase-2-post-report-quiet-1920x1080.png`    | `chromium-1366x768/phase-2-post-report-quiet-1366x768.png`    | Pass after compact-viewport correction |
| Post-report held      | `chromium-1920x1080/phase-2-post-report-held-1920x1080.png`     | `chromium-1366x768/phase-2-post-report-held-1366x768.png`     | Pass                                   |
| Fragment-safe wording | `chromium-1920x1080/phase-2-fragment-wording-1920x1080.png`     | `chromium-1366x768/phase-2-fragment-wording-1366x768.png`     | Pass                                   |
| Public break summary  | `chromium-1920x1080/phase-2-public-break-summary-1920x1080.png` | `chromium-1366x768/phase-2-public-break-summary-1366x768.png` | Pass                                   |

All fourteen Phase 2 captures were inspected at native resolution. The four Phase 1 structural captures remain in the same regression run, for eighteen visual comparisons total.

## Structured inspection

### Composition

1. The fixed room silhouette remains immediately readable at both viewports.
2. Opening dialogue keeps Galina, Sasha, the counter, and the active television visible.
3. Four-action panels occupy more of the lower room but preserve the television and upper character plane.
4. Attention labels remain spatially attached to Galina, Arkady, and the television.
5. The post-report scene keeps the dark television screen in view while the quieter choices occupy the lower plane.
6. The held post-report scene leaves the room dominant, isolates the response line, and keeps a compact Continue control at the panel edge without suggesting a countdown.

### Character identity and anatomy

1. All six silhouettes remain distinct at room scale.
2. Existing head, shoulder, and seated proportions are unchanged.
3. Pose changes use approved sheet frames rather than generated variants.
4. No limbs detach or cross furniture masks incorrectly in the reviewed states.
5. Character readability is still stronger at 1920 by 1080 than 1366 by 768, but no identity is lost.

### Perspective and occlusion

1. Tables, counter, seats, door, and television retain the approved perspective.
2. Character feet and seats remain grounded to existing anchors.
3. The CRT light does not cross the character plane as a projector beam.
4. Furniture-front masks continue to hide lower bodies correctly.
5. Dialogue panels cover lower-body business by design, so future hand-led service animation needs a later UI check.

### Historical plausibility

1. No new flag, slogan, product model, uniform, or exact broadcast wording appears.
2. The television remains a restrained material object rather than a modern video panel.
3. Tea, glass tending, stock notes, and signal adjustment are supported by the historical ledger or marked provisional there.
4. The music is original and non-identifiable rather than a generalized Russian folk playlist.
5. The room avoids new décor and consumer branding, preserving the existing 1991 material-culture boundary.

### Low-resolution readability

1. HUD, clock, speaker plate, dialogue, and focus ring remain crisp at both viewports.
2. The compact four-action panels initially scrolled the speaker and first line out of view at 1366 by 768.
3. Raising the compact panel limit to 50 percent keeps the speaker, line, and all four actions visible together.
4. Attention labels remain legible without relying on color alone.
5. Summary text wraps cleanly and preserves the photograph consequence.
6. The held panel preserves the full response and Continue control at both canonical sizes without clipping.

### Consistency

1. Palette use remains locked to the existing room and UI colors.
2. CRT states use the same screen-frame family throughout the route.
3. Choice panels retain the established paper, ink, shadow, and cyan-focus treatment.
4. The original five verbs are expressed through the same choice grammar.
5. TV, radio-music, prop, and pose changes derive from deterministic narrative state.

### Artifacts

1. No generated text, pseudo-lettering, or watermarks are visible.
2. No light seam connects the television to the table crescent.
3. No global dim remains during the bulletin.
4. No transparent edge halo is visible around the v003 CRT mask.
5. No clipping remains in the corrected compact maintenance and post-report captures.

## Defect table

| Region                            | Category         |                     Severity | Violated invariant                                                | Observation                                                                                                                           | Smallest correction                                                                          | Owner layer                  |
| --------------------------------- | ---------------- | ---------------------------: | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------- |
| TV event light                    | Lighting         |              high, corrected | CRT light must remain local                                       | v002 read as a projector cone and the scene applied a full-room dim.                                                                  | Replace the mask with disconnected local reflections and remove the global dim.              | Light overlay and scene      |
| TV lifecycle                      | State projection |              high, corrected | A physical room system must persist outside one menu              | The set previously appeared active only during the attention window.                                                                  | Drive screen and light from durable television object state.                                 | Narrative projection         |
| Four-action panels at 1366 by 768 | Readability      |              high, corrected | Speaker, line, and available actions must remain visible together | Keyboard focus on the last choice scrolled the speaker plate and first line out of view.                                              | Allow 50 percent panel height at the 2x canonical viewport and tighten choice gaps.          | CSS                          |
| Character gesture plane           | Composition      |                 medium, open | Important service gestures should remain visible                  | Four-choice panels cover hands and table edges more than two-choice panels.                                                           | Recheck panel depth when service animations or final seated hand poses are introduced.       | Future UI and character pass |
| TV music program                  | Specificity      |                    low, open | Media state should read without explanatory text                  | The restrained abstract screen can read as weak reception as well as a low music program.                                             | Add a separately reviewed nonverbal music-program frame only if playtesting shows confusion. | Future prop asset            |
| Long held response                | Composition      |             pass-observation | Quiet time must remain visibly player-controlled                  | The room stays readable and the compact Continue control remains clear at both viewports.                                             | None.                                                                                        | UI and scene                 |
| Ambient idle layer                | Motion           |             pass-observation | Stillness must outweigh nonessential motion                       | Reduced-motion captures are stable, while pure tests prove asynchronous blinks, rare posture settles, and whole-pixel glass movement. | None.                                                                                        | Scene                        |
| Wider asset package               | Governance       | high, open outside this pass | Production art must be approved with complete sidecars            | Several character and prop assets predate a complete approval trail.                                                                  | Finish package-by-package review before declaring final art.                                 | Art production               |

## Review package

- Input references: approved v002 environment, current character sheets, palette, art bible, scorecard, visual QA rules, asset manifest, historical bible, and the 2026-07-18 atmosphere design specification.
- Prompt saved: `.prompts/runs/2026-07-18_fx_tv_light_mask_v003.md`.
- Rejected candidate: v002 projector-cone CRT mask.
- Accepted integrated candidate: v003 local CRT mask in all fourteen Phase 2 canonical states.
- Asset source status: `review`. It remains in `art/review_queue/props/` pending the project's human promotion checkpoint.
- Runtime visual result: `PASS` for the bounded long-pause atmosphere proof after three consecutive 28-test browser and 18-comparison visual pairs.
- Production-art result: not claimed. The wider approval work remains open.
