# Grid & Equipment Slot Pixel Art Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace plain rarity-colored rectangles in inventory grids and equipment slots with unique pixel art sprites, add a paper doll layout in CharacterScene, and proportionally-size equipment slots in ShopScene.

**Architecture:** Bottom-up: consumable art first (Task 1), then GridPanel art rendering (Tasks 2–3), then the shared equip-slot utility (Task 4), then CharacterScene paper doll (Task 5), then ShopScene slot update (Task 6). Each task is independently buildable and browser-testable.

**Tech Stack:** Phaser 3, TypeScript, Vitest. Run tests: `npm run test` or `npx vitest run <file>`. Type-check + build: `npm run build`. Dev server: `npm run dev`.

---

### File Map

| Action | File | What changes |
|--------|------|--------------|
| Modify | `src/art/itemsArt.ts` | Export `ITEM_TEXTURE_IDS`; add 4 consumable cases |
| Create | `src/art/itemsArt.test.ts` | Coverage test: every item ID is in `ITEM_TEXTURE_IDS` |
| Modify | `src/components/GridPanel.ts` | Art image in `_drawItem`; `ghostImage` in drag state |
| Create | `src/utils/equipSlot.ts` | `EQUIP_CELL`, `EQUIP_SLOT_SIZES`, `drawEquipSlotBox` |
| Create | `src/utils/equipSlot.test.ts` | EQUIP_SLOT_SIZES fits all items per slot type |
| Modify | `src/scenes/CharacterScene.ts` | Paper doll layout; remove old `drawEquipSlot`; use `drawEquipSlotBox` |
| Modify | `src/scenes/ShopScene.ts` | `_drawEquipSlots` uses new sizes + `drawEquipSlotBox`; equip drag ghost gains art |

---

## Task 1: Export ITEM_TEXTURE_IDS and add consumable pixel art

**Files:**
- Modify: `src/art/itemsArt.ts`
- Create: `src/art/itemsArt.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/art/itemsArt.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ITEM_TEXTURE_IDS } from './itemsArt'
import { ITEMS } from '../data/items'

describe('ITEM_TEXTURE_IDS', () => {
  it('covers every item ID in ITEMS (no item falls through to magenta fallback)', () => {
    const allIds = ITEMS.map(i => i.id)
    const missing = allIds.filter(id => !ITEM_TEXTURE_IDS.includes(id))
    expect(missing).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/art/itemsArt.test.ts
```

Expected: FAIL — `ITEM_TEXTURE_IDS` not exported yet, and `swift_tonic` / `iron_will` / `gold_fever` / `word_of_power` are missing from the list.

- [ ] **Step 3: Export ITEM_TEXTURE_IDS and add consumable cases**

Replace the hardcoded array inside `generateAllItemTextures` with an exported constant, then add the four consumable cases to the switch in `generateItemTexture`.

In `src/art/itemsArt.ts`, change the top of `generateAllItemTextures` and add the export:

```ts
export const ITEM_TEXTURE_IDS = [
  'rusty_quill', 'ink_blotter', 'iron_gauntlet', 'focus_ring', 'lucky_charm',
  'obsidian_nib', 'padded_envelope', 'scholars_monocle',
  'copper_shortsword', 'iron_broadsword', 'steel_longsword', 'mithril_blade', 'excalibur',
  'leather_tunic', 'chainmail_shirt', 'steel_plate', 'dragon_scale_mail', 'aegis_armor',
  'lucky_coin', 'hunters_charm', 'golden_idol', 'taming_bell', 'midas_ring',
  'mastery_speed_boots', 'mastery_arcane_focus', 'mastery_shadow_cloak',
  'mastery_forest_crown', 'mastery_quill_of_power',
  'swift_tonic', 'iron_will', 'gold_fever', 'word_of_power',
]

export function generateAllItemTextures(scene: Phaser.Scene) {
  ITEM_TEXTURE_IDS.forEach(id => generateItemTexture(scene, id))
}
```

Add these four cases to the `switch` in `generateItemTexture` (before the `default` case):

