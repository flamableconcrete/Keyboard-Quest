# Backpack: Tooltip, Stacking & Bug Fix Design

**Date:** 2026-04-26  
**Scope:** CharacterScene backpack grid and equipment slots

---

## Problem Statement

Four issues to address in the character screen inventory:

1. **Duplication ghost bug** — dragging an item in the backpack sometimes renders a visual duplicate that persists until the scene is re-entered.
2. **No hover tooltip** — items in the backpack and equipment slots have no detail card on hover.
3. **No consumable stacking** — buying multiple of the same consumable places duplicate grid cells instead of incrementing a quantity.
4. **Name label always visible** — item names are displayed statically on every grid cell and equipment slot, which is visually noisy.

---

## 1. Bug Fix — Drag Duplication

**Root cause:** `GridPanel._onDragEnd` calls `_onItemDropCb` (which triggers `CharacterScene.drawActiveTab` → destroys the old `GridPanel` and creates a new one), then continues to call `this._redraw()` on the now-destroyed panel. That `_redraw()` creates new Phaser objects that are never registered to any live panel, leaving permanent visual duplicates.

**Fix:** Add a `private _destroyed = false` flag to `GridPanel`. Set it to `true` in `destroy()`. In `_onDragEnd`, check the flag before calling `_redraw()` — skip the redraw if the panel has already been destroyed by the drop callback.

---

## 2. `ItemTooltipCard` Component

**File:** `src/components/ItemTooltipCard.ts`

A new class that owns a single Phaser `Container` rendering a styled info card. The container is at depth 200 so it always renders on top of all other UI.

### Card contents (top to bottom)
- Item name — in rarity color (`getItemColor(item.rarity)`)
- Slot + rarity line — e.g. `"Weapon · Uncommon"` in muted gray
- Description text — white, word-wrapped
- Effects list — each effect formatted as a human-readable line (e.g. `"+2 Power"`, `"+10% Gold Earned"`)
- Gold cost line — `"Cost: 450g"` — only shown when `showGoldCost: true`

### API

```ts
class ItemTooltipCard {
  constructor(scene: Phaser.Scene, options?: { showGoldCost?: boolean })
  show(item: ItemData, x: number, y: number): void
  move(x: number, y: number): void
  hide(): void
  destroy(): void
}
```

- `show` makes the container visible and positions it near the cursor.
- `move` repositions the card as the cursor moves. Nudges the card away from screen edges so it stays fully on-screen.
- `hide` makes the container invisible.
- `destroy` cleans up all Phaser objects.

### Integration points

The card is **created by the scene** (e.g. `CharacterScene`, `ShopScene`) and **passed down** as an option, so the scene controls `showGoldCost`. One shared instance per scene is repositioned for each item — not one per item.

**`GridPanelRenderOptions`** gains an optional `tooltip?: ItemTooltipCard` field. In `GridPanel._drawItem`, `pointerover` calls `tooltip.show(item, pointer.x, pointer.y)`, `pointermove` calls `tooltip.move(...)`, `pointerout` calls `tooltip.hide()`.

**`drawEquipSlotBox`** gains an optional `tooltip?: ItemTooltipCard` in its options param. Same `pointerover`/`pointermove`/`pointerout` hookup.

---

## 3. Consumable Stacking

### Data model change

`backpackPlacements` entries gain an optional `quantity` field:

```ts
backpackPlacements: { itemId: string; x: number; y: number; quantity?: number }[]
```

Absence of `quantity` means 1. No migration needed — existing saves without the field are treated as quantity 1.

### `InventoryController` changes

- **`addToBackpack(itemId)`** — for consumable items: if that `itemId` already has a placement and its quantity is below 99, increment quantity on the existing placement and return `true`. If quantity is already 99, return `false`. Non-consumables behave as before.
- **`removeFromBackpack(itemId)`** — for consumables: decrement quantity. Only removes the placement from the grid when quantity reaches 0. Non-consumables behave as before.
- **`getQuantity(itemId): number`** — returns current stack count (1 if no quantity field).

### `BackpackGrid` — no change

Stacking is a controller concern only. `BackpackGrid` continues to treat `itemId` as a unique key with one placement per item.

### Count badge in `GridPanel._drawItem`

If `quantity > 1`, render a small count badge in the bottom-right corner of the cell: white text `x3` (etc.) on a dark semi-transparent rounded backing. Max displayed: `x99`.

---

## 4. Name Label Removal

The always-visible name label (backing strip + text) is removed from:

- **`GridPanel._drawItem`** — the semi-transparent strip and name text at the top of each backpack cell are deleted.
- **`drawEquipSlotBox`** — the item name text at the bottom of each equipment slot is deleted.

Item identity is communicated via pixel-art sprite, rarity color, and the tooltip on hover. The slot-type label (e.g. `"WEAPON"`, `"ARMOR"`) in equipment slots is retained — it identifies the slot, not the item.

---

## Affected Files

| File | Change |
|------|--------|
| `src/components/GridPanel.ts` | Add `_destroyed` flag; remove name label; add tooltip hookup; add quantity badge |
| `src/components/ItemTooltipCard.ts` | **New file** |
| `src/utils/equipSlot.ts` | Remove item name label; add tooltip hookup |
| `src/controllers/InventoryController.ts` | Stack logic in `addToBackpack` / `removeFromBackpack`; add `getQuantity` |
| `src/types/index.ts` | Add `quantity?: number` to `backpackPlacements` entry type |
| `src/scenes/CharacterScene.ts` | Create `ItemTooltipCard` instance; pass to `GridPanel` and `drawEquipSlotBox` |
| `src/scenes/ShopScene.ts` | Create `ItemTooltipCard` with `showGoldCost: true`; pass to relevant panels |

---

## Out of Scope

- Stacking for non-consumable items (weapons, armor, accessories, trophies)
- Tooltip animations or delays (tooltip appears instantly, follows cursor)
- Any changes to the shop purchase flow or ShopScene grid rendering beyond tooltip hookup
