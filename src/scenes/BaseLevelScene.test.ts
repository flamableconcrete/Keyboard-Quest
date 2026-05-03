import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BaseLevelScene } from './BaseLevelScene'
import { LevelConfig } from '../types'
import { GOLD_PER_KILL } from '../constants'
import { loadProfile } from '../utils/profile'
import { calcAccuracyStars, calcSpeedStars } from '../utils/scoring'

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
vi.mock('../utils/profile', () => ({ loadProfile: vi.fn(() => null) }))
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

function makePreCreateSetup(
  scene: TestLevelScene,
  engineOverrides: Partial<{
    totalKeystrokes: number
    correctKeystrokes: number
    completedWords: number
    sessionStartTime: number
    wrongKeyOverride: (() => void) | null
    fireWrongKey: ReturnType<typeof vi.fn>
  }> = {}
) {
  const fakeImage = { setScale: () => fakeImage, setDepth: () => fakeImage }
  const fakeText = {
    setOrigin: () => fakeText,
    setDepth: () => fakeText,
    setInteractive: () => fakeText,
    on: () => fakeText,
  }
  ;(scene as any).add = {
    image: vi.fn().mockReturnValue(fakeImage),
    text: vi.fn().mockReturnValue(fakeText),
    graphics: vi.fn().mockReturnValue({ fillStyle: () => {}, fillEllipse: () => {} }),
  }
  ;(scene as any).scale = { width: 1280, height: 720 }
  ;(scene as any).input = { keyboard: null }
  ;(scene as any).events = { on: vi.fn(), once: vi.fn(), emit: vi.fn() }
  ;(scene as any).time = { addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }) }
  ;(scene as any).scene = { key: 'TestScene', start: vi.fn() }

  const fakeEngine = {
    sessionStartTime: Date.now(),
    correctKeystrokes: 0,
    totalKeystrokes: 0,
    completedWords: 0,
    wrongKeyOverride: null as (() => void) | null,
    fireWrongKey: vi.fn(),
    ...engineOverrides,
  }
  const fakeHud = { engine: fakeEngine, destroy: vi.fn() }
  return { fakeEngine, fakeHud }
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

// ---------------------------------------------------------------------------
// New tests covering endLevel, consumable bonuses, and score integration
// ---------------------------------------------------------------------------

describe('BaseLevelScene.endLevel — finished guard', () => {
  it('sets finished=true and treats a second call as a no-op', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    ;(scene as any)._preCreateCalled = true

    const startSpy = vi.fn()
    ;(scene as any).scene = { start: startSpy, key: 'TestScene' }
    ;(scene as any).hud = { destroy: vi.fn() }
    ;(scene as any).engine = {
      sessionStartTime: Date.now(),
      correctKeystrokes: 10,
      totalKeystrokes: 10,
      completedWords: 5,
    }
    ;(scene as any).goldManager = { getCollectedGold: () => 0 }
    ;(scene as any).time = { delayedCall: (_ms: number, cb: () => void) => cb() }

    ;(scene as any).endLevel(true)
    ;(scene as any).endLevel(true)  // second call must be a no-op

    expect(scene._finished).toBe(true)
    expect(startSpy).toHaveBeenCalledOnce()
  })
})

describe('BaseLevelScene consumable — gold_fever (goldDouble flag)', () => {
  it('sets consumableBonuses.goldDouble=true when gold_fever is selected', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })

    vi.mocked(loadProfile).mockReturnValueOnce({
      selectedConsumables: ['gold_fever'],
      spells: [],
      pets: [],
      activePetId: null,
    } as any)

    const { fakeHud } = makePreCreateSetup(scene)
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    expect((scene as any).consumableBonuses.goldDouble).toBe(true)
  })

  it('consumableBonuses.goldDouble is false when gold_fever is absent', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    // loadProfile returns null (default mock) → selected = []

    const { fakeHud } = makePreCreateSetup(scene)
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    expect((scene as any).consumableBonuses.goldDouble).toBe(false)
  })
})

