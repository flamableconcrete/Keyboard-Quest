// src/scenes/BossBattleScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

export class BossBattleScene extends Phaser.Scene {
  constructor() { super('BossBattleScene') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    const bossToScene: Record<string, string> = {
      grizzlefang: 'GrizzlefangBoss',
      knuckle_keeper_of_e: 'MiniBossTypical',
      nessa_keeper_of_n: 'MiniBossTypical',
      rend_the_red: 'MiniBossTypical',
      hydra: 'HydraBoss',
      slime_king: 'SlimeKingBoss',
      clockwork_dragon: 'ClockworkDragonBoss',
      baron_typo: 'BaronTypoBoss',
      spider: 'SpiderBoss',
      tramun_clogg: 'FlashWordBoss',
      badrang: 'FlashWordBoss',
      bone_knight: 'BoneKnightBoss',
      dice_lich: 'DiceLichBoss',
      ancient_dragon: 'AncientDragonBoss',
      typemancer: 'TypemancerBoss',
    }
    const sceneName = bossToScene[data.level.bossId ?? ''] ?? 'MiniBossTypical'
    this.scene.start(sceneName, data)
  }

  create() {}
}
