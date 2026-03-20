import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseLevelScene } from './BaseLevelScene'
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
class TestLevelScene extends BaseLevelScene {
  protected onWordComplete(_word: string, _elapsed: number) {}
  protected onWrongKey() {}

  // Expose internals for testing
  get _finished() {
    return this.finished
  }
  get _level() {
    return this.level
  }
  get _profileSlot() {
    return this.profileSlot
  }

  // Simulate calling endLevel without preCreate (to test the guard)
  callEndLevelWithoutPreCreate(passed: boolean) {
    // Bypass Phaser's scene.start for unit test
    ;(this as any).engine = {
      destroy: () => {},
      sessionStartTime: Date.now(),
      correctKeystrokes: 10,
      totalKeystrokes: 10,
      completedWords: 5,
    }
    ;(this as any).goldManager = { getCollectedGold: () => 0 }
    ;(this as any).time = { delayedCall: (_ms: number, cb: () => void) => cb() }
    ;(this as any).scene = { start: () => {}, key: 'TestScene' }
    ;(this as any).endLevel(passed)
  }
}

const mockLevel: Partial<LevelConfig> = {
  id: 'test_level',
  name: 'Test',
  world: 1,
  wordCount: 10,
  unlockedLetters: ['a', 'b', 'c', 'd', 'e', 'f'],
}

describe('BaseLevelScene.init()', () => {
  let scene: TestLevelScene

  beforeEach(() => {
    scene = new TestLevelScene()
  })

  it('stores level and profileSlot', () => {
    ;(scene as any).init({
      level: mockLevel as LevelConfig,
      profileSlot: 2,
    })
    expect(scene._level).toBe(mockLevel)
    expect(scene._profileSlot).toBe(2)
  })

  it('resets finished to false on re-init', () => {
    ;(scene as any).finished = true
    ;(scene as any).init({
      level: mockLevel as LevelConfig,
      profileSlot: 0,
    })
    expect(scene._finished).toBe(false)
  })
})

describe('BaseLevelScene._preCreateCalled guard', () => {
  let scene: TestLevelScene

  beforeEach(() => {
    scene = new TestLevelScene()
  })

  it('throws if endLevel is called before preCreate (guard always active in test env)', () => {
    ;(scene as any).init({
      level: mockLevel as LevelConfig,
      profileSlot: 0,
    })

    expect(() => scene.callEndLevelWithoutPreCreate(true)).toThrow(/preCreate/)
  })

  it('does not throw if preCreate was called before endLevel', () => {
    ;(scene as any).init({
      level: mockLevel as LevelConfig,
      profileSlot: 0,
    })

    // Mark preCreate as called by setting the flag
    ;(scene as any)._preCreateCalled = true

    // Setup the mocks
    ;(scene as any).engine = {
      destroy: () => {},
      sessionStartTime: Date.now(),
      correctKeystrokes: 10,
      totalKeystrokes: 10,
      completedWords: 5,
    }
    ;(scene as any).goldManager = { getCollectedGold: () => 0 }
    ;(scene as any).time = { delayedCall: (_ms: number, cb: () => void) => cb() }
    ;(scene as any).scene = { start: () => {}, key: 'TestScene' }

    // Should not throw
    expect(() => {
      ;(scene as any).endLevel(true)
    }).not.toThrow()
  })
})
