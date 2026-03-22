// src/scenes/boss-types/SlimeKingBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

interface Slime {
  word: string
  x: number
  y: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  hp: number
  size: number
}

export class SlimeKingBoss extends BaseBossScene {
  private slimes: Slime[] = []
  private activeSlime: Slime | null = null

  private hp!: BossHPState
  private bossHpText!: Phaser.GameObjects.Text
  private attackTimer?: Phaser.Time.TimerEvent

  constructor() { super('SlimeKingBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.slimes = []
    this.activeSlime = null
  }

  create() {
    this.hp = this.setupBossHP(this.level.wordCount)
    const { width, height } = this.scale

    // Dark Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x111111)

    this.initWordPool()
    this.preCreate(undefined, undefined, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        bossName: this.level.bossName,
        bossNamePosition: { x: width * 0.75, y: height * 0.42 - 150 },
        timer: this.level.timeLimit ? {
          seconds: this.level.timeLimit,
          onExpire: () => this.endLevel(false),
        } : undefined,
        wordPool: this.wordQueue,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
        engineFontSize: BOSS_ENGINE_FONT_SIZE,
      }),
    })

    this.bossHpText = this.add.text(width * 0.75, height / 2 + 150, `Slimes: 0`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    this.spawnInitialSlime()

    // Boss Attack Timer
    this.attackTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })
  }

  private bossAttack() {
    if (this.finished || this.slimes.length === 0) return

    // Pick a random slime to "attack"
    const attacker = Phaser.Utils.Array.GetRandom(this.slimes)

    this.tweens.add({
      targets: [attacker.sprite, attacker.label],
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      duration: 100,
      onComplete: () => {
        if (this.finished) return
        const pProfile = loadProfile(this.profileSlot)
        const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
        const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
        if (Math.random() < absorbChance) {
          const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
        } else {
          this.hp.playerHp--
        }
        this.hud!.setHeroHp(this.hp.playerHp)
        this.cameras.main.shake(300, 0.01)
        if (this.hp.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private spawnInitialSlime() {
    const { width, height } = this.scale
    // Get a long word for the king
    const difficulty = Math.ceil(this.level.world / 2) + 2 // Harder words for boss
    const words = getWordPool(this.level.unlockedLetters, 1, difficulty, this.level.world === 1 ? 5 : undefined)
    const word = words[0] || 'slimeking'

    this.createSlime(word, width * 0.75, height / 2 - 50, 200)
  }

  private createSlime(word: string, x: number, y: number, size: number) {
    const sprite = this.add.rectangle(x, y, size, size, 0x44aaaa)
    const label = this.add.text(x, y, word, {
      fontSize: `${Math.max(24, size / 4)}px`, color: '#ffff00', backgroundColor: '#000000', padding: { x: 6, y: 3 }, fontStyle: 'bold'
    }).setOrigin(0.5)

    const slime: Slime = { word, x, y, speed: 0, sprite, label, hp: 1, size }
    this.slimes.push(slime)

    if (!this.activeSlime) this.setActiveSlime(slime)
    this.updateBossHp()
  }

  private setActiveSlime(slime: Slime | null) {
    this.activeSlime = slime
    if (slime) {
      this.engine.setWord(slime.word)
      // Highlight active slime
      this.slimes.forEach(s => s.sprite.setStrokeStyle(0))
      slime.sprite.setStrokeStyle(4, 0xffff00)
    } else {
      this.engine.clearWord()
    }
  }

  private updateBossHp() {
    this.bossHpText.setText(`Slimes: ${this.slimes.length}`)
  }

  protected onWordComplete(word: string, _elapsed: number) {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    if (this.finished) return

    const slime = this.slimes.find(s => s.word === word)
    if (slime) {
      const oldX = slime.x
      const oldY = slime.y
      const oldSize = slime.size
      this.removeSlime(slime)

      const pProfileWep = loadProfile(this.profileSlot)
      const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
      const powerBonus = weaponItem?.effect?.power || 0

      // Bonus power destroys extra slimes immediately
      if (powerBonus > 0) {
        for (let i = 0; i < powerBonus; i++) {
            const extraSlime = this.slimes.find(s => s !== slime)
            if (extraSlime) {
                this.removeSlime(extraSlime)
                const cleaveText = this.add.text(extraSlime.x, extraSlime.sprite.y - 40, 'CLEAVE!', { fontSize: '20px', color: '#ff8800' }).setOrigin(0.5).setDepth(3000)
                this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
            }
        }
      }

      if (word.length > 2) {
        const [w1, w2] = this.splitWord(word)
        // Offset the new slimes
        this.createSlime(w1, oldX - oldSize / 3, oldY, oldSize * 0.7)
        this.createSlime(w2, oldX + oldSize / 3, oldY, oldSize * 0.7)
      }
    }

    const next = this.slimes[0] ?? null
    this.setActiveSlime(next)

    if (this.slimes.length === 0) {
      this.endLevel(true)
    }
  }

  private splitWord(word: string): [string, string] {
    const mid = Math.ceil(word.length / 2)
    return [word.slice(0, mid), word.slice(mid)]
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  private removeSlime(slime: Slime) {
    slime.sprite.destroy()
    slime.label.destroy()
    this.slimes = this.slimes.filter(s => s !== slime)
    this.updateBossHp()
  }

  protected endLevel(passed: boolean) {
    this.attackTimer?.remove()
    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
