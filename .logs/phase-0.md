# Phase 0 work log

Date: 2026-07-16  
Objective: Create the repository skeleton and deterministic development toolchain only.  
Stopping condition: Stop when every Phase 0 acceptance criterion passes.

## Decisions

- Kept the implementation browser-first with strict TypeScript, Vite, PixiJS, semantic HTML/CSS, Ajv, Vitest, and Playwright.
- Used JSON for the Phase 0 content placeholder. This avoids adding a YAML parser before authored content exists.
- Added only two runtime dependencies: `pixi.js` for the required scene layer and `ajv` for fail-loud JSON Schema validation.
- Added Vite, TypeScript, Vitest, Playwright, ESLint, Prettier, `tsx`, and type packages as development tools. React, Howler, save libraries, and narrative frameworks were deferred.
- Pinned TypeScript 5.9.3 after TypeScript 7.0.2 conflicted with PixiJS 8 WebGPU and pointer-event declarations. Project code remains strict. `skipLibCheck` is limited to incompatible third-party declaration internals.
- Kept Pixi decorative in Phase 0 and authoritative text in the DOM. The canvas is hidden from the accessibility tree and cannot receive focus.
- Used a native development-only `details` disclosure as the sole keyboard target. No gameplay controls or keymaps were added.
- Established a 1920 by 1080 logical renderer and CSS 16:9 stage scaling with letterboxing rather than stretching.
- The visual problem for this phase is limited to readable placeholder staging and keyboard focus at the two canonical viewports. No generated or final assets were created.
- The source pack has no Git metadata. A true clean-checkout or Git diff audit is unavailable; verification uses a frozen-lockfile reinstall and explicit file inventory instead.

## Team reviews

- Architecture audit: identified missing toolchain, structure, validation, deterministic state boundary, development guard, and canonical viewport proof.
- Test audit: specified RNG replay, deterministic simulation, invalid-content rejection, console-clean browser smoke, semantic DOM, focus, letterboxing, and visual baselines.
- Accessibility audit: required one labeled main region, a semantic overlay, decorative canvas policy, native diagnostics disclosure, and a strong visible focus ring.
- The same bounded agents executed only non-overlapping configuration, accessibility, and test files. Integration remained with the lead agent.

## Commands and outcomes

- `node --version`: passed with v24.18.0.
- `corepack pnpm --version`: passed with v11.5.2.
- `npm view <dependency>@latest version`: used to audit available pinned versions.
- `corepack pnpm install`: first sandboxed attempt failed with npm registry DNS `ENOTFOUND`.
- `corepack pnpm install` with approved registry access: dependencies installed and lockfile created; pnpm reported an ignored `esbuild` build.
- Added explicit `allowBuilds.esbuild: true`, rebuilt `esbuild`, and added noninteractive module-purge behavior to the workspace configuration.
- `corepack pnpm install --frozen-lockfile`: passed after configuration correction.
- `corepack pnpm exec tsc --noEmit`: initially exposed TypeScript 7 and PixiJS declaration conflicts; passed after the documented TypeScript pin and validation type correction.
- `corepack pnpm exec tsx scripts/validate-content.ts`: sandboxed run failed because `tsx` could not create its IPC socket; approved rerun passed.
- `corepack pnpm lint`: passed.
- `corepack pnpm peers check`: passed with no peer dependency issues.
- `corepack pnpm test`, `test:content`, and `test:simulation`: passed 5 unit, 2 content, and 3 simulation assertions.
- `corepack pnpm test:e2e`: passed 6 browser assertions across 1920 by 1080 and 1366 by 768; the suite also checked 1024 by 768 letterboxing.
- Initial visual-baseline generation used an extra argument separator, so Playwright created the missing baselines but correctly reported the first run as failed. The normal `corepack pnpm test:visual` rerun passed both canonical projects.
- `corepack pnpm exec tsx scripts/validate-content.ts tests/content/fixtures/phase-0.invalid.json`: failed as intended with exit code 1, an additional-property error, and the invalid logical-width path.
- Clean-copy proof used `/private/tmp/withering-despots-phase0-clean-20260716` with no copied `node_modules`, `dist`, or test output.
- Clean-copy `corepack pnpm install --frozen-lockfile`: passed and ran the explicitly allowed `esbuild` postinstall.
- First clean-copy `corepack pnpm check`: failed on two strict lint findings in a test callback. The callbacks were corrected without changing behavior.
- Second clean-copy `corepack pnpm check`: passed formatting, lint, type checking, unit, content, simulation, production build, 6 browser smoke tests, and 2 visual tests.

## Screenshots reviewed

- `tests/screenshots/phase-0-keyboard-focus-1920x1080.png`, confirmed at 1920 by 1080.
- `tests/screenshots/phase-0-keyboard-focus-1366x768.png`, confirmed at 1366 by 768.

| Region                             | Category                | Severity         | Violated invariant               | Observation                                                                                                    | Smallest correction                                                           | Owner layer              |
| ---------------------------------- | ----------------------- | ---------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------ |
| Full stage, both captures          | Geometry                | pass-observation | None                             | Canvas guides retain their proportions and align to the 16:9 viewport with no stretching or clipping.          | None in Phase 0.                                                              | Pixi and CSS stage       |
| 1024 by 768 automated probe        | Letterboxing            | pass-observation | None                             | The stage resolves to 1024 by 576 and centers with 96-pixel top and bottom bars.                               | None.                                                                         | CSS stage                |
| Lower-left overlay, 1920           | Readability             | pass-observation | None                             | Title, status, and diagnostics label remain sharp with comfortable margins.                                    | None.                                                                         | DOM overlay              |
| Lower-left overlay, 1366           | Composition             | low              | Future subtitle-safe composition | The panel occupies a substantial part of the lower-left stage, though it remains unclipped and readable.       | Reserve this region during Phase 1 composition testing; do not alter Phase 0. | Later room and UI design |
| Diagnostics summary, both captures | Keyboard focus          | pass-observation | None                             | The white outline and black separation ring are unmistakable against the panel and remain inside the viewport. | None.                                                                         | DOM overlay CSS          |
| Placeholder planes                 | Scope and visual intent | pass-observation | None                             | Simple geometric planes and guide rectangles read as a technical scaffold, not as final room art.              | Replace only in the assigned later visual phases.                             | Pixi placeholder         |
| Canvas and text                    | Text integrity          | pass-observation | None                             | All visible text is semantic DOM text; no lettering is baked into the Pixi placeholder.                        | None.                                                                         | DOM and Pixi boundary    |

Visual-gate inputs: the logical-stage contract, `docs/ART_BIBLE.md`, `docs/ART_DIRECTION_SCORECARD.md`, `docs/VISUAL_QA.md`, and `docs/ASSET_MANIFEST.md`. No generated asset, image prompt, candidate rejection, or asset approval occurred. Gate result: `PASS` for the Phase 0 placeholder only.

## Defects and compromises

- The placeholder and its screenshot baselines are not art approval and do not establish the room composition.
- TypeScript library checking is skipped for third-party declarations only because PixiJS 8.19.0 conflicts with strict optional-property checking inside its own bitmap-font types.
- Git-based clean-checkout proof is unavailable because the supplied pack is not a Git repository.
- Both required canonical viewports are effectively 16:9. The added 1024 by 768 browser assertion provides the stronger letterboxing proof.

## Unresolved questions and remaining risks

- No unresolved Phase 0 blocker or high defect remains.
- Phase 1 composition must account for the lower-left semantic interface safe area observed at 1366 by 768.
- A Git repository should be initialized by the project owner before later work if commit-level diff and clean-checkout proof are required.
