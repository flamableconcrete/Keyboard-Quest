# MonsterManual Level Overhaul — Design Spec

**Date:** 2026-03-24
**Status:** Approved

---

## Overview

The MonsterManual level type is a pre-boss lore break where the player types boss-themed phrases from an ancient book. This spec covers three improvements:

1. **Phrase-based typing** — replace random word pools with hand-crafted boss-lore phrases
2. **Visual overhaul** — abandoned library background, giant pixel-art book, page-flip animation
3. **Level placement** — MonsterManual must be second-to-last in every world (immediately before the world boss); World 4 currently has none; Worlds 2, 3, and 5 need reordering with cascading bossGate changes

---

## Data Layer

### LevelConfig change

Add one optional field to `LevelConfig` in `src/types/index.ts`:

```ts
phrases?: string[]  // MonsterManual only; replaces word-pool-based wordCount
```

The `wordCount` field on MonsterManual levels must be updated to match `phrases.length` to keep it in sync. It is no longer used by the scene logic, but must remain set to avoid dead data confusion.

### `initWordPool()` removal

The current `MonsterManualLevel.create()` calls `this.initWordPool()` and renders `this.words.join(' ')` as a paragraph. Both must be removed in the overhauled scene. `this.words` and `this.wordQueue` are not used.

### Phrase design rules

- Phrases are hand-crafted per world/boss
- Each phrase uses **only letters available** at that world's MonsterManual `unlockedLetters` set (exact sets listed below)
- Phrases reveal lore about the upcoming world boss (habitat, danger, weakness, origin)
- Space characters are typeable (engine already supports this; untyped spaces render as `·`)
- No punctuation requiring keystrokes (no apostrophes, commas, etc.) — letters and spaces only

### Phrase count and letter sets per world

| World | Boss | Exact available letters at MonsterManual | Phrase count | Phrase length |
|-------|------|------------------------------------------|--------------|---------------|
| 1 | Grizzlefang the Ogre | `a s d f j k l e n r` (10) | 3 | 2–3 words |
| 2 | Tiamat, the Lexicon Hydra | `a s d f j k l e n r o t i h` (14) | 4 | 3–4 words |
| 3 | Mecha-Wyrm Alpha | `a s d f j k l e n r o t i h c m p u` (18) | 5 | 4–5 words |
| 4 | The Dice Lich | `a s d f j k l e n r o t i h c m p u g b w y v` (23) | 5 | 5–6 words |
| 5 | The Typemancer | full alphabet (26 letters) | 6 | 6–8 words |

Letter sets are derived from the world constants in the source files:

- W1: `W1_AFTER_MB3`
- W2: `W2_AFTER_MB3`
- W3: `W3_AFTER_MB3`
- W4: `W4_AFTER_MB4` (new level placed after the last mini-boss)
- W5: `W5_AFTER_MB4` — this adds q, x, z, and j over `W5_BASE`. Note: j is also in `W1_LETTERS_BASE` (the root constant, line 4 of world1.ts), so it is already present in `W5_BASE` via the inheritance chain. `W5_AFTER_MB4` adds j redundantly, making it appear twice in the array. Functionally this has no effect — all 26 letters are available. World 5 phrases may freely use all 26 letters.

### Sample phrases — World 1 (letters: a s d f j k l e n r)

- `"dark feral dens"`
- `"fear and flee"`
- `"rend and snare"`

All other worlds' phrases to be written during implementation, validated against the exact letter set for that world.

---

## Level Placement

**Rule:** MonsterManual must be the second-to-last level in every world (directly before the world boss).

MonsterManual levels have `bossGate: null` — they are not formally gated and the player can access them after the preceding level completes. (Note: World 1 is an exception where `w1_boss.bossGate` already gates on `w1_l8` — this is preserved, not changed.)

### World 1 — No change

`w1_l8` (MonsterManual) → `w1_boss` ✓ Already second-to-last. Add `phrases`, update `wordCount`, add `timeLimit: 180`.

### World 2 — Reorder + bossGate fix

Current order: `w2_l9` → `w2_l10` (MonsterManual) → `w2_mb4` → `w2_boss`

Move `w2_l10` to after `w2_mb4`:

New order: `w2_l9` → `w2_mb4` → `w2_l10` (MonsterManual) → `w2_boss`

Changes required:

- `w2_mb4.bossGate`: change from `{ minCombinedStars: 12, levelIds: ['w2_l9', 'w2_l10'] }` to `{ minCombinedStars: 6, levelIds: ['w2_l9'] }`. The total required stars drops from 12 to 6. This is intentional: halving the required total when removing one of two levels preserves the per-level average (6 avg). The gate remains meaningful for a single level (6 stars from 1 level = minimum 1-star + 5-star or 2-star + 4-star combination on that level).
- `w2_l10.bossGate`: set to `null`
- `w2_l10.unlockedLetters`: keep as `W2_AFTER_MB3` (unchanged — same letter set regardless of position)
- `w2_l10.timeLimit`: change from `null` to `180`
- `w2_boss.bossGate`: unchanged (gates on mini-bosses, not on MonsterManual)
- Add `phrases` to `w2_l10`, update `wordCount`

