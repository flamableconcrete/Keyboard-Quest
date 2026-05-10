import { describe, it, expect, vi } from 'vitest'
import { setupPause } from './pauseSetup'

describe('setupPause', () => {
  it('should be a function', () => {
    expect(typeof setupPause).toBe('function')
  })

  it('should execute without error', () => {
    const mockScene = {
      input: {
        keyboard: {
          on: vi.fn(),
        },
      },
    } as any

    expect(() => setupPause(mockScene, 0)).not.toThrow()
  })

  it('should not add any keyboard listeners (since logic moved to LevelHUD)', () => {
    const mockScene = {
      input: {
        keyboard: {
          on: vi.fn(),
        },
      },
    } as any

    setupPause(mockScene, 0)
    expect(mockScene.input.keyboard.on).not.toHaveBeenCalled()
  })
})
