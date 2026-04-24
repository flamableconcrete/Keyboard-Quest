# Grid & Equipment Slot Pixel Art — Design Spec

**Date:** 2026-04-23  
**Status:** Approved

## Overview

The inventory grid (CharacterScene backpack, ShopScene merchant and backpack panels) and all equipment slots currently render items as plain rarity-colored rectangles with a text name. This spec describes replacing that with unique pixel art sprites for every item, a paper doll layout in CharacterScene, and proportionally-sized equipment slots in ShopScene.

---

## 1. Consumable Pixel Art

Four consumable items are missing from `src/art/itemsArt.ts`. Add cases for each and include them in the `generateAllItemTextures` item list.

| Item ID | Visual Concept |
|---------|---------------|
| `swift_tonic` | Blue potion vial — round bottom, narrow neck, cork stopper |
| `iron_will` | Grey shield badge with a lightning bolt detail |
| `gold_fever` | Golden flask — flask silhouette with glowing yellow liquid |
| `word_of_power` | Open book with a glowing rune on the page |

All art follows the existing convention: `s = 3` pixel scale, `16*s × 16*s` texture, drawn with `scene.add.graphics()`.

---

## 2. GridPanel: Art + Name Label

### `_drawItem` changes

After the existing rarity-colored background rect, add:

1. **Art image** — `scene.add.image(centerX, centerY, itemId)` with `setDisplaySize(w * S - 8, h * S - 8)` and `setDepth(11)`. Only rendered when `scene.textures.exists(itemId)` is true (graceful fallback to color-only for any future item without art).
2. **Name label backing** — small semi-transparent black rect at top-left of the cell block (covers first ~12px of height, full width minus padding).
3. **Name label text** — same 9px bold white monospace text as today, positioned over the backing. Depth 12.

The selected-item gold border remains on the background rect.

### `DragState` changes

Add `ghostImage: Phaser.GameObjects.Image | null` to the `DragState` interface.

In `_startDrag`:
- Create the ghost rect (unchanged).
- If `scene.textures.exists(itemId)`, create a `scene.add.image` at the same position, sized to `(w * S - 8) × (h * S - 8)`, depth 101. Store as `ghostImage`.

In `_onDragMove`:
- Move `ghostImage` to `pointer.x, pointer.y` in sync with the ghost rect.

In `_onDragEnd` and `cancelDrag`:
- Destroy `ghostImage` alongside `ghost` and `ghostLabel`.

---

## 3. Equipment Slot Sizing

Equipment slots are resized to match the largest item that can occupy each slot type, using **EQUIP_CELL = 30px**:

| Slot | Largest item | Slot size |
|------|-------------|-----------|
| weapon | Excalibur 2×4 | 60 × 120 px |
| armor | Aegis Armor 2×4 | 60 × 120 px |
| accessory | Golden Idol / Taming Bell 1×2 | 30 × 60 px |
| trophy | Forest Crown / Speed Boots 2×2 → bounding 2×3 | 60 × 90 px |

### Shared `drawEquipSlotBox` helper

A helper function in **`src/utils/equipSlot.ts`** with signature:

```ts
drawEquipSlotBox(
  scene: Phaser.Scene,
  x: number, y: number,         // top-left corner
  slotW: number, slotH: number, // pixel dimensions
  slot: 'weapon' | 'armor' | 'accessory' | 'trophy',
  item: ItemData | null,
  onUnequip?: () => void,        // CharacterScene only
  onDragStart?: () => void       // ShopScene drag only
): Phaser.GameObjects.GameObject[]
```

Renders:
- **Empty**: dark bg (`0x0e0e22`), slot-type label (top, small grey), "EMPTY" text (centered).
- **Filled**: rarity-colored bg (0.5 alpha), gold stroke border, pixel art image centered in slot, item name label at bottom.

Returns all created game objects so callers can destroy them on redraw.

---

## 4. CharacterScene: Paper Doll Layout

### Layout

