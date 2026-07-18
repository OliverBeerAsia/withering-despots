# Codex Start Prompts

Use these prompts **one phase at a time**. Do not paste the entire file into one task. Every phase has a stopping condition. Review the result before starting the next phase.

The prompts assume this implementation pack has been copied into the repository root.

---

## Operating rule for every phase

Append this block to every Codex task unless it is already enforced by `AGENTS.md`:

> Read `AGENTS.md` and the documents it routes you to before changing files. Invoke `$withering-despots-visual-gate` for every visual task. Work on only the requested phase. Keep a dated work log under `.logs/`. Use bounded subagents only for independent research, testing, or review; the main agent owns integration. Run all relevant checks. For visual work, inspect the running game at 1920×1080 and 1366×768, save screenshots, and list defects rather than merely saying the build succeeded. Do not proceed beyond the stated stopping condition. Do not silently relax an acceptance criterion. If the gate fails, stop with a defect report and the smallest proposed correction.

---

# Phase 0 — Repository audit and implementation skeleton

## Prompt

You are the lead engineer and production coordinator for **Withering Despots**.

Read, in order:

1. `AGENTS.md`
2. `PLAN.md`
3. `docs/TECHNICAL_ARCHITECTURE.md`
4. `docs/NARRATIVE_DESIGN.md`
5. `docs/HISTORICAL_BIBLE.md`
6. `docs/ART_BIBLE.md`
7. `docs/VISUAL_QA.md`
8. `docs/ASSET_MANIFEST.md`

Your sole objective is to create the repository skeleton and deterministic development toolchain for the vertical slice. Do not create final art or full story content.

### Required implementation

- TypeScript with strict compiler settings.
- Vite development and production build.
- PixiJS scene layer with a semantic HTML/CSS interface layer.
- YAML or JSON content files validated by schemas before build.
- Unit tests, content tests, simulation tests, and Playwright configuration.
- Scripts named, at minimum: `dev`, `build`, `lint`, `format:check`, `typecheck`, `test`, `test:content`, `test:e2e`, `test:visual`, and `check`.
- A deterministic random-source abstraction even if the slice currently uses no randomness.
- Stable logical stage at 1920×1080 with letterboxing rather than stretching.
- Development-only debug panel placeholder.
- Repository directories described in `docs/TECHNICAL_ARCHITECTURE.md`.
- Copy `content_examples/HISTORICAL_LEDGER.csv` to `research/HISTORICAL_LEDGER.csv` if the latter does not exist.
- Add `.gitkeep` files for review queues, approved art, screenshots, prompt runs, logs, and research references.
- Pin dependencies in the lockfile. Do not add a framework or production dependency not justified in the work log.

### Required subagent split

Use bounded subagents, where available, for:

1. **Architecture audit:** compare the proposed structure with the technical document and return omissions only.
2. **Test audit:** define the minimum executable tests proving setup and deterministic state.
3. **Accessibility audit:** inspect the planned DOM overlay and keyboard path.

Do not let subagents edit overlapping files. Integrate their findings in the main task.

### Required documentation

Create:

- `docs/IMPLEMENTATION_STATUS.md` with a milestone checklist and current gate;
- `.logs/phase-0.md` with commands, decisions, failures, and remaining risks;
- `research/HISTORICAL_LEDGER.csv` if absent;
- a concise `README.md` section containing exact local setup and test commands without replacing the production brief.

### Required verification

Run the full `check` command on a clean install. Run the browser smoke test at 1920×1080 and 1366×768. Capture both screenshots even though the scene is a placeholder.

### Acceptance criteria

- Clean installation succeeds.
- All scripts execute and fail loudly on invalid content.
- Strict TypeScript is enabled without blanket `any` escapes.
- Browser smoke test shows a stable 16:9 stage and semantic UI layer.
- Keyboard focus is visible.
- No final assets, fabricated historical facts, or unreviewed story expansion have been added.
- The final response lists files changed, checks run, screenshots captured, known defects, and the current milestone gate.

### Stopping condition

