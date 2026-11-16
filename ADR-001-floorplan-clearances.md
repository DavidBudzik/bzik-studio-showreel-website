# ADR-001: Furniture clearances on the A-101 plan sheets

**Status:** Accepted
**Date:** 2026-10-27
**Deciders:** Studio (David)

## Context
Both `White-Label-Minisite.html` and `Architecture-Drawing-Archive.html` embed the same 30 drawing SVGs
(3 projects × 10 sheets). Furniture appears only on the three A-101 plans and on the iso views (X-601…X-605).
An automated check (`check_clearances.py`, rules from `interior-staging/reference.md`) found 10 clashes:

| Sheet | Clash | Fix |
|---|---|---|
| 01 Moor House | WC free-standing inside the 1.2 m bath-door approach | WC moved onto the bath/bedroom partition |
| 01 | Shower tray overlaps north window by 100 mm | Tray reduced to 1000 × 1000 in NE corner, clear of glass |
| 01 | Basin vanity half under the bath window | 700 mm vanity in NW corner |
| 01 (visual) | Bed floating 550 mm off the wall; coffee table 300 mm from sofa | Headboard on partition; table at 375 mm |
| 02 Courtyard Apt | Sideboard inside the bedroom door swing | 450 mm sideboard against bedroom wall, west of door |
| 02 | Wardrobe blocking bedroom door approach | Shortened to 1.1 m, ends 150 mm before approach zone |
| 02 | Bed headboard under north window | Bed rotated, headboard on solid west wall |
| 02 | WC in front of basin, inside bath door approach | WC on west wall, basin on north wall |
| 02 | Hob under kitchen window | Sink centred under window, hob moved past the glass |
| 02 | Sofa 350 mm from west glazing | Sofa, coffee table and dining shifted 200 mm east |
| 03 Still Gallery | none | unchanged |

## Decision
Edit only the plan geometry (furniture rects/symbols), keeping walls, doors, windows, dimensions, areas and
title blocks unchanged. Worktops under windows are allowed (sill above worktop); hobs, showers, beds and tall
units are not. Door approach band: 1.2 m, reduced to 0.75 m in rooms under 5 m² (02 bath, 1.6 m deep).

## Options considered
- **A. Edit plan SVGs in place (chosen).** Low complexity, exact, verified by the checker.
- **B. Regenerate all sheets from the source model.** Keeps plan and iso views in step, but the generator
  is not in either file or this workspace.

## Consequences
- The plans are clash-free (checker: 0 findings on all three).
- **The iso / cutaway sheets (X-601…X-605) still show the old furniture positions**, and the 01 cutaway shows
  the kitchen as full-height units in front of the north window. They are flattened polygons with no object
  groups, so they need regeneration from the source model.
- Remaining tight spots: 02 bed has 500 mm side clearance; 02 bath door swings out into an 850 mm hall.

## Action items
1. [ ] Regenerate iso/cutaway views from the source model using the new positions.
2. [ ] Re-run `python3 check_clearances.py <plan.svg> '{"upm":20}'` after any plan edit (1:100 sheets: upm 10).

## Revision 2 (2026-10-27): dining, courtyard, pivot glazing, walls
- **02 dining:** table turned N–S (0.9 × 2.0 m), 1.8 m bench on the west side, four chairs on the east side facing
  the court. It sits by the hall and kitchen; 1.1 m circulation is kept between the chairs and the court glazing.
- **02 courtyard:** tree at the court centre (1.4 m canopy dashed, as overhead), ring of under-planting, 0.4 m
  planted bed with six shrubs along the solid east wall. All glazed sides kept clear.
- **02 court glazing:** the 3.1 m slider is replaced by a 2.07 m single-pane pivot (slim aluminium frame,
  concealed centre pivot, swings 1.03 m into the living room and 1.03 m into the court) plus a 1.03 m fixed pane.
  A full 3.1 m pivot would sweep 1.55 m into the court and hit the centred tree. Opened leaves are checked as doors.
- **Walls (all sheets):** two wall corners in 02 were left as floor (the bedroom/bath/living T-junction and the
  kitchen-door jamb at the court). Both are now wall. Wall outlines on 01/02/03 are redrawn as one continuous
  boundary, so junctions show no seam strokes. Wall audit (`wall_audit.py`): every remaining uncovered strip is
  a real door or glazing opening.
- **Areas:** R04 39.35 → 39.30 m²; thresholds 1.25 → 1.09 (pivot instead of slider); walls 11.47 → 11.67 m²;
  net 68.21 → 68.01 m²; net/gross 85.6% → 85.4%. Updated on A-101, A-102 and in the minisite area data. The
  embedded model JSON (furniture, court-left openings) matches the plans.

## Revision 3 (2026-10-28): living space re-zoned (02)
The N–S dining set sat on the circulation spine (entry → hall → bath / kitchen / bedroom, plus the court pivot).
R04 is now zoned in three parts:
- **East 1.2 m spine (x 7.2–8.4 m from the west face) is kept free** from the hall to the entry door. The pivot pane
  opens into this strip only.
- **Dining, NW corner:** 2.0 m banquette on the bedroom wall, 2.0 × 0.9 m table, four chairs facing it with 0.75 m
  pull-out space behind. Clear of the bedroom door swing and of the west glazing.
- **Lounge, SW, toward the south glazing:** 2.8 m sofa (backs onto the dining zone with 0.875 m behind the chairs),
  coffee table at 0.4 m, armchair facing west, 1.45 m low sideboard on the solid part of the west wall.
The checks report 0 clashes; the spine, hall, bedroom route and chair pull-out zone are all clear. The model JSON
matches the plan.

## Revision 4 (2026-10-28): A-102 plans at A-101 scale
On 01 and 02 the area plans (A-102) were at 1:100 while the ground plans (A-101) were at 1:50. Both A-102 plans are now
drawn at 1:50, at the same origin as A-101, so the plan keeps its size and position when switching sheets. The area
account moved to the A-101 schedule column (x 299–404 mm). Scale bars and title-block scales are updated. 03 was
already 1:100 on both sheets.
