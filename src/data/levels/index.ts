// src/data/levels/index.ts
import { LevelConfig } from '../../types'
import { WORLD1_LEVELS } from './world1'
// World 2-5 imported as they are built

export const ALL_LEVELS: LevelConfig[] = [
  ...WORLD1_LEVELS,
]

export function getLevelById(id: string): LevelConfig | undefined {
  return ALL_LEVELS.find(l => l.id === id)
}

export function getLevelsForWorld(world: number): LevelConfig[] {
  return ALL_LEVELS.filter(l => l.world === world)
}