describe('BaseLevelScene consumable — iron_will (ignoreFirstWrong)', () => {
  it('forgives the first wrong key (decrements totalKeystrokes, suppresses fireWrongKey)', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })

    vi.mocked(loadProfile).mockReturnValueOnce({
      selectedConsumables: ['iron_will'],
      spells: [],
      pets: [],
      activePetId: null,
    } as any)

    const { fakeEngine, fakeHud } = makePreCreateSetup(scene, { totalKeystrokes: 5 })
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    const override = fakeEngine.wrongKeyOverride!
    expect(override).not.toBeNull()

    // First wrong key: forgiven
    override()
    expect(fakeEngine.fireWrongKey).not.toHaveBeenCalled()
    expect(fakeEngine.totalKeystrokes).toBe(4)  // decremented by 1
  })

  it('fires fireWrongKey on the second wrong key and clears wrongKeyOverride', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })

    vi.mocked(loadProfile).mockReturnValueOnce({
      selectedConsumables: ['iron_will'],
      spells: [],
      pets: [],
      activePetId: null,
    } as any)

    const { fakeEngine, fakeHud } = makePreCreateSetup(scene, { totalKeystrokes: 5 })
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    const override = fakeEngine.wrongKeyOverride!

    override()  // first — forgiven
    override()  // second — fires normally

    expect(fakeEngine.fireWrongKey).toHaveBeenCalledOnce()
    expect(fakeEngine.wrongKeyOverride).toBeNull()
  })

  it('does not install wrongKeyOverride when iron_will is absent', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    // loadProfile returns null → ignoreFirstWrong = false

    const { fakeEngine, fakeHud } = makePreCreateSetup(scene)
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    expect(fakeEngine.wrongKeyOverride).toBeNull()
  })
})

describe('BaseLevelScene consumable — swift_tonic (extraTime)', () => {
  it('adds 20 seconds to timeLimit for a timed level', () => {
    const scene = new TestLevelScene()
    const timedLevel = { ...mockLevel, timeLimit: 30 } as LevelConfig
    ;(scene as any).init({ level: timedLevel, profileSlot: 0 })

    vi.mocked(loadProfile).mockReturnValueOnce({
      selectedConsumables: ['swift_tonic'],
      spells: [],
      pets: [],
      activePetId: null,
    } as any)

    const { fakeHud } = makePreCreateSetup(scene)
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    expect(scene._level.timeLimit).toBe(50)  // 30 + 20
  })

  it('leaves timeLimit as null for an untimed level', () => {
    const scene = new TestLevelScene()
    const untimedLevel = { ...mockLevel, timeLimit: null } as LevelConfig
    ;(scene as any).init({ level: untimedLevel, profileSlot: 0 })

    vi.mocked(loadProfile).mockReturnValueOnce({
      selectedConsumables: ['swift_tonic'],
      spells: [],
      pets: [],
      activePetId: null,
    } as any)

    const { fakeHud } = makePreCreateSetup(scene)
    ;(scene as any).preCreate(100, 400, { hud: fakeHud })

    expect(scene._level.timeLimit).toBeNull()
  })
})

describe('BaseLevelScene.endLevel — score integration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('passes correct accuracyStars, speedStars, and extraGold to scene.start', () => {
    const scene = new TestLevelScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
    ;(scene as any)._preCreateCalled = true

    // Pin Date.now so elapsed is exactly 60 000 ms
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000)

    const startSpy = vi.fn()
    ;(scene as any).scene = { start: startSpy, key: 'TestScene' }
    ;(scene as any).hud = { destroy: vi.fn() }
    ;(scene as any).goldManager = { getCollectedGold: () => 5 }
    ;(scene as any).time = { delayedCall: (_ms: number, cb: () => void) => cb() }
    ;(scene as any).engine = {
      sessionStartTime: 1_000_000 - 60_000,  // 60 s ago
      correctKeystrokes: 90,
      totalKeystrokes: 100,
      completedWords: 20,
    }

    ;(scene as any).endLevel(true)

    // calcAccuracyStars(90, 100): 90% ≥ 85% → 4 stars
    // calcSpeedStars(20, 1): scale=0.7; 20 ≥ 17.5 but < 24.5 → 3 stars
    expect(startSpy).toHaveBeenCalledWith('LevelResult', expect.objectContaining({
      accuracyStars: calcAccuracyStars(90, 100),
      speedStars: calcSpeedStars(20, 1),
      passed: true,
      extraGold: 5,
      level: mockLevel,
      profileSlot: 0,
    }))
  })
})
