import { describe, it, expect, vi } from 'vitest'

vi.mock('../utils/profile', () => ({ loadProfile: () => null }))
vi.mock('../art/companionsArt', () => ({ generateAllCompanionTextures: () => {} }))

// Minimal Phaser mock
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
    Scenes: { Events: { SHUTDOWN: 'shutdown' } },
  },
}))

import { CompanionAndPetRenderer } from './CompanionAndPetRenderer'

function makeScene(eventHandlers: Record<string, () => void> = {}) {
  return {
    add: {
      graphics: () => ({
        fillStyle: () => {},
        fillEllipse: () => {},
      }),
      image: vi.fn().mockReturnValue({
        setScale: function() { return this },
        setDepth: function() { return this },
        x: 0, y: 0,
      }),
    },
    tweens: { add: vi.fn() },
    events: {
      on: (event: string, cb: () => void, ctx?: unknown) => { eventHandlers[event] = ctx ? cb.bind(ctx) : cb },
      once: (event: string, cb: () => void, ctx?: unknown) => { eventHandlers[event] = ctx ? cb.bind(ctx) : cb },
      off: vi.fn(),
    },
  } as any
}

describe('CompanionAndPetRenderer — side option', () => {
  it('does not throw when constructed with default (right) side', () => {
    const scene = makeScene()
    expect(() => new CompanionAndPetRenderer(scene, 100, 300, 0)).not.toThrow()
  })

  it('does not throw when side is left', () => {
    const scene = makeScene()
    expect(() => new CompanionAndPetRenderer(scene, 448, 387, 0, 'left')).not.toThrow()
  })
})

describe('CompanionAndPetRenderer — trap_cleared event', () => {
  it('calls tweens.add when trap_cleared fires and sprites exist', () => {
    const handlers: Record<string, () => void> = {}
    const scene = makeScene(handlers)

    const renderer = new CompanionAndPetRenderer(scene, 448, 387, 0, 'left')
    // Manually inject sprites (loadProfile returns null so none are created by constructor)
    ;(renderer as any).companionSprite = { y: 387 }
    ;(renderer as any).petSprite = { y: 387 }

    // Fire the trap_cleared event
    handlers['trap_cleared']?.()

    expect(scene.tweens.add).toHaveBeenCalled()
  })

  it('does not throw when trap_cleared fires and sprites are null', () => {
    const handlers: Record<string, () => void> = {}
    const scene = makeScene(handlers)
    new CompanionAndPetRenderer(scene, 448, 387, 0, 'left')
    // companionSprite and petSprite are null (loadProfile returns null)
    expect(() => handlers['trap_cleared']?.()).not.toThrow()
  })
})
