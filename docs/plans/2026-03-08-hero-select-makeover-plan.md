# Hero Select Screen Makeover — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the ProfileSelectScene from plain rectangles into a retro pixel-art experience with a 30-avatar gallery during hero creation.

**Architecture:** New `AvatarGenerator` utility generates 30 pixel-art face textures at boot using Phaser graphics primitives. ProfileSelectScene is rewritten with pixel-art styled panels, avatar display, richer stats, and subtle idle animations. The hero creation flow adds an avatar gallery step between name entry and game start.

**Tech Stack:** Phaser 3 graphics API (rectangles as pixels), RenderTexture for caching generated avatars, TypeScript.

---

### Task 1: Create Avatar Definition Data

**Files:**
- Create: `src/data/avatars.ts`

**Step 1: Create the avatar config file**

```typescript
// src/data/avatars.ts

export interface AvatarConfig {
  id: string
  skinTone: number    // hex color
  hairStyle: 'short' | 'long' | 'mohawk' | 'bald' | 'spiky' | 'ponytail'
  hairColor: number   // hex color
  eyeColor: number    // hex color
  accessory: 'none' | 'helmet' | 'headband' | 'scar' | 'glasses' | 'beard' | 'eyepatch' | 'crown' | 'horns' | 'bandana'
}

const SKIN_TONES = [0xffe0bd, 0xf5c6a0, 0xd4a373, 0xa67c52, 0x6b4226, 0xffdfc4]
const HAIR_COLORS = [0x2c1b0e, 0x8b4513, 0xdaa520, 0xc0392b, 0xffffff, 0x4a4a4a, 0x1a5276, 0x6c3483]
const EYE_COLORS = [0x2e86c1, 0x27ae60, 0x8b4513, 0x2c3e50, 0xc0392b, 0xf1c40f]
const HAIR_STYLES: AvatarConfig['hairStyle'][] = ['short', 'long', 'mohawk', 'bald', 'spiky', 'ponytail']
const ACCESSORIES: AvatarConfig['accessory'][] = ['none', 'helmet', 'headband', 'scar', 'glasses', 'beard', 'eyepatch', 'crown', 'horns', 'bandana']

// Generate 30 unique avatars with good variety
export const AVATAR_CONFIGS: AvatarConfig[] = generateAvatarConfigs()

function generateAvatarConfigs(): AvatarConfig[] {
  const configs: AvatarConfig[] = []
  // Use deterministic combinations for variety
  for (let i = 0; i < 30; i++) {
    configs.push({
      id: `avatar_${i}`,
      skinTone: SKIN_TONES[i % SKIN_TONES.length],
      hairStyle: HAIR_STYLES[i % HAIR_STYLES.length],
      hairColor: HAIR_COLORS[i % HAIR_COLORS.length],
      eyeColor: EYE_COLORS[i % EYE_COLORS.length],
      accessory: ACCESSORIES[i % ACCESSORIES.length],
    })
  }
  return configs
}
```

**Step 2: Commit**

```bash
git add src/data/avatars.ts
git commit -m "feat: add avatar definition data with 30 unique configs"
```

---

### Task 2: Create Avatar Renderer

**Files:**
- Create: `src/components/AvatarRenderer.ts`

**Step 1: Create the renderer that draws pixel-art faces to textures**

This class takes a Phaser scene and renders 48×48 pixel-art faces using graphics primitives (filled rectangles at pixel scale). Each avatar is rendered to a `Phaser.GameObjects.RenderTexture` and saved as a texture in the scene's texture manager so it can be used as a sprite anywhere.

