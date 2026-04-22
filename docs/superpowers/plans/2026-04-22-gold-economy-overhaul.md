# Gold Economy Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full gold economy overhaul from issue #96: logarithmic item pricing, world-gated shop with next-tier previews, 4×10 Diablo-style drag-and-drop backpack grid, sell-back mechanic, and single-use consumables with pre-level selection.

**Architecture:** A new `BackpackGrid` class provides immutable pure-logic grid operations (placement, collision, auto-arrangement). `InventoryController` wraps it and exposes `addToBackpack`, `removeFromBackpack`, `moveInBackpack`, `sell`, and a computed `ownedItemIds` getter. `ProfileData` gains `backpackPlacements` and `selectedConsumables`; `CharacterScene`'s inventory tab is replaced with a full drag-and-drop grid UI; `ShopScene`, `LevelResultScene`, `BaseLevelScene`, and `LevelIntroScene` are updated for gold scaling, world gating, and consumable flow.

**Tech Stack:** Phaser 3, TypeScript, Vitest, Vite. All tests run with `npx vitest run <file>`. Build/type-check with `npm run build`.

---

## File Structure

**Create:**
- `src/controllers/BackpackGrid.ts` — immutable 4×10 grid: placement, collision, removal, auto-arrange
- `src/controllers/BackpackGrid.test.ts` — unit tests for all grid logic

**Modify:**
- `src/types/index.ts` — add `gridSize`, `worldUnlock`, `'consumable'` slot, `backpackPlacements`, `selectedConsumables`, `previewShopItemIds` to `ProfileData`; consumable effect fields to `ItemData`
- `src/data/items.ts` — add `gridSize`/`worldUnlock` to all items, reprice everything, add 4 consumable items
- `src/controllers/InventoryController.ts` — integrate BackpackGrid; add `addToBackpack`, `removeFromBackpack`, `moveInBackpack`, `sell`, `ownedItemIds` getter, `migrateFromOwnedItemIds`
- `src/utils/profile.ts` — migration: old `ownedItemIds` → `backpackPlacements` on load
- `src/utils/shop.ts` — add `playerWorld` param, world-gated filtering, next-tier preview, consumable restocking helpers
- `src/scenes/ShopScene.ts` — world gating, preview section, consumable column, sell-back now via InventoryController
- `src/scenes/LevelResultScene.ts` — gold scaling by world, consume selectedConsumables, gold_fever doubling
- `src/scenes/BaseLevelScene.ts` — compute `consumableBonuses` from selectedConsumables in `preCreate()`; apply time/wrong-key/power bonuses
- `src/scenes/LevelIntroScene.ts` — add consumable selection screen before `enter()` when player has consumables
- `src/scenes/CharacterScene.ts` — replace `drawInventoryTab` with 4×10 drag-and-drop backpack grid + equipment drop zones + sell zone

---

## Task 1: Type Definitions

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update `ItemData` in `src/types/index.ts`**

Replace the existing `ItemData` interface with:

```ts
export interface ItemData {
  id: string
  name: string
  slot: 'weapon' | 'armor' | 'accessory' | 'trophy' | 'consumable'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'
  description: string
  goldCost: number
  worldUnlock: 1 | 2 | 3 | 4 | 5
  gridSize: { w: number; h: number }
  effect: {
    hp?: number
    power?: number
    focusBonus?: number
    goldMultiplier?: number
    defeatAdditionalEnemiesChance?: number
    absorbAttacksChance?: number
    bonusGoldChance?: number
    // consumable-specific effects
    extraTime?: number       // swift_tonic: seconds added to time limit
    ignoreFirstWrong?: boolean  // iron_will: first wrong key press forgiven
    goldDouble?: boolean     // gold_fever: double gold earned this run
  }
}
```

- [ ] **Step 2: Update `ProfileData` in `src/types/index.ts`**

Add three new fields and mark `ownedItemIds` as optional (deprecated — kept for migration):

```ts
export interface ProfileData {
  // ... all existing fields ...
  ownedItemIds: string[]           // DEPRECATED: migrated to backpackPlacements on load
  backpackPlacements: { itemId: string; x: number; y: number }[]
  selectedConsumables: string[]    // up to 2 consumable IDs chosen before a level
  previewShopItemIds: string[]     // 1-2 next-tier preview items; reshuffled on boss defeat
  // ... rest of existing fields unchanged ...
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: TypeScript errors about missing `gridSize`/`worldUnlock` in `items.ts` — that is correct and expected at this stage. Fix any unexpected errors only.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add gridSize, worldUnlock, backpackPlacements, consumable types"
```

---

## Task 2: BackpackGrid — Tests + Implementation

**Files:**
- Create: `src/controllers/BackpackGrid.ts`
- Create: `src/controllers/BackpackGrid.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/controllers/BackpackGrid.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { BackpackGrid, GRID_COLS, GRID_ROWS } from './BackpackGrid'

describe('BackpackGrid', () => {
  describe('constants', () => {
    it('has 4 columns and 10 rows', () => {
      expect(GRID_COLS).toBe(4)
      expect(GRID_ROWS).toBe(10)
    })
  })

  describe('canPlace', () => {
    it('allows placing a 1x1 in an empty grid at (0,0)', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(0, 0, 1, 1)).toBe(true)
    })

    it('allows placing a 2x3 item in empty grid at (1,2)', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(1, 2, 2, 3)).toBe(true)
    })

    it('rejects placement when item extends past right edge', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(3, 0, 2, 1)).toBe(false) // col 3+2=5 > GRID_COLS=4
    })

    it('rejects placement when item extends past bottom edge', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(0, 9, 1, 2)).toBe(false) // row 9+2=11 > GRID_ROWS=10
    })

    it('rejects placement overlapping an existing item', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 1, y: 1, w: 2, h: 3 }])
      expect(grid.canPlace(2, 3, 1, 1)).toBe(false)
    })

    it('allows placement adjacent to an existing item', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 2, h: 2 }])
      expect(grid.canPlace(2, 0, 2, 2)).toBe(true)
    })

    it('excludes a named item from collision check (for move validation)', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 2, h: 2 }])
      expect(grid.canPlace(0, 0, 2, 2, 'sword')).toBe(true)
    })

    it('still blocks overlap with other items when excluding one', () => {
      const grid = new BackpackGrid([
        { itemId: 'sword', x: 0, y: 0, w: 2, h: 2 },
        { itemId: 'shield', x: 2, y: 0, w: 2, h: 2 },
      ])
      expect(grid.canPlace(1, 0, 3, 1, 'sword')).toBe(false) // overlaps shield
    })
  })

  describe('findSpace', () => {
    it('returns (0,0) for a 1x1 item in empty grid', () => {
      const grid = new BackpackGrid([])
      expect(grid.findSpace(1, 1)).toEqual({ x: 0, y: 0 })
    })

    it('returns null when no space fits a large item', () => {
      // Fill entire grid with 1x1 items
      const placements: { itemId: string; x: number; y: number; w: number; h: number }[] = []
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          placements.push({ itemId: `i_${col}_${row}`, x: col, y: row, w: 1, h: 1 })
        }
      }
      const grid = new BackpackGrid(placements)
      expect(grid.findSpace(1, 1)).toBeNull()
    })

    it('skips occupied cells scanning left-to-right, top-to-bottom', () => {
      // Block the top row completely
      const placements = [
        { itemId: 'blocker', x: 0, y: 0, w: 4, h: 1 },
      ]
      const grid = new BackpackGrid(placements)
      expect(grid.findSpace(1, 1)).toEqual({ x: 0, y: 1 })
    })

    it('returns null for an item that is too wide for any row', () => {
      const grid = new BackpackGrid([])
      expect(grid.findSpace(5, 1)).toBeNull() // 5 > GRID_COLS
    })
  })

  describe('place', () => {
    it('returns a new grid with the item added', () => {
      const grid = new BackpackGrid([])
      const next = grid.place('dagger', 0, 0, 1, 2)
      expect(next.getPlacements()).toHaveLength(1)
      expect(next.getPlacements()[0]).toMatchObject({ itemId: 'dagger', x: 0, y: 0, w: 1, h: 2 })
    })

    it('is immutable — original grid is unchanged', () => {
      const grid = new BackpackGrid([])
      grid.place('dagger', 0, 0, 1, 2)
      expect(grid.getPlacements()).toHaveLength(0)
    })

    it('preserves existing items when adding a new one', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      const next = grid.place('coin', 1, 0, 1, 1)
      expect(next.getPlacements()).toHaveLength(2)
    })
  })

  describe('remove', () => {
    it('returns a new grid without the specified item', () => {
      const grid = new BackpackGrid([
        { itemId: 'sword', x: 0, y: 0, w: 1, h: 3 },
        { itemId: 'coin', x: 1, y: 0, w: 1, h: 1 },
      ])
      const next = grid.remove('sword')
      expect(next.getPlacements()).toHaveLength(1)
      expect(next.getPlacements()[0].itemId).toBe('coin')
    })

    it('is immutable — original grid is unchanged', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      grid.remove('sword')
      expect(grid.getPlacements()).toHaveLength(1)
    })

    it('is a no-op if item is not in the grid', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      const next = grid.remove('nonexistent')
      expect(next.getPlacements()).toHaveLength(1)
    })
  })

  describe('hasItem', () => {
    it('returns true when item is in grid', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      expect(grid.hasItem('sword')).toBe(true)
    })

    it('returns false when item is not in grid', () => {
      const grid = new BackpackGrid([])
      expect(grid.hasItem('sword')).toBe(false)
    })
  })

  describe('autoArrange', () => {
    it('places single item at (0,0)', () => {
      const result = BackpackGrid.autoArrange([{ itemId: 'dagger', w: 1, h: 2 }])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ itemId: 'dagger', x: 0, y: 0 })
    })

    it('places items left-to-right in the same row when they fit', () => {
      const result = BackpackGrid.autoArrange([
        { itemId: 'a', w: 1, h: 1 },
        { itemId: 'b', w: 1, h: 1 },
        { itemId: 'c', w: 1, h: 1 },
        { itemId: 'd', w: 1, h: 1 },
      ])
      expect(result[0]).toMatchObject({ itemId: 'a', x: 0, y: 0 })
      expect(result[1]).toMatchObject({ itemId: 'b', x: 1, y: 0 })
      expect(result[2]).toMatchObject({ itemId: 'c', x: 2, y: 0 })
      expect(result[3]).toMatchObject({ itemId: 'd', x: 3, y: 0 })
    })

    it('wraps to next row when item does not fit in current row', () => {
      const result = BackpackGrid.autoArrange([
        { itemId: 'wide', w: 3, h: 1 },   // takes cols 0-2
        { itemId: 'big', w: 3, h: 1 },    // does not fit in remaining col 3; goes to row 1
      ])
      expect(result[0]).toMatchObject({ itemId: 'wide', x: 0, y: 0 })
      expect(result[1]).toMatchObject({ itemId: 'big', x: 0, y: 1 })
    })

    it('skips items that cannot fit anywhere and returns what it can place', () => {
      // Item too wide to ever fit
      const result = BackpackGrid.autoArrange([
        { itemId: 'normal', w: 1, h: 1 },
        { itemId: 'too_wide', w: 5, h: 1 },
      ])
      expect(result.find(p => p.itemId === 'normal')).toBeDefined()
      expect(result.find(p => p.itemId === 'too_wide')).toBeUndefined()
    })
  })
})
```

