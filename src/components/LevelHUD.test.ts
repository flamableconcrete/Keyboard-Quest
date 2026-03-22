import { describe, it, expect, vi, beforeEach } from 'vitest'
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
  const mockText = { setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis() }
  const mockImage = { setScale: vi.fn().mockReturnThis(), setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setTexture: vi.fn() }
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
    input: { keyboard: { on: vi.fn() } },
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
