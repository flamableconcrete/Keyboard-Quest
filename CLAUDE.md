# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Type-check + production build
npm run test       # Run tests once (Vitest)
npm run test:ui    # Run tests with Vitest UI
```

To run a single test file: `npx vitest run src/utils/scoring.test.ts`

## Architecture

**Keyboard Quest** is a browser-based typing RPG built with **Phaser 3** and **TypeScript**, bundled with **Vite**.

### Scene Flow

All Phaser scenes are registered in `src/main.ts`. The flow is:

```
BootScene → PreloadScene → MainMenuScene → ProfileSelectScene → OverlandMapScene
  → LevelIntroScene → LevelScene (dispatcher) → [specific level scene]
  → LevelResultScene → back to OverlandMapScene
```

- **`LevelScene`** is a thin dispatcher that maps `LevelConfig.type` → the appropriate level scene name and starts it.
- **`BossBattleScene`** is a thin dispatcher that maps `LevelConfig.bossId` → the appropriate boss scene name.
- Boss scenes live in `src/scenes/boss-types/`, level gameplay scenes live in `src/scenes/level-types/`.

### Data Layer

- `src/types/index.ts` — all shared TypeScript interfaces (`ProfileData`, `LevelConfig`, `ItemData`, `SpellData`, etc.)
- `src/data/levels/world1–5.ts` — level definitions (`LevelConfig[]`), aggregated in `src/data/levels/index.ts`
- `src/data/companions.ts`, `items.ts`, `spells.ts`, `wordBank.ts` — static game data

### Profile / Persistence

Player progress is stored in **localStorage** (`kq_profile_0` through `kq_profile_3` for 4 save slots). All CRUD is in `src/utils/profile.ts`. No backend.

### Key Components

- **`TypingEngine`** (`src/components/TypingEngine.ts`) — reusable typing input handler; renders character-by-character coloring (green=typed, white=current, gray=remaining), fires `onWordComplete` / `onWrongKey` callbacks.
- **`SpellCaster`** (`src/components/SpellCaster.ts`) — manages spell usage during levels.
- **`GhostKeyboard`** (`src/components/GhostKeyboard.ts`) — visual on-screen keyboard overlay.
- **`TutorialHands`** (`src/components/TutorialHands.ts`) — finger placement hints for tutorial levels.

### Scoring

`src/utils/scoring.ts` computes star ratings (1–5) for accuracy and speed, XP rewards, and character/companion leveling. Speed thresholds scale with world number.

### Adding a New Level Type

1. Add the type string to `LevelType` union in `src/types/index.ts`
2. Create `src/scenes/level-types/MyNewLevel.ts` extending `Phaser.Scene`
3. Register the scene in `src/main.ts`
4. Add the type→scene mapping in `LevelScene.ts`
5. Add `LevelConfig` entries to the appropriate world file in `src/data/levels/`

### Adding a New Boss

1. Create `src/scenes/boss-types/MyBoss.ts` (or reuse `MiniBossTypical` / `FlashWordBoss`)
2. Register the scene in `src/main.ts`
3. Add the `bossId`→scene mapping in `BossBattleScene.ts`
4. Reference the `bossId` in the level config
