import { describe, it, expect, beforeEach } from 'vitest'
import { createProfile, saveProfile, loadProfile, deleteProfile, exportProfile, importProfile } from './profile'
import type { ProfileData } from '../types'

// Mock localStorage
const store: Record<string, string> = {}
globalThis.localStorage = {
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
    expect(p.worldMasteryRewards).toEqual([])
    expect(p.bossWeaknessKnown).toBeNull()
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

  it('creates profile with gameMode regular by default', () => {
    const p = createProfile('Hero')
    expect(p.gameMode).toBe('regular')
  })

  it('loadProfile returns regular gameMode for legacy profiles missing the field', () => {
    // Simulate a legacy profile saved without gameMode
    const legacy = createProfile('OldHero')
    const { gameMode: _drop, ...withoutMode } = legacy as ProfileData & { gameMode?: string }
    localStorage.setItem('kq_profile_0', JSON.stringify(withoutMode))
    const loaded = loadProfile(0)
    expect(loaded?.gameMode).toBe('regular')
  })
})