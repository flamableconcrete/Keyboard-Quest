import { describe, it, expect, beforeEach } from 'vitest'
import { createProfile, saveProfile, loadProfile, deleteProfile, exportProfile, importProfile } from './profile'

// Mock localStorage
const store: Record<string, string> = {}
global.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => Object.keys(store).forEach(k => delete store[k]),
  length: 0,
  key: () => null,
} as unknown as Storage

beforeEach(() => localStorage.clear())

describe('profile system', () => {
  it('creates a default profile', () => {
    const p = createProfile('Hero')
    expect(p.playerName).toBe('Hero')
    expect(p.characterLevel).toBe(1)
    expect(p.unlockedLetters).toContain('a')
  })

  it('saves and loads a profile', () => {
    const p = createProfile('Hero')
    saveProfile(0, p)
    const loaded = loadProfile(0)
    expect(loaded?.playerName).toBe('Hero')
  })

  it('returns null for empty slot', () => {
    expect(loadProfile(0)).toBeNull()
  })

  it('deletes a profile', () => {
    saveProfile(0, createProfile('Hero'))
    deleteProfile(0)
    expect(loadProfile(0)).toBeNull()
  })

  it('exports and imports round-trip', () => {
    const p = createProfile('Hero')
    const json = exportProfile(p)
    const imported = importProfile(json)
    expect(imported?.playerName).toBe('Hero')
  })

  it('importProfile returns null for invalid JSON', () => {
    expect(importProfile('not-json')).toBeNull()
  })
})