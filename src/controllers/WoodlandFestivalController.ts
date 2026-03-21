// src/controllers/WoodlandFestivalController.ts
// Pure TypeScript — NO Phaser imports.

/**
 * Interval (ms) at which the AI scores a point, per world number.
 * Formula: Math.max(1000, 3000 - world * 200)
 */
export function aiIntervalForWorld(worldNumber: number): number {
  return Math.max(1000, 3000 - worldNumber * 200)
}

export type WoodlandFestivalEvent =
  | { type: 'player_scored'; playerScore: number }
  | { type: 'ai_scored'; aiScore: number }
  | { type: 'word_changed'; word: string }
  | { type: 'level_complete'; winner: 'player' | 'ai' | 'tie' }

export interface WoodlandFestivalConfig {
  words: string[]
  worldNumber: number
}

export class WoodlandFestivalController {
  private _playerScore = 0
  private _aiScore = 0
  private _wordQueue: string[]
  private _currentWord: string | null = null
  private _finished = false

  constructor(private config: WoodlandFestivalConfig) {
    this._wordQueue = [...config.words]
    this._currentWord = this._wordQueue.shift() ?? null
  }

  get playerScore(): number { return this._playerScore }
  get aiScore(): number { return this._aiScore }
  get currentWord(): string | null { return this._currentWord }
  get wordsRemaining(): number { return this._wordQueue.length + (this._currentWord !== null ? 1 : 0) }
  get isFinished(): boolean { return this._finished }

  /**
   * The AI interval in milliseconds for this world.
   * The scene should set a Phaser timer with this delay that calls `aiTick()`.
   */
  get aiInterval(): number {
    return aiIntervalForWorld(this.config.worldNumber)
  }

  /**
   * Called by the scene's Phaser timer each interval to advance the AI score.
   * Returns ai_scored event, or empty array if the level is already finished.
   */
  aiTick(): WoodlandFestivalEvent[] {
    if (this._finished) return []
    this._aiScore++
    return [{ type: 'ai_scored', aiScore: this._aiScore }]
  }

  /**
   * Called when the player successfully types the current word.
   * Advances the word queue, increments player score.
   * Returns player_scored and word_changed events, and level_complete if all words typed.
   */
  wordTyped(): WoodlandFestivalEvent[] {
    if (this._finished || this._currentWord === null) return []

    this._playerScore++
    const events: WoodlandFestivalEvent[] = [
      { type: 'player_scored', playerScore: this._playerScore },
    ]

    const nextWord = this._wordQueue.shift() ?? null
    this._currentWord = nextWord

    if (nextWord !== null) {
      events.push({ type: 'word_changed', word: nextWord })
    } else {
      // Queue exhausted — determine winner
      this._finished = true
      const winner = this._determineWinner()
      events.push({ type: 'level_complete', winner })
    }

    return events
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _determineWinner(): 'player' | 'ai' | 'tie' {
    if (this._playerScore > this._aiScore) return 'player'
    if (this._aiScore > this._playerScore) return 'ai'
    return 'tie'
  }
}
