import Phaser from 'phaser'
import { getItem } from '../../data/items'
import { WaveLevelConfig, SpellData } from '../../types'
import { loadProfile } from '../../utils/profile'
import { generateSkeletonSwarmTextures } from '../../art/skeletonSwarmArt'
import { BaseLevelScene } from '../BaseLevelScene'
import { WaveController, WaveEvent } from '../../controllers/WaveController'
import { DEFAULT_PLAYER_HP, GOLD_PER_KILL, SKELETON_SPEED_BASE, SKELETON_SPEED_PER_WORLD } from '../../constants'

interface Skeleton {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Sprite   // was Image
  label: Phaser.GameObjects.Text
  hp: number
  aura: Phaser.GameObjects.Ellipse
  auraTween: Phaser.Tweens.Tween | null
  isRiser: boolean
  isMoving: boolean    // tracks current animation state; false = idle, true = walk
  prevX: number        // x at start of last frame, used for animation state detection
}

export class SkeletonSwarmLevel extends BaseLevelScene {
  private skeletons: Skeleton[] = []
  private activeSkeleton: Skeleton | null = null
  private playerHp = DEFAULT_PLAYER_HP
  private hpHearts: Phaser.GameObjects.Image[] = []
  private waveText!: Phaser.GameObjects.Text
  private skeletonsDefeated = 0
  private maxWaves = 3
  private gameMode: 'regular' | 'advanced' = 'regular'
  private waveController!: WaveController
  private wrongKeyCount = 0
  private nextAttackThreshold = 5
  private letterShieldCount = 0
  private barrierLine!: Phaser.GameObjects.Graphics
  private barrierColor = 0x0099ff
  private pathY = 0
  private riseEmitter?: Phaser.GameObjects.Particles.ParticleEmitter
  private boneBurstEmitter?: Phaser.GameObjects.Particles.ParticleEmitter

  // Barrier constant (used for WaveController config and barrier rendering)
  private readonly BARRIER_X = 265

  constructor() { super('SkeletonSwarmLevel') }

  init(data: { level: WaveLevelConfig; profileSlot: number }) {
    super.init(data)
    this.skeletonsDefeated = 0
    this.playerHp = DEFAULT_PLAYER_HP
    this.maxWaves = data.level.waveCount ?? 3
    this.skeletons = []
    this.activeSkeleton = null
    this.wrongKeyCount = 0
    this.nextAttackThreshold = Phaser.Math.Between(5, 8)
    this.letterShieldCount = 0
    this.hpHearts = []
    const profile = loadProfile(data.profileSlot)
    this.gameMode = profile?.gameMode ?? 'regular'
  }