- [ ] **Step 2: Run tests to confirm they all fail**

```bash
npx vitest run src/controllers/BackpackGrid.test.ts
```

Expected: all tests fail with "Cannot find module './BackpackGrid'".

- [ ] **Step 3: Implement `src/controllers/BackpackGrid.ts`**

```ts
export const GRID_COLS = 4
export const GRID_ROWS = 10

export interface GridPlacement {
  itemId: string
  x: number
  y: number
  w: number
  h: number
}

export class BackpackGrid {
  private readonly _placements: GridPlacement[]

  constructor(placements: GridPlacement[]) {
    this._placements = [...placements]
  }

  getPlacements(): GridPlacement[] {
    return [...this._placements]
  }

  hasItem(itemId: string): boolean {
    return this._placements.some(p => p.itemId === itemId)
  }

  /**
   * Returns true if an item of size (w, h) can be placed at (x, y).
   * Optionally excludes one item from collision (for move validation).
   */
  canPlace(x: number, y: number, w: number, h: number, excludeItemId?: string): boolean {
    if (x < 0 || y < 0) return false
    if (x + w > GRID_COLS) return false
    if (y + h > GRID_ROWS) return false

    for (const p of this._placements) {
      if (p.itemId === excludeItemId) continue
      // AABB overlap check
      const noOverlap =
        x + w <= p.x ||
        x >= p.x + p.w ||
        y + h <= p.y ||
        y >= p.y + p.h
      if (!noOverlap) return false
    }
    return true
  }

  /**
   * Scans top-to-bottom, left-to-right for the first position where the item fits.
   * Returns null if no space is available.
   */
  findSpace(w: number, h: number): { x: number; y: number } | null {
    if (w > GRID_COLS || h > GRID_ROWS) return null
    for (let row = 0; row <= GRID_ROWS - h; row++) {
      for (let col = 0; col <= GRID_COLS - w; col++) {
        if (this.canPlace(col, row, w, h)) {
          return { x: col, y: row }
        }
      }
    }
    return null
  }

  /** Returns a new BackpackGrid with the item placed at (x, y). Does not validate — call canPlace first. */
  place(itemId: string, x: number, y: number, w: number, h: number): BackpackGrid {
    return new BackpackGrid([...this._placements, { itemId, x, y, w, h }])
  }

  /** Returns a new BackpackGrid with the named item removed. */
  remove(itemId: string): BackpackGrid {
    return new BackpackGrid(this._placements.filter(p => p.itemId !== itemId))
  }

  /**
   * Auto-arranges a list of items into the grid, scanning left-to-right top-to-bottom.
   * Items that cannot fit are skipped. Returns placed items as ProfileData-compatible
   * { itemId, x, y } records (w/h excluded — callers look those up from ITEMS).
   */
  static autoArrange(
    items: { itemId: string; w: number; h: number }[]
  ): { itemId: string; x: number; y: number }[] {
    let grid = new BackpackGrid([])
    const result: { itemId: string; x: number; y: number }[] = []

    for (const item of items) {
      const pos = grid.findSpace(item.w, item.h)
      if (!pos) continue
      grid = grid.place(item.itemId, pos.x, pos.y, item.w, item.h)
      result.push({ itemId: item.itemId, x: pos.x, y: pos.y })
    }

    return result
  }
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npx vitest run src/controllers/BackpackGrid.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/controllers/BackpackGrid.ts src/controllers/BackpackGrid.test.ts
git commit -m "feat: add BackpackGrid pure logic with full test coverage"
```

---

## Task 3: Item Data Updates

**Files:**
- Modify: `src/data/items.ts`

- [ ] **Step 1: Add `gridSize` and `worldUnlock` to every existing item and reprice shop items**

Replace the full contents of `src/data/items.ts`. Every item needs both new fields. Gold costs are repriced on a logarithmic scale (see spec). Items with `goldCost: 0` keep their price but get the new fields.

