// src/controllers/MonsterArenaController.test.ts
import { describe, it, expect } from 'vitest'
import { MonsterArenaController } from './MonsterArenaController'

const baseConfig = {
  words: ['ant', 'bat', 'cat', 'dog', 'eel'],
  worldNumber: 1,
  canvasWidth: 1280,
  barrierX: 80,
  playerHp: 3,
}

// --------------------------------------------------------------------------
// Spawning
// --------------------------------------------------------------------------
describe('MonsterArenaController — spawnMonster', () => {
  it('returns a monster_spawned event with word and initial position', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    const events = ctrl.spawnMonster()
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('monster_spawned')
    if (events[0].type === 'monster_spawned') {
      expect(events[0].word).toBe('ant')
      expect(events[0].x).toBeGreaterThan(baseConfig.canvasWidth)
    }
  })

  it('monster starts with correct HP (min of 5 and total words)', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant', 'bat', 'cat'] })
    const events = ctrl.spawnMonster()
    if (events[0].type === 'monster_spawned') {
      expect(events[0].hp).toBe(3) // min(5, 3) = 3
    }
  })

  it('monster HP caps at 5 when there are more than 5 words', () => {
    const ctrl = new MonsterArenaController(baseConfig) // 5 words
    const events = ctrl.spawnMonster()
    if (events[0].type === 'monster_spawned') {
      expect(events[0].hp).toBe(5) // min(5, 5) = 5
    }
  })

  it('returns level_complete when word queue is exhausted', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnMonster() // consumes 'ant'
    const events = ctrl.spawnMonster()
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })

  it('returns level_complete when word queue is empty on spawn attempt', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnMonster()
    // Defeat the monster so the scene would try to spawn another
    ctrl.wordTyped('ant', 0)
    // queue is now empty, next spawn should signal level_complete
    const events = ctrl.spawnMonster()
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })

  it('monster speed scales with world number', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, worldNumber: 3 })
    ctrl.spawnMonster()
    const monster = ctrl.activeMonster!
    expect(monster.speed).toBeGreaterThan(0)
    // world 1 speed < world 3 speed
    const ctrl1 = new MonsterArenaController({ ...baseConfig, worldNumber: 1 })
    ctrl1.spawnMonster()
    expect(ctrl.activeMonster!.speed).toBeGreaterThan(ctrl1.activeMonster!.speed)
  })
})

// --------------------------------------------------------------------------
// Hit / multi-hit
// --------------------------------------------------------------------------
describe('MonsterArenaController — wordTyped (hit logic)', () => {
  it('wordTyped returns monster_hit event when monster survives', () => {
    const ctrl = new MonsterArenaController(baseConfig) // monster has HP = 5
    ctrl.spawnMonster()
    const events = ctrl.wordTyped('ant', 0)
    expect(events.find(e => e.type === 'monster_hit')).toBeDefined()
  })

  it('monster_hit event contains remaining hp and new word', () => {
    const ctrl = new MonsterArenaController(baseConfig) // HP = 5
    ctrl.spawnMonster()
    const events = ctrl.wordTyped('ant', 0)
    const hit = events.find(e => e.type === 'monster_hit')
    expect(hit).toBeDefined()
    if (hit?.type === 'monster_hit') {
      expect(hit.hpRemaining).toBe(4)
      expect(typeof hit.newWord).toBe('string')
    }
  })

  it('monster hp decreases by 1 on hit with no weapon bonus', () => {
    const ctrl = new MonsterArenaController(baseConfig) // HP = 5
    ctrl.spawnMonster()
    ctrl.wordTyped('ant', 0)
    expect(ctrl.activeMonster!.hp).toBe(4)
  })

  it('weapon power bonus reduces monster hp by extra amount', () => {
    const ctrl = new MonsterArenaController(baseConfig) // HP = 5
    ctrl.spawnMonster()
    ctrl.wordTyped('ant', 1) // powerBonus = 1 → damage = 2
    expect(ctrl.activeMonster!.hp).toBe(3)
  })

  it('wordTyped with unknown word returns empty array', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    ctrl.spawnMonster()
    const events = ctrl.wordTyped('xyz', 0)
    expect(events).toEqual([])
  })

  it('wordTyped assigns new word to monster when it survives', () => {
    const ctrl = new MonsterArenaController(baseConfig) // HP=5, queue has 5 words
    ctrl.spawnMonster() // consumes 'ant' as active word
    ctrl.wordTyped('ant', 0)
    // Monster gets next word from queue
    expect(ctrl.activeMonster!.word).toBe('bat')
  })
})

// --------------------------------------------------------------------------
// Defeat
// --------------------------------------------------------------------------
describe('MonsterArenaController — monster defeated', () => {
  it('wordTyped returns monster_defeated when HP reaches 0', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant', 'bat', 'cat', 'dog', 'eel', 'fox', 'gnu', 'hen', 'ibis', 'jay'] })
    ctrl.spawnMonster() // monster HP = 5
    // Reduce HP to 1 by typing 4 words (hits)
    ctrl.wordTyped('ant', 0)
    ctrl.wordTyped('bat', 0)
    ctrl.wordTyped('cat', 0)
    ctrl.wordTyped('dog', 0)
    // Now HP = 1, next hit kills
    const events = ctrl.wordTyped('eel', 0)
    expect(events.find(e => e.type === 'monster_defeated')).toBeDefined()
  })

  it('monster is removed from activeMonster on defeat', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant', 'bat', 'cat'] })
    // Monster has HP = 3, needs 3 hits
    ctrl.spawnMonster()
    ctrl.wordTyped('ant', 0)
    ctrl.wordTyped('bat', 0)
    const events = ctrl.wordTyped('cat', 0)
    expect(events.find(e => e.type === 'monster_defeated')).toBeDefined()
    expect(ctrl.activeMonster).toBeNull()
  })

  it('monster_defeated event contains monster x position', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnMonster()
    // Override HP to 1 for quick defeat
    ;(ctrl as any)._monster!.hp = 1
    ;(ctrl as any)._monster!.word = 'ant'
    const events = ctrl.wordTyped('ant', 0)
    const def = events.find(e => e.type === 'monster_defeated')
    expect(def).toBeDefined()
    if (def?.type === 'monster_defeated') {
      expect(typeof def.x).toBe('number')
    }
  })
})

