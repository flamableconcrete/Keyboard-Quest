# Mobile Experience Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-friendly experience for phone users that allows browsing menus, map, and non-level screens, while blocking level gameplay with enemy-specific taunts.

**Architecture:** Hybrid approach — two new scenes (`MobileOverlandMapScene`, `MobileLevelIntroScene`) for fundamentally different mobile UX, plus responsive layout branches in existing scenes. A shared `isMobile()` utility cached on the Phaser registry drives all branching. Back-navigation in sub-scenes conditionally returns to the correct map scene.

**Tech Stack:** Phaser 3, TypeScript, Vite

**Spec:** `docs/superpowers/specs/2026-03-15-mobile-experience-design.md`

---

## Chunk 1: Foundation and Data

### Task 1: Mobile Detection Utility

**Files:**
- Create: `src/utils/mobile.ts`
- Create: `src/utils/mobile.test.ts`
- Modify: `src/scenes/BootScene.ts:9-11`

- [ ] **Step 1: Write the test for `isMobile()`**

```ts
// src/utils/mobile.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isMobile } from './mobile';

describe('isMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for phone-width viewports (< 768)', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
    expect(isMobile()).toBe(true);
  });

  it('returns false for tablet-width viewports (>= 768)', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(768);
    expect(isMobile()).toBe(false);
  });

  it('returns false for desktop-width viewports', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1280);
    expect(isMobile()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/mobile.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `isMobile()`**

```ts
// src/utils/mobile.ts
export function isMobile(): boolean {
  return window.innerWidth < 768;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/mobile.test.ts`
Expected: PASS — all 3 tests

- [ ] **Step 5: Add registry caching in BootScene**

In `src/scenes/BootScene.ts`, modify the `create()` method (line 9-11) to cache the result:

```ts
// Add import at top of file
import { isMobile } from '../utils/mobile';

// In create() method, before this.scene.start('Preload'):
create() {
  this.registry.set('isMobile', isMobile());
  this.scene.start('Preload');
}
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/mobile.ts src/utils/mobile.test.ts src/scenes/BootScene.ts
git commit -m "feat: add isMobile() utility and cache on game registry at boot"
```

---

### Task 2: Mobile Taunts Data

**Files:**
- Create: `src/data/mobileTaunts.ts`
- Create: `src/data/mobileTaunts.test.ts`

- [ ] **Step 1: Write the test**

```ts
// src/data/mobileTaunts.test.ts
import { describe, it, expect } from 'vitest';
import { mobileTaunts, fallbackTaunt, getTaunt } from './mobileTaunts';

describe('mobileTaunts', () => {
  it('has a non-empty fallback taunt', () => {
    expect(fallbackTaunt.length).toBeGreaterThan(0);
  });

  it('getTaunt returns a boss-specific taunt when bossId matches', () => {
    const taunt = getTaunt('grizzlefang', 'BossBattle');
    expect(mobileTaunts['grizzlefang']).toBeDefined();
    expect(mobileTaunts['grizzlefang']).toContain(taunt);
  });

  it('getTaunt falls back to level type when bossId has no taunt', () => {
    const taunt = getTaunt('unknown_boss_id', 'GoblinWhacker');
    expect(mobileTaunts['GoblinWhacker']).toBeDefined();
    expect(mobileTaunts['GoblinWhacker']).toContain(taunt);
  });

  it('getTaunt returns fallback when neither bossId nor type matches', () => {
    const taunt = getTaunt(undefined, 'CompletelyUnknownType' as any);
    expect(taunt).toBe(fallbackTaunt);
  });

  it('every taunt array is non-empty', () => {
    for (const [key, taunts] of Object.entries(mobileTaunts)) {
      expect(taunts.length, `taunts for "${key}" should not be empty`).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/data/mobileTaunts.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement mobile taunts data**

The taunts map is keyed by two tiers: `bossId` (for boss levels) and `LevelType` string (for non-boss levels). The `getTaunt()` function checks `bossId` first, then `LevelType`, then falls back to a generic taunt.

The actual `LevelType` union members are: `GoblinWhacker`, `SkeletonSwarm`, `MonsterArena`, `UndeadSiege`, `SlimeSplitting`, `DungeonTrapDisarm`, `DungeonPlatformer`, `DungeonEscape`, `PotionBrewingLab`, `MagicRuneTyping`, `MonsterManual`, `GuildRecruitment`, `CharacterCreator`, `WoodlandFestival`, `SillyChallenge`, `BossBattle`.

```ts
// src/data/mobileTaunts.ts
import type { LevelType } from '../types';

export const mobileTaunts: Record<string, string[]> = {
  // --- Keyed by bossId ---
  grizzlefang: [
    "Grizzlefang yawns. \"You dare face me... on a PHONE? Come back with a proper keyboard, whelp.\"",
  ],
  knuckle_keeper_of_e: [
    "\"Eee! You think you can type on THAT tiny thing? Come back with real keys!\"",
  ],
  shadow_scribe: [
    "The Shadow Scribe's quill hovers mockingly. \"No keyboard? Then you cannot write your own fate.\"",
  ],

  // --- Keyed by LevelType ---
  GoblinWhacker: [
    "Ha! You brought a tiny little screen? Come back with a real weapon... er, keyboard!",
    "The goblin snickers. \"Can't even type on that thing! Shoo!\"",
  ],
  SkeletonSwarm: [
    "These old bones have waited centuries for a challenger... and you show up on a PHONE?",
  ],
  MonsterArena: [
    "The arena master shakes his head. \"No keyboard, no entry. Rules are rules.\"",
  ],
  UndeadSiege: [
    "The undead horde pauses, confused. \"Where's your keyboard, mortal?\"",
  ],
  SlimeSplitting: [
    "*jiggles smugly* Even I know you need a keyboard for this...",
  ],
  DungeonTrapDisarm: [
    "\"These traps require precise keystrokes. Your thumbs won't cut it.\"",
  ],
  DungeonPlatformer: [
    "\"The dungeon demands a keyboard, adventurer. Come back prepared.\"",
  ],
  DungeonEscape: [
    "\"You can't escape a dungeon on a phone! Come back with a keyboard!\"",
  ],
  PotionBrewingLab: [
    "\"Potions require precise ingredients — typed precisely. On a real keyboard.\"",
  ],
  MagicRuneTyping: [
    "The runes dim. \"These ancient symbols demand a proper keyboard to invoke.\"",
  ],
  MonsterManual: [
    "\"The manual is too complex for thumbs. Return with a keyboard, scholar.\"",
  ],
  GuildRecruitment: [
    "\"Guild applications require a keyboard, recruit. Come back properly equipped!\"",
  ],
  CharacterCreator: [
    "\"Even heroes need a proper keyboard to begin their journey!\"",
  ],
  WoodlandFestival: [
    "\"The festival games need nimble fingers on real keys, not a tiny screen!\"",
  ],
  SillyChallenge: [
    "\"Ha! Even silly challenges need a keyboard. Come back on a computer!\"",
  ],
  BossBattle: [
    "The boss crosses their arms. \"Come back when you have a real keyboard, adventurer.\"",
  ],
};

export const fallbackTaunt = "You'll need a real keyboard to face me. Come back on a computer!";

export function getTaunt(bossId: string | undefined, levelType: LevelType): string {
  // Check boss-specific taunt first
  if (bossId && mobileTaunts[bossId]) {
    const taunts = mobileTaunts[bossId];
    return taunts[Math.floor(Math.random() * taunts.length)];
  }
  // Fall back to level type
  if (mobileTaunts[levelType]) {
    const taunts = mobileTaunts[levelType];
    return taunts[Math.floor(Math.random() * taunts.length)];
  }
  // Generic fallback
  return fallbackTaunt;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/data/mobileTaunts.test.ts`
Expected: PASS — all 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/data/mobileTaunts.ts src/data/mobileTaunts.test.ts
git commit -m "feat: add mobile taunt data with per-enemy and per-boss messages"
```

---

## Chunk 2: New Mobile Scenes

### Task 3: MobileLevelIntroScene

**Files:**
- Create: `src/scenes/MobileLevelIntroScene.ts`
- Modify: `src/main.ts:58-64` (add to scene array)
- Modify: `src/scenes/LevelIntroScene.ts:42-44` (add redirect)

- [ ] **Step 1: Create MobileLevelIntroScene**

```ts
// src/scenes/MobileLevelIntroScene.ts
import Phaser from 'phaser';
import type { LevelConfig } from '../types';
import { getTaunt } from '../data/mobileTaunts';

export class MobileLevelIntroScene extends Phaser.Scene {
  private level!: LevelConfig;
  private profileSlot!: number;

  constructor() {
    super('MobileLevelIntro');
  }

  init(data: { level: LevelConfig; profileSlot: number }) {
    this.level = data.level;
    this.profileSlot = data.profileSlot;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Level name at top
    this.add.text(width / 2, 40, this.level.name, {
      fontSize: '32px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Enemy sprite centered
    const enemyKey = this.level.bossId || this.level.type;
    const enemyY = height * 0.4;
    if (this.textures.exists(enemyKey)) {
      this.add.image(width / 2, enemyY, enemyKey).setScale(3);
    } else {
      // Fallback: text-based enemy representation
      this.add.text(width / 2, enemyY, '👾', {
        fontSize: '80px',
      }).setOrigin(0.5);
    }

    // Taunt dialogue bubble
    const taunt = getTaunt(this.level.bossId, this.level.type);
    const bubbleWidth = width * 0.85;
    const bubbleX = width / 2;
    const bubbleY = height * 0.65;

    // Bubble background
    this.add.rectangle(bubbleX, bubbleY, bubbleWidth, 120, 0x2a2a4e)
      .setStrokeStyle(2, 0x4e4e6a);

    // Taunt text
    this.add.text(bubbleX, bubbleY, taunt, {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'monospace',
      wordWrap: { width: bubbleWidth - 40 },
      align: 'center',
    }).setOrigin(0.5);

    // Back to Map button — goes directly to MobileOverlandMap
    const backBtn = this.add.text(width / 2, height * 0.88, '← Back to Map', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#4e4e6a',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffd700'));
    backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerdown', () => {
      this.scene.start('MobileOverlandMap', { profileSlot: this.profileSlot });
    });
  }
}
```

- [ ] **Step 2: Register scene in main.ts**

In `src/main.ts`, add import and add to scene array:

```ts
// Add import
import { MobileLevelIntroScene } from './scenes/MobileLevelIntroScene';

// Add to scene array (line ~63, alongside other scenes)
// Add MobileLevelIntroScene to the array
```

- [ ] **Step 3: Add redirect in LevelIntroScene**

In `src/scenes/LevelIntroScene.ts`, at the top of `create()` (line 42), add:

```ts
create() {
  if (this.registry.get('isMobile')) {
    this.scene.start('MobileLevelIntro', { level: this.level, profileSlot: this.profileSlot });
    return;
  }
  // ... existing code unchanged
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/scenes/MobileLevelIntroScene.ts src/main.ts src/scenes/LevelIntroScene.ts
git commit -m "feat: add MobileLevelIntroScene with enemy taunts and LevelIntro redirect"
```

---

### Task 4: MobileOverlandMapScene

**Files:**
- Create: `src/scenes/MobileOverlandMapScene.ts`
- Modify: `src/main.ts` (add to scene array)
- Modify: `src/scenes/OverlandMapScene.ts:139-141` (add redirect)

This is the largest new scene. It renders a vertical scrolling list of levels grouped by world, plus a fixed bottom navigation bar.

**Important field references (from `src/types/index.ts`):**
- `ProfileData.unlockedLevelIds: string[]` — array of unlocked level IDs
- `ProfileData.levelResults: Record<string, LevelResult>` — map of level ID to results
- `LevelResult.accuracyStars: number` and `LevelResult.speedStars: number` — separate star ratings (1-5 each)
- `ProfileData.characterLevel: number` — the player's level
- `ProfileData.playerName: string`

**Important imports:**
- `loadProfile` from `../utils/profile` (NOT `getProfile`)
- `ALL_LEVELS` from `../data/levels` (NOT `allLevels`)

- [ ] **Step 1: Create MobileOverlandMapScene**

```ts
// src/scenes/MobileOverlandMapScene.ts
import Phaser from 'phaser';
import { loadProfile } from '../utils/profile';
import { ALL_LEVELS } from '../data/levels';
import type { LevelConfig, ProfileData } from '../types';

const NAV_BAR_HEIGHT = 120;
const CARD_HEIGHT = 80;
const CARD_GAP = 12;
const WORLD_HEADER_HEIGHT = 60;
const PADDING_X = 40;
const CONTENT_TOP = 80;

interface NavItem {
  icon: string;
  label: string;
  scene: string;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '⚔️', label: 'Hero', scene: 'CharacterScene' },
  { icon: '🛒', label: 'Shop', scene: 'Shop' },
  { icon: '🍺', label: 'Tavern', scene: 'Tavern' },
  { icon: '🐴', label: 'Stable', scene: 'Stable' },
  { icon: '🏆', label: 'Trophy', scene: 'TrophyRoom' },
  { icon: '⚙️', label: 'Settings', scene: 'Settings' },
];

export class MobileOverlandMapScene extends Phaser.Scene {
  private profileSlot!: number;
  private profile!: ProfileData;

  constructor() {
    super('MobileOverlandMap');
  }

  init(data: { profileSlot: number }) {
    this.profileSlot = data.profileSlot;
    this.profile = loadProfile(this.profileSlot)!;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Player info header
    this.add.text(20, 20, `${this.profile.playerName}`, {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: 'monospace',
    }).setScrollFactor(0).setDepth(10);

    this.add.text(width - 20, 20, `Lv ${this.profile.characterLevel}`, {
      fontSize: '18px',
      color: '#aaaacc',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(10);

    // Build level list
    const contentHeight = this.buildLevelList(width);

    // Set camera bounds for vertical scrolling (leave room for nav bar)
    const viewableHeight = height - NAV_BAR_HEIGHT;
    const totalHeight = Math.max(contentHeight + CONTENT_TOP + 40, viewableHeight);
    this.cameras.main.setBounds(0, 0, width, totalHeight);
    this.cameras.main.setViewport(0, 0, width, viewableHeight);

    // Enable touch-drag scrolling
    this.setupTouchScroll(viewableHeight, totalHeight);

    // Bottom nav bar (fixed, not scrollable)
    this.buildNavBar(width, height);
  }

  private buildLevelList(screenWidth: number): number {
    const cardWidth = screenWidth - PADDING_X * 2;
    let y = CONTENT_TOP;

    // Group levels by world
    const worlds = new Map<number, LevelConfig[]>();
    for (const level of ALL_LEVELS) {
      const worldLevels = worlds.get(level.world) || [];
      worldLevels.push(level);
      worlds.set(level.world, worldLevels);
    }

    const worldNames = ['', 'The Heartland', 'The Coastlands', 'The Shadowfen', 'The Frostpeak', 'The Ember Wastes'];

    for (const [worldNum, levels] of worlds) {
      // World header
      this.add.text(screenWidth / 2, y, `World ${worldNum}: ${worldNames[worldNum] || ''}`, {
        fontSize: '22px',
        color: '#ffd700',
        fontFamily: 'monospace',
      }).setOrigin(0.5, 0);

      y += WORLD_HEADER_HEIGHT;

      // Level cards
      for (const level of levels) {
        this.buildLevelCard(screenWidth / 2, y, cardWidth, level);
        y += CARD_HEIGHT + CARD_GAP;
      }

      y += 20; // Extra gap between worlds
    }

    return y;
  }

  private buildLevelCard(cx: number, y: number, cardWidth: number, level: LevelConfig) {
    const isUnlocked = this.profile.unlockedLevelIds.includes(level.id);
    const result = this.profile.levelResults[level.id];
    // Display the minimum of accuracy and speed stars (both must be earned)
    const stars = result ? Math.min(result.accuracyStars, result.speedStars) : 0;

    const bgColor = isUnlocked ? 0x2a2a4e : 0x1a1a2a;
    const borderColor = isUnlocked ? 0x4e4e6a : 0x2a2a3a;
    const textColor = isUnlocked ? '#ffffff' : '#555566';

    // Card background
    const card = this.add.rectangle(cx, y + CARD_HEIGHT / 2, cardWidth, CARD_HEIGHT, bgColor)
      .setStrokeStyle(2, borderColor);

    // Level name
    const nameX = cx - cardWidth / 2 + 20;
    this.add.text(nameX, y + CARD_HEIGHT / 2 - 10, level.name, {
      fontSize: '18px',
      color: textColor,
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // Type label
    this.add.text(nameX, y + CARD_HEIGHT / 2 + 12, level.type, {
      fontSize: '12px',
      color: isUnlocked ? '#8888aa' : '#444455',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5);

    // Stars (right side) — show min(accuracy, speed) out of 5
    if (stars > 0) {
      const starText = '★'.repeat(stars) + '☆'.repeat(5 - stars);
      this.add.text(cx + cardWidth / 2 - 20, y + CARD_HEIGHT / 2, starText, {
        fontSize: '16px',
        color: '#ffd700',
        fontFamily: 'monospace',
      }).setOrigin(1, 0.5);
    } else if (!isUnlocked) {
      this.add.text(cx + cardWidth / 2 - 20, y + CARD_HEIGHT / 2, '🔒', {
        fontSize: '20px',
      }).setOrigin(1, 0.5);
    }

    // Make unlocked cards tappable
    if (isUnlocked) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        this.scene.start('LevelIntro', {
          level,
          profileSlot: this.profileSlot,
        });
      });
    }
  }

  private setupTouchScroll(viewableHeight: number, totalHeight: number) {
    let dragStartY = 0;
    let cameraStartY = 0;
    let isDragging = false;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't start drag if pointer is in nav bar area
      if (pointer.y >= viewableHeight) return;
      dragStartY = pointer.y;
      cameraStartY = this.cameras.main.scrollY;
      isDragging = false;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      const dy = dragStartY - pointer.y;
      if (Math.abs(dy) > 5) isDragging = true;
      if (isDragging) {
        const newY = Phaser.Math.Clamp(
          cameraStartY + dy,
          0,
          Math.max(0, totalHeight - viewableHeight)
        );
        this.cameras.main.scrollY = newY;
      }
    });
  }

  private buildNavBar(screenWidth: number, screenHeight: number) {
    const barY = screenHeight - NAV_BAR_HEIGHT;
    const itemWidth = screenWidth / NAV_ITEMS.length;

    // Bar background (fixed position via scrollFactor)
    this.add.rectangle(screenWidth / 2, barY + NAV_BAR_HEIGHT / 2, screenWidth, NAV_BAR_HEIGHT, 0x0d0d1a)
      .setScrollFactor(0)
      .setDepth(20);

    // Top border line
    this.add.rectangle(screenWidth / 2, barY, screenWidth, 2, 0x4e4e6a)
      .setScrollFactor(0)
      .setDepth(20);

    for (let i = 0; i < NAV_ITEMS.length; i++) {
      const item = NAV_ITEMS[i];
      const x = itemWidth * i + itemWidth / 2;
      const y = barY + NAV_BAR_HEIGHT / 2;

      // Icon
      this.add.text(x, y - 14, item.icon, {
        fontSize: '28px',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      // Label
      this.add.text(x, y + 22, item.label, {
        fontSize: '12px',
        color: '#8888aa',
        fontFamily: 'monospace',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(21);

      // Invisible hit zone
      const hitZone = this.add.rectangle(x, y, itemWidth, NAV_BAR_HEIGHT, 0x000000, 0)
        .setScrollFactor(0)
        .setDepth(22)
        .setInteractive({ useHandCursor: true });

      hitZone.on('pointerdown', () => {
        this.scene.start(item.scene, { profileSlot: this.profileSlot });
      });
    }
  }
}
```

- [ ] **Step 2: Register scene in main.ts**

In `src/main.ts`, add import and add to scene array:

```ts
import { MobileOverlandMapScene } from './scenes/MobileOverlandMapScene';
// Add MobileOverlandMapScene to the scene array
```

- [ ] **Step 3: Add redirect in OverlandMapScene**

In `src/scenes/OverlandMapScene.ts`, at the top of `create()` (line 139), add the redirect. Note: `init()` runs before `create()` and loads audio/profile — this is acceptable overhead for the redirect case since it only runs once at scene entry.

```ts
create() {
  if (this.registry.get('isMobile')) {
    this.scene.start('MobileOverlandMap', { profileSlot: this.profileSlot });
    return;
  }
  // ... existing code unchanged
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/scenes/MobileOverlandMapScene.ts src/main.ts src/scenes/OverlandMapScene.ts
git commit -m "feat: add MobileOverlandMapScene with vertical level list and bottom nav bar"
```

---

## Chunk 3: Responsive Existing Scenes

### Task 5: MainMenuScene Responsive Layout

**Files:**
- Modify: `src/scenes/MainMenuScene.ts:7-47`

- [ ] **Step 1: Add mobile layout branches**

In `src/scenes/MainMenuScene.ts`, modify `create()` to add mobile-responsive sizing. Read the file first to see the current code, then apply these targeted changes:

1. Add `const mobile = this.registry.get('isMobile');` at the top of `create()` (after `const { width, height } = this.scale;`)

2. Change the title font size (line ~23): `fontSize: '64px'` → `fontSize: mobile ? '40px' : '64px'`

3. Change the subtitle font size (line ~29): `fontSize: '24px'` → `fontSize: mobile ? '18px' : '24px'`

4. Change the play button font size (line ~35): `fontSize: '36px'` → `fontSize: mobile ? '40px' : '36px'` and add padding for touch: `padding: mobile ? { x: 30, y: 20 } : undefined`

5. Change the bottom notice text (line ~45): Replace the text string with:
```ts
const noticeText = mobile
  ? 'Play levels on a computer — explore your adventure on the go!'
  : '⌨  A physical keyboard is required to play';
```
And change the font size: `fontSize: '16px'` → `fontSize: mobile ? '14px' : '16px'`
Add word wrap: `wordWrap: { width: width * 0.8 }, align: 'center'`

Keep all existing event handlers (hover, click, music toggle) exactly as-is.

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/scenes/MainMenuScene.ts
git commit -m "feat: add mobile responsive layout to MainMenuScene"
```

---

### Task 6: ProfileSelectScene Responsive Layout

**Files:**
- Modify: `src/scenes/ProfileSelectScene.ts`

- [ ] **Step 1: Add mobile layout branches**

Read `src/scenes/ProfileSelectScene.ts` first, then modify the following sections:

1. **Mobile flag** — add near the top of the method that builds slots:
```ts
const mobile = this.registry.get('isMobile');
```

2. **Slot positions** (line 66): Make responsive
```ts
const slotY = mobile ? [140, 280, 420, 560] : [180, 340, 500, 660];
```

3. **Panel dimensions** (lines 85-86): Scale down on mobile
```ts
const panelW = mobile ? 500 : 700;
const panelH = mobile ? 80 : 100;
```

4. **Font sizes**: Scale down text throughout. Where font size is `'40px'` use `mobile ? '28px' : '40px'`. Where `'24px'`, use `mobile ? '18px' : '24px'`. Where `'16px'`, use `mobile ? '13px' : '16px'`.

5. **Avatar display size**: Scale down
```ts
// Where setDisplaySize(36, 72) appears:
.setDisplaySize(mobile ? 28 : 36, mobile ? 56 : 72)
```

6. **Name entry — native keyboard on mobile** (around line 244, where the keyboard listener is set up): On mobile, instead of relying on Phaser's keyboard events, create a hidden HTML `<input>` to trigger the native mobile keyboard. The key integration point is: the existing code stores the typed name in a variable (e.g., `heroName` or similar) and displays it via a Phaser Text object (e.g., `nameDisplay`). The HTML input mirrors this:

```ts
if (mobile) {
  const canvas = this.game.canvas;
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / this.scale.width;
  const scaleY = rect.height / this.scale.height;

  const htmlInput = document.createElement('input');
  htmlInput.type = 'text';
  htmlInput.maxLength = 16;
  htmlInput.style.position = 'absolute';
  htmlInput.style.left = `${rect.left + (this.scale.width / 2 - 100) * scaleX}px`;
  htmlInput.style.top = `${rect.top + (this.scale.height * 0.5) * scaleY}px`;
  htmlInput.style.width = `${200 * scaleX}px`;
  htmlInput.style.height = `${40 * scaleY}px`;
  htmlInput.style.opacity = '0';
  htmlInput.style.zIndex = '1000';
  htmlInput.autocomplete = 'off';
  htmlInput.autocapitalize = 'off';
  document.body.appendChild(htmlInput);

  // Focus to trigger native keyboard
  setTimeout(() => htmlInput.focus(), 100);

  // On each input event, sync the HTML input value into the Phaser text display
  // and the variable used by the confirm handler (read the existing code to find
  // the exact variable name — likely `heroName` or the text of `nameDisplay`)
  htmlInput.addEventListener('input', () => {
    const val = htmlInput.value.slice(0, 16);
    nameDisplay.setText(val || '');
  });

  // On Enter, trigger the same confirm flow as the existing keyboard handler
  htmlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const finalName = htmlInput.value.trim();
      if (finalName.length > 0) {
        htmlInput.remove();
        // Call the same confirm/create-profile logic that the existing
        // Enter key handler calls, passing `finalName` as the hero name.
        // Read the existing code to find this function call.
      }
    }
  });

  // Clean up on scene shutdown
  this.events.on('shutdown', () => {
    if (htmlInput.parentElement) htmlInput.remove();
  });
} else {
  // Existing Phaser keyboard listener code goes here (unchanged)
}
```

**Implementation note:** The engineer must read the existing keyboard handler code (around line 279) to understand exactly how `heroName` is stored and how the confirm-on-Enter flow works, then replicate that in the HTML input's Enter handler. The pattern is: read `htmlInput.value.trim()`, then call the same function/logic the Phaser Enter handler calls.

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/scenes/ProfileSelectScene.ts
git commit -m "feat: add mobile responsive layout and native keyboard to ProfileSelectScene"
```

---

### Task 7: Modal Scenes — Mobile Back-Navigation and Full-Screen Panels

**Files:**
- Modify: `src/scenes/CharacterScene.ts`
- Modify: `src/scenes/TrophyRoomScene.ts`
- Modify: `src/scenes/ShopScene.ts`
- Modify: `src/scenes/TavernScene.ts`
- Modify: `src/scenes/StableScene.ts`
- Modify: `src/scenes/SettingsScene.ts`
- Modify: `src/scenes/AvatarCustomizerScene.ts`

This task modifies all sub-scenes to: (a) use full-screen panels on mobile, (b) scale fonts, and (c) return to `MobileOverlandMap` on mobile.

- [ ] **Step 1: CharacterScene — full-screen panel + mobile back-nav**

In `src/scenes/CharacterScene.ts`:

1. At the top of `create()`, read mobile flag:
```ts
const mobile = this.registry.get('isMobile');
```

2. Modify panel dimensions (around line 50):
```ts
const panelWidth = mobile ? width - 40 : 1000;
const panelHeight = mobile ? height - 40 : 600;
```

3. Scale font sizes: for each `fontSize` in the scene, use a ternary. General rule: multiply by ~0.75 on mobile. Examples: `'24px'` → `mobile ? '18px' : '24px'`, `'16px'` → `mobile ? '13px' : '16px'`.

4. Modify `closeScene()` (lines 586-603) to handle mobile:
```ts
private closeScene() {
  const mobile = this.registry.get('isMobile');
  if (mobile) {
    this.scene.start('MobileOverlandMap', { profileSlot: this.profileSlot });
  } else {
    // existing logic: resume OverlandMap, stop self
    if (this.avatarModified) {
      this.scene.start('OverlandMap', { profileSlot: this.profileSlot });
    } else {
      this.scene.resume('OverlandMap');
    }
    this.scene.stop();
  }
}
```

- [ ] **Step 2: TrophyRoomScene — full-screen panel + mobile back-nav**

In `src/scenes/TrophyRoomScene.ts`:

1. Read mobile flag in `create()`:
```ts
const mobile = this.registry.get('isMobile');
```

2. Modify panel dimensions:
```ts
const panelWidth = mobile ? width - 40 : 1000;
const panelHeight = mobile ? height - 40 : 550;
```

3. Adjust pedestal spacing for mobile:
```ts
const pedestalSpacing = mobile ? (panelWidth - 100) / 5 : 185;
```

4. Scale font sizes: `'14px'` → `mobile ? '12px' : '14px'`, etc.

5. Modify close logic (lines 111-114):
```ts
const mobile = this.registry.get('isMobile');
if (mobile) {
  this.scene.start('MobileOverlandMap', { profileSlot: this.profileSlot });
} else {
  this.scene.resume('OverlandMap');
  this.scene.stop();
}
```

- [ ] **Step 3: ShopScene — full-screen layout + mobile back-nav**

In `src/scenes/ShopScene.ts`:

1. Add mobile flag at top of `create()`:
```ts
const mobile = this.registry.get('isMobile');
```

2. Scale fonts: title `'32px'` → `mobile ? '24px' : '32px'`, gold display `'24px'` → `mobile ? '18px' : '24px'`, back button `'28px'` → `mobile ? '22px' : '28px'`.

3. Scale item card dimensions on mobile: reduce card width proportionally (e.g., `mobile ? 280 : 380` for card width).

4. Modify back button click handler (around line 39):
```ts
const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap';
this.scene.start(target, { profileSlot: this.profileSlot });
```

- [ ] **Step 4: TavernScene — scaled fonts + mobile back-nav**

In `src/scenes/TavernScene.ts`:

1. Add mobile flag at top of `create()`:
```ts
const mobile = this.registry.get('isMobile');
```

2. Scale fonts: title `'32px'` → `mobile ? '24px' : '32px'`, back button `'28px'` → `mobile ? '22px' : '28px'`, other text similarly.

3. Modify back button click handler (around line 95):
```ts
const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap';
this.scene.start(target, { profileSlot: this.profileSlot });
```

- [ ] **Step 5: StableScene — scaled fonts + mobile back-nav**

In `src/scenes/StableScene.ts`:

1. Add mobile flag at top of `create()`:
```ts
const mobile = this.registry.get('isMobile');
```

2. Scale fonts: title `'32px'` → `mobile ? '24px' : '32px'`, back button `'28px'` → `mobile ? '22px' : '28px'`, other text similarly.

3. Modify back button click handler (around line 94):
```ts
const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap';
this.scene.start(target, { profileSlot: this.profileSlot });
```

- [ ] **Step 6: SettingsScene — scaled fonts + mobile back-nav**

In `src/scenes/SettingsScene.ts`:

1. Add mobile flag at top of `create()`:
```ts
const mobile = this.registry.get('isMobile');
```

2. Scale fonts: back button `'22px'` → `mobile ? '18px' : '22px'`, tab text similarly.

3. Scale tab width on mobile: `tabWidth = mobile ? 100 : 140`.

4. Modify back button click handler (around line 39):
```ts
const target = this.registry.get('isMobile') ? 'MobileOverlandMap' : 'OverlandMap';
this.scene.start(target, { profileSlot: this.profileSlot });
```

- [ ] **Step 7: AvatarCustomizerScene — mobile back-nav**

In `src/scenes/AvatarCustomizerScene.ts`, find the back/return navigation (it uses a `returnTo` parameter). Modify the return logic to check for mobile:

```ts
// Where it navigates back (e.g., scene.start(this.returnTo, ...)):
// If returnTo is 'OverlandMap' and isMobile, redirect to MobileOverlandMap
const returnScene = (this.returnTo === 'OverlandMap' && this.registry.get('isMobile'))
  ? 'MobileOverlandMap'
  : this.returnTo;
this.scene.start(returnScene, { profileSlot: this.profileSlot });
```

Note: When `returnTo` is `'Settings'` (launched from settings), it should still go to Settings (which itself handles mobile back-nav). Only override when returning directly to the map.

- [ ] **Step 8: Verify build compiles**

Run: `npm run build`
Expected: No type errors

- [ ] **Step 9: Commit**

```bash
git add src/scenes/CharacterScene.ts src/scenes/TrophyRoomScene.ts src/scenes/ShopScene.ts src/scenes/TavernScene.ts src/scenes/StableScene.ts src/scenes/SettingsScene.ts src/scenes/AvatarCustomizerScene.ts
git commit -m "feat: add mobile back-navigation and full-screen panels to all sub-scenes"
```

---

## Chunk 4: Final Integration and Verification

### Task 8: End-to-End Verification

- [ ] **Step 1: Run full test suite**

Run: `npm run test`
Expected: All existing tests pass, new mobile tests pass

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Clean build, no type errors

- [ ] **Step 3: Manual verification with dev server**

Run: `npm run dev`

Test the following using browser DevTools device emulation (iPhone SE, 375px wide):

1. Main menu loads with smaller title and mobile notice text
2. Profile select shows narrower panels
3. Creating a new hero triggers native keyboard
4. Overland map shows as vertical list with bottom nav
5. Tapping an unlocked level shows the enemy taunt scene
6. "Back to Map" returns to vertical map
7. Bottom nav icons open Character, Shop, Tavern, Stable, Trophies, Settings
8. Each sub-scene's back button returns to vertical map
9. Settings → Change Avatar → back returns through Settings correctly

Test at desktop width (1280px):

10. All existing desktop behavior unchanged
11. Horizontal scrolling map works normally
12. Levels can be started and played

- [ ] **Step 4: Commit any fixes from verification**

```bash
git add -A
git commit -m "fix: address issues found during mobile experience verification"
```
