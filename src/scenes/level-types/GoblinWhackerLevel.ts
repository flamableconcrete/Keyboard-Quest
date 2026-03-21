// src/scenes/level-types/GoblinWhackerLevel.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig, SpellData } from '../../types'
import { loadProfile } from '../../utils/profile'
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
import { BaseLevelScene } from '../BaseLevelScene'
import { DEFAULT_PLAYER_HP, GOLD_PER_KILL, SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD } from '../../constants'

interface Goblin {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  hp: number
}

export class GoblinWhackerLevel extends BaseLevelScene {
  private goblins: Goblin[] = []
  private activeGoblin: Goblin | null = null
  private playerHp = DEFAULT_PLAYER_HP
  private maxGoblinReach = 0  // x position where goblin damages player
  private hpHearts: Phaser.GameObjects.Image[] = []
  private timerText!: Phaser.GameObjects.Text
  private counterText!: Phaser.GameObjects.Text
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private goblinsDefeated = 0
  private letterShieldCount = 0
  private gameMode: 'regular' | 'advanced' = 'regular'
  private readonly BATTLE_X = 300        // where lead goblin stops in regular mode
  private readonly GOBLIN_SPACING = 120  // horizontal gap between queued goblins
  private pathY = 0                      // fixed Y for all goblins (set in create)
  private wrongKeyCount = 0
  private nextAttackThreshold = 0

