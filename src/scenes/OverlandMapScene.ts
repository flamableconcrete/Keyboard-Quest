// src/scenes/OverlandMapScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getLevelsForWorld } from '../data/levels'
import { checkWorldMastery } from '../utils/scoring'
import { MapRenderer } from '../utils/mapRenderer'
import { WORLD1_MAP } from '../data/maps/world1'
import { WORLD2_MAP } from '../data/maps/world2'
import { WORLD3_MAP } from '../data/maps/world3'
import { WORLD4_MAP } from '../data/maps/world4'
import { WORLD5_MAP } from '../data/maps/world5'
import type { WorldMapData } from '../data/maps/types'
import { COMMON_FRAMES } from '../data/maps/common'

interface NodePosition { x: number; y: number }

const WORLD_NAMES: Record<number, string> = {
  1: 'World 1 — The Heartland',
  2: 'World 2 — The Shadowed Fen',
  3: 'World 3 — The Ember Peaks',
  4: 'World 4 — The Shrouded Wilds',
  5: "World 5 — The Typemancer's Tower",
}

export class OverlandMapScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private currentWorld!: number
  private avatar!: Phaser.GameObjects.Sprite
  private avatarShadow?: Phaser.GameObjects.Ellipse
  private isGliding = false
  private mapRenderer?: MapRenderer
  private glowRect?: Phaser.GameObjects.Rectangle
  private currentNodeIndex = 0
  /** Composite bezier path for avatar path-following (used by Task 8). */
  worldPath?: Phaser.Curves.Path

  constructor() { super('OverlandMap') }

  init(data: { profileSlot: number; world?: number }) {
    this.profileSlot = data.profileSlot
    const profile = loadProfile(this.profileSlot)
    if (!profile) {
      this.scene.start('ProfileSelect')
      return
    }
    this.profile = profile
    this.currentWorld = data.world ?? this.profile.currentWorld ?? 1
  }

  /** Returns map data for the given world. */
  private getMapData(world: number): WorldMapData {
    switch (world) {
      case 1: return WORLD1_MAP
      case 2: return WORLD2_MAP
      case 3: return WORLD3_MAP
      case 4: return WORLD4_MAP
      case 5: return WORLD5_MAP
      default: return WORLD1_MAP
    }
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 0, 0)
    const { width } = this.scale
    const mapData = this.getMapData(this.currentWorld)

    // Tilemap-based rendering
    this.mapRenderer = new MapRenderer(this, mapData)
    this.mapRenderer.renderTileLayers()
    this.mapRenderer.renderDecorations()
    this.mapRenderer.startAtmosphere()
    this.mapRenderer.startAnimatedTiles()

    // World title
    this.add.text(width / 2, 40, WORLD_NAMES[this.currentWorld] ?? `World ${this.currentWorld}`, {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5).setDepth(10)

    // Player info
    this.add.text(20, 20, `${this.profile.playerName}  Lv.${this.profile.characterLevel}`, {
      fontSize: '20px', color: '#ffffff'
    }).setDepth(10)

    this.add.text(width - 20, 20, `Gold: ${this.profile.gold ?? 0}`, {
      fontSize: '20px', color: '#ffd700'
    }).setOrigin(1, 0).setDepth(10)

    // World navigation arrows
    this.drawWorldArrows()

    const levels = getLevelsForWorld(this.currentWorld)

    // Bezier paths
    const completedIds = new Set<string>(
      levels.filter(l => !!this.profile.levelResults[l.id]).map(l => l.id)
    )
    this.worldPath = this.mapRenderer!.renderPaths(levels, completedIds)

    this.drawNodes(levels, mapData.nodePositions)
    this.drawSpecialNodes(mapData.specialNodes)
    this.drawMasteryChest()
    this.drawSettingsButton()

    let startPos = mapData.nodePositions[0] || { x: 0, y: 0 }
    this.currentNodeIndex = 0
    if (this.profile.currentLevelNodeId) {
      const idx = levels.findIndex(l => l.id === this.profile.currentLevelNodeId)
      if (idx !== -1 && mapData.nodePositions[idx]) {
        startPos = mapData.nodePositions[idx]
        this.currentNodeIndex = idx
      } else if (mapData.specialNodes[this.profile.currentLevelNodeId]) {
        startPos = mapData.specialNodes[this.profile.currentLevelNodeId]
      }
    }

    // Drop shadow beneath avatar
    this.avatarShadow = this.add.ellipse(startPos.x, startPos.y + 2, 16, 6, 0x000000, 0.25)
      .setDepth(4)
    this.avatar = this.add.sprite(startPos.x, startPos.y, 'avatar').setDepth(5)
  }

  private drawWorldArrows() {
    const { height } = this.scale
    const maxWorld = 5

    // Previous world arrow
    if (this.currentWorld > 1) {
      const prev = this.add.text(30, height / 2, '◀', {
        fontSize: '36px', color: '#aaaaff'
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(10)
      prev.on('pointerdown', () => {
        this.profile.currentWorld = this.currentWorld - 1
        saveProfile(this.profileSlot, this.profile)
        this.cameras.main.fadeOut(300, 0, 0, 0)
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('OverlandMap', { profileSlot: this.profileSlot, world: this.currentWorld - 1 })
        })
      })
      this.add.text(30, height / 2 + 30, `W${this.currentWorld - 1}`, {
        fontSize: '14px', color: '#aaaaff'
      }).setOrigin(0, 0.5).setDepth(10)
    }

    // Next world arrow — only if world boss beaten
    if (this.currentWorld < maxWorld) {
      const bossLevel = getLevelsForWorld(this.currentWorld).find(l => l.isBoss)
      const worldCleared = bossLevel ? !!this.profile.levelResults[bossLevel.id] : false
      const { width, height: h } = this.scale
      if (worldCleared) {
        const next = this.add.text(width - 30, h / 2, '▶', {
          fontSize: '36px', color: '#aaffaa'
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setDepth(10)
        next.on('pointerdown', () => {
          this.profile.currentWorld = this.currentWorld + 1
          saveProfile(this.profileSlot, this.profile)
          this.cameras.main.fadeOut(300, 0, 0, 0)
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('OverlandMap', { profileSlot: this.profileSlot, world: this.currentWorld + 1 })
          })
        })
        this.add.text(width - 30, h / 2 + 30, `W${this.currentWorld + 1}`, {
          fontSize: '14px', color: '#aaffaa'
        }).setOrigin(1, 0.5).setDepth(10)
      } else {
        const { width: w } = this.scale
        this.add.text(w - 30, h / 2, '🔒', { fontSize: '24px' }).setOrigin(1, 0.5).setDepth(10)
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
    const avg = total / levelIds.length
    return avg >= minCombinedStars
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

      const nodeFrame = level.isBoss ? COMMON_FRAMES.nodeBoss : level.isMiniBoss ? COMMON_FRAMES.nodeMiniBoss : COMMON_FRAMES.nodeLevel
      const nodeSprite = this.add.sprite(pos.x, pos.y, 'map-common', nodeFrame).setTint(color)

      if (unlocked && !gated) {
        nodeSprite.setInteractive({ useHandCursor: true })

        // Hover bounce + glow
        nodeSprite.on('pointerover', () => {
          this.tweens.add({
            targets: nodeSprite,
            scaleX: 1.15,
            scaleY: 1.15,
            duration: 150,
            ease: 'Back.easeOut',
          })
          // Create glow rect behind node
          this.glowRect?.destroy()
          this.glowRect = this.add.rectangle(
            pos.x, pos.y,
            nodeSprite.width + 12, nodeSprite.height + 12,
            0xffffff, 0.2
          ).setDepth(nodeSprite.depth - 1)
          this.showTooltip(level, pos)
        })

        nodeSprite.on('pointerout', () => {
          this.tweens.add({
            targets: nodeSprite,
            scaleX: 1,
            scaleY: 1,
            duration: 150,
            ease: 'Sine.easeIn',
          })
          this.glowRect?.destroy()
          this.glowRect = undefined
          this.hideTooltip()
        })

        nodeSprite.on('pointerdown', () => this.enterLevel(level, pos))
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
            .setDisplaySize(8, 8).setDepth(10)
        }
        for (let i = 0; i < 5; i++) {
          const frame = i < r.accuracyStars ? COMMON_FRAMES.starFilled : COMMON_FRAMES.starEmpty
          this.add.sprite(startX + 44 + i * 8, pos.y + 22, 'map-common', frame)
            .setDisplaySize(8, 8).setDepth(10)
        }
      }

      // Gate hint with pulsing lock
      if (gated && unlocked) {
        const lockText = this.add.text(pos.x, pos.y - 24, '🔒', { fontSize: '14px' })
          .setOrigin(0.5).setDepth(10).setAlpha(0.8)
        this.tweens.add({
          targets: lockText,
          alpha: { from: 0.4, to: 0.8 },
          duration: 1000,
          yoyo: true,
          repeat: -1,
        })
        const gate = level.bossGate!
        this.add.text(pos.x, pos.y + 24, `Need avg ${gate.minCombinedStars}★`, {
          fontSize: '10px', color: '#ff8888'
        }).setOrigin(0.5).setDepth(10)
      }
    })
  }

  private drawSpecialNodes(specialPositions: Record<string, NodePosition>) {
    // Tavern
    const tp = specialPositions['tavern']
    const tavernNode = this.add.sprite(tp.x, tp.y, 'map-common', COMMON_FRAMES.nodeTavern)
      .setInteractive({ useHandCursor: true })
    this.add.text(tp.x, tp.y + 20, 'TAVERN', { fontSize: '12px', color: '#ffd700' }).setOrigin(0.5).setDepth(10)
    tavernNode.on('pointerdown', () => {
      this.glideAvatarTo(tp, 'tavern', () => {
        this.scene.start('Tavern', { profileSlot: this.profileSlot })
      })
    })

    // Stable
    const sp = specialPositions['stable']
    const stableNode = this.add.sprite(sp.x, sp.y, 'map-common', COMMON_FRAMES.nodeStable)
      .setInteractive({ useHandCursor: true })
    this.add.text(sp.x, sp.y + 20, 'STABLE', { fontSize: '12px', color: '#aaffaa' }).setOrigin(0.5).setDepth(10)
    stableNode.on('pointerdown', () => {
      this.glideAvatarTo(sp, 'stable', () => {
        this.scene.start('Stable', { profileSlot: this.profileSlot })
      })
    })

    // Inventory
    const ip = specialPositions['inventory']
    const inventoryNode = this.add.sprite(ip.x, ip.y, 'map-common', COMMON_FRAMES.nodeInventory)
      .setInteractive({ useHandCursor: true })
    this.add.text(ip.x, ip.y + 20, 'ITEMS', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setDepth(10)
    inventoryNode.on('pointerdown', () => {
      this.glideAvatarTo(ip, 'inventory', () => {
        this.scene.start('Inventory', { profileSlot: this.profileSlot })
      })
    })
  }

  private drawMasteryChest() {
    const { width } = this.scale
    const world = this.currentWorld
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
      this.add.rectangle(cx, cy, 50, 50, 0x555555)
      this.add.text(cx, cy, '🏆', { fontSize: '24px' }).setOrigin(0.5)
      this.add.text(cx, cy + 32, 'Claimed', { fontSize: '14px', color: '#888888' }).setOrigin(0.5)
      return
    }

    // Unclaimed — show gold pulsing chest
    const chest = this.add.rectangle(cx, cy, 50, 50, 0xffd700)
      .setInteractive({ useHandCursor: true })
    this.add.text(cx, cy, '🏆', { fontSize: '24px' }).setOrigin(0.5)
    this.add.text(cx, cy + 32, 'Mastery!', { fontSize: '14px', color: '#ffd700' }).setOrigin(0.5)

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
      this.add.rectangle(w / 2, h / 2, 402, 202, 0xffd700)
      this.add.rectangle(w / 2, h / 2, 400, 200, 0x1a1a2e)
      this.add.text(w / 2, h / 2 - 50, '✨ World Mastery Reward! ✨', {
        fontSize: '22px', color: '#ffd700'
      }).setOrigin(0.5)
      this.add.text(w / 2, h / 2, `You earned: ${item}`, {
        fontSize: '20px', color: '#ffffff'
      }).setOrigin(0.5)
      this.add.text(w / 2, h / 2 + 50, 'Click to continue', {
        fontSize: '16px', color: '#aaaaaa'
      }).setOrigin(0.5)

      this.input.once('pointerdown', () => {
        this.scene.restart({ profileSlot: this.profileSlot, world: this.currentWorld })
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
    }).setOrigin(0.5).setDepth(10).setAlpha(0)

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
    const btn = this.add.text(width - 20, 50, '⚙ SETTINGS', {
      fontSize: '18px', color: '#aaaaaa'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(10)
    btn.on('pointerover', () => btn.setColor('#ffffff'))
    btn.on('pointerout', () => btn.setColor('#aaaaaa'))
    btn.on('pointerdown', () => {
      this.scene.start('Settings', { profileSlot: this.profileSlot })
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

  /** Move shadow to match avatar position (shadow sits 2px below). */
  private syncShadow() {
    if (this.avatarShadow) {
      this.avatarShadow.setPosition(this.avatar.x, this.avatar.y + 2)
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
    const levels = getLevelsForWorld(this.currentWorld)
    const targetLevelIdx = levels.findIndex(l => l.id === nodeId)
    const canUsePath = this.worldPath && targetLevelIdx !== -1

    const finishGlide = () => {
      // Snap to final position (no bob)
      this.avatar.setPosition(pos.x, pos.y)
      this.syncShadow()
      // Update tracking
      if (targetLevelIdx !== -1) {
        this.currentNodeIndex = targetLevelIdx
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
      const numCurves = this.worldPath!.curves.length
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
          const pt = this.worldPath!.getPoint(clampedT)
          if (pt) {
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
        this.avatar.setPosition(x, y + this.walkBobOffset())
        this.syncShadow()
      },
      onComplete,
    })
  }

  private enterLevel(level: LevelConfig, pos: NodePosition) {
    this.glideAvatarTo(pos, level.id, () => {
      this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
    })
  }
}
