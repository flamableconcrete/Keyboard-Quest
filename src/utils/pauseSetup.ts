import Phaser from 'phaser'

export function setupPause(scene: Phaser.Scene, profileSlot: number) {
  const { width, height } = scene.scale

  // Add a subtle "Pause / Quit" button in the bottom right corner
  // so it doesn't conflict with timers, HP, or typing area
  const pauseBtn = scene.add.text(width - 20, height - 20, '[ ESC to Pause ]', {
    fontSize: '18px',
    color: '#888888',
    backgroundColor: '#000000AA',
    padding: { x: 8, y: 4 }
  }).setOrigin(1, 1).setInteractive({ useHandCursor: true }).setDepth(9999)

  pauseBtn.on('pointerdown', () => {
    scene.scene.pause()
    scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot })
  })

  pauseBtn.on('pointerover', () => pauseBtn.setColor('#ffffff'))
  pauseBtn.on('pointerout', () => pauseBtn.setColor('#888888'))

  // Also listen to the ESC key
  scene.input.keyboard?.on('keydown-ESC', () => {
    scene.scene.pause()
    scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot })
  })
}
