# Environment layer notes — café-bar "The Shift", evening base state

Authority: `art/blockout/bar_perspective.svg` for all geometry; `content/graybox-layout.json`
for anchors/hotspots. Native canvas 640×360 (blockout logical coords ÷3). Horizon y=120
native. Never move a wall line, door, seat anchor, or fixture. Palette:
`art/palette/wd-palette-v1.json` — see the .md for per-family use.

## Scale (locked — cast and prop metrics derive from this)

- Eye height 1.45 m ⇒ px-per-metre at a foot line y_f (native): **S = (y_f − 120) / 1.45**.
- Reference cast depth: principal patron zone (tables A/B, counter), foot line
  **y_f = 196 native** ⇒ S = 52.4 px/m. A 1.75 m man = 92 px, 1.53 m = 80 px:
  this is the source of the 80–92 px standing band in the character cards.
- All six character packages are authored at this one scale. No runtime scaling of
  character sprites; front-row tables (C/D/E) accept the slight over-compression.
- Derived constants at cast scale: stool/chair seat plane **24 px**; tabletop **39 px**;
  counter top **55 px**; seated elbow height ≈ 42 px. Slice props follow these.

## Light logic (three sources, fixed)

1. **Warm patron zone:** low pendant lamps over tables A–E. Pools of `amber_2` on
   tabletops and upper faces, falling to `amber_1`/`amber_0` at pool edge, `soot_1` beyond.
   Light falls top-down: every table is a bright ellipse in a dim room.
2. **Cold counter fluorescent:** one tube behind the counter (Galina/Sasha work light).
   `teal_3`/`cyan_1` cast on the rear shelf and counter back edge only. It must visibly
   not match the patron warmth — this is the room's political geography in light.
3. **CRT accent:** TV high right. Screen states live in the prop; the housing zone of
   `bg_mid` gets a static faint `cyan_0` rim. Dynamic face/room flicker is
   `fx_tv_light_mask`, engine-blended — never bake flicker into layers.

Door-open exterior light (`teal_0`→`cyan_0` streak from street entrance) and pre-dawn shift
are separate engine overlays. Bake none of them.

## Layer: bg_far (walls, ceiling, rear shelves)

- **Contains:** rear wall (240–1680 / 150–620 logical), left/right walls, ceiling plane,
  nicotine gradient (ceiling `amber_0`+`soot_1`, walls `cream_1`→`cream_0` downward),
  teal wainscot band (`teal_1`, chips showing `cream_0`) around the whole room,
  service corridor recess and its door frame, street entrance recess, rear shelving
  behind the counter (bottles as simple value shapes: `amber_0/1`, `teal_0`, `soot_1` —
  no labels), wall clock (hands are SVG/DOM, face only), one felt notice board (`olive_2`)
  with blank pinned papers (`cream_2`), one small wall pennant (`red_0`, lit edge `red_1` —
  one of the room's two red accents).
- **Wear:** water stain top-right corner of rear wall (`cream_0`/`soot_2` blot), paint
  chips along the wainscot top line, a patched plaster rectangle that doesn't match
  (`cream_2` on `cream_1`), darker halo above each pendant.
- **Omit:** any text/lettering, posters with faces, window (there is none — the street
  door is the only exterior), strong verticals directly behind patron head positions
  (north 920, east 1310 logical), detail brighter than `cream_2` except lamp fittings.

## Layer: bg_mid (counter rear, tables, TV housing)

- **Contains:** counter body per blockout (top `wood_2` with `wood_3` sheen line,
  front `wood_2`/`wood_1` panels), back-counter working surface with the fluorescent
  cast (`teal_3` edge), telephone shelf (phone itself is a prop sprite at
  anchor-telephone), all five table tops + central legs (`wood_2/1/0`, `wood_3` rim
  toward lamp), TV wall bracket and housing shell (`soot_2` box, `cyan_0` rim; the
  screen area stays a transparent hole for the screen-state prop), service door leaf
  (`teal_1`, `teal_0` panels, `soot_4` handle), street door leaf with dark glass
  (`teal_0` frame, `soot_0` glass, one `cyan_0` streetlight streak).
- **Wear:** counter front kick line scuffed to bare wood (`wood_1` over `wood_2`),
  mismatched table generation — tables C/D older, darker (`wood_1` tops) than A/B/E;
  one table leg repaired with wire (`soot_4` ticks); cigarette burn dots (`soot_0`)
  on tabletop rims.
- **Omit:** chairs (they belong to seat_back/furniture_front), glasses/ashtrays/bottles
  on tables (anchored prop sprites), any baked shadow of characters.

## Layer: seat_back (chair/stool rear occlusion)

- **Contains:** for each of the 18 seat anchors, the chair parts that appear BEHIND a
  seated character: rear legs, seat plane far edge, backrest. Two furniture types only:
  bentwood-style chairs at tables (backrest hoop `wood_1`, `soot_0` contour) and two
  counter stools (no backrest — seat disc `wood_1`).
- Seat planes sit 24 px above each seat's foot line (see Scale); align exactly so
  character pelvis rows read as seated, per ART_BIBLE C5.
- Chairs at empty seats are fully drawn here (plus their front in furniture_front).
- **Omit:** cushions, chair variety beyond the two types, perspective-breaking side views.

## Layer: furniture_front (front occlusion — critical for seating)

- **Contains:** near edge of every tabletop (2–3 px strip + apron), chair front legs and
  seat front edge, chair backrests for seats where the character faces away from camera
  (south-side seats), counter front top strip that occludes Sasha's lower body at
  anchor-sasha-bar, stool front edges.
- This layer makes patrons sit IN the room. Verify with a character sprite at every
  principal anchor (north/east/south/west + counter) before submitting.
- **Omit:** anything higher than seated chest height; props.

## Layer: foreground (near counter edge — optional, keep thin)

- **Contains:** at most: the extreme near corner of the counter (bottom-left, `wood_1`
  with `soot_1` shade, slightly darkened as if under-lit) and one hanging pendant lamp
  edge at top of frame (`soot_2` shade, `amber_3` filament sliver).
- Purpose: depth cue only. Must never cover a hotspot, a seated face, or the subtitle
  safe region (y 280–347 native).
- **Omit if in doubt** — ART_BIBLE says do not over-frame; an empty foreground layer is
  acceptable.

## Global don'ts (all layers)

- No baked text anywhere (signage is SVG/DOM).
- No off-palette pixels; run the palette checker before queueing.
- No dithering on furniture edges or props; coarse 2×2 only inside large wall/floor fields.
- Verticals and horizontals must be clean single-color pixel runs after reduction
  (mandatory cluster-correction pass; inspect 100% and 800%).
- Keep negative space clean where hotspot labels and heads sit: above each patron
  anchor and around the TV and telephone hotspots.
- The room is worn but maintained: every wear mark implies a repair attempt nearby.
  Nothing broken-and-abandoned, nothing new.
