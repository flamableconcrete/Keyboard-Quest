# Level Timer Migrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend setupLevelTimer with an optional onTick callback and migrate the 5 remaining level scenes that have inline countdown timers.

**Architecture:** One additive change to BaseLevelScene (optional third param, backward-compatible), then mechanical migration of 5 scenes. DungeonPlatformerLevel uses onTick to preserve its emoji+color timer display.

**Tech Stack:** TypeScript, Phaser 3, Vitest — run tests with `npm run test`

---

## Task 1: Extend `setupLevelTimer` + add test (TDD)

**Files:** `src/scenes/BaseLevelScene.ts`, `src/scenes/BaseLevelScene.test.ts`

### Step 1a: Write the failing test

Add the following test block to `src/scenes/BaseLevelScene.test.ts`, after the existing `describe('BaseLevelScene.setupLevelTimer', ...)` block (after line 117):

```typescript
describe('BaseLevelScene.setupLevelTimer with onTick', () => {
  it('calls onTick with the new remaining value after each decrement', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel, profileSlot: 0 })
    ;(scene as any)._preCreateCalled = true

    let timerCallback: (() => void) | null = null
    ;(scene as any).time = {
      addEvent: (_opts: { delay: number; repeat: number; callback: () => void }) => {
        timerCallback = _opts.callback
        return { remove: () => {} }
      },
      delayedCall: (_ms: number, cb: () => void) => cb(),
    }
    ;(scene as any).scene = { start: () => {}, key: 'Test' }

    const endLevelSpy = vi.fn()
    ;(scene as any).endLevel = endLevelSpy

    const onTickSpy = vi.fn()
    const fakeText = { setText: () => {} }
    ;(scene as any).setupLevelTimer(3, fakeText, onTickSpy)

    expect(timerCallback).not.toBeNull()

    // Fire 3 ticks
    timerCallback!()  // remaining = 2
    timerCallback!()  // remaining = 1
    timerCallback!()  // remaining = 0

    expect(onTickSpy).toHaveBeenCalledTimes(3)
    expect(onTickSpy).toHaveBeenNthCalledWith(1, 2)
    expect(onTickSpy).toHaveBeenNthCalledWith(2, 1)
    expect(onTickSpy).toHaveBeenNthCalledWith(3, 0)
  })
})
```

Run `npm run test` — this test **should fail** because `onTick` is not yet wired up.

### Step 1b: Implement the change

In `src/scenes/BaseLevelScene.ts`, change the `setupLevelTimer` signature and body (lines 165–180):

**Current code:**
```typescript
  protected setupLevelTimer(
    seconds: number,
    displayText: Phaser.GameObjects.Text
  ): Phaser.Time.TimerEvent {
    let timeLeft = seconds
    displayText.setText(`${timeLeft}s`)
    return this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1, // Phaser fires repeat+1 times total
      callback: () => {
        timeLeft--
        displayText.setText(`${timeLeft}s`)
        if (timeLeft <= 0) this.endLevel(false)
      },
    })
  }
```

**Replacement:**
```typescript
  protected setupLevelTimer(
    seconds: number,
    displayText: Phaser.GameObjects.Text,
    onTick?: (remaining: number) => void
  ): Phaser.Time.TimerEvent {
    let timeLeft = seconds
    displayText.setText(`${timeLeft}s`)
    return this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1, // Phaser fires repeat+1 times total
      callback: () => {
        timeLeft--
        displayText.setText(`${timeLeft}s`)
        onTick?.(timeLeft)
        if (timeLeft <= 0) this.endLevel(false)
      },
    })
  }
```

- [ ] Add the failing test to `src/scenes/BaseLevelScene.test.ts`
- [ ] Run `npm run test` — confirm the new test fails
- [ ] Apply the implementation change to `src/scenes/BaseLevelScene.ts`
- [ ] Run `npm run test` — confirm all tests pass
- [ ] Commit: `refactor: extend setupLevelTimer with optional onTick callback`

---

## Task 2: Migrate `DungeonEscapeLevel`

**File:** `src/scenes/level-types/DungeonEscapeLevel.ts`

**Inline timer block to remove** (lines 46–56):
```typescript
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }
```

**Replacement one-liner:**
```typescript
    if (this.level.timeLimit) {
      this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
    }
```

**Additional cleanup:** Remove the `private timeLeft = 0` field (line 8) — it is no longer used after migration.

**`timerEvent?.remove()` in endLevel:** Yes — `endLevel` at line 92 already calls `this.timerEvent?.remove()`. No change needed there.

- [ ] Apply the replacement to `src/scenes/level-types/DungeonEscapeLevel.ts`
- [ ] Remove the `private timeLeft = 0` field
- [ ] Run `npm run test` — confirm all tests pass
- [ ] Commit: `refactor: migrate DungeonEscapeLevel to setupLevelTimer`

---

## Task 3: Migrate `GuildRecruitmentLevel`

