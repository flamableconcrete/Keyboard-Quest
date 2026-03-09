# Level Exit and Pause Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a pause menu overlay that allows players to pause gameplay and exit to the Overland Map.

**Architecture:** A new `PauseScene` that renders over paused gameplay scenes, managed by a reusable `PauseManager` component instantiated in every level.

**Tech Stack:** TypeScript, Phaser 3

---

### Task 1: Create PauseScene

**Files:**
- Create: `src/scenes/PauseScene.ts`

**Step 1: Write the PauseScene implementation**

```typescript
// src/scenes/PauseScene.ts
import Phaser from 'phaser'

interface PauseData {
  levelKey: string
  profileSlot: number
}

export class PauseScene extends Phaser.Scene {
  private levelKey!: string
  private profileSlot!: number

  constructor() {
    super('PauseScene')
  }

  init(data: PauseData) {
    this.levelKey = data.levelKey
    this.profileSlot = data.profileSlot
  }

  create() {
    const { width, height } = this.scale
    
    // Dark semi-transparent overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)

    // Menu Panel
    const panelW = 400
    const panelH = 300
    this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x1a1a2e).setStrokeStyle(4, 0x4a4a6a)

    // Title
    this.add.text(width / 2, height / 2 - 100, 'PAUSED', {
      fontSize: '36px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5)

    // Resume Button
    const resumeBtn = this.add.text(width / 2, height / 2, '[ Resume ]', {
      fontSize: '28px', color: '#aaffaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    
    resumeBtn.on('pointerdown', () => {
      this.scene.resume(this.levelKey)
      this.scene.stop()
    })
    resumeBtn.on('pointerover', () => resumeBtn.setColor('#ffffff'))
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#aaffaa'))

    // Quit Button
    const quitBtn = this.add.text(width / 2, height / 2 + 70, '[ Quit to Map ]', {
      fontSize: '28px', color: '#ffaaaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    
    quitBtn.on('pointerdown', () => {
      this.scene.stop(this.levelKey)
      this.scene.stop()
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
    quitBtn.on('pointerover', () => quitBtn.setColor('#ffffff'))
    quitBtn.on('pointerout', () => quitBtn.setColor('#ffaaaa'))

    // Listen for Escape key to resume
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.resume(this.levelKey)
      this.scene.stop()
    })
  }
}
```

**Step 2: Commit**

```bash
git add src/scenes/PauseScene.ts
git commit -m "feat: create PauseScene for level pause menu"
```

---

### Task 2: Register PauseScene in main.ts

**Files:**
- Modify: `src/main.ts`

**Step 1: Update main.ts**

Import `PauseScene` and add it to the scene array.

```typescript
import { PauseScene } from './scenes/PauseScene'

// Add to the scene array in the config
  scene: [
    BootScene, PreloadScene, MainMenuScene, ProfileSelectScene, OverlandMapScene, LevelIntroScene, LevelResultScene, LevelScene,
    // Add PauseScene here
    PauseScene,
    ...
```

**Step 2: Commit**

```bash
git add src/main.ts
git commit -m "feat: register PauseScene in main.ts"
```

---

### Task 3: Create PauseManager Component

**Files:**
- Create: `src/components/PauseManager.ts`

**Step 1: Write PauseManager implementation**

```typescript
// src/components/PauseManager.ts
import Phaser from 'phaser'

export class PauseManager {
  private scene: Phaser.Scene
  private profileSlot: number

  constructor(scene: Phaser.Scene, profileSlot: number) {
    this.scene = scene
    this.profileSlot = profileSlot
    this.createPauseUI()
    this.createKeyboardListener()
  }

  private createPauseUI() {
    const { width } = this.scene.scale
    const btn = this.scene.add.text(width - 20, 20, '[ ESC ] Pause', {
      fontSize: '18px', color: '#aaaaaa'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    
    // Ensure the pause button renders above most gameplay elements
    btn.setDepth(1000)

    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor('#aaaaaa'))
    btn.on('pointerdown', () => this.pauseGame())
  }

  private createKeyboardListener() {
    this.scene.input.keyboard?.on('keydown-ESC', () => {
      this.pauseGame()
    })
  }

  private pauseGame() {
    // Only pause if the scene is active
    if (this.scene.scene.isActive()) {
      this.scene.scene.pause(this.scene.scene.key)
      this.scene.scene.launch('PauseScene', { 
        levelKey: this.scene.scene.key, 
        profileSlot: this.profileSlot 
      })
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/components/PauseManager.ts
git commit -m "feat: create PauseManager component"
```

---

### Task 4: Add PauseManager to all level and boss scenes

**Files:**
- Modify: `src/scenes/level-types/*.ts` and `src/scenes/boss-types/*.ts`

**Step 1: Update scenes**

In each level and boss scene file (e.g. `GoblinWhackerLevel.ts`):
1. Import `PauseManager`
2. Instantiate it at the end of the `create()` method.

```typescript
import { PauseManager } from '../../components/PauseManager'

// In create() method:
new PauseManager(this, this.profileSlot)
```

Make sure the timer texts/UI don't overlap with the pause button (which is at top right). For example, `GoblinWhackerLevel` has its `timerText` at `width - 20, 20`. Let's move the pause button to the top left or adjust the existing UI accordingly if there's a conflict. Alternatively, update `PauseManager` to place the button at `20, 60` or somewhere unobtrusive depending on the layout. Actually, `(20, 20)` top-left is better since player info is usually there but wait, `GoblinWhackerLevel` has `Level name` at `width/2, 20` and `timerText` at `width - 20, 20`. Let's put the Pause button at `x: 20, y: 20` (top-left).

Update the `PauseManager` step 3 to position at top-left:
```typescript
    const btn = this.scene.add.text(20, 20, '[ ESC ] Pause', {
      fontSize: '18px', color: '#aaaaaa'
    }).setOrigin(0, 0).setInteractive({ useHandCursor: true })
```

**Step 2: Verify Build**

Run `npm run build` to ensure all imports are valid and no type errors exist.

**Step 3: Commit**

```bash
git add src/scenes/level-types/ src/scenes/boss-types/
git commit -m "feat: add PauseManager to all level and boss scenes"
```