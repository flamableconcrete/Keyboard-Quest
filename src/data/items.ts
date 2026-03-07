import { ItemData } from '../types'

export const ITEMS: ItemData[] = [
  {
    id: 'rusty_quill',
    name: 'Rusty Quill',
    slot: 'weapon',
    description: 'A worn writing quill. Still works.',
    effect: { power: 1 },
  },
  {
    id: 'ink_blotter',
    name: 'Ink Blotter',
    slot: 'armor',
    description: 'Absorbs minor stains and spells.',
    effect: { hp: 1 },
  },
  {
    id: 'iron_gauntlet',
    name: 'Iron Gauntlet',
    slot: 'armor',
    description: 'Heavy but protective.',
    effect: { hp: 2 },
  },
  {
    id: 'focus_ring',
    name: 'Focus Ring',
    slot: 'accessory',
    description: 'Sharpens the mind.',
    effect: { focusBonus: 5 },
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    slot: 'accessory',
    description: 'Increases capture chance.',
    effect: { captureChanceBonus: 0.1 },
  },
  {
    id: 'obsidian_nib',
    name: 'Obsidian Nib',
    slot: 'weapon',
    description: 'A sharp nib made of volcanic glass.',
    effect: { power: 3 },
  },
  {
    id: 'padded_envelope',
    name: 'Padded Envelope',
    slot: 'armor',
    description: 'Soft and surprisingly durable.',
    effect: { hp: 3 },
  },
  {
    id: 'scholars_monocle',
    name: 'Scholars Monocle',
    slot: 'accessory',
    description: 'Better clarity for faster typing.',
    effect: { focusBonus: 10 },
  },
]

export function getItem(id: string): ItemData | undefined {
  return ITEMS.find((i) => i.id === id)
}
