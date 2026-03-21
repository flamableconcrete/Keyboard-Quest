// src/controllers/GoblinController.ts
// Pure TypeScript — NO Phaser imports.
import { SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD, SPAWN_OFFSCREEN_MARGIN } from '../constants'

export type GoblinEvent =
  | { type: 'goblin_spawned'; word: string; x: number }
  | { type: 'goblin_defeated'; word: string; x: number }
  | { type: 'goblin_breached'; word: string; x: number }
  | { type: 'level_complete' }

export interface GoblinState {
  word: string
  x: number
  speed: number
  hp: number
}

export interface GoblinConfig {
  words: string[]
  worldNumber: number
  canvasWidth: number
  /** X position where goblin damages player (advanced mode barrier) */
  barrierX: number
  /** X position where lead goblin stops in regular mode */
  battleX: number
  /** Horizontal gap between queued goblins in regular mode */
  goblinSpacing: number
}

export class GoblinController {
  private _goblins: GoblinState[] = []
  private _activeWord: string | null = null
  private wordQueue: string[]
  private readonly speed: number

  constructor(private config: GoblinConfig) {
    this.wordQueue = [...config.words]
    this.speed = SKELETON_SPEED_BASE + config.worldNumber * SKELETON_SPEED_PER_WORLD
  }

  get activeGoblins(): ReadonlyArray<GoblinState> { return this._goblins }
  get activeWord(): string | null { return this._activeWord }
  /** Total words remaining: queued + active goblins */
  get wordsRemaining(): number { return this.wordQueue.length + this._goblins.length }

  /**
   * Called by the scene on each spawn timer tick.
   * Registers a new goblin in logical state; scene creates the sprite.
   * Returns a spawn event (or empty array if nothing was spawned).
   */
  spawnGoblin(): GoblinEvent[] {
    if (this.wordQueue.length === 0) return []

    // Don't spawn if last goblin is still near the right edge (prevents overlap)
    const lastGoblin = this._goblins[this._goblins.length - 1]
    if (lastGoblin && lastGoblin.x > this.config.canvasWidth - this.config.goblinSpacing) return []

    const word = this.wordQueue.shift()!
    const x = this.config.canvasWidth + SPAWN_OFFSCREEN_MARGIN

    const goblin: GoblinState = { word, x, speed: this.speed, hp: 1 }
    this._goblins.push(goblin)

    // Auto-focus first goblin
    if (this._activeWord === null) {
      this._activeWord = word
    }

    return [{ type: 'goblin_spawned', word, x }]
  }

  /**
   * Called when the player successfully types a word.
   * Returns defeat event(s) and possibly level_complete.
   */
  wordTyped(word: string): GoblinEvent[] {
    const goblin = this._goblins.find(g => g.word === word)
    if (!goblin) return []

    const x = goblin.x
    this._removeGoblin(goblin)

    const events: GoblinEvent[] = [{ type: 'goblin_defeated', word, x }]

    // Focus next goblin
    this._activeWord = this._goblins[0]?.word ?? null

    events.push(...this._checkLevelComplete())
    return events
  }

  /**
   * Advance goblin positions by `delta` ms.
   * Returns goblin_breached events (advanced mode) and possibly level_complete.
   */
  tick(delta: number, mode: 'regular' | 'advanced'): GoblinEvent[] {
    const events: GoblinEvent[] = []
    const dt = delta / 1000

    if (mode === 'advanced') {
      this._goblins.forEach(g => { g.x -= g.speed * dt })

      const breached = this._goblins.filter(g => g.x <= this.config.barrierX)
      breached.forEach(g => {
        events.push({ type: 'goblin_breached', word: g.word, x: g.x })
        this._removeGoblin(g)
      })

      if (breached.length > 0) {
        // Update active word if the active goblin was breached
        if (this._activeWord !== null && !this._goblins.find(g => g.word === this._activeWord)) {
          this._activeWord = this._goblins[0]?.word ?? null
        }
        events.push(...this._checkLevelComplete())
      }
    } else {
      // Regular mode: lead goblin stops at battleX, others queue behind with spacing
      this._goblins.forEach((g, i) => {
        const targetX = this.config.battleX + i * this.config.goblinSpacing
        if (g.x > targetX) {
          g.x -= g.speed * dt
          if (g.x < targetX) g.x = targetX
        }
      })
    }

    return events
  }

  /** Remove a goblin from active list by reference (internal helper). */
  removeGoblinByWord(word: string): GoblinEvent[] {
    const goblin = this._goblins.find(g => g.word === word)
    if (!goblin) return []
    const x = goblin.x
    this._removeGoblin(goblin)
    if (this._activeWord === word) {
      this._activeWord = this._goblins[0]?.word ?? null
    }
    return [{ type: 'goblin_defeated', word, x }]
  }

  /** Set all goblin speeds to 0 (time_freeze spell effect). */
  freezeGoblins(): void {
    this._goblins.forEach(g => { g.speed = 0 })
  }

  /** Restore all goblin speeds to the world-based default. */
  restoreGoblinSpeeds(): void {
    this._goblins.forEach(g => { g.speed = this.speed })
  }

  private _removeGoblin(goblin: GoblinState): void {
    this._goblins = this._goblins.filter(g => g !== goblin)
  }

  private _checkLevelComplete(): GoblinEvent[] {
    if (this.wordQueue.length === 0 && this._goblins.length === 0) {
      return [{ type: 'level_complete' }]
    }
    return []
  }
}
