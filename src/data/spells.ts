import { SpellData } from '../types'

export const SPELLS: SpellData[] = [
  { id: 'time_freeze', name: 'Glacius', description: 'Freezes all enemies for 5 seconds.', effect: 'time_freeze' },
  { id: 'word_blast', name: 'Obliterus', description: 'Destroys the nearest enemy instantly.', effect: 'word_blast' },
  { id: 'second_chance', name: 'Revivus', description: 'Restores 2 HP.', effect: 'second_chance' },
  { id: 'letter_shield', name: 'Errantus', description: "Next 3 wrong keys don't count.", effect: 'letter_shield' },
]