```ts
import { ItemData } from '../types'

export const ITEMS: ItemData[] = [
  // --- ORIGINAL STARTER ITEMS (goldCost: 0, given as rewards) ---
  {
    id: 'rusty_quill',
    name: 'Rusty Quill',
    slot: 'weapon',
    rarity: 'common',
    description: 'A worn writing quill. Still works.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 1, h: 2 },
    effect: { power: 1 },
  },
  {
    id: 'ink_blotter',
    name: 'Ink Blotter',
    slot: 'armor',
    rarity: 'common',
    description: 'Absorbs minor stains and spells.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 2, h: 1 },
    effect: { hp: 1 },
  },
  {
    id: 'iron_gauntlet',
    name: 'Iron Gauntlet',
    slot: 'armor',
    rarity: 'uncommon',
    description: 'Heavy but protective.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 2, h: 2 },
    effect: { hp: 2 },
  },
  {
    id: 'focus_ring',
    name: 'Focus Ring',
    slot: 'accessory',
    rarity: 'common',
    description: 'Sharpens the mind.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 1, h: 1 },
    effect: { focusBonus: 5 },
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    slot: 'accessory',
    rarity: 'common',
    description: 'Increases gold earned.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 1, h: 1 },
    effect: { goldMultiplier: 0.1 },
  },
  {
    id: 'obsidian_nib',
    name: 'Obsidian Nib',
    slot: 'weapon',
    rarity: 'uncommon',
    description: 'A sharp nib made of volcanic glass.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 1, h: 2 },
    effect: { power: 3 },
  },
  {
    id: 'padded_envelope',
    name: 'Padded Envelope',
    slot: 'armor',
    rarity: 'uncommon',
    description: 'Soft and surprisingly durable.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 2, h: 2 },
    effect: { hp: 3 },
  },
  {
    id: 'scholars_monocle',
    name: 'Scholars Monocle',
    slot: 'accessory',
    rarity: 'uncommon',
    description: 'Better clarity for faster typing.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 1, h: 1 },
    effect: { focusBonus: 10 },
  },

  // --- SHOP WEAPONS ---
  {
    id: 'copper_shortsword',
    name: 'Copper Shortsword',
    slot: 'weapon',
    rarity: 'common',
    description: 'A basic blade. Sometimes cuts through two weak foes.',
    goldCost: 100,
    worldUnlock: 1,
    gridSize: { w: 1, h: 2 },
    effect: { power: 1, defeatAdditionalEnemiesChance: 0.1 },
  },
  {
    id: 'iron_broadsword',
    name: 'Iron Broadsword',
    slot: 'weapon',
    rarity: 'uncommon',
    description: 'Heavy and reliable. Good for crowd control.',
    goldCost: 450,
    worldUnlock: 2,
    gridSize: { w: 1, h: 3 },
    effect: { power: 2, defeatAdditionalEnemiesChance: 0.2 },
  },
  {
    id: 'steel_longsword',
    name: 'Steel Longsword',
    slot: 'weapon',
    rarity: 'rare',
    description: 'A finely crafted longsword. Cuts with precision.',
    goldCost: 1500,
    worldUnlock: 3,
    gridSize: { w: 1, h: 4 },
    effect: { power: 3, defeatAdditionalEnemiesChance: 0.35 },
  },
  {
    id: 'mithril_blade',
    name: 'Mithril Blade',
    slot: 'weapon',
    rarity: 'epic',
    description: 'Light as a feather, sharp as a dragon\'s tooth.',
    goldCost: 3500,
    worldUnlock: 4,
    gridSize: { w: 1, h: 3 },
    effect: { power: 5, defeatAdditionalEnemiesChance: 0.5 },
  },
  {
    id: 'excalibur',
    name: 'Excalibur',
    slot: 'weapon',
    rarity: 'epic',
    description: 'A legendary sword that cleaves through darkness.',
    goldCost: 10000,
    worldUnlock: 5,
    gridSize: { w: 2, h: 4 },
    effect: { power: 8, defeatAdditionalEnemiesChance: 0.75 },
  },

  // --- ARMOR ---
  {
    id: 'leather_tunic',
    name: 'Leather Tunic',
    slot: 'armor',
    rarity: 'common',
    description: 'Stiff leather that might deflect a glancing blow.',
    goldCost: 80,
    worldUnlock: 1,
    gridSize: { w: 2, h: 2 },
    effect: { absorbAttacksChance: 0.1 },
  },
  {
    id: 'chainmail_shirt',
    name: 'Chainmail Shirt',
    slot: 'armor',
    rarity: 'uncommon',
    description: 'Interlocking iron rings protect against slashes.',
    goldCost: 400,
    worldUnlock: 2,
    gridSize: { w: 2, h: 3 },
    effect: { absorbAttacksChance: 0.2 },
  },
  {
    id: 'steel_plate',
    name: 'Steel Plate',
    slot: 'armor',
    rarity: 'rare',
    description: 'Solid steel plating. Slows you down but takes a beating.',
    goldCost: 1200,
    worldUnlock: 3,
    gridSize: { w: 2, h: 4 },
    effect: { absorbAttacksChance: 0.35 },
  },
  {
    id: 'dragon_scale_mail',
    name: 'Dragon Scale Mail',
    slot: 'armor',
    rarity: 'epic',
    description: 'Impenetrable scales from a fallen beast.',
    goldCost: 3000,
    worldUnlock: 4,
    gridSize: { w: 2, h: 3 },
    effect: { absorbAttacksChance: 0.5 },
  },
  {
    id: 'aegis_armor',
    name: 'Aegis Armor',
    slot: 'armor',
    rarity: 'epic',
    description: 'Blessed by the gods to ward off harm.',
    goldCost: 8000,
    worldUnlock: 5,
    gridSize: { w: 2, h: 4 },
    effect: { absorbAttacksChance: 0.75 },
  },

  // --- ACCESSORIES ---
  {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    slot: 'accessory',
    rarity: 'common',
    description: 'A coin that sometimes doubles your earnings.',
    goldCost: 90,
    worldUnlock: 1,
    gridSize: { w: 1, h: 1 },
    effect: { bonusGoldChance: 0.15 },
  },
  {
    id: 'hunters_charm',
    name: 'Hunter\'s Charm',
    slot: 'accessory',
    rarity: 'uncommon',
    description: 'Increases gold earned from enemies.',
    goldCost: 420,
    worldUnlock: 2,
    gridSize: { w: 1, h: 1 },
    effect: { goldMultiplier: 0.15 },
  },
  {
    id: 'golden_idol',
    name: 'Golden Idol',
    slot: 'accessory',
    rarity: 'rare',
    description: 'Attracts wealth to its bearer.',
    goldCost: 1300,
    worldUnlock: 3,
    gridSize: { w: 1, h: 2 },
    effect: { bonusGoldChance: 0.3 },
  },
  {
    id: 'taming_bell',
    name: 'Taming Bell',
    slot: 'accessory',
    rarity: 'epic',
    description: 'Its soothing ring attracts gold.',
    goldCost: 3200,
    worldUnlock: 4,
    gridSize: { w: 1, h: 2 },
    effect: { goldMultiplier: 0.3 },
  },
  {
    id: 'midas_ring',
    name: 'Ring of Midas',
    slot: 'accessory',
    rarity: 'epic',
    description: 'Turns fallen foes into pure gold.',
    goldCost: 4000,
    worldUnlock: 4,
    gridSize: { w: 1, h: 1 },
    effect: { bonusGoldChance: 0.6 },
  },

  // --- MASTERY TROPHIES (auto-awarded for world mastery) ---
  {
    id: 'mastery_speed_boots',
    name: 'Speed Boots',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 1. Sharpens reflexes.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 2, h: 2 },
    effect: { focusBonus: 15 },
  },
  {
    id: 'mastery_arcane_focus',
    name: 'Arcane Focus',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 2. Channels arcane energy.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 1, h: 2 },
    effect: { power: 4 },
  },
  {
    id: 'mastery_shadow_cloak',
    name: 'Shadow Cloak',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 3. Wraps you in shadow.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 2, h: 2 },
    effect: { absorbAttacksChance: 0.4 },
  },
  {
    id: 'mastery_forest_crown',
    name: 'Forest Crown',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 4. Crown of the woodland.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 2, h: 2 },
    effect: { bonusGoldChance: 0.4 },
  },
  {
    id: 'mastery_quill_of_power',
    name: 'Quill of Power',
    slot: 'trophy',
    rarity: 'epic',
    description: 'Awarded for mastering World 5. The mightiest quill.',
    goldCost: 0,
    worldUnlock: 1,
    gridSize: { w: 1, h: 3 },
    effect: { power: 6, focusBonus: 10 },
  },

  // --- CONSUMABLES ---
  {
    id: 'swift_tonic',
    name: 'Swift Tonic',
    slot: 'consumable',
    rarity: 'common',
    description: 'Adds 20 seconds to the level time limit. No effect on untimed levels.',
    goldCost: 80,
    worldUnlock: 1,
    gridSize: { w: 1, h: 1 },
    effect: { extraTime: 20 },
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    slot: 'consumable',
    rarity: 'common',
    description: 'Your first wrong key press this level is forgiven.',
    goldCost: 100,
    worldUnlock: 1,
    gridSize: { w: 1, h: 1 },
    effect: { ignoreFirstWrong: true },
  },
  {
    id: 'gold_fever',
    name: 'Gold Fever',
    slot: 'consumable',
    rarity: 'uncommon',
    description: 'Doubles all gold earned from this level.',
    goldCost: 120,
    worldUnlock: 1,
    gridSize: { w: 1, h: 2 },
    effect: { goldDouble: true },
  },
  {
    id: 'word_of_power',
    name: 'Word of Power',
    slot: 'consumable',
    rarity: 'uncommon',
    description: 'Grants +2 power for this level only.',
    goldCost: 90,
    worldUnlock: 1,
    gridSize: { w: 1, h: 1 },
    effect: { power: 2 },
  },
]

export const MASTERY_ITEMS: Record<number, string> = {
  1: 'mastery_speed_boots',
  2: 'mastery_arcane_focus',
  3: 'mastery_shadow_cloak',
  4: 'mastery_forest_crown',
  5: 'mastery_quill_of_power',
}

export function getItem(id: string): ItemData | undefined {
  return ITEMS.find((i) => i.id === id)
}

export function getItemColor(rarity?: string): string {
  switch (rarity) {
    case 'uncommon':
      return '#1eff00'
    case 'rare':
      return '#0070dd'
    case 'epic':
      return '#a335ee'
    case 'common':
    default:
      return '#ffffff'
  }
}
```

