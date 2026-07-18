# Art Bible

## 1. Purpose

The art must feel authored, coherent, historically grounded, and deliberately composed. It must not resemble a collection of unrelated generated images. The most common failure modes—warped rooms, merged furniture, drifting faces, malformed hands, inconsistent clothing, modern décor, and illegible signage—are production defects, not acceptable “AI texture.”

The pipeline is designed so that Codex and image-generation tools solve one constrained visual problem at a time.

---

## 2. Creative target

### Main visual language

Create an original low-resolution illustrated adventure-game aesthetic with:

- carefully constructed environments corrected on a 640×360 pixel grid;
- mildly caricatured but anatomically coherent people;
- strong silhouettes readable at game scale;
- clean contour hierarchy;
- simplified planes of light and shadow;
- theatrical staging and locked perspective;
- rich local detail without visual noise;
- intentional pixel clusters, palette control, and whole-pixel placement at the canonical art resolution;
- no imitation of protected characters, exact backgrounds, or distinctive compositions from reference games.

Treat *Papers, Please* as a quality bar for systemic pressure, compact human writing, consequence clarity, tactile operations, and low-resolution readability. Do not copy its layout, palette, typography, characters, interface positions, inspection loop, narrative structure, pixel clusters, or assets.

### What to take from the reference family

Use these as design principles, not as copying instructions:

- **Sam & Max: Hit the Road:** bold silhouette separation, expressive posing, comic environmental shapes, readable props, and visual humor.
- **Broken Sword:** painterly location design, convincing architecture, warm color, clear walkable staging, and restrained character shading.
- **Related 1990s adventures:** economical animation, strong pose changes, foreground occlusion, memorable room composition, and interface clarity.

### Original differentiators

- late-Soviet material accuracy;
- amber/teal/brown palette with controlled red and CRT blue accents;
- aging public interior rather than fantasy, noir, or tourism imagery;
- memory scenes rendered as screen-print/cut-paper palimpsests;
- social observation and stillness rather than constant slapstick motion.

---

## 3. Style options

### Option A: Pixel-illustrated realism, recommended

- Backgrounds: architecturally controlled, palette-limited, and manually corrected at 640×360.
- Characters: clean pixel clusters, plane shading, and 5.5–6 head proportions.
- Animation: layered idle rigs plus full-pose swaps for major gestures.
- Source material: high-resolution drawing or generation is allowed, but it is not canonical until reduced and corrected on the native grid.
- Strength: tactile readability and controlled stillness suit the room and its constrained actions.
- Risk: fake pixelisation if a smooth painting is merely filtered without cluster cleanup.

### Option B — Theatrical cutaway — fallback for consistency

- Background: miniature stage or painted set.
- Characters: deliberate paper-card profiles and jointed layers.
- Lighting: visible stage cues and projections.
- Strength: controlled anatomy and silhouettes; limited animation looks intentional.
- Risk: less naturalistic and potentially less emotionally intimate.

### Option C — Aging celluloid

- Backgrounds and characters: restrained rotoscope-like forms, grain, muted color.
- Strength: seriousness and historical atmosphere.
- Risk: can become uncanny, over-cinematic, or visually monotonous.

Do not mix all three. Main production uses Option A; memory vignettes borrow controlled elements of Option B.

---

## 4. Resolution, framing, and camera

### Logical stage

- Design at a logical 1920×1080 stage.
- Build production room, prop, and character art on a 640×360 grid within that stage.
- Present art at exact 3× for 1920×1080 and at exact 2× inside a centred 1280×720 frame for 1366×768.
- Keep art smoothing disabled. Snap sprites, art-camera movement, and dynamic props to whole native pixels.
- Keep dialogue and accessibility text as independent DOM or vector content.
- Source master backgrounds may be larger when practical, but the corrected 640×360 asset is canonical.
- Export production textures at a size determined by performance tests.
- Maintain a 16:9 presentation with a protected 4:3 central composition so important characters remain readable on narrower screens.
- Letterbox rather than stretch.

### Camera

