export const GRID_COLS = 10
export const GRID_ROWS = 4

export interface GridPlacement {
  readonly itemId: string
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export class BackpackGrid {
  private readonly _placements: GridPlacement[]

  constructor(placements: GridPlacement[]) {
    this._placements = [...placements]
  }

  getPlacements(): GridPlacement[] {
    return [...this._placements]
  }

  hasItem(itemId: string): boolean {
    return this._placements.some(p => p.itemId === itemId)
  }

  canPlace(x: number, y: number, w: number, h: number, excludeItemId?: string): boolean {
    if (x < 0 || y < 0) return false
    if (x + w > GRID_COLS) return false
    if (y + h > GRID_ROWS) return false

    for (const p of this._placements) {
      if (p.itemId === excludeItemId) continue
      // Four conditions for no overlap (AABB test):
      const noOverlap =
        x + w <= p.x ||   // new item is fully left of existing
        x >= p.x + p.w || // new item is fully right of existing
        y + h <= p.y ||   // new item is fully above existing
        y >= p.y + p.h    // new item is fully below existing
      if (!noOverlap) return false
    }
    return true
  }

  findSpace(w: number, h: number): { x: number; y: number } | null {
    if (w > GRID_COLS || h > GRID_ROWS) return null
    for (let row = 0; row <= GRID_ROWS - h; row++) {
      for (let col = 0; col <= GRID_COLS - w; col++) {
        if (this.canPlace(col, row, w, h)) {
          return { x: col, y: row }
        }
      }
    }
    return null
  }

  place(itemId: string, x: number, y: number, w: number, h: number): BackpackGrid {
    if (!this.canPlace(x, y, w, h)) {
      throw new Error(`BackpackGrid.place: cannot place '${itemId}' at (${x},${y}) w=${w} h=${h}`)
    }
    return new BackpackGrid([...this._placements, { itemId, x, y, w, h }])
  }

  remove(itemId: string): BackpackGrid {
    return new BackpackGrid(this._placements.filter(p => p.itemId !== itemId))
  }

  static autoArrange(
    items: { itemId: string; w: number; h: number }[]
  ): { itemId: string; x: number; y: number }[] {
    let grid = new BackpackGrid([])
    const result: { itemId: string; x: number; y: number }[] = []

    for (const item of items) {
      const pos = grid.findSpace(item.w, item.h)
      if (!pos) continue
      grid = grid.place(item.itemId, pos.x, pos.y, item.w, item.h)
      result.push({ itemId: item.itemId, x: pos.x, y: pos.y })
    }

    return result
  }
}
