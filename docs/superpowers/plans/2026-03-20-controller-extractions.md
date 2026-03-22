# Controller Extractions for Remaining Level Scenes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract game logic from the 9 remaining level scenes that don't yet have controllers, following the same pattern established by `WaveController`, `KitchenController`, and `PlatformerController`.

**Architecture:** Three new pure-TypeScript controllers cover the main patterns:
1. `ProgressionController` — linear word queue (4 simple scenes share this exactly)
2. `WrongKeyAttackController` — wrong-key threshold triggering enemy attacks (4 scenes)
3. Individual controllers for the 3 complex scenes (GoblinWhacker, MonsterArena, UndeadSiege) that have unique spawning/wave logic

Each controller: no Phaser imports, event-driven output, injectable RNG for deterministic tests.

**Tech Stack:** TypeScript, Phaser 3, Vitest — run tests with `npm run test`

**Prerequisites:** Complete `2026-03-20-code-review-fixes.md` and optionally `2026-03-20-shared-infrastructure.md` (the helpers make scene refactors cleaner but are not required).

---

## Context: The Controller Pattern

Every controller in this codebase follows this structure:
```typescript
// src/controllers/XyzController.ts
// Pure TypeScript — NO Phaser imports.

export type XyzEvent = { type: 'foo'; ... } | { type: 'bar'; ... }

export interface XyzConfig { ... }

export class XyzController {
  constructor(private config: XyzConfig) { ... }

  someAction(input: string): XyzEvent[] {
    // pure logic, returns events
    return []
  }
}
```

The scene creates the controller, calls methods on it, and handles the returned events via a `switch` on `event.type`. See `src/controllers/WaveController.ts` and `src/scenes/level-types/SkeletonSwarmLevel.ts` for the canonical example.

---

## Task 1: `ProgressionController` — linear word queue

**Files:**
- Create: `src/controllers/ProgressionController.ts`
- Create: `src/controllers/ProgressionController.test.ts`
- Modify: `src/scenes/level-types/DungeonEscapeLevel.ts`
- Modify: `src/scenes/level-types/MagicRuneTypingLevel.ts`
- Modify: `src/scenes/level-types/GuildRecruitmentLevel.ts`
- Modify: `src/scenes/level-types/PotionBrewingLabLevel.ts`

These 4 scenes all implement the same logic:
```typescript
if (this.wordQueue.length === 0) {
  this.endLevel(true)
} else {
  this.engine.setWord(this.wordQueue.shift()!)
}
```

`ProgressionController` makes this testable and removes the duplication.

- [ ] **Step 1: Read the four scene files**

Read `DungeonEscapeLevel.ts`, `MagicRuneTypingLevel.ts`, `GuildRecruitmentLevel.ts`, and `PotionBrewingLabLevel.ts` to understand their full `onWordComplete` logic. Note any per-scene differences (e.g., PotionBrewingLab may have recipe tracking).

**Key design decision:** `advance()` is called AFTER a word is completed (the scene already set the current word earlier). It dequeues and returns the NEXT word to show, or signals that the queue is exhausted. The scene calls `endLevel(true)` on `level_complete`.

- [ ] **Step 2: Write failing tests**

Create `src/controllers/ProgressionController.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ProgressionController } from './ProgressionController'

describe('ProgressionController', () => {
  it('returns next_word with the next word in the queue', () => {
    const ctrl = new ProgressionController(['apple', 'bear', 'cat'])
    expect(ctrl.advance()).toEqual([{ type: 'next_word', word: 'apple' }])
  })

  it('returns level_complete when the queue is empty', () => {
    const ctrl = new ProgressionController([])
    expect(ctrl.advance()).toEqual([{ type: 'level_complete' }])
  })

  it('returns level_complete after the last word is dequeued', () => {
    const ctrl = new ProgressionController(['only'])
    ctrl.advance() // dequeues 'only' → returns next_word
    expect(ctrl.advance()).toEqual([{ type: 'level_complete' }])
  })

  it('tracks words remaining before each advance', () => {
    const ctrl = new ProgressionController(['a', 'b', 'c'])
    expect(ctrl.wordsRemaining).toBe(3)
    ctrl.advance()
    expect(ctrl.wordsRemaining).toBe(2)
  })

  it('advance() on empty queue is idempotent', () => {
    const ctrl = new ProgressionController([])
    ctrl.advance()
    expect(ctrl.advance()).toEqual([{ type: 'level_complete' }])
  })
})
```