  constructor() { super('GoblinWhackerLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)   // handles: level, profileSlot, finished
    this.goblinsDefeated = 0
    this.playerHp = DEFAULT_PLAYER_HP
    this.goblins = []
    this.activeGoblin = null
    this.letterShieldCount = 0
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(5, 8)
    this.hpHearts = []
    const profile = loadProfile(data.profileSlot)
    this.gameMode = profile?.gameMode ?? 'regular'
  }

  create() {
    const { width, height } = this.scale
    this.pathY = height * 0.62
    this.maxGoblinReach = 80
    this.preCreate(80, this.pathY)   // handles avatar, companion, gold, word pool, engine, spells, hands

    // Generate pixel art textures
    generateGoblinWhackerTextures(this)

    // Background
    this.add.image(width / 2, height / 2, 'forest_bg')

    // HUD - HP hearts
    this.hpHearts = []
    for (let i = 0; i < this.playerHp; i++) {
      const heart = this.add.image(30 + i * 24, 28, 'heart').setScale(1.5)
      this.hpHearts.push(heart)
    }
    if (this.gameMode === 'regular') this.hpHearts.forEach(h => h.setVisible(false))

    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    this.counterText = this.add.text(width - 20, 50, '', {
      fontSize: '22px', color: '#ffaaaa'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    this.input.keyboard?.on('keydown', () => {
      if (this.activeGoblin && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.activeGoblin.word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })

    this.updateCounterText()

    // Timer
    if (this.level.timeLimit) {
      this.timerEvent = this.setupLevelTimer(this.level.timeLimit, this.timerText)
    }

    // Spawn goblins
    this.spawnTimer = this.time.addEvent({
      delay: 2500, loop: true, callback: this.spawnGoblin, callbackScope: this
    })
    this.spawnGoblin()
  }

  protected handleSpellEffect(effect: SpellData['effect']) {
    if (effect === 'time_freeze') {
      this.goblins.forEach(g => { g.speed = 0 })
      this.time.delayedCall(5000, () => {
        this.goblins.forEach(g => { g.speed = SKELETON_SPEED_BASE + this.level.world * SKELETON_SPEED_PER_WORLD })
      })
    } else if (effect === 'word_blast') {
      const nearest = this.goblins.reduce<Goblin | null>((min, g) =>
        !min || g.x < min.x ? g : min, null)
      if (nearest) { this.removeGoblin(nearest); this.goblinsDefeated++ }
    } else if (effect === 'second_chance') {
      this.playerHp = Math.min(this.playerHp + 2, 5)
      this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
    } else if (effect === 'letter_shield') {
      this.letterShieldCount = 3
    }
  }

  private spawnGoblin() {
    if (this.finished || this.wordQueue.length === 0) return
    // Don't spawn if the last goblin is still near the right edge (prevents overlap)
    const lastGoblin = this.goblins[this.goblins.length - 1]
    if (lastGoblin && lastGoblin.x > this.scale.width - this.GOBLIN_SPACING) return
    const word = this.wordQueue.shift()!
    const { width } = this.scale
    const y = this.pathY
    const sprite = this.add.image(width + 30, y, 'goblin')
    const label = this.add.text(width + 30, y - 60, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    const goblin: Goblin = { word, x: width + 30, speed: SKELETON_SPEED_BASE + this.level.world * SKELETON_SPEED_PER_WORLD, sprite, label, hp: 1 }
    this.goblins.push(goblin)

    // Auto-focus first goblin
    if (!this.activeGoblin) this.setActiveGoblin(goblin)
  }

  private setActiveGoblin(goblin: Goblin | null) {
    if (this.activeGoblin) {
      this.activeGoblin.sprite.clearTint()
    }
    this.activeGoblin = goblin
    if (goblin) {
      goblin.sprite.setTint(0xffff44)
      this.engine.setWord(goblin.word)
      if (this.typingHands) {
        this.typingHands.highlightFinger(goblin.word[0])
      }
    } else {
      this.engine.clearWord()
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta)   // handles goldManager.update
    if (this.finished) return

    if (this.gameMode === 'advanced') {
      this.goblins.forEach(g => {
        g.x -= g.speed * (delta / 1000)
        g.sprite.setX(g.x)
        g.label.setX(g.x)
        if (g.x <= this.maxGoblinReach) {
          this.goblinReachedPlayer(g)
        }
      })
    } else {
      // Regular mode: lead stops at BATTLE_X, others queue behind with spacing
      this.goblins.forEach((g, i) => {
        const targetX = this.BATTLE_X + i * this.GOBLIN_SPACING
        if (g.x > targetX) {
          g.x -= g.speed * (delta / 1000)
          if (g.x < targetX) g.x = targetX
        }
        g.sprite.setX(g.x)
        g.label.setX(g.x)
      })
    }
  }

  private goblinReachedPlayer(goblin: Goblin) {
    this.removeGoblin(goblin)
    const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
    if (Math.random() < absorbChance) {
      const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', { fontSize: '32px', color: '#00ffff' }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.playerHp--
    }
    if (this.hpHearts[this.playerHp]) {
      this.hpHearts[this.playerHp].setVisible(false)
    }
    this.cameras.main.shake(200, 0.01)
    if (this.activeGoblin === goblin) {
      this.setActiveGoblin(this.goblins[0] ?? null)
    }
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private updateCounterText() {
    this.counterText.setText(`Goblins Defeated: ${this.goblinsDefeated} / ${this.level.wordCount}`)
  }

  protected onWordComplete(word: string, _elapsed: number) {
    const goblin = this.goblins.find(g => g.word === word)
    if (goblin) {
      // Drop gold on kill below the goblin
      if (this.goldManager) {
        const dropX = goblin.x + (Math.random() * 40 - 20);
        const dropY = goblin.sprite.y + 40 + (Math.random() * 20 - 10);
        this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL);
      }

      this.removeGoblin(goblin)
      this.goblinsDefeated++

      const pProfileWep = loadProfile(this.profileSlot)
      const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
      const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
      if (Math.random() < cleaveChance) {
        const nextEnemy = this.goblins.find(g => g !== goblin)
        if (nextEnemy) {
          this.removeGoblin(nextEnemy)
          this.goblinsDefeated++
          const cleaveText = this.add.text(nextEnemy.x, nextEnemy.sprite.y - 40, 'CLEAVE!', { fontSize: '20px', color: '#ff8800' }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
        }
      }

      this.updateCounterText()
    }
    // Focus next goblin
    const next = this.goblins[0] ?? null
    this.setActiveGoblin(next)
    if (this.gameMode === 'regular') {
      this.spawnGoblin()
    }

    if (this.wordQueue.length === 0 && this.goblins.length === 0) {
      this.endLevel(true)
    }
  }

  protected onWrongKey() {
    if (this.letterShieldCount > 0) {
      this.letterShieldCount--
      return
    }
    this.flashOnWrongKey()

    if (!this.finished) {
      this.wrongKeyCount++
      if (this.wrongKeyCount >= this.nextAttackThreshold) {
        this.wrongKeyCount = 0
        this.nextAttackThreshold = Phaser.Math.Between(5, 8)

        // Find goblin to attack (active one, or closest)
        const attacker = this.activeGoblin || this.goblins.reduce<Goblin | null>((min, g) =>
            !min || g.x < min.x ? g : min, null)

        if (attacker) {
            // Visual attack cue
            this.tweens.add({
              targets: attacker.sprite,
              scaleX: 1.5,
              scaleY: 1.5,
              yoyo: true,
              duration: 150,
              onComplete: () => {
                if (attacker.sprite && attacker.sprite.active) {
                  this.goblinReachedPlayer(attacker)
                }
              }
            })
        }
      }
    }
  }

  private removeGoblin(goblin: Goblin) {
    const poof = this.add.image(goblin.x, goblin.sprite.y, 'goblin_death')
    this.tweens.add({
      targets: poof,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      onComplete: () => poof.destroy()
    })
    goblin.sprite.destroy()
    goblin.label.destroy()
    this.goblins = this.goblins.filter(g => g !== goblin)
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    super.endLevel(passed)   // handles guard, finished flag, spellCaster, typingHands, engine, scoring, scene.start
  }
}