- [ ] **Step 2: Verify build (TypeScript will now complain about usages that pass `ownedItemIds` to shop functions — that's fine)**

```bash
npm run build
```

Expected: errors about `currentShopItemIds` filtering and InventoryController — these will be fixed in later tasks. Ignore them.

- [ ] **Step 3: Commit**

```bash
git add src/data/items.ts
git commit -m "feat: add gridSize, worldUnlock, reprice items, add consumables"
```

---

## Task 4: InventoryController Updates

**Files:**
- Modify: `src/controllers/InventoryController.ts`

- [ ] **Step 1: Rewrite `src/controllers/InventoryController.ts`**

```ts
// src/controllers/InventoryController.ts
// Pure TypeScript — NO Phaser imports.
import { ProfileData } from '../types'
import { getItem } from '../data/items'
import { BackpackGrid, GridPlacement } from './BackpackGrid'

type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'trophy'

export interface EquipmentState {
  weapon: string | null
  armor: string | null
  accessory: string | null
  trophy: string | null
}

export class InventoryController {
  private _equipment: EquipmentState
  private _grid: BackpackGrid

  constructor(private profile: ProfileData) {
    this._equipment = {
      weapon: profile.equipment?.weapon ?? null,
      armor: profile.equipment?.armor ?? null,
      accessory: profile.equipment?.accessory ?? null,
      trophy: profile.equipment?.trophy ?? null,
    }

    const storedPlacements = profile.backpackPlacements ?? []
    this._grid = new BackpackGrid(
      storedPlacements.map(p => {
        const item = getItem(p.itemId)
        return { itemId: p.itemId, x: p.x, y: p.y, w: item?.gridSize?.w ?? 1, h: item?.gridSize?.h ?? 1 }
      })
    )
  }

  get equipment(): Readonly<EquipmentState> { return this._equipment }

  get backpackGrid(): BackpackGrid { return this._grid }

  /**
   * Computed from backpack placements + equipped items.
   * Drop-in replacement for profile.ownedItemIds reads.
   */
  get ownedItemIds(): string[] {
    const inBackpack = this._grid.getPlacements().map(p => p.itemId)
    const equipped = Object.values(this._equipment).filter((v): v is string => v !== null)
    return [...new Set([...inBackpack, ...equipped])]
  }

  equip(slot: EquipmentSlot, itemId: string): void {
    this._equipment = { ...this._equipment, [slot]: itemId }
  }

  unequip(slot: EquipmentSlot): void {
    const itemId = this._equipment[slot]
    this._equipment = { ...this._equipment, [slot]: null }
    // Return item to backpack if there's space
    if (itemId) {
      this.addToBackpack(itemId)
    }
  }

  /** Returns backpack item IDs for a given equipment slot (for the item selection list). */
  getItemsBySlot(slot: EquipmentSlot): string[] {
    return this._grid.getPlacements()
      .map(p => p.itemId)
      .filter(id => getItem(id)?.slot === slot)
  }

  /**
   * Adds an item to the backpack at the first available position.
   * Returns false if the backpack is full.
   */
  addToBackpack(itemId: string): boolean {
    const item = getItem(itemId)
    if (!item) return false
    const { w, h } = item.gridSize
    const pos = this._grid.findSpace(w, h)
    if (!pos) return false
    this._grid = this._grid.place(itemId, pos.x, pos.y, w, h)
    this._syncBackpackPlacements()
    return true
  }

  /**
   * Removes an item from the backpack (e.g. when selling or consuming).
   */
  removeFromBackpack(itemId: string): void {
    this._grid = this._grid.remove(itemId)
    this._syncBackpackPlacements()
  }

  /**
   * Moves a backpack item to a new position.
   * Returns false if the target position is occupied or out of bounds.
   */
  moveInBackpack(itemId: string, toX: number, toY: number): boolean {
    const placement = this._grid.getPlacements().find(p => p.itemId === itemId)
    if (!placement) return false
    if (!this._grid.canPlace(toX, toY, placement.w, placement.h, itemId)) return false
    this._grid = this._grid.remove(itemId).place(itemId, toX, toY, placement.w, placement.h)
    this._syncBackpackPlacements()
    return true
  }

  /**
   * Sells an item for 75% of its gold cost.
   * Removes it from the backpack and adds gold to profile.
   * Returns the gold amount added (0 if item not found or is unsellable).
   */
  sell(itemId: string): number {
    const item = getItem(itemId)
    if (!item || item.goldCost === 0) return 0
    const gold = Math.floor(item.goldCost * 0.75)
    this.removeFromBackpack(itemId)
    this.profile.gold = (this.profile.gold ?? 0) + gold
    return gold
  }

  /**
   * Migrates old flat ownedItemIds to backpackPlacements.
   * Call this once from profile.ts when loading old saves.
   */
  static migrateFromOwnedItemIds(
    ownedItemIds: string[]
  ): { itemId: string; x: number; y: number }[] {
    const items = ownedItemIds
      .map(id => {
        const item = getItem(id)
        return item ? { itemId: id, w: item.gridSize?.w ?? 1, h: item.gridSize?.h ?? 1 } : null
      })
      .filter((x): x is { itemId: string; w: number; h: number } => x !== null)

    return BackpackGrid.autoArrange(items)
  }

  private _syncBackpackPlacements(): void {
    this.profile.backpackPlacements = this._grid.getPlacements().map(({ itemId, x, y }) => ({
      itemId,
      x,
      y,
    }))
  }
}
```

- [ ] **Step 2: Build to check for compile errors**

```bash
npm run build
```

Expected: remaining errors in ShopScene/LevelResultScene/profile.ts (not yet updated) — those are fine. No errors inside InventoryController itself.

- [ ] **Step 3: Commit**

```bash
git add src/controllers/InventoryController.ts
git commit -m "feat: InventoryController integrates BackpackGrid, adds sell/move/addToBackpack"
```

---

## Task 5: Profile Migration

**Files:**
- Modify: `src/utils/profile.ts`

- [ ] **Step 1: Update `createProfile` to initialize `backpackPlacements`, `selectedConsumables`, `previewShopItemIds`**

In `src/utils/profile.ts`, find the `createProfile` function and add the three new fields:

```ts
export function createProfile(playerName: string, avatarChoice = 'knight', avatarConfig?: AvatarConfig): ProfileData {
  return {
    // ... all existing fields ...
    ownedItemIds: [],              // kept for old-save compatibility
    backpackPlacements: [],
    selectedConsumables: [],
    previewShopItemIds: [],
    // ... rest unchanged ...
  }
}
```

- [ ] **Step 2: Add migration in `loadProfile`**

In `loadProfile`, after the existing migration blocks (shopCapacityUpgraded etc.), add:

```ts
// Migrate ownedItemIds → backpackPlacements for old saves
if (!data.backpackPlacements || data.backpackPlacements.length === 0) {
  if (data.ownedItemIds && data.ownedItemIds.length > 0) {
    data.backpackPlacements = InventoryController.migrateFromOwnedItemIds(data.ownedItemIds)
  } else {
    data.backpackPlacements = []
  }
}
if (!data.selectedConsumables) {
  data.selectedConsumables = []
}
if (!data.previewShopItemIds) {
  data.previewShopItemIds = []
}
```

Add the import at the top of `profile.ts`:

```ts
import { InventoryController } from '../controllers/InventoryController'
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: fewer errors now. Remaining errors are in ShopScene/LevelResultScene — will be fixed in later tasks.

- [ ] **Step 4: Commit**

```bash
git add src/utils/profile.ts
git commit -m "feat: migrate ownedItemIds to backpackPlacements on old save load"
```

---

## Task 6: Shop Utilities

**Files:**
- Modify: `src/utils/shop.ts`

- [ ] **Step 1: Rewrite `src/utils/shop.ts`**

```ts
import { ITEMS } from '../data/items'

const ITEMS_PER_CATEGORY = 3
const PREVIEW_COUNT = 2

type GearSlot = 'weapon' | 'armor' | 'accessory'

function gearItems(slot: GearSlot, ownedIds: string[], maxWorld: number) {
  return ITEMS.filter(
    item =>
      item.slot === slot &&
      item.goldCost > 0 &&
      item.worldUnlock <= maxWorld &&
      !ownedIds.includes(item.id)
  )
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => 0.5 - Math.random())
}

/** Called on new profile creation. Initialises the shop with World 1 common items. */
export function getInitialShopItems(ownedItemIds: string[]): string[] {
  const slots: GearSlot[] = ['weapon', 'armor', 'accessory']
  const result: string[] = []
  for (const slot of slots) {
    const available = gearItems(slot, ownedItemIds, 1)
    result.push(...shuffle(available).slice(0, ITEMS_PER_CATEGORY).map(i => i.id))
  }
  return result
}

/** Called on new profile creation. Picks 1-2 next-tier preview items. */
export function getInitialPreviewItems(ownedItemIds: string[], playerWorld: number): string[] {
  const nextWorld = playerWorld + 1
  if (nextWorld > 5) return []
  const available = ITEMS.filter(
    item =>
      item.slot !== 'consumable' &&
      item.slot !== 'trophy' &&
      item.goldCost > 0 &&
      item.worldUnlock === nextWorld &&
      !ownedItemIds.includes(item.id)
  )
  return shuffle(available).slice(0, PREVIEW_COUNT).map(i => i.id)
}

