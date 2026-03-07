import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { ProfileSelectScene } from './scenes/ProfileSelectScene'
import { OverlandMapScene } from './scenes/OverlandMapScene'
import { LevelIntroScene } from './scenes/LevelIntroScene'
import { LevelResultScene } from './scenes/LevelResultScene'
import { LevelScene } from './scenes/LevelScene'
import { GoblinWhackerLevel } from './scenes/level-types/GoblinWhackerLevel'

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, PreloadScene, MainMenuScene, ProfileSelectScene, OverlandMapScene, LevelIntroScene, LevelResultScene, LevelScene, GoblinWhackerLevel],
})
