# Technical Architecture

## 1. Recommended implementation strategy

Build the first playable version as a desktop-oriented browser game. This makes the visual iteration loop fast, allows deterministic Playwright interaction and screenshot tests, and avoids committing to desktop packaging before the game proves itself.

Recommended stack:

- Node.js current LTS at project initialization;
- `pnpm` with a committed lockfile;
- strict TypeScript;
- Vite current stable major, pinned;
- PixiJS 8.x for the 2D scene;
- semantic HTML/CSS overlays for dialogue, menus, subtitles, tooltips, settings, and debug controls;
- Howler or another narrowly scoped browser audio library;
- YAML content loaded into typed data models;
- Zod or JSON Schema validation at build time and in development;
- Vitest or equivalent for unit and simulation tests;
- Playwright for end-to-end flows and visual regression;
- ESLint and Prettier or equivalent consistent tooling.

Do not add React initially. The game has one scene and a limited interface. A small DOM application around a Pixi canvas is simpler to debug and visually control. Reconsider only if interface complexity grows substantially.

---

## 2. Repository structure

```text
withering-despots/
├── AGENTS.md
├── PLAN.md
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── eslint.config.js
├── .logs/
├── .prompts/
│   ├── environment_master.md
│   ├── character_master.md
│   ├── character_pose_edit.md
│   ├── prop_master.md
│   ├── memory_vignette.md
│   └── runs/
├── art/
│   ├── blockout/
│   ├── reference/
│   ├── review_queue/
│   ├── approved/
│   └── rejected/
├── audio/
│   ├── ambience/
│   ├── dialogue/
│   ├── music/
│   └── sfx/
├── content/
│   ├── characters/
│   ├── dialogue/
│   ├── timeline/
│   ├── broadcasts/
│   ├── memories/
│   ├── endings/
│   ├── locales/
│   │   ├── en.yaml
│   │   └── ru.yaml
│   └── schemas/
├── docs/
├── public/
│   └── assets/
├── research/
│   ├── HISTORICAL_LEDGER.csv
│   ├── source_notes/
│   └── review_reports/
├── scripts/
│   ├── validate-content.ts
│   ├── validate-assets.ts
│   ├── find-unreachable-dialogue.ts
│   ├── generate-asset-index.ts
│   ├── check-localization.ts
│   └── simulate-playthroughs.ts
├── src/
│   ├── app/
│   │   ├── bootstrap.ts
│   │   ├── GameApp.ts
│   │   └── services.ts
│   ├── engine/
│   │   ├── GameClock.ts
│   │   ├── WorldState.ts
│   │   ├── EventScheduler.ts
│   │   ├── CommandBus.ts
│   │   ├── SaveManager.ts
│   │   └── Rng.ts
│   ├── narrative/
│   │   ├── DialogueEngine.ts
│   │   ├── ConditionEvaluator.ts
│   │   ├── EffectApplier.ts
│   │   ├── ClaimLedger.ts
│   │   ├── EndingAssembler.ts
│   │   └── ContentRepository.ts
│   ├── scene/
│   │   ├── BarScene.ts
│   │   ├── LayerManager.ts
│   │   ├── CharacterRig.ts
│   │   ├── Hotspot.ts
│   │   ├── FocusDirector.ts
│   │   ├── LightingDirector.ts
│   │   └── MemoryDirector.ts
│   ├── audio/
│   │   ├── AudioDirector.ts
│   │   ├── Mixer.ts
│   │   └── CueRegistry.ts
│   ├── ui/
│   │   ├── DialoguePanel.ts
│   │   ├── ChoiceList.ts
│   │   ├── ActionLabel.ts
│   │   ├── SettingsPanel.ts
│   │   ├── PauseMenu.ts
│   │   ├── ClaimJournal.ts
│   │   └── DebugPanel.ts
│   ├── accessibility/
│   ├── content-types/
│   ├── styles/
│   └── main.ts
└── tests/
    ├── unit/
    ├── simulation/
    ├── content/
    ├── e2e/
    └── visual/
```

---

## 3. Architectural principles

### 3.1 Deterministic core

The narrative and historical timeline must be deterministic from a saved state. Ambient variation may use seeded randomness, but it cannot change access to major content.

