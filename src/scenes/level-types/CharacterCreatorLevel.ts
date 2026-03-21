// src/scenes/level-types/CharacterCreatorLevel.ts
import { TypingEngine } from '../../components/TypingEngine'
import { BaseLevelScene } from '../BaseLevelScene'

export class CharacterCreatorLevel extends BaseLevelScene {
  constructor() { super('CharacterCreatorLevel') }

  create() {
    const { width, height } = this.scale

    // NOTE: preCreate() is intentionally NOT called here.
    // This scene has no avatar, companion, word pool, or spells — base-class setup
    // would add unnecessary visual elements. goldManager is therefore also absent.

    this.add.rectangle(width / 2, height / 2, width, height, 0x222222)

    this.add.text(width / 2, height / 2 - 100, 'Your journey begins now...', {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 - 40, 'Type start to embark on your quest!', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height / 2 + 60,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    this.engine.setWord('start')
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return
    this.finished = true
    this.engine.destroy()

    // NOTE: endLevel() is intentionally NOT called here.
    // This intro level always awards 5/5 stars — no speed pressure for new players.
    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        extraGold: 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: 5,
        speedStars: 5,
        passed: true,
      })
    })
  }

  protected onWrongKey(): void {}
}
