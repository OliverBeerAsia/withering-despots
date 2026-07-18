# Design card — char_galina (ART_BIBLE C0)

Galina — proprietor/senior barwoman of the café-bar. Counterpoint to Sasha; holds the
room's memory and its ledger. Never a background caretaker: she is staged as an equal
speaking figure with her own station and light.

## Identity

- **Exact age:** 57
- **Height / build:** 1.64 m, solid and capable; weight in hips and forearms from decades
  of crates and trays. Not stout-comic, not frail — load-bearing.
- **Posture:** straight-backed with locked knees when standing at the counter, weight on
  one hip when listening; arms fold high across the chest, notebook in hand.
- **Face shape:** rounded square, firm; broad cheeks that have dropped slightly.
- **Nose:** medium, straight, a little wide at the base.
- **Jaw:** soft but set; mouth held level — she gives nothing away first.
- **Brow:** plucked thin decades ago, now drawn as one skeptical 1 px arch (left higher).
- **Ears:** small, one visible under the bun, small dark earring dot (`red_0`, 1 px).
- **Hairline:** high and neat; hair dyed dark chestnut with gray at the temples showing
  (`wood_1` body, `soot_3` temple pixels), pinned in a **high tight bun**.
- **Facial hair:** none.
- **Skin value / undertone:** warm, lamplit: `flesh_1` base, `flesh_2` on cheekbones and
  forearms (she stands under the pendants), `flesh_0` restrained.

## Silhouette

- **Dominant silhouette feature:** the high bun plus high-folded arms — a keyed-up,
  self-contained block with a distinct round topknot. Reads instantly against all four men.
- vs Sasha: Galina is shorter, wider, arms folded, bun; Sasha is taller, slimmer,
  short-haired, hands busy.

## Clothing

- **Layers:** dark teal work dress (`teal_1` body, `teal_0` shade, `teal_2` lamplit plane),
  sleeves pushed to mid-forearm; full-front cream apron, clean but permanently
  tea-stained at the hem (`cream_2` body, `cream_1` shade, `amber_0` stain pixels, ties
  knotted in front); olive cardigan (`olive_1`) worn over the shoulders after midnight
  (scripted state change), sleeves empty.
- **Shoe type:** low black practical shoes with a strap (`soot_0`, `soot_2` highlight).
- **Construction notes:** apron neck loop visible; pencil behind right ear (2 px `amber_2`).

## Palette ids

`soot_0` outline · dress `teal_1/teal_0/teal_2` · apron `cream_2/cream_1` + `amber_0` stains
· cardigan `olive_1/olive_0` · hair `wood_1` + `soot_3` temples · skin `flesh_1/flesh_2/flesh_0`
· notebook `cream_2` cover with `soot_0` ruled edge · pencil `amber_2`.

## Behavior anchors

- **Habitual gesture:** flips the stock notebook open one-handed and marks it without
  looking down; counts glasses on a table by pointing the pencil, lips still.
  Signature pose: arms folded high, pencil hand tapping her opposite elbow.
- **Prop:** stock notebook (soft cover, rubber band around it) and pencil.

## Prohibited changes

- The bun never comes down; no headscarf (avoid the babushka stereotype entirely).
- Apron is never removed while the bar is open; cardigan appears only after midnight.
- Never stage her carrying a tray for a patron who is speaking — she stops and listens
  as an equal, work suspended.
- No rings except one thin wedding band line (`amber_2`, 1 px, left hand).

## Pixel metrics (locked, at reference foot line — see environment_notes.md §Scale)

- Standing height: **82 px** (bun adds +2 px within this total)
- Head: **14 px** tall incl. bun base (≈5.9 heads); shoulders: **20 px**
- Seated crown-to-floor: **62 px** (she sits rarely — one late-night scripted scene)
- Idle: weight-shift hip swap every ~8 s (2-frame); notebook flip is a pose swap

## Historical source notes

Soviet public-catering senior staff: state-issue work dress with private apron over it,
personal notebook because the official ledger and the real ledger differ. Pencil, not pen —
entries get erased.