### 3.2 Data-driven content

Characters, dialogue, broadcasts, memories, and endings belong in content files, not embedded in scene code.

### 3.3 Commands and effects

Player actions become typed commands. Commands mutate state only through a central effect layer. This makes saves, replay, testing, and logging reliable.

### 3.4 Rendering is a projection of state

Pixi scene objects and DOM UI should not contain authoritative narrative state. They render `WorldState` and dispatch commands.

### 3.5 Fail loudly in development

Unknown flags, missing locale keys, invalid asset IDs, impossible conditions, and duplicate node IDs must fail validation. Do not silently skip content errors.

---

## 4. Core world state

Suggested TypeScript shape:

```ts
export interface WorldState {
  schemaVersion: number;
  saveId: string;
  seed: string;
  clockMinutes: number;
  chapterId: string;
  currentNodeId: string | null;
  currentFocus: FocusTarget | null;
  player: PlayerState;
  patrons: Record<PatronId, PatronState>;
  bar: BarState;
  timeline: TimelineState;
  knowledge: KnowledgeState;
  claims: ClaimState;
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  objects: Record<ObjectId, ObjectState>;
  witnessedEvents: Record<EventId, WitnessRecord>;
  actionHistory: ActionRecord[];
}
```

### Player state

```ts
export interface PlayerState {
  background: "film" | "interpreter" | "technical" | null;
  currentAnchor: string;
  selectedVerb: InteractionVerb;
  ledgerStyle: "unset" | "transactional" | "factual" | "interpretive" | "blank";
}
```

### Patron state

```ts
export interface PatronState {
  id: PatronId;
  present: boolean;
  seatAnchor: string | null;
  trust: number;
  agitation: number;
  intoxication: number;
  publicCertainty: number;
  privatePressure: number;
  relationship: Record<PatronId, number>;
  topicsOpen: string[];
  topicsClosed: string[];
  claimsMade: string[];
  contradictionsExposed: string[];
  poseId: string;
  expressionId: string;
  heldPropId: string | null;
  finalDisposition: string | null;
}
```

Use bounded values and named threshold helpers. Writers should not need to understand arbitrary floating-point behavior.

---

## 5. Game clock

### Rules

- Store time as minutes from midnight.
- Start slice around 19:15; full game around 18:30.
- Time advances through effects attached to meaningful actions.
- UI inspection, settings, and accessibility menus do not advance time.
- A dialogue exchange may specify a duration by node or scene.
- Scheduled events trigger after the current atomic action completes.
- Critical events may interrupt before the next free-roam state.

### API

```ts
interface GameClock {
  now(): number;
  advance(minutes: number, reason: string): ClockAdvanceResult;
  format(locale: string): string;
}
```

### Test invariants

- time never decreases;
- save/restore preserves exact minute;
- an event fires no more than once unless marked repeatable;
- events due at the same minute resolve in explicit priority order;
- a long action cannot skip an unskippable event without the scheduler recording the interruption.

---

## 6. Event scheduler

Event types:

- `broadcast`;
- `radio`;
- `telephone`;
- `door`;
- `patron_entry`;
- `patron_exit`;
- `group_exchange`;
- `lighting_change`;
- `memory_offer`;
- `chapter_transition`.

Suggested content shape:

```yaml
id: event_gorbachev_return_report
kind: broadcast
priority: critical
window:
  earliest: "01:50"
  latest: "02:15"
requires:
  flags_not:
    - event_gorbachev_return_report_complete
attention:
  mode: exclusive
  competing_events:
    - event_arkady_pavel_private_exchange
    - event_phone_timur_family
on_start:
  - set_flag: event_gorbachev_return_report_started
on_complete:
  - set_flag: event_gorbachev_return_report_complete
  - set_chapter: chapter_6_rewrite
  - adjust_all:
      publicCertainty: -20
```

### Event states

- dormant;
- eligible;
- queued;
- announced;
- focused;
- fragment-heard;
- secondhand-only;
- missed;
- complete.

---

## 7. Interaction model

### Verbs

```ts
export type InteractionVerb = "observe" | "speak" | "serve" | "tune" | "wait";
```

Every hotspot declares supported verbs and resolves them through content-driven commands.

