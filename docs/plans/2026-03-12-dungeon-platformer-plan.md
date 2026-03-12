# Dungeon Platformer Level Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace "The Lost Ruins of Elda" (w1_l5) with a side-scrolling platformer where the hero auto-walks left-to-right encountering obstacles one at a time, typing words to clear them.

**Architecture:** New `DungeonPlatformerLevel` scene with scrolling background, floor tiles, and obstacle sprites. Hero stays at x=200 while the world scrolls left. Obstacles queue and scroll in one at a time. TypingEngine handles word input. Art module generates all textures procedurally (consistent with existing art pattern).

**Tech Stack:** Phaser 3, TypeScript, Vite. Procedural texture generation via Phaser Graphics.

---

### Task 1: Add DungeonPlatformer to LevelType union

**Files:**
- Modify: `src/types/index.ts:62-77`

**Step 1: Add the new type**

In `src/types/index.ts`, add `'DungeonPlatformer'` to the `LevelType` union after `'DungeonTrapDisarm'`:

```typescript
export type LevelType =
  | 'GoblinWhacker'
  | 'SkeletonSwarm'
  | 'MonsterArena'
  | 'UndeadSiege'
  | 'SlimeSplitting'
  | 'DungeonTrapDisarm'
  | 'DungeonPlatformer'
  | 'DungeonEscape'
  | 'PotionBrewingLab'
  | 'MagicRuneTyping'
  | 'MonsterManual'
  | 'GuildRecruitment'
  | 'CharacterCreator'
  | 'WoodlandFestival'
  | 'SillyChallenge'
  | 'BossBattle'
```

**Step 2: Update the level config**

In `src/data/levels/world1.ts:78`, change `type: 'DungeonTrapDisarm'` to `type: 'DungeonPlatformer'`. Also update the storyBeat to match the new platformer theme:

```typescript
  {
    id: 'w1_l5',
    name: 'The Lost Ruins of Elda',
    type: 'DungeonPlatformer',
    world: 1,
    unlockedLetters: W1_AFTER_MB1,
    wordCount: 18,
    timeLimit: 60,
    storyBeat: 'Navigate the crumbling ruins — jump pits, dodge boulders, and unlock ancient doors!',
    rewards: { xp: 160 },
    bossGate: null,
  },
```

Note: timeLimit bumped from 45 to 60 since the pacing is sequential (one obstacle at a time) rather than parallel.

**Step 3: Run type check**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Error about missing scene mapping (that's fine, we'll add it in Task 4).

**Step 4: Commit**

```bash
git add src/types/index.ts src/data/levels/world1.ts
git commit -m "feat: add DungeonPlatformer level type and update w1_l5 config"
```

---

### Task 2: Create dungeon platformer art module

**Files:**
- Create: `src/art/dungeonPlatformerArt.ts`

**Step 1: Create the art generation module**

Create `src/art/dungeonPlatformerArt.ts`. This module generates textures for the platformer level. It reuses `dungeon_bg`, `heart_full`, `heart_empty`, `dust_particle` from `dungeonTrapArt.ts` and adds new platformer-specific textures.