### World 3 — Reorder + bossGate fix

Current order: `w3_l8` → `w3_l9` (MonsterManual) → `w3_mb4` → `w3_boss`

Move `w3_l9` to after `w3_mb4`:

New order: `w3_l8` → `w3_mb4` → `w3_l9` (MonsterManual) → `w3_boss`

Changes required:

- `w3_mb4.bossGate`: change from `{ minCombinedStars: 16, levelIds: ['w3_l8', 'w3_l9'] }` to `{ minCombinedStars: 8, levelIds: ['w3_l8'] }`. The total required stars drops from 16 to 8. This is intentional: halving the required total when removing one of two levels preserves the per-level average (8 avg).
- `w3_l9.bossGate`: set to `null`
- `w3_l9.unlockedLetters`: keep as `W3_AFTER_MB3` (unchanged)
- `w3_l9.timeLimit`: change from `null` to `240`
- `w3_boss.bossGate`: unchanged
- Add `phrases` to `w3_l9`, update `wordCount`

### World 4 — New level added

No MonsterManual currently exists. Add new level `w4_mm` between `w4_mb4` and `w4_boss`.

New order: `w4_mb4` → `w4_mm` (new MonsterManual) → `w4_boss`

New level config (authoring the `name` and `dialogue` is in scope for this ticket):

```ts
{
  id: 'w4_mm',
  name: '<name TBD — a scholar NPC setting that introduces The Dice Lich>',
  type: 'MonsterManual',
  world: 4,
  unlockedLetters: W4_AFTER_MB4,
  wordCount: 5,  // matches phrases.length
  timeLimit: 240,
  dialogue: [ /* TBD — scholar NPC introduces The Dice Lich, in the style of existing MM dialogue */ ],
  rewards: { xp: 500 },
  bossGate: null,
  phrases: [ /* 5 phrases about The Dice Lich, using only W4_AFTER_MB4 letters */ ],
}
```

- `w4_boss.bossGate`: unchanged (gates on mini-bosses only; `w4_mm` is accessible but not formally required, consistent with the W2/W3/W5 pattern)

### World 5 — Major reorder + bossGate fix

Current order: `w5_l1` → `w5_l2` → `w5_l3` (MonsterManual) → `w5_mb1` → ... → `w5_mb4` → `w5_boss`

`w5_l3` is near the start of the world, not second-to-last. Move it to after `w5_mb4`:

New order: `w5_l1` → `w5_l2` → `w5_mb1` → ... → `w5_mb4` → `w5_l3` (MonsterManual) → `w5_boss`

Changes required:

- `w5_mb1.bossGate`: change from `{ minCombinedStars: 20, levelIds: ['w5_l1', 'w5_l2', 'w5_l3'] }` to `{ minCombinedStars: 12, levelIds: ['w5_l1', 'w5_l2'] }`. Total required stars drops from 20 to 12 (one level removed); this is intentional.
- `w5_l3.bossGate`: set to `null`
- `w5_l3.unlockedLetters`: change from `W5_BASE` to `W5_AFTER_MB4` (full alphabet — q, x, z are the meaningful additions)
- `w5_l3.timeLimit`: change from `null` to `300`
- `w5_boss.bossGate`: unchanged
- Add `phrases` to `w5_l3`, update `wordCount`

---

## Visual Design

### Background — Abandoned Crumbling Library

Built from Phaser Graphics primitives (no external assets):

- Deep navy/charcoal base fill
- Tall bookshelves on left and right edges: stacked rectangles with horizontal shelf lines; irregular "book spine" rectangles in muted dusty reds, greens, and browns
- Crumbling detail: small debris rectangles at shelf bases; a few books tilted or fallen
- Broken window center-back: jagged polygon outline; moonlight as a pale cyan/white semi-transparent triangle cutting diagonally across the floor
- Vines: chains of short diagonal line segments draping from upper corners and over shelves
- Dust motes: ~15 tiny rectangles drifting slowly upward with gentle sine-wave wobble via Phaser tweens (no particle system)

### The Book — Giant Pixel Art Tome

Centered on screen, approximately 560×400px. Built from Phaser Graphics primitives.

- **Two-page spread:** left page (darker/worn parchment — decorative) and right page (active typing page, lighter parchment)
- **Spine:** thick dark leather-brown center strip
- **Binding border:** dark leather-brown outer frame with pixel-art corner "jewels" (small colored squares at each corner)
- **Rune border:** faint gold/amber dotted pixel border around the right page interior
- **Left page contents:**
  - Small pixel-art boss silhouette sketch (simple shapes — e.g. a claw for Grizzlefang, a hydra head for Tiamat)
  - Page counter: `"Page 1 / 3"` in small muted text
- **Right page contents:**
  - Italic header: `"Entry: [Boss Name]"` in small amber text above the typing line
  - TypingEngine character texts rendered directly over the page

### TypingEngine positioning

