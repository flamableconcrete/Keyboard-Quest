import { AudioHelper } from '../utils/AudioHelper'
// src/scenes/OverlandMapScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { ALL_LEVELS, getLevelsForWorld } from '../data/levels'
import { checkWorldMastery } from '../utils/scoring'
import { MapRenderer } from '../utils/mapRenderer'
import { UNIFIED_MAP, worldIndexAtScrollX } from '../data/maps/unified'
import { COMMON_FRAMES } from '../data/maps/common'
import { AvatarRenderer } from '../components/AvatarRenderer'

interface NodePosition { x: number; y: number }

export class OverlandMapScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private avatar!: Phaser.GameObjects.Sprite
  private avatarShadow?: Phaser.GameObjects.Ellipse
  private isGliding = false
  private mapRenderers: MapRenderer[] = []
  private worldPaths: Phaser.Curves.Path[] = []
  private glowRect?: Phaser.GameObjects.Rectangle
  private currentNodeIndex = 0
  private avatarBasePos: NodePosition = { x: 0, y: 0 }
  private isPanning = false
  private panStartX = 0
  private panCamStartX = 0
  private readonly EDGE_SCROLL_THRESHOLD = 60
  private readonly EDGE_SCROLL_MAX_SPEED = 12
  private worldTitleText!: Phaser.GameObjects.Text

  private readonly WORLD_NAMES = [
    'World 1 — The Heartland',
    'World 2 — The Shadowed Fen',
    'World 3 — The Ember Peaks',
    'World 4 — The Shrouded Wilds',
    "World 5 — The Typemancer's Tower",
  ]

  private worldNameForIndex(idx: number): string {
    return this.WORLD_NAMES[idx] ?? `World ${idx + 1}`
  }



  constructor() { super('OverlandMap') }

  init(data: { profileSlot: number }) {
    AudioHelper.playBGM(this, 'bgm_map')
    this.profileSlot = data.profileSlot
    const profile = loadProfile(this.profileSlot)
    if (!profile) {
      this.scene.start('ProfileSelect')
      return
    }
    this.profile = profile
  }

  private readonly BLEND_COLORS = [0x88cc66, 0x334455, 0xcc5522, 0x336633, 0x220044]

  private drawBlendZone(seamX: number, fromWorldIdx: number): void {
    const gfx = this.add.graphics().setDepth(500)
    const fromColor = this.BLEND_COLORS[fromWorldIdx]
    const toColor = this.BLEND_COLORS[fromWorldIdx + 1]
    const steps = 30
    const stepWidth = 300 / steps

    for (let s = 0; s < steps; s++) {
      const t = s / steps
      // Lerp color channels
      const fr = (fromColor >> 16) & 0xff, fg = (fromColor >> 8) & 0xff, fb = fromColor & 0xff
      const tr = (toColor >> 16) & 0xff,   tg = (toColor >> 8) & 0xff,   tb = toColor & 0xff
      const r = Math.round(fr + (tr - fr) * t)
      const g = Math.round(fg + (tg - fg) * t)
      const b = Math.round(fb + (tb - fb) * t)
      const color = (r << 16) | (g << 8) | b
      gfx.fillStyle(color, 0.45)
      gfx.fillRect(seamX + s * stepWidth, 0, stepWidth + 1, 720)
    }
  }

  private buildUnifiedMap(): void {
    const { worlds, xOffsets, widths } = UNIFIED_MAP

    worlds.forEach((mapData, i) => {
      const xOffset = xOffsets[i]
      const renderer = new MapRenderer(this, mapData, xOffset)
      renderer.renderTileLayers()
      renderer.renderDecorations()
      renderer.startAtmosphere()
      renderer.startAnimatedTiles()
      this.mapRenderers.push(renderer)

      // Draw blend gradient at right edge of this world (except last world)
      if (i < worlds.length - 1) {
        this.drawBlendZone(xOffset + widths[i] - 150, i)
      }
    })
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0)
    const { width } = this.scale

    this.cameras.main.setBounds(0, 0, UNIFIED_MAP.totalWidth, 720)

    // Snap camera to current world on load
    const snapWorldIdx = (this.profile.currentWorld ?? 1) - 1
    const snapOffset = UNIFIED_MAP.xOffsets[snapWorldIdx] ?? 0
    const snapWidth = UNIFIED_MAP.widths[snapWorldIdx] ?? 1280
    const vw = this.scale.width
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      snapOffset + snapWidth / 2 - vw / 2,
      0,
      UNIFIED_MAP.totalWidth - vw
    )

    this.buildUnifiedMap()

    UNIFIED_MAP.worlds.forEach((mapData, i) => {
      const xOffset = UNIFIED_MAP.xOffsets[i]
      const worldNum = i + 1
      const levels = getLevelsForWorld(worldNum)
      const positions = mapData.nodePositions.map(p => ({ x: p.x + xOffset, y: p.y }))

      const completedIds = new Set<string>(
        levels.filter(l => !!this.profile.levelResults[l.id]).map(l => l.id)
      )
      const path = this.mapRenderers[i].renderPaths(levels, completedIds)
      this.worldPaths.push(path)

      this.drawNodes(levels, positions)
    })

    this.drawMasteryChest()
    this.drawSettingsButton()
    this.drawProfilesButton()

    const currentWorldIdx = (this.profile.currentWorld ?? 1) - 1
    this.worldTitleText = this.add.text(
      this.scale.width / 2, 40,
      this.worldNameForIndex(currentWorldIdx),
      { fontSize: '28px', color: '#ffd700' }
    ).setOrigin(0.5).setDepth(2000).setScrollFactor(0)

    // Player info
    this.add.text(20, 20, `${this.profile.playerName}  Lv.${this.profile.characterLevel}`, {
      fontSize: '20px', color: '#ffffff'
    }).setDepth(2000).setScrollFactor(0)

    this.add.text(width - 20, 20, `Gold: ${this.profile.gold ?? 0}`, {
      fontSize: '20px', color: '#ffd700'
    }).setOrigin(1, 0).setDepth(2000).setScrollFactor(0)

    const { width: w, height: h } = this.scale
    // Bottom-right row: Character, Shop, Stable, Tavern (right to left)
    this.drawHudButton(w - 60, h - 60, '👤', 'CHARACTER', () => {
      this.scene.pause()
      this.scene.launch('Character', { profileSlot: this.profileSlot })
    })
    this.drawHudButton(w - 150, h - 60, '🛒', 'SHOP', () => {
      this.scene.start('Shop', { profileSlot: this.profileSlot })
    })
    this.drawHudButton(w - 240, h - 60, '🐴', 'STABLE', () => {
      this.scene.start('Stable', { profileSlot: this.profileSlot })
    })
    this.drawHudButton(w - 330, h - 60, '🍺', 'TAVERN', () => {
      this.scene.start('Tavern', { profileSlot: this.profileSlot })
    })

    let startPos = {
      x: UNIFIED_MAP.xOffsets[0] + (UNIFIED_MAP.worlds[0].nodePositions[0]?.x ?? 0),
      y: UNIFIED_MAP.worlds[0].nodePositions[0]?.y ?? 0
    }
    this.currentNodeIndex = 0
    if (this.profile.currentLevelNodeId) {
      for (let i = 0; i < UNIFIED_MAP.worlds.length; i++) {
        const xOffset = UNIFIED_MAP.xOffsets[i]
        const levels = getLevelsForWorld(i + 1)
        const idx = levels.findIndex(l => l.id === this.profile.currentLevelNodeId)
        if (idx !== -1 && UNIFIED_MAP.worlds[i].nodePositions[idx]) {
          startPos = {
            x: UNIFIED_MAP.worlds[i].nodePositions[idx].x + xOffset,
            y: UNIFIED_MAP.worlds[i].nodePositions[idx].y,
          }
          this.currentNodeIndex = idx
          break
        }
      }
    }

    // Drop shadow beneath avatar
    this.avatarShadow = this.add.ellipse(startPos.x, startPos.y + 2, 16, 6, 0x000000, 0.25)
      .setDepth(999)

    // Regenerate custom avatar texture if needed
    if (this.profile.avatarConfig && !this.textures.exists(this.profile.avatarConfig.id)) {
      AvatarRenderer.generateOne(this, this.profile.avatarConfig, this.profile.equipment)
    }
    const avatarTexture = (this.profile.avatarConfig?.id && this.textures.exists(this.profile.avatarConfig.id))
      ? this.profile.avatarConfig.id
      : (this.profile.avatarChoice || 'avatar_0')
    this.avatarBasePos = { x: startPos.x, y: startPos.y }
