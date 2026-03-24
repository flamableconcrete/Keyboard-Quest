// src/scenes/level-types/MonsterManualLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { loadProfile, saveProfile } from '../../utils/profile'
import { BaseLevelScene } from '../BaseLevelScene'
import { ProgressionController } from '../../controllers/ProgressionController'
import { LevelHUD } from '../../components/LevelHUD'
import { DEFAULT_PLAYER_HP } from '../../constants'

export class MonsterManualLevel extends BaseLevelScene {
  private progression!: ProgressionController
  private rightPageContainer!: Phaser.GameObjects.Container
  private pageCounterText!: Phaser.GameObjects.Text
  private wrongKeyOverlay!: Phaser.GameObjects.Rectangle
  private currentPage = 0
  private totalPages = 0

  constructor() { super('MonsterManualLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    if (!this.level.phrases?.length) {
      throw new Error(`MonsterManualLevel: level ${this.level.id} has no phrases`)
    }

    this.totalPages = this.level.phrases.length
    this.currentPage = 1

    this.preCreate(80, height * 0.65, {
      hud: new LevelHUD(this, {
        profileSlot: this.profileSlot,
        heroHp: DEFAULT_PLAYER_HP,
        levelName: this.level.name,
        wordPool: this.level.phrases,
        onWordComplete: this.onWordComplete.bind(this),
        onWrongKey: this.onWrongKey.bind(this),
        timer: this.level.timeLimit ? {
          seconds: this.level.timeLimit,
          onExpire: () => this.endLevel(false),
        } : undefined,
      }),
    })

    // ── Background — Abandoned Crumbling Library ────────────────
    this.drawLibraryBackground(width, height)

    // ── The Book — Giant Pixel Art Tome ─────────────────────────
    this.drawBook(width, height)

    // ── Wrong-key red overlay on right page ─────────────────────
    const bookX = width / 2
    const bookY = height / 2 - 30
    const bookW = 560
    const bookH = 400
    const rightPageX = bookX + 10
    const rightPageW = bookW / 2 - 30
    this.wrongKeyOverlay = this.add.rectangle(
      rightPageX + rightPageW / 2, bookY,
      rightPageW, bookH - 40,
      0xff0000
    ).setAlpha(0).setDepth(15)

    // ── Dust motes ──────────────────────────────────────────────
    this.createDustMotes(width, height)

    // ── Phrase Progression ──────────────────────────────────────
    this.progression = new ProgressionController([...this.level.phrases])
    const first = this.progression.advance()
    if (first[0].type === 'next_word') {
      this.engine.setWord(first[0].word)
    }
  }

  private drawLibraryBackground(width: number, height: number) {
    const bg = this.add.graphics().setDepth(0)

    // Deep navy/charcoal base
    bg.fillStyle(0x0d1117, 1)
    bg.fillRect(0, 0, width, height)

    // ── Bookshelves on left side ─────────────────────────────
    this.drawBookshelf(bg, 0, 0, 120, height)

    // ── Bookshelves on right side ────────────────────────────
    this.drawBookshelf(bg, width - 120, 0, 120, height)

    // ── Broken window center-back ────────────────────────────
    bg.fillStyle(0x1a2a3a, 1)
    bg.fillRect(width / 2 - 60, 20, 120, 140)
    // Jagged outline
    bg.lineStyle(2, 0x334455, 1)
    bg.strokeRect(width / 2 - 60, 20, 120, 140)
    // Crack lines
    bg.lineBetween(width / 2 - 20, 20, width / 2 + 10, 160)
    bg.lineBetween(width / 2 + 30, 20, width / 2 - 10, 100)

    // Moonlight beam — semi-transparent triangle
    const moonlight = this.add.graphics().setDepth(1).setAlpha(0.15)
    moonlight.fillStyle(0x88ccff, 1)
    moonlight.fillTriangle(
      width / 2 - 30, 160,
      width / 2 + 80, height - 60,
      width / 2 - 140, height - 60
    )

    // ── Vines from upper corners ─────────────────────────────
    const vineGfx = this.add.graphics().setDepth(2)
    vineGfx.lineStyle(2, 0x2d5a27, 0.7)
    // Left vine
    this.drawVine(vineGfx, 120, 0, 200, 250)
    // Right vine
    this.drawVine(vineGfx, width - 120, 0, width - 200, 280)
  }

