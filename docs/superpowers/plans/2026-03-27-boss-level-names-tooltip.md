# Boss Level Names + Letter-Unlock Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all boss/mini-boss level names to possessive format, and show the unlocked letter in the overland map hover tooltip.

**Architecture:** Pure data edits to world1–5.ts for the renames; one targeted string change in `OverlandMapScene.showTooltip` for the tooltip. No new files, no new types.

**Tech Stack:** TypeScript, Phaser 3, Vite

---

## File Map

| File | Change |
|------|--------|
| `src/data/levels/world1.ts` | Rename 3 boss level `name` fields |
| `src/data/levels/world2.ts` | Rename 5 boss level `name` fields |
| `src/data/levels/world3.ts` | Rename 5 boss level `name` fields |
| `src/data/levels/world4.ts` | Rename 4 boss level `name` fields |
| `src/data/levels/world5.ts` | Rename 4 boss level `name` fields |
| `src/scenes/OverlandMapScene.ts` | Add letter line to `showTooltip` (~line 534) |

---

## Task 1: Rename boss level names in world1–world5

**Files:**
- Modify: `src/data/levels/world1.ts`
- Modify: `src/data/levels/world2.ts`
- Modify: `src/data/levels/world3.ts`
- Modify: `src/data/levels/world4.ts`
- Modify: `src/data/levels/world5.ts`

Apply these exact `name` field changes (only the listed IDs change; all others stay as-is):

**world1.ts**

- [ ] **Step 1: Apply renames**

| ID | Old name | New name |
|----|----------|----------|
| w1_mb1 | `Grom's Thicket` | `Knuckle's Thicket` |
| w1_mb2 | `Serpent's Coil` | `Nessa's Coil` |
| w1_mb3 | `Shadowfall Crag` | `Rend's Crag` |

In each `LevelConfig` object, update only the `name` field. Example for w1_mb1:
```typescript
// Before
name: "Grom's Thicket",
// After
name: "Knuckle's Thicket",
```

**world2.ts**

- [ ] **Step 2: Apply renames**

| ID | Old name | New name |
|----|----------|----------|
| w2_mb1 | `Bramblegate Watch` | `Typo's Watch` |
| w2_mb2 | `Ironweb Keep` | `Arachna's Keep` |
| w2_mb3 | `Hollowhorn Peak` | `Flashword's Peak` |
| w2_mb4 | `Frostbite Hollow` | `Rattles' Hollow` |
| w2_boss | `Lair of the Deep Fen Hydra` | `Tiamat's Lair` |

**world3.ts**

- [ ] **Step 3: Apply renames**

| ID | Old name | New name |
|----|----------|----------|
| w3_mb1 | `Obsidian Gate` | `Lich's Gate` |
| w3_mb2 | `Spire of the Phoenix` | `Ignis' Spire` |
| w3_mb3 | `The Umber Bridge` | `Grizzlefang's Bridge` |
| w3_mb4 | `The Gorgon's Pit` | `Sludge's Pit` |
| w3_boss | `The Brass Citadel` | `Mecha-Wyrm's Citadel` |

**world4.ts**

- [ ] **Step 4: Apply renames**

| ID | Old name | New name |
|----|----------|----------|
| w4_mb1 | `Troll's Toll Bridge` | `Rattles' Bridge` |
| w4_mb2 | `Keep of the Wraith-Witch` | `Flashword's Keep` |
| w4_mb3 | `Frosthowl Summit` | `Arachna's Summit` |
| w4_mb4 | `Vault of the Ancients` | `Typo's Vault` |

**world5.ts**

- [ ] **Step 5: Apply renames**

| ID | Old name | New name |
|----|----------|----------|
| w5_mb1 | `Chamber of the Quillmaster` | `Ignis' Chamber` |
| w5_mb2 | `Spire of the Hexed Exile` | `Lich's Spire` |
| w5_mb3 | `Zealot's Ascent` | `Grizzlefang's Ascent` |
| w5_mb4 | `Hall of Illusions` | `Arachna's Hall` |

- [ ] **Step 6: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/data/levels/world1.ts src/data/levels/world2.ts src/data/levels/world3.ts src/data/levels/world4.ts src/data/levels/world5.ts
git commit -m "feat: rename boss level names to possessive format"
```

---

## Task 2: Show unlocked letter in overland map hover tooltip

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts` (line ~534)

The existing `showTooltip` method builds tooltip text as `${label}${level.name}`. Add a second line when `miniBossUnlocksLetter` is present.

- [ ] **Step 1: Edit `showTooltip` in OverlandMapScene.ts**

Find the `showTooltip` method (~line 531). The current text construction is:

```typescript
private showTooltip(level: LevelConfig, pos: NodePosition) {
  this.hideTooltip()
  const label = level.isMiniBoss ? '⚔ MINI-BOSS: ' : level.isBoss ? '👑 BOSS: ' : ''
  this.tooltipText = this.add.text(pos.x, pos.y - 35, `${label}${level.name}`, {
    fontSize: '14px', color: '#ffffff', backgroundColor: '#000000',
    padding: { x: 6, y: 4 }
  }).setOrigin(0.5).setDepth(2000).setAlpha(0)
```

Replace with:

```typescript
private showTooltip(level: LevelConfig, pos: NodePosition) {
  this.hideTooltip()
  const label = level.isMiniBoss ? '⚔ MINI-BOSS: ' : level.isBoss ? '👑 BOSS: ' : ''
  const letterLine = level.miniBossUnlocksLetter ? `\nUnlocks letter: ${level.miniBossUnlocksLetter.toUpperCase()}` : ''
  this.tooltipText = this.add.text(pos.x, pos.y - 35, `${label}${level.name}${letterLine}`, {
    fontSize: '14px', color: '#ffffff', backgroundColor: '#000000',
    padding: { x: 6, y: 4 }
  }).setOrigin(0.5).setDepth(2000).setAlpha(0)
```

- [ ] **Step 2: Build to verify no TypeScript errors**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Open the game, navigate to the overland map, and hover over a mini-boss node (e.g., w1_mb1 "Knuckle's Thicket"). The tooltip should show:
```
⚔ MINI-BOSS: Knuckle's Thicket
Unlocks letter: E
```

Hover over a regular level node — it should show only the level name with no letter line.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: show unlocked letter in overland map hover tooltip"
```
