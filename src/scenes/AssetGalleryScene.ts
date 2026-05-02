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

interface DisplayEntry {
  key: string
  name: string
  group: string
  data?: ItemData | CompanionTemplate | SpellData
  isBossBg?: boolean
}

export class AssetGalleryScene extends Phaser.Scene {
  private _hubContainer!: Phaser.GameObjects.Container
  private _categoryContainer!: Phaser.GameObjects.Container
  private _modalContainer: Phaser.GameObjects.Container | null = null
  private _dimRect: Phaser.GameObjects.Rectangle | null = null
  private _activeBgObjects: Phaser.GameObjects.GameObject[] = []

  private _activeCategory: CategoryId | null = null
  private _activeFilter = 'All'
  private _filteredList: DisplayEntry[] = []
  private _allEntries: DisplayEntry[] = []

  constructor() { super('AssetGallery') }

  create() {
    const { width, height } = this.scale

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e)

    // Generate all textures upfront — each generator guards against duplicates internally
    generateGoblinWhackerTextures(this)   // 'goblin', 'ogre', 'hero', 'forest_bg', etc.
    generateSkeletonSwarmTextures(this)   // 'ss_skeleton', 'ss_sky', 'ss_ruins', etc.
    generateDungeonTrapTextures(this)     // 'dungeon_bg', 'trap_idle', etc.
    generateDungeonPlatformerTextures(this) // 'obstacle_pit', 'platform_floor', etc.
    generateGenericBossTextures(this)     // 'generic_boss'
    generateNessaTextures(this)           // 'nessa_boss'
    generateCrazedCookTextures(this)      // 'cook_ladle', 'kitchen_bg', etc.
    generateAllCompanionTextures(this)    // 'mouse_guard_scout', 'goblin' (pet), etc.
    generateAllItemTextures(this)         // all 34 item textures

    this._hubContainer = this.add.container(0, 0).setDepth(10)
    this._categoryContainer = this.add.container(0, 0).setDepth(10).setVisible(false)
    void this._hubContainer
    void this._categoryContainer
    void this._modalContainer
    void this._dimRect
    void this._activeBgObjects
    void this._activeCategory
    void this._activeFilter
    void this._filteredList
    void this._allEntries

    this._buildHub()
    this._useMethods()
  }

  private _buildHub() {}
  _showHub() {}
  _showCategory(_id: CategoryId) {}
  _showModal(_index: number) {}
  _closeModal() {}
  private _destroyActiveBgObjects() {}
  private _renderBossBg(_key: string) {}
  private _buildCategoryPage(_id: CategoryId) {}
  private _buildEntries(_id: CategoryId): DisplayEntry[] { return [] }
  private _getFilters(_id: CategoryId): string[] { return [] }
  private _buildFilterTabs(_id: CategoryId) {}
  private _buildGrid() {}
  private _buildModalContent(_entry: DisplayEntry, _w: number, _h: number): Phaser.GameObjects.GameObject[] { return [] }

  private _useMethods() {
    // Mark stub methods as referenced to satisfy noUnusedLocals
    void this._destroyActiveBgObjects
    void this._renderBossBg
    void this._buildCategoryPage
    void this._buildEntries
    void this._getFilters
    void this._buildFilterTabs
    void this._buildGrid
    void this._buildModalContent
  }
}
