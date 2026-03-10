// src/scenes/boss-types/MiniBossTypical.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { TypingHands } from '../../components/TypingHands'
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
import { setupPause } from '../../utils/pauseSetup'

export class MiniBossTypical extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private bossSprite!: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image
  private bossLabel!: Phaser.GameObjects.Text
  private bossHpText!: Phaser.GameObjects.Text
  private bossHp = 0
  private bossMaxHp = 0

  private playerHp = 3
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
  private typingHands?: TypingHands

  constructor() { super('MiniBossTypical') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 3
    this.words = []
    this.wordQueue = []
    this.wrongKeyCount = 0
    this.nextAttackThreshold = 0
    const profile = loadProfile(data.profileSlot)
    this.weaknessActive = profile?.bossWeaknessKnown === (data.level.bossId ?? '')
    this.gameMode = profile?.gameMode ?? 'regular'
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(2, 5)
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x4a1e2a)

    const pProfileAvatar = loadProfile(this.profileSlot)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'

    // Prominent Avatar on the left
    this.add.image(width * 0.25, height / 2 - 50, avatarKey).setScale(4).setDepth(5)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name + ' (Mini-Boss)', {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)

    // Shuffle words
    const shuffledWords = [...this.words]
    Phaser.Utils.Array.Shuffle(shuffledWords)
    this.wordQueue = shuffledWords

    const rawHp = this.wordQueue.length
    this.bossMaxHp = this.weaknessActive ? Math.max(1, Math.floor(rawHp * 0.8)) : rawHp
    this.bossHp = this.bossMaxHp
    // Trim word queue to match reduced HP
    if (this.weaknessActive) {
      this.wordQueue = this.wordQueue.slice(0, this.bossMaxHp)
    }

    // Prominent Boss Sprite on the right
    const isOgre = this.level.name.toLowerCase().includes('ogre') ||
                   this.level.bossId?.toLowerCase().includes('ogre') ||
                   this.level.storyBeat?.toLowerCase().includes('ogre');

    if (isOgre) {
      generateGoblinWhackerTextures(this)
      this.bossSprite = this.add.image(width * 0.75, height / 2 - 50, 'ogre').setScale(4)
    } else {
      this.bossSprite = this.add.rectangle(width * 0.75, height / 2 - 50, 200, 200, 0xaa4444)
    }
    if (this.weaknessActive) {
      this.add.text(width * 0.75, 55, '⚡ Weakness Known! Boss HP -20%', {
        fontSize: '16px', color: '#aaffaa'
      }).setOrigin(0.5)
    }
    this.bossHpText = this.add.text(width * 0.75, height / 2 - 200, `Boss HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5)

    this.bossLabel = this.add.text(width * 0.75, height / 2 - 160, '', {
      fontSize: '28px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 8, y: 4 }
    }).setOrigin(0.5)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 120,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Typing hands overlay (player setting)
    const profile = loadProfile(this.profileSlot)
    if (profile?.showFingerHints) {
      this.typingHands = new TypingHands(this, width / 2, height - 50)
    }

    this.input.keyboard?.on('keydown', () => {
      if (this.wordQueue.length > 0 && this.typingHands) {
        const word = this.wordQueue[0]
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
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

    // Boss Attack Timer (Attacks every X seconds if not defeated)
    if (this.gameMode === 'advanced') {
      this.attackTimer = this.time.addEvent({
        delay: 5000 - (this.level.world * 200), // Faster in later worlds
        loop: true,
        callback: this.bossAttack,
        callbackScope: this
      })
    }

    this.loadNextWord()
  }

  private loadNextWord() {
    if (this.wordQueue.length === 0) {
      this.endLevel(true)
      return
    }
    const word = this.wordQueue[0]
    this.bossLabel.setText(word)
    this.engine.setWord(word)
    if (this.typingHands && word[0]) {
      this.typingHands.highlightFinger(word[0])
    }
  }

  private bossAttack() {
    if (this.finished) return
    
    // Simple visual attack cue
    // Assuming original baseScale for boss is 4 as we set earlier
    const baseScale = this.bossSprite.scaleX; // getting scaleX to be safe if it's ogre (4) or rect (1)

    this.tweens.add({
      targets: this.bossSprite,
      scaleX: baseScale * 1.2,
      scaleY: baseScale * 1.2,
      yoyo: true,
      duration: 150,
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
        this.cameras.main.shake(200, 0.01)
        if (this.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  private onWordComplete(_word: string, _elapsed: number) {
    if (this.finished) return

    this.wordQueue.shift()
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Boss HP: ${this.bossHp}/${this.bossMaxHp}`)

    // Visual damage cue
    if (this.bossSprite instanceof Phaser.GameObjects.Image) {
      this.bossSprite.setTintFill(0xffffff)
      this.time.delayedCall(100, () => {
        if (this.bossSprite) (this.bossSprite as Phaser.GameObjects.Image).clearTint()
      })
    } else {
      this.bossSprite.setFillStyle(0xffffff)
      this.time.delayedCall(100, () => {
        if (this.bossSprite) (this.bossSprite as Phaser.GameObjects.Rectangle).setFillStyle(0xaa4444)
      })
    }

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
    this.typingHands?.fadeOut()
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
      ? { monsterId: this.level.bossId || 'miniboss', monsterName: 'Mini-Boss' }
      : undefined

    const profile = loadProfile(this.profileSlot)
    const companionUsed = !!(profile?.activeCompanionId || profile?.activePetId)

    this.time.delayedCall(1000, () => {
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
