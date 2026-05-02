import Phaser from 'phaser'
import { CompanionTemplate } from '../data/companions'
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

  showCategory(_id: CategoryId) {}
  showModal(_index: number) {}
  closeModal() {}
  destroyActiveBgObjects() {}
}
