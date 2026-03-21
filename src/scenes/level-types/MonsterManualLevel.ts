// src/scenes/level-types/MonsterManualLevel.ts
import { LevelConfig } from '../../types'
import { loadProfile, saveProfile } from '../../utils/profile'
import { BaseLevelScene } from '../BaseLevelScene'
import { ProgressionController } from '../../controllers/ProgressionController'

export class MonsterManualLevel extends BaseLevelScene {
  private progression!: ProgressionController

  constructor() { super('MonsterManualLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.65)

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2a3a)

    // HUD
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    // Description text
    this.add.text(width / 2, 120, 'Monster Description:', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Create a visual paragraph
    this.add.text(width / 2, 200, this.words.join(' '), {
      fontSize: '24px', color: '#ffffff', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5, 0)

    this.progression = new ProgressionController([...this.wordQueue])
    this.wordQueue = []
    const first = this.progression.advance()
    if (first[0].type === 'next_word') this.engine.setWord(first[0].word)
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    this.spawnWordGold()
    const events = this.progression.advance()
    for (const e of events) {
      switch (e.type) {
        case 'next_word': this.engine.setWord(e.word); break
        case 'level_complete': this.endLevel(true); break
      }
    }
  }

  protected flashOnWrongKey(): void {
    // MonsterManualLevel intentionally uses a lighter/faster flash (50, 100) —
    // consistent with GuildRecruitmentLevel and WoodlandFestivalLevel which also use (50, 100, 0, 0).
    // Do not normalize to the standard (80, 120, 0, 0) without a deliberate design decision.
    this.cameras.main.flash(50, 100, 0, 0)
  }

  protected onWrongKey() {
    this.flashOnWrongKey()
  }

  protected endLevel(passed: boolean) {
    const profile = loadProfile(this.profileSlot)// Record that the player has learned the boss weakness for this world
    if (profile && passed) {
      const worldBossMap: Record<number, string> = {
        1: 'grizzlefang',
        2: 'hydra',
        3: 'clockwork_dragon',
        4: 'badrang',
        5: 'typemancer',
      }
      profile.bossWeaknessKnown = worldBossMap[this.level.world] ?? null
      saveProfile(this.profileSlot, profile)
    }

    // No star pressure for MonsterManual — override scoring by going directly to LevelResult
    // We call super.endLevel but stars will be recomputed there; the original used 5/5 hardcoded
    super.endLevel(passed)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
