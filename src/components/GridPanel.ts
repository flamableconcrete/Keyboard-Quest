import Phaser from 'phaser'
import { GridPlacement, BackpackGrid } from '../controllers/BackpackGrid'
import { getItem, getItemColor } from '../data/items'

interface DragState {
  itemId: string
  ghost: Phaser.GameObjects.Rectangle
  ghostLabel: Phaser.GameObjects.Text
  ghostImage: Phaser.GameObjects.Image | null
  w: number
  h: number
  originCol: number
  originRow: number
}

export interface GridPanelRenderOptions {
  /**
   * Allow items to be drag-rearranged within the grid. Default: false.
   */
  draggable?: boolean
  /**
   * When true, pointerdown selects the item (fires onItemClick) without
   * immediately starting a drag. A drag starts only after the pointer
   * moves more than 8px. Use for grids where click-to-select is the
   * primary interaction (ShopScene backpack).
   * When false (default), pointerdown immediately starts a drag.
   */
  clickToSelect?: boolean
  /**
   * BackpackGrid instance for canPlace checks during drag-overlay colouring.
   * Required when draggable is true to show the green/red drop indicator.
   */
  grid?: BackpackGrid
}

export class GridPanel {
  private objects: Phaser.GameObjects.GameObject[] = []
  private overlay: Phaser.GameObjects.Graphics
  private _dragging: DragState | null = null
  private _selectedItemId: string | null = null

  private _onItemClickCb: ((itemId: string) => void) | null = null
  private _onItemDropCb: ((itemId: string, toCol: number, toRow: number) => void) | null = null

  // Stored from last render() call so internal redraws can replay them
  private _placements: GridPlacement[] = []
  private _options: GridPanelRenderOptions = {}

  // Bound references so scene.input.on/off pairs match
  private readonly _boundDragMove: (p: Phaser.Input.Pointer) => void
  private readonly _boundDragEnd:  (p: Phaser.Input.Pointer) => void