- One locked main camera.
- Approximate eye height: 1.45 m.
- Moderate wide view, visually similar to a 32–38 mm lens without photographic distortion.
- Horizon line and vanishing points are fixed in `art/blockout/bar_perspective.svg`.
- No Dutch angles, fisheye distortion, shallow depth of field, bloom-heavy lighting, or modern cinematic camera movement.

### Composition

The room must read in three seconds:

1. entrance and outside light;
2. patron tables and social groups;
3. bar counter and player position;
4. television and telephone;
5. service door and hidden depth.

No patron's head should sit directly against another patron's head, a bright lamp, or a strong vertical line. Reserve negative space for subtitles and interaction labels.

---

## 5. Environment production pipeline

### Rule: never generate the final crowded scene in one pass

The final room is assembled from controlled layers. Generating architecture, furniture, text, bottles, and six people together almost guarantees malformed geometry and inconsistent identity.

### Stage E0 — Reference and source board

Before image generation:

- gather dated historical references for interiors, furniture, glassware, fixtures, electronics, menus, and public-catering materials;
- label each image by date, location, source, and what is being referenced;
- distinguish visual inspiration from evidence;
- record historical claims in the source ledger;
- create a “do not use” board for modern industrial décor, post-Soviet branding, contemporary bars, LED lighting, fashionable distressed brick, and generic Cold War clichés.

Deliverable: `art/reference/bar_reference_board.pdf` or equivalent image board plus source notes.

### Stage E1 — Floor plan

Create a dimensioned top-down plan with:

- room dimensions;
- wall thickness and doors;
- counter footprint;
- tables and chair/stool centers;
- television, telephone, lamps, windows, coat hooks, and service door;
- walk and interaction anchors;
- character sightlines;
- fire/egress plausibility.

No painting begins before the plan is approved.

### Stage E2 — Perspective blockout

Create a monochrome or two-tone SVG/3D blockout from the fixed camera.

Requirements:

- coherent vanishing points;
- correct table heights;
- credible door and counter dimensions;
- every seat anchor visible;
- all walkable paths clear;
- television readable but not dominant;
- foreground occlusion elements planned;
- no decorative detail.

Test the blockout inside the running game using placeholder characters. Correct composition before generating art.

### Stage E3 — Empty-room target

Use the approved blockout as the visual source of truth. Generate or paint an **empty room only**.

Requirements:

- preserve architecture exactly;
- no people;
- no words, labels, menus, or logos;
- no loose bottles whose labels must be legible;
- material transitions are clear;
- light sources are physically consistent;
- the room is maintained but worn;
- repairs and mismatched eras look intentional;
- no impossible shelves, fused chairs, duplicated lamps, or warped counter edges.

Generate at least three controlled variants for the key background. Compare them against the blockout and historical board. Choose one base, then use targeted edits or paintover; do not average unrelated variants.

### Stage E4 — Structural correction

Before detail:

- overlay the perspective grid;
- inspect every vertical, horizontal, ellipse, and repeated object;
- correct shelf spacing, table legs, chair geometry, bottle rows, door handles, and shadows;
- remove accidental pseudo-text;
- replace complicated generated objects with separate approved props where needed.

No asset advances with visible geometry defects at target game scale.

### Stage E5 — Layer separation

Split the room into:

1. `bg_far` — walls, ceiling, rear shelves, distant fixtures;
2. `bg_mid` — counter rear, tables, chair backs, television housing;
3. `seat_back` — chair/stool parts behind characters;
4. `character_plane` — transparent placement zone;
5. `furniture_front` — counter fascia, table fronts, chair fronts;
6. `props_dynamic` — glasses, cards, papers, bottles, ashtrays;
7. `light_overlays` — television flicker, door light, fluorescent hum;
8. `atmosphere` — smoke, dust, subtle heat or lens grime;
9. `foreground` — optional near silhouette or counter edge.

This creates credible seating and prevents bodies from appearing pasted on top of furniture.

### Stage E6 — Signage and text

All text is separate SVG or runtime text.

- Proofread Cyrillic with a native speaker.
- Use documented period type references.
- Avoid modern brand fonts and distressed “Soviet” novelty fonts.
- Do not rely on image generation to spell words or prices.
- Store translations and transliterations separately.

### Stage E7 — Lighting states

