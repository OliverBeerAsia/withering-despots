# Visual Quality Assurance

## 1. Purpose

This document prevents the project from treating generated output as finished art. Every key asset must pass structural, historical, stylistic, compositional, and in-engine review.

A successful generation is not an approved asset.

---

## 2. Review statuses

- `generated` — raw output, not reviewed.
- `review_queue` — prepared for inspection with prompt and references.
- `needs_correction` — usable base with specific defects.
- `rejected` — unsuitable direction or too many defects.
- `approved_target` — visual target for a class of assets.
- `approved_production` — final asset allowed in the build.
- `deprecated` — once approved but replaced deliberately.

Only `approved_production` assets may be referenced by production content.

---

## 3. Required review package

Every review item must include:

- asset ID and version;
- raw full-resolution image;
- canonical 640×360 art-grid asset;
- palette sheet and deterministic reduction recipe;
- transparent-background check where applicable;
- source prompt;
- attached reference list;
- historical ledger IDs;
- target in-game screenshot;
- overlay against perspective or canonical character reference;
- reviewer notes;
- status decision.

Do not review a cropped screenshot alone.

For production pixel art, also inspect the native grid, an 800 percent nearest-neighbour view, exact 3× presentation at 1920×1080, and exact 2× presentation inside the 1366×768 frame. Reject smoothing, fractional sprite positions, unexplained off-palette pixels, isolated noise, crawling dither, and interpolation shimmer.

---

## 4. Environment review

### 4.1 Structure

Pass only if:

- wall, floor, and ceiling planes agree with the blockout;
- vanishing points remain coherent;
- door and window openings are rectangular in 3D perspective;
- table and counter heights are plausible;
- chairs and stools can physically support seated people;
- repeated objects shrink consistently with depth;
- foreground layers can occlude characters correctly;
- no major walk or interaction anchor is obstructed.

### 4.2 Object integrity

Inspect individually:

- every chair and stool;
- every table leg;
- counter corners and foot rail;
- shelf ends;
- bottle and glass silhouettes;
- lamps and attachment points;
- telephone and cable;
- television cabinet and screen;
- radiator and pipes;
- doors, handles, hinges, and coat hooks.

Reject fused, duplicated, melted, or unsupported objects.

### 4.3 Lighting

Pass only if:

- every significant highlight has a plausible source;
- cast-shadow direction is consistent;
- television light is local, not global blue grading;
- warm and fluorescent zones remain readable;
- faces will not sit in black pockets;
- door-open and dawn overlays preserve material color;
- no modern lens flare, bloom, or artificial depth blur dominates.

### 4.4 Historical plausibility

Pass only if:

- exact devices and signs have ledger IDs;
- unsourced detail is generic enough to be plausible or marked composite;
- no modern décor or post-Soviet symbol is visible;
- propaganda is not used as wallpaper shorthand;
- wear patterns correspond to use;
- the room looks operated, repaired, and cleaned rather than abandoned or museum-perfect.

### 4.5 Composition

At game scale:

- player and patrons remain distinct;
- television is visible but not the sole focal point;
- dialogue UI does not cover essential faces or gestures;
- interactive props have readable silhouettes;
- no high-contrast clutter competes with characters;
- the eye can move between social groups.

---

## 5. Character review

### 5.1 Identity lock

Overlay new pose against canonical head and body references. Pass only if:

- skull and face proportions match;
- nose, jaw, ear, eyes, hairline, and facial hair match;
- age remains stable;
- height/build and shoulder width match;
- skin value and palette match;
- clothing construction, seams, pockets, buttons, and accessories match;
- no unexplained redesign has occurred.

### 5.2 Anatomy

Inspect at 100 percent and game scale:

- five fingers where visible;
- thumb position and palm orientation credible;
- wrist, elbow, and shoulder chain plausible;
- pelvis and spine support pose;
- knees bend in correct direction;
- legs have consistent length;
- feet contact floor or foot rail;
- head attaches to neck;
- clothing follows body volume rather than replacing it;
- no limb merges with chair, table, glass, or another person.

### 5.3 Seated pose

Pass only if:

- hip aligns with seat plane;
- thigh angle is possible;
- knees and table edge do not intersect;
- chair/stool front and back layers create credible occlusion;
- feet have weight;
- jacket and coat drape logically;
- character appears to occupy the same perspective as the room.

### 5.4 Expression

Pass only if:

- expression is recognizable without deforming identity;
- eye direction matches focus target;
- mouth and jaw remain plausible;
- sadness is not rendered as generic tears unless scripted;
- anger does not turn every character into a caricature;
- expression intensity matches the scene.

