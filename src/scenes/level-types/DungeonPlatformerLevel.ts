// src/scenes/level-types/DungeonPlatformerLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { loadProfile } from '../../utils/profile'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars } from '../../utils/scoring'
import { setupPause } from '../../utils/pauseSetup'
import { generateAllCompanionTextures } from '../../art/companionsArt'
import { CompanionAndPetRenderer } from '../../components/CompanionAndPetRenderer'
import { generateDungeonTrapTextures } from '../../art/dungeonTrapArt'
import { generateDungeonPlatformerTextures } from '../../art/dungeonPlatformerArt'

type ObstacleType = 'pit' | 'spikes' | 'boulder' | 'door'

interface Obstacle {
  type: ObstacleType
  word: string
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  x: number
}

export class DungeonPlatformerLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number

  // Word state
  private words: string[] = []
  private wordQueue: string[] = []
  private engine!: TypingEngine
  private wordsCompleted = 0
  private finished = false

  // Hero
  private hero!: Phaser.GameObjects.Image
  private heroBaseY = 0
  private isAdvanced = false

  // HP (advanced mode only)
  private playerHp = 3
  private heartIcons: Phaser.GameObjects.Image[] = []
  private vignette!: Phaser.GameObjects.Graphics
  private lowHpTween?: Phaser.Tweens.Tween

  // Scrolling
  private scrollSpeed = 0
  private scrolling = false
  private floorTiles: Phaser.GameObjects.Image[] = []
  private bgTile1!: Phaser.GameObjects.Image
  private bgTile2!: Phaser.GameObjects.Image

  // Obstacles
  private currentObstacle: Obstacle | null = null
  private obstacleTypes: ObstacleType[] = ['pit', 'spikes', 'boulder', 'door']

  // Timer
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private timerText!: Phaser.GameObjects.Text

  // Dust
  private dustParticles: Array<{ img: Phaser.GameObjects.Image; speedY: number; speedX: number }> = []

  // Walking bob tween
  private walkTween?: Phaser.Tweens.Tween

  constructor() { super('DungeonPlatformerLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.wordsCompleted = 0
    this.playerHp = 3
    this.heartIcons = []
    this.dustParticles = []
    this.floorTiles = []
    this.currentObstacle = null
    this.scrolling = false
    this.isAdvanced = this.level.world >= 3
  }

  create() {
    setupPause(this, this.profileSlot)
    const { width, height } = this.scale

    // ── Art generation ─────────────────────────────────────────────
    generateDungeonTrapTextures(this)
    generateDungeonPlatformerTextures(this)
    generateAllCompanionTextures(this)

    // ── Scrolling background (two tiles for seamless loop) ────────
    this.bgTile1 = this.add.image(width / 2, height / 2, 'dungeon_bg')
      .setDisplaySize(width, height).setDepth(0)
    this.bgTile2 = this.add.image(width + width / 2, height / 2, 'dungeon_bg')
      .setDisplaySize(width, height).setDepth(0)

    // ── Floor tiles ───────────────────────────────────────────────
    const floorY = height - 40
    this.heroBaseY = floorY - 50
    const tileW = 160
    const tilesNeeded = Math.ceil(width / tileW) + 2
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.add.image(i * tileW + tileW / 2, floorY + 40, 'platform_floor')
        .setDepth(1)
      this.floorTiles.push(tile)
    }

    // ── Hero ──────────────────────────────────────────────────────
    const profile = loadProfile(this.profileSlot)
    const avatarKey = this.textures.exists(profile?.avatarChoice || '')
      ? profile!.avatarChoice : 'avatar_0'
    this.hero = this.add.image(200, this.heroBaseY, avatarKey)
      .setScale(1.5).setDepth(5)
    new CompanionAndPetRenderer(this, 200, this.heroBaseY, this.profileSlot)

    // ── HUD: Hearts ───────────────────────────────────────────────
    this.buildHeartHUD()

    // ── HUD: Timer ────────────────────────────────────────────────
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffcc44', fontFamily: 'monospace',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true }
    }).setOrigin(1, 0).setDepth(11)

    // ── HUD: Level Name ───────────────────────────────────────────
    this.add.text(width / 2, 18, this.level.name, {
      fontSize: '20px', color: '#e8d090', fontFamily: 'serif',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5, 0).setDepth(10)

    // ── Typing Engine ─────────────────────────────────────────────
    this.engine = new TypingEngine({
      scene: this, x: width / 2, y: height - 80, fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // ── Word Pool ─────────────────────────────────────────────────
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(
      this.level.unlockedLetters, this.level.wordCount, difficulty,
      this.level.world === 1 ? 5 : undefined
    )
    this.wordQueue = [...this.words]

    // ── Timer ─────────────────────────────────────────────────────
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.updateTimerDisplay()
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.updateTimerDisplay()
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }

    // ── Vignette ──────────────────────────────────────────────────
    this.vignette = this.add.graphics().setDepth(100).setAlpha(0)
    this.drawVignette(0xcc0000)

    // ── Dust particles ────────────────────────────────────────────
    this.spawnDustParticles()

    // ── Scroll speed ──────────────────────────────────────────────
    this.scrollSpeed = 300

    // ── Start: walk then spawn first obstacle ─────────────────────
    this.startWalking()
    this.time.delayedCall(600, () => this.spawnNextObstacle())
  }

  // ── Walking ──────────────────────────────────────────────────────
  private startWalking() {
    this.scrolling = true
    if (this.walkTween) this.walkTween.stop()
    this.walkTween = this.tweens.add({
      targets: this.hero,
      y: this.heroBaseY - 4,
      yoyo: true, repeat: -1, duration: 200,
      ease: 'Sine.easeInOut'
    })
  }

  private stopWalking() {
    this.scrolling = false
    if (this.walkTween) {
      this.walkTween.stop()
      this.walkTween = undefined
    }
    this.hero.setY(this.heroBaseY)
  }

  // ── Heart HUD ────────────────────────────────────────────────────
  private buildHeartHUD() {
    this.heartIcons.forEach(h => h.destroy())
    this.heartIcons = []
    for (let i = 0; i < 3; i++) {
      const key = i < this.playerHp ? 'heart_full' : 'heart_empty'
      this.heartIcons.push(
        this.add.image(24 + i * 30, 28, key).setScale(2).setDepth(10)
      )
    }
  }

  private updateHeartHUD() {
    this.heartIcons.forEach((icon, i) => {
      icon.setTexture(i < this.playerHp ? 'heart_full' : 'heart_empty')
    })
    if (this.playerHp <= 1 && !this.lowHpTween) {
      this.lowHpTween = this.tweens.add({
        targets: this.vignette, alpha: { from: 0, to: 0.35 },
        yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut'
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
    const t = 40
    g.fillStyle(color)
    g.fillRect(0, 0, width, t)
    g.fillRect(0, height - t, width, t)
    g.fillRect(0, 0, t, height)
    g.fillRect(width - t, 0, t, height)
  }

  // ── Timer ────────────────────────────────────────────────────────
  private updateTimerDisplay() {
    const urgent = this.timeLeft <= 10
    this.timerText.setText(`⏳ ${this.timeLeft}s`)
    this.timerText.setColor(urgent ? '#ff4444' : '#ffcc44')
  }

  // ── Dust ─────────────────────────────────────────────────────────
  private spawnDustParticles() {
    const { width, height } = this.scale
    for (let i = 0; i < 18; i++) {
      const img = this.add.image(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        'dust_particle'
      ).setAlpha(Phaser.Math.FloatBetween(0.15, 0.55)).setDepth(2)
      this.dustParticles.push({
        img,
        speedY: Phaser.Math.FloatBetween(-0.3, -0.8),
        speedX: Phaser.Math.FloatBetween(-0.15, 0.15)
      })
    }
  }

  // ── Obstacle Spawning ────────────────────────────────────────────
  private spawnNextObstacle() {
    if (this.finished || this.wordQueue.length === 0) {
      if (this.wordQueue.length === 0 && !this.currentObstacle) {
        this.endLevel(true)
      }
      return
    }

    const word = this.wordQueue.shift()!
    const { width } = this.scale
    const type = this.obstacleTypes[Phaser.Math.Between(0, this.obstacleTypes.length - 1)]

    const textureKey = type === 'pit' ? 'obstacle_pit'
      : type === 'spikes' ? 'obstacle_spikes'
      : type === 'boulder' ? 'obstacle_boulder'
      : 'obstacle_door'

    const floorTopY = this.scale.height - 40
    let spriteY: number
    if (type === 'door') {
      spriteY = floorTopY - 60
    } else if (type === 'boulder') {
      spriteY = floorTopY - 40
    } else {
      spriteY = floorTopY
    }

    const startX = width + 100
    const sprite = this.add.image(startX, spriteY, textureKey).setDepth(3)

    const label = this.add.text(startX, spriteY - 70, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 8, y: 4 },
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
    }).setOrigin(0.5).setDepth(8)

    const obstacle: Obstacle = { type, word, sprite, label, x: startX }
    this.currentObstacle = obstacle

    const targetX = 320
    const dist = startX - targetX
    const duration = (dist / this.scrollSpeed) * 1000

    this.startWalking()

    this.tweens.add({
      targets: [sprite, label],
      x: targetX,
      duration,
      ease: 'Linear',
      onUpdate: () => { label.setX(sprite.x) },
      onComplete: () => {
        obstacle.x = targetX
        this.stopWalking()
        this.engine.setWord(word)
      }
    })
  }

  // ── Word Complete ────────────────────────────────────────────────
  private onWordComplete(_word: string, _elapsed: number) {
    if (!this.currentObstacle) return
    const obs = this.currentObstacle
    this.wordsCompleted++

    this.playClearAnimation(obs, () => {
      obs.sprite.destroy()
      obs.label.destroy()
      this.currentObstacle = null
      this.startWalking()
      this.time.delayedCall(400, () => this.spawnNextObstacle())
    })
  }

  private playClearAnimation(obs: Obstacle, onDone: () => void) {
    // Floating success text
    const txt = this.add.text(obs.sprite.x, obs.sprite.y - 40, '✅ CLEAR!', {
      fontSize: '22px', color: '#44ff88', fontFamily: 'monospace',
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
    }).setOrigin(0.5).setDepth(200)
    this.tweens.add({
      targets: txt, y: txt.y - 60, alpha: 0, duration: 800,
      ease: 'Power1', onComplete: () => txt.destroy()
    })

    switch (obs.type) {
      case 'pit':
      case 'spikes':
        this.tweens.add({
          targets: this.hero,
          y: this.heroBaseY - 80,
          duration: 250, yoyo: true, ease: 'Sine.easeOut',
          onComplete: () => onDone()
        })
        break
      case 'boulder':
        this.tweens.add({
          targets: this.hero,
          scaleY: 0.8, y: this.heroBaseY + 15,
          duration: 200, yoyo: true, ease: 'Sine.easeInOut',
        })
        this.tweens.add({
          targets: obs.sprite,
          x: -100, y: obs.sprite.y - 40,
          duration: 500, ease: 'Power1',
          onComplete: () => onDone()
        })
        break
      case 'door':
        this.tweens.add({
          targets: obs.sprite,
          y: obs.sprite.y - 140, alpha: 0,
          duration: 500, ease: 'Power2',
          onComplete: () => onDone()
        })
        break
    }
  }

  // ── Wrong Key ────────────────────────────────────────────────────
  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)

    if (this.isAdvanced && this.currentObstacle) {
      this.playerHp--
      this.updateHeartHUD()
      this.cameras.main.shake(200, 0.015)

      this.tweens.add({
        targets: this.hero,
        alpha: 0.3, yoyo: true, repeat: 2, duration: 100,
        onComplete: () => this.hero.setAlpha(1)
      })

      const obs = this.currentObstacle
      this.engine.clearWord()
      obs.sprite.destroy()
      obs.label.destroy()
      this.currentObstacle = null
      this.wordsCompleted++

      if (this.playerHp <= 0) {
        this.endLevel(false)
      } else {
        this.startWalking()
        this.time.delayedCall(600, () => this.spawnNextObstacle())
      }
    }
  }

  // ── Update (scrolling + dust) ────────────────────────────────────
  update(_time: number, delta: number) {
    if (this.finished) return
    const dt = delta / 1000
    const { width, height } = this.scale

    if (this.scrolling) {
      const bgScroll = this.scrollSpeed * 0.3 * dt
      this.bgTile1.x -= bgScroll
      this.bgTile2.x -= bgScroll
      if (this.bgTile1.x <= -width / 2) this.bgTile1.x = this.bgTile2.x + width
      if (this.bgTile2.x <= -width / 2) this.bgTile2.x = this.bgTile1.x + width

      const floorScroll = this.scrollSpeed * dt
      this.floorTiles.forEach(tile => {
        tile.x -= floorScroll
        if (tile.x < -80) tile.x += this.floorTiles.length * 160
      })
    }

    this.dustParticles.forEach(p => {
      p.img.y += p.speedY
      p.img.x += p.speedX
      if (p.img.y < -10) p.img.y = height + 10
      if (p.img.x < -10) p.img.x = width + 10
      if (p.img.x > width + 10) p.img.x = -10
    })
  }

  // ── End Level ────────────────────────────────────────────────────
  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.stopWalking()
    this.timerEvent?.remove()
    this.engine.destroy()

    if (!passed) {
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
    const spd = calcSpeedStars(
      Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world
    )
    this.time.delayedCall(passed ? 500 : 1400, () => {
      this.scene.start('LevelResult', {
        level: this.level, profileSlot: this.profileSlot,
        accuracyStars: acc, speedStars: spd, passed
      })
    })
  }
}
