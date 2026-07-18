# Image Prompt Template — Canonical Character Pose Edit

This is an identity-preserving edit/derivation task. It is not a new character-generation task.

---

## Required visual inputs

1. `[PATH_TO_APPROVED_CHARACTER_MASTER]` — immutable identity, age, body, clothing, palette, and line/shading truth.
2. `[PATH_TO_APPROVED_VIEW_IF_AVAILABLE]` — supports the requested rotation only.
3. `[PATH_TO_SEAT_OR_POSE_TEMPLATE]` — immutable hip, knee, foot, elbow, table, and perspective anchors.
4. `[PATH_TO_ROOM_CROP_OR_ANCHOR_PREVIEW]` — context for scale and light only; do not render room or furniture into the character.

Explicitly identify the function of every input in the generation request.

---

## Edit objective

Create one transparent full-body pose for character `[CHARACTER_ID]`:

Pose ID: `[POSE_ID]`  
Emotional/action intent: `[POSE_INTENT]`  
View direction: `[VIEW_DIRECTION]`  
Seat/standing anchor: `[ANCHOR_ID]`  
Hand action: `[HAND_ACTION_OR_RELAXED]`  
Head direction: `[HEAD_DIRECTION]`

Preserve the exact person from the approved master. The result must look like the same individual photographed/drawn in another pose, not another interpretation of the description.

---

## Immutable identity invariants

Preserve exactly:

- skull width and face length;
- brow, eye spacing, eyelid shape, nose, ears, jaw, chin, and hairline;
- apparent age, wrinkles, and skin value;
- eyewear construction;
- height, body mass, shoulder slope, torso-to-leg ratio, and hand size;
- garment cut, closures, lapels, cuffs, pockets, seams, wear, and palette;
- shoes and accessories;
- dominant silhouette feature;
- handedness.

Do not beautify, simplify away distinguishing features, add accessories, change hair, change weight, or change garment construction.

---

## Seating/pose geometry

Follow `[PATH_TO_SEAT_OR_POSE_TEMPLATE]` exactly:

- pelvis center at `[HIP_XY]`;
- seat plane at `[SEAT_PLANE]`;
- left/right knee anchors `[KNEE_ANCHORS]`;
- left/right foot contact `[FOOT_ANCHORS]`;
- table edge `[TABLE_EDGE]`;
- elbow-rest range `[ELBOW_RANGE]`;
- character scale `[SCALE]`;
- floor and horizon relationship `[PERSPECTIVE_NOTES]`.

For a seated pose, render the character **without the chair or table**. The room's `seat_back` and `furniture_front` layers will occlude the body correctly. Clothing may respond to sitting, but it must not merge with imaginary furniture.

---

## Lighting and rendering

- Match the approved character master line and shading language.
- Use the room anchor's key and fill direction `[LIGHT_DIRECTION]`.
- Keep contact shadow separate; do not paint a large floor/table shadow into the body layer.
- Output on transparent background when supported; otherwise use a flat chroma-neutral background suitable for clean masking.
- No scenery, furniture, text, labels, smoke, or unrelated props.

---

## Hand and prop handling

For high-risk hand/prop actions:

- first generate the body with a relaxed or clearly posed empty hand;
- create the prop as a separate approved asset;
- use a canonical hand pose from the character's hand library;
- attach at defined wrist and prop anchors;
- do not hide malformed fingers behind a glass or cigarette;
- verify grip and visible digit count at 100%.

---

## Defect exclusions

Reject or correct:

- any facial identity drift;
- head-size change;
- altered glasses, hairline, or age;
- different jacket buttons, lapel, pocket, cuff, or shoe;
- changed body mass or limb length;
- fused or duplicate limbs;
- malformed hands;
- pelvis not resting on seat plane;
- impossible thigh/knee direction;
- floating feet;
- elbow/table intersection;
- chair/table fragments baked into the character;
- lighting inconsistent with the room.

---

## Output request

Produce one controlled pose edit, or at most `[2]` variants that differ only in subtle gesture intensity. Do not generate a sheet of unrelated poses.

---

## Codex post-generation procedure

1. Save exact prompt and references.
2. Compare master and pose using aligned head crops and body-proportion overlays.
3. Run the identity-invariant checklist field by field.
4. Composite the pose between `seat_back` and `furniture_front`.
5. Add approved separate props and contact shadow.
6. Capture full-room and close-focus images at both target resolutions.
7. Ask an independent visual reviewer for a region-specific defect table.
8. Correct only defective regions.
9. Do not approve until identity, pose geometry, transparency, and integration all pass.