/**
 * Rotates current-tier shop items (1-2 items replaced).
 * Called after buying or boss defeat for current-tier items only.
 */
export function rotateShopItems(
  currentShopItemIds: string[],
  ownedItemIds: string[],
  playerWorld: number,
  itemsToReplaceCount: number = Math.floor(Math.random() * 2) + 1
): string[] {
  const slots: GearSlot[] = ['weapon', 'armor', 'accessory']
  let items = currentShopItemIds.filter(id => !ownedItemIds.includes(id))

  // Replenish any missing slots first
  for (const slot of slots) {
    const currentCount = items.filter(id => ITEMS.find(i => i.id === id)?.slot === slot).length
    const missing = ITEMS_PER_CATEGORY - currentCount
    if (missing > 0) {
      const pool = gearItems(slot, ownedItemIds, playerWorld).filter(i => !items.includes(i.id))
      items.push(...shuffle(pool).slice(0, missing).map(i => i.id))
    }
  }

  // Replace 1-2 items randomly
  const replaceIndices = shuffle([...items.keys()]).slice(0, itemsToReplaceCount)
  for (const idx of replaceIndices) {
    const outgoing = ITEMS.find(i => i.id === items[idx])
    if (!outgoing || outgoing.slot === 'trophy' || outgoing.slot === 'consumable') continue
    const pool = gearItems(outgoing.slot as GearSlot, ownedItemIds, playerWorld).filter(i => !items.includes(i.id))
    if (pool.length > 0) {
      items[idx] = pool[Math.floor(Math.random() * pool.length)].id
    }
  }

  return items
}

/**
 * Reshuffles the next-tier preview slots. Called on boss/mini-boss defeat.
 */
export function refreshPreviewItems(ownedItemIds: string[], playerWorld: number): string[] {
  return getInitialPreviewItems(ownedItemIds, playerWorld)
}

/** Returns all consumable items the player does not currently own (i.e., not in their backpack). */
export function getAvailableConsumables(ownedItemIds: string[]): string[] {
  return ITEMS
    .filter(item => item.slot === 'consumable' && !ownedItemIds.includes(item.id))
    .map(item => item.id)
}
```

- [ ] **Step 2: Update `LevelResultScene` import of `rotateShopItems`**

The `rotateShopItems` call in `LevelResultScene` passes only 2 args. It now needs a third (`playerWorld`). That's fixed in Task 8.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: errors about `rotateShopItems` call signature in LevelResultScene — will be fixed in Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/utils/shop.ts
git commit -m "feat: world-gated shop utils with preview items and consumable helpers"
```

---

## Task 7: ShopScene

**Files:**
- Modify: `src/scenes/ShopScene.ts`

- [ ] **Step 1: Rewrite `src/scenes/ShopScene.ts`**

The shop now shows: current-tier items (3 per category), preview items (1-2 from next tier), and consumables (column 4). Purchases go through `InventoryController.addToBackpack`.

```ts
import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { ProfileData, ItemData } from '../types'
import { ITEMS, getItemColor, getItem } from '../data/items'
import { generateAllItemTextures } from '../art/itemsArt'
import { InventoryController } from '../controllers/InventoryController'
import { rotateShopItems, refreshPreviewItems, getAvailableConsumables } from '../utils/shop'

export class ShopScene extends Phaser.Scene {
  private profileSlot!: number
  private profile!: ProfileData
  private inventoryController!: InventoryController

  constructor() { super('Shop') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(data.profileSlot)!
    this.inventoryController = new InventoryController(this.profile)
  }

  create() {
    const { width, height } = this.scale
    const mobile = this.registry.get('isMobile')

    generateAllItemTextures(this)

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    this.add.text(width / 2, 40, 'THE MERCHANTS TENT', {
      fontSize: mobile ? '24px' : '32px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width - 40, 40, `Gold: ${this.profile.gold ?? 0}`, {
      fontSize: mobile ? '18px' : '24px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(1, 0.5)

    const back = this.add.text(60, 40, '← BACK', {
      fontSize: mobile ? '22px' : '28px', color: '#ffffff', backgroundColor: '#4e4e6a', padding: { x: 20, y: 10 }
    }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => {
      const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap'
      this.scene.start(target, { profileSlot: this.profileSlot })
    })

    const playerWorld = this.profile.currentWorld ?? 1
    const ownedIds = this.inventoryController.ownedItemIds

    // Columns: weapon | armor | accessory | consumable
    const categories: ('weapon' | 'armor' | 'accessory')[] = ['weapon', 'armor', 'accessory']
    const columnWidth = width / 4

    // Current-tier items (3 per category, world-gated)
    categories.forEach((cat, i) => {
      const cx = columnWidth * i + columnWidth / 2
      const title = cat === 'accessory' ? 'ACCESSORIES' : cat.toUpperCase() + 'S'
      this.add.text(cx, 85, title, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5)

      const catItems = (this.profile.currentShopItemIds ?? [])
        .filter(id => {
          const item = getItem(id)
          return item?.slot === cat && !ownedIds.includes(id)
        })
        .map(id => getItem(id)!)
        .filter(Boolean)

      catItems.forEach((item, j) => {
        this.renderItemCard(cx, 155 + j * 110, item)
      })
    })

    // Preview items (next world tier)
    this.add.text(columnWidth * 3 + columnWidth / 2, 85, 'PREVIEW', {
      fontSize: '18px', color: '#aaaaff', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add.text(columnWidth * 3 + columnWidth / 2, 105, `(World ${playerWorld + 1})`, {
      fontSize: '13px', color: '#7777aa'
    }).setOrigin(0.5)

    const previewIds = (this.profile.previewShopItemIds ?? []).filter(id => !ownedIds.includes(id))
    previewIds.forEach((id, j) => {
      const item = getItem(id)
      if (item) this.renderItemCard(columnWidth * 3 + columnWidth / 2, 155 + j * 110, item, true)
    })

    // Consumables column (always stocked)
    this.add.text(columnWidth * 3 + columnWidth / 2, 350, 'CONSUMABLES', {
      fontSize: '18px', color: '#ffaa44', fontStyle: 'bold'
    }).setOrigin(0.5)

    const consumableIds = getAvailableConsumables(ownedIds)
    consumableIds.slice(0, 3).forEach((id, j) => {
      const item = getItem(id)
      if (item) this.renderItemCard(columnWidth * 3 + columnWidth / 2, 420 + j * 90, item)
    })
  }

  private renderItemCard(x: number, y: number, item: ItemData, isPreview = false) {
    const ownedIds = this.inventoryController.ownedItemIds
    const gold = this.profile.gold ?? 0
    const canAfford = gold >= item.goldCost
    const backpackFull = !this.inventoryController.backpackGrid.findSpace(
      item.gridSize.w, item.gridSize.h
    )

    const canBuy = canAfford && !backpackFull
    const bgColor = canBuy ? 0x333366 : 0x2a2a2a
    const borderColor = isPreview ? 0x5555aa : 0x4e4e6a
    const bg = this.add.rectangle(x, y, 340, 100, bgColor).setStrokeStyle(2, borderColor)

    if (canBuy) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', () => {
        this.profile.gold -= item.goldCost
        this.inventoryController.addToBackpack(item.id)

        // Remove from shop pool after purchase
        if (this.profile.currentShopItemIds) {
          this.profile.currentShopItemIds = this.profile.currentShopItemIds.filter(id => id !== item.id)
        }
        if (this.profile.previewShopItemIds) {
          this.profile.previewShopItemIds = this.profile.previewShopItemIds.filter(id => id !== item.id)
        }

        saveProfile(this.profileSlot, this.profile)
        this.scene.restart({ profileSlot: this.profileSlot })
      })
    }

    const itemColor = getItemColor(item.rarity)
    this.add.image(x - 140, y, item.id).setScale(1.5)
    this.add.text(x - 105, y - 35, item.name, { fontSize: '16px', color: itemColor, fontStyle: 'bold' }).setOrigin(0, 0.5)
    this.add.text(x - 105, y - 15, item.description, { fontSize: '11px', color: '#aaaaaa', wordWrap: { width: 270 } }).setOrigin(0, 0)

    const statusText = backpackFull && canAfford ? 'Bag full!' : `${item.goldCost}g`
    const statusColor = canBuy ? '#ffd700' : '#ff4444'
    this.add.text(x + 155, y - 35, statusText, { fontSize: '15px', color: statusColor, fontStyle: 'bold' }).setOrigin(1, 0.5)

    if (isPreview) {
      this.add.text(x + 155, y - 15, `W${item.worldUnlock}`, { fontSize: '11px', color: '#7777cc' }).setOrigin(1, 0.5)
    }

    const gridLabel = `${item.gridSize.w}×${item.gridSize.h} cells`
    this.add.text(x - 105, y + 30, gridLabel, { fontSize: '10px', color: '#666688' }).setOrigin(0, 0.5)
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean or near-clean for ShopScene. Fix any remaining TypeScript errors in this file only.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ShopScene.ts
git commit -m "feat: ShopScene with world gating, preview items, consumable column"
```

