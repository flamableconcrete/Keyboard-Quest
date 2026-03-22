// src/scenes/BaseLevelScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'
import { TypingEngine } from '../components/TypingEngine'
import { SpellCaster } from '../components/SpellCaster'
import { SpellData } from '../types'
import { GoldManager } from '../utils/goldSystem'
import { loadProfile } from '../utils/profile'
import { getWordPool } from '../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../utils/scoring'
import { setupPause } from '../utils/pauseSetup'
import { generateAllCompanionTextures } from '../art/companionsArt'
import { CompanionAndPetRenderer } from '../components/CompanionAndPetRenderer'
import { TypingHands } from '../components/TypingHands'
import { LevelHUD } from '../components/LevelHUD'
import {
  LEVEL_ENGINE_Y_OFFSET,
  LEVEL_ENGINE_FONT_SIZE,
  LEVEL_AVATAR_SCALE,
  TYPING_HANDS_Y_OFFSET,
  LEVEL_END_DELAY_MS,
  PET_SPEED_BASE,
  PET_SPEED_COEFF,
  GOLD_PER_KILL,
} from '../constants'

export interface PreCreateOptions {
  avatarScale?: number
  engineY?: number          // kept for backwards compat — ignored when hud provided
  engineFontSize?: number   // kept for backwards compat — ignored when hud provided
  handsYOffset?: number     // kept for backwards compat — ignored when hud provided
  companionSide?: 'left' | 'right'
  hud?: LevelHUD            // NEW: if provided, skip engine + hands creation
}

export abstract class BaseLevelScene extends Phaser.Scene {
  protected level!: LevelConfig
  protected profileSlot!: number
  protected finished = false
  protected engine!: TypingEngine
  protected words: string[] = []
  protected wordQueue: string[] = []
  protected goldManager!: GoldManager
  protected spellCaster?: SpellCaster
  protected typingHands?: TypingHands
  protected hud?: LevelHUD
  protected avatarSprite: Phaser.GameObjects.Image | null = null
  private _preCreateCalled = false

