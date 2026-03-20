// src/scenes/level-types/WoodlandFestivalLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { BaseLevelScene } from '../BaseLevelScene'

export class WoodlandFestivalLevel extends BaseLevelScene {
  private playerScore = 0
  private aiScore = 0
  private playerScoreText!: Phaser.GameObjects.Text
  private aiScoreText!: Phaser.GameObjects.Text
  private aiTimer?: Phaser.Time.TimerEvent

  constructor() { super('WoodlandFestivalLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.playerScore = 0
    this.aiScore = 0
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.65)

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d4a1e)

    // HUD
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    this.add.text(width / 2, 80, 'Typing Contest vs Animal Champion!', {
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5)

    this.playerScoreText = this.add.text(200, 200, 'Player Score: 0', {
      fontSize: '24px', color: '#44ff44'
    })

    this.aiScoreText = this.add.text(width - 400, 200, 'Animal Score: 0', {
      fontSize: '24px', color: '#ff4444'
    })

    this.engine.setWord(this.wordQueue.shift()!)

    // AI logic
    this.aiTimer = this.time.addEvent({
      delay: Math.max(1000, 3000 - this.level.world * 200), // AI types faster in later worlds
      loop: true,
      callback: () => {
        if (this.finished) return
        this.aiScore++
        this.aiScoreText.setText(`Animal Score: ${this.aiScore}`)
      }
    })
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, 5);
    }

    this.playerScore++
    this.playerScoreText.setText(`Player Score: ${this.playerScore}`)

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
    this.aiTimer?.remove()
    super.endLevel(passed)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