Run and confirm all fail:
```bash
npx vitest run src/controllers/ProgressionController.test.ts
```

- [ ] **Step 3: Implement `ProgressionController`**

Create `src/controllers/ProgressionController.ts`:

```typescript
// src/controllers/ProgressionController.ts
// Pure TypeScript — NO Phaser imports.

export type ProgressionEvent =
  | { type: 'next_word'; word: string }
  | { type: 'level_complete' }

export class ProgressionController {
  private queue: string[]

  constructor(words: string[]) {
    this.queue = [...words]
  }

  get wordsRemaining(): number { return this.queue.length }

  /**
   * Called after a word is completed. Dequeues the next word and returns it,
   * or returns level_complete if the queue is empty.
   */
  advance(): ProgressionEvent[] {
    if (this.queue.length === 0) {
      return [{ type: 'level_complete' }]
    }
    const word = this.queue.shift()!
    return [{ type: 'next_word', word }]
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/controllers/ProgressionController.test.ts
```
Expected: all pass.

- [ ] **Step 5: Migrate `DungeonEscapeLevel`**

Read the full file. In `onWordComplete`:

Before:
```typescript
if (this.wordQueue.length === 0) {
  this.endLevel(true)
} else {
  this.engine.setWord(this.wordQueue.shift()!)
}
```

**Important:** `DungeonEscapeLevel` has a `private showNextWord()` helper that (a) checks `this.finished`, (b) dequeues the next word, and (c) updates a progress bar. The migration must preserve this helper — do NOT replace it with a bare `engine.setWord(...)` call.

After the migration:
1. Add `private progression!: ProgressionController` field
2. In `create()`, after `preCreate()`:
   ```typescript
   this.progression = new ProgressionController([...this.wordQueue])
   this.wordQueue = [] // controller now owns the queue; clear the base-class copy
   ```
3. Replace the body of the existing `showNextWord()` private method:
   ```typescript
   private showNextWord() {
     if (this.finished) return
     const events = this.progression.advance()
     for (const e of events) {
       switch (e.type) {
         case 'next_word':
           this.engine.setWord(e.word)
           // Update progress bar (keep existing crackFill logic here)
           break
         case 'level_complete':
           this.endLevel(true)
           break
       }
     }
   }
   ```
4. The `create()` call `this.showNextWord()` at line 58 and the `onWordComplete` call are unchanged — they both still call `showNextWord()` as before.

- [ ] **Step 6: Run all tests**

```bash
npm run test
```

- [ ] **Step 7: Migrate remaining 3 scenes**

Apply the same migration to `MagicRuneTypingLevel`, `GuildRecruitmentLevel`, and `PotionBrewingLabLevel`. Read each file first — they may have additional logic in `onWordComplete` (recipe tracking in PotionBrewing, score display in GuildRecruitment) that sits alongside the word progression. Keep that logic; only replace the word-queue management.

- [ ] **Step 8: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 9: Commit**

```bash
git add src/controllers/ProgressionController.ts src/controllers/ProgressionController.test.ts \
        src/scenes/level-types/DungeonEscapeLevel.ts \
        src/scenes/level-types/MagicRuneTypingLevel.ts \
        src/scenes/level-types/GuildRecruitmentLevel.ts \
        src/scenes/level-types/PotionBrewingLabLevel.ts
git commit -m "feat: add ProgressionController with tests; migrate 4 simple word-queue levels"
```

---

## Task 2: `WrongKeyAttackController` — threshold-based enemy attacks

**Files:**
- Create: `src/controllers/WrongKeyAttackController.ts`
- Create: `src/controllers/WrongKeyAttackController.test.ts`
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts`
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

The wrong-key attack pattern (count wrong keys, attack at threshold, reset counter) is duplicated in at least 4 files. Read them first to identify any differences before abstracting.

- [ ] **Step 1: Read the four files to find the pattern**

Read `src/scenes/level-types/GoblinWhackerLevel.ts` and `src/scenes/level-types/SkeletonSwarmLevel.ts`. Also check `src/scenes/boss-types/MiniBossTypical.ts` and `src/scenes/boss-types/GrizzlefangBoss.ts`. Document the exact threshold values and attack event names in each file.

- [ ] **Step 2: Write failing tests**

Create `src/controllers/WrongKeyAttackController.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { WrongKeyAttackController } from './WrongKeyAttackController'

