# WITHERING DESPOTS

## Production plan for a historical narrative point-and-click game

### One-line pitch

On the final night of the August 1991 coup attempt, a young bartender listens as a roomful of aging Soviet men argue, boast, confess, and immediately begin rewriting their own histories.

### Tagline

**The state is collapsing. The bar is still open.**

---

## 1. Product vision

`Withering Despots` is a compact, authored narrative game about attention, testimony, and the manufacture of memory. It takes place almost entirely in one fictional Moscow café-bar from the evening of 21 August 1991 until shortly after dawn on 22 August.

The coup is collapsing outside. Inside, patrons who spent their lives adapting to the Soviet system confront the possibility that their shared world may be ending. The player cannot save the coup, defeat it, rescue Gorbachev, or redirect history. The player can decide who receives attention, who is challenged, who is indulged, which claims are repeated, and which private admissions survive the night.

The intended emotional progression is:

1. curiosity;
2. amusement at status games and bureaucratic language;
3. recognition that each patron is protecting a life story;
4. unease as memories conflict;
5. grief, anger, or tenderness when private costs emerge;
6. awareness that historical memory is already being edited before dawn.

This is not a political trivia game, a puzzle box about stopping a coup, a Soviet nostalgia simulator, or a morality meter. It is a chamber drama in which watching is gameplay.

---

## 2. Design pillars

### 2.1 Attention is action

The player cannot hear every conversation, watch every broadcast, answer every telephone call, and notice every physical gesture. Choosing a focus makes other information partial or inaccessible. Missing something is not failure; it is the basis of replayability and of the game's argument about witnesses.

### 2.2 Memory is political and personal

Each patron remembers the Soviet Union through a different mixture of experience, injury, pride, compromise, and self-deception. Accounts can contradict one another without the game pretending that all claims are equally supported.

### 2.3 History advances regardless

A scheduled historical spine moves forward after meaningful player actions. The player influences the bar's emotional and social history, not the outcome in Moscow.

### 2.4 Small material actions carry moral weight

Pouring another drink, withholding a bottle, turning the television volume up, returning a membership card, opening the door, or declining to interrupt can matter more than a dramatic speech.

### 2.5 The room is a character

The café-bar is not a generic “Soviet” collage. It is a specific aging establishment with a build date, refurbishment history, material palette, procurement constraints, repair history, and social function. Its physical changes through the night provide progression without requiring additional locations.

### 2.6 Comedy and tragedy coexist

Humor comes from vanity, failed ritual, bureaucratic euphemism, social one-upmanship, and the absurdity of people maintaining old habits while the state collapses. It must not turn historical violence or ethnic identity into a gag.

---

## 3. Recommended scope

### 3.1 Build a vertical slice first

The first implementation target is a polished 30–45 minute slice. It must prove the game before full production.

Vertical slice content:

- one fully layered café-bar background;
- the player character;
- four patrons and the bar manager;
- three chapters across roughly six in-world hours;
- six broadcast or telephone events;
- at least 60 authored dialogue nodes;
- two memory vignettes;
- five meaningful uses of silence;
- three ending variations;
- save/load, settings, subtitles, keyboard navigation, and content validation;
- canonical screenshots and visual regression tests.

Do not produce the full cast or full night until the slice meets the art, narrative, historical, and technical gates.

### 3.2 Full game target

After validation, expand to:

- a 2.5–4 hour first playthrough;
- six principal patrons, one late-arriving patron, the manager, and the player;
- seven chapters from early evening to morning;
- 220–320 dialogue nodes, plus ambient exchanges;
- 10–14 memory vignettes;
- eight to twelve broadcast, radio, telephone, or street events;
- six broad epilogue configurations assembled from many state variables;
- enough mutually exclusive content that one playthrough reveals approximately 55–70 percent of the authored material.

---

## 4. Historical frame

The recommended historical frame is the collapse of the August 1991 coup attempt by the State Committee on the State of Emergency. The bar's fictional clock begins on Wednesday evening, 21 August, when the coup is visibly disintegrating, and ends on Thursday morning, 22 August, after Gorbachev's return to Moscow has been broadcast and arrests are beginning.

The game should distinguish three layers:

