import Phaser from 'phaser'
import { CompanionTemplate, COMPANION_TEMPLATES, PET_TEMPLATES } from '../data/companions'
import { ITEMS, getItemColor } from '../data/items'
import { SPELLS } from '../data/spells'
import { ENEMY_MANIFEST, BACKGROUND_MANIFEST, filterEntries } from '../art/galleryManifest'
import { generateAllItemTextures } from '../art/itemsArt'
import { generateAllCompanionTextures } from '../art/companionsArt'
import { generateGoblinWhackerTextures } from '../art/goblinWhackerArt'
import { generateSkeletonSwarmTextures } from '../art/skeletonSwarmArt'
import { generateDungeonTrapTextures } from '../art/dungeonTrapArt'
import { generateDungeonPlatformerTextures } from '../art/dungeonPlatformerArt'
import { generateGenericBossTextures } from '../art/genericBossArt'
import { generateNessaTextures } from '../art/nessaArt'
import { generateCrazedCookTextures } from '../art/crazedCookArt'
import { ItemData, SpellData } from '../types'

type CategoryId = 'items' | 'companions' | 'enemies' | 'backgrounds' | 'spells'

export interface DisplayEntry {
  key: string
  name: string
  group: string
  data?: ItemData | CompanionTemplate | SpellData
  isBossBg?: boolean
}

export class AssetGalleryScene extends Phaser.Scene {
  hubContainer!: Phaser.GameObjects.Container
  categoryContainer!: Phaser.GameObjects.Container
  modalContainer: Phaser.GameObjects.Container | null = null
  dimRect: Phaser.GameObjects.Rectangle | null = null
  activeBgObjects: Phaser.GameObjects.GameObject[] = []

  activeCategory: CategoryId | null = null
  activeFilter = 'All'
  filteredList: DisplayEntry[] = []
  allEntries: DisplayEntry[] = []

  constructor() { super('AssetGallery') }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Dev tool: generate all asset textures synchronously upfront. Each generator guards against re-entry.
    generateGoblinWhackerTextures(this)     // 'goblin', 'ogre', 'hero', 'forest_bg', etc.
    generateSkeletonSwarmTextures(this)     // 'ss_skeleton', 'ss_sky', 'ss_ruins', etc.
    generateDungeonTrapTextures(this)       // 'dungeon_bg', 'trap_idle', etc.
    generateDungeonPlatformerTextures(this) // 'obstacle_pit', 'platform_floor', etc.
    generateGenericBossTextures(this)       // 'generic_boss'
    generateNessaTextures(this)             // 'nessa_boss'
    generateCrazedCookTextures(this)        // 'cook_ladle', 'kitchen_bg', etc.
    generateAllCompanionTextures(this)      // 'mouse_guard_scout', 'goblin' (pet), etc.
    generateAllItemTextures(this)           // all 34 item textures

    this.hubContainer = this.add.container(0, 0).setDepth(10)
    this.categoryContainer = this.add.container(0, 0).setDepth(10).setVisible(false)

