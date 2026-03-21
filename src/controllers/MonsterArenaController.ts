// src/controllers/MonsterArenaController.ts
// Pure TypeScript — NO Phaser imports.
import { SPAWN_OFFSCREEN_MARGIN } from '../constants'

export type MonsterArenaEvent =
  | { type: 'monster_spawned'; word: string; x: number; hp: number; maxHp: number }
  | { type: 'monster_hit'; hpRemaining: number; newWord: string }
  | { type: 'monster_defeated'; x: number }
  | { type: 'monster_reached' }
  | { type: 'player_damaged'; playerHp: number }
  | { type: 'attack_blocked' }
  | { type: 'level_failed' }
  | { type: 'level_complete' }

export interface MonsterState {
  word: string
  x: number
  speed: number
  hp: number
  maxHp: number
}

export interface MonsterArenaConfig {
  words: string[]
  worldNumber: number
  canvasWidth: number
  barrierX: number
  playerHp: number
}

export class MonsterArenaController {
  private _monster: MonsterState | null = null
  private wordQueue: string[]
  private _playerHp: number
  private readonly totalWords: number
  private readonly speed: number

  constructor(private config: MonsterArenaConfig) {
    this.wordQueue = [...config.words]
    this._playerHp = config.playerHp
    this.totalWords = config.words.length
    // Mirror the scene: base 20 + world * 5
    this.speed = 20 + config.worldNumber * 5
  }

  get activeMonster(): MonsterState | null { return this._monster }
  get playerHp(): number { return this._playerHp }

  /**
   * Spawn the next monster from the word queue.
   * Returns monster_spawned, or level_complete if the queue is empty.
   */
  spawnMonster(): MonsterArenaEvent[] {
    if (this.wordQueue.length === 0) {
      return [{ type: 'level_complete' }]
    }

    const word = this.wordQueue.shift()!
    const x = this.config.canvasWidth + SPAWN_OFFSCREEN_MARGIN
    const hp = Math.min(5, this.totalWords)
    const maxHp = hp

    this._monster = { word, x, speed: this.speed, hp, maxHp }

    return [{ type: 'monster_spawned', word, x, hp, maxHp }]
  }

  /**
   * Called when the player successfully types a word.
   * `powerBonus` is the weapon's power bonus (0 if no weapon equipped).
   *
   * Returns monster_hit (monster survives) or monster_defeated + possibly level_complete.
   * Returns empty array if no active monster or the word doesn't match.
   */
  wordTyped(word: string, powerBonus: number): MonsterArenaEvent[] {
    if (!this._monster || this._monster.word !== word) return []

    const damage = 1 + powerBonus
    this._monster.hp -= damage

    if (this._monster.hp <= 0) {
      const x = this._monster.x
      this._monster = null
      const events: MonsterArenaEvent[] = [{ type: 'monster_defeated', x }]
      if (this.wordQueue.length === 0) {
        events.push({ type: 'level_complete' })
      }
      return events
    }

    // Monster survives — assign next word
    if (this.wordQueue.length === 0) {
      // No more words: treat as defeated
      const x = this._monster.x
      this._monster = null
      return [{ type: 'monster_defeated', x }, { type: 'level_complete' }]
    }

    const newWord = this.wordQueue.shift()!
    this._monster.word = newWord

    return [{ type: 'monster_hit', hpRemaining: this._monster.hp, newWord }]
  }

  /**
   * Called when the monster walks to the player (reaches barrierX).
   * `blocked` is true if the armor absorbed this attack.
   * Handles: block check, player damage, level_failed.
   * Does NOT spawn the next monster (scene calls spawnMonster separately).
   */
  monsterReachedPlayer(blocked: boolean): MonsterArenaEvent[] {
    if (!this._monster) return []

    this._monster = null
    const events: MonsterArenaEvent[] = []

    if (blocked) {
      events.push({ type: 'attack_blocked' })
      return events
    }

    this._playerHp--
    events.push({ type: 'player_damaged', playerHp: this._playerHp })

    if (this._playerHp <= 0) {
      events.push({ type: 'level_failed' })
    }

    return events
  }

  /**
   * Advance monster position by `delta` ms.
   * Returns monster_reached if the monster crosses barrierX.
   * The scene should call monsterReachedPlayer() when it receives monster_reached.
   */
  tick(delta: number): MonsterArenaEvent[] {
    if (!this._monster) return []

    const dt = delta / 1000
    this._monster.x -= this._monster.speed * dt

    if (this._monster.x <= this.config.barrierX) {
      // Don't remove here — monsterReachedPlayer handles state mutation
      return [{ type: 'monster_reached' }]
    }

    return []
  }
}