Create controlled lighting for:

- early evening;
- night under interior lights;
- television interruption or signal loss;
- door opening;
- pre-dawn cool light;
- dawn cleanup.

Prefer a stable painted base plus engine overlays. Do not regenerate the entire room for every lighting state.

---

## 6. Character production pipeline

### Rule: identity is an asset, not a prompt accident

Every recurring character has one canonical identity package. All subsequent art is an edit or derivation from that package.

### Stage C0 — Written design card

Before visual generation, define:

- exact age;
- height and build;
- posture;
- face shape;
- nose, jaw, brow, ears, and hairline;
- hair and facial-hair construction;
- skin value and undertone;
- one dominant silhouette feature;
- clothing layers and construction;
- shoe type;
- palette swatches;
- habitual gesture;
- prohibited changes;
- prop;
- historical source notes for clothing and accessories.

Avoid vague descriptions such as “old Russian man.”

### Stage C1 — Silhouette exploration

Generate or draw black silhouettes first.

Acceptance criteria:

- each patron is recognizable without face or color;
- seated silhouettes remain distinct;
- body proportions are plausible;
- no two men share the same hat, shoulder line, belly shape, or resting posture;
- the player and Galina are distinct from the patrons.

### Stage C2 — Canonical full-body reference

Create one high-resolution neutral 3/4 view per character.

Requirements:

- one person only;
- simple neutral background;
- full body visible;
- hands open and separated from torso;
- feet fully visible;
- no chair, table, glass, or environmental element;
- clothing seams and layers unambiguous;
- facial features clear but not photorealistic;
- no extra accessories;
- no asymmetry that is not intentional.

This image becomes `character_id_master.png` and is never silently replaced.

### Stage C3 — Turnaround

Create front, 3/4, profile, and rear references using the master.

Do not ask for all views in one unconstrained image if identity starts to drift. Generate one view at a time, then assemble the sheet manually.

Acceptance criteria:

- same skull, nose, ear height, hairline, body mass, and clothing construction;
- same palette values;
- consistent limb lengths;
- no spontaneous medals, pockets, ties, or pattern changes.

### Stage C4 — Expression library

Create separate busts for:

- neutral/listening;
- mild amusement;
- performative confidence;
- irritation;
- fear disguised as anger;
- grief held in check;
- embarrassment;
- exhaustion.

Do not exaggerate every expression equally. Older faces need believable skin and jaw movement without becoming grotesque.

### Stage C5 — Seated pose template

Build one common seat-coordinate template showing:

- hip point;
- chair/stool seat plane;
- knee height;
- foot contact;
- table edge;
- elbow-rest height;
- character scale at that depth.

Generate each patron in the template without the chair rendered into the character image. Furniture back and front layers provide the chair.

Acceptance criteria:

- pelvis visibly rests on seat plane;
- thighs and knees have plausible direction;
- feet reach or intentionally miss the floor according to stool height;
- elbows do not intersect tabletops;
- coat tails, jackets, and legs do not fuse;
- pose matches the room's perspective.

### Stage C6 — Canonical poses

For the slice, each principal patron needs only:

- seated listening;
- seated talking;
- seated lean-in;
- seated lean-back;
- standing or leaving;
- one signature gesture;
- one late-night exhausted pose.

Use pose swaps rather than hundreds of generated frames.

### Stage C7 — Layered idle rig

Where practical, separate:

- torso;
- head;
- near forearm;
- far forearm;
- near hand;
- far hand;
- eyelids;
- mouth or jaw shapes;
- character prop.

Animation limits:

- head rotation: subtle;
- torso breathing: 1–2 pixels at logical resolution;
- blink: infrequent and asynchronous;
- hands: no continuous waving;
- mouth: restrained 3–5 shape system or no lip sync in slice;
- use full-pose swaps for strong gestures.

Over-animation looks synthetic and distracts from dialogue.

---

## 7. Hands, glasses, cigarettes, and props

These are high-risk areas and require separate assets.

### Hand library

Create approved transparent hand poses for each perspective:

- relaxed on table;
- holding faceted glass;
- holding cigarette;
- pointing with one finger;
- palm up;
- gripping document wallet;
- holding radio or lighter.

