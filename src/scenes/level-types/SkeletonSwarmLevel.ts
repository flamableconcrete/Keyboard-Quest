import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { TypingHands } from '../../components/TypingHands'
import { SpellCaster } from '../../components/SpellCaster'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { generateSkeletonSwarmTextures } from '../../art/skeletonSwarmArt'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'
import { CompanionAndPetRenderer } from '../../components/CompanionAndPetRenderer'
import { GoldManager } from '../../utils/goldSystem'

interface Skeleton {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  hp: number
  aura: Phaser.GameObjects.Ellipse
  auraTween: Phaser.Tweens.Tween | null
  isRiser: boolean
}

export class SkeletonSwarmLevel extends Phaser.Scene {
  private goldManager!: GoldManager
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private skeletons: Skeleton[] = []
  private activeSkeleton: Skeleton | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxSkeletonReach = 100
  private hpHearts: Phaser.GameObjects.Image[] = []
  private waveText!: Phaser.GameObjects.Text
  private waveTimer?: Phaser.Time.TimerEvent
  private skeletonsDefeated = 0
  private finished = false
  private currentWave = 0
  private maxWaves = 3
  private gameMode: 'regular' | 'advanced' = 'regular'
  private wrongKeyCount = 0
  private nextAttackThreshold = 5
  private letterShieldCount = 0
  private spellCaster?: SpellCaster
  private typingHands?: TypingHands
  private barrierLine!: Phaser.GameObjects.Graphics
  private pathY = 0
  private riseEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
  private boneBurstEmitter?: Phaser.GameObjects.Particles.ParticleEmitter

  // Regular mode constants (mirrors GoblinWhacker)
  private readonly BATTLE_X = 300
  private readonly SKELETON_SPACING = 120

