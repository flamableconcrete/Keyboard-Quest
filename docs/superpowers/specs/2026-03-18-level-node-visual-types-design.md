# Level Node Visual Types — Design Spec

**Date:** 2026-03-18

## Overview

All regular level nodes on the overland map currently look identical. This change makes each level type visually distinct by generating a unique 32×32 pixel-art node texture per level type at runtime. Two stale level types (CharacterCreator, SillyChallenge) are also cleaned up as part of this work.

---

## Scope

### 1. SillyChallenge Cleanup
- Find all `LevelConfig` entries with `type: 'SillyChallenge'` across `src/data/levels/world*.ts` and change them to `type: 'CrazedCook'`
- Remove `'SillyChallenge'` from the `LevelType` union in `src/types/index.ts`
- Remove the `LevelScene` dispatch case for `SillyChallenge`
- Delete `src/scenes/level-types/SillyChallengeLevel.ts`

### 2. CharacterCreator Cleanup
- Remove `'CharacterCreator'` from the `LevelType` union in `src/types/index.ts`
- Remove the `LevelScene` dispatch case for `CharacterCreator`
- The `CharacterCreatorLevel` scene remains — it is invoked directly (not via `LevelScene`) during new-game flow

### 3. Level Node Texture Generation
- New file: `src/utils/levelNodeTextures.ts`
- Exports one function: `generateLevelNodeTextures(scene: Phaser.Scene): void`
- Called once in `PreloadScene.create()` after Phaser is ready
- Creates one 32×32 `RenderTexture` per level type using Phaser Graphics
- Each texture is stored under a unique key: `node_<LevelType>` (e.g. `node_GoblinWhacker`)

### 4. OverlandMapScene Integration
- `drawNodes` adds a helper `levelNodeTextureKey(level: LevelConfig): string`
  - Mini-boss → continues using `map-common` spritesheet frame `nodeMiniBoss`
  - Boss → continues using `map-common` spritesheet frame `nodeBoss`
  - Regular level → returns `node_${level.type}`
- The `this.add.sprite(...)` call for regular levels switches from the `map-common` spritesheet to the generated texture key

---

## Icon Designs

All icons are 32×32 pixels. Each has a solid colored background circle (radius 15) and a geometric pixel-art symbol drawn on top in lighter/contrasting colors.

| Level Type | Background Color | Symbol |
|---|---|---|
| GoblinWhacker | `#4a8c3f` (green) | Pixel goblin: round head, pointy ears, beady eyes, small body |
| SkeletonSwarm | `#5a5a6a` (grey) | Full skeleton: skull, ribcage, limb lines |
| MonsterArena | `#8c3a3a` (red) | Pixel minotaur: horned head, broad shoulders |
| UndeadSiege | `#4a2a6a` (dark purple) | Castle battlement silhouette with small zombie figures at base |
| SlimeSplitting | `#2a7a6a` (teal) | Round slime blob with eyes |
| DungeonTrapDisarm | `#8c5a1a` (orange) | Floor spike trap: row of upward triangles |
| DungeonPlatformer | `#5a4a2a` (brown) | Rolling boulder: circle with shading lines |
| DungeonEscape | `#6a2a2a` (dark red) | Stone archway with arrow pointing right |
| PotionBrewingLab | `#5a2a8c` (purple) | Potion bottle: round body, narrow neck, cork, colored fill |
| MagicRuneTyping | `#2a4a8c` (blue) | Two or three dwarf rune glyphs |
| MonsterManual | `#2a3a6a` (navy) | Open book: two pages, visible text lines |
| GuildRecruitment | `#8c6a1a` (gold) | Friendly NPC: simple person with wave gesture |
| WoodlandFestival | `#2a6a2a` (forest green) | Ferris wheel with tiny mice at the seats |
| CrazedCook | `#8c4a1a` (warm orange) | Chef figure with chef's hat and kitchen knife |

---

## File Changes Summary

| File | Change |
|---|---|
| `src/types/index.ts` | Remove `'SillyChallenge'` and `'CharacterCreator'` from `LevelType` |
| `src/data/levels/world*.ts` | Convert any `SillyChallenge` entries to `CrazedCook` |
| `src/scenes/LevelScene.ts` | Remove dispatch cases for `SillyChallenge` and `CharacterCreator` |
| `src/scenes/level-types/SillyChallengeLevel.ts` | Delete |
| `src/scenes/OverlandMapScene.ts` | Add `levelNodeTextureKey` helper; use generated textures for regular nodes |
| `src/scenes/PreloadScene.ts` | Call `generateLevelNodeTextures(this)` in `create()` |
| `src/utils/levelNodeTextures.ts` | New file — all icon drawing logic |

---

## Constraints

- Icons must be legible at 1.5× scale (48×48 rendered px for regular nodes)
- No changes to `assets/maps/common.png` or `COMMON_FRAMES`
- Boss and mini-boss nodes are unchanged
- Mobile overland map (`MobileOverlandMapScene`) should also benefit — check if it calls the same `drawNodes` logic or needs a separate update
