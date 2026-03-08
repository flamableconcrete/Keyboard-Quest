# UX Polish Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the goblin-kill bug, make the game fullscreen, replace the keyboard overlay with a hand indicator, and add pixel art to the GoblinWhacker level.

**Architecture:** Four independent changes to the GoblinWhacker level and game config. The TypingEngine bug fix is a one-line change. Fullscreen is Phaser Scale Manager config + CSS. The hand overlay is a new `TypingHands` component replacing `GhostKeyboard`/`TutorialHands` in GoblinWhackerLevel. Pixel art is a new `src/art/goblinWhackerArt.ts` module that generates textures at runtime via Phaser Graphics.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest

---

### Task 1: Fix TypingEngine clearWord race condition

**Files:**
- Modify: `src/components/TypingEngine.ts:81-89`

**Step 1: Write the fix**

In `src/components/TypingEngine.ts`, the `handleKey` method calls `clearWord()` on line 89 AFTER the `onWordComplete` callback. But the callback may call `setWord()` to queue the next word. The `clearWord()` then wipes it out.

Fix: save `currentWord` and clear state BEFORE firing the callback, so any `setWord()` inside the callback persists.

Replace lines 81-89:

```typescript
      if (this.typedSoFar === this.currentWord) {
        this.completedWords++
        const elapsed = Date.now() - this.wordStartTime
        const word = this.currentWord
        const override = this._onCompleteOverride
        this._onCompleteOverride = undefined
        this.config.onWordComplete(word, elapsed)
        if (override) override(word, elapsed)
        this.clearWord()
      }
```

With:

```typescript
      if (this.typedSoFar === this.currentWord) {
        this.completedWords++
        const elapsed = Date.now() - this.wordStartTime
        const word = this.currentWord
        const override = this._onCompleteOverride
        this._onCompleteOverride = undefined
        this.clearWord()
        this.config.onWordComplete(word, elapsed)
        if (override) override(word, elapsed)
      }
```

The only change: `this.clearWord()` moves before the callbacks.

**Step 2: Run existing tests**

Run: `npx vitest run`
Expected: All existing tests pass (TypingEngine has no unit tests, but ensure nothing else breaks).

**Step 3: Manual verification**

Run: `npm run dev`
- Start a new profile, play Alder Falls
- Type the first goblin's word — it should die and the next goblin should become active (yellow highlight, word appears in typing area)
- Type the second goblin's word — it should also die
- Continue until level completes

**Step 4: Commit**

```bash
git add src/components/TypingEngine.ts
git commit -m "fix: clear word before onWordComplete callback to prevent race condition"
```

---

### Task 2: Full-screen auto-fit

**Files:**
- Modify: `src/main.ts:43-55`
- Modify: `index.html`
- Modify: `src/style.css`

**Step 1: Update Phaser game config**

In `src/main.ts`, add `scale` and `parent` to the game config:

```typescript
new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  parent: 'app',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    // ... same scene list ...
  ],
})
```

**Step 2: Update index.html**

Change the title from "temp-vite-app" to "Keyboard Quest":

```html
<title>Keyboard Quest</title>
```

**Step 3: Update style.css**

Replace the entire file with minimal styles that make the game fill the viewport:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000000;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

Black background serves as letterbox bars. No max-width constraint.

**Step 4: Run build check**

Run: `npm run build`
Expected: No errors.

**Step 5: Manual verification**

Run: `npm run dev`
- Game canvas should fill the browser window
- Resizing the window should scale the game proportionally
- Black letterbox bars should appear on sides or top/bottom depending on window aspect ratio

**Step 6: Commit**

```bash
git add src/main.ts index.html src/style.css
git commit -m "feat: auto-fit game to browser window with 16:9 letterboxing"
```

---

### Task 3: Create TypingHands component

**Files:**
- Create: `src/components/TypingHands.ts`
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts`

**Step 1: Create the TypingHands component**

Create `src/components/TypingHands.ts`:

```typescript
import Phaser from 'phaser'