  create() {
    const { width, height } = this.scale
    this.pathY = height * 0.55
    this.preCreate(60, this.pathY)

    this.waveController = new WaveController({
      words: this.wordQueue,
      maxWaves: this.maxWaves,
      worldNumber: this.level.world,
      barrierX: this.BARRIER_X,
      canvasWidth: this.scale.width,
    })
    // Clear wordQueue — WaveController owns it now
    this.wordQueue = []

    // Generate all textures
    generateSkeletonSwarmTextures(this)

    // Background layers
    this.add.image(width / 2, height * 0.3, 'ss_sky').setDisplaySize(width, height * 0.6)
    this.add.image(width / 2, height * 0.6 - 60, 'ss_ruins').setDisplaySize(width, 120)
    this.add.image(width / 2, this.pathY + 30, 'ss_battlefield').setDisplaySize(width, 200)
    // Dark ground fill below battlefield
    this.add.rectangle(width / 2, height * 0.85, width, height * 0.3, 0x1a0e00)

    // Fire sprites at ruins positions
    if (!this.anims.exists('ss_fire_anim')) {
      this.anims.create({
        key: 'ss_fire_anim',
        frames: [
          { key: 'ss_fire_0' }, { key: 'ss_fire_1' },
          { key: 'ss_fire_2' }, { key: 'ss_fire_1' },
        ],
        frameRate: 8,
        repeat: -1,
      })
    }
    if (!this.anims.exists('ss_idle_anim')) {
      this.anims.create({
        key: 'ss_idle_anim',
        frames: Array.from({ length: 8 }, (_, i) => ({ key: `ss_skeleton_idle_${i}` })),
        frameRate: 3,
        repeat: -1,
      })
    }
    if (!this.anims.exists('ss_walk_anim')) {
      this.anims.create({
        key: 'ss_walk_anim',
        frames: Array.from({ length: 8 }, (_, i) => ({ key: `ss_skeleton_walk_${i}` })),
        frameRate: 8,
        repeat: -1,
      })
    }
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

    // Magical barrier — wavy animated energy wall (redrawn each frame in update)
    this.barrierLine = this.add.graphics().setDepth(6)
    this.redrawBarrier(0)
    // Energy motes rising along the barrier
    this.add.particles(this.BARRIER_X, 0, 'ss_ash_particle', {
      x: { min: -8, max: 8 },
      y: { min: height * 0.2, max: height * 0.85 },
      speedX: { min: -18, max: 18 },
      speedY: { min: -110, max: -35 },
      alpha: { start: 1.0, end: 0 },
      scale: { start: 3.5, end: 0.3 },
      tint: [0x00ccff, 0x88eeff, 0xffffff, 0x0055ff, 0xaa88ff],
      lifespan: { min: 700, max: 1400 },
      frequency: 55,
      quantity: 1,
    }).setDepth(7)
    // Electric sparks shooting toward skeletons
    this.add.particles(this.BARRIER_X, 0, 'ss_ash_particle', {
      x: { min: -4, max: 4 },
      y: { min: height * 0.2, max: height * 0.85 },
      speedX: { min: 50, max: 200 },
      speedY: { min: -20, max: 20 },
      alpha: { start: 1.0, end: 0 },
      scale: { start: 2.5, end: 0.1 },
      tint: [0x00ccff, 0xffffff, 0x88eeff],
      lifespan: { min: 100, max: 280 },
      frequency: 220,
      quantity: 1,
    }).setDepth(7)
    this.tweens.add({
      targets: this.barrierLine,
      alpha: { from: 0.6, to: 1.0 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })

    // HUD
    this.hpHearts = []
    for (let i = 0; i < this.playerHp; i++) {
      const heart = this.add.image(30 + i * 24, 28, 'heart').setScale(1.5).setDepth(10)
      this.hpHearts.push(heart)
    }

    this.waveText = this.add.text(width - 20, 20, `Wave 1 / ${this.maxWaves}`, {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0).setDepth(10)

    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0).setDepth(10)

    // Keyboard → typing hands passthrough
    this.input.keyboard?.on('keydown', () => {
      if (this.activeSkeleton && this.typingHands) {
        const nextIdx = this.engine.getTypedSoFar().length
        const nextCh = this.activeSkeleton.word[nextIdx]
        if (nextCh) this.typingHands.highlightFinger(nextCh)
      }
    })

    // Start wave loop
    this.spawnWave()
  }

  protected handleSpellEffect(effect: SpellData['effect']) {
    if (effect === 'time_freeze') {
      const frozenSpeed = this.skeletons.map(s => s.speed)
      this.skeletons.forEach(s => { s.speed = 0 })
      this.time.delayedCall(5000, () => {
        this.skeletons.forEach((s, i) => { s.speed = frozenSpeed[i] ?? (SKELETON_SPEED_BASE + this.level.world * SKELETON_SPEED_PER_WORLD) })
      })
    } else if (effect === 'word_blast') {
      // Target the active skeleton (the one the player is currently typing), falling back to nearest
      const target = this.activeSkeleton ?? this.skeletons[0] ?? null
      if (target) {
        this.removeSkeleton(target)
        this.skeletonsDefeated++
        this.setActiveSkeleton(this.skeletons[0] ?? null)
        const waveEvents = this.waveController.markDefeated(target.word)
        waveEvents.forEach(e => this.handleWaveEvent(e))
      }
    } else if (effect === 'second_chance') {
      this.playerHp = Math.min(this.playerHp + 2, 5)
      this.hpHearts.forEach((h, i) => h.setVisible(i < this.playerHp))
    } else if (effect === 'letter_shield') {
      this.letterShieldCount = 3
    }
  }

  private spawnWave() {
    if (this.finished) return
    const events = this.waveController.startWave()
    this.waveText.setText(`Wave ${this.waveController.currentWave} / ${this.maxWaves}`)
    events.forEach((e, i) => {
      if (e.type === 'spawn') {
        this.time.delayedCall(i * 400, () => {
          if (!this.finished) this.spawnSkeletonAt(e.word, e.x, e.isRiser)
        })
      }
    })
  }

  private spawnSkeletonAt(word: string, x: number, isRiser: boolean) {
    const finalY = this.pathY

    const startX = x
    const startY = isRiser ? finalY + 20 : finalY

    const aura = this.add.ellipse(startX, startY, 72, 52, 0x006688).setAlpha(0).setDepth(1)
    const sprite = this.add.sprite(
      startX,
      startY,
      isRiser ? 'ss_skeleton_rising' : 'ss_skeleton_idle_0',
    ).setDepth(2)
    const label = this.add.text(startX, finalY - 62, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(3)

    const skeleton: Skeleton = {
      word,
      x: startX,
      speed: SKELETON_SPEED_BASE + this.level.world * SKELETON_SPEED_PER_WORLD,
      sprite,
      label,
      hp: 1,
      aura,
      auraTween: null,
      isRiser,
      isMoving: false,
      prevX: startX,
    }
    this.skeletons.push(skeleton)

    if (!isRiser) {
      sprite.play('ss_idle_anim')
    }

    if (isRiser) {
      // Rise animation: tween from y+20 to finalY, burst dirt, then bootstrap animation
      this.riseEmitter?.explode(12, startX, finalY)
      this.tweens.add({
        targets: [sprite, aura],
        y: finalY,
        duration: 600,
        ease: 'Back.Out',
        onComplete: () => {
          if (!sprite.active) return          // guard: skeleton may have been defeated mid-rise
          skeleton.isRiser = false
          sprite.play('ss_idle_anim')         // bootstrap animation; state-tracking takes over next frame
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

  update(time: number, delta: number) {
    super.update(time, delta)
    this.redrawBarrier(time)
    if (this.finished) return

    this.skeletons.forEach(s => { s.prevX = s.x })

    const labelWidths = this.skeletons.map(s => s.label.width)
    const events = this.waveController.tick(delta, this.gameMode, labelWidths)
    events.forEach(e => this.handleWaveEvent(e))

    // Sync sprite positions from controller state
    this.waveController.activeSkeletons.forEach(state => {
      const skeleton = this.skeletons.find(s => s.word === state.word)
      if (skeleton) {
        skeleton.x = state.x
        skeleton.sprite.setX(skeleton.x)
        skeleton.label.setX(skeleton.x)
        skeleton.aura.setX(skeleton.x)
      }
    })

    // Animation state
    this.skeletons.forEach(s => {
      if (s.isRiser) return
      const dx = s.x - s.prevX
      const moved = Math.abs(dx) > 0.5
      if (moved !== s.isMoving) {
        s.isMoving = moved
        s.sprite.play(moved ? 'ss_walk_anim' : 'ss_idle_anim')
      }
      s.sprite.setFlipX(moved && dx > 0)
    })
  }

  private handleWaveEvent(e: WaveEvent) {
    if (this.finished) return
    if (e.type === 'skeleton_reached') {
      const skeleton = this.skeletons.find(s => s.word === e.word)
      if (skeleton) this.skeletonReachedPlayer(skeleton)
    }
    if (e.type === 'wave_complete') {
      this.showWaveBanner(e.waveNumber)
    }
    if (e.type === 'game_complete') {
      this.endLevel(true)
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

  private redrawBarrier(time: number) {
    const { height } = this.scale
    const bx = this.BARRIER_X
    const top = height * 0.2
    const bot = height * 0.85
    const color = this.barrierColor
    const coreColor = color === 0x0099ff ? 0xaaeeff : 0xff9966
    const N = 40

    // Build wavy polyline with two composited sine waves
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= N; i++) {
      const frac = i / N
      const y = top + frac * (bot - top)
      const wave = Math.sin(time * 0.002 + frac * Math.PI * 7) * 5
                 + Math.sin(time * 0.0034 + frac * Math.PI * 3.2) * 3
      pts.push({ x: bx + wave, y })
    }

    const drawPath = () => {
      this.barrierLine.beginPath()
      this.barrierLine.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i <= N; i++) this.barrierLine.lineTo(pts[i].x, pts[i].y)
      this.barrierLine.strokePath()
    }

    this.barrierLine.clear()
    // Outer glow
    this.barrierLine.lineStyle(52, color, 0.07); drawPath()
    // Mid glow
    this.barrierLine.lineStyle(22, color, 0.26); drawPath()
    // Inner white halo
    this.barrierLine.lineStyle(7, 0xffffff, 0.32); drawPath()
    // Core beam
    this.barrierLine.lineStyle(2, coreColor, 1.0); drawPath()

    // Rune diamonds floating with the wave at 25 / 50 / 75 %
    const drawDiamond = (p: { x: number; y: number }, size: number) => {
      this.barrierLine.fillStyle(coreColor, 0.95)
      this.barrierLine.fillPoints([
        { x: p.x,            y: p.y - size },
        { x: p.x + size * 0.7, y: p.y },
        { x: p.x,            y: p.y + size },
        { x: p.x - size * 0.7, y: p.y },
      ], true)
      // Highlight shard
      this.barrierLine.fillStyle(0xffffff, 0.55)
      this.barrierLine.fillPoints([
        { x: p.x,              y: p.y - size },
        { x: p.x + size * 0.7, y: p.y },
        { x: p.x - size * 0.1, y: p.y - size * 0.35 },
      ], true)
    }

    drawDiamond(pts[Math.floor(N * 0.25)], 8)
    drawDiamond(pts[Math.floor(N * 0.5)],  11)
    drawDiamond(pts[Math.floor(N * 0.75)], 8)
    // Anchor gems at endpoints
    drawDiamond(pts[0], 13)
    drawDiamond(pts[N], 13)
  }

  private flashBarrierRed() {
    this.barrierColor = 0xff2200
    this.time.delayedCall(300, () => { this.barrierColor = 0x0099ff })
  }

  protected onWordComplete(word: string, _elapsed: number) {
    const skeleton = this.skeletons.find(s => s.word === word)
    if (skeleton) {
      if (this.goldManager) {
        const dropX = skeleton.x + (Math.random() * 40 - 20)
        const dropY = skeleton.sprite.y + 40 + (Math.random() * 20 - 10)
        this.goldManager.spawnGold(dropX, dropY, GOLD_PER_KILL)
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
          this.waveController.markDefeated(nextEnemy.word)
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
    const waveEvents = this.waveController.markDefeated(word)
    waveEvents.forEach(e => this.handleWaveEvent(e))
  }

  protected onWrongKey() {
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
              if (this.finished || !attacker.sprite?.active) return
              this.skeletonReachedPlayer(attacker)
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

  private showWaveBanner(waveNumber: number) {
    const { width, height } = this.scale
    const banner = this.add.text(width / 2, height / 2, `WAVE ${waveNumber}`, {
      fontSize: '48px', color: '#ffd700', stroke: '#000000', strokeThickness: 5
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
  }

}