```typescript
// src/components/AvatarRenderer.ts
import Phaser from 'phaser'
import { AvatarConfig, AVATAR_CONFIGS } from '../data/avatars'

const SIZE = 48
const PX = 3  // each "pixel" is 3x3 real pixels (48/16 grid)

export class AvatarRenderer {
  /**
   * Generate all avatar textures. Call once during PreloadScene or BootScene.
   * Creates textures named 'avatar_0' through 'avatar_29'.
   */
  static generateAll(scene: Phaser.Scene): void {
    for (const config of AVATAR_CONFIGS) {
      if (scene.textures.exists(config.id)) continue
      AvatarRenderer.generateOne(scene, config)
    }
  }

  static generateOne(scene: Phaser.Scene, config: AvatarConfig): void {
    const rt = scene.add.renderTexture(0, 0, SIZE, SIZE).setVisible(false)
    const gfx = scene.add.graphics()

    // Background (transparent)
    gfx.clear()

    // Head shape (oval-ish) - rows 3-14, cols 3-12 on 16x16 grid
    AvatarRenderer.drawHead(gfx, config)
    AvatarRenderer.drawEyes(gfx, config)
    AvatarRenderer.drawMouth(gfx, config)
    AvatarRenderer.drawHair(gfx, config)
    AvatarRenderer.drawAccessory(gfx, config)

    rt.draw(gfx)
    rt.saveTexture(config.id)
    gfx.destroy()
    rt.destroy()
  }

  private static px(gfx: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
    gfx.fillStyle(color)
    gfx.fillRect(x * PX, y * PX, PX, PX)
  }

  private static rect(gfx: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number): void {
    gfx.fillStyle(color)
    gfx.fillRect(x * PX, y * PX, w * PX, h * PX)
  }

  private static drawHead(gfx: Phaser.GameObjects.Graphics, config: AvatarConfig): void {
    const skin = config.skinTone
    // Main face area (cols 4-11, rows 4-13)
    AvatarRenderer.rect(gfx, 4, 4, 8, 10, skin)
    // Wider middle (cols 3-12, rows 6-11)
    AvatarRenderer.rect(gfx, 3, 6, 10, 6, skin)
    // Top rounding (cols 5-10, row 3)
    AvatarRenderer.rect(gfx, 5, 3, 6, 1, skin)
    // Bottom rounding (cols 5-10, row 14)
    AvatarRenderer.rect(gfx, 5, 14, 6, 1, skin)
    // Ears (col 2 and 13, rows 7-9)
    AvatarRenderer.rect(gfx, 2, 7, 1, 3, skin)
    AvatarRenderer.rect(gfx, 13, 7, 1, 3, skin)
    // Neck (cols 6-9, rows 15)
    AvatarRenderer.rect(gfx, 6, 15, 4, 1, skin)
  }

  private static drawEyes(gfx: Phaser.GameObjects.Graphics, config: AvatarConfig): void {
    // Eye whites
    AvatarRenderer.rect(gfx, 5, 8, 2, 2, 0xffffff)
    AvatarRenderer.rect(gfx, 9, 8, 2, 2, 0xffffff)
    // Pupils
    AvatarRenderer.px(gfx, 6, 9, config.eyeColor)
    AvatarRenderer.px(gfx, 10, 9, config.eyeColor)
    // Eyebrows (darker version of hair color)
    const brow = Phaser.Display.Color.IntegerToColor(config.hairColor).darken(30).color
    AvatarRenderer.rect(gfx, 5, 7, 2, 1, brow)
    AvatarRenderer.rect(gfx, 9, 7, 2, 1, brow)
  }

  private static drawMouth(gfx: Phaser.GameObjects.Graphics, _config: AvatarConfig): void {
    // Simple smile
    AvatarRenderer.rect(gfx, 6, 12, 4, 1, 0xcc6666)
  }

  private static drawHair(gfx: Phaser.GameObjects.Graphics, config: AvatarConfig): void {
    const c = config.hairColor
    switch (config.hairStyle) {
      case 'short':
        AvatarRenderer.rect(gfx, 4, 3, 8, 2, c)
        AvatarRenderer.rect(gfx, 3, 4, 1, 3, c)
        AvatarRenderer.rect(gfx, 12, 4, 1, 3, c)
        break
      case 'long':
        AvatarRenderer.rect(gfx, 4, 2, 8, 3, c)
        AvatarRenderer.rect(gfx, 3, 3, 1, 8, c)
        AvatarRenderer.rect(gfx, 12, 3, 1, 8, c)
        AvatarRenderer.rect(gfx, 2, 5, 1, 5, c)
        AvatarRenderer.rect(gfx, 13, 5, 1, 5, c)
        break
      case 'mohawk':
        AvatarRenderer.rect(gfx, 7, 0, 2, 4, c)
        AvatarRenderer.rect(gfx, 6, 1, 4, 2, c)
        break
      case 'bald':
        // No hair — just a slight shine on the head
        AvatarRenderer.px(gfx, 7, 4, 0xffffff)
        break
      case 'spiky':
        AvatarRenderer.rect(gfx, 4, 3, 8, 2, c)
        AvatarRenderer.px(gfx, 4, 1, c)
        AvatarRenderer.px(gfx, 6, 0, c)
        AvatarRenderer.px(gfx, 8, 1, c)
        AvatarRenderer.px(gfx, 10, 0, c)
        AvatarRenderer.px(gfx, 12, 1, c)
        break
      case 'ponytail':
        AvatarRenderer.rect(gfx, 4, 2, 8, 3, c)
        AvatarRenderer.rect(gfx, 12, 4, 2, 2, c)
        AvatarRenderer.rect(gfx, 13, 6, 2, 4, c)
        AvatarRenderer.rect(gfx, 14, 10, 1, 2, c)
        break
    }
  }

  private static drawAccessory(gfx: Phaser.GameObjects.Graphics, config: AvatarConfig): void {
    switch (config.accessory) {
      case 'none':
        break
      case 'helmet':
        AvatarRenderer.rect(gfx, 3, 2, 10, 3, 0x888888)
        AvatarRenderer.rect(gfx, 5, 1, 6, 1, 0x999999)
        AvatarRenderer.rect(gfx, 7, 0, 2, 1, 0xaaaaaa)
        break
      case 'headband':
        AvatarRenderer.rect(gfx, 3, 5, 10, 1, 0xff4444)
        break
      case 'scar':
        AvatarRenderer.px(gfx, 10, 8, 0xcc4444)
        AvatarRenderer.px(gfx, 11, 9, 0xcc4444)
        AvatarRenderer.px(gfx, 11, 10, 0xcc4444)
        break
      case 'glasses':
        AvatarRenderer.rect(gfx, 4, 8, 3, 2, 0x444444)
        AvatarRenderer.rect(gfx, 5, 8, 2, 2, 0x88ccff)
        AvatarRenderer.rect(gfx, 8, 8, 3, 2, 0x444444)
        AvatarRenderer.rect(gfx, 9, 8, 2, 2, 0x88ccff)
        AvatarRenderer.rect(gfx, 7, 8, 1, 1, 0x444444)
        break
      case 'beard':
        AvatarRenderer.rect(gfx, 4, 12, 8, 2, config.hairColor)
        AvatarRenderer.rect(gfx, 5, 14, 6, 1, config.hairColor)
        AvatarRenderer.rect(gfx, 6, 15, 4, 1, config.hairColor)
        break
      case 'eyepatch':
        AvatarRenderer.rect(gfx, 9, 7, 3, 3, 0x222222)
        AvatarRenderer.px(gfx, 8, 6, 0x222222)
        AvatarRenderer.px(gfx, 12, 6, 0x222222)
        break
      case 'crown':
        AvatarRenderer.rect(gfx, 4, 2, 8, 2, 0xffd700)
        AvatarRenderer.px(gfx, 4, 1, 0xffd700)
        AvatarRenderer.px(gfx, 7, 0, 0xffd700)
        AvatarRenderer.px(gfx, 9, 0, 0xffd700)
        AvatarRenderer.px(gfx, 11, 1, 0xffd700)
        // Gems
        AvatarRenderer.px(gfx, 7, 1, 0xff0000)
        AvatarRenderer.px(gfx, 9, 1, 0x0000ff)
        break
      case 'horns':
        AvatarRenderer.rect(gfx, 3, 2, 2, 3, 0x8b4513)
        AvatarRenderer.rect(gfx, 11, 2, 2, 3, 0x8b4513)
        AvatarRenderer.px(gfx, 3, 1, 0x8b4513)
        AvatarRenderer.px(gfx, 12, 1, 0x8b4513)
        break
      case 'bandana':
        AvatarRenderer.rect(gfx, 3, 4, 10, 2, 0x2e86c1)
        AvatarRenderer.rect(gfx, 12, 5, 2, 1, 0x2e86c1)
        AvatarRenderer.rect(gfx, 13, 6, 2, 1, 0x2e86c1)
        break
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/components/AvatarRenderer.ts
git commit -m "feat: add AvatarRenderer to generate 48x48 pixel-art face textures"
```

