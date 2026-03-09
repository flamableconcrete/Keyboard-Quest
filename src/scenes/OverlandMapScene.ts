// src/scenes/OverlandMapScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getLevelsForWorld } from '../data/levels'
import { checkWorldMastery } from '../utils/scoring'

interface NodePosition { x: number; y: number }

const WORLD_NAMES: Record<number, string> = {
  1: 'World 1 — The Heartland',
  2: 'World 2 — The Shadowed Fen',
  3: 'World 3 — The Ember Peaks',
  4: 'World 4 — The Shrouded Wilds',
  5: "World 5 — The Typemancer's Tower",
}

const WORLD_BG_COLORS: Record<number, number> = {
  1: 0x2d4a1e,
  2: 0x1a2a3a,
  3: 0x3a2a1a,
  4: 0x1a3a1a,
  5: 0x2a1a3a,
}

// Node positions — hand-placed on a 1280x720 canvas
// Reused across worlds (world prefix differs, layout is the same)
const NODE_LAYOUT: NodePosition[] = [
  { x: 150, y: 600 }, // l1
  { x: 280, y: 550 }, // l2
  { x: 400, y: 520 }, // l3
  { x: 520, y: 480 }, // mb1
  { x: 640, y: 450 }, // l4
  { x: 750, y: 400 }, // l5
  { x: 850, y: 360 }, // mb2
  { x: 700, y: 300 }, // l6
  { x: 820, y: 260 }, // l7
  { x: 950, y: 300 }, // mb3
  { x: 1050, y: 260 }, // l8/l9
  { x: 1150, y: 200 }, // boss
]

const SPECIAL_NODE_POSITIONS: Record<string, NodePosition> = {
  tavern:    { x: 600, y: 640 },
  stable:    { x: 720, y: 640 },
  inventory: { x: 480, y: 640 },
}

export class OverlandMapScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number
  private currentWorld!: number

  constructor() { super('OverlandMap') }

  init(data: { profileSlot: number; world?: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
    this.currentWorld = data.world ?? this.profile.currentWorld ?? 1
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.tileSprite(width / 2, height / 2, width, height, 'tile-grass')
      .setTint(WORLD_BG_COLORS[this.currentWorld] ?? 0xffffff)

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
    this.drawPaths(levels)
    this.drawNodes(levels)
    this.drawSpecialNodes()
    this.drawMasteryChest()
    this.drawSettingsButton()
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
        this.scene.start('OverlandMap', { profileSlot: this.profileSlot, world: this.currentWorld - 1 })
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
          this.scene.start('OverlandMap', { profileSlot: this.profileSlot, world: this.currentWorld + 1 })
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

  private drawPaths(levels: LevelConfig[]) {
    const gfx = this.add.graphics()
    gfx.lineStyle(4, 0x888844)
    levels.forEach((_level, i) => {
      if (i === 0) return
      const from = NODE_LAYOUT[i - 1]
      const to = NODE_LAYOUT[i]
      if (from && to) {
        gfx.beginPath()
        gfx.moveTo(from.x, from.y)
        gfx.lineTo(to.x, to.y)
        gfx.strokePath()
      }
    })
  }

  private drawNodes(levels: LevelConfig[]) {
    levels.forEach((level, idx) => {
      const pos = NODE_LAYOUT[idx]
      if (!pos) return

      const unlocked = this.isUnlocked(level.id)
      const gated = !this.meetsGate(level)
      const completed = !!this.profile.levelResults[level.id]

      const color = completed ? 0xffd700
        : unlocked && !gated ? 0xffffff
        : 0x444444

      const spriteKey = level.isBoss ? 'node-boss' : level.isMiniBoss ? 'node-cave' : 'node-castle'
      const nodeSprite = this.add.sprite(pos.x, pos.y, spriteKey).setTint(color)

      if (unlocked && !gated) {
        nodeSprite.setInteractive({ useHandCursor: true })
        nodeSprite.on('pointerover', () => this.showTooltip(level, pos))
        nodeSprite.on('pointerout', () => this.hideTooltip())
        nodeSprite.on('pointerdown', () => this.enterLevel(level))
      }

      // Star display under completed nodes
      if (completed) {
        const r = this.profile.levelResults[level.id]
        this.add.text(pos.x, pos.y + 22,
          `⚡${r.speedStars} 🎯${r.accuracyStars}`,
          { fontSize: '11px', color: '#ffff88' }
        ).setOrigin(0.5).setDepth(10)
      }

      // Gate hint
      if (gated && unlocked) {
        this.add.text(pos.x, pos.y - 24, '🔒', { fontSize: '14px' }).setOrigin(0.5).setDepth(10)
        const gate = level.bossGate!
        this.add.text(pos.x, pos.y + 24, `Need avg ${gate.minCombinedStars}★`, {
          fontSize: '10px', color: '#ff8888'
        }).setOrigin(0.5).setDepth(10)
      }
    })
  }

  private drawSpecialNodes() {
    // Tavern
    const tp = SPECIAL_NODE_POSITIONS['tavern']
    const tavernNode = this.add.sprite(tp.x, tp.y, 'node-castle')
      .setInteractive({ useHandCursor: true })
    this.add.text(tp.x, tp.y + 20, 'TAVERN', { fontSize: '12px', color: '#ffd700' }).setOrigin(0.5).setDepth(10)
    tavernNode.on('pointerdown', () => {
      this.scene.start('Tavern', { profileSlot: this.profileSlot })
    })

    // Stable
    const sp = SPECIAL_NODE_POSITIONS['stable']
    const stableNode = this.add.sprite(sp.x, sp.y, 'node-cave')
      .setInteractive({ useHandCursor: true })
    this.add.text(sp.x, sp.y + 20, 'STABLE', { fontSize: '12px', color: '#aaffaa' }).setOrigin(0.5).setDepth(10)
    stableNode.on('pointerdown', () => {
      this.scene.start('Stable', { profileSlot: this.profileSlot })
    })

    // Inventory
    const ip = SPECIAL_NODE_POSITIONS['inventory']
    const inventoryNode = this.add.sprite(ip.x, ip.y, 'node-castle')
      .setInteractive({ useHandCursor: true })
    this.add.text(ip.x, ip.y + 20, 'ITEMS', { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5).setDepth(10)
    inventoryNode.on('pointerdown', () => {
      this.scene.start('Inventory', { profileSlot: this.profileSlot })
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
    }).setOrigin(0.5).setDepth(10)
  }

  private hideTooltip() {
    this.tooltipText?.destroy()
    this.tooltipText = undefined
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

  private enterLevel(level: LevelConfig) {
    this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
  }
}