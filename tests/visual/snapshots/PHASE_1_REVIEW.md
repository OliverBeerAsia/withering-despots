# Phase 1 visual review

Date: 2026-07-16

These captures verify the geometric graybox integration only. They are not art approval and do not establish a production visual target.

## Canonical captures

| Pass                     | 1920 by 1080                                     | 1366 by 768                                     |
| ------------------------ | ------------------------------------------------ | ----------------------------------------------- |
| First implementation     | `tests/screenshots/phase-1-pass-1-1920x1080.png` | `tests/screenshots/phase-1-pass-1-1366x768.png` |
| Corrected implementation | `tests/screenshots/phase-1-pass-2-1920x1080.png` | `tests/screenshots/phase-1-pass-2-1366x768.png` |

Final canonical captures cover two states at each viewport:

| State              | 1920 by 1080                                              | 1366 by 768                                              |
| ------------------ | --------------------------------------------------------- | -------------------------------------------------------- |
| Observe and focus  | `tests/screenshots/phase-1-final-observe-1920x1080.png`   | `tests/screenshots/phase-1-final-observe-1366x768.png`   |
| Attention conflict | `tests/screenshots/phase-1-final-attention-1920x1080.png` | `tests/screenshots/phase-1-final-attention-1366x768.png` |

## Pass 1 observations

1. All four patron heads and silhouettes remain separated at both canonical resolutions. The north, east, south, and west targets can be distinguished without relying on labels.
2. The rear-left counter is immediately legible as the service zone, but its foreground mass is deliberately dominant and partially frames the west side of the room.
3. The television and telephone occupy distinct high-right and behind-counter sight lines. Their simultaneous hotspot rectangles do not overlap.
4. The bottom subtitle-safe band remains clear. The keyboard hint is confined to the bottom-right edge, and contextual choice sheets sit above the safe-band boundary.
5. The focused north-patron label remains readable at both resolutions and does not collide with another head. It crosses table geometry only, which is acceptable for the provisional focus overlay.
6. Patron hotspot polygons are disjoint in source data and in browser bounding boxes. Their low-opacity resting outlines do not compete with the room, while the focused target has a strong double-contrast ring.
7. The collapsed development panel was unnecessarily wide and obscured the television sight line, especially at 1366 by 768.
8. The first browser interaction pass also found two nonvisual focus defects: global Escape did not work before focus entered the overlay, and pointer focus could replace a hotspot before its click committed.

## Corrections

- Collapsed the development panel to its summary width so the television remains visible.
- Moved keyboard shortcut handling to the document boundary while preserving native dialog cancellation order.
- Suppressed reducer focus updates during pointer focus so mouse clicks commit without DOM replacement; keyboard and arrow focus behavior remains intact.
- Preserved explicit accessible names for the television and telephone attention markers and the complete five-verb outcome summary.

## Pass 2 result

The room, four heads, fixture sight lines, subtitle-safe space, and disjoint hotspot geometry remain stable at both canonical resolutions. The development toggle no longer masks the television. Keyboard-only completion, pointer activation, pause/settings time freeze, and the visual baselines pass. This is a Phase 1 structural pass, not final UI or art approval.

## Final correction and result

Rapid state updates initially exposed black or cropped PixiJS layers in the attention-conflict capture. The scene now draws each state shape once and changes only tint, position, and visibility. Four repeated visual comparisons pass without corruption.

The final captures confirm:

1. Runtime geometry follows the canonical room polygons and anchors.
2. All four heads remain separated, and Sasha reads behind the counter.
3. The 18 seat markers remain identifiable placement aids rather than implied final chairs.
4. Television and telephone identities read quickly at both viewports.
5. Attention choices are spatial buttons attached to those fixtures, not a bottom menu.
6. The subtitle-safe band remains clear.
7. The 1366 by 768 view retains readable objectives, labels, focus, and keyboard guidance.
8. The answered-exchange gesture and tea cup visibly carry earlier choices into the attention state.

These images pass the Phase 1 blockout gate only. They are not final environment, character, prop, typography, or interface art.
