# Long pauses and inhabited-room design

Date: 2026-07-18

## Objective

Let dialogue breathe for 10 to 60 seconds while the existing bar remains alive through restrained character, prop, sound, and television activity. Give the player more opportunities to stay with individual patrons. Preserve the fixed room, five verbs, cast, historical outcome, attention window, claims, summaries, and deterministic clock.

## Stopping condition

Stop when one complete 19:25 to 19:45 route contains varied, player-controlled 10 to 60 second pauses, eight additional patron exchanges, deterministic room ambience, and sparse whole-pixel motion, with Pause, hidden-tab, reduced-motion, keyboard, save, browser, and canonical visual gates passing.

## Hard boundaries

- No new location, camera, verb, inventory, recipe system, meter, real-time pressure, or historical branch.
- No room repaint, new character sheet, generated raster text, new prop art, or unreviewed decoration.
- Presentation time remains separate from narrative time and save state.
- The attention prompt never receives a forced hold.
- Initial load and checkpoint load reveal current choices immediately.
- No long pause may trap the player. Continue, panel click, Space, and Enter end it without dispatching a narrative action.

## Pause ladder

All values are milliseconds in content.

|  Hold | Nodes                                                                                                                                                                                                                |
| ----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10000 | `sample_opening_maintenance`, `sample_gennady_workers_claim`, `sample_signal_service_interval`, `sample_post_report_quiet`, `sample_private_claim_decision`                                                          |
| 12000 | `sample_opening_tea_set`, `sample_nikolai_responsibility`, `sample_arkady_emergency_claim`, `sample_signal_tea_served`, `sample_glass_overturned`, `sample_attention_arkady_direct`, `sample_gennady_claim_repeated` |
| 14000 | `sample_opening_tv_reflection`                                                                                                                                                                                       |
| 15000 | `sample_opening_signal_tuned`, `sample_signal_tuned`, `sample_signal_lev_listening`, `sample_attention_tv_direct`, `sample_attention_galina_direct`, `sample_arkady_contradiction_response`                          |
| 18000 | `sample_silence_arkady_qualifies`, `sample_gennady_accident_approach`, `sample_gennady_claim_preserved`                                                                                                              |
| 30000 | `sample_opening_music_finishes`, `sample_signal_phrase_ends`                                                                                                                                                         |
| 45000 | `sample_silence_gennady_continues`                                                                                                                                                                                   |
| 60000 | `sample_post_report_resolves`                                                                                                                                                                                        |

The 60 second beat follows the player's post-report Observe, Serve, Tune, or Wait action. The four actions become available after a 10 second quiet lead-in. The minute therefore plays as the consequence of a chosen physical action, not an empty lock before the player can act.

## Pause behavior

- Paint the new line, pose, object state, television state, and room sound immediately.
- Withhold the next choices for the authored duration.
- Show a small `Continue` control during the hold.
- Panel click, Continue, Space, or Enter reveals choices within 100 milliseconds.
- Skip does not dispatch a choice, move the clock, alter action history, or change save state.
- Opening the Pause menu freezes the remaining presentation time.
- Hiding the document freezes the remaining presentation time.
- Resume continues the remaining duration rather than restarting or consuming it.
- Checkpoint load reveals choices immediately because presentation time is not serialized.
- Do not display a countdown. This is breathing room, not a deadline.

## Pacing preference

Add a separate setting:

- `Full`: authored duration, up to 60 seconds.
- `Brief`: cap every hold at 5 seconds.
- `Immediate`: reveal choices without a hold.

The setting is independent from reduced motion. Reduced motion freezes nonessential Pixi movement and suppresses incidental off-screen cues, but it does not require silence or immediate text unless the player chooses that pacing preference.

## Patron interaction

Add eight bounded patron exchanges at existing branch points. They must preserve current clock costs and rejoin the same routes. Each exchange should reveal a habit, uncertainty, labor detail, contradiction, or social tactic. No exchange exists only to add words.

Use established behavior:

- Nikolai aligns his glass and pauses before names.
- Lev listens toward signal changes and taps a restrained rhythm.
- Arkady straightens papers when his certainty is challenged.
- Gennady protects the photograph and worries his injured finger.
- Galina performs stock and service work while deciding when to interrupt.

## Room motion

- Characters remain still for long stretches.
- Blinks are asynchronous at roughly 16 to 21 seconds.
- One-pixel seated posture settles occur roughly every 47 to 58 seconds.
- Two table glasses make rare one-pixel nudges on separate 41 and 54 second cycles, then return to their exact anchors.
- Existing focused and authored poses override ambient idles.
- Reduced motion freezes all new prop and character movement.
- Preserve whole-pixel positions, camera, layer order, occlusion, palette, and anchor geometry.

## Room sound

- Add a quiet synthesized service-zone ventilation and refrigeration bed.
- Treat refrigeration placement, exact model, cycle, and audibility as provisional. Do not name a device.
- Schedule sparse deterministic glass, chair, and telephone-relay cues 24 to 49 seconds apart with no immediate repeat.
- Suppress incidental cues under reduced motion or low-effects mode while retaining a quieter steady room bed.
- Pause, hidden document, disable, and disposal suspend the ambience timer and AudioContext.
- Caption the significant telephone relay click. Incidental cues may remain caption-ready without interrupting dialogue.
- Keep the television and radio/music as separate stateful sources.

## Historical constraints

- Use low service-zone air bleed, not a loud industrial fan in the patron room.
- Use one socially motivated chair or glass sound, not a foley carousel.
- Do not imply a verified telephone model or iconic bell cadence.
- Do not return to nonstop folk standards, endless static, constant smoke, heavy fluorescent flicker, theatrical grime, or generic propaganda.

Historical support is recorded under `FACILITY-001`, `FACILITY-002`, `FURNITURE-001`, and `TABLEWARE-001` in `research/HISTORICAL_LEDGER.csv`.

## Acceptance

- Schema accepts integer holds through 60000 and rejects 60001.
- Content test validates the exact hold map.
- Full, Brief, and Immediate pacing modes pass focused tests.
- Natural completion and all skip paths leave authoritative narrative state unchanged.
- Pause and hidden-tab tests prove remaining time freezes.
- No two 30 second or longer holds occur without a player action between them.
- Every 30 second or longer hold follows Wait, Silence, or a practical action.
- Ambient motion and audio are deterministic and never create duplicate timers.
- Reduced motion freezes nonessential movement and suppresses incidental cues.
- Keyboard-only play and save/load remain equivalent.
- Canonical long-pause states pass at 1920 by 1080 and 1366 by 768.
- Three consecutive final browser and visual runs pass without timeout inflation.
