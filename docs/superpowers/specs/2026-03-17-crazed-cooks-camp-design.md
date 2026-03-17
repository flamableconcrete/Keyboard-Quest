# Crazed Cook's Camp — Level Redesign Spec

**Date:** 2026-03-17
**Level:** `w1_l6` — "The Crazed Cook's Camp"
**Current type:** `SillyChallenge` (placeholder — always passes, no real art)
**New type:** `CrazedCook`

---

## Overview

Replace the placeholder `SillyChallengeLevel` with a fully realized Overcooked-inspired typing level. The player fills food orders for impatient orc customers by typing ingredient words. Cooks with kitchen utensils animate in the background. Win by hitting an order quota before time runs out; lose if time expires short of the quota or too many orcs walk off angry.

---

## Layout (1280×720, top-down view)

```
┌─────────────────────────────────────────────────────────┐
│  [LEVEL NAME]          [TIMER]        [ORDERS: X/Y]     │  ← HUD bar
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [ORC 1]  [ORC 2]  [ORC 3]  [ORC 4]  [ORC 5]          │  ← Orc seating row
│  [ticket] [ticket] [ticket] [ticket] [ticket]           │     (patience bars above each)
│  [bar██░] [bar██░] [bar██░] [bar██░] [bar██░]           │
│                                                         │
│  ════════════ SERVING COUNTER ════════════              │  ← Counter divider strip
│                                                         │
│   [Cook 1]    [Cook 2]    [Cook 3]                      │  ← Cooks in kitchen (flavor art)
│   (ladle)     (knife)     (spoon)                       │     animating with bobbing tween
│                                                         │
├─────────────────────────────────────────────────────────┤
│         [ current word to type / typing engine ]        │  ← Bottom typing zone
│         [ finger hints (if profile.showFingerHints) ]   │
└─────────────────────────────────────────────────────────┘
```

- The **active order** (currently being filled) is highlighted with a golden glow border.
- Completed ingredients show a green checkmark; pending ingredients are gray.
- The active ingredient word is loaded into the `TypingEngine` at the bottom.
- `TypingHands` finger hints are shown/hidden based on `profile.showFingerHints`, matching the pattern in `GoblinWhackerLevel`.

---

## Order System

### Order Structure

Each orc arrives with a ticket containing **1–4 ingredient words** (variable). Ingredient count is randomly assigned per order, weighted toward 2–3 for `world: 1`.

### Active Order Selection

- The **leftmost seated orc** (longest waiting, most impatient) is auto-selected as the active order on arrival.
- The player can press **TAB** to cycle focus to another seated orc's order.
- The active orc's ticket is highlighted with a golden border.

### Filling an Order

1. `TypingEngine` shows the current ingredient word.
2. On `onWordComplete`, the ingredient is checked off and the next ingredient word loads automatically.
3. When all ingredients are checked, the order is "served" — the orc cheers, does a brief celebrate tween, and leaves.
4. A new orc arrives after a short delay (1–2s) to fill the empty seat (up to max 5 seated).

### Win / Lose Conditions

| Condition | Result |
|-----------|--------|
| Fill `orderQuota` orders before time runs out | **WIN** |
| Timer hits 0 with fewer than `orderQuota` orders filled | **LOSE** |
| `maxWalkoffs` orcs lose all patience and leave angry | **LOSE** |

`orderQuota` and `maxWalkoffs` are stored on `LevelConfig` (optional fields, defaulting to `12` and `3`).

### Patience Bars

- Each seated orc has a patience bar that drains continuously.
- Drain rate scales with ingredient count: more ingredients → faster drain (more to type).
- When patience hits 0: orc leaves angry, walk-off counter increments, seat opens.
- Serving an order in time removes the orc before patience empties.
- Wrong keystrokes don't directly drain patience — they slow the player down indirectly.
- As patience drops below 33%, the orc sprite tints progressively toward red.

### Star Scoring

- Stars use existing `calcAccuracyStars` / `calcSpeedStars` from `src/utils/scoring.ts`.
- Stars are only awarded on a **win**; a loss always passes `accuracyStars: 0, speedStars: 0`.

