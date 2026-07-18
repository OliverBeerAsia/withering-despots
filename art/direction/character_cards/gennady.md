# Design card — char_gennady (ART_BIBLE C0)

Gennady Mikhailovich Zorin — skilled factory turner and union organizer.

## Identity

- **Exact age:** 62 (youngest patron; must read a clear decade younger than the others)
- **Height / build:** 1.70 m, thick through shoulders and forearms; workman's mass in the
  upper body, solid belly, strong neck. Forearms are the widest of the cast.
- **Posture:** permanent forward lean — elbows claim the table, torso wedges over it.
  Even standing he leads with the chest, weight on the balls of the feet.
- **Face shape:** broad pentagon; wide cheekbones, heavy chin.
- **Nose:** thick, straight, slightly bulbous tip (2–3 px).
- **Jaw:** wide, undershot slightly when arguing.
- **Brow:** thick dark-gray, expressive, often one raised.
- **Ears:** medium, slightly cauliflowered left ear (1 px irregularity — shop accident).
- **Hairline:** receding at temples only; coarse dark-gray hair (`soot_2` body, `soot_3` lit),
  cut short, never combed.
- **Facial hair:** clean-shaven but always 1-day shadow (`soot_2` tint plane on jaw).
- **Skin value / undertone:** warm ruddy tan: `flesh_1` base, `flesh_2` on forearms and
  brow (he works lit), `flesh_0` shadow; knuckles marked with `soot_1` scar ticks.
  Old finger injury: right index finger drawn 1 px shorter/bent.

## Silhouette

- **Dominant silhouette feature:** leaning wedge — broad shoulders and forearms planted
  on the table, silhouette wider at the top and tipped forward. Rolled white sleeves break
  the dark mass at the elbows.
- vs others: Nikolai is broad but upright/buttoned; Gennady is open-collared, tipped,
  asymmetric. Lev is small; Arkady vertical; the women lighter.

## Clothing

- **Layers:** loose "formal" shirt worn as respect-for-company (`cream_3` lit, `cream_2`
  body, `cream_1` shade) — collar open two buttons, **sleeves rolled hard above the elbow**;
  dark sleeveless knit vest (`teal_1`, `teal_0` shade) hanging open; heavy work trousers
  (`soot_2`) with `wood_1` belt.
- **Shoe type:** heavy factory boots, leather, unpolished (`wood_0`, `soot_1` sole edge).
- **Construction notes:** shirt untucks 2 px on the right when he stands; vest never closes.

## Palette ids

`soot_0` outline · shirt `cream_3/cream_2/cream_1` · vest `teal_1/teal_0` · trousers
`soot_2/soot_1` · belt/boots `wood_1/wood_0` · skin `flesh_1/flesh_2/flesh_0` · hair
`soot_2/soot_3` · folding ruler `cream_2` + `soot_0` hinges · photo `cream_2/soot_2`.

## Behavior anchors

- **Habitual gesture:** flat-palm table slap for emphasis (full-pose swap, not loop);
  thumb rubs the old injury on the right index finger when quiet.
  Signature pose: mid-slap, other hand pointing with the folding ruler.
- **Prop:** wooden folding ruler; creased factory group photograph kept in shirt pocket.

## Prohibited changes

- Sleeves never rolled down; vest never buttoned; no jacket, no tie, no hat.
- The bent right index finger appears in every hand pose that shows the right hand.
- Never give him glasses or gray him to match the older men — he is 62, not 75.
- The photograph stays creased; it is never crisp.

## Pixel metrics (locked, at reference foot line — see environment_notes.md §Scale)

- Standing height: **84 px**
- Head: **15 px** tall (≈5.6 heads); shoulders: **24 px**, forearms 5 px wide (thickest)
- Seated crown-to-floor: **64 px**; lean-in pose drops crown to 60 px with elbows at
  table edge (39 px), elbows never intersecting the tabletop plane
- Idle: forearm weight-shift 1 px; fastest blink cadence of the patrons

## Historical source notes

Skilled Soviet metalworker dressed up for an evening out: good shirt, no suit, work boots
because they are the good boots. Folding ruler is the wooden zollstock type carried in the
thigh pocket. Factory photo: black-and-white brigade group in front of a lathe row.
