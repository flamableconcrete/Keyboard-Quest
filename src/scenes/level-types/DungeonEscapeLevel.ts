// src/scenes/level-types/DungeonEscapeLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'

export class DungeonEscapeLevel extends BaseLevelScene {
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent

  private crackFill!: Phaser.GameObjects.Rectangle
  private totalWords = 0

  constructor() { super('DungeonEscapeLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.65)

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2e3a)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    // Crack progress bar (escape progress)
    const barWidth = width * 0.8
    this.add.text(width / 2, height / 2 - 100, "Break the door!", { fontSize: '24px', color: '#aaaaaa' }).setOrigin(0.5)
    this.add.rectangle(width / 2, height / 2 - 60, barWidth, 30, 0x000000)
    this.crackFill = this.add.rectangle((width - barWidth) / 2, height / 2 - 60, 0, 30, 0xffaa00).setOrigin(0, 0.5)

    // Timer
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    this.totalWords = this.words.length

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

    this.showNextWord()
  }

  private showNextWord() {
    if (this.finished) return
    if (this.wordQueue.length === 0) {
      this.endLevel(true)
      return
    }
    const word = this.wordQueue.shift()!
    this.engine.setWord(word)
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, 5);
    }

    const completed = this.totalWords - this.wordQueue.length
    const pct = completed / this.totalWords
    this.crackFill.setDisplaySize((this.scale.width * 0.8) * pct, 30)

    // Shake effect to simulate breaking door
    this.cameras.main.shake(100, 0.005)

    this.showNextWord()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    super.endLevel(passed)
  }
}
