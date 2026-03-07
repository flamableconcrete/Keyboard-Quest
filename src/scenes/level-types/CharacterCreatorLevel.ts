// src/scenes/level-types/CharacterCreatorLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'

export class CharacterCreatorLevel extends Phaser.Scene {
  private profileSlot!: number
  private engine!: TypingEngine
  private finished = false

  constructor() { super('CharacterCreatorLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.profileSlot = data.profileSlot
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
    if (this.finished) return
    this.finished = true
    this.engine.destroy()

    // Transitions directly to overland map
    this.time.delayedCall(500, () => {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot })
    })
  }
}