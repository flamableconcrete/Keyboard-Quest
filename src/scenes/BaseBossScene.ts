// src/scenes/BaseBossScene.ts
import { BaseLevelScene, PreCreateOptions } from './BaseLevelScene'
import {
  BOSS_AVATAR_SCALE,
  BOSS_ENGINE_Y_OFFSET,
  BOSS_ENGINE_FONT_SIZE,
  BOSS_END_DELAY_MS,
  BOSS_AVATAR_X_FRAC,
  BOSS_AVATAR_Y_OFFSET,
} from '../constants'

/**
 * Abstract base for all boss battle scenes.
 * Extends BaseLevelScene with boss-appropriate defaults:
 * - Avatar centered-left at 25% of canvas width
 * - Larger avatar scale (2.5x)
 * - Typing engine higher up with larger font
 * - Longer end-level delay (1000ms vs 500ms)
 *
 * Boss scenes inherit init(), endLevel(), update(), and preCreate().
 * Call preCreate() with no arguments to use boss defaults, or pass
 * explicit coordinates to override.
 */
export abstract class BaseBossScene extends BaseLevelScene {
  protected override readonly endDelayMs: number = BOSS_END_DELAY_MS

  /**
   * Boss-flavored preCreate with sensible defaults.
   * If called with no arguments, places avatar at (width*0.25, height/2-50)
   * with scale 2.5 and engine at (height-160) with font size 48.
   */
  protected override preCreate(
    avatarX?: number,
    avatarY?: number,
    options: PreCreateOptions = {}
  ) {
    const { width, height } = this.scale
    super.preCreate(
      avatarX ?? width * BOSS_AVATAR_X_FRAC,
      avatarY ?? (height / 2 - BOSS_AVATAR_Y_OFFSET),
      {
        avatarScale: BOSS_AVATAR_SCALE,
        engineY: height - BOSS_ENGINE_Y_OFFSET,
        engineFontSize: BOSS_ENGINE_FONT_SIZE,
        ...options,
      }
    )
  }
}