// --------------------------------------------------------------------------
// Level complete
// --------------------------------------------------------------------------
describe('MonsterArenaController — level complete', () => {
  it('returns level_complete after defeating monster when no words remain', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnMonster() // monster HP = 1 (min(5,1))
    const events = ctrl.wordTyped('ant', 0)
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })

  it('does not return level_complete when words still remain after defeat', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant', 'bat', 'cat', 'dog', 'eel', 'fox'] })
    ctrl.spawnMonster() // HP = 5
    // Defeat the monster (5 hits), queue still has 'fox'
    ctrl.wordTyped('ant', 0)
    ctrl.wordTyped('bat', 0)
    ctrl.wordTyped('cat', 0)
    ctrl.wordTyped('dog', 0)
    const events = ctrl.wordTyped('eel', 0)
    expect(events.find(e => e.type === 'level_complete')).toBeUndefined()
    expect(events.find(e => e.type === 'monster_defeated')).toBeDefined()
  })

  it('level_complete is returned from spawnMonster when queue is empty', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, words: ['ant', 'bat'] })
    ctrl.spawnMonster() // HP = 2
    ctrl.wordTyped('ant', 0) // hit, assign 'bat'
    // Now manually set HP to 1 so next typed word kills it
    ;(ctrl as any)._monster!.hp = 1
    ;(ctrl as any)._monster!.word = 'bat'
    ctrl.wordTyped('bat', 0) // defeated, queue empty
    const events = ctrl.spawnMonster()
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })
})

// --------------------------------------------------------------------------
// Player damage
// --------------------------------------------------------------------------
describe('MonsterArenaController — monsterReachedPlayer', () => {
  it('returns player_damaged event when not blocked', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    ctrl.spawnMonster()
    const events = ctrl.monsterReachedPlayer(false)
    expect(events.find(e => e.type === 'player_damaged')).toBeDefined()
  })

  it('player_damaged event contains new playerHp', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    ctrl.spawnMonster()
    const events = ctrl.monsterReachedPlayer(false)
    const ev = events.find(e => e.type === 'player_damaged')
    if (ev?.type === 'player_damaged') {
      expect(ev.playerHp).toBe(2) // started at 3, now 2
    }
  })

  it('returns attack_blocked event when absorbed (blocked=true)', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    ctrl.spawnMonster()
    const events = ctrl.monsterReachedPlayer(true)
    expect(events.find(e => e.type === 'attack_blocked')).toBeDefined()
    expect(events.find(e => e.type === 'player_damaged')).toBeUndefined()
  })

  it('player HP does not decrease when attack is blocked', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    ctrl.spawnMonster()
    ctrl.monsterReachedPlayer(true)
    expect(ctrl.playerHp).toBe(3)
  })

  it('returns level_failed when player HP reaches 0', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, playerHp: 1 })
    ctrl.spawnMonster()
    const events = ctrl.monsterReachedPlayer(false)
    expect(events.find(e => e.type === 'level_failed')).toBeDefined()
  })

  it('removes the monster when it reaches the player', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    ctrl.spawnMonster()
    ctrl.monsterReachedPlayer(false)
    expect(ctrl.activeMonster).toBeNull()
  })

  it('does not return level_failed when player survives', () => {
    const ctrl = new MonsterArenaController(baseConfig) // HP 3
    ctrl.spawnMonster()
    const events = ctrl.monsterReachedPlayer(false) // HP → 2
    expect(events.find(e => e.type === 'level_failed')).toBeUndefined()
  })
})

// --------------------------------------------------------------------------
// Movement / tick
// --------------------------------------------------------------------------
describe('MonsterArenaController — tick', () => {
  it('tick moves the active monster left', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    ctrl.spawnMonster()
    const initialX = ctrl.activeMonster!.x
    ctrl.tick(100)
    expect(ctrl.activeMonster!.x).toBeLessThan(initialX)
  })

  it('tick returns monster_reached event when monster crosses barrierX', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, barrierX: 80 })
    ctrl.spawnMonster()
    ;(ctrl as any)._monster!.x = 85
    const events = ctrl.tick(1000)
    expect(events.find(e => e.type === 'monster_reached')).toBeDefined()
  })

  it('tick returns empty array when no active monster', () => {
    const ctrl = new MonsterArenaController(baseConfig)
    const events = ctrl.tick(100)
    expect(events).toEqual([])
  })

  it('tick does not emit monster_reached before barrierX', () => {
    const ctrl = new MonsterArenaController({ ...baseConfig, barrierX: 80 })
    ctrl.spawnMonster()
    ;(ctrl as any)._monster!.x = 500
    const events = ctrl.tick(16)
    expect(events.find(e => e.type === 'monster_reached')).toBeUndefined()
  })
})
