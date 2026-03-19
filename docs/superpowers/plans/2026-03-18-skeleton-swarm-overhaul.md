# SkeletonSwarm Level Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder SkeletonSwarm level (gray rectangles, no art, weak loop) with a pixel-art "epic last stand on a ruined battlefield" experience with full UI parity to GoblinWhackerLevel.

**Architecture:** Two new files only — `src/art/skeletonSwarmArt.ts` (all texture/art generation, never touches Phaser scene state) and a full rewrite of `src/scenes/level-types/SkeletonSwarmLevel.ts` following the exact GoblinWhackerLevel.ts pattern. The art module is called once in `create()` and is otherwise stateless.

**Tech Stack:** Phaser 3, TypeScript, Vite. Tests via Vitest. Dev server: `npm run dev`.

---

> **Testing note:** Phaser scene classes and art modules cannot be meaningfully unit tested without a running browser — no Phaser mock exists in this project and none should be added. All verification steps are manual: run `npm run dev`, navigate to a SkeletonSwarm level, and observe behavior. The existing test suite tests pure utility functions only; do not add scene tests.

---

## Chunk 1: Art Module

### Task 1: Create `skeletonSwarmArt.ts` with background textures

**Files:**
- Create: `src/art/skeletonSwarmArt.ts`

- [ ] **Step 1: Create the file with the entry point and background functions**