**File:** `src/scenes/level-types/GuildRecruitmentLevel.ts`

**Inline timer block to remove** (lines 48–58):
```typescript
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }
```

**Replacement one-liner:**
```typescript
    if (this.level.timeLimit) {
      this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
    }
```

**Additional cleanup:** Remove the `private timeLeft = 0` field (line 9) — it is no longer used after migration.

**`timerEvent?.remove()` in endLevel:** Yes — `endLevel` at line 79 already calls `this.timerEvent?.remove()`. No change needed there.

- [ ] Apply the replacement to `src/scenes/level-types/GuildRecruitmentLevel.ts`
- [ ] Remove the `private timeLeft = 0` field
- [ ] Run `npm run test` — confirm all tests pass
- [ ] Commit: `refactor: migrate GuildRecruitmentLevel to setupLevelTimer`

---

## Task 4: Migrate `MagicRuneTypingLevel`

**File:** `src/scenes/level-types/MagicRuneTypingLevel.ts`

**Inline timer block to remove** (lines 46–56):
```typescript
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }
```

**Replacement one-liner:**
```typescript
    if (this.level.timeLimit) {
      this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
    }
```

**Additional cleanup:** Remove the `private timeLeft = 0` field (line 9) — it is no longer used after migration.

**`timerEvent?.remove()` in endLevel:** Yes — `endLevel` at line 102 already calls `this.timerEvent?.remove()`. No change needed there.

- [ ] Apply the replacement to `src/scenes/level-types/MagicRuneTypingLevel.ts`
- [ ] Remove the `private timeLeft = 0` field
- [ ] Run `npm run test` — confirm all tests pass
- [ ] Commit: `refactor: migrate MagicRuneTypingLevel to setupLevelTimer`

---

## Task 5: Migrate `PotionBrewingLabLevel`

**File:** `src/scenes/level-types/PotionBrewingLabLevel.ts`

**Inline timer block to remove** (lines 48–58):
```typescript
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }
```

**Replacement one-liner:**
```typescript
    if (this.level.timeLimit) {
      this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
    }
```

**Additional cleanup:** Remove the `private timeLeft = 0` field (line 9) — it is no longer used after migration.

**`timerEvent?.remove()` in endLevel:** Yes — `endLevel` at line 103 already calls `this.timerEvent?.remove()`. No change needed there.

- [ ] Apply the replacement to `src/scenes/level-types/PotionBrewingLabLevel.ts`
- [ ] Remove the `private timeLeft = 0` field
- [ ] Run `npm run test` — confirm all tests pass
- [ ] Commit: `refactor: migrate PotionBrewingLabLevel to setupLevelTimer`

---

## Task 6: Migrate `DungeonPlatformerLevel` (special: formatTimer + delete updateTimerDisplay)

**File:** `src/scenes/level-types/DungeonPlatformerLevel.ts`

This scene uses a custom `updateTimerDisplay()` method (lines 237–241) that sets emoji+color formatting:

```typescript
  private updateTimerDisplay() {
    const urgent = this.timeLeft <= 10
    this.timerText.setText(`⏳ ${this.timeLeft}s`)
    this.timerText.setColor(urgent ? '#ff4444' : '#ffcc44')
  }
```

It is called in two places inside the inline timer block (lines 146–158):
```typescript
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.updateTimerDisplay()
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.updateTimerDisplay()
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }
```

**Replacement block** — replace the entire inline timer block above with:
```typescript
    if (this.level.timeLimit) {
      const formatTimer = (remaining: number) => {
        this.timerText.setText(`⏳ ${remaining}s`)
        this.timerText.setColor(remaining <= 10 ? '#ff4444' : '#ffcc44')
      }
      this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText, formatTimer)
      formatTimer(this.level.timeLimit) // fix up initial display (setupLevelTimer sets plain text first)
    }
```

**Then delete the `updateTimerDisplay()` method entirely** (lines 236–241 including the comment):
```typescript
  // ── Timer ────────────────────────────────────────────────────────
  private updateTimerDisplay() {
    const urgent = this.timeLeft <= 10
    this.timerText.setText(`⏳ ${this.timeLeft}s`)
    this.timerText.setColor(urgent ? '#ff4444' : '#ffcc44')
  }
```

**Additional cleanup:** Remove the `private timeLeft = 0` field (line 48) — it is no longer used after migration.

**`timerEvent?.remove()` in endLevel:** Yes — `endLevel` at line 469 already calls `this.timerEvent?.remove()`. No change needed there.

- [ ] Apply the replacement timer block to `src/scenes/level-types/DungeonPlatformerLevel.ts`
- [ ] Delete the `updateTimerDisplay()` method and its section comment
- [ ] Remove the `private timeLeft = 0` field
- [ ] Run `npm run test` — confirm all tests pass
- [ ] Commit: `refactor: migrate DungeonPlatformerLevel to setupLevelTimer`
