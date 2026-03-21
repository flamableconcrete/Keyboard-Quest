import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BaseLevelScene } from './BaseLevelScene'
import { LevelConfig } from '../types'
import { GOLD_PER_KILL } from '../constants'

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

describe('BaseLevelScene.setupLevelTimer', () => {
  it('calls endLevel(false) when timer expires', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel, profileSlot: 0 })
    ;(scene as any)._preCreateCalled = true

    // Mock the timer: capture the callback when addEvent is called
    let timerCallback: (() => void) | null = null
    ;(scene as any).time = {
      addEvent: (_opts: { delay: number; repeat: number; callback: () => void }) => {
        timerCallback = _opts.callback
        return { remove: () => {} }
      },
      delayedCall: (_ms: number, cb: () => void) => cb(),
    }
    ;(scene as any).scene = { start: () => {}, key: 'Test' }

    // Mock endLevel to spy on it
    const endLevelSpy = vi.fn()
    ;(scene as any).endLevel = endLevelSpy

    const fakeText = { setText: () => {} }
    ;(scene as any).setupLevelTimer(3, fakeText)

    expect(timerCallback).not.toBeNull()

    // Fire the callback 3 times (simulating 3 seconds)
    timerCallback!()
    timerCallback!()
    timerCallback!()

    expect(endLevelSpy).toHaveBeenCalledWith(false)
  })
})

describe('BaseLevelScene.setupLevelTimer with onTick', () => {
  it('calls onTick with the new remaining value after each decrement', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel, profileSlot: 0 })
    ;(scene as any)._preCreateCalled = true

    let timerCallback: (() => void) | null = null
    ;(scene as any).time = {
      addEvent: (_opts: { delay: number; repeat: number; callback: () => void }) => {
        timerCallback = _opts.callback
        return { remove: () => {} }
      },
      delayedCall: (_ms: number, cb: () => void) => cb(),
    }
    ;(scene as any).scene = { start: () => {}, key: 'Test' }

    const endLevelSpy = vi.fn()
    ;(scene as any).endLevel = endLevelSpy

    const onTickSpy = vi.fn()
    const fakeText = { setText: () => {} }
    ;(scene as any).setupLevelTimer(3, fakeText, onTickSpy)

    expect(timerCallback).not.toBeNull()

    // Fire 3 ticks
    timerCallback!()  // remaining = 2
    timerCallback!()  // remaining = 1
    timerCallback!()  // remaining = 0

    expect(onTickSpy).toHaveBeenCalledTimes(3)
    expect(onTickSpy).toHaveBeenNthCalledWith(1, 2)
    expect(onTickSpy).toHaveBeenNthCalledWith(2, 1)
    expect(onTickSpy).toHaveBeenNthCalledWith(3, 0)
  })
})

describe('BaseLevelScene._preCreateCalled guard', () => {
  let scene: TestLevelScene

  beforeEach(() => {
    scene = new TestLevelScene()
  })

  it('throws if endLevel is called before preCreate', () => {
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

describe('BaseLevelScene.spawnWordGold', () => {
  it('calls goldManager.spawnGold with GOLD_PER_KILL', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel, profileSlot: 0 })
    const spawnSpy = vi.fn()
    ;(scene as any).goldManager = { spawnGold: spawnSpy }
    ;(scene as any).scale = { width: 1280, height: 720 }

    ;(scene as any).spawnWordGold()

    expect(spawnSpy).toHaveBeenCalledOnce()
    expect(spawnSpy.mock.calls[0][2]).toBe(GOLD_PER_KILL)
  })

  it('does nothing if goldManager is absent', () => {
    const scene = new TestLevelScene()
    ;(scene as any).goldManager = null
    ;(scene as any).scale = { width: 1280, height: 720 }
    expect(() => (scene as any).spawnWordGold()).not.toThrow()
  })
})

describe('BaseLevelScene.flashOnWrongKey', () => {
  it('calls cameras.main.flash with correct arguments', () => {
    const scene = new TestLevelScene()
    const flashSpy = vi.fn()
    ;(scene as any).cameras = { main: { flash: flashSpy } }

    ;(scene as any).flashOnWrongKey()

    expect(flashSpy).toHaveBeenCalledOnce()
    expect(flashSpy).toHaveBeenCalledWith(80, 120, 0, 0)
  })
})
