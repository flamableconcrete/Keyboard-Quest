# World Map Layout Redesign — Left-to-Right Progression

**Date:** 2026-03-14
**Status:** Approved

## Problem

Worlds 2–5 have level node layouts that do not progress left-to-right. Specifically:
- **World 2**: Entirely backwards — starts at far right (x=2381) and ends at far left (boss x=787).
- **World 3**: Zigzags wildly — l3 and mb1 share x=1836, then backtracks to x=547 for l6, then forward again.
- **World 4**: Mostly left-to-right until mb3→l8→l9 jump backwards in x (2305→2109→2070).
- **World 5**: Pure vertical zigzag — all nodes between x=992–1542, no meaningful left-to-right progression.

## Goal

Redesign node positions for worlds 2–5 so the path progresses **generally left-to-right** from level 1 through the boss, with no path crossings.

## Approach

**General left-to-right with wave pattern** — x values always increase from node to node (guaranteeing no crossings), while y values undulate up and down to create visual interest. Mini-boss nodes act as "checkpoint" high points, regular levels dip into valleys between them. The boss node is at the top-right of each world.

## New Node Positions

Each world's tile canvas is 32px/tile. All coordinates are in pixels (world-local).

### World 2 — "The Shadowed Fen" (15 nodes, ~2650px wide)

| Index | ID    | x    | y   | Notes                  |
|-------|-------|------|-----|------------------------|
| 0     | l1    | 150  | 560 | Fen entrance, lower-left |
| 1     | l2    | 350  | 450 | Rising                 |
| 2     | l3    | 540  | 330 | Rising                 |
| 3     | mb1   | 730  | 220 | Mini-boss checkpoint 1 |
| 4     | l4    | 870  | 370 | Dip after checkpoint   |
| 5     | l5    | 1000 | 490 | Valley                 |
| 6     | l6    | 1200 | 360 | Rising                 |
| 7     | mb2   | 1390 | 230 | Mini-boss checkpoint 2 |
| 8     | l7    | 1520 | 390 | Dip                    |
| 9     | l8    | 1680 | 510 | Valley                 |
| 10    | mb3   | 1860 | 360 | Mini-boss checkpoint 3 |
| 11    | l9    | 2020 | 230 | Rising                 |
| 12    | l10   | 2200 | 360 | Slight dip             |
| 13    | mb4   | 2370 | 220 | Mini-boss checkpoint 4 |
| 14    | boss  | 2520 | 80  | Final boss, upper-right |

### World 3 — "The Ember Peaks" (14 nodes, ~2500px wide)

| Index | ID    | x    | y   | Notes                       |
|-------|-------|------|-----|-----------------------------|
| 0     | l1    | 140  | 600 | Volcanic foothills, left    |
| 1     | l2    | 320  | 490 | Rising                      |
| 2     | l3    | 510  | 370 | Climbing slope              |
| 3     | mb1   | 710  | 250 | First volcanic checkpoint   |
| 4     | l4    | 880  | 400 | Down into valley            |
| 5     | l5    | 1060 | 530 | Deeper valley               |
| 6     | mb2   | 1260 | 360 | Second checkpoint, rising   |
| 7     | l6    | 1420 | 500 | Into next valley            |
| 8     | l7    | 1600 | 340 | Climbing up                 |
| 9     | mb3   | 1780 | 200 | Third checkpoint near summit |
| 10    | l8    | 1940 | 320 | Near-summit plateau         |
| 11    | l9    | 2100 | 190 | Climbing                    |
| 12    | mb4   | 2270 | 100 | Near peak                   |
| 13    | boss  | 2430 | 40  | Volcanic summit             |

### World 4 — "The Shrouded Wilds" (14 nodes, ~2500px wide)

| Index | ID    | x    | y   | Notes                    |
|-------|-------|------|-----|--------------------------|
| 0     | l1    | 140  | 450 | Forest entrance, left    |
| 1     | l2    | 330  | 320 | Winding up               |
| 2     | l3    | 520  | 460 | Winding down             |
| 3     | mb1   | 700  | 300 | Forest checkpoint 1      |
| 4     | l4    | 880  | 450 | Winding down             |
| 5     | l5    | 1070 | 300 | Winding up               |
| 6     | mb2   | 1260 | 460 | Forest checkpoint 2      |
| 7     | l6    | 1430 | 290 | Winding up               |
| 8     | l7    | 1610 | 440 | Winding down             |
| 9     | mb3   | 1790 | 270 | Forest checkpoint 3      |
| 10    | l8    | 1960 | 410 | Winding down             |
| 11    | l9    | 2130 | 260 | Winding up               |
| 12    | mb4   | 2300 | 150 | Near tower entrance      |
| 13    | boss  | 2460 | 80  | Deep forest final boss   |