```ts
case 'swift_tonic':
  // Blue potion vial: round body, narrow neck, cork stopper
  g.fillStyle(0x888888); g.fillRect(7*s, 2*s, 2*s, 2*s)   // cork
  g.fillStyle(0xaaaaaa); g.fillRect(6*s, 4*s, 4*s, 2*s)   // neck
  g.fillStyle(0x2244cc); g.fillRect(5*s, 6*s, 6*s, 7*s)   // body (dark blue)
  g.fillStyle(0x4488ff); g.fillRect(5*s, 6*s, 6*s, 5*s)   // liquid fill
  g.fillStyle(0x2244cc); g.fillRect(5*s, 11*s, 6*s, 2*s)  // bottom shade
  g.fillStyle(0x88aaff); g.fillRect(6*s, 7*s, 1*s, 3*s)   // highlight
  break
case 'iron_will':
  // Shield badge with a gold lightning bolt
  g.fillStyle(0x777777); g.fillRect(5*s, 3*s, 6*s, 9*s)   // shield body
  g.fillStyle(0x555555); g.fillTriangle(5*s, 12*s, 11*s, 12*s, 8*s, 15*s) // shield point
  g.fillStyle(0x999999); g.fillRect(5*s, 3*s, 6*s, 1*s)   // top highlight
  g.fillStyle(0xffd700); g.fillRect(9*s, 5*s, 1*s, 3*s)   // bolt top-right
  g.fillStyle(0xffd700); g.fillRect(7*s, 7*s, 3*s, 2*s)   // bolt cross
  g.fillStyle(0xffd700); g.fillRect(7*s, 9*s, 1*s, 3*s)   // bolt bottom-left
  break
case 'gold_fever':
  // Rounded golden flask with glowing yellow liquid
  g.fillStyle(0xaaaaaa); g.fillRect(7*s, 2*s, 2*s, 2*s)   // cork
  g.fillStyle(0x888888); g.fillRect(6*s, 4*s, 4*s, 1*s)   // neck
  g.fillStyle(0xffd700); g.fillRect(4*s, 5*s, 8*s, 8*s)   // round body outer
  g.fillStyle(0xffaa00); g.fillRect(5*s, 6*s, 6*s, 6*s)   // body inner
  g.fillStyle(0xffee44); g.fillRect(5*s, 6*s, 2*s, 3*s)   // highlight
  g.fillStyle(0xffd700); g.fillRect(4*s, 13*s, 8*s, 1*s)  // base
  break
case 'word_of_power':
  // Open book with a glowing purple rune
  g.fillStyle(0x8b4513); g.fillRect(3*s, 4*s, 10*s, 9*s)  // cover
  g.fillStyle(0xf5deb3); g.fillRect(4*s, 5*s, 4*s, 7*s)   // left page
  g.fillStyle(0xf0d8a0); g.fillRect(8*s, 5*s, 4*s, 7*s)   // right page
  g.fillStyle(0x8b4513); g.fillRect(7*s, 4*s, 2*s, 9*s)   // spine
  g.fillStyle(0xcc66ff); g.fillRect(5*s, 7*s, 2*s, 1*s)   // rune left-top
  g.fillStyle(0xcc66ff); g.fillRect(5*s, 9*s, 2*s, 1*s)   // rune left-bottom
  g.fillStyle(0xcc66ff); g.fillRect(5*s, 7*s, 1*s, 3*s)   // rune left-vert
  g.fillStyle(0xaa44dd); g.fillRect(9*s, 7*s, 2*s, 3*s)   // rune right
  g.fillStyle(0xaa44dd); g.fillRect(10*s, 8*s, 1*s, 1*s)  // rune center dot
  break
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/art/itemsArt.test.ts
```

