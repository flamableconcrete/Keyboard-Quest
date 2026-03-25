// src/scenes/level-types/MonsterManualLevel.ts
import { LevelConfig } from '../../types'
import { loadProfile, saveProfile } from '../../utils/profile'
import { BaseLevelScene } from '../BaseLevelScene'
import { LevelHUD } from '../../components/LevelHUD'
import { DEFAULT_PLAYER_HP, HUD_TOP_BAR_H, HUD_BOTTOM_BAR_H } from '../../constants'

const PHRASES_PER_PAGE = 7

export class MonsterManualLevel extends BaseLevelScene {
  private wrongKeyOverlay!: Phaser.GameObjects.Rectangle

  // All phrases and pagination
  private allPhrases: string[] = []
  private pages: string[][] = []        // phrases grouped into pages
  private currentPageIdx = 0
  private pageTypedCount = 0            // chars typed in current page text
  private transitioning = false

  // Page text: phrases joined by ". "
  private pageText = ''

  // Scroll rendering objects
  private scrollTextObjects: Phaser.GameObjects.GameObject[] = []
  private textAreaX = 0
  private textAreaY = 0
  private textAreaW = 0

  // Scroll dimensions
  private scrollX = 0
  private scrollY = 0
  private scrollW = 0
  private scrollH = 0

  // Monster portrait area
  private portraitSize = 0

  // Page counter
  private pageCounterText!: Phaser.GameObjects.Text

  constructor() { super('MonsterManualLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
  }

  create() {
    const { width, height } = this.scale

    if (!this.level.phrases?.length) {
      throw new Error(`MonsterManualLevel: level ${this.level.id} has no phrases`)
    }

    this.allPhrases = this.pickRandomPhrases(this.level.phrases)
    this.pages = this.buildPages(this.allPhrases)
    this.currentPageIdx = 0
    this.pageTypedCount = 0
    this.transitioning = false

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

    // ── The Scroll ─────────────────────────────────────────────
    this.drawScroll(width, height)

    // ── Monster portrait ───────────────────────────────────────
    this.drawMonsterPortrait()

    // ── Wrong-key red overlay on scroll ─────────────────────────
    this.wrongKeyOverlay = this.add.rectangle(
      this.scrollX + this.scrollW / 2,
      this.scrollY + this.scrollH / 2,
      this.scrollW, this.scrollH,
      0xff0000
    ).setAlpha(0).setDepth(15)

    // ── Dust motes ──────────────────────────────────────────────
    this.createDustMotes(width, height)

    // ── Build page text and start typing ────────────────────────
    this.buildPageText()
    this.renderPageText()
    const firstWord = this.getCurrentWord()
    if (firstWord) {
      this.engine.setWord(firstWord, firstWord === ' ' ? '<space>' : undefined)
    }

    // Re-render scroll on every character typed
    this.events.on('typing_next_char', () => this.renderPageText())
  }

  // ── Pagination ────────────────────────────────────────────────

  /** Pick a random subset of 18–20 phrases (or all if fewer than 20). */
  private pickRandomPhrases(phrases: string[]): string[] {
    if (phrases.length <= 20) return [...phrases]
    const count = 18 + Math.floor(Math.random() * 3) // 18, 19, or 20
    const shuffled = [...phrases].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  private buildPages(phrases: string[]): string[][] {
    const pages: string[][] = []
    for (let i = 0; i < phrases.length; i += PHRASES_PER_PAGE) {
      pages.push(phrases.slice(i, i + PHRASES_PER_PAGE))
    }
    return pages
  }

  /** Build the page text by joining phrases with ". " */
  private buildPageText() {
    const page = this.pages[this.currentPageIdx]
    this.pageText = page.join('. ') + '.'
  }

  // ── Word / phrase token helpers ────────────────────────────────

  private getCurrentWord(): string | null {
    const remaining = this.pageText.slice(this.pageTypedCount)
    if (!remaining) return null
    const tokens = this.splitIntoTokens(remaining)
    return tokens.length > 0 ? tokens[0] : null
  }

  /** Split text into tokens: words and spaces as separate tokens. */
  private splitIntoTokens(text: string): string[] {
    const tokens: string[] = []
    let i = 0
    while (i < text.length) {
      if (text[i] === ' ') {
        tokens.push(' ')
        i++
      } else {
        let j = i
        while (j < text.length && text[j] !== ' ') j++
        tokens.push(text.slice(i, j))
        i = j
      }
    }
    return tokens
  }

  // ── Scroll text rendering ─────────────────────────────────────

  private computePageTypedCount(): number {
    const partialWord = this.engine?.getTypedSoFar().length ?? 0
    return this.pageTypedCount + partialWord
  }

  private renderPageText() {
    this.scrollTextObjects.forEach(o => o.destroy())
    this.scrollTextObjects = []

    if (!this.pageText) return

    const fontSize = 22
    const lineHeight = fontSize * 1.5
    const charW = fontSize * 0.56
    const typedCount = this.computePageTypedCount()

    // Word-wrap the full page text
    const lines = this.wrapText(this.pageText, charW)
    let globalIdx = 0
    let cursorY = this.textAreaY

    for (const line of lines) {
      const startX = this.textAreaX
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci]
        const gIdx = globalIdx + ci
        let color = '#333333'
        let fontStyle: string = 'normal'

        if (gIdx < typedCount) {
          fontStyle = 'bold'
          color = '#111111'
        } else if (gIdx === typedCount) {
          fontStyle = 'bold'
          color = '#000000'
        }

        const t = this.add.text(startX + ci * charW, cursorY, ch, {
          fontSize: `${fontSize}px`,
          color,
          fontStyle: fontStyle as 'bold' | 'normal',
          fontFamily: 'monospace',
        }).setOrigin(0, 0).setDepth(12)
        this.scrollTextObjects.push(t)

        // Underline for active character
        if (gIdx === typedCount) {
          const underline = this.add.rectangle(
            startX + ci * charW + charW / 2,
            cursorY + fontSize + 2,
            charW, 2, 0x000000
          ).setDepth(12)
          this.scrollTextObjects.push(underline)
        }
      }
      globalIdx += line.length
      cursorY += lineHeight
    }
  }

