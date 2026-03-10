// src/scenes/level-types/GoblinWhackerLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { TypingHands } from '../../components/TypingHands'
import { SpellCaster } from '../../components/SpellCaster'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
import { setupPause } from '../../utils/pauseSetup'

interface Goblin {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  hp: number
}

export class GoblinWhackerLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private goblins: Goblin[] = []
  private activeGoblin: Goblin | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxGoblinReach = 0  // x position where goblin damages player
  private hpHearts: Phaser.GameObjects.Image[] = []
  private timerText!: Phaser.GameObjects.Text
  private counterText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private goblinsDefeated = 0
  private finished = false
  private spellCaster?: SpellCaster
  private letterShieldCount = 0
  private typingHands?: TypingHands
  private gameMode: 'regular' | 'advanced' = 'regular'
  private readonly BATTLE_X = 300        // where lead goblin stops in regular mode
  private readonly GOBLIN_SPACING = 120  // horizontal gap between queued goblins
  private readonly MAX_VISIBLE_QUEUE = 4 // max goblins on screen at once in regular mode
  private pathY = 0                      // fixed Y for all goblins (set in create)

  constructor() { super('GoblinWhackerLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.goblinsDefeated = 0
    this.playerHp = 3
    this.goblins = []
    this.activeGoblin = null
    this.words = []
    this.wordQueue = []
    this.timeLeft = 0
    this.letterShieldCount = 0
    this.hpHearts = []
    const profile = loadProfile(data.profileSlot)
    this.gameMode = profile?.gameMode ?? 'regular'
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    this.maxGoblinReach = 80

    // Generate pixel art textures
    generateGoblinWhackerTextures(this)

    // Background
    this.add.image(width / 2, height / 2, 'forest_bg')

    // Ground path Y — matches hero position, stays above finger hints area
    this.pathY = height * 0.62

    // Hero sprite
    this.add.image(80, this.pathY, 'hero').setScale(1.5)

    // HUD - HP hearts
    this.hpHearts = []
    for (let i = 0; i < this.playerHp; i++) {
      const heart = this.add.image(30 + i * 24, 28, 'heart').setScale(1.5)
      this.hpHearts.push(heart)
    }
    if (this.gameMode === 'regular') this.hpHearts.forEach(h => h.setVisible(false))

    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    this.counterText = this.add.text(width - 20, 50, '', {
      fontSize: '22px', color: '#ffaaaa'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    // Typing engine (centered, lower third)
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 80,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    this.input.keyboard?.on('keydown', () => {
      if (this.activeGoblin && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.activeGoblin.word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })

    // Spell system
    const spellProfile = loadProfile(this.profileSlot)
    if (spellProfile && spellProfile.spells.length > 0) {
      this.spellCaster = new SpellCaster(this, this.profileSlot, this.engine)
      this.spellCaster.setEffectCallback((effect) => {
        if (effect === 'time_freeze') {
          this.goblins.forEach(g => { g.speed = 0 })
          this.time.delayedCall(5000, () => {
            this.goblins.forEach(g => { g.speed = 60 + this.level.world * 10 })
          })
        } else if (effect === 'word_blast') {
          const nearest = this.goblins.reduce<Goblin | null>((min, g) =>
            !min || g.x < min.x ? g : min, null)
          if (nearest) { this.removeGoblin(nearest); this.goblinsDefeated++ }
        } else if (effect === 'second_chance') {
          this.playerHp = Math.min(this.playerHp + 2, 5)
          // Show hearts up to new HP
          this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
        } else if (effect === 'letter_shield') {
          this.letterShieldCount = 3
        }
      })
    }

    // Typing hands overlay (player setting)
    const hintsProfile = loadProfile(this.profileSlot)
    if (hintsProfile?.showFingerHints) {
      this.typingHands = new TypingHands(this, width / 2, height - 100)
    }

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    const maxLength = this.level.world === 1 ? 5 : undefined
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, maxLength)
    // Shuffle the word pool to randomize the order of words
    const shuffledWords = [...this.words]
    Phaser.Utils.Array.Shuffle(shuffledWords)
    this.wordQueue = shuffledWords

    this.updateCounterText()

    // Timer
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }

    // Spawn goblins
    this.spawnTimer = this.time.addEvent({
      delay: 2500, loop: true, callback: this.spawnGoblin, callbackScope: this
    })
    this.spawnGoblin()
  }

  private spawnGoblin() {
    if (this.finished || this.wordQueue.length === 0) return
    if (this.gameMode === 'regular' && this.goblins.length >= this.MAX_VISIBLE_QUEUE) return
    // Don't spawn if the last goblin is still near the right edge (prevents overlap)
    const lastGoblin = this.goblins[this.goblins.length - 1]
    if (lastGoblin && lastGoblin.x > this.scale.width - this.GOBLIN_SPACING) return
    const word = this.wordQueue.shift()!
    const { width } = this.scale
    const y = this.pathY
    const sprite = this.add.image(width + 30, y, 'goblin')
    const label = this.add.text(width + 30, y - 30, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    const goblin: Goblin = { word, x: width + 30, speed: 60 + this.level.world * 10, sprite, label, hp: 1 }
    this.goblins.push(goblin)

    // Auto-focus first goblin
    if (!this.activeGoblin) this.setActiveGoblin(goblin)
  }

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

  update(_time: number, delta: number) {
    if (this.finished) return

    if (this.gameMode === 'advanced') {
      this.goblins.forEach(g => {
        g.x -= g.speed * (delta / 1000)
        g.sprite.setX(g.x)
        g.label.setX(g.x)
        if (g.x <= this.maxGoblinReach) {
          this.goblinReachedPlayer(g)
        }
      })
    } else {
      // Regular mode: lead stops at BATTLE_X, others queue behind with spacing
      this.goblins.forEach((g, i) => {
        const targetX = this.BATTLE_X + i * this.GOBLIN_SPACING
        if (g.x > targetX) {
          g.x -= g.speed * (delta / 1000)
          if (g.x < targetX) g.x = targetX
        }
        g.sprite.setX(g.x)
        g.label.setX(g.x)
      })
    }
  }

  private goblinReachedPlayer(goblin: Goblin) {
    this.removeGoblin(goblin)
    this.playerHp--
    if (this.hpHearts[this.playerHp]) {
      this.hpHearts[this.playerHp].setVisible(false)
    }
    this.cameras.main.shake(200, 0.01)
    if (this.activeGoblin === goblin) {
      this.setActiveGoblin(this.goblins[0] ?? null)
    }
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private updateCounterText() {
    this.counterText.setText(`Goblins Defeated: ${this.goblinsDefeated} / ${this.level.wordCount}`)
  }

  private onWordComplete(word: string, _elapsed: number) {
    const goblin = this.goblins.find(g => g.word === word)
    if (goblin) {
      this.removeGoblin(goblin)
      this.goblinsDefeated++
      this.updateCounterText()
    }
    // Focus next goblin
    const next = this.goblins[0] ?? null
    this.setActiveGoblin(next)
    if (this.gameMode === 'regular') {
      this.spawnGoblin()
    }

    if (this.wordQueue.length === 0 && this.goblins.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() {
    if (this.letterShieldCount > 0) {
      this.letterShieldCount--
      return
    }
    this.cameras.main.flash(80, 120, 0, 0)
  }

  private removeGoblin(goblin: Goblin) {
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

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    this.spellCaster?.destroy()
    this.typingHands?.fadeOut()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const captureAttempt = this.level.captureEligible
      ? { monsterId: 'goblin', monsterName: 'Goblin' }
      : undefined

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
        companionUsed,
        captureAttempt,
      })
    })
  }
}
