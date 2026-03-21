// src/controllers/SlimeController.test.ts
import { describe, it, expect } from 'vitest'
import { SlimeController, SLIME_INITIAL_SIZE, SLIME_CHILD_SIZE, SLIME_SPLIT_Y_OFFSET } from './SlimeController'

const baseConfig = {
  words: ['hello', 'world', 'ant', 'bat', 'cat'],
  worldNumber: 1,
  canvasWidth: 1280,
  canvasHeight: 720,
  barrierX: 80,
  playerHp: 3,
}

const SPAWN_X = baseConfig.canvasWidth + 30
const SPAWN_Y = 360

// ---------------------------------------------------------------------------
// Helper: spawn a slime and breach the barrier by manipulating internal state
// ---------------------------------------------------------------------------
function spawnAndBreach(ctrl: SlimeController, slimeIndex = 0): ReturnType<SlimeController['tick']> {
  ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
  ;(ctrl as any)._slimes[slimeIndex].x = baseConfig.barrierX + 1
  return ctrl.tick(1000)  // large delta pushes it past barrierX
}

// ---------------------------------------------------------------------------
describe('SlimeController — initial state', () => {
  it('starts with no active slimes', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl.activeSlimes.length).toBe(0)
  })

  it('starts with activeWord null', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl.activeWord).toBeNull()
  })

  it('starts with full playerHp', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl.playerHp).toBe(3)
  })

  it('isWon starts false', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl.isWon).toBe(false)
  })

  it('isLost starts false', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl.isLost).toBe(false)
  })
})

// ---------------------------------------------------------------------------
describe('SlimeController — spawning', () => {
  it('spawnSlime returns slime_spawned event with correct word, x, y, size', () => {
    const ctrl = new SlimeController(baseConfig)
    const events = ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const ev = events.find(e => e.type === 'slime_spawned')
    expect(ev).toBeDefined()
    if (ev?.type === 'slime_spawned') {
      expect(ev.word).toBe('hello')
      expect(ev.x).toBe(SPAWN_X)
      expect(ev.y).toBe(SPAWN_Y)
      expect(ev.size).toBe(SLIME_INITIAL_SIZE)
    }
  })

  it('spawnSlime adds slime to activeSlimes', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    expect(ctrl.activeSlimes.length).toBe(1)
  })

  it('spawnSlime sets activeWord on first spawn', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    expect(ctrl.activeWord).toBe('hello')
  })

  it('spawnSlime emits active_word_changed on first spawn', () => {
    const ctrl = new SlimeController(baseConfig)
    const events = ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    expect(events.find(e => e.type === 'active_word_changed')).toBeDefined()
  })

  it('spawnSlime does not change activeWord on second spawn', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    expect(ctrl.activeWord).toBe('hello')
    expect(events.find(e => e.type === 'active_word_changed')).toBeUndefined()
  })

  it('spawnSlime returns empty array when queue is exhausted', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    expect(events).toEqual([])
  })

  it('spawnSlime dequeues words in order', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y + 100)
    const words = ctrl.activeSlimes.map(s => s.word)
    expect(words[0]).toBe('hello')
    expect(words[1]).toBe('world')
  })
})

