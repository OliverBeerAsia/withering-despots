# Asset Manifest

## 1. Layer conventions

Use stable layer groups:

1. `bg_far`
2. `bg_mid`
3. `seat_back`
4. `characters_rear`
5. `characters_main`
6. `table_props`
7. `furniture_front`
8. `foreground_props`
9. `light_overlays`
10. `atmosphere`
11. `interaction_overlay`
12. `dom_ui`

All assets require stable IDs and sidecar metadata.

---

## 2. Vertical slice environment assets

| Asset ID | Description | Format | Master size | Notes |
|---|---|---|---:|---|
| `env_bar_blockout` | Phase 1 perspective and architecture blockout | SVG | 1920×1080 | `art/blockout/bar_perspective.svg`; structural source of truth, not final-art approval |
| `env_bar_floor_plan` | Dimensioned Phase 1 fixture and seat plan | SVG | 960×760 | `art/blockout/bar_floor_plan.svg`; 7.2 by 5.8 metres, 18 seats, explicit anchors |
| `env_bar_bg_far_evening` | Walls, ceiling, rear shelving | PNG/WebP | 3840×2160 | Empty, no text |
| `env_bar_bg_mid` | Counter rear, tables, TV housing | PNG/WebP | 3840×2160 | Transparent where needed |
| `env_bar_seat_back` | Chair/stool rear occlusion | PNG | 3840×2160 | Separate seat regions if practical |
| `env_bar_furniture_front` | Counter/table/chair front occlusion | PNG | 3840×2160 | Critical for seating |
| `env_bar_foreground` | Near counter edge/optional foreground | PNG | 3840×2160 | Do not over-frame scene |
| `env_bar_dawn_overlay` | Cool dawn light | PNG | 3840×2160 | Blend-mode tested |
| `env_bar_door_light_overlay` | Exterior light when door opens | PNG | 3840×2160 | Localized |
| `fx_tv_light_mask` | CRT face/room light | PNG sequence or mask | 640×360 native | v003 local mask in `art/review_queue/props/`; integrated in `public/assets/fx/` for canonical review, not yet production-approved |
| `fx_smoke_layers` | Subtle smoke wisps | PNG sequence | variable | 3 to 5 asynchronous layers |
| `fx_dust_motes` | Optional low-effects-compatible ambience | PNG sequence | variable | Nonessential |

---

## 3. Character asset package

For each recurring character:

| Asset suffix | Description |
|---|---|
| `_design_card.md` | Written visual specification |
| `_silhouettes.png` | Approved silhouette exploration |
| `_master_3q.png` | Canonical neutral 3/4 full body |
| `_front.png` | Front turnaround |
| `_profile.png` | Profile turnaround |
| `_rear.png` | Rear turnaround |
| `_expressions.png` | Approved expression busts |
| `_pose_seated_listen.png` | Seated listening |
| `_pose_seated_talk.png` | Seated speaking |
| `_pose_lean_in.png` | Intimate or confrontational lean |
| `_pose_lean_back.png` | Withdrawal/defense |
| `_pose_signature.png` | Character-specific gesture |
| `_pose_exhausted.png` | Late-night pose |
| `_pose_standing.png` | Entry/exit |
| `_rig.json` | Part pivots and pose definitions |
| `_metadata.json` | References, prompt, anchors, status |

Vertical slice characters:

- `char_sasha`
- `char_galina`
- `char_arkady`
- `char_lev`
- `char_nikolai`
- `char_gennady`

Do not produce all poses before the first character package passes the identity and seating gate.

---

## 4. Prop assets

### Bar

- small and medium faceted glasses;
- shot glasses;
- beer mug only if verified;
- ceramic tea cup or glass/holder only if verified;
- water/mineral-water bottle generic or sourced;
- vodka bottle generic or sourced;
- tea pot/kettle;
- black bread plate;
- pickle plate;
- simple sandwich plate;
- metal ashtray;
- paper napkin holder;
- service tray;
- receipt/tab slip;
- bar ledger;
- pen and pencil;
- telephone receiver and cord state;
- television control/antenna element;
- cleaning cloth;
- broken-glass state.

