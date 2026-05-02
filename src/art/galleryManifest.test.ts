import { describe, it, expect } from 'vitest'
import { ENEMY_MANIFEST, BACKGROUND_MANIFEST, filterEntries } from './galleryManifest'

const VALID_ENEMY_GROUPS = ['Monster', 'Boss', 'NPC', 'Object']
const VALID_BG_GROUPS = ['Level BG', 'World Tileset', 'Boss BG']

describe('ENEMY_MANIFEST', () => {
  it('every entry has non-empty key, name, and valid group', () => {
    for (const e of ENEMY_MANIFEST) {
      expect(e.key.length).toBeGreaterThan(0)
      expect(e.name.length).toBeGreaterThan(0)
      expect(VALID_ENEMY_GROUPS).toContain(e.group)
    }
  })

  it('has no duplicate keys', () => {
    const keys = ENEMY_MANIFEST.map(e => e.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('BACKGROUND_MANIFEST', () => {
  it('every entry has non-empty key, name, and valid group', () => {
    for (const e of BACKGROUND_MANIFEST) {
      expect(e.key.length).toBeGreaterThan(0)
      expect(e.name.length).toBeGreaterThan(0)
      expect(VALID_BG_GROUPS).toContain(e.group)
    }
  })

  it('has exactly 5 World Tileset entries', () => {
    const tilesets = BACKGROUND_MANIFEST.filter(e => e.group === 'World Tileset')
    expect(tilesets).toHaveLength(5)
  })

  it('has no duplicate keys', () => {
    const keys = BACKGROUND_MANIFEST.map(e => e.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('filterEntries', () => {
  const entries = [
    { key: 'a', name: 'A', group: 'Monster' },
    { key: 'b', name: 'B', group: 'Boss' },
    { key: 'c', name: 'C', group: 'Monster' },
  ]

  it('returns all entries when filter is "All"', () => {
    expect(filterEntries(entries, 'All')).toEqual(entries)
  })

  it('filters by group', () => {
    expect(filterEntries(entries, 'Monster')).toEqual([entries[0], entries[2]])
    expect(filterEntries(entries, 'Boss')).toEqual([entries[1]])
  })

  it('returns empty array for unknown group', () => {
    expect(filterEntries(entries, 'Wizard')).toEqual([])
  })
})