```ts
interface HotspotDefinition {
  id: string;
  bounds: Polygon;
  zIndex: number;
  labelKey: string;
  supportedVerbs: InteractionVerb[];
  commandByVerb: Partial<Record<InteractionVerb, GameCommand>>;
  enabledWhen?: ConditionGroup;
}
```

### Pointer and keyboard

- Pointer hover shows action label and focus outline.
- Keyboard cycles visible enabled hotspots in spatial order.
- Number keys or arrow keys navigate dialogue choices.
- Escape pauses or backs out of noncommitted inspection.
- Enter confirms.
- Provide a direct shortcut for `wait/silence` when available.

### Movement

Sasha moves only among fixed anchors. Use short pose swaps or simple tweens. Do not implement free pathfinding for one room unless testing demonstrates a need.

---

## 8. Dialogue content format

Use structured conditions and effects rather than executable expression strings.

```yaml
id: arkady_emergency_necessary
speaker: arkady
text_key: dialogue.arkady.emergency_necessary
pose: char_arkady_pose_seated_talk
expression: confidence
requires:
  chapter_in:
    - chapter_1_everyone_winning
  flags_not:
    - arkady_emergency_claim_made
on_enter:
  - set_flag: arkady_emergency_claim_made
  - add_claim: claim_arkady_emergency_necessary
  - advance_minutes: 2
choices:
  - id: ask_necessary_for_whom
    text_key: choices.ask_necessary_for_whom
    requires:
      player_background_in:
        - technical
        - interpreter
    effects:
      - adjust_patron:
          patron: arkady
          trust: -1
          privatePressure: 2
      - goto: arkady_necessary_for_whom
  - id: ask_who_authorized
    text_key: choices.ask_who_authorized
    effects:
      - add_topic: constitutional_order
      - goto: arkady_authority_answer
  - id: silence
    text_key: common.silence
    effects:
      - adjust_patron:
          patron: arkady
          privatePressure: 1
      - goto: arkady_fills_silence
```

### Node fields

- stable ID;
- speaker;
- localization key;
- pose/expression/cue;
- conditions;
- entry effects;
- exit effects;
- choices;
- duration;
- interruption policy;
- accessibility notes;
- historical ledger IDs where needed;
- writer/reviewer status.

---

## 9. Conditions and effects

### Condition examples

- chapter in set;
- time greater/less than;
- flag set/not set;
- patron present;
- trust/agitation/intoxication threshold;
- topic open;
- claim known directly/secondhand;
- event witnessed at level;
- object state;
- player background;
- relationship threshold;
- attention slot available.

### Effect examples

- set/unset flag;
- adjust patron state;
- adjust relationship;
- add/open/close topic;
- add claim;
- mark contradiction;
- move patron;
- change pose/expression/prop;
- set object state;
- advance time;
- schedule event;
- play audio cue;
- begin memory;
- change lighting;
- set chapter;
- append epilogue fact;
- goto node or return to free roam.

Effects must be serializable and replayable.

---

## 10. Claims and knowledge

### Knowledge provenance

```ts
export type KnowledgeLevel = "direct" | "fragment" | "secondhand";

export interface KnowledgeEntry {
  id: string;
  level: KnowledgeLevel;
  acquiredAt: number;
  sourcePatronId?: PatronId;
  sourceEventId?: EventId;
  listenersPresent: PatronId[];
}
```

### Choice gating

A direct confrontation may require `direct`. A cautious question may be available from `secondhand`. UI wording must reflect provenance.

Example:

- direct: “You said the emergency was necessary.”
- secondhand: “Lev says you defended the committee earlier.”
- fragment: “I heard something about an emergency. What did you mean?”

### Claim journal

The journal is optional and diegetic in tone. It should list attributed statements and conflicts, not color-code truth.

---

## 11. Attention windows

### Implementation

An attention window contains multiple concurrent offers. The game announces them through animation and sound, then accepts one focus command.

```ts
interface AttentionWindow {
  id: string;
  startsAt: number;
  offers: AttentionOffer[];
  selectionMode: "exclusive" | "primary-plus-fragment";
  timeoutMode: "none" | "real-time-accessible";
}
```