```typescript
import Phaser from 'phaser'

export function generateSkeletonSwarmTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('ss_skeleton')) return
  generateSkeletonTexture(scene)
  generateRisingSkeletonTexture(scene)
  generateSkeletonBackground(scene)
  generateBoneFragmentTexture(scene)
  generateAshParticleTexture(scene)
  generateHeartTexture(scene)
  generateFireFrames(scene)
}

function generateSkeletonBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const s = 1

  // Sky layer — deep blood-red fading to near-black
  const sky = scene.add.graphics()
  for (let y = 0; y < height * 0.6; y++) {
    const t = y / (height * 0.6)
    const r = Math.floor(0x3d * (1 - t))
    const color = (r << 16)
    sky.fillStyle(color)
    sky.fillRect(0, y, width, 1)
  }
  sky.generateTexture('ss_sky', width, Math.floor(height * 0.6))
  sky.destroy()

  // Ruins layer — broken stone walls silhouetted against sky
  const ruins = scene.add.graphics()
  ruins.fillStyle(0x0a0000)
  ruins.fillRect(0, 0, width, 120)

  // Left ruined wall section
  ruins.fillStyle(0x1a1010)
  ruins.fillRect(50, 20, 60, 100)
  ruins.fillRect(110, 40, 20, 80)
  ruins.fillRect(60, 10, 30, 30)
  // Arch remnant
  ruins.fillRect(130, 30, 80, 90)
  ruins.fillRect(210, 50, 15, 70)
  ruins.fillStyle(0x0a0000)
  ruins.fillRect(145, 55, 50, 65) // arch opening
  // Right ruined wall
  ruins.fillStyle(0x1a1010)
  ruins.fillRect(900, 15, 80, 105)
  ruins.fillRect(980, 35, 25, 85)
  ruins.fillRect(850, 30, 55, 90)
  ruins.fillStyle(0x2a1818) // mortar highlights
  ruins.fillRect(52, 22, 56, 2)
  ruins.fillRect(52, 40, 56, 2)
  ruins.fillRect(52, 60, 56, 2)
  ruins.fillRect(132, 32, 76, 2)
  ruins.fillRect(132, 52, 76, 2)

  ruins.generateTexture('ss_ruins', width, 120)
  ruins.destroy()

  // Battlefield layer — cracked earth, skulls, broken weapons
  const field = scene.add.graphics()
  field.fillStyle(0x3a2e1e)
  field.fillRect(0, 0, width, 200)

  // Crack lines
  field.lineStyle(1 * s, 0x2a1e0e)
  field.beginPath()
  field.moveTo(100, 10); field.lineTo(130, 60); field.lineTo(150, 40)
  field.moveTo(300, 5); field.lineTo(320, 80); field.lineTo(360, 50)
  field.moveTo(600, 20); field.lineTo(650, 90)
  field.moveTo(800, 15); field.lineTo(840, 70); field.lineTo(870, 40)
  field.strokePath()

  // Skulls (simplified pixel shapes)
  const drawSkull = (g: Phaser.GameObjects.Graphics, x: number, y: number) => {
    g.fillStyle(0xccbbaa)
    g.fillRect(x, y, 8, 6)
    g.fillRect(x + 1, y + 6, 6, 2)
    g.fillStyle(0x1a1008)
    g.fillRect(x + 1, y + 1, 2, 2) // left eye socket
    g.fillRect(x + 5, y + 1, 2, 2) // right eye socket
  }
  drawSkull(field, 200, 140)
  drawSkull(field, 450, 160)
  drawSkull(field, 700, 130)
  drawSkull(field, 950, 155)

  // Broken weapons sticking from dirt
  field.fillStyle(0x888877) // blade
  field.fillRect(280, 80, 3, 50)
  field.fillStyle(0x554433) // haft
  field.fillRect(280, 125, 3, 30)
  field.fillStyle(0x888877)
  field.fillRect(720, 70, 3, 60)
  field.fillStyle(0x554433)
  field.fillRect(720, 120, 3, 40)

  field.generateTexture('ss_battlefield', width, 200)
  field.destroy()
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors from `skeletonSwarmArt.ts`

- [ ] **Step 3: Commit**

```bash
git add src/art/skeletonSwarmArt.ts
git commit -m "feat: add skeletonSwarmArt.ts with background textures"
```

---

### Task 2: Add skeleton sprites and particle textures to art module

**Files:**
- Modify: `src/art/skeletonSwarmArt.ts`

- [ ] **Step 1: Add skeleton sprite functions**

Append these functions to `skeletonSwarmArt.ts`:

```typescript
function generateSkeletonTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 4 // pixel scale

  // Skull (rounded)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 0 * s, 6 * s, 5 * s)  // head
  g.fillRect(1 * s, 1 * s, 8 * s, 3 * s)  // wider mid-skull
  // Eye sockets (cyan glow)
  g.fillStyle(0x00ccff)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)  // left eye
  g.fillRect(6 * s, 1 * s, 2 * s, 2 * s)  // right eye
  // Jaw
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 4 * s, 6 * s, 2 * s)
  g.fillStyle(0xbbaa88) // shadow
  g.fillRect(3 * s, 5 * s, 4 * s, 1 * s)

  // Neck
  g.fillStyle(0xddccaa)
  g.fillRect(4 * s, 6 * s, 2 * s, 2 * s)

  // Ribcage (torso with bone stripes)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 8 * s, 6 * s, 6 * s)
  g.fillStyle(0xbbaa88) // rib shadow lines
  g.fillRect(2 * s, 9 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 11 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 13 * s, 6 * s, 1 * s)

  // Broken armor scraps (dark rusted iron)
  g.fillStyle(0x445566)
  g.fillRect(1 * s, 8 * s, 2 * s, 4 * s)  // left pauldron shard
  g.fillRect(7 * s, 8 * s, 2 * s, 3 * s)  // right breastplate piece
  g.fillStyle(0x334455) // shadow edge
  g.fillRect(1 * s, 11 * s, 2 * s, 1 * s)

  // Arms (bone)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 8 * s, 2 * s, 6 * s)  // left arm
  g.fillRect(8 * s, 8 * s, 2 * s, 6 * s)  // right arm
  g.fillStyle(0xbbaa88)
  g.fillRect(0 * s, 12 * s, 2 * s, 1 * s) // arm shadow

  // Pelvis / lower bones
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 14 * s, 6 * s, 2 * s)

  // Legs
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 16 * s, 2 * s, 4 * s) // left leg
  g.fillRect(6 * s, 16 * s, 2 * s, 4 * s) // right leg
  g.fillStyle(0xbbaa88)
  g.fillRect(2 * s, 19 * s, 2 * s, 1 * s) // foot shadow
  g.fillRect(6 * s, 19 * s, 2 * s, 1 * s)

  // Weapon: spear in right hand (blade + haft)
  g.fillStyle(0xaaaaaa) // blade
  g.fillRect(9 * s, 4 * s, 2 * s, 4 * s)
  g.fillRect(10 * s, 3 * s, 1 * s, 2 * s) // spearhead tip
  g.fillStyle(0x885533) // wooden haft
  g.fillRect(9 * s, 8 * s, 2 * s, 12 * s)

  g.generateTexture('ss_skeleton', 12 * s, 20 * s)
  g.destroy()
}

function generateRisingSkeletonTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  const s = 4

  // Same upper body as marching skeleton (skull + torso + arms)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 0 * s, 6 * s, 5 * s)
  g.fillRect(1 * s, 1 * s, 8 * s, 3 * s)
  g.fillStyle(0x00ccff)
  g.fillRect(2 * s, 1 * s, 2 * s, 2 * s)
  g.fillRect(6 * s, 1 * s, 2 * s, 2 * s)
  g.fillStyle(0xddccaa)
  g.fillRect(2 * s, 4 * s, 6 * s, 2 * s)
  g.fillRect(4 * s, 6 * s, 2 * s, 2 * s)
  g.fillRect(2 * s, 8 * s, 6 * s, 4 * s)
  g.fillStyle(0xbbaa88)
  g.fillRect(2 * s, 9 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 11 * s, 6 * s, 1 * s)
  g.fillStyle(0x445566)
  g.fillRect(1 * s, 8 * s, 2 * s, 3 * s)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 8 * s, 2 * s, 4 * s)
  g.fillRect(8 * s, 8 * s, 2 * s, 4 * s)
  // Arms raised upward (reaching out of ground)
  g.fillStyle(0xddccaa)
  g.fillRect(0 * s, 4 * s, 1 * s, 4 * s) // left arm raised
  g.fillRect(9 * s, 3 * s, 1 * s, 5 * s) // right arm raised

  // Lower half: cracked dirt (skeleton submerged)
  g.fillStyle(0x3a2e1e) // dirt base
  g.fillRect(0 * s, 12 * s, 10 * s, 8 * s)
  g.fillStyle(0x2a1e0e) // crack lines in dirt
  g.fillRect(1 * s, 13 * s, 4 * s, 1 * s)
  g.fillRect(5 * s, 15 * s, 4 * s, 1 * s)
  g.fillRect(2 * s, 17 * s, 3 * s, 1 * s)
  g.fillStyle(0x4a3e2e) // lighter dirt highlight
  g.fillRect(0 * s, 12 * s, 10 * s, 1 * s)

  g.generateTexture('ss_skeleton_rising', 12 * s, 20 * s)
  g.destroy()
}
```

- [ ] **Step 2: Add particle and heart textures**

Append to `skeletonSwarmArt.ts`:

```typescript
function generateBoneFragmentTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(0xeeddbb)
  g.fillRect(0, 0, 3, 3)
  g.generateTexture('ss_bone_fragment', 3, 3)
  g.destroy()
}

function generateAshParticleTexture(scene: Phaser.Scene) {
  const g = scene.add.graphics()
  g.fillStyle(0x666666, 0.6)
  g.fillRect(0, 0, 2, 2)
  g.generateTexture('ss_ash_particle', 2, 2)
  g.destroy()
}

