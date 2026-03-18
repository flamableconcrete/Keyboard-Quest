# Crazed Cook's Camp — Level Redesign Spec

**Date:** 2026-03-17
**Level:** `w1_l6` — "The Crazed Cook's Camp"
**Current type:** `SillyChallenge` (placeholder — always passes, no real art)
**New type:** `CrazedCook`

---

## Overview

Replace the placeholder `SillyChallengeLevel` with a fully realized Overcooked-inspired typing level. The player fills food orders for impatient orc customers by typing ingredient words. Cooks with kitchen utensils animate in the background. Win by hitting an order quota before time runs out; lose if time expires short of the quota or too many orcs walk off angry.

---

## Verified API & Field References

The following are confirmed to exist in the codebase (verified against source):

| Symbol | Location | Type |
|--------|----------|------|
| `TypingEngine.sessionStartTime` | `src/components/TypingEngine.ts:30` | `number` |
| `TypingEngine.completedWords` | `src/components/TypingEngine.ts:29` | `number` |
| `TypingEngine.correctKeystrokes` | `src/components/TypingEngine.ts:27` | `number` |
| `TypingEngine.totalKeystrokes` | `src/components/TypingEngine.ts:28` | `number` |
| `TypingEngine.destroy()` | Phaser `GameObject` method, used by all existing level scenes | `() => void` |
| `TypingHands` component | `src/components/TypingHands.ts` — constructor: `new TypingHands(scene, cx, cy)` | class |
| `profile.showFingerHints` | `src/types/index.ts:56` | `boolean` |
| `getWordPool(...)` | `src/utils/words.ts` | function |
| `calcAccuracyStars, calcSpeedStars` | `src/utils/scoring.ts` | functions |
| `bossGate: null` | `src/types/index.ts:98` — typed as `{ ... } \| null` | valid value |
| `LevelConfig.unlockedLetters` | `src/types/index.ts` | `string[]` (W1_AFTER_MB2 is a `string[]` constant) |

Note: CLAUDE.md incorrectly refers to `TutorialHands` — the correct component is `TypingHands` at `src/components/TypingHands.ts`.

---

## Layout (1280×720, top-down view)

```
┌─────────────────────────────────────────────────────────┐
│  [LEVEL NAME]          [TIMER]        [ORDERS: X/Y]     │  ← HUD bar (y≈20)
├─────────────────────────────────────────────────────────┤
│  [patience][patience][patience][patience][patience]      │  ← Patience bars (y≈100)
│  [ORC 1]  [ORC 2]  [ORC 3]  [ORC 4]  [ORC 5]          │  ← Orc sprites (y≈160)
│  [ticket] [ticket] [ticket] [ticket] [ticket]           │  ← Order tickets (y≈200–320)
│                                                         │
│  ════════════ SERVING COUNTER ════════════              │  ← Counter band (y≈360)
│                                                         │
│   [Cook 1]    [Cook 2]    [Cook 3]                      │  ← Cooks (y≈460)
│   (ladle)     (knife)     (spoon)                       │     bobbing tween
│                                                         │
├─────────────────────────────────────────────────────────┤
│         [ current word to type / typing engine ]        │  ← Typing engine (y≈600)
│         [ finger hints (if profile.showFingerHints) ]   │
└─────────────────────────────────────────────────────────┘
```

**Seat X positions** (5 seats evenly across 1280px canvas):
`[160, 360, 560, 760, 960]`

These map `seat: number` (0–4) to fixed X coordinates used for orc sprites, patience bars, and tickets.

**Patience bar dimensions:** 100px wide × 10px tall, positioned at `(seatX, 100)`.

**Ticket dimensions:** 100px wide × 120px tall, centered at `(seatX, 260)`.

- The **active order** is highlighted by calling `setStrokeStyle(2, 0xffd700)` on `ticket.bg`. Inactive tickets use `setStrokeStyle(2, 0x8b6340)`.
- `TypingHands` finger hints: `new TypingHands(this, width / 2, height - 100)` — same coordinates used by `GoblinWhackerLevel`.