  private drawBookshelf(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    // Shelf frame
    g.fillStyle(0x2a1a0a, 1)
    g.fillRect(x, y, w, h)

    // Horizontal shelf lines
    const shelfCount = 6
    const shelfH = h / shelfCount
    g.lineStyle(2, 0x3a2a1a, 1)
    for (let i = 1; i < shelfCount; i++) {
      g.lineBetween(x, y + i * shelfH, x + w, y + i * shelfH)
    }

    // Book spines — colored rectangles
    const bookColors = [0x8b2500, 0x2e4a1a, 0x4a3728, 0x6b3a3a, 0x3a4a2e, 0x5a3a1a]
    for (let shelf = 0; shelf < shelfCount; shelf++) {
      const shelfY = y + shelf * shelfH + 4
      let bx = x + 4
      while (bx < x + w - 10) {
        const bw = 8 + Math.floor(Math.random() * 12)
        const bh = shelfH - 8 - Math.floor(Math.random() * 10)
        const color = bookColors[Math.floor(Math.random() * bookColors.length)]
        g.fillStyle(color, 0.8)
        g.fillRect(bx, shelfY + (shelfH - 8 - bh), bw, bh)
        bx += bw + 2
      }
    }

    // Debris at base
    g.fillStyle(0x3a2a1a, 0.6)
    for (let i = 0; i < 5; i++) {
      const dx = x + Math.random() * w
      const dy = h - 10 + Math.random() * 10
      g.fillRect(dx, dy, 6 + Math.random() * 8, 3 + Math.random() * 4)
    }
  }

  private drawVine(g: Phaser.GameObjects.Graphics, startX: number, startY: number, endX: number, endY: number) {
    const segments = 8
    let cx = startX
    let cy = startY
    const dx = (endX - startX) / segments
    const dy = (endY - startY) / segments
    for (let i = 0; i < segments; i++) {
      const nx = cx + dx + (Math.random() * 20 - 10)
      const ny = cy + dy
      g.lineBetween(cx, cy, nx, ny)
      cx = nx
      cy = ny
    }
  }