Expected: PASS

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/art/itemsArt.ts src/art/itemsArt.test.ts
git commit -m "feat: add consumable pixel art and export ITEM_TEXTURE_IDS"
```

---

## Task 2: GridPanel — show pixel art in grid cells

**Files:**
- Modify: `src/components/GridPanel.ts`

This task has no unit test — it is pure Phaser rendering. Verify visually in the browser after applying.

- [ ] **Step 1: Replace `_drawItem` in GridPanel**

Find the existing `_drawItem` method (line ~195). Replace its body with the version below. The only structural change is: insert an art image between the background rect and the name label, and add a semi-transparent backing behind the name label.

```ts
private _drawItem(itemId: string, col: number, row: number, w: number, h: number): void {
  const S = this.cellSize
  const item = getItem(itemId)
  if (!item) return

  const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color
  const isSelected = this._selectedItemId === itemId
  const px = this.originX + col * S
  const py = this.originY + row * S
  const cx = px + (w * S) / 2
  const cy = py + (h * S) / 2

  // Rarity-colored background
  const bg = this.scene.add.rectangle(cx, cy, w * S - 4, h * S - 4, itemColor, 0.7)
    .setInteractive({ useHandCursor: true }).setDepth(10)
  if (isSelected) bg.setStrokeStyle(2, 0xffd700)
  this.objects.push(bg)

  // Pixel art sprite (if texture exists)
  if (this.scene.textures.exists(itemId)) {
    const img = this.scene.add.image(cx, cy, itemId)
      .setDisplaySize(w * S - 8, h * S - 8)
      .setDepth(11)
    this.objects.push(img)
  }

  // Name label backing (semi-transparent strip at top of item block)
  const backing = this.scene.add.rectangle(
    cx, py + 7, w * S - 4, 14, 0x000000, 0.55
  ).setDepth(11)
  this.objects.push(backing)

  // Name label text
  const label = this.scene.add.text(
    px + 4, py + 2,
    item.name,
    { fontSize: '9px', color: '#ffffff', wordWrap: { width: w * S - 8 }, fontStyle: 'bold' }
  ).setDepth(12)
  this.objects.push(label)

  const { draggable, clickToSelect } = this._options

  if (draggable && clickToSelect) {
    bg.on('pointerdown', () => {
      const toggle = this._selectedItemId === itemId ? null : itemId
      this._selectedItemId = toggle
      this._onItemClickCb?.(itemId)
      this._redraw()
      this._pointerDownAt = {
        x: this.scene.input.activePointer.x,
        y: this.scene.input.activePointer.y,
      }
      this._pendingDrag = { itemId, col, row, w, h }
      this.scene.input.once('pointermove', this._checkDragThreshold, this)
      this.scene.input.once('pointerup',   this._clearPendingDrag,   this)
    })
  } else if (draggable) {
    bg.on('pointerdown', () => this._startDrag(itemId, col, row, w, h))
  } else {
    bg.on('pointerdown', () => {
      this._selectedItemId = this._selectedItemId === itemId ? null : itemId
      this._onItemClickCb?.(itemId)
      this._redraw()
    })
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Verify visually**

Run `npm run dev`, open the browser, navigate to the Merchant shop or inventory. Items in both grids should now show their pixel art sprite with a small name label strip at the top of each cell block.

- [ ] **Step 4: Commit**

```bash
git add src/components/GridPanel.ts
git commit -m "feat: show pixel art in GridPanel grid cells"
```

---

## Task 3: GridPanel — pixel art on drag ghost

**Files:**
- Modify: `src/components/GridPanel.ts`

- [ ] **Step 1: Add `ghostImage` to `DragState`**

Find the `DragState` interface at the top of the file (~line 5) and add the new field:

```ts
interface DragState {
  itemId: string
  ghost: Phaser.GameObjects.Rectangle
  ghostLabel: Phaser.GameObjects.Text
  ghostImage: Phaser.GameObjects.Image | null
  w: number
  h: number
  originCol: number
  originRow: number
}
```

- [ ] **Step 2: Create ghost image in `_startDrag`**

Find `_startDrag` (~line 276). After the `ghost` and `ghostLabel` creations, add:

```ts
let ghostImage: Phaser.GameObjects.Image | null = null
if (this.scene.textures.exists(itemId)) {
  ghostImage = this.scene.add.image(
    this.originX + col * S + (w * S) / 2,
    this.originY + row * S + (h * S) / 2,
    itemId
  ).setDisplaySize(w * S - 8, h * S - 8).setDepth(101)
}
```

Then update the `this._dragging = { ... }` assignment to include `ghostImage`:

```ts
this._dragging = { itemId, ghost, ghostLabel, ghostImage, w, h, originCol: col, originRow: row }
```

- [ ] **Step 3: Move ghost image in `_onDragMove`**

Find `_onDragMove`. After `ghost.setPosition(pointer.x, pointer.y)`, add:

```ts
this._dragging.ghostImage?.setPosition(pointer.x, pointer.y)
```

- [ ] **Step 4: Destroy ghost image in `_onDragEnd`**

Find `_onDragEnd`. After `ghostLabel.destroy()`, add:

```ts
this._dragging.ghostImage?.destroy()
```

- [ ] **Step 5: Destroy ghost image in `cancelDrag`**

Find `cancelDrag`. After `this._dragging.ghostLabel.destroy()`, add:

```ts
this._dragging.ghostImage?.destroy()
```

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 7: Verify visually**

Run `npm run dev`. In the CharacterScene inventory tab, drag an item in the backpack grid. The dragged ghost should now show the pixel art sprite instead of just a colored rectangle.

- [ ] **Step 8: Commit**

```bash
git add src/components/GridPanel.ts
git commit -m "feat: show pixel art on drag ghost in GridPanel"
```

---

## Task 4: Create `src/utils/equipSlot.ts`

**Files:**
- Create: `src/utils/equipSlot.ts`
- Create: `src/utils/equipSlot.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/utils/equipSlot.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { EQUIP_SLOT_SIZES, EQUIP_CELL } from './equipSlot'
import { ITEMS } from '../data/items'

describe('EQUIP_SLOT_SIZES', () => {
  it('weapon slot fits Excalibur (2×4 — the largest weapon)', () => {
    expect(EQUIP_SLOT_SIZES.weapon.w).toBe(2 * EQUIP_CELL)
    expect(EQUIP_SLOT_SIZES.weapon.h).toBe(4 * EQUIP_CELL)
  })

  it('armor slot fits Aegis Armor (2×4 — the largest armor)', () => {
    expect(EQUIP_SLOT_SIZES.armor.w).toBe(2 * EQUIP_CELL)
    expect(EQUIP_SLOT_SIZES.armor.h).toBe(4 * EQUIP_CELL)
  })

  it('accessory slot fits every accessory item in the game', () => {
    const items = ITEMS.filter(i => i.slot === 'accessory')
    for (const item of items) {
      expect(item.gridSize.w * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.accessory.w)
      expect(item.gridSize.h * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.accessory.h)
    }
  })

  it('trophy slot fits every trophy item in the game', () => {
    const items = ITEMS.filter(i => i.slot === 'trophy')
    for (const item of items) {
      expect(item.gridSize.w * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.trophy.w)
      expect(item.gridSize.h * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.trophy.h)
    }
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/utils/equipSlot.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/utils/equipSlot.ts`**

```ts
import Phaser from 'phaser'
import { ItemData } from '../types'
import { getItemColor } from '../data/items'

export const EQUIP_CELL = 30

/** Pixel dimensions of each equipment slot, sized to hold the largest item for that slot type. */
export const EQUIP_SLOT_SIZES: Record<'weapon' | 'armor' | 'accessory' | 'trophy', { w: number; h: number }> = {
  weapon:    { w: 2 * EQUIP_CELL, h: 4 * EQUIP_CELL }, // 60×120 — largest: Excalibur 2×4
  armor:     { w: 2 * EQUIP_CELL, h: 4 * EQUIP_CELL }, // 60×120 — largest: Aegis Armor 2×4
  accessory: { w: 1 * EQUIP_CELL, h: 2 * EQUIP_CELL }, // 30×60  — largest: Golden Idol 1×2
  trophy:    { w: 2 * EQUIP_CELL, h: 3 * EQUIP_CELL }, // 60×90  — largest: 2×3 bounding box
}

/**
 * Draw an equipment slot box at (x, y) in top-left coordinates.
 * Returns all created GameObjects so the caller can track them for destruction.
 * Objects are added to the scene display list by scene.add.*; callers using a
 * Phaser Container must call container.add(obj) on each returned object.
 */
export function drawEquipSlotBox(
  scene: Phaser.Scene,
  x: number,
  y: number,
  slot: 'weapon' | 'armor' | 'accessory' | 'trophy',
  item: ItemData | null,
  options: {
    onUnequip?: () => void
    onDrop?: () => void
    onDragStart?: () => void
  } = {}
): Phaser.GameObjects.GameObject[] {
  const out: Phaser.GameObjects.GameObject[] = []
  const { w, h } = EQUIP_SLOT_SIZES[slot]
  const cx = x + w / 2
  const cy = y + h / 2
  const slotLabel = slot === 'accessory' ? 'ACCESS.' : slot.toUpperCase()

  if (item) {
    const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color

    const bg = scene.add.rectangle(cx, cy, w, h, itemColor, 0.5)
      .setStrokeStyle(2, 0xffd700)
      .setDepth(5)
    out.push(bg)

    if (scene.textures.exists(item.id)) {
      out.push(
        scene.add.image(cx, cy, item.id)
          .setDisplaySize(w - 8, h - 8)
          .setDepth(6)
      )
    }

    // Slot-type label (top)
    out.push(
      scene.add.text(cx, y + 4, slotLabel, { fontSize: '8px', color: '#888888' })
        .setOrigin(0.5, 0).setDepth(7)
    )

    // Item name (bottom)
    out.push(
      scene.add.text(cx, y + h - 4, item.name, {
        fontSize: '8px', color: '#ffffff', fontStyle: 'bold',
        wordWrap: { width: w - 4 }, align: 'center',
      }).setOrigin(0.5, 1).setDepth(7)
    )

    if (options.onDragStart) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', options.onDragStart)
    }

    if (options.onDrop) {
      if (!bg.input) bg.setInteractive()
      bg.on('pointerup', options.onDrop)
    }

    if (options.onUnequip) {
      const btn = scene.add.text(x + w - 2, y + 2, 'X', {
        fontSize: '11px', color: '#ff4444', fontStyle: 'bold',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(8)
      btn.on('pointerdown', options.onUnequip)
      out.push(btn)
    }
  } else {
    const bg = scene.add.rectangle(cx, cy, w, h, 0x0e0e22)
      .setStrokeStyle(1, 0x2a2a55)
      .setDepth(5)
    out.push(bg)

    if (options.onDrop) {
      bg.setInteractive()
      bg.on('pointerup', options.onDrop)
    }

    out.push(
      scene.add.text(cx, y + 4, slotLabel, { fontSize: '8px', color: '#555577' })
        .setOrigin(0.5, 0).setDepth(6)
    )
    out.push(
      scene.add.text(cx, cy, 'EMPTY', { fontSize: '9px', color: '#444466' })
        .setOrigin(0.5).setDepth(6)
    )
  }

  return out
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/utils/equipSlot.test.ts
```

Expected: PASS — all 4 assertions green.

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/utils/equipSlot.ts src/utils/equipSlot.test.ts
git commit -m "feat: add equipSlot utility with EQUIP_SLOT_SIZES and drawEquipSlotBox"
```

---

## Task 5: CharacterScene — paper doll layout

**Files:**
- Modify: `src/scenes/CharacterScene.ts`

- [ ] **Step 1: Update imports**

At the top of `CharacterScene.ts`, add:

```ts
import { drawEquipSlotBox } from '../utils/equipSlot'
```

- [ ] **Step 2: Replace `drawInventoryTab`**

Delete the existing `drawInventoryTab` method (lines ~132–184) and `drawEquipSlot` method (lines ~186–236). Replace with this single method:

```ts
private drawInventoryTab(startX: number, startY: number) {
  // ── Paper doll ─────────────────────────────────────────────────────────
  const paperDollCX = startX + 200
  const paperDollCY = startY + 120

  // Render avatar with current equipment
  const pdKey = `pd_${this.profileSlot}`
  AvatarRenderer.generateOne(this, { ...this.avatarConfig, id: pdKey }, this.profile.equipment)
  this.container.add(
    this.add.image(paperDollCX, paperDollCY, pdKey).setScale(1.25).setDepth(5)
  )

  // Equipment slots around the avatar
  const slotConfigs = [
    { slot: 'weapon',    x: paperDollCX - 100, y: paperDollCY - 60  },
    { slot: 'armor',     x: paperDollCX + 40,  y: paperDollCY - 60  },
    { slot: 'accessory', x: paperDollCX + 40,  y: paperDollCY - 124 },
    { slot: 'trophy',    x: paperDollCX - 30,  y: paperDollCY + 65  },
  ] as const

  for (const { slot, x, y } of slotConfigs) {
    const itemId = this.profile.equipment[slot]
    const item = itemId ? getItem(itemId) : null
    const objs = drawEquipSlotBox(this, x, y, slot, item, {
      onUnequip: item ? () => {
        this.inventoryController.unequip(slot)
        this.profile.equipment = { ...this.inventoryController.equipment }
        saveProfile(this.profileSlot, this.profile)
        this.avatarDirty = true
        this.drawActiveTab()
      } : undefined,
      onDrop: () => {
        const draggingId = this.backpackPanel?.draggingItemId
        if (!draggingId) return
        const dragItem = getItem(draggingId)
        if (dragItem?.slot === slot) this.dropOnEquipSlot(draggingId, slot)
      },
    })
    objs.forEach(o => this.container.add(o))
  }

  // ── Spells (top-right) ─────────────────────────────────────────────────
  const rightX = startX + 400

  this.container.add(
    this.add.text(rightX, startY, 'OWNED SPELLS', {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
    })
  )
  this.drawSpells(this.container, rightX, startY + 35)

  // ── Backpack grid (bottom) ─────────────────────────────────────────────
  const gridOriginX = startX + 20
  const gridOriginY = startY + 300

  this.container.add(
    this.add.text(gridOriginX, gridOriginY - 25, 'BACKPACK', {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
    })
  )

  this.backpackPanel?.destroy()
  this.backpackPanel = new GridPanel(
    this, gridOriginX, gridOriginY, GRID_COLS, GRID_ROWS, this.CELL_SIZE
  )
  this.backpackPanel
    .onItemDrop((itemId, col, row) => {
      const moved = this.inventoryController.moveInBackpack(itemId, col, row)
      if (moved) saveProfile(this.profileSlot, this.profile)
      this.drawActiveTab()
    })
    .render(
      this.inventoryController.backpackGrid.getPlacements(),
      { draggable: true, grid: this.inventoryController.backpackGrid }
    )
}
```

- [ ] **Step 3: Remove now-unused `dropOnEquipSlot` import guard**

`dropOnEquipSlot` is still used (called from the `onDrop` callbacks above) — do **not** remove it. Verify it still compiles.

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no errors. If TypeScript complains about the `as const` slotConfigs array, ensure the slot values match the union type `'weapon' | 'armor' | 'accessory' | 'trophy'`.

- [ ] **Step 5: Verify visually**

Run `npm run dev` and open the inventory screen. You should see:
- The player avatar in the center of the equipment area
- Weapon slot to the left, armor to the right, accessory above-right, trophy below
- Pixel art + item name in each filled slot; "EMPTY" label in each empty slot
- Drag an item from backpack to an equipment slot — should still work
- "X" unequip button on each filled slot — should still work
- Backpack grid below with art (from Task 2)

If the trophy slot overlaps the BACKPACK label, adjust `paperDollCY` down by 10px to `startY + 110`.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/CharacterScene.ts
git commit -m "feat: CharacterScene paper doll layout with pixel art equipment slots"
```

---

## Task 6: ShopScene — update equipment slots

**Files:**
- Modify: `src/scenes/ShopScene.ts`

- [ ] **Step 1: Update imports**

At the top of `ShopScene.ts`, add:

```ts
import { drawEquipSlotBox, EQUIP_SLOT_SIZES } from '../utils/equipSlot'
```

- [ ] **Step 2: Replace `_drawEquipSlots`**

Delete the existing `_drawEquipSlots` method and replace with:

```ts
private _drawEquipSlots(centerX: number, y: number) {
  const slotDefs = [
    { slot: 'weapon'    as const },
    { slot: 'armor'     as const },
    { slot: 'accessory' as const },
    { slot: 'trophy'    as const },
  ]

  const gap = 6
  const totalW = slotDefs.reduce((sum, { slot }) => sum + EQUIP_SLOT_SIZES[slot].w + gap, -gap)
  const maxH   = Math.max(...slotDefs.map(({ slot }) => EQUIP_SLOT_SIZES[slot].h))
  let curX = centerX - totalW / 2

  for (const { slot } of slotDefs) {
    const { w, h } = EQUIP_SLOT_SIZES[slot]
    const slotY  = y + maxH - h  // bottom-align shorter slots
    const itemId = this.profile.equipment[slot]
    const item   = itemId ? getItem(itemId) : null

    drawEquipSlotBox(this, curX, slotY, slot, item, {
      onDragStart: item ? () => this._startEquipDrag(item.id, slot, item) : undefined,
    })

    curX += w + gap
  }
}
```

> Note: `drawEquipSlotBox` calls `scene.add.*` which adds objects directly to the scene — no need to track them here since ShopScene calls `scene.restart()` whenever the equip state changes, which destroys all scene objects.

- [ ] **Step 3: Add `ghostImage` to the equip drag state in `_startEquipDrag`**

Find the `equipDrag` private field declaration (~line 33) and add `ghostImage`:

```ts
private equipDrag: {
  itemId: string
  slot:   'weapon' | 'armor' | 'accessory' | 'trophy'
  ghost:  Phaser.GameObjects.Rectangle
  ghostImage: Phaser.GameObjects.Image | null
  label:  Phaser.GameObjects.Text
  w: number
  h: number
} | null = null
```

In `_startEquipDrag`, after creating `ghost` and `label`, add:

```ts
let ghostImage: Phaser.GameObjects.Image | null = null
if (this.textures.exists(itemId)) {
  ghostImage = this.add.image(ptr.x, ptr.y, itemId)
    .setDisplaySize(w * S - 8, h * S - 8)
    .setDepth(101)
}
```

Update the `this.equipDrag = { ... }` assignment to include `ghostImage`:

```ts
this.equipDrag = { itemId, slot, ghost, ghostImage, label, w, h }
```

- [ ] **Step 4: Move ghost image in `_onEquipDragMove`**

In `_onEquipDragMove`, after `ghost.setPosition(pointer.x, pointer.y)`, add:

```ts
this.equipDrag.ghostImage?.setPosition(pointer.x, pointer.y)
```

- [ ] **Step 5: Destroy ghost image in `_onEquipDragEnd`**

In `_onEquipDragEnd`, after `label.destroy()`, add:

```ts
this.equipDrag.ghostImage?.destroy()
```

Then set `this.equipDrag = null` as before.

- [ ] **Step 6: Verify build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 7: Run all tests**

```bash
npm run test
```

Expected: all tests pass (no regressions).

- [ ] **Step 8: Verify visually**

Run `npm run dev` and open the Merchant shop. You should see:
- Equipment slots row bottom-aligned with new proportional sizes (weapon/armor are tall, accessory short)
- Equipped items show pixel art + name in their slot
- Dragging from an equipment slot to backpack shows the pixel art ghost
- Buying and selling still works correctly

- [ ] **Step 9: Commit**

```bash
git add src/scenes/ShopScene.ts
git commit -m "feat: ShopScene proportional equipment slots with pixel art"
```
