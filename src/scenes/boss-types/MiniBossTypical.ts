// src/scenes/boss-types/MiniBossTypical.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { loadProfile } from '../../utils/profile'
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
import { generateGenericBossTextures } from '../../art/genericBossArt'
import { BaseBossScene, BossHPState } from '../BaseBossScene'
import { BOSS_ENGINE_FONT_SIZE, DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

export class MiniBossTypical extends BaseBossScene {
  private bossSprite!: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
  private bossHpText!: Phaser.GameObjects.Text
  private hp!: BossHPState

  private attackTimer?: Phaser.Time.TimerEvent
  private weaknessActive = false
  private gameMode: 'regular' | 'advanced' = 'regular'
  private wrongKeyCount = 0
  private nextAttackThreshold = 0

  constructor() { super('MiniBossTypical') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)   // handles level, profileSlot, finished
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(2, 5)
    const profile = loadProfile(data.profileSlot)
    this.weaknessActive = profile?.bossWeaknessKnown === (data.level.bossId ?? '')
    this.gameMode = profile?.gameMode ?? 'regular'
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x4a1e2a)

    // Apply weakness reduction to word queue and initialize HP state
    this.initWordPool()
    const rawHp = this.wordQueue.length
    const effectiveHp = this.weaknessActive ? Math.max(1, Math.floor(rawHp * 0.8)) : rawHp
    if (this.weaknessActive) {
      this.wordQueue = this.wordQueue.slice(0, effectiveHp)
    }
    this.hp = this.setupBossHP(effectiveHp)

    this.preCreate(undefined, undefined, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        bossName: this.level.bossName,
        bossNamePosition: { x: width * 0.75, y: (height / 2 - 50) - 150 },
        phase: this.level.phases ? { current: 1, total: this.level.phases } : undefined,
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

    // Prominent Boss Sprite on the right
    const isOgre = this.level.name.toLowerCase().includes('ogre') ||
                   this.level.bossId?.toLowerCase().includes('ogre') ||
                   this.level.storyBeat?.toLowerCase().includes('ogre');

    const bossY = height / 2 - 50
    if (isOgre) {
      generateGoblinWhackerTextures(this)
      this.bossSprite = this.add.image(width * 0.75, bossY, 'ogre').setScale(3)
    } else {
      generateGenericBossTextures(this)
      this.bossSprite = this.add.image(width * 0.75, bossY, 'generic_boss').setScale(3)
    }
    if (this.weaknessActive) {
      this.add.text(width * 0.75, 55, '⚡ Weakness Known! Boss HP -20%', {
        fontSize: '16px', color: '#aaffaa'
      }).setOrigin(0.5)
    }
    this.bossHpText = this.add.text(width * 0.75, height / 2 + 150, `Boss HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`, {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5)

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
    this.engine.setWord(word)
  }

  private bossAttack() {
    if (this.finished) return

    // Simple visual attack cue
    const baseScale = this.bossSprite.scaleX;

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
      this.hp.playerHp--
    }
        this.hud!.setHeroHp(this.hp.playerHp)
        this.cameras.main.shake(200, 0.01)
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

    this.wordQueue.shift()
    const pProfileBoss = loadProfile(this.profileSlot)
    const weaponItemBoss = pProfileBoss?.equipment?.weapon ? getItem(pProfileBoss.equipment.weapon) : null
    const powerBonus = weaponItemBoss?.effect?.power || 0
    this.hp.bossHp -= (1 + powerBonus)
    this.bossHpText.setText(`Boss HP: ${this.hp.bossHp}/${this.hp.bossMaxHp}`)

    // Visual damage cue
    if (this.bossSprite instanceof Phaser.GameObjects.Image) {
      this.bossSprite.setTintFill(0xffffff)
      this.time.delayedCall(100, () => {
        if (this.bossSprite && this.bossSprite.active) (this.bossSprite as Phaser.GameObjects.Image).clearTint()
      })
    } else {
      const rect = this.bossSprite as Phaser.GameObjects.Rectangle;
      rect.setFillStyle(0xffffff)
      this.time.delayedCall(100, () => {
        if (rect && rect.active) rect.setFillStyle(0xaa4444)
      })
    }

    // If HP has reached 0 (possible when weapon power bonus causes >1 damage),
    // defeat the boss immediately regardless of remaining words.
    if (this.hp.bossHp <= 0) {
      this.endLevel(true)
      return
    }

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