### 5.5 Silhouette

At 10–15 percent of master size:

- character remains identifiable;
- gesture reads;
- hands do not disappear into torso;
- head does not merge with background fixtures;
- prop remains distinguishable.

---

## 6. Transparency and compositing

For transparent sprites:

- no white or dark halo around edges;
- no accidental background fragments;
- alpha is clean around hair, fingers, smoke, and glass;
- premultiplication mode is correct in engine;
- contact shadow is separate;
- sprite bounding box is tight but leaves safe animation margin;
- anchor metadata is present;
- no semi-transparent ghost limb remains from editing.

Test sprites over black, white, mid-gray, and the actual room.

---

## 7. Text and signage

Pass only if:

- text is rendered separately from generated art;
- Russian spelling, grammar, abbreviations, and punctuation have native review;
- typography matches documented period references or a deliberately neutral system;
- text remains legible at target resolution;
- no pseudo-Cyrillic appears;
- menu prices are sourced or withheld;
- translated labels do not overwrite original signage in the environment; use subtitle/tooltips as needed.

---

## 8. UI review

At 1920×1080 and 1366×768:

- longest dialogue line fits or wraps cleanly;
- no widow/orphan creates awkward one-word lines where avoidable;
- subtitle background provides contrast over every lighting state;
- keyboard focus is visible;
- hover and selected states are distinct without color alone;
- action label does not obscure the target;
- cursor hotspot is accurate;
- settings at 150 percent text size remain usable;
- reduced-motion setting removes nonessential flicker and movement;
- no 1990s-inspired ornament reduces modern readability.

---

## 9. Motion review

### Idles

- no synchronized blinking;
- no constant head bobbing;
- breathing amplitude is subtle;
- loops have varied durations;
- characters can remain still;
- cigarette and smoke motion is not perfectly periodic;
- television flicker does not produce unsafe flashes.

### Gestures

- gesture begins from current pose and resolves cleanly;
- no limb teleports or changes size;
- held prop follows hand anchor;
- furniture occlusion remains correct;
- dialogue timing allows the gesture to be seen;
- strong gestures are rare enough to retain meaning.

### Camera and focus

- no motion sickness-inducing zoom;
- focus shift is short and optional under reduce motion;
- camera never exposes unpainted background edge;
- subtitle position remains stable.

---

## 10. Canonical screenshot matrix

Capture and approve:

| ID | State | Resolution | Required content |
|---|---|---:|---|
| VIS-001 | Empty room, early evening | 1920×1080 | All environment layers, no people |
| VIS-002 | Full slice cast | 1920×1080 | Canonical seated poses |
| VIS-003 | Arkady focus | 1920×1080 | Dialogue UI, hand and wallet visible |
| VIS-004 | Lev repairs signal | 1920×1080 | Radio/TV interaction |
| VIS-005 | Tunnel-deaths reaction | 1920×1080 | Group composition and low music state |
| VIS-006 | Memory vignette 1 | 1920×1080 | Collage transformation |
| VIS-007 | Door-open lighting | 1920×1080 | Exterior light and depth |
| VIS-008 | Dawn | 1920×1080 | Cool overlay, changed object states |
| VIS-009 | Longest subtitle | 1366×768 | Wrapping and safe area |
| VIS-010 | Keyboard focus | 1366×768 | Visible focus and action label |
| VIS-011 | Reduced motion | 1920×1080 | Flicker/atmosphere disabled |
| VIS-012 | Final ledger | 1366×768 | Text accessibility and epilogue state |

Store manual approval notes next to screenshot baselines.

---

## 11. Codex self-review prompt

Before an asset is approved, Codex should answer:

1. What is the intended focal point?
2. Which blockout or canonical reference governs this asset?
3. What are the five most visible defects or risks?
4. Does any geometry or anatomy fail when overlaid with the guide?
5. Which details are historically verified, composite, or unverified?
6. Is any text baked into the image?
7. Does the asset preserve character identity or room perspective?
8. Does it work at target game scale, not only when enlarged?
9. What targeted correction is cheaper and safer than full regeneration?
10. Why should this asset be approved rather than merely tolerated?

An answer of “no defects found” on a first-pass key asset is a review failure. Inspect again.

---

## 12. Approval gate

A key asset passes only when:

- structural and anatomy checklists pass;
- historical status is acceptable;
- style matches approved targets;
- in-engine composition works;
- target-resolution screenshot is reviewed;
- metadata and prompt are saved;
- no known defect is being hidden by scale, smoke, darkness, or UI;
- reviewer explicitly records `approved_production`.
