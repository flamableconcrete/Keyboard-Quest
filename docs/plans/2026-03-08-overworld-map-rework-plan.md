# Overworld Map Rework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the abstract `OverlandMapScene` into a "Full Tilemap RPG" map with a tile-based background, sprite-based nodes, and a gliding player avatar.

**Architecture:** Use Phaser's built-in texture generation (or simple base64) to create a tilemap and sprites dynamically in `PreloadScene.ts`. Update `ProfileData` to track the player's map position. Refactor `OverlandMapScene.ts` to load the tilemap, replace `add.circle` with `add.sprite`, and use `this.tweens.add` for the avatar glide animation.

**Tech Stack:** Phaser 3, TypeScript

---

### Task 1: Generate Map Assets in PreloadScene

**Files:**
- Modify: `src/scenes/PreloadScene.ts`

**Step 1: Write asset generation logic**
Modify `PreloadScene.preload()` to generate simple textures for tiles (grass, dirt path, water) and sprites (avatar, castle node, cave node, boss node) using `this.add.graphics()` and `generateTexture()`.

**Step 2: Run dev server to verify**
Run: `npm run dev`
Expected: No compile errors.

**Step 3: Commit**
```bash
git add src/scenes/PreloadScene.ts
git commit -m "feat: generate map tile and sprite textures in PreloadScene"
```

---

### Task 2: Update ProfileData to track Map Position

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/utils/profile.ts`

**Step 1: Add `currentLevelNodeId` type**
In `src/types/index.ts`, add `currentLevelNodeId?: string` to `ProfileData`.

**Step 2: Initialize default value**
In `src/utils/profile.ts`, update `createProfile` to set `currentLevelNodeId: undefined` or default to the first level.

**Step 3: Run type check to verify**
Run: `npm run build`
Expected: Passes type checking.

**Step 4: Commit**
```bash
git add src/types/index.ts src/utils/profile.ts
git commit -m "feat: add currentLevelNodeId to ProfileData"
```

---

### Task 3: Implement Tilemap Background

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

**Step 1: Create procedural tilemap**
In `OverlandMapScene.create()`, replace the `add.rectangle` background with a generated Tilemap. We can create an empty tilemap `this.make.tilemap({ tileWidth: 32, tileHeight: 32, width: 40, height: 23 })`, add the generated tileset, and fill it with basic grass/dirt tiles.

**Step 2: Run to verify**
Run: `npm run dev`
Expected: Map scene loads with a tiled background instead of a solid color.

**Step 3: Commit**
```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: add tilemap background to OverlandMapScene"
```

---

### Task 4: Implement Sprite Nodes and Paths

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

**Step 1: Replace circles with sprites**
In `drawNodes()`, replace `this.add.circle()` with `this.add.sprite(pos.x, pos.y, 'map-sprites', frame)`.
Update special nodes (Tavern, etc.) to use sprites. Raise UI text depth `setDepth(10)`.

**Step 2: Run to verify**
Run: `npm run dev`
Expected: Nodes are now rendered as sprites instead of basic shapes.

**Step 3: Commit**
```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: convert map nodes to sprites"
```

---

### Task 5: Implement Gliding Avatar

**Files:**
- Modify: `src/scenes/OverlandMapScene.ts`

**Step 1: Add avatar and tween logic**
Add an avatar sprite at the coordinates of `this.profile.currentLevelNodeId` (or the first node).
In `enterLevel()`, instead of immediately starting `LevelIntro`, start a tween moving the avatar to the target node. Save the `currentLevelNodeId` to profile, then start `LevelIntro` `onComplete`.

**Step 2: Run to verify**
Run: `npm run dev`
Expected: Clicking a node smoothly glides the avatar to it before transitioning scenes.

**Step 3: Commit**
```bash
git add src/scenes/OverlandMapScene.ts
git commit -m "feat: add gliding avatar to map navigation"
```