this.avatar = this.add.sprite(startPos.x, startPos.y, avatarTexture).setDepth(1000)
    // Scale down the pixel art avatar slightly to fit the map nodes better
    this.avatar.setScale(0.75)
    this.avatar.setOrigin(0.5, 1) // Anchor at bottom center so feet touch the node

    // ── Click-drag panning ───────────────────────────────────
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.isPanning = false
      this.panStartX = ptr.x
      this.panCamStartX = this.cameras.main.scrollX
    })

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown) return
      const dx = ptr.x - this.panStartX
      if (!this.isPanning && Math.abs(dx) > 5) {
        this.isPanning = true
      }
      if (this.isPanning) {
        const vw = this.scale.width
        this.cameras.main.scrollX = Phaser.Math.Clamp(
          this.panCamStartX - dx,
          0,
          UNIFIED_MAP.totalWidth - vw
        )
      }
    })

  }

  update(time: number) {
    if (!this.isGliding && this.avatar) {
      // Idle bobbing
      const bobOffset = Math.sin(time / 200) * 2;
      this.avatar.y = this.avatarBasePos.y + bobOffset;
      this.avatar.x = this.avatarBasePos.x;

      // Keep shadow still but pulse it slightly
      if (this.avatarShadow) {
        this.avatarShadow.setPosition(this.avatarBasePos.x, this.avatarBasePos.y + 2);
        const shadowScale = 1 - (bobOffset * 0.05);
        this.avatarShadow.setScale(shadowScale, shadowScale);
      }
    }

    // ── Edge scroll ──────────────────────────────────────────
    const ptr = this.input.activePointer
    if (ptr && ptr.isDown && this.isPanning) {
      // Edge scroll is handled via drag, skip
    } else if (ptr && ptr.x >= 0 && ptr.x <= this.scale.width) {
      const px = ptr.x
      const vw = this.scale.width
      const threshold = this.EDGE_SCROLL_THRESHOLD
      const maxSpeed = this.EDGE_SCROLL_MAX_SPEED
      let scrollDelta = 0

      if (px < threshold) {
        // Near left edge — scroll left
        scrollDelta = -maxSpeed * (1 - px / threshold)
      } else if (px > vw - threshold) {
        // Near right edge — scroll right
        scrollDelta = maxSpeed * ((px - (vw - threshold)) / threshold)
      }

      if (scrollDelta !== 0) {
        this.cameras.main.scrollX = Phaser.Math.Clamp(
          this.cameras.main.scrollX + scrollDelta,
          0,
          UNIFIED_MAP.totalWidth - vw
        )
      }
    }

    // Dynamic world title
    if (this.worldTitleText) {
      const visibleWorldIdx = worldIndexAtScrollX(
        this.cameras.main.scrollX,
        UNIFIED_MAP.xOffsets,
        UNIFIED_MAP.totalWidth,
        this.scale.width,
      )
      const name = this.worldNameForIndex(visibleWorldIdx)
      if (this.worldTitleText.text !== name) {
        this.worldTitleText.setText(name)
      }
    }
  }

  private isUnlocked(levelId: string): boolean {
    return this.profile.unlockedLevelIds.includes(levelId)
  }

  private meetsGate(level: LevelConfig): boolean {
    if (!level.bossGate) return true
    const { minCombinedStars, levelIds } = level.bossGate
    const total = levelIds.reduce((sum, id) => {
      const r = this.profile.levelResults[id]
      return sum + (r ? r.accuracyStars + r.speedStars : 0)
    }, 0)
    return total >= minCombinedStars
  }

  private drawNodes(levels: LevelConfig[], nodePositions: NodePosition[]) {
    levels.forEach((level, idx) => {
      const pos = nodePositions[idx]
      if (!pos) return

      const unlocked = this.isUnlocked(level.id)
      const gated = !this.meetsGate(level)
      const completed = !!this.profile.levelResults[level.id]

      const color = completed ? 0xffd700
        : unlocked && !gated ? 0xffffff
        : 0x444444

      // 2.5x larger for world bosses
      const baseScale = level.isBoss ? 3.75 : 1.5

      // Base oval
      this.add.ellipse(pos.x, pos.y + (16 * (baseScale / 1.5)), 64 * (baseScale / 1.5), 24 * (baseScale / 1.5), 0x8b6b3a).setDepth(998)

      const nodeFrame = level.isBoss ? COMMON_FRAMES.nodeBoss : level.isMiniBoss ? COMMON_FRAMES.nodeMiniBoss : COMMON_FRAMES.nodeLevel
      const nodeSprite = this.add.sprite(pos.x, pos.y, 'map-common', nodeFrame).setTint(color).setDepth(1000).setScale(baseScale)

      if (unlocked && !gated) {
        nodeSprite.setInteractive({ useHandCursor: true })

        // Hover bounce + glow
        nodeSprite.on('pointerover', () => {
          this.tweens.add({
            targets: nodeSprite,
            scaleX: baseScale * 1.15,
            scaleY: baseScale * 1.15,
            duration: 150,
            ease: 'Back.easeOut',
          })
          // Create glow rect behind node
          this.glowRect?.destroy()
          this.glowRect = this.add.rectangle(
            pos.x, pos.y,
            (nodeSprite.width * baseScale) + 12, (nodeSprite.height * baseScale) + 12,
            0xffffff, 0.2
          ).setDepth(nodeSprite.depth - 1)
          this.showTooltip(level, pos)
        })

        nodeSprite.on('pointerout', () => {
          this.tweens.add({
            targets: nodeSprite,
            scaleX: baseScale,
            scaleY: baseScale,
            duration: 150,
            ease: 'Sine.easeIn',
          })
          this.glowRect?.destroy()
          this.glowRect = undefined
          this.hideTooltip()
        })

        nodeSprite.on('pointerup', () => {
          if (!this.isPanning) this.enterLevel(level, pos)
        })
      }

      // Completion shimmer particles
      if (completed) {
        this.add.particles(pos.x, pos.y, 'map-common', {
          frame: COMMON_FRAMES.particleSpark,
          frequency: 600,
          lifespan: 800,
          quantity: 1,
          tint: 0xffd700,
          scale: { start: 0.4, end: 0 },
          alpha: { start: 0.8, end: 0 },
          speed: { min: 5, max: 15 },
          gravityY: -10,
        })
      }

      // Star display under completed nodes
      if (completed) {
        const r = this.profile.levelResults[level.id]
        // Pixel-art stars: 5 speed + 5 accuracy
        const totalStars = 10
        const startX = pos.x - ((totalStars * 8 + 4) / 2) + 4 // 4px gap between groups
        for (let i = 0; i < 5; i++) {
          const frame = i < r.speedStars ? COMMON_FRAMES.starFilled : COMMON_FRAMES.starEmpty
          this.add.sprite(startX + i * 8, pos.y + 22, 'map-common', frame)
            .setDisplaySize(8, 8).setDepth(2000)
        }
        for (let i = 0; i < 5; i++) {
          const frame = i < r.accuracyStars ? COMMON_FRAMES.starFilled : COMMON_FRAMES.starEmpty
          this.add.sprite(startX + 44 + i * 8, pos.y + 22, 'map-common', frame)
            .setDisplaySize(8, 8).setDepth(2000)
        }
      }

      // Gate hint with pulsing lock
      if (gated && unlocked) {
        const lockText = this.add.text(pos.x, pos.y - 24, '🔒', { fontSize: '14px' })
          .setOrigin(0.5).setDepth(2000).setAlpha(0.8)
        this.tweens.add({
          targets: lockText,
          alpha: { from: 0.4, to: 0.8 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
        })
        const gate = level.bossGate!
        this.add.text(pos.x, pos.y + 24, `Need ${gate.minCombinedStars}★ total`, {
          fontSize: '10px', color: '#ff8888'
        }).setOrigin(0.5).setDepth(2000)
      }
    })
  }

  private drawMasteryChest() {
    const { width } = this.scale
    const world = this.profile.currentWorld ?? 1
    const claimKey = `worldMastery_${world}`

    const masteryItems: Record<number, string> = {
      1: 'Speed Boots',
      2: 'Arcane Focus',
      3: 'Shadow Cloak',
      4: 'Forest Crown',
      5: 'Quill of Power',
    }
    const item = masteryItems[world] ?? 'Mastery Trophy'

    if (!checkWorldMastery(this.profile, world)) return

    const cx = width - 80
    const cy = 120

    if (this.profile.worldMasteryRewards.includes(claimKey)) {
      // Already claimed — show greyed chest
      this.add.rectangle(cx, cy, 50, 50, 0x555555).setDepth(2000).setScrollFactor(0)
      this.add.text(cx, cy, '🏆', { fontSize: '24px' }).setOrigin(0.5).setDepth(2000).setScrollFactor(0)
      this.add.text(cx, cy + 32, 'Claimed', { fontSize: '14px', color: '#888888' }).setOrigin(0.5).setDepth(2000).setScrollFactor(0)
      return
    }

    // Unclaimed — show gold pulsing chest
    const chest = this.add.rectangle(cx, cy, 50, 50, 0xffd700)
      .setInteractive({ useHandCursor: true }).setDepth(2000).setScrollFactor(0)
    this.add.text(cx, cy, '🏆', { fontSize: '24px' }).setOrigin(0.5).setDepth(2000).setScrollFactor(0)
    this.add.text(cx, cy + 32, 'Mastery!', { fontSize: '14px', color: '#ffd700' }).setOrigin(0.5).setDepth(2000).setScrollFactor(0)

    this.tweens.add({
      targets: chest,
      scaleX: 1.15, scaleY: 1.15,
      duration: 700, yoyo: true, repeat: -1,
      ease: 'Sine.easeInOut',
    })

    chest.on('pointerdown', () => {
      this.profile.worldMasteryRewards.push(claimKey)
      saveProfile(this.profileSlot, this.profile)

      const { width: w, height: h } = this.scale
      this.add.rectangle(w / 2, h / 2, 402, 202, 0xffd700).setDepth(3000).setScrollFactor(0)
      this.add.rectangle(w / 2, h / 2, 400, 200, 0x1a1a2e).setDepth(3000).setScrollFactor(0)
      this.add.text(w / 2, h / 2 - 50, '✨ World Mastery Reward! ✨', {
        fontSize: '22px', color: '#ffd700'
      }).setOrigin(0.5).setDepth(3000).setScrollFactor(0)
      this.add.text(w / 2, h / 2, `You earned: ${item}`, {
        fontSize: '20px', color: '#ffffff'
      }).setOrigin(0.5).setDepth(3000).setScrollFactor(0)
      this.add.text(w / 2, h / 2 + 50, 'Click to continue', {
        fontSize: '16px', color: '#aaaaaa'
      }).setOrigin(0.5).setDepth(3000).setScrollFactor(0)

      this.input.once('pointerdown', () => {
        this.scene.restart({ profileSlot: this.profileSlot })
      })
    })
  }

  private tooltipText?: Phaser.GameObjects.Text
  private showTooltip(level: LevelConfig, pos: NodePosition) {
    this.hideTooltip()
    const label = level.isMiniBoss ? '⚔ MINI-BOSS: ' : level.isBoss ? '👑 BOSS: ' : ''
    this.tooltipText = this.add.text(pos.x, pos.y - 35, `${label}${level.name}`, {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#000000',
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setDepth(2000).setAlpha(0)

    this.tweens.add({
      targets: this.tooltipText,
      alpha: 1,
      duration: 150,
    })
  }

  private hideTooltip() {
    if (!this.tooltipText) return
    const text = this.tooltipText
    this.tooltipText = undefined
    this.tweens.add({
      targets: text,
      alpha: 0,
      duration: 100,
      onComplete: () => text.destroy(),
    })
  }

  private drawSettingsButton() {
    const { width } = this.scale
    const btn = this.add.text(width - 20, 20, '⚙ SETTINGS', {
      fontSize: '18px', color: '#aaaaaa', backgroundColor: '#222222', padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(2000).setScrollFactor(0)
    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor('#aaaaaa'))
    btn.on('pointerdown', () => {
      this.scene.start('Settings', { profileSlot: this.profileSlot })
    })
  }

  private drawProfilesButton() {
    const { width } = this.scale
    const btn = this.add.text(width - 20, 55, '👥 PROFILES', {
      fontSize: '18px', color: '#aaaaaa', backgroundColor: '#222222', padding: { x: 8, y: 4 }
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(2000).setScrollFactor(0)
    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor('#aaaaaa'))
    btn.on('pointerdown', () => {
      this.scene.start('ProfileSelect')
    })
  }

  private drawHudButton(
    cx: number,
    cy: number,
    icon: string,
    tooltip: string,
    onClick: () => void,
  ): void {
    const border = this.add.circle(cx, cy, 38, 0xd4af37).setDepth(1999).setScrollFactor(0)
    border.setStrokeStyle(4, 0xffffff)

    const bg = this.add.circle(cx, cy, 34, 0x1a1a2e).setDepth(2000).setScrollFactor(0)

    const iconText = this.add.text(cx, cy, icon, { fontSize: '36px' })
      .setOrigin(0.5).setDepth(2001).setScrollFactor(0)

    const zone = this.add.zone(cx, cy, 90, 90)
      .setInteractive({ useHandCursor: true })
      .setDepth(2002).setScrollFactor(0)

    let tooltipObj: Phaser.GameObjects.Text | undefined

    zone.on('pointerover', () => {
      bg.setFillStyle(0x2a2a4e)
      border.setStrokeStyle(4, 0xffd700)
      this.tweens.add({ targets: iconText, scaleX: 1.2, scaleY: 1.2, duration: 150 })
      tooltipObj = this.add.text(cx, cy - 55, tooltip, {
        fontSize: '12px', color: '#ffffff', backgroundColor: '#000000',
        padding: { x: 6, y: 3 },
      }).setOrigin(0.5).setDepth(2010).setScrollFactor(0)
    })

    zone.on('pointerout', () => {
      bg.setFillStyle(0x1a1a2e)
      border.setStrokeStyle(4, 0xffffff)
      this.tweens.add({ targets: iconText, scaleX: 1, scaleY: 1, duration: 150 })
      tooltipObj?.destroy()
      tooltipObj = undefined
    })

    zone.on('pointerdown', () => {
      this.tweens.add({
        targets: [border, bg, iconText],
        scaleX: 0.9, scaleY: 0.9,
        duration: 50,
        yoyo: true,
        onComplete: onClick,
      })
    })
  }

  /** Emit a short burst of dust particles at the avatar position. */
  private emitDustPuff() {
    if (!this.textures.exists('map-common')) return
    this.add.particles(this.avatar.x, this.avatar.y, 'map-common', {
      frame: COMMON_FRAMES.particleDust,
      quantity: Phaser.Math.Between(5, 8),
      lifespan: 300,
      speed: { min: 15, max: 40 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      emitting: false,
    }).explode()
  }

  /** Move shadow to match avatar base position (shadow sits 2px below base). */
  private syncShadow() {
    if (this.avatarShadow) {
      this.avatarShadow.setPosition(this.avatarBasePos.x, this.avatarBasePos.y + 2)
    }
  }

  /**
   * Compute a sinusoidal walk-bob offset: oscillates ±2px at ~200ms period.
   * Uses wall-clock elapsed time so it works independently of any tween.
   */
  private glideStartTime = 0
  private walkBobOffset(): number {
    const elapsed = this.time.now - this.glideStartTime
    return Math.sin((elapsed / 200) * Math.PI) * 2
  }

  private glideAvatarTo(pos: NodePosition, nodeId: string, onComplete: () => void) {
    if (this.isGliding) return

    const distance = Phaser.Math.Distance.Between(this.avatar.x, this.avatar.y, pos.x, pos.y)

    if (distance < 1) {
      this.profile.currentLevelNodeId = nodeId
      saveProfile(this.profileSlot, this.profile)
      return onComplete()
    }

    this.isGliding = true
    this.glideStartTime = this.time.now

    // Determine if we can use bezier path-following
    const destLevel = ALL_LEVELS.find(l => l.id === nodeId)
    const targetWorld = destLevel?.world ?? 1
    const targetWorldPath = this.worldPaths[targetWorld - 1]
    const worldLevels = getLevelsForWorld(targetWorld)
    const targetLevelIdx = worldLevels.findIndex(l => l.id === nodeId)
    const canUsePath = !!targetWorldPath && targetLevelIdx !== -1

    const finishGlide = () => {
      // Snap to final position (no bob)
      this.avatarBasePos = { x: pos.x, y: pos.y }
      this.avatar.setPosition(pos.x, pos.y)
      this.syncShadow()
      // Update tracking
      if (targetLevelIdx !== -1) {
        this.currentNodeIndex = targetLevelIdx
      }
      // Save current world when glide completes
      if (destLevel) {
        this.profile.currentWorld = destLevel.world
      }
      this.profile.currentLevelNodeId = nodeId
      saveProfile(this.profileSlot, this.profile)
      this.isGliding = false
      // Dust puff on arrival
      this.emitDustPuff()
      onComplete()
    }

    if (canUsePath) {
      // Bezier path-following between nodes
      const numCurves = targetWorldPath!.curves.length
      if (numCurves === 0) {
        this.glideDirectTo(pos, distance, finishGlide)
        return
      }

      const startT = this.currentNodeIndex / numCurves
      const endT = targetLevelIdx / numCurves
      const obj = { val: 0 }

      this.tweens.add({
        targets: obj,
        val: 1,
        duration: Math.max(200, distance * 2),
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          const t = Phaser.Math.Linear(startT, endT, obj.val)
          const clampedT = Phaser.Math.Clamp(t, 0, 1)
          const pt = targetWorldPath!.getPoint(clampedT)
          if (pt) {
            this.avatarBasePos = { x: pt.x, y: pt.y }
            this.avatar.setPosition(pt.x, pt.y + this.walkBobOffset())
            this.syncShadow()
          }
        },
        onComplete: finishGlide,
      })
    } else {
      // Direct tween for special nodes or worlds without paths
      this.glideDirectTo(pos, distance, finishGlide)
    }
  }

  /** Simple direct linear-interpolation tween (used for special nodes or fallback). */
  private glideDirectTo(pos: NodePosition, distance: number, onComplete: () => void) {
    const obj = { val: 0 }
    const startX = this.avatar.x
    const startY = this.avatar.y

    this.tweens.add({
      targets: obj,
      val: 1,
      duration: Math.max(100, distance * 2),
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        const x = Phaser.Math.Linear(startX, pos.x, obj.val)
        const y = Phaser.Math.Linear(startY, pos.y, obj.val)
        this.avatarBasePos = { x, y }
        this.avatar.setPosition(x, y + this.walkBobOffset())
        this.syncShadow()
      },
      onComplete,
    })
  }

  private enterLevel(level: LevelConfig, pos: { x: number; y: number }) {
    if (this.isGliding) return
    this.isGliding = true

    const cam = this.cameras.main
    const vw = this.scale.width
    const isOffScreen = pos.x < cam.scrollX || pos.x > cam.scrollX + vw

    if (isOffScreen) {
      // Tween camera to center on destination, then glide
      const targetScrollX = Phaser.Math.Clamp(
        pos.x - vw / 2,
        0,
        UNIFIED_MAP.totalWidth - vw,
      )
      this.tweens.add({
        targets: cam,
        scrollX: targetScrollX,
        duration: 600,
        ease: 'Sine.easeInOut',
        onComplete: () => this.glideAvatarTo(pos, level.id, () => {
          this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
        }),
      })
    } else {
      this.glideAvatarTo(pos, level.id, () => {
        this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
      })
    }
  }
}
