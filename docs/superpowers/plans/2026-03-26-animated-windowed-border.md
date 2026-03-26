# Animated Windowed Border Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a subtly animated RPG-style border around the game canvas whenever the game is not in fullscreen mode.

**Architecture:** Pure CSS — add `padding: 36px` to `#app` so Phaser's canvas leaves visible margin, add CSS `@keyframes` for a breathing canvas glow and drifting runic dots, then collapse everything in fullscreen using `:fullscreen` selectors.

**Tech Stack:** CSS (no JS, no HTML changes). `src/style.css` is the only file touched.

---

## File Map

| File | Change |
|---|---|
| `src/style.css` | Add padding, two `@keyframes` blocks, fullscreen-collapse rules; replace static canvas `box-shadow` with animated version |

---

### Task 1: Add padding and fullscreen-collapse rules

This makes the border area visible and ensures it disappears in fullscreen.

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add `padding: 36px` to the `#app` rule**

  Open `src/style.css`. Find the `#app` rule (currently lines ~15–44). Add `padding: 36px;` after `justify-content: center;`. The rule should look like:

  ```css
  #app {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36px;

    background-image: ...  /* unchanged */
    background-size: ...   /* unchanged */
    background-position:
      center center,
      center center,
      0 0,
      center center;

    box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.9);
  }
  ```

  Note: `box-sizing: border-box` is already set globally, so the padding shrinks the inner content box — Phaser will observe the smaller client dimensions and size the canvas to fit, leaving the 36px margin visible.

- [ ] **Step 2: Add fullscreen-collapse rules after the `#app` block**

  Append this block immediately after the closing `}` of `#app`:

  ```css
  /* Fullscreen: collapse border so canvas fills the display */
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

  Three selectors are used because Phaser may call `requestFullscreen()` on `#app` itself or on `document.documentElement` depending on the Phaser version and browser. All cases are covered.

- [ ] **Step 3: Verify the dev server shows a visible border**

  Run `npm run dev`, open the game, confirm there is a ~36px gold-tinted runic margin around the canvas on all four sides. The canvas should be slightly smaller than the window.

- [ ] **Step 4: Commit**

  ```bash
  git add src/style.css
  git commit -m "feat: show border margin in windowed mode via #app padding"
  ```

---

### Task 2: Add `runeGlow` animation (canvas breathing pulse)

Replaces the existing static `box-shadow` on the canvas with a slow pulsing glow.

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add the `runeGlow` keyframes block**

  Insert this block near the top of `src/style.css`, after the `html, body` rule and before the `#app` rule:

  ```css
  @keyframes runeGlow {
    0%, 100% {
      box-shadow:
        0 0 10px rgba(212, 175, 55, 0.25),
        0 0 40px rgba(0, 0, 0, 0.8);
    }
    50% {
      box-shadow:
        0 0 30px rgba(212, 175, 55, 0.70),
        0 0 70px rgba(0, 0, 0, 0.8);
    }
  }
  ```

- [ ] **Step 2: Replace the static `box-shadow` on `#app canvas` with the animation**

  Find the `#app canvas` rule (currently lines ~47–56). It has a static `box-shadow`. Replace it so the rule reads:

  ```css
  #app canvas {
    border: 4px solid #d4af37;
    border-radius: 8px;
    animation: runeGlow 4s ease-in-out infinite;
    z-index: 10;
  }
  ```

  The static `box-shadow:` lines are removed entirely — `runeGlow` takes over.

- [ ] **Step 3: Verify the glow pulses**

  In the browser with `npm run dev` running, watch the canvas edge for ~8 seconds. The gold glow should dim and brighten on a slow 4-second cycle.

- [ ] **Step 4: Commit**

  ```bash
  git add src/style.css
  git commit -m "feat: add runeGlow breathing pulse to canvas border"
  ```

---

### Task 3: Add `runeDrift` animation (runic dot drift)

Slowly scrolls the runic-dot background layer across the border margin.

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Add the `runeDrift` keyframes block**

  Add this block directly after `@keyframes runeGlow`:

  ```css
  @keyframes runeDrift {
    0% {
      background-position:
        center center,
        center center,
        0 0,
        center center;
    }
    100% {
      background-position:
        center center,
        center center,
        32px 0,
        center center;
    }
  }
  ```

  All four layer positions must be listed at every step. Layers 1, 2, and 4 are held constant. Layer 3 (the runic dots, `background-size: 32px 32px`) shifts exactly one tile width (32px) so the loop is seamless.

- [ ] **Step 2: Apply the animation to `#app`**

  Add `animation: runeDrift 8s linear infinite;` to the `#app` rule, after the `box-shadow` line:

  ```css
  #app {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36px;
    background-image: ...   /* unchanged */
    background-size: ...    /* unchanged */
    background-position:
      center center,
      center center,
      0 0,
      center center;
    box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.9);
    animation: runeDrift 8s linear infinite;
  }
  ```

- [ ] **Step 3: Verify the dots drift**

  Watch the border area for ~16 seconds. The faint blue-purple runic dots should move slowly to the right and loop back without a visible seam.

- [ ] **Step 4: Verify fullscreen collapses all animation**

  In the running game, navigate to Settings and press "Enter Full Screen". Confirm:
  - The border disappears (padding collapses to 0)
  - The canvas fills the display
  - No animation artifacts

  Exit fullscreen and confirm the border and animations return.

- [ ] **Step 5: Commit**

  ```bash
  git add src/style.css
  git commit -m "feat: add runeDrift animation to windowed border margin"
  ```
