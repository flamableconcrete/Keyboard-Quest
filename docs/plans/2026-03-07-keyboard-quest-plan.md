# Keyboard Quest Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fantasy RPG typing game that teaches children to type through progressive letter-gating, varied level types, and long-term RPG progression.

**Architecture:** Phaser 3 scenes drive all game states; a data-driven JSON level config system determines level type and word pool at runtime; all save data lives in localStorage as JSON blobs keyed by profile slot.

**Tech Stack:** TypeScript, Phaser 3, Vite, Vitest (unit tests on pure logic only — Phaser scenes are tested manually by running the game)

**Design doc:** `docs/plans/2026-03-07-keyboard-quest-design.md`

---

## Phase 1: Project Foundation

### Task 1: Scaffold project

**Files:**

- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.ts`

**Step 1: Initialize**

```bash
npm create vite@latest . -- --template vanilla-ts
npm install phaser
npm install -D vitest @vitest/ui
```

**Step 2: Update `vite.config.ts`**

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

**Step 3: Update `tsconfig.json` — add strict mode**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 4: Replace `src/main.ts`**

```ts
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [BootScene],
})
```

**Step 5: Create `src/scenes/BootScene.ts`**

```ts
import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }
  create() {
    this.add.text(100, 100, 'Keyboard Quest', { fontSize: '48px', color: '#ffffff' })
  }
}
```

**Step 6: Run and verify**

```bash
npm run dev
```

Expected: Browser shows "Keyboard Quest" text on dark background.

**Step 7: Add test script to `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "test": "vitest run",
  "test:ui": "vitest --ui"
}
```

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + Phaser 3 + TypeScript project"
```

---

### Task 2: TypeScript type definitions

**Files:**

- Create: `src/types/index.ts`

**Step 1: Write all shared types**

```ts
// src/types/index.ts

export type StarRating = 1 | 2 | 3 | 4 | 5

export interface LevelResult {
  accuracyStars: StarRating
  speedStars: StarRating
  completedAt: number
}

export interface CompanionData {
  id: string
  name: string
  backstory: string
  type: 'companion' | 'pet'
  level: number
  xp: number
  autoStrikeCount: number // 1-3
}

export interface EquipmentData {
  weapon: string | null
  armor: string | null
  accessory: string | null
}

export interface ProfileData {
  playerName: string
  avatarChoice: string
  characterLevel: number
  xp: number
  statPoints: number
  hpPoints: number
  powerPoints: number
  focusPoints: number
  currentWorld: number
  currentLevelId: string
  unlockedLetters: string[]
  unlockedLevelIds: string[]
  levelResults: Record<string, LevelResult>
  equipment: EquipmentData
  spells: string[]
  companions: CompanionData[]
  pets: CompanionData[]
  activeCompanionId: string | null
  activePetId: string | null
  titles: string[]
}

export type LevelType =
  | 'GoblinWhacker'
  | 'SkeletonSwarm'
  | 'MonsterArena'
  | 'UndeadSiege'
  | 'SlimeSplitting'
  | 'DungeonTrapDisarm'
  | 'DungeonEscape'
  | 'PotionBrewingLab'
  | 'MagicRuneTyping'
  | 'MonsterManual'
  | 'GuildRecruitment'
  | 'CharacterCreator'
  | 'WoodlandFestival'
  | 'SillyChallenge'
  | 'BossBattle'

export interface LevelConfig {
  id: string
  name: string
  type: LevelType
  world: number
  unlockedLetters: string[]
  wordCount: number
  timeLimit: number | null  // null = no time limit
  storyBeat: string
  rewards: {
    xp: number
    item?: string
    spell?: string
    companionId?: string
    title?: string
  }
  captureEligible: boolean
  bossGate: { minCombinedStars: number; levelIds: string[] } | null
  miniBossUnlocksLetter?: string  // if this is a mini-boss level
  isBoss?: boolean
  isMiniBoss?: boolean
  bossId?: string
  phases?: number
}

export interface ItemData {
  id: string
  name: string
  slot: 'weapon' | 'armor' | 'accessory'
  description: string
  effect: {
    hp?: number
    power?: number
    focusBonus?: number
    captureChanceBonus?: number
  }
}

export interface SpellData {
  id: string
  name: string
  description: string
  effect: 'time_freeze' | 'word_blast' | 'second_chance' | 'letter_shield'
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript type definitions"
```

---

### Task 3: Word bank and filtering utility

**Files:**

- Create: `src/data/wordBank.ts`
- Create: `src/utils/words.ts`
- Create: `src/utils/words.test.ts`

**Step 1: Write failing tests**

```ts
// src/utils/words.test.ts
import { describe, it, expect } from 'vitest'
import { filterWordsByLetters, pickWords, calculateWpm } from './words'

describe('filterWordsByLetters', () => {
  it('returns only words constructable from available letters', () => {
    const bank = ['ask', 'add', 'hello', 'fade', 'zone']
    const letters = ['a', 's', 'k', 'd']
    expect(filterWordsByLetters(bank, letters)).toEqual(['ask', 'add'])
  })

  it('returns empty array when no words match', () => {
    expect(filterWordsByLetters(['xyz'], ['a', 's', 'd'])).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(filterWordsByLetters(['ASK'], ['a', 's', 'k'])).toEqual(['ASK'])
  })
})

describe('pickWords', () => {
  it('returns requested count of words', () => {
    const pool = ['ask', 'sad', 'lad', 'fad', 'add', 'all']
    expect(pickWords(pool, 3, 1)).toHaveLength(3)
  })

  it('does not repeat words', () => {
    const pool = ['ask', 'sad', 'lad']
    const result = pickWords(pool, 3, 1)
    expect(new Set(result).size).toBe(3)
  })

  it('sorts shorter words first at difficulty 1', () => {
    const pool = ['flask', 'ask', 'lads', 'ad']
    const result = pickWords(pool, 4, 1)
    expect(result[0].length).toBeLessThanOrEqual(result[result.length - 1].length)
  })
})

describe('calculateWpm', () => {
  it('calculates WPM correctly', () => {
    // 10 words in 60 seconds = 10 WPM
    expect(calculateWpm(10, 60000)).toBe(10)
  })

  it('rounds to integer', () => {
    expect(typeof calculateWpm(7, 60000)).toBe('number')
  })
})
```

**Step 2: Run tests — expect FAIL**

```bash
npm test
```

**Step 3: Create word bank**

```ts
// src/data/wordBank.ts
// Curated word list filtered to fantasy-appropriate words only
// Organized loosely but filtered dynamically at runtime
export const WORD_BANK: string[] = [
  // 2-3 letter words (home row friendly)
  'ad', 'add', 'ads', 'ask', 'dad', 'dads', 'fad', 'fads', 'lad', 'lads',
  'sad', 'all', 'fall', 'falls', 'lass', 'flask', 'alas', 'dal',
  // 4-5 letter words
  'lake', 'safe', 'desk', 'jade', 'sale', 'fade', 'flake', 'snake',
  'sand', 'land', 'lane', 'sane', 'lean', 'leak', 'seal', 'deal',
  'dare', 'read', 'near', 'learn', 'snare', 'dread', 'elder',
  'load', 'road', 'lore', 'role', 'fold', 'ford', 'drone', 'snore',
  'trade', 'toast', 'tread', 'trend', 'loner', 'older', 'order',
  'find', 'ride', 'drink', 'tired', 'kind', 'stir', 'drift',
  'share', 'heart', 'shine', 'shore', 'short', 'shone',
  'crest', 'torch', 'crane', 'craft', 'cloak', 'track',
  'shout', 'thunder', 'crust', 'ruin', 'stun', 'hunt', 'dusk',
  'mouse', 'armor', 'storm', 'march', 'marsh', 'mist',
  'ghost', 'guard', 'grim', 'groan', 'grind',
  'sword', 'wrath', 'witch', 'watch',
  'battle', 'badger', 'burrow', 'blade',
  'path', 'patrol', 'pounce', 'power', 'proud',
  'journey', 'glory', 'story', 'mystic', 'misty',
  'village', 'victory', 'voyage', 'valor', 'vivid',
  'venom', 'vigor', 'vault',
  // 6-8 letter words (mid-late game)
  'dungeon', 'warrior', 'crystal', 'ancient', 'dragon', 'shadow',
  'thunder', 'harvest', 'kingdom', 'lantern', 'monster', 'captain',
  'enchant', 'griffin', 'phantom', 'cursed', 'throne', 'castle',
  'goblin', 'knight', 'shield', 'forest', 'hidden', 'portal',
  'potion', 'scroll', 'tavern', 'wizard', 'archer', 'rescue',
  // 8-10 letter words (World 4-5)
  'champion', 'darkness', 'guardian', 'mountain', 'skeleton',
  'treasure', 'wanderer', 'conquest', 'heroic', 'mystic',
  // Rare letter words (World 5)
  'vex', 'expel', 'text', 'zeal', 'zone', 'blaze', 'glaze',
  'quest', 'quill', 'quick', 'quake', 'quiver',
]
```

**Step 4: Implement utilities**

```ts
// src/utils/words.ts
import { WORD_BANK } from '../data/wordBank'

export function filterWordsByLetters(bank: string[], letters: string[]): string[] {
  const letterSet = new Set(letters.map(l => l.toLowerCase()))
  return bank.filter(word =>
    word.toLowerCase().split('').every(ch => letterSet.has(ch))
  )
}

export function pickWords(pool: string[], count: number, difficulty: number): string[] {
  // difficulty 1 = short words first, difficulty 5 = long words first
  const sorted = [...pool].sort((a, b) =>
    difficulty <= 2 ? a.length - b.length : b.length - a.length
  )
  // Shuffle within length bands to avoid identical lists
  const shuffled = sorted.sort((a, b) =>
    a.length !== b.length ? (difficulty <= 2 ? a.length - b.length : b.length - a.length)
      : Math.random() - 0.5
  )
  return shuffled.slice(0, count)
}

export function getWordPool(unlockedLetters: string[], count: number, difficulty: number): string[] {
  const filtered = filterWordsByLetters(WORD_BANK, unlockedLetters)
  return pickWords(filtered, Math.min(count, filtered.length), difficulty)
}

export function calculateWpm(wordCount: number, elapsedMs: number): number {
  const minutes = elapsedMs / 60000
  return Math.round(wordCount / minutes)
}
```

**Step 5: Run tests — expect PASS**

```bash
npm test
```

**Step 6: Commit**

```bash
git add src/data/wordBank.ts src/utils/words.ts src/utils/words.test.ts
git commit -m "feat: add word bank and filtering utilities"
```

---

### Task 4: Scoring utilities

**Files:**

- Create: `src/utils/scoring.ts`
- Create: `src/utils/scoring.test.ts`

**Step 1: Write failing tests**

```ts
// src/utils/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { calcAccuracyStars, calcSpeedStars, calcXpReward, calcCharacterLevel } from './scoring'

describe('calcAccuracyStars', () => {
  it('returns 5 stars for 100% accuracy', () => {
    expect(calcAccuracyStars(100, 100)).toBe(5)
  })
  it('returns 1 star for very low accuracy', () => {
    expect(calcAccuracyStars(50, 100)).toBe(1)
  })
  it('returns 3 stars for 80% accuracy', () => {
    expect(calcAccuracyStars(80, 100)).toBe(3)
  })
})

describe('calcSpeedStars', () => {
  it('returns 5 stars for 60+ WPM', () => {
    expect(calcSpeedStars(60)).toBe(5)
  })
  it('returns 1 star for under 10 WPM', () => {
    expect(calcSpeedStars(5)).toBe(1)
  })
  it('returns 3 stars for 30 WPM', () => {
    expect(calcSpeedStars(30)).toBe(3)
  })
})

describe('calcXpReward', () => {
  it('scales with total stars', () => {
    expect(calcXpReward(5, 5, 100)).toBeGreaterThan(calcXpReward(3, 3, 100))
  })
  it('gives base XP for 1 star each', () => {
    expect(calcXpReward(1, 1, 100)).toBeGreaterThan(0)
  })
})

describe('calcCharacterLevel', () => {
  it('returns level 1 at 0 xp', () => {
    expect(calcCharacterLevel(0)).toBe(1)
  })
  it('returns level 50 at max xp', () => {
    expect(calcCharacterLevel(999999)).toBe(50)
  })
  it('increases with xp', () => {
    expect(calcCharacterLevel(1000)).toBeGreaterThan(calcCharacterLevel(100))
  })
})
```