### World 5 — "The Typemancer's Tower" (13 nodes, ~2350px wide)

| Index | ID    | x    | y   | Notes                   |
|-------|-------|------|-----|-------------------------|
| 0     | l1    | 130  | 620 | Tower base, left        |
| 1     | l2    | 330  | 500 | First floor             |
| 2     | l3    | 530  | 390 | Climbing                |
| 3     | mb1   | 720  | 270 | First tower guardian    |
| 4     | l4    | 900  | 400 | Chamber                 |
| 5     | l5    | 1090 | 270 | Ascending chamber       |
| 6     | mb2   | 1270 | 150 | Second guardian         |
| 7     | l6    | 1440 | 280 | Upper chamber           |
| 8     | l7    | 1620 | 160 | Ascending corridor      |
| 9     | mb3   | 1800 | 80  | Third guardian, near top |
| 10    | l8    | 1970 | 190 | Upper corridor          |
| 11    | mb4   | 2140 | 80  | Final guardian          |
| 12    | boss  | 2300 | 30  | Typemancer's throne     |

## Path Segments (Bezier Control Points)

For each segment from node[i] to node[i+1], the bezier control point `(cx, cy)` is placed at the midpoint with a vertical offset of ±60px to create a smooth curve:
- `cx = (x0 + x1) / 2`
- `cy = (y0 + y1) / 2 ± 60` (alternate sign each segment for a flowing S-curve feel)

### Cross-world transition control points (`unified.ts`)

After the redesign, `worldTransitions` in `unified.ts` must be updated. The world x-offsets are computed at runtime, so new approximate midpoint control points (using world-local coordinates + offset) are:

| Transition | New `cx` | New `cy` |
|---|---|---|
| W1→W2 (W1 boss → W2 l1) | ~2172 | ~375 |
| W2→W3 (W2 boss → W3 l1) | ~4855 | ~340 |
| W3→W4 (W3 boss → W4 l1) | ~7385 | ~245 |
| W4→W5 (W4 boss → W5 l1) | ~9895 | ~350 |

These are computed as midpoints between each world boss's unified x-position and the next world's l1 unified x-position.

## Files to Change

| File | Changes |
|------|---------|
| `src/data/maps/world2.ts` | `nodePositions`, `pathSegments`, `buildGround()` path tiles |
| `src/data/maps/world3.ts` | `nodePositions`, `pathSegments`, `buildGround()` path tiles |
| `src/data/maps/world4.ts` | `nodePositions`, `pathSegments`, `buildGround()` path tiles |
| `src/data/maps/world5.ts` | `nodePositions`, `pathSegments`, `buildGround()` path tiles |
| `src/data/maps/unified.ts` | Update all four `worldTransitions` bezier control points to reflect new boss and l1 positions |

## Tile Grid Path Strategy

Each segment between nodes uses L-shaped path tiles:
1. Horizontal tiles (`PATH_H`) from `col_start` to `col_end` at `row_start`
2. Vertical tiles (`PATH_V`) from `row_start` to `row_end` at `col_end`
3. A `PATH_CORNER` tile at the bend point `(col_end, row_start)`

Where `col = round(x / 32)`, `row = round(y / 32)`.

## Special-Node Tile Paths

Each world's `buildGround()` also draws a short tile path to the off-map special nodes (ITEMS, TAVERN, STABLE). These paths branch off from a specific game-path column/row in the tile grid. After the layout redesign these branch points will need to be repositioned to connect from the nearest new path tile, or removed if not applicable. Implementation should verify this per-world and update accordingly.

## Constraints

- All x values strictly increase per world (guarantees no path crossings)
- All y values stay within 30–680 (within 720px canvas height)
- All x values stay within each world's pixel width (cols × 32)
- No changes to level data (`world*.ts` in `src/data/levels/`) — only map layout files change
- No changes to `OverlandMapScene.ts`, `unified.ts`, or any gameplay logic
