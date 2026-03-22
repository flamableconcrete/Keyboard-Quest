// src/scenes/level-types/DungeonPlatformerLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { generateDungeonTrapTextures } from '../../art/dungeonTrapArt'
import { generateDungeonPlatformerTextures } from '../../art/dungeonPlatformerArt'
import { BaseLevelScene } from '../BaseLevelScene'
import { PlatformerController } from '../../controllers/PlatformerController'
import { DEFAULT_PLAYER_HP } from '../../constants'
import { LevelHUD } from '../../components/LevelHUD'

type ObstacleType = 'pit' | 'spikes' | 'boulder' | 'door'

interface Obstacle {
  type: ObstacleType
  word: string
  sprite: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  x: number
}

export class DungeonPlatformerLevel extends BaseLevelScene {
  // Word state
  private platformerController!: PlatformerController

  // Hero
  private hero!: Phaser.GameObjects.Image
  private heroBaseY = 0
  private isAdvanced = false

  // HP (advanced mode only)
  private playerHp = DEFAULT_PLAYER_HP
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


  // Dust
  private dustParticles: Array<{ img: Phaser.GameObjects.Image; speedY: number; speedX: number }> = []

  // Walking bob tween
  private walkTween?: Phaser.Tweens.Tween

  constructor() { super('DungeonPlatformerLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.playerHp = DEFAULT_PLAYER_HP
    this.dustParticles = []
    this.floorTiles = []
    this.currentObstacle = null
    this.scrolling = false
    this.isAdvanced = data.level.world >= 3
  }

  create() {
    const { width, height } = this.scale

    // ── Art generation ─────────────────────────────────────────────
    generateDungeonTrapTextures(this)
    generateDungeonPlatformerTextures(this)

    // Floor at ~62% height (matching GoblinWhacker's pathY) so finger hints fit below
    const floorY = height * 0.62
    this.heroBaseY = floorY

    // Hero runs at 35% width on the floor
    const heroX = width * 0.35

    // preCreate: avatar at heroX/heroBaseY; companion/pet follow behind (left side)
    this.initWordPool()
    this.preCreate(heroX, this.heroBaseY, {
      companionSide: 'left',
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        timer: this.level.timeLimit ? {
          seconds: this.level.timeLimit,
          onExpire: () => this.endLevel(false),
        } : undefined,
        counter: { label: 'Obstacles', total: this.wordQueue.length },
        wordPool: this.wordQueue,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
      }),
    })
    this.platformerController = new PlatformerController(this.wordQueue)

    // ── Scrolling background (two tiles for seamless loop) ────────
    this.bgTile1 = this.add.image(width / 2, height / 2, 'dungeon_bg')
      .setDisplaySize(width, height).setDepth(0)
    this.bgTile2 = this.add.image(width + width / 2, height / 2, 'dungeon_bg')
      .setDisplaySize(width, height).setDepth(0)

    // ── Floor tiles ───────────────────────────────────────────────
    const tileW = 160
    const tilesNeeded = Math.ceil(width / tileW) + 2
    for (let i = 0; i < tilesNeeded; i++) {
      const tile = this.add.image(i * tileW + tileW / 2, floorY + 40, 'platform_floor')
        .setDepth(1)
      this.floorTiles.push(tile)
    }

    // ── Hero reference for walking animation ────────────────────
    // preCreate placed the avatar at (heroX, heroBaseY); reference it directly.
    this.hero = this.avatarSprite!

    // Update finger hints after each keystroke
    this.input.keyboard?.on('keydown', () => {
      if (this.currentObstacle && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.currentObstacle.word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })

    this.updateCounterText()


    // ── Vignette ──────────────────────────────────────────────────
    this.vignette = this.add.graphics().setDepth(100).setAlpha(0)
    this.drawVignette(0xcc0000)

    // ── Dust particles ────────────────────────────────────────────
    this.spawnDustParticles()

    // ── Scroll speed ──────────────────────────────────────────────
    this.scrollSpeed = 600

    // ── Start: walk then spawn first obstacle ─────────────────────
    this.startWalking()
    this.time.delayedCall(300, () => this.spawnNextObstacle())
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

  private updateHeartHUD() {
    this.hud!.setHeroHp(this.playerHp)
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

  private updateCounterText() {
    this.hud!.setCounter(this.platformerController.wordsCompleted)
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
    if (this.finished || !this.platformerController.hasNextWord) {
      if (!this.platformerController.hasNextWord && !this.currentObstacle) {
        this.endLevel(true)
      }
      return
    }

    const word = this.platformerController.nextWord()
    if (!word) return  // queue exhausted
    const { width } = this.scale
    const type = this.obstacleTypes[Phaser.Math.Between(0, this.obstacleTypes.length - 1)]

    const textureKey = type === 'pit' ? 'obstacle_pit'
      : type === 'spikes' ? 'obstacle_spikes'
      : type === 'boulder' ? 'obstacle_boulder'
      : 'obstacle_door'

    const floorTopY = this.heroBaseY + 40  // top of floor tiles
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

    // Let the player start typing immediately while obstacle scrolls in
    this.engine.setWord(word)
    if (this.typingHands) this.typingHands.highlightFinger(word[0])

    const heroX = this.hero.x
    const targetX = heroX + 120
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
        // If word was already typed while scrolling, don't stop
        if (this.currentObstacle === obstacle) {
          this.stopWalking()
        }
      }
    })
  }

  // ── Word Complete ────────────────────────────────────────────────
  protected onWordComplete(_word: string, _elapsed: number) {
    if (!this.currentObstacle) return

    // Notify party to animate (trap dodged — no gold in this level type)
    this.events.emit('trap_cleared')
    const obs = this.currentObstacle
    this.currentObstacle = null  // clear immediately so keydown handler doesn't flash old letter
    const events = this.platformerController.completeWord()
    this.updateCounterText()
    for (const e of events) {
      if (e.type === 'all_complete') {
        // Will be handled after clear animation completes via spawnNextObstacle
      }
    }

    this.playClearAnimation(obs, () => {
      obs.sprite.destroy()
      obs.label.destroy()
      this.startWalking()
      this.time.delayedCall(150, () => this.spawnNextObstacle())
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
  protected onWrongKey() {
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
      this.platformerController.completeWord()
      this.updateCounterText()

      if (this.playerHp <= 0) {
        this.endLevel(false)
      } else {
        this.startWalking()
        this.time.delayedCall(150, () => this.spawnNextObstacle())
      }
    }
  }

  // ── Update (scrolling + dust) ────────────────────────────────────
  update(_time: number, delta: number) {
    super.update(_time, delta)
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
  protected endLevel(passed: boolean) {
    if (this.finished) return
    this.stopWalking()

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

    super.endLevel(passed)
  }
}
