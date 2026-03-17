# Crazed Cook's Camp Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `SillyChallengeLevel` for `w1_l6` with a full Overcooked-inspired typing level where players fill multi-ingredient orc orders before time runs out or too many customers walk off.

**Architecture:** New scene `CrazedCookLevel` handles all gameplay; new art file `crazedCookArt.ts` generates all procedural pixel-art textures. The scene is wired into the existing type/registration system by adding `'CrazedCook'` to `LevelType` and a mapping in `LevelScene.ts`. No shared state with other scenes.

**Tech Stack:** Phaser 3, TypeScript, Vite. Tests are TypeScript build checks (`npm run build`) — Phaser scenes cannot be meaningfully unit-tested in isolation; manual browser verification is the functional test.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/types/index.ts` | Add `'CrazedCook'` to `LevelType`; add `orderQuota?` and `maxWalkoffs?` to `LevelConfig` |
| Modify | `src/scenes/LevelScene.ts` | Add `CrazedCook → CrazedCookLevel` mapping |
| Modify | `src/main.ts` | Import and register `CrazedCookLevel` scene |
| Modify | `src/data/levels/world1.ts` | Update `w1_l6` config to use new type + fields |
| Create | `src/art/crazedCookArt.ts` | Procedural pixel-art textures for orc, cooks, background |
| Create | `src/scenes/level-types/CrazedCookLevel.ts` | Full level scene implementation |

---

## Chunk 1: Type System & Registration

### Task 1: Add `'CrazedCook'` to LevelType and new optional fields to LevelConfig

**Files:**
- Modify: `src/types/index.ts`

The `LevelType` union is at line 63. `LevelConfig` interface is at line 81. Add `'CrazedCook'` and the two new optional fields.

- [ ] **Step 1: Edit `src/types/index.ts`**

In the `LevelType` union (around line 78), add `'CrazedCook'` after `'SillyChallenge'`:

```ts
  | 'SillyChallenge'
  | 'CrazedCook'
  | 'BossBattle'
```

Then in the `LevelConfig` interface, append two new optional fields **after `phases?: number`** (the last field in the interface, around line 102 — after `bossId?` and `phases?`):

```ts
  phases?: number
  orderQuota?: number       // for CrazedCook: orders needed to win
  maxWalkoffs?: number      // for CrazedCook: max angry walk-offs before losing
```

- [ ] **Step 2: Verify build passes**

```bash
cd /home/flama/code/github/flamableconcrete/Keyboard-Quest && npm run build
```

Expected: no TypeScript errors.

---

### Task 2: Register the scene in LevelScene.ts and main.ts

**Files:**
- Modify: `src/scenes/LevelScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Add mapping in `src/scenes/LevelScene.ts`**

Find the `typeToScene` object (around line 13). Add one line after `SillyChallenge`:

```ts
      SillyChallenge: 'SillyChallengeLevel',
      CrazedCook: 'CrazedCookLevel',
```

- [ ] **Step 2: Import and register in `src/main.ts`**

Find the import for `SillyChallengeLevel` (around line 23). Add a line beneath it:

```ts
import { SillyChallengeLevel } from './scenes/level-types/SillyChallengeLevel'
import { CrazedCookLevel } from './scenes/level-types/CrazedCookLevel'
```

Find where `SillyChallengeLevel` appears in the scene registration array (around line 66). Add `CrazedCookLevel` next to it:

```ts
    MonsterManualLevel, WoodlandFestivalLevel, SillyChallengeLevel, CrazedCookLevel, GuildRecruitmentLevel,
```

- [ ] **Step 3: Create a stub file so the build doesn't fail**

Create `src/scenes/level-types/CrazedCookLevel.ts` with a minimal stub:

