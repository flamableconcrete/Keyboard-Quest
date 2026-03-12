// src/scenes/level-types/DungeonTrapDisarmLevel.ts
import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'
import { CompanionAndPetRenderer } from '../../components/CompanionAndPetRenderer'
import { generateDungeonTrapTextures } from '../../art/dungeonTrapArt'

type TrapState = 'idle' | 'active' | 'danger'

interface Trap {
  word: string
  x: number
  y: number
  timeLeft: number
  maxTime: number
  sprite: Phaser.GameObjects.Image
  glowRing: Phaser.GameObjects.Image
  barBg: Phaser.GameObjects.Graphics
  barFill: Phaser.GameObjects.Graphics
  label: Phaser.GameObjects.Text
  state: TrapState
}

export class DungeonTrapDisarmLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private traps: Trap[] = []
  private activeTrap: Trap | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private heartIcons: Phaser.GameObjects.Image[] = []
  private timerText!: Phaser.GameObjects.Text
  private timerBg!: Phaser.GameObjects.Graphics
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private trapsDisarmed = 0
  private finished = false
  private dustParticles: Array<{ img: Phaser.GameObjects.Image; speedY: number; speedX: number }> = []
  private vignette!: Phaser.GameObjects.Graphics
  private lowHpTween?: Phaser.Tweens.Tween

  constructor() { super('DungeonTrapDisarmLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.trapsDisarmed = 0
    this.playerHp = 3
    this.traps = []
    this.heartIcons = []
    this.dustParticles = []
    this.activeTrap = null
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // ── Art generation ──────────────────────────────────────────────────────
    generateDungeonTrapTextures(this)
    const pProfileAvatar = loadProfile(this.profileSlot)
    generateAllCompanionTextures(this)

    // ── Background ──────────────────────────────────────────────────────────
    this.add.image(width / 2, height / 2, 'dungeon_bg').setDisplaySize(width, height).setDepth(0)

    // ── Avatar & Companions ─────────────────────────────────────────────────
    const avatarKey = this.textures.exists(pProfileAvatar?.avatarChoice || '')
      ? pProfileAvatar!.avatarChoice
      : 'avatar_0'
    this.add.image(100, height - 100, avatarKey).setScale(1.5).setDepth(5)
    new CompanionAndPetRenderer(this, 100, height - 100, this.profileSlot)

    // ── HUD: Hearts ─────────────────────────────────────────────────────────
    this.buildHeartHUD()

    // ── HUD: Timer ──────────────────────────────────────────────────────────
    this.timerBg = this.add.graphics().setDepth(10)
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px',
      color: '#ffcc44',
      fontFamily: 'monospace',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true }
    }).setOrigin(1, 0).setDepth(11)

    // ── HUD: Level Name ──────────────────────────────────────────────────────
    this.add.text(width / 2, 18, this.level.name, {
      fontSize: '20px',
      color: '#e8d090',
      fontFamily: 'serif',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5, 0).setDepth(10)

    // ── Typing Engine ────────────────────────────────────────────────────────
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 80,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // ── Word Pool ─────────────────────────────────────────────────────────────
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty, this.level.world === 1 ? 5 : undefined)
    this.wordQueue = [...this.words]

    // ── Timer ─────────────────────────────────────────────────────────────────
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.updateTimerDisplay()
      this.timerEvent = this.time.addEvent({
        delay: 1000,
        repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.updateTimerDisplay()
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }

    // ── Spawn Traps ───────────────────────────────────────────────────────────
    this.spawnTimer = this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.spawnTrap,
      callbackScope: this
    })
    this.spawnTrap()

    // ── Ambient Dust ──────────────────────────────────────────────────────────
    this.spawnDustParticles()

    // ── Vignette (low-HP danger overlay) ──────────────────────────────────────
    this.vignette = this.add.graphics().setDepth(100).setAlpha(0)
    this.drawVignette(0xcc0000)
  }

  // ── Heart HUD ───────────────────────────────────────────────────────────────
  private buildHeartHUD() {
    this.heartIcons.forEach(h => h.destroy())
    this.heartIcons = []
    const maxHp = 3
    for (let i = 0; i < maxHp; i++) {
      const key = i < this.playerHp ? 'heart_full' : 'heart_empty'
      const icon = this.add.image(24 + i * 30, 28, key).setScale(2).setDepth(10)
      this.heartIcons.push(icon)
    }
  }

  private updateHeartHUD() {
    this.heartIcons.forEach((icon, i) => {
      icon.setTexture(i < this.playerHp ? 'heart_full' : 'heart_empty')
    })

    // Low HP vignette activation
    if (this.playerHp <= 1 && !this.lowHpTween) {
      this.lowHpTween = this.tweens.add({
        targets: this.vignette,
        alpha: { from: 0, to: 0.35 },
        yoyo: true,
        repeat: -1,
        duration: 600,
        ease: 'Sine.easeInOut'
      })
    } else if (this.playerHp > 1) {
      this.lowHpTween?.stop()
      this.lowHpTween = undefined
      this.vignette.setAlpha(0)
    }
  }

  private drawVignette(color: number) {
    const { width, height } = this.scale
    const g = this.vignette
    g.clear()
    // Four thick edge bars for a border vignette
    const thickness = 40
    g.fillStyle(color)
    g.fillRect(0, 0, width, thickness)
    g.fillRect(0, height - thickness, width, thickness)
    g.fillRect(0, 0, thickness, height)
    g.fillRect(width - thickness, 0, thickness, height)
  }

  // ── Timer Display ─────────────────────────────────────────────────────────
  private updateTimerDisplay() {
    const s = this.timeLeft
    const urgent = s <= 10
    this.timerText.setText(`⏳ ${s}s`)
    this.timerText.setColor(urgent ? '#ff4444' : '#ffcc44')
  }

  // ── Dust Particles ─────────────────────────────────────────────────────────
  private spawnDustParticles() {
    const { width, height } = this.scale
    for (let i = 0; i < 18; i++) {
      const img = this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        'dust_particle'
      ).setAlpha(Phaser.Math.FloatBetween(0.15, 0.55)).setDepth(2)
      const speedY = Phaser.Math.FloatBetween(-0.3, -0.8)
      const speedX = Phaser.Math.FloatBetween(-0.15, 0.15)
      this.dustParticles.push({ img, speedY, speedX })
    }
  }

  // ── Trap Spawning ─────────────────────────────────────────────────────────
  private spawnTrap() {
    if (this.finished || this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width, height } = this.scale

    const x = Phaser.Math.Between(160, width - 160)
    const y = Phaser.Math.Between(100, height - 220)

    const glowRing = this.add.image(x, y, 'glow_ring').setAlpha(0).setDepth(4)
    const sprite = this.add.image(x, y, 'trap_idle').setDepth(5)

    // Timer bar (styled)
    const barWidth = 80
    const barBg = this.add.graphics().setDepth(6)
    barBg.fillStyle(0x111111)
    barBg.fillRoundedRect(x - barWidth / 2 - 2, y + 36, barWidth + 4, 12, 4)

    const barFill = this.add.graphics().setDepth(7)

    const label = this.add.text(x, y - 46, word, {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 6, y: 3 },
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5).setDepth(8)

    const maxTime = 5 + (10 / Math.max(1, this.level.world))

    const trap: Trap = {
      word, x, y, timeLeft: maxTime, maxTime,
      sprite, glowRing, barBg, barFill, label, state: 'idle'
    }
    this.traps.push(trap)

    if (!this.activeTrap) this.setActiveTrap(trap)
  }

  // ── Trap State ─────────────────────────────────────────────────────────────
  private setActiveTrap(trap: Trap | null) {
    // Deactivate old (guard against already-destroyed sprites)
    if (this.activeTrap && this.activeTrap !== trap) {
      if (this.activeTrap.glowRing.active) {
        this.activeTrap.glowRing.setAlpha(0)
        this.tweens.killTweensOf(this.activeTrap.glowRing)
      }
      if (this.activeTrap.sprite.active) {
        this.setTrapVisualState(this.activeTrap, 'idle')
      }
    }
    this.activeTrap = trap
    if (trap) {
      this.engine.setWord(trap.word)
      // Pulse glow ring on active trap
      trap.glowRing.setAlpha(0.6)
      this.tweens.add({
        targets: trap.glowRing,
        alpha: { from: 0.3, to: 0.9 },
        scaleX: { from: 0.9, to: 1.1 },
        scaleY: { from: 0.9, to: 1.1 },
        yoyo: true,
        repeat: -1,
        duration: 500,
        ease: 'Sine.easeInOut'
      })
      this.setTrapVisualState(trap, trap.timeLeft / trap.maxTime < 0.3 ? 'danger' : 'active')
    } else {
      this.engine.clearWord()
    }
  }

  private setTrapVisualState(trap: Trap, state: TrapState) {
    if (trap.state === state) return
    trap.state = state
    const key = state === 'danger' ? 'trap_danger'
      : state === 'active' ? 'trap_active'
      : 'trap_idle'
    trap.sprite.setTexture(key)
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  update(_time: number, delta: number) {
    if (this.finished) return

    // Dust drift
    const { width, height } = this.scale
    this.dustParticles.forEach(p => {
      p.img.y += p.speedY
      p.img.x += p.speedX
      if (p.img.y < -10) p.img.y = height + 10
      if (p.img.x < -10) p.img.x = width + 10
      if (p.img.x > width + 10) p.img.x = -10
    })

    // Trap countdown
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i]
      t.timeLeft -= delta / 1000

      const pct = Math.max(0, t.timeLeft / t.maxTime)
      const barW = 80
      const color = pct < 0.3 ? 0xff2200 : pct < 0.6 ? 0xffaa00 : 0x44dd44
      t.barFill.clear()
      t.barFill.fillStyle(color)
      t.barFill.fillRoundedRect(t.x - barW / 2, t.y + 37, barW * pct, 10, 3)

      // Update visual state gating
      if (t === this.activeTrap) {
        const newState: TrapState = pct < 0.3 ? 'danger' : 'active'
        this.setTrapVisualState(t, newState)
      }

      if (t.timeLeft <= 0) {
        this.trapExploded(t)
      }
    }
  }

  // ── Trap Exploded ──────────────────────────────────────────────────────────
  private trapExploded(trap: Trap) {
    const { width, height } = this.scale

    // Explosion sprite burst
    const boom = this.add.image(trap.x, trap.y, 'trap_explosion')
      .setScale(0.3).setAlpha(1).setDepth(50)
    this.tweens.add({
      targets: boom,
      scale: 1.8, alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => boom.destroy()
    })

    // "BOOM!" text
    const boomText = this.add.text(trap.x, trap.y - 20, '💥 BOOM!', {
      fontSize: '28px',
      color: '#ff4400',
      fontFamily: 'monospace',
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5).setDepth(300)
    this.tweens.add({
      targets: boomText,
      y: boomText.y - 60, alpha: 0, duration: 900,
      ease: 'Power1',
      onComplete: () => boomText.destroy()
    })

    // Clear activeTrap reference BEFORE removing (destroying) the trap sprite,
    // so setActiveTrap below doesn't try to call setTexture on a destroyed object.
    if (this.activeTrap === trap) this.activeTrap = null
    this.removeTrap(trap)

    const pProfile = loadProfile(this.profileSlot)
    const armorItem = pProfile?.equipment?.armor ? getItem(pProfile.equipment.armor) : null
    const absorbChance = armorItem?.effect?.absorbAttacksChance || 0

    if (Math.random() < absorbChance) {
      const blockText = this.add.text(width / 2, height / 2 - 40, '🛡️ BLOCKED!', {
        fontSize: '32px', color: '#00ffff',
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
      }).setOrigin(0.5).setDepth(3000)
      this.tweens.add({ targets: blockText, y: blockText.y - 50, alpha: 0, duration: 1000, onComplete: () => blockText.destroy() })
    } else {
      this.playerHp--
      this.updateHeartHUD()
    }

    this.cameras.main.shake(350, 0.025)
    this.cameras.main.flash(200, 255, 60, 0)

    if (this.playerHp <= 0) {
      this.endLevel(false)
    } else {
      if (this.activeTrap === trap) {
        this.setActiveTrap(this.traps[0] ?? null)
      }
    }
  }

  // ── Word Complete ──────────────────────────────────────────────────────────
  private onWordComplete(word: string, _elapsed: number) {
    const trap = this.traps.find(t => t.word === word)
    if (trap) {
      this.trapsDisarmed++

      // "DISARMED!" floating text
      const txt = this.add.text(trap.x, trap.y - 20, '✅ DISARMED!', {
        fontSize: '22px',
        color: '#44ff88',
        fontFamily: 'monospace',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
      }).setOrigin(0.5).setDepth(200)
      this.tweens.add({
        targets: txt,
        y: txt.y - 60, alpha: 0, duration: 800,
        ease: 'Power1',
        onComplete: () => txt.destroy()
      })

      // Quick scale pop on disarm
      this.tweens.add({
        targets: trap.sprite,
        scaleX: 1.4, scaleY: 1.4, alpha: 0,
        duration: 300, ease: 'Power2',
        onComplete: () => this.removeTrap(trap)
      })
      // Remove from traps list immediately so no countdown interference
      this.traps = this.traps.filter(t => t !== trap)
    }

    const next = this.traps[0] ?? null
    this.setActiveTrap(next)

    if (this.wordQueue.length === 0 && this.traps.length === 0) {
      this.endLevel(true)
    }
  }

  // ── Wrong Key ──────────────────────────────────────────────────────────────
  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
    // Briefly shake active trap label
    if (this.activeTrap) {
      this.tweens.add({
        targets: this.activeTrap.label,
        x: this.activeTrap.x + 5, yoyo: true, repeat: 3, duration: 40,
        onComplete: () => { if (this.activeTrap) this.activeTrap.label.setX(this.activeTrap.x) }
      })
    }
  }

  // ── Remove Trap ────────────────────────────────────────────────────────────
  private removeTrap(trap: Trap) {
    this.tweens.killTweensOf(trap.glowRing)
    trap.sprite.destroy()
    trap.glowRing.destroy()
    trap.label.destroy()
    trap.barBg.destroy()
    trap.barFill.destroy()
    this.traps = this.traps.filter(t => t !== trap)
  }

  // ── End Level ──────────────────────────────────────────────────────────────
  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    this.engine.destroy()

    if (!passed) {
      // Dramatic fail overlay
      const { width, height } = this.scale
      const overlay = this.add.graphics().setDepth(500)
      overlay.fillStyle(0x000000, 0)
      overlay.fillRect(0, 0, width, height)
      this.tweens.add({ targets: overlay, alpha: 0.7, duration: 800 })
      this.add.text(width / 2, height / 2 - 30, '💀 The ruins crumble...', {
        fontSize: '28px', color: '#cc4444', fontFamily: 'serif',
        shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 6, fill: true }
      }).setOrigin(0.5).setDepth(600)
    }

    const elapsed = Date.now() - this.engine.sessionStartTime
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    this.time.delayedCall(passed ? 500 : 1400, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed
      })
    })
  }
}
