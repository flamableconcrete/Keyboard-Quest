import { AudioHelper } from '../utils/AudioHelper'
// src/scenes/OverlandMapScene.ts
import Phaser from 'phaser'
import { levelNodeTextureKey } from '../utils/levelNodeTextures'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { ALL_LEVELS, getLevelsForWorld } from '../data/levels'
import { MapRenderer } from '../utils/mapRenderer'
import { UNIFIED_MAP, worldIndexAtScrollX } from '../data/maps/unified'
import { COMMON_FRAMES } from '../data/maps/common'
import { AvatarRenderer } from '../components/AvatarRenderer'
import { MapNavigationController } from '../controllers/MapNavigationController'

interface NodePosition { x: number; y: number }

export class OverlandMapScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private navController!: MapNavigationController
  private avatar!: Phaser.GameObjects.Sprite
  private avatarShadow?: Phaser.GameObjects.Ellipse
  private isGliding = false
  private mapRenderers: MapRenderer[] = []
  private megaPath!: Phaser.Curves.Path
  private allNodeTValues: number[] = []

  private glowRect?: Phaser.GameObjects.Rectangle
  private currentNodeIndex = 0
  private avatarBasePos: NodePosition = { x: 0, y: 0 }
  private isPanning = false
  private panStartX = 0
  private panCamStartX = 0
  private readonly EDGE_SCROLL_THRESHOLD = 60
  private readonly EDGE_SCROLL_MAX_SPEED = 12
  private worldTitleText!: Phaser.GameObjects.Text
  private allNodes: { level: LevelConfig; pos: NodePosition }[] = []
  private dropdownOpen = false
  private hasPointerDownInScene = false
  private dropdownItems: (Phaser.GameObjects.Text | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Zone)[] = []

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
    this.isGliding = false
    this.isPanning = false
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

  /** Draw a bezier path segment connecting each world's boss node to the next world's first node. */
  private drawWorldTransitionPaths(): void {
    const { worlds, xOffsets, worldTransitions } = UNIFIED_MAP
    const gfx = this.add.graphics()
    gfx.lineStyle(6, 0x665533, 0.6)

    for (let i = 0; i < worldTransitions.length; i++) {
      const fromWorld = worlds[i]
      const toWorld = worlds[i + 1]
      if (!fromWorld || !toWorld) continue

      const fromNodes = fromWorld.nodePositions
      const bossNode = fromNodes[fromNodes.length - 1]
      const firstNode = toWorld.nodePositions[0]
      if (!bossNode || !firstNode) continue

      const fx = xOffsets[i] + bossNode.x
      const fy = bossNode.y
      const tx = xOffsets[i + 1] + firstNode.x
      const ty = firstNode.y
      const { cx, cy } = worldTransitions[i]

      const bezier = new Phaser.Curves.QuadraticBezier(
        new Phaser.Math.Vector2(fx, fy),
        new Phaser.Math.Vector2(cx, cy),
        new Phaser.Math.Vector2(tx, ty),
      )
      gfx.beginPath()
      const points = bezier.getPoints(32)
      gfx.moveTo(points[0].x, points[0].y)
      for (let p = 1; p < points.length; p++) {
        gfx.lineTo(points[p].x, points[p].y)
      }
      gfx.strokePath()
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
    if (this.registry.get('isMobile')) {
      this.scene.start('MobileOverlandMap', { profileSlot: this.profileSlot });
      return;
    }
    const profile = loadProfile(this.profileSlot)!
    this.navController = new MapNavigationController(profile)
    this.cameras.main.fadeIn(300, 0, 0, 0)
    const { width } = this.scale

    this.cameras.main.setBounds(0, 0, UNIFIED_MAP.totalWidth, 720)

    // Camera will be snapped to avatar position after startPos is computed below

    this.buildUnifiedMap()

    this.allNodes = []
    UNIFIED_MAP.worlds.forEach((mapData, i) => {
      const xOffset = UNIFIED_MAP.xOffsets[i]
      const worldNum = i + 1
      const levels = getLevelsForWorld(worldNum)
      const positions = mapData.nodePositions.map(p => ({ x: p.x + xOffset, y: p.y }))

      const completedIds = new Set<string>(
        levels.filter(l => !!this.profile.levelResults[l.id]).map(l => l.id)
      )
      this.mapRenderers[i].renderPaths(levels, completedIds)

      this.drawNodes(levels, positions)

      levels.forEach((level, idx) => {
        if (positions[idx]) {
          this.allNodes.push({ level, pos: positions[idx] })
        }
      })
    })

    this.buildMegaPath()

    this.drawWorldTransitionPaths()
    this.drawSettingsButton()
    this.drawProfilesButton()

    const currentWorldIdx = (this.profile.currentWorld ?? 1) - 1
    this.worldTitleText = this.add.text(
      this.scale.width / 2, 40,
      this.worldNameForIndex(currentWorldIdx) + ' ▼',
      { fontSize: '28px', color: '#ffd700' }
    ).setOrigin(0.5).setDepth(2000).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })

    this.worldTitleText.on('pointerdown', (_ptr: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      if (this.isGliding) return
      if (this.dropdownOpen) {
        this.closeWorldDropdown()
      } else {
        this.openWorldDropdown()
      }
    })

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
    this.drawHudButton(w - 420, h - 60, '🏆', 'TROPHIES', () => {
      this.scene.pause()
      this.scene.launch('TrophyRoom', { profileSlot: this.profileSlot })
    })
    this.drawHudButton(70, h - 60, '🧭', 'FIND HERO', () => {
      this.panToAvatar()
    }, '28px')

    let startPos = {
      x: UNIFIED_MAP.xOffsets[0] + (UNIFIED_MAP.worlds[0].nodePositions[0]?.x ?? 0),
      y: UNIFIED_MAP.worlds[0].nodePositions[0]?.y ?? 0
    }
    this.currentNodeIndex = 0
    if (this.profile.currentLevelNodeId) {
      const unifiedIdx = this.allNodes.findIndex(n => n.level.id === this.profile.currentLevelNodeId)
      if (unifiedIdx !== -1) {
        startPos = { ...this.allNodes[unifiedIdx].pos }
        this.currentNodeIndex = unifiedIdx
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

    // Snap camera to center on the avatar so the player is visible immediately
    const vw = this.scale.width
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      startPos.x - vw / 2,
      0,
      UNIFIED_MAP.totalWidth - vw
    )

this.avatar = this.add.sprite(startPos.x, startPos.y, avatarTexture).setDepth(1000)
    // Scale down the pixel art avatar slightly to fit the map nodes better
    this.avatar.setScale(0.75)
    this.avatar.setOrigin(0.5, 1) // Anchor at bottom center so feet touch the node

    // ── Click-drag panning ───────────────────────────────────
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      this.hasPointerDownInScene = true
      this.isPanning = false
      this.panStartX = ptr.x
      this.panCamStartX = this.cameras.main.scrollX
    })

    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (!ptr.isDown) return
      const dx = ptr.x - this.panStartX
      if (!this.isPanning && Math.abs(dx) > 15) {
        this.isPanning = true
      }
      if (this.isPanning) {
        const vw = this.scale.width
        const proposedScrollX = this.panCamStartX - dx
        this.cameras.main.scrollX = -this.navController.clampPan(-proposedScrollX, 0, vw, UNIFIED_MAP.totalWidth).x
      }
    })

    // ── Arrow-key navigation between nodes ───────────────────
    this.input.keyboard!.on('keydown-LEFT', () => this.moveToAdjacentNode(-1))
    this.input.keyboard!.on('keydown-RIGHT', () => this.moveToAdjacentNode(1))
    this.input.keyboard!.on('keydown-ENTER', () => this.enterCurrentNode())
    this.input.keyboard!.on('keydown-SPACE', () => this.enterCurrentNode())
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
        const proposedScrollX = this.cameras.main.scrollX + scrollDelta
        this.cameras.main.scrollX = -this.navController.clampPan(-proposedScrollX, 0, vw, UNIFIED_MAP.totalWidth).x
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
      if (!this.dropdownOpen && this.worldTitleText.text !== name + ' ▼') {
        this.worldTitleText.setText(name + ' ▼')
      }
    }
  }

  private isUnlocked(levelId: string): boolean {
    return this.navController.isUnlocked(levelId)
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

      // 6x for final boss, 2.5x for other world bosses
      const baseScale = level.id === 'w5_boss' ? 9 : level.isBoss ? 3.75 : 1.5

      // Base oval
      this.add.ellipse(pos.x, pos.y + (16 * (baseScale / 1.5)), 64 * (baseScale / 1.5), 24 * (baseScale / 1.5), 0x8b6b3a).setDepth(998)

      const generatedKey = levelNodeTextureKey(level)
      let nodeSprite: Phaser.GameObjects.Sprite
      if (generatedKey) {
        nodeSprite = this.add.sprite(pos.x, pos.y, generatedKey).setTint(color).setDepth(1000).setScale(baseScale)
      } else {
        const bossFrame = level.isBoss ? COMMON_FRAMES.nodeBoss : COMMON_FRAMES.nodeMiniBoss
        nodeSprite = this.add.sprite(pos.x, pos.y, 'map-common', bossFrame).setTint(color).setDepth(1000).setScale(baseScale)
      }

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
          if (!this.isPanning && this.hasPointerDownInScene) this.enterLevel(level, pos)
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
    const btn = this.add.text(width - 20, 55, '⚙ SETTINGS', {
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
    const btn = this.add.text(width - 20, 90, '👥 PROFILES', {
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
    iconSize = '36px',
  ): void {
    const border = this.add.circle(cx, cy, 38, 0xd4af37).setDepth(1999).setScrollFactor(0)
    border.setStrokeStyle(4, 0xffffff)

    const bg = this.add.circle(cx, cy, 34, 0x1a1a2e).setDepth(2000).setScrollFactor(0)

    const iconText = this.add.text(cx, cy, icon, { fontSize: iconSize })
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

  /** Tween the camera to center on the avatar's current position. */
  private panToAvatar(): void {
    const vw = this.scale.width
    const targetScrollX = Phaser.Math.Clamp(
      this.avatarBasePos.x - vw / 2,
      0,
      UNIFIED_MAP.totalWidth - vw,
    )
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: targetScrollX,
      duration: 500,
      ease: 'Sine.easeInOut',
    })
  }

  private isWorldUnlocked(worldIdx: number): boolean {
    return getLevelsForWorld(worldIdx + 1).some(l => this.isUnlocked(l.id))
  }

  private closeWorldDropdown(): void {
    this.dropdownItems.forEach(o => { if (o?.active) o.destroy() })
    this.dropdownItems = []
    this.dropdownOpen = false
  }

  private panToWorld(worldIdx: number): void {
    this.tweens.killTweensOf(this.cameras.main)
    const nodeX = UNIFIED_MAP.xOffsets[worldIdx] + UNIFIED_MAP.worlds[worldIdx].nodePositions[0].x
    const targetScrollX = Phaser.Math.Clamp(
      nodeX - this.scale.width / 2,
      0,
      UNIFIED_MAP.totalWidth - this.scale.width
    )
    this.tweens.add({
      targets: this.cameras.main,
      scrollX: targetScrollX,
      duration: 500,
      ease: 'Sine.easeInOut',
    })
  }

  private openWorldDropdown(): void {
    this.dropdownOpen = true
    const cx = this.scale.width / 2

    const dismissZone = this.add.zone(cx, this.scale.height / 2, this.scale.width, this.scale.height)
      .setInteractive().setDepth(1999).setScrollFactor(0)
    dismissZone.on('pointerdown', (_ptr: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation()
      this.closeWorldDropdown()
    })
    this.dropdownItems.push(dismissZone)

    // Create text items first so we can measure their actual rendered widths
    const items: Phaser.GameObjects.Text[] = []
    ;[0, 1, 2, 3, 4].forEach((i) => {
      const name = this.worldNameForIndex(i)
      const unlocked = this.isWorldUnlocked(i)
      const item = this.add.text(cx, 75 + i * 30, name, {
        fontSize: '20px',
        color: unlocked ? '#ffd700' : '#555555',
      }).setOrigin(0.5, 0.5).setDepth(2100).setScrollFactor(0)

      if (unlocked) {
        item.setInteractive({ useHandCursor: true })
        item.on('pointerover', () => item.setColor('#ffffff'))
        item.on('pointerout', () => item.setColor('#ffd700'))
        item.on('pointerup', () => {
          this.closeWorldDropdown()
          this.panToWorld(i)
        })
      }

      items.push(item)
      this.dropdownItems.push(item)
    })

    // Size background width to fit the widest item (height/position unchanged)
    const maxTextWidth = Math.max(...items.map(t => t.width))
    const bg = this.add.rectangle(cx, 135, maxTextWidth + 40, 160, 0x000000)
      .setAlpha(0.75).setDepth(2099).setScrollFactor(0)
    this.dropdownItems.push(bg)
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

  /**
   * Build a single bezier path that spans all worlds, stitched together with the
   * world-transition beziers.  Compute the arc-length T value for every node in
   * allNodes so getPoint(T) lands exactly on that node.
   */
  private buildMegaPath(): void {
    const { worlds, xOffsets, worldTransitions } = UNIFIED_MAP

    const firstNode = worlds[0].nodePositions[0]
    this.megaPath = new Phaser.Curves.Path(xOffsets[0] + firstNode.x, firstNode.y)

    for (let wi = 0; wi < worlds.length; wi++) {
      const { nodePositions, pathSegments } = worlds[wi]
      const ox = xOffsets[wi]

      // Intra-world curves
      for (let j = 0; j < nodePositions.length - 1; j++) {
        const to = nodePositions[j + 1]
        const tx = ox + to.x
        const ty = to.y
        const seg = pathSegments[j]
        if (seg?.cx !== undefined && seg?.cy !== undefined) {
          this.megaPath.quadraticBezierTo(tx, ty, ox + seg.cx, seg.cy)
        } else {
          this.megaPath.lineTo(tx, ty)
        }
      }

      // Transition bezier to next world
      if (wi < worlds.length - 1) {
        const tr = worldTransitions[wi]
        const nextFirst = worlds[wi + 1].nodePositions[0]
        this.megaPath.quadraticBezierTo(
          xOffsets[wi + 1] + nextFirst.x, nextFirst.y,
          tr.cx, tr.cy,
        )
      }
    }

    // Pre-compute arc-length T for each node in allNodes.
    // Each world i contributes (N_i - 1) intra-world curves + 1 transition curve = N_i curves
    // (except the last world which has N_last - 1 curves).
    // So curveIndex for node j in world i = (sum_{k<i} N_k) + j.
    const curveLengths = this.megaPath.curves.map(c => c.getLength())
    const totalLength = curveLengths.reduce((a, b) => a + b, 0)
    const cumLengths: number[] = [0]
    for (const len of curveLengths) {
      cumLengths.push(cumLengths[cumLengths.length - 1] + len)
    }

    this.allNodeTValues = []
    let curveOffset = 0
    for (let wi = 0; wi < worlds.length; wi++) {
      const nNodes = getLevelsForWorld(wi + 1).length
      for (let j = 0; j < nNodes; j++) {
        const curveIdx = curveOffset + j
        this.allNodeTValues.push((cumLengths[curveIdx] ?? totalLength) / totalLength)
      }
      // World i contributes nNodes curves (nNodes-1 intra + 1 transition) for all but last world
      curveOffset += nNodes
    }
  }

  private readonly GLIDE_DURATION = 550

  private glideAvatarTo(pos: NodePosition, nodeId: string, onComplete: () => void, ease = 'Sine.easeInOut', trackCamera = false) {
    const distance = Phaser.Math.Distance.Between(
      this.avatarBasePos.x, this.avatarBasePos.y, pos.x, pos.y
    )

    if (distance < 1) {
      this.profile.currentLevelNodeId = nodeId
      saveProfile(this.profileSlot, this.profile)
      return onComplete()
    }

    this.isGliding = true
    this.glideStartTime = this.time.now

    const destLevel = ALL_LEVELS.find(l => l.id === nodeId)
    const unifiedIdx = this.allNodes.findIndex(n => n.level.id === nodeId)

    const finishGlide = () => {
      this.avatarBasePos = { x: pos.x, y: pos.y }
      this.avatar.setPosition(pos.x, pos.y)
      this.syncShadow()
      if (unifiedIdx !== -1) {
        this.currentNodeIndex = unifiedIdx
      }
      if (destLevel) {
        this.profile.currentWorld = destLevel.world
      }
      this.profile.currentLevelNodeId = nodeId
      saveProfile(this.profileSlot, this.profile)
      this.isGliding = false
      this.emitDustPuff()
      onComplete()
    }

    const startT = this.allNodeTValues[this.currentNodeIndex] ?? 0
    const endT = this.allNodeTValues[unifiedIdx] ?? 1
    // Click travel: scale duration by path fraction so longer journeys take more time.
    // Keyboard travel: fixed GLIDE_DURATION regardless of distance.
    const duration = trackCamera
      ? Math.max(1800, Math.abs(endT - startT) * 22000)
      : this.GLIDE_DURATION
    const obj = { val: 0 }
    const cam = this.cameras.main
    const vw = this.scale.width

    this.tweens.add({
      targets: obj,
      val: 1,
      duration,
      ease,
      onUpdate: () => {
        const t = Phaser.Math.Clamp(Phaser.Math.Linear(startT, endT, obj.val), 0, 1)
        const pt = this.megaPath.getPoint(t)
        if (pt) {
          this.avatarBasePos = { x: pt.x, y: pt.y }
          this.avatar.setPosition(pt.x, pt.y + this.walkBobOffset())
          this.syncShadow()
          if (trackCamera) {
            this.cameras.main.scrollX = Phaser.Math.Clamp(
              pt.x - vw / 2,
              0,
              UNIFIED_MAP.totalWidth - vw,
            )
          }
        }
      },
      onComplete: () => {
        if (trackCamera) {
          cam.scrollX = Phaser.Math.Clamp(pos.x - vw / 2, 0, UNIFIED_MAP.totalWidth - vw)
        }
        finishGlide()
      },
    })
  }


  /** Move the hero to the next or previous unlocked node. */
  private moveToAdjacentNode(direction: -1 | 1): void {
    if (this.isGliding) return

    let nextIdx = this.currentNodeIndex + direction
    // Skip over locked/gated nodes in the given direction
    while (nextIdx >= 0 && nextIdx < this.allNodes.length) {
      const node = this.allNodes[nextIdx]
      if (this.isUnlocked(node.level.id) && this.meetsGate(node.level)) break
      nextIdx += direction
    }
    if (nextIdx < 0 || nextIdx >= this.allNodes.length) return

    const { level, pos } = this.allNodes[nextIdx]
    this.isGliding = true

    const cam = this.cameras.main
    const vw = this.scale.width
    const isOffScreen = pos.x < cam.scrollX || pos.x > cam.scrollX + vw

    if (isOffScreen) {
      const targetScrollX = Phaser.Math.Clamp(pos.x - vw / 2, 0, UNIFIED_MAP.totalWidth - vw)
      this.tweens.add({
        targets: cam,
        scrollX: targetScrollX,
        duration: 400,
        ease: 'Sine.easeInOut',
        onComplete: () => this.glideAvatarTo(pos, level.id, () => { this.isGliding = false }),
      })
    } else {
      this.glideAvatarTo(pos, level.id, () => { this.isGliding = false })
    }
  }

  /** Enter the level the hero is currently standing on. */
  private enterCurrentNode(): void {
    if (this.isGliding) return
    const node = this.allNodes[this.currentNodeIndex]
    if (!node) return
    if (!this.isUnlocked(node.level.id) || !this.meetsGate(node.level)) return
    this.enterLevel(node.level, node.pos)
  }

  private enterLevel(level: LevelConfig, pos: { x: number; y: number }) {
    if (this.isGliding) return
    this.isGliding = true
    this.glideAvatarTo(pos, level.id, () => {
      this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
    }, 'Sine.easeInOut', true)
  }
}
