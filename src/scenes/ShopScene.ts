import Phaser from 'phaser'
import { loadProfile, saveProfile } from '../utils/profile'
import { ProfileData, ItemData } from '../types'
import { getItemColor, getItem, ITEMS } from '../data/items'
import { drawEquipSlotBox, EQUIP_SLOT_SIZES } from '../utils/equipSlot'
import { generateAllItemTextures } from '../art/itemsArt'
import { InventoryController } from '../controllers/InventoryController'
import { BackpackGrid, GRID_COLS, GRID_ROWS } from '../controllers/BackpackGrid'
import { GridPanel } from '../components/GridPanel'
import { ItemTooltipCard } from '../components/ItemTooltipCard'

const MERCHANT_COLS = 10
const MERCHANT_ROWS = 8
const CELL = 45

export class ShopScene extends Phaser.Scene {
  private profileSlot!: number
  private profile!: ProfileData
  private inventoryController!: InventoryController

  // Left panel
  private merchantPanel!: GridPanel
  private merchantPlacements: { itemId: string; x: number; y: number; w: number; h: number }[] = []
  private selectedShopItemId: string | null = null

  // Right panel
  private backpackPanel!: GridPanel
  private selectedBackpackItemId: string | null = null

  // UI objects refreshed by _refreshShopCard / _refreshInventoryCard
  private shopCardObjects:      Phaser.GameObjects.GameObject[] = []
  private inventoryCardObjects: Phaser.GameObjects.GameObject[] = []

  // Equipment slot drag state (equip slot → backpack)
  private equipDrag: {
    itemId: string
    slot:   'weapon' | 'armor' | 'accessory' | 'trophy'
    ghost:  Phaser.GameObjects.Rectangle
    ghostImage: Phaser.GameObjects.Image | null
    label:  Phaser.GameObjects.Text
    w: number
    h: number
  } | null = null

  // Tooltip card
  private tooltip!: ItemTooltipCard

  constructor() { super('Shop') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile     = loadProfile(data.profileSlot)!
    this.inventoryController = new InventoryController(this.profile)
  }

