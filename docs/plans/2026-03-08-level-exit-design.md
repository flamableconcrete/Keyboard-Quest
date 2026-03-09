# Level Exit and Pause Menu Design

## Overview
Implement a way for players to pause a level and exit back to the Overland Map using a dedicated Pause Menu overlay. This allows players to gracefully abort a level without losing their progress or closing the browser window.

## Approach
We will use a "New Overlay Scene" pattern paired with a reusable `PauseManager` component to keep the implementation DRY and utilize Phaser's native scene pausing mechanics.

### 1. `PauseScene` Overlay (`src/scenes/PauseScene.ts`)
A new Phaser scene that renders on top of the active gameplay scene.
- **Visuals:** Renders a semi-transparent dark background (`alpha: 0.7`) to dim the frozen level behind it. Features a solid center panel for the menu UI.
- **Title:** "PAUSED" text centered at the top of the panel.
- **Buttons:**
  - `[ Resume ]` - Closes the `PauseScene` and resumes the underlying gameplay scene.
  - `[ Quit to Map ]` - Stops the underlying gameplay scene, stops the `PauseScene`, and starts the `OverlandMapScene`.
- **Logic:** Receives `levelKey` (the string identifier of the paused scene) and `profileSlot` via its `init(data)` method so it knows which scene to resume/stop and how to route back to the map.
- **Registration:** Added to `src/main.ts` so it can be launched globally.

### 2. `PauseManager` Component (`src/components/PauseManager.ts`)
A reusable utility class instantiated within any gameplay level's `create()` method.
- **Initialization:** `new PauseManager(this, profileSlot)`
- **Triggers:**
  - **On-Screen Button:** Renders a clickable `[ || ]` or `[ ESC ] Pause` text button in the top-left or top-right corner.
  - **Keyboard Shortcut:** Listens for the `ESC` key press.
- **Action:** When triggered, the manager executes:
  ```typescript
  this.scene.scene.pause(this.scene.scene.key);
  this.scene.scene.launch('PauseScene', { 
    levelKey: this.scene.scene.key, 
    profileSlot: this.profileSlot 
  });
  ```
- **Benefits:** By utilizing Phaser's `scene.pause()`, all gameplay logic, timers, and keyboard inputs (including the `TypingEngine`) are automatically frozen, preventing the player from typing words while the menu is open.

## Integration
- Create `src/scenes/PauseScene.ts` and add it to `src/main.ts`.
- Create `src/components/PauseManager.ts`.
- Inject `new PauseManager(this, this.profileSlot)` into all playable level scenes (e.g., `GoblinWhackerLevel`, boss levels, etc.).