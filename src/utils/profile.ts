import { ProfileData } from '../types'
import { createCompanion } from '../data/companions'
import { getInitialShopItems, rotateShopItems } from './shop'

const HOME_ROW: string[] = ['a', 's', 'd', 'f', 'j', 'k', 'l']
const KEY = (slot: number) => `kq_profile_${slot}`

import { AvatarConfig } from '../data/avatars'

export function createProfile(playerName: string, avatarChoice = 'knight', avatarConfig?: AvatarConfig): ProfileData {
  return {
    playerName,
    avatarChoice,
    avatarConfig,
    characterLevel: 1,
    xp: 0,
    statPoints: 0,
    hpPoints: 0,
    powerPoints: 0,
    focusPoints: 0,
    currentWorld: 1,
    currentLevelId: 'w1_l1',
    currentLevelNodeId: undefined,
    unlockedLetters: [...HOME_ROW],
    unlockedLevelIds: ['w1_l1'],
    levelResults: {},
    equipment: { weapon: null, armor: null, accessory: null },
    spells: [],
    companions: [],
    pets: [createCompanion('dog')],
    activeCompanionId: null,
    activePetId: 'dog',
    titles: [],
    ownedItemIds: [],
    worldMasteryRewards: [],
    bossWeaknessKnown: null,
    gameMode: 'regular' as const,
    currentShopItemIds: getInitialShopItems([]),
    gold: 0,
    showFingerHints: true,
    shopCapacityUpgraded: true,
  }
}

export function saveProfile(slot: number, profile: ProfileData): void {
  localStorage.setItem(KEY(slot), JSON.stringify(profile))
}

export function loadProfile(slot: number): ProfileData | null {
  const raw = localStorage.getItem(KEY(slot))
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as ProfileData
    if (!data.gameMode) data.gameMode = 'regular'
    if (data.gold === undefined) data.gold = 0
    if (data.showFingerHints === undefined) data.showFingerHints = true
    if (!data.currentShopItemIds) {
      data.currentShopItemIds = getInitialShopItems(data.ownedItemIds || [])
      data.shopCapacityUpgraded = true
    } else if (!data.shopCapacityUpgraded) {
      data.currentShopItemIds = rotateShopItems(data.currentShopItemIds, data.ownedItemIds || [], 0)
      data.shopCapacityUpgraded = true
    }
    return data
  } catch {
    return null
  }
}

export function deleteProfile(slot: number): void {
  localStorage.removeItem(KEY(slot))
}

export function exportProfile(profile: ProfileData): string {
  return JSON.stringify(profile, null, 2)
}

export function importProfile(json: string): ProfileData | null {
  try {
    const data = JSON.parse(json)
    if (typeof data.playerName !== 'string') return null
    return data as ProfileData
  } catch {
    return null
  }
}

export function getAllProfiles(): (ProfileData | null)[] {
  return [0, 1, 2, 3].map(slot => loadProfile(slot))
}