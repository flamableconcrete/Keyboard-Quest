// src/scenes/boss-types/AncientDragonBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

export class AncientDragonBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private sentenceQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text

  private hp!: BossHPState

  private attackTimer?: Phaser.Time.TimerEvent

  constructor() { super('AncientDragonBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
  }

  create() {
    const { width, height } = this.scale

    // Deep purple/black background for Ancient Dragon
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a001a)

    // HUD
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

    // Boss Sprite (Ancient Dragon is big and purple)
    this.bossSprite = this.add.rectangle(width / 2, height * 0.42, 350, 350, 0x4b0082)

    this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Ancient Dragon HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#a020f0'
    }).setOrigin(0.5)

    this.startPhase()
  }

  private startPhase() {
    this.hud!.setPhase(this.phase)

    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)

    // Distribute total words across phases
    const wordsInThisPhase = Math.ceil(this.hp.bossMaxHp / this.maxPhases)
    const wordsRemaining = Math.min(wordsInThisPhase, this.hp.bossHp)

    // Sentence length depends on phase
    let wordsPerSentence = 2
    if (this.phase === 2) wordsPerSentence = 4
    if (this.phase === 3) wordsPerSentence = 6

    const words = getWordPool(this.level.unlockedLetters, wordsRemaining, difficulty, this.level.world === 1 ? 5 : undefined)
    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords);

    this.sentenceQueue = []
    for (let i = 0; i < shuffledWords.length; i += wordsPerSentence) {
      const sentenceWords = shuffledWords.slice(i, i + wordsPerSentence)
      if (sentenceWords.length > 0) {
        this.sentenceQueue.push(sentenceWords.join(' '))
      }
    }

    // Setup attack timer
    this.attackTimer?.remove()
    this.attackTimer = this.time.addEvent({
      delay: Math.max(1200, 3500 - (this.phase * 600)),
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })

    this.cameras.main.flash(500, 75, 0, 130)
    this.loadNextSentence()
  }

  private loadNextSentence() {
    if (this.sentenceQueue.length === 0) {
      if (this.phase < this.maxPhases && this.hp.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }
    const sentence = this.sentenceQueue[0]
    this.engine.setWord(sentence)
  }

  private bossAttack() {
    if (this.finished) return

    this.tweens.add({
      targets: this.bossSprite,
      scaleX: 1.15,
      scaleY: 1.15,
      angle: Phaser.Math.Between(-5, 5),
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
          this.hp.playerHp--
        }
        this.hud!.setHeroHp(this.hp.playerHp)
        this.cameras.main.shake(300, 0.02)

        if (this.phase >= 2) {
           this.cameras.main.flash(100, 100, 0, 200)
        }

        if (this.hp.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  protected onWordComplete(sentence: string, _elapsed: number) {
    if (this.finished) return

    const wordsInSentence = sentence.split(' ').length
    this.sentenceQueue.shift()
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.hp.bossHp -= (wordsInSentence + powerBonus)
    this.bossHpText.setText(`Ancient Dragon HP: ${Math.max(0, this.hp.bossHp)}/${this.hp.bossMaxHp}`)

    this.bossSprite.setFillStyle(0xffffff)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x4b0082)
    })

    this.loadNextSentence()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 80, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.attackTimer?.remove()

    if (passed) {
      this.bossSprite.destroy()
      this.bossHpText.setText('DEFEATED!')
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
