# Image Prompt Template — Canonical Character Master

Use this template to establish one recurring character's immutable identity. Do not use it to generate a pose sheet, crowd, scene, seated character, or multiple expressions at once.

---

## Required visual inputs

- `[OPTIONAL_APPROVED_SILHOUETTE_PATH]` — controls body outline and posture only.
- `[APPROVED_CLOTHING_REFERENCE_BOARD_PATH]` — controls garment construction, not face or composition.
- `[APPROVED_PROJECT_CHARACTER_STYLE_TARGET_PATH]` — controls project line, value simplification, and shading.

After the first canonical master is approved, that master—not the text prompt—becomes the primary identity input for every later view and pose.

---

## Generation objective

Create one original recurring character for a hand-painted 2D historical narrative adventure game.

Character ID: `[CHARACTER_ID]`  
Name: `[FULL_NAME]`  
Age: `[EXACT_AGE]`  
Sex/gender presentation: `[DESCRIPTION]`  
Height: `[HEIGHT]`  
Build: `[BUILD]`

Show **one person only**, standing in a neutral relaxed 3/4 view on a plain light neutral background. Show the complete body from head to shoes. Keep both hands visible, open, anatomically clear, separated from the torso, and not holding props. Do not include furniture, scenery, labels, captions, turnarounds, multiple poses, or inset faces.

---

## Identity construction

Face:

- skull/face shape: `[FACE_SHAPE]`;
- forehead and brow: `[BROW]`;
- eye size, spacing, and lid shape: `[EYES]`;
- nose bridge, length, tip, and nostrils: `[NOSE]`;
- cheeks and age structure: `[CHEEKS_AGE]`;
- mouth and philtrum: `[MOUTH]`;
- jaw and chin: `[JAW]`;
- ears: `[EARS]`;
- hairline, hair construction, and gray pattern: `[HAIR]`;
- facial hair: `[FACIAL_HAIR_OR_NONE]`;
- skin value and undertone: `[SKIN]`;
- eyewear: `[EYEWEAR_OR_NONE]`.

Body and posture:

- head-to-body proportion: `[RECOMMENDED 5.5–6 HEADS FOR MILD CARICATURE]`;
- shoulder line: `[SHOULDERS]`;
- torso and abdomen: `[TORSO]`;
- limb proportion: `[LIMBS]`;
- hand size: `[HANDS]`;
- habitual posture: `[POSTURE]`;
- dominant silhouette feature: `[SILHOUETTE_FEATURE]`;
- habitual tension or asymmetry: `[ASYMMETRY]`.

The design should be mildly caricatured for readability but anatomically coherent, emotionally credible, and suitable for serious dialogue. Do not make age grotesque, cute, or generic.

---

## Clothing construction

Use the approved historical references and ledger IDs `[LEDGER_IDS]`.

- outer layer: `[OUTER_LAYER, CUT, CLOSURES, POCKETS, WEAR]`;
- shirt/blouse/underlayer: `[UNDERLAYER]`;
- trousers/skirt: `[LOWER_GARMENT]`;
- belt/suspenders: `[DETAIL]`;
- shoes: `[SHOES]`;
- accessories: `[ACCESSORIES]`;
- palette swatches: `[HEX_OR_NAMED_SWATCHES]`;
- wear and repair: `[WEAR]`.

Garments must be constructible: consistent lapels, buttons, cuffs, seams, pockets, hemlines, and closures. No invented military decoration, insignia, medals, luxury accessories, or modern cuts unless explicitly ledgered.

---

## Project style

- original late-1990s illustrated adventure-game character language;
- clean, confident outer contour;
- restrained interior facial line;
- simplified but intentional planes of light and shadow;
- readable silhouette at approximately `[GAME_HEIGHT_PX]` pixels tall;
- stable local colors, no cinematic color wash;
- hand-painted/cel-painted integration with the approved room;
- high-resolution clean source for controlled downsampling;
- no photorealism, 3D render look, anime conventions, fashion illustration, painterly face blur, or imitation of an existing proprietary character.

---

## Prohibited identity changes

Do not add or alter:

- `[PROHIBITED_HAIR_CHANGES]`;
- `[PROHIBITED_FACE_CHANGES]`;
- `[PROHIBITED_BODY_CHANGES]`;
- `[PROHIBITED_CLOTHING_CHANGES]`;
- `[PROHIBITED_ACCESSORIES]`.

Do not make the person younger, healthier, more glamorous, more villainous, or more stereotypically “Soviet” than the design card specifies.

---

## Anatomy exclusions

No:

- extra, fused, missing, or malformed fingers;
- hidden hands;
- bent wrists without joint logic;
- unequal forearm lengths;
- floating or malformed feet;
- asymmetry not listed in the design;
- doubled features;
- inconsistent glasses;
- clothing fused into skin;
- cut-off shoes or cropped body;
- props, chairs, tables, text, logos, or background figures.

---

## Output request

Produce `[RECOMMENDED 3]` closely controlled candidates of the same written person. Do not vary age, ethnicity, body type, clothing construction, or palette. Variation may be limited to subtle facial specificity and line/shading treatment.

---

## Codex post-generation procedure

1. Save the completed prompt and input paths under `.prompts/runs/`.
2. Put candidates in `art/review_queue/[CHARACTER_ID]/master/[RUN_ID]/`.
3. Inspect face, body, hands, feet, garment logic, and silhouette at 100%.
4. Create black silhouettes from each candidate and compare at game scale.
5. Reject anatomy or construction defects before judging charm.
6. Select one base only; targeted-correct that image rather than blending identities.
7. Record canonical facial measurements and palette in the design-card metadata.
8. Export a canonical face crop and full-body reference.
9. Do not generate another pose until this master has explicit status `approved`.
