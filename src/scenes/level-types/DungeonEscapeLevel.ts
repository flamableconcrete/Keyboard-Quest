// src/scenes/level-types/DungeonEscapeLevel.ts
import Phaser from 'phaser'
import { TimedLevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'
import { ProgressionController } from '../../controllers/ProgressionController'
import { LevelHUD } from '../../components/LevelHUD'
import { DEFAULT_PLAYER_HP } from '../../constants'

export class DungeonEscapeLevel extends BaseLevelScene {
  private crackFill!: Phaser.GameObjects.Rectangle
  private totalWords = 0
  private progression!: ProgressionController

  constructor() { super('DungeonEscapeLevel') }

  init(data: { level: TimedLevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    this.initWordPool()
    this.preCreate(80, height * 0.65, {
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
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2e3a)

    // Crack progress bar (escape progress)
    const barWidth = width * 0.8
    this.add.text(width / 2, height / 2 - 100, "Break the door!", { fontSize: '24px', color: '#aaaaaa' }).setOrigin(0.5)
    this.add.rectangle(width / 2, height / 2 - 60, barWidth, 30, 0x000000)
    this.crackFill = this.add.rectangle((width - barWidth) / 2, height / 2 - 60, 0, 30, 0xffaa00).setOrigin(0, 0.5)

    this.totalWords = this.words.length

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
          break
        case 'level_complete':
          this.endLevel(true)
          break
      }
    }
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    this.spawnWordGold()

    const completed = this.totalWords - this.progression.wordsRemaining
    const pct = completed / this.totalWords
    this.crackFill.setDisplaySize((this.scale.width * 0.8) * pct, 30)

    // Shake effect to simulate breaking door
    this.cameras.main.shake(100, 0.005)

    this.showNextWord()
  }

  protected onWrongKey() {
    this.flashOnWrongKey()
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }

  protected endLevel(passed: boolean) {
    super.endLevel(passed)
  }
}
