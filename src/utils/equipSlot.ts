import Phaser from 'phaser'
import { ItemData } from '../types'
import { getItemColor } from '../data/items'
import { ItemTooltipCard } from '../components/ItemTooltipCard'

export const EQUIP_CELL = 30

/** Pixel dimensions of each equipment slot, sized to hold the largest item for that slot type. */
export const EQUIP_SLOT_SIZES: Record<'weapon' | 'armor' | 'accessory' | 'trophy', { w: number; h: number }> = {
  weapon:    { w: 2 * EQUIP_CELL, h: 4 * EQUIP_CELL }, // 60×120 — largest: Excalibur 2×4
  armor:     { w: 2 * EQUIP_CELL, h: 4 * EQUIP_CELL }, // 60×120 — largest: Aegis Armor 2×4
  accessory: { w: 1 * EQUIP_CELL, h: 2 * EQUIP_CELL }, // 30×60  — largest: Golden Idol 1×2
  trophy:    { w: 2 * EQUIP_CELL, h: 3 * EQUIP_CELL }, // 60×90  — largest: 2×3 bounding box
}

/**
 * Draw an equipment slot box at (x, y) in top-left coordinates.
 * Returns all created GameObjects so the caller can track them for destruction.
 */
export function drawEquipSlotBox(
  scene: Phaser.Scene,
  x: number,
  y: number,
  slot: 'weapon' | 'armor' | 'accessory' | 'trophy',
  item: ItemData | null,
  options: {
    onUnequip?: () => void
    onDrop?: () => void
    onDragStart?: () => void
    tooltip?: ItemTooltipCard
  } = {}
): Phaser.GameObjects.GameObject[] {
  const out: Phaser.GameObjects.GameObject[] = []
  const { w, h } = EQUIP_SLOT_SIZES[slot]
  const cx = x + w / 2
  const cy = y + h / 2
  const slotLabel = slot === 'accessory' ? 'ACCESS.' : slot.toUpperCase()

  if (item) {
    const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color

    const bg = scene.add.rectangle(cx, cy, w, h, itemColor, 0.5)
      .setStrokeStyle(2, 0xffd700)
      .setDepth(5)
    out.push(bg)

    if (scene.textures.exists(item.id)) {
      out.push(
        scene.add.image(cx, cy, item.id)
          .setDisplaySize(w - 8, h - 8)
          .setDepth(6)
      )
    }

    // Slot-type label (top)
    out.push(
      scene.add.text(cx, y + 4, slotLabel, { fontSize: '8px', color: '#888888' })
        .setOrigin(0.5, 0).setDepth(7)
    )

    if (options.onDragStart) {
      bg.setInteractive({ useHandCursor: true })
      bg.on('pointerdown', options.onDragStart)
    }

    if (options.onDrop) {
      if (!bg.input) bg.setInteractive({ useHandCursor: true })
      bg.on('pointerup', options.onDrop)
    }

    // Tooltip hookup
    if (options.tooltip) {
      if (!bg.input) bg.setInteractive({ useHandCursor: true })
      const tooltip = options.tooltip
      bg.on('pointerover', (pointer: Phaser.Input.Pointer) => tooltip.show(item, pointer.x, pointer.y))
      bg.on('pointermove', (pointer: Phaser.Input.Pointer) => tooltip.move(pointer.x, pointer.y))
      bg.on('pointerout', () => tooltip.hide())
    }

    if (options.onUnequip) {
      const btn = scene.add.text(x + w - 2, y + 2, 'X', {
        fontSize: '11px', color: '#ff4444', fontStyle: 'bold',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(8)
      btn.on('pointerdown', options.onUnequip)
      out.push(btn)
    }
  } else {
    const bg = scene.add.rectangle(cx, cy, w, h, 0x0e0e22)
      .setStrokeStyle(1, 0x2a2a55)
      .setDepth(5)
    out.push(bg)

    if (options.onDrop) {
      bg.setInteractive()
      bg.on('pointerup', options.onDrop)
    }

    out.push(
      scene.add.text(cx, y + 4, slotLabel, { fontSize: '8px', color: '#555577' })
        .setOrigin(0.5, 0).setDepth(6)
    )
    out.push(
      scene.add.text(cx, cy, 'EMPTY', { fontSize: '9px', color: '#444466' })
        .setOrigin(0.5).setDepth(6)
    )
  }

  return out
}
