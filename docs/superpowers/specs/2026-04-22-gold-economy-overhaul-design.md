# Gold Economy Overhaul Design

**Issue:** [#96 — Gold system overhaul: economy balancing, item limits, single-use items](https://github.com/flamableconcrete/Keyboard-Quest/issues/96)
**Date:** 2026-04-22
**Status:** Approved

---

## Problem

Replaying early World 1 levels accumulates enough gold to purchase everything in the shop before finishing World 1, removing incentive to progress or make meaningful purchasing decisions.

---

## Acceptance Criteria

- Player cannot trivially buy all shop items before completing World 1
- Shop visibly expands as player progresses through worlds
- Hero has a defined inventory cap (4×10 Diablo-style backpack grid) with a clear UI indication when full
- Players can sell unwanted items back to the shop for 75% of purchase price
- At least one category of single-use consumable items exists in the shop

---

## Section 1: Data Layer

### ItemData changes (`src/types/index.ts`, `src/data/items.ts`)

Add two new fields to `ItemData`:

```ts
gridSize: { w: number, h: number }  // item's footprint in the 4×10 backpack grid
worldUnlock: 1 | 2 | 3 | 4 | 5     // minimum world required to see this item in the shop
```

Add `'consumable'` as a new valid value for `slot`. Consumables have no equipment slot — they live in the backpack only.

**Example grid sizes by item:**

- Daggers, potions, coins, small accessories: `1×1` or `1×2`
- Short swords: `1×2`, Broadswords: `1×3`, Longswords: `1×4`
- Leather tunic: `2×2`, Chainmail: `2×3`, Plate armor: `2×4`
- Large accessories/rings: `1×1`

**worldUnlock mapping by rarity:**

- Common → World 1
- Uncommon → World 2
- Rare → World 3
- Epic → World 4 or 5

### Gold cost rebalancing

Item prices follow a logarithmic curve tied to world tier. The ratio between tiers decreases each step:

| World | Rarity | Price range |
|-------|--------|-------------|
| 1 | Common | 80–150g |
| 2 | Uncommon | 400–700g |
| 3 | Rare | 1,200–2,000g |
| 4 | Epic | 3,000–6,000g |
| 5 | Epic (top tier) | 6,000–12,000g |

### Gold income scaling

Gold earned per word is determined by the world the level belongs to (not the player's current world):

| World | Gold/word | Multiplier vs prev |
|-------|-----------|-------------------|
| 1 | 3g | — |
| 2 | 8g | ×2.67 |
| 3 | 20g | ×2.50 |
| 4 | 45g | ×2.25 |
| 5 | 90g | ×2.00 |

The decreasing multipliers produce the logarithmic curve. Early-world farming becomes negligible for affording mid/late-game items.

**Calibration — completing a full world earns roughly enough to buy 2–3 items from that tier:**

- World 1 (~8 levels × 15 words × 3g): ~360g → 2–3 common items ✓
- World 2 (~8 levels × 20 words × 8g): ~1,280g → 2 uncommon items ✓
- World 3 (~8 levels × 25 words × 20g): ~4,000g → 2 rare items ✓
- World 4 (~8 levels × 30 words × 45g): ~10,800g → 2–3 epic items ✓
- World 5 (~8 levels × 35 words × 90g): ~25,200g → 2–4 top-tier items ✓

Gold income is applied in `LevelResultScene` using `level.world` to look up the rate.

### ProfileData changes (`src/types/index.ts`)

Replace `ownedItemIds: string[]` with:

```ts
backpackPlacements: { itemId: string, x: number, y: number }[]
```

Each entry is the item's top-left cell in the 4×10 grid. Equipped items remain tracked via the existing `equipment` field.

Add:

```ts
selectedConsumables: string[]  // up to 2 consumable IDs chosen before a level; cleared after level resolves
```

`InventoryController` exposes a computed `ownedItemIds` getter (derives from `backpackPlacements` + `equipment`) for backwards compatibility with any code that reads the flat list. The `ownedItemIds` field is removed from `ProfileData` entirely; the getter is the only access point.

### Starter consumable items

Four consumables added to `src/data/items.ts`:

| ID | Name | Effect | Cost | Grid size |
|----|------|--------|------|-----------|
| `swift_tonic` | Swift Tonic | +20s to level time limit | 80g | 1×1 |
| `iron_will` | Iron Will | First wrong key press forgiven | 100g | 1×1 |
| `gold_fever` | Gold Fever | Double gold earned that run | 120g | 1×2 |
| `word_of_power` | Word of Power | +2 power for that level | 90g | 1×1 |

All consumables have `worldUnlock: 1` (always available in shop).

---

## Section 2: Backpack Grid & Drag-and-Drop UI

### Grid structure

The inventory tab in `CharacterScene` is replaced with:

- A **4×10 drag-and-drop backpack grid** on one side
- The existing **4 equipment slots** (weapon/armor/accessory/trophy) on the other

Equipment slots remain as-is. Dragging a backpack item onto the correct equipment slot equips it; the previously equipped item (if any) is returned to the first available backpack space.

### Placement data

`InventoryController` owns all grid logic — no Phaser code:

- Collision detection (does item fit at position x,y without overlapping?)
- Space-available check (is there any valid position for this item?)
- Move validation
- Sell action (remove item, return 75% gold)

### Drag-and-drop interaction (Phaser, in `CharacterScene`)

- **Lifting**: clicking/pressing an item lifts it — it follows the pointer rendered as a semi-transparent ghost at full grid size
- **Valid drop**: highlighted green; dropping snaps item to that cell
- **Invalid drop**: highlighted red (occupied or out-of-bounds); dropping returns item to its origin
- **Equip**: dragging from backpack onto an equipment slot equips the item; displaced item returns to first available backpack space
- **Unequip**: dragging an equipped item back onto the grid unequips it

### Sell mechanic

A **sell zone** (coin bag icon, labeled "SELL") sits below the backpack grid. Dropping any item onto it shows a confirmation prompt: `"Sell [Item Name] for Xg? [Yes] [No]"`. On confirm: item removed from `backpackPlacements`, `profile.gold += Math.floor(item.goldCost * 0.75)`, profile saved.

### Backwards compatibility

On profile load, if `backpackPlacements` is absent (old save), `InventoryController.migrateFromOwnedItemIds()` auto-arranges existing `ownedItemIds` left-to-right, top-to-bottom by item size. Old profiles load without data loss.

---

## Section 3: Shop Progression & World Gating

### World gating

`ShopScene` filters items by `item.worldUnlock <= profile.currentWorld`. Items above the player's current world are not shown or teased — they simply don't appear. The shop gains new stock naturally as the player progresses.

### Shop layout

- **3 items per category** (weapon/armor/accessory) from current-tier pool (down from 5)
- **1–2 next-tier preview items** drawn from `worldUnlock === profile.currentWorld + 1`, displayed in a separate "Preview" section
- **Consumables column** always present, always replenished on every shop visit

### Rotation rules

On boss/mini-boss defeat:

- Current-tier items: 1–2 rotated out and replaced (existing behavior, adjusted for new count)
- Next-tier preview: fully reshuffled (all 1–2 preview slots replaced with new random next-tier items)

`rotateShopItems` gains a `playerWorld` parameter and manages preview slots separately from current-tier slots.

### Consumable restocking

Consumables replenish on every shop visit regardless of boss defeats, ensuring players always have small-gold purchases available between milestones.

---

## Section 4: Consumables & Pre-Level Selection

### Consumable behavior

- `slot: 'consumable'` items live only in the backpack grid
- Consuming one removes it from `backpackPlacements` permanently (after the level resolves)
- Effects are passed as part of level start data and applied in `BaseLevelScene`. Time-based consumables (e.g. Swift Tonic) have no effect on levels where `timeLimit` is `null`.
- `LevelResultScene` clears `profile.selectedConsumables` after resolving (win or lose)

### Pre-level consumable selection (`LevelIntroScene`)

After the existing dialogue/intro, if the player has consumables in their backpack, a selection screen appears:

- Shows all consumables currently in backpack
- Player selects 0–2 via checkboxes
- Selecting a third highlights red: "Max 2 consumables per level"
- "Begin" button starts the level; chosen IDs stored in `profile.selectedConsumables`

If the player has no consumables, this screen is skipped entirely.

---

## Files Affected

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `gridSize`, `worldUnlock` to `ItemData`; add `'consumable'` slot; add `backpackPlacements`, `selectedConsumables` to `ProfileData` |
| `src/data/items.ts` | Add `gridSize` + `worldUnlock` to all items; reprice items; add 4 consumable items |
| `src/utils/shop.ts` | Add `playerWorld` param; add next-tier preview logic; separate consumable restocking |
| `src/utils/profile.ts` | Migration logic: `ownedItemIds` → `backpackPlacements` on old saves |
| `src/controllers/InventoryController.ts` | Grid placement, collision detection, sell logic, migration helper |
| `src/scenes/CharacterScene.ts` | Replace inventory tab with 4×10 drag-and-drop grid + sell zone |
| `src/scenes/ShopScene.ts` | World gating filter; next-tier preview section; consumable column |
| `src/scenes/LevelResultScene.ts` | Use `level.world` for gold rate; clear `selectedConsumables` |
| `src/scenes/LevelIntroScene.ts` | Add consumable selection screen |
| `src/scenes/BaseLevelScene.ts` | Apply consumable effects from `selectedConsumables` |
