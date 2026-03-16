# World Selector Dropdown — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Scope:** `src/scenes/OverlandMapScene.ts` only

---

## Overview

The world title text at the top of the overland map becomes a clickable dropdown that lets players jump the camera to any world. All 5 worlds are always shown; locked worlds are grayed out and non-interactive.

---

## Interaction Model

- The world title (`worldTitleText`) displays a `▼` suffix and has a hand cursor, signaling it is clickable.
- Clicking the title **toggles** the dropdown open/closed.
- Clicking **anywhere else** on the map closes the dropdown (via a transparent full-screen zone placed behind the dropdown but above the map).
- While the dropdown is open, the title text does **not** update from scroll position (prevents text flicker).
- Map panning and level node clicks are not blocked by the dropdown — the dismiss zone handles closure before any map interaction registers.

---

## Dropdown UI

- **Position:** centered horizontally on screen, stacked vertically below the title (~30px per row).
- **Background:** a dark semi-transparent `Phaser.GameObjects.Rectangle` (color `#000000`, alpha 0.75) behind all items, depth 2099, scrollFactor 0.
- **Items:** one `Phaser.GameObjects.Text` per world (5 total), depth 2100, scrollFactor 0.
  - Unlocked world: gold text (`#ffd700`), hand cursor, highlights white on hover.
  - Locked world: gray text (`#555555`), no cursor, not interactive.
- **World unlock check:** a world index `i` is unlocked if any level with `world === i+1` has its `id` in `profile.unlockedLevelIds`.

---

## Camera Pan on Selection

- Clicking an unlocked world item:
  1. Closes the dropdown immediately.
  2. Reads the first node position for that world from `UNIFIED_MAP.xOffsets[i] + UNIFIED_MAP.worlds[i].nodePositions[0].x`.
  3. Tweens `cameras.main.scrollX` to center on that x-position (clamped to map bounds), 500ms `Sine.easeInOut` — same style as `panToAvatar()`.
- The avatar does **not** move.

---

## Implementation Scope

All changes are self-contained in `OverlandMapScene.ts`.

### New private fields

```ts
private dropdownOpen = false
private dropdownItems: Phaser.GameObjects.GameObject[] = []
```

### New private methods

| Method | Purpose |
|--------|---------|
| `isWorldUnlocked(worldIdx: number): boolean` | Returns true if any level in that world is in `profile.unlockedLevelIds` |
| `openWorldDropdown(): void` | Creates background rect, dismiss zone, and 5 text items |
| `closeWorldDropdown(): void` | Destroys all dropdown GameObjects, resets `dropdownOpen` |
| `panToWorld(worldIdx: number): void` | Tweens camera to first node of given world |

### Modified existing code

- `worldTitleText` creation: append ` ▼`, make interactive, add `pointerdown` → `openWorldDropdown()`.
- `update()`: guard `worldTitleText.setText(...)` with `if (!this.dropdownOpen)`.

---

## Out of Scope

- Mobile (`MobileOverlandMapScene`) — separate scene, not touched.
- Avatar movement — camera pan only.
- Animations beyond the existing tween style.
- Persisting the selected world to the profile.