```typescript
// src/art/dungeonPlatformerArt.ts
import Phaser from 'phaser'

/**
 * Generates textures for the DungeonPlatformer level.
 * Reuses dungeon_bg/hearts/dust from dungeonTrapArt; adds floor + obstacle textures.
 */
export function generateDungeonPlatformerTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('platform_floor')) return

  generateFloorTexture(scene)
  generateObstaclePit(scene)
  generateObstacleSpikes(scene)
  generateObstacleBoulder(scene)
  generateObstacleDoor(scene)
}

// ---------------------------------------------------------------------------
// Floor tile — tileable stone slab (160×80)
// ---------------------------------------------------------------------------
function generateFloorTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 160, h = 80

  // Base stone
  g.fillStyle(0x2a2222)
  g.fillRect(0, 0, w, h)

  // Top edge highlight
  g.fillStyle(0x3a3232)
  g.fillRect(0, 0, w, 4)

  // Mortar lines
  g.lineStyle(1, 0x1a1515, 0.9)
  g.lineBetween(0, 20, w, 20)
  g.lineBetween(0, 40, w, 40)
  g.lineBetween(0, 60, w, 60)
  // Vertical joints staggered
  for (let row = 0; row < 4; row++) {
    const offset = (row % 2) * 40
    for (let x = offset; x < w; x += 80) {
      g.lineBetween(x, row * 20, x, (row + 1) * 20)
    }
  }

  // Surface texture — random darker spots
  g.fillStyle(0x201818, 0.5)
  const spots = [[20,10],[60,30],[100,50],[140,15],[30,55],[90,65],[120,8]]
  spots.forEach(([sx, sy]) => g.fillRect(sx, sy, 6, 4))

  g.generateTexture('platform_floor', w, h)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Pit — dark gap (120×80)
// ---------------------------------------------------------------------------
function generateObstaclePit(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 120, h = 80

  // Darkness
  g.fillStyle(0x050505)
  g.fillRect(0, 0, w, h)

  // Jagged edges at top
  g.fillStyle(0x2a2222)
  g.fillTriangle(0, 0, 20, 0, 0, 15)
  g.fillTriangle(w, 0, w - 20, 0, w, 15)
  // Rocky lip
  g.fillStyle(0x1a1515)
  g.fillRect(0, 0, w, 4)
  g.fillRect(0, 0, 8, 12)
  g.fillRect(w - 8, 0, 8, 12)

  // Depth lines fading down
  g.lineStyle(1, 0x0a0a0a)
  for (let y = 15; y < h; y += 10) {
    g.lineBetween(10, y, w - 10, y)
  }

  g.generateTexture('obstacle_pit', w, h)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Spikes — metal floor spikes (100×60, upper portion is spikes above floor line)
// ---------------------------------------------------------------------------
function generateObstacleSpikes(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 100, h = 60

  // Base plate
  g.fillStyle(0x3a3030)
  g.fillRect(0, h - 12, w, 12)

  // Spikes (5 triangles)
  const spikeW = 16, gap = 4
  const startX = (w - (5 * spikeW + 4 * gap)) / 2
  for (let i = 0; i < 5; i++) {
    const sx = startX + i * (spikeW + gap)
    // Shadow
    g.fillStyle(0x555555)
    g.fillTriangle(sx, h - 12, sx + spikeW, h - 12, sx + spikeW / 2, 4)
    // Spike body
    g.fillStyle(0x888888)
    g.fillTriangle(sx + 1, h - 12, sx + spikeW - 1, h - 12, sx + spikeW / 2, 6)
    // Highlight
    g.fillStyle(0xaaaaaa, 0.6)
    g.fillTriangle(sx + spikeW / 2 - 2, h - 12, sx + spikeW / 2 + 1, h - 12, sx + spikeW / 2, 10)
  }

  // Metallic sheen on tips
  g.fillStyle(0xcccccc, 0.4)
  for (let i = 0; i < 5; i++) {
    const sx = startX + i * (spikeW + gap) + spikeW / 2
    g.fillCircle(sx, 8, 2)
  }

  g.generateTexture('obstacle_spikes', w, h)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Boulder — large round rock (80×80)
// ---------------------------------------------------------------------------
function generateObstacleBoulder(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 80

  // Shadow
  g.fillStyle(0x111111, 0.5)
  g.fillEllipse(s / 2 + 4, s / 2 + 4, s - 8, s - 12)

  // Main body
  g.fillStyle(0x5a4a3a)
  g.fillCircle(s / 2, s / 2, 34)

  // Highlight
  g.fillStyle(0x7a6a5a, 0.7)
  g.fillCircle(s / 2 - 8, s / 2 - 8, 18)

  // Surface cracks
  g.lineStyle(1, 0x3a3020)
  g.lineBetween(s / 2 - 10, s / 2 - 5, s / 2 + 15, s / 2 + 8)
  g.lineBetween(s / 2 + 5, s / 2 - 12, s / 2 - 5, s / 2 + 10)
  g.lineBetween(s / 2 - 15, s / 2 + 5, s / 2 + 8, s / 2 + 15)

  // Specular highlight
  g.fillStyle(0xbbaa88, 0.4)
  g.fillCircle(s / 2 - 10, s / 2 - 12, 6)

  g.generateTexture('obstacle_boulder', s, s)
  g.destroy()
}

// ---------------------------------------------------------------------------
// Door — locked stone door (80×120)
// ---------------------------------------------------------------------------
function generateObstacleDoor(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const w = 80, h = 120

  // Door frame
  g.fillStyle(0x3a2a20)
  g.fillRect(0, 0, w, h)

  // Door panels
  g.fillStyle(0x5a4030)
  g.fillRect(6, 6, w - 12, h - 12)

  // Panel insets
  g.fillStyle(0x4a3525)
  g.fillRect(12, 12, w - 24, (h - 30) / 2 - 4)
  g.fillRect(12, 12 + (h - 30) / 2 + 2, w - 24, (h - 30) / 2 - 4)

  // Keyhole plate
  g.fillStyle(0x8a7a60)
  g.fillCircle(w - 20, h / 2, 8)
  g.fillStyle(0x2a1a10)
  g.fillCircle(w - 20, h / 2, 4)
  g.fillRect(w - 22, h / 2, 4, 10)

  // Lock icon glow
  g.fillStyle(0xffaa00, 0.3)
  g.fillCircle(w - 20, h / 2, 12)

  // Iron bands
  g.fillStyle(0x6a6a6a)
  g.fillRect(4, 20, w - 8, 4)
  g.fillRect(4, h - 24, w - 8, 4)

  // Studs
  g.fillStyle(0x888888)
  const studPositions = [[12,22],[w-12,22],[12,h-22],[w-12,h-22]]
  studPositions.forEach(([sx,sy]) => g.fillCircle(sx, sy, 3))

  g.generateTexture('obstacle_door', w, h)
  g.destroy()
}
```

