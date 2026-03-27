# Boss Level Names + Letter-Unlock Tooltip — Design

**Date:** 2026-03-27

## Overview

Two small improvements to boss/mini-boss level presentation:
1. All boss level `name` fields renamed to possessive format incorporating the boss's name.
2. OverlandMapScene hover tooltip shows the letter unlocked by a boss/mini-boss level.

---

## Part 1: Level Name Renames

### Approach

Possessive rename: `"BossShortName's [LocationNoun]"`. Keep the original location noun when it fits thematically; coin a new one only if the original is too generic or awkward. Use the boss's short name (not full title) as the possessor.

### Rename Table

| ID | Current Name | Boss | New Name |
|----|--------------|------|----------|
| w1_mb1 | Grom's Thicket | Knuckle, Keeper of E | Knuckle's Thicket |
| w1_mb2 | Serpent's Coil | Nessa, Keeper of N | Nessa's Coil |
| w1_mb3 | Shadowfall Crag | Rend the Red | Rend's Crag |
| w1_boss | Grizzlefang's Den | Grizzlefang the Ogre | *(unchanged — already possessive)* |
| w2_mb1 | Bramblegate Watch | Baron Typo | Typo's Watch |
| w2_mb2 | Ironweb Keep | Broodmother Arachna | Arachna's Keep |
| w2_mb3 | Hollowhorn Peak | The Flashword Apparition | Flashword's Peak |
| w2_mb4 | Frostbite Hollow | Sir Rattles, Bone Knight | Rattles' Hollow |
| w2_boss | Lair of the Deep Fen Hydra | Tiamat, the Lexicon Hydra | Tiamat's Lair |
| w3_mb1 | Obsidian Gate | The Dice Lich | Lich's Gate |
| w3_mb2 | Spire of the Phoenix | Ignis, Ancient Dragon | Ignis' Spire |
| w3_mb3 | The Umber Bridge | Grizzlefang, Resurrected | Grizzlefang's Bridge |
| w3_mb4 | The Gorgon's Pit | King Sludge, Royal Ooze | Sludge's Pit |
| w3_boss | The Brass Citadel | Mecha-Wyrm Alpha | Mecha-Wyrm's Citadel |
| w4_mb1 | Troll's Toll Bridge | Sir Rattles, Bone Knight | Rattles' Bridge |
| w4_mb2 | Keep of the Wraith-Witch | The Flashword Apparition | Flashword's Keep |
| w4_mb3 | Frosthowl Summit | Broodmother Arachna | Arachna's Summit |
| w4_mb4 | Vault of the Ancients | Baron Typo | Typo's Vault |
| w4_boss | Sanctum of the Dice Lich | The Dice Lich | *(unchanged — already uses boss name)* |
| w5_mb1 | Chamber of the Quillmaster | Ignis, Ancient Dragon | Ignis' Chamber |
| w5_mb2 | Spire of the Hexed Exile | The Dice Lich | Lich's Spire |
| w5_mb3 | Zealot's Ascent | Grizzlefang, Undying | Grizzlefang's Ascent |
| w5_mb4 | Hall of Illusions | Broodmother Arachna | Arachna's Hall |
| w5_boss | Throne of the Typemancer | The Typemancer | *(unchanged — already uses boss name)* |

### Files Changed

- `src/data/levels/world1.ts` — 3 renames
- `src/data/levels/world2.ts` — 5 renames
- `src/data/levels/world3.ts` — 5 renames
- `src/data/levels/world4.ts` — 4 renames
- `src/data/levels/world5.ts` — 4 renames

---

## Part 2: Letter-Unlock Tooltip

### Approach

Modify `showNodeTooltip` in `OverlandMapScene.ts`. After building the label string, check `level.miniBossUnlocksLetter` and append `\nUnlocks letter: ${letter.toUpperCase()}` to the tooltip text. No new objects needed — uses the existing `this.tooltipText` text object.

### Affected File

- `src/scenes/OverlandMapScene.ts` — `showNodeTooltip` method (~line 530)

### Behaviour

- Only boss/mini-boss levels have `miniBossUnlocksLetter` set; regular levels do not — tooltip shows no letter line for those.
- Letter displayed in uppercase for readability (stored lowercase in data).

---

## Out of Scope

- No changes to `bossName`, `bossId`, `miniBossUnlocksLetter`, or any other level fields.
- No tooltip styling changes beyond adding the second line of text.
