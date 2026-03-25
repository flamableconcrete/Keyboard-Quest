# MonsterManual Level Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul MonsterManual levels with phrase-based typing, a visual library/book scene, page-flip animation, and correct level placement (second-to-last) in all five worlds.

**Architecture:** The work spans three layers: (1) data layer — add `phrases` field to `LevelConfig`, write phrases for all worlds, reorder level arrays and fix bossGates; (2) map layer — adjust `nodePositions` and `pathSegments` in world map files to match reordered/added levels; (3) scene layer — rewrite `MonsterManualLevel.ts` with library background, book visuals, page-flip animation, and phrase-based progression. Tasks are ordered so data changes land first (enabling tests), then map fixes, then the scene overhaul.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## File Structure

| File | Responsibility | Change Type |
|------|---------------|-------------|
| `src/types/index.ts` | Add `phrases?: string[]` to `LevelConfig` | Modify |
| `src/data/levels/world1.ts` | Add phrases + timeLimit to `w1_l8` | Modify |
| `src/data/levels/world2.ts` | Reorder `w2_l10` after `w2_mb4`, fix `w2_mb4.bossGate`, add phrases + timeLimit | Modify |
| `src/data/levels/world3.ts` | Reorder `w3_l9` after `w3_mb4`, fix `w3_mb4.bossGate`, add phrases + timeLimit | Modify |
| `src/data/levels/world4.ts` | Add new `w4_mm` MonsterManual level between `w4_mb4` and `w4_boss` | Modify |
| `src/data/levels/world5.ts` | Reorder `w5_l3` after `w5_mb4`, fix `w5_mb1.bossGate`, update `unlockedLetters`, add phrases + timeLimit | Modify |
| `src/data/maps/world4.ts` | Add nodePosition + pathSegment for new `w4_mm` level | Modify |
| `src/data/maps/unified.test.ts` | Update hardcoded `LEVEL_COUNTS` (W4: 14→15) and world widths/offsets | Modify |
| `src/scenes/level-types/MonsterManualLevel.ts` | Full visual + logic overhaul | Modify |

---

## Chunk 1: Data Layer — Type, Phrases, Level Reordering

### Task 1: Add `phrases` field to `LevelConfig`

**Files:**

- Modify: `src/types/index.ts:79-107`

- [ ] **Step 1: Add `phrases` to `LevelConfig` interface**

Add the optional field after line 106 (before the closing `}`):

```ts
  phrases?: string[]             // MonsterManual only; hand-crafted boss-lore phrases
```

- [ ] **Step 2: Run type-check to verify no regressions**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add phrases field to LevelConfig for MonsterManual levels"
```

---

### Task 2: World 1 — Add phrases and timeLimit to `w1_l8`

**Files:**

- Modify: `src/data/levels/world1.ts:182-196`

- [ ] **Step 1: Update `w1_l8` config**

In `src/data/levels/world1.ts`, update the `w1_l8` entry:

```ts
  {
    id: 'w1_l8',
    name: 'The Scholar\'s Hermitage',
    type: 'MonsterManual',
    world: 1,
    unlockedLetters: W1_AFTER_MB3,
    wordCount: 3,
    timeLimit: 180,
    dialogue: [
      { speaker: "enemy", text: "Ah, a visitor! Come — I have notes on Grizzlefang. You'll need them." },
      { speaker: "hero",  text: "Tell me everything." },
    ],
    rewards: { xp: 100 },
    bossGate: null,
    phrases: [
      "dark feral dens",
      "fear and flee",
      "rend and snare",
    ],
  },
```

Changes:

- `wordCount`: `10` → `3` (matches `phrases.length`)
- `timeLimit`: `null` → `180`
- Added `phrases` array (3 phrases, 2–3 words each)

Every character in these phrases uses only letters from `W1_AFTER_MB3` = `[a, s, d, f, j, k, l, e, n, r]`. Spaces are typeable (already supported by TypingEngine).

- [ ] **Step 2: Run tests**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/data/levels/world1.ts
git commit -m "feat(w1): add phrases and timeLimit to MonsterManual level w1_l8"
```

---

### Task 3: World 2 — Reorder `w2_l10`, fix bossGate, add phrases

**Files:**

- Modify: `src/data/levels/world2.ts:198-248`

- [ ] **Step 1: Reorder levels in the array**

In `src/data/levels/world2.ts`, the WORLD2_LEVELS array currently has this order at the end:

```
w2_l9 → w2_l10 → w2_mb4 → w2_boss
```

Move the `w2_l10` object (the MonsterManual level, currently at array index 10) to after `w2_mb4` (so it sits between `w2_mb4` and `w2_boss`). Cut the entire `w2_l10` object and paste it after `w2_mb4`. The new order is:

```
w2_l9 → w2_mb4 → w2_l10 → w2_boss
```

- [ ] **Step 2: Fix `w2_mb4.bossGate`**

Change `w2_mb4.bossGate` from:

```ts
bossGate: { minCombinedStars: 12, levelIds: ['w2_l9', 'w2_l10'] },
```

to:

```ts
bossGate: { minCombinedStars: 6, levelIds: ['w2_l9'] },
```

- [ ] **Step 3: Update `w2_l10` with phrases, timeLimit, wordCount**

Update the `w2_l10` config:

