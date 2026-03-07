// src/data/levels/index.ts
import { LevelConfig } from '../../types'
import { WORLD1_LEVELS } from './world1'
import { WORLD2_LEVELS } from './world2'
import { WORLD3_LEVELS } from './world3'
import { WORLD4_LEVELS } from './world4'
import { WORLD5_LEVELS } from './world5'

export const ALL_LEVELS: LevelConfig[] = [
  ...WORLD1_LEVELS,
  ...WORLD2_LEVELS,
  ...WORLD3_LEVELS,
  ...WORLD4_LEVELS,
  ...WORLD5_LEVELS,
]

export function getLevelById(id: string): LevelConfig | undefined {
  return ALL_LEVELS.find(l => l.id === id)
}

export function getLevelsForWorld(world: number): LevelConfig[] {
  return ALL_LEVELS.filter(l => l.world === world)
}
