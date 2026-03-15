# Mobile Experience Design

**Date:** 2026-03-15
**Status:** Draft

## Overview

Add a mobile-friendly experience for phone users. Players on phones can browse the home screen, create/select heroes, explore the world map, and access all non-level screens (trophy room, tavern, stable, shop, character, settings). Level gameplay is blocked — the enemy taunts the player and tells them to come back on a computer.

Tablets receive the full desktop experience. Only phones are considered "mobile."

## Mobile Detection

### Utility: `src/utils/mobile.ts`

```ts
export function isMobile(): boolean {
  return window.innerWidth < 768;
}
```

- Checks actual device viewport width, not Phaser's internal 1280x720 resolution.
- Called once in `BootScene.create()` after the Phaser scale manager has initialized, ensuring the viewport dimensions are settled. Cached on `game.registry.set('isMobile', isMobile())`.
- Scenes read via `this.registry.get('isMobile')`.
- No orientation change handling — if the user rotates, they refresh.

## Architecture: Hybrid Approach

Scenes with fundamentally different UX on mobile get dedicated mobile scene files. Scenes that just need layout tweaks branch internally with `isMobile()`.

### New Mobile Scenes

| Scene | File | Why separate |
|-------|------|-------------|
| `MobileOverlandMapScene` | `src/scenes/MobileOverlandMapScene.ts` | Vertical list replaces horizontal scrolling map |
| `MobileLevelIntroScene` | `src/scenes/MobileLevelIntroScene.ts` | Enemy taunt replaces typing start |

### Responsive Existing Scenes (layout branches)

| Scene | Changes |
|-------|---------|
| `MainMenuScene` | Smaller title font, larger touch targets, mobile-friendly notice |
| `ProfileSelectScene` | Narrower panels, recalculated slot positions, native keyboard for name entry |
| `CharacterScene` | Full-screen panel, scaled fonts, tabs may stack |
| `TrophyRoomScene` | Full-screen panel, scaled fonts |
| `ShopScene` | Full-screen panel, scaled fonts |
| `TavernScene` | Full-screen panel, scaled fonts |
| `StableScene` | Full-screen panel, scaled fonts |
| `SettingsScene` | Full-screen panel, scaled fonts |
| `AvatarCustomizerScene` | Full-screen panel, mobile back-nav (reachable from Settings and new hero creation) |

### Scene Redirection

Existing scene transitions continue targeting `OverlandMap` and `LevelIntro`. At the top of those scenes' `create()` methods, if `isMobile()` is true, they immediately redirect:

```ts
create() {
  if (this.registry.get('isMobile')) {
    this.scene.start('MobileOverlandMap', this.scene.settings.data);
    return;
  }
  // ... existing desktop code
}
```

This keeps all existing transition logic untouched.

### Back-Navigation on Mobile

Several scenes use different navigation patterns on desktop:
- **Overlay scenes** (`CharacterScene`, `TrophyRoomScene`): launched via `scene.launch()` and close by calling `scene.resume('OverlandMap')`.
- **Full scenes** (`ShopScene`, `TavernScene`, `StableScene`, `SettingsScene`): started via `scene.start()` and return via `scene.start('OverlandMap')`.

On mobile, all sub-scenes launched from the bottom nav bar must return to `MobileOverlandMap`, not `OverlandMap`. Each scene's close/back handler checks `this.registry.get('isMobile')`:
- If mobile: `this.scene.start('MobileOverlandMap', { profileSlot })` (always use `start`, no overlay pattern on mobile)
- If desktop: existing behavior unchanged

The bottom nav bar on `MobileOverlandMapScene` uses `scene.start()` (not `scene.launch()`) for all destinations, since the full-screen mobile treatment eliminates the need for overlays.

## Data Contract: `profileSlot`

All scene transitions pass `{ profileSlot }` as scene data. `MobileOverlandMapScene` receives this via `this.scene.settings.data` and stores it as an instance property. When launching sub-scenes from the bottom nav, it passes `{ profileSlot: this.profileSlot }` as data. Sub-scenes pass it back when returning.

## MobileOverlandMapScene

### Layout

- **Vertical scrolling list** grouped by world (World 1, World 2, etc.)
- World headers with world name and visual divider
- Each level rendered as a card/row showing:
  - Level name
  - Lock status (grayed out if locked)
  - Star rating if completed (1-5 stars)
- Camera scrolls vertically (Phaser camera bounds set to content height)
- Touch-drag to scroll

### Bottom Navigation Bar

Fixed at the bottom of the screen (`scrollFactor(0)`), 120px tall in game coordinates (1280x720 space). Phaser's `Scale.FIT` scales this proportionally — on a 375px-wide phone, the bar renders at ~35px device pixels tall, keeping touch targets usable. Each of the 6 icons gets a tap zone of ~213px wide x 120px tall in game coordinates.

| Icon | Label | Destination |
|------|-------|-------------|
| Sword/shield | Character | `CharacterScene` |
| Bag/coins | Shop | `ShopScene` |
| Mug | Tavern | `TavernScene` |
| Horseshoe | Stable | `StableScene` |
| Cup | Trophies | `TrophyRoomScene` |
| Gear | Settings | `SettingsScene` |

- Pixel art icons matching the existing game style
- Small label text beneath each icon
- Camera bounds for the level list stop above the nav bar so content is never hidden behind it
- All destinations use `scene.start()` with `{ profileSlot }` data

