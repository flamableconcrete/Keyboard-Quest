// src/constants.ts
// Centralized magic numbers for all level and boss scenes.

/** Avatar X position in standard level scenes */
export const LEVEL_AVATAR_X = 80
/** Avatar Y offset from pathY in standard level scenes */
export const LEVEL_AVATAR_SCALE = 1.5

/** Avatar X for boss scenes (fraction of canvas width) */
export const BOSS_AVATAR_X_FRAC = 0.25
/** Avatar Y offset from canvas center for boss scenes */
export const BOSS_AVATAR_Y_OFFSET = 50
/** Avatar scale for boss scenes */
export const BOSS_AVATAR_SCALE = 2.5

/** Y position of typing engine from canvas bottom, standard levels */
export const LEVEL_ENGINE_Y_OFFSET = 80
/** Font size for typing engine in standard levels */
export const LEVEL_ENGINE_FONT_SIZE = 40

/** Y position of typing engine from canvas bottom, boss scenes */
export const BOSS_ENGINE_Y_OFFSET = 160
/** Font size for typing engine in boss scenes */
export const BOSS_ENGINE_FONT_SIZE = 48

/** Y position of typing hands hints from canvas bottom */
export const TYPING_HANDS_Y_OFFSET = 100

/** Delay (ms) before transitioning to LevelResult in standard levels */
export const LEVEL_END_DELAY_MS = 500
/** Delay (ms) before transitioning to LevelResult in boss scenes */
export const BOSS_END_DELAY_MS = 1000

/** Gold earned per enemy/word defeated */
export const GOLD_PER_KILL = 5
/** Gold manager pet speed coefficient: base + level * this */
export const PET_SPEED_COEFF = 25
/** Gold manager pet speed base */
export const PET_SPEED_BASE = 100
