# Level Names Renaming Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename all the levels in the game across Worlds 1-5 to follow the approved Classic Heroic Fantasy theme, while retaining "Grizzlefang's Den" for the World 1 Boss.

**Architecture:** The level configurations are defined in static TypeScript arrays. The tasks will involve finding the `name` properties within the `LevelConfig` objects in `src/data/levels/worldX.ts` files and updating them via exact string replacement. No new architecture or tests are needed for content updates, but `npm run build` must be used to ensure type checking passes.

**Tech Stack:** TypeScript, Vite

---

### Task 1: Update World 1 Level Names

**Files:**
- Modify: `src/data/levels/world1.ts`

**Step 1: Replace names via exact string match**
Replace the old names with the new names:
- Alder Falls -> Oakhaven Outskirts
- Fald Dask -> Riverbend Village
- Salk Lass -> The Stolen Trails
- Flask Hollow -> Grom's Thicket
- Fern Dale -> Sunlit Glade
- Lake Elda -> The Lost Ruins of Elda
- Snake Fens -> Serpent's Coil
- Sandrel Lane -> The Crazed Cook's Camp
- Snare Knell -> Whispering Pass
- Dread Fells -> Shadowfall Crag
- Fords Lore -> The Scholar's Hermitage
*(Grizzlefang's Den remains unchanged)*

**Step 2: Run build to verify type checking**
Run: `npm run build`
Expected: Successful build with no errors.

**Step 3: Commit**
```bash
git add src/data/levels/world1.ts
git commit -m "chore: rename world 1 levels to heroic fantasy theme"
```

---

### Task 2: Update World 2 Level Names

**Files:**
- Modify: `src/data/levels/world2.ts`

**Step 1: Replace names via exact string match**
Replace the old names with the new names:
- Rondel Shore -> Mistweaver Shore
- Dorn Flats -> The Proving Grounds
- Redfen Road -> Bloodmoss Path
- Tangle Gate -> Bramblegate Watch
- Trent Dale -> Elderwood Thicket
- Ferntide Fen -> The Sludge Pools
- Stone Shelf -> Dwarven Depths
- Ironsnare Keep -> Ironweb Keep
- Thistle Path -> Rune-Scarred Path
- Heronshire -> Haven of the Silver Arrow
- Hollowhorn Ridge -> Hollowhorn Peak
- Lichen Croft -> The Alchemist's Grotto
- Corsen Reach -> The Ranger's Outpost
- Coldcroft Hollow -> Frostbite Hollow
- The Hydra of the Deep Fen -> Lair of the Deep Fen Hydra

**Step 2: Run build to verify type checking**
Run: `npm run build`
Expected: Successful build with no errors.

**Step 3: Commit**
```bash
git add src/data/levels/world2.ts
git commit -m "chore: rename world 2 levels to heroic fantasy theme"
```

---

### Task 3: Update World 3 Level Names

**Files:**
- Modify: `src/data/levels/world3.ts`

**Step 1: Replace names via exact string match**
Replace the old names with the new names:
- Molten Reach -> Emberfall Ascent
- Cinderholt -> Ashwood Cemetery
- Scalethorn Crossing -> Dragon's Tooth Tunnels
- Molaris Gate -> Obsidian Gate
- Pumice Mesa -> The Scorched Arena
- Thermal Spires -> Pillars of Flame
- Pyrethis Spire -> Spire of the Phoenix
- Upper Crucible -> The Grand Crucible
- Eruption Road -> Magma Vents
- Umber Crossing -> The Umber Bridge
- Grim Forge -> Festival of the Fire-Smiths
- Grudge Summit -> The Drake-Scholar's Rest
- Gorgrath Pit -> The Gorgon's Pit
- The Clockwork Dragon -> The Brass Citadel

**Step 2: Run build to verify type checking**
Run: `npm run build`
Expected: Successful build with no errors.

**Step 3: Commit**
```bash
git add src/data/levels/world3.ts
git commit -m "chore: rename world 3 levels to heroic fantasy theme"
```

---

### Task 4: Update World 4 Level Names

**Files:**
- Modify: `src/data/levels/world4.ts`

**Step 1: Replace names via exact string match**
Replace the old names with the new names:
- Briarwood -> Twilight Thicket
- Murkmere -> The Drowned Moor
- Thorngate Pass -> Forgotten Stone Pass
- Blackfen Bridge -> Troll's Toll Bridge
- Wychwood -> The Weeping Woods
- Barrow Downs -> Ancestral Barrows
- Witherwood Keep -> Keep of the Wraith-Witch
- Yewmere Crossing -> Venomous Shallows
- Yeldrith Valley -> The Jester's Glade
- Yore Heights -> Frosthowl Summit
- Veldt Ruins -> Ruins of the Old Kingdom
- Vex Hollow -> Shadow-Warden's Trap
- Virelith Vault -> Vault of the Ancients
- The Dice Lich -> Sanctum of the Dice Lich

**Step 2: Run build to verify type checking**
Run: `npm run build`
Expected: Successful build with no errors.

**Step 3: Commit**
```bash
git add src/data/levels/world4.ts
git commit -m "chore: rename world 4 levels to heroic fantasy theme"
```

---

### Task 5: Update World 5 Level Names

**Files:**
- Modify: `src/data/levels/world5.ts`

**Step 1: Replace names via exact string match**
Replace the old names with the new names:
- The Broken Quill -> Gates of the Maelstrom
- Cipher Maze -> The Shifting Labyrinth
- Scroll Library -> Archives of Eternity
- Quillmere Chamber -> Chamber of the Quillmaster
- Hex Forge -> The Enchanted Forges
- Xeric Flats -> The Desolate Courtyard
- Xylem Spire -> Spire of the Hexed Exile
- Zenith Atrium -> The Mad King's Court
- Zephyr Court -> Prison of the Wind Faeries
- Zealot's Peak -> Zealot's Ascent
- The Final Ascent -> The Crumbling Stairway
- The Jester's Gauntlet -> Hall of Illusions
- The Typemancer -> Throne of the Typemancer

**Step 2: Run build to verify type checking**
Run: `npm run build`
Expected: Successful build with no errors.

**Step 3: Commit**
```bash
git add src/data/levels/world5.ts
git commit -m "chore: rename world 5 levels to heroic fantasy theme"
```
