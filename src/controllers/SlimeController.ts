// src/controllers/SlimeController.ts
// Pure TypeScript — NO Phaser imports.

/** Base slime movement speed (px/s) at world 1. */
const SLIME_SPEED_BASE = 40
/** Additional speed per world number. */
const SLIME_SPEED_PER_WORLD = 5

/** Size (px) of a freshly-spawned (top-level) slime. */
export const SLIME_INITIAL_SIZE = 40
/** Size (px) of child slimes spawned on split. */
export const SLIME_CHILD_SIZE = 30
/** Vertical offset (px) between the two child slimes after a split. */
export const SLIME_SPLIT_Y_OFFSET = 40

export type SlimeEvent =
  | { type: 'slime_spawned'; word: string; x: number; y: number; size: number }
  | { type: 'slime_defeated'; word: string; x: number; y: number }
  | { type: 'slime_split'; parentWord: string; children: Array<{ word: string; x: number; y: number; size: number }> }
  | { type: 'active_word_changed'; word: string | null }
  | { type: 'player_damaged'; word: string; newHp: number }
  | { type: 'level_won' }

export interface SlimeState {
  word: string
  x: number
  y: number
  speed: number
  hp: number
}

export interface SlimeConfig {
  words: string[]
  worldNumber: number
  canvasWidth: number
  canvasHeight: number
  /** X position where a slime damages the player when it crosses. */
  barrierX: number
  playerHp: number
}

export class SlimeController {
  private _slimes: SlimeState[] = []
  private _activeWord: string | null = null
  private _playerHp: number
  private _isWon = false
  readonly wordQueue: string[]
  private readonly speed: number

  constructor(private config: SlimeConfig) {
    this.wordQueue = [...config.words]
    this._playerHp = config.playerHp
    this.speed = SLIME_SPEED_BASE + config.worldNumber * SLIME_SPEED_PER_WORLD
  }

  get activeSlimes(): ReadonlyArray<SlimeState> { return this._slimes }
  get activeWord(): string | null { return this._activeWord }
  get playerHp(): number { return this._playerHp }
  get isWon(): boolean { return this._isWon }
  /** True when playerHp has reached 0 and armor has not restored it. */
  get isLost(): boolean { return this._playerHp <= 0 }

  /**
   * Dequeue one word and register it as a new slime.
   * The scene provides x/y for the spawn position (e.g., off-screen right).
   * Returns spawn event(s), or empty array if the queue is empty.
   */
  spawnSlime(x: number, y: number): SlimeEvent[] {
    if (this._isWon || this.isLost) return []
    if (this.wordQueue.length === 0) return []

    const word = this.wordQueue.shift()!
    const slime: SlimeState = { word, x, y, speed: this.speed, hp: 1 }
    this._slimes.push(slime)

    const events: SlimeEvent[] = [{ type: 'slime_spawned', word, x, y, size: SLIME_INITIAL_SIZE }]

    if (this._activeWord === null) {
      this._activeWord = word
      events.push({ type: 'active_word_changed', word })
    }

    return events
  }

  /**
   * Advance all slime positions by `delta` ms.
   * Returns player_damaged events for slimes that reach the barrier.
   * The scene should check `playerHp <= 0` after handling player_damaged to decide game-over.
   */
  tick(delta: number): SlimeEvent[] {
    if (this._isWon || this.isLost) return []

    const dt = delta / 1000
    const events: SlimeEvent[] = []

    const reached: SlimeState[] = []
    for (const s of this._slimes) {
      s.x -= s.speed * dt
      if (s.x <= this.config.barrierX) {
        reached.push(s)
      }
    }

    for (const s of reached) {
      events.push(...this._slimeReachedBarrier(s))
    }

    return events
  }

  /**
   * Called when the player successfully types a word.
   * Removes the slime, optionally splits it into children, and checks level completion.
   * Returns events for the scene to act on.
   */
  wordTyped(word: string): SlimeEvent[] {
    if (this._isWon || this.isLost) return []

    const slime = this._slimes.find(s => s.word === word)
    if (!slime) return []

    const { x, y } = slime
    this._removeSlime(slime)

    const events: SlimeEvent[] = [{ type: 'slime_defeated', word, x, y }]

    // Split if word is longer than 2 characters
    if (word.length > 2) {
      const [w1, w2] = this._splitWord(word)
      const child1: SlimeState = { word: w1, x, y: y - SLIME_SPLIT_Y_OFFSET, speed: this.speed, hp: 1 }
      const child2: SlimeState = { word: w2, x, y: y + SLIME_SPLIT_Y_OFFSET, speed: this.speed, hp: 1 }
      this._slimes.push(child1, child2)
      events.push({
        type: 'slime_split',
        parentWord: word,
        children: [
          { word: w1, x, y: y - SLIME_SPLIT_Y_OFFSET, size: SLIME_CHILD_SIZE },
          { word: w2, x, y: y + SLIME_SPLIT_Y_OFFSET, size: SLIME_CHILD_SIZE },
        ],
      })
    }

    // Update active word to first remaining slime
    const nextWord = this._slimes[0]?.word ?? null
    if (nextWord !== this._activeWord) {
      this._activeWord = nextWord
      events.push({ type: 'active_word_changed', word: nextWord })
    }

    events.push(...this._checkWin())
    return events
  }

  /**
   * Remove a slime by word (used for cleave / spell effects).
   * Does NOT split — removes the slime directly.
   */
  removeSlimeByWord(word: string): SlimeEvent[] {
    if (this._isWon || this.isLost) return []

    const slime = this._slimes.find(s => s.word === word)
    if (!slime) return []

    const { x, y } = slime
    this._removeSlime(slime)

    const events: SlimeEvent[] = [{ type: 'slime_defeated', word, x, y }]

    if (this._activeWord === word) {
      this._activeWord = this._slimes[0]?.word ?? null
      events.push({ type: 'active_word_changed', word: this._activeWord })
    }

    events.push(...this._checkWin())
    return events
  }

  /**
   * Restore playerHp by `amount` (used when armor absorbs an attack).
   * Clamps to the original starting HP.
   */
  restoreHp(amount: number): void {
    this._playerHp = Math.min(this._playerHp + amount, this.config.playerHp)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Split a word into two halves: left = first ceil(len/2) chars, right = remainder.
   * This matches the existing scene logic exactly.
   */
  private _splitWord(word: string): [string, string] {
    const mid = Math.ceil(word.length / 2)
    return [word.slice(0, mid), word.slice(mid)]
  }

  private _slimeReachedBarrier(slime: SlimeState): SlimeEvent[] {
    this._removeSlime(slime)

    if (this._playerHp > 0) {
      this._playerHp--
    }

    const events: SlimeEvent[] = [{ type: 'player_damaged', word: slime.word, newHp: this._playerHp }]

    // Update active word if needed
    const nextWord = this._slimes[0]?.word ?? null
    if (nextWord !== this._activeWord) {
      this._activeWord = nextWord
      events.push({ type: 'active_word_changed', word: nextWord })
    }

    return events
  }

  private _removeSlime(slime: SlimeState): void {
    this._slimes = this._slimes.filter(s => s !== slime)
  }

  private _checkWin(): SlimeEvent[] {
    if (this.wordQueue.length === 0 && this._slimes.length === 0) {
      this._isWon = true
      return [{ type: 'level_won' }]
    }
    return []
  }
}