Default to no real-time timeout. The pressure comes from exclusivity, not motor speed. An optional timed mode may exist only as an accessibility-safe setting and should not gate core content.

### Resolution

- selected offer → direct witness;
- secondary offer → optional fragment if configured;
- others → missed or later secondhand;
- schedule biased recap dialogue.

---

## 12. Scene rendering

### Layer order

1. `bg_far`
2. `bg_mid`
3. `seat_back`
4. rear props
5. characters ordered by seat depth
6. table props
7. `furniture_front`
8. foreground props
9. light overlays
10. atmosphere
11. hotspot/debug overlay
12. DOM dialogue and menus

### Character anchors

Each seat anchor defines:

```ts
interface SeatAnchor {
  id: string;
  x: number;
  y: number;
  scale: number;
  depth: number;
  hipOffset: Point;
  tableEdgeY?: number;
  furnitureBackAsset?: string;
  furnitureFrontAsset?: string;
}
```

Character sprites are authored to canonical anchor conventions. Avoid runtime arbitrary scaling that changes line weight noticeably.

### Focus

Focus may:

- adjust audio mix;
- add a subtle vignette or local contrast;
- move the camera by a small approved crop/zoom;
- elevate subtitles for the focused exchange;
- never blur the rest of the scene into an unreadable cinematic effect.

---

## 13. Character rig

Suggested rig:

```ts
interface CharacterRigDefinition {
  id: PatronId;
  rootAnchor: string;
  parts: {
    torso: string;
    head: string;
    nearForearm?: string;
    farForearm?: string;
    nearHand?: string;
    farHand?: string;
    eyelids?: string[];
    mouth?: string[];
    prop?: string;
  };
  pivots: Record<string, Point>;
  poses: Record<string, CharacterPoseDefinition>;
}
```

Use subtle code animation for breathing, blink, and micro-turns. Use approved full-pose art for major gestures. Do not procedurally bend limbs beyond authored limits.

---

## 14. Audio architecture

### Mixer buses

- master;
- ambience;
- room foley;
- television;
- radio;
- dialogue/barks;
- music;
- accessibility cues.

### Focus mix

When focusing on a patron:

- raise focused voice modestly;
- lower competing speech;
- preserve important television or phone cues if configured;
- never reduce ambience to total silence unless dramatically intentional.

### Cue data

```yaml
id: sfx_glass_set_down_heavy
file: /assets/audio/sfx/glass_set_down_heavy.ogg
bus: room_foley
volume: 0.75
variants:
  - /assets/audio/sfx/glass_set_down_heavy_02.ogg
  - /assets/audio/sfx/glass_set_down_heavy_03.ogg
```

Use seeded variant selection for deterministic test mode.

---

## 15. Save system

### Requirements

- autosave after each committed player action and chapter boundary;
- one manual save entry point outside active choice resolution;
- versioned JSON payload;
- migration function for schema changes;
- checksummed or validated data;
- no binary proprietary save format;
- a developer export/import panel for debugging.

### Determinism test

Given state `S`:

1. save;
2. reload into a fresh app instance;
3. render and serialize state;
4. assert deep equality excluding nonauthoritative runtime handles;
5. execute next command;
6. assert same resulting state and scheduled events.

---

## 16. Localization

### Content keys

Dialogue nodes refer to stable keys. Store text separately.

```yaml
# content/locales/en.yaml
dialogue:
  arkady:
    emergency_necessary: "An emergency is not the same thing as a seizure of power. Sometimes it prevents one."
choices:
  ask_necessary_for_whom: "Necessary for whom?"
common:
  silence: "[Say nothing.]"
```

### Validation

- all referenced keys exist in all required locales;
- no unused keys without annotation;
- line-length report;
- unsupported markup rejected;
- speaker names and patronymics consistent;
- text expansion tested at 130–150 percent of English length.

---

## 17. Accessibility

Required for the slice:

- keyboard-only play;
- remappable or documented controls;
- subtitle size choices;
- high-contrast subtitle background option;
- speaker-name option;
- reduce motion;
- disable screen flicker/scan-line effects;
- volume controls by bus;
- captions for significant non-speech audio;
- no information conveyed only by color;
- pause during dialogue and attention selection;
- adjustable text speed or instant text;
- no essential real-time reaction requirement.

