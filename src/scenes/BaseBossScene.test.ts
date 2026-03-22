import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseBossScene } from './BaseBossScene'
import { LevelConfig } from '../types'

// Mock Phaser.Scene for unit tests
vi.mock('phaser', () => ({
  default: {
    Scene: class {
      constructor() {}
    },
    Utils: { Array: { Shuffle: (arr: unknown[]) => arr } },
    Math: { Between: (a: number) => a },
  },
}))

// Minimal concrete subclass for testing (no Phaser rendering)
class TestBossScene extends BaseBossScene {
  protected onWordComplete(_word: string, _elapsed: number) {}
  protected onWrongKey() {}

  // Expose protected helpers for testing
  callSetupBossHP(bossWordCount: number, playerStartHp?: number) {
    return (this as any).setupBossHP(bossWordCount, playerStartHp)
  }
}

const mockLevel: Partial<LevelConfig> = {
  id: 'test_boss',
  name: 'Test Boss',
  world: 1,
  wordCount: 6,
  unlockedLetters: ['a', 'b', 'c', 'd', 'e', 'f'],
}

describe('BaseBossScene.setupBossHP', () => {
  let scene: TestBossScene

  beforeEach(() => {
    scene = new TestBossScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
  })

  it('returns correct initial HP state with default playerStartHp=3', () => {
    const hp = scene.callSetupBossHP(6)

    expect(hp.bossHp).toBe(6)
    expect(hp.bossMaxHp).toBe(6)
    expect(hp.playerHp).toBe(3)
  })

  it('accepts a custom playerStartHp', () => {
    const hp = scene.callSetupBossHP(10, 5)

    expect(hp.bossHp).toBe(10)
    expect(hp.bossMaxHp).toBe(10)
    expect(hp.playerHp).toBe(5)
  })

  it('bossHp and bossMaxHp are equal on initialization', () => {
    const hp = scene.callSetupBossHP(4)

    expect(hp.bossHp).toBe(hp.bossMaxHp)
  })

  it('returned object is mutable (scene can update hp values)', () => {
    const hp = scene.callSetupBossHP(5)

    hp.bossHp -= 1
    hp.playerHp -= 1

    expect(hp.bossHp).toBe(4)
    expect(hp.playerHp).toBe(2)
    // bossMaxHp stays unchanged
    expect(hp.bossMaxHp).toBe(5)
  })
})
