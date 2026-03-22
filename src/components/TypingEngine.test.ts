import { describe, it, expect, vi } from 'vitest'

// Mock Phaser
vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}))

import { TypingEngine } from './TypingEngine'

describe('TypingEngine', () => {
  it('uses charDepth for char text objects when provided', () => {
    // The test verifies that add.text().setDepth is called with the provided charDepth.
    // Use a mock that records setDepth calls.
    const mockText = { setDepth: vi.fn().mockReturnThis() }
    const mockScene = {
      input: { keyboard: { on: vi.fn() } },
      scale: { width: 1280, height: 720 },
      add: { text: vi.fn().mockReturnValue(mockText) },
      events: { on: vi.fn(), emit: vi.fn() },
      time: {},
    }
    const engine = new TypingEngine({
      scene: mockScene as any,
      x: 640,
      y: 600,
      onWordComplete: vi.fn(),
      onWrongKey: vi.fn(),
      charDepth: 99,
      showWpm: false,
    })
    engine.setWord('hi')
    expect(mockText.setDepth).toHaveBeenCalledWith(99)
  })
})
