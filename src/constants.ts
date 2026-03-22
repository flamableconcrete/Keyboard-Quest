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

/** Font size for typing engine in standard levels */
export const LEVEL_ENGINE_FONT_SIZE = 40

/** Font size for typing engine in boss scenes */
export const BOSS_ENGINE_FONT_SIZE = 48

/** Render depth for TypingHands objects — must be above scene backgrounds (depth 0) */
export const TYPING_HANDS_DEPTH = 5
/** Render depth for TypingEngine character texts — must be above TypingHands so word text stays visible */
export const TYPING_ENGINE_CHAR_DEPTH = 6

/** Height of the top HUD panel bar in pixels */
export const HUD_TOP_BAR_H = 56
/** Height of the bottom HUD panel bar in pixels */
export const HUD_BOTTOM_BAR_H = 130
/** Phaser render depth for HUD background panels */
export const HUD_BG_DEPTH = 50
/** Phaser render depth for HUD text and image objects */
export const HUD_TEXT_DEPTH = 51
/** Background fill color for HUD panels (dark near-black with purple tint) */
export const HUD_BG_COLOR = 0x0a0814
/** Background fill alpha for HUD panels */
export const HUD_BG_ALPHA = 0.88
/** Border line color for HUD panels (warm gold) */
export const HUD_BORDER_COLOR = 0x8a6a2a

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

/** Base skeleton movement speed (px/s) at world 1 */
export const SKELETON_SPEED_BASE = 60
/** Speed increase per world number */
export const SKELETON_SPEED_PER_WORLD = 10

/** Default player HP at the start of a level */
export const DEFAULT_PLAYER_HP = 3

/** Pixels past the canvas right edge for spawning enemies off-screen (add to canvas width) */
export const SPAWN_OFFSCREEN_MARGIN = 30

/** Default enemy stop X for wave-based levels (right edge of the player zone) */
export const BATTLE_STOP_X = 350

/** Skeleton barrier X position (right edge of safe zone) */
export const SKELETON_BARRIER_X = 265
