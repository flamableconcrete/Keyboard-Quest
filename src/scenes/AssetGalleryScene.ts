// @ts-nocheck
import Phaser from 'phaser'
import { ITEMS, getItemColor } from '../data/items'
import { COMPANION_TEMPLATES, PET_TEMPLATES, CompanionTemplate } from '../data/companions'
import { SPELLS } from '../data/spells'
import { generateAllItemTextures } from '../art/itemsArt'
import { generateAllCompanionTextures } from '../art/companionsArt'
import { generateGoblinWhackerTextures } from '../art/goblinWhackerArt'
import { generateSkeletonSwarmTextures } from '../art/skeletonSwarmArt'
import { generateDungeonTrapTextures } from '../art/dungeonTrapArt'
import { generateDungeonPlatformerTextures } from '../art/dungeonPlatformerArt'
import { generateGenericBossTextures } from '../art/genericBossArt'
import { generateNessaTextures } from '../art/nessaArt'
import { generateCrazedCookTextures } from '../art/crazedCookArt'
import {
  drawSlimeCaveBg,
  drawSwampBg,
  drawWebCavernBg,
  drawCryptBg,
  drawCastleThroneRoomBg,
  drawEtherealVoidBg,
  drawVolcanicLairBg,
  drawSteampunkWorkshopBg,
  drawGraveyardBg,
  drawDarkForestBg,
  drawDigitalVoidBg,
} from '../utils/bossBackgrounds'
import { ENEMY_MANIFEST, BACKGROUND_MANIFEST, filterEntries, GalleryEntry } from '../art/galleryManifest'
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
  private hubContainer!: Phaser.GameObjects.Container
  private categoryContainer!: Phaser.GameObjects.Container
  private modalContainer: Phaser.GameObjects.Container | null = null
  private dimRect: Phaser.GameObjects.Rectangle | null = null
  private activeBgObjects: Phaser.GameObjects.GameObject[] = []

  private activeCategory: CategoryId | null = null
  private activeFilter = 'All'
  private filteredList: DisplayEntry[] = []
  private allEntries: DisplayEntry[] = []

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

    this.hubContainer = this.add.container(0, 0).setDepth(10)
    this.categoryContainer = this.add.container(0, 0).setDepth(10).setVisible(false)

    this.buildHub()
  }

  private buildHub() {}
  showHub() {}
  showCategory(_id: CategoryId) {}
  showModal(_index: number) {}
  closeModal() {}
  private destroyActiveBgObjects() {}
  private renderBossBg(_key: string) {}
  private buildCategoryPage(_id: CategoryId) {}
  private buildEntries(_id: CategoryId): DisplayEntry[] { return [] }
  private getFilters(_id: CategoryId): string[] { return [] }
  private buildFilterTabs(_id: CategoryId) {}
  private buildGrid() {}
  private buildModalContent(_entry: DisplayEntry, _w: number, _h: number): Phaser.GameObjects.GameObject[] { return [] }
}