**Step 2: Commit**

```bash
git add src/art/dungeonPlatformerArt.ts
git commit -m "feat: add procedural art generation for dungeon platformer obstacles"
```

---

### Task 3: Create DungeonPlatformerLevel scene

**Files:**
- Create: `src/scenes/level-types/DungeonPlatformerLevel.ts`

**Step 1: Create the scene file**

Create `src/scenes/level-types/DungeonPlatformerLevel.ts`:

```typescript
// src/scenes/level-types/DungeonPlatformerLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'
import { CompanionAndPetRenderer } from '../../components/CompanionAndPetRenderer'
import { generateDungeonTrapTextures } from '../../art/dungeonTrapArt'
import { generateDungeonPlatformerTextures } from '../../art/dungeonPlatformerArt'

type ObstacleType = 'pit' | 'spikes' | 'boulder' | 'door'

interface Obstacle {
  type: ObstacleType
  word: string
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  x: number
}

export class DungeonPlatformerLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number

  // Word state
  private words: string[] = []
  private wordQueue: string[] = []
  private engine!: TypingEngine
  private wordsCompleted = 0
  private finished = false

  // Hero
  private hero!: Phaser.GameObjects.Image
  private companionRenderer!: CompanionAndPetRenderer
  private heroBaseY = 0
  private isAdvanced = false

  // HP (advanced mode only)
  private playerHp = 3
  private heartIcons: Phaser.GameObjects.Image[] = []
  private vignette!: Phaser.GameObjects.Graphics
  private lowHpTween?: Phaser.Tweens.Tween

  // Scrolling
  private scrollSpeed = 0  // pixels/sec when walking
  private scrolling = false
  private floorTiles: Phaser.GameObjects.Image[] = []
  private bgTile1!: Phaser.GameObjects.Image
  private bgTile2!: Phaser.GameObjects.Image

  // Obstacles
  private currentObstacle: Obstacle | null = null
  private obstacleTypes: ObstacleType[] = ['pit', 'spikes', 'boulder', 'door']

  // Timer
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private timerText!: Phaser.GameObjects.Text

  // Dust
  private dustParticles: Array<{ img: Phaser.GameObjects.Image; speedY: number; speedX: number }> = []

  // Walking bob tween
  private walkTween?: Phaser.Tweens.Tween

  constructor() { super('DungeonPlatformerLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.wordsCompleted = 0
    this.playerHp = 3
    this.heartIcons = []
    this.dustParticles = []
    this.floorTiles = []
    this.currentObstacle = null
    this.scrolling = false
    this.isAdvanced = this.level.world >= 3
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // ── Art generation ─────────────────────────────────────────────
    generateDungeonTrapTextures(this)       // reuse bg, hearts, dust
    generateDungeonPlatformerTextures(this)  // floor + obstacles
    generateAllCompanionTextures(this)

    // ── Scrolling background (two tiles for seamless loop) ────────
    this.bgTile1 = this.add.image(width / 2, height / 2, 'dungeon_bg')
      .setDisplaySize(width, height).setDepth(0)
    this.bgTile2 = this.add.image(width + width / 2, height / 2, 'dungeon_bg')
      .setDisplaySize(width, height).setDepth(0)

    // ── Floor tiles ───────────────────────────────────────────────
    const floorY = height - 40   // floor top edge
    this.heroBaseY = floorY - 50 // hero stands on floor
    const tileW = 160
    const tilesNeeded = Math.ceil(width / tileW) + 2
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.add.image(i * tileW + tileW / 2, floorY + 40, 'platform_floor')
        .setDepth(1)
      this.floorTiles.push(tile)
    }

    // ── Hero ──────────────────────────────────────────────────────
    const profile = loadProfile(this.profileSlot)
    const avatarKey = this.textures.exists(profile?.avatarChoice || '')
      ? profile!.avatarChoice : 'avatar_0'
    this.hero = this.add.image(200, this.heroBaseY, avatarKey)
      .setScale(1.5).setDepth(5)
    this.companionRenderer = new CompanionAndPetRenderer(this, 200, this.heroBaseY, this.profileSlot)

    // ── HUD: Hearts ───────────────────────────────────────────────
    this.buildHeartHUD()

    // ── HUD: Timer ────────────────────────────────────────────────
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffcc44', fontFamily: 'monospace',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true }
    }).setOrigin(1, 0).setDepth(11)

    // ── HUD: Level Name ───────────────────────────────────────────
    this.add.text(width / 2, 18, this.level.name, {
      fontSize: '20px', color: '#e8d090', fontFamily: 'serif',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5, 0).setDepth(10)

    // ── Typing Engine ─────────────────────────────────────────────
    this.engine = new TypingEngine({
      scene: this, x: width / 2, y: height - 80, fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // ── Word Pool ─────────────────────────────────────────────────
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(
      this.level.unlockedLetters, this.level.wordCount, difficulty,
      this.level.world === 1 ? 5 : undefined
    )
    this.wordQueue = [...this.words]

    // ── Timer ─────────────────────────────────────────────────────
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.updateTimerDisplay()
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.updateTimerDisplay()
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }

    // ── Vignette ──────────────────────────────────────────────────
    this.vignette = this.add.graphics().setDepth(100).setAlpha(0)
    this.drawVignette(0xcc0000)

    // ── Dust particles ────────────────────────────────────────────
    this.spawnDustParticles()

    // ── Scroll speed ──────────────────────────────────────────────
    this.scrollSpeed = 300

    // ── Start: walk then spawn first obstacle ─────────────────────
    this.startWalking()
    this.time.delayedCall(600, () => this.spawnNextObstacle())
  }

  // ── Walking ──────────────────────────────────────────────────────
  private startWalking() {
    this.scrolling = true
    if (this.walkTween) this.walkTween.stop()
    this.walkTween = this.tweens.add({
      targets: this.hero,
      y: this.heroBaseY - 4,
      yoyo: true, repeat: -1, duration: 200,
      ease: 'Sine.easeInOut'
    })
  }

  private stopWalking() {
    this.scrolling = false
    if (this.walkTween) {
      this.walkTween.stop()
      this.walkTween = undefined
    }
    this.hero.setY(this.heroBaseY)
  }

  // ── Heart HUD ────────────────────────────────────────────────────
  private buildHeartHUD() {
    this.heartIcons.forEach(h => h.destroy())
    this.heartIcons = []
    for (let i = 0; i < 3; i++) {
      const key = i < this.playerHp ? 'heart_full' : 'heart_empty'
      this.heartIcons.push(
        this.add.image(24 + i * 30, 28, key).setScale(2).setDepth(10)
      )
    }
  }

  private updateHeartHUD() {
    this.heartIcons.forEach((icon, i) => {
      icon.setTexture(i < this.playerHp ? 'heart_full' : 'heart_empty')
    })
    if (this.playerHp <= 1 && !this.lowHpTween) {
      this.lowHpTween = this.tweens.add({
        targets: this.vignette, alpha: { from: 0, to: 0.35 },
        yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut'
      })
    } else if (this.playerHp > 1) {
      this.lowHpTween?.stop()
      this.lowHpTween = undefined
      this.vignette.setAlpha(0)
    }
  }

  private drawVignette(color: number) {
    const { width, height } = this.scale
    const g = this.vignette
    g.clear()
    const t = 40
    g.fillStyle(color)
    g.fillRect(0, 0, width, t)
    g.fillRect(0, height - t, width, t)
    g.fillRect(0, 0, t, height)
    g.fillRect(width - t, 0, t, height)
  }

  // ── Timer ────────────────────────────────────────────────────────
  private updateTimerDisplay() {
    const urgent = this.timeLeft <= 10
    this.timerText.setText(`⏳ ${this.timeLeft}s`)
    this.timerText.setColor(urgent ? '#ff4444' : '#ffcc44')
  }

  // ── Dust ─────────────────────────────────────────────────────────
  private spawnDustParticles() {
    const { width, height } = this.scale
    for (let i = 0; i < 18; i++) {
      const img = this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        'dust_particle'
      ).setAlpha(Phaser.Math.FloatBetween(0.15, 0.55)).setDepth(2)
      this.dustParticles.push({
        img,
        speedY: Phaser.Math.FloatBetween(-0.3, -0.8),
        speedX: Phaser.Math.FloatBetween(-0.15, 0.15)
      })
    }
  }

  // ── Obstacle Spawning ────────────────────────────────────────────
  private spawnNextObstacle() {
    if (this.finished || this.wordQueue.length === 0) {
      if (this.wordQueue.length === 0 && !this.currentObstacle) {
        this.endLevel(true)
      }
      return
    }

    const word = this.wordQueue.shift()!
    const { width } = this.scale
    const type = this.obstacleTypes[Phaser.Math.Between(0, this.obstacleTypes.length - 1)]

    const textureKey = type === 'pit' ? 'obstacle_pit'
      : type === 'spikes' ? 'obstacle_spikes'
      : type === 'boulder' ? 'obstacle_boulder'
      : 'obstacle_door'

    // Position obstacle off-screen right; y depends on type
    const floorTopY = this.scale.height - 40
    let spriteY: number
    if (type === 'door') {
      spriteY = floorTopY - 60  // door is tall, base at floor
    } else if (type === 'boulder') {
      spriteY = floorTopY - 40
    } else {
      spriteY = floorTopY       // pit/spikes sit at floor level
    }

    const startX = width + 100
    const sprite = this.add.image(startX, spriteY, textureKey).setDepth(3)

    const label = this.add.text(startX, spriteY - 70, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 4 },
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5).setDepth(8)

    const obstacle: Obstacle = { type, word, sprite, label, x: startX }
    this.currentObstacle = obstacle

    // Tween obstacle from right to hero's position (x=320, just ahead of hero)
    const targetX = 320
    const dist = startX - targetX
    const duration = (dist / this.scrollSpeed) * 1000

    this.startWalking()

    this.tweens.add({
      targets: [sprite, label],
      x: (_t: any, _k: any, _v: any, i: number) => i === 0 ? targetX : targetX,
      duration,
      ease: 'Linear',
      onUpdate: () => { label.setX(sprite.x) },
      onComplete: () => {
        obstacle.x = targetX
        this.stopWalking()
        this.engine.setWord(word)
      }
    })
  }

  // ── Word Complete ────────────────────────────────────────────────
  private onWordComplete(_word: string, _elapsed: number) {
    if (!this.currentObstacle) return
    const obs = this.currentObstacle
    this.wordsCompleted++

    // Play clear animation based on obstacle type
    this.playClearAnimation(obs, () => {
      obs.sprite.destroy()
      obs.label.destroy()
      this.currentObstacle = null
      // Brief walk pause then next obstacle
      this.startWalking()
      this.time.delayedCall(400, () => this.spawnNextObstacle())
    })
  }

  private playClearAnimation(obs: Obstacle, onDone: () => void) {
    const { height } = this.scale

    // Floating success text
    const txt = this.add.text(obs.sprite.x, obs.sprite.y - 40, '✅ CLEAR!', {
      fontSize: '22px', color: '#44ff88', fontFamily: 'monospace',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(200)
    this.tweens.add({
      targets: txt, y: txt.y - 60, alpha: 0, duration: 800,
      ease: 'Power1', onComplete: () => txt.destroy()
    })

    switch (obs.type) {
      case 'pit':
      case 'spikes':
        // Hero jumps in an arc
        this.tweens.add({
          targets: this.hero,
          y: this.heroBaseY - 80,
          duration: 250, yoyo: true, ease: 'Sine.easeOut',
          onComplete: () => onDone()
        })
        break
      case 'boulder':
        // Hero ducks (squish), boulder flies overhead
        this.tweens.add({
          targets: this.hero,
          scaleY: 0.8, y: this.heroBaseY + 15,
          duration: 200, yoyo: true, ease: 'Sine.easeInOut',
        })
        this.tweens.add({
          targets: obs.sprite,
          x: -100, y: obs.sprite.y - 40,
          duration: 500, ease: 'Power1',
          onComplete: () => onDone()
        })
        break
      case 'door':
        // Door slides up
        this.tweens.add({
          targets: obs.sprite,
          y: obs.sprite.y - 140, alpha: 0,
          duration: 500, ease: 'Power2',
          onComplete: () => onDone()
        })
        break
    }
  }

  // ── Wrong Key ────────────────────────────────────────────────────
  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)

    if (this.isAdvanced && this.currentObstacle) {
      // Advanced mode: take damage, auto-clear
      this.playerHp--
      this.updateHeartHUD()
      this.cameras.main.shake(200, 0.015)

      // Hit animation on hero
      this.tweens.add({
        targets: this.hero,
        alpha: 0.3, yoyo: true, repeat: 2, duration: 100,
        onComplete: () => this.hero.setAlpha(1)
      })

      // Auto-clear the obstacle
      const obs = this.currentObstacle
      this.engine.clearWord()
      obs.sprite.destroy()
      obs.label.destroy()
      this.currentObstacle = null
      this.wordsCompleted++

      if (this.playerHp <= 0) {
        this.endLevel(false)
      } else {
        this.startWalking()
        this.time.delayedCall(600, () => this.spawnNextObstacle())
      }
    }
  }

  // ── Update (scrolling + dust) ────────────────────────────────────
  update(_time: number, delta: number) {
    if (this.finished) return
    const dt = delta / 1000
    const { width, height } = this.scale

    // Scroll background
    if (this.scrolling) {
      const bgScroll = this.scrollSpeed * 0.3 * dt  // parallax: bg slower
      this.bgTile1.x -= bgScroll
      this.bgTile2.x -= bgScroll
      if (this.bgTile1.x <= -width / 2) this.bgTile1.x = this.bgTile2.x + width
      if (this.bgTile2.x <= -width / 2) this.bgTile2.x = this.bgTile1.x + width

      // Scroll floor tiles
      const floorScroll = this.scrollSpeed * dt
      this.floorTiles.forEach(tile => {
        tile.x -= floorScroll
        if (tile.x < -80) tile.x += this.floorTiles.length * 160
      })
    }

    // Dust drift
    this.dustParticles.forEach(p => {
      p.img.y += p.speedY
      p.img.x += p.speedX
      if (p.img.y < -10) p.img.y = height + 10
      if (p.img.x < -10) p.img.x = width + 10
      if (p.img.x > width + 10) p.img.x = -10
    })
  }

  // ── End Level ────────────────────────────────────────────────────
  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.stopWalking()
    this.timerEvent?.remove()
    this.engine.destroy()

    if (!passed) {
      const { width, height } = this.scale
      const overlay = this.add.graphics().setDepth(500)
      overlay.fillStyle(0x000000, 0)
      overlay.fillRect(0, 0, width, height)
      this.tweens.add({ targets: overlay, alpha: 0.7, duration: 800 })
      this.add.text(width / 2, height / 2 - 30, '💀 The ruins crumble...', {
        fontSize: '28px', color: '#cc4444', fontFamily: 'serif',
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 6, fill: true }
      }).setOrigin(0.5).setDepth(600)
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(
      Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world
    )
    this.time.delayedCall(passed ? 500 : 1400, () => {
      this.scene.start('LevelResult', {
        level: this.level, profileSlot: this.profileSlot,
        accuracyStars: acc, speedStars: spd, passed
      })
    })
  }
}
```