- **verified public events:** sourced chronology, public broadcasts, troop movements, announced decisions;
- **plausible contemporary rumor:** what a Moscow patron could reasonably hear through radio, telephone, passersby, or delayed television;
- **fictional personal history:** invented patrons and bar history designed to illuminate the period without claiming to portray real private lives.

A broadcast does not need to arrive in the bar at the exact minute it occurred historically. Reception, censorship, conflicting stations, and rumor justify delay. Any departure from exact chronology must be logged as a deliberate dramatic compression.

Recommended title card:

> Moscow, 21 August 1991. The people and bar are fictional. Public events follow the historical record; rumors do not always do so.

---

## 5. Player role

### 5.1 Authored protagonist

Use one authored protagonist rather than a customizable avatar. This produces stronger dialogue, coherent character art, and historically specific social dynamics.

Recommended protagonist:

**Alexandra “Sasha” Voronina, 30**

- temporarily covering the late shift for her aunt, Galina;
- has been away from the regulars long enough that they explain themselves to her;
- observant, educated, and not fully aligned with any patron;
- visible behind and around the counter, but animation-light because the counter conceals the lower body at several anchors;
- her past is revealed through player choices rather than a large opening exposition.

The first conversation lets the player emphasize one of three background strands:

- former documentary film assistant;
- Intourist interpreter dismissed during cutbacks;
- technical editor at a failing institute.

These are not classes. They unlock a small number of informed questions and shape how patrons address Sasha. One strand becomes canonical for that save.

### 5.2 Why the bartender role works

The role provides a natural reason to remain in one room, to be addressed by everyone, to control small material resources, and to witness conversations without being the political center. It also supports limited verbs and lowers animation scope.

---

## 6. Core interaction model

Use five verbs only:

1. **Observe** — inspect a person, object, gesture, or broadcast.
2. **Speak** — ask, challenge, redirect, repeat a claim, or remain silent.
3. **Serve** — pour, withhold, substitute, bring food, clear a glass, or settle a tab.
4. **Tune** — adjust television, radio, volume, antenna, light, shutters, or telephone connection.
5. **Wait** — deliberately allow time and conversation to advance.

The cursor may change contextually, but the conceptual verb set must remain stable.

### 6.1 No conventional inventory puzzles

There should be no “combine key with fish” logic, scavenger hunts, or arbitrary object locks. Objects matter as social signals and evidence:

- a Party membership card;
- a folded newspaper;
- a photograph;
- an unopened bottle;
- a medal case;
- a telephone message;
- a receipt or ledger page.

The game may track these as state, but not as a visible backpack inventory unless testing proves it improves clarity.

### 6.2 Social inventory

The player gradually acquires topics and claims:

- the New Union Treaty;
- the dead near the tunnel;
- an old factory accident;
- Prague in 1968;
- a blocked promotion;
- a missing relative;
- a private emigration plan;
- an altered production report.

A learned claim can be raised with another patron. Repeating it may build trust, expose a contradiction, cause harm, or reveal who supplied the rumor.

### 6.3 Time economy

The clock advances only after meaningful actions. A normal action advances 1–4 minutes; a long conversation or memory advances 5–12. The player can read menus and settings without losing time.

At scheduled moments, two or more simultaneous attention opportunities appear naturally in the room. For example:

- the television begins a restored news bulletin;
- two patrons lower their voices at the far table;
- the telephone rings;
- someone at the door shouts a rumor.

The player chooses one focus. Unchosen events may leave fragments, secondhand accounts, or no trace.

---

## 7. Core loop

1. **Observe the room.** Read posture, overhear fragments, inspect material changes.
2. **Choose a focus.** Patron, television, radio, phone, door, or bar task.
3. **Take a limited action.** Ask, serve, tune, challenge, or stay silent.
4. **Advance social and historical state.** Trust, agitation, intoxication, group tension, knowledge, and clock change.
5. **Receive a consequence.** A patron opens up, withdraws, contradicts another, changes seat, leaves, or alters an object.
6. **Encounter a public event.** A broadcast, rumor, or interruption recontextualizes previous claims.
7. **Repeat until dawn.** The room's arrangement and the patrons' public stories deteriorate or transform.

