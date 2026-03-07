// src/scenes/OverlandMapScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile } from '../utils/profile'
import { getLevelsForWorld } from '../data/levels'

interface NodePosition { x: number; y: number }

// Node positions for World 1 — hand-placed on a 1280x720 canvas
const WORLD1_NODE_POSITIONS: Record<string, NodePosition> = {
  w1_l1:   { x: 150, y: 600 },
  w1_l2:   { x: 280, y: 550 },
  w1_l3:   { x: 400, y: 520 },
  w1_mb1:  { x: 520, y: 480 },
  w1_l4:   { x: 640, y: 450 },
  w1_l5:   { x: 750, y: 400 },
  w1_mb2:  { x: 850, y: 360 },
  w1_l6:   { x: 700, y: 300 },
  w1_l7:   { x: 820, y: 260 },
  w1_mb3:  { x: 950, y: 300 },
  w1_l8:   { x: 1050, y: 260 },
  w1_boss: { x: 1150, y: 200 },
  tavern:  { x: 600, y: 600 },
  stable:  { x: 700, y: 600 },
  inventory: { x: 500, y: 600 },
}

export class OverlandMapScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number

  constructor() { super('OverlandMap') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d4a1e)

    // World title
    this.add.text(width / 2, 40, 'World 1 — The Heartland', {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    // Player info
    this.add.text(20, 20, `${this.profile.playerName}  Lv.${this.profile.characterLevel}`, {
      fontSize: '20px', color: '#ffffff'
    })

    const levels = getLevelsForWorld(1)
    this.drawPaths(levels)
    this.drawNodes(levels)
    this.drawSpecialNodes()
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

  private drawPaths(levels: LevelConfig[]) {
    const gfx = this.add.graphics()
    gfx.lineStyle(4, 0x888844)
    levels.forEach((level, i) => {
      if (i === 0) return
      const from = WORLD1_NODE_POSITIONS[levels[i - 1].id]
      const to = WORLD1_NODE_POSITIONS[level.id]
      if (from && to) {
        gfx.beginPath()
        gfx.moveTo(from.x, from.y)
        gfx.lineTo(to.x, to.y)
        gfx.strokePath()
      }
    })
  }

  private drawNodes(levels: LevelConfig[]) {
    levels.forEach(level => {
      const pos = WORLD1_NODE_POSITIONS[level.id]
      if (!pos) return

      const unlocked = this.isUnlocked(level.id)
      const gated = !this.meetsGate(level)
      const completed = !!this.profile.levelResults[level.id]

      const color = completed ? 0xffd700
        : unlocked && !gated ? 0xffffff
        : 0x444444

      const isBoss = level.isBoss || level.isMiniBoss
      const circle = this.add.circle(pos.x, pos.y, isBoss ? 20 : 14, color)

      if (unlocked && !gated) {
        circle.setInteractive({ useHandCursor: true })
        circle.on('pointerover', () => this.showTooltip(level, pos))
        circle.on('pointerout', () => this.hideTooltip())
        circle.on('pointerdown', () => this.enterLevel(level))
      }

      // Star display under completed nodes
      if (completed) {
        const r = this.profile.levelResults[level.id]
        this.add.text(pos.x, pos.y + 22,
          `⚡${r.speedStars} 🎯${r.accuracyStars}`,
          { fontSize: '11px', color: '#ffff88' }
        ).setOrigin(0.5)
      }

      // Gate hint
      if (gated && unlocked) {
        this.add.text(pos.x, pos.y - 24, '🔒', { fontSize: '14px' }).setOrigin(0.5)
        const gate = level.bossGate!
        this.add.text(pos.x, pos.y + 24, `Need avg ${gate.minCombinedStars}★`, {
          fontSize: '10px', color: '#ff8888'
        }).setOrigin(0.5)
      }
    })
  }

  private drawSpecialNodes() {
    // Tavern
    const tp = WORLD1_NODE_POSITIONS['tavern']
    const tavernNode = this.add.rectangle(tp.x, tp.y, 80, 40, 0x6a3a1a)
      .setInteractive({ useHandCursor: true })
    this.add.text(tp.x, tp.y, 'TAVERN', { fontSize: '12px', color: '#ffd700' }).setOrigin(0.5)
    tavernNode.on('pointerdown', () => {
      this.scene.start('Tavern', { profileSlot: this.profileSlot })
    })

    // Stable
    const sp = WORLD1_NODE_POSITIONS['stable']
    const stableNode = this.add.rectangle(sp.x, sp.y, 80, 40, 0x2a5a1a)
      .setInteractive({ useHandCursor: true })
    this.add.text(sp.x, sp.y, 'STABLE', { fontSize: '12px', color: '#aaffaa' }).setOrigin(0.5)
    stableNode.on('pointerdown', () => {
      this.scene.start('Stable', { profileSlot: this.profileSlot })
    })

    // Inventory
    const ip = WORLD1_NODE_POSITIONS['inventory']
    const inventoryNode = this.add.rectangle(ip.x, ip.y, 80, 40, 0x4e4e6a)
      .setInteractive({ useHandCursor: true })
    this.add.text(ip.x, ip.y, 'ITEMS', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5)
    inventoryNode.on('pointerdown', () => {
      this.scene.start('Inventory', { profileSlot: this.profileSlot })
    })
  }

  private tooltipText?: Phaser.GameObjects.Text
  private showTooltip(level: LevelConfig, pos: NodePosition) {
    this.hideTooltip()
    const label = level.isMiniBoss ? '⚔ MINI-BOSS: ' : level.isBoss ? '👑 BOSS: ' : ''
    this.tooltipText = this.add.text(pos.x, pos.y - 35, `${label}${level.name}`, {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#000000',
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5)
  }

  private hideTooltip() {
    this.tooltipText?.destroy()
    this.tooltipText = undefined
  }

  private enterLevel(level: LevelConfig) {
    this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
  }
}