The CRT flicker effect must respect reduce-motion and photosensitivity settings.

---

## 18. Debug tools

Create a developer panel available only in development builds:

- set clock;
- set chapter;
- move patron;
- adjust trust/agitation/intoxication;
- grant claim or event knowledge at a chosen provenance level;
- trigger event;
- jump to dialogue node;
- show hotspot polygons;
- show seat anchors and depth;
- show perspective guide;
- show active conditions and failed reasons;
- export world state;
- reset save;
- deterministic test mode;
- capture canonical screenshots.

Debug tools are essential for Codex to inspect complex states without replaying the entire night.

---

## 19. Testing strategy

### Unit tests

- condition evaluation;
- effect application;
- clock advancement;
- event priority;
- claim provenance;
- ending module selection;
- save migration;
- localization resolution;
- seeded RNG.

### Content tests

- duplicate IDs;
- missing speakers/assets/localization keys;
- unreachable nodes;
- choices with no valid destination;
- circular dialogue without exit unless intentional;
- impossible condition combinations;
- historical ledger ID missing;
- ending references unavailable facts;
- silence choice quota;
- line-length and prohibited placeholder text.

### Simulation tests

Implement scripted policies:

- always focus television;
- always focus patrons;
- always choose silence;
- maximize Arkady trust;
- challenge every known contradiction;
- never serve alcohol;
- serve requested alcohol where available;
- randomized valid choices across many seeded runs.

Assertions:

- slice completes;
- no deadlock;
- all three ending families reachable;
- no clock overflow;
- no absent patron speaks;
- no direct-knowledge choice appears from secondhand-only state;
- every critical event resolves.

### End-to-end tests

Canonical flows:

1. new game and accessibility setup;
2. opening tutorial through first free-roam state;
3. first attention window selection;
4. service choice changes patron state;
5. memory vignette completes and returns to bar;
6. save, reload, continue;
7. final ledger and epilogue;
8. keyboard-only route.

### Visual tests

Use Playwright screenshot baselines after manual approval:

- 1920×1080 Chromium;
- 1366×768 Chromium;
- optional second browser after slice stability;
- animations disabled or moved to deterministic frame;
- fixed test seed;
- fixed fonts bundled through approved webfont licensing or system-safe stack;
- dynamic timestamps and cursors hidden during comparison.

A screenshot diff is a regression tool, not an art critic. Manual visual review remains mandatory.

---

## 20. Performance

Targets:

- 60 fps under normal desktop conditions;
- stable memory use through a complete slice;
- lazy-load later chapter assets;
- atlas small parts where beneficial;
- avoid excessive full-screen filters;
- precompute static masks;
- limit simultaneous alpha smoke layers;
- compress audio appropriately while preserving dialogue clarity;
- no layout thrashing from DOM dialogue updates.

Create a low-effects setting that reduces atmosphere, CRT effects, and animated light without changing content.

---

## 21. Build scripts

Recommended package scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "pnpm validate && tsc --noEmit && vite build",
    "preview": "vite preview",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "validate:content": "tsx scripts/validate-content.ts",
    "validate:assets": "tsx scripts/validate-assets.ts",
    "validate:locales": "tsx scripts/check-localization.ts",
    "validate": "pnpm validate:content && pnpm validate:assets && pnpm validate:locales",
    "simulate": "tsx scripts/simulate-playthroughs.ts",
    "test:e2e": "playwright test",
    "test:visual": "playwright test tests/visual",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm validate && pnpm simulate && pnpm build && pnpm test:e2e"
  }
}
```

Codex must run the narrowest relevant checks during iteration and `pnpm check` before phase completion.

---

## 22. Vertical slice technical acceptance criteria

- clean install and build from a fresh checkout;
- no runtime console errors during canonical flows;
- strict TypeScript passes;
- all content validates;
- all simulation policies complete;
- save/reload deterministic;
- all critical events reachable;
- no missing asset fallback visible in production build;
- keyboard-only completion works;
- reduce-motion and flicker settings work;
- canonical screenshots approved and stable;
- debug panel can reproduce every review state;
- build output runs from a static host;
- architecture remains simple enough that a new patron can be added without scene-code changes.
