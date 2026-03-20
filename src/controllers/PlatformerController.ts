// src/controllers/PlatformerController.ts
// Pure TypeScript — NO Phaser imports.
// Manages word queue and completion count only.
// Obstacle movement is handled by Phaser tweens in the scene.

export type PlatformerEvent =
  | { type: 'all_complete' }

export class PlatformerController {
  private wordQueue: string[]
  private _wordsCompleted = 0
  private totalWords: number

  constructor(words: string[]) {
    this.wordQueue = [...words]
    this.totalWords = words.length
  }

  get wordsCompleted() { return this._wordsCompleted }
  get isComplete() { return this._wordsCompleted >= this.totalWords }
  get hasNextWord(): boolean { return this.wordQueue.length > 0 }

  /**
   * Returns the next word from the queue to assign to a spawning obstacle.
   * Returns null when the queue is exhausted.
   */
  nextWord(): string | null {
    return this.wordQueue.shift() ?? null
  }

  /**
   * Called when the player successfully types the current obstacle's word.
   * Returns events — including `all_complete` when the last word is finished.
   */
  completeWord(): PlatformerEvent[] {
    this._wordsCompleted++
    if (this._wordsCompleted >= this.totalWords) {
      return [{ type: 'all_complete' }]
    }
    return []
  }
}