A hand may be partially occluded by a prop, but do not use occlusion to excuse impossible anatomy.

### Prop separation

- Generate or draw the glass, cigarette, medal case, photograph, bottle, and paper separately.
- Attach props at defined hand anchors.
- Use separate contact shadows.
- Keep bottle and glass shapes historically sourced.
- Do not ask image generation to render legible labels.

### Smoke

Smoke is an animated overlay, not painted into every character pose. Keep it subtle. The atmosphere should not erase faces or make the room look like stylized noir.

---

## 8. Anatomy and geometry defect checklist

Reject or correct an asset if any are visible at target scale:

### People

- extra, missing, fused, or malformed fingers;
- wrists bending without joint logic;
- forearms changing length between poses;
- knees or hips in impossible positions;
- feet floating or penetrating floor/furniture;
- head size changing;
- hairline, nose, ears, jaw, or eye spacing drifting;
- age changing;
- clothing closures changing sides;
- unexplained accessories appearing;
- glasses changing frame design;
- chair or table fused into body;
- duplicate limbs or partial strangers in the background.

### Environment

- shelves that change depth;
- repeated objects with inconsistent perspective;
- table legs that do not support tabletops;
- chairs with impossible backs or seat planes;
- door frames that do not align;
- lamps without attachment points;
- bottles or glasses melted together;
- pseudo-Cyrillic or random lettering;
- light and cast shadows pointing in incompatible directions;
- modern objects disguised by sepia color.

“Mostly fine” is not a pass for a key recurring asset.

---

## 9. Color and lighting

### Base palette

Use a controlled palette derived from material references:

- tobacco amber;
- varnished honey-brown;
- dull cream;
- oxidized teal;
- dark olive;
- brick or dried-blood red as a minor accent;
- CRT cyan-blue as a moving accent;
- graphite and soot neutrals.

Avoid:

- teal-and-orange cinematic grading;
- saturated propaganda red across the entire room;
- cyberpunk neon;
- monochrome sepia;
- clean Scandinavian minimalism;
- uniform gray “Eastern Bloc” misery.

### Lighting logic

- warm pendant or wall lighting in patron zone;
- colder fluorescent work light behind counter;
- CRT light should affect nearby faces only during bright frames;
- door opening introduces cooler exterior light and street sound;
- pre-dawn slowly lowers warm dominance;
- shadows remain soft enough for facial readability.

Create a lighting diagram with source position, temperature, intensity class, and affected layers.

---

## 10. Line and texture

### Line hierarchy

- outer character contour: strongest;
- major clothing folds: medium;
- facial interior lines: restrained;
- background detail: lower contrast than characters;
- interactive object highlights: handled by runtime feedback, not heavy outlines baked into art.

### Texture

- apply paper, paint, and low-resolution texture only after structure is correct;
- use texture masks consistently across asset groups;
- avoid putting photographic noise over clean character faces;
- downsample from clean high-resolution sources using one documented pipeline;
- test both at native and scaled display sizes.
- lock and version the production palette before asset approval;
- correct edges, faces, hands, props, and material clusters manually at native scale;
- reject isolated noise pixels, accidental face dithering, crawling texture, smooth filtered edges, and unreadable one-pixel props;
- inspect native scale, 800 percent pixel view, and both canonical presentations.

Do not ask a generator to create pixel art for a complex room and expect reliable geometry. Generate or draw clean source art, then apply deterministic palette reduction, downsampling, and manual pixel-cluster correction. A pixel filter over painterly detail is not an approved target.

---

## 11. Interface art

The interface must support, not imitate, a 1990s adventure game.

### Requirements

- dialogue and menus are semantic DOM or controlled game text;
- large readable subtitles;
- high-contrast focus states;
- keyboard navigation;
- optional speaker names;
- contextual action label near cursor;
- no giant permanently visible verb bar unless playtesting proves it improves use;
- icons are simple SVG with one visual language;
- text never appears as part of generated backgrounds.
- object states, presses, selections, and focus changes use immediate tactile feedback without copying another game's interface layout;
- 150 percent text, reduced motion, and keyboard focus remain clear over integer-scaled art.

