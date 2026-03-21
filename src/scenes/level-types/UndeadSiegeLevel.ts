import Phaser from 'phaser'
import { SiegeLevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getItem } from '../../data/items'
import { BaseLevelScene } from '../BaseLevelScene'
import { GOLD_PER_KILL } from '../../constants'
import { UndeadSiegeController } from '../../controllers/UndeadSiegeController'

interface UndeadSprite {
  word: string
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
}

export class UndeadSiegeLevel extends BaseLevelScene {
  private siegeCtrl!: UndeadSiegeController
  private undeadSprites: UndeadSprite[] = []
  private activeUndead: UndeadSprite | null = null
  private castleHpText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private spawnTimer?: Phaser.Time.TimerEvent

  constructor() { super('UndeadSiegeLevel') }

  init(data: { level: SiegeLevelConfig; profileSlot: number }) {
    super.init(data)
    this.undeadSprites = []
    this.activeUndead = null
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.65)

    this.siegeCtrl = new UndeadSiegeController({
      words: [...this.wordQueue],
      maxWaves: (this.level as SiegeLevelConfig).waveCount,
      worldNumber: this.level.world,
      castleHp: (this.level as SiegeLevelConfig).castleHp,
      castleX: 100,
      canvasWidth: width,
    })
    // Controller manages the word queue; clear the scene's copy to avoid double-use
    this.wordQueue = []

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2a3a)

    // Castle
    this.add.rectangle(50, height / 2, 100, height - 200, 0x555555)

    this.castleHpText = this.add.text(
      20, 20,
      `Castle HP: ${'🛡️'.repeat(this.siegeCtrl.castleHp)}`,
      { fontSize: '22px', color: '#88aaff' }
    )
    this.waveText = this.add.text(
      width - 20, 20,
      `Wave: 1/${(this.level as SiegeLevelConfig).waveCount}`,
      { fontSize: '22px', color: '#ffffff' }
    ).setOrigin(1, 0)
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.spawnTimer = this.time.addEvent({
      delay: 2000, loop: true, callback: this.doSpawn, callbackScope: this
    })
    this.doSpawn()
  }

  private doSpawn() {
    if (this.finished) return

    const events = this.siegeCtrl.spawn()
    for (const ev of events) {
      if (ev.type === 'spawn') {
        const { height } = this.scale
        const y = Phaser.Math.Between(150, height - 150)
        const sprite = this.add.rectangle(ev.x, y, 40, 40, 0x336633)
        const label = this.add.text(ev.x, y - 30, ev.word, {
          fontSize: '20px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
        }).setOrigin(0.5)

        const entry: UndeadSprite = { word: ev.word, sprite, label }
        this.undeadSprites.push(entry)

        if (!this.activeUndead) this.setActiveUndead(entry)
      }
    }

    this.waveText.setText(`Wave: ${this.siegeCtrl.currentWave}/${this.siegeCtrl.maxWaves}`)
  }

  private setActiveUndead(entry: UndeadSprite | null) {
    this.activeUndead = entry
    if (entry) this.engine.setWord(entry.word)
    else this.engine.clearWord()
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
    if (this.finished) return

    const events = this.siegeCtrl.tick(delta)

    // Sync sprite positions from controller state
    for (const state of this.siegeCtrl.activeUndeads) {
      const sprite = this.undeadSprites.find(u => u.word === state.word)
      if (sprite) {
        sprite.sprite.setX(state.x)
        sprite.label.setX(state.x)
      }
    }

    for (const ev of events) {
      switch (ev.type) {
        case 'castle_damaged':
          this.removeUndeadSprite(this.undeadSprites.find(u => u.word === ev.word))
          this.castleHpText.setText(`Castle HP: ${'🛡️'.repeat(Math.max(0, ev.newHp))}`)
          this.cameras.main.shake(200, 0.01)
          break
        case 'level_lost':
          this.endLevel(false)
          break
      }
    }
  }

  protected onWordComplete(word: string, _elapsed: number) {
    if (this.finished) return

    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100)
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50)
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
    }

    const events = this.siegeCtrl.markDefeated(word)
    const sprite = this.undeadSprites.find(u => u.word === word)

    // Cleave: check weapon effect before removing sprite (need position data)
    const pProfileWep = loadProfile(this.profileSlot)
    const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
    const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
    if (Math.random() < cleaveChance) {
      const nextEnemy = this.undeadSprites.find(u => u !== sprite && this.siegeCtrl.activeUndeads.find(a => a.word === u.word))
      if (nextEnemy) {
        const cleaveEvents = this.siegeCtrl.markDefeated(nextEnemy.word)
        const cleaveText = this.add.text(
          nextEnemy.sprite.x, nextEnemy.sprite.y - 40, 'CLEAVE!',
          { fontSize: '20px', color: '#ff8800' }
        ).setOrigin(0.5).setDepth(3000)
        this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
        this.removeUndeadSprite(nextEnemy)
        events.push(...cleaveEvents)
      }
    }

    if (sprite) this.removeUndeadSprite(sprite)

    // Pick next active target
    const next = this.undeadSprites[0] ?? null
    this.setActiveUndead(next)

    for (const ev of events) {
      if (ev.type === 'level_won') {
        this.endLevel(true)
        return
      }
    }
  }

  protected onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }

  private removeUndeadSprite(entry: UndeadSprite | undefined) {
    if (!entry) return
    entry.sprite.destroy()
    entry.label.destroy()
    this.undeadSprites = this.undeadSprites.filter(u => u !== entry)
  }

  protected endLevel(passed: boolean) {
    this.spawnTimer?.remove()
    super.endLevel(passed)
  }
}