## MobileLevelIntroScene

### Layout

- Level name displayed at the top
- Enemy sprite centered and sized up for the phone screen
- Dialogue bubble with the enemy's taunt
- "Back to Map" button at the bottom

### Enemy Taunts

Taunts are stored in `src/data/mobileTaunts.ts` as a map keyed by two tiers:

1. **`bossId`** (string) — for boss levels, uses `LevelConfig.bossId`
2. **`enemyType`** (string) — for non-boss levels, derived from `LevelConfig.type` (e.g., `"goblin_whacker"` → `"goblin"`)

Lookup order: `bossId` → `enemyType` → fallback.

```ts
export const mobileTaunts: Record<string, string[]> = {
  // Boss-specific (keyed by bossId)
  goblin_king: [
    "The Goblin King won't waste his time on a phone warrior!",
  ],

  // Enemy-type (keyed by derived type)
  goblin: [
    "Ha! You brought a tiny little screen? Come back with a real weapon... er, keyboard!",
  ],
  skeleton: [
    "These old bones have waited centuries for a challenger... and you show up on a PHONE?",
  ],
  dragon: [
    "I don't even need to breathe fire. You can't type on that thing!",
  ],
  slime: [
    "*jiggles smugly* Even I know you need a keyboard for this...",
  ],
  // ... more enemy types
};

export const fallbackTaunt = "You'll need a real keyboard to face me. Come back on a computer!";
```

The `MobileLevelIntroScene` receives the full `LevelConfig` via scene data and performs the lookup.

## Responsive Scene Adaptations

### MainMenuScene

- Title font: 64px → ~40px on mobile
- "PLAY" button: larger hit area for touch (~80px tall in game coordinates)
- Bottom notice changes from "keyboard required" to: "Play levels on a computer — explore your adventure on the go!"

### ProfileSelectScene

- Panel width: 700px → 500px on mobile
- Slot Y positions recalculated to fit 4 slots in available height
- Avatar previews and text scale down proportionally
- **Name entry**: Hidden HTML `<input>` overlaid on the canvas triggers the native mobile keyboard. Key events forward into existing Phaser name-entry logic. The visible text is still rendered on canvas for visual consistency. The HTML input is transparent — only used for keyboard capture. Removed after confirmation (Enter/Done).

### Modal Screens (Character, Trophy, Shop, Tavern, Stable, Settings)

- Panels expand to full-screen (or near-full-screen) instead of 1000x600 overlays
- Font sizes scale down proportionally
- All touch targets minimum ~44px in game coordinates
- Content reflows where needed (e.g., CharacterScene tabs may stack vertically instead of horizontal row)

## Unreachable Scenes on Mobile

The following scenes are unreachable on mobile because level gameplay is blocked at `MobileLevelIntroScene`:

- **`LevelScene`** (dispatcher) — never started
- **All level-type scenes** — never started
- **`BossBattleScene`** (dispatcher) — never started
- **All boss-type scenes** — never started
- **`LevelResultScene`** — never shown (no level completes)
- **`PauseScene`** — never shown (no active level to pause)

No changes needed to these scenes. If any edge case were to reach them on mobile, they would function but be unusable (no physical keyboard). This is acceptable — the `MobileLevelIntroScene` gate is the designed prevention point.

## Scene Registration

Both new scenes are registered in `src/main.ts` alongside existing scenes:

```ts
import { MobileOverlandMapScene } from './scenes/MobileOverlandMapScene';
import { MobileLevelIntroScene } from './scenes/MobileLevelIntroScene';

// ... in scene array
MobileOverlandMapScene,
MobileLevelIntroScene,
```

## Files Changed / Created

### New Files
- `src/utils/mobile.ts` — `isMobile()` utility
- `src/scenes/MobileOverlandMapScene.ts` — vertical level list + bottom nav
- `src/scenes/MobileLevelIntroScene.ts` — enemy taunt scene
- `src/data/mobileTaunts.ts` — enemy taunt data

### Modified Files
- `src/main.ts` — register new scenes, set `isMobile` on registry at boot
- `src/scenes/BootScene.ts` — call `isMobile()` and cache result on registry
- `src/scenes/OverlandMapScene.ts` — redirect to mobile scene if `isMobile`
- `src/scenes/LevelIntroScene.ts` — redirect to mobile scene if `isMobile`
- `src/scenes/MainMenuScene.ts` — responsive layout branches
- `src/scenes/ProfileSelectScene.ts` — responsive layout + native keyboard
- `src/scenes/CharacterScene.ts` — full-screen panel on mobile, mobile back-nav
- `src/scenes/TrophyRoomScene.ts` — full-screen panel on mobile, mobile back-nav
- `src/scenes/ShopScene.ts` — full-screen panel on mobile, mobile back-nav
- `src/scenes/TavernScene.ts` — full-screen panel on mobile, mobile back-nav
- `src/scenes/StableScene.ts` — full-screen panel on mobile, mobile back-nav
- `src/scenes/SettingsScene.ts` — full-screen panel on mobile, mobile back-nav
- `src/scenes/AvatarCustomizerScene.ts` — full-screen panel on mobile, mobile back-nav

## Out of Scope

- Tablet-specific adaptations (tablets get full desktop experience)
- Orientation change handling (refresh on rotate)
- Mobile-specific touch gestures (pinch, swipe) beyond basic scroll
- Level gameplay on mobile
- PWA / app store packaging
