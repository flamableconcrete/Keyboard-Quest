// src/scenes/boss-types/DiceLichBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'
import { CompanionAndPetRenderer } from '../../components/CompanionAndPetRenderer'

export class DiceLichBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  
  private phase = 1
  private maxPhases = 3
  private wordsPerPhase = 5
  private wordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Rectangle
  private diceSprite!: Phaser.GameObjects.Rectangle
  private diceText!: Phaser.GameObjects.Text
  private curseLabel!: Phaser.GameObjects.Text
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  
  private bossHp = 0
  private bossMaxHp = 0
  private playerHp = 5
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent
  private currentCurse = 0
  private finished = false

  constructor() { super('DiceLichBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
    this.wordsPerPhase = Math.max(1, Math.ceil(this.level.wordCount / this.maxPhases))
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    // Dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x050505)

    const pProfileAvatar = loadProfile(this.profileSlot)
    generateAllCompanionTextures(this)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)

  new CompanionAndPetRenderer(this, 100, height - 100, this.profileSlot)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, { 
      fontSize: '22px', color: '#ff4444' 
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, { 
      fontSize: '28px', color: '#00ff88' 
    }).setOrigin(0.5, 0)
    
    this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, { 
      fontSize: '20px', color: '#aaaaaa' 
    }).setOrigin(0.5, 0)

    // Boss Sprite (Indigo)
    this.bossSprite = this.add.rectangle(width / 2, height * 0.28, 200, 250, 0x4b0082)
    
    // Dice (White)
    this.diceSprite = this.add.rectangle(width / 2 + 200, height / 2 - 100, 80, 80, 0xffffff).setStrokeStyle(4, 0x000000)
    this.diceText = this.add.text(width / 2 + 200, height / 2 - 100, '?', { 
      fontSize: '40px', color: '#000000' 
    }).setOrigin(0.5)
    
    this.curseLabel = this.add.text(width / 2 + 200, height / 2 - 40, 'ROLLING...', { 
      fontSize: '18px', color: '#ffffff' 
    }).setOrigin(0.5)

    this.bossMaxHp = this.level.wordCount
    this.bossHp = this.bossMaxHp
    this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Dice Lich HP: ${this.bossHp}/${this.bossMaxHp}`, { 
      fontSize: '24px', color: '#00ff88' 
    }).setOrigin(0.5)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this, 
      x: width / 2, 
      y: height - 160, 
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
    
    // Number of words is dictated by config, let's distribute evenly across 3 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(this.level.wordCount / this.maxPhases))
    
    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.bossHp)
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)
    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.wordQueue = shuffledWords
    
    // Visual cue for phase change
    this.cameras.main.flash(500, 0, 255, 136)
    
    this.loadNextWord()
  }

  private rollDice(): number {
    const val = Phaser.Math.Between(1, 6)
    this.diceText.setText(val.toString())
    
    let curseName = ''
    let color = '#ffffff'
    
    switch (val) {
      case 1: curseName = 'EASY WORD'; color = '#00ff00'; break
      case 2: curseName = 'FAST ATTACK'; color = '#ffff00'; break
      case 3: curseName = 'SCRAMBLED'; color = '#ff00ff'; break
      case 4: curseName = 'LONG WORD'; color = '#00ffff'; break
      case 5: curseName = 'DOUBLE WORD'; color = '#ff8800'; break
      case 6: curseName = 'CRITICAL STRIKE!'; color = '#ff0000'; break
    }
    
    this.curseLabel.setText(curseName).setColor(color)
    this.currentCurse = val
    return val
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

    const val = this.rollDice()
    let word = this.wordQueue[0]
    
    // Apply Curse Effects to Word Choice
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    
    if (val === 1) { // Easy: pick a short word
      const easyPool = getWordPool(this.level.unlockedLetters, 10, 1, this.level.world === 1 ? 5 : undefined)
      word = easyPool[Phaser.Math.Between(0, easyPool.length - 1)]
      this.wordQueue[0] = word
    } else if (val === 4) { // Long: pick a hard word
      const hardPool = getWordPool(this.level.unlockedLetters, 10, difficulty + 2, this.level.world === 1 ? 5 : undefined)
      word = hardPool[Phaser.Math.Between(0, hardPool.length - 1)]
      this.wordQueue[0] = word
    }

    this.engine.setWord(word)
    
    if (val === 3) { // Scrambled: show underscores
      const underscores = '_'.repeat(word.length)
      this.engine.setWord(word, underscores)
    } else {
      this.engine.setWord(word)
    }

    // Setup attack timer based on curse and phase
    this.attackTimer?.remove()
    let attackDelay = Math.max(2000, 5000 - (this.phase * 800))
    if (val === 2) attackDelay *= 0.5 // Fast attack

    this.attackTimer = this.time.addEvent({
      delay: attackDelay,
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })
  }

  private bossAttack() {
    if (this.finished) return
    
    const damage = this.currentCurse === 6 ? 2 : 1
    
    this.tweens.add({
      targets: this.bossSprite,
      scaleX: 1.2,
      scaleY: 1.2,
      yoyo: true,
      duration: 100,
      onComplete: () => {
        const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
    if (Math.random() < absorbChance) {
      const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.playerHp -= damage
    }
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(300, 0.02)
        if (this.currentCurse === 6) {
           this.cameras.main.flash(200, 255, 0, 0)
        }
        
        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return

    const damageToBoss = (this.currentCurse === 6) ? 2 : 1
    
    this.wordQueue.shift()
    this.bossHp -= damageToBoss
    if (this.bossHp < 0) this.bossHp = 0
    
    this.bossHpText.setText(`Dice Lich HP: ${this.bossHp}/${this.bossMaxHp}`)

    // Visual damage cue
    this.bossSprite.setFillStyle(0xffffff)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x4b0082)
    })

    // Double word mechanic: if it's 5, and we just finished the first, we might want another.
    // Actually the requirement says "must type two words in a row".
    // Let's implement it as: if curse is 5, we don't roll dice for the NEXT word in the queue.
    if (this.currentCurse === 5) {
        // We just completed one. We need to complete another from the queue without a new roll.
        // But if queue is empty, we just finish.
        if (this.wordQueue.length > 0) {
            this.currentCurse = 0 // Reset curse so next word doesn't double-trigger
            const nextWord = this.wordQueue[0]
            this.engine.setWord(nextWord)
            return // Skip loadNextWord (which rolls)
        }
    }

    this.loadNextWord()
  }

  private onWrongKey() {
    if (this.currentCurse === 6) {
        // Critical Strike: Typo deals 2 damage and resets
        this.playerHp -= 2
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(400, 0.03)
        this.cameras.main.flash(200, 255, 0, 0)
        
        if (this.playerHp <= 0) {
            this.endLevel(false)
        } else {
            // Reset word progress
            const word = this.wordQueue[0]
            this.engine.setWord(word)
        }
    } else {
        this.cameras.main.flash(80, 100, 0, 0)
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
      this.diceSprite.destroy()
      this.diceText.destroy()
      this.curseLabel.destroy()
      this.bossHpText.setText('BANISHED!')
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(2000, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed
      })
    })
  }
}
