// src/controllers/ProgressionController.ts
// Pure TypeScript — NO Phaser imports.

export type ProgressionEvent =
  | { type: 'next_word'; word: string }
  | { type: 'level_complete' }

export class ProgressionController {
  private queue: string[]

  constructor(words: string[]) {
    this.queue = [...words]
  }

  get wordsRemaining(): number { return this.queue.length }

  /**
   * Called after a word is completed. Dequeues the next word and returns it,
   * or returns level_complete if the queue is empty.
   */
  advance(): ProgressionEvent[] {
    if (this.queue.length === 0) {
      return [{ type: 'level_complete' }]
    }
    const word = this.queue.shift()!
    return [{ type: 'next_word', word }]
  }
}
