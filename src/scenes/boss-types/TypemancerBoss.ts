// src/scenes/boss-types/TypemancerBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'
import { drawDigitalVoidBg } from '../../utils/bossBackgrounds'

export class TypemancerBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 5
  private wordsPerPhase = 5

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text
  private mechanicText!: Phaser.GameObjects.Text

  private hp!: BossHPState
  private attackTimer?: Phaser.Time.TimerEvent
  private visibilityTimer?: Phaser.Time.TimerEvent

  constructor() { super('TypemancerBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
    this.wordQueue = []
    // Number of words is dictated by config, distributed across 5 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(data.level.wordCount / this.maxPhases))
  }

  create() {
    const { width, height } = this.scale

    drawDigitalVoidBg(this)

    this.hp = this.setupBossHP(this.level.wordCount)

    this.initWordPool()
    this.preCreate(undefined, undefined, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        bossName: this.level.bossName,
        bossNamePosition: { x: width / 2, y: height * 0.42 - 200 },
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

    this.mechanicText = this.add.text(width * 0.75, 95, '', {
      fontSize: '18px', color: '#ff00ff', fontStyle: 'italic'
    }).setOrigin(0.5, 0)

    // Boss Sprite (Typemancer is black/white/glitchy placeholder)
    this.bossSprite = this.add.rectangle(width * 0.75, height * 0.42, 300, 350, 0x111111)
    this.bossSprite.setStrokeStyle(4, 0xffffff)

    this.bossHpText = this.add.text(width * 0.75, height / 2 + 150, `Typemancer HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5)

    this.startPhase()
  }

  private startPhase() {
    this.hud!.setPhase(this.phase)

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
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.hp.bossHp)

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
      if (this.phase < this.maxPhases && this.hp.bossHp > 0) {
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
      this.hp.playerHp--
    }
        this.hud!.setHeroHp(this.hp.playerHp)
        this.cameras.main.shake(300, 0.02)

        if (this.hp.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  protected onWordComplete(word: string, _elapsed: number) {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    if (this.finished) return

    const wordsCompleted = this.phase === 5 ? word.split(' ').length : 1
    this.wordQueue.shift()
    this.hp.bossHp -= wordsCompleted
    this.bossHpText.setText(`Typemancer HP: ${Math.max(0, this.hp.bossHp)}/${this.hp.bossMaxHp}`)

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

  protected onWrongKey() {
    this.cameras.main.flash(80, 150, 150, 150)

    if (this.phase === 4) { // Accuracy phase
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
      this.cameras.main.shake(300, 0.02)

      // Reset current word
      const word = this.wordQueue[0]
      this.engine.setWord(word)

      if (this.hp.playerHp <= 0) this.endLevel(false)
    }
  }

  protected endLevel(passed: boolean) {
    this.attackTimer?.remove()
    this.visibilityTimer?.remove()

    if (passed) {
      this.bossSprite.destroy()
      this.bossHpText.setText('RESTORED!')
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
