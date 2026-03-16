# World Selector Dropdown — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Scope:** `src/scenes/OverlandMapScene.ts` only

---

## Overview

The world title text at the top of the overland map becomes a clickable dropdown that lets players jump the camera to any world. All 5 worlds are always shown; locked worlds are grayed out and non-interactive.

---

## Interaction Model

- The world title (`worldTitleText`) displays a ` ▼` suffix at all times and has a hand cursor.
- The dropdown is **disabled while `isGliding` is true** — the title's `pointerdown` handler returns early if gliding.
- Clicking the title **toggles** the dropdown: the handler checks `dropdownOpen` first — if true, calls `closeWorldDropdown()`; if false, calls `openWorldDropdown()`. The handler always calls `event.stopPropagation()`.
- While the dropdown is open, a full-screen `Phaser.GameObjects.Zone` (created via `this.add.zone`) acts as a dismiss zone at **depth 1999**, scrollFactor 0. Phaser's default `setTopOnly` means only the topmost interactive object at a given point receives events, so:
  - Clicking a dropdown item (depth 2100) fires the item, not the dismiss zone.
  - Clicking a HUD button zone (depth 2002) fires the button, not the dismiss zone — the dropdown remains open but the scene navigates away, which is acceptable.
  - Clicking anywhere else on the map fires the dismiss zone → `closeWorldDropdown()`.
- While the dropdown is open, the title text does **not** update from scroll position. The `update()` guard: replace `if (this.worldTitleText.text !== name)` with `if (!this.dropdownOpen && this.worldTitleText.text !== name + ' ▼')`, and `setText(name)` with `setText(name + ' ▼')`. The title text while the dropdown is open reads whatever the scroll-position world name was at the moment of opening.
- Keyboard dismiss is **out of scope**.

---

## Dropdown UI

**Positioning:**
- Title sits at `(width/2, 40)`. First dropdown item at `y = 75`, 30px between item centers → last item at `y = 195`.
- Background rect: centered on screen at `(width/2, 135)`, 320×160px. The 160px height gives ~20px padding above the first item and below the last (items span y=75–195 = 120px; rect center 135 ± 80 = y=55–215).
- Depth layout: dismiss zone 1999, title 2000, background rect 2099, dropdown items 2100. The title at depth 2000 sits above the dismiss zone but below the background rect — it is visually at y=40 and the rect starts at y=55, so they do not overlap.

**Background:** `Phaser.GameObjects.Rectangle` (fill `0x000000`, alpha 0.75), depth 2099, scrollFactor 0.

**Items:** `Phaser.GameObjects.Text` per world (5 total), origin `(0.5, 0.5)`, depth 2100, scrollFactor 0, fontSize `'20px'`.
- **Unlocked** world: gold text (`#ffd700`), `setInteractive({ useHandCursor: true })`, `pointerover` → `#ffffff`, `pointerout` → `#ffd700`, `pointerdown` → select.
- **Locked** world: gray text (`#555555`), not interactive.

**World unlock check:** delegates to the existing `isUnlocked(levelId)` method:
```ts
private isWorldUnlocked(worldIdx: number): boolean {
  return getLevelsForWorld(worldIdx + 1).some(l => this.isUnlocked(l.id))
}
```
- World 1 is always unlocked on a fresh profile (`w1_l1` is always in `unlockedLevelIds`).
- If a world has no levels, `some()` returns `false` — shows as locked.
- `debugUnlockedLevelIds` is not used in existing `isUnlocked()` and is not considered here.

---

## Camera Pan on Selection

- Clicking an unlocked world item:
  1. Calls `closeWorldDropdown()`.
  2. Calls `panToWorld(worldIdx)`.
- `panToWorld(worldIdx)`:
  - Since the dropdown is only openable when `!isGliding`, there can be no concurrent glide tween. The `killTweensOf(cameras.main)` call is a safety measure only.
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
- The avatar does **not** move.

---

## Implementation Scope

All changes are self-contained in `OverlandMapScene.ts`.

### New private fields

```ts
private dropdownOpen = false
private dropdownItems: (Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Zone)[] = []
```

### New private methods

| Method | Purpose |
|--------|---------|
| `isWorldUnlocked(worldIdx: number): boolean` | Delegates to existing `isUnlocked()` per level |
| `openWorldDropdown(): void` | Creates background rect + dismiss zone (both via `this.add.*`, both pushed to `dropdownItems`) + 5 text items (pushed to `dropdownItems`); sets `dropdownOpen = true` |
| `closeWorldDropdown(): void` | Destroys all items, clears array, sets `dropdownOpen = false` |
| `panToWorld(worldIdx: number): void` | Kills camera tweens; tweens `cameras.main.scrollX` to center on world's first node |

**All GameObjects created in `openWorldDropdown()` are pushed into `dropdownItems`** (rect, zone, and 5 text items).

**`closeWorldDropdown()`:**
```ts
private closeWorldDropdown(): void {
  this.dropdownItems.forEach(o => { if (o?.active) o.destroy() })
  this.dropdownItems = []
  this.dropdownOpen = false
}
```

### Modified existing code

- `worldTitleText` creation: initial text = `this.worldNameForIndex(currentWorldIdx) + ' ▼'`; make interactive with hand cursor; add `pointerdown` handler: return early if `isGliding`, call `event.stopPropagation()`, toggle dropdown.
- `update()`: change the `worldTitleText.setText` block to guard on `!this.dropdownOpen`, compare against `name + ' ▼'`, and set to `name + ' ▼'`.

---

## Out of Scope

- Mobile (`MobileOverlandMapScene`) — separate scene, not touched.
- Avatar movement — camera pan only.
- Keyboard navigation/dismiss (Escape, arrow keys).
- Persisting the selected world to the profile.
- Animations on dropdown open/close beyond instant appear.
- `debugUnlockedLevelIds` support.
