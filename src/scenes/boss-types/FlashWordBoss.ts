import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'

export class FlashWordBoss extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private engine!: TypingEngine
  
  private phase = 1
  private maxPhases = 3
  private wordQueue: string[] = []
  private currentWord = ""

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private bossLabel!: Phaser.GameObjects.Text
  
  private bossHp = 0
  private bossMaxHp = 0
  private playerHp = 5
  private hpText!: Phaser.GameObjects.Text
  
  private finished = false
  private visibilityTimer?: Phaser.Time.TimerEvent

  constructor() { super('FlashWordBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.playerHp = 5
    this.phase = 1
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a2e)

    const pProfileAvatar = loadProfile(this.profileSlot)
    generateAllCompanionTextures(this)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)

  const pProfile = loadProfile(this.profileSlot)
  const activeCompanion = pProfile?.activeCompanionId || pProfile?.activePetId
  if (activeCompanion) {
      this.add.image(180, height - 90, activeCompanion).setScale(1.5).setDepth(4)
  }


    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })

    this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    this.bossSprite = this.add.rectangle(width / 2, height / 2 - 50, 250, 250, 0x9b30ff)
    
    this.bossMaxHp = this.level.wordCount
    this.bossHp = this.bossMaxHp
    this.bossHpText = this.add.text(width / 2, height / 2 - 200, `Flash Void HP: ${this.bossHp}/${this.bossMaxHp}`, {
      fontSize: '24px', color: '#cc33ff'
    }).setOrigin(0.5)

    this.bossLabel = this.add.text(width / 2, height / 2 - 50, '', {
      fontSize: '32px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 8, y: 4 }
    }).setOrigin(0.5)

    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 100,
      fontSize: 48,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    this.startPhase()
  }

  private startPhase() {
    this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    const wordsToGenerate = Math.min(Math.ceil(this.level.wordCount / this.maxPhases), this.bossHp)
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)
    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.wordQueue = shuffledWords
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
    this.currentWord = this.wordQueue.shift()!
    this.bossLabel.setText(this.currentWord)
    this.engine.setWord(this.currentWord)
    
    const visibilityTime = [3000, 2000, 1000][this.phase - 1]
    this.visibilityTimer?.remove()
    this.visibilityTimer = this.time.delayedCall(visibilityTime, () => {
      const hidden = "_".repeat(this.currentWord.length)
      this.bossLabel.setText(hidden)
      this.engine.setDisplayWord(hidden)
    })
  }

  private onWordComplete() {
    if (this.finished) return
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Flash Void HP: ${this.bossHp}/${this.bossMaxHp}`)
    
    // Visual damage cue
    this.bossSprite.setFillStyle(0xffffff)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x9b30ff)
    })

    this.loadNextWord()
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
    // Damage player if word is hidden
    if (this.bossLabel.text.includes('_')) {
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
        this.cameras.main.shake(300, 0.01)
        if (this.playerHp <= 0) this.endLevel(false)
    }
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.visibilityTimer?.remove()
    this.engine.destroy()

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
      })
    })
  }
}
