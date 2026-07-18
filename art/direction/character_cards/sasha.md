# Design card — char_sasha (ART_BIBLE C0)

Sasha — player character; young barwoman, observer. The camera's proxy: her design must
read instantly at any anchor, from behind the counter to the TV corner, and stay quieter
in color than any patron so the room remains the subject.

## Identity

- **Exact age:** 26
- **Height / build:** 1.70 m, slim but not delicate; quick, economical mass; shoulders
  slightly squared from carrying crates.
- **Posture:** upright and still — she plants and watches. Weight even on both feet;
  hands find work (cloth, glass) when idle. Never slouches, never leans on patrons' tables.
- **Face shape:** oval, slightly wide at the cheekbones; the youngest face by 30 years —
  smooth planes, no interior wrinkle lines at all.
- **Nose:** small, straight (1 px bridge).
- **Jaw:** clean, lightly pointed chin.
- **Brow:** level, dark, 1 px; her skepticism is in stillness, not arching.
- **Ears:** small, visible below the hair on the right side.
- **Hairline:** low and even; dark hair (`soot_1`, `soot_2` lit plane) in a **short practical
  bob cut above the collar**, tucked behind the right ear.
- **Facial hair:** none.
- **Skin value / undertone:** clearest skin of the cast: `flesh_1` base with the largest
  `flesh_2` planes (forehead, cheek toward lamp), minimal `flesh_0`.

## Silhouette

- **Dominant silhouette feature:** the one upright, slim, still vertical among heavy men —
  short bob head shape, straight shoulder line, sleeves rolled, bar cloth hanging from
  the waist apron breaking the hip line.
- vs Galina: taller, slimmer, short hair vs bun, half-apron vs full apron, hands busy vs folded.

## Clothing

- **Layers:** cream shirt (`cream_3` lit, `cream_2` body, `cream_1` shade), sleeves rolled
  below the elbow, collar open one button; dark olive fitted waistcoat (`olive_1`, `olive_0`
  shade) — her one "uniform" piece; dark straight trousers (`soot_2`); **half-apron at the
  waist** (`cream_1`) with bar cloth tucked in it (`cream_2`).
- **Shoe type:** flat black lace-ups, silent soles (`soot_0`, 1 px `soot_2`).
- **Construction notes:** waistcoat has 3 visible buttons (`soot_0` dots); shirt stays tucked.

## Palette ids

`soot_0` outline · shirt `cream_3/cream_2/cream_1` · waistcoat `olive_1/olive_0` · trousers
`soot_2/soot_1` · apron/cloth `cream_1/cream_2` · hair `soot_1/soot_2` · skin
`flesh_1/flesh_2` minimal `flesh_0`.

## Behavior anchors

- **Habitual gesture:** polishes a glass slowly while watching a speaker — the polishing
  stops when she hears a lie. Signature pose: glass and cloth held still at chest height,
  eyes on the table across the room.
- **Prop:** bar cloth and a faceted glass; (strand props — film canister / dictionary /
  red pencil — are UI-level, never drawn on the sprite).

## Prohibited changes

- No jewelry, no makeup accents, no skirt, no long hair, no smile as default mouth.
- The waistcoat never comes off; sleeves never rolled above the elbow.
- Never stage her seated at patron tables in the slice; she stands or leans at her own zone.
- Do not brighten her clothing — she must stay lower-chroma than every patron.

## Pixel metrics (locked, at reference foot line — see environment_notes.md §Scale)

- Standing height: **86 px**
- Head: **14 px** (≈6.1 heads — least caricatured of cast); shoulders: **18 px**
- Seated crown-to-floor: **65 px** (rare; keep standing poses primary)
- Idle: polishing loop 2-frame slow cycle; breathing 1 px; blink asynchronous with patrons
- Walk: 4-frame cycle max at native scale, feet snapping to whole pixels along routes

## Historical source notes

Young 1991 Moscow woman working evenings: practical western-leaning cut (bob, waistcoat)
without any imported-logo items; state bar half-apron. Nothing decorative — everything on
her earns its keep.
