import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
new Phaser.Game({
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    scene: [BootScene],
});