Stop after Phase 0 acceptance criteria pass. Do not implement interaction, dialogue, final art, or production content.

---

# Phase 1 — Graybox room and five-verb interaction

## Prompt

Implement **Phase 1 only**: the playable graybox room and interaction grammar.

Read:

- `AGENTS.md`
- `PLAN.md`, sections 5–7 and 18
- `docs/TECHNICAL_ARCHITECTURE.md`, sections 3–7, 11–13, and 18–21
- `docs/ART_BIBLE.md`, sections 4–5
- `docs/VISUAL_QA.md`, sections 3–4, 8, and 10

### Objective

Create a ten-minute deterministic graybox in one fixed-camera bar. It must prove spatial readability, focus behavior, attention selection, and the five verbs: Observe, Speak, Serve, Tune, and Wait.

### Constraints

- Use only SVG, CSS, geometric placeholder art, and simple tones.
- Do not generate or paint final assets.
- Use the room dimensions and fixture plan from `PLAN.md` and `docs/HISTORICAL_BIBLE.md` as provisional design constraints.
- Create `art/blockout/bar_floor_plan.svg` and `art/blockout/bar_perspective.svg` as sources of truth.
- Use explicit anchor IDs for seats, standing positions, props, doors, television, phone, counter, and walk points.
- Use one locked camera and a stable horizon.
- No free-roaming movement. Use short authored movement between anchors.
- No permanent verb bar unless a usability test demonstrates its necessity.

### Required playable sequence

The placeholder sequence must allow the player to:

1. inspect the room;
2. observe each of four patron placeholders;
3. answer or remain silent in one short exchange;
4. serve tea or vodka with different state effects;
5. tune the television while the phone begins ringing;
6. choose one of two simultaneous attention targets;
7. wait and allow a scheduled event to advance;
8. reach a clear end-of-graybox state.

### Required debug tools

Show, behind a development toggle:

- game clock;
- current focus;
- active attention window;
- patron state summary;
- hotspot polygons and anchor IDs;
- pending scheduled events;
- last command/effect transaction.

### Required visual review loop

After the first implementation:

1. open the game in a live browser;
2. capture 1920×1080 and 1366×768 screenshots;
3. inspect line-of-sight, head separation, subtitle-safe space, and hotspot overlap;
4. list at least five concrete defects or observations;
5. make a second pass;
6. recapture the screenshots.

A passing screenshot test is not artistic approval. Explain what was visually inspected.

### Required tests

- deterministic clock advancement;
- attention-window resolution;
- keyboard-only completion;
- no hotspot ambiguity at canonical resolutions;
- stage scaling and letterboxing;
- no action advances time while pause/settings are open;
- save-and-restore of the graybox state if save infrastructure already exists.

### Acceptance criteria

A fresh tester can complete the sequence without external explanation; all five verbs have a meaningful effect; the room reads immediately; focus and subtitles are clear; and all checks pass.

### Stopping condition

Stop with the graybox gate report. Do not implement the authored dialogue engine or final artwork.

---

# Phase 2 — Narrative, claim, event, and save systems

## Prompt

Implement **Phase 2 only**: the deterministic narrative engine and content validation.

Read:

- `AGENTS.md`
- `PLAN.md`, sections 6–13 and 18
- `docs/NARRATIVE_DESIGN.md`
- `docs/TECHNICAL_ARCHITECTURE.md`, sections 3–12 and 15–19
- files under `content_examples/`

### Objective

Create a data-driven system that supports dialogue choices, meaningful silence, knowledge provenance, claims and contradictions, scheduled public events, mutually exclusive attention windows, relationship state, and deterministic save/restore.

### Required content data

Implement schemas and loaders for:

- characters;
- dialogue graphs;
- claims;
- chapters and scheduled events;
- attention windows;
- interaction objects;
- localization keys;
- epilogue conditions;
- historical-ledger links attached to content or assets where appropriate.

Use the example YAML files as seeds. Improve them only when required by a documented schema decision.

### Required engine behavior

