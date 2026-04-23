// src/controllers/InventoryController.ts
// Pure TypeScript — NO Phaser imports.
import { ProfileData, EquipmentData } from '../types'
import { getItem } from '../data/items'
import { BackpackGrid, GRID_ROWS } from './BackpackGrid'

type EquipmentSlot = keyof EquipmentData

export interface EquipmentState {
  weapon: string | null
  armor: string | null
  accessory: string | null
  trophy: string | null
}

export class InventoryController {
  private _equipment: EquipmentState
  private _grid: BackpackGrid

  constructor(private profile: ProfileData) {
    this._equipment = {
      weapon: profile.equipment?.weapon ?? null,
      armor: profile.equipment?.armor ?? null,
      accessory: profile.equipment?.accessory ?? null,
      trophy: profile.equipment?.trophy ?? null,
    }

    const storedPlacements = profile.backpackPlacements ?? []
    this._grid = new BackpackGrid(
      storedPlacements.map(p => {
        const item = getItem(p.itemId)
        return { itemId: p.itemId, x: p.x, y: p.y, w: item?.gridSize?.w ?? 1, h: item?.gridSize?.h ?? 1 }
      })
    )

    // Migrate save data whose positions are out-of-bounds for the current grid.
    const needsMigration = storedPlacements.some(p => {
      const item = getItem(p.itemId)
      const h = item?.gridSize?.h ?? 1
      return p.y + h > GRID_ROWS
    })
    if (needsMigration) {
      const items = storedPlacements.map(p => {
        const item = getItem(p.itemId)
        return { itemId: p.itemId, w: item?.gridSize?.w ?? 1, h: item?.gridSize?.h ?? 1 }
      })
      const newPlacements = BackpackGrid.autoArrange(items)
      this._grid = new BackpackGrid(
        newPlacements.map(np => {
          const item = getItem(np.itemId)
          return { itemId: np.itemId, x: np.x, y: np.y, w: item?.gridSize?.w ?? 1, h: item?.gridSize?.h ?? 1 }
        })
      )
      this._syncBackpackPlacements()
    }
  }

  get equipment(): Readonly<EquipmentState> { return this._equipment }

  get backpackGrid(): BackpackGrid { return this._grid }

  /**
   * Computed from backpack placements + equipped items.
   * Drop-in replacement for profile.ownedItemIds reads.
   */
  get ownedItemIds(): string[] {
    const inBackpack = this._grid.getPlacements().map(p => p.itemId)
    const equipped = Object.values(this._equipment).filter((v): v is string => v !== null)
    return [...new Set([...inBackpack, ...equipped])]
  }

  /**
   * Sets an equipment slot. Does NOT remove the item from the backpack —
   * callers that drag from backpack must call removeFromBackpack first.
   */
  equip(slot: EquipmentSlot, itemId: string): void {
    this._equipment = { ...this._equipment, [slot]: itemId }
  }

  unequip(slot: EquipmentSlot): boolean {
    const itemId = this._equipment[slot]
    if (!itemId) return true
    const added = this.addToBackpack(itemId)
    if (!added) return false   // backpack full — leave item equipped
    this._equipment = { ...this._equipment, [slot]: null }
    return true
  }

  /** Returns backpack item IDs for a given equipment slot (for the item selection list). */
  getItemsBySlot(slot: EquipmentSlot): string[] {
    return this._grid.getPlacements()
      .map(p => p.itemId)
      .filter(id => getItem(id)?.slot === slot)
  }

  /**
   * Adds an item to the backpack at the first available position.
   * Returns false if the backpack is full.
   */
  addToBackpack(itemId: string): boolean {
    const item = getItem(itemId)
    if (!item) return false
    if (this._grid.hasItem(itemId)) return true   // already in backpack
    const { w, h } = item.gridSize
    const pos = this._grid.findSpace(w, h)
    if (!pos) return false
    this._grid = this._grid.place(itemId, pos.x, pos.y, w, h)
    this._syncBackpackPlacements()
    return true
  }

  /**
   * Removes an item from the backpack (e.g. when selling or consuming).
   */
  removeFromBackpack(itemId: string): void {
    this._grid = this._grid.remove(itemId)
    this._syncBackpackPlacements()
  }

  /**
   * Moves a backpack item to a new position.
   * Returns false if the target position is occupied or out of bounds.
   */
  moveInBackpack(itemId: string, toX: number, toY: number): boolean {
    const placement = this._grid.getPlacements().find(p => p.itemId === itemId)
    if (!placement) return false
    if (!this._grid.canPlace(toX, toY, placement.w, placement.h, itemId)) return false
    this._grid = this._grid.remove(itemId).place(itemId, toX, toY, placement.w, placement.h)
    this._syncBackpackPlacements()
    return true
  }

  /**
   * Sells an item for 75% of its gold cost.
   * Removes it from the backpack and adds gold to profile.
   * Returns the gold amount added (0 if item not found or is unsellable).
   */
  sell(itemId: string): number {
    const item = getItem(itemId)
    if (!item || item.goldCost === 0) return 0
    if (!this._grid.hasItem(itemId)) return 0
    const gold = Math.floor(item.goldCost * 0.75)
    this.removeFromBackpack(itemId)
    this.profile.gold = (this.profile.gold ?? 0) + gold
    return gold
  }

  /**
   * Migrates old flat ownedItemIds to backpackPlacements.
   * Call this once from profile.ts when loading old saves.
   */
  static migrateFromOwnedItemIds(
    ownedItemIds: string[]
  ): { itemId: string; x: number; y: number }[] {
    const items = ownedItemIds
      .map(id => {
        const item = getItem(id)
        return item ? { itemId: id, w: item.gridSize?.w ?? 1, h: item.gridSize?.h ?? 1 } : null
      })
      .filter((x): x is { itemId: string; w: number; h: number } => x !== null)

    return BackpackGrid.autoArrange(items)
  }

  private _syncBackpackPlacements(): void {
    this.profile.backpackPlacements = this._grid.getPlacements().map(({ itemId, x, y }) => ({
      itemId,
      x,
      y,
    }))
  }
}