```ts
// src/scenes/level-types/CrazedCookLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'

export class CrazedCookLevel extends Phaser.Scene {
  constructor() { super('CrazedCookLevel') }
  init(_data: { level: LevelConfig; profileSlot: number }) {}
  create() {}
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no errors. The stub registers without issue.

---

### Task 3: Update `w1_l6` level config in world1.ts

**Files:**
- Modify: `src/data/levels/world1.ts`

- [ ] **Step 1: Update the `w1_l6` entry**

Find the `w1_l6` block (around line 126). Replace the entire entry:

```ts
  {
    id: 'w1_l6',
    name: "The Crazed Cook's Camp",
    type: 'CrazedCook',
    world: 1,
    unlockedLetters: W1_AFTER_MB2,
    wordCount: 40,
    timeLimit: 90,
    orderQuota: 12,
    maxWalkoffs: 3,
    dialogue: [
      { speaker: "enemy", text: "You dare enter my camp?! My exploding cheese will flatten your fingers!" },
      { speaker: "hero",  text: "...Is that a real threat? Are you a real cook?" },
      { speaker: "enemy", text: "TASTE THE BRIE OF DOOM!" },
    ],
    rewards: { xp: 130 },
    bossGate: null,
  },
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit chunk 1**

```bash
git add src/types/index.ts src/scenes/LevelScene.ts src/main.ts src/scenes/level-types/CrazedCookLevel.ts src/data/levels/world1.ts
git commit -m "feat: wire up CrazedCook level type, registration, and config"
```

---

## Chunk 2: Pixel Art

### Task 4: Create `src/art/crazedCookArt.ts`

**Files:**
- Create: `src/art/crazedCookArt.ts`

All textures are procedurally drawn with Phaser `Graphics`, then converted to textures via `generateTexture`. Follow the exact same pattern as `goblinWhackerArt.ts` — create a `Graphics` object, draw to it, call `generateTexture(key, w, h)`, then destroy the graphics object.

- [ ] **Step 1: Create the art file**

Create `src/art/crazedCookArt.ts`:

```ts
// src/art/crazedCookArt.ts
import Phaser from 'phaser'

export function generateCrazedCookTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('orc_customer')) return
  generateOrcCustomerTexture(scene)
  generateCookTextures(scene)
  generateKitchenBackground(scene)
}

function generateOrcCustomerTexture(scene: Phaser.Scene) {
  // Seated orc: stocky, wide, grey-green
  // Canvas: 48px wide × 40px tall (larger than goblin's slim silhouette)
  const s = 3 // pixel scale
  const g = scene.add.graphics()

  // Body / torso (wide and squat)
  g.fillStyle(0x6b7c3a) // warty grey-green
  g.fillRect(4 * s, 10 * s, 8 * s, 6 * s)

  // Body highlight
  g.fillStyle(0x8a9e4a)
  g.fillRect(5 * s, 11 * s, 3 * s, 2 * s)

  // Leather bib / vest (dark brown)
  g.fillStyle(0x3e2a10)
  g.fillRect(5 * s, 10 * s, 6 * s, 4 * s)
  g.fillRect(6 * s, 14 * s, 4 * s, 2 * s)

  // Head (wide, flat-nosed)
  g.fillStyle(0x6b7c3a)
  g.fillRect(3 * s, 3 * s, 10 * s, 8 * s)

  // Ears (wide and flat)
  g.fillRect(1 * s, 5 * s, 2 * s, 3 * s)
  g.fillRect(13 * s, 5 * s, 2 * s, 3 * s)

  // Forehead warts
  g.fillStyle(0x556030)
  g.fillRect(5 * s, 3 * s, 1 * s, 1 * s)
  g.fillRect(8 * s, 4 * s, 1 * s, 1 * s)
  g.fillRect(11 * s, 3 * s, 1 * s, 1 * s)

  // Eyes (beady yellow)
  g.fillStyle(0xddcc00)
  g.fillRect(5 * s, 6 * s, 2 * s, 2 * s)
  g.fillRect(9 * s, 6 * s, 2 * s, 2 * s)
  // Pupils (black dot)
  g.fillStyle(0x000000)
  g.fillRect(6 * s, 7 * s, 1 * s, 1 * s)
  g.fillRect(10 * s, 7 * s, 1 * s, 1 * s)

  // Flat wide nose
  g.fillStyle(0x4a5a28)
  g.fillRect(6 * s, 8 * s, 4 * s, 2 * s)
  // Nostrils
  g.fillStyle(0x2a3a18)
  g.fillRect(6 * s, 9 * s, 1 * s, 1 * s)
  g.fillRect(9 * s, 9 * s, 1 * s, 1 * s)

  // Mouth line (wide scowl)
  g.fillStyle(0x2a3a18)
  g.fillRect(5 * s, 10 * s, 6 * s, 1 * s)

  // Two bottom tusks jutting up
  g.fillStyle(0xeeeecc)
  g.fillRect(6 * s, 9 * s, 1 * s, 2 * s)
  g.fillRect(9 * s, 9 * s, 1 * s, 2 * s)

  // Arms (hunched forward)
  g.fillStyle(0x6b7c3a)
  g.fillRect(1 * s, 12 * s, 3 * s, 4 * s)
  g.fillRect(12 * s, 12 * s, 3 * s, 4 * s)

  // Hands (fists on counter)
  g.fillStyle(0x556030)
  g.fillRect(0 * s, 15 * s, 3 * s, 3 * s)
  g.fillRect(13 * s, 15 * s, 3 * s, 3 * s)

  g.generateTexture('orc_customer', 16 * s, 20 * s)
  g.destroy()
}

function generateCookTextures(scene: Phaser.Scene) {
  // Cook 1: white apron, ladle
  generateCookWithTool(scene, 'cook_ladle', 0xffffff, (g: Phaser.GameObjects.Graphics, s: number) => {
    // Ladle: yellow handle + round head
    g.fillStyle(0xddaa00)
    g.fillRect(11 * s, 8 * s, 1 * s, 5 * s)
    g.fillStyle(0xffcc22)
    g.fillRect(10 * s, 5 * s, 3 * s, 3 * s)
  })

  // Cook 2: stained apron, kitchen knife
  generateCookWithTool(scene, 'cook_knife', 0xccaa88, (g: Phaser.GameObjects.Graphics, s: number) => {
    // Knife: grey blade + brown handle
    g.fillStyle(0x888888)
    g.fillRect(11 * s, 6 * s, 1 * s, 4 * s)
    g.fillStyle(0x8b5e2a)
    g.fillRect(11 * s, 10 * s, 1 * s, 3 * s)
    // Blade tip
    g.fillStyle(0xaaaaaa)
    g.fillRect(11 * s, 5 * s, 1 * s, 1 * s)
  })

  // Cook 3: tall chef hat, wooden spoon
  generateCookWithTool(scene, 'cook_spoon', 0xffffff, (g: Phaser.GameObjects.Graphics, s: number) => {
    // Tall chef hat (taller white rectangle above head)
    g.fillStyle(0xffffff)
    g.fillRect(5 * s, 0 * s, 4 * s, 4 * s)
    // Wooden spoon: brown handle + oval bowl
    g.fillStyle(0x8b5e2a)
    g.fillRect(11 * s, 7 * s, 1 * s, 5 * s)
    g.fillStyle(0xaa7040)
    g.fillRect(10 * s, 4 * s, 3 * s, 3 * s)
  })
}

function generateCookWithTool(
  scene: Phaser.Scene,
  key: string,
  apronColor: number,
  drawTool: (g: Phaser.GameObjects.Graphics, s: number) => void
) {
  const s = 2
  const g = scene.add.graphics()

  // Body
  g.fillStyle(0xcc9966) // human skin tone
  g.fillRect(4 * s, 5 * s, 6 * s, 7 * s)

  // Apron
  g.fillStyle(apronColor)
  g.fillRect(4 * s, 7 * s, 6 * s, 5 * s)
  // Apron straps
  g.fillRect(4 * s, 5 * s, 1 * s, 2 * s)
  g.fillRect(9 * s, 5 * s, 1 * s, 2 * s)

  // Head
  g.fillStyle(0xcc9966)
  g.fillRect(4 * s, 1 * s, 6 * s, 5 * s)

  // Eyes
  g.fillStyle(0x333333)
  g.fillRect(5 * s, 3 * s, 1 * s, 1 * s)
  g.fillRect(8 * s, 3 * s, 1 * s, 1 * s)

  // Mouth (smile)
  g.fillRect(6 * s, 5 * s, 2 * s, 1 * s)

  // Arms
  g.fillStyle(0xcc9966)
  g.fillRect(2 * s, 7 * s, 2 * s, 4 * s)
  g.fillRect(10 * s, 7 * s, 2 * s, 4 * s)

  // Draw tool in right hand
  drawTool(g, s)

  g.generateTexture(key, 14 * s, 16 * s)
  g.destroy()
}

function generateKitchenBackground(scene: Phaser.Scene) {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Kitchen zone (top half - above counter at y≈360)
  const kitchenHeight = 360
  const tileSize = 32
  for (let row = 0; row * tileSize < kitchenHeight; row++) {
    for (let col = 0; col * tileSize < width; col++) {
      const isDark = (row + col) % 2 === 0
      g.fillStyle(isDark ? 0x4a3728 : 0x3a2a1e)
      g.fillRect(col * tileSize, row * tileSize, tileSize, tileSize)
    }
  }

  // Seating zone (bottom half - below counter)
  const seatTile = 16
  for (let row = 0; row * seatTile < height - kitchenHeight - 40; row++) {
    for (let col = 0; col * seatTile < width; col++) {
      g.fillStyle(0x9e9e8a)
      g.fillRect(col * seatTile, kitchenHeight + 40 + row * seatTile, seatTile, seatTile)
      // Subtle grout lines
      g.fillStyle(0x888878)
      g.fillRect(col * seatTile, kitchenHeight + 40 + row * seatTile, seatTile, 1)
      g.fillRect(col * seatTile, kitchenHeight + 40 + row * seatTile, 1, seatTile)
    }
  }

  // Serving counter band
  g.fillStyle(0x8b6340)
  g.fillRect(0, kitchenHeight, width, 40)
  // Counter highlight stripe
  g.fillStyle(0xaa7a50)
  g.fillRect(0, kitchenHeight, width, 4)
  // Counter shadow
  g.fillStyle(0x6a4a28)
  g.fillRect(0, kitchenHeight + 36, width, 4)

  // Stove top-left corner
  g.fillStyle(0x222222)
  g.fillRect(20, 20, 80, 60)
  g.fillStyle(0x444444)
  g.fillRect(30, 30, 25, 25)
  g.fillRect(60, 30, 25, 25)
  // Burner rings
  g.fillStyle(0xff4400)
  g.fillRect(35, 35, 15, 15)
  g.fillRect(65, 35, 15, 15)
  // Flame flicker dots
  g.fillStyle(0xffaa00)
  g.fillRect(40, 38, 5, 5)
  g.fillRect(70, 38, 5, 5)

  // Stove top-right corner
  g.fillStyle(0x222222)
  g.fillRect(width - 100, 20, 80, 60)
  g.fillStyle(0x444444)
  g.fillRect(width - 90, 30, 25, 25)
  g.fillRect(width - 60, 30, 25, 25)
  g.fillStyle(0xff4400)
  g.fillRect(width - 85, 35, 15, 15)
  g.fillRect(width - 55, 35, 15, 15)
  g.fillStyle(0xffaa00)
  g.fillRect(width - 80, 38, 5, 5)
  g.fillRect(width - 50, 38, 5, 5)

  g.generateTexture('kitchen_bg', width, height)
  g.destroy()
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/art/crazedCookArt.ts
git commit -m "feat: add CrazedCook pixel art textures (orc, cooks, kitchen bg)"
```