- A choice may require directly witnessed knowledge, fragmentary knowledge, second-hand knowledge, or any known form.
- The UI must not present direct-witness wording when the player only heard a rumor.
- Silence is an explicit timed choice and can trigger unique effects.
- Every effect is applied through a validated command/effect transaction.
- The scheduler is deterministic and can pause for unresolved attention windows.
- The same save state must replay to the same result.
- Unreachable nodes, missing localization keys, impossible conditions, contradictory IDs, and orphaned claims fail validation.
- The engine must expose a simulation mode that can run many valid choice paths without rendering.

### Required sample scene

Implement a 10–15 minute graybox scene using Sasha, Galina, Arkady, Lev, Nikolai, and Gennady placeholders. Include:

- 20 or more dialogue nodes;
- at least three meaningful silences;
- one public claim that later contradicts itself;
- one private claim with a social cost if repeated;
- one attention window with direct, fragmentary, and missed outcomes;
- one object-state consequence;
- two end-state summaries.

Do not treat sample prose as final production dialogue.

### Required tests

- schema validation;
- graph reachability;
- knowledge provenance and choice wording;
- contradictory claim links;
- condition/effect execution;
- deterministic event scheduling;
- save serialization migration/version handling;
- save/restore equivalence;
- simulation of at least 500 valid paths without uncaught errors;
- keyboard-only scene completion.

### Acceptance criteria

The sample scene supports materially different interpretations without changing public history, all content is externalized from engine code, invalid content fails before the game runs, and all tests pass.

### Stopping condition

Stop after the narrative-system gate. Do not create the final room or production character art.

---

# Phase 3A — Historical visual research and geometry lock

## Prompt

Implement **Phase 3A only**: build the evidence board, material specification, floor plan, and perspective-locked environment blockout. Do not generate the rendered room yet.

Read:

- `AGENTS.md`
- `PLAN.md`, sections 4, 14, 15, 18, and 20
- `docs/HISTORICAL_BIBLE.md`
- `docs/ART_BIBLE.md`, sections 1–5 and 8–10
- `docs/ART_DIRECTION_SCORECARD.md`
- `docs/VISUAL_QA.md`, sections 3–4 and 10–12
- `docs/ASSET_MANIFEST.md`
- `.prompts/environment_master.md`

### Objective

Create a defensible visual specification for the fictional café-bar `Кафе-бар «Смена»` and lock its geometry before any final visual generation or pixel cleanup.

### Research method

Use a bounded **historical-research subagent** to gather dated, attributable references for ordinary Soviet public-catering interiors and fixtures from approximately 1965–1991. Use primary or institutional sources where practical. Distinguish:

- direct visual evidence;
- plausible composite choices;
- pure mood references;
- rejected/anachronistic references.

For every material claim or exact object model, add a row to `research/HISTORICAL_LEDGER.csv`. Do not infer an exact model from an undated photograph.

Use a separate **art-direction subagent** to translate the approved evidence into material, proportion, wear, and palette rules without adding facts.

### Required outputs

- `art/reference/BAR_REFERENCE_INDEX.md` with reference IDs, date, location, source, intended use, and limitations;
- `art/reference/BAR_DO_NOT_USE.md` covering modern industrial décor, generic propaganda walls, pseudo-Cyrillic, post-Soviet symbols, boutique cocktail styling, and other anachronisms;
- `art/spec/bar_material_schedule.yaml`;
- `art/spec/bar_lighting_diagram.svg`;
- `art/blockout/bar_floor_plan.svg` with dimensions;
- `art/blockout/bar_perspective.svg` with horizon and vanishing points;
- `art/blockout/bar_anchors.yaml`;
- canonical in-game blockout screenshots at both target resolutions.

### Bar design constraints

Treat the room as an aging state café-bar opened in 1968 and partly refurbished in 1982. It is maintained, repaired, and mismatched—not derelict, glamorous, or curated for nostalgia.

Provisional dimensions:

