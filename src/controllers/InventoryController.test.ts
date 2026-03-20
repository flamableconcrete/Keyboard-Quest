// src/controllers/InventoryController.test.ts
import { describe, it, expect } from 'vitest'
import { InventoryController } from './InventoryController'
import { ProfileData } from '../types'

// Real item IDs from src/data/items.ts:
//   weapons:    rusty_quill, ink_blotter, obsidian_nib
//   armor:      leather_tunic, iron_gauntlet, padded_envelope
//   accessory:  focus_ring, scholars_monocle

const mockProfile = {
  equipment: { weapon: null, armor: null, accessory: null, trophy: null },
  ownedItemIds: ['rusty_quill', 'leather_tunic', 'focus_ring'],
} as unknown as ProfileData

describe('InventoryController — equip/unequip', () => {
  it('equip sets the equipment slot', () => {
    const ctrl = new InventoryController(mockProfile)
    ctrl.equip('weapon', 'rusty_quill')
    expect(ctrl.equipment.weapon).toBe('rusty_quill')
  })

  it('unequip clears the equipment slot', () => {
    const ctrl = new InventoryController({
      ...mockProfile,
      equipment: { weapon: 'rusty_quill', armor: null, accessory: null, trophy: null }
    } as unknown as ProfileData)
    ctrl.unequip('weapon')
    expect(ctrl.equipment.weapon).toBeNull()
  })

  it('equip replaces an existing item in the same slot', () => {
    const ctrl = new InventoryController({
      ...mockProfile,
      equipment: { weapon: 'rusty_quill', armor: null, accessory: null, trophy: null }
    } as unknown as ProfileData)
    ctrl.equip('weapon', 'ink_blotter')
    expect(ctrl.equipment.weapon).toBe('ink_blotter')
  })
})

describe('InventoryController — filtering', () => {
  it('getItemsBySlot returns only weapon items', () => {
    const ctrl = new InventoryController(mockProfile)
    const weapons = ctrl.getItemsBySlot('weapon')
    expect(weapons).toContain('rusty_quill')
    expect(weapons).not.toContain('leather_tunic')
    expect(weapons).not.toContain('focus_ring')
  })

  it('getItemsBySlot returns only armor items', () => {
    const ctrl = new InventoryController(mockProfile)
    const armor = ctrl.getItemsBySlot('armor')
    expect(armor).toContain('leather_tunic')
    expect(armor).not.toContain('rusty_quill')
  })
})