```ts
  {
    id: 'w2_l10',
    name: 'The Ranger\'s Outpost',
    type: 'MonsterManual',
    world: 2,
    unlockedLetters: W2_AFTER_MB3,
    wordCount: 4,
    timeLimit: 180,
    dialogue: [
      { speaker: "enemy", text: "You're heading toward the Hydra. Sit. Read this before you go." },
      { speaker: "hero", text: "I'm listening. Every detail." },
    ],
    rewards: { xp: 220 },
    bossGate: null,
    phrases: [
      "the horn is hot",
      "front and throat",
      "to hide is to die",
      "fire inside the lair",
    ],
  },
```

Changes:

- `wordCount`: `18` → `4`
- `timeLimit`: `null` → `180`
- `bossGate`: already `null` — no change
- Added `phrases` (4 phrases, 3–4 words each)

Every character uses only `W2_AFTER_MB3` letters = `[a, s, d, f, j, k, l, e, n, r, o, t, i, h]`. Verified: all letters in "the horn is hot", "front and throat", "to hide is to die", "fire inside the lair" are within this set.

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: All tests pass. (The unified.test.ts hardcoded LEVEL_COUNTS still says 15 for W2, which is still correct since we only reordered, not added/removed.)

- [ ] **Step 5: Commit**

```bash
git add src/data/levels/world2.ts
git commit -m "feat(w2): reorder MonsterManual to second-to-last, fix bossGate, add phrases"
```

---

### Task 4: World 3 — Reorder `w3_l9`, fix bossGate, add phrases

**Files:**

- Modify: `src/data/levels/world3.ts:182-254`

- [ ] **Step 1: Reorder levels in the array**

Current end order:

```
w3_l8 → w3_l9 → w3_mb4 → w3_boss
```

Move `w3_l9` (MonsterManual) to after `w3_mb4`:

```
w3_l8 → w3_mb4 → w3_l9 → w3_boss
```

Cut the `w3_l9` object and paste it after `w3_mb4`.

- [ ] **Step 2: Fix `w3_mb4.bossGate`**

Change `w3_mb4.bossGate` from:

```ts
bossGate: { minCombinedStars: 16, levelIds: ['w3_l8', 'w3_l9'] },
```

to:

```ts
bossGate: { minCombinedStars: 8, levelIds: ['w3_l8'] },
```

- [ ] **Step 3: Update `w3_l9` with phrases, timeLimit, wordCount**

```ts
  {
    id: 'w3_l9',
    name: 'The Drake-Scholar\'s Rest',
    type: 'MonsterManual',
    world: 3,
    unlockedLetters: W3_AFTER_MB3,
    wordCount: 5,
    timeLimit: 240,
    dialogue: [
      { speaker: "enemy", text: "You're heading to the Citadel. You should know what lives inside. Sit." },
      { speaker: "hero", text: "I'm already sitting. Talk fast." }
    ],
    rewards: { xp: 280 },
    bossGate: null,
    phrases: [
      "the machine hunts at dusk",
      "no one can outrun its path",
      "steam pours from its chest",
      "a tick then the strike hits",
      "cut the copper not the iron",
    ],
  },
```

Changes:

- `wordCount`: `22` → `5`
- `timeLimit`: `null` → `240`
- Added `phrases` (5 phrases, 4–5 words each)

Every character uses only `W3_AFTER_MB3` letters = `[a, s, d, f, j, k, l, e, n, r, o, t, i, h, c, m, p, u]`. Verified.

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: All pass (W3 level count is still 14 — reorder only).

- [ ] **Step 5: Commit**

```bash
git add src/data/levels/world3.ts
git commit -m "feat(w3): reorder MonsterManual to second-to-last, fix bossGate, add phrases"
```

---

### Task 5: World 4 — Add new `w4_mm` MonsterManual level

**Files:**

- Modify: `src/data/levels/world4.ts:234-256`

- [ ] **Step 1: Add new `w4_mm` level config between `w4_mb4` and `w4_boss`**

Insert this new level object after the `w4_mb4` entry and before `w4_boss`:

```ts
  {
    id: 'w4_mm',
    name: 'The Bone-Scholar\'s Archive',
    type: 'MonsterManual',
    world: 4,
    unlockedLetters: W4_AFTER_MB4,
    wordCount: 5,
    timeLimit: 240,
    dialogue: [
      { speaker: "enemy", text: "The Dice Lich has played this game for centuries. You should know the stakes before you enter." },
      { speaker: "hero", text: "Show me what you have. Every scrap." },
    ],
    rewards: { xp: 500 },
    bossGate: null,
    phrases: [
      "the lich gambles with your very bones",
      "watch the dice but keep typing",
      "every throw may summon new words",
      "break the rhythm and you shatter",
      "victory belongs to the steady hand",
    ],
  },
```

