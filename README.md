# Withering Despots

_Withering Despots_ is a historical narrative point-and-click game set in a fictional Moscow café-bar on the night the August 1991 coup attempt collapses.

[Play the current build](https://oliverbeerasia.github.io/withering-despots/)

You are Sasha, working behind the counter as news, rumours, old loyalties, and private grievances pass through one small room. History will end as it did. Your choices determine whom Sasha listens to, what gets challenged, what gets served, which broadcast fills the room, and what account of the night survives.

## The game

The whole game takes place in one bar. There is no combat, free walking, inventory puzzle chain, or route that lets the player rewrite the coup.

Sasha acts through five verbs:

- **Observe** the room, its objects, and the way people react when they think nobody is watching.
- **Speak** to ask, confront, deflect, or give somebody room to explain themselves.
- **Serve** drinks and tend the bar while conversations continue around the work.
- **Tune** the television or radio and decide which public voice enters the room.
- **Wait**, including choosing silence when another question would do more harm than good.

The patrons are not ideological tokens. Each carries work they are proud of, conduct they would rather qualify, and a reason to fear what comes next. The player can expose contradictions, preserve a confidence, miss a crucial remark, or let a public version of events harden uncontested.

## Current playable build

The current browser build spans twenty in-world minutes, from 19:25 to 19:45 on 21 August 1991. It includes:

- one fixed 640 by 360 pixel-art room;
- Sasha, Galina, and four patrons;
- dialogue shaped by attention, prior knowledge, silence, and private claims;
- television and radio settings, plus glass, photograph, tea, and stock-book states, that persist through save and restore;
- ordinary bar work alongside the central argument;
- an exclusive three-way attention choice during a broadcast;
- thirty-four optional pauses from 10 seconds to one minute;
- Full, Brief, and Immediate pacing settings;
- quiet room tone, sparse incidental sound, original diegetic music, and restrained whole-pixel movement;
- public and private scene conclusions without an alternate historical outcome.

Every long pause can be ended immediately with Continue, a panel click, Space, or Enter. Pause and a hidden browser tab preserve the remaining presentation time. Reduced motion freezes nonessential movement, and incidental room sounds can be reduced separately.

The dialogue and parts of the art package remain provisional. This is a systems and atmosphere proof, not the full night or the finished vertical slice. The earlier interaction graybox remains available at `/?phase=1`.

## Historical approach

The game uses a fictional bar and composite characters, but it treats the documented chronology as fixed. Material details, service practices, broadcasts, and factual claims are tracked in `research/HISTORICAL_LEDGER.csv` with their source status.

Broadcast dialogue is fictionalized. The game does not reproduce long archival transcripts or use familiar Soviet imagery as shorthand for an entire society.

## Controls

- Pointer: select choices and room controls.
- Tab and arrow keys: move through available actions.
- Enter or Space: activate the focused control or end a presentation pause.
- `S`: choose silence when silence is available.
- Escape: open or close Pause.

The game supports keyboard-only completion, visible focus, 150 percent interface text, high-contrast panels, reduced motion, separate audio settings, and checkpoint save and restore.

## Run locally

Requirements: Node.js 24 or newer and Corepack.

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm exec playwright install chromium
corepack pnpm dev
```

Open the local URL printed by Vite.

## Verification

Run the complete gate:

```sh
corepack pnpm check
```

The gate covers formatting, linting, strict TypeScript, unit tests, content validation, deterministic narrative simulation, production build, browser interaction, keyboard play, save and restore, accessibility behavior, and visual comparisons at 1920 by 1080 and 1366 by 768.

## Project documents

- `PLAN.md`: product direction, scope, and milestone order.
- `docs/NARRATIVE_DESIGN.md`: cast, agency, contradictions, and endings.
- `docs/HISTORICAL_BIBLE.md`: chronology and research rules.
- `docs/ART_BIBLE.md`: visual language and asset boundaries.
- `docs/TECHNICAL_ARCHITECTURE.md`: deterministic runtime and content architecture.
- `docs/IMPLEMENTATION_STATUS.md`: what is currently implemented and what remains provisional.
- `docs/VISUAL_QA.md`: visual acceptance process.

The current milestone remains Phase 2. Full-night content and the remaining art approvals are still ahead.

## Disclaimer

_Withering Despots_ is a work of historical fiction. Its café, Sasha, Galina, and the patrons are fictional. Any resemblance between these fictional characters and actual people, living or dead, is coincidental.

The game refers to documented historical events and may refer to public figures, institutions, broadcasts, places, or products as part of its setting. Fictional dialogue, private conduct, opinions, and relationships should not be understood as factual claims about any real person or organisation.

The views expressed by characters belong to those characters. They do not represent the views of the developers, contributors, distributors, or any organisation mentioned in the game. The project is not affiliated with or endorsed by any government, political organisation, broadcaster, archive, rights holder, or estate. Names and trademarks remain the property of their respective owners.
