export type GalleryEntry = { key: string; name: string; group: string }

export const ENEMY_MANIFEST: GalleryEntry[] = [
  { key: 'goblin',            name: 'Goblin',               group: 'Monsters' },
  { key: 'ogre',              name: 'Ogre',                 group: 'Monsters' },
  { key: 'hero',              name: 'Hero',                 group: 'Monsters' },
  { key: 'ss_skeleton',       name: 'Skeleton',             group: 'Monsters' },
  { key: 'ss_skeleton_rising',name: 'Skeleton Rising',      group: 'Monsters' },
  { key: 'trap_idle',         name: 'Pressure Plate',       group: 'Objects'  },
  { key: 'trap_active',       name: 'Pressure Plate Active',group: 'Objects'  },
  { key: 'obstacle_pit',      name: 'Pit',                  group: 'Objects'  },
  { key: 'obstacle_spikes',   name: 'Spikes',               group: 'Objects'  },
  { key: 'obstacle_boulder',  name: 'Boulder',              group: 'Objects'  },
  { key: 'obstacle_door',     name: 'Door',                 group: 'Objects'  },
  { key: 'generic_boss',      name: 'Generic Boss',         group: 'Bosses'   },
  { key: 'nessa_boss',        name: 'Nessa',                group: 'Bosses'   },
  { key: 'cook_ladle',        name: 'Crazed Cook',          group: 'Bosses'   },
  { key: 'orc_customer',      name: 'Orc Customer',         group: 'NPCs'     },
]

export const BACKGROUND_MANIFEST: GalleryEntry[] = [
  // Level BG — stored as named textures by their generators
  { key: 'forest_bg',              name: 'Forest',                       group: 'Level BG'      },
  { key: 'dungeon_bg',             name: 'Dungeon',                      group: 'Level BG'      },
  { key: 'kitchen_bg',             name: 'Kitchen',                      group: 'Level BG'      },
  { key: 'ss_sky',                 name: 'Skeleton Sky',                 group: 'Level BG'      },
  { key: 'ss_ruins',               name: 'Skeleton Ruins',               group: 'Level BG'      },
  { key: 'ss_battlefield',         name: 'Skeleton Battlefield',         group: 'Level BG'      },
  // World Tilesets — pre-loaded by PreloadScene
  { key: 'world1-tileset',         name: 'World 1 — Grassy Plains',      group: 'World Tileset' },
  { key: 'world2-tileset',         name: 'World 2 — Shadowed Fen',       group: 'World Tileset' },
  { key: 'world3-tileset',         name: 'World 3 — Ember Peaks',        group: 'World Tileset' },
  { key: 'world4-tileset',         name: 'World 4 — Shrouded Wilds',     group: 'World Tileset' },
  { key: 'world5-tileset',         name: "World 5 — Typemancer's Tower", group: 'World Tileset' },
  // Boss BG — drawn directly to scene (not pre-stored textures); rendered live in modal
  { key: 'bg_slime_cave',          name: 'Slime Cave',                   group: 'Boss BG'       },
  { key: 'bg_swamp',               name: 'Swamp',                        group: 'Boss BG'       },
  { key: 'bg_web_cavern',          name: 'Web Cavern',                   group: 'Boss BG'       },
  { key: 'bg_crypt',               name: 'Crypt',                        group: 'Boss BG'       },
  { key: 'bg_castle_throne_room',  name: 'Castle Throne Room',           group: 'Boss BG'       },
  { key: 'bg_ethereal_void',       name: 'Ethereal Void',                group: 'Boss BG'       },
  { key: 'bg_volcanic_lair',       name: 'Volcanic Lair',                group: 'Boss BG'       },
  { key: 'bg_steampunk_workshop',  name: 'Steampunk Workshop',           group: 'Boss BG'       },
  { key: 'bg_graveyard',           name: 'Graveyard',                    group: 'Boss BG'       },
  { key: 'bg_dark_forest',         name: 'Dark Forest',                  group: 'Boss BG'       },
  { key: 'bg_digital_void',        name: 'Digital Void',                 group: 'Boss BG'       },
]

export function filterEntries<T extends GalleryEntry>(entries: T[], filter: string): T[] {
  if (filter === 'All') return entries
  return entries.filter(e => e.group === filter)
}
