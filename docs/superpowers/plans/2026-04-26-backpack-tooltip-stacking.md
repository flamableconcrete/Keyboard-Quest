# Backpack Tooltip, Stacking & Bug Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the drag-duplication ghost bug, add a hover tooltip card to all inventory items, enable consumable stacking up to 99×, and remove always-visible name labels from grid cells and equipment slots.

**Architecture:** A new `ItemTooltipCard` component (created per-scene, shared across all items) is threaded into `GridPanel` and `drawEquipSlotBox` via options. Consumable stacking lives entirely in `InventoryController` — `BackpackGrid` is unchanged. The duplication bug is a one-line guard in `GridPanel._onDragEnd`.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/ItemTooltipCard.ts` | **Create** | Cursor-following item detail card |
| `src/components/GridPanel.ts` | **Modify** | Bug fix; remove name label; add tooltip + quantity badge hookup |
| `src/utils/equipSlot.ts` | **Modify** | Remove item name; add tooltip hookup |
| `src/controllers/InventoryController.ts` | **Modify** | Consumable stacking logic + `getQuantity` |
| `src/controllers/InventoryController.test.ts` | **Modify** | Tests for stacking |
| `src/types/index.ts` | **Modify** | Add `quantity?: number` to `backpackPlacements` entry |
| `src/scenes/CharacterScene.ts` | **Modify** | Instantiate tooltip; thread into GridPanel + equipSlot |
| `src/scenes/ShopScene.ts` | **Modify** | Instantiate tooltip with `showGoldCost`; thread into panels + equipSlot |

---

## Task 1: Fix drag duplication bug in GridPanel

**Files:**
- Modify: `src/components/GridPanel.ts`

**Root cause:** After `_onItemDropCb` fires, `CharacterScene.drawActiveTab()` destroys this panel and creates a new one. The old panel's `_onDragEnd` then calls `_redraw()`, creating orphan objects that are never cleaned up.

- [ ] **Step 1: Add `_destroyed` flag**

  In `src/components/GridPanel.ts`, add the private field and set it in `destroy()`:

  ```ts
  // Add after the existing private fields (around line 54):
  private _destroyed = false
  ```

  In `destroy()`, add `this._destroyed = true` as the first line of the method body:

  ```ts
  destroy(): void {
    this._destroyed = true   // ← add this
    this.objects.forEach(o => o.destroy())
    this.objects = []
    this.overlay.destroy()
    if (this._dragging) {
      this._dragging.ghost.destroy()
      this._dragging.ghostLabel.destroy()
      this._dragging.ghostImage?.destroy()
      this.scene.input.off('pointermove', this._boundDragMove)
      this.scene.input.off('pointerup',   this._boundDragEnd)
      this._dragging = null
    }
    if (this._pendingDrag) {
      this.scene.input.off('pointermove', this._checkDragThreshold, this)
      this.scene.input.off('pointerup',   this._clearPendingDrag,   this)
      this._pendingDrag   = null
      this._pointerDownAt = null
    }
  }
  ```

- [ ] **Step 2: Guard `_redraw()` in `_onDragEnd`**

  At the very end of `_onDragEnd`, replace the unconditional `this._redraw()` call:

  ```ts
  // Replace:
  this._redraw()

  // With:
  if (!this._destroyed) this._redraw()
  ```

- [ ] **Step 3: Verify the game still runs**

  ```bash
  npm run dev
  ```

  Open the Character screen, drag an item to a new cell, confirm no duplicate ghost remains after releasing. Leave and re-enter to confirm save is correct.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/GridPanel.ts
  git commit -m "fix: guard GridPanel._redraw after drop destroys panel"
  ```

---

