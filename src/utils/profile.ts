import { ProfileData } from '../types'

const HOME_ROW: string[] = ['a', 's', 'd', 'f', 'j', 'k', 'l']
const KEY = (slot: number) => `kq_profile_${slot}`

export function createProfile(playerName: string, avatarChoice = 'knight'): ProfileData {
  return {
    playerName,
    avatarChoice,
    characterLevel: 1,
    xp: 0,
    statPoints: 0,
    hpPoints: 0,
    powerPoints: 0,
    focusPoints: 0,
    currentWorld: 1,
    currentLevelId: 'w1_l1',
    unlockedLetters: [...HOME_ROW],
    unlockedLevelIds: ['w1_l1'],
    levelResults: {},
    equipment: { weapon: null, armor: null, accessory: null },
    spells: [],
    companions: [],
    pets: [],
    activeCompanionId: null,
    activePetId: null,
    titles: [],
    ownedItemIds: [],
    worldMasteryRewards: [],
    bossWeaknessKnown: null,
    gameMode: 'regular' as const,
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