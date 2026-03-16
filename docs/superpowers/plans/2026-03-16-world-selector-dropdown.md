# World Selector Dropdown Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the world title text at the top of the overland map clickable, opening a dropdown that pans the camera to any world (locked worlds grayed out, all 5 always shown).

**Architecture:** All changes self-contained in `src/scenes/OverlandMapScene.ts`. Add four private methods and two private fields. Modify `worldTitleText` creation to be interactive and fix the `update()` scroll-title guard to append `' ▼'`. No new files, no other scenes touched.

**Tech Stack:** Phaser 3, TypeScript, Vite. Tests via Vitest (but Phaser scene code is not unit-testable — verification is via `npm run build` type-check + manual browser testing).

**Spec:** `docs/superpowers/specs/2026-03-16-world-selector-dropdown-design.md`

---

## Chunk 1: Helper methods + fields

### Task 1: Add private fields and helper methods

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

The existing private fields block is around line 14–32. Add the two new fields after `private allNodes`. The new methods go after `panToAvatar()` (around line 593).

- [ ] **Step 1: Add the two new private fields**

In `src/scenes/OverlandMapScene.ts`, after the line:
```ts
private allNodes: { level: LevelConfig; pos: NodePosition }[] = []
```
add:
```ts
private dropdownOpen = false
private dropdownItems: (Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Zone)[] = []
```

- [ ] **Step 2: Add `isWorldUnlocked` method**

After the closing `}` of `panToAvatar()` (around line 593), add:
```ts
private isWorldUnlocked(worldIdx: number): boolean {
  return getLevelsForWorld(worldIdx + 1).some(l => this.isUnlocked(l.id))
}
```

- [ ] **Step 3: Add `closeWorldDropdown` method**

Immediately after `isWorldUnlocked`:
```ts
private closeWorldDropdown(): void {
  this.dropdownItems.forEach(o => { if (o?.active) o.destroy() })
  this.dropdownItems = []
  this.dropdownOpen = false
}
```

- [ ] **Step 4: Add `panToWorld` method**

Immediately after `closeWorldDropdown`:
```ts
private panToWorld(worldIdx: number): void {
  this.tweens.killTweensOf(this.cameras.main)
  const nodeX = UNIFIED_MAP.xOffsets[worldIdx] + UNIFIED_MAP.worlds[worldIdx].nodePositions[0].x
  const targetScrollX = Phaser.Math.Clamp(
    nodeX - this.scale.width / 2,
    0,
    UNIFIED_MAP.totalWidth - this.scale.width
  )
  this.tweens.add({
    targets: this.cameras.main,
    scrollX: targetScrollX,
    duration: 500,
    ease: 'Sine.easeInOut',
  })
}
```

- [ ] **Step 5: Type-check**

