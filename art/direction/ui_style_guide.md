# UI style guide — worn administrative paper

Reskin only: semantic DOM, layout positions (HUD top-left, dialogue lower panel, in-scene
offers), and all a11y behavior (150% text, high contrast, reduced motion, keyboard focus,
44px targets) are unchanged. Palette ids resolve from `art/palette/wd-palette-v1.json`;
expose them as CSS custom properties.

## Tokens

```css
:root {
  --paper: #d8c69d; /* cream_3  panel background */
  --paper-mid: #b2a17c; /* cream_2  aged panel areas, disabled bg */
  --ruling: #8c7d5f; /* cream_1  ledger rule lines */
  --paper-dk: #665a45; /* cream_0  panel edge shade, pressed bg */
  --ink: #131114; /* soot_0   text, borders */
  --ink-soft: #3d383b; /* soot_2   secondary text, meta text */
  --stamp: #83392b; /* red_1    stamp/alert accent, active nameplate */
  --stamp-dk: #56271f; /* red_0    stamp shadow */
  --signal: #3d7f8c; /* cyan_1   focus ring, link/verb accent */
  --signal-dim: #1e4652; /* cyan_0   focus ring shadow, visited/quiet accent */
  --brass: #b47c31; /* amber_2  timer, warm emphasis (HUD clock) */
  --shadow: #262227; /* soot_1   print-offset shadow color */
}
```

Rules: no color outside these tokens; no opacity blends over scene art except the
scrim below (flat colors only); no gradients.

## Panels (dialogue, summary, journal, pause)

- Background `--paper`, text `--ink`. **Border: 2px solid `--ink`, hard, no
  border-radius anywhere.**
- Print-offset shadow instead of blur: `box-shadow: 4px 4px 0 0 var(--shadow);`
  (2px at 2× display scale ⇒ use `calc` on a `--px` unit if implemented resolution-
  independently; 1 native px = 3 CSS px at 1920×1080).
- Panel corners may carry a 1-native-px notch (clip-path) to suggest worn paper — max
  two corners, never animated.
- Scene-dimming scrim behind modals: flat `--shadow` at 60% opacity (the one permitted
  opacity), no blur.

## Ledger ruling (summary + journal panels only)

- Horizontal rules: 1 native px (3 CSS px) solid `--ruling`, spaced exactly one line-height
  apart, aligned so text baselines sit on rules (background-image repeating-linear-gradient
  sized to the line-height).
- One vertical margin rule: 2 native px `--stamp-dk` at `padding-left − 1ch`.
- Ruling never appears on dialogue or HUD panels — it marks _records_, not speech.

## Nameplates (speaker)

- Inline-block tab attached to the dialogue panel's top-left, overlapping the border by
  its own 2px border. Background `--paper-mid`, 2px `--ink` border, text uppercase,
  letter-spacing 1px, color `--ink`.
- Stamped look: text gets `text-shadow: 1px 1px 0 var(--paper-dk);` and the plate is
  rotated 0deg — no fake rotation; the stamp effect is border + slight mis-registration
  only (plate background offset 1px from its border via inner box-shadow
  `inset -1px -1px 0 0 var(--paper-dk)`).
- Player (Sasha) plate: `--ink` on `--paper`; non-player speakers: `--ink` on
  `--paper-mid`; system/narration: no plate.

## Choice list

- Each choice: `--paper` bg, 2px `--ink` border, full-width, min-height 44px, text `--ink`.
- **Hover: ink inversion** — bg `--ink`, text `--paper`. No transition animation
  (or ≤80ms steps(2) where reduced-motion is off).
- **Focus (keyboard): hard pixel ring** — `outline: 3px solid var(--signal);
outline-offset: 2px;` plus `box-shadow: 0 0 0 5px var(--signal-dim);`. Never
  `outline: none` without this replacement.
- **Press/active: 1px displacement + tone shift** — `transform: translate(1px, 1px);`
  shadow reduces by the same amount (`3px 3px 0 0 var(--shadow)`), bg `--paper-dk`.
- Disabled/spent choices: text `--ink-soft` on `--paper-mid`, border `--ink-soft`,
  no hover inversion.
- Attention/verb accents (in-scene offers): 2px `--signal` left border tab; timer or
  cost markers in `--brass`; consequence stamps ("NOTED", counts) in `--stamp` with
  `--stamp-dk` 1px offset shadow.

## HUD (top-left title/clock, top-right pause)

- Same panel treatment at reduced padding; clock digits `--brass` on `--ink`-bordered
  `--paper`; pause button follows the choice press/focus/hover states exactly.

## Type

Criteria: OFL license, genuine Cyrillic coverage, readable at 8–16 native px, rendered at
integer multiples only (font-size = n × native design size; no fractional px), vendored
into `public/fonts/` with the license file.

Candidates (verify Cyrillic glyph range at vendoring time):

1. **Terminus (TTF)** — OFL, full Cyrillic, terminal/administrative voice. Primary body
   candidate (dialogue, choices, journal).
2. **Press Start 2P** (Google Fonts, OFL) — Cyrillic subset, caps-heavy display voice.
   Headers, nameplates, HUD clock only — never body text.
3. **Pixelify Sans** (Google Fonts, OFL) — Cyrillic support, softer pixel voice.
   Fallback body candidate if Terminus reads too terminal.

Stack:

```css
--font-ui: "Terminus", "Pixelify Sans", ui-sans-serif, system-ui, sans-serif;
--font-head: "Press Start 2P", "Terminus", ui-sans-serif, system-ui, sans-serif;
```

- At the 150% text a11y setting, body text switches to the system sans tail of the stack
  (spec rule: system sans remains the large-text fallback); borders/colors unchanged.
- If no candidate passes the offline Cyrillic check, ship the system stack and log it.
- Minimum body size 16 CSS px equivalent; line-height locked to the ledger ruling grid.

## Prohibitions

- No border-radius, no blur/spread shadows, no gradients, no glow.
- No novelty/faux-Cyrillic display fonts; no heavy grunge textures on panels (wear is
  border notches + tone zones only).
- No layout moves, no new UI chrome, no text baked into images.
- Red (`--stamp`) is for stamps/alerts only — never decorative, never on hover states.
