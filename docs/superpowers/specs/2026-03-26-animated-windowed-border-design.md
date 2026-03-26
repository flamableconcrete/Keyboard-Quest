# Animated Windowed Border — Design Spec

**Date:** 2026-03-26
**Status:** Approved
**Scope:** `src/style.css` only

## Problem

The game canvas fills `#app` entirely in windowed mode (Phaser `Scale.FIT` maximises canvas within parent). The fancy runic-gold background pattern already applied to `#app` in a recent commit is never visible — there's no gap between the canvas edge and the `#app` boundary. The original issue ("game should always run in full-screen, implement a fancy border that can be safely cropped by the viewport") is unresolved.

## Goal

Show a visible, subtly animated RPG-style border around the canvas whenever the game is **not** in fullscreen. In fullscreen the border must disappear so the canvas uses the full display.

## Design

### Approach

Pure CSS. No JS, no HTML changes. All changes in `src/style.css`.

### 1 — Padding on `#app`

Add `padding: 36px` to the existing `#app` rule. Because `box-sizing: border-box` is already globally set, the inner content area shrinks by 72px on each axis. Phaser observes the parent's client dimensions and resizes the canvas to fit — leaving a visible 36px margin on all sides that exposes the existing runic-gold background pattern.

### 2 — Collapse in fullscreen

```css
#app:fullscreen {
  padding: 0;
  animation: none;
}
```

Phaser calls `requestFullscreen()` on the `#app` element (configured as `parent: 'app'` in `main.ts`), so `#app:fullscreen` fires correctly. Padding drops to zero and animations are paused — nothing wasted when the border isn't visible.

### 3 — Canvas breathing glow (`runeGlow`)

A `@keyframes runeGlow` animation on `#app canvas` that cycles the existing `box-shadow` from dim gold to brighter gold over 4 seconds (ease-in-out, infinite). This makes the canvas edge feel alive without being distracting.

```
dim: 0 0 10px rgba(212,175,55,0.25), 0 0 40px rgba(0,0,0,0.8)
bright: 0 0 28px rgba(212,175,55,0.65), 0 0 60px rgba(0,0,0,0.8)
```

Canvas animation also paused in fullscreen: `#app:fullscreen canvas { animation: none; }`.

### 4 — Runic dot drift (`runeDrift`)

A `@keyframes runeDrift` animation on `#app` that shifts the `background-position` of the runic-dot tile layer by one tile width (32px) over 8 seconds, then loops. The dots slowly migrate across the border margin — subtle motion giving the impression of faint magical energy.

Only the third background-layer position (the radial-gradient dots, `background-size: 32px 32px`) needs to move; the other layers stay fixed.

## Files Changed

| File | Change |
|---|---|
| `src/style.css` | Add `padding`, `@keyframes runeGlow`, `@keyframes runeDrift`, fullscreen overrides |

## Non-Goals

- No corner ornaments or SVG decorations (deferred)
- No JS changes
- No changes to Phaser scale config
- Mobile path unchanged (uses `Scale.RESIZE`, already fills viewport)

## Success Criteria

1. In windowed mode at any window size, a gold-framed runic border is visible around the canvas
2. The canvas glow pulses slowly (4s cycle, not jarring)
3. The runic dots in the border drift gently (8s cycle)
4. Entering fullscreen (via Settings) collapses the border completely — canvas fills the display
5. Leaving fullscreen restores the border and animations
