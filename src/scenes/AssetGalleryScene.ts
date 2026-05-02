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

  buildHub() {}
  showHub() {}
  showCategory(_id: CategoryId) {}
  showModal(_index: number) {}
  closeModal() {}
}