---

## Chunk 3: Scene — Scaffold, Background, and Cooks

### Task 5: Replace stub with full scene skeleton

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`

Replace the stub from Task 2 with the full class structure — all properties declared, `init()` clearing state, `create()` building the background/cooks/HUD, and empty method stubs. No game logic yet.

- [ ] **Step 1: Rewrite `CrazedCookLevel.ts` with full scaffold**

```ts
// src/scenes/level-types/CrazedCookLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { TypingHands } from '../../components/TypingHands'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { generateCrazedCookTextures } from '../../art/crazedCookArt'
import { setupPause } from '../../utils/pauseSetup'

interface Ingredient {
  word: string
  done: boolean
}

interface TicketUI {
  bg: Phaser.GameObjects.Rectangle
  lines: Phaser.GameObjects.Text[]
}

interface OrcOrder {
  orcSprite: Phaser.GameObjects.Image
  ticket: TicketUI
  patienceBar: Phaser.GameObjects.Rectangle
  patienceBarBg: Phaser.GameObjects.Rectangle
  ingredients: Ingredient[]
  currentIngredientIndex: number
  patience: number
  patienceRate: number
  seat: number
}

const SEAT_X = [160, 360, 560, 760, 960]
const INGREDIENT_WEIGHTS = [
  { count: 1, weight: 15 },
  { count: 2, weight: 50 },
  { count: 3, weight: 25 },
  { count: 4, weight: 10 },
]

