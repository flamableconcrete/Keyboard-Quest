# Keyboard Quest — Game Design Document

**Date:** 2026-03-07
**Target audience:** 9-year-old beginner typists
**Platform:** Web browser (TypeScript + Phaser 3 + Vite)
**Save system:** localStorage with export/import support

---

## 1. Concept

Keyboard Quest is a fantasy RPG typing game that teaches a child to type through progressive skill-gating, narrative reward, and varied gameplay. The core loop: type words to take actions in the game world. As the player improves, more letters are unlocked, more words become available, and the story unfolds.

---

## 2. Story — The Curse of the Typemancer

The Typemancer, an ancient and bitter wizard, has shattered the Sacred Scroll of Words — the source of all language and power in the realm. His lieutenants have each stolen a letter and cursed it. Villages can't speak, spells fail mid-cast, warriors forget their battle cries.

The player is a young scribe-knight chosen by the last working quill in the realm. To defeat the Typemancer, they must hunt down each cursed letter-keeper, restore the alphabet one letter at a time, and ultimately face the Typemancer himself in a battle of sentences.

---

## 3. World Structure

Five themed worlds, each with 8-12 levels, a midpoint mini-boss, and a world-ending boss. Each mini-boss is a letter-thief — defeating them restores one letter to the word pool.

| World | Theme |
|---|---|
| 1 — The Heartland | Cozy villages, farmlands, forest paths |
| 2 — The Wizard Peaks | Arcane towers, spell labs, potion markets |
| 3 — The Sunken Crypts | Dungeons, undead armies, pirate coves |
| 4 — The Redwall Reaches | Animal kingdoms, forest feasts, festivals |
| 5 — The Typemancer's Citadel | Dark fortress, sentence trials, final gauntlet |

Completing World 5 and defeating the Typemancer triggers the "You Won!" victory screen.

---

## 4. Letter Unlock Sequence

**Starting letters (home row):** `a s d f j k l`

Letters are unlocked one at a time by defeating mini-bosses. Each unlock is celebrated with a brief cutscene — the cursed letter glows back into existence.

| World | Mini-boss # | Letter | Notable new words |
|---|---|---|---|
| 1 | 1 | **e** | lake, safe, desk, jade, flake, sealed |
| 1 | 2 | **n** | sand, land, snake, dense, naked |
| 1 | 3 | **r** | dare, read, learn, snare, dread |
| 1 | 4 | **o** | load, road, lore, drone, folder |
| 2 | 5 | **t** | trade, toast, talent, tender |
| 2 | 6 | **i** | find, ride, drink, tired, kind |
| 2 | 7 | **h** | share, heart, throne, shine |
| 2 | 8 | **c** | crest, torch, castle, enchant |
| 3 | 9 | **u** | shout, thunder, crust, ruin |
| 3 | 10 | **m** | mouse, armor, storm |
| 3 | 11 | **g** | ghost, dungeon, guard, grim |
| 3 | 12 | **w** | sword, wrath, warrior |
| 4 | 13 | **b** | battle, badger, burrow |
| 4 | 14 | **p** | path, patrol, pounce, power |
| 4 | 15 | **y** | journey, glory, mystery |
| 4 | 16 | **v** | village, victory, brave, voyage |
| 5 | 17 | **x** | text, expel, vex |
| 5 | 18 | **z** | zeal, zone, blaze |
| 5 | 19 | **q** | quest, quill, quick |

The final boss introduces short sentences — the ultimate restoration of language.

---

## 5. Overland Map

Super Mario World-style node map. Nodes connect via paths that unlock as the player progresses.

**Node types:**

| Node | Purpose |
|---|---|
| Level node | Standard gameplay level |
| Mini-boss node | Gated by star threshold from preceding levels |
| Boss node | Gated by star threshold; ends the world |
| Tavern | View and select active companion from full roster |
| Stable | View and select active pet from full roster |

Each world has its own Tavern and Stable node. Both are always accessible while on the overland map.

**Entering a level:** Before every level, the player must type the level's name to enter it. Level names are short, themed, and constructed only from currently unlocked letters (e.g., "Fern Dale" in World 1). This serves as a warm-up and reinforces the "words have power" theme.

---

## 6. Core Typing Engine

- A word appears on screen
- Correct characters highlight green and advance the word
- Incorrect characters flash red and do nothing — the word does not advance
- No backspace — precision is the only path forward

