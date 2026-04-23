# Shop Screen Overhaul — Design Spec

**Date:** 2026-04-22  
**Status:** Approved

## Overview

Replace the current card-based Merchant's Tent screen with a Diablo 2-style split-screen: a merchant's item grid on the left, a vertical divider, and the player's inventory on the right. Both sides are grid-based. Cards are eliminated. Sell functionality is removed from CharacterScene and lives exclusively in the shop.

---

## 1. GridPanel Component

A new shared Phaser component extracted from CharacterScene's inventory tab.

**File:** `src/components/GridPanel.ts`

```ts
class GridPanel {
  constructor(
    scene: Phaser.Scene,
    originX: number,
    originY: number,
    cols: number,
    rows: number,
    cellSize: number
  )

  // Render items into the grid. Clears the previous render first.
  render(placements: GridPlacement[], options?: { draggable?: boolean }): void

  // Callback fired when the user clicks an item cell.
  onItemClick(cb: (itemId: string) => void): this

  // Callback fired when an item is drag-dropped to a new grid position.
  onItemDrop(cb: (itemId: string, toX: number, toY: number) => void): this

  // Highlight one item with a gold border. Pass null to clear.
  setSelected(itemId: string | null): void

  // Destroy all Phaser objects owned by this panel.
  destroy(): void
}
```

The following logic moves from CharacterScene into GridPanel:
- Cell background rendering
- `drawItemInGrid` (item rectangles + name labels)
- `startDragFromGrid`, `onDragMove`, `onDragEnd` (ghost + overlay)
- `dragOverlay` graphics object

CharacterScene's inventory tab is refactored to use `GridPanel`. All existing inventory tab behavior (drag-rearrange, drop-on-equip-slot) is preserved exactly.

---

## 2. ShopScene Layout

Full-screen scene (not a modal). Replaces the existing `ShopScene.ts` entirely.

**Canvas:** 1280×720, cell size 45px (matching CharacterScene).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ← BACK              THE MERCHANT'S TENT                        Gold: 450g    │ 44px
├───────────────────────────────────┬──────────────────────────────────────────┤
│  Merchant's Wares                 │  Your Inventory                          │
│                                   │                                          │
│  ┌─────────────────────────────┐  │  [ WEAPON ] [ ARMOR ] [ACCESS.] [TROPHY] │
│  │                             │  │                                          │
│  │     10 × 8 grid             │  │  ┌──────────────────────────────────┐   │
│  │     450 × 360 px            │  │  │   10 × 4 backpack grid           │   │
│  │                             │  │  │   450 × 180 px                   │   │
│  │                             │  │  └──────────────────────────────────┘   │
│  └─────────────────────────────┘  │                                          │
│                                   │  ┌──────────────────────────────────┐   │
│  ┌──────────────────────────────┐ │  │ [icon] Name          Rarity·Size │   │
│  │ [icon] Name      Rarity·Size │ │  │        Description               │   │
│  │        Description           │ │  │        +Effect       Sell: Xg    │   │
│  │        +Effect   Cost: Xg    │ │  └──────────────────────────────────┘   │
│  └──────────────────────────────┘ │                                          │
│  ┌──────────────────────────────┐ │  ┌──────────────────────────────────┐   │
│  │             BUY              │ │  │             SELL                 │   │
│  └──────────────────────────────┘ │  └──────────────────────────────────┘   │
└───────────────────────────────────┴──────────────────────────────────────────┘
         ~500px                3px              ~777px
