// src/scenes/boss-types/TypemancerBoss.ts
import { GoldManager } from '../../utils/goldSystem'
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

export class TypemancerBoss extends Phaser.Scene {
  private goldManager!: GoldManager
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  
  private phase = 1
  private maxPhases = 5
  private wordsPerPhase = 5
  private wordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private mechanicText!: Phaser.GameObjects.Text
  
  private bossHp = 0
  private bossMaxHp = 0

  private playerHp = 5
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private attackTimer?: Phaser.Time.TimerEvent
  private visibilityTimer?: Phaser.Time.TimerEvent
  private finished = false

  constructor() { super('TypemancerBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
    this.wordQueue = []
    // Number of words is dictated by config, distributed across 5 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(this.level.wordCount / this.maxPhases))
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Pitch black background for the ultimate boss
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000)

    const pProfileAvatar = loadProfile(this.profileSlot)
    generateAllCompanionTextures(this)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)

  const petRenderer = new CompanionAndPetRenderer(this, 100, height - 100, this.profileSlot)
  this.goldManager = new GoldManager(this)
  if (petRenderer.getPetSprite()) {
    const pProfile = loadProfile(this.profileSlot)!;
    const p = pProfile.pets.find(pet => pet.id === pProfile.activePetId);
    if (p) {
      this.goldManager.registerPet(petRenderer.getPetSprite()!, 100 + (p.level * 25), petRenderer.getStartPetX(), petRenderer.getStartPetY())
    }
  }

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0)
    
    this.phaseText = this.add.text(width / 2, 65, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    this.mechanicText = this.add.text(width / 2, 95, '', {
      fontSize: '18px', color: '#ff00ff', fontStyle: 'italic'
    }).setOrigin(0.5, 0)

    // Boss Sprite (Typemancer is black/white/glitchy placeholder)
    this.bossSprite = this.add.rectangle(width / 2, height * 0.42, 300, 350, 0x111111)
    this.bossSprite.setStrokeStyle(4, 0xffffff)
    
    this.bossMaxHp = this.level.wordCount
    this.bossHp = this.bossMaxHp
    this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Typemancer HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#ffffff'
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
    
    const mechanics = [
      "NORMAL WORDS - FAST ATTACKS",
      "SCRAMBLED WORDS",
      "MEMORY WORDS",
      "PERFECT ACCURACY REQUIRED",
      "BATTLE OF SENTENCES"
    ]
    this.mechanicText.setText(mechanics[this.phase - 1])

    const difficulty = 5 // Typemancer uses all letters and hard words
    
    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.bossHp)
    
    if (this.phase === 5) {
      // Sentence mode: 15 words distributed in sentences of 5
      const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)
      this.wordQueue = []
      for (let i = 0; i < words.length; i += 5) {
        const sentence = words.slice(i, i + 5).join(' ')
        if (sentence) this.wordQueue.push(sentence)
      }
    } else {
      const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)
      const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.wordQueue = shuffledWords
    }
    
    // Setup attack timer based on phase
    this.attackTimer?.remove()
    const baseDelay = this.phase === 1 ? 2000 : 4000 - (this.phase * 500)
    this.attackTimer = this.time.addEvent({
      delay: Math.max(1000, baseDelay),
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })
    
    // Visual cue for phase change
    this.cameras.main.flash(500, 255, 255, 255)
    
    this.loadNextWord()
  }

  private scrambleWord(word: string): string {
    if (word.length <= 1) return word
    let scrambled = word
    let attempts = 0
    while (scrambled === word && attempts < 10) {
      scrambled = word.split('').sort(() => Math.random() - 0.5).join('')
      attempts++
    }
    return scrambled
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
    
    // Apply phase specific logic
    if (this.phase === 2) { // Scrambled
      const scrambled = this.scrambleWord(word)
      this.engine.setWord(word, scrambled)
    } else if (this.phase === 3) { // Memory
      this.engine.setWord(word)
      this.visibilityTimer?.remove()
      this.visibilityTimer = this.time.delayedCall(1500, () => {
        const hidden = "_".repeat(word.length)
        this.engine.setDisplayWord(hidden)
      })
    } else {
      this.engine.setWord(word)
    }
  }

  private bossAttack() {
    if (this.finished) return
    
    this.tweens.add({
      targets: this.bossSprite,
      scaleX: 1.2,
      scaleY: 1.2,
      angle: Phaser.Math.Between(-15, 15),
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
      this.playerHp--
    }
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
        this.cameras.main.shake(300, 0.02)
        
        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private onWordComplete(word: string, _elapsed: number) {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, 5); // 5 gold per kill
    }

    if (this.finished) return

    const wordsCompleted = this.phase === 5 ? word.split(' ').length : 1
    this.wordQueue.shift()
    this.bossHp -= wordsCompleted
    this.bossHpText.setText(`Typemancer HP: ${Math.max(0, this.bossHp)}/${this.bossMaxHp}`)

    // Visual damage cue (invert colors)
    this.bossSprite.setFillStyle(0xffffff)
    this.bossSprite.setStrokeStyle(4, 0x000000)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) {
        this.bossSprite.setFillStyle(0x111111)
        this.bossSprite.setStrokeStyle(4, 0xffffff)
      }
    })

    this.loadNextWord()
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 150, 150, 150)
    
    if (this.phase === 4) { // Accuracy phase
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
      this.cameras.main.shake(300, 0.02)
      
      // Reset current word
      const word = this.wordQueue[0]
      this.engine.setWord(word)
      
      if (this.playerHp <= 0) this.endLevel(false)
    }
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.attackTimer?.remove()
    this.visibilityTimer?.remove()
    this.engine.destroy()

    if (passed) {
      this.bossSprite.destroy()
      this.bossHpText.setText('RESTORED!')
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(2000, () => {
      this.scene.start('LevelResult', {
        extraGold: this.goldManager ? this.goldManager.getCollectedGold() : 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed
      })
    })
  }
}
