import { describe, it, expect, vi } from 'vitest'
import { LevelHUD, HUDConfig } from './LevelHUD'

vi.mock('phaser', () => ({
  default: {
    Scene: class { constructor() {} },
  },
}))
vi.mock('../art/dungeonTrapArt', () => ({ generateHeartTextures: vi.fn() }))
vi.mock('./TypingEngine', () => ({ TypingEngine: class { constructor() {}; destroy() {}; setWord() {} } }))
vi.mock('./TypingHands', () => ({ TypingHands: class { constructor() {}; fadeOut() {} } }))
vi.mock('../utils/profile', () => ({ loadProfile: () => null }))

function makeScene(overrides = {}) {
  const mockText = {
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
  }
  const mockImage = {
    setScale: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setTexture: vi.fn(),
  }
  const mockGraphics = {
    setDepth: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRect: vi.fn().mockReturnThis(),
  }
  return {
    scale: { width: 1280, height: 720 },
    add: {
      text: vi.fn().mockReturnValue(mockText),
      image: vi.fn().mockReturnValue(mockImage),
      graphics: vi.fn().mockReturnValue(mockGraphics),
    },
    textures: { exists: vi.fn().mockReturnValue(true) },
    input: { keyboard: { on: vi.fn(), off: vi.fn() } },
    scene: { isPaused: vi.fn().mockReturnValue(false), pause: vi.fn(), launch: vi.fn(), bringToTop: vi.fn(), key: 'TestScene' },
    events: { on: vi.fn() },
    time: { addEvent: vi.fn().mockReturnValue({ remove: vi.fn() }) },
    ...overrides,
  }
}

const baseConfig: HUDConfig = {
  profileSlot: 0,
  heroHp: 3,
  levelName: 'Test Level',
  wordPool: ['cat', 'dog'],
  onWordComplete: vi.fn(),
  onWrongKey: vi.fn(),
}

describe('LevelHUD construction', () => {
  it('creates two graphics panels', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    expect(scene.add.graphics).toHaveBeenCalledTimes(1) // one graphics object for both panels
  })

  it('creates 3 heart images', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    const imageCalls = (scene.add.image as any).mock.calls
    const heartCalls = imageCalls.filter((args: any[]) => args[2] === 'heart_full' || args[2] === 'heart_empty')
    expect(heartCalls).toHaveLength(3)
  })
})

describe('LevelHUD.setHeroHp', () => {
  it('sets heart_empty texture for hearts beyond current hp', () => {
    const scene = makeScene()
    const hud = new LevelHUD(scene as any, { ...baseConfig, heroHp: 3 })
    hud.setHeroHp(1)
    // hearts[1] and hearts[2] should be set to heart_empty
    const mockImages = (scene.add.image as any).mock.results
      .filter((_r: any, i: number) => {
        const args = (scene.add.image as any).mock.calls[i]
        return args[2] === 'heart_full' || args[2] === 'heart_empty'
      })
      .map((r: any) => r.value)
    expect(mockImages[1].setTexture).toHaveBeenCalledWith('heart_empty')
    expect(mockImages[2].setTexture).toHaveBeenCalledWith('heart_empty')
  })
})

describe('LevelHUD timer', () => {
  it('calls onExpire after countdown reaches zero', () => {
    const scene = makeScene()
    let timerCallback: (() => void) | null = null
    ;(scene.time.addEvent as any).mockImplementation((opts: any) => {
      timerCallback = opts.callback
      return { remove: vi.fn() }
    })

    const onExpire = vi.fn()
    new LevelHUD(scene as any, {
      ...baseConfig,
      timer: { seconds: 3, onExpire },
    })

    timerCallback!(); timerCallback!(); timerCallback!()
    expect(onExpire).toHaveBeenCalledOnce()
  })

  it('calls onTick with remaining seconds', () => {
    const scene = makeScene()
    let timerCallback: (() => void) | null = null
    ;(scene.time.addEvent as any).mockImplementation((opts: any) => {
      timerCallback = opts.callback
      return { remove: vi.fn() }
    })

    const onTick = vi.fn()
    new LevelHUD(scene as any, {
      ...baseConfig,
      timer: { seconds: 3, onExpire: vi.fn(), onTick },
    })

    timerCallback!(); timerCallback!(); timerCallback!()
    expect(onTick).toHaveBeenNthCalledWith(1, 2)
    expect(onTick).toHaveBeenNthCalledWith(2, 1)
    expect(onTick).toHaveBeenNthCalledWith(3, 0)
  })

  it('destroy() removes the timer event', () => {
    const scene = makeScene()
    const removeSpy = vi.fn()
    ;(scene.time.addEvent as any).mockReturnValue({ remove: removeSpy })

    const hud = new LevelHUD(scene as any, {
      ...baseConfig,
      timer: { seconds: 5, onExpire: vi.fn() },
    })
    hud.destroy()
    expect(removeSpy).toHaveBeenCalled()
  })
})

describe('LevelHUD ESC listener', () => {
  it('registers keydown-ESC handler on construction', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    expect(scene.input.keyboard.on).toHaveBeenCalledWith('keydown-ESC', expect.any(Function))
  })

  it('removes keydown-ESC handler on destroy()', () => {
    const scene = makeScene()
    const hud = new LevelHUD(scene as any, baseConfig)
    hud.destroy()
    expect(scene.input.keyboard.off).toHaveBeenCalledWith('keydown-ESC', expect.any(Function))
  })
})

describe('LevelHUD heart positions', () => {
  it('places hearts at y=28 and x starting at 124 with step 54', () => {
    const scene = makeScene()
    new LevelHUD(scene as any, baseConfig)
    const imageCalls: any[][] = (scene.add.image as any).mock.calls
    const heartCalls = imageCalls.filter(args => args[2] === 'heart_full' || args[2] === 'heart_empty')
    expect(heartCalls).toHaveLength(3)
    expect(heartCalls[0][0]).toBe(124)  // x of first heart
    expect(heartCalls[1][0]).toBe(178)  // 124 + 54
    expect(heartCalls[2][0]).toBe(232)  // 124 + 108
    expect(heartCalls[0][1]).toBe(28)   // y vertically centered
  })
})