type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'lt' | 'rt' | 'ri' | 'rm' | 'rr' | 'rp'

const CHAR_FINGER: Record<string, Finger> = {
  q: 'lp', a: 'lp', z: 'lp',
  w: 'lr', s: 'lr', x: 'lr',
  e: 'lm', d: 'lm', c: 'lm',
  r: 'li', f: 'li', v: 'li', t: 'li', g: 'li', b: 'li',
  ' ': 'lt',
  y: 'ri', h: 'ri', n: 'ri', u: 'ri', j: 'ri', m: 'ri',
  i: 'rm', k: 'rm', ',': 'rm',
  o: 'rr', l: 'rr', '.': 'rr',
  p: 'rp', ';': 'rp', '/': 'rp',
}

// Finger labels for display
const FINGER_LABELS: Record<Finger, string> = {
  lp: 'Pinky', lr: 'Ring', lm: 'Mid', li: 'Index', lt: 'Thumb',
  rt: 'Thumb', ri: 'Index', rm: 'Mid', rr: 'Ring', rp: 'Pinky',
}

export class TypingHands {
  private scene: Phaser.Scene
  private fingerGraphics: Map<Finger, Phaser.GameObjects.Graphics[]> = new Map()
  private nextLetterText!: Phaser.GameObjects.Text
  private nextLetterBg!: Phaser.GameObjects.Graphics
  private fingerLabelText!: Phaser.GameObjects.Text
  private currentFinger: Finger | null = null
  private pulseTween?: Phaser.Tweens.Tween
  private allObjects: Phaser.GameObjects.GameObject[] = []

  constructor(scene: Phaser.Scene, cx: number, cy: number) {
    this.scene = scene
    this.buildHands(cx, cy)
    this.buildNextLetterDisplay(cx, cy)
  }

