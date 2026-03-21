import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { GOLD_PER_KILL } from '../../constants'

export class FlashWordBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private currentWord = ""

  private bossSprite!: Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text

  private hp!: BossHPState
  private hpText!: Phaser.GameObjects.Text

  private wordIsHidden = false
  private visibilityTimer?: Phaser.Time.TimerEvent

  constructor() { super('FlashWordBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
  }

  create() {
    this.preCreate()
    const { width, height } = this.scale
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a2e)

    this.hp = this.setupBossHP(this.level.wordCount)
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.hp.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })

    this.phaseText = this.add.text(width / 2, 60, `Phase ${this.phase}/${this.maxPhases}`, {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5, 0)

    this.bossSprite = this.add.rectangle(width / 2, height * 0.42, 250, 250, 0x9b30ff)

    this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Flash Void HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#cc33ff'
    }).setOrigin(0.5)

    this.startPhase()
  }

  private startPhase() {
    this.phaseText.setText(`Phase ${this.phase}/${this.maxPhases}`)
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)
    const wordsToGenerate = Math.min(Math.ceil(this.level.wordCount / this.maxPhases), this.hp.bossHp)
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)
    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.wordQueue = shuffledWords
    this.loadNextWord()
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
    this.currentWord = this.wordQueue.shift()!
    this.wordIsHidden = false
    this.engine.setWord(this.currentWord)

    const visibilityTime = [3000, 2000, 1000][this.phase - 1]
    this.visibilityTimer?.remove()
    this.visibilityTimer = this.time.delayedCall(visibilityTime, () => {
      const hidden = "_".repeat(this.currentWord.length)
      this.wordIsHidden = true
      this.engine.setDisplayWord(hidden)
    })
  }

  protected onWordComplete() {
    // Drop gold on kill
    if (this.goldManager) {
      const dropX = this.scale.width / 2 + (Math.random() * 200 - 100);
      const dropY = this.scale.height / 2 + (Math.random() * 100 - 50);
      this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
    }

    if (this.finished) return
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.hp.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Flash Void HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`)

    // Visual damage cue
    this.bossSprite.setFillStyle(0xffffff)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.setFillStyle(0x9b30ff)
    })

    this.loadNextWord()
  }

  protected onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
    // Damage player if word is hidden
    if (this.wordIsHidden) {
        const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
    if (Math.random() < absorbChance) {
      const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.hp.playerHp--
    }
        this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.hp.playerHp))}`)
        this.cameras.main.shake(300, 0.01)
        if (this.hp.playerHp <= 0) this.endLevel(false)
    }
  }

  protected endLevel(passed: boolean) {
    this.visibilityTimer?.remove()
    super.endLevel(passed)
  }

  update(time: number, delta: number) {
    super.update(time, delta)
  }
}
