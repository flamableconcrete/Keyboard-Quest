// src/controllers/WaveController.test.ts
import { describe, it, expect } from 'vitest'
import { WaveController } from './WaveController'

const baseConfig = {
  words: ['ant', 'bat', 'cat', 'dog', 'eel', 'fox', 'gnu', 'hen', 'ibis', 'jay', 'kite', 'lark'],
  maxWaves: 3,
  worldNumber: 1,
  barrierX: 265,
  canvasWidth: 1280,
  rng: () => 0.5,  // deterministic random
}

describe('WaveController — wave sequencing', () => {
  it('starts at wave 0', () => {
    const ctrl = new WaveController(baseConfig)
    expect(ctrl.currentWave).toBe(0)
  })

  it('startWave increments currentWave', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    expect(ctrl.currentWave).toBe(1)
  })

  it('startWave returns spawn events', () => {
    const ctrl = new WaveController(baseConfig)
    const events = ctrl.startWave()
    expect(events.filter(e => e.type === 'spawn').length).toBeGreaterThan(0)
  })

  it('startWave does not exceed maxWaves', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    ctrl.startWave()
    ctrl.startWave()
    const events = ctrl.startWave()  // 4th call — should produce nothing
    expect(events.length).toBe(0)
    expect(ctrl.currentWave).toBe(3)
  })
})

describe('WaveController — skeleton defeat', () => {
  it('markDefeated removes the skeleton', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    const initial = ctrl.activeSkeletons.length
    const word = ctrl.activeSkeletons[0].word
    ctrl.markDefeated(word)
    expect(ctrl.activeSkeletons.length).toBe(initial - 1)
  })

  it('markDefeated returns wave_complete when last skeleton dies and more waves remain', () => {
    const ctrl = new WaveController({ ...baseConfig, maxWaves: 2 })
    ctrl.startWave()
    const events: ReturnType<typeof ctrl.markDefeated> = []
    while (ctrl.activeSkeletons.length > 0) {
      const word = ctrl.activeSkeletons[0].word
      events.push(...ctrl.markDefeated(word))
    }
    const waveComplete = events.find(e => e.type === 'wave_complete')
    expect(waveComplete).toBeDefined()
  })

  it('markDefeated returns game_complete when last skeleton dies in final wave', () => {
    const ctrl = new WaveController({ ...baseConfig, maxWaves: 1 })
    ctrl.startWave()
    const events: ReturnType<typeof ctrl.markDefeated> = []
    while (ctrl.activeSkeletons.length > 0) {
      const word = ctrl.activeSkeletons[0].word
      events.push(...ctrl.markDefeated(word))
    }
    expect(events.find(e => e.type === 'game_complete')).toBeDefined()
  })
})

describe('WaveController — skeleton movement (advanced mode)', () => {
  it('tick moves skeletons left by speed*dt', () => {
    const ctrl = new WaveController(baseConfig)
    ctrl.startWave()
    const initial = ctrl.activeSkeletons.map(s => s.x)
    ctrl.tick(100, 'advanced')  // 100ms
    ctrl.activeSkeletons.forEach((s, i) => {
      expect(s.x).toBeLessThan(initial[i])
    })
  })

  it('tick returns skeleton_reached when skeleton crosses barrierX', () => {
    const ctrl = new WaveController({ ...baseConfig, canvasWidth: 400, barrierX: 265 })
    ctrl.startWave()
    // Force a skeleton to just past the barrier
    ;(ctrl as any)._skeletons[0].x = 270
    // Force a higher speed so it can actually cross the barrier in this tick
    ;(ctrl as any)._skeletons[0].speed = 60
    const events = ctrl.tick(1000, 'advanced')  // big delta to move it past
    expect(events.find(e => e.type === 'skeleton_reached')).toBeDefined()
  })
})

describe('WaveController — regular mode slot positions', () => {
  it('tick does not move skeletons past battleX', () => {
    // Make sure barrierX is small enough so skeletons don't get 0 speed
    const ctrl = new WaveController({ ...baseConfig, battleX: 350, barrierX: 50 })
    ctrl.startWave()
    // Give them a normal speed for the test
    ctrl.activeSkeletons.forEach(s => { (s as any).speed = 60 })
    ctrl.tick(10000, 'regular')  // large delta
    ctrl.activeSkeletons.forEach(s => {
      expect(s.x).toBeGreaterThanOrEqual(350)
    })
  })
})
