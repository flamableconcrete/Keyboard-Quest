// src/scenes/level-types/PotionBrewingLabLevel.ts
import Phaser from 'phaser'
import { TimedLevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'
import { GOLD_PER_KILL } from '../../constants'
import { ProgressionController } from '../../controllers/ProgressionController'

export class PotionBrewingLabLevel extends BaseLevelScene {
  private timerText!: Phaser.GameObjects.Text
  private timerEvent?: Phaser.Time.TimerEvent

  private recipeTexts: Phaser.GameObjects.Text[] = []
  private progression!: ProgressionController

  constructor() { super('PotionBrewingLabLevel') }

  init(data: { level: TimedLevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.65)

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2e1a3a)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    // Timer
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Override engine position — potion brewing uses a center-stage engine
    // Note: preCreate places the engine at the default bottom; we use wordQueue from preCreate
    // but show the recipe list using words
    this.add.text(50, 80, "Potion Recipe:", { fontSize: '28px', color: '#ffaaaa' })
    this.recipeTexts = this.words.map((w, i) => {
      return this.add.text(50, 130 + i * 40, w, {
        fontSize: '24px', color: '#888888'
      })
    })

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
        case 'next_word': {
          const currentIdx = this.words.length - this.progression.wordsRemaining - 1

          // Update recipe highlighting
          this.recipeTexts.forEach((t, i) => {
            if (i < currentIdx) t.setColor('#44ff44').setAlpha(0.5) // done
            else if (i === currentIdx) t.setColor('#ffffff').setAlpha(1) // current
            else t.setColor('#888888').setAlpha(0.8) // pending
          })

          this.engine.setWord(e.word)
          break
        }
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

    // Add satisfying potion pop effect
    this.cameras.main.flash(50, 0, 255, 0)
    this.showNextWord()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
    this.cameras.main.shake(100, 0.01)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    super.endLevel(passed)
  }
}
