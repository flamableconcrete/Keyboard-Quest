# Crazed Cook's Camp — Layout Redesign

**Date:** 2026-03-18
**Scope:** `src/scenes/level-types/CrazedCookLevel.ts` only

---

## Overview

Move orcs, patience bars, and tickets entirely into the bottom seating zone, away from kitchen chaos and finger hints. Tickets move from covering the orc body to sitting beside it (to the right). Reduce from 5 seats to 4 to accommodate the wider per-slot footprint.

---

## Screen Layout (1280×720)

| Zone | Y range | Contents |
|------|---------|----------|
| Kitchen | 0–360 | Cooks wandering between stations |
| Counter | 360–400 | Serving counter band |
| Seating zone | 400–555 | Orcs, patience bars, tickets |
| Finger hints | ≈560 | Hard boundary — nothing above should touch this |
| Typing engine | ≈640 | Word display |

---

## Section 1: Seat Positions

**Change:** `SEAT_X` from `[160, 360, 560, 760, 960]` (5 seats, 200px apart) to `[200, 460, 720, 980]` (4 seats, 260px apart, centered in 1280px canvas).

---

## Section 2: Orc Placement

**Change:** Orc spawn Y from `248` to `475`.

At scale 2, the orc texture (60×72px) renders at 120×144px. With origin (0.5, 0.5):
- Top edge: y = 475 − 72 = 403 (just below counter bottom at y=400 — orc peers over the counter) ✓
- Bottom edge: y = 475 + 72 = 547 (above finger hints at y≈560, 13px clearance) ✓

---

## Section 3: Patience Bar Placement

**Change:** Patience bar Y from `100` (was incorrectly in the kitchen/back-wall zone) to `415`.

- Patience bar bg: center at `(seatX, 415)`, 100×10px
- Patience bar fg: left-anchored at `(seatX − 50, 415)`, 100×10px
- X stays the same as the orc (centered above orc head)

---

## Section 4: Ticket Placement

**Change:** Ticket moves from centered on the orc to the right of the orc.

| Element | Old position | New position |
|---------|-------------|-------------|
| Ticket bg center | `(seatX, 260)` | `(seatX + 115, 475)` |
| Text lines X | `seatX` | `seatX + 115` |
| Text lines Y | `213 + i * 26` | `435 + i * 24` |
| Underlines X | `seatX` | `seatX + 115` |
| Underlines Y | `213 + i * 26 + 11` | `435 + i * 24 + 10` |

Ticket size: 100×110px (height reduced from 120 to fit the seating zone).

**No-overlap verification** (orc half-width = 60px, ticket half-width = 50px):
- Ticket center X = seatX + 115 → left edge at seatX + 65, right edge at seatX + 165
- Adjacent seat orc left edge: (seatX + 260) − 60 = seatX + 200
- Gap between ticket right edge and next orc left edge: 200 − 165 = **35px** ✓
- Rightmost ticket right edge (seat 3, x=980): 980 + 165 = 1145 < 1280 ✓

---

## Files Changed

| File | Change |
|------|--------|
| `src/scenes/level-types/CrazedCookLevel.ts` | Update `SEAT_X`, orc spawn Y, patience bar Y, ticket X/Y coordinates |

---

## Out of Scope

- No art changes (`crazedCookArt.ts` unchanged — the seating zone background tiles already extend to the bottom)
- No gameplay mechanic changes
- No changes to ticket size logic, ingredient count, or patience rates
- HUD and typing engine positions unchanged
