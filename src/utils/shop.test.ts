import { describe, it, expect, vi } from 'vitest'
import {
  rotateShopItems,
  getInitialShopItems,
  getInitialPreviewItems,
  refreshPreviewItems,
  getAvailableConsumables,
} from './shop'

// Mock ITEMS with worldUnlock so the new world-gated filters can operate.
// Pool sizes per slot/world are chosen so we can test both replenishment and
// pool-exhaustion edge cases (ITEMS_PER_CATEGORY = 3, PREVIEW_COUNT = 2).
vi.mock('../data/items', () => {
  const ITEMS: Array<{
    id: string
    slot: 'weapon' | 'armor' | 'accessory' | 'trophy' | 'consumable'
    goldCost: number
    worldUnlock: number
  }> = []

  // World 1: 5 weapons, 5 armors, 5 accessories (enough to fill 3-per-cat with room to rotate)
  for (let i = 1; i <= 5; i++) ITEMS.push({ id: `w1_${i}`, slot: 'weapon', goldCost: 10, worldUnlock: 1 })
  for (let i = 1; i <= 5; i++) ITEMS.push({ id: `a1_${i}`, slot: 'armor', goldCost: 10, worldUnlock: 1 })
  for (let i = 1; i <= 5; i++) ITEMS.push({ id: `c1_${i}`, slot: 'accessory', goldCost: 10, worldUnlock: 1 })

  // World 2: 4 of each
  for (let i = 1; i <= 4; i++) ITEMS.push({ id: `w2_${i}`, slot: 'weapon', goldCost: 20, worldUnlock: 2 })
  for (let i = 1; i <= 4; i++) ITEMS.push({ id: `a2_${i}`, slot: 'armor', goldCost: 20, worldUnlock: 2 })
  for (let i = 1; i <= 4; i++) ITEMS.push({ id: `c2_${i}`, slot: 'accessory', goldCost: 20, worldUnlock: 2 })

  // World 5: 3 of each (so playerWorld 4 has next-tier previews; playerWorld 5 has none)
  for (let i = 1; i <= 3; i++) ITEMS.push({ id: `w5_${i}`, slot: 'weapon', goldCost: 50, worldUnlock: 5 })
  for (let i = 1; i <= 3; i++) ITEMS.push({ id: `a5_${i}`, slot: 'armor', goldCost: 50, worldUnlock: 5 })

  // Free items (must be excluded from rotation pool)
  ITEMS.push({ id: 'w_free', slot: 'weapon', goldCost: 0, worldUnlock: 1 })
  ITEMS.push({ id: 'a_free', slot: 'armor', goldCost: 0, worldUnlock: 1 })

  // Consumables and trophies
  ITEMS.push({ id: 'potion', slot: 'consumable', goldCost: 5, worldUnlock: 1 })
  ITEMS.push({ id: 'elixir', slot: 'consumable', goldCost: 15, worldUnlock: 2 })
  ITEMS.push({ id: 'trophy_a', slot: 'trophy', goldCost: 0, worldUnlock: 1 })

  return { ITEMS }
})

describe('getInitialShopItems', () => {
  it('returns 3 items of each gear category for World 1', () => {
    const shop = getInitialShopItems([])

    expect(shop.length).toBe(9)
    expect(shop.filter(id => id.startsWith('w1_')).length).toBe(3)
    expect(shop.filter(id => id.startsWith('a1_')).length).toBe(3)
    expect(shop.filter(id => id.startsWith('c1_')).length).toBe(3)
  })

  it('only pulls from World 1 items (ignores world 2+ stock)', () => {
    const shop = getInitialShopItems([])
    for (const id of shop) {
      expect(id.startsWith('w1_') || id.startsWith('a1_') || id.startsWith('c1_')).toBe(true)
    }
  })

  it('excludes owned items and free items', () => {
    const owned = ['w1_1', 'a1_1']
    const shop = getInitialShopItems(owned)

    expect(shop).not.toContain('w1_1')
    expect(shop).not.toContain('a1_1')
    expect(shop).not.toContain('w_free')
    expect(shop).not.toContain('a_free')
  })

  it('excludes consumables and trophies', () => {
    const shop = getInitialShopItems([])
    expect(shop).not.toContain('potion')
    expect(shop).not.toContain('elixir')
    expect(shop).not.toContain('trophy_a')
  })
})

