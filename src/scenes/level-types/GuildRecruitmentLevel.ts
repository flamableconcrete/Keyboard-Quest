// src/scenes/level-types/GuildRecruitmentLevel.ts
import { TimedLevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'
import { GOLD_PER_KILL, DEFAULT_PLAYER_HP } from '../../constants'
import { ProgressionController } from '../../controllers/ProgressionController'
import { LevelHUD } from '../../components/LevelHUD'

export class GuildRecruitmentLevel extends BaseLevelScene {
  private progression!: ProgressionController

  constructor() { super('GuildRecruitmentLevel') }

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

    // Background - Tavern theme
    this.add.rectangle(width / 2, height / 2, width, height, 0x4a2e1b)

    this.add.text(width / 2, 100, 'Make your recruitment pitch!', {
      fontSize: '22px', color: '#dddddd'
    }).setOrigin(0.5)

    // Display the pitch words
    this.add.text(width / 2, 200, this.words.join(' '), {
      fontSize: '24px', color: '#ffffff', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5, 0)

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
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    this.showNextWord()
  }

  protected onWrongKey() {
    this.cameras.main.flash(50, 100, 0, 0)
  }

  protected endLevel(passed: boolean) {
    super.endLevel(passed)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