export class CrazedCookLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  private typingHands?: TypingHands
  private timerEvent?: Phaser.Time.TimerEvent
  private timerText!: Phaser.GameObjects.Text
  private ordersText!: Phaser.GameObjects.Text
  private finished = false
  private timeLeft = 0
  private ordersFilled = 0
  private walkoffs = 0
  private wordPool: string[] = []
  private wordIndex = 0
  private orders: OrcOrder[] = []
  private activeOrder: OrcOrder | null = null
  private orderQuota = 12
  private maxWalkoffs = 3

  constructor() { super('CrazedCookLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.timeLeft = 0
    this.ordersFilled = 0
    this.walkoffs = 0
    this.wordPool = []
    this.wordIndex = 0
    this.orders = []
    this.activeOrder = null
    this.orderQuota = data.level.orderQuota ?? 12
    this.maxWalkoffs = data.level.maxWalkoffs ?? 3
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    generateCrazedCookTextures(this)

    // Background
    this.add.image(width / 2, height / 2, 'kitchen_bg')

    // Cook sprites with bobbing tweens
    const cookKeys = ['cook_ladle', 'cook_knife', 'cook_spoon']
    const cookXs = [200, 560, 920]
    cookKeys.forEach((key, i) => {
      const cook = this.add.image(cookXs[i], 460, key).setScale(2)
      this.tweens.add({
        targets: cook,
        y: 460 + 4,
        yoyo: true,
        repeat: -1,
        duration: 600 + i * 150,
        ease: 'Sine.easeInOut',
      })
    })

    // HUD
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '20px', color: '#ffd700', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 0)

    this.timerText = this.add.text(width - 20, 20, `${this.level.timeLimit}s`, {
      fontSize: '20px', color: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(1, 0)

    this.ordersText = this.add.text(width - 20, 46, `Orders: 0/${this.orderQuota}`, {
      fontSize: '16px', color: '#ffaaaa', stroke: '#000', strokeThickness: 2
    }).setOrigin(1, 0)

    // Build word pool
    const difficulty = Math.ceil(this.level.world / 2)
    const maxLength = this.level.world === 1 ? 5 : undefined
    const pool = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, maxLength)
    this.wordPool = Phaser.Utils.Array.Shuffle([...pool])
    this.wordIndex = 0

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 80,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: () => this.cameras.main.flash(80, 120, 0, 0),
    })

    // Finger hints
    const profile = loadProfile(this.profileSlot)
    if (profile?.showFingerHints) {
      this.typingHands = new TypingHands(this, width / 2, height - 100)
    }

    // TAB key to cycle orders
    this.input.keyboard?.on('keydown-TAB', this.cycleActiveOrder, this)

    // Timer
    this.timeLeft = this.level.timeLimit ?? 90
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: (this.level.timeLimit ?? 90) - 1,
      callback: () => {
        this.timeLeft--
        this.timerText.setText(`${this.timeLeft}s`)
        if (this.timeLeft <= 0) this.endLevel(false)
      }
    })

    // Spawn 2 initial orcs
    this.spawnOrc(0)
    this.spawnOrc(1)
  }

  update(_time: number, delta: number) {
    if (this.finished) return
    // patience drain handled in Task 6
  }

  private pickIngredientCount(): number {
    const roll = Math.random() * 100
    let cumulative = 0
    for (const { count, weight } of INGREDIENT_WEIGHTS) {
      cumulative += weight
      if (roll < cumulative) return count
    }
    return 2
  }

  private spawnOrc(seat: number) {
    if (this.wordIndex >= this.wordPool.length) return
    const ingredientCount = this.pickIngredientCount()
    const ingredients: Ingredient[] = []
    for (let i = 0; i < ingredientCount; i++) {
      if (this.wordIndex >= this.wordPool.length) break
      ingredients.push({ word: this.wordPool[this.wordIndex++], done: false })
    }
    if (ingredients.length === 0) return

    const seatX = SEAT_X[seat]
    const orcSprite = this.add.image(seatX, 160, 'orc_customer').setScale(2)

    // Patience bar background
    const patienceBarBg = this.add.rectangle(seatX, 100, 100, 10, 0x444444).setOrigin(0.5)
    // Patience bar foreground
    const patienceBar = this.add.rectangle(seatX - 50, 100, 100, 10, 0x44ff44).setOrigin(0, 0.5)

    // Ticket background + border
    const ticketBg = this.add.rectangle(seatX, 260, 100, 120, 0xf5e6c8).setStrokeStyle(2, 0x8b6340)

    // Ingredient text lines
    const lines: Phaser.GameObjects.Text[] = ingredients.map((ing, i) =>
      this.add.text(seatX, 215 + i * 22, ing.word, {
        fontSize: '13px',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5)
    )

    const patienceDuration = 70 - ingredientCount * 10
    const patienceRate = 1 / (patienceDuration * 60)

    const order: OrcOrder = {
      orcSprite,
      ticket: { bg: ticketBg, lines },
      patienceBar,
      patienceBarBg,
      ingredients,
      currentIngredientIndex: 0,
      patience: 1.0,
      patienceRate,
      seat,
    }
    this.orders.push(order)

    // Auto-focus if no active order
    if (!this.activeOrder) {
      this.setActiveOrder(order)
    }
  }

  private setActiveOrder(order: OrcOrder | null) {
    // Clear old active highlight
    if (this.activeOrder) {
      this.activeOrder.ticket.bg.setStrokeStyle(2, 0x8b6340)
    }
    this.activeOrder = order
    if (order) {
      order.ticket.bg.setStrokeStyle(2, 0xffd700)
      const currentWord = order.ingredients[order.currentIngredientIndex]?.word
      if (currentWord) this.engine.setWord(currentWord)
    } else {
      this.engine.clearWord()
    }
  }

  private cycleActiveOrder() {
    if (this.orders.length <= 1) return
    if (!this.activeOrder) {
      this.setActiveOrder(this.orders[0])
      return
    }
    const currentIdx = this.orders.indexOf(this.activeOrder)
    const next = this.orders[(currentIdx + 1) % this.orders.length]
    this.setActiveOrder(next)
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (!this.activeOrder || this.finished) return
    const order = this.activeOrder
    const ing = order.ingredients[order.currentIngredientIndex]
    if (!ing) return

    // Mark ingredient done, update ticket line
    ing.done = true
    order.ticket.lines[order.currentIngredientIndex].setText(`✓ ${ing.word}`)
    order.ticket.lines[order.currentIngredientIndex].setColor('#44ff44')

    // More ingredients?
    order.currentIngredientIndex++
    const nextIng = order.ingredients[order.currentIngredientIndex]
    if (nextIng) {
      this.engine.setWord(nextIng.word)
      return
    }

    // All done — serve the orc
    this.serveOrc(order)
  }

  private serveOrc(order: OrcOrder) {
    // Celebrate tween then destroy
    this.tweens.add({
      targets: order.orcSprite,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      onComplete: () => order.orcSprite.destroy(),
    })
    // Destroy ticket and patience bar immediately
    order.ticket.bg.destroy()
    order.ticket.lines.forEach(l => l.destroy())
    order.patienceBar.destroy()
    order.patienceBarBg.destroy()
    this.orders = this.orders.filter(o => o !== order)

    this.ordersFilled++
    this.updateOrdersText()

    // Win check
    if (this.ordersFilled >= this.orderQuota) {
      this.endLevel(true)
      return
    }

    // Shift focus
    const remaining = this.orders.filter(o => o !== order)
    this.activeOrder = null
    if (remaining.length > 0) {
      const lowest = remaining.reduce((a, b) => a.seat < b.seat ? a : b)
      this.setActiveOrder(lowest)
    } else {
      this.engine.clearWord()
    }

    // Respawn after delay
    const seat = order.seat
    this.time.delayedCall(1500, () => {
      if (!this.finished && !this.orders.find(o => o.seat === seat)) {
        this.spawnOrc(seat)
      }
    })
  }

  private handleWalkoff(order: OrcOrder) {
    const wasActive = order === this.activeOrder

    this.orders = this.orders.filter(o => o !== order)
    order.orcSprite.destroy()
    order.ticket.bg.destroy()
    order.ticket.lines.forEach(l => l.destroy())
    order.patienceBar.destroy()
    order.patienceBarBg.destroy()

    this.walkoffs++

    if (wasActive) {
      this.engine.clearWord()
      const remaining = this.orders
      const lowest = remaining.length > 0
        ? remaining.reduce((a, b) => a.seat < b.seat ? a : b)
        : null
      this.activeOrder = null
      if (lowest) this.setActiveOrder(lowest)
    }

    // Check lose
    if (this.walkoffs >= this.maxWalkoffs) {
      this.endLevel(false)
      return
    }

    // Respawn after delay
    const seat = order.seat
    this.time.delayedCall(1500, () => {
      if (!this.finished && !this.orders.find(o => o.seat === seat)) {
        this.spawnOrc(seat)
      }
    })
  }

  private updateOrdersText() {
    this.ordersText.setText(`Orders: ${this.ordersFilled}/${this.orderQuota}`)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.typingHands?.fadeOut()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = passed ? calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes) : 0
    const spd = passed ? calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world) : 0
    this.engine.destroy()

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed
      })
    })
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/level-types/CrazedCookLevel.ts
git commit -m "feat: add CrazedCookLevel scene scaffold with background, cooks, HUD, and spawning"
```

---

## Chunk 4: Patience Drain, Tinting, and the `update()` Loop

### Task 6: Wire up patience drain in `update()`

**Files:**
- Modify: `src/scenes/level-types/CrazedCookLevel.ts`

The `update()` method is currently a stub. Replace it with the patience drain loop.

- [ ] **Step 1: Replace the `update()` stub**

Find the `update` method in `CrazedCookLevel.ts`. Replace:

```ts
  update(_time: number, delta: number) {
    if (this.finished) return
    // patience drain handled in Task 6
  }
