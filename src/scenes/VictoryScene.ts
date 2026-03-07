import Phaser from 'phaser'
import { loadProfile } from '../utils/profile'
import { ProfileData } from '../types'

export class VictoryScene extends Phaser.Scene {
  private profile!: ProfileData

  constructor() { super('VictoryScene') }

  init(data: { profileSlot: number }) {
    this.profile = loadProfile(data.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x050520)

    this.createFireworks()

    const titleObj = this.add.text(width / 2, 100,
      'YOU WON!', {
        fontSize: '80px', color: '#ffd700', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: titleObj, alpha: 1, duration: 1000, ease: 'Power2' })

    this.add.text(width / 2, 195,
      'The Typemancer has been defeated!', {
        fontSize: '28px', color: '#aaaaff'
      }).setOrigin(0.5)

    const y0 = 270
    this.add.text(width / 2, y0, `Hero: ${this.profile.playerName}`, {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, y0 + 40, `Level ${this.profile.characterLevel} · ${this.profile.xp} XP`, {
      fontSize: '20px', color: '#aaffaa'
    }).setOrigin(0.5)

    const titlesText = this.profile.titles.length > 0
      ? `Titles: ${this.profile.titles.join(' · ')}`
      : 'No titles earned yet'
    this.add.text(width / 2, y0 + 80, titlesText, {
      fontSize: '18px', color: '#ffd700', wordWrap: { width: 900 }
    }).setOrigin(0.5)

    this.add.text(width / 2, y0 + 130,
      `Companions: ${this.profile.companions.length} · Pets: ${this.profile.pets.length}`, {
        fontSize: '18px', color: '#aaaaff'
      }).setOrigin(0.5)

    const shimmer = this.add.text(width / 2, y0 + 190,
      '  A legend is written in the keys you have struck.  ', {
        fontSize: '20px', color: '#ffee88', fontStyle: 'italic'
      }).setOrigin(0.5)
    this.tweens.add({
      targets: shimmer, alpha: 0.4, duration: 1500, yoyo: true, repeat: -1
    })

    const btnY = height - 120
    const playAgain = this.add.text(width / 2 - 160, btnY,
      '[ Play Again ]', {
        fontSize: '28px', color: '#44ff88', backgroundColor: '#003311',
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    playAgain.on('pointerdown', () => {
      this.scene.start('ProfileSelect')
    })

    const mainMenu = this.add.text(width / 2 + 160, btnY,
      '[ Main Menu ]', {
        fontSize: '28px', color: '#aaaaff', backgroundColor: '#001133',
        padding: { x: 12, y: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    mainMenu.on('pointerdown', () => {
      this.scene.start('MainMenu')
    })
  }

  private createFireworks() {
    const { width, height } = this.scale
    const colors = [0xffd700, 0xff4444, 0x44ffff, 0xff88ff, 0x88ff44]
    const burst = () => {
      const x = Phaser.Math.Between(100, width - 100)
      const y = Phaser.Math.Between(50, height / 2)
      const color = Phaser.Utils.Array.GetRandom(colors) as number
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2
        const spark = this.add.circle(x, y, 5, color)
        this.tweens.add({
          targets: spark,
          x: x + Math.cos(angle) * Phaser.Math.Between(60, 130),
          y: y + Math.sin(angle) * Phaser.Math.Between(60, 130),
          alpha: 0, scaleX: 0.2, scaleY: 0.2,
          duration: Phaser.Math.Between(600, 1200),
          ease: 'Power2',
          onComplete: () => spark.destroy()
        })
      }
    }
    burst()
    this.time.addEvent({ delay: 800, repeat: 15, callback: burst })
  }
}
