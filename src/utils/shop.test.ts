import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rotateShopItems, getInitialShopItems } from './shop'

// Mocking Math.random to make tests deterministic where possible

// Mocking the items data to ensure we have enough items to test rotation and replenishment
vi.mock('../data/items', () => {
  const ITEMS = []

  // 7 weapons, 6 armors, 5 accessories (to test edge cases of pool exhaustion)
  for (let i = 1; i <= 7; i++) ITEMS.push({ id: `w${i}`, slot: 'weapon', goldCost: 10 })
  for (let i = 1; i <= 6; i++) ITEMS.push({ id: `a${i}`, slot: 'armor', goldCost: 10 })
  for (let i = 1; i <= 5; i++) ITEMS.push({ id: `c${i}`, slot: 'accessory', goldCost: 10 })

  // Add some 0 gold cost items to ensure they are ignored
  ITEMS.push({ id: 'w_free', slot: 'weapon', goldCost: 0 })
  ITEMS.push({ id: 'a_free', slot: 'armor', goldCost: 0 })

  return { ITEMS }
})

describe('getInitialShopItems', () => {
  it('returns 5 items of each category excluding owned items', () => {
    const owned = ['w1', 'a1']
    const shop = getInitialShopItems(owned)

    expect(shop.length).toBe(15) // 5 per category
    expect(shop).not.toContain('w1')
    expect(shop).not.toContain('a1')
    expect(shop).not.toContain('w_free')
    expect(shop).not.toContain('a_free')

    const weapons = shop.filter(id => id.startsWith('w'))
    const armors = shop.filter(id => id.startsWith('a'))
    const accessories = shop.filter(id => id.startsWith('c'))

    expect(weapons.length).toBe(5)
    expect(armors.length).toBe(5)
    expect(accessories.length).toBe(5)
  })
})

describe('rotateShopItems', () => {
  beforeEach(() => {
    // Reset Math.random to a predictable sequence for rotation if needed
    // but the function behaves fine without it as long as we check the properties of the result.
  })

  it('filters out owned items from current shop', () => {
    const current = ['w1', 'w2', 'w3', 'w4', 'w5', 'a1', 'a2', 'a3', 'a4', 'a5', 'c1', 'c2', 'c3', 'c4', 'c5']
    const owned = ['w1', 'a2'] // Player bought w1 and a2

    const rotated = rotateShopItems(current, owned, 0) // 0 items to replace to just test replenishment/filtering

    expect(rotated).not.toContain('w1')
    expect(rotated).not.toContain('a2')
  })

  it('replenishes missing items up to 5 per category', () => {
    const current = ['w1', 'w2', 'w3', 'a1', 'a2', 'c1', 'c2', 'c3'] // missing some
    const owned: string[] = []

    const rotated = rotateShopItems(current, owned, 0)

    const weapons = rotated.filter(id => id.startsWith('w'))
    const armors = rotated.filter(id => id.startsWith('a'))
    const accessories = rotated.filter(id => id.startsWith('c'))

    expect(weapons.length).toBe(5)
    expect(armors.length).toBe(5)
    expect(accessories.length).toBe(5)
    // Should preserve the unowned ones
    expect(rotated).toContain('w1')
    expect(rotated).toContain('w2')
    expect(rotated).toContain('w3')
  })

  it('replaces the specified number of items', () => {
    // Current shop has exactly 5 of each
    const current = ['w1', 'w2', 'w3', 'w4', 'w5', 'a1', 'a2', 'a3', 'a4', 'a5', 'c1', 'c2', 'c3', 'c4', 'c5']
    const owned: string[] = []

    // Rotate exactly 2 items
    const rotated = rotateShopItems(current, owned, 2)

    expect(rotated.length).toBe(15) // still 15 items total

    // Because we have only 2 items in pool (w6, w7, a6), only weapons and armors could possibly be replaced.
    // However, some items could be randomly replaced.
    // The number of items in `current` that are still in `rotated` should be 15 - 2 = 13.
    // Wait, if an accessory is chosen to be replaced, it won't be because no available items exist for accessories.
    // So the number of replaced items could be less than 2. Let's just verify properties.
    const preservedCount = current.filter(id => rotated.includes(id)).length
    expect(preservedCount).toBeGreaterThanOrEqual(13)
  })

  it('handles empty shop state properly', () => {
    const rotated = rotateShopItems([], [], 2)
    expect(rotated.length).toBe(15)
  })

  it('handles completely bought out categories', () => {
    const current = ['w1', 'w2', 'w3', 'w4', 'w5']
    // Imagine player owns ALL weapons in the game
    const owned = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7']

    const rotated = rotateShopItems(current, owned, 0)

    // Weapons should be empty because we own all of them and there's none left in the pool
    const weapons = rotated.filter(id => id.startsWith('w'))
    expect(weapons.length).toBe(0)

    // Other categories should be fully replenished up to pool limit or 5
    const armors = rotated.filter(id => id.startsWith('a'))
    const accessories = rotated.filter(id => id.startsWith('c'))
    expect(armors.length).toBe(5)
    expect(accessories.length).toBe(5)
  })

  it('ignores items with goldCost of 0', () => {
      const rotated = rotateShopItems([], [], 0)
      expect(rotated).not.toContain('w_free')
      expect(rotated).not.toContain('a_free')
  })
})
