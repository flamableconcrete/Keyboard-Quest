// src/controllers/WrongKeyAttackController.ts
// Pure TypeScript — NO Phaser imports.

export type WrongKeyEvent = { type: 'enemy_attacks' }

export interface WrongKeyConfig {
  threshold: number
}

export class WrongKeyAttackController {
  private count = 0

  constructor(private config: WrongKeyConfig) {}

  get wrongKeyCount(): number { return this.count }

  recordWrongKey(): WrongKeyEvent[] {
    this.count++
    if (this.count >= this.config.threshold) {
      this.count = 0
      return [{ type: 'enemy_attacks' }]
    }
    return []
  }
}