Every character uses only `W4_AFTER_MB4` letters = `[a, s, d, f, j, k, l, e, n, r, o, t, i, h, c, m, p, u, g, b, w, y, v]`. Verified: all letters in the phrases above are within this set.

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit`
Expected: No errors. The new level adds 1 to W4 count (14→15).

Note: `npm run test` will show failures in `unified.test.ts` at this point because the hardcoded LEVEL_COUNTS and map nodePositions/pathSegments are not yet updated. This is expected and will be fixed in Chunk 2 (Tasks 7 and 11).

- [ ] **Step 3: Commit**

```bash
git add src/data/levels/world4.ts
git commit -m "feat(w4): add new MonsterManual level w4_mm with phrases"
```

---

### Task 6: World 5 — Reorder `w5_l3`, fix bossGate, update unlockedLetters, add phrases

**Files:**

- Modify: `src/data/levels/world5.ts:41-76`

- [ ] **Step 1: Reorder levels in the array**

Current order:

```
w5_l1 → w5_l2 → w5_l3 → w5_mb1 → ... → w5_mb4 → w5_boss
```

Move `w5_l3` (MonsterManual, currently at array index 2) to after `w5_mb4` (before `w5_boss`):

```
w5_l1 → w5_l2 → w5_mb1 → ... → w5_mb4 → w5_l3 → w5_boss
```

Cut the `w5_l3` object and paste it after `w5_mb4`.

- [ ] **Step 2: Fix `w5_mb1.bossGate`**

Change `w5_mb1.bossGate` from:

```ts
bossGate: { minCombinedStars: 20, levelIds: ['w5_l1', 'w5_l2', 'w5_l3'] },
```

to:

```ts
bossGate: { minCombinedStars: 12, levelIds: ['w5_l1', 'w5_l2'] },
```

- [ ] **Step 3: Update `w5_l3` with unlockedLetters, phrases, timeLimit, wordCount**

```ts
  {
    id: 'w5_l3',
    name: 'Archives of Eternity',
    type: 'MonsterManual',
    world: 5,
    unlockedLetters: W5_AFTER_MB4,
    wordCount: 6,
    timeLimit: 300,
    dialogue: [
      { speaker: "enemy", text: "These scrolls contain the Typemancer's full history. It's unsettling. Read anyway." },
      { speaker: "hero",  text: "Show me." },
    ],
    rewards: { xp: 440 },
    bossGate: null,
    phrases: [
      "the typemancer stole every letter from the world",
      "his power grows with each word you fail to type",
      "he broke the alphabet and hid the fragments",
      "six keepers were chosen to guard the shards",
      "only a hero who types with quickness can fix it",
      "strike the frozen keys at the exact zone of power",
    ],
  },
```

Changes:

- `unlockedLetters`: `W5_BASE` → `W5_AFTER_MB4` (adds q, x, z; j already present)
- `wordCount`: `24` → `6`
- `timeLimit`: `null` → `300`
- Added `phrases` (6 phrases, 6–8 words each)

Every character uses only letters from `W5_AFTER_MB4` (full 26-letter alphabet). Phrases include q ("quickness"), x ("exact"), and z ("zone"). Verified.

- [ ] **Step 4: Run tests**

Run: `npm run test`
Expected: All pass (W5 level count is still 13 — reorder only).

- [ ] **Step 5: Commit**

```bash
git add src/data/levels/world5.ts
git commit -m "feat(w5): reorder MonsterManual to second-to-last, fix bossGate, add phrases"
```

---

## Chunk 2: Map Layer — World 4 Map + Test Fixes

### Task 7: Add nodePosition and pathSegment for `w4_mm` in World 4 map

**Files:**

- Modify: `src/data/maps/world4.ts:308-327`

Adding a new level between `w4_mb4` and `w4_boss` means we need one new nodePosition entry and one new pathSegment entry in the world4 map data. The existing last 3 node positions are:

```
{ x: 2130, y: 260 },  // l9
{ x: 2300, y: 200 },  // mb4
{ x: 2460, y: 170 },  // boss (right)
```

We need to insert a new node between `mb4` and `boss`. To maintain the x-increasing constraint (required by tests) and keep things visually clean, shift boss x rightward. The world width will also grow since LEVEL_COUNTS changes from 14→15 (computeWorldWidth(15) = 2650).

- [ ] **Step 1: Update nodePositions — add w4_mm between mb4 and boss**

Replace the nodePositions array in `src/data/maps/world4.ts`:

```ts
  nodePositions: [
    { x: 140,  y: 450 }, // l1 — forest entrance (left)
    { x: 330,  y: 320 }, // l2
    { x: 520,  y: 460 }, // l3
    { x: 700,  y: 300 }, // mb1
    { x: 880,  y: 450 }, // l4
    { x: 1070, y: 300 }, // l5
    { x: 1260, y: 460 }, // mb2
    { x: 1430, y: 290 }, // l6
    { x: 1610, y: 440 }, // l7
    { x: 1790, y: 270 }, // mb3
    { x: 1960, y: 410 }, // l8
    { x: 2130, y: 260 }, // l9
    { x: 2300, y: 200 }, // mb4
    { x: 2440, y: 300 }, // w4_mm (MonsterManual)
    { x: 2580, y: 170 }, // boss (right)
  ],
```

- [ ] **Step 2: Update pathSegments — add one for mb4→w4_mm and adjust the last one**

The current last pathSegment is `mb4 → boss`:

```ts
{ cx: 2380, cy: 145 }, // mb4 → boss (going up)
```

Replace `buildPathSegments()` return array — add the new segment for mb4→w4_mm and update the final one for w4_mm→boss:

```ts
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 235,  cy: 345 }, // l1 → l2   (going up)
    { cx: 425,  cy: 430 }, // l2 → l3   (going down)
    { cx: 610,  cy: 340 }, // l3 → mb1  (going up)
    { cx: 790,  cy: 415 }, // mb1 → l4  (going down)
    { cx: 975,  cy: 335 }, // l4 → l5   (going up)
    { cx: 1165, cy: 420 }, // l5 → mb2  (going down)
    { cx: 1345, cy: 335 }, // mb2 → l6  (going up)
    { cx: 1520, cy: 405 }, // l6 → l7   (going down)
    { cx: 1700, cy: 315 }, // l7 → mb3  (going up)
    { cx: 1875, cy: 380 }, // mb3 → l8  (going down)
    { cx: 2045, cy: 295 }, // l8 → l9   (going up)
    { cx: 2215, cy: 190 }, // l9 → mb4  (going up)
    { cx: 2370, cy: 290 }, // mb4 → w4_mm (going down)
    { cx: 2510, cy: 195 }, // w4_mm → boss (going up)
  ]
}
```

- [ ] **Step 3: Update ground grid path segments**

The path grid currently draws from `mb4(72,5) → boss(77,3)`. With the new node, we need to route: `mb4(72,5) → w4_mm(76,9) → boss(81,5)`. This means expanding the grid — COLS must increase from 79 to at least 84 to accommodate the rightward shift.

Update `const COLS = 79` to `const COLS = 84`.

Replace the last path grid line:

```ts
// mb4(72,5) → boss(77,3)
hPath(g, 5, 72, 77, PATH_H); g[5][77] = PATH_CORNER; vPath(g, 77, 3, 5, PATH_V)
```

with:

```ts
// mb4(72,5) → w4_mm(76,9)
hPath(g, 5, 72, 76, PATH_H); g[5][76] = PATH_CORNER; vPath(g, 76, 5, 9, PATH_V)
// w4_mm(76,9) → boss(81,5)
hPath(g, 9, 76, 81, PATH_H); g[9][81] = PATH_CORNER; vPath(g, 81, 5, 9, PATH_V)
```

- [ ] **Step 4: Run type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/data/maps/world4.ts
git commit -m "feat(w4): add map node and path for new MonsterManual level"
```

