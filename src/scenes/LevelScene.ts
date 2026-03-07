// src/scenes/LevelScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

// LevelScene is a thin dispatcher — it reads the level type
// and delegates to the correct level implementation scene.
export class LevelScene extends Phaser.Scene {
  constructor() { super('Level') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    const typeToScene: Record<string, string> = {
      GoblinWhacker: 'GoblinWhackerLevel',
      SkeletonSwarm: 'SkeletonSwarmLevel',
      MonsterArena: 'MonsterArenaLevel',
      DungeonTrapDisarm: 'DungeonTrapDisarmLevel',
      DungeonEscape: 'DungeonEscapeLevel',
      PotionBrewingLab: 'PotionBrewingLabLevel',
      MagicRuneTyping: 'MagicRuneTypingLevel',
      MonsterManual: 'MonsterManualLevel',
      GuildRecruitment: 'GuildRecruitmentLevel',
      CharacterCreator: 'CharacterCreatorLevel',
      WoodlandFestival: 'WoodlandFestivalLevel',
      SillyChallenge: 'SillyChallengeLevel',
      BossBattle: 'BossBattleScene',
    }
    const sceneName = typeToScene[data.level.type] ?? 'GoblinWhackerLevel'
    this.scene.start(sceneName, data)
  }

  create() {}
}