**Step 2: Commit**

```bash
git add src/scenes/level-types/DungeonPlatformerLevel.ts
git commit -m "feat: add DungeonPlatformerLevel scene with side-scrolling platformer gameplay"
```

---

### Task 4: Wire up the new scene

**Files:**
- Modify: `src/main.ts:16,57-61`
- Modify: `src/scenes/LevelScene.ts:12-25`

**Step 1: Register scene in main.ts**

Add import after line 16 (the DungeonTrapDisarmLevel import):

```typescript
import { DungeonPlatformerLevel } from './scenes/level-types/DungeonPlatformerLevel'
```

Add `DungeonPlatformerLevel` to the scene array (after `DungeonTrapDisarmLevel` on line 59):

```typescript
    DungeonTrapDisarmLevel, DungeonPlatformerLevel, DungeonEscapeLevel, PotionBrewingLabLevel, MagicRuneTypingLevel,
```

**Step 2: Add type→scene mapping in LevelScene.ts**

In `src/scenes/LevelScene.ts`, add to `typeToScene` after line 16:

```typescript
      DungeonPlatformer: 'DungeonPlatformerLevel',
```

**Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 4: Commit**

```bash
git add src/main.ts src/scenes/LevelScene.ts
git commit -m "feat: register DungeonPlatformerLevel scene and add type mapping"
```

---

### Task 5: Build check and manual browser verification

**Step 1: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 2: Browser verification**

With `npm run dev` running, navigate to the game:
1. Select/create a profile
2. Reach the Overland Map
3. Navigate to "The Lost Ruins of Elda" (w1_l5)
4. Confirm:
   - Dungeon background scrolls left
   - Stone floor tiles scroll underneath
   - Hero stands at left side with walking bob animation
   - Obstacle scrolls in from right and stops near hero
   - Word appears above obstacle
   - Typing the word triggers clear animation (jump/duck/door slide)
   - Hero resumes walking after each obstacle
   - Heart HUD displays correctly
   - Timer counts down
   - Level completes after all words typed

**Step 3: Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during browser verification"
```
