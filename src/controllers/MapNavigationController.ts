// src/controllers/MapNavigationController.ts
// Pure TypeScript — NO Phaser imports.
import { ProfileData } from '../types'
import { getLevelsForWorld } from '../data/levels'

export interface PanPosition {
  x: number
  y: number
}

export class MapNavigationController {
  constructor(private profile: ProfileData) {}

  isUnlocked(levelId: string): boolean {
    return (this.profile.unlockedLevelIds ?? []).includes(levelId)
  }

  /**
   * Returns all level IDs that should be unlocked after completing `justCompletedId`.
   * Matches the logic currently in OverlandMapScene / profile.ts.
   */
  getNewUnlocks(justCompletedId: string, world: number): string[] {
    const levels = getLevelsForWorld(world)
    const idx = levels.findIndex(l => l.id === justCompletedId)
    if (idx < 0) return []
    const nextLevel = levels[idx + 1]
    if (!nextLevel) return []
    if (this.isUnlocked(nextLevel.id)) return []
    return [nextLevel.id]
  }

  /**
   * Returns true if the player has completed all levels in the previous world
   * (i.e. every level has a `completedAt` timestamp in levelResults).
   */
  canAdvanceToWorld(worldNumber: number): boolean {
    if (worldNumber <= 1) return true
    const prevWorld = worldNumber - 1
    const levels = getLevelsForWorld(prevWorld)
    return levels.every(l => {
      const result = this.profile.levelResults?.[l.id]
      return result && result.completedAt != null
    })
  }

  /**
   * Clamps a pan position so the map stays within its scrollable area.
   */
  clampPan(x: number, y: number, viewportW: number, mapW: number): PanPosition {
    const minX = -(mapW - viewportW)
    return {
      x: Math.max(minX, Math.min(0, x)),
      y,
    }
  }
}
