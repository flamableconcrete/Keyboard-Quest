// src/utils/levelNodeTextures.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

/**
 * Returns the texture key for a level node, or null if the level uses
 * the existing map-common spritesheet (boss / mini-boss nodes).
 */
export function levelNodeTextureKey(level: LevelConfig): string | null {
  if (level.isBoss || level.isMiniBoss) return null
  return `node_${level.type}`
}

/**
 * Generates all 14 level-type node textures (32×32 each) using Phaser Graphics.
 * Call once from PreloadScene.preload(), after generateCommonMapSheet().
 */
export function generateLevelNodeTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics()

  // Helper: draw the shared circular background
  const bg = (color: number) => {
    g.clear()
    g.fillStyle(color)
    g.fillCircle(16, 16, 15)
  }

  // ── GoblinWhacker ───────────────────────────────────────────
  bg(0x4a8c3f)
  g.fillStyle(0x6abf45)
  g.fillCircle(16, 13, 6)
  g.fillRect(12, 19, 8, 6)
  g.fillStyle(0x6abf45)
  g.fillTriangle(9, 13, 10, 9, 12, 14)
  g.fillTriangle(20, 14, 22, 9, 23, 13)
  g.fillStyle(0x000000)
  g.fillRect(13, 11, 2, 2)
  g.fillRect(18, 11, 2, 2)
  g.fillRect(14, 15, 5, 1)
  g.generateTexture('node_GoblinWhacker', 32, 32)

  // ── SkeletonSwarm ───────────────────────────────────────────
  bg(0x5a5a6a)
  g.fillStyle(0xdddddd)
  g.fillCircle(16, 8, 5)
  g.fillRect(13, 13, 6, 7)
  g.fillStyle(0x5a5a6a)
  g.fillRect(14, 14, 4, 1)
  g.fillRect(14, 16, 4, 1)
  g.fillRect(14, 18, 4, 1)
  g.fillRect(14, 7, 2, 2)
  g.fillRect(18, 7, 2, 2)
  g.fillStyle(0xdddddd)
  g.fillRect(13, 20, 6, 3)
  g.fillRect(13, 23, 2, 6)
  g.fillRect(17, 23, 2, 6)
  g.generateTexture('node_SkeletonSwarm', 32, 32)

  // ── MonsterArena ────────────────────────────────────────────
  bg(0x8c3a3a)
  g.fillStyle(0xcc8844)
  g.fillRect(10, 18, 12, 10)
  g.fillRect(8, 18, 4, 8)
  g.fillRect(20, 18, 4, 8)
  g.fillRect(11, 10, 10, 8)
  g.fillStyle(0x886622)
  g.fillTriangle(10, 10, 7, 4, 13, 10)
  g.fillTriangle(22, 10, 19, 10, 25, 4)
  g.fillStyle(0xff0000)
  g.fillRect(13, 12, 2, 2)
  g.fillRect(18, 12, 2, 2)
  g.fillStyle(0xffd700)
  g.fillRect(15, 16, 3, 2)
  g.generateTexture('node_MonsterArena', 32, 32)

  // ── UndeadSiege ─────────────────────────────────────────────
  bg(0x4a2a6a)
  g.fillStyle(0x888888)
  g.fillRect(7, 14, 18, 13)
  g.fillRect(7, 10, 4, 4)
  g.fillRect(13, 10, 4, 4)
  g.fillRect(19, 10, 4, 4)
  g.fillStyle(0x000000)
  g.fillRect(13, 19, 6, 8)
  g.fillStyle(0x446644)
  g.fillCircle(10, 28, 2)
  g.fillRect(9, 29, 2, 2)
  g.fillCircle(22, 28, 2)
  g.fillRect(21, 29, 2, 2)
  g.generateTexture('node_UndeadSiege', 32, 32)

  // ── SlimeSplitting ──────────────────────────────────────────
  bg(0x2a7a6a)
  g.fillStyle(0x44ffaa)
  g.fillCircle(16, 19, 9)
  g.fillCircle(11, 14, 4)
  g.fillCircle(21, 14, 4)
  g.fillStyle(0xaaffdd)
  g.fillCircle(14, 17, 2)
  g.fillStyle(0x000000)
  g.fillCircle(13, 19, 2)
  g.fillCircle(19, 19, 2)
  g.fillStyle(0xffffff)
  g.fillRect(14, 18, 1, 1)
  g.fillRect(20, 18, 1, 1)
  g.generateTexture('node_SlimeSplitting', 32, 32)

  // ── DungeonTrapDisarm ───────────────────────────────────────
  bg(0x8c5a1a)
  g.fillStyle(0x885522)
  g.fillRect(4, 22, 24, 6)
  g.fillStyle(0xcccccc)
  g.fillTriangle(7, 22, 10, 10, 13, 22)
  g.fillTriangle(12, 22, 15, 10, 18, 22)
  g.fillTriangle(17, 22, 20, 10, 23, 22)
  g.fillStyle(0xffffff)
  g.fillRect(10, 10, 1, 2)
  g.fillRect(15, 10, 1, 2)
  g.fillRect(20, 10, 1, 2)
  g.generateTexture('node_DungeonTrapDisarm', 32, 32)

  // ── DungeonPlatformer ───────────────────────────────────────
  bg(0x5a4a2a)
  g.fillStyle(0x888888)
  g.fillCircle(16, 18, 10)
  g.fillStyle(0x555555)
  g.fillTriangle(20, 14, 26, 20, 24, 26)
  g.fillStyle(0xbbbbbb)
  g.fillCircle(12, 14, 3)
  g.lineStyle(1, 0x333333)
  g.lineBetween(14, 12, 16, 18)
  g.lineBetween(16, 18, 20, 22)
  g.generateTexture('node_DungeonPlatformer', 32, 32)

  // ── DungeonEscape ───────────────────────────────────────────
  bg(0x6a2a2a)
  g.fillStyle(0x888888)
  g.fillRect(6, 10, 5, 18)
  g.fillRect(21, 10, 5, 18)
  g.fillRect(6, 8, 20, 4)
  g.fillStyle(0x000000)
  g.fillRect(11, 12, 10, 16)
  g.fillStyle(0xffaa00)
  g.fillRect(11, 18, 7, 3)
  g.fillTriangle(18, 15, 24, 19, 18, 23)
  g.generateTexture('node_DungeonEscape', 32, 32)

  // ── PotionBrewingLab ────────────────────────────────────────
  bg(0x5a2a8c)
  g.fillStyle(0x2244aa)
  g.fillCircle(16, 22, 7)
  g.fillStyle(0x44aaff)
  g.fillCircle(16, 24, 5)
  g.fillStyle(0x2244aa)
  g.fillRect(13, 13, 6, 8)
  g.fillStyle(0xaa7744)
  g.fillRect(13, 10, 6, 4)
  g.fillStyle(0x88ccff)
  g.fillCircle(13, 20, 2)
  g.fillStyle(0xaaddff)
  g.fillCircle(18, 21, 1)
  g.fillCircle(16, 19, 1)
  g.generateTexture('node_PotionBrewingLab', 32, 32)

  // ── MagicRuneTyping ─────────────────────────────────────────
  bg(0x2a4a8c)
  g.fillStyle(0xffd700)
  g.fillRect(7, 8, 2, 16)
  g.fillRect(7, 10, 6, 2)
  g.fillRect(7, 16, 6, 2)
  g.fillRect(14, 8, 2, 16)
  g.fillRect(14, 8, 6, 2)
  g.fillRect(18, 8, 2, 8)
  g.fillRect(14, 16, 6, 2)
  g.fillRect(22, 8, 6, 2)
  g.fillRect(24, 8, 2, 16)
  g.fillRect(22, 22, 6, 2)
  g.generateTexture('node_MagicRuneTyping', 32, 32)

  // ── MonsterManual ───────────────────────────────────────────
  bg(0x2a3a6a)
  g.fillStyle(0x6b4c2a)
  g.fillRect(5, 8, 22, 18)
  g.fillStyle(0xf0e8d8)
  g.fillRect(6, 9, 9, 16)
  g.fillRect(17, 9, 9, 16)
  g.fillStyle(0x4a3a1a)
  g.fillRect(15, 8, 2, 18)
  g.fillStyle(0xaaa090)
  g.fillRect(7, 12, 7, 1)
  g.fillRect(7, 14, 7, 1)
  g.fillRect(7, 16, 7, 1)
  g.fillRect(7, 18, 7, 1)
  g.fillRect(7, 20, 5, 1)
  g.fillRect(18, 12, 7, 1)
  g.fillRect(18, 14, 7, 1)
  g.fillRect(18, 16, 7, 1)
  g.fillRect(18, 18, 7, 1)
  g.fillRect(18, 20, 5, 1)
  g.generateTexture('node_MonsterManual', 32, 32)

  // ── GuildRecruitment ────────────────────────────────────────
  bg(0x8c6a1a)
  g.fillStyle(0xffccaa)
  g.fillCircle(16, 12, 5)
  g.fillStyle(0x4466aa)
  g.fillRect(12, 17, 8, 10)
  g.fillStyle(0xffccaa)
  g.fillRect(20, 17, 6, 3)
  g.fillRect(25, 14, 3, 3)
  g.fillRect(6, 17, 6, 3)
  g.fillStyle(0xaa6644)
  g.fillRect(14, 14, 4, 1)
  g.fillStyle(0x000000)
  g.fillRect(14, 11, 2, 2)
  g.fillRect(18, 11, 2, 2)
  g.generateTexture('node_GuildRecruitment', 32, 32)

  // ── WoodlandFestival ────────────────────────────────────────
  bg(0x2a6a2a)
  g.lineStyle(2, 0xcc8844)
  g.strokeCircle(16, 16, 11)
  g.lineBetween(16, 5, 16, 27)
  g.lineBetween(5, 16, 27, 16)
  g.lineBetween(8, 8, 24, 24)
  g.lineBetween(24, 8, 8, 24)
  g.fillStyle(0xcc8844)
  g.fillCircle(16, 16, 2)
  g.fillStyle(0xddbbaa)
  g.fillCircle(16, 5, 2)
  g.fillCircle(27, 16, 2)
  g.fillCircle(16, 27, 2)
  g.fillCircle(5, 16, 2)
  g.fillCircle(14, 3, 1)
  g.fillCircle(18, 3, 1)
  g.generateTexture('node_WoodlandFestival', 32, 32)

  // ── CrazedCook ──────────────────────────────────────────────
  bg(0x8c4a1a)
  g.fillStyle(0xffffff)
  g.fillCircle(16, 8, 6)
  g.fillRect(10, 12, 12, 3)
  g.fillStyle(0xeeeeee)
  g.fillRect(11, 15, 10, 12)
  g.fillStyle(0xffccaa)
  g.fillRect(12, 11, 8, 6)
  g.fillStyle(0x000000)
  g.fillRect(13, 12, 2, 3)
  g.fillRect(18, 12, 2, 3)
  g.fillStyle(0xffffff)
  g.fillRect(13, 12, 1, 1)
  g.fillRect(18, 12, 1, 1)
  g.fillStyle(0xcccccc)
  g.fillRect(22, 14, 2, 10)
  g.fillStyle(0x884422)
  g.fillRect(22, 23, 2, 4)
  g.fillStyle(0xcccccc)
  g.fillRect(20, 23, 6, 2)
  g.generateTexture('node_CrazedCook', 32, 32)

  g.destroy()
}
