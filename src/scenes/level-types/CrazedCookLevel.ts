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

    // Dark backing panel behind the word display
    this.add.rectangle(width / 2, height - 80, 500, 56, 0x000000, 0.55).setOrigin(0.5)

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
      this.typingHands = new TypingHands(this, width / 2, height - 160)
    }

    // TAB key to cycle orders
    this.input.keyboard?.on('keydown-TAB', this.cycleActiveOrder, this)

    // Update finger hint after each keypress
    this.input.keyboard?.on('keydown', () => {
      if (this.activeOrder && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const currentWord = this.activeOrder.ingredients[this.activeOrder.currentIngredientIndex]?.word
        const nextCh = currentWord?.[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })

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
        const from = new Phaser.Display.Color(107, 124, 58)
        const to = new Phaser.Display.Color(220, 50, 50)
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
    // Patience bar foreground (origin 0, 0.5 so shrinking width goes left-to-right)
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
    // Deactivate old order — dim its current ingredient line
    if (this.activeOrder) {
      this.activeOrder.ticket.bg.setStrokeStyle(2, 0x8b6340)
      const prevIdx = this.activeOrder.currentIngredientIndex
      const prevLine = this.activeOrder.ticket.lines[prevIdx]
      if (prevLine && !this.activeOrder.ingredients[prevIdx]?.done) {
        prevLine.setColor('#888888')
      }
    }
    this.activeOrder = order
    if (order) {
      order.ticket.bg.setStrokeStyle(2, 0xffd700)
      const currentWord = order.ingredients[order.currentIngredientIndex]?.word
      if (currentWord) {
        this.engine.setWord(currentWord)
        if (this.typingHands) this.typingHands.highlightFinger(currentWord[0])
        order.ticket.lines[order.currentIngredientIndex]?.setColor('#1a0a00')
      }
    } else {
      this.engine.clearWord()
    }
  }

  private cycleActiveOrder() {
    if (this.orders.length <= 1) return
    const sorted = [...this.orders].sort((a, b) => a.seat - b.seat)
    if (!this.activeOrder) {
      this.setActiveOrder(sorted[0])
      return
    }
    const currentIdx = sorted.indexOf(this.activeOrder)
    const next = sorted[(currentIdx + 1) % sorted.length]
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
      order.ticket.lines[order.currentIngredientIndex]?.setColor('#1a0a00')
      if (this.typingHands) this.typingHands.highlightFinger(nextIng.word[0])
      return
    }

    // All done — serve the orc
    this.serveOrc(order)
  }

  private serveOrc(order: OrcOrder) {
    // Celebrate tween then destroy sprite
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

    // Shift focus to lowest remaining seat
    this.activeOrder = null
    const remaining = [...this.orders]
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