  private drawBook(width: number, height: number) {
    const bookX = width / 2
    const bookY = height / 2 - 30
    const bookW = 560
    const bookH = 400

    const bookGfx = this.add.graphics().setDepth(5)

    // ── Binding border — outer leather frame ─────────────────
    bookGfx.fillStyle(0x3a2210, 1)
    bookGfx.fillRect(bookX - bookW / 2, bookY - bookH / 2, bookW, bookH)

    // ── Spine — center strip ─────────────────────────────────
    bookGfx.fillStyle(0x2a1808, 1)
    bookGfx.fillRect(bookX - 8, bookY - bookH / 2, 16, bookH)

    // ── Left page (decorative) ───────────────────────────────
    const leftPageX = bookX - bookW / 2 + 15
    const leftPageW = bookW / 2 - 30
    const pageY = bookY - bookH / 2 + 15
    const pageH = bookH - 30

    bookGfx.fillStyle(0xc8b896, 1)
    bookGfx.fillRect(leftPageX, pageY, leftPageW, pageH)
    // Darker worn tint
    bookGfx.fillStyle(0x000000, 0.15)
    bookGfx.fillRect(leftPageX, pageY, leftPageW, pageH)

    // Corner jewels
    const jewelColor = 0xcc8833
    const jewelSize = 6
    bookGfx.fillStyle(jewelColor, 1)
    bookGfx.fillRect(bookX - bookW / 2 + 4, bookY - bookH / 2 + 4, jewelSize, jewelSize)
    bookGfx.fillRect(bookX + bookW / 2 - 4 - jewelSize, bookY - bookH / 2 + 4, jewelSize, jewelSize)
    bookGfx.fillRect(bookX - bookW / 2 + 4, bookY + bookH / 2 - 4 - jewelSize, jewelSize, jewelSize)
    bookGfx.fillRect(bookX + bookW / 2 - 4 - jewelSize, bookY + bookH / 2 - 4 - jewelSize, jewelSize, jewelSize)

    // ── Boss silhouette on left page ─────────────────────────
    const silhouetteX = leftPageX + leftPageW / 2
    const silhouetteY = pageY + pageH / 2 - 30
    this.drawBossSilhouette(bookGfx, silhouetteX, silhouetteY, this.level.world)

    // ── Page counter on left page ────────────────────────────
    this.pageCounterText = this.add.text(
      leftPageX + leftPageW / 2, pageY + pageH - 20,
      `Page 1 / ${this.totalPages}`,
      { fontSize: '13px', color: '#7a7060', fontFamily: 'serif' }
    ).setOrigin(0.5).setDepth(10)

    // ── Right page (active typing page) ──────────────────────
    const rightPageX = bookX + 10
    const rightPageW = bookW / 2 - 30

    // Right page container (for flip animation)
    this.rightPageContainer = this.add.container(0, 0).setDepth(8)

    const rightPageGfx = this.add.graphics()
    // Lighter parchment
    rightPageGfx.fillStyle(0xd8c8a6, 1)
    rightPageGfx.fillRect(rightPageX, pageY, rightPageW, pageH)

    // Rune border — faint gold dots
    rightPageGfx.lineStyle(1, 0xc8a830, 0.3)
    const dotSpacing = 8
    for (let dx = rightPageX + 10; dx < rightPageX + rightPageW - 10; dx += dotSpacing) {
      rightPageGfx.fillStyle(0xc8a830, 0.3)
      rightPageGfx.fillRect(dx, pageY + 10, 2, 2)
      rightPageGfx.fillRect(dx, pageY + pageH - 12, 2, 2)
    }
    for (let dy = pageY + 10; dy < pageY + pageH - 10; dy += dotSpacing) {
      rightPageGfx.fillStyle(0xc8a830, 0.3)
      rightPageGfx.fillRect(rightPageX + 10, dy, 2, 2)
      rightPageGfx.fillRect(rightPageX + rightPageW - 12, dy, 2, 2)
    }

    this.rightPageContainer.add(rightPageGfx)

    // Italic header
    const bossNames: Record<number, string> = {
      1: 'Grizzlefang the Ogre',
      2: 'Tiamat, the Lexicon Hydra',
      3: 'Mecha-Wyrm Alpha',
      4: 'The Dice Lich',
      5: 'The Typemancer',
    }
    const headerText = this.add.text(
      rightPageX + rightPageW / 2, pageY + 25,
      `Entry: ${bossNames[this.level.world] ?? 'Unknown'}`,
      { fontSize: '14px', color: '#c8a830', fontFamily: 'serif', fontStyle: 'italic' }
    ).setOrigin(0.5, 0).setDepth(10)
    this.rightPageContainer.add(headerText)
  }

