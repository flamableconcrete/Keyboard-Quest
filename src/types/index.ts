import type { AvatarConfig } from '../data/avatars'

export type StarRating = 1 | 2 | 3 | 4 | 5

export interface LevelResult {
  accuracyStars: StarRating
  speedStars: StarRating
  completedAt: number
}

export interface CompanionData {
  id: string
  name: string
  backstory: string
  type: 'companion' | 'pet'
  level: number
  xp: number
  autoStrikeCount?: number // 1-3
}

export interface EquipmentData {
  weapon: string | null
  armor: string | null
  accessory: string | null
  trophy: string | null
}

export interface ProfileData {
  playerName: string
  avatarChoice: string
  characterLevel: number
  xp: number
  statPoints: number
  hpPoints: number
  powerPoints: number
  focusPoints: number
  currentWorld: number
  currentLevelId: string
  currentLevelNodeId?: string
  unlockedLetters: string[]
  unlockedLevelIds: string[]
  levelResults: Record<string, LevelResult>
  equipment: EquipmentData
  spells: string[]
  companions: CompanionData[]
  pets: CompanionData[]
  activeCompanionId: string | null
  activePetId: string | null
  titles: string[]
  ownedItemIds: string[]
  worldMasteryRewards: string[]
  bossWeaknessKnown: string | null
  gameMode: 'regular' | 'advanced'
  currentShopItemIds?: string[]
  gold: number
  showFingerHints: boolean
  avatarConfig?: AvatarConfig
  savedOutfits?: AvatarConfig[]
  debugUnlockedLevelIds?: string[]
  shopCapacityUpgraded?: boolean
}

export type LevelType =
  | 'GoblinWhacker'
  | 'SkeletonSwarm'
  | 'MonsterArena'
  | 'UndeadSiege'
  | 'SlimeSplitting'
  | 'DungeonTrapDisarm'
  | 'DungeonPlatformer'
  | 'DungeonEscape'
  | 'PotionBrewingLab'
  | 'MagicRuneTyping'
  | 'MonsterManual'
  | 'GuildRecruitment'
  | 'WoodlandFestival'
  | 'CrazedCook'
  | 'BossBattle'

export interface LevelConfig {
  id: string
  name: string
  type: LevelType
  world: number
  unlockedLetters: string[]
  wordCount: number
  timeLimit: number | null  // null = no time limit
  storyBeat?: string
  dialogue?: { speaker: 'hero' | 'enemy', text: string }[]
  rewards: {
    xp: number
    item?: string
    spell?: string
    companionId?: string
    title?: string
  }
  bossGate: { minCombinedStars: number; levelIds: string[] } | null
  miniBossUnlocksLetter?: string  // if this is a mini-boss level
  isBoss?: boolean
  isMiniBoss?: boolean
  bossId?: string
  phases?: number
  orderQuota?: number       // for CrazedCook: orders needed to win
  maxWalkoffs?: number      // for CrazedCook: max angry walk-offs before losing
}

export interface ItemData {
  id: string
  name: string
  slot: 'weapon' | 'armor' | 'accessory' | 'trophy'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'
  description: string
  goldCost: number
  effect: {
    hp?: number
    power?: number
    focusBonus?: number
    goldMultiplier?: number
    defeatAdditionalEnemiesChance?: number
    absorbAttacksChance?: number
    bonusGoldChance?: number
  }
}

export interface SpellData {
  id: string
  name: string
  description: string
  effect: 'time_freeze' | 'word_blast' | 'second_chance' | 'letter_shield'
}