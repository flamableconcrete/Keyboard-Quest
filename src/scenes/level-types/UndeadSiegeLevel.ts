import Phaser from 'phaser'
import { SiegeLevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getItem } from '../../data/items'
import { BaseLevelScene } from '../BaseLevelScene'
import { GOLD_PER_KILL, SPAWN_OFFSCREEN_MARGIN } from '../../constants'

interface Undead {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
}

export class UndeadSiegeLevel extends BaseLevelScene {
  private undeads: Undead[] = []
  private activeUndead: Undead | null = null
  private castleHp = 0
  private maxUndeadReach = 100
  private castleHpText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private spawnTimer?: Phaser.Time.TimerEvent
  private undeadsDefeated = 0
  private currentWave = 1
  private maxWaves = 3

  constructor() { super('UndeadSiegeLevel') }

  init(data: { level: SiegeLevelConfig; profileSlot: number }) {
    super.init(data)
    this.undeadsDefeated = 0
    this.castleHp = data.level.castleHp
    this.currentWave = 1
    this.undeads = []
    this.activeUndead = null
  }

  create() {
    const { width, height } = this.scale

    this.preCreate(80, height * 0.65)

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2a3a)

    // Castle
    this.add.rectangle(50, height / 2, 100, height - 200, 0x555555)

    this.castleHpText = this.add.text(20, 20, `Castle HP: ${'🛡️'.repeat(this.castleHp)}`, { fontSize: '22px', color: '#88aaff' })
    this.waveText = this.add.text(width - 20, 20, `Wave: 1/${this.maxWaves}`, { fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0)
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.spawnTimer = this.time.addEvent({
      delay: 2000, loop: true, callback: this.spawnUndead, callbackScope: this
    })
    this.spawnUndead()
  }

  private spawnUndead() {
    if (this.finished) return
    if (this.wordQueue.length === 0) {
      if (this.undeads.length === 0) this.endLevel(true)
      return
    }

    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    const y = Phaser.Math.Between(150, height - 150)
    const sprite = this.add.rectangle(width + SPAWN_OFFSCREEN_MARGIN, y, 40, 40, 0x336633)
    const label = this.add.text(width + SPAWN_OFFSCREEN_MARGIN, y - 30, word, {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)

    const undead: Undead = { word, x: width + SPAWN_OFFSCREEN_MARGIN, speed: 40 + this.level.world * 10, sprite, label, hp: 1 }
    this.undeads.push(undead)

    if (!this.activeUndead) this.setActiveUndead(undead)

    // Update wave logic simplistically based on words remaining
    const totalWords = this.words.length
    const wordsSpawned = totalWords - this.wordQueue.length
    this.currentWave = Math.min(this.maxWaves, Math.ceil((wordsSpawned / totalWords) * this.maxWaves)) || 1
    this.waveText.setText(`Wave: ${this.currentWave}/${this.maxWaves}`)
  }

  private setActiveUndead(undead: Undead | null) {
    this.activeUndead = undead
    if (undead) this.engine.setWord(undead.word)
    else this.engine.clearWord()
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
    if (this.finished) return
    this.undeads.forEach(u => {
      u.x -= u.speed * (delta / 1000)
      u.sprite.setX(u.x)
      u.label.setX(u.x)
      if (u.x <= this.maxUndeadReach) this.undeadReachedCastle(u)
    })
  }

  private undeadReachedCastle(undead: Undead) {
    this.removeUndead(undead)
    this.castleHp--
    this.castleHpText.setText(`Castle HP: ${'🛡️'.repeat(Math.max(0, this.castleHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.castleHp <= 0) this.endLevel(false)
  }

  protected onWordComplete(word: string, _elapsed: number) {
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    const undead = this.undeads.find(u => u.word === word)
    if (undead) {
      this.removeUndead(undead)
      this.undeadsDefeated++
      const pProfileWep = loadProfile(this.profileSlot)
      const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
      const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
      if (Math.random() < cleaveChance) {
        const nextEnemy = this.undeads.find(u => u !== undead)
        if (nextEnemy) {
          this.removeUndead(nextEnemy)
          this.undeadsDefeated++
          const cleaveText = this.add.text(nextEnemy.x, nextEnemy.sprite.y - 40, 'CLEAVE!', { fontSize: '20px', color: '#ff8800' }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
        }
      }
    }
    const next = this.undeads[0] ?? null
    this.setActiveUndead(next)

    if (this.wordQueue.length === 0 && this.undeads.length === 0) {
      this.endLevel(true)
    }
  }

  protected onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }

  private removeUndead(undead: Undead) {
    undead.sprite.destroy()
    undead.label.destroy()
    this.undeads = this.undeads.filter(u => u !== undead)
  }

  protected endLevel(passed: boolean) {
    this.spawnTimer?.remove()
    super.endLevel(passed)
  }
}
