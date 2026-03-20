# Refactoring Design: Maintainability Improvements

**Date:** 2026-03-19
**Status:** Approved
**Motivation:** Proactive future-proofing — no immediate pain, but invest now in testability and reducing duplication before they become problems.

---

## Context

Keyboard Quest has ~21,900 lines of TypeScript across ~70 files. The codebase is well-structured with clear separation of concerns (scenes, components, data, utils, art). However two maintainability problems have grown alongside the game:

1. **Boilerplate duplication across 26 level/boss scenes.** Every scene independently implements the same ~50–100 lines of initialization (avatar setup, HUD, word pool, TypingEngine, endLevel routing). Any change to shared logic requires editing 20+ files. Estimated ~1,500–2,000 lines of avoidable duplication.

2. **Game logic embedded in Phaser scenes.** The most complex scenes (SkeletonSwarmLevel at 698 lines, OverlandMapScene at 906 lines, etc.) mix rendering and game logic inseparably. This makes them hard to reason about and impossible to unit test without Phaser mocks.

---

## Goals

- Eliminate boilerplate duplication across all 26 level/boss scenes
- Enable real unit tests for complex game logic without Phaser dependencies
- Improve navigability of the largest scene files
- Introduce a constants file to centralize magic numbers
- Increase test coverage meaningfully (current estimate: ~5–10%)

## Non-Goals

- Optimizing for adding new level types (no new types planned)
- Changing any game mechanics or player-visible behavior
- Full test coverage of all scenes (Phaser scenes remain difficult to test; focus is on extracted logic)

---

## Approach: Base Classes + Logic Extraction (applied selectively)

### Part 1: Base Scene Classes

Create two abstract base classes that consolidate shared lifecycle logic:

**`src/scenes/BaseLevelScene.ts`**
**`src/scenes/BaseBossScene.ts`**

**What moves into the base:**

- `init(data: { level: LevelConfig; profileSlot: number })` — stores level and profileSlot, resets `finished` flag
- `preCreate()` — avatar rendering, companion/pet setup, GoldManager init, pause setup, TypingEngine construction, word pool generation; called by subclass `create()` as `super.preCreate()`
- `endLevel(passed: boolean)` — guard flag + `scene.start('LevelResult', ...)` with scoring calc
- Protected helpers: `buildHud()`, `getWordPool()`, `setupTypingEngine(config)`

**What stays in subclasses:**

- `create()` — calls `super.preCreate()`, then scene-specific visuals and enemy logic
- `onWordComplete()` / `onWrongKey()` — scene-specific response to typing events
- Any unique state (wave counters, HP, timers, enemy arrays, etc.)

**Phaser lifecycle note:** Phaser calls `init()`, `preload()`, and `create()` by convention. Subclasses must call `super.init(data)` at the top of their own `init()` override. The `preCreate()` helper is NOT called by Phaser directly — it must be explicitly called by each subclass at the top of its `create()` method. This is documented in the base class JSDoc.

**Scenes that deviate from the standard contract:**

- `CharacterCreatorLevel` calls `scene.start('OverlandMap')` directly rather than routing through `LevelResultScene`. It must override `endLevel()` to preserve this behavior. The base `endLevel()` is not suitable for it as-is.
- Any other scene with atypical teardown should similarly override `endLevel()` and document why.

**`BaseBossScene`** shares the same contract as `BaseLevelScene` (same `init`, `preCreate`, `endLevel`, and Phaser lifecycle notes apply). The only meaningful difference is that boss scenes route through `BossBattleScene` rather than being started directly, and some bosses use `SpellCaster` — the base class should conditionally set it up if `level.spells` is non-empty.

**Expected outcome:** ~50–100 lines removed from each of 26 scenes ≈ 1,500+ lines deleted, replaced by ~200 lines in two base classes.

**Scene migration regression checklist (minimum smoke-test per scene):**

After migrating each scene to use the base class:
1. Navigate to that level from the overland map
2. Complete the LevelIntro by typing the level name
3. Type at least one word successfully — verify it registers in the scene
4. Let the level end (pass or fail) — verify `LevelResultScene` loads with correct data
5. Click Continue — verify it returns to `OverlandMapScene`

For `CharacterCreatorLevel` specifically: complete it and verify `OverlandMapScene` loads directly (no LevelResult).

---

### Part 2: Logic Extraction for Complex Scenes

For the 5 most complex scenes, extract game logic into plain TypeScript controller classes with zero Phaser imports. Scenes become thin renderers that delegate decisions to controllers.

**Controller contract:**
- Accepts game state as constructor args or method params
- Returns new state or typed event objects (no side effects)
- No `this.scene`, no Phaser API calls
- Fully unit testable with plain Vitest

**Target scenes:**

