// src/components/LevelHUD.ts
import Phaser from 'phaser'
import { TypingEngine } from './TypingEngine'
import { TypingHands } from './TypingHands'
import { generateHeartTextures } from '../art/dungeonTrapArt'
import { loadProfile } from '../utils/profile'
import {
  DEFAULT_PLAYER_HP,
  HUD_TOP_BAR_H, HUD_BOTTOM_BAR_H,
  HUD_BG_DEPTH, HUD_TEXT_DEPTH,
  HUD_BG_COLOR, HUD_BG_ALPHA, HUD_BORDER_COLOR,
  LEVEL_ENGINE_FONT_SIZE,
} from '../constants'

export interface HUDConfig {
  profileSlot: number

  // Top-left
  heroHp: number                              // initial HP (1–3)

  // Top-center
  levelName: string
  phase?: { current: number; total: number }  // boss only
  bossName?: string                           // boss only
  bossNamePosition?: { x: number; y: number } // required if bossName is provided

  // Top-right
  timer?: {
    seconds: number
    onExpire: () => void
    onTick?: (remaining: number) => void
  }
  counter?: {
    label: string                             // e.g. "Goblins Defeated", "Obstacles", "Orders"
    total: number
  }

  // Bottom bar — typing engine
  wordPool: string[]
  onWordComplete: (word: string, elapsed: number) => void
  onWrongKey: () => void
  engineFontSize?: number
}

export class LevelHUD {
  readonly engine: TypingEngine
  private hearts: Phaser.GameObjects.Image[] = []
  private phaseText?: Phaser.GameObjects.Text
  private counterText?: Phaser.GameObjects.Text
  private timerEvent?: Phaser.Time.TimerEvent
  private typingHands?: TypingHands
  private counterLabel?: string
  private counterTotal?: number
  private phaseTotal?: number
  private _scene!: Phaser.Scene
  private escHandler!: () => void

