// src/controllers/GoblinController.test.ts
import { describe, it, expect } from 'vitest'
import { GoblinController } from './GoblinController'
import { SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD } from '../constants'

const baseConfig = {
  words: ['ant', 'bat', 'cat', 'dog', 'eel'],
  worldNumber: 1,
  canvasWidth: 1280,
  barrierX: 80,
  battleX: 300,
  goblinSpacing: 120,
}

describe('GoblinController — spawning', () => {
  it('spawnGoblin returns a spawn event with word and x', () => {
    const ctrl = new GoblinController(baseConfig)
    const events = ctrl.spawnGoblin()
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('goblin_spawned')
    if (events[0].type === 'goblin_spawned') {
      expect(events[0].word).toBe('ant')
      expect(events[0].x).toBeGreaterThan(baseConfig.canvasWidth)
    }
  })

  it('spawn assigns correct speed based on world', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    const goblins = ctrl.activeGoblins
    expect(goblins[0].speed).toBe(SKELETON_SPEED_BASE + baseConfig.worldNumber * SKELETON_SPEED_PER_WORLD)
  })

  it('spawnGoblin returns empty array when word queue is exhausted', () => {
    const ctrl = new GoblinController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnGoblin()
    const events = ctrl.spawnGoblin()
    expect(events).toEqual([])
  })

  it('first spawned goblin becomes the active target', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    expect(ctrl.activeWord).toBe('ant')
  })

  it('second spawn does not change the active target', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    ctrl.spawnGoblin()
    expect(ctrl.activeWord).toBe('ant')
  })

  it('spawnGoblin skips if last goblin is still too close to right edge', () => {
    const ctrl = new GoblinController({ ...baseConfig, canvasWidth: 400, goblinSpacing: 120 })
    ctrl.spawnGoblin()
    // Place the last goblin near the right edge
    ;(ctrl as any)._goblins[0].x = 400 - 120 + 10
    const events = ctrl.spawnGoblin()
    expect(events).toEqual([])
  })
})

describe('GoblinController — word typed / defeat', () => {
  it('wordTyped with correct word returns goblin_defeated event', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    const events = ctrl.wordTyped('ant')
    expect(events.find(e => e.type === 'goblin_defeated')).toBeDefined()
  })

  it('wordTyped removes the goblin from active list', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    ctrl.wordTyped('ant')
    expect(ctrl.activeGoblins.length).toBe(0)
  })

  it('goblin_defeated event contains the defeated goblin x and word', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    const events = ctrl.wordTyped('ant')
    const evt = events.find(e => e.type === 'goblin_defeated')
    expect(evt).toBeDefined()
    if (evt?.type === 'goblin_defeated') {
      expect(evt.word).toBe('ant')
      expect(typeof evt.x).toBe('number')
    }
  })

  it('wordTyped with unknown word returns empty array', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    const events = ctrl.wordTyped('xyz')
    expect(events).toEqual([])
  })

  it('wordTyped focuses next goblin after defeat', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()  // 'ant'
    // Move goblin left so second spawn is not blocked
    ;(ctrl as any)._goblins[0].x = 500
    ctrl.spawnGoblin()  // 'bat'
    ctrl.wordTyped('ant')
    expect(ctrl.activeWord).toBe('bat')
  })

  it('returns level_complete when all words are typed and no goblins remain', () => {
    const ctrl = new GoblinController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnGoblin()
    const events = ctrl.wordTyped('ant')
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })

  it('does not return level_complete when word queue is empty but goblins still active', () => {
    const ctrl = new GoblinController({ ...baseConfig, words: ['ant', 'bat'] })
    ctrl.spawnGoblin()  // 'ant' spawned
    ctrl.spawnGoblin()  // 'bat' spawned, queue now empty
    const events = ctrl.wordTyped('ant')
    expect(events.find(e => e.type === 'level_complete')).toBeUndefined()
  })
})