  // clickToSelect drag-threshold tracking
  private _pointerDownAt: { x: number; y: number } | null = null
  private _pendingDrag: { itemId: string; col: number; row: number; w: number; h: number } | null = null

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly originX: number,
    private readonly originY: number,
    private readonly cols: number,
    private readonly rows: number,
    private readonly cellSize: number
  ) {
    this.overlay = scene.add.graphics().setDepth(90)
    this._boundDragMove = this._onDragMove.bind(this)
    this._boundDragEnd  = this._onDragEnd.bind(this)
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  /**
   * Register callback fired when the user clicks (or click-selects) an item.
   *
   * **Note (clickToSelect + draggable mode):** The callback fires twice per drag
   * gesture. First on pointerdown with the item selected (caller shows detail
   * card). Then on drag-start with `_selectedItemId` already cleared to null
   * (caller should hide the detail card). This dual-fire is intentional.
   */
  onItemClick(cb: (itemId: string) => void): this {
    this._onItemClickCb = cb
    return this
  }

  /**
   * Register callback fired when a drag-rearrange completes on a valid grid
   * cell. The caller is responsible for updating BackpackGrid and re-calling
   * render() with the new placements.
   */
  onItemDrop(cb: (itemId: string, toCol: number, toRow: number) => void): this {
    this._onItemDropCb = cb
    return this
  }

  /** The itemId currently being dragged, or null. Used by external drop zones. */
  get draggingItemId(): string | null {
    return this._dragging?.itemId ?? null
  }

  /**
   * Called by an external drop zone (e.g. an equipment slot) after it handles a
   * drag that started from this GridPanel. Cleans up the ghost and redraws.
   */
  cancelDrag(): void {
    if (!this._dragging) return
    this._dragging.ghost.destroy()
    this._dragging.ghostLabel.destroy()
    this._dragging.ghostImage?.destroy()
    this.overlay.clear()
    this.scene.input.off('pointermove', this._boundDragMove)
    this.scene.input.off('pointerup',   this._boundDragEnd)
    this._dragging = null
    if (this._pendingDrag) {
      this.scene.input.off('pointermove', this._checkDragThreshold, this)
      this.scene.input.off('pointerup',   this._clearPendingDrag,   this)
      this._pendingDrag   = null
      this._pointerDownAt = null
    }
    this._redraw()
  }

  /**
   * Returns the grid cell under a world-space pointer position, or null if
   * the position is outside the grid. Used by external drop zones.
   */
  getGridCell(worldX: number, worldY: number): { col: number; row: number } | null {
    const col = Math.floor((worldX - this.originX) / this.cellSize)
    const row = Math.floor((worldY - this.originY) / this.cellSize)
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null
    return { col, row }
  }

  /** Highlight one item with a gold border. Pass null to clear the selection. */
  setSelected(itemId: string | null): void {
    this._selectedItemId = itemId
    this._redraw()
  }

  /**
   * Render the grid with the given item placements. Clears the previous render.
   * Call this again whenever placements change.
   */
  render(placements: GridPlacement[], options: GridPanelRenderOptions = {}): void {
    this._placements = placements
    this._options    = options
    this._redraw()
  }

  /** Destroy all Phaser objects owned by this panel. */
  destroy(): void {
    this.objects.forEach(o => o.destroy())
    this.objects = []
    this.overlay.destroy()
    if (this._dragging) {
      this._dragging.ghost.destroy()
      this._dragging.ghostLabel.destroy()
      this._dragging.ghostImage?.destroy()
      this.scene.input.off('pointermove', this._boundDragMove)
      this.scene.input.off('pointerup',   this._boundDragEnd)
      this._dragging = null
    }
    if (this._pendingDrag) {
      this.scene.input.off('pointermove', this._checkDragThreshold, this)
      this.scene.input.off('pointerup',   this._clearPendingDrag,   this)
      this._pendingDrag   = null
      this._pointerDownAt = null
    }
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private _redraw(): void {
    this.objects.forEach(o => o.destroy())
    this.objects = []

    const S = this.cellSize

    // Empty cell backgrounds
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.scene.add.rectangle(
          this.originX + col * S + S / 2,
          this.originY + row * S + S / 2,
          S - 2, S - 2,
          0x111133
        ).setStrokeStyle(1, 0x333366)
        this.objects.push(cell)
      }
    }

    // Items (skip the one currently being dragged — ghost replaces it)
    for (const p of this._placements) {
      if (this._dragging?.itemId === p.itemId) continue
      this._drawItem(p.itemId, p.x, p.y, p.w, p.h)
    }
  }

  private _drawItem(itemId: string, col: number, row: number, w: number, h: number): void {
    const S = this.cellSize
    const item = getItem(itemId)
    if (!item) return

    const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color
    const isSelected = this._selectedItemId === itemId
    const px = this.originX + col * S
    const py = this.originY + row * S
    const cx = px + (w * S) / 2
    const cy = py + (h * S) / 2

    // Rarity-colored background
    const bg = this.scene.add.rectangle(cx, cy, w * S - 4, h * S - 4, itemColor, 0.7)
      .setInteractive({ useHandCursor: true }).setDepth(10)
    if (isSelected) bg.setStrokeStyle(2, 0xffd700)
    this.objects.push(bg)

    // Pixel art sprite (if texture exists)
    if (this.scene.textures.exists(itemId)) {
      const img = this.scene.add.image(cx, cy, itemId)
        .setDisplaySize(w * S - 8, h * S - 8)
        .setDepth(11)
      this.objects.push(img)
    }

    // Name label backing (semi-transparent strip at top of item block)
    const backing = this.scene.add.rectangle(
      cx, py + 7, w * S - 4, 14, 0x000000, 0.55
    ).setDepth(11)
    this.objects.push(backing)

    // Name label text
    const label = this.scene.add.text(
      px + 4, py + 2,
      item.name,
      { fontSize: '9px', color: '#ffffff', wordWrap: { width: w * S - 8 }, fontStyle: 'bold' }
    ).setDepth(12)
    this.objects.push(label)

    const { draggable, clickToSelect } = this._options

    if (draggable && clickToSelect) {
      bg.on('pointerdown', () => {
        const toggle = this._selectedItemId === itemId ? null : itemId
        this._selectedItemId = toggle
        this._onItemClickCb?.(itemId)
        this._redraw()
        this._pointerDownAt = {
          x: this.scene.input.activePointer.x,
          y: this.scene.input.activePointer.y,
        }
        this._pendingDrag = { itemId, col, row, w, h }
        this.scene.input.once('pointermove', this._checkDragThreshold, this)
        this.scene.input.once('pointerup',   this._clearPendingDrag,   this)
      })
    } else if (draggable) {
      bg.on('pointerdown', () => this._startDrag(itemId, col, row, w, h))
    } else {
      bg.on('pointerdown', () => {
        this._selectedItemId = this._selectedItemId === itemId ? null : itemId
        this._onItemClickCb?.(itemId)
        this._redraw()
      })
    }
  }

  private _checkDragThreshold(pointer: Phaser.Input.Pointer): void {
    if (!this._pendingDrag || !this._pointerDownAt) return
    const dx = pointer.x - this._pointerDownAt.x
    const dy = pointer.y - this._pointerDownAt.y
    if (Math.sqrt(dx * dx + dy * dy) > 8) {
      const { itemId, col, row, w, h } = this._pendingDrag
      this._pendingDrag   = null
      this._pointerDownAt = null
      this.scene.input.off('pointerup', this._clearPendingDrag, this)
      // Deselect while dragging; caller clears card via onItemClick(itemId)
      this._selectedItemId = null
      this._onItemClickCb?.(itemId)
      this._startDrag(itemId, col, row, w, h)
    } else {
      this.scene.input.once('pointermove', this._checkDragThreshold, this)
    }
  }

  private _clearPendingDrag(): void {
    this._pendingDrag   = null
    this._pointerDownAt = null
  }

  private _startDrag(itemId: string, col: number, row: number, w: number, h: number): void {
    if (this._dragging) return
    const S    = this.cellSize
    const item = getItem(itemId)!
    const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color

    const ghost = this.scene.add.rectangle(
      this.originX + col * S + (w * S) / 2,
      this.originY + row * S + (h * S) / 2,
      w * S - 4, h * S - 4,
      itemColor, 0.85
    ).setDepth(100)

    const ghostLabel = this.scene.add.text(
      this.originX + col * S + 4,
      this.originY + row * S + 4,
      item.name,
      { fontSize: '9px', color: '#ffffff', wordWrap: { width: w * S - 8 }, fontStyle: 'bold' }
    ).setDepth(101)

    let ghostImage: Phaser.GameObjects.Image | null = null
    if (this.scene.textures.exists(itemId)) {
      ghostImage = this.scene.add.image(
        this.originX + col * S + (w * S) / 2,
        this.originY + row * S + (h * S) / 2,
        itemId
      ).setDisplaySize(w * S - 8, h * S - 8).setDepth(101)
    }

    this._dragging = { itemId, ghost, ghostLabel, ghostImage, w, h, originCol: col, originRow: row }

    this.scene.input.on('pointermove', this._boundDragMove)
    this.scene.input.on('pointerup',   this._boundDragEnd)

    this._redraw()
  }

  private _onDragMove(pointer: Phaser.Input.Pointer): void {
    if (!this._dragging) return
    const { ghost, ghostLabel, w, h } = this._dragging
    const S = this.cellSize

    ghost.setPosition(pointer.x, pointer.y)
    ghostLabel.setPosition(pointer.x - (w * S) / 2 + 4, pointer.y - (h * S) / 2 + 4)
    this._dragging.ghostImage?.setPosition(pointer.x, pointer.y)

    this.overlay.clear()
    const col    = Math.floor((pointer.x - this.originX) / S)
    const row    = Math.floor((pointer.y - this.originY) / S)
    const onGrid = col >= 0 && col + w <= this.cols && row >= 0 && row + h <= this.rows

    if (onGrid && this._options.grid) {
      const canDrop = this._options.grid.canPlace(col, row, w, h, this._dragging.itemId)
      this.overlay.fillStyle(canDrop ? 0x00ff00 : 0xff0000, 0.3)
      this.overlay.fillRect(
        this.originX + col * S,
        this.originY + row * S,
        w * S, h * S
      )
    }
  }

  private _onDragEnd(pointer: Phaser.Input.Pointer): void {
    if (!this._dragging) return
    const { itemId, ghost, ghostLabel, w, h } = this._dragging
    const S = this.cellSize

    ghost.destroy()
    ghostLabel.destroy()
    this._dragging.ghostImage?.destroy()
    this.overlay.clear()
    this.scene.input.off('pointermove', this._boundDragMove)
    this.scene.input.off('pointerup',   this._boundDragEnd)
    this._dragging = null

    const col    = Math.floor((pointer.x - this.originX) / S)
    const row    = Math.floor((pointer.y - this.originY) / S)
    const onGrid = col >= 0 && col + w <= this.cols && row >= 0 && row + h <= this.rows

    if (onGrid) {
      const canDrop = this._options.grid
        ? this._options.grid.canPlace(col, row, w, h, itemId)
        : true
      if (canDrop) this._onItemDropCb?.(itemId, col, row)
    }

    // If the pointer landed off-grid, external drop zones (equipment slots)
    // handle the drop via their own pointerup listeners. Always redraw to
    // restore the item's original position if no handler moved it.
    this._redraw()
  }
}