---

### Task 8: Update World 2 map — swap nodePositions for reordered levels

**Files:**

- Modify: `src/data/maps/world2.ts:283-299`

Levels were reordered: `w2_l9 → w2_l10 → w2_mb4 → w2_boss` became `w2_l9 → w2_mb4 → w2_l10 → w2_boss`. The nodePositions are indexed by array position, so we must swap the positions for l10 (index 12) and mb4 (index 13) in the comments to reflect the new meaning. However, the x-coordinates must still strictly increase, and the visual positions on the map don't change — only which level is at which node.

Actually, nodePositions are indexed to match the level array order. Since we swapped the order of l10 and mb4 in the level array, the node positions that were at indices 12 and 13 now correspond to different levels. The existing positions already satisfy x-increasing, so we just need to update the comments:

- [ ] **Step 1: Update nodePositions comments**

Replace the comments for indices 12 and 13:

```ts
    { x: 2200, y: 360 }, // mb4 (was l10)
    { x: 2370, y: 220 }, // l10 — MonsterManual (was mb4)
```

- [ ] **Step 2: Update pathSegments comments**

Update the last two comments in `buildPathSegments()`:

```ts
    { cx: 2110, cy: 335 }, // l9 → mb4  (was l9 → l10)
    { cx: 2285, cy: 250 }, // mb4 → l10 (was l10 → mb4)
    { cx: 2445, cy: 155 }, // l10 → boss (was mb4 → boss)
```

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/data/maps/world2.ts
git commit -m "feat(w2): update map comments for reordered MonsterManual level"
```

---

### Task 9: Update World 3 map — swap nodePositions for reordered levels

**Files:**

- Modify: `src/data/maps/world3.ts:291-306`

Same pattern as W2: levels reordered from `w3_l8 → w3_l9 → w3_mb4 → w3_boss` to `w3_l8 → w3_mb4 → w3_l9 → w3_boss`. Update comments.

- [ ] **Step 1: Update nodePositions comments**

Replace comments for indices 11 and 12:

```ts
    { x: 2100, y: 190 }, // mb4 (was l9)
    { x: 2270, y: 170 }, // l9 — MonsterManual (was mb4)
```

- [ ] **Step 2: Update pathSegments comments**

```ts
    { cx: 2020, cy: 215 }, // l8 → mb4  (was l8 → l9)
    { cx: 2185, cy: 140 }, // mb4 → l9  (was l9 → mb4)
    { cx: 2350, cy: 125 }, // l9 → boss (was mb4 → boss)
```

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/data/maps/world3.ts
git commit -m "feat(w3): update map comments for reordered MonsterManual level"
```

---

### Task 10: Update World 5 map — handle major reorder

**Files:**

- Modify: `src/data/maps/world5.ts:290-304`

`w5_l3` moved from index 2 to index 10 (after `w5_mb4`, before `w5_boss`). This is a bigger shift: the level that was at position 2 now occupies position 10. The existing 13 nodePositions now map to a different level order.

Current order (13 levels): `l1, l2, l3, mb1, l4, l5, mb2, l6, l7, mb3, l8, mb4, boss`
New order (13 levels): `l1, l2, mb1, l4, l5, mb2, l6, l7, mb3, l8, mb4, l3, boss`

The visual map layout doesn't change — we just reassign which levels go to which nodes. The nodePositions array must still have 13 entries with strictly increasing x. We need to relabel the comments:

- [ ] **Step 1: Update nodePositions comments**

```ts
  nodePositions: [
    { x: 130,  y: 620 }, // l1 — tower base (left)
    { x: 330,  y: 500 }, // l2
    { x: 530,  y: 390 }, // mb1 (was l3)
    { x: 720,  y: 270 }, // l4 (was mb1)
    { x: 900,  y: 400 }, // l5 (was l4)
    { x: 1090, y: 270 }, // mb2 (was l5)
    { x: 1270, y: 150 }, // l6 (was mb2)
    { x: 1440, y: 280 }, // l7 (was l6)
    { x: 1620, y: 160 }, // mb3 (was l7)
    { x: 1800, y: 150 }, // l8 (was mb3)
    { x: 1970, y: 230 }, // mb4 (was l8)
    { x: 2140, y: 150 }, // l3 — MonsterManual (was mb4)
    { x: 2300, y: 360 }, // boss — Typemancer's throne (centered)
  ],
```

