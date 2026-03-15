import { AudioHelper } from '../utils/AudioHelper'
import Phaser from 'phaser'

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu') }

  create() {
    AudioHelper.playBGM(this, 'bgm_menu');
    const { width, height } = this.scale
    const mobile = this.registry.get('isMobile');

    const musicBtn = this.add.text(width - 20, 20, AudioHelper.isMusicEnabled() ? '🎵 Music: ON' : '🎵 Music: OFF', {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    musicBtn.on('pointerdown', () => {
       const enabled = !AudioHelper.isMusicEnabled();
       AudioHelper.setMusicEnabled(enabled, this);
       musicBtn.setText(enabled ? '🎵 Music: ON' : '🎵 Music: OFF');
    })

    // Title
    this.add.text(width / 2, height * 0.25, 'KEYBOARD QUEST', {
      fontSize: mobile ? '40px' : '64px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.38, 'The Curse of the Typemancer', {
      fontSize: mobile ? '18px' : '24px',
      color: '#aaaaff',
    }).setOrigin(0.5)

    // Play button
    const playBtn = this.add.text(width / 2, height * 0.58, '[ PLAY ]', {
      fontSize: mobile ? '40px' : '36px',
      color: '#ffffff',
      padding: mobile ? { x: 30, y: 20 } : undefined,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    playBtn.on('pointerover', () => playBtn.setColor('#ffd700'))
    playBtn.on('pointerout', () => playBtn.setColor('#ffffff'))
    playBtn.on('pointerdown', () => this.scene.start('ProfileSelect'))

    // Keyboard-required notice at the bottom
    const noticeText = mobile
      ? 'Play levels on a computer — explore your adventure on the go!'
      : '⌨  A physical keyboard is required to play';
    this.add.text(width / 2, height * 0.9, noticeText, {
      fontSize: mobile ? '14px' : '16px',
      color: '#666688',
      wordWrap: { width: width * 0.8 },
      align: 'center',
    }).setOrigin(0.5)
  }
}