```

**Panel widths** are set to give both grids comfortable padding within their panels. Exact pixel values set during implementation to fit cleanly on 1280px.

---

## 3. Merchant Grid

- **Dimensions:** 10 columns × 8 rows, cell size 45px
- **Population:** Items from `profile.currentShopItemIds`, excluding items already owned by the player (`inventoryController.ownedItemIds`). Packed into the 10×8 grid using `BackpackGrid.autoArrange` (same algorithm used for the player backpack).
- **Scroll:** Not needed — the 10×8 grid (80 cells) is large enough to display all available shop items without scrolling.
- **No item limit change:** The existing shop generation logic (`generateShopItems` / `currentShopItemIds`) is unchanged.

---

## 4. Buy Interaction

1. Player clicks a shop grid item → item is highlighted (gold border), item card appears at the bottom of the merchant panel.
2. **Item card** shows: item sprite, name, rarity, slot, grid size (e.g. "1×2"), description, stat effect, and **"Cost: Xg"**.
3. **BUY button** below the card:
   - **Active** (green): player can afford AND backpack has space for the item.
   - **Disabled** (grey, not clickable): player cannot afford OR backpack is full.
4. Clicking BUY: deducts gold, places item in backpack (first available space via `InventoryController.addToBackpack`), removes item from `currentShopItemIds` (gear only; consumables are unlimited stock), saves profile, refreshes scene.
5. Clicking a different shop item replaces the current card selection. Clicking the selected item again deselects it (card disappears).

---

## 5. Sell Interaction

1. Player clicks a backpack grid item → item is highlighted, item card appears at the bottom of the inventory panel.
2. **Item card** shows: item sprite, name, rarity, slot, grid size, description, stat effect, and **"Sell: Xg"** (75% of gold cost, floored).
3. **SELL button** below the card is always active when an item is selected.
4. Clicking SELL shows a confirmation popup: _"Sell [Item Name] for Xg?"_ with **Yes** / **No**.
   - Yes: adds gold to profile, removes item from backpack via `InventoryController.sell()`, saves profile, refreshes.
   - No: dismisses popup, selection remains.
5. Clicking a different backpack item replaces the card selection. Clicking the selected item again deselects.

---

## 6. Equipment Slot Behavior (Inventory Panel)

- Four slots displayed at the top of the inventory panel: WEAPON, ARMOR, ACCESS., TROPHY.
- Clicking an equipped item does **nothing** (no card shown).
- Dragging an equipped item onto the backpack grid unequips it and places it at the drop position, if space is available. Implementation: clear the equipment slot, then call `BackpackGrid.canPlace` at the target position; if valid, place there directly; if not, cancel the drag and leave the item equipped.
- If no space at the drop position, the drag is cancelled and the item stays equipped.

---

## 7. CharacterScene Changes

### Removed
- `drawSellZone()` method
- `dropOnSellZone()` method
- Sell zone rectangle and label
- Sell confirmation popup logic

### Refactored
- `drawItemInGrid`, `startDragFromGrid`, `onDragMove`, `onDragEnd`, `dragOverlay` extracted into `GridPanel`.
- `drawInventoryTab` updated to instantiate `GridPanel` and wire up callbacks.
- All existing drag-rearrange and drop-on-equip-slot behaviors preserved.

---

## 8. Data Changes

### `src/data/items.ts` — Assign real gold costs to zero-cost items

**Starter gear (World 1 quest rewards):**

| ID | Name | New goldCost |
|---|---|---|
| `rusty_quill` | Rusty Quill | 100g |
| `ink_blotter` | Ink Blotter | 100g |
| `iron_gauntlet` | Iron Gauntlet | 120g |
| `focus_ring` | Focus Ring | 100g |
| `lucky_charm` | Lucky Charm | 100g |
| `obsidian_nib` | Obsidian Nib | 140g |
| `padded_envelope` | Padded Envelope | 120g |
| `scholars_monocle` | Scholar's Monocle | 130g |

**Mastery trophies (one per world, epic rarity):**

| ID | Associated World | New goldCost |
|---|---|---|
| `mastery_speed_boots` | World 1 | 200g |
| `mastery_arcane_focus` | World 2 | 250g |
| `mastery_shadow_cloak` | World 3 | 300g |
| `mastery_forest_crown` | World 4 | 350g |
| `mastery_quill_of_power` | World 5 | 400g |

Note: `mastery_*` items have `worldUnlock: 1` in the current data — this is a pre-existing bug and is out of scope for this feature.

### `src/controllers/InventoryController.ts`

Remove the early-return guard in `sell()`:

```ts
// REMOVE this line:
if (item.goldCost === 0) return 0
```

All items are now sellable. Sell price remains `Math.floor(item.goldCost * 0.75)`.

---

## 9. Files Changed

| File | Change |
|---|---|
| `src/components/GridPanel.ts` | **New** — shared grid rendering component |
| `src/scenes/ShopScene.ts` | **Rewrite** — D2-style split layout |
| `src/scenes/CharacterScene.ts` | **Refactor** — use GridPanel, remove sell zone |
| `src/controllers/InventoryController.ts` | **Minor** — remove goldCost === 0 guard |
| `src/data/items.ts` | **Data** — assign real gold costs to 13 items |

---

## 10. Out of Scope

- Mobile/MobileOverlandMap shop variant (follows separately)
- Mastery trophy `worldUnlock` data fix
- Shop item stock refresh mechanic (unchanged from current)
- Drag rearranging within the merchant grid (merchant items are not rearrangeable)
