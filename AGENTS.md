# Repository instructions

## Product intent

Build **Withering Despots**, an original historical narrative point-and-click chamber drama set in a fictional Moscow café-bar during the evening of 21 August to the morning of 22 August 1991.

The player cannot alter the historical outcome. Agency comes from choosing whom to watch, what to ask, what to serve, which broadcast to follow, when to interrupt, and when to remain silent.

## Required reading before work

Read, in order:

1. `PLAN.md`
2. `docs/ART_BIBLE.md`
3. `docs/HISTORICAL_BIBLE.md`
4. `docs/NARRATIVE_DESIGN.md`
5. `docs/TECHNICAL_ARCHITECTURE.md`
6. `docs/ART_DIRECTION_SCORECARD.md`
7. `docs/VISUAL_QA.md`
8. `docs/ASSET_MANIFEST.md`

For image work, also read the relevant file in `.prompts/`.
Invoke the repository skill `$withering-despots-visual-gate` for every environment, character, pose, prop, UI-art, memory-vignette, or screenshot-polish task.

## Working rules

- Work on one explicit objective with one stopping condition at a time.
- Follow the milestone order in `PLAN.md`; do not skip directly to full-game content.
- Keep a short dated log under `.logs/` containing decisions, commands run, screenshots reviewed, defects found, and unresolved questions.
- Use strict TypeScript. Keep systems data-driven and deterministic.
- Run formatting, linting, type checking, unit tests, content validation, build, and Playwright tests before declaring a task complete.
- Add or update tests whenever behavior changes.
- Review the final diff for regressions, unreachable content, accidental dependencies, and historical or visual drift.

## Visual implementation rules

- The production target is an original pixel-art-esque chamber drama on the documented native grid. Use _Papers, Please_ only as a quality bar for systemic pressure, compact writing, tactile feedback, consequence clarity, and low-resolution readability. Do not copy its layouts, palette, typography, characters, interface positions, inspection loop, narrative structure, pixel clusters, or assets.
- Never generate a final scene containing the room, all furniture, all characters, and all text in one image.
- Build from an approved perspective blockout.
- Generate the empty environment first, then props, then one character or pose at a time.
- Preserve canonical character identity, clothing, proportions, palette, and age across all poses.
- Keep text and signage as reviewed SVG, HTML, or game text; never trust generated lettering.
- Save every image prompt under `.prompts/runs/` with the asset ID and date.
- New generated images enter `art/review_queue/`, not `art/approved/`.
- An asset may move to `art/approved/` only after passing `docs/VISUAL_QA.md`.
- After every visual change, run the game, capture the canonical screenshots, list visible defects, and iterate until the acceptance gate is met.

## Historical implementation rules

- Add every factual or material-culture claim to `research/HISTORICAL_LEDGER.csv` before treating it as final.
- Mark entries as `verified-primary`, `verified-secondary`, `plausible-composite`, or `unverified`.
- Do not use exact prices, product models, slogans, uniforms, medals, dates, or broadcast wording unless sourced.
- Fictionalize real broadcast language; do not reproduce long archival transcripts.
- Avoid anachronistic flags, branding, typography, furniture, bottles, lighting, consumer electronics, and post-Soviet décor.
- Do not reduce the Soviet past to propaganda posters, misery, or ideological caricatures.

## Narrative rules

- Every major patron must have a public belief, private fear, cherished achievement, compromised action, and at least one contradiction.
- No character may exist only to represent an ideology.
- Do not equate every claim as equally true. Contradictory memories may remain unresolved, but documented harm must not be trivialized.
- Humor should arise from vanity, bureaucracy, status, failed ritual, and human incongruity, never ethnic caricature or victims' suffering.
- Silence must be a meaningful player action.
- Avoid conventional inventory-combination puzzles and fetch quests.

## Writing style

- Use plain, direct language that fits the project's established voice and the user's own phrasing.
- Do not use em dashes in project-authored copy, documentation, UI text, or dialogue unless reproducing an exact source.
- Avoid generic synthetic phrasing, inflated claims, slogan-like filler, and tidy rhetorical patterns that do not sound human.
- Do not write self-referential process commentary into the game. Player-facing text must belong to the room, the people, or the interface.
- Keep placeholder copy clearly provisional without making the player read development commentary.
- Read lines aloud during review. Rewrite anything that sounds like a template, a pitch deck, or an assistant explaining itself.

## Definition of done

A task is not done until:

- acceptance criteria are met;
- tests and validators pass;
- the running game has been inspected;
- screenshots have been compared to approved references;
- defects and compromises are documented;
- the relevant docs and asset manifests are updated.
