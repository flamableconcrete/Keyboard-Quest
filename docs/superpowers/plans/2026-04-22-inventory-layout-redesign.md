# Inventory Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rotate the backpack grid from 4-wide × 10-tall to 10-wide × 4-tall, lay out the inventory tab with equipment slots top-left and the grid spanning the full bottom, and migrate any existing save data that would be out-of-bounds in the new grid.

**Architecture:** Three independent changes applied in sequence — (1) update the grid-dimension constants in `BackpackGrid.ts`, (2) add a one-time migration in `InventoryController`'s constructor to re-arrange items whose saved positions are now out-of-bounds, (3) rewrite `drawInventoryTab` in `CharacterScene.ts` to use the new layout. No new files needed.

**Tech Stack:** TypeScript, Vitest (unit tests), Phaser 3 (scene rendering), Vite (dev server)

---

### Task 1: Update BackpackGrid constants and fix tests

**Files:**
- Modify: `src/controllers/BackpackGrid.test.ts`
- Modify: `src/controllers/BackpackGrid.ts:1-2`

- [ ] **Step 1: Update the constants test to assert the new dimensions**

In `src/controllers/BackpackGrid.test.ts`, replace:

```typescript
it('has 4 columns and 10 rows', () => {
  expect(GRID_COLS).toBe(4)
  expect(GRID_ROWS).toBe(10)
})
```

with:

```typescript
it('has 10 columns and 4 rows', () => {
  expect(GRID_COLS).toBe(10)
  expect(GRID_ROWS).toBe(4)
})
```

- [ ] **Step 2: Fix the `canPlace` tests that break with a wider, shorter grid**

Replace the `'allows placing a 2x3 item in empty grid at (1,2)'` test — with GRID_ROWS=4, y=2+h=3 would put the item in rows 2-4 which is out of bounds:

```typescript
it('allows placing a 2x3 item in empty grid at (1,0)', () => {
  const grid = new BackpackGrid([])
  expect(grid.canPlace(1, 0, 2, 3)).toBe(true)
})
```

Replace the `'rejects placement when item extends past right edge'` test — `canPlace(3, 0, 2, 1)` is now valid (3+2=5 ≤ 10):

```typescript
it('rejects placement when item extends past right edge', () => {
  const grid = new BackpackGrid([])
  expect(grid.canPlace(9, 0, 2, 1)).toBe(false)
})
```

- [ ] **Step 3: Fix the `findSpace` tests that break**

Replace `'returns null for an item that is too wide for any row'` — `findSpace(5, 1)` now finds space in a 10-col grid:

```typescript
it('returns null for an item that is too wide for any row', () => {
  const grid = new BackpackGrid([])
  expect(grid.findSpace(11, 1)).toBeNull()
})
```

Replace `'skips occupied cells scanning left-to-right, top-to-bottom'` — a `w: 4` blocker only fills 4 of 10 columns, so `findSpace(1, 1)` would return `(4, 0)` not `(0, 1)`:

```typescript
it('skips occupied cells scanning left-to-right, top-to-bottom', () => {
  const placements = [{ itemId: 'blocker', x: 0, y: 0, w: 10, h: 1 }]
  const grid = new BackpackGrid(placements)
  expect(grid.findSpace(1, 1)).toEqual({ x: 0, y: 1 })
})
```

- [ ] **Step 4: Fix the `place` and `autoArrange` tests that break**

Replace `'throws when placing out of bounds'` — `place('item', 3, 0, 2, 1)` is now valid (3+2=5 ≤ 10):

```typescript
it('throws when placing out of bounds', () => {
  const grid = new BackpackGrid([])
  expect(() => grid.place('item', 9, 0, 2, 1)).toThrow()
})
```

Replace `'wraps to next row when item does not fit in current row'` — two `w: 3` items both fit in row 0 of a 10-col grid; use `w: 6` so the second must wrap:

```typescript
it('wraps to next row when item does not fit in current row', () => {
  const result = BackpackGrid.autoArrange([
    { itemId: 'wide', w: 6, h: 1 },
    { itemId: 'big', w: 6, h: 1 },
  ])
  expect(result[0]).toMatchObject({ itemId: 'wide', x: 0, y: 0 })
  expect(result[1]).toMatchObject({ itemId: 'big', x: 0, y: 1 })
})
```

Replace `'skips items that cannot fit anywhere'` — `w: 5` now fits in a 10-col grid:

```typescript
it('skips items that cannot fit anywhere and returns what it can place', () => {
  const result = BackpackGrid.autoArrange([
    { itemId: 'normal', w: 1, h: 1 },
    { itemId: 'too_wide', w: 11, h: 1 },
  ])
  expect(result.find(p => p.itemId === 'normal')).toBeDefined()
  expect(result.find(p => p.itemId === 'too_wide')).toBeUndefined()
})
```