- room: approximately 7.2 m × 5.8 m;
- ceiling: approximately 2.7 m;
- five patron tables;
- 16–18 seats;
- bar counter and rear service zone;
- television high in a corner;
- telephone behind the counter;
- service door and short corridor;
- street entrance with changing sound and light.

These are fictional design decisions, not historical claims. Historical details applied to them must be ledgered.

### Geometry review

Overlay the perspective grid in the running game. Test every seat with a neutral human mannequin. Verify:

- table and counter heights;
- hip, knee, foot, and elbow relationships;
- walk paths and sight lines;
- furniture occlusion layers;
- clear television visibility;
- subtitle-safe space;
- no head-to-head tangencies or lamp/vertical collisions.

### Acceptance criteria

The blockout reads as a credible, specific public interior; all dimensions and anchors are stable; mannequins can sit without impossible anatomy; and no historically exact detail is accepted without a ledger row.

### Stopping condition

Stop after geometry and research review. Do not generate the rendered room or characters.

---

# Phase 3B — Empty-room visual target

## Prompt

Implement **Phase 3B only**: create and integrate the empty-room visual target. The room must contain no people and no generated text.

Read:

- `AGENTS.md`
- `docs/ART_BIBLE.md`, especially sections 2–5, 8–10, 13–16
- `docs/ART_DIRECTION_SCORECARD.md`
- `docs/HISTORICAL_BIBLE.md`
- `docs/VISUAL_QA.md`
- `docs/ASSET_MANIFEST.md`
- `.prompts/environment_master.md`
- the approved blockout, material schedule, lighting diagram, and reference index

### Objective

Produce an original pixel-illustrated chamber-drama environment with the readability and staging principles described in the art bible. _Papers, Please_ is a quality bar for low-resolution clarity and tactile consequence, not a layout, palette, typography, interface, pixel-cluster, narrative, or asset reference.

### Non-negotiable generation constraints

- Use the approved perspective blockout as the image input and geometry source of truth.
- Generate **one empty room only**.
- No people, partial people, silhouettes, portraits with faces, reflections of people, words, menu lettering, prices, brand labels, or pseudo-Cyrillic.
- Preserve all walls, doors, counter edges, tables, seat planes, television housing, and major lighting positions.
- Do not ask the generator to invent the floor plan.
- Request or draw a clean high-resolution source illustration, not direct generated pixel art.
- Reduce the selected source through the documented palette pipeline, then correct the 640×360 result by hand. The corrected low-resolution version is canonical.
- Produce a small controlled set of candidates with the same geometry, not radically different designs.
- Save every exact prompt and reference list under `.prompts/runs/`.
- Place outputs in `art/review_queue/env_bar/`; none is approved automatically.

### Selection procedure

1. Compare all candidates against the blockout using overlays.
2. Reject any candidate with structural drift before considering color or mood.
3. Choose one base candidate only.
4. Correct geometry with targeted edits, vector reconstruction, or paintover.
5. Replace high-risk repeated objects—bottles, chairs, glassware, shelf dividers—with controlled separate assets where needed.
6. Remove all accidental lettering.
7. Split the approved visual into the layer groups in the asset manifest.
8. Implement stable runtime lighting overlays rather than regenerating whole rooms.
9. Lock and version the palette, remove unexplained off-palette pixels, and correct edge, material, and lighting clusters at native resolution.

### Mandatory defect review

Open the source at 100%, inspect the 640×360 canonical art at native size and 800 percent, then inspect the running composite at exact 3× within 1920×1080 and exact 2× within 1366×768. Document, at minimum:

- every furniture support;
- shelf depth and spacing;
- ellipses on glasses and lamps;
- door and counter alignment;
- light direction and contact shadows;
- material transitions;
- unintended modern objects;
- accidental symbols or text;
- repeated or melted details;
- composition under the longest dialogue UI.
- smoothing, fractional placement, crawling dithering, and interpolation shimmer;
- interactive-prop readability before highlighting.

List at least five actual observations, even if they are passes. “Looks good” is not a review.

### Acceptance criteria

