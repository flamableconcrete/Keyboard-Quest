import { CompanionData } from '../types'

export interface CompanionTemplate extends Omit<CompanionData, 'level' | 'xp' | 'autoStrikeCount'> {
  goldCost: number
}

export const COMPANION_TEMPLATES: CompanionTemplate[] = [
  { id: 'mouse_guard_scout', name: 'Pip the Mouse Guard Scout', backstory: 'A brave mouse who patrols the forest paths.', type: 'companion', goldCost: 50 },
  { id: 'badger_warrior', name: 'Brom the Badger Warrior', backstory: 'Fierce protector of the woodland creatures.', type: 'companion', goldCost: 100 },
  { id: 'wizard_apprentice', name: 'Elara the Apprentice', backstory: 'Studying magic at the Wizard Peaks.', type: 'companion', goldCost: 150 },
  { id: 'archer', name: 'Swift the Forest Archer', backstory: 'Never misses a shot.', type: 'companion', goldCost: 200 },
]

export const PET_TEMPLATES: CompanionTemplate[] = [
  { id: 'goblin', name: 'Gibs the Tame Goblin', backstory: 'Defeated but reformed.', type: 'pet', goldCost: 50 },
  { id: 'slime', name: 'Blorp the Slime', backstory: 'Surprisingly loyal.', type: 'pet', goldCost: 100 },
  { id: 'skeleton', name: 'Clatter the Skeleton', backstory: 'A very helpful pile of bones.', type: 'pet', goldCost: 150 },
  { id: 'baby_dragon', name: 'Ember the Baby Dragon', backstory: 'Breathes tiny flames.', type: 'pet', goldCost: 200 },
]

export function createCompanion(templateId: string): CompanionData {
  const template = [...COMPANION_TEMPLATES, ...PET_TEMPLATES].find(t => t.id === templateId)!
  return { ...template, level: 1, xp: 0, autoStrikeCount: 1 }
}
