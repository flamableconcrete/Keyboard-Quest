// src/scenes/level-types/MagicRuneTypingLevel.ts
import Phaser from 'phaser'
import { TimedLevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'
import { GOLD_PER_KILL, DEFAULT_PLAYER_HP } from '../../constants'
import { ProgressionController } from '../../controllers/ProgressionController'
import { LevelHUD } from '../../components/LevelHUD'

export class MagicRuneTypingLevel extends BaseLevelScene {
  private runeContainer!: Phaser.GameObjects.Container
  private progression!: ProgressionController

  constructor() { super('MagicRuneTypingLevel') }

  init(data: { level: TimedLevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    this.initWordPool()
    this.preCreate(80, height * 0.6, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        timer: this.level.timeLimit ? {
          seconds: this.level.timeLimit,
          onExpire: () => this.endLevel(false),
        } : undefined,
        wordPool: this.wordQueue,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
      }),
    })

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a3a)

    // Draw magic circle background
    const graphics = this.add.graphics()
    graphics.lineStyle(2, 0x00ffff, 0.5)
    graphics.strokeCircle(width / 2, height / 2, 200)
    graphics.strokeCircle(width / 2, height / 2, 220)

    this.runeContainer = this.add.container(width / 2, height / 2)

    this.progression = new ProgressionController([...this.wordQueue])
    this.wordQueue = []

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
    super.endLevel(passed)
  }
}
