import Phaser from 'phaser'

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu') }

  create() {
    const { width, height } = this.scale

    // Title
    this.add.text(width / 2, height * 0.25, 'KEYBOARD QUEST', {
      fontSize: '64px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.38, 'The Curse of the Typemancer', {
      fontSize: '24px',
      color: '#aaaaff',
    }).setOrigin(0.5)

    // Play button
    const playBtn = this.add.text(width / 2, height * 0.58, '[ PLAY ]', {
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    playBtn.on('pointerover', () => playBtn.setColor('#ffd700'))
    playBtn.on('pointerout', () => playBtn.setColor('#ffffff'))
    playBtn.on('pointerdown', () => this.scene.start('ProfileSelect'))

    // Keyboard-required notice at the bottom
    this.add.text(width / 2, height * 0.9, '⌨  A physical keyboard is required to play', {
      fontSize: '16px',
      color: '#666688',
    }).setOrigin(0.5)
  }
}
