# WD Palette v1 — usage notes

Locked production palette, 32 colors, 9 material families. Source of truth:
`art/palette/wd-palette-v1.json`. Every approved PNG must contain only these hexes.
Index 0 in each family is darkest; the last index is lightest. Sprites/scripts reference
colors by **id**, never raw hex.

Global rules

- Mood is one step darker and grayer than the graybox: dominant screen values sit in the
  soot_1–soot_3 / wood_1–wood_2 / teal_1 band. `cream_3`, `amber_3`, `cyan_2` are the only
  values brighter than mid; they must stay small (light pools, screen, paper UI).
- Warm zone (patrons, tables, counter top) = amber + wood + cream + flesh.
  Cold zone (behind counter, TV, night exterior) = teal + cyan + soot.
- No pure black, no pure white anywhere. `soot_0` is the darkest, `cream_3`/`cyan_2` the lightest.
- Dithering: coarse 2×2 checker only, and only inside large wall/floor fields between
  adjacent ramp steps. Never dither faces, hands, props, or UI.

## soot — graphite/soot neutrals (5 steps)

| id     | hex     | use                                                                                                                         |
| ------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| soot_0 | #131114 | The ink. Character contours, UI text/borders on cream, night in door/window glass, deepest shadow under counter and tables. |
| soot_1 | #262227 | Big shadow masses: ceiling corners, floor far edges, dark hair, shadow side of dark clothing.                               |
| soot_2 | #3d383b | Mid graphite: trousers, TV housing, floor grout lines, gray-hair shadow.                                                    |
| soot_3 | #5a524e | Worn warm gray: concrete floor body, Arkady's gray suit, ashtray, aluminum.                                                 |
| soot_4 | #7d7268 | Lightest gray: smoke wisps, dust in light shafts, plaster half-tone, aged white hair.                                       |

## cream — dull cream (4 steps)

Plaster, paper, textiles, UI paper. `cream_3` is also the game's stand-in for "white"
(cigarettes, shirt highlights, doilies).

| id      | hex     | use                                                     |
| ------- | ------- | ------------------------------------------------------- |
| cream_0 | #665a45 | cream materials in shadow                               |
| cream_1 | #8c7d5f | plaster mid, shaded paper, apron shade                  |
| cream_2 | #b2a17c | wall plaster in lamplight, worn paper body              |
| cream_3 | #d8c69d | UI panel base, lamplit paper, shirt/cigarette highlight |

## amber — tobacco amber (4 steps)

The room's air. Nicotine-stained surfaces and warm light itself.

| id      | hex     | use                                                    |
| ------- | ------- | ------------------------------------------------------ |
| amber_0 | #57381c | stained ceiling shadow, dark tea, bottle shadow        |
| amber_1 | #855524 | stained upper walls, lampshade shade, strong tea       |
| amber_2 | #b47c31 | lamplight pools on tables and faces, brass, beer       |
| amber_3 | #dda549 | bulb/filament cores only — a few dozen pixels per shot |

## wood — varnished honey-brown (4 steps)

| id     | hex     | use                                             |
| ------ | ------- | ----------------------------------------------- |
| wood_0 | #2b1d12 | wood in shadow, chair legs, counter underside   |
| wood_1 | #46301c | table sides, wainscot shade, stool seats        |
| wood_2 | #654627 | varnished tabletops, counter front, door frames |
| wood_3 | #8a6435 | 1-px varnish sheen along lamplit edges only     |

## teal — oxidized teal (4 steps)

State paint: doors, wainscot, radiators, metal. Always slightly grayed, never mint.

| id     | hex     | use                                                   |
| ------ | ------- | ----------------------------------------------------- |
| teal_0 | #182a28 | painted metal shadow, exterior night through door     |
| teal_1 | #2a4540 | door body, painted wainscot/columns, radiator         |
| teal_2 | #416359 | painted surfaces in light, banquette upholstery       |
| teal_3 | #628072 | chip highlights, fluorescent-lit paint behind counter |

## olive — dark olive (3 steps)

Cloth family: jackets, cardigans, curtains.

| id      | hex     | use                                     |
| ------- | ------- | --------------------------------------- |
| olive_0 | #232617 | coat/curtain shadow                     |
| olive_1 | #3b4023 | jacket and cardigan body                |
| olive_2 | #596038 | lamplit cloth planes, felt notice board |

## red — brick / dried-blood accent (2 steps)

Strictly rationed: less than ~1% of any frame. Meaning: state, blood memory, emphasis.

| id    | hex     | use                                                      |
| ----- | ------- | -------------------------------------------------------- |
| red_0 | #56271f | shadowed pennant, book spines, brick, stamp ink dried    |
| red_1 | #83392b | Party card, wall pennant lit edge, UI stamp/alert accent |

## cyan — CRT accent (3 steps)

The only moving color. TV screen, its cast, and the counter fluorescent.

| id     | hex     | use                                                                                 |
| ------ | ------- | ----------------------------------------------------------------------------------- |
| cyan_0 | #1e4652 | dim screen field, phosphor shadow, cold bounce                                      |
| cyan_1 | #3d7f8c | broadcast glow body, fluorescent tube cast                                          |
| cyan_2 | #82c7cf | screen highlight/static frames; never on surfaces farther than ~1 table from the TV |

## flesh — skin (3 steps)

One shared skin ramp for the whole cast; age and complexion are drawn with plane shapes,
wrinkle lines (`soot_1`/`soot_0`), and how much `flesh_2` a face gets, not with new colors.
Older, grayer faces: larger `flesh_0` areas with `soot_3` on the shadow edge.
Sasha and Galina get the largest `flesh_2` planes (they face the lamps).

| id      | hex     | use                                        |
| ------- | ------- | ------------------------------------------ |
| flesh_0 | #6a4634 | shadow planes of faces/hands               |
| flesh_1 | #99674a | base skin                                  |
| flesh_2 | #c2926c | lamplit planes; sparing, never a full face |

## Cross-family recipes

- Tea in glass: amber_1 body, amber_0 depth, cream_3 rim highlight.
- Faceted glass (empty): teal_3 + soot_4 facets over background, cream_3 spark 1 px.
- Cigarette smoke: soot_4 body, cream_1 where it crosses lamplight.
- TV off: soot_1 screen, soot_2 housing. Static: cyan_0/cyan_1/cyan_2 coarse pattern.
- Night through street door: teal_0 + soot_0, one cyan_0 streetlamp streak.
- UI paper: cream_3 ground, soot_0 ink, cream_1 ruling, red_1 stamp accents.
