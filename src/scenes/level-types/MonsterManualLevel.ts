// src/scenes/level-types/MonsterManualLevel.ts
import { LevelConfig } from '../../types'
import { loadProfile, saveProfile } from '../../utils/profile'
import { BaseLevelScene } from '../BaseLevelScene'
import { LevelHUD } from '../../components/LevelHUD'
import { DEFAULT_PLAYER_HP, HUD_TOP_BAR_H, HUD_BOTTOM_BAR_H, GOLD_PER_KILL } from '../../constants'

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

  // Bottom Y of the last rendered text line (updated each render)
  private textBottomY = 0

  // ── Ink Curse state ───────────────────────────────────────────
  private playerHp = DEFAULT_PLAYER_HP
  private wrongKeySinceLastInk = 0
  private nextInkThreshold = 0            // 5–8, randomized each cycle
  private wrongKeySinceLastSmallInk = 0
  private nextSmallInkThreshold = 0       // 2–3, randomized each cycle
  private inkBlots: Phaser.GameObjects.Graphics[] = []

  // ── Boss Phantasm state ───────────────────────────────────────
  private phantasmTimer?: Phaser.Time.TimerEvent
  private phantasmActive = false
  private phantasmDeadline = 0            // timestamp when attack lands
  private phantasmPhraseEndIdx = 0        // pageText index of the period that ends the target phrase
  private phantasmBarBg?: Phaser.GameObjects.Rectangle
  private phantasmBarFill?: Phaser.GameObjects.Rectangle
  private phantasmWarningText?: Phaser.GameObjects.Text
  private phantasmGlow?: Phaser.GameObjects.Graphics
  private portraitCx = 0
  private portraitCy = 0

  // ── Ink Well state ────────────────────────────────────────────
  private inkWellX = 0
  private inkWellY = 0
  private inkWellFill = 0                 // 0..1, fills per word, overflows on phrase end
  private inkWellWordsInPhrase = 0        // words typed in current phrase
  private inkWellBody?: Phaser.GameObjects.Graphics
  private inkWellFillGfx?: Phaser.GameObjects.Graphics

  constructor() { super('MonsterManualLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    super.init(data)
    this.playerHp = DEFAULT_PLAYER_HP
    this.wrongKeySinceLastInk = 0
    this.nextInkThreshold = this.rollInkThreshold()
    this.wrongKeySinceLastSmallInk = 0
    this.nextSmallInkThreshold = this.rollSmallInkThreshold()
    this.inkBlots = []
    this.phantasmActive = false
    this.phantasmDeadline = 0
    this.inkWellFill = 0
    this.inkWellWordsInPhrase = 0
  }

  private rollInkThreshold(): number {
    return 5 + Math.floor(Math.random() * 4) // 5, 6, 7, or 8
  }

  private rollSmallInkThreshold(): number {
    return 2 + Math.floor(Math.random() * 2) // 2 or 3
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

    // ── Ink Well ─────────────────────────────────────────────────
    this.drawInkWell(width, height)

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

    // ── Boss Phantasm — schedule first attack ───────────────────
    this.schedulePhantasm()
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
          const inRedZone = this.phantasmActive && gIdx <= this.phantasmPhraseEndIdx
          color = inRedZone ? '#ff2222' : '#000000'
        } else if (this.phantasmActive && gIdx <= this.phantasmPhraseEndIdx) {
          color = '#cc3333'
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
    this.textBottomY = cursorY
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
    this.pageTypedCount += _word.length

    // ── Ink Well: fill on each word, overflow gold on phrase end ──
    const phraseEnded = _word.endsWith('.')
    if (_word.trim().length > 0 && _word !== ' ') {
      this.inkWellWordsInPhrase++
      this.inkWellFill = Math.min(1, this.inkWellFill + 0.25)
      this.redrawInkWellFill()
    }
    if (phraseEnded) {
      this.overflowInkWell()
    }

    // Repel phantasm only when the player has typed past the target phrase's period
    if (this.phantasmActive && this.pageTypedCount > this.phantasmPhraseEndIdx) {
      this.repelPhantasm()
    }

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

    // ── Cosmetic ink blot every 2–3 wrong keys ────────────────
    this.wrongKeySinceLastSmallInk++
    if (this.wrongKeySinceLastSmallInk >= this.nextSmallInkThreshold) {
      this.wrongKeySinceLastSmallInk = 0
      this.nextSmallInkThreshold = this.rollSmallInkThreshold()
      this.spawnInkBlot(false)
    }

    // ── Ink Curse: every 5th–8th wrong key deals 1 HP + bigger blot
    this.wrongKeySinceLastInk++
    if (this.wrongKeySinceLastInk >= this.nextInkThreshold) {
      this.wrongKeySinceLastInk = 0
      this.nextInkThreshold = this.rollInkThreshold()
      this.applyInkCurse()
    }
  }

  protected endLevel(passed: boolean) {
    this.phantasmTimer?.remove(false)
    this.clearPhantasmUI()

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
    this.updatePhantasmBar()
  }

  // ── Ink Curse ─────────────────────────────────────────────────

  /**
   * Pick a random position in the scroll that never overlaps the text or portrait.
   * Two safe bands:
   *   • Top-right band — to the right of the portrait, above the text area
   *   • Bottom band — below the last rendered text line
   * Blot centres are inset by `pad` so the drawn circles stay inside the scroll.
   */
  private pickBlotPosition(large: boolean): { x: number; y: number } {
    const pad = large ? 30 : 20  // keep blot circles inside the scroll

    // Portrait occupies top-left: (scrollX+24, scrollY+24) sized portraitSize×portraitSize
    const portraitRight = this.scrollX + 24 + this.portraitSize + 10
    const scrollRight = this.scrollX + this.scrollW - pad
    const scrollBottom = this.scrollY + this.scrollH - pad

    // Band A: right of portrait, above text area
    const bandATop = this.scrollY + pad
    const bandABottom = this.textAreaY - pad
    const bandAH = bandABottom - bandATop

    // Band B: below last rendered text line
    const bandBTop = this.textBottomY + pad
    const bandBBottom = scrollBottom
    const bandBH = bandBBottom - bandBTop

    const useA = bandAH > 10 && (bandBH <= 10 || Math.random() < 0.4)

    if (useA && bandAH > 10) {
      return {
        x: portraitRight + Math.random() * (scrollRight - portraitRight),
        y: bandATop + Math.random() * bandAH,
      }
    }
    // Band B (default)
    const safeTop = bandBH > 10 ? bandBTop : scrollBottom - 20
    return {
      x: this.scrollX + pad + Math.random() * (this.scrollW - pad * 2),
      y: safeTop + Math.random() * Math.max(10, bandBH),
    }
  }

  /**
   * Spawn an ink blot on the scroll in a margin zone.
   * @param large  true = HP-damage blot (bigger), false = cosmetic only
   */
  private spawnInkBlot(large: boolean) {
    const { x: blotX, y: blotY } = this.pickBlotPosition(large)
    const blot = this.add.graphics().setDepth(14)

    blot.fillStyle(0x1a0a2e, 0.85)
    if (large) {
      // Big blot: 6–9 circles, radius 12–24, spread 40×30
      const blobCount = 6 + Math.floor(Math.random() * 4)
      for (let i = 0; i < blobCount; i++) {
        const ox = (Math.random() - 0.5) * 40
        const oy = (Math.random() - 0.5) * 30
        blot.fillCircle(blotX + ox, blotY + oy, 12 + Math.random() * 12)
      }
      // Satellite drops
      for (let i = 0; i < 5; i++) {
        const ox = (Math.random() - 0.5) * 70
        const oy = (Math.random() - 0.5) * 55
        blot.fillCircle(blotX + ox, blotY + oy, 3 + Math.random() * 5)
      }
    } else {
      // Small cosmetic blot: 3–5 circles, radius 8–16, spread 30×24
      const blobCount = 3 + Math.floor(Math.random() * 3)
      for (let i = 0; i < blobCount; i++) {
        const ox = (Math.random() - 0.5) * 30
        const oy = (Math.random() - 0.5) * 24
        blot.fillCircle(blotX + ox, blotY + oy, 8 + Math.random() * 8)
      }
      // A couple satellite drops
      for (let i = 0; i < 2; i++) {
        const ox = (Math.random() - 0.5) * 50
        const oy = (Math.random() - 0.5) * 40
        blot.fillCircle(blotX + ox, blotY + oy, 2 + Math.random() * 4)
      }
    }

    this.inkBlots.push(blot)

    // Splatter-expand animation
    blot.setScale(0.2)
    this.tweens.add({
      targets: blot,
      scaleX: 1,
      scaleY: 1,
      duration: 250,
      ease: 'Back.easeOut',
    })
  }

  private applyInkCurse() {
    this.playerHp = Math.max(0, this.playerHp - 1)
    this.hud.setHeroHp(this.playerHp)

    // Spawn a large ink blot
    this.spawnInkBlot(true)

    // Avatar flinch — shake horizontally and flash red tint
    if (this.avatarSprite) {
      const origX = this.avatarSprite.x
      this.tweens.add({
        targets: this.avatarSprite,
        x: origX + 6,
        duration: 40,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
        onComplete: () => this.avatarSprite?.setX(origX),
      })
      this.avatarSprite.setTint(0xff4444)
      this.time.delayedCall(300, () => this.avatarSprite?.clearTint())
    }

    // Ink well pulses dark
    this.pulseInkWell()

    // Screen shake
    this.cameras.main.shake(200, 0.008)

    if (this.playerHp <= 0) {
      this.endLevel(false)
    }
  }

  // ── Boss Phantasm ─────────────────────────────────────────────

  private static readonly PHANTASM_INTERVAL_MIN = 50_000
  private static readonly PHANTASM_INTERVAL_MAX = 60_000
  private static readonly PHANTASM_COUNTDOWN_MS = 30_000

  private schedulePhantasm() {
    const delay = MonsterManualLevel.PHANTASM_INTERVAL_MIN +
      Math.random() * (MonsterManualLevel.PHANTASM_INTERVAL_MAX - MonsterManualLevel.PHANTASM_INTERVAL_MIN)
    this.phantasmTimer = this.time.delayedCall(delay, () => {
      if (!this.finished) this.startPhantasmAttack()
    })
  }

  private startPhantasmAttack() {
    this.phantasmActive = true
    this.phantasmDeadline = Date.now() + MonsterManualLevel.PHANTASM_COUNTDOWN_MS

    // Find the period that ends the current phrase
    const dotIdx = this.pageText.indexOf('.', this.pageTypedCount)
    this.phantasmPhraseEndIdx = dotIdx >= 0 ? dotIdx : this.pageText.length - 1

    // Glow the boss portrait red
    const inset = 10
    const px = this.scrollX + inset + 14
    const py = this.scrollY + inset + 14
    const size = this.portraitSize
    this.portraitCx = px + size / 2
    this.portraitCy = py + size / 2

    this.phantasmGlow = this.add.graphics().setDepth(11)
    this.phantasmGlow.fillStyle(0xff0000, 0.3)
    this.phantasmGlow.fillRect(px, py, size, size)
    this.tweens.add({
      targets: this.phantasmGlow,
      alpha: { from: 0.3, to: 0.8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    // Progress bar below portrait
    const barW = size
    const barH = 8
    const barX = px
    const barY = py + size + 6
    this.phantasmBarBg = this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x330000)
      .setDepth(11)
    this.phantasmBarFill = this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0xff2222)
      .setDepth(12)

    // Warning text
    this.phantasmWarningText = this.add.text(
      this.scrollX + this.scrollW / 2,
      this.scrollY + this.scrollH - 28,
      'The beast stirs — finish the phrase!',
      { fontSize: '14px', color: '#ff4444', fontFamily: 'serif', fontStyle: 'italic' }
    ).setOrigin(0.5).setDepth(15)
    this.tweens.add({
      targets: this.phantasmWarningText,
      alpha: { from: 1, to: 0.4 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // Tint the current phrase text red
    this.renderPageText()
  }

  private updatePhantasmBar() {
    if (!this.phantasmActive || !this.phantasmBarFill) return

    const remaining = Math.max(0, this.phantasmDeadline - Date.now())
    const fraction = remaining / MonsterManualLevel.PHANTASM_COUNTDOWN_MS

    // Shrink bar from right — adjust width and x to keep left-aligned
    const inset = 10
    const fullW = this.portraitSize
    const barX = this.scrollX + inset + 14
    const newW = fullW * fraction
    this.phantasmBarFill.setDisplaySize(newW, 8)
    this.phantasmBarFill.setX(barX + newW / 2)

    if (remaining <= 0) {
      this.phantasmStrikes()
    }
  }

  private phantasmStrikes() {
    this.phantasmActive = false
    this.clearPhantasmUI()

    // The boss silhouette lunges — scale up portrait area briefly
    const flashRect = this.add.rectangle(
      this.portraitCx, this.portraitCy,
      this.portraitSize + 20, this.portraitSize + 20,
      0xff0000, 0.6
    ).setDepth(15)
    this.tweens.add({
      targets: flashRect,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => flashRect.destroy(),
    })

    // Deal 1 HP damage
    this.playerHp = Math.max(0, this.playerHp - 1)
    this.hud.setHeroHp(this.playerHp)
    this.cameras.main.shake(300, 0.015)

    // Avatar knockback
    if (this.avatarSprite) {
      const origX = this.avatarSprite.x
      this.tweens.add({
        targets: this.avatarSprite,
        x: origX - 12,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => this.avatarSprite?.setX(origX),
      })
      this.avatarSprite.setTint(0xff2222)
      this.time.delayedCall(400, () => this.avatarSprite?.clearTint())
    }

    // Re-render to clear red text tint
    this.renderPageText()

    if (this.playerHp <= 0) {
      this.endLevel(false)
      return
    }

    // Schedule next attack
    this.schedulePhantasm()
  }

  private repelPhantasm() {
    this.phantasmActive = false
    this.clearPhantasmUI()

    // Green flash on portrait — the phantasm recoils
    const flashRect = this.add.rectangle(
      this.portraitCx, this.portraitCy,
      this.portraitSize, this.portraitSize,
      0x00ff66, 0.5
    ).setDepth(15)
    this.tweens.add({
      targets: flashRect,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => flashRect.destroy(),
    })

    // Re-render to clear red text tint
    this.renderPageText()

    // Schedule next attack
    this.schedulePhantasm()
  }

  private clearPhantasmUI() {
    this.phantasmGlow?.destroy()
    this.phantasmGlow = undefined
    this.phantasmBarBg?.destroy()
    this.phantasmBarBg = undefined
    this.phantasmBarFill?.destroy()
    this.phantasmBarFill = undefined
    this.phantasmWarningText?.destroy()
    this.phantasmWarningText = undefined
  }

  // ── Ink Well ──────────────────────────────────────────────────

  private static readonly WELL_W = 64
  private static readonly WELL_H = 74
  private static readonly WELL_RIM = 8

  private drawInkWell(_width: number, height: number) {
    this.inkWellX = 130
    this.inkWellY = Math.round(height * 0.35)

    const { WELL_W, WELL_H, WELL_RIM } = MonsterManualLevel
    const wx = this.inkWellX
    const wy = this.inkWellY

    this.inkWellBody = this.add.graphics().setDepth(6)
    const body = this.inkWellBody

    // ── Small wooden stand / table ───────────────────────────
    const standW = WELL_W + 20
    const standH = 12
    const standY = wy + WELL_H / 2 - 2
    body.fillStyle(0x3a2510, 1)
    body.fillRect(wx - standW / 2, standY, standW, standH)
    body.fillStyle(0x4a3520, 1)
    body.fillRect(wx - standW / 2, standY, standW, 3) // top edge highlight
    // Legs
    body.fillStyle(0x2a1a0a, 1)
    body.fillRect(wx - standW / 2 + 4, standY + standH, 6, 18)
    body.fillRect(wx + standW / 2 - 10, standY + standH, 6, 18)

    // ── Shadow beneath the pot on the stand ──────────────────
    body.fillStyle(0x000000, 0.3)
    body.fillEllipse(wx, standY + 2, WELL_W + 6, 8)

    // ── Pot body — rounded ceramic with taper ────────────────
    // Lower body (wider)
    body.fillStyle(0x2a1a0e, 1)
    body.fillRect(wx - WELL_W / 2, wy, WELL_W, WELL_H / 2)
    // Upper body (slightly narrower for taper)
    const taperInset = 4
    body.fillRect(wx - WELL_W / 2 + taperInset, wy - WELL_H / 2 + WELL_RIM, WELL_W - taperInset * 2, WELL_H / 2 - WELL_RIM)
    // Curved shoulder connecting upper to lower
    body.fillRect(wx - WELL_W / 2, wy - 2, WELL_W, 6)

    // Vertical highlight stripe (ceramic sheen)
    body.fillStyle(0x3a2a1e, 0.6)
    body.fillRect(wx - WELL_W / 4, wy - WELL_H / 2 + WELL_RIM + 2, 6, WELL_H - WELL_RIM - 4)

    // Dark side shadow
    body.fillStyle(0x1a0e06, 0.5)
    body.fillRect(wx + WELL_W / 2 - 8, wy - WELL_H / 2 + WELL_RIM + 2, 6, WELL_H - WELL_RIM - 4)

    // ── Decorative band around the belly ─────────────────────
    const bandY = wy + 4
    body.fillStyle(0xc8a830, 0.5)
    body.fillRect(wx - WELL_W / 2 + 2, bandY, WELL_W - 4, 3)
    body.fillStyle(0xc8a830, 0.3)
    body.fillRect(wx - WELL_W / 2 + 2, bandY + 6, WELL_W - 4, 2)

    // ── Thick rim ────────────────────────────────────────────
    body.fillStyle(0x3a2a1a, 1)
    body.fillRect(wx - WELL_W / 2 + taperInset - 4, wy - WELL_H / 2, WELL_W - taperInset * 2 + 8, WELL_RIM + 2)
    // Rim top highlight
    body.fillStyle(0x5a4a3a, 0.7)
    body.fillRect(wx - WELL_W / 2 + taperInset - 2, wy - WELL_H / 2, WELL_W - taperInset * 2 + 4, 3)
    // Inner rim shadow
    body.fillStyle(0x1a0a06, 0.6)
    body.fillRect(wx - WELL_W / 2 + taperInset, wy - WELL_H / 2 + WELL_RIM - 1, WELL_W - taperInset * 2, 2)

    // ── Ink surface (dark pool) ──────────────────────────────
    body.fillStyle(0x06060e, 0.95)
    body.fillEllipse(wx, wy - WELL_H / 2 + WELL_RIM + 2, WELL_W - taperInset * 2 - 4, 10)
    // Subtle ink sheen
    body.fillStyle(0x2222aa, 0.15)
    body.fillEllipse(wx - 4, wy - WELL_H / 2 + WELL_RIM + 1, 12, 4)

    // ── Quill leaning against the pot ────────────────────────
    const qx = wx + WELL_W / 2 + 6
    const qTopY = wy - WELL_H / 2 - 28
    const qBotY = wy + WELL_H / 4
    // Shaft
    body.lineStyle(2, 0x8a6a2a, 1)
    body.lineBetween(qx, qBotY, qx - 8, qTopY)
    // Feather vane
    body.fillStyle(0xcccccc, 0.8)
    body.fillTriangle(qx - 8, qTopY, qx - 20, qTopY - 12, qx - 14, qTopY + 10)
    body.fillStyle(0xaaaaaa, 0.5)
    body.fillTriangle(qx - 8, qTopY, qx - 2, qTopY - 8, qx - 4, qTopY + 8)
    // Nib
    body.fillStyle(0x333333, 1)
    body.fillTriangle(qx, qBotY, qx + 2, qBotY + 6, qx - 2, qBotY + 6)

    // ── Fill level graphic (redrawn dynamically) ─────────────
    this.inkWellFillGfx = this.add.graphics().setDepth(7)
  }

  private redrawInkWellFill() {
    if (!this.inkWellFillGfx) return
    this.inkWellFillGfx.clear()

    const { WELL_W, WELL_H, WELL_RIM } = MonsterManualLevel
    const taperInset = 4
    const wx = this.inkWellX
    const wy = this.inkWellY

    // Fill rises from the ink surface upward (overflows above the rim)
    const inkTop = wy - WELL_H / 2 + WELL_RIM
    const maxRise = WELL_RIM + 10

    const fillH = this.inkWellFill * maxRise
    if (fillH <= 0) return

    // Glowing ink rising above the surface
    const alpha = 0.5 + this.inkWellFill * 0.4
    this.inkWellFillGfx.fillStyle(0x4422aa, alpha)
    this.inkWellFillGfx.fillEllipse(wx, inkTop - fillH / 2, WELL_W - taperInset * 2 - 2, fillH + 6)

    // Golden shimmer at high fill
    if (this.inkWellFill > 0.5) {
      const shimmer = (this.inkWellFill - 0.5) * 2  // 0..1
      this.inkWellFillGfx.fillStyle(0xffcc00, 0.2 + shimmer * 0.3)
      this.inkWellFillGfx.fillEllipse(wx, inkTop - fillH / 2 - 2, WELL_W - taperInset * 2 - 10, fillH)
      // Sparkle dots
      for (let i = 0; i < 3; i++) {
        const sx = wx + (Math.random() - 0.5) * (WELL_W - 20)
        const sy = inkTop - fillH * Math.random()
        this.inkWellFillGfx.fillStyle(0xffffff, 0.4 + shimmer * 0.4)
        this.inkWellFillGfx.fillCircle(sx, sy, 1.5)
      }
    }
  }

  private overflowInkWell() {
    // Gold amount scales with words typed in the phrase
    const goldAmount = GOLD_PER_KILL + this.inkWellWordsInPhrase * 2

    // Spawn gold drops near the ink well base (on the floor)
    const dropCount = 2 + Math.floor(Math.random() * 2)  // 2–3 drops
    for (let i = 0; i < dropCount; i++) {
      const dropX = this.inkWellX + (Math.random() * 60 - 30)
      const dropY = this.inkWellY + MonsterManualLevel.WELL_H / 2 + 8 + Math.random() * 16
      this.goldManager.spawnGold(dropX, dropY, Math.ceil(goldAmount / dropCount))
    }

    // Overflow animation — ink splashes up and out
    if (this.inkWellFillGfx) {
      const splash = this.add.graphics().setDepth(8)
      const wx = this.inkWellX
      const wy = this.inkWellY - MonsterManualLevel.WELL_H / 2

      // Several small ink/gold droplets spray upward
      for (let i = 0; i < 6; i++) {
        const dx = (Math.random() - 0.5) * 40
        const r = 2 + Math.random() * 3
        const isGold = Math.random() < 0.5
        splash.fillStyle(isGold ? 0xffcc00 : 0x2a1a4a, 0.9)
        splash.fillCircle(wx + dx, wy, r)
      }

      this.tweens.add({
        targets: splash,
        y: wy - 20,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => splash.destroy(),
      })
    }

    // Reset fill
    this.inkWellFill = 0
    this.inkWellWordsInPhrase = 0
    this.redrawInkWellFill()
  }

  private pulseInkWell() {
    if (!this.inkWellBody) return

    // Flash the well body dark purple briefly
    this.inkWellBody.setAlpha(0.5)
    this.tweens.add({
      targets: this.inkWellBody,
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeOut',
    })

    // Briefly tint the fill darker
    if (this.inkWellFillGfx) {
      this.inkWellFillGfx.setAlpha(0.3)
      this.tweens.add({
        targets: this.inkWellFillGfx,
        alpha: 1,
        duration: 300,
        ease: 'Sine.easeOut',
      })
    }
  }
}