Run: `npm run build`
Expected: no TypeScript errors. (The new methods aren't wired up yet — no "unused variable" errors in TypeScript for private fields/methods that are simply unreferenced at this stage.)

- [ ] **Step 6: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: add world selector helper fields and methods (unwired)"
```

---

## Chunk 2: `openWorldDropdown` + wiring

### Task 2: Implement `openWorldDropdown` and wire up the title

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

- [ ] **Step 1: Add `openWorldDropdown` method**

After `panToWorld`, add:
```ts
private openWorldDropdown(): void {
  this.dropdownOpen = true
  const cx = this.scale.width / 2

  const bg = this.add.rectangle(cx, 135, 320, 160, 0x000000)
    .setAlpha(0.75).setDepth(2099).setScrollFactor(0)
  this.dropdownItems.push(bg)

  const dismissZone = this.add.zone(cx, this.scale.height / 2, this.scale.width, this.scale.height)
    .setInteractive().setDepth(1999).setScrollFactor(0)
  dismissZone.on('pointerdown', () => this.closeWorldDropdown())
  this.dropdownItems.push(dismissZone)

  ;[0, 1, 2, 3, 4].forEach((i) => {
    const name = this.worldNameForIndex(i)
    const unlocked = this.isWorldUnlocked(i)
    const item = this.add.text(cx, 75 + i * 30, name, {
      fontSize: '20px',
      color: unlocked ? '#ffd700' : '#555555',
    }).setOrigin(0.5, 0.5).setDepth(2100).setScrollFactor(0)

    if (unlocked) {
      item.setInteractive({ useHandCursor: true })
      item.on('pointerover', () => item.setColor('#ffffff'))
      item.on('pointerout', () => item.setColor('#ffd700'))
      item.on('pointerdown', () => {
        this.closeWorldDropdown()
        this.panToWorld(i)
      })
    }

    this.dropdownItems.push(item)
  })
}
```

- [ ] **Step 2: Modify `worldTitleText` creation**

Find this block in `create()` (around line 183):
```ts
this.worldTitleText = this.add.text(
  this.scale.width / 2, 40,
  this.worldNameForIndex(currentWorldIdx),
  { fontSize: '28px', color: '#ffd700' }
).setOrigin(0.5).setDepth(2000).setScrollFactor(0)
```

Replace it with:
```ts
this.worldTitleText = this.add.text(
  this.scale.width / 2, 40,
  this.worldNameForIndex(currentWorldIdx) + ' ▼',
  { fontSize: '28px', color: '#ffd700' }
).setOrigin(0.5).setDepth(2000).setScrollFactor(0)
  .setInteractive({ useHandCursor: true })

this.worldTitleText.on('pointerdown', (_ptr: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
  event.stopPropagation()
  if (this.isGliding) return
  if (this.dropdownOpen) {
    this.closeWorldDropdown()
  } else {
    this.openWorldDropdown()
  }
})
```

- [ ] **Step 3: Fix the `update()` title guard**

Find this block in `update()` (around line 334):
```ts
if (this.worldTitleText) {
  const visibleWorldIdx = worldIndexAtScrollX(
    this.cameras.main.scrollX,
    UNIFIED_MAP.xOffsets,
    UNIFIED_MAP.totalWidth,
    this.scale.width,
  )
  const name = this.worldNameForIndex(visibleWorldIdx)
  if (this.worldTitleText.text !== name) {
    this.worldTitleText.setText(name)
  }
}
```

Replace it with:
```ts
if (this.worldTitleText) {
  const visibleWorldIdx = worldIndexAtScrollX(
    this.cameras.main.scrollX,
    UNIFIED_MAP.xOffsets,
    UNIFIED_MAP.totalWidth,
    this.scale.width,
  )
  const name = this.worldNameForIndex(visibleWorldIdx)
  if (!this.dropdownOpen && this.worldTitleText.text !== name + ' ▼') {
    this.worldTitleText.setText(name + ' ▼')
  }
}
```

- [ ] **Step 4: Type-check**

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 5: Manual browser verification**

Run: `npm run dev` and open `http://localhost:5173` in the browser. Load or create a profile and navigate to the overland map.

Check all of the following:

1. **Title shows `▼`** — the world title at the top always ends with ` ▼` (e.g. `World 1 — The Heartland ▼`).
2. **Hand cursor** — hovering the title shows a pointer cursor.
3. **Open dropdown** — clicking the title shows the 5 world names below it on a dark background.
4. **Locked worlds gray** — worlds the player hasn't reached yet appear in gray and are not clickable.
5. **Unlocked worlds gold** — accessible worlds are gold and highlight white on hover.
6. **Camera pan** — clicking an unlocked world smoothly pans the camera to that world's first level node (centered), with the avatar staying in place.
7. **Close by clicking title** — clicking the title again dismisses the dropdown.
8. **Close by clicking map** — clicking anywhere on the map (not on a dropdown item or HUD button) dismisses the dropdown.
9. **Title updates after close** — after closing and panning, the title reflects the world now visible in the viewport.
10. **Glide guard** — clicking a level node (which starts a glide) and then immediately clicking the title does nothing (dropdown doesn't open while gliding).

- [ ] **Step 6: Commit**

```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: add world selector dropdown to overland map title"
```