The `TypingEngine` is positioned so its character texts land in the center of the right page's text area. The engine's existing character coloring applies:

- Green = typed, White = current, Gray = remaining
- Space = `·` when untyped (already handled by the engine)

The `TypingEngine` does not support being parented to a Phaser `Container`. The engine texts sit at fixed screen coordinates overlapping the book page visually — they are not part of any container and do not move with a flip animation. This is acceptable for the simple flip style chosen (see Page Flip section).

---

## Page Flip Animation

Triggered on each phrase completion, before loading the next phrase.

The "right page" is a `Phaser.GameObjects.Container` holding only the static Graphics of the right page (parchment, rune border, header text). The TypingEngine character texts are **not** in this container.

The left page (parchment, boss sketch, page counter text) is built from standalone `Phaser.GameObjects` — not in any container. The page counter `Phaser.GameObjects.Text` is updated by reference in step g below.

**Keyboard input blocking** is achieved implicitly: after `engine.clearWord()`, `TypingEngine.handleKey` returns early because `this.currentWord` is empty. Input resumes only when `engine.setWord(nextPhrase)` is called. No explicit enable/disable API is needed.

Sequence:

1. **At create() time:** Construct `new ProgressionController([...this.level.phrases])`. Call `progression.advance()` once to get the first phrase and pass it to `engine.setWord(firstPhrase)`. This mirrors the current scene's startup pattern.
2. **On each `onWordComplete` callback:**
   a. Call `this.spawnWordGold()` (gold drops are kept for phrase completions).
   b. Call `progression.advance()` to get the next result.
   c. If result is `level_complete` → call `endLevel(true)` immediately. Skip all remaining steps.
   d. Store `nextPhrase` from the `next_word` result (the `.word` field of the `ProgressionEvent`).
   e. Call `engine.clearWord()` to remove current character texts (this also implicitly blocks further input).
   f. Tween `rightPageContainer.scaleX`: `1 → 0` over **250ms** (ease: `Sine.easeIn`).
   g. At tween complete: update left-page counter text (`"Page X / Y"`).
   h. Tween `rightPageContainer.scaleX`: `0 → 1` over **250ms** (ease: `Sine.easeOut`).
   i. At tween complete: call `engine.setWord(nextPhrase)` (this resumes input).

Total flip duration: **500ms**.

---

## Wrong Key Feedback

- A separate red-tinted `Phaser.GameObjects.Rectangle` overlaid on the right page area is pre-created at `alpha: 0`. On wrong key: tween alpha to `0.4` then back to `0` over ~100ms total.
- The TypingEngine's built-in per-character red flash will still fire — this is acceptable.
- Replace the existing `flashOnWrongKey()` body (which currently calls `this.cameras.main.flash(50, 100, 0, 0)`) with an early `return`, suppressing the camera flash. The red page overlay is triggered from `onWrongKey()` instead.
- No camera flash.

---

## HUD & Timer

- Standard `LevelHUD` is shown. Pass `this.level.phrases!` as the `wordPool` argument to `LevelHUD`. Assert non-empty (`if (!this.level.phrases?.length) throw new Error(...)`) at the top of `create()` before using it.
- The level has a time limit (non-null — all MonsterManual levels have explicit `timeLimit` values set per the world-by-world changes above)
- WPM counter from TypingEngine remains visible

---

## Phrase Progression

- At the top of `create()`, assert `this.level.phrases` is non-empty (throw if not).
- `new ProgressionController([...this.level.phrases])` — phrases passed directly, not the word pool
- `initWordPool()` is **not called** — the word pool and `this.words` / `this.wordQueue` are not used in this scene
- Each phrase is treated as a single "word" by the controller and engine
- `progression.advance()` is called once at startup (to load the first phrase) and once per completed phrase (to get the next phrase or the level_complete signal)
- `level_complete` → `endLevel(true)` directly, no flip

---

## Preserved Behavior

The `endLevel` override that records `bossWeaknessKnown` to the player profile must be preserved exactly as-is from the current implementation.

---

## Files to Change

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `phrases?: string[]` to `LevelConfig` |
| `src/scenes/level-types/MonsterManualLevel.ts` | Full visual + logic overhaul |
| `src/data/levels/world1.ts` | Add `phrases`, update `wordCount`, add `timeLimit: 180` on `w1_l8` |
| `src/data/levels/world2.ts` | Add `phrases`, update `wordCount`, add `timeLimit: 180`, reorder `w2_l10`, fix `w2_mb4.bossGate` |
| `src/data/levels/world3.ts` | Add `phrases`, update `wordCount`, add `timeLimit: 240`, reorder `w3_l9`, fix `w3_mb4.bossGate` |
| `src/data/levels/world4.ts` | Add new `w4_mm` MonsterManual level with `phrases` and `timeLimit: 240` |
| `src/data/levels/world5.ts` | Add `phrases`, update `wordCount`, add `timeLimit: 300`, reorder `w5_l3`, update `unlockedLetters` to `W5_AFTER_MB4`, fix `w5_mb1.bossGate` |