---

### Task 3: Generate Avatar Textures at Boot

**Files:**
- Modify: `src/scenes/PreloadScene.ts`

**Step 1: Read PreloadScene.ts to understand current structure**

**Step 2: Import AvatarRenderer and call `generateAll()` at end of `create()`**

Add these lines to PreloadScene:
```typescript
import { AvatarRenderer } from '../components/AvatarRenderer'

// At end of create(), before transitioning to next scene:
AvatarRenderer.generateAll(this)
```

**Step 3: Verify the game boots without errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/scenes/PreloadScene.ts
git commit -m "feat: generate avatar textures during preload"
```

---

### Task 4: Rewrite ProfileSelectScene — Pixel-Art Styled Slot Layout

**Files:**
- Modify: `src/scenes/ProfileSelectScene.ts`

This is the largest task. Rewrite the `render()`, `renderFilledSlot()`, and `renderEmptySlot()` methods with:

**Step 1: Add helper method for drawing pixel-art panel borders**

```typescript
private drawPixelPanel(x: number, y: number, w: number, h: number, fillColor: number, borderColor: number): Phaser.GameObjects.Graphics {
  const gfx = this.add.graphics()
  const border = 3
  // Border
  gfx.fillStyle(borderColor)
  gfx.fillRect(x - w/2, y - h/2, w, h)
  // Inner fill
  gfx.fillStyle(fillColor)
  gfx.fillRect(x - w/2 + border, y - h/2 + border, w - border*2, h - border*2)
  // Corner notches (pixel-art style)
  gfx.fillStyle(0x000000, 0)
  gfx.fillRect(x - w/2, y - h/2, border, border)
  gfx.fillRect(x + w/2 - border, y - h/2, border, border)
  gfx.fillRect(x - w/2, y + h/2 - border, border, border)
  gfx.fillRect(x + w/2 - border, y + h/2 - border, border, border)
  return gfx
}
```

**Step 2: Rewrite `render()` with pixel-art title**

Update the title with a subtle pulsing tween:
```typescript
const title = this.add.text(width / 2, 50, 'Select Your Hero', {
  fontSize: '40px', color: '#ffd700', fontFamily: 'monospace'
}).setOrigin(0.5)