The integrated empty room matches the blockout, feels materially specific, contains no visible structural defect at native scale, includes no generated text, remains readable under UI, uses the locked palette without unexplained colors, presents with integer scaling and no smoothing or shimmer, and can support later character compositing without rebuilding the architecture.

### Stopping condition

Stop with candidate comparisons, rejected-defect notes, approved base rationale, and canonical screenshots. Do not create character art.

---

# Phase 3C — First canonical character and seated-pose gate

## Prompt

Implement **Phase 3C only**: create the complete canonical identity package for **Arkady**, then prove that the same identity survives one approved seated pose. Do not create the remaining cast.

Read:

- `AGENTS.md`
- Arkady's dossier in `docs/NARRATIVE_DESIGN.md`
- `docs/ART_BIBLE.md`, sections 2–3, 6–10, and 13–16
- `docs/ART_DIRECTION_SCORECARD.md`
- `docs/VISUAL_QA.md`, sections 3, 5–6, 10–12
- `docs/ASSET_MANIFEST.md`
- `.prompts/character_master.md`
- `.prompts/character_pose_edit.md`

### Objective

Lock one human character whose face, age, body, clothing, proportions, and silhouette remain recognizably identical between a neutral master and an in-scene seated pose.

### Required sequence

1. Create `art/characters/arkady/char_arkady_design_card.md` using concrete anatomy, posture, garment construction, palette, and prohibited-change fields.
2. Verify each exact clothing or prop claim against the historical ledger.
3. Produce black silhouette options only; select one based on recognizability and seating compatibility.
4. Generate one neutral full-body 3/4 master on a simple background. One person only. Full body visible. Hands open and separated. No furniture and no text.
5. Correct anatomy before making additional views.
6. Generate/edit front and profile views using the approved master as visual input. Do not independently re-invent the face.
7. Create a small expression set from the canonical head: neutral, attentive, amused, defensive, ashamed, exhausted. One expression at a time or through controlled edits if a sheet causes drift.
8. Use the exact seat template and approved character master to create `seated_listen`. Render no chair into the character layer.
9. Composite the pose between `seat_back` and `furniture_front`, add separate contact shadow and prop layers, and inspect it in the running room.

### Identity invariants

The following must not change:

- skull and face proportions;
- nose, brow, ears, jaw, eye spacing, and hairline;
- apparent age;
- height and body mass;
- shoulder slope and habitual posture;
- garment cut, closures, lapels, cuffs, pockets, and palette;
- glasses, if present;
- handedness and signature prop conventions.

Use overlays and side-by-side crops. “Same general type of man” is a failure.

### Seating invariants

- pelvis rests on the seat plane;
- thighs project in a plausible direction;
- knees, shins, and feet obey the perspective template;
- feet contact the floor or foot rail appropriately;
- elbows do not penetrate the table;
- jacket and chair do not merge;
- hands have correct digit count and grip logic;
- contact shadows make the body feel seated rather than pasted on.

### Required independent review

Use an **art-QA subagent** that sees only:

- the canonical master;
- the seated composite;
- the identity-invariant list;
- the seating template.

Require it to return a defect table with severity and exact image region. Do not ask it whether it “likes” the art.

### Failover rule

If identity or seating fails after two disciplined edit cycles, do not generate more poses. Reduce the design's micro-detail or test the theatrical cutaway fallback for this character, then report the comparison.

### Acceptance criteria

Arkady is identifiable by silhouette; face and clothing remain invariant; anatomy and seating are credible; transparent edges and contact shadows work; and the character feels deliberately integrated into the room at both canonical resolutions.

### Stopping condition

Stop after Arkady's identity-and-seating gate. Do not create the rest of the cast.

---

# Phase 3D — Visual target lock

## Prompt

Implement **Phase 3D only**: prove that the visual system can reproduce a second distinct character, one memory vignette, and the complete dialogue interface without style drift.

Read all visual documents and the approved Arkady package.

### Objective

Create:

