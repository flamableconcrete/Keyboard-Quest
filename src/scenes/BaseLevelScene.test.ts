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
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}))

// Stub dependencies that preCreate() calls (needed by avatarSprite test)
vi.mock('../utils/profile', () => ({ loadProfile: () => null }))
vi.mock('../utils/words', () => ({ getWordPool: () => ['cat', 'dog'] }))
vi.mock('../art/companionsArt', () => ({ generateAllCompanionTextures: () => {} }))
vi.mock('../utils/pauseSetup', () => ({ setupPause: () => {} }))
vi.mock('../components/TypingEngine', () => ({ TypingEngine: class { constructor() {} } }))
vi.mock('../components/CompanionAndPetRenderer', () => ({
  CompanionAndPetRenderer: class {
    constructor() {}
    getPetSprite() { return null }
    getStartPetX() { return 0 }
    getStartPetY() { return 0 }
  }
}))
vi.mock('../utils/goldSystem', () => ({ GoldManager: class { constructor() {} } }))

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
    ;(this as any).hud = { destroy: () => {} }
    ;(this as any).engine = {
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
    ;(scene as any).hud = { destroy: () => {} }
    ;(scene as any).engine = {
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

describe('BaseLevelScene.initWordPool', () => {
  it('populates this.words and this.wordQueue', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    ;(scene as any).initWordPool()
    expect((scene as any).words).toEqual(['cat', 'dog'])
    expect((scene as any).wordQueue).toEqual(['cat', 'dog']) // shuffle is identity in mock
  })
})

describe('BaseLevelScene.preCreate avatarSprite', () => {
  it('avatarSprite field exists and is null before preCreate is called', () => {
    const scene = new TestLevelScene()
    expect((scene as any).avatarSprite).toBeNull()
  })

  it('sets avatarSprite after preCreate is called', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })

    const fakeImage = { setScale: () => fakeImage, setDepth: () => fakeImage }
    const fakeText = { setOrigin: () => fakeText, setDepth: () => fakeText, setInteractive: () => fakeText, on: () => fakeText }
    ;(scene as any).add = { image: vi.fn().mockReturnValue(fakeImage), text: vi.fn().mockReturnValue(fakeText), graphics: vi.fn().mockReturnValue({ fillStyle: () => {}, fillEllipse: () => {} }) }
    ;(scene as any).scale = { width: 1280, height: 720 }
    ;(scene as any).input = { keyboard: null }
    ;(scene as any).events = { on: vi.fn(), once: vi.fn(), emit: vi.fn() }
    ;(scene as any).time = { addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }) }

    const fakeEngine = { sessionStartTime: Date.now(), correctKeystrokes: 0, totalKeystrokes: 0, completedWords: 0 }
    const fakeHud = { engine: fakeEngine, destroy: () => {} }
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    expect((scene as any).avatarSprite).toBe(fakeImage)
  })
})
