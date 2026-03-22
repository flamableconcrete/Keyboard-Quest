// src/scenes/level-types/GoblinWhackerLevel.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { TimedLevelConfig, SpellData } from '../../types'
import { loadProfile } from '../../utils/profile'
import { generateGoblinWhackerTextures } from '../../art/goblinWhackerArt'
import { BaseLevelScene } from '../BaseLevelScene'
import { DEFAULT_PLAYER_HP, GOLD_PER_KILL } from '../../constants'
import { WrongKeyAttackController } from '../../controllers/WrongKeyAttackController'
import { GoblinController } from '../../controllers/GoblinController'

interface GoblinSprite {
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
}

export class GoblinWhackerLevel extends BaseLevelScene {
  private goblinCtrl!: GoblinController
  private goblinSprites = new Map<string, GoblinSprite>()
  private activeWord: string | null = null
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
  private wrongKeyCtrl!: WrongKeyAttackController

  constructor() { super('GoblinWhackerLevel') }

  init(data: { level: TimedLevelConfig; profileSlot: number }) {
    super.init(data)   // handles: level, profileSlot, finished
    this.goblinsDefeated = 0
    this.playerHp = DEFAULT_PLAYER_HP
    this.goblinSprites = new Map()
    this.activeWord = null
    this.letterShieldCount = 0
    this.hpHearts = []
    const profile = loadProfile(data.profileSlot)
    this.gameMode = profile?.gameMode ?? 'regular'
  }

