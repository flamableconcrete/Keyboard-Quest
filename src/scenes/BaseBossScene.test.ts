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
  callSetupBossTimer(
    seconds: number,
    timerText: Phaser.GameObjects.Text,
    onExpire: () => void
  ) {
    return (this as any).setupBossTimer(seconds, timerText, onExpire)
  }

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

describe('BaseBossScene.setupBossTimer', () => {
  let scene: TestBossScene

  beforeEach(() => {
    scene = new TestBossScene()
    ;(scene as any).init({ level: mockLevel as LevelConfig, profileSlot: 0 })
  })

  it('calls onExpire callback after the timer ticks down to 0', () => {
    let timerCallback: (() => void) | null = null
    ;(scene as any).time = {
      addEvent: (opts: { delay: number; repeat: number; callback: () => void }) => {
        timerCallback = opts.callback
        return { remove: () => {} }
      },
    }

    const onExpire = vi.fn()
    const fakeText = { setText: vi.fn() }

    scene.callSetupBossTimer(3, fakeText as unknown as Phaser.GameObjects.Text, onExpire)

    expect(timerCallback).not.toBeNull()

    // Fire 3 ticks (seconds 2, 1, 0)
    timerCallback!()
    expect(onExpire).not.toHaveBeenCalled()
    timerCallback!()
    expect(onExpire).not.toHaveBeenCalled()
    timerCallback!()
    expect(onExpire).toHaveBeenCalledOnce()
  })

  it('sets initial timer text and updates on each tick', () => {
    let timerCallback: (() => void) | null = null
    ;(scene as any).time = {
      addEvent: (opts: { delay: number; repeat: number; callback: () => void }) => {
        timerCallback = opts.callback
        return { remove: () => {} }
      },
    }

    const onExpire = vi.fn()
    const fakeText = { setText: vi.fn() }

    scene.callSetupBossTimer(3, fakeText as unknown as Phaser.GameObjects.Text, onExpire)

    // Initial text set to "3s"
    expect(fakeText.setText).toHaveBeenCalledWith('3s')

    fakeText.setText.mockClear()
    timerCallback!()
    expect(fakeText.setText).toHaveBeenCalledWith('2s')

    fakeText.setText.mockClear()
    timerCallback!()
    expect(fakeText.setText).toHaveBeenCalledWith('1s')

    fakeText.setText.mockClear()
    timerCallback!()
    expect(fakeText.setText).toHaveBeenCalledWith('0s')
  })

  it('returns a TimerEvent from time.addEvent', () => {
    const fakeTimerEvent = { remove: vi.fn() }
    ;(scene as any).time = {
      addEvent: () => fakeTimerEvent,
    }

    const fakeText = { setText: vi.fn() }
    const result = scene.callSetupBossTimer(5, fakeText as unknown as Phaser.GameObjects.Text, vi.fn())

    expect(result).toBe(fakeTimerEvent)
  })
})

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
