// src/scenes/level-types/MagicRuneTypingLevel.ts
import Phaser from 'phaser'
import { TimedLevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'
import { GOLD_PER_KILL } from '../../constants'
import { ProgressionController } from '../../controllers/ProgressionController'

export class MagicRuneTypingLevel extends BaseLevelScene {
  private timerText!: Phaser.GameObjects.Text
  private timerEvent?: Phaser.Time.TimerEvent

  private runeContainer!: Phaser.GameObjects.Container
  private progression!: ProgressionController

  constructor() { super('MagicRuneTypingLevel') }

  init(data: { level: TimedLevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.6)

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a3a)

    // Draw magic circle background
    const graphics = this.add.graphics()
    graphics.lineStyle(2, 0x00ffff, 0.5)
    graphics.strokeCircle(width / 2, height / 2, 200)
    graphics.strokeCircle(width / 2, height / 2, 220)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    // Timer
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    this.runeContainer = this.add.container(width / 2, height / 2)

    this.progression = new ProgressionController([...this.wordQueue])
    this.wordQueue = []

    if (this.level.timeLimit) {
      this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
    }

    this.showNextWord()
  }

  private showNextWord() {
    if (this.finished) return
    const events = this.progression.advance()
    for (const e of events) {
      switch (e.type) {
        case 'next_word':
          this.engine.setWord(e.word)
          // Pulse effect
          this.tweens.add({
            targets: this.runeContainer,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 200,
            yoyo: true,
          })
          break
        case 'level_complete':
          this.endLevel(true)
          break
      }
    }
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    // Magic rune flash
    this.cameras.main.flash(150, 0, 255, 255)
    this.showNextWord()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
    // Rotate magic circle slightly
    this.runeContainer.rotation += 0.005
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    super.endLevel(passed)
  }
}
