# Inventory Layout Redesign

**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** `src/scenes/CharacterScene.ts` — `drawInventoryTab` only

## Problem

Two bugs in the current inventory tab:

1. **Overlapping labels** — `addSectionTitle` is called twice with the same `y` coordinate (once for "BACKPACK", once for "EQUIPPED"), rendering both strings on top of each other.
2. **Wrong grid orientation** — The backpack grid is 4 columns × 10 rows (tall/narrow). It should be 10 columns × 4 rows (wide/short), like a Diablo 1/2 inventory screen.

## Approved Design (Option C)

### Top section — two columns side-by-side

**Left column (~half the content width):**
- "EQUIPPED" section label
- 2×2 grid of equipment slots: WEAPON (top-left), ARMOR (top-right), ACCESS. (bottom-left), TROPHY (bottom-right)
- Each slot: ~130px wide × 80px tall

**Right column (~half the content width):**
- "OWNED SPELLS" section label + spell list
- SELL (75%) zone pinned to the bottom of this column

### Bottom section — full width

- "BACKPACK" section label
- Backpack grid: **10 columns × 4 rows**, `CELL_SIZE = 45` → 450×180px, left-aligned

## Implementation Details

### Grid constants

Replace hardcoded loop bounds with named values:

```typescript
private readonly GRID_COLS = 10
private readonly GRID_ROWS = 4
```

Update `drawInventoryTab` loops, `onDragMove`, and `onDragEnd` to use `GRID_COLS` / `GRID_ROWS` instead of the current literals `4` / `10`.

### `BackpackGrid` capacity

The `InventoryController`/`BackpackGrid` must be checked — it currently initialises a 4×10 grid. It needs to use the same 10×4 dimensions so `canPlace` / `getPlacements` remain correct.

### Label fix

Remove the two `addSectionTitle` calls for "BACKPACK" and "EQUIPPED" from `drawInventoryTab`. Replace with inline `this.add.text(...)` calls at their respective distinct positions so the labels never overlap.

### Position arithmetic

- `gridOriginX` — left edge of the full-width grid in the bottom section
- `gridOriginY` — top edge of the grid (below the top section)
- Equipment slots positioned relative to a `topSectionY` (same starting `y` as before)
- Sell zone and spells positioned in the right half of the top section

### No other changes

- Drag-and-drop logic (`startDragFromGrid`, `onDragMove`, `onDragEnd`, `dropOnEquipSlot`, `dropOnSellZone`) is unchanged except for the grid dimension constants.
- Stats tab, avatar tab, and all other scenes are untouched.

## Save Data Migration

`profile.backpackPlacements` stores item positions from the old 4×10 grid (y values up to 9). In the new 10×4 grid, y can only be 0–3, so old positions would be out-of-bounds.

**Fix in `InventoryController` constructor:** after loading `storedPlacements`, check whether any placement has `y >= GRID_ROWS` or `x >= GRID_COLS`. If so, discard the stored positions and call `BackpackGrid.autoArrange(items)` to re-place all backpack items from scratch. Save the new positions back to `profile.backpackPlacements` immediately so the migration is persisted.

This is a one-time silent re-arrangement — no user prompt needed.

## Files Changed

- `src/scenes/CharacterScene.ts` — `drawInventoryTab`, label positions
- `src/controllers/BackpackGrid.ts` — `GRID_COLS = 10`, `GRID_ROWS = 4`
- `src/controllers/BackpackGrid.test.ts` — update tests that assert on 4×10 boundaries
- `src/controllers/InventoryController.ts` — add out-of-bounds migration on load
