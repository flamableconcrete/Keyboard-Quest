import { describe, it, expect } from 'vitest'
import { ITEM_TEXTURE_IDS } from './itemsArt'
import { ITEMS } from '../data/items'

describe('ITEM_TEXTURE_IDS', () => {
  it('covers every item ID in ITEMS (no item falls through to magenta fallback)', () => {
    const allIds = ITEMS.map(i => i.id)
    const missing = allIds.filter(id => !ITEM_TEXTURE_IDS.includes(id))
    expect(missing).toEqual([])
  })

  it('contains no orphaned IDs not present in ITEMS', () => {
    const allIds = ITEMS.map(i => i.id)
    const orphaned = ITEM_TEXTURE_IDS.filter(id => !allIds.includes(id))
    expect(orphaned).toEqual([])
  })
})
