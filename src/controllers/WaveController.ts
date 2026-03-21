// src/controllers/WaveController.ts
// Pure TypeScript — NO Phaser imports.
import { computeSlotPositions, applySeparationForce } from '../utils/skeletonSpacing'
import { SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD } from '../constants'

export type WaveEvent =
  | { type: 'spawn'; word: string; x: number; isRiser: boolean }
  | { type: 'wave_complete'; waveNumber: number }
  | { type: 'game_complete' }
  | { type: 'skeleton_reached'; word: string }

export interface SkeletonState {
  id: string
  word: string
  x: number
  speed: number
  isRiser: boolean
}

export interface WaveConfig {
  words: string[]
  maxWaves: number
  worldNumber: number
  barrierX: number
  canvasWidth: number
  battleX?: number       // default 350, regular mode stop point
  minSpacing?: number    // default 80
  labelPad?: number      // default 24
  /** Inject a custom RNG for deterministic tests. Defaults to Math.random. */
  rng?: () => number
}

export class WaveController {
  private _currentWave = 0
  private _skeletons: SkeletonState[] = []
  private wordQueue: string[]
  private rng: () => number
  private battleX: number
  private minSpacing: number
  private labelPad: number
  private readonly speed: number

  constructor(private config: WaveConfig) {
    this.wordQueue = [...config.words]
    this.rng = config.rng ?? Math.random
    this.battleX = config.battleX ?? 350
    this.minSpacing = config.minSpacing ?? 80
    this.labelPad = config.labelPad ?? 24
    this.speed = SKELETON_SPEED_BASE + config.worldNumber * SKELETON_SPEED_PER_WORLD
  }

  get currentWave() { return this._currentWave }
  get activeSkeletons(): ReadonlyArray<SkeletonState> { return this._skeletons }
  get isComplete() {
    return this._currentWave >= this.config.maxWaves && this._skeletons.length === 0
  }

  /** Begin the next wave. Returns spawn events, one per skeleton spawned. */
  startWave(): WaveEvent[] {
    if (this._currentWave >= this.config.maxWaves) return []
    this._currentWave++

    if (this.wordQueue.length === 0) return []

    const count = Math.min(
      this.between(6, 10),
      this.wordQueue.length
    )
    const riserCount = Math.min(Math.ceil(count / 2), this.wordQueue.length)
    const marcherCount = count - riserCount

    const maxRiserX = Math.min(800, this.config.canvasWidth - 50)
    const riserSpread = riserCount > 1 ? (maxRiserX - 300) / (riserCount - 1) : 0

    const events: WaveEvent[] = []
    for (let i = 0; i < riserCount + marcherCount; i++) {
      if (this.wordQueue.length === 0) break
      const word = this.wordQueue.shift()!
      const isRiser = i < riserCount
      // Spread risers evenly across the field; add small jitter via rng
      const x = isRiser
        ? 300 + i * riserSpread + this.rng() * 30 - 15
        : this.config.canvasWidth + 30
      const id = `skel_${this._currentWave}_${i}`
      this._skeletons.push({ id, word, x, speed: this.speed, isRiser })
      events.push({ type: 'spawn', word, x, isRiser })
    }
    return events
  }

  /**
   * Advance all skeleton positions by `delta` ms.
   *
   * @param labelWidths  Actual rendered label pixel widths, one per active skeleton
   *                     in the same order as activeSkeletons. Pass this from the scene
   *                     (e.g. `this.skeletons.map(s => s.label.width)`) for accurate
   *                     spacing. If omitted, falls back to a word-length approximation.
   */
  tick(delta: number, mode: 'regular' | 'advanced', labelWidths?: number[]): WaveEvent[] {
    const events: WaveEvent[] = []
    const dt = delta / 1000
    // Resolve label widths — prefer caller-supplied values for accurate separation physics
    const widths = labelWidths ?? this._skeletons.map(s => Math.max(s.word.length * 12, 40))

    if (mode === 'advanced') {
      this._skeletons.forEach(s => { s.x -= s.speed * dt })

      // Collision detection (before separation so skeletons that reach the barrier are removed)
      const reached = this._skeletons.filter(s => s.x <= this.config.barrierX)
      reached.forEach(s => {
        events.push({ type: 'skeleton_reached', word: s.word })
        this._skeletons = this._skeletons.filter(sk => sk !== s)
      })

      // Separation force on remaining skeletons
      if (this._skeletons.length > 1) {
        const positions = this._skeletons.map(s => s.x)
        const remainWidths = this._skeletons.map((_, i) => widths[i] ?? 40)
        const separated = applySeparationForce(
          positions,
          remainWidths,
          this.labelPad,
          this.config.barrierX + 20,
          this.config.canvasWidth - 60
        )
        this._skeletons.forEach((s, i) => { s.x = separated[i] })
      }

      // Check wave/win after all collisions are resolved
      if (reached.length > 0) {
        events.push(...this.checkWaveOrWin())
      }
    } else {
      // Regular mode: skeletons walk to computed slot positions
      const targetXs = computeSlotPositions(
        widths,
        this.battleX,
        this.labelPad,
        this.minSpacing,
        this.config.canvasWidth - 60
      )
      this._skeletons.forEach((s, i) => {
        const target = targetXs[i]
        if (s.x > target) {
          s.x -= s.speed * dt
          if (s.x < target) s.x = target
        } else if (s.x < target) {
          s.x += s.speed * dt
          if (s.x > target) s.x = target
        }
      })
    }

    return events
  }

  /**
   * Mark a skeleton as defeated. Returns wave_complete or game_complete
   * if this defeat clears the wave.
   */
  markDefeated(word: string): WaveEvent[] {
    this._skeletons = this._skeletons.filter(s => s.word !== word)
    return this.checkWaveOrWin()
  }

  private checkWaveOrWin(): WaveEvent[] {
    if (this._skeletons.length > 0) return []
    if (this.wordQueue.length === 0 && this._currentWave >= this.config.maxWaves) {
      return [{ type: 'game_complete' }]
    }
    if (this._currentWave < this.config.maxWaves) {
      return [{ type: 'wave_complete', waveNumber: this._currentWave + 1 }]
    }
    return [{ type: 'game_complete' }]
  }

  private between(min: number, max: number): number {
    return min + Math.floor(this.rng() * (max - min + 1))
  }
}
