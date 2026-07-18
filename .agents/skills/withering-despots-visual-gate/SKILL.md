---
name: withering-despots-visual-gate
description: Review, generate, edit, integrate, or approve Withering Despots environments, characters, poses, props, UI art, or memory-vignette visuals. Trigger for every game-art or screenshot-polish task. Do not use for code-only changes with no visual effect.
---

# Withering Despots visual gate

Treat image generation as source production, not final approval. Your task is to preserve a coherent authored game, not maximize the number of assets.

## Read before work

Read the relevant parts of:

- `docs/ART_BIBLE.md`
- `docs/ART_DIRECTION_SCORECARD.md`
- `docs/VISUAL_QA.md`
- `docs/ASSET_MANIFEST.md`
- `docs/HISTORICAL_BIBLE.md`
- the matching template under `.prompts/`
- the asset's design card, sidecar metadata, source-ledger rows, and canonical references

## State the one visual problem

Before changing anything, write one sentence naming the single problem being solved. Examples:

- lock the empty-room target to the approved perspective;
- preserve Arkady's identity in a seated listening pose;
- correct the chair/body occlusion at table A;
- make subtitle focus readable without changing the room art.

If the task contains multiple independent visual problems, split them into ordered passes. Do not generate a full scene to solve a local defect.

## Required source hierarchy

Use, in this order:

1. approved project blockout or canonical master;
2. approved project material/palette/lighting specification;
3. dated historical evidence and ledger entries;
4. project style target;
5. textual prompt.

Never allow a fresh generation to overrule an approved blockout or canonical character master.

## Production rules

- Do not generate room, furniture, six people, props, lighting, and text in one image.
- Do not generate or approve text inside raster art.
- Do not generate a recurring character without a written design card.
- Do not create a pose without supplying the canonical master as image input.
- Do not create a seated pose without the seat template and room anchor preview.
- Do not create held props inside a difficult hand pose when separate prop and hand assets can be composited.
- Do not regenerate an approved background to change lighting; use controlled overlays.
- Do not ask for complex pixel art directly; create clean high-resolution art and use the documented deterministic downsampling pipeline.
- Do not copy any existing game's exact composition, asset, character, or proprietary visual signature.
- Save exact prompts and input paths under `.prompts/runs/`.
- Put new output in `art/review_queue/`, never directly in `art/approved/`.

## Inspection sequence

For each candidate or edit:

1. inspect the source at 100%;
2. compare with blockout/canonical master using overlays or aligned crops;
3. inspect transparency over light and dark checkerboards where relevant;
4. integrate into the running game;
5. capture 1920×1080 and 1366×768;
6. capture a close-focus image for characters or high-risk props;
7. inspect under the longest dialogue UI and keyboard focus state when applicable;
8. list actual observations in a defect table;
9. correct blocker/high defects before texture or decorative polish;
10. rerun captures after correction.

## Defect priority

Fix in this order:

1. geometry and perspective;
2. character identity;
3. anatomy and seating/contact;
4. historical plausibility;
5. compositing and lighting;
6. readability and UI interaction;
7. texture, wear, and decorative richness.

Do not disguise structural errors with grain, smoke, darkness, blur, props, or foreground occlusion.

## Environment gate

Reject or correct:

- drift from the approved floor plan or perspective grid;
- unsupported tables or shelves;
- malformed or fused chairs;
- inconsistent repeated objects and ellipses;
- wrong light direction;
- pseudo-text;
- modern or post-Soviet objects;
- generic propaganda overload;
- theatrical decay;
- blocked character or subtitle zones.

## Character gate

Compare every pose with the master for:

- skull and face proportions;
- brow, eye spacing, nose, ears, jaw, chin, and hairline;
- age and skin value;
- height, body mass, shoulder slope, and limb proportion;
- garment cut, closures, lapels, cuffs, pockets, palette, and shoes;
- glasses, accessories, and signature prop conventions.

For seating, verify pelvis, seat plane, thighs, knees, shins, feet, elbow/table relationship, furniture occlusion, and contact shadow.

“Same general kind of person” is a failure.

## Review output

Return a table:

| Region | Category | Severity | Violated invariant | Observation | Smallest correction | Owner layer |
|---|---|---:|---|---|---|---|

Severity values: `blocker`, `high`, `medium`, `low`, `pass-observation`.

Then report:

- input references used;
- prompt file saved;
- screenshots captured;
- rejected candidates and why;
- accepted candidate, if any;
- unresolved defects;
- gate result: `PASS`, `TARGETED EDIT REQUIRED`, `REGENERATE COMPONENT`, or `SWITCH/REDUCE STYLE`.

## Approval rule

An asset may move to `art/approved/` only when:

- no blocker or high defect remains;
- all required checks in `docs/VISUAL_QA.md` pass;
- sidecar metadata is complete;
- the integrated screenshots were inspected, not just generated;
- the asset remains reproducible from its canonical inputs.

After two disciplined failed correction cycles, stop. Recommend a simpler construction, reduced pose detail, stronger compositing, or the theatrical-cutaway fallback. Do not accumulate inconsistent art.