  constructor() { super('SkeletonSwarmLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.skeletonsDefeated = 0
    this.playerHp = 3
    this.currentWave = 0
    this.maxWaves = Phaser.Math.Between(3, 5)
    this.skeletons = []
    this.activeSkeleton = null
    this.words = []
    this.wordQueue = []
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(5, 8)
    this.letterShieldCount = 0
    this.hpHearts = []
    const profile = loadProfile(data.profileSlot)
    this.gameMode = profile?.gameMode ?? 'regular'
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale
    this.pathY = height * 0.55

    // Generate all textures
    generateSkeletonSwarmTextures(this)

    // Background layers
    this.add.image(width / 2, height * 0.3, 'ss_sky').setDisplaySize(width, height * 0.6)
    this.add.image(width / 2, height * 0.6 - 60, 'ss_ruins').setDisplaySize(width, 120)
    this.add.image(width / 2, this.pathY + 30, 'ss_battlefield').setDisplaySize(width, 200)
    // Dark ground fill below battlefield
    this.add.rectangle(width / 2, height * 0.85, width, height * 0.3, 0x1a0e00)

    // Fire sprites at ruins positions
    this.anims.create({
      key: 'ss_fire_anim',
      frames: [
        { key: 'ss_fire_0' }, { key: 'ss_fire_1' },
        { key: 'ss_fire_2' }, { key: 'ss_fire_1' },
      ],
      frameRate: 8,
      repeat: -1,
    })
    const firePositions = [160, 400, 700, 1000]
    firePositions.forEach(x => {
      this.add.sprite(x, height * 0.6 - 50, 'ss_fire_0').setScale(2.5).play('ss_fire_anim')
    })

    // Ambient ash emitter (runs autonomously, no reference needed)
    this.add.particles(0, 0, 'ss_ash_particle', {
      x: { min: 0, max: width },
      y: { min: 100, max: height - 100 },
      speedX: { min: -20, max: -5 },
      speedY: { min: -15, max: -5 },
      alpha: { min: 0.2, max: 0.5 },
      lifespan: { min: 4000, max: 6000 },
      frequency: 333, // ~3/sec
      quantity: 1,
    })

    // One-shot rise burst emitter (reused per riser spawn)
    this.riseEmitter = this.add.particles(0, 0, 'ss_ash_particle', {
      speedX: { min: -60, max: 60 },
      speedY: { min: -120, max: -40 },
      gravityY: 200,
      alpha: { min: 0.6, max: 0.9 },
      lifespan: { min: 600, max: 900 },
      quantity: 12,
      emitting: false,
    })

    // Reusable bone burst emitter for skeleton deaths (avoids per-kill game object leak)
    this.boneBurstEmitter = this.add.particles(0, 0, 'ss_bone_fragment', {
      speedX: { min: -120, max: 120 },
      speedY: { min: -150, max: -30 },
      gravityY: 300,
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      quantity: 8,
      emitting: false,
    })

    // Barrier line (Graphics object, tweened alpha)
    this.barrierLine = this.add.graphics()
    this.barrierLine.lineStyle(3, 0x00ccff, 1.0)
    this.barrierLine.beginPath()
    this.barrierLine.moveTo(100, height * 0.2)
    this.barrierLine.lineTo(100, height * 0.85)
    this.barrierLine.strokePath()
    this.tweens.add({
      targets: this.barrierLine,
      alpha: { from: 0.4, to: 1.0 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    })

    // Player avatar
    const pProfileAvatar = loadProfile(this.profileSlot)
    generateAllCompanionTextures(this)
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '') ? pProfileAvatar!.avatarChoice : 'avatar_0'
    this.add.image(60, this.pathY, avatarKey).setScale(1.5)

    // Companion / pet
    const petRenderer = new CompanionAndPetRenderer(this, 60, this.pathY, this.profileSlot)
    this.goldManager = new GoldManager(this)
    if (petRenderer.getPetSprite()) {
      const pProfile = loadProfile(this.profileSlot)!
      const p = pProfile.pets.find(pet => pet.id === pProfile.activePetId)
      if (p) {
        this.goldManager.registerPet(petRenderer.getPetSprite()!, 100 + (p.level * 25), petRenderer.getStartPetX(), petRenderer.getStartPetY())
      }
    }

    // HUD
    this.hpHearts = []
    for (let i = 0; i < this.playerHp; i++) {
      const heart = this.add.image(30 + i * 24, 28, 'heart').setScale(1.5).setDepth(10)
      this.hpHearts.push(heart)
    }
    if (this.gameMode === 'regular') this.hpHearts.forEach(h => h.setVisible(false))

    this.waveText = this.add.text(width - 20, 20, `Wave 1 / ${this.maxWaves}`, {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(10)

    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(10)

    // Typing engine
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 80,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Keyboard → typing hands passthrough
    this.input.keyboard?.on('keydown', () => {
      if (this.activeSkeleton && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.activeSkeleton.word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })

    // Spell system
    const spellProfile = loadProfile(this.profileSlot)
    if (spellProfile && spellProfile.spells.length > 0) {
      this.spellCaster = new SpellCaster(this, this.profileSlot, this.engine)
      this.spellCaster.setEffectCallback((effect) => {
        if (effect === 'time_freeze') {
          const frozenSpeed = this.skeletons.map(s => s.speed)
          this.skeletons.forEach(s => { s.speed = 0 })
          this.time.delayedCall(5000, () => {
            this.skeletons.forEach((s, i) => { s.speed = frozenSpeed[i] ?? (60 + this.level.world * 10) })
          })
        } else if (effect === 'word_blast') {
          // Target the active skeleton (the one the player is currently typing), falling back to nearest
          const target = this.activeSkeleton ?? this.skeletons[0] ?? null
          if (target) {
            this.removeSkeleton(target)
            this.skeletonsDefeated++
            this.setActiveSkeleton(this.skeletons[0] ?? null)
            if (this.wordQueue.length === 0 && this.skeletons.length === 0) this.endLevel(true)
          }
        } else if (effect === 'second_chance') {
          this.playerHp = Math.min(this.playerHp + 2, 5)
          this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
        } else if (effect === 'letter_shield') {
          this.letterShieldCount = 3
        }
      })
    }

    // Typing hands (profile setting)
    const hintsProfile = loadProfile(this.profileSlot)
    if (hintsProfile?.showFingerHints) {
      this.typingHands = new TypingHands(this, width / 2, height - 100)
    }

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    const maxLength = this.level.world === 1 ? 5 : undefined
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, maxLength)
    const shuffled = [...this.words]
    Phaser.Utils.Array.Shuffle(shuffled)
    this.wordQueue = shuffled

    // Start wave loop
    this.spawnWave()
    this.waveTimer = this.time.addEvent({
      delay: 5000,
      loop: true,
      callback: this.onWaveTimer,
      callbackScope: this,
    })
  }

  private onWaveTimer() {
    if (this.finished) return
    if (this.currentWave >= this.maxWaves) {
      if (this.skeletons.length === 0) this.endLevel(true)
      return
    }
    if (this.skeletons.length === 0) {
      // Show wave incoming banner then spawn
      const { width, height } = this.scale
      const banner = this.add.text(width / 2, height / 2, `WAVE INCOMING`, {
        fontSize: '36px', color: '#ffd700', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5).setDepth(200).setAlpha(0)
      this.tweens.add({
        targets: banner,
        alpha: 1,
        duration: 400,
        yoyo: true,
        hold: 1200,
        onComplete: () => {
          banner.destroy()
          this.spawnWave()
        }
      })
    } else {
      // Previous wave not cleared — spawn next wave on top of existing skeletons
      this.spawnWave()
    }
  }

  private spawnWave() {
    if (this.finished || this.wordQueue.length === 0 || this.currentWave >= this.maxWaves) return
    this.currentWave++
    this.waveText.setText(`Wave ${this.currentWave} / ${this.maxWaves}`)

    // Scale composition with wave number and world
    const baseCount = Math.min(2 + Math.floor(this.currentWave / 2), 4)
    const numSkeletons = Math.min(baseCount, this.wordQueue.length)
    const riserCount = Math.min(Math.ceil(numSkeletons / 2), this.wordQueue.length)
    const marcherCount = Math.min(numSkeletons - riserCount, this.wordQueue.length - riserCount)

    for (let i = 0; i < riserCount + marcherCount; i++) {
      this.time.delayedCall(i * 400, () => {
        if (this.finished || this.wordQueue.length === 0) return
        const isRiser = i < riserCount
        this.spawnSkeleton(isRiser)
      })
    }
  }

  private spawnSkeleton(isRiser: boolean) {
    if (this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width } = this.scale
    const finalY = this.pathY

    const startX = isRiser
      ? Phaser.Math.Between(300, Math.min(800, width - 50))
      : width + 30
    const startY = isRiser ? finalY + 20 : finalY

    const aura = this.add.ellipse(startX, startY, 72, 52, 0x006688).setAlpha(0).setDepth(1)
    const sprite = this.add.image(startX, startY, isRiser ? 'ss_skeleton_rising' : 'ss_skeleton').setDepth(2)
    const label = this.add.text(startX, startY - 40, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(3)

    const skeleton: Skeleton = {
      word,
      x: startX,
      speed: 60 + this.level.world * 10,
      sprite,
      label,
      hp: 1,
      aura,
      auraTween: null,
      isRiser,
    }
    this.skeletons.push(skeleton)

    if (isRiser) {
      // Rise animation: tween from y+20 to finalY, swap sprite, burst dirt
      this.riseEmitter?.explode(12, startX, finalY)
      this.tweens.add({
        targets: [sprite, aura],
        y: finalY,
        duration: 600,
        ease: 'Back.Out',
        onComplete: () => {
          skeleton.isRiser = false
          sprite.setTexture('ss_skeleton')
        }
      })
    }

    if (!this.activeSkeleton) this.setActiveSkeleton(skeleton)
  }

  private setActiveSkeleton(skeleton: Skeleton | null) {
    // Deactivate old aura
    if (this.activeSkeleton) {
      this.activeSkeleton.auraTween?.stop()
      this.activeSkeleton.auraTween = null
      this.activeSkeleton.aura.setAlpha(0)
    }

    this.activeSkeleton = skeleton

    if (skeleton) {
      skeleton.aura.setAlpha(0.3)
      skeleton.auraTween = this.tweens.add({
        targets: skeleton.aura,
        alpha: { from: 0.3, to: 0.8 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      })
      this.engine.setWord(skeleton.word)
      if (this.typingHands) this.typingHands.highlightFinger(skeleton.word[0])
    } else {
      this.engine.clearWord()
    }
  }

  update(_time: number, delta: number) {
    this.goldManager?.update(delta)
    if (this.finished) return

    if (this.gameMode === 'advanced') {
      const reached: Skeleton[] = []
      this.skeletons.forEach(s => {
        s.x -= s.speed * (delta / 1000)
        s.sprite.setX(s.x)
        s.label.setX(s.x)
        s.aura.setX(s.x)
        if (s.x <= this.maxSkeletonReach) reached.push(s)
      })
      reached.forEach(s => { if (s.sprite.active) this.skeletonReachedPlayer(s) })
    } else {
      // Regular mode: lead stops at BATTLE_X, others queue behind with spacing
      this.skeletons.forEach((s, i) => {
        const targetX = this.BATTLE_X + i * this.SKELETON_SPACING
        if (s.x > targetX) {
          s.x -= s.speed * (delta / 1000)
          if (s.x < targetX) s.x = targetX
        }
        s.sprite.setX(s.x)
        s.label.setX(s.x)
        s.aura.setX(s.x)
      })
    }
  }

  private skeletonReachedPlayer(skeleton: Skeleton) {
    // Check targeting BEFORE removeSkeleton clears activeSkeleton
    const wasActive = this.activeSkeleton === skeleton
    this.removeSkeleton(skeleton)
    if (wasActive) this.setActiveSkeleton(this.skeletons[0] ?? null)
    const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0
    if (Math.random() < absorbChance) {
      const blockText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'BLOCKED!', {
        fontSize: '32px', color: '#00ffff'
      }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.playerHp--
      this.flashBarrierRed()
    }
    this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private flashBarrierRed() {
    this.barrierLine.clear()
    this.barrierLine.lineStyle(3, 0xff2200, 1.0)
    this.barrierLine.beginPath()
    const { height } = this.scale
    this.barrierLine.moveTo(100, height * 0.2)
    this.barrierLine.lineTo(100, height * 0.85)
    this.barrierLine.strokePath()
    this.time.delayedCall(300, () => {
      this.barrierLine.clear()
      this.barrierLine.lineStyle(3, 0x00ccff, 1.0)
      this.barrierLine.beginPath()
      this.barrierLine.moveTo(100, height * 0.2)
      this.barrierLine.lineTo(100, height * 0.85)
      this.barrierLine.strokePath()
    })
  }

  private onWordComplete(word: string, _elapsed: number) {
    const skeleton = this.skeletons.find(s => s.word === word)
    if (skeleton) {
      if (this.goldManager) {
        const dropX = skeleton.x + (Math.random() * 40 - 20)
        const dropY = skeleton.sprite.y + 40 + (Math.random() * 20 - 10)
        this.goldManager.spawnGold(dropX, dropY, 5)
      }
      this.removeSkeleton(skeleton)
      this.skeletonsDefeated++

      // Cleave weapon effect
      const pProfileWep = loadProfile(this.profileSlot)
      const weaponItem = pProfileWep?.equipment?.weapon ? getItem(pProfileWep.equipment.weapon) : null
      const cleaveChance = weaponItem?.effect?.defeatAdditionalEnemiesChance || 0
      if (Math.random() < cleaveChance) {
        const nextEnemy = this.skeletons[0]
        if (nextEnemy) {
          this.removeSkeleton(nextEnemy)
          this.skeletonsDefeated++
          const cleaveText = this.add.text(nextEnemy.x, nextEnemy.sprite.y - 40, 'CLEAVE!', {
            fontSize: '20px', color: '#ff8800'
          }).setOrigin(0.5).setDepth(3000)
          this.tweens.add({ targets: cleaveText, y: cleaveText.y - 30, alpha: 0, duration: 800, onComplete: () => cleaveText.destroy() })
        }
      }
    }

    const next = this.skeletons[0] ?? null
    this.setActiveSkeleton(next)
    // Win check here covers cleave kills that empty the board
    if (this.wordQueue.length === 0 && this.skeletons.length === 0) {
      this.endLevel(true)
      return
    }
    if (this.gameMode === 'regular') this.spawnNextIfReady()
  }

  private spawnNextIfReady() {
    // In regular mode, after a kill, try to pull next word from queue immediately
    if (this.wordQueue.length > 0 && this.skeletons.length < 3) {
      this.spawnSkeleton(false)
    }
  }

  private onWrongKey() {
    if (this.letterShieldCount > 0) {
      this.letterShieldCount--
      return
    }
    this.cameras.main.flash(80, 120, 0, 0)
    // Wrong-key attacks are regular mode only — in advanced mode, skeletons damage on contact instead
    if (!this.finished && this.gameMode === 'regular') {
      this.wrongKeyCount++
      if (this.wrongKeyCount >= this.nextAttackThreshold) {
        this.wrongKeyCount = 0
        this.nextAttackThreshold = Phaser.Math.Between(5, 8)
        const attacker = this.activeSkeleton || this.skeletons[0] || null
        if (attacker) {
          this.tweens.add({
            targets: attacker.sprite,
            scaleX: 1.5,
            scaleY: 1.5,
            yoyo: true,
            duration: 150,
            onComplete: () => {
              if (attacker.sprite?.active) this.skeletonReachedPlayer(attacker)
            }
          })
        }
      }
    }
  }

  private removeSkeleton(skeleton: Skeleton) {
    // Bone burst — reuse pre-created emitter to avoid game object accumulation
    this.boneBurstEmitter?.explode(8, skeleton.x, skeleton.sprite.y)

    skeleton.auraTween?.stop()
    skeleton.aura.destroy()
    skeleton.sprite.destroy()
    skeleton.label.destroy()
    this.skeletons = this.skeletons.filter(s => s !== skeleton)
    if (this.activeSkeleton === skeleton) this.activeSkeleton = null
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.waveTimer?.remove()
    this.spellCaster?.destroy()
    this.typingHands?.fadeOut()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        extraGold: this.goldManager ? this.goldManager.getCollectedGold() : 0,
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
      })
    })
  }
}
