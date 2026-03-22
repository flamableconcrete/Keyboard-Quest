// src/scenes/boss-types/DiceLichBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

export class DiceLichBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private wordsPerPhase = 5
  private phaseWordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Rectangle
  private diceSprite!: Phaser.GameObjects.Rectangle
  private diceText!: Phaser.GameObjects.Text
  private curseLabel!: Phaser.GameObjects.Text
  private bossHpText!: Phaser.GameObjects.Text

  private hp!: BossHPState
  private attackTimer?: Phaser.Time.TimerEvent
  private currentCurse = 0

  constructor() { super('DiceLichBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
    this.wordsPerPhase = Math.max(1, Math.ceil(data.level.wordCount / this.maxPhases))
  }

  create() {
    const { width, height } = this.scale
    // Dark background
    this.add.rectangle(width / 2, height / 2, width, height, 0x050505)

    // HUD
    this.hp = this.setupBossHP(this.level.wordCount)

    this.initWordPool()
    this.preCreate(undefined, undefined, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        bossName: this.level.bossName,
        bossNamePosition: { x: width * 0.75, y: height * 0.42 - 200 },
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

    // Boss Sprite (Indigo)
    this.bossSprite = this.add.rectangle(width * 0.75, height * 0.42, 200, 250, 0x4b0082)

    // Dice (White)
    this.diceSprite = this.add.rectangle(width * 0.75 + 200, height * 0.42 - 25, 80, 80, 0xffffff).setStrokeStyle(4, 0x000000)
    this.diceText = this.add.text(width * 0.75 + 200, height * 0.42 - 25, '?', {
      fontSize: '40px', color: '#000000'
    }).setOrigin(0.5)

    this.curseLabel = this.add.text(width * 0.75 + 200, height * 0.42 + 35, 'ROLLING...', {
      fontSize: '18px', color: '#ffffff'
    }).setOrigin(0.5)

    this.bossHpText = this.add.text(width * 0.75, height / 2 + 150, `Dice Lich HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#00ff88'
    }).setOrigin(0.5)

    this.startPhase()
  }

  private startPhase() {
    this.hud!.setPhase(this.phase)

    // Number of words is dictated by config, let's distribute evenly across 3 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(this.level.wordCount / this.maxPhases))

    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.hp.bossHp)
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)

    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)
    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.phaseWordQueue = shuffledWords

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
    if (this.phaseWordQueue.length === 0) {
      if (this.phase < this.maxPhases && this.hp.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }

    const val = this.rollDice()
    let word = this.phaseWordQueue[0]

    // Apply Curse Effects to Word Choice
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)

    if (val === 1) { // Easy: pick a short word
      const easyPool = getWordPool(this.level.unlockedLetters, 10, 1, this.level.world === 1 ? 5 : undefined)
      word = easyPool[Phaser.Math.Between(0, easyPool.length - 1)]
      this.phaseWordQueue[0] = word
    } else if (val === 4) { // Long: pick a hard word
      const hardPool = getWordPool(this.level.unlockedLetters, 10, difficulty + 2, this.level.world === 1 ? 5 : undefined)
      word = hardPool[Phaser.Math.Between(0, hardPool.length - 1)]
      this.phaseWordQueue[0] = word
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
          this.hp.playerHp -= damage
        }
        this.hud!.setHeroHp(this.hp.playerHp)
        this.cameras.main.shake(300, 0.02)
        if (this.currentCurse === 6) {
           this.cameras.main.flash(200, 255, 0, 0)
        }

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

    const damageToBoss = (this.currentCurse === 6) ? 2 : 1

    this.phaseWordQueue.shift()
    this.hp.bossHp -= damageToBoss
    if (this.hp.bossHp < 0) this.hp.bossHp = 0

    this.bossHpText.setText(`Dice Lich HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`)

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
        if (this.phaseWordQueue.length > 0) {
            this.currentCurse = 0 // Reset curse so next word doesn't double-trigger
            const nextWord = this.phaseWordQueue[0]
            this.engine.setWord(nextWord)
            return // Skip loadNextWord (which rolls)
        }
    }

    this.loadNextWord()
  }

  protected onWrongKey() {
    if (this.currentCurse === 6) {
        // Critical Strike: Typo deals 2 damage and resets
        this.hp.playerHp -= 2
        this.hud!.setHeroHp(this.hp.playerHp)
        this.cameras.main.shake(400, 0.03)
        this.cameras.main.flash(200, 255, 0, 0)

        if (this.hp.playerHp <= 0) {
            this.endLevel(false)
        } else {
            // Reset word progress
            const word = this.phaseWordQueue[0]
            this.engine.setWord(word)
        }
    } else {
        this.cameras.main.flash(80, 100, 0, 0)
    }
  }

  protected endLevel(passed: boolean) {
    this.attackTimer?.remove()

    if (passed) {
      this.bossSprite.destroy()
      this.diceSprite.destroy()
      this.diceText.destroy()
      this.curseLabel.destroy()
      this.bossHpText.setText('BANISHED!')
    }

    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
