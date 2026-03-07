# Keyboard Quest Phase 11 — Polish & Achievements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement final polish, tutorial hands, and the "Solo Scribe" achievement system.

**Architecture:** Data-driven achievements and a new `TutorialHands` component integrated into the `TypingEngine` and `LevelResult` scenes.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

### Task 1: Update Types and Scoring logic

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/scoring.ts`
- Test: `src/utils/scoring.test.ts`

**Step 1: Update `LevelResult` and `ProfileData` types**
Add `companionUsed: boolean` to `LevelResult` and `worldMasteryRewards: string[]` to `ProfileData`.

**Step 2: Add `checkWorldMastery` utility to `scoring.ts`**
Implement logic to check if a world is 100% 10-starred.

**Step 3: Commit**
```bash
git add src/types/index.ts src/utils/scoring.ts
git commit -m "feat: update types and scoring for world mastery"
```

---

### Task 2: Solo Scribe and Mastery UI in LevelResultScene

**Files:**
- Modify: `src/scenes/LevelResultScene.ts`

**Step 1: Track `companionUsed` in the scene**
If `activeCompanionId` or `activePetId` was set during the level, mark `companionUsed: true`.

**Step 2: Add Solo Scribe check**
In `create()`, check if all boss results in `profile.levelResults` have `companionUsed: false`.

**Step 3: Commit**
```bash
git add src/scenes/LevelResultScene.ts
git commit -m "feat: add Solo Scribe achievement logic"
```

---

### Task 3: TutorialHands Component

**Files:**
- Create: `src/components/TutorialHands.ts`

**Step 1: Define finger mapping**
Map each key (QWERTY) to one of 10 fingers.

**Step 2: Implement `highlightFinger(char)`**
Render hand outlines and highlight the specific finger for the character.

**Step 3: Commit**
```bash
git add src/components/TutorialHands.ts
git commit -m "feat: add TutorialHands component"
```

---

### Task 4: Integrate TutorialHands into Scenes

**Files:**
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts` (and others as needed)
- Modify: `src/scenes/CutsceneScene.ts`

**Step 1: Add TutorialHands to w1_l1**
Show hands during the character creator/intro levels.

**Step 2: Add to CutsceneScene**
Show hands during letter unlock animations.

**Step 3: Commit**
```bash
git add src/scenes/level-types/ src/scenes/CutsceneScene.ts
git commit -m "feat: integrate tutorial hands into intro and cutscenes"
```

---

### Task 5: World Mastery Chests in OverlandMap

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

**Step 1: Calculate world completion**
Add a "Mastery Chest" sprite/rectangle that only appears if `checkWorldMastery` returns true for that world.

**Step 2: Award rare items**
On click, award the world-specific mastery item (e.g., Speed Boots).

**Step 3: Commit**
```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: add World Mastery Chests to OverlandMap"
```

---

### Task 6: Monster Manual Weakness Logic

**Files:**
- Modify: `src/scenes/level-types/MonsterManualLevel.ts`
- Modify: `src/scenes/BossBattleScene.ts`

**Step 1: Set weakness flag in MonsterManualLevel**
On completion, set `profile.bossWeaknessKnown = currentWorldBossId`.

**Step 2: Apply buff in Boss Battle**
If flag matches, reduce boss health or slow boss timer.

**Step 3: Commit**
```bash
git add src/scenes/level-types/MonsterManualLevel.ts src/scenes/BossBattleScene.ts
git commit -m "feat: implement Monster Manual weakness buff"
```

---

### Task 7: Final Verification

**Step 1: Verify all new systems**
Play World 1, get 10 stars on all levels, check for Mastery Chest.
Beat a boss without a companion, check for Solo Scribe title.
Verify hands appear in World 1-1.

**Step 2: Run tests**
`npm test`
