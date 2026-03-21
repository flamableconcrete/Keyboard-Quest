# Boss Scene Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all 11 remaining boss scenes to use setupBossHP and setupBossTimer helpers, eliminating duplicated HP and timer boilerplate.

**Architecture:** Each scene gets a `private hp: BossHPState` field populated by `setupBossHP(wordCount)`. Manual `time.addEvent` countdown blocks are replaced with `setupBossTimer`. Player HP changes from the incorrect 5 to the correct default of 3.

**Tech Stack:** TypeScript, Phaser 3, Vitest — run tests with `npm run test`

---

## Reference Pattern

Before editing any file, study `src/scenes/boss-types/MiniBossTypical.ts` as the canonical post-migration example. Key points:

- Import: `import { BaseBossScene, BossHPState } from '../BaseBossScene'`
- Field declaration: `private hp!: BossHPState`
- Initialization in `create()`: `this.hp = this.setupBossHP(wordCount)`
- All HP refs become `this.hp.bossHp`, `this.hp.bossMaxHp`, `this.hp.playerHp`
- Timer: `this.timerEvent = this.setupBossTimer(this.level.timeLimit, this.timerText, () => this.endLevel(false))`
- The `init()` method should NOT reassign `this.playerHp` (field no longer exists)
- `timerEvent` field declaration and `endLevel` cleanup of it stay as-is; only the initialization block changes

**WARNING: Boss scenes vary significantly in structure. Read each file fully before editing. Do not assume a pattern from one boss applies to the next.**

---

## Tasks

### Task 1 — FlashWordBoss

**File:** `src/scenes/boss-types/FlashWordBoss.ts`

**HP source:** `this.level.wordCount` — used directly as `this.bossMaxHp` on lines 49–50 (`this.bossMaxHp = this.level.wordCount; this.bossHp = this.bossMaxHp`). There is no `wordQueue` involved; wordCount drives HP.

**Timer:** No countdown timer. No `timerText`, no `timerEvent`. **Skip `setupBossTimer` entirely.**

**Fields to remove:**
- `private bossHp = 0` (line 18)
- `private bossMaxHp = 0` (line 19)
- `private playerHp = 5` (line 20)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to the import from `'../BaseBossScene'`.

**`init()` changes:** Remove `this.playerHp = 5` (line 30).

**`create()` changes:**
- Remove lines that set `this.bossMaxHp` and `this.bossHp` directly (lines 49–50).
- Replace with: `this.hp = this.setupBossHP(this.level.wordCount)`
- Change HUD line that reads `this.playerHp` to `this.hp.playerHp`
- Change bossHpText init line that reads `this.bossHp`/`this.bossMaxHp` to `this.hp.bossHp`/`this.hp.bossMaxHp`

**`onWordComplete()` changes:** Replace `this.bossHp -= ...` and bossHpText setText calls with `this.hp.bossHp -= ...`.

**`onWrongKey()` changes:**
- Replace `this.playerHp--` with `this.hp.playerHp--`
- Replace `this.playerHp` refs in hpText and end-check with `this.hp.playerHp`

**`startPhase()` note:** The method references `this.bossHp` on line 61 (`Math.min(Math.ceil(this.level.wordCount / this.maxPhases), this.bossHp)`). Update to `this.hp.bossHp`.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: replace manual HP setup with `this.hp = this.setupBossHP(this.level.wordCount)`, update all references
- [ ] Update `startPhase()`, `onWordComplete()`, `onWrongKey()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate FlashWordBoss to setupBossHP`

---

### Task 2 — BoneKnightBoss

**File:** `src/scenes/boss-types/BoneKnightBoss.ts`

**HP source:** `this.level.wordCount` — used on lines 72–73 (`this.bossMaxHp = this.level.wordCount; this.bossHp = this.bossMaxHp`).

**Timer:** Has inline countdown. Lines 79–88:
```typescript
this.timeLeft = this.level.timeLimit
this.timerEvent = this.time.addEvent({
    delay: 1000, repeat: this.level.timeLimit - 1,
    callback: () => {
        this.timeLeft--
        this.timerText.setText(`${this.timeLeft}s`)
        if (this.timeLeft <= 0) this.endLevel(false)
    }
})
```

**Fields to remove:**
- `private bossHp = 0` (line 28)
- `private bossMaxHp = 0` (line 29)
- `private playerHp = 5` (line 30)
- `private timeLeft = 0` (line 31)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to the import from `'../BaseBossScene'`.

**`init()` changes:** Remove `this.playerHp = 5` (line 40).