---

## Task 8: Gold Scaling + Consumable Clearing in LevelResultScene

**Files:**
- Modify: `src/scenes/LevelResultScene.ts`

- [ ] **Step 1: Add `GOLD_PER_WORD` table and update the gold calculation**

In `src/scenes/LevelResultScene.ts`, find the gold award block:

```ts
// Award gold — 2 gold per enemy (word) defeated
let baseGold = level.wordCount * 2
```

Replace it with:

```ts
// Award gold — scaled by world number on a logarithmic curve
const GOLD_PER_WORD: Record<number, number> = { 1: 3, 2: 8, 3: 20, 4: 45, 5: 90 }
const goldRate = GOLD_PER_WORD[level.world] ?? 3
let baseGold = level.wordCount * goldRate
```

- [ ] **Step 2: Apply `gold_fever` consumable doubling**

Immediately after the `goldEarned` calculation, before saving, add:

```ts
const goldFever = (this.profile.selectedConsumables ?? []).includes('gold_fever')
const finalGold = goldFever ? goldEarned * 2 : goldEarned
this.profile.gold = (this.profile.gold ?? 0) + finalGold
```

Replace the existing `this.profile.gold = ...` line with the above block. Update the display line to show `finalGold`:

```ts
this.add.text(width / 2, 415, `+${finalGold} Gold${goldFever ? ' (x2!)' : ''}`, {
  fontSize: '24px', color: '#ffd700'
}).setOrigin(0.5)
```

- [ ] **Step 3: Consume selected consumables after the level**

After the gold calculation block, add:

```ts
// Remove consumed items from backpack
if (this.profile.selectedConsumables?.length) {
  const invCtrl = new InventoryController(this.profile)
  for (const consumableId of this.profile.selectedConsumables) {
    invCtrl.removeFromBackpack(consumableId)
  }
  this.profile.selectedConsumables = []
}
```

Add the import at the top:

```ts
import { InventoryController } from '../controllers/InventoryController'
```

- [ ] **Step 4: Fix the `rotateShopItems` call to pass `playerWorld`**

Find:

```ts
this.profile.currentShopItemIds = rotateShopItems(this.profile.currentShopItemIds, this.profile.ownedItemIds || [])
```

Replace with:

```ts
const ownedIds = new InventoryController(this.profile).ownedItemIds
this.profile.currentShopItemIds = rotateShopItems(
  this.profile.currentShopItemIds,
  ownedIds,
  this.profile.currentWorld ?? 1
)
this.profile.previewShopItemIds = refreshPreviewItems(ownedIds, this.profile.currentWorld ?? 1)
```

Add the import:

```ts
import { rotateShopItems, refreshPreviewItems } from '../utils/shop'
```

- [ ] **Step 5: Fix the reward item grant to use backpack**

Find:

```ts
if (level.rewards.item && !this.profile.ownedItemIds.includes(level.rewards.item)) {
  this.profile.ownedItemIds.push(level.rewards.item)
}
```

Replace with:

```ts
if (level.rewards.item) {
  const invCtrl = new InventoryController(this.profile)
  if (!invCtrl.ownedItemIds.includes(level.rewards.item)) {
    invCtrl.addToBackpack(level.rewards.item)
  }
}
```

- [ ] **Step 6: Build and run existing tests**

```bash
npm run build && npm run test
```

Expected: build clean, all existing tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/scenes/LevelResultScene.ts
git commit -m "feat: logarithmic gold scaling by world, gold_fever doubling, consume consumables"
```

---

## Task 9: BaseLevelScene Consumable Effects

**Files:**
- Modify: `src/scenes/BaseLevelScene.ts`

- [ ] **Step 1: Add `consumableBonuses` struct and populate in `preCreate()`**

In `src/scenes/BaseLevelScene.ts`, add a protected field before `preCreate`:

```ts
protected consumableBonuses = {
  extraTime: 0,
  ignoreFirstWrong: false,
  goldDouble: false,
  extraPower: 0,
}
```

At the top of `preCreate()`, after `const profile = loadProfile(this.profileSlot)`, add:

```ts
// Apply consumable bonuses
const selected = profile?.selectedConsumables ?? []
this.consumableBonuses = {
  extraTime: selected.includes('swift_tonic') ? 20 : 0,
  ignoreFirstWrong: selected.includes('iron_will'),
  goldDouble: selected.includes('gold_fever'),
  extraPower: selected.includes('word_of_power') ? 2 : 0,
}

// swift_tonic: add extra time to this level's timeLimit (if timed)
if (this.consumableBonuses.extraTime > 0 && this.level.timeLimit !== null) {
  this.level = { ...this.level, timeLimit: this.level.timeLimit + this.consumableBonuses.extraTime }
}
```

Note: `this.level` is spread into a new object so the original LevelConfig is not mutated.

- [ ] **Step 2: Wire up `iron_will` after engine is available**

At the end of `preCreate()`, after `this.engine = hud!.engine`, add:

```ts
// iron_will: intercept the first wrong key callback
if (this.consumableBonuses.ignoreFirstWrong && this.engine) {
  let forgiven = false
  const originalOnWrongKey = this.engine.onWrongKey?.bind(this.engine)
  this.engine.onWrongKey = (key: string) => {
    if (!forgiven) {
      forgiven = true
      return
    }
    originalOnWrongKey?.(key)
  }
}
```

If `TypingEngine.onWrongKey` is not a public setter, check `src/components/TypingEngine.ts` and expose it, or use an alternative hook the engine provides.

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: clean. If `engine.onWrongKey` is not settable, check `TypingEngine.ts` and add `public onWrongKey?: (key: string) => void` if missing.

- [ ] **Step 4: Run existing BaseLevelScene tests**

```bash
npx vitest run src/scenes/BaseLevelScene.test.ts
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/BaseLevelScene.ts
git commit -m "feat: apply consumable bonuses in BaseLevelScene preCreate"
```

---

## Task 10: LevelIntroScene Consumable Selection

**Files:**
- Modify: `src/scenes/LevelIntroScene.ts`

- [ ] **Step 1: Replace the `enter()` method with a consumable selection gate**

The current `enter()` method immediately starts the Level scene. We need to intercept it when the player has consumables.

Add a `private showConsumableSelect()` method and update `enter()`:

```ts
private enter() {
  // Reload profile to get latest backpack state
  this.profile = loadProfile(this.profileSlot)!
  const consumablesInBag = (this.profile.backpackPlacements ?? [])
    .map(p => p.itemId)
    .filter(id => {
      const item = import('../data/items').then(m => m.getItem(id))
      return false // placeholder — see Step 2 for sync version
    })
  // Step 2 replaces this placeholder
  this.startLevel()
}

private startLevel() {
  this.scene.start('Level', { level: this.level, profileSlot: this.profileSlot })
}
```

Actually, since we need a sync import, add it at the top of the file:

```ts
import { getItem } from '../data/items'
import { saveProfile } from '../utils/profile'
```

Then rewrite `enter()` cleanly:

```ts
private enter() {
  this.profile = loadProfile(this.profileSlot)!

  const consumables = (this.profile.backpackPlacements ?? [])
    .map(p => getItem(p.itemId))
    .filter(item => item?.slot === 'consumable')
    .map(item => item!)

  if (consumables.length === 0) {
    this.startLevel()
    return
  }

  this.showConsumableSelect(consumables)
}

