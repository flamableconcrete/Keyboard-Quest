# Crazed Cook Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move orcs, patience bars, and tickets into the bottom seating zone and place tickets to the right of orcs instead of on top of them.

**Architecture:** Single-file change — all four coordinate groups in `CrazedCookLevel.ts` are updated in sequence: SEAT_X array, orc spawn Y, patience bar Y, ticket XY. No logic changes, no new files.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## Chunk 1: Layout Coordinate Updates

### Task 1: Update all seating/orc/ticket coordinates

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`

**Working directory:** `.worktrees/crazed-cook-visual`

The worktree already exists at `.worktrees/crazed-cook-visual` (branch `feature/crazed-cook-visual-overhaul`). Run all commands from that directory. The file to edit is `.worktrees/crazed-cook-visual/src/scenes/level-types/CrazedCookLevel.ts`.

---

- [ ] **Step 1: Run tests to establish a clean baseline**

```bash
cd .worktrees/crazed-cook-visual && npm test
```

Expected: all tests pass (the `cookMovement.test.ts` suite covers `calcMoveDuration` and `pickNextStationIndex`). If any test fails, stop and investigate before making changes.

---

- [ ] **Step 2: Update `SEAT_X` (line 37)**

In `src/scenes/level-types/CrazedCookLevel.ts`, find:

```typescript
const SEAT_X = [160, 360, 560, 760, 960]
```

Replace with:

```typescript
const SEAT_X = [250, 510, 770, 1030]
```

This reduces from 5 seats to 4, with 260px spacing centered on the 1280px canvas (190px left margin, 190px right margin).

---

- [ ] **Step 3: Update orc spawn Y (line 222)**

In `spawnOrc`, find:

```typescript
const orcSprite = this.add.image(seatX, 248, 'orc_customer').setScale(2)
```

Replace with:

```typescript
const orcSprite = this.add.image(seatX, 475, 'orc_customer').setScale(2)
```

At scale 2, orc top edge = 475 − 72 = 403 (3px below counter bottom at y=400). Bottom edge = 547 (13px above finger hints at y≈560).

---

- [ ] **Step 4: Update patience bar Y (lines 224–227)**

Find (include the leading comment — it is present in the source):

```typescript
    // Patience bar background
    const patienceBarBg = this.add.rectangle(seatX, 100, 100, 10, 0x444444).setOrigin(0.5)
    // Patience bar foreground (origin 0, 0.5 so shrinking width goes left-to-right)
    const patienceBar = this.add.rectangle(seatX - 50, 100, 100, 10, 0x44ff44).setOrigin(0, 0.5)
```

Replace with:

```typescript
    // Patience bar background
    const patienceBarBg = this.add.rectangle(seatX, 390, 100, 10, 0x444444).setOrigin(0.5)
    // Patience bar foreground (origin 0, 0.5 so shrinking width goes left-to-right)
    const patienceBar = this.add.rectangle(seatX - 50, 390, 100, 10, 0x44ff44).setOrigin(0, 0.5)
```

Bar at y=390 sits on the counter surface (counter band y=360–400), above the orc top edge at y=403.

---

- [ ] **Step 5: Update ticket background position and size (line 230)**

Find:

```typescript
    const ticketBg = this.add.rectangle(seatX, 260, 100, 120, 0xf5e6c8).setStrokeStyle(2, 0x8b6340)
```

Replace with:

```typescript
    const ticketBg = this.add.rectangle(seatX + 115, 475, 100, 110, 0xf5e6c8).setStrokeStyle(2, 0x8b6340)
```

Ticket is now to the right of the orc (5px gap between orc right edge and ticket left edge), centered vertically with the orc.

---

- [ ] **Step 6: Update ticket text lines (lines 233–240)**

Find (include the leading comment):

```typescript
    // Ingredient text lines
    const lines: Phaser.GameObjects.Text[] = ingredients.map((ing, i) =>
      this.add.text(seatX, 213 + i * 26, ing.word, {
        fontSize: '15px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5)
    )
```

Replace with:

```typescript
    // Ingredient text lines
    const lines: Phaser.GameObjects.Text[] = ingredients.map((ing, i) =>
      this.add.text(seatX + 115, 435 + i * 24, ing.word, {
        fontSize: '15px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5)
    )
```

First text line at y=435 (15px below ticket top at y=420), spacing 24px.

---

- [ ] **Step 7: Update underline positions (lines 243–245)**

Find (include the leading comment):

```typescript
    // Underlines — one per ingredient, hidden by default
    const underlines: Phaser.GameObjects.Rectangle[] = lines.map((line, i) =>
      this.add.rectangle(seatX, 213 + i * 26 + 11, line.width + 4, 2, 0x1a0a00).setOrigin(0.5).setAlpha(0)
    )
```

Replace with:

```typescript
    // Underlines — one per ingredient, hidden by default
    const underlines: Phaser.GameObjects.Rectangle[] = lines.map((line, i) =>
      this.add.rectangle(seatX + 115, 435 + i * 24 + 10, line.width + 4, 2, 0x1a0a00).setOrigin(0.5).setAlpha(0)
    )
```

Underlines are 10px below their text line, matching the new text Y formula.

---

- [ ] **Step 8: Run tests again to confirm nothing broke**

```bash
npm test
```

Expected: same pass count as Step 1. These are coordinate-only changes with no logic impact, so all tests should still pass.

---

- [ ] **Step 9: Commit**

```bash
git add src/scenes/level-types/CrazedCookLevel.ts
git commit -m "feat: move orcs/tickets/bars to seating zone, tickets to right of orc"
```

---

- [ ] **Step 10: Visual smoke test**

```bash
npm run dev
```

Open the game, navigate to a Crazed Cook level, and verify:

- [ ] 4 orc seats visible (not 5)
- [ ] Orcs appear in the bottom seating zone (below the serving counter)
- [ ] Patience bars appear at the counter surface (top edge of seating zone)
- [ ] Tickets appear to the right of each orc, not on top of them
- [ ] Tickets do not overlap with adjacent orcs or with the finger hints
- [ ] Active ticket highlights correctly (gold border)
- [ ] Completed ingredients show green checkmarks in the right position
- [ ] Orc attack animation still plays correctly when patience runs out