  private wrapText(text: string, charW: number): string[] {
    const maxChars = Math.floor(this.textAreaW / charW)
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''

    for (const word of words) {
      const wouldBe = current ? current + ' ' + word : word
      if (wouldBe.length <= maxChars) {
        current = wouldBe
      } else {
        if (current) lines.push(current + ' ')
        current = word
      }
    }
    if (current) lines.push(current)
    return lines
  }

  // ── Dissolve transition ───────────────────────────────────────

  private dissolveToNextPage() {
    this.transitioning = true
    this.engine.clearWord()

    // Create dissolve particles from existing text positions
    const dissolveObjects: Phaser.GameObjects.GameObject[] = []
    for (const obj of this.scrollTextObjects) {
      if (obj instanceof Phaser.GameObjects.Text) {
        // Create small rectangles at each character position for the dissolve
        const bounds = obj.getBounds()
        for (let i = 0; i < 3; i++) {
          const px = bounds.x + Math.random() * bounds.width
          const py = bounds.y + Math.random() * bounds.height
          const particle = this.add.rectangle(
            px, py,
            2 + Math.random() * 3, 2 + Math.random() * 3,
            0x333333, 0.8
          ).setDepth(13)
          dissolveObjects.push(particle)

          this.tweens.add({
            targets: particle,
            x: px + (Math.random() * 60 - 30),
            y: py - 20 - Math.random() * 40,
            alpha: 0,
            duration: 400 + Math.random() * 400,
            ease: 'Quad.easeOut',
            onComplete: () => particle.destroy(),
          })
        }
      }
    }

    // Fade out existing text
    this.tweens.add({
      targets: this.scrollTextObjects.filter(o => o.active),
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.scrollTextObjects.forEach(o => o.destroy())
        this.scrollTextObjects = []

        // Advance page
        this.currentPageIdx++
        this.pageTypedCount = 0
        this.buildPageText()
        this.pageCounterText.setText(`${this.currentPageIdx + 1} / ${this.pages.length}`)

        // Render new page text at alpha 0 then fade in
        this.renderPageText()
        const newObjects = this.scrollTextObjects.filter(o => o.active)
        newObjects.forEach(o => (o as Phaser.GameObjects.Text).setAlpha(0))

        this.tweens.add({
          targets: newObjects,
          alpha: 1,
          duration: 400,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.transitioning = false
            const nextWord = this.getCurrentWord()
            if (nextWord) {
              this.engine.setWord(nextWord, nextWord === ' ' ? '<space>' : undefined)
            }
          },
        })
      },
    })
  }

  // ── Scroll drawing ────────────────────────────────────────────

  private drawScroll(width: number, height: number) {
    const topY = HUD_TOP_BAR_H + 12
    const botY = height - HUD_BOTTOM_BAR_H - 12
    this.scrollW = 680
    this.scrollH = botY - topY
    this.scrollX = (width - this.scrollW) / 2
    this.scrollY = topY
    const rollR = 24

    const gfx = this.add.graphics().setDepth(5)

    // ── Parchment body ───────────────────────────────────────
    gfx.fillStyle(0xd8c8a0, 1)
    gfx.fillRect(this.scrollX, this.scrollY, this.scrollW, this.scrollH)
    gfx.fillStyle(0x000000, 0.05)
    gfx.fillRect(this.scrollX, this.scrollY, this.scrollW, this.scrollH)

    // ── Rolled ends (top and bottom cylinders) ───────────────
    for (const edge of [0, 1]) {
      const ry = edge === 0 ? this.scrollY : this.scrollY + this.scrollH
      gfx.fillStyle(0x8b6914, 1)
      gfx.fillRect(this.scrollX - 8, ry - rollR / 2, this.scrollW + 16, rollR)
      gfx.fillStyle(0xc8a830, 0.3)
      gfx.fillRect(this.scrollX - 8, ry - 2, this.scrollW + 16, 4)
      gfx.fillStyle(0xc8a830, 1)
      gfx.fillCircle(this.scrollX - 8, ry, 6)
      gfx.fillCircle(this.scrollX + this.scrollW + 8, ry, 6)
    }

    // ── Decorative border ────────────────────────────────────
    const inset = 10
    gfx.lineStyle(1, 0xb0a070, 0.5)
    gfx.strokeRect(
      this.scrollX + inset, this.scrollY + inset,
      this.scrollW - inset * 2, this.scrollH - inset * 2
    )

    // ── Title — bigger, dark silver ──────────────────────────
    const bossNames: Record<number, string> = {
      1: 'Grizzlefang the Ogre',
      2: 'Tiamat, the Lexicon Hydra',
      3: 'Mecha-Wyrm Alpha',
      4: 'The Dice Lich',
      5: 'The Typemancer',
    }
    this.portraitSize = 110
    const titleX = this.scrollX + inset + 14 + this.portraitSize + 10
    this.add.text(
      titleX, this.scrollY + inset + 14,
      bossNames[this.level.world] ?? 'Unknown',
      {
        fontSize: '26px',
        color: '#6e7480',
        fontFamily: 'serif',
        fontStyle: 'bold italic',
      }
    ).setOrigin(0, 0).setDepth(10)

    // ── Page counter (right of title) ────────────────────────
    this.pageCounterText = this.add.text(
      this.scrollX + this.scrollW - inset - 14,
      this.scrollY + inset + 18,
      `1 / ${this.pages.length}`,
      { fontSize: '14px', color: '#7a7060', fontFamily: 'serif' }
    ).setOrigin(1, 0).setDepth(10)

    // ── Text area below title + portrait ─────────────────────
    const textTopPad = inset + 14 + this.portraitSize + 14
    this.textAreaX = this.scrollX + inset + 14
    this.textAreaY = this.scrollY + textTopPad
    this.textAreaW = this.scrollW - (inset + 14) * 2
  }

  // ── Monster portrait (pixel art) ──────────────────────────────

  private drawMonsterPortrait() {
    const inset = 10
    const px = this.scrollX + inset + 14
    const py = this.scrollY + inset + 14
    const size = this.portraitSize

    const g = this.add.graphics().setDepth(10)

    // Portrait frame
    g.fillStyle(0x3a3028, 1)
    g.fillRect(px, py, size, size)
    // Inner lighter bg
    g.fillStyle(0xc0b088, 1)
    g.fillRect(px + 4, py + 4, size - 8, size - 8)

    const cx = px + size / 2
    const cy = py + size / 2

    switch (this.level.world) {
      case 1: this.drawGrizzlefang(g, cx, cy); break
      case 2: this.drawHydra(g, cx, cy); break
      case 3: this.drawMechaWyrm(g, cx, cy); break
      case 4: this.drawDiceLich(g, cx, cy); break
      case 5: this.drawTypemancer(g, cx, cy); break
    }
  }

  private drawGrizzlefang(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    const p = 4
    g.fillStyle(0x5a3a1a, 1)
    g.fillRect(cx - 5 * p, cy - 4 * p, 10 * p, 12 * p)
    g.fillStyle(0x6b4a2a, 1)
    g.fillRect(cx - 4 * p, cy - 8 * p, 8 * p, 5 * p)
    g.fillRect(cx - 5 * p, cy - 9 * p, 2 * p, 2 * p)
    g.fillRect(cx + 3 * p, cy - 9 * p, 2 * p, 2 * p)
    g.fillStyle(0xff2222, 1)
    g.fillRect(cx - 3 * p, cy - 6 * p, 2 * p, p)
    g.fillRect(cx + 1 * p, cy - 6 * p, 2 * p, p)
    g.fillStyle(0xcccccc, 1)
    g.fillRect(cx - 2 * p, cy - 4 * p, p, 2 * p)
    g.fillRect(cx + 1 * p, cy - 4 * p, p, 2 * p)
    g.fillStyle(0x5a3a1a, 1)
    g.fillRect(cx - 7 * p, cy - 2 * p, 2 * p, 8 * p)
    g.fillRect(cx + 5 * p, cy - 2 * p, 2 * p, 8 * p)
    g.fillStyle(0x333333, 1)
    g.fillRect(cx - 7 * p, cy + 5 * p, p, 2 * p)
    g.fillRect(cx - 6 * p, cy + 6 * p, p, 2 * p)
    g.fillRect(cx + 5 * p, cy + 5 * p, p, 2 * p)
    g.fillRect(cx + 6 * p, cy + 6 * p, p, 2 * p)
  }

  private drawHydra(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    const p = 4
    g.fillStyle(0x2a5a3a, 1)
    g.fillRect(cx - 5 * p, cy + 1 * p, 10 * p, 7 * p)
    g.fillRect(cx - 6 * p, cy - 4 * p, 3 * p, 6 * p)
    g.fillRect(cx - 1 * p, cy - 6 * p, 3 * p, 8 * p)
    g.fillRect(cx + 4 * p, cy - 3 * p, 3 * p, 5 * p)
    g.fillStyle(0x3a7a4a, 1)
    g.fillRect(cx - 7 * p, cy - 7 * p, 4 * p, 4 * p)
    g.fillRect(cx - 2 * p, cy - 9 * p, 4 * p, 4 * p)
    g.fillRect(cx + 3 * p, cy - 6 * p, 4 * p, 4 * p)
    g.fillStyle(0xffff00, 1)
    g.fillRect(cx - 6 * p, cy - 6 * p, p, p)
    g.fillRect(cx - 1 * p, cy - 8 * p, p, p)
    g.fillRect(cx + 4 * p, cy - 5 * p, p, p)
  }

  private drawMechaWyrm(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    const p = 4
    g.fillStyle(0x6a6a7a, 1)
    g.fillRect(cx - 5 * p, cy - 3 * p, 10 * p, 10 * p)
    g.fillStyle(0x8a8a9a, 1)
    g.fillRect(cx - 3 * p, cy - 7 * p, 6 * p, 5 * p)
    g.fillStyle(0x00ccff, 1)
    g.fillRect(cx - 2 * p, cy - 6 * p, 2 * p, p)
    g.fillRect(cx + 1 * p, cy - 6 * p, 2 * p, p)
    g.fillStyle(0xc8a830, 1)
    g.fillRect(cx - 2 * p, cy - 1 * p, 2 * p, 2 * p)
    g.fillRect(cx + 1 * p, cy + 1 * p, 2 * p, 2 * p)
    g.fillStyle(0xaaaaaa, 0.6)
    g.fillRect(cx - 6 * p, cy - 1 * p, p, 4 * p)
    g.fillRect(cx + 5 * p, cy - 1 * p, p, 4 * p)
    g.fillStyle(0x5a5a6a, 1)
    g.fillRect(cx - 4 * p, cy + 7 * p, 2 * p, 3 * p)
    g.fillRect(cx + 2 * p, cy + 7 * p, 2 * p, 3 * p)
  }

  private drawDiceLich(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    const p = 4
    g.fillStyle(0x2a1a3a, 1)
    g.fillRect(cx - 4 * p, cy - 3 * p, 8 * p, 11 * p)
    g.fillStyle(0x3a2a4a, 1)
    g.fillRect(cx - 3 * p, cy - 8 * p, 6 * p, 6 * p)
    g.fillStyle(0xccccaa, 1)
    g.fillRect(cx - 2 * p, cy - 7 * p, 4 * p, 4 * p)
    g.fillStyle(0x00ff66, 1)
    g.fillRect(cx - 1 * p, cy - 6 * p, p, p)
    g.fillRect(cx + 1 * p, cy - 6 * p, p, p)
    g.fillStyle(0xcccccc, 1)
    g.fillRect(cx - 7 * p, cy - 4 * p, 3 * p, 3 * p)
    g.fillStyle(0x111111, 1)
    g.fillRect(cx - 6 * p, cy - 3 * p, p, p)
    g.fillStyle(0xcccccc, 1)
    g.fillRect(cx + 5 * p, cy - 2 * p, 3 * p, 3 * p)
    g.fillStyle(0x111111, 1)
    g.fillRect(cx + 6 * p, cy - 1 * p, p, p)
    g.fillRect(cx + 7 * p, cy, p, p)
  }

  private drawTypemancer(g: Phaser.GameObjects.Graphics, cx: number, cy: number) {
    const p = 4
    g.fillStyle(0x1a1a4a, 1)
    g.fillRect(cx - 4 * p, cy - 2 * p, 8 * p, 10 * p)
    g.fillStyle(0x2a2a5a, 1)
    g.fillRect(cx - 3 * p, cy - 7 * p, 6 * p, 6 * p)
    g.fillStyle(0xff66ff, 1)
    g.fillRect(cx - 2 * p, cy - 5 * p, p, p)
    g.fillRect(cx + 1 * p, cy - 5 * p, p, p)
    g.fillStyle(0x8a6a2a, 1)
    g.fillRect(cx + 5 * p, cy - 9 * p, p, 16 * p)
    g.fillStyle(0xffffff, 1)
    g.fillRect(cx + 5 * p, cy + 6 * p, p, 2 * p)
    g.fillStyle(0xcc88ff, 0.7)
    g.fillRect(cx - 7 * p, cy - 6 * p, 2 * p, 2 * p)
    g.fillRect(cx - 6 * p, cy - 1 * p, 2 * p, 2 * p)
    g.fillRect(cx + 7 * p, cy - 3 * p, 2 * p, 2 * p)
  }

  // ── Library background ────────────────────────────────────────

  private drawLibraryBackground(width: number, height: number) {
    const bg = this.add.graphics().setDepth(0)
    bg.fillStyle(0x0d1117, 1)
    bg.fillRect(0, 0, width, height)
    this.drawBookshelf(bg, 0, 0, 120, height)
    this.drawBookshelf(bg, width - 120, 0, 120, height)

    bg.fillStyle(0x1a2a3a, 1)
    bg.fillRect(width / 2 - 60, 20, 120, 140)
    bg.lineStyle(2, 0x334455, 1)
    bg.strokeRect(width / 2 - 60, 20, 120, 140)
    bg.lineBetween(width / 2 - 20, 20, width / 2 + 10, 160)
    bg.lineBetween(width / 2 + 30, 20, width / 2 - 10, 100)

    const moonlight = this.add.graphics().setDepth(1).setAlpha(0.15)
    moonlight.fillStyle(0x88ccff, 1)
    moonlight.fillTriangle(
      width / 2 - 30, 160,
      width / 2 + 80, height - 60,
      width / 2 - 140, height - 60
    )

    const vineGfx = this.add.graphics().setDepth(2)
    vineGfx.lineStyle(2, 0x2d5a27, 0.7)
    this.drawVine(vineGfx, 120, 0, 200, 250)
    this.drawVine(vineGfx, width - 120, 0, width - 200, 280)
  }

  private drawBookshelf(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
    g.fillStyle(0x2a1a0a, 1)
    g.fillRect(x, y, w, h)
    const shelfCount = 6
    const shelfH = h / shelfCount
    g.lineStyle(2, 0x3a2a1a, 1)
    for (let i = 1; i < shelfCount; i++) {
      g.lineBetween(x, y + i * shelfH, x + w, y + i * shelfH)
    }
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

  // ── Gameplay callbacks ────────────────────────────────────────

  protected onWordComplete(_word: string, _elapsed: number) {
    if (this.transitioning) return
    this.spawnWordGold()
    this.pageTypedCount += _word.length

    if (this.pageTypedCount >= this.pageText.length) {
      // Page complete — check if there are more pages
      if (this.currentPageIdx + 1 >= this.pages.length) {
        this.renderPageText()
        this.endLevel(true)
        return
      }
      this.dissolveToNextPage()
      return
    }

    this.renderPageText()
    const nextWord = this.getCurrentWord()
    if (nextWord) {
      this.engine.setWord(nextWord, nextWord === ' ' ? '<space>' : undefined)
    }
  }

  protected flashOnWrongKey(): void {
    return
  }

  protected onWrongKey() {
    this.flashOnWrongKey()
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
