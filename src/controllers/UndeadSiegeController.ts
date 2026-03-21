// src/controllers/UndeadSiegeController.ts
// Pure TypeScript — NO Phaser imports.
import { SPAWN_OFFSCREEN_MARGIN } from '../constants'

/** Base speed (px/s) for undead at world 1. */
const UNDEAD_SPEED_BASE = 40
/** Additional speed per world number. */
const UNDEAD_SPEED_PER_WORLD = 10

export type SiegeEvent =
  | { type: 'spawn'; word: string; x: number }
  | { type: 'undead_defeated'; word: string }
  | { type: 'castle_damaged'; word: string; newHp: number }
  | { type: 'level_lost' }
  | { type: 'level_won' }

export interface UndeadState {
  word: string
  x: number
  speed: number
}

export interface SiegeConfig {
  words: string[]
  maxWaves: number
  worldNumber: number
  castleHp: number
  /** X position of the castle wall — undead crossing this damages it. */
  castleX: number
  canvasWidth: number
}

export class UndeadSiegeController {
  private _castleHp: number
  private _currentWave = 1
  private _isLost = false
  private _isWon = false
  private _undeads: UndeadState[] = []
  private wordQueue: string[]
  private readonly totalWords: number
  private readonly speed: number
  private readonly spawnX: number

  constructor(private config: SiegeConfig) {
    this._castleHp = config.castleHp
    this.wordQueue = [...config.words]
    this.totalWords = config.words.length
    this.speed = UNDEAD_SPEED_BASE + config.worldNumber * UNDEAD_SPEED_PER_WORLD
    this.spawnX = config.canvasWidth + SPAWN_OFFSCREEN_MARGIN
  }

  get castleHp(): number { return this._castleHp }
  get currentWave(): number { return this._currentWave }
  get maxWaves(): number { return this.config.maxWaves }
  get isLost(): boolean { return this._isLost }
  get isWon(): boolean { return this._isWon }
  get activeUndeads(): ReadonlyArray<UndeadState> { return this._undeads }

  /**
   * Spawn one undead from the word queue.
   * Returns a spawn event, or empty array if the queue is empty.
   */
  spawn(): SiegeEvent[] {
    if (this.wordQueue.length === 0) return []

    const word = this.wordQueue.shift()!
    const undead: UndeadState = { word, x: this.spawnX, speed: this.speed }
    this._undeads.push(undead)

    // Update wave display — derived from how many words have been spawned so far
    const wordsSpawned = this.totalWords - this.wordQueue.length
    this._currentWave =
      this.totalWords > 0
        ? Math.min(this.config.maxWaves, Math.ceil((wordsSpawned / this.totalWords) * this.config.maxWaves)) || 1
        : 1

    return [{ type: 'spawn', word, x: this.spawnX }]
  }

  /**
   * Advance all undead positions by `delta` ms.
   * Returns breach events for any undead that crossed the castle wall.
   */
  tick(delta: number): SiegeEvent[] {
    if (this._isLost || this._isWon) return []

    const dt = delta / 1000
    const events: SiegeEvent[] = []

    const reached: UndeadState[] = []
    for (const u of this._undeads) {
      u.x -= u.speed * dt
      if (u.x <= this.config.castleX) {
        reached.push(u)
      }
    }

    for (const u of reached) {
      events.push(...this.undeadReachedCastle(u.word))
    }

    return events
  }

  /**
   * Mark an undead as defeated by the player typing its word.
   * Returns undead_defeated and possibly level_won events.
   */
  markDefeated(word: string): SiegeEvent[] {
    if (this._isLost || this._isWon) return []

    this._undeads = this._undeads.filter(u => u.word !== word)
    const events: SiegeEvent[] = [{ type: 'undead_defeated', word }]
    events.push(...this.checkWin())
    return events
  }

  /**
   * Called when an undead reaches the castle wall (breach).
   * Decreases castle HP and checks for loss.
   */
  private undeadReachedCastle(word: string): SiegeEvent[] {
    if (this._isLost) return []

    this._undeads = this._undeads.filter(u => u.word !== word)

    if (this._castleHp > 0) {
      this._castleHp--
    }

    const events: SiegeEvent[] = [{ type: 'castle_damaged', word, newHp: this._castleHp }]

    if (this._castleHp <= 0) {
      this._isLost = true
      events.push({ type: 'level_lost' })
    }

    return events
  }

  private checkWin(): SiegeEvent[] {
    if (this.wordQueue.length === 0 && this._undeads.length === 0) {
      this._isWon = true
      return [{ type: 'level_won' }]
    }
    return []
  }
}
