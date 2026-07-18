# Design card — char_nikolai (ART_BIBLE C0)

Nikolai Fyodorovich Chernov — retired army colonel (logistics and armored units).

## Identity

- **Exact age:** 70
- **Height / build:** 1.76 m, barrel chest softened by age; heavy bones, thick wrists,
  big square hands. Weight is in the torso, legs comparatively thin.
- **Posture:** parade-rigid neck and shoulders — the head does not turn independently,
  the whole torso turns. Sits square to the table, both feet planted flat.
- **Face shape:** wide square skull, flat cheekbones, short forehead.
- **Nose:** broad, once broken; flattened bridge (2 px straight block).
- **Jaw:** heavy, wide, held tight; jowls beginning (`flesh_0` corner planes).
- **Brow:** straight horizontal bar, low over the eyes; drawn as a single 1 px line.
- **Ears:** small for the head, close-set.
- **Hairline:** full, iron-gray, cut short back and sides, brushed flat left-to-right
  (`soot_3` body, `soot_4` lit).
- **Facial hair:** trimmed gray moustache, straight, no wider than the mouth.
- **Skin value / undertone:** weathered red-brown; largest `flesh_0` coverage of the cast,
  `flesh_1` mids, cheeks and nose carry 1–2 px of `red_0` broken capillary tone.

## Silhouette

- **Dominant silhouette feature:** widest shoulders in the room; rectangular monolith,
  no neck indent — head sits directly in the shoulder mass. Jacket buttoned too long
  into the evening keeps the block unbroken.
- vs others: Gennady is also wide but wedge-shaped and leaning; Nikolai is vertical and
  symmetric. Arkady is narrow; Lev short; the women read lighter.

## Clothing

- **Layers:** dark olive civilian jacket of military cut (`olive_1` body, `olive_0` shade,
  `olive_2` lamplit plane), **buttoned**, over a cream shirt (`cream_2`) and no tie; heavy
  dark trousers (`soot_2`) with a pressed crease (1 px `soot_3`).
  No insignia, no ribbons — the medal case stays closed on the table.
- **Shoe type:** black army-style low boots, polished (`soot_0`, `soot_3` toe highlight).
- **Construction notes:** jacket strains slightly at the middle button (1 px pull-fold each side).

## Palette ids

`soot_0` outline · jacket `olive_1/olive_0/olive_2` · shirt `cream_2` · trousers `soot_2/soot_1`
· skin `flesh_1/flesh_0` + `red_0` capillary pixels · hair/moustache `soot_3/soot_4` ·
medal case `wood_1` with `soot_0` seam · tea glass `amber_1` in `soot_3` holder.

## Behavior anchors

- **Habitual gesture:** aligns his glass square with the table edge after every sip;
  stands when the broadcast anthem or official announcements play.
  Signature pose: standing at attention facing the TV, hands at seams.
- **Prop:** closed medal case (small wooden box, never opened on screen).

## Prohibited changes

- The medal case never opens; no medals ever visible on him.
- Jacket stays buttoned until the scripted mid-night break (tunnel deaths); after that
  scene the top button may be open — that is the only costume state change in the slice.
- No hat indoors, no slouch, no crossed legs.
- Moustache never grows into a beard; hair never longer.

## Pixel metrics (locked, at reference foot line — see environment_notes.md §Scale)

- Standing height: **88 px**
- Head: **16 px** tall (≈5.5 heads); shoulders: **26 px** wide (widest of cast)
- Seated crown-to-floor: **67 px**; both boots flat on floor line, knees square at 24 px
- Idle: breathing is shoulder rise 1 px (not head bob); blink slowest of cast

## Historical source notes

Retired Soviet officer in civilian dress: military-cut jacket without insignia, officer's
bearing kept in the neck and hands. Tea from a glass in a podstakannik holder, not vodka,
when his hands shake. Medal case is the standard presentation box, dark wood.
