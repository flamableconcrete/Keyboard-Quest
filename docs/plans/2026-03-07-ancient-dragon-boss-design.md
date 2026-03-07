# Design Doc: AncientDragonBoss Implementation

## Overview
Implement the `AncientDragonBoss` as Task 17 of Keyboard Quest. This boss introduces "Sentence Mode" where the player types full sentences instead of single words.

## Mechanics
- **Sentence Mode:** The player types a sequence of words separated by spaces.
- **TypingEngine Update:**
    - Support the space character (` `) as a valid key.
    - Provide a visual indicator (`·`) for untyped spaces to help the player distinguish them.
    - Backward compatible: Single-word levels continue to work without change.
- **Phases (3 Total):**
    - Phase 1: 2-3 words per sentence.
    - Phase 2: 4-5 words per sentence.
    - Phase 3: 6+ words per sentence.
    - `wordCount` from `level.wordCount` is the total number of words across all sentences.
- **Attacks:** Fire breath (shake/flash) occurs periodically, reducing player HP.

## Architecture
- **Scene:** `AncientDragonBoss.ts` (inherits from `Phaser.Scene`).
- **Components:** `TypingEngine.ts` handles keyboard input and rendering.
- **Utils:** Uses `getWordPool` from `words.ts` for sentence generation.

## Implementation Details
1.  **TypingEngine Extension:**
    - Modify `handleKey` to treat space as a valid keystroke if it's the expected character.
    - Update `renderWord` to render `·` when a space is expected but not yet typed.
2.  **AncientDragonBoss Scene:**
    - Structure it similarly to `GrizzlefangBoss`.
    - Distribute `level.wordCount` across the 3 phases.
    - Calculate sentences for each phase based on difficulty.
    - Damage boss on sentence completion.
3.  **Registration:** Add `AncientDragonBoss` to `src/main.ts`.

## Testing
- Verify that words with spaces can be typed.
- Verify that `·` appears for spaces.
- Verify that existing single-word levels still work as expected.
- Verify level completion and transition to `LevelResult`.