- [ ] **Step 5: Run tests — expect failures on the constants test (the rest now match the new expectations)**

```bash
npx vitest run src/controllers/BackpackGrid.test.ts
```

Expected: only the `has 10 columns and 4 rows` test fails (all others pass because we fixed the test values to match the *current* constants).

- [ ] **Step 6: Change the constants in BackpackGrid.ts**

In `src/controllers/BackpackGrid.ts`, replace lines 1-2:

```typescript
export const GRID_COLS = 10
export const GRID_ROWS = 4
```

- [ ] **Step 7: Run tests — all should pass**

```bash
npx vitest run src/controllers/BackpackGrid.test.ts
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/controllers/BackpackGrid.ts src/controllers/BackpackGrid.test.ts
git commit -m "feat: change backpack grid to 10 cols x 4 rows"
```

---

### Task 2: Add save-data migration in InventoryController

**Files:**
- Modify: `src/controllers/InventoryController.test.ts`
- Modify: `src/controllers/InventoryController.ts:20-34`

Old saves stored item positions valid for the 4×10 grid (y up to 9). In the new 4-row grid, any item with `y + h > 4` is out of bounds. The constructor must detect and fix this silently.

- [ ] **Step 1: Write the failing migration test**

Add this describe block to `src/controllers/InventoryController.test.ts` (import `GRID_ROWS` from BackpackGrid at the top — add to existing import line):

```typescript
import { GRID_COLS, GRID_ROWS } from './BackpackGrid'
```

Then add the test block:

```typescript
describe('InventoryController — grid migration', () => {
  it('re-arranges items whose saved positions are out-of-bounds for the new grid', () => {
    // rusty_quill is w:1 h:2. At y:8, row 8+2=10 exceeds GRID_ROWS=4.
    const outdatedProfile = {
      equipment: { weapon: null, armor: null, accessory: null, trophy: null },
      ownedItemIds: ['rusty_quill'],
      backpackPlacements: [{ itemId: 'rusty_quill', x: 0, y: 8 }],
      selectedConsumables: [],
      previewShopItemIds: [],
      gold: 0,
    } as unknown as ProfileData

    const ctrl = new InventoryController(outdatedProfile)
    const placements = ctrl.backpackGrid.getPlacements()

    // Item must be re-placed within bounds
    expect(placements).toHaveLength(1)
    const p = placements[0]
    expect(p.itemId).toBe('rusty_quill')
    expect(p.y + p.h).toBeLessThanOrEqual(GRID_ROWS)
    expect(p.x + p.w).toBeLessThanOrEqual(GRID_COLS)

    // Migration must be written back to the profile
    expect(outdatedProfile.backpackPlacements![0].y).toBeLessThan(GRID_ROWS)
  })
})
```

- [ ] **Step 2: Run test — expect failure**

```bash
npx vitest run src/controllers/InventoryController.test.ts
```

Expected: `re-arranges items whose saved positions are out-of-bounds` fails.

- [ ] **Step 3: Implement the migration in InventoryController's constructor**

In `src/controllers/InventoryController.ts`, replace the constructor body (lines 20-35):

```typescript
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

  // Migrate save data whose positions are out-of-bounds for the current grid.
  const needsMigration = storedPlacements.some(p => {
    const item = getItem(p.itemId)
    const h = item?.gridSize?.h ?? 1
    return p.y + h > GRID_ROWS
  })
  if (needsMigration) {
    const items = storedPlacements
      .map(p => {
        const item = getItem(p.itemId)
        return item ? { itemId: p.itemId, w: item.gridSize.w, h: item.gridSize.h } : null
      })
      .filter((x): x is { itemId: string; w: number; h: number } => x !== null)
    const newPlacements = BackpackGrid.autoArrange(items)
    this._grid = new BackpackGrid(
      newPlacements.map(np => {
        const item = getItem(np.itemId)!
        return { itemId: np.itemId, x: np.x, y: np.y, w: item.gridSize.w, h: item.gridSize.h }
      })
    )
    this._syncBackpackPlacements()
  }
}
```

Also add `GRID_ROWS` to the import from `BackpackGrid` at the top of `InventoryController.ts`:

```typescript
import { BackpackGrid, GRID_ROWS } from './BackpackGrid'
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npx vitest run src/controllers/InventoryController.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/controllers/InventoryController.ts src/controllers/InventoryController.test.ts
git commit -m "feat: migrate out-of-bounds backpack placements on load"
```

---

### Task 3: Redesign CharacterScene.drawInventoryTab

**Files:**
- Modify: `src/scenes/CharacterScene.ts`

