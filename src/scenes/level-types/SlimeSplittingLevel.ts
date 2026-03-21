import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { BaseLevelScene } from '../BaseLevelScene'
import { DEFAULT_PLAYER_HP, GOLD_PER_KILL, SPAWN_OFFSCREEN_MARGIN } from '../../constants'
import { SlimeController, SlimeEvent, SLIME_INITIAL_SIZE, SLIME_CHILD_SIZE } from '../../controllers/SlimeController'

interface SlimeSprite {
  word: string
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
}

export class SlimeSplittingLevel extends BaseLevelScene {
  private slimeCtrl!: SlimeController
  private slimeSprites: SlimeSprite[] = []
  private hpText!: Phaser.GameObjects.Text
  private spawnTimer?: Phaser.Time.TimerEvent

  constructor() { super('SlimeSplittingLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.slimeSprites = []
  }

  create() {
    const { width, height } = this.scale

    this.slimeCtrl = new SlimeController({
      words: [...this.wordQueue],
      worldNumber: this.level.world,
      canvasWidth: width,
      canvasHeight: height,
      barrierX: 80,
      playerHp: DEFAULT_PLAYER_HP,
    })
    // The controller owns the word queue now — clear the scene's copy so
    // BaseLevelScene doesn't try to use it independently.
    this.wordQueue = []

    this.preCreate(80, height * 0.6)

    this.add.rectangle(width / 2, height / 2, width, height, 0x1e4a4a)

    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.slimeCtrl.playerHp)}`, { fontSize: '22px', color: '#ff4444' })
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.spawnTimer = this.time.addEvent({
      delay: 4000, loop: true, callback: this.spawnInitialSlime, callbackScope: this
    })
    this.spawnInitialSlime()
  }

  private spawnInitialSlime() {
    if (this.finished) return
    const { width, height } = this.scale
    const y = Phaser.Math.Between(150, height - 150)
    const x = width + SPAWN_OFFSCREEN_MARGIN
    const events = this.slimeCtrl.spawnSlime(x, y)
    this._handleEvents(events)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
    if (this.finished) return

    // Sync sprite positions from controller state
    for (const ss of this.slimeSprites) {
      const state = this.slimeCtrl.activeSlimes.find(s => s.word === ss.word)
      if (state) {
        ss.sprite.setX(state.x)
        ss.label.setX(state.x)
      }
    }

    const events = this.slimeCtrl.tick(delta)
    this._handleEvents(events)
  }

  protected onWordComplete(word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100)
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50)
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
    }

    const events = this.slimeCtrl.wordTyped(word)
    this._handleEvents(events)

    // Cleave weapon effect — happens after normal defeat logic
    const pProfileWep = loadProfile(this.profileSlot)
    const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
    const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
    if (Math.random() < cleaveChance) {
      const nextEnemy = this.slimeCtrl.activeSlimes[0]
      if (nextEnemy) {
        const ss = this.slimeSprites.find(s => s.word === nextEnemy.word)
        const spriteY = ss?.sprite.y ?? this.scale.height / 2
        const spriteX = ss?.sprite.x ?? nextEnemy.x
        const cleaveText = this.add.text(spriteX, spriteY - 40, 'CLEAVE!', { fontSize: '20px', color: '#ff8800' }).setOrigin(0.5).setDepth(3000)
        this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
        const cleaveEvents = this.slimeCtrl.removeSlimeByWord(nextEnemy.word)
        this._handleEvents(cleaveEvents)
      }
    }
  }

  protected onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }

  protected endLevel(passed: boolean) {
    this.spawnTimer?.remove()
    super.endLevel(passed)
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _handleEvents(events: SlimeEvent[]) {
    for (const ev of events) {
      switch (ev.type) {
        case 'slime_spawned':
          this._createSlimeSprite(ev.word, ev.x, ev.y, ev.size)
          break

        case 'slime_defeated':
          this._destroySlimeSprite(ev.word)
          break

        case 'slime_split':
          for (const child of ev.children) {
            this._createSlimeSprite(child.word, child.x, child.y, child.size)
          }
          break

        case 'active_word_changed':
          if (ev.word !== null) this.engine.setWord(ev.word)
          else this.engine.clearWord()
          break

        case 'player_damaged': {
          const pProfile = loadProfile(this.profileSlot)
          const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
          const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
          if (Math.random() < absorbChance) {
            // Undo the HP decrement — armor absorbed the hit
            this.slimeCtrl.restoreHp(1)
            const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
            this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
          } else {
            this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, ev.newHp))}`)
            this.cameras.main.shake(200, 0.01)
          }
          break
        }

        case 'level_won':
          this.endLevel(true)
          break

        case 'level_lost':
          this.endLevel(false)
          break
      }
    }
  }

  private _createSlimeSprite(word: string, x: number, y: number, size: number) {
    const sprite = this.add.rectangle(x, y, size, size, 0x44aaaa)
    const label = this.add.text(x, y - size / 2 - 10, word, {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    this.slimeSprites.push({ word, sprite, label })
  }

  private _destroySlimeSprite(word: string) {
    const idx = this.slimeSprites.findIndex(s => s.word === word)
    if (idx === -1) return
    const ss = this.slimeSprites[idx]
    ss.sprite.destroy()
    ss.label.destroy()
    this.slimeSprites.splice(idx, 1)
  }
}

// Re-export constants so callers have access if needed
export { SLIME_INITIAL_SIZE, SLIME_CHILD_SIZE }
