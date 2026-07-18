# GitHub release (2026-07-18)

## Objective

Create the first public Git repository, release version 0.1.0, and deploy the playable sample through GitHub Pages.

## Release scope

- Public repository: `OliverBeerAsia/withering-despots`
- Release tag: `v0.1.0`
- Deployment target: `https://oliverbeerasia.github.io/withering-despots/`
- README rewritten as a direct account of the game, the current build, its controls, and its historical approach.
- Generated folders, local screenshots, environment files, package caches, and test output excluded from version control.

## Local verification

- Formatting: pass.
- ESLint: pass.
- Strict TypeScript: pass.
- Unit tests: 65 passed.
- Content validation: 18 passed.
- Narrative simulation: 12 passed.
- Production build: pass.
- Final browser suite: 28 passed in each of three consecutive runs.
- Final visual suite: 18 passed in each of three consecutive runs.
- Staged diff whitespace check: pass.
- Staged secret-pattern scan: no matches.

## Known compromises

- The production bundle reports one main chunk slightly above 500 kB.
- Dialogue and parts of the art package remain provisional.
- The wider art review queue is included for project history but is not production-approved.

## Remote evidence

- Created the public repository at `https://github.com/OliverBeerAsia/withering-despots`.
- Pushed `main` and enabled GitHub Pages with `build_type: workflow` and enforced HTTPS.
- The first run, `29636336233`, exposed the workflow's pnpm setup order and failed before install.
- The second run, `29636390292`, reached the build and exposed an undeclared direct `playwright` import.
- Corrected both clean-run defects and reproduced formatting, linting, type checking, 65 unit tests, 18 content tests, 12 simulation tests, and the production build locally.
- Run `29636722587` completed both the GitHub build and Pages deployment jobs.
- The live URL returned HTTP 200 over HTTPS.
- A headed browser opened the live game at 19:25 with the correct title, Galina's opening line, three choices, and Pause control.
- Choosing `Read the room first.` advanced the live game to 19:26 and displayed the expected room observation and continuation control.
- The only browser-console error was a missing optional `favicon.ico`; no game asset or runtime request failed.
