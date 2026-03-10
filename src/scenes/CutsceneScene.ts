import Phaser from 'phaser'
import { TypingHands } from '../components/TypingHands'
import { loadProfile } from '../utils/profile'

interface CutsceneData {
  letter: string
  title: string
  profileSlot: number
  nextScene: string
  nextSceneData: object
}

export class CutsceneScene extends Phaser.Scene {
  private cutsceneData!: CutsceneData

  constructor() { super('Cutscene') }

  init(data: CutsceneData) {
    this.cutsceneData = data
  }

  create() {
    const { width, height } = this.scale
    const { letter, title } = this.cutsceneData

    this.add.rectangle(width / 2, height / 2, width, height, 0x050510)

    const glow = this.add.circle(width / 2, height / 2 - 60, 80, 0xffd700, 0.15)
    this.tweens.add({
      targets: glow,
      scaleX: 1.4, scaleY: 1.4, alpha: 0.4,
      duration: 900, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })

    const letterText = this.add.text(width / 2, height / 2 - 60,
      letter.toUpperCase(), {
        fontSize: '120px', color: '#ffd700', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: letterText,
      alpha: 1, scaleX: 1.2, scaleY: 1.2,
      duration: 800, ease: 'Back.easeOut',
    })

    const titleText = this.add.text(width / 2, height / 2 + 80,
      title, {
        fontSize: '28px', color: '#ffffff', fontStyle: 'italic'
      }).setOrigin(0.5).setAlpha(0)

    const announcementText = this.add.text(width / 2, height / 2 + 130,
      `The letter "${letter.toUpperCase()}" has been restored to the realm!`, {
        fontSize: '22px', color: '#aaaaff'
      }).setOrigin(0.5).setAlpha(0)

    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: titleText, alpha: 1, duration: 600 })
      this.tweens.add({ targets: announcementText, alpha: 1, duration: 600 })
    })

    // Show finger hint for the restored letter (if enabled)
    const profile = loadProfile(this.cutsceneData.profileSlot)
    if (profile?.showFingerHints) {
      const hands = new TypingHands(this, width / 2, height - 20)
      hands.highlightFinger(letter)
    }

    const cont = this.add.text(width / 2, height - 40,
      'Press SPACE or click to continue', {
        fontSize: '20px', color: '#888888'
      }).setOrigin(0.5)

    this.tweens.add({
      targets: cont, alpha: 0.2, duration: 700, yoyo: true, repeat: -1
    })

    this.input.on('pointerdown', () => this.advance())
    this.input.keyboard?.on('keydown-SPACE', () => this.advance())
  }

  private advance() {
    this.scene.start(this.cutsceneData.nextScene, this.cutsceneData.nextSceneData)
  }
}
