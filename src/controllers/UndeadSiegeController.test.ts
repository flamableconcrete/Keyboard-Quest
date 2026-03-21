// src/controllers/UndeadSiegeController.test.ts
import { describe, it, expect } from 'vitest'
import { UndeadSiegeController } from './UndeadSiegeController'

const baseConfig = {
  words: ['ant', 'bat', 'cat', 'dog', 'eel', 'fox', 'gnu', 'hen'],
  maxWaves: 3,
  worldNumber: 1,
  castleHp: 5,
  castleX: 100,
  canvasWidth: 1280,
}

describe('UndeadSiegeController — initial state', () => {
  it('starts with full castle HP', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    expect(ctrl.castleHp).toBe(5)
  })

  it('starts with no active undeads', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    expect(ctrl.activeUndeads.length).toBe(0)
  })

  it('starts at wave 1', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    expect(ctrl.currentWave).toBe(1)
  })

  it('isLost starts false', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    expect(ctrl.isLost).toBe(false)
  })

  it('isWon starts false', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    expect(ctrl.isWon).toBe(false)
  })
})

describe('UndeadSiegeController — spawning', () => {
  it('spawn returns a spawn event with word and x position', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    const events = ctrl.spawn()
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('spawn')
    if (events[0].type === 'spawn') {
      expect(events[0].word).toBe('ant')
      expect(events[0].x).toBeGreaterThan(baseConfig.canvasWidth)
    }
  })

  it('spawn adds undead to activeUndeads', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    expect(ctrl.activeUndeads.length).toBe(1)
  })

  it('spawn returns empty array when word queue is exhausted', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, words: [] })
    const events = ctrl.spawn()
    expect(events.length).toBe(0)
  })

  it('spawn uses words in queue order', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    ctrl.spawn()
    const words = ctrl.activeUndeads.map(u => u.word)
    expect(words).toContain('ant')
    expect(words).toContain('bat')
  })

  it('currentWave advances as more words are spawned', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, maxWaves: 4 })
    // Spawn enough to cross into wave 2 (word 3 of 8 is ~37% through, wave should be 2/4)
    ctrl.spawn() // ant (word 1 of 8 → 12.5% → wave 1)
    ctrl.spawn() // bat (word 2 of 8 → 25%  → wave 1)
    ctrl.spawn() // cat (word 3 of 8 → 37.5% → wave 2)
    expect(ctrl.currentWave).toBeGreaterThanOrEqual(2)
  })
})

describe('UndeadSiegeController — undead defeated', () => {
  it('markDefeated removes the undead from active list', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    ctrl.markDefeated('ant')
    expect(ctrl.activeUndeads.length).toBe(0)
  })

  it('markDefeated returns undead_defeated event', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    const events = ctrl.markDefeated('ant')
    expect(events.find(e => e.type === 'undead_defeated')).toBeDefined()
  })

  it('markDefeated returns level_won when no words remain and no undeads remain', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, words: ['ant'] })
    ctrl.spawn()
    const events = ctrl.markDefeated('ant')
    expect(events.find(e => e.type === 'level_won')).toBeDefined()
  })

  it('markDefeated does NOT return level_won when words remain in queue', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn() // ant
    const events = ctrl.markDefeated('ant')
    expect(events.find(e => e.type === 'level_won')).toBeUndefined()
  })

  it('markDefeated returns level_won when last undead dies with empty queue', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, words: ['ant', 'bat'] })
    ctrl.spawn() // ant
    ctrl.spawn() // bat — queue now empty
    ctrl.markDefeated('ant')
    const events = ctrl.markDefeated('bat')
    expect(events.find(e => e.type === 'level_won')).toBeDefined()
  })

  it('isWon is true after level_won emitted', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, words: ['ant'] })
    ctrl.spawn()
    ctrl.markDefeated('ant')
    expect(ctrl.isWon).toBe(true)
  })
})

describe('UndeadSiegeController — undead reaches castle', () => {
  it('undeadReachedCastle decreases castle HP by 1', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    ctrl.undeadReachedCastle('ant')
    expect(ctrl.castleHp).toBe(4)
  })

  it('undeadReachedCastle removes undead from active list', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    ctrl.undeadReachedCastle('ant')
    expect(ctrl.activeUndeads.length).toBe(0)
  })

  it('undeadReachedCastle returns castle_damaged event', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    const events = ctrl.undeadReachedCastle('ant')
    const dmg = events.find(e => e.type === 'castle_damaged')
    expect(dmg).toBeDefined()
    if (dmg?.type === 'castle_damaged') {
      expect(dmg.newHp).toBe(4)
    }
  })

  it('returns level_lost when castle HP reaches 0', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, castleHp: 1, words: ['ant', 'bat'] })
    ctrl.spawn() // ant
    ctrl.spawn() // bat
    const events = ctrl.undeadReachedCastle('ant')
    expect(events.find(e => e.type === 'level_lost')).toBeDefined()
  })

  it('isLost is true after level_lost emitted', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, castleHp: 1, words: ['ant', 'bat'] })
    ctrl.spawn()
    ctrl.spawn()
    ctrl.undeadReachedCastle('ant')
    expect(ctrl.isLost).toBe(true)
  })

  it('castle HP does not go below 0', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, castleHp: 1, words: ['ant', 'bat', 'cat'] })
    ctrl.spawn()
    ctrl.spawn()
    ctrl.spawn()
    ctrl.undeadReachedCastle('ant')  // castle reaches 0 → lost
    ctrl.undeadReachedCastle('bat')  // subsequent call should not go negative
    expect(ctrl.castleHp).toBe(0)
  })
})

describe('UndeadSiegeController — tick / movement', () => {
  it('tick moves undeads left by speed * dt', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()
    const initialX = ctrl.activeUndeads[0].x
    ctrl.tick(100)  // 100ms
    expect(ctrl.activeUndeads[0].x).toBeLessThan(initialX)
  })

  it('tick emits castle_damaged when undead crosses castleX', () => {
    const ctrl = new UndeadSiegeController({ ...baseConfig, castleX: 500 })
    ctrl.spawn()
    ;(ctrl as any)._undeads[0].x = 505  // just outside castle
    const events = ctrl.tick(1000)  // large delta to push it past
    expect(events.find(e => e.type === 'castle_damaged')).toBeDefined()
  })

  it('tick does not emit breach events when undead has not reached castleX', () => {
    const ctrl = new UndeadSiegeController(baseConfig)
    ctrl.spawn()  // spawns far right at canvasWidth + margin
    const events = ctrl.tick(16)  // one frame, 16ms — not enough to cross
    expect(events.find(e => e.type === 'castle_damaged')).toBeUndefined()
  })
})

describe('UndeadSiegeController — undead speed', () => {
  it('speed increases with worldNumber', () => {
    const slow = new UndeadSiegeController({ ...baseConfig, worldNumber: 1 })
    const fast = new UndeadSiegeController({ ...baseConfig, worldNumber: 5 })
    slow.spawn()
    fast.spawn()
    const slowX0 = slow.activeUndeads[0].x
    const fastX0 = fast.activeUndeads[0].x
    slow.tick(1000)
    fast.tick(1000)
    const slowMoved = slowX0 - slow.activeUndeads[0].x
    const fastMoved = fastX0 - fast.activeUndeads[0].x
    expect(fastMoved).toBeGreaterThan(slowMoved)
  })
})