---

## 7. Scoring

Each level awards two independent 1-5 star ratings:

| Rating | Metric |
|---|---|
| Speed Stars (1-5) | Words per minute |
| Accuracy Stars (1-5) | Correct keystrokes / total keystrokes |

Levels are pass/fail for completion — stars reflect quality of play. XP scales with total stars earned (max 10 per level). Replaying a level only awards XP for improvement over previous best.

**Boss and mini-boss gate:** A minimum combined star threshold must be met from preceding levels before a mini-boss or boss node unlocks. Shown clearly on the overland map.

---

## 8. Difficulty Scaling

- Word length increases through a level (short words early, longer words late)
- Word pool is always filtered to currently unlocked letters at runtime
- By World 5: 8-10 letter words and short sentences

**Tutorial scaffolding (World 1 only):**
- First level: animated hands show home row finger placement
- Each new letter unlock: cutscene shows which finger reaches that key
- Ghost keyboard highlights the next key to press — fades out after first 2 levels

---

## 9. Level Types

All types share the same core typing engine. Win/lose conditions vary.

### Combat

| Type | Win condition | Lose condition |
|---|---|---|
| Goblin Whacker | Type all goblins before time runs out | Too many goblins reach player |
| Skeleton Swarm | Survive waves | HP drops to zero |
| Monster Arena | Defeat all creatures | HP drops to zero |
| Undead Typing Siege | Defend castle through N waves | Castle HP drops to zero |
| Slime Splitting | Clear slimes before they merge | Too many merged slimes overwhelm player |

### Puzzle / Adventure

| Type | Win condition |
|---|---|
| Dungeon Trap Disarm | Type all trap words before countdown hits zero |
| Dungeon Escape | Type clues in sequence before dungeon collapses |
| Potion Brewing Lab | Type ingredients in correct order |
| Magic Rune Typing | Type rune sequences to activate portals |

### Story / Narrative

| Type | Purpose |
|---|---|
| Monster Manual | Type creature descriptions before a boss — reveals boss weaknesses |
| Guild Recruitment Letter | Type a letter to recruit a companion (at Tavern nodes) |
| Typing Character Creator | Opening level — type to name and build your hero |
| Woodland Festival Games | Fun filler; XP reward, no star pressure |

### Silly (comic relief)

Exploding Cheese Challenge, Dragon Sneezing Contest, Slime Dance Typing, Ogre Cooking Show — absurd animations, sound effects, XP reward, no star pressure. Scattered as palette cleansers before heavy boss worlds.

### Boss Battles

Multi-phase encounters with unique mechanics per boss:

| Boss | Mechanic |
|---|---|
| Grizzlefang the Keyboard Ogre | Type words on armor plates to shatter them; phases get faster |
| The Hydra of Many Words | Each head has a word; type slowly and heads regrow |
| Baron Typo the Trickster Goblin | Words appear scrambled — type the correct version |
| The Slime King | Giant slime splits into smaller slimes with shorter words |
| The Clockwork Dragon | Type words to jam spinning gears; gears spin faster as HP drops |
| The Spider of a Thousand Letters | Type letters in correct order to cut the web |
| Captain Tramun Clogg | Words flash briefly — type before they disappear |
| Badrang the Tyrant Stoat | Words flash briefly — type before they disappear |
| The Bone Knight | Summons shields of long words; break with accuracy streaks |
| The Maze Minotaur | Type door words to escape while Minotaur chases (mini-boss) |
| The Dice Lich | Rolls dice that generate random words |
| The Ancient Dragon of Sentences | Type full short sentences to avoid attacks |
| The Typemancer (final boss) | Full alphabet + sentences; multi-phase climactic battle |

---

## 10. Companions & Pets

### Acquiring

| Type | How |
|---|---|
| Companions | Visit Tavern node on overland map; type a recruitment pitch to hire |
| Pets | After eligible combat levels, a 20% capture roll triggers automatically |

Capture attempts are unannounced before the level — the result screen reveals success or escape. Not every level has a capture attempt.

### In Battle

- Player has 1 active companion slot and 1 active pet slot
- Both are selected from full rosters in the Tavern / Stable before entering a level
- Each auto-strikes (destroys) a dangerous word/monster before it can damage the player
- Fully levelled companions/pets auto-strike up to 3 times per level