// ---------------------------------------------------------------------------
describe('SlimeController — tick / movement', () => {
  it('tick moves slimes left by speed * dt', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const initialX = ctrl.activeSlimes[0].x
    ctrl.tick(100)
    expect(ctrl.activeSlimes[0].x).toBeLessThan(initialX)
  })

  it('tick does not emit events when no slimes reach barrier', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)  // spawns far right
    const events = ctrl.tick(16)  // one frame — not enough to cross
    expect(events).toEqual([])
  })

  it('tick returns player_damaged when slime crosses barrierX', () => {
    const ctrl = new SlimeController(baseConfig)
    const events = spawnAndBreach(ctrl)
    expect(events.find(e => e.type === 'player_damaged')).toBeDefined()
  })

  it('player_damaged event has correct word and newHp', () => {
    const ctrl = new SlimeController({ ...baseConfig, playerHp: 3 })
    const events = spawnAndBreach(ctrl)
    const ev = events.find(e => e.type === 'player_damaged')
    expect(ev).toBeDefined()
    if (ev?.type === 'player_damaged') {
      expect(ev.word).toBe('hello')
      expect(ev.newHp).toBe(2)
    }
  })

  it('breach removes slime from activeSlimes', () => {
    const ctrl = new SlimeController(baseConfig)
    spawnAndBreach(ctrl)
    expect(ctrl.activeSlimes.length).toBe(0)
  })

  it('breach decrements playerHp', () => {
    const ctrl = new SlimeController(baseConfig)
    spawnAndBreach(ctrl)
    expect(ctrl.playerHp).toBe(2)
  })

  it('tick returns level_lost when playerHp reaches 0', () => {
    const ctrl = new SlimeController({ ...baseConfig, playerHp: 1, words: ['ant', 'bat'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ;(ctrl as any)._slimes[0].x = baseConfig.barrierX + 1
    const events = ctrl.tick(1000)
    expect(events.find(e => e.type === 'level_lost')).toBeDefined()
  })

  it('isLost is true after level_lost', () => {
    const ctrl = new SlimeController({ ...baseConfig, playerHp: 1, words: ['ant'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ;(ctrl as any)._slimes[0].x = baseConfig.barrierX + 1
    ctrl.tick(1000)
    expect(ctrl.isLost).toBe(true)
  })

  it('tick does nothing when level is already lost', () => {
    const ctrl = new SlimeController({ ...baseConfig, playerHp: 1, words: ['ant', 'bat'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ;(ctrl as any)._slimes[0].x = baseConfig.barrierX + 1
    ctrl.tick(1000)  // loses
    const events = ctrl.tick(1000)
    expect(events).toEqual([])
  })

  it('breach emits active_word_changed when breached slime was the active target', () => {
    const ctrl = new SlimeController(baseConfig)
    const events = spawnAndBreach(ctrl)
    expect(events.find(e => e.type === 'active_word_changed')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
describe('SlimeController — word typed / defeat + splitting', () => {
  it('wordTyped returns slime_defeated event', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('hello')
    expect(events.find(e => e.type === 'slime_defeated')).toBeDefined()
  })

  it('slime_defeated event contains word and position', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('hello')
    const ev = events.find(e => e.type === 'slime_defeated')
    if (ev?.type === 'slime_defeated') {
      expect(ev.word).toBe('hello')
      expect(typeof ev.x).toBe('number')
      expect(typeof ev.y).toBe('number')
    }
  })

  it('wordTyped with unknown word returns empty array', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('zzz')
    expect(events).toEqual([])
  })

  it('slime longer than 2 chars splits into two children', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)  // 'hello'
    const events = ctrl.wordTyped('hello')
    expect(events.find(e => e.type === 'slime_split')).toBeDefined()
    expect(ctrl.activeSlimes.length).toBe(2)
  })

  it('slime_split event contains correct child words (ceil split)', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)  // 'hello' → ceil(5/2)=3 → 'hel' + 'lo'
    const events = ctrl.wordTyped('hello')
    const ev = events.find(e => e.type === 'slime_split')
    expect(ev).toBeDefined()
    if (ev?.type === 'slime_split') {
      expect(ev.children[0].word).toBe('hel')
      expect(ev.children[1].word).toBe('lo')
    }
  })

  it('slime_split children have SLIME_CHILD_SIZE', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('hello')
    const ev = events.find(e => e.type === 'slime_split')
    if (ev?.type === 'slime_split') {
      expect(ev.children[0].size).toBe(SLIME_CHILD_SIZE)
      expect(ev.children[1].size).toBe(SLIME_CHILD_SIZE)
    }
  })

  it('child slimes spawn at parent x, offset by SLIME_SPLIT_Y_OFFSET', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('hello')
    const ev = events.find(e => e.type === 'slime_split')
    if (ev?.type === 'slime_split') {
      expect(ev.children[0].x).toBe(SPAWN_X)
      expect(ev.children[0].y).toBe(SPAWN_Y - SLIME_SPLIT_Y_OFFSET)
      expect(ev.children[1].x).toBe(SPAWN_X)
      expect(ev.children[1].y).toBe(SPAWN_Y + SLIME_SPLIT_Y_OFFSET)
    }
  })

  it('2-char slime does NOT split', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ab'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)  // 'ab'
    const events = ctrl.wordTyped('ab')
    expect(events.find(e => e.type === 'slime_split')).toBeUndefined()
    expect(ctrl.activeSlimes.length).toBe(0)
  })

  it('1-char slime does NOT split', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['a'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('a')
    expect(events.find(e => e.type === 'slime_split')).toBeUndefined()
    expect(ctrl.activeSlimes.length).toBe(0)
  })

  it('3-char slime splits: ceil(3/2)=2 → first 2 chars + last 1 char', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ant'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('ant')
    const ev = events.find(e => e.type === 'slime_split')
    expect(ev).toBeDefined()
    if (ev?.type === 'slime_split') {
      expect(ev.children[0].word).toBe('an')
      expect(ev.children[1].word).toBe('t')
    }
  })

  it('wordTyped updates activeWord to next slime', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)      // 'hello'
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y + 50) // 'world'
    ctrl.wordTyped('hello')
    // After typing 'hello', children 'hel'/'lo' are pushed; activeSlimes[0] is 'world'
    expect(ctrl.activeWord).toBe('world')
  })

  it('wordTyped emits active_word_changed when active slime is defeated', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y + 50)
    const events = ctrl.wordTyped('hello')
    expect(events.find(e => e.type === 'active_word_changed')).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