**Step 2: Run tests — expect FAIL**

```bash
npm test
```

**Step 3: Implement**

```ts
// src/utils/scoring.ts
import { StarRating } from '../types'

// Accuracy: 95-100%=5, 85-94%=4, 75-84%=3, 60-74%=2, <60%=1
export function calcAccuracyStars(correct: number, total: number): StarRating {
  if (total === 0) return 1
  const pct = (correct / total) * 100
  if (pct >= 95) return 5
  if (pct >= 85) return 4
  if (pct >= 75) return 3
  if (pct >= 60) return 2
  return 1
}

// Speed: 50+WPM=5, 35+=4, 25+=3, 15+=2, <15=1
// Scaled by world (early worlds have lower thresholds)
export function calcSpeedStars(wpm: number, world: number = 3): StarRating {
  const scale = 0.6 + world * 0.1  // world 1=0.7, world 5=1.1
  if (wpm >= 50 * scale) return 5
  if (wpm >= 35 * scale) return 4
  if (wpm >= 25 * scale) return 3
  if (wpm >= 15 * scale) return 2
  return 1
}

// Base XP + bonus per star
export function calcXpReward(accStars: number, spdStars: number, baseXp: number): number {
  const totalStars = accStars + spdStars  // 2-10
  const multiplier = 0.5 + (totalStars / 10) * 1.0  // 0.6 to 1.5
  return Math.round(baseXp * multiplier)
}

// XP curve: level = floor(sqrt(xp / 50)) + 1, capped at 50
export function calcCharacterLevel(xp: number): number {
  return Math.min(50, Math.floor(Math.sqrt(xp / 50)) + 1)
}

// XP needed to reach a character level
export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 50
}
```

**Step 4: Run tests — expect PASS**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/utils/scoring.ts src/utils/scoring.test.ts
git commit -m "feat: add scoring and XP utilities"
```

---

### Task 5: Save / profile system

**Files:**

- Create: `src/utils/profile.ts`
- Create: `src/utils/profile.test.ts`

**Step 1: Write failing tests**

```ts
// src/utils/profile.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createProfile, saveProfile, loadProfile, deleteProfile, exportProfile, importProfile } from './profile'

// Mock localStorage
const store: Record<string, string> = {}
global.localStorage = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
  clear: () => Object.keys(store).forEach(k => delete store[k]),
  length: 0,
  key: () => null,
}

beforeEach(() => localStorage.clear())

describe('profile system', () => {
  it('creates a default profile', () => {
    const p = createProfile('Hero')
    expect(p.playerName).toBe('Hero')
    expect(p.characterLevel).toBe(1)
    expect(p.unlockedLetters).toContain('a')
  })

  it('saves and loads a profile', () => {
    const p = createProfile('Hero')
    saveProfile(0, p)
    const loaded = loadProfile(0)
    expect(loaded?.playerName).toBe('Hero')
  })

  it('returns null for empty slot', () => {
    expect(loadProfile(0)).toBeNull()
  })

  it('deletes a profile', () => {
    saveProfile(0, createProfile('Hero'))
    deleteProfile(0)
    expect(loadProfile(0)).toBeNull()
  })

  it('exports and imports round-trip', () => {
    const p = createProfile('Hero')
    const json = exportProfile(p)
    const imported = importProfile(json)
    expect(imported?.playerName).toBe('Hero')
  })

  it('importProfile returns null for invalid JSON', () => {
    expect(importProfile('not-json')).toBeNull()
  })
})
```

**Step 2: Run tests — expect FAIL**

```bash
npm test
```

**Step 3: Implement**

```ts
// src/utils/profile.ts
import { ProfileData } from '../types'

const HOME_ROW: string[] = ['a', 's', 'd', 'f', 'j', 'k', 'l']
const KEY = (slot: number) => `kq_profile_${slot}`

export function createProfile(playerName: string, avatarChoice = 'knight'): ProfileData {
  return {
    playerName,
    avatarChoice,
    characterLevel: 1,
    xp: 0,
    statPoints: 0,
    hpPoints: 0,
    powerPoints: 0,
    focusPoints: 0,
    currentWorld: 1,
    currentLevelId: 'w1_l1',
    unlockedLetters: [...HOME_ROW],
    unlockedLevelIds: ['w1_l1'],
    levelResults: {},
    equipment: { weapon: null, armor: null, accessory: null },
    spells: [],
    companions: [],
    pets: [],
    activeCompanionId: null,
    activePetId: null,
    titles: [],
  }
}

export function saveProfile(slot: number, profile: ProfileData): void {
  localStorage.setItem(KEY(slot), JSON.stringify(profile))
}

export function loadProfile(slot: number): ProfileData | null {
  const raw = localStorage.getItem(KEY(slot))
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProfileData
  } catch {
    return null
  }
}

export function deleteProfile(slot: number): void {
  localStorage.removeItem(KEY(slot))
}

export function exportProfile(profile: ProfileData): string {
  return JSON.stringify(profile, null, 2)
}

export function importProfile(json: string): ProfileData | null {
  try {
    const data = JSON.parse(json)
    if (typeof data.playerName !== 'string') return null
    return data as ProfileData
  } catch {
    return null
  }
}

export function getAllProfiles(): (ProfileData | null)[] {
  return [0, 1, 2, 3].map(slot => loadProfile(slot))
}
```

**Step 4: Run tests — expect PASS**

```bash
npm test
```

**Step 5: Commit**

```bash
git add src/utils/profile.ts src/utils/profile.test.ts
git commit -m "feat: add profile save/load/export/import system"
```

---

## Phase 2: Core Scenes

### Task 6: Boot, Preload, and MainMenu scenes

**Files:**

- Modify: `src/scenes/BootScene.ts`
- Create: `src/scenes/PreloadScene.ts`
- Create: `src/scenes/MainMenuScene.ts`
- Modify: `src/main.ts`

**Step 1: Update BootScene**

```ts
// src/scenes/BootScene.ts
import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot') }
  preload() {
    // Minimal assets to show loading bar
    this.load.image('logo', 'assets/logo.png')
  }
  create() {
    this.scene.start('Preload')
  }
}
```

**Step 2: Create PreloadScene**

```ts
// src/scenes/PreloadScene.ts
import Phaser from 'phaser'

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload') }

  preload() {
    const { width, height } = this.scale

    // Loading bar
    const bar = this.add.graphics()
    this.load.on('progress', (value: number) => {
      bar.clear()
      bar.fillStyle(0xffd700)
      bar.fillRect(width * 0.1, height * 0.5, width * 0.8 * value, 20)
    })

    this.add.text(width / 2, height * 0.5 - 40, 'Loading...', {
      fontSize: '24px', color: '#ffffff'
    }).setOrigin(0.5)

    // Placeholder: load a generated atlas or simple colored rectangles
    // Real assets (pixel art sprites, tilesets, audio) are added here as they are created
    this.load.on('complete', () => {
      bar.destroy()
      this.scene.start('MainMenu')
    })
  }

  create() {}
}
```

**Step 3: Create MainMenuScene**

```ts
// src/scenes/MainMenuScene.ts
import Phaser from 'phaser'

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu') }

  create() {
    const { width, height } = this.scale

    // Title
    this.add.text(width / 2, height * 0.25, 'KEYBOARD QUEST', {
      fontSize: '64px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.38, 'The Curse of the Typemancer', {
      fontSize: '24px',
      color: '#aaaaff',
    }).setOrigin(0.5)

    // Play button
    const playBtn = this.add.text(width / 2, height * 0.58, '[ PLAY ]', {
      fontSize: '36px',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    playBtn.on('pointerover', () => playBtn.setColor('#ffd700'))
    playBtn.on('pointerout', () => playBtn.setColor('#ffffff'))
    playBtn.on('pointerdown', () => this.scene.start('ProfileSelect'))
  }
}
```

**Step 4: Update `src/main.ts`**

```ts
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, PreloadScene, MainMenuScene],
})
```

**Step 5: Create `public/assets/` directory**

```bash
mkdir -p public/assets
```

**Step 6: Run and verify manually** — browser shows main menu with Play button.

**Step 7: Commit**

```bash
git add src/scenes/ src/main.ts public/
git commit -m "feat: add Boot, Preload, and MainMenu scenes"
```

---

### Task 7: ProfileSelect scene

**Files:**

- Create: `src/scenes/ProfileSelectScene.ts`
- Modify: `src/main.ts`

**Step 1: Implement ProfileSelectScene**

```ts
// src/scenes/ProfileSelectScene.ts
import Phaser from 'phaser'
import { getAllProfiles, loadProfile, saveProfile, deleteProfile, exportProfile, importProfile, createProfile } from '../utils/profile'
import { ProfileData } from '../types'

export class ProfileSelectScene extends Phaser.Scene {
  private typingBuffer = ''
  private namingSlot = -1
  private profiles: (ProfileData | null)[] = []

  constructor() { super('ProfileSelect') }

  create() {
    this.profiles = getAllProfiles()
    this.typingBuffer = ''
    this.namingSlot = -1
    this.render()
  }

  private render() {
    this.children.removeAll(true)
    const { width, height } = this.scale

    this.add.text(width / 2, 50, 'Select Your Hero', {
      fontSize: '40px', color: '#ffd700'
    }).setOrigin(0.5)

    const slotY = [180, 340, 500, 660]
    this.profiles.forEach((profile, i) => {
      const y = slotY[i] ?? 180 + i * 140
      if (profile) {
        this.renderFilledSlot(profile, i, y)
      } else {
        this.renderEmptySlot(i, y)
      }
    })

    // Back button
    const back = this.add.text(60, height - 40, '< Back', {
      fontSize: '24px', color: '#aaaaaa'
    }).setInteractive({ useHandCursor: true })
    back.on('pointerdown', () => this.scene.start('MainMenu'))
  }