this.tweens.add({
  targets: title,
  alpha: { from: 1, to: 0.7 },
  duration: 1500,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.easeInOut'
})
```

**Step 3: Rewrite `renderFilledSlot()` with avatar, richer stats, companion icon**

- Show 48×48 avatar sprite using `this.add.image(x, y, profile.avatarChoice)`
- Display player name, level, world progress
- Calculate and show total stars earned: `Object.values(profile.levelResults).reduce(...)`
- Show active companion name if one exists
- Pixel-panel border with hover glow tween
- Retro-styled Export/Delete buttons

**Step 4: Rewrite `renderEmptySlot()` with pixel-art dashed border and blinking text**

- Pixel panel with muted colors
- "+ New Hero" text with blinking tween (alpha oscillation)
- Retro-styled Import button

**Step 5: Restyle the Back button as a pixel-art button**

**Step 6: Run `npm run build` — verify no errors**

**Step 7: Run `npm run dev` — visually verify the new layout looks correct**

**Step 8: Commit**

```bash
git add src/scenes/ProfileSelectScene.ts
git commit -m "feat: restyle ProfileSelectScene with pixel-art panels and richer stats"
```

---

### Task 5: Add Avatar Gallery to Hero Creation Flow

**Files:**
- Modify: `src/scenes/ProfileSelectScene.ts`

**Step 1: Modify `startNaming()` — after Enter, go to avatar gallery instead of starting game**

Change the Enter handler:
```typescript
if (event.key === 'Enter' && this.typingBuffer.length > 0) {
  this.input.keyboard?.removeAllListeners()
  this.showAvatarGallery(slot, this.typingBuffer)
}
```

**Step 2: Add `showAvatarGallery(slot, name)` method**

```typescript
private selectedAvatarId: string = 'avatar_0'