---

## 8. Narrative structure

### Chapter 0 — The Last Shift

**Approximate time:** 18:30–19:15

- Sasha opens or inherits the shift.
- The television reception is poor and official language remains confident.
- Regulars establish social hierarchy.
- The player learns the five verbs without a tutorial overlay.
- Every patron claims to understand what is happening.

### Chapter 1 — Everyone Is Winning

**Approximate time:** 19:15–20:45

- Conflicting reports circulate.
- Patrons interpret the same broadcast according to prior belief.
- The first mutually exclusive attention window occurs.
- One patron asks Sasha to turn the television down; another insists it be louder.
- Comedy is strongest here, but anxiety is visible underneath.

### Chapter 2 — The Dead at the Tunnel

**Approximate time:** 20:45–22:15

- News or rumor of the three civilian deaths reaches the bar.
- The retired officer's position becomes unstable.
- A patron who treated events as theater is forced to confront consequence.
- The first memory vignette appears.
- The bar's group tension can lead to a departure or a private confession.

### Chapter 3 — Orders Withdrawn

**Approximate time:** 22:15–23:45

- Reports indicate military withdrawal and political defections.
- The old Party functionary begins changing vocabulary.
- Patrons test whether old titles and loyalties still carry weight.
- A private document may be hidden, burned, returned, or ignored.

### Chapter 4 — The Delegation

**Approximate time:** 23:45–01:30

- Rumors spread that the coup leaders have left Moscow or gone to Crimea.
- The telephone and radio conflict.
- Patrons begin predicting arrests and assigning blame.
- A second memory vignette shows two incompatible versions of the same event.

### Chapter 5 — The Sweater

**Approximate time:** around 02:00

- Gorbachev's return is shown or described through a fictionalized broadcast.
- The event is visually ordinary, which makes it powerful.
- The patrons' public stories change in real time.
- One man insists he opposed the coup from the beginning; another produces evidence that he did not.

### Chapter 6 — The Rewrite

**Approximate time:** 02:15–05:45

- The night becomes quieter and more intimate.
- Political argument gives way to biography.
- Patrons decide what to destroy, preserve, deny, or pass on.
- The player's accumulated attention determines which private scenes are available.

### Chapter 7 — Opening Time

**Approximate time:** 05:45–06:30

- Dawn exposes the room's wear and mess.
- Rumors of arrests arrive.
- The player closes the ledger and decides how to record the shift.
- Patrons leave alone, together, or not at all.
- The epilogue is assembled from concrete acts and remembered lines, not a morality label.

---

## 9. Cast design

The full character dossiers belong in `docs/NARRATIVE_DESIGN.md`. The production cast should include the following functions without reducing anyone to the function.

### Arkady Sergeyevich Belov — retired district Party official, 72

Elegant, status-conscious, and skilled at changing terminology without admitting he has changed position. He did real favors for people and real harm through procedural decisions. His prop is a worn leather document wallet.

### Lev Borisovich Rubin — retired broadcast engineer, 68

Technically attentive and dryly funny. He distrusts official framing because he understands signals, edits, and transmission gaps. He is proud of Soviet scientific achievement while remembering career discrimination. His prop is a pocket radio and improvised antenna wire.

### Nikolai Fyodorovich Chernov — retired colonel, 70

Believes the army embodies sacrifice and continuity. His confidence fractures when troops are used against civilians in Moscow. He has a compromised memory of the 1968 invasion of Czechoslovakia. His prop is a medal case he does not initially open.

### Gennady Mikhailovich Zorin — retired factory turner and union organizer, 62

Warm, loud, and capable of moving between genuine worker solidarity and resentment. He helped colleagues obtain housing but concealed a workplace accident to protect a production target. His prop is a folding ruler and grease-stained photograph.

### Timur Akhmedovich Mamedov — former restaurant supply manager, 65

Knows how the formal and informal economies actually worked. He is sociable because procurement depended on relationships. His family connections outside Russia complicate every claim about what “the country” means. His prop is a key ring and a carefully saved foreign lighter.

### Pavel Ilyich Sokolov — retired history teacher, 76