describe('WrongKeyAttackController', () => {
  it('returns no event when threshold is not reached', () => {
    const ctrl = new WrongKeyAttackController({ threshold: 5 })
    expect(ctrl.recordWrongKey()).toEqual([])
    expect(ctrl.recordWrongKey()).toEqual([])
  })

  it('returns attack event when threshold is reached', () => {
    const ctrl = new WrongKeyAttackController({ threshold: 3 })
    ctrl.recordWrongKey()
    ctrl.recordWrongKey()
    const events = ctrl.recordWrongKey()
    expect(events).toEqual([{ type: 'enemy_attacks' }])
  })

  it('resets counter after attack so next threshold counts fresh', () => {
    const ctrl = new WrongKeyAttackController({ threshold: 2 })
    ctrl.recordWrongKey()
    ctrl.recordWrongKey() // attack fires
    ctrl.recordWrongKey() // counter resets → no attack yet
    const events = ctrl.recordWrongKey() // second attack
    expect(events).toEqual([{ type: 'enemy_attacks' }])
  })
})
```

Run and confirm fail:
```bash
npx vitest run src/controllers/WrongKeyAttackController.test.ts
```

- [ ] **Step 3: Implement `WrongKeyAttackController`**

Create `src/controllers/WrongKeyAttackController.ts`:

```typescript
// src/controllers/WrongKeyAttackController.ts
// Pure TypeScript — NO Phaser imports.

export type WrongKeyEvent = { type: 'enemy_attacks' }

export interface WrongKeyConfig {
  threshold: number
}

export class WrongKeyAttackController {
  private count = 0

  constructor(private config: WrongKeyConfig) {}

  get wrongKeyCount(): number { return this.count }

