import { CompanionData } from '../types'

export const COMPANION_TEMPLATES: Omit<CompanionData, 'level' | 'xp' | 'autoStrikeCount'>[] = [
  { id: 'mouse_guard_scout', name: 'Pip the Mouse Guard Scout', backstory: 'A brave mouse who patrols the forest paths.', type: 'companion' },
  { id: 'badger_warrior', name: 'Brom the Badger Warrior', backstory: 'Fierce protector of the woodland creatures.', type: 'companion' },
  { id: 'wizard_apprentice', name: 'Elara the Apprentice', backstory: 'Studying magic at the Wizard Peaks.', type: 'companion' },
  { id: 'archer', name: 'Swift the Forest Archer', backstory: 'Never misses a shot.', type: 'companion' },
]

export const PET_TEMPLATES: Omit<CompanionData, 'level' | 'xp' | 'autoStrikeCount'>[] = [
  { id: 'goblin', name: 'Gibs the Tame Goblin', backstory: 'Defeated but reformed.', type: 'pet' },
  { id: 'slime', name: 'Blorp the Slime', backstory: 'Surprisingly loyal.', type: 'pet' },
  { id: 'skeleton', name: 'Clatter the Skeleton', backstory: 'A very helpful pile of bones.', type: 'pet' },
  { id: 'baby_dragon', name: 'Ember the Baby Dragon', backstory: 'Breathes tiny flames.', type: 'pet' },
]

export function createCompanion(templateId: string): CompanionData {
  const template = [...COMPANION_TEMPLATES, ...PET_TEMPLATES].find(t => t.id === templateId)!
  return { ...template, level: 1, xp: 0, autoStrikeCount: 1 }
}
