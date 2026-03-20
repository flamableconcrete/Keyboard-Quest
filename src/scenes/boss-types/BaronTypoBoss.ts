// src/scenes/boss-types/BaronTypoBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene } from '../BaseBossScene'

export class BaronTypoBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private wordsPerPhase = 5
  private phaseWordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text

  private bossHp = 0
  private bossMaxHp = 0

  private playerHp = 5
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent

  constructor() { super('BaronTypoBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.playerHp = 5
    this.phase = 1
    // Number of words is dictated by config, distributed across 3 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(data.level.wordCount / this.maxPhases))
  }

  create() {
    this.preCreate()
    const { width, height } = this.scale

    // Deep Purple/Dark Background for Baron Typo
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a2a)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '28px', color: '#cc88ff'
    }).setOrigin(0.5, 0)

    this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    // Boss Sprite (Baron is purple and sophisticated-looking placeholder)
    this.bossSprite = this.add.rectangle(width / 2, height * 0.42, 200, 300, 0x800080)
    this.bossSprite.setStrokeStyle(4, 0xffd700) // Gold trim

    this.bossMaxHp = this.level.wordCount
    this.bossHp = this.bossMaxHp
    this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Baron Typo HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#cc88ff'
    }).setOrigin(0.5)

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

    this.startPhase()
  }

  private startPhase() {
    this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)

    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)

    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.bossHp)
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)

    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.phaseWordQueue = shuffledWords

    // Setup attack timer based on phase
    this.attackTimer?.remove()
    this.attackTimer = this.time.addEvent({
      delay: Math.max(2000, 5000 - (this.phase * 800)), // Gets faster each phase
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })

    // Visual cue for phase change
    this.cameras.main.flash(500, 128, 0, 128)

    this.loadNextWord()
  }

  private scrambleWord(word: string): string {
    if (word.length <= 1) return word
    let scrambled = word
    let attempts = 0
    while (scrambled === word && attempts < 10) {
      scrambled = word.split('').sort(() => Math.random() - 0.5).join('')
      attempts++
    }
    return scrambled
  }

  private loadNextWord() {
    if (this.phaseWordQueue.length === 0) {
      if (this.phase < this.maxPhases && this.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }
    const correctWord = this.phaseWordQueue[0]
    const scrambledWord = this.scrambleWord(correctWord)

    // In Phase 1, show the scrambled word as the display to help.
    // In Phase 2 & 3, show underscores to force looking at the boss.
    if (this.phase === 1) {
      this.engine.setWord(correctWord, scrambledWord)
    } else {
      // Show underscores in the engine
      const underscores = '_'.repeat(correctWord.length)
      this.engine.setWord(correctWord, underscores)
    }
  }

  private bossAttack() {
    if (this.finished) return

    // Attack animation
    this.tweens.add({
      targets: this.bossSprite,
      y: this.bossSprite.y + 20,
      scaleX: 1.2,
      yoyo: true,
      duration: 150,
      onComplete: () => {
        const pProfile = loadProfile(this.profileSlot)
        const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
        const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
        if (Math.random() < absorbChance) {
          const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
        } else {
          this.playerHp--
        }
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(300, 0.02)

        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, 5); // 5 gold per kill
    }

    if (this.finished) return

    this.phaseWordQueue.shift()
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Baron Typo HP: ${this.bossHp}/${this.bossMaxHp}`)

    // Visual damage cue
    this.bossSprite.setFillStyle(0xddaabb)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x800080)
    })

    this.loadNextWord()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 150, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    this.attackTimer?.remove()

    if (passed) {
      this.bossSprite.destroy()
      this.bossHpText.setText('FOILED!')
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
