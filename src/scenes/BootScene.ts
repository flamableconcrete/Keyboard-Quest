import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }
  create() {
    this.add.text(100, 100, 'Keyboard Quest', { fontSize: '48px', color: '#ffffff' })
  }
}