A sincere Marxist whose father disappeared during the terror. He built a life by separating the ideal from the state that betrayed it. He can defend the system and describe its cruelty in the same breath. His prop is a school notebook filled with revisions.

### Yuri Viktorovich Malakhov — taxi driver and fixer, 51

Arrives later with rumors, goods, and confidence about the coming order. He is not a cartoon capitalist; he has spent years learning that access matters more than rules. He sees collapse as danger and opportunity. His prop is a plastic bag containing mismatched goods.

### Galina Andreyevna Voronina — manager, 59

Sasha's aunt and the only person who knows how many of the regulars' stories have changed over decades. She appears sparingly, handles practical crises, and refuses the patrons' assumption that they alone made history.

---

## 10. Character-writing constraints

Every principal patron requires:

- a public belief;
- a private fear;
- a cherished achievement;
- a compromised action;
- a person they protected;
- a person they failed;
- a topic that makes them perform;
- a topic that makes them quiet;
- one belief shared with an apparent opponent;
- one action contradicting their stated belief;
- an early-night version of their story;
- a late-night version;
- one truth available only through earned trust or patient silence.

No two characters should have the same rhythm, sentence length, level of abstraction, or relationship to alcohol.

---

## 11. Dialogue design

### 11.1 Choice model

Most choices should contain 2–4 options. Use specific phrasing rather than abstract morality labels.

Good:

- “You called it a restoration an hour ago.”
- “Let him finish.”
- “Another glass, or tea?”
- “Where were you in sixty-eight?”
- `[Say nothing.]`

Avoid:

- “Good response”
- “Communist response”
- “Empathy +1”
- “Aggressive”

### 11.2 Silence

Silence is an explicit, regularly useful choice. It may:

- let a patron continue past a rehearsed anecdote;
- allow another person to interrupt;
- make discomfort visible;
- lose the chance to challenge a lie;
- be interpreted as agreement;
- preserve a relationship at the cost of truth.

### 11.3 Contradictions

The game records claims, not “clues.” When a later statement conflicts, the player may:

- confront immediately;
- store the contradiction;
- tell a third person;
- ignore it;
- ask for a concrete detail;
- return to it after the political situation changes.

### 11.4 Memory vignettes

Memories do not become objective playable flashbacks. The bar partially transforms while the speaker remains visible. Details may shift when another patron interrupts. A memory is always attributed to a speaker.

Main-game memories use a controlled secondary style: limited-color cut-paper, screen-print, or painted collage. This reduces asset demands, differentiates testimony from the present, and allows visible instability without making the main environment inconsistent.

---

## 12. State model

Track at minimum:

### Global state

- in-world clock;
- chapter;
- historical event queue;
- group tension;
- current focus target;
- television/radio/telephone state;
- bar inventory and object state;
- discovered claims;
- witnessed events;
- missed events;
- player background strand;
- action log for epilogue assembly.

### Patron state

- present or absent;
- seat anchor;
- trust toward Sasha;
- agitation;
- intoxication;
- public certainty;
- private pressure;
- relationship modifiers toward other patrons;
- topics opened or closed;
- claims made;
- contradictions exposed;
- leave conditions;
- final disposition.

Use hidden numbers sparingly. The design should prefer named states and thresholds that writers can understand.

---

## 13. Endings and epilogue

There is no “best” ending. The epilogue should be a montage assembled from observed facts and unresolved absences.

Possible configurations include:

- the group remains together but agrees on a sanitized story;
- the group fractures after a public accusation;
- two apparent enemies leave together after discovering shared grief;
- a patron destroys evidence of his earlier position;
- a patron entrusts Sasha with a document or photograph;
- Galina closes the bar to the regulars;
- Sasha records only transactions, refusing to become their archivist;
- Sasha writes a detailed private account that includes contradictions;
- everyone claims to have opposed the coup;
- one patron refuses to rewrite himself and pays a social cost.

The final ledger interaction asks the player to choose what kind of record to make, but the available lines depend on what was actually witnessed. The epilogue should never assert that the player learned events they missed.

---

## 14. Visual direction

### 14.1 Recommended main style: original pixel-illustrated realism