  highlightFinger(ch: string) {
    const finger = CHAR_FINGER[ch.toLowerCase()] ?? null
    this.updateNextLetter(ch)

    if (finger === this.currentFinger) return
    this.currentFinger = finger
    this.pulseTween?.stop()

    // Reset all fingers to default
    this.fingerGraphics.forEach((graphics) => {
      graphics.forEach(g => { g.setAlpha(0.4) })
    })

    // Highlight active finger
    if (finger) {
      const active = this.fingerGraphics.get(finger)
      if (active) {
        active.forEach(g => { g.setAlpha(1.0) })
        // Pulse the active finger
        this.pulseTween = this.scene.tweens.add({
          targets: active,
          alpha: { from: 1.0, to: 0.5 },
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }
      this.fingerLabelText.setText(`${FINGER_LABELS[finger]}`)
    }
  }

  private updateNextLetter(ch: string) {
    this.nextLetterText.setText(ch.toUpperCase())
  }

  destroy() {
    this.pulseTween?.stop()
    this.allObjects.forEach(obj => obj.destroy())
  }

  fadeOut() {
    this.scene.tweens.add({
      targets: this.allObjects,
      alpha: 0,
      duration: 800,
    })
  }

  private buildNextLetterDisplay(cx: number, cy: number) {
    // "Next letter" display above the hands
    const letterY = cy - 100

    // Background circle behind letter
    this.nextLetterBg = this.scene.add.graphics()
    this.nextLetterBg.fillStyle(0x000000, 0.6)
    this.nextLetterBg.fillCircle(cx, letterY, 36)
    this.allObjects.push(this.nextLetterBg)

    // The letter itself
    this.nextLetterText = this.scene.add.text(cx, letterY, '', {
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#ffd700', blur: 12, fill: true },
    }).setOrigin(0.5)
    this.allObjects.push(this.nextLetterText)

    // Finger label below the letter
    this.fingerLabelText = this.scene.add.text(cx, letterY + 36, '', {
      fontSize: '16px',
      color: '#aaaacc',
    }).setOrigin(0.5)
    this.allObjects.push(this.fingerLabelText)
  }

  private buildHands(cx: number, cy: number) {
    // Hand layout: each hand has 5 fingers with varying heights
    // Heights represent finger lengths (proportional)
    const fingerHeights = [50, 65, 75, 65, 45] // pinky, ring, middle, index, thumb

    const fw = 28 // finger width
    const gap = 5
    const handWidth = 5 * fw + 4 * gap
    const handGap = 30 // gap between hands

    const leftFingers: Finger[] = ['lp', 'lr', 'lm', 'li', 'lt']
    const rightFingers: Finger[] = ['rp', 'rr', 'rm', 'ri', 'rt']

    // Draw left hand
    const leftStartX = cx - handGap / 2 - handWidth
    leftFingers.forEach((finger, i) => {
      const x = leftStartX + i * (fw + gap)
      const h = fingerHeights[i]
      const y = cy - h / 2 + 20 // offset so fingers extend upward from palm area
      const g = this.drawFinger(x, y, fw, h, finger, 0x334466)
      if (!this.fingerGraphics.has(finger)) this.fingerGraphics.set(finger, [])
      this.fingerGraphics.get(finger)!.push(g)
    })

    // Draw right hand (mirrored)
    const rightStartX = cx + handGap / 2
    rightFingers.forEach((finger, i) => {
      const x = rightStartX + i * (fw + gap)
      const h = fingerHeights[4 - i] // mirror the heights
      const y = cy - h / 2 + 20
      const g = this.drawFinger(x, y, fw, h, finger, 0x334466)
      if (!this.fingerGraphics.has(finger)) this.fingerGraphics.set(finger, [])
      this.fingerGraphics.get(finger)!.push(g)
    })

    // Draw palm areas
    this.drawPalm(leftStartX, cy + 30, handWidth, 30, 0x2a3a52)
    this.drawPalm(rightStartX, cy + 30, handWidth, 30, 0x2a3a52)
  }

  private drawFinger(x: number, y: number, w: number, h: number, finger: Finger, color: number): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics()

    // Finger body with rounded top
    g.fillStyle(color)
    g.fillRoundedRect(x, y, w, h, { tl: w / 2, tr: w / 2, bl: 4, br: 4 })

    // Highlight overlay (gold, drawn on top when active)
    const overlay = this.scene.add.graphics()
    overlay.fillStyle(0xffd700)
    overlay.fillRoundedRect(x, y, w, h, { tl: w / 2, tr: w / 2, bl: 4, br: 4 })
    overlay.setAlpha(0)

    // Use overlay as the highlight target
    if (!this.fingerGraphics.has(finger)) this.fingerGraphics.set(finger, [])

    this.allObjects.push(g, overlay)

    // Return overlay for highlighting
    return overlay
  }

  private drawPalm(x: number, y: number, w: number, h: number, color: number) {
    const g = this.scene.add.graphics()
    g.fillStyle(color, 0.5)
    g.fillRoundedRect(x, y, w, h, 6)
    this.allObjects.push(g)
  }
}
```

**Step 2: Integrate into GoblinWhackerLevel**

In `src/scenes/level-types/GoblinWhackerLevel.ts`:

1. Replace imports — remove `GhostKeyboard` and `TutorialHands`, add `TypingHands`:

```typescript
import { TypingHands } from '../../components/TypingHands'
```

2. Replace the two member variables (`ghostKeyboard` and `tutorialHands`) with one:

```typescript
private typingHands?: TypingHands
```

3. Replace the ghost keyboard + tutorial hands creation block (lines 113-124) with:

```typescript
    // Typing hands overlay for World 1 tutorial levels
    if (this.level.world === 1 && ['w1_l1', 'w1_l2'].includes(this.level.id)) {
      this.typingHands = new TypingHands(this, width / 2, height - 100)
    }
```

4. In `setActiveGoblin()`, replace the ghostKeyboard/tutorialHands calls (lines 178-181) with:

```typescript
      if (this.typingHands) {
        this.typingHands.highlightFinger(goblin.word[this.engine.getTypedSoFar().length] || goblin.word[0])
      }
```

5. Add a `handleCorrectKey` integration — after each correct keystroke, update the finger highlight for the NEXT character. Add a method to GoblinWhackerLevel:

In `create()`, after the TypingEngine constructor, add a keyboard listener that updates the hand on correct keystrokes:

```typescript
    this.input.keyboard?.on('keydown', () => {
      if (this.activeGoblin && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.activeGoblin.word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })
```

6. In `endLevel()`, replace `this.ghostKeyboard?.fadeOut()` and `this.tutorialHands?.destroy()` with:

```typescript
    this.typingHands?.fadeOut()
```

**Step 3: Run build check**

Run: `npm run build`
Expected: No errors.

**Step 4: Manual verification**

Run: `npm run dev`
- Play Alder Falls (w1_l1)
- Two hand silhouettes should appear at the bottom center
- The correct finger should pulse gold for the next letter to type
- A large letter should be displayed above the hands showing the next character
- As you type correctly, the finger highlight should update to the next character's finger
- No keyboard grid or old tutorial hands should be visible

**Step 5: Commit**

```bash
git add src/components/TypingHands.ts src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "feat: replace keyboard overlay with unified hand indicator and next-letter display"
```

---

### Task 4: Pixel art for GoblinWhacker level

**Files:**
- Create: `src/art/goblinWhackerArt.ts`
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts`

**Step 1: Create the pixel art generator module**

Create `src/art/goblinWhackerArt.ts`. This module uses Phaser Graphics + `generateTexture()` to create reusable texture keys.

```typescript
import Phaser from 'phaser'

/**
 * Generates all textures needed for the GoblinWhacker level.
 * Call once in create() before building game objects.
 * Textures are registered on the scene's texture manager and reusable by key.
 */
export function generateGoblinWhackerTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('goblin')) return // already generated

  generateGoblinTexture(scene)
  generateGoblinDeathTexture(scene)
  generateHeroTexture(scene)
  generateHeartTexture(scene)
  generateForestBackground(scene)
}

function generateGoblinTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3 // pixel scale

  // Body (green)
  g.fillStyle(0x44aa44)
  g.fillRect(4 * s, 6 * s, 8 * s, 8 * s)

  // Head (lighter green)
  g.fillStyle(0x55cc55)
  g.fillRect(5 * s, 2 * s, 6 * s, 5 * s)

  // Eyes (red)
  g.fillStyle(0xff2222)
  g.fillRect(6 * s, 3 * s, 1 * s, 2 * s)
  g.fillRect(9 * s, 3 * s, 1 * s, 2 * s)

  // Ears (pointy)
  g.fillStyle(0x55cc55)
  g.fillRect(3 * s, 2 * s, 2 * s, 1 * s)
  g.fillRect(11 * s, 2 * s, 2 * s, 1 * s)
  g.fillRect(2 * s, 1 * s, 1 * s, 1 * s)
  g.fillRect(13 * s, 1 * s, 1 * s, 1 * s)

  // Mouth
  g.fillStyle(0x225522)
  g.fillRect(7 * s, 5 * s, 2 * s, 1 * s)

  // Arms
  g.fillStyle(0x44aa44)
  g.fillRect(2 * s, 7 * s, 2 * s, 4 * s)
  g.fillRect(12 * s, 7 * s, 2 * s, 4 * s)

  // Legs
  g.fillStyle(0x337733)
  g.fillRect(5 * s, 14 * s, 3 * s, 3 * s)
  g.fillRect(8 * s, 14 * s, 3 * s, 3 * s)

  // Club in right hand
  g.fillStyle(0x8B4513)
  g.fillRect(13 * s, 5 * s, 2 * s, 7 * s)
  g.fillStyle(0x6B3410)
  g.fillRect(12 * s, 4 * s, 4 * s, 2 * s)

  // Black outline (simplified)
  g.lineStyle(1, 0x000000, 0.6)
  g.strokeRect(4 * s, 6 * s, 8 * s, 8 * s)
  g.strokeRect(5 * s, 2 * s, 6 * s, 5 * s)

  g.generateTexture('goblin', 16 * s, 17 * s)
  g.destroy()
}

function generateGoblinDeathTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3

  // Poof cloud particles
  const colors = [0xaaaaaa, 0x888888, 0x666666, 0xbbbbbb]
  const positions = [
    [4, 4], [8, 2], [12, 5], [6, 8], [10, 9], [3, 6], [13, 3], [7, 11],
  ]
  positions.forEach(([px, py], i) => {
    g.fillStyle(colors[i % colors.length], 0.7)
    g.fillCircle(px * s, py * s, (2 + (i % 2)) * s)
  })

  // Stars
  g.fillStyle(0xffff44)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)
  g.fillRect(14 * s, 2 * s, 2 * s, 2 * s)
  g.fillRect(8 * s, 0, 1 * s, 1 * s)

  g.generateTexture('goblin_death', 16 * s, 14 * s)
  g.destroy()
}

function generateHeroTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 3

  // Boots
  g.fillStyle(0x5C4033)
  g.fillRect(5 * s, 22 * s, 4 * s, 3 * s)
  g.fillRect(11 * s, 22 * s, 4 * s, 3 * s)

  // Legs (dark pants)
  g.fillStyle(0x334455)
  g.fillRect(6 * s, 16 * s, 3 * s, 6 * s)
  g.fillRect(11 * s, 16 * s, 3 * s, 6 * s)

  // Body (tunic)
  g.fillStyle(0x2266aa)
  g.fillRect(5 * s, 8 * s, 10 * s, 8 * s)

  // Belt
  g.fillStyle(0x8B4513)
  g.fillRect(5 * s, 14 * s, 10 * s, 2 * s)
  g.fillStyle(0xffd700)
  g.fillRect(9 * s, 14 * s, 2 * s, 2 * s) // buckle

  // Arms
  g.fillStyle(0x2266aa)
  g.fillRect(3 * s, 9 * s, 2 * s, 6 * s)
  g.fillRect(15 * s, 9 * s, 2 * s, 6 * s)

  // Hands (skin)
  g.fillStyle(0xeebb99)
  g.fillRect(3 * s, 15 * s, 2 * s, 2 * s)
  g.fillRect(15 * s, 15 * s, 2 * s, 2 * s)

  // Head (skin)
  g.fillStyle(0xeebb99)
  g.fillRect(6 * s, 2 * s, 8 * s, 6 * s)

  // Hair
  g.fillStyle(0x553311)
  g.fillRect(6 * s, 1 * s, 8 * s, 2 * s)
  g.fillRect(5 * s, 2 * s, 1 * s, 3 * s)
  g.fillRect(14 * s, 2 * s, 1 * s, 3 * s)

  // Eyes
  g.fillStyle(0x2244aa)
  g.fillRect(8 * s, 4 * s, 1 * s, 1 * s)
  g.fillRect(11 * s, 4 * s, 1 * s, 1 * s)

  // Mouth (smile)
  g.fillStyle(0xcc7755)
  g.fillRect(9 * s, 6 * s, 2 * s, 1 * s)

  // Outline
  g.lineStyle(1, 0x000000, 0.4)
  g.strokeRect(5 * s, 8 * s, 10 * s, 8 * s)
  g.strokeRect(6 * s, 2 * s, 8 * s, 6 * s)

  g.generateTexture('hero', 20 * s, 25 * s)
  g.destroy()
}

function generateHeartTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 2

  // Pixel heart shape
  g.fillStyle(0xff3344)
  // Row 0 (top bumps)
  g.fillRect(1 * s, 0, 2 * s, 1 * s)
  g.fillRect(5 * s, 0, 2 * s, 1 * s)
  // Row 1
  g.fillRect(0, 1 * s, 8 * s, 1 * s)
  // Row 2
  g.fillRect(0, 2 * s, 8 * s, 1 * s)
  // Row 3
  g.fillRect(1 * s, 3 * s, 6 * s, 1 * s)
  // Row 4
  g.fillRect(2 * s, 4 * s, 4 * s, 1 * s)
  // Row 5 (bottom point)
  g.fillRect(3 * s, 5 * s, 2 * s, 1 * s)

  // Highlight (shine)
  g.fillStyle(0xff7788)
  g.fillRect(2 * s, 1 * s, 1 * s, 1 * s)

  g.generateTexture('heart', 8 * s, 6 * s)
  g.destroy()
}

function generateForestBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Sky gradient (dark blue to lighter blue)
  const skyColors = [0x0a0a2e, 0x1a1a4e, 0x2a3a5e, 0x3a5a6e]
  skyColors.forEach((color, i) => {
    const bandH = (height * 0.6) / skyColors.length
    g.fillStyle(color)
    g.fillRect(0, i * bandH, width, bandH + 1)
  })

  // Distant mountains
  g.fillStyle(0x1a2a1e)
  drawMountainRange(g, width, height * 0.35, 80, 6)
  g.fillStyle(0x223322)
  drawMountainRange(g, width, height * 0.4, 60, 8)

  // Tree line (dark silhouettes)
  g.fillStyle(0x152015)
  for (let x = 0; x < width; x += 40) {
    const treeH = 80 + Math.sin(x * 0.05) * 30
    const treeY = height * 0.4
    // Trunk
    g.fillRect(x + 15, treeY, 10, treeH)
    // Canopy (triangle-ish)
    g.fillStyle(0x1a3a1a)
    g.fillTriangle(x, treeY + 20, x + 20, treeY - 40 - Math.sin(x * 0.03) * 20, x + 40, treeY + 20)
    g.fillStyle(0x152015)
  }

  // Ground
  g.fillStyle(0x2a4a1e)
  g.fillRect(0, height * 0.55, width, height * 0.45)

  // Grass patches
  g.fillStyle(0x3a6a2e)
  for (let x = 0; x < width; x += 20) {
    const grassH = 4 + Math.sin(x * 0.1) * 3
    g.fillRect(x, height * 0.55 - grassH, 12, grassH + 2)
  }

  // Path (lighter brown dirt)
  g.fillStyle(0x5a4a30)
  g.fillRect(0, height * 0.7, width, height * 0.08)
  g.fillStyle(0x4a3a20)
  // Path texture dots
  for (let x = 0; x < width; x += 30) {
    g.fillCircle(x + 10, height * 0.73, 3)
  }

  g.generateTexture('forest_bg', width, height)
  g.destroy()
}

function drawMountainRange(g: Phaser.GameObjects.Graphics, width: number, baseY: number, maxPeak: number, count: number) {
  const segW = width / count
  for (let i = 0; i < count; i++) {
    const peakH = maxPeak * (0.5 + Math.sin(i * 1.7) * 0.5)
    const x1 = i * segW
    const x2 = x1 + segW / 2
    const x3 = x1 + segW
    g.fillTriangle(x1, baseY, x2, baseY - peakH, x3, baseY)
  }
  // Fill below the peaks
  g.fillRect(0, baseY, width, 10)
}
```

**Step 2: Integrate pixel art into GoblinWhackerLevel**

Modify `src/scenes/level-types/GoblinWhackerLevel.ts`:

1. Add import:
```typescript
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
```

2. At the start of `create()`, replace the plain green background rectangle with:
```typescript
    generateGoblinWhackerTextures(this)
    this.add.image(width / 2, height / 2, 'forest_bg')
```

3. Add a hero sprite on the left side, after the background:
```typescript
    this.add.image(80, height * 0.62, 'hero').setScale(1.5)
```

4. In `spawnGoblin()`, replace the rectangle creation:
```typescript
    // Old:
    const sprite = this.add.rectangle(width + 30, y, 40, 40, 0x44aa44)
    // New:
    const sprite = this.add.image(width + 30, y, 'goblin') as any
```

Note: The `Goblin` interface has `sprite: Phaser.GameObjects.Rectangle`. Change it to `Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle` or simply `Phaser.GameObjects.GameObject & { x: number; setX(x: number): void; setFillStyle?: (color: number) => void; destroy(): void }`.

Simplest approach: change the interface to use `Phaser.GameObjects.Image`:
```typescript
interface Goblin {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  hp: number
}
```

5. Update `setActiveGoblin()` to use tint instead of fillStyle:
```typescript
  private setActiveGoblin(goblin: Goblin | null) {
    if (this.activeGoblin) {
      this.activeGoblin.sprite.clearTint()
    }
    this.activeGoblin = goblin
    if (goblin) {
      goblin.sprite.setTint(0xffff44)
      this.engine.setWord(goblin.word)
      if (this.typingHands) {
        this.typingHands.highlightFinger(goblin.word[0])
      }
    } else {
      this.engine.clearWord()
    }
  }
```

6. Replace HP text with heart images. In `create()`, replace the hpText creation with:
```typescript
    this.hpHearts = []
    for (let i = 0; i < this.playerHp; i++) {
      const heart = this.add.image(30 + i * 24, 28, 'heart').setScale(1.5)
      this.hpHearts.push(heart)
    }
    if (this.gameMode === 'regular') this.hpHearts.forEach(h => h.setVisible(false))
```

Add member variable:
```typescript
  private hpHearts: Phaser.GameObjects.Image[] = []
```

Update HP display in `goblinReachedPlayer()`:
```typescript
    if (this.hpHearts[this.playerHp]) {
      this.hpHearts[this.playerHp].setVisible(false)
    }
```

7. Add goblin death animation. In `removeGoblin()`:
```typescript
  private removeGoblin(goblin: Goblin) {
    // Death poof
    const poof = this.add.image(goblin.x, goblin.sprite.y, 'goblin_death')
    this.tweens.add({
      targets: poof,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      onComplete: () => poof.destroy()
    })
    goblin.sprite.destroy()
    goblin.label.destroy()
    this.goblins = this.goblins.filter(g => g !== goblin)
  }
```

**Step 3: Run build check**

Run: `npm run build`
Expected: No errors.

**Step 4: Manual verification**

Run: `npm run dev`
- Alder Falls should show a forest background with mountains, trees, and a dirt path
- A hero character should stand on the left
- Goblins should be pixel art characters (green, pointy ears, club)
- Killing a goblin shows a poof/death animation
- Hearts display as pixel art in the HUD
- All gameplay still works correctly

**Step 5: Commit**

```bash
git add src/art/goblinWhackerArt.ts src/scenes/level-types/GoblinWhackerLevel.ts
git commit -m "feat: add pixel art sprites and forest background to GoblinWhacker level"
```

---

### Task 5: Final verification and cleanup

**Step 1: Run full test suite**

Run: `npm run test`
Expected: All tests pass.

**Step 2: Run build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 3: Full playthrough verification**

Run: `npm run dev`
- Game fills the browser window with letterboxing
- Start new profile, complete character creator
- Play Alder Falls:
  - Forest background, hero sprite, pixel art goblins
  - Can defeat all goblins (not just the first)
  - Hand indicator at bottom with pulsing finger and next-letter display
  - Goblin death poof animation
- Resize browser window — game scales properly

**Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final cleanup for UX polish phase 1"
```
