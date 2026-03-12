import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'

interface Slime {
  word: string
  x: number
  y: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
}

export class SlimeSplittingLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private slimes: Slime[] = []
  private activeSlime: Slime | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxSlimeReach = 0
  private hpText!: Phaser.GameObjects.Text
  private spawnTimer?: Phaser.Time.TimerEvent
  private finished = false

  constructor() { super('SlimeSplittingLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 3
    this.slimes = []
    this.activeSlime = null
    this.words = []
    this.wordQueue = []
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    this.maxSlimeReach = 80

    this.add.rectangle(width / 2, height / 2, width, height, 0x1e4a4a)

    const pProfileAvatar = loadProfile(this.profileSlot)
    generateAllCompanionTextures(this)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)

    const pProfile = loadProfile(this.profileSlot)
    const activeCompanion = pProfile?.activeCompanionId || pProfile?.activePetId
    if (activeCompanion) {
        this.add.image(180, height - 90, activeCompanion).setScale(1.5).setDepth(4)
    }


    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, { fontSize: '22px', color: '#ff4444' })
    this.add.text(width / 2, 20, this.level.name, { fontSize: '22px', color: '#ffd700' }).setOrigin(0.5, 0)

    this.engine = new TypingEngine({
      scene: this, x: width / 2, y: height - 80, fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)
    this.wordQueue = [...this.words]

    this.spawnTimer = this.time.addEvent({
      delay: 4000, loop: true, callback: this.spawnInitialSlime, callbackScope: this
    })
    this.spawnInitialSlime()
  }

  private spawnInitialSlime() {
    if (this.finished || this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    const y = Phaser.Math.Between(150, height - 150)
    this.createSlime(word, width + 30, y, 40)
  }

  private createSlime(word: string, x: number, y: number, size: number) {
    const sprite = this.add.rectangle(x, y, size, size, 0x44aaaa)
    const label = this.add.text(x, y - size / 2 - 10, word, {
      fontSize: '20px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    
    const slime: Slime = { word, x, y, speed: 40 + this.level.world * 5, sprite, label, hp: 1 }
    this.slimes.push(slime)

    if (!this.activeSlime) this.setActiveSlime(slime)
  }

  private splitWord(word: string): [string, string] {
    const mid = Math.ceil(word.length / 2)
    return [word.slice(0, mid), word.slice(mid)]
  }

  private setActiveSlime(slime: Slime | null) {
    this.activeSlime = slime
    if (slime) this.engine.setWord(slime.word)
    else this.engine.clearWord()
  }

  update(_time: number, delta: number) {
    if (this.finished) return
    this.slimes.forEach(s => {
      s.x -= s.speed * (delta / 1000)
      s.sprite.setX(s.x)
      s.label.setX(s.x)
      if (s.x <= this.maxSlimeReach) this.slimeReachedPlayer(s)
    })
  }

  private slimeReachedPlayer(slime: Slime) {
    this.removeSlime(slime)
    const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
    if (Math.random() < absorbChance) {
      const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.playerHp--
    }
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private onWordComplete(word: string, _elapsed: number) {
    const slime = this.slimes.find(s => s.word === word)
    if (slime) {
      const oldX = slime.x
      const oldY = slime.y
      this.removeSlime(slime)

      const pProfileWep = loadProfile(this.profileSlot)
      const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
      const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
      if (Math.random() < cleaveChance) {
        const nextEnemy = this.slimes.find(s => s !== slime)
        if (nextEnemy) {
          this.removeSlime(nextEnemy)
          const cleaveText = this.add.text(nextEnemy.x, nextEnemy.sprite.y - 40, 'CLEAVE!', { fontSize: '20px', color: '#ff8800' }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
        }
      }
      
      if (word.length > 2) {
        const [w1, w2] = this.splitWord(word)
        this.createSlime(w1, oldX, oldY - 40, 30)
        this.createSlime(w2, oldX, oldY + 40, 30)
      }
    }
    const next = this.slimes[0] ?? null
    this.setActiveSlime(next)

    if (this.wordQueue.length === 0 && this.slimes.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() { this.cameras.main.flash(80, 120, 0, 0) }

  private removeSlime(slime: Slime) {
    slime.sprite.destroy()
    slime.label.destroy()
    this.slimes = this.slimes.filter(s => s !== slime)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.spawnTimer?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level, profileSlot: this.profileSlot,
        accuracyStars: acc, speedStars: spd, passed
      })
    })
  }
}