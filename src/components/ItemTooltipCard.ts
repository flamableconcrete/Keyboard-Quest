import Phaser from 'phaser'
import { ItemData } from '../types'
import { getItemColor } from '../data/items'

export interface ItemTooltipOptions {
  showGoldCost?: boolean
}

export class ItemTooltipCard {
  private readonly container: Phaser.GameObjects.Container
  private readonly bg: Phaser.GameObjects.Rectangle
  private texts: Phaser.GameObjects.Text[] = []

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: ItemTooltipOptions = {}
  ) {
    this.container = scene.add.container(0, 0).setDepth(200).setVisible(false)
    this.bg = scene.add.rectangle(0, 0, 200, 40, 0x0a0a1a, 0.95)
      .setStrokeStyle(1, 0x555577)
      .setOrigin(0, 0)
    this.container.add(this.bg)
  }

  show(item: ItemData, x: number, y: number): void {
    this.texts.forEach(t => t.destroy())
    this.texts = []

    const PAD = 8
    const WIDTH = 190
    let yOff = PAD

    const addLine = (text: string, color: string, size: string) => {
      const t = this.scene.add.text(PAD, yOff, text, {
        fontSize: size,
        color,
        wordWrap: { width: WIDTH - PAD * 2 },
        fontFamily: 'monospace',
      })
      this.texts.push(t)
      this.container.add(t)
      yOff += t.height + 3
    }

    // Name in rarity color
    addLine(item.name, getItemColor(item.rarity), '13px')
    // Slot · rarity
    const slotLabel = item.slot.charAt(0).toUpperCase() + item.slot.slice(1)
    addLine(`${slotLabel} · ${item.rarity}`, '#888899', '10px')
    // Separator gap
    yOff += 2
    // Description
    addLine(item.description, '#cccccc', '10px')
    // Separator gap
    yOff += 2
    // Effects
    this._formatEffects(item).forEach(line => addLine(line, '#aaffaa', '10px'))
    // Gold cost (optional)
    if (this.options.showGoldCost) {
      yOff += 2
      addLine(`Cost: ${item.goldCost}g`, '#ffd700', '10px')
    }

    this.bg.setSize(WIDTH, yOff + PAD)
    this.container.setVisible(true)
    this._position(x, y)
  }

  move(x: number, y: number): void {
    if (this.container.visible) this._position(x, y)
  }

  hide(): void {
    this.container.setVisible(false)
  }

  destroy(): void {
    this.texts.forEach(t => t.destroy())
    this.container.destroy()
  }

  private _position(x: number, y: number): void {
    const { width, height } = this.scene.scale
    const W = this.bg.width
    const H = this.bg.height
    const OFFSET = 14
    let cx = x + OFFSET
    let cy = y + OFFSET
    if (cx + W > width - 4)  cx = x - W - OFFSET
    if (cy + H > height - 4) cy = y - H - OFFSET
    this.container.setPosition(cx, cy)
  }

  private _formatEffects(item: ItemData): string[] {
    const e = item.effect
    const out: string[] = []
    if (e.power)                          out.push(`+${e.power} Power`)
    if (e.hp)                             out.push(`+${e.hp} HP`)
    if (e.focusBonus)                     out.push(`+${e.focusBonus} Focus`)
    if (e.goldMultiplier)                 out.push(`+${Math.round(e.goldMultiplier * 100)}% Gold Multiplier`)
    if (e.bonusGoldChance)                out.push(`+${Math.round(e.bonusGoldChance * 100)}% Bonus Gold Chance`)
    if (e.defeatAdditionalEnemiesChance)  out.push(`+${Math.round(e.defeatAdditionalEnemiesChance * 100)}% Multi-Kill Chance`)
    if (e.absorbAttacksChance)            out.push(`+${Math.round(e.absorbAttacksChance * 100)}% Block Chance`)
    if (e.extraTime)                      out.push(`+${e.extraTime}s Extra Time`)
    if (e.ignoreFirstWrong)               out.push('Forgive First Wrong Key')
    if (e.goldDouble)                     out.push('2× Gold This Level')
    return out
  }
}