No unit tests are possible for Phaser scene rendering — correctness is verified visually.

The new layout at 1280×720 (`startX = 290`, `startY = 110`):

```
y=110  "EQUIPPED" label          "OWNED SPELLS" label
y=130  WEAPON slot (390,180)     spells text
       ARMOR slot  (555,180)
y=240  ACCESS. slot (390,290)    SELL zone (center 765,270)
       TROPHY slot  (555,290)

y=335  "BACKPACK" label
y=360  10×4 grid  (origin 310, 360)
```

- [ ] **Step 1: Add GRID_COLS and GRID_ROWS import to CharacterScene**

In `src/scenes/CharacterScene.ts`, change the BackpackGrid import. Add it with the InventoryController import, or add a new import line after line 8:

```typescript
import { GRID_COLS, GRID_ROWS } from '../controllers/BackpackGrid'
```

- [ ] **Step 2: Replace drawInventoryTab with the new layout**

In `src/scenes/CharacterScene.ts`, replace the entire `drawInventoryTab` method:

```typescript
private drawInventoryTab(startX: number, startY: number) {
  const S = this.CELL_SIZE

  // ── TOP-LEFT: 2×2 equipment slots ──────────────────────────────────
  this.container.add(
    this.add.text(startX + 20, startY, 'EQUIPPED', {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
    })
  )

  const col1X = startX + 100
  const col2X = startX + 265
  const row1Y = startY + 70
  const row2Y = startY + 180

  this.drawEquipSlot(col1X, row1Y, 'weapon', 'WEAPON')
  this.drawEquipSlot(col2X, row1Y, 'armor', 'ARMOR')
  this.drawEquipSlot(col1X, row2Y, 'accessory', 'ACCESS.')
  this.drawEquipSlot(col2X, row2Y, 'trophy', 'TROPHY')

  // ── TOP-RIGHT: spells + sell zone ───────────────────────────────────
  const rightX = startX + 400

  this.container.add(
    this.add.text(rightX, startY, 'OWNED SPELLS', {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
    })
  )
  this.drawSpells(this.container, rightX, startY + 35)
  this.drawSellZone(rightX + 75, startY + 160)

  // ── BOTTOM: 10×4 backpack grid ──────────────────────────────────────
  this.gridOriginX = startX + 20
  this.gridOriginY = startY + 240

  this.container.add(
    this.add.text(this.gridOriginX, this.gridOriginY - 25, 'BACKPACK', {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
    })
  )

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const cell = this.add.rectangle(
        this.gridOriginX + col * S + S / 2,
        this.gridOriginY + row * S + S / 2,
        S - 2, S - 2,
        0x111133
      ).setStrokeStyle(1, 0x333366)
      this.container.add(cell)
    }
  }

  if (!this.dragOverlay) {
    this.dragOverlay = this.add.graphics().setDepth(90)
  }

  for (const p of this.inventoryController.backpackGrid.getPlacements()) {
    if (this.dragging?.itemId === p.itemId) continue
    this.drawItemInGrid(p.itemId, p.x, p.y, p.w, p.h)
  }
}
```

- [ ] **Step 3: Update onDragMove to use grid dimension constants**

In `src/scenes/CharacterScene.ts`, in `onDragMove`, replace the hardcoded bounds check:

```typescript
const onGrid = col >= 0 && col + w <= GRID_COLS && row >= 0 && row + h <= GRID_ROWS
```

- [ ] **Step 4: Update onDragEnd to use grid dimension constants**

In `src/scenes/CharacterScene.ts`, in `onDragEnd`, replace the hardcoded bounds check:

```typescript
const onGrid = col >= 0 && col + w <= GRID_COLS && row >= 0 && row + h <= GRID_ROWS
```

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
npm run test
```

Expected: all tests pass (CharacterScene has no unit tests; BackpackGrid and InventoryController tests should all be green).

- [ ] **Step 6: Start the dev server and visually verify the inventory screen**

```bash
npm run dev
```

Open the game in a browser, navigate to a profile → click the character icon to open the Character screen → click the inventory (🎒) tab.

Verify:
- No overlapping labels
- "EQUIPPED" label top-left, "OWNED SPELLS" top-right
- 2×2 equipment slot grid (WEAPON / ARMOR / ACCESS. / TROPHY)
- SELL (75%) zone in the top-right area
- "BACKPACK" label above a wide, short 10-column × 4-row grid at the bottom
- Drag-and-drop within the new grid still works

- [ ] **Step 7: Commit**

```bash
git add src/scenes/CharacterScene.ts
git commit -m "feat: redesign inventory tab — horizontal 10x4 grid, 2x2 equipment slots"
```