---

## Order System

### TypingEngine Instantiation

```ts
this.engine = new TypingEngine({
  scene: this,
  x: width / 2,
  y: height - 80,
  fontSize: 40,
  onWordComplete: this.onWordComplete.bind(this),
  onWrongKey: () => this.cameras.main.flash(80, 120, 0, 0),
})
```

### Word Pool

```ts
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'

const difficulty = Math.ceil(this.level.world / 2)   // = 1 for world 1
const maxLength = this.level.world === 1 ? 5 : undefined
const wordPool = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, maxLength)
// wordPool is string[]; shuffle then consume word-by-word for ingredient slots
```

`level.wordCount = 40`. `level.unlockedLetters` is `W1_AFTER_MB2` (a string constant in `src/data/levels/world1.ts`). With ~2 avg ingredients per order, ~20 possible orders > quota of 12.

**Pool exhaustion:** When the pool runs out, no new orcs spawn. Seated orcs already present can still be served or walk off. When the last orc departs (served or walked off) with no replacement spawning, call `engine.clearWord()` so the UI doesn't show a stale word while waiting for the timer. The timer will fire the loss condition. This is not a practical concern with 40 words and a quota of 12.

### Order Structure

Ingredient count per order (random on spawn):

- 15% chance of 1 ingredient
- 50% chance of 2 ingredients
- 25% chance of 3 ingredients
- 10% chance of 4 ingredients

Words are consumed from the shuffled pool in sequence when each orc spawns.

### Initial Spawn & Seating

- At `create()` time, **2 orcs** spawn immediately into seats 0 and 1. Seats 2–4 start empty.
- After each serve or walk-off, a new orc spawns into the freed seat after a **1.5s delay**, if words remain in the pool.
- Maximum **5 seats** occupied simultaneously.

### Active Order Selection

- The **lowest occupied seat index** is auto-selected as the active order when an orc arrives and no order is currently active.
- **TAB** advances focus to the next occupied seat (ascending index, wrapping to lowest). If only one seat is occupied, TAB is a no-op.
- On TAB: `TypingEngine.setWord(currentIngredient.word)` is called on the newly active order. This fully resets the visual state of the word (clears any partial typed characters). No `done` state on completed ingredients is affected.

### Filling an Order

1. `TypingEngine` shows the current ingredient word for the active order.
2. On `onWordComplete`, the ingredient is marked `done: true`, the ticket line updates (green `'✓ '` prefix), and the next ingredient word loads automatically into `TypingEngine`.
3. When all ingredients are `done`: orc plays a brief scale-up/fade tween and is removed. `ordersFilled++`. **Win check runs immediately here.**
4. Focus shifts **immediately** to the lowest remaining occupied seat.
5. A new orc spawns into the empty seat after 1.5s, if words remain.

### Win / Lose Conditions

| Condition | Result | Where checked |
|-----------|--------|---------------|
| `ordersFilled >= orderQuota` | **WIN** | In `onWordComplete`, after `ordersFilled++` |
| `timeLeft <= 0` | **LOSE** | In `Phaser.Time.TimerEvent` callback (1s repeat) |
| `walkoffs >= maxWalkoffs` | **LOSE** | After `walkoffs++` in `handleWalkoff()` |

`orderQuota = this.level.orderQuota ?? 12`. `maxWalkoffs = this.level.maxWalkoffs ?? 3`.

All three call `endLevel(passed)`, guarded by `this.finished`.

### Timer

```ts
this.timeLeft = this.level.timeLimit  // 90
this.timerEvent = this.time.addEvent({
  delay: 1000,
  repeat: this.level.timeLimit - 1,
  callback: () => {
    this.timeLeft--
    this.timerText.setText(`${this.timeLeft}s`)
    if (this.timeLeft <= 0) this.endLevel(false)
  }
})
```

### `endLevel(passed: boolean)`

Note: read stats from `engine` **before** calling `engine.destroy()`.

