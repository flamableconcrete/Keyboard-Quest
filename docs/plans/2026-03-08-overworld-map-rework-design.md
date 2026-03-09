# Overworld Map Rework Design

## Overview
Transform the current abstract, geometry-based `OverlandMapScene` into a "Full Tilemap RPG" experience. This will include replacing basic shape graphics with 2D sprite assets, adding a tilemap background for each world, and introducing a gliding player avatar that traverses the map paths.

## 1. Visuals, Assets & Tilemap Integration
- **Assets:** Source an open-source 16x16 or 32x32 fantasy tilepack (e.g., Kenney's Tiny Town or similar). We will need generic tilemap backgrounds for each world type (Forest, Swamp, Lava, etc.) and specific sprites for levels (Castles, Caves, Tents) and the Player Avatar.
- **Tilemap Data:** Create simple JSON/CSV maps for the 5 worlds using the tileset to replace the flat `WORLD_BG_COLORS`.
- **Preloading:** Update `PreloadScene.ts` to load the new tileset image, the player sprite, the node sprites, and the 5 world map JSON files.

## 2. Layout & Navigation Logic
- **Node Placements:** Retain the existing `NODE_LAYOUT` coordinates (designed for the 1280x720 canvas). Replace `add.circle` with `add.sprite` (using appropriate frames for standard levels, minibosses, and bosses).
- **Paths:** Draw paths using `add.graphics` or a repeated 'dirt path' tile layered over the background tilemap to connect the sprites.
- **Gliding Avatar:** Add a player avatar sprite starting at the current node's coordinate. When a new unlocked node is clicked, execute a Phaser Tween (`this.tweens.add()`) to smoothly glide the avatar to the target coordinates. The scene transition (LevelIntro) triggers *after* the tween completes.

## 3. Integration & State Management
- **Current Node Memory:** Track the player's avatar position so it knows where to glide from. Add `currentLevelNodeId` (or similar) to `ProfileData` (in `src/types/index.ts`) so when returning from a level, the avatar spawns at the correct node.
- **State Cleanup:** Remove the old colored rectangle backgrounds (`add.rectangle`) and old circle shapes (`add.circle`), ensuring proper cleanup of interactions to avoid memory leaks. Update Special Nodes (Tavern, Stable, Items) with sprites instead of colored rectangles.
- **UI Overlay:** Keep the current Text elements (player info, gold, world title, and Settings), but ensure they are raised to the top depth (`setDepth(10)`) so the new sprites and tilemap render underneath them.
