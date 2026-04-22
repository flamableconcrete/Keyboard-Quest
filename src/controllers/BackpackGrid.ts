export const GRID_COLS = 4
export const GRID_ROWS = 10

export interface GridPlacement {
  itemId: string
  x: number
  y: number
  w: number
  h: number
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
      const noOverlap =
        x + w <= p.x ||
        x >= p.x + p.w ||
        y + h <= p.y ||
        y >= p.y + p.h
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