### Visual direction

Use subtle references to:

- late-Soviet printed menus;
- ledger ruling;
- television scan lines;
- stamped administrative forms;
- worn cream paper and dark ink.

Avoid novelty Cyrillic fonts and heavy distressed effects.

---

## 12. Memory-vignette art

Memories are attributed, unstable, and visually distinct.

### Style

- 4–7 color screen-print or painted-paper palette;
- visible paper edges or overprint misregistration;
- simplified bodies and environments;
- one dominant symbolic object;
- present-day speaker remains visible or silhouetted;
- details can swap when another person contradicts the story.

### Production limits

- 30–90 seconds;
- no new fully explorable location;
- no crowd of individually animated figures;
- reuse abstracted shapes, smoke, tram windows, factory lights, school desks, or military vehicle forms;
- do not present a memory as objective truth.

### Transition

Use a controlled transformation of existing bar shapes:

- table becomes a factory bench;
- pendant light becomes a train lamp;
- television rectangle becomes a window or parade banner;
- cigarette smoke becomes snow, dust, or exhaust.

This keeps the single-room premise visually coherent.

---

## 13. Codex image-generation workflow

For every key asset, Codex must:

1. read the written design card and relevant prompt template;
2. inspect the approved reference images;
3. state the single visual problem being solved;
4. generate a small candidate set or targeted edit;
5. save the exact prompt and reference list;
6. place output in `art/review_queue/<asset_id>/`;
7. inspect at full resolution and in-game scale;
8. run the defect checklist;
9. compare against perspective, palette, and canonical identity;
10. document defects in `.logs/`;
11. edit, composite, or regenerate only the defective component;
12. move to `art/approved/` only after the gate passes.

Codex must never say an asset is acceptable solely because the generation command succeeded.

---

## 14. Visual review ritual

At every art milestone, capture these canonical shots:

1. empty room, early evening;
2. full cast seated, no dialogue UI;
3. close focus on each principal patron;
4. television event lighting;
5. door-open lighting;
6. memory vignette;
7. dialogue UI at longest supported line;
8. 1366×768 view;
9. 1920×1080 view;
10. keyboard focus state.

For each shot, Codex must list at least five observations under:

- composition;
- anatomy;
- perspective;
- historical plausibility;
- readability;
- consistency;
- unintended artifacts.

A visual test passing pixel comparison does not prove artistic quality. It only prevents unreviewed drift after an approved baseline exists.

---

## 15. Asset naming and metadata

Use stable IDs:

- `env_bar_bg_far_v001.png`
- `env_bar_furniture_front_v001.png`
- `char_arkady_master_3q_v001.png`
- `char_arkady_pose_seated_listen_v003.png`
- `prop_faceted_glass_small_v002.png`
- `fx_tv_flicker_mask_v001.png`

Each approved asset needs a sidecar JSON file:

```json
{
  "asset_id": "char_arkady_pose_seated_listen_v003",
  "status": "approved",
  "canonical_character": "arkady",
  "source_prompt": ".prompts/runs/2026-07-15_char_arkady_seated.md",
  "reference_assets": [
    "char_arkady_master_3q_v001.png",
    "seat_template_table_a.svg"
  ],
  "historical_ledger_ids": ["CLOTH-014", "PROP-022"],
  "anchor": {"x": 412, "y": 744},
  "review_notes": "Identity and chair relationship verified at 100% and game scale."
}
```

---

## 16. Art acceptance gate

The visual target is locked only when:

- the room matches the blockout;
- the room looks specific rather than generically Soviet;
- materials and light are coherent;
- character silhouette and identity survive pose changes;
- seated anatomy is credible;
- no text is baked into generated art;
- no major defect is visible at game scale;
- the art remains readable under dialogue UI;
- the style can be reproduced for a second character without drift;
- the production team would rather reuse and extend the style than start over.
- the native 640×360 art remains readable without labels or smoothing;
- approved assets contain no unexplained off-palette pixels;
- no fractional sprite positions, crawling dither, or interpolation shimmer appear in canonical captures.

If the gate fails twice, reduce complexity or switch to the theatrical cutaway fallback. Do not continue accumulating inconsistent assets.