- [ ] **Step 2: Update pathSegments comments**

```ts
function buildPathSegments(): PathSegment[] {
  return [
    { cx: 230,  cy: 520 }, // l1 → l2
    { cx: 430,  cy: 405 }, // l2 → mb1
    { cx: 625,  cy: 290 }, // mb1 → l4
    { cx: 810,  cy: 375 }, // l4 → l5
    { cx: 995,  cy: 295 }, // l5 → mb2
    { cx: 1180, cy: 170 }, // mb2 → l6
    { cx: 1355, cy: 255 }, // l6 → l7
    { cx: 1530, cy: 180 }, // l7 → mb3
    { cx: 1710, cy: 115 }, // mb3 → l8
    { cx: 1885, cy: 230 }, // l8 → mb4
    { cx: 2055, cy: 150 }, // mb4 → l3
    { cx: 2220, cy: 245 }, // l3 → boss
  ]
}
```

- [ ] **Step 3: Run tests**

Run: `npm run test`
Expected: All pass.

- [ ] **Step 4: Commit**

```bash
git add src/data/maps/world5.ts
git commit -m "feat(w5): update map comments for reordered MonsterManual level"
```

---

### Task 11: Update unified map test hardcoded values

**Files:**

- Modify: `src/data/maps/unified.test.ts:17,21-25,30,49,55,94`

World 4 now has 15 levels (was 14). This changes several hardcoded values.

- [ ] **Step 1: Update LEVEL_COUNTS**

Line 17: change from:

```ts
const LEVEL_COUNTS = [12, 15, 14, 14, 13]
```

to:

```ts
const LEVEL_COUNTS = [12, 15, 14, 15, 13]
```

- [ ] **Step 2: Update computeWorldWidths expectation**

Line 30: change from:

```ts
expect(computeWorldWidths(LEVEL_COUNTS)).toEqual([2200, 2650, 2500, 2500, 2350])
```

to:

```ts
expect(computeWorldWidths(LEVEL_COUNTS)).toEqual([2200, 2650, 2500, 2650, 2350])
```

- [ ] **Step 3: Update computeWorldXOffsets expectations**

The offsets change because W4 width changes from 2500 to 2650:

- W1 offset: 0 (unchanged)
- W2 offset: 2200 (unchanged)
- W3 offset: 4850 (unchanged)
- W4 offset: 7350 (unchanged)
- W5 offset: 7350 + 2650 = 10000 (was 9850)

Update line 49:

```ts
expect(offsets).toEqual([0, 2200, 4850, 7350, 10000])
```

Also update line 44 (third world offset test):

```ts
expect(offsets[2]).toBe(4850)
```

This is unchanged — still 4850.

- [ ] **Step 4: Update computeTotalMapWidth expectation**

Line 55: total = 2200 + 2650 + 2500 + 2650 + 2350 = 12350 (was 12200). Change:

```ts
expect(computeTotalMapWidth(LEVEL_COUNTS)).toBe(12350)
```

- [ ] **Step 5: Update world map layout constraints for W4**

Line 93: W4 maxWidth changes from 2500 to 2650:

```ts
['world4', WORLD4_MAP, 2650],
```

- [ ] **Step 6: Update worldIndexAtScrollX test cases**

The xOffsets and totalWidth change. Update all uses of the old offset array and total:

Old: `[0, 2200, 4850, 7350, 9850]`, totalWidth `12200`
New: `[0, 2200, 4850, 7350, 10000]`, totalWidth `12350`

Update lines 72-84 — replace all occurrences of `9850` with `10000` and `12200` with `12350`:

```ts
  it('returns 0 when camera center is in world 1', () => {
    expect(worldIndexAtScrollX(0, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(0)
    expect(worldIndexAtScrollX(500, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(0)
  })
  it('returns 1 when camera center crosses into world 2', () => {
    expect(worldIndexAtScrollX(1560, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(1)
  })
  it('returns last world index when near end of map', () => {
    expect(worldIndexAtScrollX(11070, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(4)
  })
  it('clamps to valid range', () => {
    expect(worldIndexAtScrollX(-100, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(0)
    expect(worldIndexAtScrollX(99999, [0, 2200, 4850, 7350, 10000], 12350, 1280)).toBe(4)
  })
```

Note: The "returns last world index when near end" test uses scrollX `10920`. With the new total width, the last world starts at offset 10000, so `scrollX = 10920` with center at `10920 + 640 = 11560` is valid for W5. Update scrollX to `11070` (center = 11710, well within W5 range 10000–12350).

- [ ] **Step 7: Run tests**

Run: `npm run test`
Expected: All pass.

- [ ] **Step 8: Commit**

```bash
git add src/data/maps/unified.test.ts
git commit -m "test: update unified map test values for W4 level count change"
```

---

## Chunk 3: Scene Overhaul — MonsterManualLevel Visual + Logic Rewrite

### Task 12: Rewrite MonsterManualLevel scene

**Files:**

- Modify: `src/scenes/level-types/MonsterManualLevel.ts` (full rewrite)

This is the core of the overhaul. The new scene replaces the current simple text display with an abandoned library background, a giant pixel-art book, page-flip animation, and phrase-based progression.

- [ ] **Step 1: Write the new MonsterManualLevel scene**

Replace the entire contents of `src/scenes/level-types/MonsterManualLevel.ts` with:

```ts
// src/scenes/level-types/MonsterManualLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { loadProfile, saveProfile } from '../../utils/profile'
import { BaseLevelScene } from '../BaseLevelScene'
import { ProgressionController } from '../../controllers/ProgressionController'
import { LevelHUD } from '../../components/LevelHUD'
import { DEFAULT_PLAYER_HP } from '../../constants'

export class MonsterManualLevel extends BaseLevelScene {
  private progression!: ProgressionController
  private rightPageContainer!: Phaser.GameObjects.Container
  private pageCounterText!: Phaser.GameObjects.Text
  private wrongKeyOverlay!: Phaser.GameObjects.Rectangle
  private currentPage = 0
  private totalPages = 0

  constructor() { super('MonsterManualLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    if (!this.level.phrases?.length) {
      throw new Error(`MonsterManualLevel: level ${this.level.id} has no phrases`)
    }

    this.totalPages = this.level.phrases.length
    this.currentPage = 1

    this.preCreate(80, height * 0.65, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        wordPool: this.level.phrases,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
        timer: this.level.timeLimit ? {
          seconds: this.level.timeLimit,
          onExpire: () => this.endLevel(false),
        } : undefined,
      }),
    })

    // ── Background — Abandoned Crumbling Library ────────────────
    this.drawLibraryBackground(width, height)

    // ── The Book — Giant Pixel Art Tome ─────────────────────────
    this.drawBook(width, height)

    // ── Wrong-key red overlay on right page ─────────────────────
    const bookX = width / 2
    const bookY = height / 2 - 30
    const bookW = 560
    const bookH = 400
    const rightPageX = bookX + 10
    const rightPageW = bookW / 2 - 30
    this.wrongKeyOverlay = this.add.rectangle(
      rightPageX + rightPageW / 2, bookY,
      rightPageW, bookH - 40,
      0xff0000
    ).setAlpha(0).setDepth(15)

    // ── Dust motes ──────────────────────────────────────────────
    this.createDustMotes(width, height)

    // ── Phrase Progression ──────────────────────────────────────
    this.progression = new ProgressionController([...this.level.phrases])
    const first = this.progression.advance()
    if (first[0].type === 'next_word') {
      this.engine.setWord(first[0].word)
    }
  }

  private drawLibraryBackground(width: number, height: number) {
    const bg = this.add.graphics().setDepth(0)

    // Deep navy/charcoal base
    bg.fillStyle(0x0d1117, 1)
    bg.fillRect(0, 0, width, height)

    // ── Bookshelves on left side ─────────────────────────────
    this.drawBookshelf(bg, 0, 0, 120, height)

    // ── Bookshelves on right side ────────────────────────────
    this.drawBookshelf(bg, width - 120, 0, 120, height)

    // ── Broken window center-back ────────────────────────────
    bg.fillStyle(0x1a2a3a, 1)
    bg.fillRect(width / 2 - 60, 20, 120, 140)
    // Jagged outline
    bg.lineStyle(2, 0x334455, 1)
    bg.strokeRect(width / 2 - 60, 20, 120, 140)
    // Crack lines
    bg.lineBetween(width / 2 - 20, 20, width / 2 + 10, 160)
    bg.lineBetween(width / 2 + 30, 20, width / 2 - 10, 100)

    // Moonlight beam — semi-transparent triangle
    const moonlight = this.add.graphics().setDepth(1).setAlpha(0.15)
    moonlight.fillStyle(0x88ccff, 1)
    moonlight.fillTriangle(
      width / 2 - 30, 160,
      width / 2 + 80, height - 60,
      width / 2 - 140, height - 60
    )

    // ── Vines from upper corners ─────────────────────────────
    const vineGfx = this.add.graphics().setDepth(2)
    vineGfx.lineStyle(2, 0x2d5a27, 0.7)
    // Left vine
    this.drawVine(vineGfx, 120, 0, 200, 250)
    // Right vine
    this.drawVine(vineGfx, width - 120, 0, width - 200, 280)
  }

  private drawBookshelf(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    // Shelf frame
    g.fillStyle(0x2a1a0a, 1)
    g.fillRect(x, y, w, h)

    // Horizontal shelf lines
    const shelfCount = 6
    const shelfH = h / shelfCount
    g.lineStyle(2, 0x3a2a1a, 1)
    for (let i = 1; i < shelfCount; i++) {
      g.lineBetween(x, y + i * shelfH, x + w, y + i * shelfH)
    }

    // Book spines — colored rectangles
    const bookColors = [0x8b2500, 0x2e4a1a, 0x4a3728, 0x6b3a3a, 0x3a4a2e, 0x5a3a1a]
    for (let shelf = 0; shelf < shelfCount; shelf++) {
      const shelfY = y + shelf * shelfH + 4
      let bx = x + 4
      while (bx < x + w - 10) {
        const bw = 8 + Math.floor(Math.random() * 12)
        const bh = shelfH - 8 - Math.floor(Math.random() * 10)
        const color = bookColors[Math.floor(Math.random() * bookColors.length)]
        g.fillStyle(color, 0.8)
        g.fillRect(bx, shelfY + (shelfH - 8 - bh), bw, bh)
        bx += bw + 2
      }
    }

    // Debris at base
    g.fillStyle(0x3a2a1a, 0.6)
    for (let i = 0; i < 5; i++) {
      const dx = x + Math.random() * w
      const dy = h - 10 + Math.random() * 10
      g.fillRect(dx, dy, 6 + Math.random() * 8, 3 + Math.random() * 4)
    }
  }

  private drawVine(g: Phaser.GameObjects.Graphics, startX: number, startY: number, endX: number, endY: number) {
    const segments = 8
    let cx = startX
    let cy = startY
    const dx = (endX - startX) / segments
    const dy = (endY - startY) / segments
    for (let i = 0; i < segments; i++) {
      const nx = cx + dx + (Math.random() * 20 - 10)
      const ny = cy + dy
      g.lineBetween(cx, cy, nx, ny)
      cx = nx
      cy = ny
    }
  }

  private drawBook(width: number, height: number) {
    const bookX = width / 2
    const bookY = height / 2 - 30
    const bookW = 560
    const bookH = 400

    const bookGfx = this.add.graphics().setDepth(5)

    // ── Binding border — outer leather frame ─────────────────
    bookGfx.fillStyle(0x3a2210, 1)
    bookGfx.fillRect(bookX - bookW / 2, bookY - bookH / 2, bookW, bookH)

    // ── Spine — center strip ─────────────────────────────────
    bookGfx.fillStyle(0x2a1808, 1)
    bookGfx.fillRect(bookX - 8, bookY - bookH / 2, 16, bookH)

    // ── Left page (decorative) ───────────────────────────────
    const leftPageX = bookX - bookW / 2 + 15
    const leftPageW = bookW / 2 - 30
    const pageY = bookY - bookH / 2 + 15
    const pageH = bookH - 30

    bookGfx.fillStyle(0xc8b896, 1)
    bookGfx.fillRect(leftPageX, pageY, leftPageW, pageH)
    // Darker worn tint
    bookGfx.fillStyle(0x000000, 0.15)
    bookGfx.fillRect(leftPageX, pageY, leftPageW, pageH)

    // Corner jewels
    const jewelColor = 0xcc8833
    const jewelSize = 6
    bookGfx.fillStyle(jewelColor, 1)
    bookGfx.fillRect(bookX - bookW / 2 + 4, bookY - bookH / 2 + 4, jewelSize, jewelSize)
    bookGfx.fillRect(bookX + bookW / 2 - 4 - jewelSize, bookY - bookH / 2 + 4, jewelSize, jewelSize)
    bookGfx.fillRect(bookX - bookW / 2 + 4, bookY + bookH / 2 - 4 - jewelSize, jewelSize, jewelSize)
    bookGfx.fillRect(bookX + bookW / 2 - 4 - jewelSize, bookY + bookH / 2 - 4 - jewelSize, jewelSize, jewelSize)

    // ── Boss silhouette on left page ─────────────────────────
    const silhouetteX = leftPageX + leftPageW / 2
    const silhouetteY = pageY + pageH / 2 - 30
    this.drawBossSilhouette(bookGfx, silhouetteX, silhouetteY, this.level.world)

    // ── Page counter on left page ────────────────────────────
    this.pageCounterText = this.add.text(
      leftPageX + leftPageW / 2, pageY + pageH - 20,
      `Page 1 / ${this.totalPages}`,
      { fontSize: '13px', color: '#7a7060', fontFamily: 'serif' }
    ).setOrigin(0.5).setDepth(10)

    // ── Right page (active typing page) ──────────────────────
    const rightPageX = bookX + 10
    const rightPageW = bookW / 2 - 30

    // Right page container (for flip animation)
    this.rightPageContainer = this.add.container(0, 0).setDepth(8)

    const rightPageGfx = this.add.graphics()
    // Lighter parchment
    rightPageGfx.fillStyle(0xd8c8a6, 1)
    rightPageGfx.fillRect(rightPageX, pageY, rightPageW, pageH)

    // Rune border — faint gold dots
    rightPageGfx.lineStyle(1, 0xc8a830, 0.3)
    const dotSpacing = 8
    for (let dx = rightPageX + 10; dx < rightPageX + rightPageW - 10; dx += dotSpacing) {
      rightPageGfx.fillStyle(0xc8a830, 0.3)
      rightPageGfx.fillRect(dx, pageY + 10, 2, 2)
      rightPageGfx.fillRect(dx, pageY + pageH - 12, 2, 2)
    }
    for (let dy = pageY + 10; dy < pageY + pageH - 10; dy += dotSpacing) {
      rightPageGfx.fillStyle(0xc8a830, 0.3)
      rightPageGfx.fillRect(rightPageX + 10, dy, 2, 2)
      rightPageGfx.fillRect(rightPageX + rightPageW - 12, dy, 2, 2)
    }

    this.rightPageContainer.add(rightPageGfx)

    // Italic header
    const bossNames: Record<number, string> = {
      1: 'Grizzlefang the Ogre',
      2: 'Tiamat, the Lexicon Hydra',
      3: 'Mecha-Wyrm Alpha',
      4: 'The Dice Lich',
      5: 'The Typemancer',
    }
    const headerText = this.add.text(
      rightPageX + rightPageW / 2, pageY + 25,
      `Entry: ${bossNames[this.level.world] ?? 'Unknown'}`,
      { fontSize: '14px', color: '#c8a830', fontFamily: 'serif', fontStyle: 'italic' }
    ).setOrigin(0.5, 0).setDepth(10)
    this.rightPageContainer.add(headerText)
  }

  private drawBossSilhouette(g: Phaser.GameObjects.Graphics, cx: number, cy: number, world: number) {
    g.fillStyle(0x4a3a2a, 0.6)
    switch (world) {
      case 1: // Claw shape for Grizzlefang
        g.fillRect(cx - 20, cy - 30, 8, 50)
        g.fillRect(cx - 8, cy - 40, 8, 60)
        g.fillRect(cx + 4, cy - 35, 8, 55)
        g.fillRect(cx + 16, cy - 25, 8, 45)
        break
      case 2: // Three heads for Hydra
        g.fillRect(cx - 25, cy - 30, 12, 40)
        g.fillRect(cx - 6, cy - 45, 12, 55)
        g.fillRect(cx + 13, cy - 35, 12, 45)
        g.fillRect(cx - 10, cy + 10, 20, 15)
        break
      case 3: // Gear/cog shape for Mecha-Wyrm
        g.fillRect(cx - 20, cy - 20, 40, 40)
        g.fillRect(cx - 25, cy - 5, 50, 10)
        g.fillRect(cx - 5, cy - 25, 10, 50)
        break
      case 4: // Dice shape for Dice Lich
        g.fillRect(cx - 18, cy - 18, 36, 36)
        g.fillStyle(0xc8b896, 1)
        g.fillRect(cx - 6, cy - 6, 5, 5)
        g.fillRect(cx + 2, cy + 2, 5, 5)
        g.fillRect(cx - 12, cy - 12, 4, 4)
        break
      case 5: // Quill shape for Typemancer
        g.fillRect(cx - 3, cy - 40, 6, 60)
        g.fillRect(cx - 10, cy + 15, 20, 8)
        g.fillRect(cx - 1, cy + 20, 2, 15)
        break
    }
  }

  private createDustMotes(width: number, height: number) {
    for (let i = 0; i < 15; i++) {
      const x = 130 + Math.random() * (width - 260)
      const y = 100 + Math.random() * (height - 200)
      const mote = this.add.rectangle(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3, 0xccccaa, 0.3)
        .setDepth(3)

      this.tweens.add({
        targets: mote,
        y: y - 60 - Math.random() * 40,
        x: x + Math.sin(Math.random() * Math.PI * 2) * 30,
        alpha: 0,
        duration: 4000 + Math.random() * 3000,
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          mote.setPosition(
            130 + Math.random() * (width - 260),
            100 + Math.random() * (height - 200)
          )
          mote.setAlpha(0.3)
        },
      })
    }
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    this.spawnWordGold()

    const events = this.progression.advance()
    for (const e of events) {
      switch (e.type) {
        case 'next_word':
          this.doPageFlip(e.word)
          break
        case 'level_complete':
          this.endLevel(true)
          break
      }
    }
  }

  private doPageFlip(nextPhrase: string) {
    this.engine.clearWord()

    // Flip right page closed (scaleX 1 → 0)
    this.tweens.add({
      targets: this.rightPageContainer,
      scaleX: 0,
      duration: 250,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Update page counter
        this.currentPage++
        this.pageCounterText.setText(`Page ${this.currentPage} / ${this.totalPages}`)

        // Flip right page open (scaleX 0 → 1)
        this.tweens.add({
          targets: this.rightPageContainer,
          scaleX: 1,
          duration: 250,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.engine.setWord(nextPhrase)
          },
        })
      },
    })
  }

  protected flashOnWrongKey(): void {
    // Suppress camera flash — use red page overlay instead
    return
  }

  protected onWrongKey() {
    this.flashOnWrongKey()

    // Red overlay flash on right page
    this.tweens.add({
      targets: this.wrongKeyOverlay,
      alpha: { from: 0.4, to: 0 },
      duration: 100,
      ease: 'Linear',
    })
  }

  protected endLevel(passed: boolean) {
    const profile = loadProfile(this.profileSlot)
    if (profile && passed) {
      const worldBossMap: Record<number, string> = {
        1: 'grizzlefang',
        2: 'hydra',
        3: 'clockwork_dragon',
        4: 'badrang',
        5: 'typemancer',
      }
      profile.bossWeaknessKnown = worldBossMap[this.level.world] ?? null
      saveProfile(this.profileSlot, profile)
    }

    super.endLevel(passed)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
```

