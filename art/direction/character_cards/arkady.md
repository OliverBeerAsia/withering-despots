# Design card — char_arkady (ART_BIBLE C0)

Arkady Sergeyevich Belov — retired district Party committee official. **Pilot character:**
this package must pass the identity + seating gate before any other character is produced.

## Identity

- **Exact age:** 72
- **Height / build:** 1.78 m, thin, narrow-framed; weight carried nowhere — a coat hanger of a man.
- **Posture:** spine straight by will, but the head sits 2–3 px forward of the chest line on a
  long neck. Sits upright at the table like a man chairing a meeting.
- **Face shape:** long, narrow oval; high flat forehead; hollow cheeks (single `flesh_0` plane each).
- **Nose:** long, thin, straight; 1 px wide at bridge, 2 px at tip.
- **Jaw:** narrow, slightly receding; loose skin under chin (1 px `flesh_0` sag line).
- **Brow:** thin, high, habitually slightly raised — polite attention.
- **Ears:** large, flat against the skull, visibly high because of the long neck.
- **Hairline:** deep M-recession into a thin combed-back crown; scalp shows through.
- **Hair / facial hair:** fine white-gray (`soot_4` lit, `soot_3` shade), combed back precisely.
  Clean-shaven, always.
- **Skin value / undertone:** palest of the cast, gray undertone: `flesh_1` base kept small,
  large `flesh_0` planes, shadow edges cooled with `soot_3`. `flesh_2` only 1–2 px on forehead/nose.

## Silhouette

- **Dominant silhouette feature:** the tallest, narrowest figure in the room — a vertical
  pencil stroke with a small head pushed forward on a long neck. No hat, no bulk.
- vs others: Nikolai is broad, Gennady is wedge-shaped, Lev is short and hunched,
  Galina is solid with a high bun, Sasha is upright and young. Nobody else is a pure vertical.

## Clothing

- **Layers:** carefully preserved single-breasted 1970s suit, gray (`soot_3` lit, `soot_2`
  shade, `soot_1` folds); under it a cream shirt (`cream_3`/`cream_2`) buttoned to the top;
  narrow dark tie (`olive_0`). Jacket stays on and buttoned all night. Fabric reads pressed:
  long unbroken planes, minimal fold lines.
- **Shoe type:** narrow black leather oxfords, polished (`soot_0`, 1 px `soot_3` highlight).
- **Construction notes:** lapels narrow; sleeves end exactly at wrist showing 1 px of shirt cuff.

## Palette ids

`soot_0` outline · suit `soot_3/soot_2/soot_1` · shirt `cream_3/cream_2` · tie `olive_0`
· skin `flesh_1/flesh_0` + `soot_3` cool edge · hair `soot_4/soot_3` · wallet `wood_1/wood_0`
· Party card `red_1/red_0`.

## Behavior anchors

- **Habitual gesture:** squares papers/objects on the table edge; smooths the document
  wallet flat with both palms. Signature pose: one finger raised slightly while correcting a term.
- **Prop:** worn leather document wallet (dark honey leather, `wood_1`), inside it the Party
  card (`red_1` — one of only two red accents in the room; keep it under 20 px²).

## Prohibited changes

- Never hatless→hatted, never unbutton the jacket until the scripted late-night exhausted pose.
- No medals, no pins, no pocket square, no glasses.
- Do not thicken the neck or widen the shoulders; the frailty is the point.
- Tie color never changes; suit is never blue or brown.

## Pixel metrics (locked, at reference foot line — see environment_notes.md §Scale)

- Standing height: **90 px** (drawn from 93 straight; −3 for forward head/neck)
- Head: **15 px** tall (≈6.0 heads); shoulders: **17 px** wide (narrowest of cast)
- Seated crown-to-floor: **68 px**; pelvis on 24 px seat plane; knees at 24 px
- Idle: 1 px breathing lift of chest/head, asynchronous blink only

## Historical source notes

Late-Soviet nomenklatura retirement wear: preserved 1970s wool suit, no western cut, no
logos. Party card is the small maroon booklet format. Document wallet, not briefcase, for
a man who no longer has an office.