  private drawBossSilhouette(g: Phaser.GameObjects.Graphics, cx: number, cy: number, world: number) {
    g.fillStyle(0x4a3a2a, 0.6)
    switch (world) {
      case 1: // Claw shape for Grizzlefang
        g.fillRect(cx - 20, cy - 30, 8, 50)
        g.fillRect(cx - 8, cy - 40, 8, 60)
        g.fillRect(cx + 4, cy - 35, 8, 55)
        g.fillRect(cx + 16, cy - 25, 8, 45)
        break
      case 2: // Three heads for Hydra
        g.fillRect(cx - 25, cy - 30, 12, 40)
        g.fillRect(cx - 6, cy - 45, 12, 55)
        g.fillRect(cx + 13, cy - 35, 12, 45)
        g.fillRect(cx - 10, cy + 10, 20, 15)
        break
      case 3: // Gear/cog shape for Mecha-Wyrm
        g.fillRect(cx - 20, cy - 20, 40, 40)
        g.fillRect(cx - 25, cy - 5, 50, 10)
        g.fillRect(cx - 5, cy - 25, 10, 50)
        break
      case 4: // Dice shape for Dice Lich
        g.fillRect(cx - 18, cy - 18, 36, 36)
        g.fillStyle(0xc8b896, 1)
        g.fillRect(cx - 6, cy - 6, 5, 5)
        g.fillRect(cx + 2, cy + 2, 5, 5)
        g.fillRect(cx - 12, cy - 12, 4, 4)
        break
      case 5: // Quill shape for Typemancer
        g.fillRect(cx - 3, cy - 40, 6, 60)
        g.fillRect(cx - 10, cy + 15, 20, 8)
        g.fillRect(cx - 1, cy + 20, 2, 15)
        break
    }
  }

  private createDustMotes(width: number, height: number) {
    for (let i = 0; i < 15; i++) {
      const x = 130 + Math.random() * (width - 260)
      const y = 100 + Math.random() * (height - 200)
      const mote = this.add.rectangle(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3, 0xccccaa, 0.3)
        .setDepth(3)

      this.tweens.add({
        targets: mote,
        y: y - 60 - Math.random() * 40,
        x: x + Math.sin(Math.random() * Math.PI * 2) * 30,
        alpha: 0,
        duration: 4000 + Math.random() * 3000,
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          mote.setPosition(
            130 + Math.random() * (width - 260),
            100 + Math.random() * (height - 200)
          )
          mote.setAlpha(0.3)
        },
      })
    }
  }

  protected onWordComplete(_word: string, _elapsed: number) {
    this.spawnWordGold()

    const events = this.progression.advance()
    for (const e of events) {
      switch (e.type) {
        case 'next_word':
          this.doPageFlip(e.word)
          break
        case 'level_complete':
          this.endLevel(true)
          break
      }
    }
  }

  private doPageFlip(nextPhrase: string) {
    this.engine.clearWord()

    // Flip right page closed (scaleX 1 → 0)
    this.tweens.add({
      targets: this.rightPageContainer,
      scaleX: 0,
      duration: 250,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Update page counter
        this.currentPage++
        this.pageCounterText.setText(`Page ${this.currentPage} / ${this.totalPages}`)

        // Flip right page open (scaleX 0 → 1)
        this.tweens.add({
          targets: this.rightPageContainer,
          scaleX: 1,
          duration: 250,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.engine.setWord(nextPhrase)
          },
        })
      },
    })
  }

  protected flashOnWrongKey(): void {
    // Suppress camera flash — use red page overlay instead
    return
  }

  protected onWrongKey() {
    this.flashOnWrongKey()

    // Red overlay flash on right page
    this.tweens.add({
      targets: this.wrongKeyOverlay,
      alpha: { from: 0.4, to: 0 },
      duration: 100,
      ease: 'Linear',
    })
  }

  protected endLevel(passed: boolean) {
    const profile = loadProfile(this.profileSlot)
    if (profile && passed) {
      const worldBossMap: Record<number, string> = {
        1: 'grizzlefang',
        2: 'hydra',
        3: 'clockwork_dragon',
        4: 'badrang',
        5: 'typemancer',
      }
      profile.bossWeaknessKnown = worldBossMap[this.level.world] ?? null
      saveProfile(this.profileSlot, profile)
    }

    super.endLevel(passed)
  }

  update(_time: number, delta: number) {
    super.update(_time, delta)
  }
}