Key implementation notes:

- `initWordPool()` is NOT called — phrases replace the word pool
- `this.level.phrases` is passed as `wordPool` to `LevelHUD`
- `ProgressionController` receives phrases directly
- Page flip animation uses `rightPageContainer.scaleX` tweens (250ms each = 500ms total)
- `engine.clearWord()` before flip implicitly blocks input (handleKey returns early when currentWord is empty)
- `engine.setWord(nextPhrase)` after flip completes resumes input
- `endLevel()` preserves the `bossWeaknessKnown` recording exactly
- `flashOnWrongKey()` returns early (no camera flash)
- `onWrongKey()` tweens the red overlay rectangle instead
- Timer is wired to `LevelHUD` via the `timer` config option
- TypingEngine char texts are NOT in the rightPageContainer (they sit at fixed HUD-bar coordinates, overlapping the book visually)

- [ ] **Step 2: Run type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Run all tests**

Run: `npm run test`
Expected: All pass.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`

Test the following:

1. Navigate to World 1, play through to `w1_l8` (The Scholar's Hermitage). Verify:
   - Library background appears with bookshelves on left/right
   - Book is centered with left/right pages
   - Right page shows "Entry: Grizzlefang the Ogre" header
   - First phrase appears in TypingEngine at bottom
   - Typing works — green/white/gray coloring
   - On phrase complete, gold drops and page flips (500ms animation)
   - Page counter updates on left page
   - After 3 phrases, level completes
   - Wrong key shows red overlay flash on right page (no camera flash)
   - Timer counts down from 180s

2. Spot-check World 2 level order: verify `w2_mb4` now appears before `w2_l10` on the overland map.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/level-types/MonsterManualLevel.ts
git commit -m "feat: overhaul MonsterManualLevel with library visuals, book, and page-flip animation"
```

---

### Task 13: Final verification — full test suite

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit all changes if any remain**

```bash
git status
```

If clean, done. If any unstaged changes remain, review and commit.
