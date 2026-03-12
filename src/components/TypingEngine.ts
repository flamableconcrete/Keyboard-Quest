// src/components/TypingEngine.ts
import Phaser from 'phaser'

export interface TypingEngineConfig {
  scene: Phaser.Scene
  x: number
  y: number
  fontSize?: number
  onWordComplete: (word: string, elapsedMs: number) => void
  onWrongKey: () => void
  silent?: boolean
  showWpm?: boolean
}

export class TypingEngine {
  private scene: Phaser.Scene
  private currentWord = ''
  private displayWord = ''
  private typedSoFar = ''
  private config: TypingEngineConfig
  private charTexts: Phaser.GameObjects.Text[] = []
  private wordStartTime = 0
  private wpmText?: Phaser.GameObjects.Text

  // Tracking stats
  correctKeystrokes = 0
  totalKeystrokes = 0
  completedWords = 0
  sessionStartTime = 0
  private _onCompleteOverride?: (word: string, elapsed: number) => void

  constructor(config: TypingEngineConfig) {
    this.config = config
    this.scene = config.scene
    this.sessionStartTime = Date.now()
    this.scene.input.keyboard?.on('keydown', this.handleKey, this)

    if (config.showWpm !== false) {
      const { width, height } = this.scene.scale
      this.wpmText = this.scene.add.text(width - 20, height - 20, 'WPM: 0', {
        fontSize: '20px',
        color: '#aaaaaa'
      }).setOrigin(1, 1).setDepth(100)
      this.scene.events.on('update', this.updateWpm, this)
    }
  }

  private updateWpm() {
    if (!this.wpmText || !this.wpmText.active) return
    const elapsed = Date.now() - this.sessionStartTime
    const wpm = elapsed > 0 ? Math.round(this.completedWords / (elapsed / 60000)) : 0
    this.wpmText.setText(`WPM: ${wpm}`)
  }

  setWord(word: string, displayWord?: string) {
    this.currentWord = word
    this.displayWord = displayWord || word
    this.typedSoFar = ''
    this.wordStartTime = Date.now()
    this.renderWord()
  }

  setDisplayWord(displayWord: string) {
    this.displayWord = displayWord
    this.renderWord()
  }

  clearWord() {
    this.charTexts.forEach(t => t.destroy())
    this.charTexts = []
    this.currentWord = ''
    this.typedSoFar = ''
  }

  getTypedSoFar() {
    return this.typedSoFar
  }

  getCurrentWord() {
    return this.currentWord
  }

  setOnCompleteOverride(cb: (word: string, elapsed: number) => void) {
    this._onCompleteOverride = cb
  }

  private handleKey(event: KeyboardEvent) {
    if (!this.currentWord) return
    const key = event.key.toLowerCase()
    if (key.length !== 1) return

    this.totalKeystrokes++

    const expected = this.currentWord[this.typedSoFar.length].toLowerCase()
    if (key === expected) {
      this.correctKeystrokes++
      this.typedSoFar += this.currentWord[this.typedSoFar.length]
      this.renderWord()
      if (this.typedSoFar === this.currentWord) {
        this.completedWords++
        const elapsed = Date.now() - this.wordStartTime
        const word = this.currentWord
        const override = this._onCompleteOverride
        this._onCompleteOverride = undefined
        this.clearWord()
        this.config.onWordComplete(word, elapsed)
        if (override) override(word, elapsed)
        this.scene.events.emit('word_completed_attack')
      }
    } else {
      this.config.onWrongKey()
      // Flash current char red
      const idx = this.typedSoFar.length
      if (this.charTexts[idx]) {
        const t = this.charTexts[idx]
        t.setColor('#ff4444')
        this.scene.time.delayedCall(100, () => {
          if (t.active) t.setColor('#888888')
        })
      }
    }
  }

  private renderWord() {
    this.charTexts.forEach(t => t.destroy())
    this.charTexts = []
    if (this.config.silent) return
    
    const { x, y, fontSize = 36 } = this.config
    const charW = fontSize * 0.62
    // Use displayWord for layout if provided, else currentWord
    const layoutWord = this.displayWord || this.currentWord
    const totalW = layoutWord.length * charW
    const startX = x - totalW / 2

    layoutWord.split('').forEach((ch, i) => {
      let displayChar = ch
      if (ch === ' ' && i >= this.typedSoFar.length) {
        displayChar = '·'
      }
      const color = i < this.typedSoFar.length ? '#44ff44'
        : i === this.typedSoFar.length ? '#ffffff'
        : '#888888'
      const t = this.scene.add.text(startX + i * charW, y, displayChar, {
        fontSize: `${fontSize}px`, color
      })
      this.charTexts.push(t)
    })
  }

  destroy() {
    this.scene.input.keyboard?.off('keydown', this.handleKey, this)
    this.scene.events.off('update', this.updateWpm, this)
    if (this.wpmText) {
      this.wpmText.destroy()
    }
    this.clearWord()
  }
}