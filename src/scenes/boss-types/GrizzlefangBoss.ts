// src/scenes/boss-types/GrizzlefangBoss.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

export class GrizzlefangBoss extends BaseBossScene {
  private phase = 1
  private maxPhases = 3
  private wordsPerPhase = 5
  private phaseWordQueue: string[] = []

  private bossSprite!: Phaser.GameObjects.Image
  private bossHpText!: Phaser.GameObjects.Text

  private hp!: BossHPState

  private attackTimer?: Phaser.Time.TimerEvent
  private weaknessActive = false
  private gameMode: 'regular' | 'advanced' = 'regular'
  private wrongKeyCount = 0
  private nextAttackThreshold = 0

  constructor() { super('GrizzlefangBoss') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.phase = 1
    this.phaseWordQueue = []
    this.wrongKeyCount = 0
    this.nextAttackThreshold = 0
    // Number of words is dictated by config, let's distribute evenly across 3 phases
    this.wordsPerPhase = Math.max(1, Math.ceil(data.level.wordCount / this.maxPhases))
    // Check if player has studied the Monster Manual for this boss
    const profile = loadProfile(data.profileSlot)
    this.weaknessActive = profile?.bossWeaknessKnown === (data.level.bossId ?? '')
    this.gameMode = profile?.gameMode ?? 'regular'
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(2, 5)
  }

  create() {
    generateGoblinWhackerTextures(this)

    const { width, height } = this.scale

    // Dark Background for major boss
    this.add.rectangle(width / 2, height / 2, width, height, 0x111111)

    const effectiveWordCount = this.weaknessActive
      ? Math.max(1, Math.floor(this.level.wordCount * 0.8))
      : this.level.wordCount
    this.hp = this.setupBossHP(effectiveWordCount)

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

    // Boss Sprite (Grizzlefang is big and orange/brown)
    this.bossSprite = this.add.image(width / 2, height * 0.42, 'ogre').setScale(3)
    if (this.weaknessActive) {
      this.add.text(width / 2, 90, '⚡ Weakness Known! Boss HP -20%', {
        fontSize: '18px', color: '#aaffaa'
      }).setOrigin(0.5)
    }
    this.bossHpText = this.add.text(width / 2, height / 2 + 150, `Grizzlefang HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#ff8800'
    }).setOrigin(0.5)

    this.startPhase()
  }

  private startPhase() {
    this.hud!.setPhase(this.phase)

    // In later phases, maybe the words are harder or attack is faster
    const difficulty = Math.ceil(this.level.world / 2) + (this.phase - 1)

    // Ensure we don't generate more words than remaining boss HP
    const wordsToGenerate = Math.min(this.wordsPerPhase, this.hp.bossHp)
    const words = getWordPool(this.level.unlockedLetters, wordsToGenerate, difficulty, this.level.world === 1 ? 5 : undefined)

    const shuffledWords = [...words]; Phaser.Utils.Array.Shuffle(shuffledWords); this.phaseWordQueue = shuffledWords

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
    if (this.phaseWordQueue.length === 0) {
      if (this.phase < this.maxPhases && this.hp.bossHp > 0) {
        this.phase++
        this.startPhase()
      } else {
        this.endLevel(true)
      }
      return
    }
    const word = this.phaseWordQueue[0]
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
        this.cameras.main.shake(300, 0.015)

        // Phase 3 attack double flash
        if (this.phase === 3) {
           this.cameras.main.flash(100, 255, 0, 0)
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

    this.phaseWordQueue.shift()
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.hp.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Grizzlefang HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`)

    // Visual damage cue
    this.bossSprite.setTintFill(0xffffff)
    this.time.delayedCall(100, () => {
      if (this.bossSprite) this.bossSprite.clearTint()
    })

    this.loadNextWord()
  }

  protected onWrongKey() {
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
