import { describe, it, expect } from 'vitest'
import { BackpackGrid, GRID_COLS, GRID_ROWS } from './BackpackGrid'

describe('BackpackGrid', () => {
  describe('constants', () => {
    it('has 4 columns and 10 rows', () => {
      expect(GRID_COLS).toBe(4)
      expect(GRID_ROWS).toBe(10)
    })
  })

  describe('canPlace', () => {
    it('allows placing a 1x1 in an empty grid at (0,0)', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(0, 0, 1, 1)).toBe(true)
    })

    it('allows placing a 2x3 item in empty grid at (1,2)', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(1, 2, 2, 3)).toBe(true)
    })

    it('rejects placement when item extends past right edge', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(3, 0, 2, 1)).toBe(false)
    })

    it('rejects placement when item extends past bottom edge', () => {
      const grid = new BackpackGrid([])
      expect(grid.canPlace(0, 9, 1, 2)).toBe(false)
    })

    it('rejects placement overlapping an existing item', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 1, y: 1, w: 2, h: 3 }])
      expect(grid.canPlace(2, 3, 1, 1)).toBe(false)
    })

    it('allows placement adjacent to an existing item', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 2, h: 2 }])
      expect(grid.canPlace(2, 0, 2, 2)).toBe(true)
    })

    it('excludes a named item from collision check (for move validation)', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 2, h: 2 }])
      expect(grid.canPlace(0, 0, 2, 2, 'sword')).toBe(true)
    })

    it('still blocks overlap with other items when excluding one', () => {
      const grid = new BackpackGrid([
        { itemId: 'sword', x: 0, y: 0, w: 2, h: 2 },
        { itemId: 'shield', x: 2, y: 0, w: 2, h: 2 },
      ])
      expect(grid.canPlace(1, 0, 3, 1, 'sword')).toBe(false)
    })
  })

  describe('findSpace', () => {
    it('returns (0,0) for a 1x1 item in empty grid', () => {
      const grid = new BackpackGrid([])
      expect(grid.findSpace(1, 1)).toEqual({ x: 0, y: 0 })
    })

    it('returns null when no space fits a large item', () => {
      const placements: { itemId: string; x: number; y: number; w: number; h: number }[] = []
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          placements.push({ itemId: `i_${col}_${row}`, x: col, y: row, w: 1, h: 1 })
        }
      }
      const grid = new BackpackGrid(placements)
      expect(grid.findSpace(1, 1)).toBeNull()
    })

    it('skips occupied cells scanning left-to-right, top-to-bottom', () => {
      const placements = [{ itemId: 'blocker', x: 0, y: 0, w: 4, h: 1 }]
      const grid = new BackpackGrid(placements)
      expect(grid.findSpace(1, 1)).toEqual({ x: 0, y: 1 })
    })

    it('returns null for an item that is too wide for any row', () => {
      const grid = new BackpackGrid([])
      expect(grid.findSpace(5, 1)).toBeNull()
    })
  })

  describe('place', () => {
    it('returns a new grid with the item added', () => {
      const grid = new BackpackGrid([])
      const next = grid.place('dagger', 0, 0, 1, 2)
      expect(next.getPlacements()).toHaveLength(1)
      expect(next.getPlacements()[0]).toMatchObject({ itemId: 'dagger', x: 0, y: 0, w: 1, h: 2 })
    })

    it('is immutable — original grid is unchanged', () => {
      const grid = new BackpackGrid([])
      grid.place('dagger', 0, 0, 1, 2)
      expect(grid.getPlacements()).toHaveLength(0)
    })

    it('preserves existing items when adding a new one', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      const next = grid.place('coin', 1, 0, 1, 1)
      expect(next.getPlacements()).toHaveLength(2)
    })

    it('throws when placing at negative coordinates', () => {
      const grid = new BackpackGrid([])
      expect(() => grid.place('item', -1, 0, 1, 1)).toThrow()
    })

    it('throws when placing out of bounds', () => {
      const grid = new BackpackGrid([])
      expect(() => grid.place('item', 3, 0, 2, 1)).toThrow()
    })

    it('throws when placing on occupied space', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 2, h: 2 }])
      expect(() => grid.place('shield', 0, 0, 1, 1)).toThrow()
    })
  })

  describe('remove', () => {
    it('returns a new grid without the specified item', () => {
      const grid = new BackpackGrid([
        { itemId: 'sword', x: 0, y: 0, w: 1, h: 3 },
        { itemId: 'coin', x: 1, y: 0, w: 1, h: 1 },
      ])
      const next = grid.remove('sword')
      expect(next.getPlacements()).toHaveLength(1)
      expect(next.getPlacements()[0].itemId).toBe('coin')
    })

    it('is immutable — original grid is unchanged', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      grid.remove('sword')
      expect(grid.getPlacements()).toHaveLength(1)
    })

    it('is a no-op if item is not in the grid', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      const next = grid.remove('nonexistent')
      expect(next.getPlacements()).toHaveLength(1)
    })
  })

  describe('hasItem', () => {
    it('returns true when item is in grid', () => {
      const grid = new BackpackGrid([{ itemId: 'sword', x: 0, y: 0, w: 1, h: 3 }])
      expect(grid.hasItem('sword')).toBe(true)
    })

    it('returns false when item is not in grid', () => {
      const grid = new BackpackGrid([])
      expect(grid.hasItem('sword')).toBe(false)
    })
  })

  describe('autoArrange', () => {
    it('places single item at (0,0)', () => {
      const result = BackpackGrid.autoArrange([{ itemId: 'dagger', w: 1, h: 2 }])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ itemId: 'dagger', x: 0, y: 0 })
    })

    it('places items left-to-right in the same row when they fit', () => {
      const result = BackpackGrid.autoArrange([
        { itemId: 'a', w: 1, h: 1 },
        { itemId: 'b', w: 1, h: 1 },
        { itemId: 'c', w: 1, h: 1 },
        { itemId: 'd', w: 1, h: 1 },
      ])
      expect(result[0]).toMatchObject({ itemId: 'a', x: 0, y: 0 })
      expect(result[1]).toMatchObject({ itemId: 'b', x: 1, y: 0 })
      expect(result[2]).toMatchObject({ itemId: 'c', x: 2, y: 0 })
      expect(result[3]).toMatchObject({ itemId: 'd', x: 3, y: 0 })
    })

    it('wraps to next row when item does not fit in current row', () => {
      const result = BackpackGrid.autoArrange([
        { itemId: 'wide', w: 3, h: 1 },
        { itemId: 'big', w: 3, h: 1 },
      ])
      expect(result[0]).toMatchObject({ itemId: 'wide', x: 0, y: 0 })
      expect(result[1]).toMatchObject({ itemId: 'big', x: 0, y: 1 })
    })

    it('skips items that cannot fit anywhere and returns what it can place', () => {
      const result = BackpackGrid.autoArrange([
        { itemId: 'normal', w: 1, h: 1 },
        { itemId: 'too_wide', w: 5, h: 1 },
      ])
      expect(result.find(p => p.itemId === 'normal')).toBeDefined()
      expect(result.find(p => p.itemId === 'too_wide')).toBeUndefined()
    })
  })
})
