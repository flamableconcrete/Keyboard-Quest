# Design Doc: Keyboard Quest Phase 11 — Polish & Achievements

**Date:** 2026-03-07
**Status:** Approved

## 1. Overview
Implement the final set of features and polish from the original design document, focusing on high-level achievements, tutorial enhancements, and narrative-mechanical integration.

## 2. Solo Scribe & World Mastery
### Data Changes
- Update `LevelResult` in `src/types/index.ts` to include `companionUsed: boolean`.
- Update `ProfileData` to track `worldMasteryRewards: string[]` to prevent duplicate rewards.

### Solo Scribe Title
- **Logic:** In `LevelResultScene`, after defeating any boss, check `profile.levelResults`.
- **Condition:** If all `isBoss: true` levels in the current profile have `companionUsed: false`, award the "Solo Scribe" title.

### World Mastery Rewards
- **Logic:** In `OverlandMapScene`, calculate the total stars for the current world.
- **Threshold:** `totalStars === levelsInWorld * 10`.
- **Reward:** On reaching 100% stars in a world, a "Mastery Chest" appears, awarding rare equipment (e.g., "Speed Boots" for World 1, "Rune Plate" for World 3).

## 3. Animated Tutorial Hands
### Component: `TutorialHands.ts`
- **Location:** `src/components/TutorialHands.ts`.
- **Behavior:** Renders a 10-finger hand layout (semi-transparent).
- **Phasing:** Active in `w1_l1` (Character Creator) and during `CutsceneScene` (letter restores).
- **Animation:** 
    - Highlights the finger corresponding to the `nextChar` provided by the `TypingEngine`.
    - Plays a simple "tap" (scale down/up) animation when the key is pressed.

## 4. Monster Manual Integration
### Weakness Buff
- **Logic:** Completing a `MonsterManualLevel` sets a `bossWeaknessKnown: string` (bossId) in the profile.
- **Effect:** In `BossBattleScene`, if `profile.bossWeaknessKnown === level.bossId`, apply a "Weakness Found!" buff.
- **Modifier:** 
    - Boss timer slowed by 20% OR
    - Player "Power" stat treated as +5 for that battle.
- **Consumption:** The flag is cleared after the boss battle is completed (win or fail).

## 5. Implementation Roadmap
1. **Task A:** Update `types/index.ts` and `scoring.ts` to support new achievement logic.
2. **Task B:** Implement `TutorialHands` and integrate into `LevelScene` and `CutsceneScene`.
3. **Task C:** Update `OverlandMap` with Mastery Chest UI and logic.
4. **Task D:** Wire Monster Manual "Weakness Found" logic into boss battles.
