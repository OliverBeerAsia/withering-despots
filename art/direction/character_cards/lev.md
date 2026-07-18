# Design card — char_lev (ART_BIBLE C0)

Lev Borisovich Rubin — retired broadcast and television engineer.

## Identity

- **Exact age:** 68
- **Height / build:** 1.62 m, compact and wiry; small frame with working hands too big for it.
- **Posture:** slight permanent stoop from bench work; head habitually tilted (1 px) toward
  any sound source — the TV, the phone, a voice. Sits perched forward on the chair edge.
- **Face shape:** round-square, short; everything gathered around the glasses.
- **Nose:** short, fleshy, slightly upturned; 2 px wide.
- **Jaw:** soft, round, small chin.
- **Brow:** heavy and mobile — the expressive feature above the glasses; drawn 1 px thick.
- **Ears:** prominent, stick out (they read at silhouette scale — keep them).
- **Hairline:** bald crown with a low horseshoe fringe of curly gray (`soot_3`), untidy.
- **Hair / facial hair:** 3-day white stubble field on jaw (`soot_4` sparse pixels over `flesh_0`).
- **Skin value / undertone:** ruddy-warm: `flesh_1` base, generous `flesh_0`, `flesh_2`
  glints on bald crown, nose tip, and glasses-lit cheeks.

## Silhouette

- **Dominant silhouette feature:** shortest figure; hunched comma-shape with large round
  glasses reading as two notches in the head profile, and big ears.
- vs others: only short+round figure; Gennady is bigger and wedge-straight; Galina is
  taller with a bun; nobody else wears glasses.

## Clothing

- **Layers:** old brown-olive work jacket (`olive_1` body, `olive_0` shade, `olive_2` lamplit
  shoulder) worn open; under it a checked shirt suggested by 2×2 texture of
  `cream_2`/`cream_1`, **sleeves rolled to the elbow** even under the jacket — forearms
  visible. Dark trousers `soot_2`, shiny at the knees (`soot_3` patch).
- **Shoe type:** scuffed brown lace-up work shoes (`wood_1`, `wood_0` sole).
- **Construction notes:** jacket pockets bulge (radio, wire); left chest pocket holds the
  screwdriver — 2 px of `soot_4` + `red_0` handle visible.

## Palette ids

`soot_0` outline · jacket `olive_1/olive_0/olive_2` · shirt `cream_2/cream_1` · trousers
`soot_2/soot_1` · skin `flesh_1/flesh_0/flesh_2` · fringe/stubble `soot_3/soot_4` · glasses
frame `soot_0`, lens `cyan_0` (1 px `cyan_2` glint only during TV bright frames) · radio
`soot_2` + `soot_4` dial.

## Behavior anchors

- **Habitual gesture:** taps a rhythm on the table with two fingers while thinking;
  tilts head toward signal changes. Signature pose: holding the pocket radio to his ear,
  eyes elsewhere.
- **Prop:** pocket radio with a hand-twisted wire antenna; small screwdriver in chest pocket.

## Prohibited changes

- Glasses never come off (cleaning them, scripted, is the one exception).
- Sleeves are never rolled down; jacket is never buttoned.
- No beard growth beyond stubble, no hat, no tie ever.
- Do not straighten his back — even standing he keeps the stoop.

## Pixel metrics (locked, at reference foot line — see environment_notes.md §Scale)

- Standing height: **80 px** (stooped; 84 straight)
- Head: **15 px** tall including glasses (≈5.3 heads — most caricatured of cast);
  shoulders: **19 px**
- Seated crown-to-floor: **60 px**; perched forward of seat center by 2 px
- Idle: head-tilt micro-shift 1 px toward TV on channel change; finger-tap 2-frame cycle

## Historical source notes

Soviet radio/TV engineer off duty: personal work jacket over home shirt, tools carried by
habit not need. Pocket radio is a small Latvian-style transistor set with leather case worn
to the metal.