  recordWrongKey(): WrongKeyEvent[] {
    this.count++
    if (this.count >= this.config.threshold) {
      this.count = 0
      return [{ type: 'enemy_attacks' }]
    }
    return []
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/controllers/WrongKeyAttackController.test.ts
```
Expected: all pass.

- [ ] **Step 5: Migrate `GoblinWhackerLevel`**

Read the full file. Find where `wrongKeyCount` and `nextAttackThreshold` are used in `onWrongKey`. Read the actual threshold value — do not assume 5.

```typescript
private wrongKeyCtrl!: WrongKeyAttackController

// In create(), after preCreate():
this.wrongKeyCtrl = new WrongKeyAttackController({ threshold: ACTUAL_VALUE })

// In onWrongKey():
this.flashOnWrongKey()
const events = this.wrongKeyCtrl.recordWrongKey()
for (const e of events) {
  if (e.type === 'enemy_attacks') {
    // call whatever method the scene currently uses to deal player damage
  }
}
```

Remove the `wrongKeyCount` and `nextAttackThreshold` fields.

**Note:** `GoblinWhackerLevel` is also modified in Task 3 of this plan (GoblinController). The change here (adding `wrongKeyCtrl`) is additive and will not conflict with Task 3's changes as long as both are committed separately. When executing Task 3, preserve this controller integration.

- [ ] **Step 6: Migrate `SkeletonSwarmLevel`**

Read the full file before migrating. In `SkeletonSwarmLevel`, the wrong-key threshold is NOT a fixed value — it is initialized via `Phaser.Math.Between(5, 8)` at scene start. The controller should be initialized with this random value in `create()`:

```typescript
// In create():
const threshold = Phaser.Math.Between(5, 8) // keep the existing randomness
this.wrongKeyCtrl = new WrongKeyAttackController({ threshold })
```

This preserves the original behavior while delegating the counting to the controller.

- [ ] **Step 7: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/controllers/WrongKeyAttackController.ts src/controllers/WrongKeyAttackController.test.ts \
        src/scenes/level-types/GoblinWhackerLevel.ts \
        src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: add WrongKeyAttackController with tests; migrate GoblinWhacker and SkeletonSwarm"
```

**Follow-up:** Migrate the two boss scenes that share this pattern (`MiniBossTypical`, `GrizzlefangBoss`).

---

## Task 3: `GoblinController` — goblin spawn and HP tracking

**Files:**
- Create: `src/controllers/GoblinController.ts`
- Create: `src/controllers/GoblinController.test.ts`
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts`

`GoblinWhackerLevel` is one of the larger scenes. Before extracting, read the full file to understand its spawn logic, HP tracking, and movement system.

- [ ] **Step 1: Read `GoblinWhackerLevel.ts` fully**

Read the entire file. Map out:
- What state does goblin management require? (active goblin list, HP per goblin, goblin positions)
- What inputs trigger state changes? (word completed, timer tick, goblin reaches barrier)
- What events does the scene care about? (goblin defeated, goblin reached barrier, wave cleared)

Write these down before proceeding.

**Important constraint:** The goblin spawn interval is driven by a Phaser `TimerEvent` (an interval that fires every N ms). The controller is pure TypeScript and cannot own or fire Phaser timers. The controller tracks goblin logical state (positions, HP, active goblin list); the scene retains the spawn timer. On each timer tick, the scene calls a controller method like `spawnGoblin(word)` which registers the goblin in the controller's state and returns a spawn event. The scene creates the visual sprite in response.

- [ ] **Step 2: Design the controller interface**

Based on your reading, define `GoblinEvent` types and `GoblinConfig`. Follow the `WaveController` as a template — look at `src/controllers/WaveController.ts` for the event design pattern.

- [ ] **Step 3: Write failing tests first**

Create `src/controllers/GoblinController.test.ts` covering:
- Spawning a goblin assigns it a word and position
- Typing the goblin's word returns a `goblin_defeated` event
- Goblin reaching the barrier returns a `goblin_breached` event
- Level completes after all goblins are defeated

Run and confirm fail:
```bash
npx vitest run src/controllers/GoblinController.test.ts
```

- [ ] **Step 4: Implement the controller**

Create `src/controllers/GoblinController.ts` — pure TypeScript, no Phaser. All position/movement logic should be computable from numeric state alone (x, speed, deltaMs) without Phaser types.

- [ ] **Step 5: Run tests**

```bash
npx vitest run src/controllers/GoblinController.test.ts
```
Expected: all pass.

- [ ] **Step 6: Refactor `GoblinWhackerLevel` to delegate to `GoblinController`**

This is the largest refactor step. Read the scene, then:
1. Add `private goblinCtrl!: GoblinController`
2. Initialize it in `create()`
3. In `onWordComplete`, call `goblinCtrl.wordTyped(word)` and handle returned events
4. In `update()`, call `goblinCtrl.tick(delta)` and handle returned events
5. Remove the now-redundant state management from the scene

Keep all Phaser rendering code in the scene — the controller only manages logical state.

- [ ] **Step 7: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/controllers/GoblinController.ts src/controllers/GoblinController.test.ts \
        src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "feat: add GoblinController with tests; refactor GoblinWhackerLevel to delegate to controller"
```

---

## Task 4: `MonsterArenaController` — monster HP and multi-hit logic

**Files:**
- Create: `src/controllers/MonsterArenaController.ts`
- Create: `src/controllers/MonsterArenaController.test.ts`
- Modify: `src/scenes/level-types/MonsterArenaLevel.ts`

Same pattern as Task 3 but for `MonsterArenaLevel`. Read the file first, design events, write tests, implement, refactor scene.

- [ ] **Step 1: Read `MonsterArenaLevel.ts` fully**

Understand the multi-hit mechanic (monsters may require multiple words to defeat). Document the state machine before writing any code.

- [ ] **Step 2: Write failing tests, implement, migrate — same process as Task 3**

Follow the exact same sequence as Task 3. Key event types to cover:
- Monster takes a hit
- Monster is defeated (HP reaches 0)
- All monsters defeated → level complete
- Player takes damage

- [ ] **Step 3: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/controllers/MonsterArenaController.ts src/controllers/MonsterArenaController.test.ts \
        src/scenes/level-types/MonsterArenaLevel.ts
git commit -m "feat: add MonsterArenaController with tests; refactor MonsterArenaLevel"
```

---

## Task 5: `UndeadSiegeController` — wave + castle HP

**Files:**
- Create: `src/controllers/UndeadSiegeController.ts`
- Create: `src/controllers/UndeadSiegeController.test.ts`
- Modify: `src/scenes/level-types/UndeadSiegeLevel.ts`

`UndeadSiegeLevel` combines wave logic (like `WaveController`) with castle HP (enemy breach reduces castle HP). It may be possible to compose with `WaveController` rather than starting from scratch — read the file first.

- [ ] **Step 1: Read `UndeadSiegeLevel.ts` fully**

Look for overlap with `WaveController`. If the wave state is identical, extend or compose `WaveController` rather than duplicating it.

- [ ] **Step 2: Write failing tests, implement, migrate — same process as Task 3**

Key events:
- Undead defeated
- Undead reaches castle (castle HP decreases)
- Castle destroyed → level fail
- All waves cleared → level pass

- [ ] **Step 3: Run all tests**

```bash
npm run test
```

- [ ] **Step 4: Commit**

```bash
git add src/controllers/UndeadSiegeController.ts src/controllers/UndeadSiegeController.test.ts \
        src/scenes/level-types/UndeadSiegeLevel.ts
git commit -m "feat: add UndeadSiegeController with tests; refactor UndeadSiegeLevel"
```

---

## Task 6: `SlimeController` — slime splitting logic

**Files:**
- Create: `src/controllers/SlimeController.ts`
- Create: `src/controllers/SlimeController.test.ts`
- Modify: `src/scenes/level-types/SlimeSplittingLevel.ts`

Slimes split into smaller slimes when defeated. The splitting logic (determining child word(s), child HP, child positions) is pure logic suitable for a controller.

- [ ] **Step 1: Read `SlimeSplittingLevel.ts` fully**

Document the splitting mechanic: how are child words chosen? What's the max split depth? How does HP change per tier?

- [ ] **Step 2: Write failing tests, implement, migrate — same process as Task 3**

Key events:
- Slime defeated + spawns children
- Slime defeated + no children (smallest tier) → check level completion
- Player takes damage (slime reaches barrier)

- [ ] **Step 3: Run all tests**

```bash
npm run test
```

- [ ] **Step 4: Commit**

```bash
git add src/controllers/SlimeController.ts src/controllers/SlimeController.test.ts \
        src/scenes/level-types/SlimeSplittingLevel.ts
git commit -m "feat: add SlimeController with tests; refactor SlimeSplittingLevel"
```

---

## Task 7: `WoodlandFestivalController` — player vs AI scoring

**Files:**
- Create: `src/controllers/WoodlandFestivalController.ts`
- Create: `src/controllers/WoodlandFestivalController.test.ts`
- Modify: `src/scenes/level-types/WoodlandFestivalLevel.ts`

This level has a unique mechanic (typing race vs an AI opponent). Extract the score tracking and AI timing logic.

- [ ] **Step 1: Read `WoodlandFestivalLevel.ts` fully**

Understand how the AI is simulated and how winner is determined.

- [ ] **Step 2: Write failing tests, implement, migrate — same process as Task 3**

- [ ] **Step 3: Commit**

```bash
git add src/controllers/WoodlandFestivalController.ts src/controllers/WoodlandFestivalController.test.ts \
        src/scenes/level-types/WoodlandFestivalLevel.ts
git commit -m "feat: add WoodlandFestivalController with tests; refactor WoodlandFestivalLevel"
```

---

## Task 8: Migrate `MonsterManualLevel` to `ProgressionController`

**Files:**
- Modify: `src/scenes/level-types/MonsterManualLevel.ts`

No new controller needed. `MonsterManualLevel.onWordComplete` is exactly the word-queue pattern (`ProgressionController` from Task 1 handles it). The `endLevel` override saves `profile.bossWeaknessKnown` — keep that override unchanged.

- [ ] **Step 1: Read `MonsterManualLevel.ts`**

Confirm `onWordComplete` uses only the standard queue pattern (no recipe tracking, no scoring HUD, no extras).

- [ ] **Step 2: Migrate `onWordComplete`**

```typescript
// Add field:
private progression!: ProgressionController

// In create(), after preCreate():
this.progression = new ProgressionController([...this.wordQueue])
this.wordQueue = []
const first = this.progression.advance()
if (first[0].type === 'next_word') this.engine.setWord(first[0].word)

// Replace onWordComplete body:
protected onWordComplete(_word: string, _elapsed: number) {
  this.spawnWordGold()
  const events = this.progression.advance()
  for (const e of events) {
    switch (e.type) {
      case 'next_word': this.engine.setWord(e.word); break
      case 'level_complete': this.endLevel(true); break
    }
  }
}
```

Keep `endLevel` override exactly as-is — it saves the boss weakness to the profile before calling `super.endLevel(passed)`.

- [ ] **Step 3: Run all tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/level-types/MonsterManualLevel.ts
git commit -m "refactor: migrate MonsterManualLevel word queue to ProgressionController"
```