### Character-specific

- Arkady: leather document wallet, Party card, paper fragment;
- Lev: pocket radio, wire, screwdriver, letter envelope;
- Nikolai: medal case, unsent letter paper;
- Gennady: folding ruler, factory photograph;
- Galina: keys, stock notebook;
- Sasha: ledger pen, service towel.

Each prop needs:

- isolated asset;
- scale reference;
- correct perspective class;
- hand anchor if held;
- table anchor if placed;
- historical ledger IDs;
- clean shadow asset or engine shadow rules.

---

## 5. Memory vignette assets

Vertical slice:

### `memory_signal`

- transmission-tower shapes;
- relay diagram lines;
- technician silhouettes;
- erased-name card;
- television-to-tower transition mask;
- 4 to 7 color palette.

### `memory_number`

- production board;
- machine-gauge shapes;
- hand silhouette;
- target-number shape rendered as runtime text or vector, not generated lettering;
- factory-light transition;
- Arkady signature mark only if fictional and drawn as vector.

All memory assets must transform existing bar geometry where possible.

---

## 6. UI assets

Build as SVG/CSS wherever possible:

- five verb icons;
- pointer cursor and active variants;
- hotspot focus ring;
- dialogue panel frame;
- choice marker;
- speaker-name plate;
- claim-journal tabs;
- ledger ruling;
- settings controls;
- pause overlay;
- keyboard focus indicator;
- loading indicator;
- content-warning and historical-note layout;
- title logo as original vector lettering.

Do not use generated text for the title logo without manual vector reconstruction and proofreading.

---

## 7. Audio assets for slice

### Ambience loops

- room tone early evening;
- room tone late night;
- refrigerator compressor states;
- ventilation/pipes;
- exterior distant traffic;
- door-open street layer;
- pre-dawn exterior;
- CRT hum;
- radio static.

### Foley

- glass set down light/heavy;
- bottle pour;
- tea pour;
- chair shift;
- paper fold;
- leather wallet open;
- radio tuning;
- television switch/knob;
- telephone ring/pickup/hangup;
- door open/close;
- keys;
- cloth wipe;
- glass break and cleanup;
- footsteps by character weight class.

### Voice/barks

- breaths;
- laughs;
- coughs;
- interruptions;
- names and forms of address;
- assent/disbelief sounds;
- off-screen murmurs.

### Music

- title cue;
- early-night motif;
- tunnel-deaths transition;
- memory vignette cues;
- dawn cue;
- rights-cleared original short `Swan Lake` reference if retained.

Current atmosphere proof:

- `last-light`: original project composition, 71.11 seconds;
- `glasses-after-nine`: original project composition, 72 seconds;
- `between-stations`: original project composition, 74.48 seconds;
- fixed authored order and deterministic receiver hiss;
- no quoted or identifiable archival melody;
- `Swan Lake` is not used in this pass and remains reserved for a separately ledgered historical event if later retained;
- quiet ventilation and refrigeration are synthesized at runtime rather than stored as unreviewed audio assets;
- deterministic glass, chair, and telephone-relay cues occur 24 to 49 seconds apart with no immediate repeat;
- the telephone relay is exposed to the semantic sound-caption surface;
- reduced motion or the low-effects setting suppresses incidental cues while retaining a quieter room bed.

---

## 8. Asset budget rule

The slice should use a small number of excellent recurring assets rather than a large number of inconsistent images.

Before requesting a new asset, ask:

- Can a pose swap solve this?
- Can a prop move solve this?
- Can light, sound, or posture communicate the change?
- Can an existing memory shape transform?
- Is the asset visible long enough to justify review cost?

No one-off illustration is allowed merely because generation is easy.
