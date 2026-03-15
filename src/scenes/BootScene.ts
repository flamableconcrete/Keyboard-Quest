import Phaser from 'phaser'
import { isMobile } from '../utils/mobile'

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }
  preload() {
    // Minimal assets to show loading bar
    // Optional: this.load.image('logo', 'assets/logo.png')
  }
  create() {
    this.registry.set('isMobile', isMobile())
    this.scene.start('Preload')
  }
}