### Leveling

- Companions and pets earn XP each battle they participate in
- On level-up, auto-strike count increases by 1 (max 3)

### Roster Screens

- **Tavern:** Browse all unlocked companions — name, backstory, current level, XP progress, auto-strike count. Select active companion.
- **Stable:** Same for pets.

---

## 11. RPG Progression

### Character Levels

- XP from every level, scaled by stars and first-time bonuses
- Levels 1-50 across the full game
- Each level-up grants a stat point: HP (survive more hits), Power (words deal more damage), Focus (accuracy thresholds slightly easier)

### Equipment

| Slot | Examples | Effect |
|---|---|---|
| Weapon | Rusty Quill, Silver Blade, Typemancer's Edge | Damage per word typed |
| Armor | Cloth Robe, Chain Mail, Rune Plate | HP and damage reduction |
| Accessory | Focus Ring, Speed Boots, Lucky Charm | Accuracy, WPM, capture chance |

Dropped from bosses, mini-bosses, and high-star completions.

### Spells

Unlocked at story milestones and from boss drops. One use per level. Cast by typing the spell name.

| Spell | Effect |
|---|---|
| Time Freeze | Pauses all enemies for 5 seconds |
| Word Blast | Clears nearest monster instantly |
| Second Chance | Restores HP mid-level |
| Letter Shield | Next 3 wrong keypresses don't affect accuracy |

### Long-Term Rewards

| Milestone | Reward |
|---|---|
| Complete a world | Unique title displayed on profile |
| 3-star all levels in a world | Rare equipment piece |
| Capture 10 pets | "Beast Tamer" achievement + bonus accessory slot |
| Defeat every boss without companions | "Solo Scribe" title |

---

## 12. Save System & Profiles

### Profiles

- Main menu shows up to 4 profile slots (name, avatar, current world/level)
- Creating a profile: player types their name (first typing interaction)
- Each profile is fully independent

### Save Data Structure

```json
{
  "playerName": "",
  "avatarChoice": "",
  "characterLevel": 1,
  "xp": 0,
  "statPoints": 0,
  "currentWorld": 1,
  "currentLevel": "",
  "unlockedLetters": ["a","s","d","f","j","k","l"],
  "unlockedLevels": [],
  "levelResults": {},
  "equipment": { "weapon": null, "armor": null, "accessory": null },
  "spells": [],
  "companions": [],
  "pets": [],
  "activeCompanionId": null,
  "activePetId": null,
  "titles": []
}
```

Stored in localStorage keyed by profile slot (e.g., `kq_profile_0`). Auto-saves after every level result, equipment change, and companion/pet change.

### Export & Import

- **Export:** Downloads profile JSON as a `.kq` file from the profile select screen
- **Import:** Upload a `.kq` file to load into any profile slot (empty or overwrite)
- Enables saves to move between browsers and devices

---

## 13. Tech Stack

| Tool | Purpose |
|---|---|
| Phaser 3 | Game engine — rendering, input, audio, scenes, sprites |
| TypeScript | All game logic |
| Vite | Dev server and production build |
| localStorage | Profile and save data |

### Scene List

- `Boot` — initial load
- `Preload` — asset loading
- `MainMenu` — title screen
- `ProfileSelect` — profile slots, export/import
- `OverlandMap` — world navigation
- `LevelIntro` — type the level name to enter
- `Level` — gameplay (type determined by level config JSON)
- `BossBattle` — boss-specific scene
- `LevelResult` — stars, XP, capture attempt result
- `Cutscene` — story beats, letter unlock animations
- `Tavern` — companion roster and selection
- `Stable` — pet roster and selection
- `Inventory` — equipment and spells
- `VictoryScreen` — end game celebration

### Level Config Format

```json
{
  "id": "w1_l3",
  "name": "Fern Dale",
  "type": "GoblinWhacker",
  "world": 1,
  "unlockedLetters": ["a","s","d","f","j","k","l","e","n"],
  "wordCount": 20,
  "timeLimit": 90,
  "storyBeat": "You find a warning scratched in bark...",
  "rewards": { "xp": 150, "item": "leather_gloves" },
  "captureEligible": true,
  "bossGate": null
}
```

Word pool is filtered at runtime to only include words constructable from `unlockedLetters`.
