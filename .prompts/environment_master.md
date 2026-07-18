# Image Prompt Template — Empty Bar Environment Master

Use this template only after the floor plan, perspective blockout, material schedule, lighting diagram, reference index, and historical ledger have been approved.

Do not send the bracketed production notes as vague prose. Replace every bracket with an exact file path, measured value, or approved design choice.

---

## Required visual inputs

1. `[PATH_TO_APPROVED_PERSPECTIVE_BLOCKOUT]` — immutable geometry and composition truth.
2. `[PATH_TO_MATERIAL_REFERENCE_BOARD]` — material and wear truth; not a composition reference.
3. `[PATH_TO_LIGHTING_DIAGRAM]` — light-source position and temperature truth.
4. `[OPTIONAL_PATH_TO_APPROVED_STYLE_TARGET]` — only an original project target or licensed/internal reference.

For each input, tell the image tool what it controls. Do not rely on the image alone.

---

## Generation objective

Create one original, high-resolution, hand-painted 2D adventure-game environment showing the **empty interior** of the fictional Moscow café-bar `Кафе-бар «Смена»` on the evening of 21 August 1991.

The image is an environment layer for a fixed-camera narrative game. It must preserve the architecture, perspective, furniture placement, negative space, and camera of the supplied blockout exactly. This is not a concept-art redesign.

---

## Style direction

- Original late-1990s illustrated point-and-click adventure aesthetic.
- Carefully painted background with clean architectural drawing beneath it.
- Strong staging and prop readability at game scale.
- Rich but controlled local detail.
- Simplified planes of light and shadow rather than photoreal rendering.
- Slightly stylized object shapes, but no warped structure.
- Warm, lived-in public interior; maintained, repaired, and unevenly aged.
- Clean high-resolution source suitable for deterministic downsampling later.
- Do not imitate or reproduce any existing game's exact background, composition, brushwork signature, characters, or proprietary assets.

---

## Immutable geometry

Preserve these from the blockout:

- locked 16:9 camera and horizon line;
- all wall, ceiling, floor, door, and window edges;
- bar-counter footprint and height;
- five table positions and their seat planes;
- television location and housing silhouette;
- telephone location behind the counter;
- service door and corridor opening;
- street entrance;
- pendant and work-light positions;
- character placement clearances;
- subtitle-safe negative space.

No furniture may be added, removed, rotated, merged, or moved unless explicitly marked `[ALLOWED_CHANGE]`.

---

## Historically bounded room description

This is an ordinary state café-bar opened in 1968 and partly refurbished in 1982. It is not an elite hotel bar, a modern cocktail venue, a peasant tavern, a military bunker, a propaganda museum, or a ruined post-apocalyptic room.

Use only approved entries from `[PATH_TO_MATERIAL_SCHEDULE]`, including:

- `[WALL_AND_PANEL_MATERIAL]`;
- `[FLOOR_MATERIAL]`;
- `[COUNTER_MATERIAL]`;
- `[TABLE_AND_CHAIR_MATERIALS]`;
- `[UPHOLSTERY_COLOR_AND_WEAR]`;
- `[LIGHT_FIXTURE_MATERIALS]`;
- `[GLASSWARE_AND_SERVICE_OBJECT_CLASSES]`;
- `[REPAIR_AND_MISMATCH_NOTES]`.

Wear must follow use: rubbed counter edge, repaired chair, uneven varnish, small wall scuffs, and service-zone wear. Avoid theatrical decay, grime covering every surface, or clean nostalgia-museum restoration.

---

## Palette and lighting

- tobacco amber and varnished honey-brown as the warm base;
- dull cream walls;
- oxidized teal or muted green-blue upholstery;
- dark olive and graphite neutrals;
- restrained brick/dried-red accents;
- cold fluorescent service light behind the bar;
- amber patron-zone practical lights;
- television is dark or neutral in the base environment and will receive a runtime light overlay;
- physically coherent cast shadows from the lighting diagram;
- no cinematic teal-and-orange grade, bloom, neon, crushed black, or monochrome sepia.

---

## Empty-room and text rules

The image must contain:

- no people;
- no partial people;
- no human reflections;
- no human silhouettes outside the door;
- no faces in portraits;
- no words;
- no letters;
- no prices;
- no menus;
- no logos;
- no bottle labels;
- no pseudo-Cyrillic;
- no watermark or artist signature.

Leave all signage zones blank for later SVG/runtime text.

---

## Structural defect exclusions

Do not produce:

- impossible shelves or changing shelf depth;
- unsupported tabletops;
- chairs with fused legs, duplicate backs, or warped seats;
- counter edges that bend away from the perspective grid;
- lamps without attachment points;
- bottles or glasses melted together;
- repeated-object cloning artifacts;
- inconsistent ellipses;
- doors whose frames or handles do not align;
- shadows pointing toward incompatible light sources;
- modern LEDs, exposed-filament bulbs, boutique industrial fixtures, contemporary bar stools, flat-screen televisions, modern bottles, fashionable distressed brick, or post-Soviet national symbols;
- random medals, busts, flags, hammer-and-sickle wallpaper, or excessive propaganda decoration.

---

## Output request

Produce `[NUMBER_OF_CANDIDATES, RECOMMENDED 3]` candidates with the **same** geometry and composition. Vary only controlled surface treatment and small approved décor choices. Do not create alternate floor plans or camera angles.

Recommended output:

- 3840×2160 or the largest supported 16:9 canvas;
- clean, unlettered illustration;
- no people;
- no depth-of-field blur;
- no frame or border.

---

## Codex post-generation procedure

Codex must not call a candidate approved. It must:

1. save this exact completed prompt to `.prompts/runs/[DATE]_env_bar_empty_[RUN_ID].md`;
2. place outputs in `art/review_queue/env_bar/[RUN_ID]/`;
3. overlay each candidate with the blockout at 50% opacity;
4. reject structural drift before judging color;
5. inspect at 100% for pseudo-text, malformed repeated objects, and impossible supports;
6. create a defect table for every candidate;
7. choose one base only if it passes geometry;
8. correct the base with targeted edits or paintover;
9. split it into approved layer groups;
10. integrate it into the running game and inspect both canonical resolutions.

---

## Required defect-table format

| Candidate | Region | Category | Severity | Defect or pass observation | Required correction | Accept/reject |
|---|---|---|---|---|---|---|

Categories: geometry, perspective, material, lighting, historical plausibility, text artifact, repeated-object integrity, composition, UI readability.