describe('SlimeController — level completion', () => {
  it('returns level_won when last slime (no split) is defeated and queue is empty', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ab'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('ab')
    expect(events.find(e => e.type === 'level_won')).toBeDefined()
  })

  it('isWon is true after level_won', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ab'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ctrl.wordTyped('ab')
    expect(ctrl.isWon).toBe(true)
  })

  it('does NOT return level_won when children remain after split', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['hello'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.wordTyped('hello')
    expect(events.find(e => e.type === 'level_won')).toBeUndefined()
    expect(ctrl.isWon).toBe(false)
  })

  it('returns level_won after defeating all slimes including children', () => {
    // Word: 'hello' (len 5) → split: 'hel' + 'lo'
    // slimes after typing 'hello': ['hel', 'lo']  (children pushed in order)
    // Type 'hel' (len 3) → split: 'he' + 'l'
    //   slimes: ['lo', 'he', 'l']  ('lo' was already there at index 0)
    // Type 'lo' (len 2) → no split
    //   slimes: ['he', 'l']
    // Type 'he' (len 2) → no split
    //   slimes: ['l']
    // Type 'l' (len 1) → no split → level_won
    const ctrl = new SlimeController({ ...baseConfig, words: ['hello'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ctrl.wordTyped('hello')  // splits → children: 'hel', 'lo'
    ctrl.wordTyped('hel')    // splits → children: 'he', 'l'; slimes: ['lo','he','l']
    ctrl.wordTyped('lo')     // no split; slimes: ['he', 'l']
    ctrl.wordTyped('he')     // no split (len 2); slimes: ['l']
    const events = ctrl.wordTyped('l')  // no split, last slime → level_won
    expect(events.find(e => e.type === 'level_won')).toBeDefined()
  })

  it('does NOT return level_won when queue still has words', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ab', 'cd'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)  // 'ab'
    const events = ctrl.wordTyped('ab')
    expect(events.find(e => e.type === 'level_won')).toBeUndefined()
  })

  it('wordTyped returns empty array after level is already won', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ab'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    ctrl.wordTyped('ab')
    const events = ctrl.wordTyped('ab')
    expect(events).toEqual([])
  })
})

// ---------------------------------------------------------------------------
describe('SlimeController — removeSlimeByWord (cleave / spell)', () => {
  it('removeSlimeByWord removes slime without splitting', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)  // 'hello'
    const events = ctrl.removeSlimeByWord('hello')
    expect(ctrl.activeSlimes.length).toBe(0)
    expect(events.find(e => e.type === 'slime_split')).toBeUndefined()
  })

  it('removeSlimeByWord returns slime_defeated event', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.removeSlimeByWord('hello')
    expect(events.find(e => e.type === 'slime_defeated')).toBeDefined()
  })

  it('removeSlimeByWord returns empty array for unknown word', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    expect(ctrl.removeSlimeByWord('zzz')).toEqual([])
  })

  it('removeSlimeByWord returns level_won when last slime removed and queue empty', () => {
    const ctrl = new SlimeController({ ...baseConfig, words: ['ab'] })
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)
    const events = ctrl.removeSlimeByWord('ab')
    expect(events.find(e => e.type === 'level_won')).toBeDefined()
  })

  it('removeSlimeByWord updates activeWord when active slime is removed', () => {
    const ctrl = new SlimeController(baseConfig)
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y)       // 'hello'
    ctrl.spawnSlime(SPAWN_X, SPAWN_Y + 50)  // 'world'
    ctrl.removeSlimeByWord('hello')
    expect(ctrl.activeWord).toBe('world')
  })
})

// ---------------------------------------------------------------------------
describe('SlimeController — _splitWord', () => {
  it('splits even-length word equally', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl._splitWord('abcd')).toEqual(['ab', 'cd'])
  })

  it('splits odd-length word with first half larger', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl._splitWord('hello')).toEqual(['hel', 'lo'])
  })

  it('splits 3-char word: first 2 + last 1', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl._splitWord('ant')).toEqual(['an', 't'])
  })

  it('splits 2-char word: first 1 + last 1', () => {
    const ctrl = new SlimeController(baseConfig)
    expect(ctrl._splitWord('ab')).toEqual(['a', 'b'])
  })
})

// ---------------------------------------------------------------------------
describe('SlimeController — speed', () => {
  it('slime speed scales with worldNumber', () => {
    const slow = new SlimeController({ ...baseConfig, worldNumber: 1 })
    const fast = new SlimeController({ ...baseConfig, worldNumber: 5 })
    slow.spawnSlime(SPAWN_X, SPAWN_Y)
    fast.spawnSlime(SPAWN_X, SPAWN_Y)
    const slowX0 = slow.activeSlimes[0].x
    const fastX0 = fast.activeSlimes[0].x
    slow.tick(1000)
    fast.tick(1000)
    expect(slowX0 - slow.activeSlimes[0].x).toBeLessThan(fastX0 - fast.activeSlimes[0].x)
  })
})
