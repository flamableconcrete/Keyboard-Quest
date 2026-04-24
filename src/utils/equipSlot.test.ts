import { describe, it, expect, vi } from 'vitest'

// Phaser requires a browser environment; mock it so the module can load in node.
vi.mock('phaser', () => ({ default: {} }))

import { EQUIP_SLOT_SIZES, EQUIP_CELL } from './equipSlot'
import { ITEMS } from '../data/items'

describe('EQUIP_SLOT_SIZES', () => {
  it('weapon slot fits Excalibur (2×4 — the largest weapon)', () => {
    expect(EQUIP_SLOT_SIZES.weapon.w).toBe(2 * EQUIP_CELL)
    expect(EQUIP_SLOT_SIZES.weapon.h).toBe(4 * EQUIP_CELL)
  })

  it('armor slot fits Aegis Armor (2×4 — the largest armor)', () => {
    expect(EQUIP_SLOT_SIZES.armor.w).toBe(2 * EQUIP_CELL)
    expect(EQUIP_SLOT_SIZES.armor.h).toBe(4 * EQUIP_CELL)
  })

  it('accessory slot fits every accessory item in the game', () => {
    const items = ITEMS.filter(i => i.slot === 'accessory')
    for (const item of items) {
      expect(item.gridSize.w * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.accessory.w)
      expect(item.gridSize.h * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.accessory.h)
    }
  })

  it('trophy slot fits every trophy item in the game', () => {
    const items = ITEMS.filter(i => i.slot === 'trophy')
    for (const item of items) {
      expect(item.gridSize.w * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.trophy.w)
      expect(item.gridSize.h * EQUIP_CELL).toBeLessThanOrEqual(EQUIP_SLOT_SIZES.trophy.h)
    }
  })
})