  constructor(scene: Phaser.Scene, config: HUDConfig) {
    const { width, height } = scene.scale

    generateHeartTextures(scene)

    // ── Panels ────────────────────────────────────────────────────────────────
    const bg = scene.add.graphics().setDepth(HUD_BG_DEPTH)
    bg.fillStyle(HUD_BG_COLOR, HUD_BG_ALPHA)
    bg.fillRect(0, 0, width, HUD_TOP_BAR_H)
    bg.fillRect(0, height - HUD_BOTTOM_BAR_H, width, HUD_BOTTOM_BAR_H)
    bg.fillStyle(HUD_BORDER_COLOR, 1)
    bg.fillRect(0, HUD_TOP_BAR_H, width, 2)
    bg.fillRect(0, height - HUD_BOTTOM_BAR_H, width, 2)

    // ── Top-left: MENU button + HP label + hearts ─────────────────────────────
    this._scene = scene
    this.escHandler = () => {
      if (!scene.scene.isPaused()) {
        scene.scene.pause()
        scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot: config.profileSlot })
        scene.scene.bringToTop('PauseScene')
      }
    }
    scene.input.keyboard?.on('keydown-ESC', this.escHandler)

    scene.add.text(12, 28, '[ MENU ]', {
      fontSize: '14px', color: '#c8a830',
    }).setOrigin(0, 0.5).setDepth(HUD_TEXT_DEPTH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffd966') })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#c8a830') })
      .on('pointerdown', () => {
        if (!scene.scene.isPaused()) {
          scene.scene.pause()
          scene.scene.launch('PauseScene', { levelKey: scene.scene.key, profileSlot: config.profileSlot })
          scene.scene.bringToTop('PauseScene')
        }
      })

    scene.add.text(96, 28, 'HP', {
      fontSize: '13px', color: '#c8a830',
    }).setOrigin(0, 0.5).setDepth(HUD_TEXT_DEPTH)

    for (let i = 0; i < DEFAULT_PLAYER_HP; i++) {
      const key = i < config.heroHp ? 'heart_full' : 'heart_empty'
      const heart = scene.add.image(124 + i * 54, 28, key)
        .setScale(2).setOrigin(0, 0.5).setDepth(HUD_TEXT_DEPTH)
      this.hearts.push(heart)
    }

    // ── Top-center: Level name + phase ────────────────────────────────────────
    scene.add.text(width / 2, 10, config.levelName, {
      fontSize: '18px', color: '#d4b870', fontFamily: 'serif',
    }).setOrigin(0.5, 0).setDepth(HUD_TEXT_DEPTH)

    if (config.phase) {
      this.phaseTotal = config.phase.total
      this.phaseText = scene.add.text(width / 2, 32, `Phase ${config.phase.current} / ${config.phase.total}`, {
        fontSize: '13px', color: '#7a7060',
      }).setOrigin(0.5, 0).setDepth(HUD_TEXT_DEPTH)
    }

    if (config.bossName && config.bossNamePosition) {
      const bannerBg = scene.add.graphics()
      bannerBg.fillStyle(0x000000, 0.7)
      bannerBg.lineStyle(2, HUD_BORDER_COLOR, 1)
      const textPadding = 10
      const nameText = scene.add.text(config.bossNamePosition.x, config.bossNamePosition.y, config.bossName, {
        fontSize: '16px', color: '#ff4444', fontFamily: 'serif', fontStyle: 'bold'
      }).setOrigin(0.5, 0.5).setDepth(HUD_TEXT_DEPTH)

      const bounds = nameText.getBounds()
      bannerBg.fillRect(bounds.x - textPadding, bounds.y - textPadding/2, bounds.width + textPadding*2, bounds.height + textPadding)
      bannerBg.strokeRect(bounds.x - textPadding, bounds.y - textPadding/2, bounds.width + textPadding*2, bounds.height + textPadding)
      bannerBg.setDepth(HUD_BG_DEPTH)
    }

    // ── Top-right: Timer + counter ────────────────────────────────────────────
    if (config.timer) {
      const formatTime = (s: number) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      }

      const timerText = scene.add.text(width - 16, 12, `⏳ ${formatTime(config.timer.seconds)}`, {
        fontSize: '16px', color: '#c8a830',
      }).setOrigin(1, 0).setDepth(HUD_TEXT_DEPTH)

      let timeLeft = config.timer.seconds
      this.timerEvent = scene.time.addEvent({
        delay: 1000,
        repeat: config.timer.seconds - 1,
        callback: () => {
          timeLeft--
          timerText.setText(`⏳ ${formatTime(timeLeft)}`)
          config.timer!.onTick?.(timeLeft)
          if (timeLeft <= 0) config.timer!.onExpire()
        },
      })
    }

    if (config.counter) {
      this.counterLabel = config.counter.label
      this.counterTotal = config.counter.total
      this.counterText = scene.add.text(width - 16, 34, `${config.counter.label}: 0 / ${config.counter.total}`, {
        fontSize: '13px', color: '#c88888',
      }).setOrigin(1, 0).setDepth(HUD_TEXT_DEPTH)
    }

    // ── Bottom bar: TypingEngine ───────────────────────────────────────────────
    const engineY = height - HUD_BOTTOM_BAR_H + 42
    this.engine = new TypingEngine({
      scene,
      x: width / 2,
      y: engineY,
      fontSize: config.engineFontSize ?? LEVEL_ENGINE_FONT_SIZE,
      onWordComplete: config.onWordComplete,
      onWrongKey: config.onWrongKey,
      charDepth: HUD_TEXT_DEPTH + 1,
    })

    // ── Bottom bar: TypingHands ───────────────────────────────────────────────
    const profile = loadProfile(config.profileSlot)
    if (profile?.showFingerHints) {
      this.typingHands = new TypingHands(scene, width / 2, height - 70)
      scene.events.on('typing_next_char', (ch: string) => this.typingHands?.highlightFinger(ch))
    }
  }

  setHeroHp(hp: number): void {
    this.hearts.forEach((heart, i) => {
      heart.setTexture(i < hp ? 'heart_full' : 'heart_empty')
    })
  }

  setPhase(current: number): void {
    this.phaseText?.setText(`Phase ${current} / ${this.phaseTotal}`)
  }

  setCounter(completed: number): void {
    this.counterText?.setText(`${this.counterLabel}: ${completed} / ${this.counterTotal}`)
  }

  destroy(): void {
    this._scene.input.keyboard?.off('keydown-ESC', this.escHandler)
    this.timerEvent?.remove()
    this.engine.destroy()
    this.typingHands?.fadeOut()
  }
}