private startLevel() {
  this.scene.start('Level', { level: this.level, profileSlot: this.profileSlot })
}
```

- [ ] **Step 2: Implement `showConsumableSelect`**

Add this method to `LevelIntroScene`:

```ts
private showConsumableSelect(consumables: import('../types').ItemData[]) {
  const { width, height } = this.scale
  const selected = new Set<string>()

  // Dim overlay
  const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)

  // Panel
  const panelW = 560
  const panelH = 400
  const panelX = width / 2
  const panelY = height / 2
  this.add.rectangle(panelX, panelY, panelW, panelH, 0x1a1a2e).setStrokeStyle(3, 0x4e4e6a)

  this.add.text(panelX, panelY - panelH / 2 + 30, 'Choose Consumables (0–2)', {
    fontSize: '24px', color: '#ffd700', fontStyle: 'bold'
  }).setOrigin(0.5)

  this.add.text(panelX, panelY - panelH / 2 + 58, 'Selected items will be consumed after this level.', {
    fontSize: '14px', color: '#aaaaaa'
  }).setOrigin(0.5)

  const itemObjs: Phaser.GameObjects.Rectangle[] = []
  const checkmarks: Phaser.GameObjects.Text[] = []

  consumables.forEach((item, i) => {
    const iy = panelY - 100 + i * 80
    const bg = this.add.rectangle(panelX, iy, 480, 68, 0x222244)
      .setStrokeStyle(2, 0x4e4e6a)
      .setInteractive({ useHandCursor: true })

    const check = this.add.text(panelX - 220, iy, '☐', { fontSize: '22px', color: '#888888' }).setOrigin(0.5)
    this.add.text(panelX - 185, iy - 14, item.name, { fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5)
    this.add.text(panelX - 185, iy + 10, item.description, { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0, 0.5)

    itemObjs.push(bg)
    checkmarks.push(check)

    bg.on('pointerdown', () => {
      if (selected.has(item.id)) {
        selected.delete(item.id)
        check.setText('☐').setColor('#888888')
        bg.setStrokeStyle(2, 0x4e4e6a)
      } else if (selected.size < 2) {
        selected.add(item.id)
        check.setText('☑').setColor('#ffd700')
        bg.setStrokeStyle(2, 0xffd700)
      } else {
        // Flash red — at max
        bg.setStrokeStyle(2, 0xff4444)
        this.time.delayedCall(400, () => bg.setStrokeStyle(2, 0x4e4e6a))
        this.add.text(panelX, panelY + panelH / 2 - 90, 'Max 2 consumables per level!', {
          fontSize: '14px', color: '#ff4444'
        }).setOrigin(0.5).setAlpha(0)
          .setAlpha(1)
      }
    })
  })

  // Begin button
  const beginBtn = this.add.text(panelX, panelY + panelH / 2 - 40, '[ Begin Level ]', {
    fontSize: '28px', color: '#ffffff', backgroundColor: '#2a2a5a', padding: { x: 20, y: 10 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true })

  beginBtn.on('pointerdown', () => {
    this.profile.selectedConsumables = [...selected]
    saveProfile(this.profileSlot, this.profile)
    this.startLevel()
  })
}
```

Add the import for `ItemData` at the top of the file if not already imported:

```ts
import { LevelConfig, LevelType, ProfileData, ItemData } from '../types'
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/LevelIntroScene.ts
git commit -m "feat: consumable selection screen before level entry in LevelIntroScene"
```

---

## Task 11: CharacterScene Drag-and-Drop Backpack Grid

**Files:**
- Modify: `src/scenes/CharacterScene.ts`

This is the largest task. The inventory tab is replaced with a 4×10 drag-and-drop grid (left) and equipment slots as drop zones (right). The avatar paper doll is removed from this tab.

- [ ] **Step 1: Add grid constants and drag state types at the top of the class**

Add after the existing private field declarations:

```ts
private readonly CELL_SIZE = 45
private gridOriginX = 0
private gridOriginY = 0

private dragging: {
  itemId: string
  ghost: Phaser.GameObjects.Rectangle
  ghostLabel: Phaser.GameObjects.Text
  w: number
  h: number
  originX: number
  originY: number
} | null = null

private dragOverlay: Phaser.GameObjects.Graphics | null = null
```

Also update the `activeTab` type to remove the old slot selection (no longer needed with DnD):

```ts
private activeTab: 'inventory' | 'stats' | 'avatar' = 'inventory'
// Remove: private activeSlotSelection
```

- [ ] **Step 2: Replace `drawInventoryTab` with new implementation**

Replace the existing `drawInventoryTab(startX: number, startY: number)` method with:

```ts
private drawInventoryTab(startX: number, startY: number) {
  const { width } = this.scale
  const S = this.CELL_SIZE

  // Grid origin: left of the content area
  this.gridOriginX = startX + 20
  this.gridOriginY = startY + 40

  this.addSectionTitle(this.container, startY, 'BACKPACK')

  // Draw grid cell backgrounds
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 4; col++) {
      const cell = this.add.rectangle(
        this.gridOriginX + col * S + S / 2,
        this.gridOriginY + row * S + S / 2,
        S - 2, S - 2,
        0x111133
      ).setStrokeStyle(1, 0x333366)
      this.container.add(cell)
    }
  }

  // Draw overlay graphics (separate so drag can update it without clearing grid)
  if (!this.dragOverlay) {
    this.dragOverlay = this.add.graphics().setDepth(90)
  }

  // Draw items in backpack grid (skip currently dragging item)
  for (const p of this.inventoryController.backpackGrid.getPlacements()) {
    if (this.dragging?.itemId === p.itemId) continue
    this.drawItemInGrid(p.itemId, p.x, p.y, p.w, p.h)
  }

  // Equipment slots (right of grid)
  const equipX = this.gridOriginX + 4 * S + 60
  this.addSectionTitle(this.container, startY, 'EQUIPPED')
  const slots: Array<{ slot: 'weapon' | 'armor' | 'accessory' | 'trophy'; label: string; ey: number }> = [
    { slot: 'weapon', label: 'WEAPON', ey: this.gridOriginY + 50 },
    { slot: 'armor', label: 'ARMOR', ey: this.gridOriginY + 160 },
    { slot: 'accessory', label: 'ACCESS.', ey: this.gridOriginY + 270 },
    { slot: 'trophy', label: 'TROPHY', ey: this.gridOriginY + 380 },
  ]

  for (const { slot, label, ey } of slots) {
    this.drawEquipSlot(equipX + 80, ey, slot, label)
  }

  // Sell zone
  this.drawSellZone(equipX + 80, this.gridOriginY + 470)

  // Spells section below grid
  const spellsY = this.gridOriginY + 10 * S + 20
  this.addSectionTitle(this.container, spellsY, 'OWNED SPELLS')
  this.drawSpells(this.container, startX + 20, spellsY + 40)
}
```

- [ ] **Step 3: Add `drawItemInGrid` helper**

```ts
private drawItemInGrid(itemId: string, col: number, row: number, w: number, h: number) {
  const S = this.CELL_SIZE
  const item = getItem(itemId)
  if (!item) return

  const px = this.gridOriginX + col * S
  const py = this.gridOriginY + row * S
  const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color

  const bg = this.add.rectangle(
    px + (w * S) / 2,
    py + (h * S) / 2,
    w * S - 4,
    h * S - 4,
    itemColor,
    0.7
  ).setInteractive({ useHandCursor: true }).setDepth(10)

  const label = this.add.text(
    px + 4,
    py + 4,
    item.name,
    { fontSize: '9px', color: '#ffffff', wordWrap: { width: w * S - 8 }, fontStyle: 'bold' }
  ).setDepth(11)

  this.container.add([bg, label])

  bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
    this.startDragFromGrid(itemId, col, row, w, h)
  })
}
```

- [ ] **Step 4: Add `drawEquipSlot` helper**

```ts
private drawEquipSlot(x: number, y: number, slot: 'weapon' | 'armor' | 'accessory' | 'trophy', label: string) {
  const itemId = this.profile.equipment[slot]
  const item = itemId ? getItem(itemId) : null
  const itemColor = item ? Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color : 0x222244

  this.container.add(
    this.add.text(x, y - 50, label, { fontSize: '11px', color: '#888888' }).setOrigin(0.5)
  )

  const box = this.add.rectangle(x, y, 150, 90, item ? itemColor : 0x111133, item ? 0.6 : 1)
    .setStrokeStyle(2, item ? 0xffd700 : 0x333366)
    .setDepth(5)
  this.container.add(box)

  if (item) {
    this.container.add(
      this.add.text(x, y - 15, item.name, { fontSize: '13px', color: '#ffffff', fontStyle: 'bold', wordWrap: { width: 140 } }).setOrigin(0.5).setDepth(6)
    )
    const effectStr = this.getEffectString(item.effect)
    this.container.add(
      this.add.text(x, y + 15, effectStr, { fontSize: '10px', color: '#00ff00', wordWrap: { width: 140 } }).setOrigin(0.5).setDepth(6)
    )

    // Unequip button
    const unequipBtn = this.add.text(x + 65, y - 40, 'X', { fontSize: '13px', color: '#ff4444', fontStyle: 'bold' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(7)
    unequipBtn.on('pointerdown', () => {
      this.inventoryController.unequip(slot)
      this.profile.equipment = { ...this.inventoryController.equipment }
      saveProfile(this.profileSlot, this.profile)
      this.avatarDirty = true
      this.drawActiveTab()
    })
    this.container.add(unequipBtn)
  } else {
    this.container.add(
      this.add.text(x, y, 'EMPTY', { fontSize: '13px', color: '#444466' }).setOrigin(0.5).setDepth(6)
    )
  }

  // Make box a drop zone: accept dragged items of the matching slot
  box.on('pointerup', () => {
    if (!this.dragging) return
    const dragItem = getItem(this.dragging.itemId)
    if (dragItem?.slot === slot) {
      this.dropOnEquipSlot(this.dragging.itemId, slot)
    }
  })
}
```

- [ ] **Step 5: Add `drawSellZone` helper**

```ts
private drawSellZone(x: number, y: number) {
  const zone = this.add.rectangle(x, y, 150, 60, 0x442211)
    .setStrokeStyle(2, 0xaa6622)
    .setDepth(5)
    .setInteractive()
  this.container.add(zone)
  this.container.add(
    this.add.text(x, y, 'SELL (75%)', { fontSize: '14px', color: '#ffaa44', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6)
  )

  zone.on('pointerup', () => {
    if (!this.dragging) return
    this.dropOnSellZone(this.dragging.itemId)
  })
}
```

- [ ] **Step 6: Add drag start/move/end methods**

```ts
private startDragFromGrid(itemId: string, col: number, row: number, w: number, h: number) {
  if (this.dragging) return
  const S = this.CELL_SIZE
  const item = getItem(itemId)!
  const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color

  const ghost = this.add.rectangle(
    this.gridOriginX + col * S + (w * S) / 2,
    this.gridOriginY + row * S + (h * S) / 2,
    w * S - 4, h * S - 4,
    itemColor, 0.85
  ).setDepth(100)

  const ghostLabel = this.add.text(
    this.gridOriginX + col * S + 4,
    this.gridOriginY + row * S + 4,
    item.name,
    { fontSize: '9px', color: '#ffffff', wordWrap: { width: w * S - 8 }, fontStyle: 'bold' }
  ).setDepth(101)

  this.dragging = { itemId, ghost, ghostLabel, w, h, originX: col, originY: row }

  this.input.on('pointermove', this.onDragMove, this)
  this.input.on('pointerup', this.onDragEnd, this)

  // Redraw grid without this item (ghost replaces it)
  this.drawActiveTab()
}

private onDragMove(pointer: Phaser.Input.Pointer) {
  if (!this.dragging) return
  const { ghost, ghostLabel, w, h } = this.dragging
  const S = this.CELL_SIZE

  ghost.setPosition(pointer.x, pointer.y)
  ghostLabel.setPosition(pointer.x - (w * S) / 2 + 4, pointer.y - (h * S) / 2 + 4)

  // Update overlay highlight
  this.dragOverlay?.clear()
  const col = Math.floor((pointer.x - this.gridOriginX) / S)
  const row = Math.floor((pointer.y - this.gridOriginY) / S)

  const onGrid = col >= 0 && col + w <= 4 && row >= 0 && row + h <= 10
  if (onGrid && this.dragOverlay) {
    const canDrop = this.inventoryController.backpackGrid.canPlace(col, row, w, h, this.dragging.itemId)
    this.dragOverlay.fillStyle(canDrop ? 0x00ff00 : 0xff0000, 0.3)
    this.dragOverlay.fillRect(
      this.gridOriginX + col * S,
      this.gridOriginY + row * S,
      w * S, h * S
    )
  }
}

private onDragEnd(pointer: Phaser.Input.Pointer) {
  if (!this.dragging) return
  const { itemId, ghost, ghostLabel, w, h, originX, originY } = this.dragging

  ghost.destroy()
  ghostLabel.destroy()
  this.dragOverlay?.clear()
  this.input.off('pointermove', this.onDragMove, this)
  this.input.off('pointerup', this.onDragEnd, this)
  this.dragging = null

  const S = this.CELL_SIZE
  const col = Math.floor((pointer.x - this.gridOriginX) / S)
  const row = Math.floor((pointer.y - this.gridOriginY) / S)

  const onGrid = col >= 0 && col + w <= 4 && row >= 0 && row + h <= 10
  if (onGrid) {
    const moved = this.inventoryController.moveInBackpack(itemId, col, row)
    if (moved) {
      saveProfile(this.profileSlot, this.profile)
    }
  }
  // If not on grid (dropped on equip slot or sell zone), those handlers fire via pointerup on those zones.
  // If nowhere valid, item stays at origin (grid redraws with it in place).

  this.drawActiveTab()
}

private dropOnEquipSlot(itemId: string, slot: 'weapon' | 'armor' | 'accessory' | 'trophy') {
  if (!this.dragging) return
  this.dragging.ghost.destroy()
  this.dragging.ghostLabel.destroy()
  this.dragOverlay?.clear()
  this.input.off('pointermove', this.onDragMove, this)
  this.input.off('pointerup', this.onDragEnd, this)
  this.dragging = null

  // Unequip whatever is there (returns to backpack)
  const current = this.profile.equipment[slot]
  if (current && current !== itemId) {
    this.inventoryController.unequip(slot)
  }

  // Remove from backpack, equip
  this.inventoryController.removeFromBackpack(itemId)
  this.inventoryController.equip(slot, itemId)
  this.profile.equipment = { ...this.inventoryController.equipment }
  saveProfile(this.profileSlot, this.profile)
  this.avatarDirty = true
  this.drawActiveTab()
}

private dropOnSellZone(itemId: string) {
  if (!this.dragging) return
  this.dragging.ghost.destroy()
  this.dragging.ghostLabel.destroy()
  this.dragOverlay?.clear()
  this.input.off('pointermove', this.onDragMove, this)
  this.input.off('pointerup', this.onDragEnd, this)
  this.dragging = null

  const item = getItem(itemId)
  if (!item || item.goldCost === 0) {
    this.drawActiveTab()
    return
  }

  const goldBack = Math.floor(item.goldCost * 0.75)

  // Confirmation popup
  const { width, height } = this.scale
  const popupBg = this.add.rectangle(width / 2, height / 2, 400, 180, 0x1a1a2e)
    .setStrokeStyle(3, 0xffd700).setDepth(200)
  const popupText = this.add.text(width / 2, height / 2 - 40,
    `Sell ${item.name}\nfor ${goldBack}g?`,
    { fontSize: '20px', color: '#ffffff', align: 'center' }
  ).setOrigin(0.5).setDepth(201)

  const yesBtn = this.add.text(width / 2 - 70, height / 2 + 30, '[ Yes ]', {
    fontSize: '22px', color: '#44ff44', backgroundColor: '#1a3a1a', padding: { x: 10, y: 6 }
  }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true })

  const noBtn = this.add.text(width / 2 + 70, height / 2 + 30, '[ No ]', {
    fontSize: '22px', color: '#ff4444', backgroundColor: '#3a1a1a', padding: { x: 10, y: 6 }
  }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true })

  const cleanup = () => { popupBg.destroy(); popupText.destroy(); yesBtn.destroy(); noBtn.destroy() }

  yesBtn.on('pointerdown', () => {
    cleanup()
    this.inventoryController.sell(itemId)  // mutates profile.gold directly
    saveProfile(this.profileSlot, this.profile)
    this.drawActiveTab()
  })

  noBtn.on('pointerdown', () => {
    cleanup()
    this.drawActiveTab()
  })
}
```

- [ ] **Step 7: Remove references to `activeSlotSelection` and `drawItemSelectionList`**

Search the file for `activeSlotSelection` and `drawItemSelectionList`. Remove or comment them out — drag-and-drop replaces click-to-equip. The `drawPaperDollSlot` method can also be removed as `drawEquipSlot` replaces it.

- [ ] **Step 8: Build**

```bash
npm run build
```

Fix any TypeScript errors (likely missing imports or method renames). Key imports to check:

```ts
import { saveProfile } from '../utils/profile'
import { getItem, getItemColor } from '../data/items'
import { InventoryController } from '../controllers/InventoryController'
```

- [ ] **Step 9: Start dev server and manual smoke test**

```bash
npm run dev
```

Open the game, navigate to OverlandMap, open Character screen. Verify:
- Inventory tab shows a 4×10 grid
- Items from backpack render as colored rectangles
- Dragging an item shows a ghost + green/red highlight on grid
- Dropping on a valid grid position moves it
- Dropping on an equipment slot equips it
- Dropping on the SELL zone shows confirmation popup; confirming removes the item and adds gold

- [ ] **Step 10: Commit**

```bash
git add src/scenes/CharacterScene.ts
git commit -m "feat: replace inventory tab with drag-and-drop 4x10 backpack grid and sell zone"
```

---

## Task 12: Self-Review + Final Build

**Files:** All modified files

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: all existing tests pass.

- [ ] **Step 2: Full production build**

```bash
npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Verify spec acceptance criteria**

- [ ] Player cannot trivially buy all shop items before completing World 1 (logarithmic gold + world gating)
- [ ] Shop visibly expands as player progresses through worlds (`worldUnlock` filtering + preview items)
- [ ] Hero has a defined inventory cap (4×10 grid in CharacterScene)
- [ ] Players can sell items back for 75% (sell zone in CharacterScene)
- [ ] At least one category of single-use consumables exists in shop (4 consumable items + pre-level selection)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete gold economy overhaul (issue #96)"
```