function generateHeartTexture(scene: Phaser.Scene) {
  if (scene.textures.exists('heart')) return // already generated (e.g. by GoblinWhacker)
  const g = scene.add.graphics()
  const s = 2
  // Matches goblinWhackerArt.ts exactly for visual consistency regardless of visit order
  g.fillStyle(0xff3344)
  g.fillRect(1 * s, 0, 2 * s, 1 * s)
  g.fillRect(5 * s, 0, 2 * s, 1 * s)
  g.fillRect(0, 1 * s, 8 * s, 1 * s)
  g.fillRect(0, 2 * s, 8 * s, 1 * s)
  g.fillRect(1 * s, 3 * s, 6 * s, 1 * s)
  g.fillRect(2 * s, 4 * s, 4 * s, 1 * s)
  g.fillRect(3 * s, 5 * s, 2 * s, 1 * s)
  g.fillStyle(0xff7788) // highlight
  g.fillRect(2 * s, 1 * s, 1 * s, 1 * s)
  g.generateTexture('heart', 8 * s, 6 * s)
  g.destroy()
}
```

- [ ] **Step 3: Add fire animation frames**

Append to `skeletonSwarmArt.ts`:

```typescript
function generateFireFrames(scene: Phaser.Scene) {
  // Frame 0: base flame
  const f0 = scene.add.graphics()
  f0.fillStyle(0xff4400) // outer
  f0.fillRect(2, 8, 6, 6)
  f0.fillRect(1, 5, 8, 5)
  f0.fillRect(3, 2, 4, 4)
  f0.fillStyle(0xff8800) // mid
  f0.fillRect(3, 6, 4, 5)
  f0.fillRect(4, 3, 2, 4)
  f0.fillStyle(0xffcc00) // tip
  f0.fillRect(4, 1, 2, 3)
  f0.generateTexture('ss_fire_0', 10, 14)
  f0.destroy()

  // Frame 1: mid flicker
  const f1 = scene.add.graphics()
  f1.fillStyle(0xff6600)
  f1.fillRect(2, 8, 6, 6)
  f1.fillRect(1, 5, 8, 5)
  f1.fillRect(3, 2, 4, 4)
  f1.fillStyle(0xffaa00)
  f1.fillRect(3, 6, 4, 5)
  f1.fillRect(4, 3, 2, 4)
  f1.fillStyle(0xffffff)
  f1.fillRect(4, 0, 2, 4)
  f1.generateTexture('ss_fire_1', 10, 14)
  f1.destroy()

  // Frame 2: bright flicker
  const f2 = scene.add.graphics()
  f2.fillStyle(0xff8800)
  f2.fillRect(2, 8, 6, 6)
  f2.fillRect(1, 5, 8, 5)
  f2.fillRect(3, 2, 4, 4)
  f2.fillStyle(0xffcc00)
  f2.fillRect(3, 6, 4, 5)
  f2.fillRect(4, 3, 2, 4)
  f2.fillStyle(0xffffff)
  f2.fillRect(4, 1, 2, 3)
  f2.fillRect(3, 0, 4, 2)
  f2.generateTexture('ss_fire_2', 10, 14)
  f2.destroy()
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/art/skeletonSwarmArt.ts
git commit -m "feat: add skeleton/particle/heart/fire textures to skeletonSwarmArt"
```

---

## Chunk 2: Scene Core Structure

### Task 3: Rewrite SkeletonSwarmLevel — scaffold, imports, interface, create() shell

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts`

The full current file is replaced. Do NOT preserve any of the old code.

- [ ] **Step 1: Write the new scene file up through end of create()**

Replace the entire contents of `src/scenes/level-types/SkeletonSwarmLevel.ts` with:

```typescript
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { TypingHands } from '../../components/TypingHands'
import { SpellCaster } from '../../components/SpellCaster'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { generateSkeletonSwarmTextures } from '../../art/skeletonSwarmArt'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'
import { CompanionAndPetRenderer } from '../../components/CompanionAndPetRenderer'
import { GoldManager } from '../../utils/goldSystem'

interface Skeleton {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  hp: number
  aura: Phaser.GameObjects.Ellipse
  auraTween: Phaser.Tweens.Tween | null
  isRiser: boolean
}

export class SkeletonSwarmLevel extends Phaser.Scene {
  private goldManager!: GoldManager
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private skeletons: Skeleton[] = []
  private activeSkeleton: Skeleton | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxSkeletonReach = 100
  private hpHearts: Phaser.GameObjects.Image[] = []
  private waveText!: Phaser.GameObjects.Text
  private waveTimer?: Phaser.Time.TimerEvent
  private skeletonsDefeated = 0
  private finished = false
  private currentWave = 0
  private maxWaves = 3
  private gameMode: 'regular' | 'advanced' = 'regular'
  private wrongKeyCount = 0
  private nextAttackThreshold = 5
  private letterShieldCount = 0
  private spellCaster?: SpellCaster
  private typingHands?: TypingHands
  private barrierLine!: Phaser.GameObjects.Graphics
  private pathY = 0
  private riseEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
  private ambientAshEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
  private boneBurstEmitter?: Phaser.GameObjects.Particles.ParticleEmitter

  // Regular mode constants (mirrors GoblinWhacker)
  private readonly BATTLE_X = 300
  private readonly SKELETON_SPACING = 120

  constructor() { super('SkeletonSwarmLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.skeletonsDefeated = 0
    this.playerHp = 3
    this.currentWave = 0
    this.maxWaves = Phaser.Math.Between(3, 5)
    this.skeletons = []
    this.activeSkeleton = null
    this.words = []
    this.wordQueue = []
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(5, 8)
    this.letterShieldCount = 0
    this.hpHearts = []
    const profile = loadProfile(data.profileSlot)
    this.gameMode = profile?.gameMode ?? 'regular'
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    this.pathY = height * 0.55

    // Generate all textures
    generateSkeletonSwarmTextures(this)

    // Background layers
    this.add.image(width / 2, height * 0.3, 'ss_sky').setDisplaySize(width, height * 0.6)
    this.add.image(width / 2, height * 0.6 - 60, 'ss_ruins').setDisplaySize(width, 120)
    this.add.image(width / 2, this.pathY + 30, 'ss_battlefield').setDisplaySize(width, 200)
    // Dark ground fill below battlefield
    this.add.rectangle(width / 2, height * 0.85, width, height * 0.3, 0x1a0e00)

    // Fire sprites at ruins positions
    this.anims.create({
      key: 'ss_fire_anim',
      frames: [
        { key: 'ss_fire_0' }, { key: 'ss_fire_1' },
        { key: 'ss_fire_2' }, { key: 'ss_fire_1' },
      ],
      frameRate: 8,
      repeat: -1,
    })
    const firePositions = [160, 400, 700, 1000]
    firePositions.forEach(x => {
      this.add.sprite(x, height * 0.6 - 50, 'ss_fire_0').setScale(2.5).play('ss_fire_anim')
    })

    // Ambient ash emitter
    this.ambientAshEmitter = this.add.particles(0, 0, 'ss_ash_particle', {
      x: { min: 0, max: width },
      y: { min: 100, max: height - 100 },
      speedX: { min: -20, max: -5 },
      speedY: { min: -15, max: -5 },
      alpha: { min: 0.2, max: 0.5 },
      lifespan: { min: 4000, max: 6000 },
      frequency: 333, // ~3/sec
      quantity: 1,
    })

    // One-shot rise burst emitter (reused per riser spawn)
    this.riseEmitter = this.add.particles(0, 0, 'ss_ash_particle', {
      speedX: { min: -60, max: 60 },
      speedY: { min: -120, max: -40 },
      gravityY: 200,
      alpha: { min: 0.6, max: 0.9 },
      lifespan: { min: 600, max: 900 },
      quantity: 12,
      emitting: false,
    })

    // Reusable bone burst emitter for skeleton deaths (avoids per-kill game object leak)
    this.boneBurstEmitter = this.add.particles(0, 0, 'ss_bone_fragment', {
      speedX: { min: -120, max: 120 },
      speedY: { min: -150, max: -30 },
      gravityY: 300,
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 8,
      emitting: false,
    })

    // Barrier line (Graphics object, tweened alpha)
    this.barrierLine = this.add.graphics()
    this.barrierLine.lineStyle(3, 0x00ccff, 1.0)
    this.barrierLine.beginPath()
    this.barrierLine.moveTo(100, height * 0.2)
    this.barrierLine.lineTo(100, height * 0.85)
    this.barrierLine.strokePath()
    this.tweens.add({
      targets: this.barrierLine,
      alpha: { from: 0.4, to: 1.0 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    })

    // Player avatar
    const pProfileAvatar = loadProfile(this.profileSlot)
    generateAllCompanionTextures(this)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(60, this.pathY, avatarKey).setScale(1.5)

    // Companion / pet
    const petRenderer = new CompanionAndPetRenderer(this, 60, this.pathY, this.profileSlot)
    this.goldManager = new GoldManager(this)
    if (petRenderer.getPetSprite()) {
      const pProfile = loadProfile(this.profileSlot)!
      const p = pProfile.pets.find(pet => pet.id === pProfile.activePetId)
      if (p) {
        this.goldManager.registerPet(petRenderer.getPetSprite()!, 100 + (p.level * 25), petRenderer.getStartPetX(), petRenderer.getStartPetY())
      }
    }

    // HUD
    this.hpHearts = []
    for (let i = 0; i < this.playerHp; i++) {
      const heart = this.add.image(30 + i * 24, 28, 'heart').setScale(1.5).setDepth(10)
      this.hpHearts.push(heart)
    }
    if (this.gameMode === 'regular') this.hpHearts.forEach(h => h.setVisible(false))

    this.waveText = this.add.text(width - 20, 20, `Wave 1 / ${this.maxWaves}`, {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(10)

    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(10)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 80,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Keyboard → typing hands passthrough
    this.input.keyboard?.on('keydown', () => {
      if (this.activeSkeleton && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.activeSkeleton.word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })

    // Spell system
    const spellProfile = loadProfile(this.profileSlot)
    if (spellProfile && spellProfile.spells.length > 0) {
      this.spellCaster = new SpellCaster(this, this.profileSlot, this.engine)
      this.spellCaster.setEffectCallback((effect) => {
        if (effect === 'time_freeze') {
          const frozenSpeed = this.skeletons.map(s => s.speed)
          this.skeletons.forEach(s => { s.speed = 0 })
          this.time.delayedCall(5000, () => {
            this.skeletons.forEach((s, i) => { s.speed = frozenSpeed[i] ?? (60 + this.level.world * 10) })
          })
        } else if (effect === 'word_blast') {
          // Target the active skeleton (the one the player is currently typing), falling back to nearest
          const target = this.activeSkeleton ?? this.skeletons[0] ?? null
          if (target) {
            this.removeSkeleton(target)
            this.skeletonsDefeated++
            this.setActiveSkeleton(this.skeletons[0] ?? null)
            if (this.wordQueue.length === 0 && this.skeletons.length === 0) this.endLevel(true)
          }
        } else if (effect === 'second_chance') {
          this.playerHp = Math.min(this.playerHp + 2, 5)
          this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
        } else if (effect === 'letter_shield') {
          this.letterShieldCount = 3
        }
      })
    }

    // Typing hands (profile setting)
    const hintsProfile = loadProfile(this.profileSlot)
    if (hintsProfile?.showFingerHints) {
      this.typingHands = new TypingHands(this, width / 2, height - 100)
    }

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    const maxLength = this.level.world === 1 ? 5 : undefined
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, maxLength)
    const shuffled = [...this.words]
    Phaser.Utils.Array.Shuffle(shuffled)
    this.wordQueue = shuffled

    // Start wave loop
    this.spawnWave()
    this.waveTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: this.onWaveTimer,
      callbackScope: this,
    })
  }

  private onWaveTimer() {
    if (this.finished) return
    if (this.currentWave >= this.maxWaves) {
      if (this.skeletons.length === 0) this.endLevel(true)
      return
    }
    if (this.skeletons.length === 0) {
      // Show wave incoming banner then spawn
      const { width, height } = this.scale
      const banner = this.add.text(width / 2, height / 2, `WAVE INCOMING`, {
        fontSize: '36px', color: '#ffd700', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(200).setAlpha(0)
      this.tweens.add({
        targets: banner,
        alpha: 1,
        duration: 400,
        yoyo: true,
        hold: 1200,
        onComplete: () => {
          banner.destroy()
          this.spawnWave()
        }
      })
    } else {
      // Previous wave not cleared — spawn next wave on top of existing skeletons
      this.spawnWave()
    }
  }

  private spawnWave() {
    if (this.finished || this.wordQueue.length === 0 || this.currentWave >= this.maxWaves) return
    this.currentWave++
    this.waveText.setText(`Wave ${this.currentWave} / ${this.maxWaves}`)

    // Scale composition with wave number and world
    const baseCount = Math.min(2 + Math.floor(this.currentWave / 2), 4)
    const numSkeletons = Math.min(baseCount, this.wordQueue.length)
    const riserCount = Math.min(Math.ceil(numSkeletons / 2), this.wordQueue.length)
    const marcherCount = Math.min(numSkeletons - riserCount, this.wordQueue.length - riserCount)

    for (let i = 0; i < riserCount + marcherCount; i++) {
      this.time.delayedCall(i * 400, () => {
        if (this.finished || this.wordQueue.length === 0) return
        const isRiser = i < riserCount
        this.spawnSkeleton(isRiser)
      })
    }
  }

  private spawnSkeleton(isRiser: boolean) {
    if (this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width } = this.scale
    const finalY = this.pathY

    const startX = isRiser
      ? Phaser.Math.Between(300, Math.min(800, width - 50))
      : width + 30
    const startY = isRiser ? finalY + 20 : finalY

    const aura = this.add.ellipse(startX, startY, 72, 52, 0x006688).setAlpha(0).setDepth(1)
    const sprite = this.add.image(startX, startY, isRiser ? 'ss_skeleton_rising' : 'ss_skeleton').setDepth(2)
    const label = this.add.text(startX, startY - 40, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(3)

    const skeleton: Skeleton = {
      word,
      x: startX,
      speed: 60 + this.level.world * 10,
      sprite,
      label,
      hp: 1,
      aura,
      auraTween: null,
      isRiser,
    }
    this.skeletons.push(skeleton)

    if (isRiser) {
      // Rise animation: tween from y+20 to finalY, swap sprite, burst dirt
      this.riseEmitter?.explode(12, startX, finalY)
      this.tweens.add({
        targets: [sprite, aura],
        y: finalY,
        duration: 600,
        ease: 'Back.Out',
        onComplete: () => {
          skeleton.isRiser = false
          sprite.setTexture('ss_skeleton')
        }
      })
    }

    if (!this.activeSkeleton) this.setActiveSkeleton(skeleton)
  }

  private setActiveSkeleton(skeleton: Skeleton | null) {
    // Deactivate old aura
    if (this.activeSkeleton) {
      this.activeSkeleton.auraTween?.stop()
      this.activeSkeleton.auraTween = null
      this.activeSkeleton.aura.setAlpha(0)
    }

    this.activeSkeleton = skeleton

    if (skeleton) {
      skeleton.aura.setAlpha(0.3)
      skeleton.auraTween = this.tweens.add({
        targets: skeleton.aura,
        alpha: { from: 0.3, to: 0.8 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      })
      this.engine.setWord(skeleton.word)
      if (this.typingHands) this.typingHands.highlightFinger(skeleton.word[0])
    } else {
      this.engine.clearWord()
    }
  }

  update(_time: number, delta: number) {
    this.goldManager?.update(delta)
    if (this.finished) return

    if (this.gameMode === 'advanced') {
      this.skeletons.forEach(s => {
        s.x -= s.speed * (delta / 1000)
        s.sprite.setX(s.x)
        s.label.setX(s.x)
        s.aura.setX(s.x)
        if (s.x <= this.maxSkeletonReach) this.skeletonReachedPlayer(s)
      })
    } else {
      // Regular mode: lead stops at BATTLE_X, others queue behind with spacing
      this.skeletons.forEach((s, i) => {
        const targetX = this.BATTLE_X + i * this.SKELETON_SPACING
        if (s.x > targetX) {
          s.x -= s.speed * (delta / 1000)
          if (s.x < targetX) s.x = targetX
        }
        s.sprite.setX(s.x)
        s.label.setX(s.x)
        s.aura.setX(s.x)
      })
    }
  }

  private skeletonReachedPlayer(skeleton: Skeleton) {
    // Check targeting BEFORE removeSkeleton clears activeSkeleton
    const wasActive = this.activeSkeleton === skeleton
    this.removeSkeleton(skeleton)
    if (wasActive) this.setActiveSkeleton(this.skeletons[0] ?? null)
    const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
    if (Math.random() < absorbChance) {
      const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', {
        fontSize: '32px', color: '#00ffff'
      }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.playerHp--
      this.flashBarrierRed()
    }
    this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private flashBarrierRed() {
    this.barrierLine.clear()
    this.barrierLine.lineStyle(3, 0xff2200, 1.0)
    this.barrierLine.beginPath()
    const { height } = this.scale
    this.barrierLine.moveTo(100, height * 0.2)
    this.barrierLine.lineTo(100, height * 0.85)
    this.barrierLine.strokePath()
    this.time.delayedCall(300, () => {
      this.barrierLine.clear()
      this.barrierLine.lineStyle(3, 0x00ccff, 1.0)
      this.barrierLine.beginPath()
      this.barrierLine.moveTo(100, height * 0.2)
      this.barrierLine.lineTo(100, height * 0.85)
      this.barrierLine.strokePath()
    })
  }

  private onWordComplete(word: string, _elapsed: number) {
    const skeleton = this.skeletons.find(s => s.word === word)
    if (skeleton) {
      if (this.goldManager) {
        const dropX = skeleton.x + (Math.random() * 40 - 20)
        const dropY = skeleton.sprite.y + 40 + (Math.random() * 20 - 10)
        this.goldManager.spawnGold(dropX, dropY, 5)
      }
      this.removeSkeleton(skeleton)
      this.skeletonsDefeated++

      // Cleave weapon effect
      const pProfileWep = loadProfile(this.profileSlot)
      const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
      const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
      if (Math.random() < cleaveChance) {
        const nextEnemy = this.skeletons[0]
        if (nextEnemy) {
          this.removeSkeleton(nextEnemy)
          this.skeletonsDefeated++
          const cleaveText = this.add.text(nextEnemy.x, nextEnemy.sprite.y - 40, 'CLEAVE!', {
            fontSize: '20px', color: '#ff8800'
          }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
        }
      }
    }

    const next = this.skeletons[0] ?? null
    this.setActiveSkeleton(next)
    // Win check here covers cleave kills that empty the board
    if (this.wordQueue.length === 0 && this.skeletons.length === 0) {
      this.endLevel(true)
      return
    }
    if (this.gameMode === 'regular') this.spawnNextIfReady()
  }

  private spawnNextIfReady() {
    // In regular mode, after a kill, try to pull next word from queue immediately
    if (this.wordQueue.length > 0 && this.skeletons.length < 3) {
      this.spawnSkeleton(false)
    }
  }

  private onWrongKey() {
    if (this.letterShieldCount > 0) {
      this.letterShieldCount--
      return
    }
    this.cameras.main.flash(80, 120, 0, 0)
    // Wrong-key attacks are regular mode only — in advanced mode, skeletons damage on contact instead
    if (!this.finished && this.gameMode === 'regular') {
      this.wrongKeyCount++
      if (this.wrongKeyCount >= this.nextAttackThreshold) {
        this.wrongKeyCount = 0
        this.nextAttackThreshold = Phaser.Math.Between(5, 8)
        const attacker = this.activeSkeleton || this.skeletons[0] || null
        if (attacker) {
          this.tweens.add({
            targets: attacker.sprite,
            scaleX: 1.5,
            scaleY: 1.5,
            yoyo: true,
            duration: 150,
            onComplete: () => {
              if (attacker.sprite?.active) this.skeletonReachedPlayer(attacker)
            }
          })
        }
      }
    }
  }

  private removeSkeleton(skeleton: Skeleton) {
    // Bone burst — reuse pre-created emitter to avoid game object accumulation
    this.boneBurstEmitter?.explode(8, skeleton.x, skeleton.sprite.y)

    skeleton.auraTween?.stop()
    skeleton.aura.destroy()
    skeleton.sprite.destroy()
    skeleton.label.destroy()
    this.skeletons = this.skeletons.filter(s => s !== skeleton)
    if (this.activeSkeleton === skeleton) this.activeSkeleton = null
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.waveTimer?.remove()
    this.spellCaster?.destroy()
    this.typingHands?.fadeOut()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        extraGold: this.goldManager ? this.goldManager.getCollectedGold() : 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
      })
    })
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build 2>&1 | tail -30
```
Expected: no TypeScript errors. If `TypingHands.fadeOut` doesn't exist, check the actual method name in `src/components/TypingHands.ts` and use the correct one.

- [ ] **Step 3: Run existing tests to confirm no regressions**

```bash
npm run test
```
Expected: all tests pass (none test scene code)

- [ ] **Step 4: Manual smoke test — navigate to a SkeletonSwarm level**

```bash
npm run dev
```
Open the browser, create/load a profile, navigate to a world with a SkeletonSwarm level (e.g. world 1, level 7 "Whispering Pass"). Verify:
- Background renders (red sky, dark ruins silhouette, battlefield ground)
- Fire sprites animate
- Skeleton sprites appear (not gray squares)
- Barrier line glows and pulses cyan
- Typing works and defeating a skeleton shows bone burst particles
- Wave counter updates
- Game completes and transitions to LevelResult

- [ ] **Step 5: Commit**

```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts
git commit -m "feat: rewrite SkeletonSwarmLevel with pixel art and epic last stand gameplay"
```

---

## Chunk 3: Polish & Edge Cases

### Task 4: Verify mode differences and fix any issues found in smoke test

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts` (only if issues found)

- [ ] **Step 1: Test regular mode (default)**

With `gameMode = 'regular'` (default for new profiles), verify:
- Skeletons stop at barrier and queue behind each other
- HP hearts are hidden at start
- Mistyping 5–8 times triggers skeleton attack animation
- Hearts appear briefly on damage
- Wave banner appears between waves when previous wave is cleared

- [ ] **Step 2: Test advanced mode**

Change a profile's `gameMode` to `'advanced'` via localStorage:
```js
// In browser console:
const p = JSON.parse(localStorage.getItem('kq_profile_0'))
p.gameMode = 'advanced'
localStorage.setItem('kq_profile_0', JSON.stringify(p))
```
Verify:
- Skeletons march through to barrier and deal damage on contact
- HP hearts are visible from the start
- Camera shakes on contact damage
- Barrier flashes red on damage

- [ ] **Step 3: Test rising skeleton spawns**

Navigate to the level and observe:
- Some skeletons rise from ground mid-field (dirt burst + rise tween)
- Sprite swaps from rising to marching on tween complete
- Others march in from the right edge

- [ ] **Step 4: Test aura targeting**

Verify:
- The active/targeted skeleton has a pulsing cyan aura around it
- After defeating a skeleton, the aura moves to the next one
- No orphaned auras remain after skeleton death

- [ ] **Step 5: Fix any issues found, then commit**

```bash
git add src/scenes/level-types/SkeletonSwarmLevel.ts src/art/skeletonSwarmArt.ts
git commit -m "fix: address SkeletonSwarm smoke test issues"
```
(Skip this commit if no issues were found.)

---

### Task 5: Final verification and cleanup

**Files:**
- Modify: `src/scenes/level-types/SkeletonSwarmLevel.ts` (only if issues found)
- Modify: `src/art/skeletonSwarmArt.ts` (only if issues found)

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```
Expected: all tests pass

- [ ] **Step 2: Run production build**

```bash
npm run build
```
Expected: build completes with no TypeScript errors

- [ ] **Step 3: Test all four SkeletonSwarm worlds**

The level type appears in worlds 1, 2, 4, and 5. Verify at least one level from world 1 and one from world 4 or 5 to confirm speed scaling works (world 4/5 skeletons should march noticeably faster than world 1).

- [ ] **Step 4: Final commit**

```bash
git add -p  # stage any remaining changes
git commit -m "chore: final polish for SkeletonSwarm overhaul"
```
(Skip if nothing to commit.)