```ts
private endLevel(passed: boolean) {
  if (this.finished) return
  this.finished = true
  this.timerEvent?.remove()
  this.typingHands?.fadeOut()

  // Read stats BEFORE destroy()
  const elapsed = Date.now() - this.engine.sessionStartTime
  const acc = passed ? calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes) : 0
  const spd = passed ? calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world) : 0
  this.engine.destroy()

  this.time.delayedCall(500, () => {
    this.scene.start('LevelResult', {
      level: this.level,
      profileSlot: this.profileSlot,
      accuracyStars: acc,
      speedStars: spd,
      passed
    })
  })
}
```

### Patience Bars

- Each orc's patience bar (`patienceBar`) shrinks in width from 100px to 0px as `patience` drains from `1.0` to `0.0`.
- Patience duration by ingredient count:
  - Formula: `patienceDuration = 70 - ingredientCount * 10` seconds (30s–60s range)
  - Per-frame drain: `patienceRate = 1 / (patienceDuration * 60)`; or delta-based: `patience -= patienceRate * (delta / 16.67)`
- Bar background (`patienceBarBg`): 100px × 10px Rectangle, fill `0x444444`, at `(seatX, 100)`.
- Bar foreground (`patienceBar`): Rectangle starting at 100px wide, fill `0x44ff44`, same position. Width set to `patience * 100` each frame.
- When `patience <= 0`: call `handleWalkoff(order)` — remove sprite/ticket, `walkoffs++`, check lose. If the walked-off orc was the active order, call `engine.clearWord()` first, then call `engine.setWord(newActiveOrder.currentIngredient.word)` after shifting focus (or leave engine cleared if no seats remain).
- As patience drops below `0.33`: tint orc sprite progressively toward red using `Phaser.Display.Color.Interpolate.ColorWithColor({r:107,g:124,b:58}, {r:220,g:50,b:50}, 100, progress)` where `progress = Math.round((0.33 - patience) / 0.33 * 100)`.

---

## Pixel Art (`src/art/crazedCookArt.ts`)

Procedural textures via Phaser `Graphics` (same pattern as `goblinWhackerArt.ts`). Single export:

```ts
export function generateCrazedCookTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('orc_customer')) return
  // generate each texture below
}
```

### Orc Customer (`'orc_customer'`)

Distinct from the slim green goblin:

- Stocky, wide body — broader than goblin
- Warty grey-green skin: `0x6b7c3a` body, `0x8a9e4a` highlight
- Flat wide nose, small beady yellow eyes, jutting underbite with two bottom tusks
- Rough leather bib/vest
- Seated posture (shorter sprite, hunched at counter)
- Base texture has no tint; in-scene tint applied via patience logic above

### Cook Characters (3 texture keys)

~24px tall, top-down angle. Animated in-scene with looping `y ± 4px` bobbing tween:

- **`cook_ladle`** — white apron, ladle (yellow handle, round head)
- **`cook_knife`** — stained apron, kitchen knife (grey blade, brown handle)
- **`cook_spoon`** — tall chef hat, wooden spoon (brown handle, oval bowl)

### Kitchen Background (`'kitchen_bg'`)

- Top half (kitchen): checkerboard `0x4a3728` / `0x3a2a1e`, 32×32 px tiles
- Counter band: `0x8b6340`, ~40px tall, centered vertically at y≈360
- Bottom half (seating area): `0x9e9e8a`, 16×16 px tiles
- Pixel stove/fire decorations in kitchen top-left and top-right corners

### Order Ticket UI

Built from Phaser `Rectangle` + `Text` objects in `CrazedCookLevel.ts`:

- `ticket.bg` = `this.add.rectangle(seatX, 260, 100, 120, 0xf5e6c8).setStrokeStyle(2, 0x8b6340)`
- Active: `ticket.bg.setStrokeStyle(2, 0xffd700)`
- Ingredient lines: `Text` at `(seatX, 215 + i*22)`, gray `#888888` pending, green `#44ff44` with `'✓ '` when done

---

## Code Structure

### New Files

