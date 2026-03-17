// src/scenes/level-types/CrazedCookLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'

export class CrazedCookLevel extends Phaser.Scene {
  constructor() { super('CrazedCookLevel') }
  init(_data: { level: LevelConfig; profileSlot: number }) {}
  create() {}
}
