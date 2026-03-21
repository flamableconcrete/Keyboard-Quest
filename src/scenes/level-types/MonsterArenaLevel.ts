import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { BaseLevelScene } from '../BaseLevelScene'
import { DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { MonsterArenaController } from '../../controllers/MonsterArenaController'

interface MonsterVisual {
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
}

export class MonsterArenaLevel extends BaseLevelScene {
  private monsterCtrl!: MonsterArenaController
  private monsterVisual: MonsterVisual | null = null
  private maxMonsterReach = 0
  private hpText!: Phaser.GameObjects.Text
  private monsterHpText!: Phaser.GameObjects.Text

  constructor() { super('MonsterArenaLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.monsterVisual = null
  }

  create() {
    const { width, height } = this.scale
    this.maxMonsterReach = 80

    this.preCreate(width * 0.2, height / 2)

    this.add.rectangle(width / 2, height / 2, width, height, 0x4a1e1e)

    this.monsterCtrl = new MonsterArenaController({
      words: [...this.wordQueue],
      worldNumber: this.level.world,
      canvasWidth: width,
      barrierX: this.maxMonsterReach,
      playerHp: DEFAULT_PLAYER_HP,
    })
    // wordQueue is now managed by controller; clear scene's copy to avoid double-consumption
    this.wordQueue = []

    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(DEFAULT_PLAYER_HP)}`, { fontSize: '22px', color: '#ff4444' })
    this.monsterHpText = this.add.text(width - 20, 20, '', { fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0)
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.doSpawnMonster()
  }

  private doSpawnMonster() {
    if (this.finished) return

    const events = this.monsterCtrl.spawnMonster()
    for (const ev of events) {
      switch (ev.type) {
        case 'monster_spawned':
          this.createMonsterVisual(ev.word, ev.x, ev.hp, ev.maxHp)
          this.engine.setWord(ev.word)
          break
        case 'level_complete':
          this.endLevel(true)
          break
      }
    }
  }

  private createMonsterVisual(word: string, x: number, hp: number, maxHp: number) {
    const { height } = this.scale
    const y = height / 2
    const sprite = this.add.rectangle(x, y, 100, 100, 0xaa2222)
    const label = this.add.text(x, y - 60, word, {
      fontSize: '24px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    this.monsterVisual = { sprite, label }
    this.monsterHpText.setText(`Monster HP: ${hp}/${maxHp}`)
  }

  private destroyMonsterVisual() {
    if (this.monsterVisual) {
      this.monsterVisual.sprite.destroy()
      this.monsterVisual.label.destroy()
      this.monsterVisual = null
    }
    this.monsterHpText.setText('')
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
    if (this.finished) return

    const tickEvents = this.monsterCtrl.tick(delta)
    for (const ev of tickEvents) {
      switch (ev.type) {
        case 'monster_reached':
          this.handleMonsterReached()
          break
      }
    }

    // Sync visual position from controller state
    const m = this.monsterCtrl.activeMonster
    if (m && this.monsterVisual) {
      this.monsterVisual.sprite.setX(m.x)
      this.monsterVisual.label.setX(m.x)
    }
  }

  private handleMonsterReached() {
    const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0

    this.destroyMonsterVisual()

    const events = this.monsterCtrl.monsterReachedPlayer(Math.random() < absorbChance)
    for (const ev of events) {
      switch (ev.type) {
        case 'attack_blocked': {
          this.cameras.main.shake(200, 0.01)
          const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
          break
        }
        case 'player_damaged':
          this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, ev.playerHp))}`)
          this.cameras.main.shake(200, 0.01)
          break
        case 'level_failed':
          this.endLevel(false)
          return
      }
    }

    // If player survived, spawn next monster
    this.doSpawnMonster()
  }

  protected onWordComplete(word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100)
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50)
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
    }

    const pProfileWep = loadProfile(this.profileSlot)
    const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
    const powerBonus = weaponItem?.effect?.power || 0

    const events = this.monsterCtrl.wordTyped(word, powerBonus)
    for (const ev of events) {
      switch (ev.type) {
        case 'monster_hit':
          this.monsterHpText.setText(`Monster HP: ${ev.hpRemaining}/${this.monsterCtrl.activeMonster?.maxHp ?? ev.hpRemaining}`)
          if (this.monsterVisual) this.monsterVisual.label.setText(ev.newWord)
          this.engine.setWord(ev.newWord)
          break
        case 'monster_defeated':
          this.destroyMonsterVisual()
          this.engine.clearWord()
          break
        case 'level_complete':
          this.endLevel(true)
          return
      }
    }

    // If monster was defeated and level not complete, spawn next
    if (events.find(e => e.type === 'monster_defeated') && !events.find(e => e.type === 'level_complete')) {
      this.doSpawnMonster()
    }
  }

  protected onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }
}
