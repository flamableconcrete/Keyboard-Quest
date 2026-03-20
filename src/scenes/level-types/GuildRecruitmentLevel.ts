// src/scenes/level-types/GuildRecruitmentLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'

export class GuildRecruitmentLevel extends BaseLevelScene {
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent

  constructor() { super('GuildRecruitmentLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.65)

    // Background - Tavern theme
    this.add.rectangle(width / 2, height / 2, width, height, 0x4a2e1b)

    // HUD
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    this.add.text(width / 2, 100, 'Make your recruitment pitch!', {
      fontSize: '22px', color: '#dddddd'
    }).setOrigin(0.5)

    // Display the pitch words
    this.add.text(width / 2, 200, this.words.join(' '), {
      fontSize: '24px', color: '#ffffff', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5, 0)

    // Set first word
    this.engine.setWord(this.wordQueue.shift()!)

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
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, 5);
    }

    if (this.wordQueue.length === 0) {
      this.endLevel(true)
    } else {
      this.engine.setWord(this.wordQueue.shift()!)
    }
  }

  protected onWrongKey() {
    this.cameras.main.flash(50, 100, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    super.endLevel(passed)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