  private renderFilledSlot(profile: ProfileData, slot: number, y: number) {
    const { width } = this.scale

    const box = this.add.rectangle(width / 2, y, 700, 100, 0x2a2a4a)
      .setInteractive({ useHandCursor: true })
    box.on('pointerdown', () => this.startGame(slot, profile))

    this.add.text(width / 2 - 300, y - 20, profile.playerName, {
      fontSize: '28px', color: '#ffffff'
    })
    this.add.text(width / 2 - 300, y + 10, `World ${profile.currentWorld} — Level ${profile.characterLevel}`, {
      fontSize: '18px', color: '#aaaaaa'
    })

    // Export button
    const exp = this.add.text(width / 2 + 200, y - 20, '[Export]', {
      fontSize: '18px', color: '#aaffaa'
    }).setInteractive({ useHandCursor: true })
    exp.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.handleExport(profile)
    })

    // Delete button
    const del = this.add.text(width / 2 + 280, y - 20, '[Delete]', {
      fontSize: '18px', color: '#ff6666'
    }).setInteractive({ useHandCursor: true })
    del.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      deleteProfile(slot)
      this.profiles[slot] = null
      this.render()
    })
  }

  private renderEmptySlot(slot: number, y: number) {
    const { width } = this.scale

    const box = this.add.rectangle(width / 2, y, 700, 100, 0x1a1a2e, 0.6)
      .setStrokeStyle(2, 0x4444aa)
      .setInteractive({ useHandCursor: true })

    this.add.text(width / 2, y - 15, '+ New Hero', {
      fontSize: '24px', color: '#aaaaff'
    }).setOrigin(0.5)

    // Import button
    const imp = this.add.text(width / 2 + 250, y - 10, '[Import]', {
      fontSize: '18px', color: '#aaffaa'
    }).setInteractive({ useHandCursor: true })

    box.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      // Only if not clicking import
      if (ptr.event.target === imp) return
      this.startNaming(slot, y)
    })
    imp.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      ptr.event.stopPropagation()
      this.handleImport(slot)
    })
  }

  private startNaming(slot: number, y: number) {
    this.namingSlot = slot
    this.typingBuffer = ''
    this.children.removeAll(true)
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.35, 'Type your hero\'s name:', {
      fontSize: '32px', color: '#ffd700'
    }).setOrigin(0.5)

    const nameDisplay = this.add.text(width / 2, height * 0.5, '_', {
      fontSize: '48px', color: '#ffffff'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.65, 'Press ENTER to confirm', {
      fontSize: '20px', color: '#888888'
    }).setOrigin(0.5)

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && this.typingBuffer.length > 0) {
        const profile = createProfile(this.typingBuffer)
        saveProfile(slot, profile)
        this.startGame(slot, profile)
      } else if (event.key === 'Backspace') {
        this.typingBuffer = this.typingBuffer.slice(0, -1)
      } else if (event.key.length === 1 && this.typingBuffer.length < 16) {
        this.typingBuffer += event.key
      }
      nameDisplay.setText(this.typingBuffer + '_')
    })
  }

  private startGame(slot: number, profile: ProfileData) {
    // Store active profile slot in registry for other scenes
    this.registry.set('profileSlot', slot)
    this.registry.set('profile', profile)
    this.scene.start('OverlandMap', { profileSlot: slot })
  }

  private handleExport(profile: ProfileData) {
    const json = exportProfile(profile)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kq_save_${profile.playerName}.kq`
    a.click()
    URL.revokeObjectURL(url)
  }

  private handleImport(slot: number) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.kq'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const profile = importProfile(reader.result as string)
        if (profile) {
          saveProfile(slot, profile)
          this.profiles[slot] = profile
          this.render()
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }
}
```

**Step 2: Add to `src/main.ts`** — import and add `ProfileSelectScene` to scene array.

**Step 3: Manual test** — create a profile, verify it persists after page reload, export and re-import.

**Step 4: Commit**

```bash
git add src/scenes/ProfileSelectScene.ts src/main.ts
git commit -m "feat: add ProfileSelect scene with create/delete/export/import"
```

---

### Task 8: Level data — World 1

**Files:**

- Create: `src/data/levels/world1.ts`
- Create: `src/data/levels/index.ts`

**Step 1: Create World 1 level configs**

```ts
// src/data/levels/world1.ts
import { LevelConfig } from '../../types'

const W1_LETTERS_BASE = ['a', 's', 'd', 'f', 'j', 'k', 'l']
const W1_AFTER_MB1 = [...W1_LETTERS_BASE, 'e']
const W1_AFTER_MB2 = [...W1_AFTER_MB1, 'n']
const W1_AFTER_MB3 = [...W1_AFTER_MB2, 'r']
const W1_AFTER_MB4 = [...W1_AFTER_MB3, 'o']

export const WORLD1_LEVELS: LevelConfig[] = [
  {
    id: 'w1_l1',
    name: 'Alder Falls',
    type: 'CharacterCreator',
    world: 1,
    unlockedLetters: W1_LETTERS_BASE,
    wordCount: 5,
    timeLimit: null,
    storyBeat: 'The last working quill chooses you. Type your name to begin your quest.',
    rewards: { xp: 50 },
    captureEligible: false,
    bossGate: null,
  },
  {
    id: 'w1_l2',
    name: 'Fald Dask',
    type: 'GoblinWhacker',
    world: 1,
    unlockedLetters: W1_LETTERS_BASE,
    wordCount: 15,
    timeLimit: 60,
    storyBeat: 'Goblins have raided the village of Fald Dask! Drive them off!',
    rewards: { xp: 100 },
    captureEligible: true,
    bossGate: null,
  },
  {
    id: 'w1_l3',
    name: 'Salk Lass',
    type: 'GoblinWhacker',
    world: 1,
    unlockedLetters: W1_LETTERS_BASE,
    wordCount: 20,
    timeLimit: 75,
    storyBeat: 'More goblins! These ones carry stolen words on their backs.',
    rewards: { xp: 120 },
    captureEligible: true,
    bossGate: null,
  },
  {
    id: 'w1_mb1',
    name: 'Flask Hollow',
    type: 'BossBattle',
    world: 1,
    unlockedLetters: W1_LETTERS_BASE,
    wordCount: 30,
    timeLimit: 120,
    storyBeat: 'Knuckle the Ogre, Keeper of E, stands in your way!',
    rewards: { xp: 300, title: 'Seeker of E' },
    captureEligible: false,
    bossGate: { minCombinedStars: 6, levelIds: ['w1_l2', 'w1_l3'] },
    isMiniBoss: true,
    bossId: 'knuckle_keeper_of_e',
    miniBossUnlocksLetter: 'e',
    phases: 2,
  },
  {
    id: 'w1_l4',
    name: 'Fern Dale',
    type: 'GoblinWhacker',
    world: 1,
    unlockedLetters: W1_AFTER_MB1,
    wordCount: 20,
    timeLimit: 90,
    storyBeat: 'The letter E has been restored! New words flood back into the world.',
    rewards: { xp: 150 },
    captureEligible: true,
    bossGate: null,
  },
  {
    id: 'w1_l5',
    name: 'Lake Elda',
    type: 'DungeonTrapDisarm',
    world: 1,
    unlockedLetters: W1_AFTER_MB1,
    wordCount: 18,
    timeLimit: 45,
    storyBeat: 'Ancient traps guard the goblin chieftain\'s lair. Disarm them fast!',
    rewards: { xp: 160 },
    captureEligible: false,
    bossGate: null,
  },
  {
    id: 'w1_mb2',
    name: 'Snake Fens',
    type: 'BossBattle',
    world: 1,
    unlockedLetters: W1_AFTER_MB1,
    wordCount: 35,
    timeLimit: 150,
    storyBeat: 'Nessa the Snake Dancer, Keeper of N, coils to strike!',
    rewards: { xp: 350, title: 'Seeker of N' },
    captureEligible: false,
    bossGate: { minCombinedStars: 7, levelIds: ['w1_l4', 'w1_l5'] },
    isMiniBoss: true,
    bossId: 'nessa_keeper_of_n',
    miniBossUnlocksLetter: 'n',
    phases: 2,
  },
  {
    id: 'w1_l6',
    name: 'Sandrel Lane',
    type: 'SillyChallenge',
    world: 1,
    unlockedLetters: W1_AFTER_MB2,
    wordCount: 20,
    timeLimit: 60,
    storyBeat: 'A goblin cook challenges you to an EXPLODING CHEESE contest!',
    rewards: { xp: 130 },
    captureEligible: false,
    bossGate: null,
  },
  {
    id: 'w1_l7',
    name: 'Snare Knell',
    type: 'SkeletonSwarm',
    world: 1,
    unlockedLetters: W1_AFTER_MB2,
    wordCount: 25,
    timeLimit: 90,
    storyBeat: 'Undead scouts guard the mountain pass. Type them down!',
    rewards: { xp: 180 },
    captureEligible: true,
    bossGate: null,
  },
  {
    id: 'w1_mb3',
    name: 'Dread Fells',
    type: 'BossBattle',
    world: 1,
    unlockedLetters: W1_AFTER_MB2,
    wordCount: 40,
    timeLimit: 150,
    storyBeat: 'Rend the Red, Keeper of R, strikes from the shadows!',
    rewards: { xp: 400, title: 'Seeker of R' },
    captureEligible: false,
    bossGate: { minCombinedStars: 8, levelIds: ['w1_l7'] },
    isMiniBoss: true,
    bossId: 'rend_the_red',
    miniBossUnlocksLetter: 'r',
    phases: 2,
  },
  {
    id: 'w1_l8',
    name: 'Fords Lore',
    type: 'MonsterManual',
    world: 1,
    unlockedLetters: W1_AFTER_MB3,
    wordCount: 10,
    timeLimit: null,
    storyBeat: 'Study the Monster Manual — learn the weaknesses of Grizzlefang before you face him.',
    rewards: { xp: 100 },
    captureEligible: false,
    bossGate: null,
  },
  {
    id: 'w1_boss',
    name: 'Grizzlefang\'s Den',
    type: 'BossBattle',
    world: 1,
    unlockedLetters: W1_AFTER_MB3,
    wordCount: 60,
    timeLimit: 300,
    storyBeat: 'Grizzlefang the Keyboard Ogre — armor forged from broken keys. Shatter it!',
    rewards: { xp: 600, item: 'iron_gauntlet', title: 'Hero of the Heartland' },
    captureEligible: false,
    bossGate: { minCombinedStars: 8, levelIds: ['w1_l8'] },
    isBoss: true,
    bossId: 'grizzlefang',
    miniBossUnlocksLetter: 'o',
    phases: 3,
  },
]
```

**Step 2: Create level index**

```ts
// src/data/levels/index.ts
import { LevelConfig } from '../../types'
import { WORLD1_LEVELS } from './world1'
// World 2-5 imported as they are built

export const ALL_LEVELS: LevelConfig[] = [
  ...WORLD1_LEVELS,
]

export function getLevelById(id: string): LevelConfig | undefined {
  return ALL_LEVELS.find(l => l.id === id)
}

export function getLevelsForWorld(world: number): LevelConfig[] {
  return ALL_LEVELS.filter(l => l.world === world)
}
```

**Step 3: Commit**

```bash
git add src/data/levels/
git commit -m "feat: add World 1 level configs"
```

---

## Phase 3: Overland Map

### Task 9: OverlandMap scene

**Files:**

- Create: `src/scenes/OverlandMapScene.ts`
- Modify: `src/main.ts`

**Step 1: Implement OverlandMapScene**

```ts
// src/scenes/OverlandMapScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { getLevelsForWorld } from '../data/levels'

interface NodePosition { x: number; y: number }

// Node positions for World 1 — hand-placed on a 1280x720 canvas
const WORLD1_NODE_POSITIONS: Record<string, NodePosition> = {
  w1_l1:   { x: 150, y: 600 },
  w1_l2:   { x: 280, y: 550 },
  w1_l3:   { x: 400, y: 520 },
  w1_mb1:  { x: 520, y: 480 },
  w1_l4:   { x: 640, y: 450 },
  w1_l5:   { x: 750, y: 400 },
  w1_mb2:  { x: 850, y: 360 },
  w1_l6:   { x: 700, y: 300 },
  w1_l7:   { x: 820, y: 260 },
  w1_mb3:  { x: 950, y: 300 },
  w1_l8:   { x: 1050, y: 260 },
  w1_boss: { x: 1150, y: 200 },
  tavern:  { x: 600, y: 600 },
  stable:  { x: 700, y: 600 },
}

export class OverlandMapScene extends Phaser.Scene {
  private profile!: ProfileData
  private profileSlot!: number

  constructor() { super('OverlandMap') }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot
    this.profile = loadProfile(this.profileSlot)!
  }

  create() {
    const { width, height } = this.scale

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d4a1e)

    // World title
    this.add.text(width / 2, 40, 'World 1 — The Heartland', {
      fontSize: '28px', color: '#ffd700'
    }).setOrigin(0.5)

    // Player info
    this.add.text(20, 20, `${this.profile.playerName}  Lv.${this.profile.characterLevel}`, {
      fontSize: '20px', color: '#ffffff'
    })

    const levels = getLevelsForWorld(1)
    this.drawPaths(levels)
    this.drawNodes(levels)
    this.drawSpecialNodes()
  }

  private isUnlocked(levelId: string): boolean {
    return this.profile.unlockedLevelIds.includes(levelId)
  }

  private meetsGate(level: LevelConfig): boolean {
    if (!level.bossGate) return true
    const { minCombinedStars, levelIds } = level.bossGate
    const total = levelIds.reduce((sum, id) => {
      const r = this.profile.levelResults[id]
      return sum + (r ? r.accuracyStars + r.speedStars : 0)
    }, 0)
    const avg = total / levelIds.length
    return avg >= minCombinedStars
  }

  private drawPaths(levels: LevelConfig[]) {
    const gfx = this.add.graphics()
    gfx.lineStyle(4, 0x888844)
    levels.forEach((level, i) => {
      if (i === 0) return
      const from = WORLD1_NODE_POSITIONS[levels[i - 1].id]
      const to = WORLD1_NODE_POSITIONS[level.id]
      if (from && to) {
        gfx.beginPath()
        gfx.moveTo(from.x, from.y)
        gfx.lineTo(to.x, to.y)
        gfx.strokePath()
      }
    })
  }

  private drawNodes(levels: LevelConfig[]) {
    levels.forEach(level => {
      const pos = WORLD1_NODE_POSITIONS[level.id]
      if (!pos) return

      const unlocked = this.isUnlocked(level.id)
      const gated = !this.meetsGate(level)
      const completed = !!this.profile.levelResults[level.id]

      const color = completed ? 0xffd700
        : unlocked && !gated ? 0xffffff
        : 0x444444

      const isBoss = level.isBoss || level.isMiniBoss
      const circle = this.add.circle(pos.x, pos.y, isBoss ? 20 : 14, color)

      if (unlocked && !gated) {
        circle.setInteractive({ useHandCursor: true })
        circle.on('pointerover', () => this.showTooltip(level, pos))
        circle.on('pointerout', () => this.hideTooltip())
        circle.on('pointerdown', () => this.enterLevel(level))
      }

      // Star display under completed nodes
      if (completed) {
        const r = this.profile.levelResults[level.id]
        this.add.text(pos.x, pos.y + 22,
          `⚡${r.speedStars} 🎯${r.accuracyStars}`,
          { fontSize: '11px', color: '#ffff88' }
        ).setOrigin(0.5)
      }

      // Gate hint
      if (gated && unlocked) {
        this.add.text(pos.x, pos.y - 24, '🔒', { fontSize: '14px' }).setOrigin(0.5)
        const gate = level.bossGate!
        this.add.text(pos.x, pos.y + 24, `Need avg ${gate.minCombinedStars}★`, {
          fontSize: '10px', color: '#ff8888'
        }).setOrigin(0.5)
      }
    })
  }

  private drawSpecialNodes() {
    // Tavern
    const tp = WORLD1_NODE_POSITIONS['tavern']
    const tavernNode = this.add.rectangle(tp.x, tp.y, 80, 40, 0x6a3a1a)
      .setInteractive({ useHandCursor: true })
    this.add.text(tp.x, tp.y, 'TAVERN', { fontSize: '12px', color: '#ffd700' }).setOrigin(0.5)
    tavernNode.on('pointerdown', () => {
      this.scene.start('Tavern', { profileSlot: this.profileSlot })
    })

    // Stable
    const sp = WORLD1_NODE_POSITIONS['stable']
    const stableNode = this.add.rectangle(sp.x, sp.y, 80, 40, 0x2a5a1a)
      .setInteractive({ useHandCursor: true })
    this.add.text(sp.x, sp.y, 'STABLE', { fontSize: '12px', color: '#aaffaa' }).setOrigin(0.5)
    stableNode.on('pointerdown', () => {
      this.scene.start('Stable', { profileSlot: this.profileSlot })
    })
  }

  private tooltipText?: Phaser.GameObjects.Text
  private showTooltip(level: LevelConfig, pos: NodePosition) {
    this.hideTooltip()
    const label = level.isMiniBoss ? '⚔ MINI-BOSS: ' : level.isBoss ? '👑 BOSS: ' : ''
    this.tooltipText = this.add.text(pos.x, pos.y - 35, `${label}${level.name}`, {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#000000',
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5)
  }

  private hideTooltip() {
    this.tooltipText?.destroy()
    this.tooltipText = undefined
  }

  private enterLevel(level: LevelConfig) {
    this.scene.start('LevelIntro', { level, profileSlot: this.profileSlot })
  }
}
```

**Step 2: Add to `src/main.ts`**

**Step 3: Manual test** — profile selection leads to overland map with clickable nodes.

**Step 4: Commit**

```bash
git add src/scenes/OverlandMapScene.ts src/main.ts
git commit -m "feat: add OverlandMap scene with node graph and gate checking"
```

---

### Task 10: LevelIntro and LevelResult scenes

**Files:**

- Create: `src/scenes/LevelIntroScene.ts`
- Create: `src/scenes/LevelResultScene.ts`
- Modify: `src/main.ts`

**Step 1: LevelIntroScene — player types level name to enter**

```ts
// src/scenes/LevelIntroScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

export class LevelIntroScene extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private typingBuffer = ''
  private target = ''
  private displayText!: Phaser.GameObjects.Text
  private errorFlash = false

  constructor() { super('LevelIntro') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.typingBuffer = ''
    // Target is level name, letters only, lowercase, spaces ignored
    this.target = this.level.name.toLowerCase().replace(/[^a-z]/g, '')
  }

  create() {
    const { width, height } = this.scale

    this.add.text(width / 2, height * 0.2, this.level.name, {
      fontSize: '52px', color: '#ffd700', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.32, this.level.storyBeat, {
      fontSize: '20px', color: '#cccccc', wordWrap: { width: 800 }, align: 'center'
    }).setOrigin(0.5)

    this.add.text(width / 2, height * 0.52, 'Type the level name to enter:', {
      fontSize: '22px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Show target word with progress
    this.displayText = this.add.text(width / 2, height * 0.62, this.target, {
      fontSize: '40px', color: '#888888'
    }).setOrigin(0.5)

    this.input.keyboard?.on('keydown', this.handleKey, this)
  }

  private handleKey(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    if (key.length !== 1 || !/[a-z]/.test(key)) return

    const expected = this.target[this.typingBuffer.length]
    if (key === expected) {
      this.typingBuffer += key
      this.updateDisplay()
      if (this.typingBuffer === this.target) {
        this.time.delayedCall(200, () => {
          this.scene.start('Level', { level: this.level, profileSlot: this.profileSlot })
        })
      }
    } else {
      // Flash red on wrong key
      if (!this.errorFlash) {
        this.errorFlash = true
        this.cameras.main.flash(150, 180, 0, 0)
        this.time.delayedCall(200, () => { this.errorFlash = false })
      }
    }
  }

  private updateDisplay() {
    // Typed portion in green, untyped in grey
    const typed = `<span style="color:#44ff44">${this.typingBuffer}</span>`
    const remaining = this.target.slice(this.typingBuffer.length)
    // Phaser doesn't support HTML in regular text — use color split approach
    this.displayText.destroy()
    const { width, height } = this.scale
    const charW = 24
    const totalW = this.target.length * charW
    const startX = width / 2 - totalW / 2

    this.target.split('').forEach((ch, i) => {
      const color = i < this.typingBuffer.length ? '#44ff44' : '#888888'
      this.add.text(startX + i * charW, height * 0.62, ch, {
        fontSize: '40px', color
      })
    })
  }
}
```

**Step 2: LevelResultScene**

```ts
// src/scenes/LevelResultScene.ts
import Phaser from 'phaser'
import { ProfileData, LevelConfig, LevelResult } from '../types'
import { loadProfile, saveProfile } from '../utils/profile'
import { calcXpReward, calcCharacterLevel, xpForLevel } from '../utils/scoring'
import { getLevelById } from '../data/levels'

interface ResultData {
  level: LevelConfig
  profileSlot: number
  accuracyStars: number
  speedStars: number
  passed: boolean
  captureAttempt?: { monsterId: string; monsterName: string }
}

export class LevelResultScene extends Phaser.Scene {
  private profile!: ProfileData
  private data!: ResultData

  constructor() { super('LevelResult') }

  init(data: ResultData) {
    this.data = data
    this.profile = loadProfile(data.profileSlot)!
  }

  create() {
    const { width, height } = this.scale
    const { level, accuracyStars, speedStars, passed } = this.data

    if (!passed) {
      this.showFailScreen()
      return
    }

    // Award XP
    const baseXp = level.rewards.xp
    const xpGained = calcXpReward(accuracyStars, speedStars, baseXp)
    const prevLevel = this.profile.characterLevel
    this.profile.xp += xpGained
    this.profile.characterLevel = calcCharacterLevel(this.profile.xp)

    // Save level result (only improve, never overwrite with worse)
    const prev = this.profile.levelResults[level.id]
    if (!prev || accuracyStars + speedStars > prev.accuracyStars + prev.speedStars) {
      this.profile.levelResults[level.id] = {
        accuracyStars: accuracyStars as any,
        speedStars: speedStars as any,
        completedAt: Date.now(),
      }
    }

    // Award items/spells/titles
    if (level.rewards.item && !this.profile.equipment.weapon) {
      // Simplified: give item to first empty slot
    }
    if (level.rewards.title) {
      if (!this.profile.titles.includes(level.rewards.title)) {
        this.profile.titles.push(level.rewards.title)
      }
    }

    // Unlock next level(s)
    this.unlockNextLevels(level)

    // Letter unlock if mini-boss
    if (level.miniBossUnlocksLetter && !this.profile.unlockedLetters.includes(level.miniBossUnlocksLetter)) {
      this.profile.unlockedLetters.push(level.miniBossUnlocksLetter)
    }

    saveProfile(this.data.profileSlot, this.profile)

    // Render result
    this.add.text(width / 2, 80, passed ? 'VICTORY!' : 'DEFEATED', {
      fontSize: '56px', color: passed ? '#ffd700' : '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5)

    this.add.text(width / 2, 170, level.name, {
      fontSize: '28px', color: '#ffffff'
    }).setOrigin(0.5)

    // Stars
    this.add.text(width / 2, 260, `⚡ Speed: ${'★'.repeat(speedStars)}${'☆'.repeat(5 - speedStars)}`, {
      fontSize: '32px', color: '#ffdd44'
    }).setOrigin(0.5)

    this.add.text(width / 2, 310, `🎯 Accuracy: ${'★'.repeat(accuracyStars)}${'☆'.repeat(5 - accuracyStars)}`, {
      fontSize: '32px', color: '#44ffdd'
    }).setOrigin(0.5)

    this.add.text(width / 2, 380, `+${xpGained} XP`, {
      fontSize: '28px', color: '#aaffaa'
    }).setOrigin(0.5)

    if (this.profile.characterLevel > prevLevel) {
      this.add.text(width / 2, 420, `Level Up! Now Level ${this.profile.characterLevel}`, {
        fontSize: '24px', color: '#ffd700'
      }).setOrigin(0.5)
    }

    // Letter unlock banner
    if (level.miniBossUnlocksLetter) {
      this.add.text(width / 2, 470, `✨ The letter "${level.miniBossUnlocksLetter.toUpperCase()}" has been restored!`, {
        fontSize: '26px', color: '#aaaaff'
      }).setOrigin(0.5)
    }

    // Capture attempt
    if (this.data.captureAttempt) {
      const success = Math.random() < 0.2
      const msg = success
        ? `🐾 You captured a ${this.data.captureAttempt.monsterName}!`
        : `🐾 The ${this.data.captureAttempt.monsterName} escaped...`
      this.add.text(width / 2, 520, msg, {
        fontSize: '22px', color: success ? '#aaffaa' : '#ff8888'
      }).setOrigin(0.5)
    }

    // Continue button
    const cont = this.add.text(width / 2, 640, '[ Continue ]', {
      fontSize: '32px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cont.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.data.profileSlot })
    })
  }

  private showFailScreen() {
    const { width, height } = this.scale
    this.add.text(width / 2, height * 0.35, 'DEFEATED', {
      fontSize: '56px', color: '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.add.text(width / 2, height * 0.5, 'Try again?', {
      fontSize: '28px', color: '#aaaaaa'
    }).setOrigin(0.5)
    const retry = this.add.text(width / 2, height * 0.65, '[ Retry ]', {
      fontSize: '32px', color: '#ffd700'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    retry.on('pointerdown', () => {
      this.scene.start('LevelIntro', { level: this.data.level, profileSlot: this.data.profileSlot })
    })
    const map = this.add.text(width / 2, height * 0.75, '[ Map ]', {
      fontSize: '28px', color: '#aaaaaa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    map.on('pointerdown', () => {
      this.scene.start('OverlandMap', { profileSlot: this.data.profileSlot })
    })
  }

  private unlockNextLevels(completedLevel: LevelConfig) {
    // Find subsequent levels in the same world and unlock the next one
    const worldLevels = require('../data/levels').getLevelsForWorld(completedLevel.world)
    const idx = worldLevels.findIndex((l: LevelConfig) => l.id === completedLevel.id)
    if (idx >= 0 && idx + 1 < worldLevels.length) {
      const next = worldLevels[idx + 1]
      if (!this.profile.unlockedLevelIds.includes(next.id)) {
        this.profile.unlockedLevelIds.push(next.id)
      }
    }
  }
}
```

**Step 3: Add both scenes to `src/main.ts`**

**Step 4: Commit**

```bash
git add src/scenes/LevelIntroScene.ts src/scenes/LevelResultScene.ts src/main.ts
git commit -m "feat: add LevelIntro (type to enter) and LevelResult scenes"
```

---

## Phase 4: Typing Engine & Level Framework

### Task 11: Core typing engine component

**Files:**

- Create: `src/components/TypingEngine.ts`

This is a reusable Phaser scene plugin (or helper class) used by all level types.

```ts
// src/components/TypingEngine.ts
import Phaser from 'phaser'

export interface TypingEngineConfig {
  scene: Phaser.Scene
  x: number
  y: number
  fontSize?: number
  onWordComplete: (word: string, elapsedMs: number) => void
  onWrongKey: () => void
}

export class TypingEngine {
  private scene: Phaser.Scene
  private currentWord = ''
  private typedSoFar = ''
  private config: TypingEngineConfig
  private charTexts: Phaser.GameObjects.Text[] = []
  private wordStartTime = 0

  // Tracking stats
  correctKeystrokes = 0
  totalKeystrokes = 0
  completedWords = 0
  sessionStartTime = 0

  constructor(config: TypingEngineConfig) {
    this.config = config
    this.scene = config.scene
    this.sessionStartTime = Date.now()
    this.scene.input.keyboard?.on('keydown', this.handleKey, this)
  }

  setWord(word: string) {
    this.currentWord = word
    this.typedSoFar = ''
    this.wordStartTime = Date.now()
    this.renderWord()
  }

  clearWord() {
    this.charTexts.forEach(t => t.destroy())
    this.charTexts = []
    this.currentWord = ''
    this.typedSoFar = ''
  }

  private handleKey(event: KeyboardEvent) {
    if (!this.currentWord) return
    const key = event.key.toLowerCase()
    if (key.length !== 1) return

    this.totalKeystrokes++

    const expected = this.currentWord[this.typedSoFar.length]
    if (key === expected) {
      this.correctKeystrokes++
      this.typedSoFar += key
      this.renderWord()
      if (this.typedSoFar === this.currentWord) {
        this.completedWords++
        const elapsed = Date.now() - this.wordStartTime
        this.config.onWordComplete(this.currentWord, elapsed)
        this.clearWord()
      }
    } else {
      this.config.onWrongKey()
      // Flash current char red
      const idx = this.typedSoFar.length
      if (this.charTexts[idx]) {
        const t = this.charTexts[idx]
        t.setColor('#ff4444')
        this.scene.time.delayedCall(100, () => t.setColor('#888888'))
      }
    }
  }

  private renderWord() {
    this.charTexts.forEach(t => t.destroy())
    this.charTexts = []
    const { x, y, fontSize = 36 } = this.config
    const charW = fontSize * 0.62
    const totalW = this.currentWord.length * charW
    const startX = x - totalW / 2

    this.currentWord.split('').forEach((ch, i) => {
      const color = i < this.typedSoFar.length ? '#44ff44'
        : i === this.typedSoFar.length ? '#ffffff'
        : '#888888'
      const t = this.scene.add.text(startX + i * charW, y, ch, {
        fontSize: `${fontSize}px`, color
      })
      this.charTexts.push(t)
    })
  }

  destroy() {
    this.scene.input.keyboard?.off('keydown', this.handleKey, this)
    this.clearWord()
  }
}
```

**Commit:**

```bash
git add src/components/TypingEngine.ts
git commit -m "feat: add reusable TypingEngine component"
```

---

### Task 12: Base Level scene + GoblinWhacker type

**Files:**

- Create: `src/scenes/LevelScene.ts`
- Create: `src/scenes/level-types/GoblinWhackerLevel.ts`
- Modify: `src/main.ts`

**Step 1: Create LevelScene (dispatcher)**

```ts
// src/scenes/LevelScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

// LevelScene is a thin dispatcher — it reads the level type
// and delegates to the correct level implementation scene.
export class LevelScene extends Phaser.Scene {
  constructor() { super('Level') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    const typeToScene: Record<string, string> = {
      GoblinWhacker: 'GoblinWhackerLevel',
      SkeletonSwarm: 'SkeletonSwarmLevel',
      MonsterArena: 'MonsterArenaLevel',
      DungeonTrapDisarm: 'DungeonTrapDisarmLevel',
      DungeonEscape: 'DungeonEscapeLevel',
      PotionBrewingLab: 'PotionBrewingLabLevel',
      MagicRuneTyping: 'MagicRuneTypingLevel',
      MonsterManual: 'MonsterManualLevel',
      GuildRecruitment: 'GuildRecruitmentLevel',
      CharacterCreator: 'CharacterCreatorLevel',
      WoodlandFestival: 'WoodlandFestivalLevel',
      SillyChallenge: 'SillyChallengeLevel',
      BossBattle: 'BossBattleScene',
    }
    const sceneName = typeToScene[data.level.type] ?? 'GoblinWhackerLevel'
    this.scene.start(sceneName, data)
  }

  create() {}
}
```

**Step 2: Create GoblinWhackerLevel**

```ts
// src/scenes/level-types/GoblinWhackerLevel.ts
import Phaser from 'phaser'
import { LevelConfig } from '../../types'
import { TypingEngine } from '../../components/TypingEngine'
import { getWordPool } from '../../utils/words'
import { calcAccuracyStars, calcSpeedStars, calculateWpm } from '../../utils/scoring'
import { loadProfile } from '../../utils/profile'

interface Goblin {
  word: string
  x: number
  speed: number
  sprite: Phaser.GameObjects.Rectangle  // placeholder until art assets exist
  label: Phaser.GameObjects.Text
  hp: number
}

export class GoblinWhackerLevel extends Phaser.Scene {
  private level!: LevelConfig
  private profileSlot!: number
  private words: string[] = []
  private goblins: Goblin[] = []
  private activeGoblin: Goblin | null = null
  private engine!: TypingEngine
  private wordQueue: string[] = []
  private playerHp = 3
  private maxGoblinReach = 0  // x position where goblin damages player
  private hpText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timeLeft = 0
  private timerEvent?: Phaser.Time.TimerEvent
  private spawnTimer?: Phaser.Time.TimerEvent
  private goblinsDefeated = 0
  private finished = false

  constructor() { super('GoblinWhackerLevel') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level
    this.profileSlot = data.profileSlot
    this.finished = false
    this.goblinsDefeated = 0
    this.playerHp = 3
  }

  create() {
    const { width, height } = this.scale
    this.maxGoblinReach = 80

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x2a4a1e)

    // HUD
    this.hpText = this.add.text(20, 20, `HP: ${'❤️'.repeat(this.playerHp)}`, {
      fontSize: '22px', color: '#ff4444'
    })
    this.timerText = this.add.text(width - 20, 20, '', {
      fontSize: '22px', color: '#ffffff'
    }).setOrigin(1, 0)

    // Level name
    this.add.text(width / 2, 20, this.level.name, {
      fontSize: '22px', color: '#ffd700'
    }).setOrigin(0.5, 0)

    // Typing engine (centered, lower third)
    this.engine = new TypingEngine({
      scene: this,
      x: width / 2,
      y: height - 80,
      fontSize: 40,
      onWordComplete: this.onWordComplete.bind(this),
      onWrongKey: this.onWrongKey.bind(this),
    })

    // Word pool
    const difficulty = Math.ceil(this.level.world / 2)
    this.words = getWordPool(this.level.unlockedLetters, this.level.wordCount, difficulty)
    this.wordQueue = [...this.words]

    // Timer
    if (this.level.timeLimit) {
      this.timeLeft = this.level.timeLimit
      this.timerEvent = this.time.addEvent({
        delay: 1000, repeat: this.level.timeLimit - 1,
        callback: () => {
          this.timeLeft--
          this.timerText.setText(`${this.timeLeft}s`)
          if (this.timeLeft <= 0) this.endLevel(false)
        }
      })
    }

    // Spawn goblins
    this.spawnTimer = this.time.addEvent({
      delay: 2500, loop: true, callback: this.spawnGoblin, callbackScope: this
    })
    this.spawnGoblin()
  }

  private spawnGoblin() {
    if (this.finished || this.wordQueue.length === 0) return
    const word = this.wordQueue.shift()!
    const { width, height } = this.scale
    const y = Phaser.Math.Between(120, height - 140)
    const sprite = this.add.rectangle(width + 30, y, 40, 40, 0x44aa44)
    const label = this.add.text(width + 30, y - 30, word, {
      fontSize: '20px', color: '#ffffff',
      backgroundColor: '#000000', padding: { x: 4, y: 2 }
    }).setOrigin(0.5)
    const goblin: Goblin = { word, x: width + 30, speed: 60 + this.level.world * 10, sprite, label, hp: 1 }
    this.goblins.push(goblin)

    // Auto-focus first goblin
    if (!this.activeGoblin) this.setActiveGoblin(goblin)
  }

  private setActiveGoblin(goblin: Goblin | null) {
    this.activeGoblin = goblin
    if (goblin) {
      this.engine.setWord(goblin.word)
    } else {
      this.engine.clearWord()
    }
  }

  update(_time: number, delta: number) {
    if (this.finished) return

    this.goblins.forEach(g => {
      g.x -= g.speed * (delta / 1000)
      g.sprite.setX(g.x)
      g.label.setX(g.x)
      if (g.x <= this.maxGoblinReach) {
        this.goblinReachedPlayer(g)
      }
    })
  }

  private goblinReachedPlayer(goblin: Goblin) {
    // Check companion/pet auto-strike first
    const profile = loadProfile(this.profileSlot)!
    // (simplified — full companion logic in Task 20)
    this.removeGoblin(goblin)
    this.playerHp--
    this.hpText.setText(`HP: ${'❤️'.repeat(Math.max(0, this.playerHp))}`)
    this.cameras.main.shake(200, 0.01)
    if (this.playerHp <= 0) this.endLevel(false)
  }

  private onWordComplete(word: string, _elapsed: number) {
    const goblin = this.goblins.find(g => g.word === word)
    if (goblin) {
      this.removeGoblin(goblin)
      this.goblinsDefeated++
    }
    // Focus next goblin
    const next = this.goblins[0] ?? null
    this.setActiveGoblin(next)

    if (this.wordQueue.length === 0 && this.goblins.length === 0) {
      this.endLevel(true)
    }
  }

  private onWrongKey() {
    this.cameras.main.flash(80, 120, 0, 0)
  }

  private removeGoblin(goblin: Goblin) {
    goblin.sprite.destroy()
    goblin.label.destroy()
    this.goblins = this.goblins.filter(g => g !== goblin)
  }

  private endLevel(passed: boolean) {
    if (this.finished) return
    this.finished = true
    this.timerEvent?.remove()
    this.spawnTimer?.remove()
    this.engine.destroy()

    const elapsed = Date.now() - this.engine.sessionStartTime
    const wpm = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)
    const acc = calcAccuracyStars(this.engine.correctKeystrokes, this.engine.totalKeystrokes)
    const spd = calcSpeedStars(Math.round(this.engine.completedWords / (elapsed / 60000)), this.level.world)

    const captureAttempt = this.level.captureEligible
      ? { monsterId: 'goblin', monsterName: 'Goblin' }
      : undefined

    this.time.delayedCall(500, () => {
      this.scene.start('LevelResult', {
        level: this.level,
        profileSlot: this.profileSlot,
        accuracyStars: acc,
        speedStars: spd,
        passed,
        captureAttempt,
      })
    })
  }
}
```

**Step 3: Add both scenes to `src/main.ts`**

**Step 4: Manual test** — play through w1_l2 (Goblin Whacker), verify goblins appear, typing defeats them, result screen shows stars.

**Step 5: Commit**

```bash
git add src/scenes/LevelScene.ts src/scenes/level-types/ src/main.ts
git commit -m "feat: add LevelScene dispatcher and GoblinWhacker level type"
```

---

## Phase 5: Remaining Level Types

### Task 13: Combat level types (SkeletonSwarm, MonsterArena, UndeadSiege, SlimeSplitting)

These all follow the same pattern as GoblinWhackerLevel. For each:

**Files:**

- Create: `src/scenes/level-types/SkeletonSwarmLevel.ts`
- Create: `src/scenes/level-types/MonsterArenaLevel.ts`
- Create: `src/scenes/level-types/UndeadSiegeLevel.ts`
- Create: `src/scenes/level-types/SlimeSplittingLevel.ts`

**Pattern to follow for each** (adapt GoblinWhackerLevel):

| Type | Key difference |
|---|---|
| SkeletonSwarm | Enemies come in timed waves (3-5 waves); survive all waves to win |
| MonsterArena | One enemy at a time, typed sequentially; enemies have multi-word HP bars |
| UndeadSiege | Castle has HP bar on left; undead march from right; defend for N waves |
| SlimeSplitting | Defeat a word to split it into 2 shorter words; clear all splits to win |

Each scene should:

1. `init` — set level + profileSlot
2. `create` — draw background, HUD, spawn enemies, initialize TypingEngine
3. `update` — move enemies
4. `endLevel(passed)` — call `LevelResult` with stars + capture data

**SlimeSplitting special logic:**

```ts
// When a slime word is completed, split it into two halves:
private splitWord(word: string): [string, string] {
  const mid = Math.ceil(word.length / 2)
  return [word.slice(0, mid), word.slice(mid)]
}
// Track split depth — slimes that are already 2-letter cannot split further
```

**Commit after all four are implemented:**

```bash
git add src/scenes/level-types/
git commit -m "feat: add SkeletonSwarm, MonsterArena, UndeadSiege, SlimeSplitting level types"
```

---

### Task 14: Puzzle level types

**Files:**

- Create: `src/scenes/level-types/DungeonTrapDisarmLevel.ts`
- Create: `src/scenes/level-types/DungeonEscapeLevel.ts`
- Create: `src/scenes/level-types/PotionBrewingLabLevel.ts`
- Create: `src/scenes/level-types/MagicRuneTypingLevel.ts`

**Key behaviors:**

| Type | Behavior |
|---|---|
| DungeonTrapDisarm | N traps with countdown bars; type word to disarm before bar empties |
| DungeonEscape | Words shown in sequence (not simultaneously); type each in order; visual "crack" progress bar |
| PotionBrewingLab | Recipe shown on screen; type ingredients in exact order; wrong order plays error sound |
| MagicRuneTyping | Single letters appear in sequence forming a word; type each letter to activate the rune |

All follow the same `init/create/update/endLevel` pattern. No capture attempts for puzzle levels.

**Commit:**

```bash
git add src/scenes/level-types/
git commit -m "feat: add puzzle level types (Trap, Escape, Potion, Rune)"
```

---

### Task 15: Story and silly level types

**Files:**

- Create: `src/scenes/level-types/MonsterManualLevel.ts`
- Create: `src/scenes/level-types/CharacterCreatorLevel.ts`
- Create: `src/scenes/level-types/WoodlandFestivalLevel.ts`
- Create: `src/scenes/level-types/SillyChallengeLevel.ts`
- Create: `src/scenes/level-types/GuildRecruitmentLevel.ts`

**Key behaviors:**

| Type | Behavior |
|---|---|
| MonsterManual | Show monster portrait + description paragraph; player types each word; no time pressure; no fail state |
| CharacterCreator | Opening only; player types their name (same as profile create); transitions to overland map |
| WoodlandFestival | Festival minigame — typing contest vs AI animal; animated crowd; XP only, no fail |
| SillyChallenge | Absurd flavor (cheese, sneezing, etc.); same as GoblinWhacker under the hood but with silly art/names |
| GuildRecruitment | Player types a multi-sentence recruitment pitch; shown at Tavern; on success, companion is added to roster |

**No star pressure for MonsterManual, CharacterCreator, WoodlandFestival, SillyChallenge** — these always "pass" and award base XP.

**Commit:**

```bash
git add src/scenes/level-types/
git commit -m "feat: add story and silly level types"
```

---

## Phase 6: Boss Battle System

### Task 16: BossBattle scene framework

**Files:**

- Create: `src/scenes/BossBattleScene.ts`
- Create: `src/scenes/boss-types/GrizzlefangBoss.ts`

**Step 1: BossBattleScene (dispatcher, same pattern as LevelScene)**

```ts
// src/scenes/BossBattleScene.ts
import Phaser from 'phaser'
import { LevelConfig } from '../types'

export class BossBattleScene extends Phaser.Scene {
  constructor() { super('BossBattleScene') }

  init(data: { level: LevelConfig; profileSlot: number }) {
    const bossToScene: Record<string, string> = {
      grizzlefang: 'GrizzlefangBoss',
      knuckle_keeper_of_e: 'MiniBossTypical',
      nessa_keeper_of_n: 'MiniBossTypical',
      rend_the_red: 'MiniBossTypical',
      hydra: 'HydraBoss',
      slime_king: 'SlimeKingBoss',
      clockwork_dragon: 'ClockworkDragonBoss',
      baron_typo: 'BaronTypoBoss',
      spider: 'SpiderBoss',
      tramun_clogg: 'FlashWordBoss',
      badrang: 'FlashWordBoss',
      bone_knight: 'BoneKnightBoss',
      dice_lich: 'DiceLichBoss',
      ancient_dragon: 'AncientDragonBoss',
      typemancer: 'TypemancerBoss',
    }
    const sceneName = bossToScene[data.level.bossId ?? ''] ?? 'MiniBossTypical'
    this.scene.start(sceneName, data)
  }

  create() {}
}
```

**Step 2: MiniBossTypical — generic mini-boss (used for letter-keeper mini-bosses)**

```ts
// src/scenes/boss-types/MiniBossTypical.ts
// Two-phase boss:
// Phase 1: armor plates with words (6 plates, type each to shatter)
// Phase 2: exposed — faster words, no plates
// Uses TypingEngine. On defeat, transitions to LevelResult with miniBossUnlocksLetter.
```

**Step 3: GrizzlefangBoss — three-phase**

```ts
// src/scenes/boss-types/GrizzlefangBoss.ts
// Phase 1: 8 armor plates, each with a word. Type to shatter. Boss roars on each hit.
// Phase 2: 4 words simultaneously (only one active, cycles on completion). Boss moves.
// Phase 3: Rapid-fire 3-letter words. Boss attacks every 8 seconds if not typed.
```

**Commit after MiniBossTypical + GrizzlefangBoss:**

```bash
git add src/scenes/BossBattleScene.ts src/scenes/boss-types/
git commit -m "feat: add BossBattle dispatcher, MiniBossTypical, and Grizzlefang"
```

---

### Task 17: Remaining boss implementations

**Files:** One file per boss in `src/scenes/boss-types/`

Implement each boss's unique mechanic. Use TypingEngine in all of them.

| Boss | File | Key mechanic to implement |
|---|---|---|
| HydraBoss | `HydraBoss.ts` | Track head regrow timer; slow typing causes `headCount++` |
| SlimeKingBoss | `SlimeKingBoss.ts` | Same split logic as SlimeSplitting level |
| ClockworkDragonBoss | `ClockworkDragonBoss.ts` | Spinning gear objects; gear speed increases as HP drops |
| BaronTypoBoss | `BaronTypoBoss.ts` | Display scrambled word; player must type correct version |
| SpiderBoss | `SpiderBoss.ts` | Show letters one at a time; player types sequence to cut web |
| FlashWordBoss | `FlashWordBoss.ts` | Word visible for 2 seconds only; reusable for Tramun and Badrang |
| BoneKnightBoss | `BoneKnightBoss.ts` | Accuracy streak required (no wrong keys) to break shields |
| DiceLichBoss | `DiceLichBoss.ts` | Animated dice roll → random word selected from pool |
| AncientDragonBoss | `AncientDragonBoss.ts` | Sentence-mode: full short sentences, not single words |
| TypemancerBoss | `TypemancerBoss.ts` | 5 phases; uses full alphabet; sentences in final phase |

**Commit:**

```bash
git add src/scenes/boss-types/
git commit -m "feat: add all boss battle implementations"
```

---

## Phase 7: RPG Systems

### Task 18: Equipment system

**Files:**

- Create: `src/data/items.ts`
- Create: `src/scenes/InventoryScene.ts`

**Step 1: Item data**

```ts
// src/data/items.ts
import { ItemData } from '../types'

export const ITEMS: ItemData[] = [
  { id: 'rusty_quill', name: 'Rusty Quill', slot: 'weapon',
    description: 'A worn writing quill. Still works.',
    effect: { power: 1 } },
  { id: 'iron_gauntlet', name: 'Iron Gauntlet', slot: 'armor',
    description: 'Heavy but protective.',
    effect: { hp: 2 } },
  { id: 'focus_ring', name: 'Focus Ring', slot: 'accessory',
    description: 'Sharpens the mind.',
    effect: { focusBonus: 5 } },  // lowers accuracy threshold by 5%
  { id: 'lucky_charm', name: 'Lucky Charm', slot: 'accessory',
    description: 'Increases capture chance.',
    effect: { captureChanceBonus: 0.1 } },
  { id: 'silver_blade', name: 'Silver Blade', slot: 'weapon',
    description: 'Gleams in the moonlight.',
    effect: { power: 3 } },
  { id: 'chain_mail', name: 'Chain Mail', slot: 'armor',
    description: 'Solid all-around protection.',
    effect: { hp: 5 } },
  { id: 'speed_boots', name: 'Speed Boots', slot: 'accessory',
    description: 'Your fingers move faster.',
    effect: { focusBonus: 0 } },  // lowers WPM star thresholds by 10%
  { id: 'rune_plate', name: 'Rune Plate', slot: 'armor',
    description: 'Magical armor of the ancients.',
    effect: { hp: 10 } },
  { id: 'typemancers_edge', name: "Typemancer's Edge", slot: 'weapon',
    description: 'Forged from the final boss\'s staff.',
    effect: { power: 8 } },
]
```

**Step 2: InventoryScene**

```ts
// src/scenes/InventoryScene.ts
// Shows three equipment slots (weapon, armor, accessory) and owned spells.
// Clicking a slot opens a sub-menu of owned items for that slot.
// Equipping an item calls saveProfile.
// Also shows stat point allocation (HP / Power / Focus buttons).
```

**Commit:**

```bash
git add src/data/items.ts src/scenes/InventoryScene.ts
git commit -m "feat: add item data and Inventory scene"
```

---

### Task 19: Spell system

**Files:**

- Create: `src/data/spells.ts`
- Modify: `src/components/TypingEngine.ts` — add spell cast mode
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts` — add spell trigger UI

**Step 1: Spell data**

```ts
// src/data/spells.ts
import { SpellData } from '../types'

export const SPELLS: SpellData[] = [
  { id: 'time_freeze', name: 'Glacius', description: 'Freezes all enemies for 5 seconds.', effect: 'time_freeze' },
  { id: 'word_blast', name: 'Obliterus', description: 'Destroys the nearest enemy instantly.', effect: 'word_blast' },
  { id: 'second_chance', name: 'Revivus', description: 'Restores 2 HP.', effect: 'second_chance' },
  { id: 'letter_shield', name: 'Errantus', description: 'Next 3 wrong keys don\'t count.', effect: 'letter_shield' },
]
```

**Step 2: Spell trigger UI (in level scenes)**

- Show active spell name in HUD (bottom right)
- Press `Tab` to enter spell-cast mode — TypingEngine switches to typing the spell name
- On completion, apply effect; one use per level
- Re-usable via `SpellCaster` helper class shared by all level scenes

**Commit:**

```bash
git add src/data/spells.ts
git commit -m "feat: add spell data and spell-cast mode to level scenes"
```

---

## Phase 8: Companion & Pet Systems

### Task 20: Companion data and Tavern scene

**Files:**

- Create: `src/data/companions.ts`
- Create: `src/scenes/TavernScene.ts`

**Step 1: Companion definitions**

```ts
// src/data/companions.ts
import { CompanionData } from '../types'

export const COMPANION_TEMPLATES: Omit<CompanionData, 'level' | 'xp' | 'autoStrikeCount'>[] = [
  { id: 'mouse_guard_scout', name: 'Pip the Mouse Guard Scout', backstory: 'A brave mouse who patrols the forest paths.', type: 'companion' },
  { id: 'badger_warrior', name: 'Brom the Badger Warrior', backstory: 'Fierce protector of the woodland creatures.', type: 'companion' },
  { id: 'wizard_apprentice', name: 'Elara the Apprentice', backstory: 'Studying magic at the Wizard Peaks.', type: 'companion' },
  { id: 'archer', name: 'Swift the Forest Archer', backstory: 'Never misses a shot.', type: 'companion' },
]

export const PET_TEMPLATES: Omit<CompanionData, 'level' | 'xp' | 'autoStrikeCount'>[] = [
  { id: 'goblin', name: 'Gibs the Tame Goblin', backstory: 'Defeated but reformed.', type: 'pet' },
  { id: 'slime', name: 'Blorp the Slime', backstory: 'Surprisingly loyal.', type: 'pet' },
  { id: 'skeleton', name: 'Clatter the Skeleton', backstory: 'A very helpful pile of bones.', type: 'pet' },
  { id: 'baby_dragon', name: 'Ember the Baby Dragon', backstory: 'Breathes tiny flames.', type: 'pet' },
]

export function createCompanion(templateId: string): CompanionData {
  const template = [...COMPANION_TEMPLATES, ...PET_TEMPLATES].find(t => t.id === templateId)!
  return { ...template, level: 1, xp: 0, autoStrikeCount: 1 }
}
```

**Step 2: Companion XP utilities — add to `src/utils/scoring.ts`**

```ts
export function calcCompanionLevel(xp: number): number {
  return Math.min(3, Math.floor(xp / 200) + 1)
}

export function companionAutoStrikes(level: number): number {
  return level  // level 1=1, level 2=2, level 3=3
}
```

**Step 3: TavernScene**

```ts
// src/scenes/TavernScene.ts
// Shows all companions in profile.companions as a grid.
// Each card shows: name, level, XP bar, auto-strike count.
// "Select" button sets activeCompanionId and saves profile.
// If a guild recruitment level was completed, new companions
// are available here (shown as "Available" cards with recruit button).
// Back button returns to OverlandMap.
```

**Step 4: Add companion auto-strike logic to level scenes**

In every level scene's `goblinReachedPlayer` / damage-taking function:

```ts
private tryCompanionAutoStrike(): boolean {
  const profile = loadProfile(this.profileSlot)!
  const companion = profile.companions.find(c => c.id === profile.activeCompanionId)
  if (!companion || this.companionStrikesUsed >= companion.autoStrikeCount) return false
  this.companionStrikesUsed++
  // Visual: companion sprite flashes, enemy is destroyed
  return true
}
```

**Commit:**

```bash
git add src/data/companions.ts src/scenes/TavernScene.ts
git commit -m "feat: add companion data, Tavern scene, and auto-strike logic"
```

---

### Task 21: Pet capture and Stable scene

**Files:**

- Create: `src/scenes/StableScene.ts`
- Modify: `src/scenes/LevelResultScene.ts` — implement capture roll with Lucky Charm bonus

**Step 1: Implement capture in LevelResultScene**

```ts
// In LevelResultScene.create(), replace the simplified capture block:
if (this.data.captureAttempt && passed) {
  const profile = loadProfile(this.data.profileSlot)!
  const accessory = profile.equipment.accessory
  const item = accessory ? ITEMS.find(i => i.id === accessory) : null
  const bonusChance = item?.effect.captureChanceBonus ?? 0
  const success = Math.random() < (0.2 + bonusChance)

  if (success) {
    const pet = createCompanion(this.data.captureAttempt.monsterId)
    if (!profile.pets.find(p => p.id === pet.id)) {
      profile.pets.push(pet)
      saveProfile(this.data.profileSlot, profile)
    }
  }

  // Show capture result text (success or escape)
}
```

**Step 2: StableScene** — identical to TavernScene but shows `profile.pets`, sets `activePetId`.

**Step 3: Pet milestone — "Beast Tamer"**

In LevelResultScene, after adding a pet:

```ts
if (profile.pets.length >= 10 && !profile.titles.includes('Beast Tamer')) {
  profile.titles.push('Beast Tamer')
  // Show unlock banner
}
```

**Commit:**

```bash
git add src/scenes/StableScene.ts
git commit -m "feat: add pet capture system and Stable scene"
```

---

## Phase 9: Tutorial & World Content

### Task 22: World 1 tutorial scaffolding

**Files:**

- Create: `src/scenes/level-types/CharacterCreatorLevel.ts` (if not done)
- Modify: `src/scenes/level-types/GoblinWhackerLevel.ts` — add ghost keyboard for first 2 World 1 levels
- Create: `src/components/GhostKeyboard.ts`

**Step 1: GhostKeyboard component**

```ts
// src/components/GhostKeyboard.ts
// Renders a simplified keyboard layout in the lower portion of the screen.
// Highlights the key that corresponds to the next expected character.
// Home row keys (a,s,d,f,j,k,l) always visible.
// New keys light up dimly when first unlocked.
// Fades out (alpha 0) after the second World 1 level is completed.

export class GhostKeyboard {
  private keys: Map<string, Phaser.GameObjects.Rectangle> = new Map()
  private labels: Map<string, Phaser.GameObjects.Text> = new Map()

  constructor(private scene: Phaser.Scene, private y: number) {
    this.buildLayout()
  }

  highlight(ch: string) {
    this.keys.forEach((rect, key) => {
      rect.setFillStyle(key === ch ? 0xffd700 : 0x333355)
    })
  }

  fadeOut() {
    this.scene.tweens.add({
      targets: [...this.keys.values(), ...this.labels.values()],
      alpha: 0, duration: 1000
    })
  }

  private buildLayout() {
    // Three rows: qwerty top, asdf middle, zxcv bottom
    // Positioned at bottom of screen, small scale
    const rows = [
      ['q','w','e','r','t','y','u','i','o','p'],
      ['a','s','d','f','g','h','j','k','l',';'],
      ['z','x','c','v','b','n','m',',','.','/'],
    ]
    const { width } = this.scene.scale
    rows.forEach((row, rowIdx) => {
      row.forEach((key, colIdx) => {
        const x = width * 0.1 + colIdx * 36 + rowIdx * 18
        const y = this.y + rowIdx * 38
        const rect = this.scene.add.rectangle(x, y, 30, 30, 0x333355).setAlpha(0.7)
        const label = this.scene.add.text(x, y, key, {
          fontSize: '14px', color: '#aaaaaa'
        }).setOrigin(0.5).setAlpha(0.7)
        this.keys.set(key, rect)
        this.labels.set(key, label)
      })
    })
  }
}
```

**Step 2: In GoblinWhackerLevel, check if world 1 and levels 1-2:**

```ts
// In create():
if (this.level.world === 1 && ['w1_l1', 'w1_l2'].includes(this.level.id)) {
  this.ghostKeyboard = new GhostKeyboard(this, height - 200)
}
// In TypingEngine.onWordComplete callback, call:
this.ghostKeyboard?.highlight(nextChar)
```

**Commit:**

```bash
git add src/components/GhostKeyboard.ts
git commit -m "feat: add ghost keyboard tutorial for World 1 first two levels"
```

---

### Task 23: Letter unlock cutscene

**Files:**

- Create: `src/scenes/CutsceneScene.ts`
- Modify: `src/scenes/LevelResultScene.ts` — trigger cutscene after mini-boss

**Step 1: CutsceneScene**

```ts
// src/scenes/CutsceneScene.ts
// Simple sequential text display with a glowing letter animation.
// Data: { letter, title, nextScene, nextSceneData }
// Shows: "The letter [X] has been restored to the realm!"
// Animated: letter glows, expands, fades in gold shimmer
// Press SPACE or click to continue -> transitions to nextScene
```

**Step 2: Trigger from LevelResultScene** — if `level.miniBossUnlocksLetter`, after showing result, "Continue" button goes to CutsceneScene before returning to OverlandMap.

**Commit:**

```bash
git add src/scenes/CutsceneScene.ts
git commit -m "feat: add letter unlock cutscene after mini-boss victories"
```

---

### Task 24: World level data (Worlds 2-5)

**Files:**

- Create: `src/data/levels/world2.ts`
- Create: `src/data/levels/world3.ts`
- Create: `src/data/levels/world4.ts`
- Create: `src/data/levels/world5.ts`
- Modify: `src/data/levels/index.ts`

Follow the same pattern as `world1.ts`. Each world needs:

- 8-12 level nodes (mix of level types — see design doc)
- 4 mini-boss nodes (one per letter unlock)
- 1 boss node (world ender)
- Level names made only from letters unlocked at that point in the sequence
- `bossGate` thresholds on mini-boss and boss nodes
- `captureEligible: true` on combat levels
- Appropriate `storyBeat` text for each level

**World 2 boss:** `hydra` (5 heads)
**World 3 boss:** `clockwork_dragon`
**World 4 boss:** `badrang`
**World 5 boss:** `typemancer`

**After all four worlds:** Update `src/data/levels/index.ts` to import and spread all world arrays.

**Commit after each world:**

```bash
git commit -m "feat: add World N level data"
```

---

### Task 25: VictoryScreen and final polish

**Files:**

- Create: `src/scenes/VictoryScene.ts`
- Modify: `src/scenes/LevelResultScene.ts` — detect if typemancer boss completed and route to VictoryScene

**Step 1: VictoryScene**

```ts
// src/scenes/VictoryScene.ts
// Full-screen celebration.
// Shows: "YOU WON! The Typemancer has been defeated!"
// Profile name, total playtime, all titles earned, companions/pets collected.
// Animated: fireworks particles, gold shimmer, triumphant fanfare.
// Options: "Play Again" (new profile) or "Main Menu"
```

**Step 2: Detect victory in LevelResultScene**

```ts
// After saving level result, check:
if (this.data.level.bossId === 'typemancer' && passed) {
  this.time.delayedCall(2000, () => {
    this.scene.start('VictoryScene', { profileSlot: this.data.profileSlot })
  })
  return
}
```

**Commit:**

```bash
git add src/scenes/VictoryScene.ts
git commit -m "feat: add VictoryScene and end-game detection"
```

---

### Task 26: Overland map — multi-world support

**Files:**

- Modify: `src/scenes/OverlandMapScene.ts`

Currently hardcoded to World 1. Extend to:

- Read `profile.currentWorld` and render the correct world's level list
- Each world has its own `WORLDN_NODE_POSITIONS` map
- "Next World" transition: after defeating the world boss, the next world unlocks; overland map switches to world 2 layout
- Add world selector arrows (left/right) to navigate between completed worlds

**Commit:**

```bash
git commit -m "feat: extend OverlandMap to support all 5 worlds"
```

---

## Phase 10: Final Integration

### Task 27: Wire all scenes into main.ts

**Files:**

- Modify: `src/main.ts`

Add every scene to the Phaser game config scene array. Order matters — Boot must be first.

```ts
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { PreloadScene } from './scenes/PreloadScene'
import { MainMenuScene } from './scenes/MainMenuScene'
import { ProfileSelectScene } from './scenes/ProfileSelectScene'
import { OverlandMapScene } from './scenes/OverlandMapScene'
import { LevelIntroScene } from './scenes/LevelIntroScene'
import { LevelScene } from './scenes/LevelScene'
import { LevelResultScene } from './scenes/LevelResultScene'
import { BossBattleScene } from './scenes/BossBattleScene'
import { CutsceneScene } from './scenes/CutsceneScene'
import { TavernScene } from './scenes/TavernScene'
import { StableScene } from './scenes/StableScene'
import { InventoryScene } from './scenes/InventoryScene'
import { VictoryScene } from './scenes/VictoryScene'
// Level types
import { GoblinWhackerLevel } from './scenes/level-types/GoblinWhackerLevel'
import { SkeletonSwarmLevel } from './scenes/level-types/SkeletonSwarmLevel'
import { MonsterArenaLevel } from './scenes/level-types/MonsterArenaLevel'
import { UndeadSiegeLevel } from './scenes/level-types/UndeadSiegeLevel'
import { SlimeSplittingLevel } from './scenes/level-types/SlimeSplittingLevel'
import { DungeonTrapDisarmLevel } from './scenes/level-types/DungeonTrapDisarmLevel'
import { DungeonEscapeLevel } from './scenes/level-types/DungeonEscapeLevel'
import { PotionBrewingLabLevel } from './scenes/level-types/PotionBrewingLabLevel'
import { MagicRuneTypingLevel } from './scenes/level-types/MagicRuneTypingLevel'
import { MonsterManualLevel } from './scenes/level-types/MonsterManualLevel'
import { CharacterCreatorLevel } from './scenes/level-types/CharacterCreatorLevel'
import { WoodlandFestivalLevel } from './scenes/level-types/WoodlandFestivalLevel'
import { SillyChallengeLevel } from './scenes/level-types/SillyChallengeLevel'
import { GuildRecruitmentLevel } from './scenes/level-types/GuildRecruitmentLevel'
// Boss types
import { MiniBossTypical } from './scenes/boss-types/MiniBossTypical'
import { GrizzlefangBoss } from './scenes/boss-types/GrizzlefangBoss'
import { HydraBoss } from './scenes/boss-types/HydraBoss'
import { SlimeKingBoss } from './scenes/boss-types/SlimeKingBoss'
import { ClockworkDragonBoss } from './scenes/boss-types/ClockworkDragonBoss'
import { BaronTypoBoss } from './scenes/boss-types/BaronTypoBoss'
import { SpiderBoss } from './scenes/boss-types/SpiderBoss'
import { FlashWordBoss } from './scenes/boss-types/FlashWordBoss'
import { BoneKnightBoss } from './scenes/boss-types/BoneKnightBoss'
import { DiceLichBoss } from './scenes/boss-types/DiceLichBoss'
import { AncientDragonBoss } from './scenes/boss-types/AncientDragonBoss'
import { TypemancerBoss } from './scenes/boss-types/TypemancerBoss'

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#1a1a2e',
  scene: [
    BootScene, PreloadScene, MainMenuScene, ProfileSelectScene,
    OverlandMapScene, LevelIntroScene, LevelScene, LevelResultScene,
    BossBattleScene, CutsceneScene, TavernScene, StableScene,
    InventoryScene, VictoryScene,
    GoblinWhackerLevel, SkeletonSwarmLevel, MonsterArenaLevel,
    UndeadSiegeLevel, SlimeSplittingLevel, DungeonTrapDisarmLevel,
    DungeonEscapeLevel, PotionBrewingLabLevel, MagicRuneTypingLevel,
    MonsterManualLevel, CharacterCreatorLevel, WoodlandFestivalLevel,
    SillyChallengeLevel, GuildRecruitmentLevel,
    MiniBossTypical, GrizzlefangBoss, HydraBoss, SlimeKingBoss,
    ClockworkDragonBoss, BaronTypoBoss, SpiderBoss, FlashWordBoss,
    BoneKnightBoss, DiceLichBoss, AncientDragonBoss, TypemancerBoss,
  ],
})
```

**Commit:**

```bash
git commit -m "feat: wire all scenes into Phaser game config"
```

---

### Task 28: Full playthrough verification

**Step 1:** Run `npm run dev` and play from start to finish:

- [ ] Create a profile (type name)
- [ ] Overland map shows World 1 nodes
- [ ] Type level name to enter w1_l1 (CharacterCreator)
- [ ] Complete w1_l1, result screen shows XP
- [ ] w1_l2 unlocked, type to enter, Goblin Whacker works
- [ ] Complete w1_mb1, cutscene shows letter E restored
- [ ] Overland map shows E as unlocked (word pool expanded)
- [ ] Complete World 1 boss (Grizzlefang), title awarded
- [ ] Tavern accessible, recruit a companion
- [ ] Stable accessible, check captured pets
- [ ] Inventory shows equipment
- [ ] Export/import profile round-trips correctly
- [ ] World 2 unlocks after World 1 boss defeated

**Step 2:** Run unit tests

```bash
npm test
```

Expected: all tests PASS.

**Step 3:** Final commit

```bash
git add -A
git commit -m "feat: complete Keyboard Quest MVP — all systems integrated"
```

---

## File Structure Summary

```sh
keyboard-quest/
├── public/
│   └── assets/           # Pixel art sprites, tilesets, audio (add as art is created)
├── src/
│   ├── main.ts           # Phaser game config
│   ├── types/
│   │   └── index.ts      # All shared TypeScript types
│   ├── data/
│   │   ├── wordBank.ts   # Master word list
│   │   ├── items.ts      # Equipment definitions
│   │   ├── spells.ts     # Spell definitions
│   │   ├── companions.ts # Companion and pet templates
│   │   └── levels/
│   │       ├── index.ts  # Aggregator
│   │       ├── world1.ts
│   │       ├── world2.ts
│   │       ├── world3.ts
│   │       ├── world4.ts
│   │       └── world5.ts
│   ├── utils/
│   │   ├── words.ts      # Word filtering and selection
│   │   ├── words.test.ts
│   │   ├── scoring.ts    # Stars, XP, level calculations
│   │   ├── scoring.test.ts
│   │   ├── profile.ts    # Save/load/export/import
│   │   └── profile.test.ts
│   ├── components/
│   │   ├── TypingEngine.ts   # Reusable typing input handler
│   │   └── GhostKeyboard.ts # Tutorial keyboard overlay
│   └── scenes/
│       ├── BootScene.ts
│       ├── PreloadScene.ts
│       ├── MainMenuScene.ts
│       ├── ProfileSelectScene.ts
│       ├── OverlandMapScene.ts
│       ├── LevelIntroScene.ts
│       ├── LevelScene.ts       # Dispatcher
│       ├── LevelResultScene.ts
│       ├── BossBattleScene.ts  # Dispatcher
│       ├── CutsceneScene.ts
│       ├── TavernScene.ts
│       ├── StableScene.ts
│       ├── InventoryScene.ts
│       ├── VictoryScene.ts
│       ├── level-types/
│       │   ├── GoblinWhackerLevel.ts
│       │   ├── SkeletonSwarmLevel.ts
│       │   ├── MonsterArenaLevel.ts
│       │   ├── UndeadSiegeLevel.ts
│       │   ├── SlimeSplittingLevel.ts
│       │   ├── DungeonTrapDisarmLevel.ts
│       │   ├── DungeonEscapeLevel.ts
│       │   ├── PotionBrewingLabLevel.ts
│       │   ├── MagicRuneTypingLevel.ts
│       │   ├── MonsterManualLevel.ts
│       │   ├── CharacterCreatorLevel.ts
│       │   ├── WoodlandFestivalLevel.ts
│       │   ├── SillyChallengeLevel.ts
│       │   └── GuildRecruitmentLevel.ts
│       └── boss-types/
│           ├── MiniBossTypical.ts
│           ├── GrizzlefangBoss.ts
│           ├── HydraBoss.ts
│           ├── SlimeKingBoss.ts
│           ├── ClockworkDragonBoss.ts
│           ├── BaronTypoBoss.ts
│           ├── SpiderBoss.ts
│           ├── FlashWordBoss.ts
│           ├── BoneKnightBoss.ts
│           ├── DiceLichBoss.ts
│           ├── AncientDragonBoss.ts
│           └── TypemancerBoss.ts
├── docs/
│   └── plans/
│       ├── 2026-03-07-keyboard-quest-design.md
│       └── 2026-03-07-keyboard-quest-plan.md
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Notes for Implementation

- **Art assets:** All visual code uses `this.add.rectangle()` and `this.add.text()` as placeholders. Swap for `this.add.sprite()` when pixel art assets are ready.
- **Audio:** Add `this.sound.play('hit')` calls in level scenes; load audio in PreloadScene when files exist.
- **Word bank expansion:** The initial word bank in `wordBank.ts` is a starting point. Expand it with more age-appropriate fantasy words as the game is tested. The filter ensures only valid words for the current letter set are used.
- **Balance:** Star thresholds and boss gate requirements are initial guesses. Tune after playtesting with the target player.
- **Sentence mode:** World 5 and the final boss use sentences. In the TypingEngine, a "sentence" is treated as a space-separated sequence of words typed one at a time, with a space key advancing between words.