describe('GoblinController — tick / movement', () => {
  it('tick moves goblins left in advanced mode', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    const initialX = ctrl.activeGoblins[0].x
    ctrl.tick(100, 'advanced')
    expect(ctrl.activeGoblins[0].x).toBeLessThan(initialX)
  })

  it('tick returns goblin_breached when goblin crosses barrierX in advanced mode', () => {
    const ctrl = new GoblinController({ ...baseConfig, barrierX: 80 })
    ctrl.spawnGoblin()
    ;(ctrl as any)._goblins[0].x = 85
    const events = ctrl.tick(1000, 'advanced')
    expect(events.find(e => e.type === 'goblin_breached')).toBeDefined()
  })

  it('goblin_breached event contains the goblin word and x', () => {
    const ctrl = new GoblinController({ ...baseConfig, barrierX: 80 })
    ctrl.spawnGoblin()
    ;(ctrl as any)._goblins[0].x = 85
    const events = ctrl.tick(1000, 'advanced')
    const evt = events.find(e => e.type === 'goblin_breached')
    expect(evt).toBeDefined()
    if (evt?.type === 'goblin_breached') {
      expect(evt.word).toBe('ant')
    }
  })

  it('tick removes breached goblin from active list', () => {
    const ctrl = new GoblinController({ ...baseConfig, barrierX: 80 })
    ctrl.spawnGoblin()
    ;(ctrl as any)._goblins[0].x = 85
    ctrl.tick(1000, 'advanced')
    expect(ctrl.activeGoblins.length).toBe(0)
  })

  it('tick returns level_complete after breach clears last goblin and queue is empty', () => {
    const ctrl = new GoblinController({ ...baseConfig, words: ['ant'], barrierX: 80 })
    ctrl.spawnGoblin()
    ;(ctrl as any)._goblins[0].x = 85
    const events = ctrl.tick(1000, 'advanced')
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })

  it('regular mode: lead goblin stops at battleX', () => {
    const ctrl = new GoblinController({ ...baseConfig, battleX: 300 })
    ctrl.spawnGoblin()
    ctrl.tick(100000, 'regular')
    // Lead goblin (index 0) should not go past battleX
    expect(ctrl.activeGoblins[0].x).toBeGreaterThanOrEqual(300)
  })

  it('regular mode: second goblin queues behind first with spacing', () => {
    const ctrl = new GoblinController({ ...baseConfig, battleX: 300, goblinSpacing: 120 })
    ctrl.spawnGoblin()  // 'ant'
    // Move first goblin left so second spawn is not blocked by right-edge check
    ;(ctrl as any)._goblins[0].x = 500
    ctrl.spawnGoblin()  // 'bat'
    ctrl.tick(100000, 'regular')
    const goblins = ctrl.activeGoblins
    // Lead goblin (index 0) stops at battleX, second at battleX + spacing
    expect(goblins[0].x).toBeCloseTo(300, 0)
    expect(goblins[1].x).toBeCloseTo(420, 0)
  })

  it('tick in regular mode does not emit goblin_breached', () => {
    const ctrl = new GoblinController({ ...baseConfig, battleX: 300 })
    ctrl.spawnGoblin()
    const events = ctrl.tick(100000, 'regular')
    expect(events.find(e => e.type === 'goblin_breached')).toBeUndefined()
  })
})

describe('GoblinController — removeGoblinByWord', () => {
  it('removeGoblinByWord returns goblin_defeated event', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    const events = ctrl.removeGoblinByWord('ant')
    expect(events.find(e => e.type === 'goblin_defeated')).toBeDefined()
  })

  it('removeGoblinByWord returns empty array for unknown word', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    expect(ctrl.removeGoblinByWord('xyz')).toEqual([])
  })

  it('removeGoblinByWord returns level_complete when last goblin is removed', () => {
    const ctrl = new GoblinController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnGoblin()
    const events = ctrl.removeGoblinByWord('ant')
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })

  it('removeGoblinByWord does not return level_complete when goblins or queue remain', () => {
    const ctrl = new GoblinController({ ...baseConfig, words: ['ant', 'bat'] })
    ctrl.spawnGoblin()  // 'ant' spawned, 'bat' still in queue
    const events = ctrl.removeGoblinByWord('ant')
    expect(events.find(e => e.type === 'level_complete')).toBeUndefined()
  })
})

describe('GoblinController — freeze / speed restore', () => {
  it('freezeGoblins sets all speeds to 0', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    ctrl.spawnGoblin()
    ctrl.freezeGoblins()
    ctrl.activeGoblins.forEach(g => expect(g.speed).toBe(0))
  })

  it('restoreGoblinSpeeds restores to world-based speed', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    ctrl.freezeGoblins()
    ctrl.restoreGoblinSpeeds()
    const expected = SKELETON_SPEED_BASE + baseConfig.worldNumber * SKELETON_SPEED_PER_WORLD
    ctrl.activeGoblins.forEach(g => expect(g.speed).toBe(expected))
  })
})

describe('GoblinController — misc', () => {
  it('activeGoblins is read-only (returns a copy)', () => {
    const ctrl = new GoblinController(baseConfig)
    ctrl.spawnGoblin()
    const snapshot = ctrl.activeGoblins
    expect(snapshot.length).toBe(1)
  })

  it('wordsRemaining counts queued + active goblins', () => {
    const ctrl = new GoblinController({ ...baseConfig, words: ['ant', 'bat', 'cat'] })
    ctrl.spawnGoblin()  // 'ant' in active, 'bat','cat' in queue
    expect(ctrl.wordsRemaining).toBe(3)
  })
})