private showAvatarGallery(slot: number, playerName: string) {
  this.children.removeAll(true)
  const { width, height } = this.scale

  // Title
  this.add.text(width / 2, 30, 'Choose Your Avatar', {
    fontSize: '32px', color: '#ffd700', fontFamily: 'monospace'
  }).setOrigin(0.5)

  // Player name display
  this.add.text(width / 2, 65, playerName, {
    fontSize: '20px', color: '#aaaaaa', fontFamily: 'monospace'
  }).setOrigin(0.5)

  // Grid: 6 columns × 5 rows, 30 avatars
  const cols = 6
  const cellSize = 72  // 48px avatar + padding
  const gridWidth = cols * cellSize
  const startX = (width - gridWidth) / 2 + cellSize / 2
  const startY = 110

  let selectedHighlight: Phaser.GameObjects.Rectangle | null = null
  this.selectedAvatarId = 'avatar_0'

  AVATAR_CONFIGS.forEach((config, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const ax = startX + col * cellSize
    const ay = startY + row * cellSize

    // Avatar frame
    const frame = this.add.rectangle(ax, ay, 56, 56, 0x2a2a4a)
      .setStrokeStyle(2, 0x4444aa)
      .setInteractive({ useHandCursor: true })

    const avatar = this.add.image(ax, ay, config.id).setDisplaySize(48, 48)

    frame.on('pointerdown', () => {
      this.selectedAvatarId = config.id
      if (selectedHighlight) selectedHighlight.destroy()
      selectedHighlight = this.add.rectangle(ax, ay, 60, 60)
        .setStrokeStyle(3, 0xffd700)
        .setFillStyle(0x000000, 0)
    })

    // Default selection highlight on first avatar
    if (i === 0) {
      selectedHighlight = this.add.rectangle(ax, ay, 60, 60)
        .setStrokeStyle(3, 0xffd700)
        .setFillStyle(0x000000, 0)
    }
  })

  // Confirm button
  this.drawPixelPanel(width / 2, height - 50, 200, 50, 0x2a6a2a, 0x44aa44)
  const confirm = this.add.text(width / 2, height - 50, 'CONFIRM', {
    fontSize: '24px', color: '#ffffff', fontFamily: 'monospace'
  }).setOrigin(0.5).setInteractive({ useHandCursor: true })

  confirm.on('pointerdown', () => {
    const profile = createProfile(playerName, this.selectedAvatarId)
    saveProfile(slot, profile)
    this.startGame(slot, profile)
  })

  // Back button
  const back = this.add.text(60, height - 50, '< Back', {
    fontSize: '20px', color: '#aaaaaa', fontFamily: 'monospace'
  }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
  back.on('pointerdown', () => {
    this.startNaming(slot)
  })
}
```

**Step 3: Import AVATAR_CONFIGS at top of file**

```typescript
import { AVATAR_CONFIGS } from '../data/avatars'
```

**Step 4: Run `npm run build` — verify no errors**

**Step 5: Run `npm run dev` — manually test: click empty slot, type name, press Enter, see avatar gallery, select avatar, confirm**

**Step 6: Commit**

```bash
git add src/scenes/ProfileSelectScene.ts
git commit -m "feat: add avatar gallery to hero creation flow"
```

---

### Task 6: Handle Missing Avatar Textures for Existing Profiles

**Files:**
- Modify: `src/scenes/ProfileSelectScene.ts`

**Step 1: In `renderFilledSlot()`, check if avatar texture exists before showing**

Existing profiles have `avatarChoice: 'knight'` (the default). That texture won't exist. Fall back to `avatar_0`:

```typescript
const avatarKey = this.textures.exists(profile.avatarChoice) ? profile.avatarChoice : 'avatar_0'
this.add.image(avatarX, y, avatarKey).setDisplaySize(48, 48)
```

**Step 2: Run `npm run build` — verify no errors**

**Step 3: Commit**

```bash
git add src/scenes/ProfileSelectScene.ts
git commit -m "fix: fallback to avatar_0 for profiles with missing avatar textures"
```

---

### Task 7: Add Hover Effects and Idle Animations

**Files:**
- Modify: `src/scenes/ProfileSelectScene.ts`

**Step 1: Add hover glow to filled slots**

On `pointerover`, tween the border stroke brightness up. On `pointerout`, tween back.

```typescript
box.on('pointerover', () => {
  this.tweens.add({
    targets: box,
    scaleX: 1.02, scaleY: 1.02,
    duration: 150,
    ease: 'Sine.easeOut'
  })
})
box.on('pointerout', () => {
  this.tweens.add({
    targets: box,
    scaleX: 1, scaleY: 1,
    duration: 150,
    ease: 'Sine.easeOut'
  })
})
```

**Step 2: Add blinking animation to "+ New Hero" text**

```typescript
this.tweens.add({
  targets: newHeroText,
  alpha: { from: 1, to: 0.4 },
  duration: 1000,
  yoyo: true,
  repeat: -1,
  ease: 'Sine.easeInOut'
})
```

**Step 3: Add subtle hover brightening to empty slots**

**Step 4: Run `npm run dev` — verify animations look right**

**Step 5: Commit**

```bash
git add src/scenes/ProfileSelectScene.ts
git commit -m "feat: add hover effects and idle animations to hero select"
```

---

### Task 8: Visual QA and Polish

**Files:**
- Modify: `src/scenes/ProfileSelectScene.ts` (if needed)

**Step 1: Run `npm run dev` and test all flows:**
- View screen with no profiles (all empty slots)
- Create a new hero (name entry → avatar gallery → confirm)
- View screen with filled profile (avatar, stats, companion)
- Export/Import/Delete still work
- Back button returns to main menu
- Hover effects feel smooth
- No visual overlap or misalignment

**Step 2: Run `npm run build` — clean build**

**Step 3: Run `npm run test` — existing tests still pass**

**Step 4: Fix any issues found**

**Step 5: Commit**

```bash
git add -A
git commit -m "fix: polish hero select screen layout and interactions"
```

---

## Task Dependency Graph

```
Task 1 (avatar data) ──→ Task 2 (renderer) ──→ Task 3 (boot generation)
                                                       ↓
Task 4 (restyle slots) ←────────────────────────────────┘
       ↓
Task 5 (avatar gallery) ──→ Task 6 (fallback for old profiles)
       ↓
Task 7 (animations) ──→ Task 8 (QA polish)
```
