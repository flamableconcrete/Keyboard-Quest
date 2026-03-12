# Dungeon Platformer Level Design

## Summary

Replace the DungeonTrapDisarm gameplay for "The Lost Ruins of Elda" (w1_l5) with a side-scrolling platformer style. Instead of traps spawning randomly on screen, the hero auto-walks left-to-right through a dungeon, encountering obstacles one at a time. Typing a word clears each obstacle.

## Core Loop

1. Dungeon background scrolls left (parallax stone walls)
2. Hero sprite sits at ~x=200, animating a walk cycle
3. Obstacle scrolls in from the right, stops near the hero
4. Hero stops walking, word appears above the obstacle
5. Player types the word -> obstacle clears with animation (jump, duck, unlock, leap)
6. Hero resumes walking, next obstacle scrolls in (fast tween, minimal downtime)
7. After all `wordCount` obstacles cleared -> level complete

## Approach

New level type `DungeonPlatformer` with its own scene. The old `DungeonTrapDisarm` type/scene is preserved for potential reuse elsewhere.

## Obstacle Types (4, purely cosmetic variety)

| Type     | Visual                          | Clear Animation                    |
|----------|---------------------------------|------------------------------------|
| pit      | Gap in the floor with darkness  | Hero jumps in an arc over it       |
| spikes   | Floor spikes jutting up         | Hero leaps over them               |
| boulder  | Rock sitting in path            | Hero ducks, boulder passes overhead|
| door     | Locked stone door               | Door slides up, hero walks through |

Obstacles are randomly assigned. All mechanically identical.

## Difficulty Modes

- **Regular** (world 1-2): Wrong keys flash red, no penalty. No per-obstacle timer.
- **Advanced** (world 3+): Wrong keys deal 1 HP damage, obstacle auto-clears with hit animation. 3 HP hearts.

Overall level timer (`timeLimit`) still applies.

## Visual Layout

```
[Hearts HUD]          [Level Name]          [Timer]

 scrolling stone wall background

    hero sprite    [WORD above obstacle]
  ████████████  ▼▼▼▼▼  ████████████████████
  ████████████         ████████████████████
  (floor)      (pit)   (floor continues)

              [typing engine]
```

- Background: Tiled/scrolled dungeon_bg
- Floor: Continuous stone floor strip with gaps/obstacles
- Hero: Player's avatar texture at ~x=200
- Companions near hero (CompanionAndPetRenderer)
- Reuse heart HUD, timer, vignette, dust particles from existing dungeon art

## New Art (`dungeonPlatformerArt.ts`)

- `platform_floor` — tileable stone floor segment
- `obstacle_pit` — dark gap texture
- `obstacle_spikes` — floor spike texture
- `obstacle_boulder` — boulder texture
- `obstacle_door` — locked stone door texture

Reuse from `dungeonTrapArt.ts`: `heart_full`, `heart_empty`, `dust_particle`, `dungeon_bg`

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `'DungeonPlatformer'` to `LevelType` union |
| `src/scenes/level-types/DungeonPlatformerLevel.ts` | **New** — full scene |
| `src/art/dungeonPlatformerArt.ts` | **New** — obstacle/floor textures |
| `src/main.ts` | Register `DungeonPlatformerLevel` scene |
| `src/scenes/LevelScene.ts` | Add type->scene mapping |
| `src/data/levels/world1.ts` | Change `w1_l5` type to `'DungeonPlatformer'` |