**`create()` changes:**
- Remove lines 72–73 (manual bossMaxHp/bossHp init) and lines 79–88 (inline timer block).
- Replace HP setup with: `this.hp = this.setupBossHP(this.level.wordCount)`
- Replace timer block with:
  ```typescript
  if (this.level.timeLimit) {
      this.timerEvent = this.setupBossTimer(this.level.timeLimit, this.timerText, () => this.endLevel(false))
  }
  ```
- Update hpText and bossHpText init lines.

**`onWordComplete()` changes:** Replace `this.bossHp -= ...` and bossHpText setText with `this.hp.bossHp`. No `playerHp` used here.

**`onWrongKey()` changes:** Replace `this.playerHp--`, hpText, and `this.playerHp <= 0` with `this.hp.playerHp`.

**Note:** `timerEvent` is also removed in `endLevel()` — keep that line, just change `endLevel` to not remove a field that was already removed. The `timerEvent` optional field declaration on line 32 stays.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: replace manual HP setup with `this.setupBossHP`, replace inline timer with `this.setupBossTimer`; update all HUD refs
- [ ] Update `onWordComplete()` and `onWrongKey()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate BoneKnightBoss to setupBossHP/setupBossTimer`

---

### Task 3 — GrizzlefangBoss

**File:** `src/scenes/boss-types/GrizzlefangBoss.ts`

**HP source:** Computed with a weakness reduction on lines 83–86:
```typescript
this.bossMaxHp = this.weaknessActive
  ? Math.max(1, Math.floor(this.level.wordCount * 0.8))
  : this.level.wordCount
this.bossHp = this.bossMaxHp
```
The `wordCount` passed to `setupBossHP` must use this same reduced value. Calculate it first, then pass to `setupBossHP`:
```typescript
const effectiveWordCount = this.weaknessActive
  ? Math.max(1, Math.floor(this.level.wordCount * 0.8))
  : this.level.wordCount
this.hp = this.setupBossHP(effectiveWordCount)
```

**Timer:** Inline countdown on lines 98–107 (same pattern as BoneKnightBoss). Replace with `setupBossTimer`.

**Fields to remove:**
- `private bossHp = 0` (line 21)
- `private bossMaxHp = 0` (line 22)
- `private playerHp = 5` (line 24)
- `private timeLeft = 0` (line 27)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 39).

**`create()` changes:** Replace HP init (lines 83–86) with computed effectiveWordCount + `this.hp = this.setupBossHP(effectiveWordCount)`. Replace timer block (lines 98–107) with `setupBossTimer`. Update all HUD refs.

**`startPhase()` note:** References `this.bossHp` on line 119 (`Math.min(this.wordsPerPhase, this.bossHp)`). Update to `this.hp.bossHp`.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**`onWordComplete()` changes:** Replace `this.bossHp` and `this.bossMaxHp` refs with `this.hp.*`.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: compute effectiveWordCount, replace HP setup with `this.setupBossHP`, replace timer with `this.setupBossTimer`; update all HUD refs
- [ ] Update `startPhase()`, `bossAttack()`, `onWordComplete()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate GrizzlefangBoss to setupBossHP/setupBossTimer`

---

### Task 4 — HydraBoss

**File:** `src/scenes/boss-types/HydraBoss.ts`

**HP source:** HydraBoss uses `totalDefeated`/`targetDefeated` instead of the classic `bossHp`/`bossMaxHp` pattern. The HP fields (`bossHp`, `bossMaxHp`) do NOT exist in this file — the boss uses `totalDefeated` and `targetDefeated` to track progress. `playerHp` still exists.

**Fields to remove:**
- `private playerHp = 5` (line 31)
- `private timeLeft = 0` (line 32)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 43). `targetDefeated` is set from `data.level.wordCount` — leave it unchanged.

**`create()` changes:**
- Add `this.hp = this.setupBossHP(this.targetDefeated)` after hpText init.

  **Important:** `this.hp.bossHp`/`this.hp.bossMaxHp` are not used for the heads-defeated counter (`bossHpText` uses `totalDefeated`/`targetDefeated`). `setupBossHP` is called solely to set the correct `playerHp` of 3. So pass `this.targetDefeated` as wordCount (or any positive value) and rely only on `this.hp.playerHp`.

- Replace inline timer block (lines 105–115) with `setupBossTimer`.
- Update hpText init line to use `this.hp.playerHp`.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**Timer:** Inline countdown on lines 104–115. Replace with `setupBossTimer`.