- Sasha's canonical package at the minimum scope required for the bar scene;
- one approved seated/behind-counter pose as appropriate;
- one 30–60 second memory-vignette visual prototype;
- the final interface style sheet and SVG icon family;
- the canonical screenshot matrix.

### Constraints

- Sasha must not resemble Arkady in face construction, body proportions, or contour rhythm.
- The room must not be regenerated.
- Memory art may transform bar geometry but cannot imply objective, documentary truth.
- UI is SVG/CSS/runtime text. No generated words.
- No broad stylistic redesign is allowed without a written gate failure.

### Mandatory visual matrix

Capture and review:

1. empty room, evening;
2. Arkady and Sasha in the room, no UI;
3. close focus on Arkady;
4. close focus on Sasha;
5. television-light state;
6. door-open state;
7. memory vignette;
8. longest dialogue line;
9. keyboard focus state;
10. 1366×768 and 1920×1080 variants.

For every image, record observations under composition, anatomy, perspective, historical plausibility, readability, consistency, and artifacts.

### Acceptance criteria

The pipeline reproduces quality across two unlike people; the room, people, vignette, and UI feel authored as one game; no identity drift or malformed anatomy is visible; and all canonical screenshots are ready to become reviewed visual baselines.

### Stopping condition

Stop at the formal visual-target decision: `LOCK`, `REVISE`, or `SWITCH TO THEATRICAL CUTAWAY`. Do not create the remaining characters until the decision is `LOCK`.

---

# Phase 4 — Vertical-slice production

## Prompt

Implement **Phase 4 only**: the polished 30–45 minute vertical slice described in `PLAN.md`.

### Required cast and content

- Sasha;
- Galina;
- Arkady;
- Lev;
- Nikolai;
- Gennady;
- three chapters;
- six broadcast, telephone, radio, or street events;
- 60 or more authored dialogue nodes;
- two memory vignettes;
- five or more meaningful silences;
- three epilogue variations;
- complete ambience and restrained foley;
- settings, subtitles, keyboard navigation, reduced motion, and content warnings.

### Production order

Do not create assets in bulk. Complete one patron at a time:

1. dossier and historical claims;
2. design card and silhouette;
3. canonical master;
4. seating gate;
5. minimum pose set;
6. dialogue integration;
7. in-game screenshot review;
8. approval before the next patron.

Do not ask image generation for a full cast image. Do not use a later character's generation to repaint an already approved character.

### Narrative rules

- Every exchange must change status, relationship, knowledge, tension, time, or an object.
- No patron is a mouthpiece for one ideology.
- The player cannot alter the coup's outcome.
- Attention choices must cause genuine missed or distorted testimony.
- Silence must sometimes be the strongest action.
- Public facts, rumors, and private fiction must remain distinguishable in data and writing notes.
- The ending is assembled from witnessed claims, preserved or destroyed objects, relationships, departures, and Sasha's ledger—not a visible morality score.

### Art rules

- Reuse the locked environment.
- Use the approved character workflow without shortcuts.
- One pose at a time; canonical master always supplied as visual input.
- Props and hands are separate where risk is high.
- No generated lettering.
- Every new visual asset enters the review queue and must pass the checklist.
- After each patron, capture the canonical room and close-focus images and run an identity-drift comparison.

### Verification

- full automated check suite;
- simulation of story paths and unreachable-content report;
- two complete Playwright playthroughs with materially different attention choices;
- save/restore at chapter boundaries and inside an attention window;
- 1920×1080 and 1366×768 screenshot matrix;
- performance profile;
- keyboard-only completion;
- reduced-motion and subtitle stress tests;
- no uncaught console errors.

### Acceptance criteria

The slice lasts 30–45 minutes, produces at least two distinct emotional readings, maintains visual and historical coherence, and meets every Phase 4 gate in `PLAN.md`.

### Stopping condition

Stop after the slice is complete and provide a gate report. Do not expand to the full game.

---

# Phase 5 — Adversarial review and rewrite

## Prompt

Do not add new content. Conduct **Phase 5 only**: adversarially evaluate and revise the vertical slice.

Use independent bounded reviewers for:

