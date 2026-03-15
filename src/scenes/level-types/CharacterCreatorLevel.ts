
// src/scenes/level-types/CharacterCreatorLevel.ts
import Phaser from 'phaser'
import { GoldManager } from '../../utils/goldSystem'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'

export class CharacterCreatorLevel extends Phaser.Scene {
  public goldManager?: GoldManager
  private profileSlot!: number
  private level!: LevelConfig
  private engine!: TypingEngine
  private finished = false

  constructor() { super('CharacterCreatorLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.level = data.level
    this.finished = false
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x222222)

    this.add.text(width / 2, height / 2 - 100, 'Your journey begins now...', {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 40, 'Type start to embark on your quest!', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height / 2 + 60,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: () => {},
    })

    this.engine.setWord('start')
  }

  private onWordComplete(_word: string, _elapsed: number) {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, 5); // 5 gold per kill
    }

    if (this.finished) return
    this.finished = true
    this.engine.destroy()

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        extraGold: this.goldManager ? this.goldManager.getCollectedGold() : 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: 5,
        speedStars: 5,
        passed: true
      })
    })
  }
  update(_time: number, delta: number) {
    this.goldManager?.update(delta)
  }
}