    this.buildHub()
  }

  private buildHub() {
    const { width, height } = this.scale
    this.hubContainer.removeAll(true)

    const title = this.add.text(width / 2, height * 0.12, 'ASSET GALLERY', {
      fontSize: '36px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5)

    const subtitle = this.add.text(width / 2, height * 0.21, 'Developer View · All Assets', {
      fontSize: '16px', color: '#aaaaff',
    }).setOrigin(0.5)

    const tiles: { id: CategoryId; label: string; icon: string; count: string; sub: string }[] = [
      { id: 'items',       label: 'ITEMS',       icon: '⚔',  count: '34 assets', sub: 'Weapons · Armor · Accessories · etc.' },
      { id: 'companions',  label: 'COMPANIONS',  icon: '🐾', count: '9 assets',  sub: 'Heroes · Pets'                        },
      { id: 'enemies',     label: 'ENEMIES',     icon: '🧌', count: '15 assets', sub: 'Monsters · Bosses · NPCs'             },
      { id: 'backgrounds', label: 'BACKGROUNDS', icon: '🌄', count: '22 assets', sub: 'Level BGs · Tilesets · Boss BGs'      },
      { id: 'spells',      label: 'SPELLS',      icon: '✨', count: '4 assets',  sub: 'Data cards'                          },
    ]

    const tileW = 200
    const tileH = 150
    const gap = 20

    tiles.forEach((tile, i) => {
      // Row 0: tiles 0–2 centred (3 across). Row 1: tiles 3–4 centred (2 across).
      const row = i < 3 ? 0 : 1
      const col = i < 3 ? i : i - 3
      const rowCount = row === 0 ? 3 : 2
      const rowW = rowCount * tileW + (rowCount - 1) * gap
      const cx = width / 2 - rowW / 2 + tileW / 2 + col * (tileW + gap)
      const cy = row === 0 ? height * 0.45 : height * 0.65

      const bg = this.add.rectangle(cx, cy, tileW, tileH, 0x2a2a4a)
        .setStrokeStyle(2, 0x5555aa)
        .setInteractive({ useHandCursor: true })
      bg.on('pointerover', () => bg.setStrokeStyle(2, 0xffd700))
      bg.on('pointerout',  () => bg.setStrokeStyle(2, 0x5555aa))
      bg.on('pointerdown', () => this.showCategory(tile.id))

      const iconText  = this.add.text(cx, cy - 44, tile.icon,  { fontSize: '28px' }).setOrigin(0.5)
      const labelText = this.add.text(cx, cy - 10, tile.label, { fontSize: '13px', color: '#ffd700', fontStyle: 'bold' }).setOrigin(0.5)
      const countText = this.add.text(cx, cy + 14, tile.count, { fontSize: '11px', color: '#666688' }).setOrigin(0.5)
      const subText   = this.add.text(cx, cy + 36, tile.sub,   {
        fontSize: '9px', color: '#888888',
        wordWrap: { width: tileW - 16 }, align: 'center',
      }).setOrigin(0.5)

      this.hubContainer.add([bg, iconText, labelText, countText, subText])
    })

    const backBtn = this.add.text(width / 2, height * 0.88, '← BACK TO MENU', {
      fontSize: '18px', color: '#ffffff', backgroundColor: '#4e4e6a',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#ffd700'))
    backBtn.on('pointerout',  () => backBtn.setColor('#ffffff'))
    backBtn.on('pointerdown', () => this.scene.start('MainMenu'))

    this.hubContainer.add([title, subtitle, backBtn])
  }

  showHub() {
    this.closeModal()
    this.destroyActiveBgObjects()
    this.categoryContainer.setVisible(false)
    this.hubContainer.setVisible(true)
    this.activeCategory = null
    this.activeFilter = 'All'
  }

  showCategory(id: CategoryId) {
    this.activeCategory = id
    this.activeFilter = 'All'
    this.hubContainer.setVisible(false)
    this.buildCategoryPage(id)
    this.categoryContainer.setVisible(true)
  }

  private buildCategoryPage(id: CategoryId) {
    const { width } = this.scale
    this.categoryContainer.removeAll(true)

    const headerBg   = this.add.rectangle(width / 2, 22, width, 44, 0x12122a)
    const headerLine = this.add.rectangle(width / 2, 44, width, 2, 0x4e4e6a)

    const labels: Record<CategoryId, string> = {
      items: '⚔ ITEMS', companions: '🐾 COMPANIONS',
      enemies: '🧌 ENEMIES', backgrounds: '🌄 BACKGROUNDS', spells: '✨ SPELLS',
    }
    const catLabel = this.add.text(width / 2, 22, labels[id], {
      fontSize: '20px', color: '#ffd700', fontStyle: 'bold',
    }).setOrigin(0.5)

    const backBtn = this.add.text(20, 22, '← BACK', {
      fontSize: '16px', color: '#ffffff', backgroundColor: '#4e4e6a',
      padding: { x: 10, y: 5 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
    backBtn.on('pointerover', () => backBtn.setColor('#ffd700'))
    backBtn.on('pointerout',  () => backBtn.setColor('#ffffff'))
    backBtn.on('pointerdown', () => this.showHub())

    this.categoryContainer.add([headerBg, headerLine, catLabel, backBtn])

    this.allEntries = this.buildEntries(id)
    this.buildFilterTabs(id)
    this.buildGrid()
  }

  private buildEntries(id: CategoryId): DisplayEntry[] {
    switch (id) {
      case 'items': {
        const slotGroups: Record<string, string> = {
          weapon: 'Weapons', armor: 'Armor', accessory: 'Accessories',
          trophy: 'Trophies', consumable: 'Consumables',
        }
        return ITEMS.map(item => ({
          key: item.id,
          name: item.name,
          group: slotGroups[item.slot] ?? (item.slot.charAt(0).toUpperCase() + item.slot.slice(1)),
          data: item,
        }))
      }
      case 'companions':
        return [
          ...COMPANION_TEMPLATES.map(c => ({ key: c.id, name: c.name, group: 'Companions', data: c as CompanionTemplate })),
          ...PET_TEMPLATES.map(p => ({ key: p.id, name: p.name, group: 'Pets', data: p as CompanionTemplate })),
        ]
      case 'enemies':
        return ENEMY_MANIFEST.map(e => ({ key: e.key, name: e.name, group: e.group }))
      case 'backgrounds':
        return BACKGROUND_MANIFEST.map(b => ({
          key: b.key, name: b.name, group: b.group,
          isBossBg: b.group === 'Boss BG',
        }))
      case 'spells':
        return SPELLS.map(s => ({ key: s.id, name: s.name, group: 'Spell', data: s }))
    }
  }

  private getFilters(id: CategoryId): string[] {
    switch (id) {
      case 'items':       return ['All', 'Weapons', 'Armor', 'Accessories', 'Trophies', 'Consumables']
      case 'companions':  return ['All', 'Companions', 'Pets']
      case 'enemies':     return ['All', 'Monsters', 'Bosses', 'NPCs', 'Objects']
      case 'backgrounds': return ['All', 'Level BG', 'World Tileset', 'Boss BG']
      case 'spells':      return []
    }
  }

  private buildFilterTabs(id: CategoryId) {
    const filters = this.getFilters(id)
    if (!filters.length) return

    let tabX = 14
    const tabY = 66

    for (const filter of filters) {
      const isActive = filter === this.activeFilter
      const tab = this.add.text(tabX, tabY, filter, {
        fontSize: '13px',
        color: isActive ? '#111111' : '#888888',
        backgroundColor: isActive ? '#ffd700' : '#2a2a4a',
        padding: { x: 8, y: 4 },
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true })

      tab.on('pointerdown', () => {
        this.activeFilter = filter
        this.buildCategoryPage(this.activeCategory!)
      })

      this.categoryContainer.add(tab)
      tabX += tab.width + 6
    }
  }

  private buildGrid() {
    const { width } = this.scale
    const hasFilters = this.getFilters(this.activeCategory!).length > 0
    const gridTop = hasFilters ? 90 : 56

    this.filteredList = filterEntries(this.allEntries, this.activeFilter)

    const isBackground = this.activeCategory === 'backgrounds'
    const cellW = isBackground ? 140 : 90
    const cellH = isBackground ? 78 : 90
    const cols = Math.floor((width - 20) / (cellW + 8))
    const padX = Math.floor((width - cols * (cellW + 8)) / 2)

    for (let i = 0; i < this.filteredList.length; i++) {
      const entry = this.filteredList[i]
      const col = i % cols
      const row = Math.floor(i / cols)
      const cx = padX + col * (cellW + 8) + cellW / 2
      const cy = gridTop + row * (cellH + 8) + cellH / 2

      let borderColor = 0x444444
      if ((entry.data as ItemData)?.rarity) {
        borderColor = parseInt(getItemColor((entry.data as ItemData).rarity).replace('#', ''), 16)
      }

      const cellBg = this.add.rectangle(cx, cy, cellW, cellH, 0x2a2a4a)
        .setStrokeStyle(1, borderColor)
        .setInteractive({ useHandCursor: true })
      cellBg.on('pointerover', () => cellBg.setStrokeStyle(2, 0xffd700))
      cellBg.on('pointerout',  () => cellBg.setStrokeStyle(1, borderColor))
      cellBg.on('pointerdown', () => this.showModal(i))

      const isSpell  = this.activeCategory === 'spells'
      const isBossBg = !!entry.isBossBg
      const hasTexture = !isSpell && !isBossBg && this.textures.exists(entry.key)

      if (hasTexture) {
        const img = this.add.image(cx, cy - 10, entry.key)
        const maxDim = cellW - 14
        img.setScale(Math.min(maxDim / img.width, maxDim / img.height, 3))
        this.categoryContainer.add(img)
      } else {
        const placeholder = this.add.text(cx, cy - 10, isSpell ? '✨' : '🌄', {
          fontSize: '26px',
        }).setOrigin(0.5)
        this.categoryContainer.add(placeholder)
      }

      const nameLabel = this.add.text(cx, cy + cellH / 2 - 20, entry.name, {
        fontSize: '8px', color: '#cccccc',
        wordWrap: { width: cellW - 4 }, align: 'center',
      }).setOrigin(0.5, 0)

      this.categoryContainer.add([cellBg, nameLabel])
    }
  }

  showModal(_index: number) {}
  closeModal() {}
  destroyActiveBgObjects() {}
}
