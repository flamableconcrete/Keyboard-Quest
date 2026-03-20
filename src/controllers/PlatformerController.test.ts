// src/controllers/PlatformerController.test.ts
import { describe, it, expect } from 'vitest'
import { PlatformerController } from './PlatformerController'

const WORDS = ['ant', 'bat', 'cat', 'dog', 'eel']

describe('PlatformerController — word queue', () => {
  it('nextWord returns the first word from the queue', () => {
    const ctrl = new PlatformerController(WORDS)
    expect(ctrl.nextWord()).toBe('ant')
  })

  it('nextWord advances the queue', () => {
    const ctrl = new PlatformerController(WORDS)
    ctrl.nextWord()
    expect(ctrl.nextWord()).toBe('bat')
  })

  it('nextWord returns null when the queue is exhausted', () => {
    const ctrl = new PlatformerController([])
    expect(ctrl.nextWord()).toBeNull()
  })

  it('hasNextWord is false when queue is empty', () => {
    const ctrl = new PlatformerController([])
    expect(ctrl.hasNextWord).toBe(false)
  })

  it('hasNextWord is true when queue has words', () => {
    const ctrl = new PlatformerController(WORDS)
    expect(ctrl.hasNextWord).toBe(true)
  })
})

describe('PlatformerController — word completion', () => {
  it('completeWord increments wordsCompleted', () => {
    const ctrl = new PlatformerController(WORDS)
    ctrl.completeWord()
    expect(ctrl.wordsCompleted).toBe(1)
  })

  it('all_complete fires when last word is completed', () => {
    const ctrl = new PlatformerController(['ant'])
    const events = ctrl.completeWord()
    expect(events.find(e => e.type === 'all_complete')).toBeDefined()
  })

  it('all_complete does NOT fire before all words are done', () => {
    const ctrl = new PlatformerController(WORDS)
    const events = ctrl.completeWord()
    expect(events.find(e => e.type === 'all_complete')).toBeUndefined()
  })

  it('isComplete is true after all words are completed', () => {
    const ctrl = new PlatformerController(['ant'])
    ctrl.completeWord()
    expect(ctrl.isComplete).toBe(true)
  })
})
