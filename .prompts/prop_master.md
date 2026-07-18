# Image Prompt Template — Historical Prop Master

Use this template for one isolated prop after its form and period plausibility have been documented in the historical ledger.

---

## Required inputs

- `[PATH_TO_DATED_REFERENCE_IMAGES]` — controls physical construction.
- `[LEDGER_IDS]` — records what is verified and what is a plausible composite.
- `[PATH_TO_ROOM_PERSPECTIVE_CLASS]` — controls view angle and scale.
- `[OPTIONAL_PATH_TO_HAND_ANCHOR]` — required for held props.

---

## Objective

Create one isolated, original illustrated game prop:

Prop ID: `[PROP_ID]`  
Object: `[OBJECT]`  
Date/plausibility range: `[DATE_RANGE]`  
State: `[CLEAN/WORN/OPEN/CLOSED/FULL/EMPTY]`  
Perspective/view: `[VIEW]`  
Approximate real dimensions: `[DIMENSIONS]`

Render one object only on transparent or plain neutral background. Match the project's clean painted adventure-game art language and the room's light direction.

---

## Construction requirements

- preserve the actual number and arrangement of parts;
- use coherent ellipses, symmetry, thickness, joints, hinges, handles, seams, and material transitions;
- wear follows handling and use;
- no decorative additions not supported by references;
- no text, labels, serial numbers, logos, stamps, pseudo-Cyrillic, or prices;
- any required label is a separate later SVG/texture based on verified copy;
- for glass, preserve rim, wall thickness, base, facets, and liquid surface perspective;
- for paper, output blank paper and add writing separately;
- for a cigarette or smoke, keep smoke as a separate animated overlay;
- for a bottle, keep cap, neck, shoulder, body, and base mechanically plausible.

---

## Output request

Produce `[2–3]` tightly controlled variants with identical construction. Vary only minor wear or painterly treatment.

---

## Codex QA

Inspect at 100%, at intended game scale, in the room, and—if held—in the canonical hand. Reject malformed geometry, impossible grip, inconsistent light, pseudo-text, wrong scale, or modernized form. Record the approved prop's ledger IDs, dimensions, perspective class, hand/table anchors, prompt, and review notes in sidecar metadata.
