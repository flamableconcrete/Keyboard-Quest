// src/scenes/boss-types/GrizzlefangBoss.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
import { setupPause } from '../../utils/pauseSetup'

export class GrizzlefangBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  
  private phase = 1
  private maxPhases = 3
  private wordsPerPhase = 5
  private wordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Image
  private bossLabel!: Phaser.GameObjects.Text
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  
  private bossHp = 0
  private bossMaxHp = 0

  private playerHp = 5 // Boss fights might give you more HP
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent
  private finished = false
  private weaknessActive = false
  private gameMode: 'regular' | 'advanced' = 'regular'
  private wrongKeyCount = 0
  private nextAttackThreshold = 0

  constructor() { super('GrizzlefangBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
    this.wordQueue = []
    this.wrongKeyCount = 0
    this.nextAttackThreshold = 0
    // Number of words is dictated by config, let's distribute evenly across 3 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(this.level.wordCount / this.maxPhases))
    // Check if player has studied the Monster Manual for this boss
    const profile = loadProfile(data.profileSlot)
    this.weaknessActive = profile?.bossWeaknessKnown === (data.level.bossId ?? '')
    this.gameMode = profile?.gameMode ?? 'regular'
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(2, 5)
  }

  create() {
    generateGoblinWhackerTextures(this)

    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Dark Background for major boss
    this.add.rectangle(width / 2, height / 2, width, height, 0x111111)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '28px', color: '#ff8800'
    }).setOrigin(0.5, 0)
    
    this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    // Boss Sprite (Grizzlefang is big and orange/brown)
    this.bossSprite = this.add.image(width / 2, height / 2 - 50, 'ogre').setScale(3)
    
    this.bossMaxHp = this.weaknessActive
      ? Math.max(1, Math.floor(this.level.wordCount * 0.8))
      : this.level.wordCount
    this.bossHp = this.bossMaxHp
    if (this.weaknessActive) {
      this.add.text(width / 2, 90, '⚡ Weakness Known! Boss HP -20%', {
        fontSize: '18px', color: '#aaffaa'
      }).setOrigin(0.5)
    }
    this.bossHpText = this.add.text(width / 2, height / 2 - 220, `Grizzlefang HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#ff8800'
    }).setOrigin(0.5)

    this.bossLabel = this.add.text(width / 2, height / 2 - 50, '', {
      fontSize: '32px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 8, y: 4 }
    }).setOrigin(0.5)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 100,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
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
  }
  
  private startPhase() {
    this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)
    
    // In later phases, maybe the words are harder or attack is faster
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    
    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.bossHp)
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)
    
    this.wordQueue = [...words]
    
    // Setup attack timer based on phase
    this.attackTimer?.remove()
    if (this.gameMode === 'advanced') {
      this.attackTimer = this.time.addEvent({
        delay: Math.max(1500, 4000 - (this.phase * 500)), // Gets faster each phase
        loop: true,
        callback: this.bossAttack,
        callbackScope: this
      })
    }
    
    // Visual cue for phase change
    this.cameras.main.flash(500, 255, 136, 0)
    
    this.loadNextWord()
  }

  private loadNextWord() {
    if (this.wordQueue.length === 0) {
      if (this.phase < this.maxPhases && this.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }
    const word = this.wordQueue[0]
    this.bossLabel.setText(word)
    this.engine.setWord(word)
  }

  private bossAttack() {
    if (this.finished) return
    
    // Attack animation
    this.tweens.add({
      targets: this.bossSprite,
      scaleX: 1.1,
      scaleY: 1.1,
      angle: Phaser.Math.Between(-10, 10),
      yoyo: true,
      duration: 100,
      onComplete: () => {
        this.playerHp--
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(300, 0.015)
        
        // Phase 3 attack double flash
        if (this.phase === 3) {
           this.cameras.main.flash(100, 255, 0, 0)
        }
        
        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return

    this.wordQueue.shift()
    this.bossHp--
    this.bossHpText.setText(`Grizzlefang HP: ${this.bossHp}/${this.bossMaxHp}`)

    // Visual damage cue
    this.bossSprite.setTintFill(0xffffff)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.clearTint()
    })

    this.loadNextWord()
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)

    if (this.gameMode === 'regular' && !this.finished) {
      this.wrongKeyCount++
      if (this.wrongKeyCount >= this.nextAttackThreshold) {
        this.wrongKeyCount = 0
        this.nextAttackThreshold = Phaser.Math.Between(2, 5)
        this.bossAttack()
      }
    }
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.attackTimer?.remove()
    this.engine.destroy()

    if (passed) {
      this.bossSprite.destroy()
      this.bossLabel.destroy()
      this.bossHpText.setText('DEFEATED!')
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const captureAttempt = this.level.captureEligible
      ? { monsterId: 'grizzlefang', monsterName: 'Grizzlefang' }
      : undefined

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(1500, () => { // Longer delay for big boss
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
        companionUsed,
        captureAttempt,
      })
    })
  }
}
