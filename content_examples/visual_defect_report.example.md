# Visual Defect Report — Example

Asset/run: `char_arkady_pose_seated_listen_run-02`  
Compared with: `char_arkady_master_3q_v001`, `seat_template_table_a.svg`  
Status: **REJECTED — targeted edit required**

| Region | Category | Severity | Violated invariant | Observation | Smallest correction | Owner layer |
|---|---|---:|---|---|---|---|
| Head | identity | blocker | nose and jaw remain canonical | Nose tip is rounder and jaw is wider than master; reads as another person at close focus | Mask-edit nose/jaw from canonical head while retaining pose angle | source character art |
| Right hand | anatomy | blocker | five coherent digits and neutral rest | Index and middle finger fuse at game scale and source scale | Replace with approved relaxed-table hand asset | hand overlay |
| Pelvis/chair | seating | high | pelvis rests on seat plane | Torso appears 18 px too high; coat floats over seat | Shift body down 18 px and repaint coat compression only | compositing/source art |
| Left foot | geometry | high | foot reaches approved floor anchor | Foot floats 9 px above floor and points against perspective | Rotate lower leg/foot to template; add contact shadow | source art/shadow |
| Jacket | identity | medium | pocket and button construction fixed | Lower pocket changes from flap to welt | Restore canonical flap construction | source art |
| Face lighting | consistency | medium | key light from upper-left room source | Nose shadow points right-to-left opposite room light | Repaint local value plane; do not relight whole body | source art |
| Table edge | compositing | low | body behind furniture-front layer | Sleeve incorrectly overlaps table-front edge | Correct layer mask | runtime compositing |

## Retest

- aligned head-crop comparison;
- identity checklist;
- 1920×1080 full room;
- 1920×1080 close focus;
- 1366×768 full room;
- transparent-edge inspection over light and dark checkerboards.
