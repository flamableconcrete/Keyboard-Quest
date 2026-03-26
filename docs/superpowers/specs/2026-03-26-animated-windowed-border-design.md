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

Add `padding: 36px` to the existing `#app` rule. Because `box-sizing: border-box` is already globally set, the inner content area shrinks by 72px on each axis. Phaser observes the parent's client dimensions (`clientWidth` / `clientHeight`) and resizes the canvas to fit — leaving a visible 36px margin on all sides that exposes the existing runic-gold background pattern.

**Assumption:** `body` has a fully constrained size (it uses `min-height: 100dvh` with `display: flex` which in practice gives a definite block-axis size when the viewport fills the screen). If this assumption ever breaks the padding approach still works; the canvas will simply not be letter-boxed as tightly.

### 2 — Collapse in fullscreen

Phaser's `ScaleManager` calls `requestFullscreen()` on its fullscreen target. Depending on the Phaser version and browser this may be the `#app` element itself (since `parent: 'app'`) or `document.documentElement`. Both cases are covered with a broad selector group:

```css
#app:fullscreen,
html:fullscreen #app,
:root:fullscreen #app {
  padding: 0;
  animation: none;
}

#app:fullscreen canvas,
html:fullscreen #app canvas,
:root:fullscreen #app canvas {
  animation: none;
}
```

`animation: none` removes the animation and resets to the non-animated state (not a pause — on fullscreen exit the animation restarts from the beginning, which is acceptable for ambient effects).

### 3 — Canvas breathing glow (`runeGlow`)

A `@keyframes runeGlow` animation on `#app canvas` that cycles `box-shadow` from dim gold to brighter gold over 4 seconds (ease-in-out, infinite). This replaces the existing static `box-shadow` declaration on `#app canvas`.

The existing static value is `0 0 20px rgba(212,175,55,0.4), 0 0 60px rgba(0,0,0,0.8)`. The animation intentionally replaces this with a range from noticeably dimmer to noticeably brighter so the pulse is perceptible:

```
0%/100%: 0 0 10px rgba(212,175,55,0.25), 0 0 40px rgba(0,0,0,0.8)
50%:     0 0 30px rgba(212,175,55,0.70), 0 0 70px rgba(0,0,0,0.8)
```

### 4 — Runic dot drift (`runeDrift`)

A `@keyframes runeDrift` animation on `#app` that animates `background-position` over 8 seconds (linear, infinite). Because `background-position` is a shorthand that sets all layers simultaneously, **all four layer positions must be listed in every keyframe step** to prevent non-animated layers from snapping to `0 0`.

The existing four layers and their current positions:
1. Golden vertical lines — `center center`
2. Golden horizontal lines — `center center`
3. Runic dots (32×32 tile) — `0 0` (this layer moves)
4. Radial base gradient — `center center`

Keyframes:
```
0%:   background-position: center center, center center, 0 0,    center center
100%: background-position: center center, center center, 32px 0, center center
```

The dots scroll one full tile width horizontally in 8 seconds, then loop seamlessly (the tile repeats, so the seam is invisible).

## Files Changed

| File | Change |
|---|---|
| `src/style.css` | Add `padding: 36px` to `#app`; add `@keyframes runeGlow` and `@keyframes runeDrift`; add fullscreen-collapse selector group |

## Non-Goals

- No corner ornaments or SVG decorations (deferred)
- No JS changes
- No changes to Phaser scale config
- Mobile: the `#app` element receives the CSS padding on all viewports, but on mobile Phaser is configured with `Scale.RESIZE` pointing at `window.innerWidth/innerHeight` rather than the parent element, so the canvas fills the viewport regardless. The visual border may appear on mobile but is not a concern since mobile users see the `#mobile-overlay` and the canvas is hidden.

## Success Criteria

1. In windowed mode at any window size, a gold-framed runic border is visible around the canvas
2. The canvas glow pulses slowly (4s cycle, not jarring)
3. The runic dots in the border drift gently (8s cycle)
4. Entering fullscreen (via Settings) collapses the border completely — canvas fills the display
5. Leaving fullscreen restores the border and animations (restarting from the beginning is acceptable)
