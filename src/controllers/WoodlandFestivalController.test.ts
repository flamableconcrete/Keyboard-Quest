// src/controllers/WoodlandFestivalController.test.ts
import { describe, it, expect } from 'vitest'
import { WoodlandFestivalController, aiIntervalForWorld } from './WoodlandFestivalController'

const baseConfig = {
  words: ['ant', 'bat', 'cat', 'dog', 'eel'],
  worldNumber: 1,
}

// ---------------------------------------------------------------------------
describe('aiIntervalForWorld', () => {
  it('returns 2800 for world 1 (3000 - 1*200)', () => {
    expect(aiIntervalForWorld(1)).toBe(2800)
  })

  it('returns 2000 for world 5 (3000 - 5*200)', () => {
    expect(aiIntervalForWorld(5)).toBe(2000)
  })

  it('clamps to 1000 minimum for high world numbers', () => {
    expect(aiIntervalForWorld(11)).toBe(1000)
    expect(aiIntervalForWorld(20)).toBe(1000)
  })

  it('returns 1000 exactly at world 10 (3000 - 10*200 = 1000)', () => {
    expect(aiIntervalForWorld(10)).toBe(1000)
  })
})

// ---------------------------------------------------------------------------
describe('WoodlandFestivalController — initial state', () => {
  it('starts with playerScore 0', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    expect(ctrl.playerScore).toBe(0)
  })

  it('starts with aiScore 0', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    expect(ctrl.aiScore).toBe(0)
  })

  it('currentWord is the first word in the queue', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    expect(ctrl.currentWord).toBe('ant')
  })

  it('wordsRemaining equals total words on creation', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    expect(ctrl.wordsRemaining).toBe(5)
  })

  it('isFinished starts false', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    expect(ctrl.isFinished).toBe(false)
  })

  it('aiInterval reflects world number formula', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, worldNumber: 3 })
    expect(ctrl.aiInterval).toBe(aiIntervalForWorld(3))
  })
})

// ---------------------------------------------------------------------------
describe('WoodlandFestivalController — aiTick', () => {
  it('aiTick returns ai_scored event', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    const events = ctrl.aiTick()
    expect(events.length).toBe(1)
    expect(events[0].type).toBe('ai_scored')
  })

  it('ai_scored event contains the new aiScore', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    const events = ctrl.aiTick()
    if (events[0].type === 'ai_scored') {
      expect(events[0].aiScore).toBe(1)
    }
  })

  it('aiTick increments aiScore on each call', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    ctrl.aiTick()
    ctrl.aiTick()
    ctrl.aiTick()
    expect(ctrl.aiScore).toBe(3)
  })

  it('aiTick returns empty array after level is finished', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    ctrl.wordTyped() // completes the level
    const events = ctrl.aiTick()
    expect(events).toEqual([])
  })
})

// ---------------------------------------------------------------------------
describe('WoodlandFestivalController — wordTyped', () => {
  it('wordTyped returns player_scored event', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    const events = ctrl.wordTyped()
    expect(events.find(e => e.type === 'player_scored')).toBeDefined()
  })

  it('player_scored event contains the new playerScore', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    const events = ctrl.wordTyped()
    const ev = events.find(e => e.type === 'player_scored')
    if (ev?.type === 'player_scored') {
      expect(ev.playerScore).toBe(1)
    }
  })

  it('wordTyped increments playerScore', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    ctrl.wordTyped()
    ctrl.wordTyped()
    expect(ctrl.playerScore).toBe(2)
  })

  it('wordTyped advances currentWord to next in queue', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    ctrl.wordTyped() // 'ant' → 'bat'
    expect(ctrl.currentWord).toBe('bat')
  })

  it('wordTyped returns word_changed event when words remain', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    const events = ctrl.wordTyped()
    const ev = events.find(e => e.type === 'word_changed')
    expect(ev).toBeDefined()
    if (ev?.type === 'word_changed') {
      expect(ev.word).toBe('bat')
    }
  })

  it('wordTyped decrements wordsRemaining', () => {
    const ctrl = new WoodlandFestivalController(baseConfig)
    ctrl.wordTyped()
    expect(ctrl.wordsRemaining).toBe(4)
  })

  it('wordTyped returns empty array when level already finished', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    ctrl.wordTyped()
    const events = ctrl.wordTyped()
    expect(events).toEqual([])
  })
})

// ---------------------------------------------------------------------------
describe('WoodlandFestivalController — level completion', () => {
  it('wordTyped on last word returns level_complete event', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    const events = ctrl.wordTyped()
    expect(events.find(e => e.type === 'level_complete')).toBeDefined()
  })

  it('isFinished is true after last word typed', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    ctrl.wordTyped()
    expect(ctrl.isFinished).toBe(true)
  })

  it('currentWord is null after all words typed', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    ctrl.wordTyped()
    expect(ctrl.currentWord).toBeNull()
  })

  it('wordsRemaining is 0 after level complete', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    ctrl.wordTyped()
    expect(ctrl.wordsRemaining).toBe(0)
  })

  it('level_complete does not appear until last word is typed', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant', 'bat'] })
    const events = ctrl.wordTyped() // 'ant' → 'bat' remains
    expect(events.find(e => e.type === 'level_complete')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
describe('WoodlandFestivalController — winner determination', () => {
  it('player wins when playerScore > aiScore at level end', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    // Player types 1 word, AI scores 0 → player wins
    const events = ctrl.wordTyped()
    const ev = events.find(e => e.type === 'level_complete')
    expect(ev).toBeDefined()
    if (ev?.type === 'level_complete') {
      expect(ev.winner).toBe('player')
    }
  })

  it('ai wins when aiScore > playerScore at level end', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    // AI scores 5 before player finishes
    ctrl.aiTick()
    ctrl.aiTick()
    ctrl.aiTick()
    ctrl.aiTick()
    ctrl.aiTick()
    const events = ctrl.wordTyped() // player scores only 1
    const ev = events.find(e => e.type === 'level_complete')
    expect(ev).toBeDefined()
    if (ev?.type === 'level_complete') {
      expect(ev.winner).toBe('ai')
    }
  })

  it('tie when playerScore equals aiScore at level end', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant'] })
    ctrl.aiTick() // aiScore = 1
    const events = ctrl.wordTyped() // playerScore = 1
    const ev = events.find(e => e.type === 'level_complete')
    expect(ev).toBeDefined()
    if (ev?.type === 'level_complete') {
      expect(ev.winner).toBe('tie')
    }
  })

  it('player wins a multi-word contest where player outpaces AI', () => {
    const ctrl = new WoodlandFestivalController({ ...baseConfig, words: ['ant', 'bat', 'cat'] })
    // AI scores once between words
    ctrl.wordTyped() // player 1, AI 0
    ctrl.aiTick()    // player 1, AI 1
    ctrl.wordTyped() // player 2, AI 1
    const events = ctrl.wordTyped() // player 3, AI 1 → level_complete, player wins
    const ev = events.find(e => e.type === 'level_complete')
    expect(ev).toBeDefined()
    if (ev?.type === 'level_complete') {
      expect(ev.winner).toBe('player')
    }
    expect(ctrl.isFinished).toBe(true)
  })
})
