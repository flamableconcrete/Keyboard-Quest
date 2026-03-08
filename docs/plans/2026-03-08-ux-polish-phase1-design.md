# UX Polish Phase 1 — Design

## Summary

Four changes to polish the GoblinWhacker level experience:
1. Fix the bug where only the first goblin can be defeated
2. Auto-fit game to browser window (16:9 letterboxed)
3. Replace keyboard overlay with unified hand indicator + next-letter display
4. Add pixel art for the GoblinWhacker level

## 1. Bug Fix: TypingEngine clearWord race condition

**Problem:** In `TypingEngine.ts:81-89`, `clearWord()` is called *after* the `onWordComplete` callback. But the callback sets the next word via `engine.setWord()`. The subsequent `clearWord()` wipes it out, leaving the engine with no current word. Players can only ever defeat one goblin.

**Fix:** Call `clearWord()` before firing `onWordComplete`, or guard it so it doesn't clear a freshly-set word.

## 2. Full-screen auto-fit

Add Phaser Scale Manager config to `main.ts`:
- `mode: Phaser.Scale.FIT`
- `autoCenter: Phaser.Scale.CENTER_BOTH`
- Parent element: `#app`

Update `index.html`/`style.css`:
- Body and `#app` fill viewport (100vw/100vh, no scroll)
- Dark background color on body to serve as letterbox bars
- Remove max-width constraint on `#app`

Result: 1280x720 game canvas auto-scales to fill browser, centered with letterboxing.

## 3. Unified hand overlay — `TypingHands` component

Replaces both `GhostKeyboard` and `TutorialHands` with a single component.

**Visual design:**
- Two hand silhouettes drawn with Phaser graphics, centered at bottom of screen
- 5 fingers per hand, sized proportionally (pinky smallest, middle tallest)
- Palm area connecting fingers
- Default color: dark muted blue (`#334466`)
- Active finger: gold (`#ffd700`) with a pulse tween (alpha oscillation)

**Next-letter display:**
- Large text (48-56px) centered above the hands
- Shows the next character to type
- White with subtle glow/shadow

**Finger mapping:** Reuses existing `CHAR_FINGER` mapping from TutorialHands.

**Integration:**
- Created in GoblinWhackerLevel for World 1 levels (`w1_l1`, `w1_l2`)
- `highlightFinger(ch)` called from `setActiveGoblin()` and on each correct keystroke
- `destroy()` on level end

**Files removed/changed:**
- `GhostKeyboard.ts` — no longer imported in GoblinWhackerLevel
- `TutorialHands.ts` — no longer imported in GoblinWhackerLevel
- Both files kept in repo (may be used elsewhere) but unused by GoblinWhacker

## 4. Pixel art for GoblinWhacker level

All art generated programmatically via Phaser Graphics + RenderTexture (no external files).

**Assets to create in a new `src/art/goblinWhackerArt.ts` module:**

- **Goblin sprite:** ~40x40 pixel art goblin (green body, pointy ears, simple animation frames for idle wobble and death poof)
- **Background:** Forest/meadow scene — gradient sky, tree silhouettes, grass foreground
- **Player character:** Simple hero silhouette on the left side (~60x80)
- **Heart icons:** Pixel art hearts for HP display

**Generation approach:**
- Use Phaser `Graphics` to draw pixel-by-pixel or shape-by-shape
- Generate `RenderTexture` or use `generateTexture()` to create reusable texture keys
- Called once in `create()` before building game objects
- Goblins reference the generated texture key instead of using `add.rectangle()`

**Art style:** Chunky 16-bit pixel art, bright saturated colors, black outlines.