1. **Historical integrity:** identify unsupported exact claims, anachronisms, flattened perspectives, and chronology problems.
2. **Russian language/culture:** identify unnatural forms of address, pseudo-Cyrillic, imported stereotypes, and social behavior that needs native review. Clearly mark anything requiring a human specialist.
3. **Narrative:** identify exposition, ideology-mouthpiece characters, false equivalence, weak silence options, and choices without consequence.
4. **Visual:** compare all canonical character masters and in-game poses; identify drift, anatomy, seating, perspective, lighting, and compositing defects.
5. **Accessibility and UX:** complete the slice by keyboard, test subtitles and reduced motion, and identify ambiguity.
6. **Technical:** inspect determinism, save migration, performance, console output, content validation, and test gaps.

### Required deliverable

Create `docs/VERTICAL_SLICE_REVIEW.md` containing:

- severity-ranked issues;
- evidence with file, node, asset, or screenshot IDs;
- proposed smallest correction;
- owner discipline;
- whether the issue blocks expansion;
- retest requirement.

Fix all critical issues and as many high-severity issues as possible without scope expansion. Re-run all gates.

### Decision

End with exactly one recommendation:

- `EXPAND` — the slice validates the premise and pipeline;
- `REVISE` — retain scope and perform another focused pass;
- `RESTYLE` — narrative works but the art pipeline is not reproducible;
- `REDUCE` — quality is possible only with fewer characters/poses/events;
- `STOP` — the implementation does not yet justify full production.

Support the decision with observable results, not optimism.

### Stopping condition

Stop after the review, corrections, retests, and production decision. Do not begin full-game expansion.

---

# Full-production prompt pattern

Only use this after Phase 5 returns `EXPAND`.

> Implement one bounded full-production unit: [one patron / one chapter / one vignette / one system]. Read the approved vertical-slice baselines and all relevant design documents. Preserve existing behavior and visual truth. State the single objective, files and assets expected to change, acceptance criteria, and stopping condition before editing. Use a separate reviewer for historical, narrative, and visual checks as applicable. Run the complete relevant test and screenshot matrix. Stop after this unit passes; do not batch the next unit.

---

# Corrective prompt when Codex produces visually weak output

Use this instead of asking for a vague “make it prettier” pass:

> The current visual output does not pass the project gate. Do not redesign broadly and do not generate a new full scene. Compare the attached/identified current screenshot with the approved blockout, canonical character masters, material schedule, palette, and target screenshot. Return a defect table with: region, category, severity, violated invariant, smallest corrective action, and whether the correction belongs in source art, compositing, runtime layout, lighting, or UI. Prioritize geometry, identity, anatomy, and readability before texture or decoration. Fix only the top [N] defects, run the app, capture both canonical resolutions, and repeat the comparison. Stop after reporting the before/after evidence. Do not call an asset approved unless it passes `docs/VISUAL_QA.md`.

# Corrective prompt for a drifting character

> Do not invent a new version of this character. Treat `[canonical master path]` as immutable identity truth and `[current pose path]` as defective. Compare skull, brow, eye spacing, nose, ears, jaw, hairline, age, shoulder slope, body mass, garment construction, palette, and signature prop. Preserve pose intent but edit only the drifting regions. Use `[seat template path]` for pelvis, knee, foot, elbow, and table relationships. Render the person without furniture or text. Composite between the approved seat-back and furniture-front layers, add separate contact shadow, and inspect at 100% plus both game resolutions. Return exact corrected and still-unresolved defects.

# Corrective prompt for a malformed environment

> Do not regenerate the room from imagination. Use `[blockout path]` as geometry truth and `[current room path]` as the base. Overlay the perspective grid and identify every deviation in walls, doors, counter edges, shelves, tables, chairs, ellipses, supports, and cast shadows. Correct structure before color, wear, or texture. Remove all pseudo-text and replace repeated high-risk objects with separate controlled props. Preserve the accepted composition and materials. Return an overlay comparison and a defect table. Stop before adding people.