  create() {
    const { width, height } = this.scale
    this.pathY = height * 0.62
    this.maxGoblinReach = 80

    // Generate textures and draw background FIRST so they render behind everything
    // that preCreate() sets up (TypingHands, avatar, etc.)
    generateGoblinWhackerTextures(this)
    this.add.image(width / 2, height / 2, 'forest_bg')

    this.preCreate(80, this.pathY)   // handles avatar, companion, gold, word pool, engine, spells, hands
    this.wrongKeyCtrl = new WrongKeyAttackController({ threshold: Phaser.Math.Between(5, 8) })

    // Initialize goblin controller with the word queue from preCreate
    this.goblinCtrl = new GoblinController({
      words: [...this.wordQueue],
      worldNumber: this.level.world,
      canvasWidth: width,
      barrierX: this.maxGoblinReach,
      battleX: this.BATTLE_X,
      goblinSpacing: this.GOBLIN_SPACING,
    })
    // Controller owns the word queue now — clear scene's copy to avoid double-management
    this.wordQueue = []

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
      if (this.activeWord && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.activeWord[nextIdx]
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
      delay: 2500, loop: true, callback: this.doSpawnGoblin, callbackScope: this
    })
    this.doSpawnGoblin()
  }

  protected handleSpellEffect(effect: SpellData['effect']) {
    if (effect === 'time_freeze') {
      this.goblinCtrl.freezeGoblins()
      this.time.delayedCall(5000, () => {
        this.goblinCtrl.restoreGoblinSpeeds()
      })
    } else if (effect === 'word_blast') {
      // Defeat the nearest goblin (lowest x)
      const nearest = this.goblinCtrl.activeGoblins.reduce<string | null>((minWord, g) => {
        if (minWord === null) return g.word
        const minG = this.goblinCtrl.activeGoblins.find(x => x.word === minWord)!
        return g.x < minG.x ? g.word : minWord
      }, null)
      if (nearest) {
        const events = this.goblinCtrl.removeGoblinByWord(nearest)
        for (const e of events) {
          if (e.type === 'goblin_defeated') {
            this.destroyGoblinSprite(e.word)
            this.goblinsDefeated++
            this.updateCounterText()
          } else if (e.type === 'level_complete') {
            this.syncActiveWord()
            this.endLevel(true)
            return
          }
        }
        this.syncActiveWord()
      }
    } else if (effect === 'second_chance') {
      this.playerHp = Math.min(this.playerHp + 2, 5)
      this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
    } else if (effect === 'letter_shield') {
      this.letterShieldCount = 3
    }
  }

  private doSpawnGoblin() {
    if (this.finished) return
    const events = this.goblinCtrl.spawnGoblin()
    for (const e of events) {
      if (e.type === 'goblin_spawned') {
        const y = this.pathY
        const sprite = this.add.image(e.x, y, 'goblin')
        const label = this.add.text(e.x, y - 60, e.word, {
          fontSize: '20px', color: '#ffffff',
          backgroundColor: '#000000', padding: { x: 4, y: 2 }
        }).setOrigin(0.5)
        this.goblinSprites.set(e.word, { sprite, label })

        // Sync active word and tint if this is the first goblin
        this.syncActiveWord()
      }
    }
  }

  /** Sync scene's activeWord and typing engine to controller's activeWord. */
  private syncActiveWord() {
    const newActiveWord = this.goblinCtrl.activeWord
    if (newActiveWord === this.activeWord) return

    // Clear tint on old active sprite
    if (this.activeWord) {
      this.goblinSprites.get(this.activeWord)?.sprite.clearTint()
    }

    this.activeWord = newActiveWord

    if (newActiveWord) {
      this.goblinSprites.get(newActiveWord)?.sprite.setTint(0xffff44)
      this.engine.setWord(newActiveWord)
      if (this.typingHands) {
        this.typingHands.highlightFinger(newActiveWord[0])
      }
    } else {
      this.engine.clearWord()
    }
  }

  update(time: number, delta: number) {
    super.update(time, delta)   // handles goldManager.update
    if (this.finished) return

    const events = this.goblinCtrl.tick(delta, this.gameMode)
    for (const e of events) {
      if (e.type === 'goblin_breached') {
        this.handleGoblinBreached(e.word)
      } else if (e.type === 'level_complete') {
        this.endLevel(true)
        return
      }
    }

    // Sync sprite positions from controller state
    for (const g of this.goblinCtrl.activeGoblins) {
      const sprites = this.goblinSprites.get(g.word)
      if (sprites) {
        sprites.sprite.setX(g.x)
        sprites.label.setX(g.x)
      }
    }
  }

  private handleGoblinBreached(word: string) {
    this.destroyGoblinSprite(word)
    this.syncActiveWord()

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
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private updateCounterText() {
    this.counterText.setText(`Goblins Defeated: ${this.goblinsDefeated} / ${this.level.wordCount}`)
  }

  protected onWordComplete(word: string, _elapsed: number) {
    const events = this.goblinCtrl.wordTyped(word)
    for (const e of events) {
      if (e.type === 'goblin_defeated') {
        // Drop gold on kill below the goblin
        if (this.goldManager) {
          const sprites = this.goblinSprites.get(e.word)
          const dropX = e.x + (Math.random() * 40 - 20)
          const dropY = (sprites?.sprite.y ?? this.pathY) + 40 + (Math.random() * 20 - 10)
          this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
        }

        this.destroyGoblinSprite(e.word)
        this.goblinsDefeated++

        // Cleave weapon effect: defeat an additional nearby goblin
        const pProfileWep = loadProfile(this.profileSlot)
        const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
        const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
        if (Math.random() < cleaveChance) {
          const nextEnemy = this.goblinCtrl.activeGoblins[0]
          if (nextEnemy) {
            const cleaveWord = nextEnemy.word
            const cleaveX = nextEnemy.x
            const cleaveSprites = this.goblinSprites.get(cleaveWord)
            const cleaveEvents = this.goblinCtrl.removeGoblinByWord(cleaveWord)
            this.destroyGoblinSprite(cleaveWord)
            this.goblinsDefeated++
            const cleaveText = this.add.text(cleaveX, (cleaveSprites?.sprite.y ?? this.pathY) - 40, 'CLEAVE!', { fontSize: '20px', color: '#ff8800' }).setOrigin(0.5).setDepth(3000)
            this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
            if (cleaveEvents.find(e => e.type === 'level_complete')) {
              this.updateCounterText()
              this.syncActiveWord()
              this.endLevel(true)
              return
            }
          }
        }

        this.updateCounterText()
      } else if (e.type === 'level_complete') {
        this.syncActiveWord()
        if (this.gameMode === 'regular') {
          this.doSpawnGoblin()
        }
        this.endLevel(true)
        return
      }
    }

    this.syncActiveWord()
    if (this.gameMode === 'regular') {
      this.doSpawnGoblin()
    }
  }

  protected onWrongKey() {
    if (this.letterShieldCount > 0) {
      this.letterShieldCount--
      return
    }
    this.flashOnWrongKey()

    if (!this.finished) {
      const events = this.wrongKeyCtrl.recordWrongKey()
      for (const e of events) {
        if (e.type === 'enemy_attacks') {
          // Find goblin to attack (active one, or closest)
          const attackerWord = this.activeWord ??
            this.goblinCtrl.activeGoblins.reduce<string | null>((minWord, g) => {
              if (minWord === null) return g.word
              const minG = this.goblinCtrl.activeGoblins.find(x => x.word === minWord)!
              return g.x < minG.x ? g.word : minWord
            }, null)

          if (attackerWord) {
            const attackerSprites = this.goblinSprites.get(attackerWord)
            if (attackerSprites) {
              this.tweens.add({
                targets: attackerSprites.sprite,
                scaleX: 1.5,
                scaleY: 1.5,
                yoyo: true,
                duration: 150,
                onComplete: () => {
                  if (attackerSprites.sprite && attackerSprites.sprite.active) {
                    // Re-check the goblin still exists in the controller
                    const stillExists = this.goblinCtrl.activeGoblins.find(g => g.word === attackerWord)
                    if (stillExists) {
                      const attackEvents = this.goblinCtrl.removeGoblinByWord(attackerWord)
                      this.handleGoblinBreached(attackerWord)
                      if (attackEvents.find(e => e.type === 'level_complete')) {
                        this.endLevel(true)
                      }
                    }
                  }
                }
              })
            }
          }
        }
      }
    }
  }

  private destroyGoblinSprite(word: string) {
    const sprites = this.goblinSprites.get(word)
    if (!sprites) return
    const poof = this.add.image(sprites.sprite.x, sprites.sprite.y, 'goblin_death')
    this.tweens.add({
      targets: poof,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      onComplete: () => poof.destroy()
    })
    sprites.sprite.destroy()
    sprites.label.destroy()
    this.goblinSprites.delete(word)
  }

  protected endLevel(passed: boolean) {
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    super.endLevel(passed)   // handles guard, finished flag, spellCaster, typingHands, engine, scoring, scene.start
  }
}