**Note:** `regrowTimer` (line 34) is an attack timer, NOT a countdown — leave it alone.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: add `this.hp = this.setupBossHP(this.targetDefeated)`, update hpText init, replace timer with `setupBossTimer`
- [ ] Update `bossAttack()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate HydraBoss to setupBossHP/setupBossTimer`

---

### Task 5 — ClockworkDragonBoss

**File:** `src/scenes/boss-types/ClockworkDragonBoss.ts`

**HP source:** Uses `totalDefeated`/`targetDefeated` (same as HydraBoss). No `bossHp`/`bossMaxHp` fields. `playerHp` exists.

**Fields to remove:**
- `private playerHp = 5` (line 35)
- `private timeLeft = 0` (line 36)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 46).

**`create()` changes:**
- Add `this.hp = this.setupBossHP(this.targetDefeated)` after creating the HUD.
- Update hpText init line to `this.hp.playerHp`.
- Replace inline timer block (lines 110–121) with `setupBossTimer`.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**Note:** `attackTimer` (line 37) is a periodic boss attack timer, NOT a countdown — leave it alone. Only replace the `timerEvent` countdown block.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: add `this.hp = this.setupBossHP(this.targetDefeated)`, update hpText init, replace timer with `setupBossTimer`
- [ ] Update `bossAttack()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate ClockworkDragonBoss to setupBossHP/setupBossTimer`

---

### Task 6 — SpiderBoss

**File:** `src/scenes/boss-types/SpiderBoss.ts`

**HP source:** SpiderBoss has custom HP logic — `bossMaxHp` is derived from `wordCount / 8` (waves), not wordCount directly (lines 51–53 in `init()`):
```typescript
this.bossMaxHp = Math.ceil(data.level.wordCount / 8)
this.bossHp = this.bossMaxHp
```
This calculation happens in `init()`, not `create()`. The `hp` field must be initialized in `create()` after the scene has `this.bossMaxHp` computed... but wait: with `setupBossHP`, the wordCount you pass becomes `bossHp` and `bossMaxHp`. You need to pass `Math.ceil(this.level.wordCount / 8)` to `setupBossHP`.

**Fields to remove:**
- `private bossHp = 0` (line 31)
- `private bossMaxHp = 0` (line 32)
- `private playerHp = 5` (line 33)
- `private timeLeft = 0` (line 36)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 45) and the `bossMaxHp`/`bossHp` assignments (lines 51–53). Keep `this.lettersToSpawn = data.level.wordCount` unchanged.

**`create()` changes:**
- Add `this.hp = this.setupBossHP(Math.ceil(this.level.wordCount / 8))` at the start of create (or after preCreate).
- Update hpText init to `this.hp.playerHp`.
- Update bossHpText init to `this.hp.bossHp`/`this.hp.bossMaxHp`.
- Replace inline timer block (lines 95–105) with `setupBossTimer`.

