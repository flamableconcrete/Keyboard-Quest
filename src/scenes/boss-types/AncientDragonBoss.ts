// src/scenes/boss-types/AncientDragonBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene } from '../BaseBossScene'

export class AncientDragonBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private sentenceQueue: string[] = []

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

  constructor() { super('AncientDragonBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.playerHp = 5
    this.phase = 1
  }

  create() {
    this.preCreate()
    const { width, height } = this.scale

    // Deep purple/black background for Ancient Dragon
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a001a)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '28px', color: '#a020f0'
    }).setOrigin(0.5, 0)

    this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    // Boss Sprite (Ancient Dragon is big and purple)
    this.bossSprite = this.add.rectangle(width / 2, height * 0.42, 350, 350, 0x4b0082)

    this.bossMaxHp = this.level.wordCount
    this.bossHp = this.bossMaxHp
    this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Ancient Dragon HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#a020f0'
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

    // Distribute total words across phases
    const wordsInThisPhase = Math.ceil(this.bossMaxHp / this.maxPhases)
    const wordsRemaining = Math.min(wordsInThisPhase, this.bossHp)

    // Sentence length depends on phase
    let wordsPerSentence = 2
    if (this.phase === 2) wordsPerSentence = 4
    if (this.phase === 3) wordsPerSentence = 6

    const words = getWordPool(this.level.unlockedLetters, wordsRemaining, difficulty, this.level.world === 1 ? 5 : undefined)
    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords);

    this.sentenceQueue = []
    for (let i = 0; i < shuffledWords.length; i += wordsPerSentence) {
      const sentenceWords = shuffledWords.slice(i, i + wordsPerSentence)
      if (sentenceWords.length > 0) {
        this.sentenceQueue.push(sentenceWords.join(' '))
      }
    }

    // Setup attack timer
    this.attackTimer?.remove()
    this.attackTimer = this.time.addEvent({
      delay: Math.max(1200, 3500 - (this.phase * 600)),
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })

    this.cameras.main.flash(500, 75, 0, 130)
    this.loadNextSentence()
  }

  private loadNextSentence() {
    if (this.sentenceQueue.length === 0) {
      if (this.phase < this.maxPhases && this.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }
    const sentence = this.sentenceQueue[0]
    this.engine.setWord(sentence)
  }

  private bossAttack() {
    if (this.finished) return

    this.tweens.add({
      targets: this.bossSprite,
      scaleX: 1.15,
      scaleY: 1.15,
      angle: Phaser.Math.Between(-5, 5),
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

        if (this.phase >= 2) {
           this.cameras.main.flash(100, 100, 0, 200)
        }

        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  protected onWordComplete(sentence: string, _elapsed: number) {
    if (this.finished) return

    const wordsInSentence = sentence.split(' ').length
    this.sentenceQueue.shift()
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.bossHp -= (wordsInSentence + powerBonus)
    this.bossHpText.setText(`Ancient Dragon HP: ${Math.max(0, this.bossHp)}/${this.bossMaxHp}`)

    this.bossSprite.setFillStyle(0xffffff)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x4b0082)
    })

    this.loadNextSentence()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 80, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    this.attackTimer?.remove()

    if (passed) {
      this.bossSprite.destroy()
      this.bossHpText.setText('DEFEATED!')
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