  create() {
    generateAllItemTextures(this)

    this.tooltip = new ItemTooltipCard(this, { showGoldCost: true })
    this.events.once('shutdown', () => this.tooltip.destroy())

    const { width, height } = this.scale

    // ── Background ───────────────────────────────────────────────────────────
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // ── Header ───────────────────────────────────────────────────────────────
    this.add.rectangle(width / 2, 22, width, 44, 0x12122a)
    this.add.rectangle(width / 2, 44, width, 2, 0x4e4e6a)

    this.add.text(20, 22, '← BACK', {
      fontSize: '18px', color: '#ffffff', backgroundColor: '#4e4e6a',
      padding: { x: 12, y: 6 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap'
        this.scene.start(target, { profileSlot: this.profileSlot })
      })

    this.add.text(width / 2, 22, "THE MERCHANT'S TENT", {
      fontSize: '22px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width - 16, 22, `Gold: ${this.profile.gold ?? 0}g`, {
      fontSize: '16px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(1, 0.5)

    // ── Layout constants ──────────────────────────────────────────────────────
    // Divider at center; grids are centred within their respective halves.
    const dividerX   = width / 2   // 640 on a 1280-wide canvas
    const contentTop = 52

    // ── Merchant panel heading ─────────────────────────────────────────────
    this.add.text(width / 4, contentTop + 4, "MERCHANT'S WARES", {
      fontSize: '12px', color: '#ffaa44', fontStyle: 'bold',
    }).setOrigin(0.5, 0)

    // ── Merchant grid (10×8, click-only) ─────────────────────────────────
    const merchantOriginX = width / 4 - MERCHANT_COLS * CELL / 2
    const merchantOriginY = contentTop + 22

    this.merchantPlacements = this._buildMerchantPlacements()

    this.merchantPanel = new GridPanel(
      this, merchantOriginX, merchantOriginY,
      MERCHANT_COLS, MERCHANT_ROWS, CELL
    )
    this.merchantPanel
      .onItemClick(itemId => {
        this.selectedShopItemId = this.selectedShopItemId === itemId ? null : itemId
        // Deselect backpack
        if (this.selectedBackpackItemId !== null) {
          this.selectedBackpackItemId = null
          this.backpackPanel.setSelected(null)
        }
        this._refreshShopCard()
        this._refreshInventoryCard()
      })
      .render(this.merchantPlacements, { tooltip: this.tooltip })

    // ── Vertical divider ──────────────────────────────────────────────────
    this.add.rectangle(dividerX + 2, height / 2 + 22, 3, height, 0x4e4e6a)

    // ── Inventory panel heading ───────────────────────────────────────────
    this.add.text(width * 3 / 4, contentTop + 4, 'YOUR INVENTORY', {
      fontSize: '12px', color: '#ffaa44', fontStyle: 'bold',
    }).setOrigin(0.5, 0)

    // ── Equipment slots ───────────────────────────────────────────────────
    const equipY = contentTop + 24
    this._drawEquipSlots(width * 3 / 4, equipY)

    // ── Backpack grid (10×4, draggable + click-to-select) ────────────────
    const backpackOriginX = width * 3 / 4 - GRID_COLS * CELL / 2
    const backpackOriginY = equipY + EQUIP_SLOT_SIZES.weapon.h + 16

    this.add.text(backpackOriginX, backpackOriginY - 16, 'BACKPACK', {
      fontSize: '10px', color: '#888888',
    })

    this.backpackPanel = new GridPanel(
      this, backpackOriginX, backpackOriginY,
      GRID_COLS, GRID_ROWS, CELL
    )
    this.backpackPanel
      .onItemClick(itemId => {
        this.selectedBackpackItemId = this.selectedBackpackItemId === itemId ? null : itemId
        // Deselect merchant
        if (this.selectedShopItemId !== null) {
          this.selectedShopItemId = null
          this.merchantPanel.setSelected(null)
        }
        this._refreshInventoryCard()
        this._refreshShopCard()
      })
      .onItemDrop((itemId, col, row) => {
        const moved = this.inventoryController.moveInBackpack(itemId, col, row)
        if (moved) saveProfile(this.profileSlot, this.profile)
        this.backpackPanel.render(
          this.inventoryController.backpackGrid.getPlacements(),
          { draggable: true, clickToSelect: true, grid: this.inventoryController.backpackGrid, tooltip: this.tooltip, getQuantity: (id) => this.inventoryController.getQuantity(id) }
        )
      })
      .render(
        this.inventoryController.backpackGrid.getPlacements(),
        { draggable: true, clickToSelect: true, grid: this.inventoryController.backpackGrid, tooltip: this.tooltip, getQuantity: (id) => this.inventoryController.getQuantity(id) }
      )

    this._refreshShopCard()
    this._refreshInventoryCard()
  }

  // ─── Merchant grid population ─────────────────────────────────────────────

  private _buildMerchantPlacements(): { itemId: string; x: number; y: number; w: number; h: number }[] {
    const ownedIds = this.inventoryController.ownedItemIds

    const shopItems = (this.profile.currentShopItemIds ?? [])
      .filter(id => !ownedIds.includes(id))
      .map(id => {
        const item = getItem(id)
        return item ? { itemId: id, w: item.gridSize.w, h: item.gridSize.h } : null
      })
      .filter((x): x is { itemId: string; w: number; h: number } => x !== null)

    const consumables = ITEMS
      .filter(i => i.slot === 'consumable')
      .map(i => ({ itemId: i.id, w: i.gridSize.w, h: i.gridSize.h }))

    const packed = BackpackGrid.autoArrange([...shopItems, ...consumables])
    return packed.map(p => {
      const item = getItem(p.itemId)!
      return { itemId: p.itemId, x: p.x, y: p.y, w: item.gridSize.w, h: item.gridSize.h }
    })
  }

  // ─── Equipment slots ──────────────────────────────────────────────────────

  private _drawEquipSlots(centerX: number, y: number) {
    const slotDefs = [
      { slot: 'weapon'    as const },
      { slot: 'armor'     as const },
      { slot: 'accessory' as const },
      { slot: 'trophy'    as const },
    ]

    const gap = 6
    const totalW = slotDefs.reduce((sum, { slot }) => sum + EQUIP_SLOT_SIZES[slot].w + gap, -gap)
    const maxH   = Math.max(...slotDefs.map(({ slot }) => EQUIP_SLOT_SIZES[slot].h))
    let curX = centerX - totalW / 2

    for (const { slot } of slotDefs) {
      const { w, h } = EQUIP_SLOT_SIZES[slot]
      const slotY  = y + maxH - h  // bottom-align shorter slots
      const itemId = this.profile.equipment[slot]
      const item   = itemId ? (getItem(itemId) ?? null) : null

      drawEquipSlotBox(this, curX, slotY, slot, item, {
        tooltip: this.tooltip,
        onDragStart: item ? () => this._startEquipDrag(item.id, slot, item) : undefined,
      })

      curX += w + gap
    }
  }

  // ─── Equipment slot drag ──────────────────────────────────────────────────

  private _startEquipDrag(
    itemId: string,
    slot: 'weapon' | 'armor' | 'accessory' | 'trophy',
    item: ItemData
  ) {
    if (this.equipDrag) return
    const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color
    const { w, h }  = item.gridSize
    const S         = CELL
    const ptr       = this.input.activePointer

    const ghost = this.add.rectangle(ptr.x, ptr.y, w * S - 4, h * S - 4, itemColor, 0.85).setDepth(100)
    const label = this.add.text(
      ptr.x - (w * S) / 2 + 4, ptr.y - (h * S) / 2 + 4,
      item.name,
      { fontSize: '9px', color: '#ffffff', fontStyle: 'bold' }
    ).setDepth(101)

    let ghostImage: Phaser.GameObjects.Image | null = null
    if (this.textures.exists(itemId)) {
      ghostImage = this.add.image(ptr.x, ptr.y, itemId)
        .setDisplaySize(w * S - 8, h * S - 8)
        .setDepth(101)
    }

    this.equipDrag = { itemId, slot, ghost, ghostImage, label, w, h }
    this.input.on('pointermove', this._onEquipDragMove, this)
    this.input.on('pointerup',   this._onEquipDragEnd,  this)
  }

  private _onEquipDragMove(pointer: Phaser.Input.Pointer) {
    if (!this.equipDrag) return
    const { ghost, label, w, h } = this.equipDrag
    const S = CELL
    ghost.setPosition(pointer.x, pointer.y)
    this.equipDrag.ghostImage?.setPosition(pointer.x, pointer.y)
    label.setPosition(pointer.x - (w * S) / 2 + 4, pointer.y - (h * S) / 2 + 4)
  }

  private _onEquipDragEnd(pointer: Phaser.Input.Pointer) {
    if (!this.equipDrag) return
    const { itemId, slot, ghost, label } = this.equipDrag

    ghost.destroy()
    label.destroy()
    this.equipDrag.ghostImage?.destroy()
    this.input.off('pointermove', this._onEquipDragMove, this)
    this.input.off('pointerup',   this._onEquipDragEnd,  this)
    this.equipDrag = null

    const cell = this.backpackPanel.getGridCell(pointer.x, pointer.y)
    if (!cell) return  // dropped off-grid — stay equipped

    // unequip() auto-places in first available space
    const placed = this.inventoryController.unequip(slot)
    if (!placed) return   // backpack full

    // Attempt to move to the requested cell (fails silently if occupied)
    this.inventoryController.moveInBackpack(itemId, cell.col, cell.row)

    this.profile.equipment = { ...this.inventoryController.equipment }
    saveProfile(this.profileSlot, this.profile)
    this.scene.restart({ profileSlot: this.profileSlot })
  }

  // ─── Item cards ───────────────────────────────────────────────────────────

  private _refreshShopCard() {
    this.shopCardObjects.forEach(o => (o as Phaser.GameObjects.GameObject).destroy())
    this.shopCardObjects = []

    const item = this.selectedShopItemId ? getItem(this.selectedShopItemId) : null
    if (!item) return

    const { width, height } = this.scale
    const cardX = width / 4 - MERCHANT_COLS * CELL / 2
    const cardY = height - 172
    const cardW = MERCHANT_COLS * CELL    // 450

    this.shopCardObjects = this._drawCard(cardX, cardY, cardW, item, 'buy')
  }

  private _refreshInventoryCard() {
    this.inventoryCardObjects.forEach(o => (o as Phaser.GameObjects.GameObject).destroy())
    this.inventoryCardObjects = []

    const item = this.selectedBackpackItemId ? getItem(this.selectedBackpackItemId) : null
    if (!item) return

    const { width, height } = this.scale
    const dividerX = width / 2
    const cardX    = dividerX + 6
    const cardY    = height - 172
    const cardW    = width - cardX - 10

    this.inventoryCardObjects = this._drawCard(cardX, cardY, cardW, item, 'sell')
  }

  private _drawCard(
    x: number, y: number, cardW: number,
    item: ItemData, mode: 'buy' | 'sell'
  ): Phaser.GameObjects.GameObject[] {
    const out: Phaser.GameObjects.GameObject[] = []
    const itemColor = Phaser.Display.Color.HexStringToColor(getItemColor(item.rarity)).color
    const cardH = 114
    const btnH  = 46

    // Card background
    out.push(
      this.add.rectangle(x + cardW / 2, y + cardH / 2, cardW, cardH, 0x0a0a1f)
          .setStrokeStyle(1, 0x4e4e6a)
    )

    // Item icon
    out.push(
      this.add.rectangle(x + 30, y + cardH / 2, 48, 48, itemColor, 0.5)
          .setStrokeStyle(1, 0x4e4e6a)
    )
    if (this.textures.exists(item.id)) {
      out.push(this.add.image(x + 30, y + cardH / 2, item.id).setScale(1.5))
    }

    // Name
    out.push(
      this.add.text(x + 58, y + 10, item.name, {
        fontSize: '14px', color: getItemColor(item.rarity), fontStyle: 'bold',
      })
    )

    // Rarity · slot · size
    out.push(
      this.add.text(x + 58, y + 28, `${item.rarity} · ${item.slot} · ${item.gridSize.w}×${item.gridSize.h}`, {
        fontSize: '10px', color: '#888888',
      })
    )

    // Description
    out.push(
      this.add.text(x + 58, y + 44, item.description, {
        fontSize: '10px', color: '#aaaaaa', wordWrap: { width: cardW - 68 },
      })
    )

    // Effect
    const effectStr = this._effectString(item)
    if (effectStr) {
      out.push(
        this.add.text(x + 58, y + 68, effectStr, { fontSize: '11px', color: '#44ff88' })
      )
    }

    // Price
    const priceLabel = mode === 'buy'
      ? `Cost: ${item.goldCost}g`
      : `Sell: ${Math.floor(item.goldCost * 0.75)}g`
    out.push(
      this.add.text(x + 58, y + 88, priceLabel, {
        fontSize: '13px', color: mode === 'buy' ? '#ffd700' : '#ffaa44', fontStyle: 'bold',
      })
    )

    // Action button
    const btnY = y + cardH + 6
    if (mode === 'buy') {
      const gold      = this.profile.gold ?? 0
      const canAfford = gold >= item.goldCost
      const hasSpace  = !!this.inventoryController.backpackGrid.findSpace(item.gridSize.w, item.gridSize.h)
      const canBuy    = canAfford && hasSpace

      const btnBg = this.add.rectangle(x + cardW / 2, btnY + btnH / 2, cardW, btnH,
        canBuy ? 0x1a4a1a : 0x1a1a1a
      ).setStrokeStyle(2, canBuy ? 0x44ff44 : 0x333333)
      out.push(btnBg)

      out.push(
        this.add.text(x + cardW / 2, btnY + btnH / 2, 'BUY', {
          fontSize: '18px', color: canBuy ? '#44ff44' : '#444444',
          fontStyle: 'bold', letterSpacing: 4,
        }).setOrigin(0.5)
      )

      if (canBuy) {
        btnBg.setInteractive({ useHandCursor: true })
        btnBg.on('pointerdown', () => this._executeBuy(item))
      }
    } else {
      const btnBg = this.add.rectangle(x + cardW / 2, btnY + btnH / 2, cardW, btnH, 0x4a2a0a)
        .setStrokeStyle(2, 0xffaa44)
        .setInteractive({ useHandCursor: true })
      out.push(btnBg)

      out.push(
        this.add.text(x + cardW / 2, btnY + btnH / 2, 'SELL', {
          fontSize: '18px', color: '#ffaa44', fontStyle: 'bold', letterSpacing: 4,
        }).setOrigin(0.5)
      )

      btnBg.on('pointerdown', () => this._confirmSell(item))
    }

    return out
  }

  // ─── Buy / Sell actions ───────────────────────────────────────────────────

  private _executeBuy(item: ItemData) {
    this.profile.gold = (this.profile.gold ?? 0) - item.goldCost
    this.inventoryController.addToBackpack(item.id)

    if (item.slot !== 'consumable' && this.profile.currentShopItemIds) {
      this.profile.currentShopItemIds =
        this.profile.currentShopItemIds.filter(id => id !== item.id)
    }

    saveProfile(this.profileSlot, this.profile)
    this.scene.restart({ profileSlot: this.profileSlot })
  }

  private _confirmSell(item: ItemData) {
    const sellPrice = Math.floor(item.goldCost * 0.75)
    const { width, height } = this.scale

    const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setDepth(199).setInteractive()

    const bg  = this.add.rectangle(width / 2, height / 2, 420, 160, 0x0a0a1f)
                    .setStrokeStyle(3, 0xffd700).setDepth(200)
    const msg = this.add.text(width / 2, height / 2 - 30,
      `Sell ${item.name}\nfor ${sellPrice}g?`,
      { fontSize: '18px', color: '#ffffff', align: 'center' }
    ).setOrigin(0.5).setDepth(201)

    const yesBtn = this.add.text(width / 2 - 70, height / 2 + 30, '[ Yes ]', {
      fontSize: '20px', color: '#44ff44',
      backgroundColor: '#1a3a1a', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true })

    const noBtn = this.add.text(width / 2 + 70, height / 2 + 30, '[ No ]', {
      fontSize: '20px', color: '#ff4444',
      backgroundColor: '#3a1a1a', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(201).setInteractive({ useHandCursor: true })

    const cleanup = () => { blocker.destroy(); bg.destroy(); msg.destroy(); yesBtn.destroy(); noBtn.destroy() }

    yesBtn.on('pointerdown', () => {
      cleanup()
      this.inventoryController.sell(item.id)   // mutates profile.gold
      saveProfile(this.profileSlot, this.profile)
      this.selectedBackpackItemId = null
      this.scene.restart({ profileSlot: this.profileSlot })
    })

    noBtn.on('pointerdown', cleanup)
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private _effectString(item: ItemData): string {
    const e = item.effect
    const parts: string[] = []
    if (e.hp)                          parts.push(`+${e.hp} HP`)
    if (e.power)                       parts.push(`+${e.power} Power`)
    if (e.focusBonus)                  parts.push(`+${e.focusBonus} Focus`)
    if (e.goldMultiplier)              parts.push(`+${(e.goldMultiplier * 100).toFixed(0)}% Gold`)
    if (e.absorbAttacksChance)         parts.push(`${(e.absorbAttacksChance * 100).toFixed(0)}% Block`)
    if (e.bonusGoldChance)             parts.push(`${(e.bonusGoldChance * 100).toFixed(0)}% Bonus Gold`)
    if (e.defeatAdditionalEnemiesChance) parts.push(`${(e.defeatAdditionalEnemiesChance * 100).toFixed(0)}% Double Kill`)
    return parts.join(', ')
  }
}
