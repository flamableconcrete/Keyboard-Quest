import Phaser from 'phaser'
import { SpellData } from '../types'
import { loadProfile } from '../utils/profile'
import { SPELLS } from '../data/spells'
import { TypingEngine } from './TypingEngine'

export class SpellCaster {
  private spell: SpellData | null = null
  private used = false
  private casting = false
  private hintText!: Phaser.GameObjects.Text
  private promptText!: Phaser.GameObjects.Text
  private engine: TypingEngine
  private onSpellEffect: (effect: SpellData['effect']) => void = () => {}

  constructor(
    private scene: Phaser.Scene,
    profileSlot: number,
    engine: TypingEngine,
  ) {
    this.engine = engine
    const profile = loadProfile(profileSlot)
    if (profile && profile.spells.length > 0) {
      this.spell = SPELLS.find(s => s.id === profile.spells[0]) ?? null
    }
    this.buildHud()
    this.scene.input.keyboard?.on('keydown-TAB', this.onTab, this)
  }

  setEffectCallback(cb: (effect: SpellData['effect']) => void) {
    this.onSpellEffect = cb
  }

  private buildHud() {
    const { width, height } = this.scene.scale
    if (this.spell) {
      this.hintText = this.scene.add.text(width - 16, height - 16,
        `✨ ${this.spell.name} [TAB]`, {
          fontSize: '18px', color: '#aaaaff', backgroundColor: '#000022',
          padding: { x: 6, y: 3 }
        }).setOrigin(1, 1).setDepth(10)
    } else {
      this.hintText = this.scene.add.text(0, 0, '').setVisible(false)
    }
    this.promptText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 - 60,
      '', { fontSize: '28px', color: '#ffd700', backgroundColor: '#000033',
            padding: { x: 10, y: 6 } }).setOrigin(0.5).setDepth(11).setVisible(false)
  }

  private onTab() {
    if (!this.spell || this.used || this.casting) return
    this.casting = true
    this.promptText.setText(`Cast spell — type: ${this.spell.name.toUpperCase()}`).setVisible(true)
    const spellWord = this.spell.name.toLowerCase()
    this.engine.setWord(spellWord)
    this.engine.setOnCompleteOverride((word: string) => {
      if (word === spellWord) {
        this.used = true
        this.casting = false
        this.promptText.setVisible(false)
        this.hintText.setText(`✨ ${this.spell!.name} (used)`)
        this.onSpellEffect(this.spell!.effect)
        this.showCastBanner()
      }
    })
  }

  private showCastBanner() {
    const { width, height } = this.scene.scale
    const banner = this.scene.add.text(width / 2, height / 2,
      '✨ SPELL CAST! ✨', {
        fontSize: '48px', color: '#ffd700', fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(12)
    this.scene.time.delayedCall(1200, () => banner.destroy())
  }

  destroy() {
    this.scene.input.keyboard?.off('keydown-TAB', this.onTab, this)
    this.hintText?.destroy()
    this.promptText?.destroy()
  }
}
