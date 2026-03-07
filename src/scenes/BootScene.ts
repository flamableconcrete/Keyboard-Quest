import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }
  preload() {
    // Minimal assets to show loading bar
    // Optional: this.load.image('logo', 'assets/logo.png')
  }
  create() {
    this.scene.start('Preload')
  }
}