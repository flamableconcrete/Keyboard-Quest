// src/scenes/boss-types/SpiderBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

interface WebLine {
  index: number;
  angle: number;
  letter: string;
  isCut: boolean;
  textObject?: Phaser.GameObjects.Text;
}

export class SpiderBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private lettersToSpawn = 0
  private lettersSpawned = 0

  private bossSprite!: Phaser.GameObjects.Arc
  private bossHpText!: Phaser.GameObjects.Text
  private webGraphics!: Phaser.GameObjects.Graphics

  private lines: WebLine[] = []
  private activeLetterQueue: WebLine[] = []

  private hp!: BossHPState
  private spawnTimer?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent

  constructor() { super('SpiderBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
    this.lettersSpawned = 0
    this.activeLetterQueue = []

    this.lettersToSpawn = data.level.wordCount
  }

  create() {
    this.hp = this.setupBossHP(Math.ceil(this.level.wordCount / 8))
    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2

    // Dark Background
    this.add.rectangle(centerX, centerY, width, height, 0x0a0a1a)

    this.initWordPool()
    this.preCreate(undefined, undefined, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        bossName: this.level.bossName,
        bossNamePosition: { x: centerX, y: (centerY) - 150 },
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

    // Web Graphics
    this.webGraphics = this.add.graphics()
    this.initWeb()

    // Spider (Boss Sprite)
    this.bossSprite = this.add.circle(centerX, centerY, 40, 0x333333)
    this.add.circle(centerX - 15, centerY - 10, 5, 0xff0000) // Eye
    this.add.circle(centerX + 15, centerY - 10, 5, 0xff0000) // Eye

    this.bossHpText = this.add.text(centerX, centerY + 150, `Spider HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#8800ff'
    }).setOrigin(0.5)

    this.startPhase()
    this.drawWeb()
  }

  private initWeb() {
    this.lines = []
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8
      this.lines.push({
        index: i,
        angle: angle,
        letter: '',
        isCut: false
      })
    }
  }

  private drawWeb() {
    this.webGraphics.clear()
    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2
    const radius = 250

    // Draw Octagon
    this.webGraphics.lineStyle(2, 0x444466, 0.5)
    this.webGraphics.beginPath()
    for (let i = 0; i <= 8; i++) {
      const angle = (i * Math.PI * 2) / 8
      const px = centerX + Math.cos(angle) * radius
      const py = centerY + Math.sin(angle) * radius
      if (i === 0) this.webGraphics.moveTo(px, py)
      else this.webGraphics.lineTo(px, py)
    }
    this.webGraphics.strokePath()

    // Draw Radial Lines
    this.lines.forEach(line => {
      const alpha = line.isCut ? 0.1 : 0.8
      const color = line.isCut ? 0x222233 : 0xcccccc
      this.webGraphics.lineStyle(line.isCut ? 1 : 3, color, alpha)
      this.webGraphics.lineBetween(
        centerX, centerY,
        centerX + Math.cos(line.angle) * radius,
        centerY + Math.sin(line.angle) * radius
      )
    })
  }

  private startPhase() {
    this.hud!.setPhase(this.phase)

    // Setup spawn timer
    this.spawnTimer?.remove()
    this.spawnTimer = this.time.addEvent({
      delay: Math.max(800, 2500 - (this.phase * 500)),
      loop: true,
      callback: this.spawnLetter,
      callbackScope: this
    })

    // Setup attack timer
    this.attackTimer?.remove()
    this.attackTimer = this.time.addEvent({
      delay: Math.max(1000, 3000 - (this.phase * 400)),
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })

    this.cameras.main.flash(500, 100, 0, 200)
  }

  private spawnLetter() {
    if (this.finished || this.lettersSpawned >= this.lettersToSpawn) return

    // Phase 1 & 2: only 1 letter on screen at a time
    if (this.phase < 3 && this.activeLetterQueue.length > 0) return

    const availableLines = this.lines.filter(l => !l.isCut && l.letter === '')
    if (availableLines.length === 0) return

    const line = Phaser.Utils.Array.GetRandom(availableLines)
    const letter = getWordPool(this.level.unlockedLetters, 1, 1, this.level.world === 1 ? 5 : undefined)[0].charAt(0)

    line.letter = letter
    this.lettersSpawned++

    const radius = 180
    const { width, height } = this.scale
    const lx = width / 2 + Math.cos(line.angle) * radius
    const ly = height / 2 + Math.sin(line.angle) * radius

    line.textObject = this.add.text(lx, ly, letter, {
      fontSize: '48px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 5, y: 5 }, fontStyle: 'bold'
    }).setOrigin(0.5)

    this.activeLetterQueue.push(line)
    this.updateTargetLetter()
  }

  private updateTargetLetter() {
    if (this.activeLetterQueue.length > 0) {
      const target = this.activeLetterQueue[0]
      this.engine.setWord(target.letter)

      // Highlight target
      this.activeLetterQueue.forEach((l, i) => {
        if (l.textObject) {
          l.textObject.setColor(i === 0 ? '#ffff00' : '#ffffff')
          l.textObject.setScale(i === 0 ? 1.2 : 1.0)
        }
      })
    }
  }

  protected onWordComplete() {
    if (this.finished || this.activeLetterQueue.length === 0) return

    const line = this.activeLetterQueue.shift()!
    line.isCut = true
    line.letter = ''
    if (line.textObject) {
      line.textObject.destroy()
      line.textObject = undefined
    }

    this.drawWeb()

    // Check if wave complete or level complete
    const waveFinished = this.lines.every(l => l.isCut || (this.lettersSpawned >= this.lettersToSpawn && l.letter === ''))

    if (waveFinished) {
      this.waveComplete()
    } else {
      this.updateTargetLetter()
    }
  }

  private waveComplete() {
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.hp.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Spider HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`)

    // Damage effect
    this.bossSprite.setFillStyle(0xff0000)
    this.time.delayedCall(200, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x333333)
    })

    if (this.hp.bossHp <= 0) {
      this.endLevel(true)
      return
    }

    // Regrow web after short delay
    this.time.delayedCall(500, () => {
      this.lines.forEach(l => {
        l.isCut = false
        l.letter = ''
      })
      this.drawWeb()

      // Progress phases based on HP
      const newPhase = Math.min(3, 1 + Math.floor(((this.hp.bossMaxHp - this.hp.bossHp) / this.hp.bossMaxHp) * 3))
      if (newPhase > this.phase) {
        this.phase = newPhase
        this.startPhase()
      }
    })
  }

  private bossAttack() {
    if (this.finished || this.activeLetterQueue.length === 0) return

    // Spider lunges
    this.tweens.add({
      targets: this.bossSprite,
      scale: 1.5,
      yoyo: true,
      duration: 150,
      onStart: () => {
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
        this.cameras.main.shake(200, 0.01)
        if (this.hp.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 100, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.spawnTimer?.remove()
    this.attackTimer?.remove()

    if (passed) {
      this.bossHpText.setText('DEFEATED!')
      this.activeLetterQueue.forEach(l => l.textObject?.destroy())
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