**`waveComplete()` changes:** Replace `this.bossHp -= ...` and bossHpText setText with `this.hp.bossHp`. Update `this.bossHp <= 0` check to `this.hp.bossHp <= 0`. Update the phase-progression calculation on line 273 (`(this.bossMaxHp - this.bossHp) / this.bossMaxHp`) to use `this.hp.*`.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**Steps:**
- [ ] Read the file carefully (HP is initialized in `init()` not `create()`, and uses custom wave math)
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp`, `timeLeft` fields
- [ ] Remove HP assignments from `init()`, remove `this.playerHp = 5`
- [ ] In `create()`: add `this.hp = this.setupBossHP(Math.ceil(this.level.wordCount / 8))`, update HUD refs, replace timer with `setupBossTimer`
- [ ] Update `waveComplete()` and `bossAttack()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate SpiderBoss to setupBossHP/setupBossTimer`

---

### Task 7 — SlimeKingBoss

**File:** `src/scenes/boss-types/SlimeKingBoss.ts`

**HP source:** SlimeKingBoss does not use `bossHp`/`bossMaxHp` fields at all — the boss HP display shows only `this.slimes.length`. The `playerHp` field still exists.

**Timer:** No countdown timer at all. No `timerText`, no `timerEvent`.

**Fields to remove:**
- `private playerHp = 5` (line 25)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 33).

**`create()` changes:**
- Add `this.hp = this.setupBossHP(this.level.wordCount)` after preCreate/HUD setup.
- Update hpText init to `this.hp.playerHp`.

**Note:** `attackTimer` is a recurring boss attack (not a countdown) — leave it completely alone.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**Steps:**
- [ ] Read the file (no timer migration needed, attackTimer is NOT a countdown)
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `playerHp` field
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: add `this.hp = this.setupBossHP(this.level.wordCount)`, update hpText init
- [ ] Update `bossAttack()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate SlimeKingBoss to setupBossHP`

---

### Task 8 — TypemancerBoss

**File:** `src/scenes/boss-types/TypemancerBoss.ts`

**HP source:** `this.level.wordCount` directly (lines 74–75: `this.bossMaxHp = this.level.wordCount; this.bossHp = this.bossMaxHp`).

**Timer:** Inline countdown on lines 82–91. Replace with `setupBossTimer`.

**Fields to remove:**
- `private bossHp = 0` (line 21)
- `private bossMaxHp = 0` (line 22)
- `private playerHp = 5` (line 23)
- `private timeLeft = 0` (line 25)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 35).

**`create()` changes:**
- Replace lines 74–75 with `this.hp = this.setupBossHP(this.level.wordCount)`.
- Update hpText and bossHpText init lines.
- Replace timer block (lines 82–91) with `setupBossTimer`.

**`startPhase()` note:** References `this.bossHp` on lines 111 (`Math.min(this.wordsPerPhase, this.bossHp)`) and in the phase-progression check on line 155 (`this.bossHp > 0`). Update both to `this.hp.bossHp`.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**`onWordComplete()` changes:** `this.bossHp -= wordsCompleted` and bossHpText setText. Update to `this.hp.bossHp`.

**`onWrongKey()` changes (phase 4 accuracy):** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: replace manual HP setup with `this.setupBossHP`, replace timer with `this.setupBossTimer`; update all HUD refs
- [ ] Update `startPhase()`, `bossAttack()`, `onWordComplete()`, `onWrongKey()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate TypemancerBoss to setupBossHP/setupBossTimer`

---

### Task 9 — DiceLichBoss

**File:** `src/scenes/boss-types/DiceLichBoss.ts`

**HP source:** `this.level.wordCount` directly (lines 78–79: `this.bossMaxHp = this.level.wordCount; this.bossHp = this.bossMaxHp`).

**Timer:** Inline countdown on lines 85–95. Replace with `setupBossTimer`.

**Fields to remove:**
- `private bossHp = 0` (line 23)
- `private bossMaxHp = 0` (line 24)
- `private playerHp = 5` (line 25)
- `private timeLeft = 0` (line 28)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 37).

**`create()` changes:**
- Replace lines 78–79 with `this.hp = this.setupBossHP(this.level.wordCount)`.
- Update hpText and bossHpText init lines.
- Replace timer block (lines 85–95) with `setupBossTimer`.

**`startPhase()` note:** References `this.bossHp` on lines 107 (`Math.min(this.wordsPerPhase, this.bossHp)`) and 142 (`this.bossHp > 0`). Update to `this.hp.bossHp`.

**`bossAttack()` changes:** Replace `this.playerHp -= damage` and `this.playerHp` refs with `this.hp.playerHp`.

**`onWordComplete()` changes:** `this.bossHp -= damageToBoss`, bossHpText setText, `if (this.bossHp < 0) this.bossHp = 0`. Update to `this.hp.bossHp`.

**`onWrongKey()` changes (critical strike curse 6):** Replace `this.playerHp -= 2` and `this.playerHp` refs with `this.hp.playerHp`.

**Note:** `attackTimer` in this scene is a per-word periodic attack (reset in `loadNextWord()`), not a countdown. Leave it alone.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: replace manual HP setup with `this.setupBossHP`, replace timer with `this.setupBossTimer`; update all HUD refs
- [ ] Update `startPhase()`, `bossAttack()`, `onWordComplete()`, `onWrongKey()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate DiceLichBoss to setupBossHP/setupBossTimer`

---

### Task 10 — AncientDragonBoss

**File:** `src/scenes/boss-types/AncientDragonBoss.ts`

**HP source:** `this.level.wordCount` directly (lines 63–64: `this.bossMaxHp = this.level.wordCount; this.bossHp = this.bossMaxHp`).

**Timer:** Inline countdown on lines 70–80. Replace with `setupBossTimer`.

**Fields to remove:**
- `private bossHp = 0` (line 19)
- `private bossMaxHp = 0` (line 20)
- `private playerHp = 5` (line 22)
- `private timeLeft = 0` (line 24)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 32).

**`create()` changes:**
- Replace lines 63–64 with `this.hp = this.setupBossHP(this.level.wordCount)`.
- Update hpText and bossHpText init lines.
- Replace timer block (lines 70–80) with `setupBossTimer`.

**`startPhase()` note:** References `this.bossMaxHp` on lines 91 (`Math.ceil(this.bossMaxHp / this.maxPhases)`) and `this.bossHp` on lines 92, 125. Update to `this.hp.bossMaxHp` and `this.hp.bossHp`.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**`onWordComplete()` changes:** `this.bossHp -= (wordsInSentence + powerBonus)` and bossHpText setText. Update to `this.hp.bossHp`/`this.hp.bossMaxHp`.

**Note:** `attackTimer` is a periodic boss attack timer — leave it alone.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: replace manual HP setup with `this.setupBossHP`, replace timer with `this.setupBossTimer`; update all HUD refs
- [ ] Update `startPhase()`, `bossAttack()`, `onWordComplete()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate AncientDragonBoss to setupBossHP/setupBossTimer`

---

### Task 11 — BaronTypoBoss

**File:** `src/scenes/boss-types/BaronTypoBoss.ts`

**HP source:** `this.level.wordCount` directly (lines 68–69: `this.bossMaxHp = this.level.wordCount; this.bossHp = this.bossMaxHp`).

**Timer:** Inline countdown on lines 75–85. Replace with `setupBossTimer`.

**Fields to remove:**
- `private bossHp = 0` (line 20)
- `private bossMaxHp = 0` (line 21)
- `private playerHp = 5` (line 23)
- `private timeLeft = 0` (line 26)

**Field to add:**
- `private hp!: BossHPState`

**Import change:** Add `BossHPState` to import.

**`init()` changes:** Remove `this.playerHp = 5` (line 33).

**`create()` changes:**
- Replace lines 68–69 with `this.hp = this.setupBossHP(this.level.wordCount)`.
- Update hpText and bossHpText init lines.
- Replace timer block (lines 75–85) with `setupBossTimer`.

**`startPhase()` note:** References `this.bossHp` on line 96 (`Math.min(this.wordsPerPhase, this.bossHp)`) and in the phase-progression check on line 129 (`this.bossHp > 0`). Update both to `this.hp.bossHp`.

**`bossAttack()` changes:** Replace `this.playerHp--` and `this.playerHp` refs with `this.hp.playerHp`.

**`onWordComplete()` changes:** `this.bossHp -= (1 + powerBonus)` and bossHpText setText. Update to `this.hp.bossHp`/`this.hp.bossMaxHp`.

**Note:** `attackTimer` is a periodic boss attack timer — leave it alone.

**Steps:**
- [ ] Read the file
- [ ] Add `BossHPState` to import
- [ ] Add `private hp!: BossHPState` field, remove `bossHp`, `bossMaxHp`, `playerHp`, `timeLeft` fields
- [ ] Remove `this.playerHp = 5` from `init()`
- [ ] In `create()`: replace manual HP setup with `this.setupBossHP`, replace timer with `this.setupBossTimer`; update all HUD refs
- [ ] Update `startPhase()`, `bossAttack()`, `onWordComplete()` refs
- [ ] Run `npm run test`
- [ ] Commit: `refactor: migrate BaronTypoBoss to setupBossHP/setupBossTimer`

---

## Summary of Special Cases

| Scene | Has countdown timer? | HP source | Notes |
|---|---|---|---|
| FlashWordBoss | No | `this.level.wordCount` | No timer migration |
| BoneKnightBoss | Yes | `this.level.wordCount` | — |
| GrizzlefangBoss | Yes | `wordCount * 0.8` if weakness active | Compute effectiveWordCount first |
| HydraBoss | Yes | `targetDefeated` (= `wordCount`) | Uses `totalDefeated` counter, not hp.bossHp |
| ClockworkDragonBoss | Yes | `targetDefeated` (= `wordCount`) | Uses `totalDefeated` counter, not hp.bossHp |
| SpiderBoss | Yes | `ceil(wordCount / 8)` | Custom wave-based HP, compute in `create()` |
| SlimeKingBoss | No | `wordCount` (cosmetic only) | attackTimer is NOT a countdown; no timer migration |
| TypemancerBoss | Yes | `this.level.wordCount` | 5 phases; onWrongKey (phase 4) also uses playerHp |
| DiceLichBoss | Yes | `this.level.wordCount` | onWrongKey (curse 6) also uses playerHp |
| AncientDragonBoss | Yes | `this.level.wordCount` | Sentence-based; bossMaxHp used in startPhase |
| BaronTypoBoss | Yes | `this.level.wordCount` | — |