```

With:

```ts
  update(_time: number, delta: number) {
    if (this.finished) return

    // Work on a copy to safely remove during iteration
    const ordersSnapshot = [...this.orders]
    for (const order of ordersSnapshot) {
      order.patience -= order.patienceRate * (delta / 16.67)

      // Update patience bar width (clamped 0–100)
      // Bar origin is (0, 0.5) so width shrinks from the right, position stays fixed
      const barWidth = Math.max(0, order.patience * 100)
      order.patienceBar.setSize(barWidth, 10)

      // Tint orc toward red as patience drops below 0.33
      if (order.patience < 0.33 && order.patience > 0) {
        const progress = Math.round((0.33 - order.patience) / 0.33 * 100)
        const from = { r: 107, g: 124, b: 58 }
        const to = { r: 220, g: 50, b: 50 }
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(from, to, 100, progress)
        order.orcSprite.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b))
      } else if (order.patience >= 0.33) {
        order.orcSprite.clearTint()
      }

      if (order.patience <= 0) {
        this.handleWalkoff(order)
      }
    }
  }
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Run the dev server:
```bash
npm run dev
```

Navigate to `w1_l6` (The Crazed Cook's Camp). Verify:
- Kitchen background appears (dark checkered top, stone seating area, counter band)
- Three cook sprites bob up and down in the kitchen zone
- Two orcs appear in seats 0 and 1 with parchment order tickets and patience bars
- Patience bars drain over time; orc sprites tint progressively red as patience gets low
- When an orc's patience bar empties, the orc disappears; after ~1.5s a new orc arrives
- Typing engine shows the current ingredient word; typing it correctly advances the ticket
- After 3 walk-offs, the level ends and transitions to LevelResult with `passed: false`

- [ ] **Step 4: Commit**

```bash
git add src/scenes/level-types/CrazedCookLevel.ts
git commit -m "feat: implement patience drain, bar updates, and orc tinting in CrazedCookLevel"
```

---

## Chunk 5: Full Win/Lose Flow and Polish

### Task 7: Verify win, lose, and TAB-switching end-to-end

The full scene logic was written in Task 5 and the update loop in Task 6. This task verifies the complete game flow works correctly through manual play-testing.

- [ ] **Step 1: Manual win condition test**

In dev server, play `w1_l6` and successfully type all ingredients for 12 orders. Verify:
- Order ticket lines turn green with `✓` prefix as each ingredient is typed
- Orc plays scale-up/fade tween when order is complete
- `Orders: X/12` counter in HUD increments
- After the 12th order, the level transitions to `LevelResult` with `passed: true`
- Stars are awarded (accuracy + speed scoring)

- [ ] **Step 2: Manual lose via time-out**

Let the timer reach 0 without completing 12 orders. Verify:
- Timer counts down to 0
- Level transitions to `LevelResult` with `passed: false`
- Both `accuracyStars` and `speedStars` are 0 (no stars awarded on loss)

- [ ] **Step 3: Manual lose via walk-offs**

Allow 3 orcs to fully drain their patience bars. Verify:
- Walk-off orc is removed
- Seat respawns a new orc after 1.5s
- On the 3rd walk-off, level transitions to `LevelResult` with `passed: false`

- [ ] **Step 4: Manual TAB-switching test**

With 2+ orcs seated, press TAB. Verify:
- Active order highlight (gold border) moves to the next orc's ticket
- Typing engine resets to show the current ingredient of the newly selected order
- TAB wraps back to the first orc after cycling through all seated orcs
- TAB is a no-op when only one orc is seated

- [ ] **Step 5: Manual finger hints test**

From the main menu or pause screen, go to Settings and toggle finger hints on (the "Finger Hints" toggle in `SettingsScene`). Return to `w1_l6`. Verify:
- `TypingHands` component appears at the bottom of the screen
- Correct finger is highlighted for each ingredient letter

---

## Final: Build Verification

- [ ] **Verify full production build**

```bash
npm run build
```

Expected: TypeScript type-check passes, Vite production build completes with no errors.

- [ ] **Run test suite**

```bash
npm run test
```

Expected: all existing tests pass (no regressions — this feature has no new unit-testable pure functions).
