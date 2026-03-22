// src/scenes/boss-types/BaronTypoBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

export class BaronTypoBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private wordsPerPhase = 5
  private phaseWordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text

  private hp!: BossHPState

  private attackTimer?: Phaser.Time.TimerEvent

  constructor() { super('BaronTypoBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
    // Number of words is dictated by config, distributed across 3 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(data.level.wordCount / this.maxPhases))
  }

  create() {
    const { width, height } = this.scale

    // Deep Purple/Dark Background for Baron Typo
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a2a)

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

    // Boss Sprite (Baron is purple and sophisticated-looking placeholder)
    this.bossSprite = this.add.rectangle(width * 0.75, height * 0.42, 200, 300, 0x800080)
    this.bossSprite.setStrokeStyle(4, 0xffd700) // Gold trim

    this.bossHpText = this.add.text(width * 0.75, height / 2 + 150, `Baron Typo HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#cc88ff'
    }).setOrigin(0.5)

    this.startPhase()
  }

  private startPhase() {
    this.hud!.setPhase(this.phase)

    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)

    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.hp.bossHp)
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)

    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.phaseWordQueue = shuffledWords

    // Setup attack timer based on phase
    this.attackTimer?.remove()
    this.attackTimer = this.time.addEvent({
      delay: Math.max(2000, 5000 - (this.phase * 800)), // Gets faster each phase
      loop: true,
      callback: this.bossAttack,
      callbackScope: this
    })

    // Visual cue for phase change
    this.cameras.main.flash(500, 128, 0, 128)

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
    if (this.phaseWordQueue.length === 0) {
      if (this.phase < this.maxPhases && this.hp.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }
    const correctWord = this.phaseWordQueue[0]
    const scrambledWord = this.scrambleWord(correctWord)

    // In Phase 1, show the scrambled word as the display to help.
    // In Phase 2 & 3, show underscores to force looking at the boss.
    if (this.phase === 1) {
      this.engine.setWord(correctWord, scrambledWord)
    } else {
      // Show underscores in the engine
      const underscores = '_'.repeat(correctWord.length)
      this.engine.setWord(correctWord, underscores)
    }
  }

  private bossAttack() {
    if (this.finished) return

    // Attack animation
    this.tweens.add({
      targets: this.bossSprite,
      y: this.bossSprite.y + 20,
      scaleX: 1.2,
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

        if (this.hp.playerHp <= 0) this.endLevel(false)
      }
    })
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    if (this.finished) return

    this.phaseWordQueue.shift()
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.hp.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Baron Typo HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`)

    // Visual damage cue
    this.bossSprite.setFillStyle(0xddaabb)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x800080)
    })

    this.loadNextWord()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 150, 0, 0)
  }

  protected endLevel(passed: boolean) {
    this.attackTimer?.remove()

    if (passed) {
      this.bossSprite.destroy()
      this.bossHpText.setText('FOILED!')
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