Build a low-resolution illustrated chamber drama with real pixel-grid discipline. Clean high-resolution drawing or generation may be used as source material, but the corrected low-resolution result is the canonical art:

- readable, mildly exaggerated silhouettes;
- architecturally controlled backgrounds with clear depth and object staging;
- clean pixel clusters and controlled plane shading on characters;
- theatrical perspective rather than photorealistic lens effects;
- expressive poses that remain anatomically coherent;
- a locked warm local palette with restrained highlights;
- whole-pixel placement and nearest-neighbour presentation for room art, props, and characters;
- deliberate low-resolution detail that stays readable without a smoothing filter.

Treat _Papers, Please_ as a quality bar for compact human writing, ordinary work under pressure, tactile feedback, clear consequences, and low-resolution readability. It is not a layout or asset reference. Do not copy its desk framing, border treatment, palette, typography, characters, interface positions, inspection loop, narrative structure, pixel clusters, or assets.

The target is an original late-20th-century illustrated adventure-game language built for this café-bar and this cast.

### 14.2 Recommended hybrid

- Main bar: authored low-resolution 2D environment and character art, corrected on the final pixel grid.
- Memories: limited-color collage or screen-print transformation.
- Interface: crisp modern typography with subtle late-Soviet print references, built in SVG/CSS rather than painted into backgrounds.

### 14.3 Fallback style if character consistency remains weak

Use a **theatrical cutaway** approach:

- miniature-set background;
- paper-cut or painted-card characters with fixed profiles;
- deliberate jointed animation;
- visible stage-light transitions;
- memories as replacement flats and projections.

This style turns limited animation and controlled silhouettes into an aesthetic strength and is safer than accepting uncanny semi-realistic figures.

See `docs/ART_BIBLE.md` for the full pipeline.

---

## 15. Historically specific bar concept

The fictional establishment is **Кафе-бар “Смена” / Café-Bar “The Shift”**.

Working history:

- opened in 1968 as a small café attached to a district cultural or administrative building;
- partially refurbished in 1982 with cheaper laminate, new stools, and a color television;
- by 1991, fixtures from different decades coexist;
- it is neither an elite restaurant nor a filthy caricature;
- regulars include retirees who have met there for years;
- procurement shortages and improvised repairs are visible but the room remains cared for.

Approximate room:

- 7.2 m wide by 5.8 m deep;
- ceiling height 2.7 m;
- counter along the rear-left wall;
- five small tables with distinct social territories;
- 16–18 total seats;
- television high in a corner but not centered like a modern sports bar;
- telephone behind the counter;
- kitchen/service door, coat hooks, and a narrow corridor visible but not explorable;
- one street door whose opening changes sound and light.

Material palette:

- varnished birch or beech veneer;
- dull cream paint and ribbed hardboard paneling;
- oxidized teal or green-blue upholstery;
- brown-red linoleum or terrazzo;
- brushed or chrome-plated steel furniture elements;
- amber glass shades and a harsh fluorescent work light above the counter;
- faceted glassware, enamel trays, ceramic plates, metal ashtrays;
- faded local decorative art rather than a wall covered in propaganda.

Exact models, prices, signs, bottles, and menu items remain provisional until entered in the historical ledger and verified.

---

## 16. Sound direction

Sound carries much of the world outside.

### Ambient layers

- refrigerator compressor;
- glass and crockery;
- low ventilation or ceiling fan;
- pipes and plumbing;
- distant engines and occasional heavy vehicles;
- street voices when the door opens;
- telephone relay noise;
- television hum and unstable reception;
- pockets of silence after major news.

### Music

Use sparse original music. Character motifs may use muted trumpet, bass clarinet, upright bass, prepared piano, accordion-like reed color, or small percussion, but avoid generic “Russian” pastiche.

A brief reference to `Swan Lake` may be historically meaningful. The composition is public domain, but use an original recording or a recording with clearly verified rights. Do not copy a broadcast recording.

### Voice

Vertical slice recommendation:

- full text dialogue;
- Russian-language vocal barks, breaths, laughs, interruptions, and names;
- no synthetic full performances in the final public build without explicit disclosure and appropriate rights.

Full-game ideal:

