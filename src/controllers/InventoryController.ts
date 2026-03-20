// src/controllers/InventoryController.ts
// Pure TypeScript — NO Phaser imports.
import { ProfileData } from '../types'
import { getItem } from '../data/items'

type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'trophy'

export interface EquipmentState {
  weapon: string | null
  armor: string | null
  accessory: string | null
  trophy: string | null
}

export class InventoryController {
  private _equipment: EquipmentState

  constructor(private profile: ProfileData) {
    this._equipment = {
      weapon: profile.equipment?.weapon ?? null,
      armor: profile.equipment?.armor ?? null,
      accessory: profile.equipment?.accessory ?? null,
      trophy: profile.equipment?.trophy ?? null,
    }
  }

  get equipment(): Readonly<EquipmentState> { return this._equipment }

  equip(slot: EquipmentSlot, itemId: string): void {
    this._equipment = { ...this._equipment, [slot]: itemId }
  }

  unequip(slot: EquipmentSlot): void {
    this._equipment = { ...this._equipment, [slot]: null }
  }

  /** Returns inventory item IDs that belong to the given equipment slot. */
  getItemsBySlot(slot: EquipmentSlot): string[] {
    return (this.profile.ownedItemIds ?? []).filter(id => {
      const item = getItem(id)
      return item?.slot === slot
    })
  }

  /** Returns a stat delta description when equipping an item vs. current. */
  getStatDelta(slot: EquipmentSlot, newItemId: string): Record<string, number> {
    const current = this._equipment[slot]
    const currentItem = current ? getItem(current) : null
    const newItem = getItem(newItemId)
    if (!newItem) return {}

    const delta: Record<string, number> = {}
    const currentEffect = currentItem?.effect ?? {}
    const newEffect = newItem.effect ?? {}

    const allKeys = new Set([...Object.keys(currentEffect), ...Object.keys(newEffect)])
    allKeys.forEach(key => {
      const curr = (currentEffect as Record<string, number>)[key] ?? 0
      const next = (newEffect as Record<string, number>)[key] ?? 0
      const diff = next - curr
      if (diff !== 0) delta[key] = diff
    })
    return delta
  }
}