## Task 2: Add `quantity` to types + consumable stacking in InventoryController

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/controllers/InventoryController.ts`
- Modify: `src/controllers/InventoryController.test.ts`

- [ ] **Step 1: Update `backpackPlacements` type in `src/types/index.ts`**

  Find the `backpackPlacements` field in `ProfileData` (line ~61) and add `quantity?`:

  ```ts
  backpackPlacements: { itemId: string; x: number; y: number; quantity?: number }[]
  ```

- [ ] **Step 2: Write failing tests**

  Append the following `describe` block to `src/controllers/InventoryController.test.ts`:

  ```ts
  describe('InventoryController — consumable stacking', () => {
    const consumableProfile = () => ({
      equipment: { weapon: null, armor: null, accessory: null, trophy: null },
      ownedItemIds: [],
      backpackPlacements: [{ itemId: 'swift_tonic', x: 0, y: 0 }],
      selectedConsumables: [],
      previewShopItemIds: [],
      gold: 0,
    } as unknown as ProfileData)

    it('addToBackpack increments quantity for a consumable already in backpack', () => {
      const profile = consumableProfile()
      const ctrl = new InventoryController(profile)
      const result = ctrl.addToBackpack('swift_tonic')
      expect(result).toBe(true)
      expect(ctrl.getQuantity('swift_tonic')).toBe(2)
      expect(ctrl.backpackGrid.getPlacements()).toHaveLength(1)
    })

    it('addToBackpack returns false when consumable stack is at 99', () => {
      const profile = {
        ...consumableProfile(),
        backpackPlacements: [{ itemId: 'swift_tonic', x: 0, y: 0, quantity: 99 }],
      } as unknown as ProfileData
      const ctrl = new InventoryController(profile)
      const result = ctrl.addToBackpack('swift_tonic')
      expect(result).toBe(false)
      expect(ctrl.getQuantity('swift_tonic')).toBe(99)
    })

    it('removeFromBackpack decrements quantity for a consumable with quantity > 1', () => {
      const profile = {
        ...consumableProfile(),
        backpackPlacements: [{ itemId: 'swift_tonic', x: 0, y: 0, quantity: 3 }],
      } as unknown as ProfileData
      const ctrl = new InventoryController(profile)
      ctrl.removeFromBackpack('swift_tonic')
      expect(ctrl.getQuantity('swift_tonic')).toBe(2)
      expect(ctrl.backpackGrid.hasItem('swift_tonic')).toBe(true)
    })

    it('removeFromBackpack fully removes consumable when quantity reaches 0', () => {
      const profile = consumableProfile()
      const ctrl = new InventoryController(profile)
      ctrl.removeFromBackpack('swift_tonic')
      expect(ctrl.backpackGrid.hasItem('swift_tonic')).toBe(false)
    })

    it('getQuantity returns 1 for non-stacked items', () => {
      const ctrl = new InventoryController(mockProfile)
      expect(ctrl.getQuantity('rusty_quill')).toBe(1)
    })

    it('quantity persists to profile.backpackPlacements', () => {
      const profile = consumableProfile()
      const ctrl = new InventoryController(profile)
      ctrl.addToBackpack('swift_tonic')
      const p = profile.backpackPlacements.find(p => p.itemId === 'swift_tonic')
      expect(p?.quantity).toBe(2)
    })

    it('non-consumable addToBackpack does not create duplicate placement', () => {
      const ctrl = new InventoryController(mockProfile)
      const result = ctrl.addToBackpack('rusty_quill')
      expect(result).toBe(true)
      expect(ctrl.backpackGrid.getPlacements().filter(p => p.itemId === 'rusty_quill')).toHaveLength(1)
    })
  })
  ```

- [ ] **Step 3: Run tests — verify they fail**

  ```bash
  npx vitest run src/controllers/InventoryController.test.ts
  ```

  Expected: several failures including `ctrl.getQuantity is not a function`.

- [ ] **Step 4: Implement stacking in `InventoryController`**

  In `src/controllers/InventoryController.ts`:

  **Add private field** after `private _grid: BackpackGrid`:
  ```ts
  private _quantities: Map<string, number> = new Map()
  ```

  **In the constructor**, load quantities from stored placements. Insert this block right after the `this._grid = new BackpackGrid(...)` line (before the `needsMigration` check):

  ```ts
  // Load consumable quantities from saved placements
  storedPlacements.forEach(p => {
    if (p.quantity && p.quantity > 1) this._quantities.set(p.itemId, p.quantity)
  })
  ```

  **Replace `addToBackpack`** with:

  ```ts
  addToBackpack(itemId: string): boolean {
    const item = getItem(itemId)
    if (!item) return false

    // Consumable stacking: increment quantity instead of placing a new cell
    if (item.slot === 'consumable' && this._grid.hasItem(itemId)) {
      const qty = this._quantities.get(itemId) ?? 1
      if (qty >= 99) return false
      this._quantities.set(itemId, qty + 1)
      this._syncBackpackPlacements()
      return true
    }

    if (this._grid.hasItem(itemId)) return true  // already placed (non-consumable)
    const { w, h } = item.gridSize
    const pos = this._grid.findSpace(w, h)
    if (!pos) return false
    this._grid = this._grid.place(itemId, pos.x, pos.y, w, h)
    this._syncBackpackPlacements()
    return true
  }
  ```

  **Replace `removeFromBackpack`** with:

  ```ts
  removeFromBackpack(itemId: string): void {
    const item = getItem(itemId)
    if (item?.slot === 'consumable') {
      const qty = this._quantities.get(itemId) ?? 1
      if (qty > 1) {
        this._quantities.set(itemId, qty - 1)
        this._syncBackpackPlacements()
        return
      }
      this._quantities.delete(itemId)
    }
    this._grid = this._grid.remove(itemId)
    this._syncBackpackPlacements()
  }
  ```

  **Add `getQuantity` method** (insert after `removeFromBackpack`):

  ```ts
  getQuantity(itemId: string): number {
    return this._quantities.get(itemId) ?? 1
  }
  ```

  **Replace `_syncBackpackPlacements`** with:

  ```ts
  private _syncBackpackPlacements(): void {
    this.profile.backpackPlacements = this._grid.getPlacements().map(({ itemId, x, y }) => {
      const quantity = this._quantities.get(itemId)
      return quantity && quantity > 1 ? { itemId, x, y, quantity } : { itemId, x, y }
    })
  }
  ```

- [ ] **Step 5: Run tests — verify they pass**

  ```bash
  npx vitest run src/controllers/InventoryController.test.ts
  ```

  Expected: all tests pass.

- [ ] **Step 6: Commit**

  ```bash
  git add src/types/index.ts src/controllers/InventoryController.ts src/controllers/InventoryController.test.ts
  git commit -m "feat: consumable stacking up to 99x in InventoryController"
  ```

---

## Task 3: Create `ItemTooltipCard` component

**Files:**
- Create: `src/components/ItemTooltipCard.ts`

- [ ] **Step 1: Create the file**

  Create `src/components/ItemTooltipCard.ts` with the following content:

  ```ts
  import Phaser from 'phaser'
  import { ItemData } from '../types'
  import { getItemColor } from '../data/items'

  export interface ItemTooltipOptions {
    showGoldCost?: boolean
  }

  export class ItemTooltipCard {
    private readonly container: Phaser.GameObjects.Container
    private readonly bg: Phaser.GameObjects.Rectangle
    private texts: Phaser.GameObjects.Text[] = []

    constructor(
      private readonly scene: Phaser.Scene,
      private readonly options: ItemTooltipOptions = {}
    ) {
      this.container = scene.add.container(0, 0).setDepth(200).setVisible(false)
      this.bg = scene.add.rectangle(0, 0, 200, 40, 0x0a0a1a, 0.95)
        .setStrokeStyle(1, 0x555577)
        .setOrigin(0, 0)
      this.container.add(this.bg)
    }

    show(item: ItemData, x: number, y: number): void {
      this.texts.forEach(t => t.destroy())
      this.texts = []

      const PAD = 8
      const WIDTH = 190
      let yOff = PAD

      const addLine = (text: string, color: string, size: string) => {
        const t = this.scene.add.text(PAD, yOff, text, {
          fontSize: size,
          color,
          wordWrap: { width: WIDTH - PAD * 2 },
          fontFamily: 'monospace',
        })
        this.texts.push(t)
        this.container.add(t)
        yOff += t.height + 3
      }

      // Name in rarity color
      addLine(item.name, getItemColor(item.rarity), '13px')
      // Slot · rarity
      const slotLabel = item.slot.charAt(0).toUpperCase() + item.slot.slice(1)
      addLine(`${slotLabel} · ${item.rarity}`, '#888899', '10px')
      // Separator gap
      yOff += 2
      // Description
      addLine(item.description, '#cccccc', '10px')
      // Separator gap
      yOff += 2
      // Effects
      this._formatEffects(item).forEach(line => addLine(line, '#aaffaa', '10px'))
      // Gold cost (optional)
      if (this.options.showGoldCost) {
        yOff += 2
        addLine(`Cost: ${item.goldCost}g`, '#ffd700', '10px')
      }

      this.bg.setSize(WIDTH, yOff + PAD)
      this.container.setVisible(true)
      this._position(x, y)
    }

    move(x: number, y: number): void {
      if (this.container.visible) this._position(x, y)
    }

    hide(): void {
      this.container.setVisible(false)
    }

    destroy(): void {
      this.texts.forEach(t => t.destroy())
      this.container.destroy()
    }

    private _position(x: number, y: number): void {
      const { width, height } = this.scene.scale
      const W = this.bg.width
      const H = this.bg.height
      const OFFSET = 14
      let cx = x + OFFSET
      let cy = y + OFFSET
      if (cx + W > width - 4)  cx = x - W - OFFSET
      if (cy + H > height - 4) cy = y - H - OFFSET
      this.container.setPosition(cx, cy)
    }

    private _formatEffects(item: ItemData): string[] {
      const e = item.effect
      const out: string[] = []
      if (e.power)                          out.push(`+${e.power} Power`)
      if (e.hp)                             out.push(`+${e.hp} HP`)
      if (e.focusBonus)                     out.push(`+${e.focusBonus} Focus`)
      if (e.goldMultiplier)                 out.push(`+${Math.round(e.goldMultiplier * 100)}% Gold Multiplier`)
      if (e.bonusGoldChance)                out.push(`+${Math.round(e.bonusGoldChance * 100)}% Bonus Gold Chance`)
      if (e.defeatAdditionalEnemiesChance)  out.push(`+${Math.round(e.defeatAdditionalEnemiesChance * 100)}% Multi-Kill Chance`)
      if (e.absorbAttacksChance)            out.push(`+${Math.round(e.absorbAttacksChance * 100)}% Block Chance`)
      if (e.extraTime)                      out.push(`+${e.extraTime}s Extra Time`)
      if (e.ignoreFirstWrong)               out.push('Forgive First Wrong Key')
      if (e.goldDouble)                     out.push('2× Gold This Level')
      return out
    }
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  ```bash
  npm run build
  ```

  Expected: no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/ItemTooltipCard.ts
  git commit -m "feat: ItemTooltipCard cursor-following hover component"
  ```

---

## Task 4: Update GridPanel — remove name label, add quantity badge + tooltip hookup

**Files:**
- Modify: `src/components/GridPanel.ts`

- [ ] **Step 1: Add tooltip and getQuantity to `GridPanelRenderOptions`**

  Add an import at the top of `GridPanel.ts`:

  ```ts
  import { ItemTooltipCard } from './ItemTooltipCard'
  ```

  In the `GridPanelRenderOptions` interface, add two optional fields:

  ```ts
  export interface GridPanelRenderOptions {
    draggable?: boolean
    clickToSelect?: boolean
    grid?: BackpackGrid
    /** Tooltip card instance to show on item hover. Created by the scene. */
    tooltip?: ItemTooltipCard
    /** Returns the stack count for an itemId. Used to render a quantity badge. */
    getQuantity?: (itemId: string) => number
  }
  ```

- [ ] **Step 2: Rewrite `_drawItem` to remove name label and add badge + tooltip**

  Replace the entire `_drawItem` method with:

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

    // Quantity badge (consumable stacks > 1)
    const qty = this._options.getQuantity?.(itemId) ?? 1
    if (qty > 1) {
      const badgeText = this.scene.add.text(
        px + w * S - 3,
        py + h * S - 3,
        `x${qty}`,
        { fontSize: '9px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'monospace',
          backgroundColor: '#000000bb', padding: { x: 2, y: 1 } }
      ).setOrigin(1, 1).setDepth(13)
      this.objects.push(badgeText)
    }

    // Tooltip hookup
    const { draggable, clickToSelect, tooltip } = this._options
    if (tooltip) {
      bg.on('pointerover', (pointer: Phaser.Input.Pointer) => tooltip.show(item, pointer.x, pointer.y))
      bg.on('pointermove', (pointer: Phaser.Input.Pointer) => tooltip.move(pointer.x, pointer.y))
      bg.on('pointerout',  () => tooltip.hide())
    }

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

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npm run build
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/GridPanel.ts
  git commit -m "feat: GridPanel — remove name label, add quantity badge and tooltip hookup"
  ```

---

## Task 5: Remove item name from `drawEquipSlotBox` and add tooltip hookup

**Files:**
- Modify: `src/utils/equipSlot.ts`

- [ ] **Step 1: Add tooltip import and option**

  Add import at the top of `src/utils/equipSlot.ts`:

  ```ts
  import { ItemTooltipCard } from '../components/ItemTooltipCard'
  ```

  Add `tooltip?: ItemTooltipCard` to the `options` parameter of `drawEquipSlotBox`:

  ```ts
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
      tooltip?: ItemTooltipCard
    } = {}
  ): Phaser.GameObjects.GameObject[] {
  ```

- [ ] **Step 2: Remove item name label and add tooltip hookup in the `if (item)` branch**

  The current `if (item)` branch includes a slot-type label at the top and item name at the bottom. **Remove only the item name text** (the `scene.add.text` at `y + h - 4`). Keep the slot-type label.

  After removing the name, add tooltip hookup to `bg`. The updated `if (item)` branch should be:

  ```ts
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

    // Slot-type label (top) — retained
    out.push(
      scene.add.text(cx, y + 4, slotLabel, { fontSize: '8px', color: '#888888' })
        .setOrigin(0.5, 0).setDepth(7)
    )

    // Item name label (bottom) — REMOVED

    if (options.onDragStart) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', options.onDragStart)
    }

    if (options.onDrop) {
      if (!bg.input) bg.setInteractive({ useHandCursor: true })
      bg.on('pointerup', options.onDrop)
    }

    // Tooltip hookup
    if (options.tooltip) {
      if (!bg.input) bg.setInteractive({ useHandCursor: true })
      const tooltip = options.tooltip
      bg.on('pointerover', (pointer: Phaser.Input.Pointer) => tooltip.show(item, pointer.x, pointer.y))
      bg.on('pointermove', (pointer: Phaser.Input.Pointer) => tooltip.move(pointer.x, pointer.y))
      bg.on('pointerout',  () => tooltip.hide())
    }

    if (options.onUnequip) {
      const btn = scene.add.text(x + w - 2, y + 2, 'X', {
        fontSize: '11px', color: '#ff4444', fontStyle: 'bold',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(8)
      btn.on('pointerdown', options.onUnequip)
      out.push(btn)
    }
  }
  ```

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  npm run build
  ```

  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/utils/equipSlot.ts
  git commit -m "feat: equipSlot — remove item name label, add tooltip hookup"
  ```

---

## Task 6: Wire tooltip into CharacterScene

**Files:**
- Modify: `src/scenes/CharacterScene.ts`

- [ ] **Step 1: Import `ItemTooltipCard` and add instance field**

  Add import at the top:

  ```ts
  import { ItemTooltipCard } from '../components/ItemTooltipCard'
  ```

  Add a private field inside the class (after `private backpackPanel`):

  ```ts
  private tooltip!: ItemTooltipCard
  ```

- [ ] **Step 2: Instantiate tooltip in `create()` and register shutdown cleanup**

  In `create()`, add these two lines right after `generateAllItemTextures(this)`:

  ```ts
  this.tooltip = new ItemTooltipCard(this)
  this.events.once('shutdown', () => this.tooltip.destroy())
  ```

- [ ] **Step 3: Pass tooltip to `backpackPanel.render()`**

  In `drawInventoryTab`, find the `this.backpackPanel.render(...)` call and add `tooltip` and `getQuantity` to the options:

  ```ts
  this.backpackPanel
    .onItemDrop((itemId, col, row) => {
      const moved = this.inventoryController.moveInBackpack(itemId, col, row)
      if (moved) saveProfile(this.profileSlot, this.profile)
      this.drawActiveTab()
    })
    .render(
      this.inventoryController.backpackGrid.getPlacements(),
      {
        draggable: true,
        grid: this.inventoryController.backpackGrid,
        tooltip: this.tooltip,
        getQuantity: (id) => this.inventoryController.getQuantity(id),
      }
    )
  ```

- [ ] **Step 4: Pass tooltip to each `drawEquipSlotBox` call**

  In `drawInventoryTab`, each of the four equipment slot calls passes an options object. Add `tooltip: this.tooltip` to each one. The full loop becomes:

  ```ts
  for (const { slot, x, y } of slotConfigs) {
    const itemId = this.profile.equipment[slot]
    const item = itemId ? (getItem(itemId) ?? null) : null
    const objs = drawEquipSlotBox(this, x, y, slot, item, {
      tooltip: this.tooltip,
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
  ```

- [ ] **Step 5: Verify TypeScript compiles**

  ```bash
  npm run build
  ```

  Expected: no errors.

- [ ] **Step 6: Smoke-test in browser**

  ```bash
  npm run dev
  ```

  Open Character screen → Inventory tab:
  - Hover over a backpack item: tooltip appears instantly with name, slot·rarity, description, and effects.
  - Move cursor: tooltip follows.
  - Move cursor off item: tooltip disappears.
  - Hover over an equipped item in a slot: tooltip appears with same info.
  - No item name text visible on grid cells or equipment slots when not hovering.

- [ ] **Step 7: Commit**

  ```bash
  git add src/scenes/CharacterScene.ts
  git commit -m "feat: CharacterScene — wire ItemTooltipCard into inventory and equip slots"
  ```

---

## Task 7: Wire tooltip into ShopScene

**Files:**
- Modify: `src/scenes/ShopScene.ts`

- [ ] **Step 1: Import `ItemTooltipCard` and add instance field**

  Add import at the top:

  ```ts
  import { ItemTooltipCard } from '../components/ItemTooltipCard'
  ```

  Add a private field (after `private equipDrag`):

  ```ts
  private tooltip!: ItemTooltipCard
  ```

- [ ] **Step 2: Instantiate tooltip in `create()` and register shutdown cleanup**

  In `create()`, add these two lines right after `generateAllItemTextures(this)`:

  ```ts
  this.tooltip = new ItemTooltipCard(this, { showGoldCost: true })
  this.events.once('shutdown', () => this.tooltip.destroy())
  ```

- [ ] **Step 3: Add tooltip to merchant panel render**

  Find the `this.merchantPanel.render(this.merchantPlacements)` call and add the tooltip option:

  ```ts
  this.merchantPanel
    .onItemClick(itemId => { /* unchanged */ })
    .render(this.merchantPlacements, { tooltip: this.tooltip })
  ```

- [ ] **Step 4: Add tooltip to backpack panel render**

  There are two `.render(...)` calls for `backpackPanel`: the initial one in `create()` and the one inside `onItemDrop`. Update both to include `tooltip` and `getQuantity`:

  ```ts
  this.backpackPanel
    .onItemClick(itemId => { /* unchanged */ })
    .onItemDrop((itemId, col, row) => {
      const moved = this.inventoryController.moveInBackpack(itemId, col, row)
      if (moved) saveProfile(this.profileSlot, this.profile)
      this.backpackPanel.render(
        this.inventoryController.backpackGrid.getPlacements(),
        {
          draggable: true,
          clickToSelect: true,
          grid: this.inventoryController.backpackGrid,
          tooltip: this.tooltip,
          getQuantity: (id) => this.inventoryController.getQuantity(id),
        }
      )
    })
    .render(
      this.inventoryController.backpackGrid.getPlacements(),
      {
        draggable: true,
        clickToSelect: true,
        grid: this.inventoryController.backpackGrid,
        tooltip: this.tooltip,
        getQuantity: (id) => this.inventoryController.getQuantity(id),
      }
    )
  ```

- [ ] **Step 5: Add tooltip to equipment slots in `_drawEquipSlots`**

  In `_drawEquipSlots`, add `tooltip: this.tooltip` to the `drawEquipSlotBox` options:

  ```ts
  drawEquipSlotBox(this, curX, slotY, slot, item, {
    tooltip: this.tooltip,
    onDragStart: item ? () => this._startEquipDrag(item.id, slot, item) : undefined,
  })
  ```

- [ ] **Step 6: Verify TypeScript compiles**

  ```bash
  npm run build
  ```

  Expected: no errors.

- [ ] **Step 7: Smoke-test in browser**

  Open the Shop screen:
  - Hover over a merchant item: tooltip appears with name, slot·rarity, description, effects, and gold cost line.
  - Hover over a backpack item: tooltip appears with gold cost shown.
  - Hover over an equipped item: tooltip appears with gold cost shown.
  - Buy a consumable (e.g. Swift Tonic) twice: the backpack shows one grid cell with an `x2` badge instead of two cells.

- [ ] **Step 8: Commit**

  ```bash
  git add src/scenes/ShopScene.ts
  git commit -m "feat: ShopScene — wire ItemTooltipCard with gold cost into all panels"
  ```

---

## Final verification

- [ ] **Run the full test suite**

  ```bash
  npm run test
  ```

  Expected: all tests pass.

- [ ] **Run TypeScript build**

  ```bash
  npm run build
  ```

  Expected: no errors.
