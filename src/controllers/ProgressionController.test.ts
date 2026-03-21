import { describe, it, expect } from 'vitest'
import { ProgressionController } from './ProgressionController'

describe('ProgressionController', () => {
  it('returns next_word with the next word in the queue', () => {
    const ctrl = new ProgressionController(['apple', 'bear', 'cat'])
    expect(ctrl.advance()).toEqual([{ type: 'next_word', word: 'apple' }])
  })

  it('returns level_complete when the queue is empty', () => {
    const ctrl = new ProgressionController([])
    expect(ctrl.advance()).toEqual([{ type: 'level_complete' }])
  })

  it('returns level_complete after the last word is dequeued', () => {
    const ctrl = new ProgressionController(['only'])
    ctrl.advance() // dequeues 'only' → returns next_word
    expect(ctrl.advance()).toEqual([{ type: 'level_complete' }])
  })

  it('tracks words remaining before each advance', () => {
    const ctrl = new ProgressionController(['a', 'b', 'c'])
    expect(ctrl.wordsRemaining).toBe(3)
    ctrl.advance()
    expect(ctrl.wordsRemaining).toBe(2)
  })

  it('advance() on empty queue is idempotent', () => {
    const ctrl = new ProgressionController([])
    ctrl.advance()
    expect(ctrl.advance()).toEqual([{ type: 'level_complete' }])
  })
})
