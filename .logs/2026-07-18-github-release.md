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

Remote creation, release, deployment workflow, and live URL verification will be recorded in the release handoff.