| File | Purpose |
|------|---------|
| `src/scenes/level-types/CrazedCookLevel.ts` | Main scene |
| `src/art/crazedCookArt.ts` | Pixel art texture generators |

### Modified Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `'CrazedCook'` to `LevelType` union; add `orderQuota?: number` and `maxWalkoffs?: number` to `LevelConfig` |
| `src/scenes/LevelScene.ts` | Map `'CrazedCook'` → `'CrazedCookLevel'` |
| `src/main.ts` | Register `CrazedCookLevel` scene |
| `src/data/levels/world1.ts` | Change `w1_l6` type to `'CrazedCook'`, update `wordCount: 40`, `timeLimit: 90`, add `orderQuota: 12`, `maxWalkoffs: 3` |

### Key Interfaces (in `CrazedCookLevel.ts`)

```ts
interface Ingredient {
  word: string
  done: boolean
}

interface TicketUI {
  bg: Phaser.GameObjects.Rectangle  // setStrokeStyle(2, 0xffd700) when active, 0x8b6340 otherwise
  lines: Phaser.GameObjects.Text[]
}

interface OrcOrder {
  orcSprite: Phaser.GameObjects.Image
  ticket: TicketUI
  patienceBar: Phaser.GameObjects.Rectangle    // width = patience * 100; fill green
  patienceBarBg: Phaser.GameObjects.Rectangle  // fixed 100px wide; fill dark gray
  ingredients: Ingredient[]
  currentIngredientIndex: number
  patience: number        // 0–1
  patienceRate: number    // per-frame drain = 1 / (patienceDuration * 60)
  seat: number            // 0–4; X = [160,360,560,760,960][seat]
}
```

### Scene State

```
create()
  → generateCrazedCookTextures(this)
  → draw 'kitchen_bg', counter strip
  → add cook sprites with bobbing tweens
  → spawn 2 initial orcs (seats 0 and 1)
  → setup TypingEngine at (640, 600)
  → setup TypingHands if profile.showFingerHints
  → start timer (Phaser.Time.addEvent, 1s repeat)

update(delta)
  → for each OrcOrder:
      patience -= patienceRate * (delta / 16.67)
      update patienceBar.width = patience * 100
      update orc tint if patience < 0.33
      if patience <= 0: handleWalkoff(order)

handleWalkoff(order)
  → remove orcSprite, ticket, patience bar objects
  → walkoffs++
  → shift focus to lowest occupied seat
  → if walkoffs >= maxWalkoffs: endLevel(false)

onWordComplete(word)
  → mark activeOrder.ingredients[currentIngredientIndex].done = true
  → update ticket line text
  → if more ingredients: currentIngredientIndex++, TypingEngine.setWord(nextWord)
  → else: serveOrc(activeOrder) → ordersFilled++
         → if ordersFilled >= orderQuota: endLevel(true)
         → else: shift focus, schedule new orc spawn in 1.5s

TAB keydown
  → if occupiedSeats.length <= 1: return
  → advance activeOrder to next occupied seat (ascending index, wrap)
  → TypingEngine.setWord(activeOrder.ingredients[currentIngredientIndex].word)
  → update ticket stroke colors
```

The `finished` flag guards `endLevel()` from double-firing.

---

## LevelConfig Changes (`w1_l6`)

```ts
{
  id: 'w1_l6',
  name: "The Crazed Cook's Camp",
  type: 'CrazedCook',
  world: 1,
  unlockedLetters: W1_AFTER_MB2,  // string constant in src/data/levels/world1.ts
  wordCount: 40,
  timeLimit: 90,
  orderQuota: 12,
  maxWalkoffs: 3,
  dialogue: [
    { speaker: "enemy", text: "You dare enter my camp?! My exploding cheese will flatten your fingers!" },
    { speaker: "hero",  text: "...Is that a real threat? Are you a real cook?" },
    { speaker: "enemy", text: "TASTE THE BRIE OF DOOM!" },
  ],
  rewards: { xp: 130 },
  bossGate: null,
}
```