| Scene | Type | Controller | Logic to Extract |
|---|---|---|---|
| `SkeletonSwarmLevel` (698 lines) | level-type | `WaveController` | Wave sequencing, skeleton state machine, separation physics |
| `DungeonPlatformerLevel` (533 lines) | level-type | `PlatformerController` | Obstacle state, scroll position, collision logic |
| `CrazedCookLevel` (485 lines) | level-type | `KitchenController` | Cook pathfinding, order assignment, patience decay |
| `OverlandMapScene` (906 lines) | standalone | `MapNavigationController` | Node unlocking, world transition logic, pan bounds calculation |
| `CharacterScene` (622 lines) | standalone | `InventoryController` | Equipment equipping, stat calculations, item filtering |

The first three scenes are level-types and will also inherit from `BaseLevelScene`. `OverlandMapScene` and `CharacterScene` are standalone Phaser scenes — they receive controller extraction only and do **not** inherit from either base class.

Controllers live in `src/controllers/`.

**Scene/controller boundary example:**

```typescript
// Controller — pure TypeScript, no Phaser
class WaveController {
  constructor(config: WaveConfig) { ... }
  tick(dt: number): WaveEvent[]  // events: SpawnEvent, WaveCompleteEvent, etc.
  markDefeated(id: string): WaveEvent[]
  get currentWave(): number
  get isComplete(): boolean
}

// Scene — thin renderer
update(time: number, delta: number) {
  const events = this.waveController.tick(delta)
  for (const e of events) this.handleEvent(e)
}

private handleEvent(e: WaveEvent) {
  if (e.type === 'spawn') this.spawnSkeleton(e.x, e.y, e.word)
  if (e.type === 'wave_complete') this.showWaveBanner(e.waveNumber)
}
```

---

### Part 3: Constants & Test Infrastructure

**`src/constants.ts`** — single file for all magic numbers currently scattered across 26 scenes:

```typescript
export const AVATAR_X = 100
export const AVATAR_SCALE = 1.5
export const HUD_HP_FONT_SIZE = '22px'
export const TYPING_ENGINE_Y_OFFSET = 80
// ~30 total constants
```

**Test strategy:**

- Controllers test with plain Vitest — no Phaser mocking needed
- Base class logic tested via a minimal concrete subclass (test double)
- Smaller level scenes: integration-style tests covering `init()` data wiring and `endLevel()` routing using the existing Vitest setup

---

## File Structure After Refactor

```
src/
├── scenes/
│   ├── BaseLevelScene.ts       # NEW — abstract base for all level types
│   ├── BaseBossScene.ts        # NEW — abstract base for all boss types
│   ├── level-types/            # 14 files, each now ~100–200 lines (down from ~200–700)
│   └── boss-types/             # 12 files, each now ~100–250 lines (down from ~194–419)
├── controllers/                # NEW directory
│   ├── WaveController.ts
│   ├── MapNavigationController.ts
│   ├── InventoryController.ts
│   ├── PlatformerController.ts
│   └── KitchenController.ts
└── constants.ts                # NEW — centralized magic numbers
```

---

## Testing Targets

After the refactor, the following should have unit test coverage:

- `WaveController` — wave sequencing, defeat tracking, completion detection
- `MapNavigationController` — node unlock logic, pan bounds, world transition conditions
- `InventoryController` — equip/unequip, stat deltas, filtering
- `PlatformerController` — obstacle state transitions, scroll math, collision detection
- `KitchenController` — cook pathfinding, patience decay, order completion
- `BaseLevelScene` shared logic — via test double subclass

---

## Implementation Order

1. `src/constants.ts` — low-risk, standalone, unblocks everything
2. `BaseLevelScene` + migrate all 14 level scenes — biggest duplication win
3. `BaseBossScene` + migrate all 12 boss scenes
4. `WaveController` + refactor `SkeletonSwarmLevel`
5. `KitchenController` + refactor `CrazedCookLevel`
6. `PlatformerController` + refactor `DungeonPlatformerLevel`
7. `InventoryController` + refactor `CharacterScene`
8. `MapNavigationController` + refactor `OverlandMapScene`

Each step is independently committable and leaves the game in a working state.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Breaking a scene during base class migration | Migrate and smoke-test each scene per the regression checklist before moving to the next |
| Controller boundary misses a Phaser dependency | Start with the most isolated logic; use TypeScript's import checker to enforce no Phaser imports in controllers |
| Over-engineering controllers for simple scenes | Only 5 scenes get full extraction; remaining 21 just use the base class |
| Subclass forgets to call `super.preCreate()` | Add a boolean guard in `BaseLevelScene`/`BaseBossScene` that is set by `preCreate()` and checked at the top of `endLevel()` — if not set, throw a descriptive error in development |