The equipment area in `drawInventoryTab` is replaced with a paper doll centered at a fixed anchor point (approximately `contentX + 200, contentY + 140`). All positions are relative to `paperDollCX, paperDollCY`.

```
                         [ACC 30×60]
[WPN 60×120]  [avatar 60×120]  [ARMOR 60×120]
                       [TROPHY 60×90]
```

Paper doll center anchor: `paperDollCX = contentX + 200, paperDollCY = contentY + 120`.

Avatar is 48×96px native → 60×120px at scale 1.25, so half-width = 30px, half-height = 60px.

Exact offsets (all top-left corners):
- **Avatar**: centered at `(paperDollCX, paperDollCY)`, `setScale(1.25)` → 60×120px display. Rendered via `AvatarRenderer.generateOne()` using the current `this.avatarConfig` and `this.profile.equipment`. Read-only (no interaction).
- **Weapon** slot: `(paperDollCX - 100, paperDollCY - 60)` — 10px gap left of avatar, vertically centered over the avatar.
- **Armor** slot: `(paperDollCX + 40, paperDollCY - 60)` — 10px gap right of avatar, vertically centered.
- **Accessory** slot: `(paperDollCX + 40, paperDollCY - 124)` — X-aligned with armor, sits directly above it with a 4px gap (armor top is at `paperDollCY - 60`; accessory is 60px tall so its top is at `paperDollCY - 124`).
- **Trophy** slot: `(paperDollCX - 30, paperDollCY + 65)` — centered below avatar (avatar bottom at `+60`, 5px gap). Trophy bottom lands at `paperDollCY + 155 = contentY + 275`, safely above the backpack label at `contentY + 275`. Fine-tune this offset during implementation if needed.

### Avatar re-render on equip change

When an item is equipped or unequipped, call `AvatarRenderer.generateOne()` again with the updated equipment to refresh the paper doll avatar texture. This already happens when saving in the Avatar tab — reuse the same pattern.

### Drop zones

Equipment slot boxes remain interactive drop zones (unchanged behavior): `backpackPanel.draggingItemId` is checked on `pointerup` and the drag is routed to the correct slot if item type matches.

### Unequip

The "X" unequip button moves from the current position to the top-right corner of each slot box (same behavior as today, repositioned).

### Spells section

`rightX = startX + 400` — unchanged, occupies the right half of the content area alongside the paper doll.

### Backpack grid

Position unchanged: `gridOriginY = startY + 300`. The paper doll fits within `startY` to `startY + 270`, leaving a comfortable margin.

---

## 5. ShopScene: Equipment Slots

`_drawEquipSlots` is updated to use the new slot sizes and `drawEquipSlotBox`. No avatar or paper doll — the row layout is kept. Slots are bottom-aligned so the shorter accessory and trophy slots sit flush with the bottom of the taller weapon and armor slots.

Row total width: 60 + 60 + 30 + 60 + (3 × 6px gap) = 228px, centered on `width * 3/4`.

The existing equip-drag behavior (drag from slot into backpack) is preserved: `_startEquipDrag` is updated to create an image ghost matching the new approach from GridPanel.

---

## Files Changed

| File | Change |
|------|--------|
| `src/art/itemsArt.ts` | Add 4 consumable art cases; add IDs to `generateAllItemTextures` list |
| `src/components/GridPanel.ts` | Art image in `_drawItem`; ghost image in drag state |
| `src/utils/equipSlot.ts` | New file — `drawEquipSlotBox` helper |
| `src/scenes/CharacterScene.ts` | Paper doll layout in `drawInventoryTab`; `drawEquipSlot` uses `drawEquipSlotBox` |
| `src/scenes/ShopScene.ts` | `_drawEquipSlots` uses new sizes and `drawEquipSlotBox`; equip drag ghost gains image |

`drawEquipSlotBox` lives in `src/utils/equipSlot.ts` and is imported by both CharacterScene and ShopScene.

---

## Out of Scope

- Mobile layout (`MobileOverlandMap`) — not addressed here.
- Adding art for items that don't exist yet.
- Changing item grid sizes or adding new items.