---

## Pixel Art (`src/art/crazedCookArt.ts`)

All textures generated procedurally via Phaser `Graphics` (same pattern as `goblinWhackerArt.ts`).

### Orc Customer

Visually distinct from the slim green goblin:
- Stocky, wide body — broader than a goblin
- Warty grey-green skin (`0x6b7c3a` body, `0x8a9e4a` highlight)
- Flat wide nose, small beady yellow eyes, jutting underbite with two bottom tusks
- Wearing a rough leather bib/vest
- Seated posture (shorter sprite, hunched forward at counter)
- Tints progressively toward red as patience drains below 33%

### Cook Characters (3 variants, background flavor only)

Each ~24px tall, top-down angle, animated with a simple bobbing tween:
- **Cook 1:** white apron, ladle (yellow handle, round head)
- **Cook 2:** stained apron, kitchen knife (grey blade, brown handle)
- **Cook 3:** tall chef hat, wooden spoon (brown, oval bowl)

### Kitchen Background

- Dark wood floor tiles (top-down checkerboard `0x4a3728` / `0x3a2a1e`) — kitchen zone
- Serving counter: horizontal band of lighter wood (`0x8b6340`)
- Orc seating area: lighter stone floor (`0x9e9e8a`)
- Pixel fire/stove decorations in kitchen corners

### Order Ticket UI

- Parchment-colored rectangle (`0xf5e6c8`) with dark border
- Ingredient lines: gray text when pending, green checkmark + strikethrough when complete
- Active ticket: golden glow border (`0xffd700`)

---

## Code Structure

### New Files

| File | Purpose |
|------|---------|
| `src/scenes/level-types/CrazedCookLevel.ts` | Main scene |
| `src/art/crazedCookArt.ts` | All pixel art texture generators |

### Modified Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `'CrazedCook'` to `LevelType` union; add optional `orderQuota?: number` and `maxWalkoffs?: number` to `LevelConfig` |
| `src/scenes/LevelScene.ts` | Map `'CrazedCook'` → `'CrazedCookLevel'` |
| `src/main.ts` | Register `CrazedCookLevel` scene |
| `src/data/levels/world1.ts` | Change `w1_l6` type to `'CrazedCook'`, add `orderQuota: 12`, `maxWalkoffs: 3` |

### Key Interfaces (in `CrazedCookLevel.ts`)

```ts
interface Ingredient {
  word: string
  done: boolean
}

interface OrcOrder {
  orcSprite: Phaser.GameObjects.Image
  ticket: TicketUI           // parchment card with ingredient list
  patienceBar: Phaser.GameObjects.Rectangle
  patienceBarBg: Phaser.GameObjects.Rectangle
  ingredients: Ingredient[]
  currentIngredientIndex: number
  patience: number           // 0–1, ticks down each frame
  patienceRate: number       // per-second drain, scales with ingredient count
  seat: number               // 0–4
}

interface TicketUI {
  bg: Phaser.GameObjects.Rectangle
  border: Phaser.GameObjects.Rectangle
  lines: Phaser.GameObjects.Text[]
}
```

### Scene State

The `finished` boolean guards `endLevel()` from double-firing (same pattern as all other level scenes). Scene flow:

```
create() → orcs start arriving → player types words to fill orders
  → win: ordersFilled >= orderQuota
  → lose: timeLeft <= 0 OR walkoffs >= maxWalkoffs
  → endLevel(passed) → LevelResult scene
```

---

## LevelConfig Changes (`w1_l6`)

```ts
{
  id: 'w1_l6',
  name: "The Crazed Cook's Camp",
  type: 'CrazedCook',
  world: 1,
  unlockedLetters: W1_AFTER_MB2,
  wordCount: 40,        // total ingredient words in pool
  timeLimit: 90,        // seconds (increased from 60 to allow multi-word orders)
  orderQuota: 12,       // orders needed to win
  maxWalkoffs: 3,       // max angry walk-offs before losing
  dialogue: [ ...existing... ],
  rewards: { xp: 130 },
  bossGate: null,
}
```