- native Russian voice performances with professional English subtitles;
- or an English-language adaptation without exaggerated fake accents.

---

## 17. Technical direction

Recommended initial stack:

- TypeScript with strict settings;
- Vite for development and production builds;
- PixiJS for layered 2D rendering and input;
- semantic HTML/CSS overlays for menus, dialogue, subtitles, accessibility, and debug tools;
- a 640×360 production-art grid inside the existing 16:9 stage, presented at exact 3× for 1920×1080 and at exact 2× inside a 1280×720 frame for 1366×768;
- nearest-neighbour scaling for art while semantic DOM text remains resolution-independent;
- Howler or a similarly focused audio layer;
- YAML or JSON content validated against schemas;
- Playwright for end-to-end and screenshot testing;
- a unit-test runner compatible with the Vite ecosystem;
- package manager and versions pinned in the lockfile.

Do not introduce React unless a clear interface need emerges. A small DOM UI over PixiJS is easier to control and visually test.

A browser-first build gives Codex a fast live-preview and screenshot loop. Desktop packaging can be evaluated only after the vertical slice is stable.

See `docs/TECHNICAL_ARCHITECTURE.md`.

---

## 18. Production milestones and acceptance gates

### Phase 0 — Documentation and repository skeleton

Deliver:

- repository structure;
- scripts for dev, build, lint, typecheck, unit, content validation, and Playwright;
- placeholder content files and schemas;
- research ledger;
- asset manifest;
- no final art.

Gate:

- all commands run on a clean checkout;
- Codex can explain the architecture and milestone order;
- no speculative production dependencies remain undocumented.

### Phase 1 — Graybox room and interaction

Deliver:

- exact logical stage and scaling;
- perspective blockout;
- five interaction verbs;
- seat and movement anchors;
- placeholder patrons;
- focus and time systems;
- debug panel.

Gate:

- a tester can complete a 10-minute graybox sequence without instructions;
- no hotspot ambiguity at canonical resolutions;
- stage and UI do not shift between screenshots.

### Phase 2 — Narrative engine

Deliver:

- data schemas;
- dialogue choices and silence;
- conditions/effects;
- event scheduler;
- claim/contradiction system;
- save/load;
- reachability and validation tests.

Gate:

- all sample nodes are reachable or deliberately marked;
- save/restore produces identical state;
- the clock and scheduled events are deterministic;
- no content errors are ignored at runtime.

### Phase 3 — Visual target lock

Deliver:

- approved room blockout;
- one painted empty-room target;
- one canonical character sheet;
- one approved seated pose;
- one memory-vignette target;
- interface style sheet;
- canonical screenshot board.

Gate:

- all assets pass `docs/VISUAL_QA.md`;
- character identity remains stable across neutral and seated views;
- perspective and furniture geometry are coherent;
- no generated lettering or merged people/furniture;
- the target looks intentional at 1920×1080 and 1366×768.
- the 640×360 native art, palette sheet, and reduction recipe are locked and versioned;
- canonical captures use exact integer art scaling with smoothing disabled;
- no unexplained off-palette pixels, fractional sprite positions, crawling dither, or interpolation shimmer remain.

Do not proceed if this gate fails. Change the art approach rather than accumulating inconsistent assets.

### Phase 4 — Vertical slice content

Deliver:

- four patrons and Galina;
- three chapters;
- six external events;
- two memory vignettes;
- three epilogue variants;
- complete audio ambience;
- settings and accessibility.

Gate:

- 30–45 minute playable sequence;
- at least two materially different playthroughs;
- no choice presents knowledge the player did not acquire;
- no character functions as a simple ideology label;
- all visible historical details are ledgered;
- all visual tests pass after intentional baseline review.

### Phase 5 — Evaluation and rewrite

Conduct:

- historical review;
- Russian language/cultural review;
- narrative playtests with attention to pacing and missed content;
- visual consistency review;
- accessibility review;
- performance profiling.

Gate:

- prioritized rewrite report completed;
- vertical slice revised until critical issues are resolved;
- explicit decision made to expand, restyle, or reduce scope.

### Phase 6 — Full production

Only after Phase 5:

