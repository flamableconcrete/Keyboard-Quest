import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawMiniBossBg, drawDarkForestBg } from './bossBackgrounds'

// ── Phaser mock ───────────────────────────────────────────────────────────────
vi.mock('phaser', () => ({
  default: {},
}))

function makeMockGraphics() {
  const g: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const m of [
    'fillStyle', 'fillRect', 'fillCircle', 'fillTriangle', 'fillEllipse',
    'lineStyle', 'lineBetween', 'setAlpha', 'setPosition', 'destroy',
  ]) {
    g[m] = vi.fn().mockReturnThis()
  }
  return g
}

function makeMockScene() {
  const graphics = makeMockGraphics()
  const rectangle = {
    setAlpha: vi.fn().mockReturnThis(),
    setPosition: vi.fn().mockReturnThis(),
  }
  return {
    scale: { width: 1280, height: 720 },
    add: {
      graphics: vi.fn().mockReturnValue(graphics),
      rectangle: vi.fn().mockReturnValue(rectangle),
    },
    tweens: { add: vi.fn() },
    time:   { addEvent: vi.fn(), delayedCall: vi.fn() },
  }
}

// ── Rend's Crag (drawMiniBossBg dispatch) ────────────────────────────────────
describe('drawMiniBossBg — rend_the_red', () => {
  let scene: ReturnType<typeof makeMockScene>

  beforeEach(() => { scene = makeMockScene() })

  it('creates exactly 4 animated rectangles at setup (fire column, ground bloom, crack light, heat haze)', () => {
    drawMiniBossBg(scene as any, 'rend_the_red')
    expect(scene.add.rectangle).toHaveBeenCalledTimes(4)
  })

  it('starts the ember particle timer', () => {
    drawMiniBossBg(scene as any, 'rend_the_red')
    expect(scene.time.addEvent).toHaveBeenCalledTimes(1)
  })
})

// ── Grizzlefang's Den ────────────────────────────────────────────────────────
describe('drawDarkForestBg', () => {
  it('runs without throwing', () => {
    const scene = makeMockScene()
    expect(() => drawDarkForestBg(scene as any)).not.toThrow()
  })
})