describe('getInitialPreviewItems', () => {
  it('returns up to 2 next-tier (playerWorld+1) gear items', () => {
    const preview = getInitialPreviewItems([], 1)

    expect(preview.length).toBe(2)
    for (const id of preview) {
      expect(id.startsWith('w2_') || id.startsWith('a2_') || id.startsWith('c2_')).toBe(true)
    }
  })

  it('returns empty array when playerWorld is 5 (no next tier)', () => {
    expect(getInitialPreviewItems([], 5)).toEqual([])
  })

  it('excludes owned items, consumables, and trophies', () => {
    // Force the preview pool to a known set: own everything in world 2 except two items.
    const owned = [
      'w2_1', 'w2_2', 'w2_3', 'w2_4',
      'a2_1', 'a2_2', 'a2_3',
      'c2_1', 'c2_2', 'c2_3', 'c2_4',
    ]
    const preview = getInitialPreviewItems(owned, 1)

    // Only a2_4 and elixir+trophy survive the filter; consumable/trophy excluded.
    expect(preview).not.toContain('potion')
    expect(preview).not.toContain('elixir')
    expect(preview).not.toContain('trophy_a')
    for (const id of owned) expect(preview).not.toContain(id)
    expect(preview).toContain('a2_4')
  })
})

describe('rotateShopItems', () => {
  it('removes owned items from the current shop', () => {
    const current = ['w1_1', 'w1_2', 'w1_3', 'a1_1', 'a1_2', 'a1_3', 'c1_1', 'c1_2', 'c1_3']
    const owned = ['w1_1', 'a1_2']

    const rotated = rotateShopItems(current, owned, 1, 0)

    expect(rotated).not.toContain('w1_1')
    expect(rotated).not.toContain('a1_2')
  })

  it('replenishes missing slots up to 3 per category', () => {
    const current = ['w1_1', 'a1_1', 'c1_1'] // 1 of each, missing 2 per category
    const rotated = rotateShopItems(current, [], 1, 0)

    expect(rotated.filter(id => id.startsWith('w1_')).length).toBe(3)
    expect(rotated.filter(id => id.startsWith('a1_')).length).toBe(3)
    expect(rotated.filter(id => id.startsWith('c1_')).length).toBe(3)

    // Preserves existing (unowned) items
    expect(rotated).toContain('w1_1')
    expect(rotated).toContain('a1_1')
    expect(rotated).toContain('c1_1')
  })

  it('uses playerWorld to gate replenishment pool', () => {
    // Empty shop, player in world 2 -> can replenish from world 1 OR world 2 items.
    const rotated = rotateShopItems([], [], 2, 0)

    expect(rotated.length).toBe(9)
    for (const id of rotated) {
      expect(/^[wac][12]_/.test(id)).toBe(true) // no world-5 leakage
    }
  })

  it('replaces only items that existed pre-replenishment (not newly added ones)', () => {
    // Start with a single weapon; replenishment adds 2 weapons + 3 armors + 3 accessories.
    // itemsToReplaceCount=5 cannot exceed preReplenishCount=1, so at most 1 swap happens.
    const current = ['w1_1']
    const rotated = rotateShopItems(current, [], 1, 5)

    expect(rotated.length).toBe(9)
    // The single original item either stays or is swapped for another world-1 weapon.
    const firstSlot = rotated[0]
    expect(firstSlot.startsWith('w1_')).toBe(true)
  })

  it('does not introduce duplicates', () => {
    const current = ['w1_1', 'w1_2', 'w1_3', 'a1_1', 'a1_2', 'a1_3', 'c1_1', 'c1_2', 'c1_3']
    const rotated = rotateShopItems(current, [], 1, 2)

    const unique = new Set(rotated)
    expect(unique.size).toBe(rotated.length)
  })

  it('excludes free items, consumables, and trophies from rotation', () => {
    const current = ['w1_1', 'w1_2', 'w1_3', 'a1_1', 'a1_2', 'a1_3', 'c1_1', 'c1_2', 'c1_3']
    const rotated = rotateShopItems(current, [], 1, 3)

    expect(rotated).not.toContain('w_free')
    expect(rotated).not.toContain('a_free')
    expect(rotated).not.toContain('potion')
    expect(rotated).not.toContain('elixir')
    expect(rotated).not.toContain('trophy_a')
  })
})

describe('refreshPreviewItems', () => {
  it('returns next-tier preview items (delegates to getInitialPreviewItems)', () => {
    const preview = refreshPreviewItems([], 1)

    expect(preview.length).toBe(2)
    for (const id of preview) {
      expect(id.startsWith('w2_') || id.startsWith('a2_') || id.startsWith('c2_')).toBe(true)
    }
  })

  it('returns empty when next tier has no gear in the data set', () => {
    // playerWorld 2 -> next world 3, but mock has no world-3 items
    expect(refreshPreviewItems([], 2)).toEqual([])
  })
})

describe('getAvailableConsumables', () => {
  it('returns all consumable item IDs regardless of ownership', () => {
    expect(getAvailableConsumables([])).toEqual(expect.arrayContaining(['potion', 'elixir']))
    expect(getAvailableConsumables(['potion'])).toEqual(expect.arrayContaining(['potion', 'elixir']))
  })

  it('does not include gear, trophies, or free items', () => {
    const consumables = getAvailableConsumables([])
    expect(consumables).not.toContain('w1_1')
    expect(consumables).not.toContain('trophy_a')
    expect(consumables).not.toContain('w_free')
  })
})
