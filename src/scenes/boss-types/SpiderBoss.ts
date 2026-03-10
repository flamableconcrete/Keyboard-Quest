// src/scenes/boss-types/SpiderBoss.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'

interface WebLine {
  index: number;
  angle: number;
  letter: string;
  isCut: boolean;
  textObject?: Phaser.GameObjects.Text;
}

export class SpiderBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  
  private phase = 1
  private maxPhases = 3
  private lettersToSpawn = 0
  private lettersSpawned = 0
  
  private bossSprite!: Phaser.GameObjects.Arc
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private webGraphics!: Phaser.GameObjects.Graphics
  
  private lines: WebLine[] = []
  private activeLetterQueue: WebLine[] = []
  
  private bossHp = 0
  private bossMaxHp = 0
  private playerHp = 5
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent
  private finished = false

  constructor() { super('SpiderBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
    this.lettersSpawned = 0
    this.activeLetterQueue = []
    
    // bossMaxHp is waves of 8 letters
    this.bossMaxHp = Math.ceil(this.level.wordCount / 8)
    this.bossHp = this.bossMaxHp
    this.lettersToSpawn = this.level.wordCount
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    const centerX = width / 2
    const centerY = height / 2

    // Dark Background
    this.add.rectangle(centerX, centerY, width, height, 0x0a0a1a)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    this.add.text(centerX, 20, this.level.name, {
      fontSize: '28px', color: '#8800ff'
    }).setOrigin(0.5, 0)
    
    this.phaseText = this.add.text(centerX, 60, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    // Web Graphics
    this.webGraphics = this.add.graphics()
    this.initWeb()

    // Spider (Boss Sprite)
    this.bossSprite = this.add.circle(centerX, centerY, 40, 0x333333)
    this.add.circle(centerX - 15, centerY - 10, 5, 0xff0000) // Eye
    this.add.circle(centerX + 15, centerY - 10, 5, 0xff0000) // Eye
    
    this.bossHpText = this.add.text(centerX, centerY - 80, `Spider HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#8800ff'
    }).setOrigin(0.5)

    // Typing engine (invisible, just for logic)
    this.engine = new TypingEngine({
      scene: this,
      x: centerX,
      y: height - 50,
      fontSize: 32,
      onWordComplete: this.onLetterComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
      silent: true
    })

    // Timer
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }

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
    this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)
    
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
      fontSize: '42px', color: '#ffffff', backgroundColor: '#00000088', padding: { x: 5, y: 5 }
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

  private onLetterComplete() {
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
    this.bossHp--
    this.bossHpText.setText(`Spider HP: ${this.bossHp}/${this.bossMaxHp}`)
    
    // Damage effect
    this.bossSprite.setFillStyle(0xff0000)
    this.time.delayedCall(200, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x333333)
    })

    if (this.bossHp <= 0) {
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
      const newPhase = Math.min(3, 1 + Math.floor(((this.bossMaxHp - this.bossHp) / this.bossMaxHp) * 3))
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
        this.playerHp--
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(200, 0.01)
        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 100, 0, 0)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    this.attackTimer?.remove()
    this.engine.destroy()

    if (passed) {
      this.bossHpText.setText('DEFEATED!')
      this.activeLetterQueue.forEach(l => l.textObject?.destroy())
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(1500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
        companionUsed,
        captureAttempt: passed && this.level.captureEligible ? { monsterId: 'spider', monsterName: 'Web Spinner' } : undefined
      })
    })
  }
}