  // Override in BaseBossScene to use a longer delay
  protected readonly endDelayMs: number = LEVEL_END_DELAY_MS

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this._preCreateCalled = false
  }

  /**
   * Call at the TOP of your create() method.
   * Handles: pause, avatar, companion/pet, GoldManager, word pool,
   * TypingEngine, SpellCaster (conditional), TypingHands (conditional).
   *
   * @param avatarX  X position of the player avatar sprite (default: 100)
   * @param avatarY  Y position of the player avatar sprite (default: height - 100)
   * @param options  Optional overrides for scale, engine position, font size, etc.
   *
   * NOTE: If the player has spells, preCreate() will create a SpellCaster and call
   * handleSpellEffect() for spell events. Scenes that don't use spells can ignore
   * this — the default handleSpellEffect() is a no-op.
   */
  protected initWordPool() {
    const difficulty = Math.ceil(this.level.world / 2)
    const maxLength = this.level.world === 1 ? 5 : undefined
    this.words = getWordPool(
      this.level.unlockedLetters,
      this.level.wordCount,
      difficulty,
      maxLength
    )
    const shuffled = [...this.words]
    Phaser.Utils.Array.Shuffle(shuffled)
    this.wordQueue = shuffled
  }

  protected preCreate(
    avatarX?: number,
    avatarY?: number,
    options: PreCreateOptions = {}
  ) {
    this._preCreateCalled = true

    const {
      avatarScale = LEVEL_AVATAR_SCALE,
      engineFontSize = LEVEL_ENGINE_FONT_SIZE,
      handsYOffset = TYPING_HANDS_Y_OFFSET,
      engineY: engineYOverride,
      companionSide = 'right',
      hud,
    } = options

    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // Resolve optional avatar position defaults
    const ax = avatarX ?? 100
    const ay = avatarY ?? (height - 100)

    const profile = loadProfile(this.profileSlot)

    // Avatar
    generateAllCompanionTextures(this)
    const avatarKey =
      profile?.avatarChoice && this.textures.exists(profile.avatarChoice)
        ? profile.avatarChoice
        : 'avatar_0'
    this.avatarSprite = this.add.image(ax, ay, avatarKey).setScale(avatarScale).setDepth(5)

    // Companion / pet + gold manager
    const petRenderer = new CompanionAndPetRenderer(this, ax, ay, this.profileSlot, companionSide)
    this.goldManager = new GoldManager(this)
    if (petRenderer.getPetSprite()) {
      const pet = profile?.pets.find(p => p.id === profile?.activePetId)
      if (pet) {
        this.goldManager.registerPet(
          petRenderer.getPetSprite()!,
          PET_SPEED_BASE + pet.level * PET_SPEED_COEFF,
          petRenderer.getStartPetX(),
          petRenderer.getStartPetY()
        )
      }
    }

    if (hud) {
      // HUD path: engine + hands are owned by the HUD
      this.hud = hud
      this.engine = hud.engine
    } else {
      // Legacy path: create engine + hands directly
      const engineY = engineYOverride ?? (height - LEVEL_ENGINE_Y_OFFSET)

      // Word pool (idempotent — skip if already populated by scene before calling preCreate)
      if (this.wordQueue.length === 0) {
        this.initWordPool()
      }

      // Typing engine
      this.engine = new TypingEngine({
        scene: this,
        x: width / 2,
        y: engineY,
        fontSize: engineFontSize,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
      })

      // Typing hands (conditional)
      if (profile?.showFingerHints) {
        this.typingHands = new TypingHands(this, width / 2, height - handsYOffset)
        this.events.on('typing_next_char', (ch: string) => this.typingHands?.highlightFinger(ch))
      }
    }

    // Spell caster (uses this.engine, works in both HUD and legacy paths)
    if (profile && profile.spells.length > 0) {
      this.spellCaster = new SpellCaster(this, this.profileSlot, this.engine)
      this.spellCaster.setEffectCallback(this.handleSpellEffect.bind(this))
    }
  }

  /**
   * Override to handle spell effect callbacks.
   * Default is a no-op (scenes without spells don't need to override this).
   */
  protected handleSpellEffect(_effect: SpellData['effect']): void {}

  /**
   * Set up a countdown timer that calls endLevel(false) when it reaches zero.
   * Returns the TimerEvent so the caller can remove it in endLevel cleanup.
   *
   * Usage in create():
   *   if (this.level.timeLimit) {
   *     this.timerEvent = this.setupLevelTimer(this.level.timeLimit, timerText)
   *   }
   *
   * @param onTick Optional callback fired after each decrement with the new remaining value
   */
  protected setupLevelTimer(
    seconds: number,
    displayText: Phaser.GameObjects.Text,
    onTick?: (remaining: number) => void
  ): Phaser.Time.TimerEvent {
    let timeLeft = seconds
    displayText.setText(`${timeLeft}s`)
    return this.time.addEvent({
      delay: 1000,
      repeat: seconds - 1, // Phaser fires repeat+1 times total
      callback: () => {
        timeLeft--
        displayText.setText(`${timeLeft}s`)
        onTick?.(timeLeft)
        if (timeLeft <= 0) this.endLevel(false)
      },
    })
  }

  /**
   * Call to end the level. Handles guard flag, shared cleanup,
   * scoring, and transition to LevelResult.
   *
   * Subclasses should do their OWN cleanup (remove timers, etc.)
   * and then call super.endLevel(passed).
   */
  protected endLevel(passed: boolean) {
    if (!this._preCreateCalled) {
      throw new Error(
        `${this.scene.key}: endLevel() called before preCreate(). ` +
        `Did you forget to call super.preCreate() in create()?`
      )
    }
    if (this.finished) return
    this.finished = true

    this.spellCaster?.destroy()
    if (this.hud) {
      this.hud.destroy()
    } else {
      this.typingHands?.fadeOut()
      this.engine.destroy()
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(
      this.engine.correctKeystrokes,
      this.engine.totalKeystrokes
    )
    const spd = calcSpeedStars(
      Math.round(this.engine.completedWords / (elapsed / 60000)),
      this.level.world
    )

    const delay = this.endDelayMs
    this.time.delayedCall(delay, () => {
      this.scene.start('LevelResult', {
        extraGold: this.goldManager?.getCollectedGold() ?? 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
      })
    })
  }

  /** Advance GoldManager each frame. Subclasses should call super.update(). */
  update(_time: number, delta: number) {
    this.goldManager?.update(delta)
  }

  /** Spawn a gold drop near the center of the screen. Call from onWordComplete. */
  protected spawnWordGold(): void {
    if (!this.goldManager) return
    const cx = this.scale.width / 2
    const cy = this.scale.height / 2
    const dropX = cx + (Math.random() * 200 - 100)
    const dropY = cy + (Math.random() * 100 - 50)
    this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
  }

  /** Flash the screen red briefly. Call from onWrongKey. */
  protected flashOnWrongKey(): void {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  protected abstract onWordComplete(word: string, elapsed: number): void
  protected abstract onWrongKey(): void
}