- add remaining patrons one at a time;
- add chapters in chronological order;
- require a mini art and narrative gate for each patron;
- maintain screenshot and content baselines;
- prevent the room from becoming visually overcrowded.

### Phase 7 — Final polish and release preparation

Deliver:

- complete localization pipeline;
- final audio and rights documentation;
- credits and historical note;
- crash/error reporting appropriate to the platform;
- packaging decision;
- performance, compatibility, and accessibility testing.

---

## 19. Quality metrics

The project should not use a conventional “fun score.” Evaluate the slice against observable criteria.

### Narrative

- Each patron changes or reveals a meaningful contradiction.
- At least 20 percent of available dialogue follows from silence or patient listening.
- No more than one consecutive minute of unbroken exposition without a player-observable change.
- Each broadcast recontextualizes at least one earlier statement.
- Two playthroughs can produce different emotional interpretations without changing public history.
- At least 80 percent of meaningful slice choices produce a visible object, posture, availability, relationship, or attention result within the next two meaningful actions.
- Every major choice also creates a delayed cost, missed opportunity, or closed scene.
- Four of five blind playtesters can name the immediate tradeoff and one consequence after ten minutes without seeing hidden state.

### Visual

- All recurring characters are immediately identifiable by silhouette.
- No character changes face, body type, age, clothing construction, or palette between poses.
- Every seated pose has credible hip, knee, foot, and chair relationships.
- Perspective lines and furniture scale agree with the blockout.
- Text remains sharp and separate from art.
- No key asset contains anatomical or geometric defects visible at game scale.
- Characters and interactive props remain identifiable at the native 640×360 art grid before highlighting.
- Canonical captures use integer art scaling with no smoothing, fractional sprite positions, crawling dither, or interpolation shimmer.
- Approved assets use a versioned palette sheet and contain no unexplained off-palette pixels.

### Historical

- Every exact date, product, slogan, uniform element, price, and public-event assertion has a ledger entry.
- Unverified details are absent or explicitly treated as fictional composites.
- No post-1991 national symbolism appears before it is historically plausible.
- The bar feels like an ordinary lived place, not a museum of Soviet clichés.

### Technical

- deterministic save/restore;
- no uncaught console errors;
- stable 60 fps target on ordinary desktop hardware, with graceful degradation where necessary;
- all content schemas validated before build;
- canonical Playwright flows and screenshots pass;
- keyboard-only completion of the slice is possible.

---

## 20. Risks and mitigations

### Risk: generated art becomes uncanny or inconsistent

Mitigation:

- lock blockout and canonical sheets first;
- separate environment, people, furniture fronts, props, shadows, and text;
- generate one pose at a time;
- use edits based on approved references;
- reject, correct, or redraw defects rather than rationalizing them;
- switch to theatrical cutaway style if consistency cannot be maintained.

### Risk: historical setting becomes a collection of clichés

Mitigation:

- source ledger;
- material-culture review;
- ordinary objects and repair history;
- limited overt symbolism;
- diverse Soviet experiences beyond Moscow Russian officialdom.

### Risk: dialogue becomes a lecture

Mitigation:

- every factual exchange must also change status, trust, tension, or an object;
- use interruptions and competing attention;
- let patrons be wrong, evasive, funny, and concrete;
- delete lines that exist only to teach the player.

### Risk: limited activity feels inert

Mitigation:

- visible posture, seat, prop, lighting, and sound changes;
- hard choices about attention;
- social consequences for service and silence;
- scheduled external events;
- short loops and frequent recontextualization.

### Risk: scope expands through memory scenes

Mitigation:

- memories remain transformations of the bar;
- use a limited secondary style;
- cap each vignette to 30–90 seconds;
- reuse symbolic elements without reusing factual claims.

### Risk: Codex optimizes for completion rather than quality

Mitigation:

- phase gates with stopping conditions;
- visual review queue;
- mandatory screenshots and defect lists;
- tests and logs;
- no approval of first-pass assets;
- explicit instruction to stop when a gate fails.

---

## 21. Final creative test

At the end of the vertical slice, ask:

> Did the player feel that the country changed while the room stayed almost the same—and that the men began changing their memories before the television had finished reporting the news?

If not, revise before adding content.
