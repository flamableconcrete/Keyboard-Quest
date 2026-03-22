// src/scenes/boss-types/ClockworkDragonBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

interface Gear {
  container: Phaser.GameObjects.Container
  sprite: Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle
  label: Phaser.GameObjects.Text
  word: string
  orbitRadius: number
  orbitAngle: number
}

export class ClockworkDragonBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private gears: Gear[] = []
  private totalDefeated = 0
  private targetDefeated = 0
  private wordsSpawnedInPhase = 0
  private wordsPerPhase = 0

  private bossHpText!: Phaser.GameObjects.Text

  private coreSprite!: Phaser.GameObjects.Arc

  private hp!: BossHPState
  private attackTimer?: Phaser.Time.TimerEvent

  constructor() {
    super('ClockworkDragonBoss')
  }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
    this.totalDefeated = 0
    this.targetDefeated = data.level.wordCount
    this.wordsPerPhase = Math.max(1, Math.ceil(this.targetDefeated / this.maxPhases))
    this.wordsSpawnedInPhase = 0
    this.gears = []
  }

  create() {
    const { width, height } = this.scale

    // Metallic/Dark Industrial Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a1a)

    // HUD
    this.hp = this.setupBossHP(this.targetDefeated)

    this.initWordPool()
    this.preCreate(undefined, undefined, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        bossName: this.level.bossName,
        bossNamePosition: { x: width * 0.75, y: height * 0.42 - 150 },
        phase: { current: 1, total: this.maxPhases },
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

    this.bossHpText = this.add
      .text(width * 0.75, height / 2 + 150, `Gears Jammed: ${this.totalDefeated}/${this.targetDefeated}`, {
        fontSize: '24px',
        color: '#ffcc00',
      })
      .setOrigin(0.5)

    // Dragon Core (The central point)
    this.coreSprite = this.add.circle(width * 0.75, height / 2 - 50, 60, 0x880000)
    this.coreSprite.setStrokeStyle(4, 0x555555)

    // Core visual pulsing
    this.tweens.add({
      targets: this.coreSprite,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    this.startPhase()
  }

  private startPhase() {
    this.hud!.setPhase(this.phase)
    this.wordsSpawnedInPhase = 0

    let gearsAtOnce = 3
    if (this.phase === 2) gearsAtOnce = 5
    else if (this.phase === 3) gearsAtOnce = 8

    // Distribute gears around the core
    const toSpawn = Math.min(gearsAtOnce, this.wordsPerPhase)
    for (let i = 0; i < toSpawn; i++) {
      this.spawnGear(i, gearsAtOnce)
    }

    this.cameras.main.flash(500, 255, 200, 0)
    this.updateTypingTarget()

    // Setup attack timer
    this.setupAttackTimer()
  }

  private spawnGear(indexInOrbit: number, totalInOrbit: number) {
    if (this.finished) return
    this.wordsSpawnedInPhase++

    const { width, height } = this.scale
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    const word = getWordPool(this.level.unlockedLetters, 1, difficulty, this.level.world === 1 ? 5 : undefined)[0]

    const orbitRadius = 150 + (indexInOrbit % 2) * 50
    const orbitAngle = (indexInOrbit / totalInOrbit) * Math.PI * 2

    const container = this.add.container(width * 0.75, height / 2 - 50)

    const sprite = this.add.circle(0, 0, 40, 0x777777)
    sprite.setStrokeStyle(4, 0x333333)

    // Add "teeth" to the gear placeholder
    for (let i = 0; i < 8; i++) {
      const tooth = this.add.rectangle(
        Math.cos((i * Math.PI) / 4) * 40,
        Math.sin((i * Math.PI) / 4) * 40,
        15,
        15,
        0x555555
      )
      tooth.setRotation((i * Math.PI) / 4)
      container.add(tooth)
    }

    container.add(sprite)

    const label = this.add.text(0, 0, word, {
      fontSize: '32px',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 },
      fontStyle: 'bold'
    }).setOrigin(0.5)
    container.add(label)

    const gear: Gear = {
      container,
      sprite,
      label,
      word,
      orbitRadius,
      orbitAngle
    }

    this.gears.push(gear)

    // Initial positioning
    this.updateGearPosition(gear)
  }

  private setupAttackTimer() {
    this.attackTimer?.remove()
    const delay = Math.max(2000, 5000 - this.phase * 1000)

    this.attackTimer = this.time.addEvent({
      delay,
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })
  }

  private updateGearPosition(gear: Gear) {
    const x = Math.cos(gear.orbitAngle) * gear.orbitRadius
    const y = Math.sin(gear.orbitAngle) * gear.orbitRadius
    gear.container.setPosition(this.coreSprite.x + x, this.coreSprite.y + y)
  }

  private updateTypingTarget() {
    if (this.gears.length > 0) {
      const target = this.gears[0]
      this.engine.setWord(target.word)

      // Highlight target gear
      this.gears.forEach((g, i) => {
        const isTarget = i === 0
        g.label.setColor(isTarget ? '#ffff00' : '#888888')
        g.label.setAlpha(isTarget ? 1 : 0.6)
        if (g.sprite instanceof Phaser.GameObjects.Arc) {
           g.sprite.setFillStyle(isTarget ? 0xaaaaaa : 0x777777)
        }
      })
    } else {
      this.engine.clearWord()
    }
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    if (this.finished) return

    const jammedGear = this.gears.shift()
    if (jammedGear) {
      const pProfileBoss = loadProfile(this.profileSlot)
      const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
      const powerBonus = weaponItemBoss?.effect?.power || 0
      this.totalDefeated += (1 + powerBonus)
      this.bossHpText.setText(`Gears Jammed: ${this.totalDefeated}/${this.targetDefeated}`)

      // Jamming animation
      this.tweens.add({
        targets: jammedGear.container,
        scale: 0,
        angle: 180,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          jammedGear.container.destroy()
        },
      })

      // Visual feedback on core
      this.coreSprite.setFillStyle(0xffffff)
      this.time.delayedCall(50, () => {
        if (this.coreSprite) this.coreSprite.setFillStyle(0x880000)
      })
    }

    // Spawn replacement if phase isn't done
    if (this.wordsSpawnedInPhase < this.wordsPerPhase && this.totalDefeated < this.targetDefeated) {
      const gearsAtOnce = this.phase === 1 ? 3 : this.phase === 2 ? 5 : 8
      this.spawnGear(this.wordsSpawnedInPhase, gearsAtOnce)
    }

    // Check phase transition or win
    if (this.totalDefeated >= this.targetDefeated) {
      this.endLevel(true)
    } else if (this.gears.length === 0) {
      if (this.phase < this.maxPhases) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
    } else {
      this.updateTypingTarget()
    }
  }

  private bossAttack() {
    if (this.finished) return

    // Steam burst / flash
    this.cameras.main.shake(300, 0.01)
    this.coreSprite.setScale(1.5)
    this.time.delayedCall(100, () => {
        if (this.coreSprite) this.coreSprite.setScale(1)
    })

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

    if (this.hp.playerHp <= 0) {
      this.endLevel(false)
    }
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 100, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.attackTimer?.remove()

    if (passed) {
      this.bossHpText.setText('DRAGON OVERLOADED!')
      this.gears.forEach((g) => g.container.destroy())
      this.gears = []

      // Core explosion effect
      this.tweens.add({
          targets: this.coreSprite,
          scale: 4,
          alpha: 0,
          duration: 500,
          ease: 'Cubic.easeOut'
      })
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
    if (this.finished) return

    // Base spin speed + bonus based on missing HP
    const baseSpeed = 0.001
    const hpFactor = 1 - (this.totalDefeated / this.targetDefeated)
    const spinSpeed = baseSpeed + (1 - hpFactor) * 0.005

    this.gears.forEach((gear) => {
      gear.orbitAngle += spinSpeed * delta
      this.updateGearPosition(gear)

      // Rotate the gear itself
      gear.container.setRotation(gear.container.rotation + spinSpeed * delta * 2)
    })
  }
}
