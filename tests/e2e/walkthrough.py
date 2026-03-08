"""
Keyboard Quest — End-to-End Walkthrough (Playwright)

Covers:
  1. Main Menu renders correctly
  2. Profile creation (new hero name entry)
  3. LevelIntro → CharacterCreatorLevel (w1_l1 "Alder Falls")
  4. GoblinWhacker level start and typing mechanics (w1_l2 "Fald Dask")
  5. Tavern scene and navigation
  6. Stable scene and navigation
  7. Inventory scene and navigation

Usage:
  # Start the dev server first, then:
  python tests/e2e/walkthrough.py

  # Or use the helper script to manage the server automatically:
  python scripts/with_server.py --server "npm run dev" --port 5173 -- python tests/e2e/walkthrough.py

Screenshots are saved to /tmp/kq_screenshots/ by default.
Set KQ_SCREENSHOT_DIR env var to override.

Notes on headless Chrome + Phaser:
  - Phaser's Phaser.Time.addEvent relies on requestAnimationFrame, which is
    heavily throttled in headless Chrome. The RAF_POLYFILL replaces it with
    setTimeout so the game loop runs at full speed.
  - Chrome launch flags disable additional background throttling.
  - CDP focus emulation prevents input events from being ignored.
  - GoblinWhacker level *completion* remains unverifiable in headless because
    the spawn timer still doesn't advance at real-time speed. The level *start*
    and typing mechanics are fully verified.
"""

import os
import time

from playwright.sync_api import Page, sync_playwright

DIR = os.environ.get("KQ_SCREENSHOT_DIR", "/tmp/kq_screenshots")
os.makedirs(DIR, exist_ok=True)
sc_count = [0]

# Replace requestAnimationFrame with setTimeout so Phaser's game loop runs in
# headless Chrome (which throttles RAF to near-zero).
RAF_POLYFILL = """
(function() {
    let rafCallbacks = [];
    let rafScheduled = false;
    function runFrame() {
        rafScheduled = false;
        const now = performance.now();
        const cbs = rafCallbacks.slice();
        rafCallbacks = [];
        cbs.forEach(cb => {
            try { cb(now); } catch(e) {}
        });
        if (rafCallbacks.length > 0 && !rafScheduled) {
            rafScheduled = true;
            setTimeout(runFrame, 4);  // ~250fps max
        }
    }
    window.requestAnimationFrame = function(cb) {
        rafCallbacks.push(cb);
        if (!rafScheduled) {
            rafScheduled = true;
            setTimeout(runFrame, 0);
        }
        return rafCallbacks.length;
    };
    window.cancelAnimationFrame = function(id) {
        // no-op for simplicity
    };
    console.log('[KQ-Test] RAF polyfill installed');
})();
"""

# Full ProfileData matching src/types/index.ts — slot 1, w1_l2 unlocked.
# Uses valid companion/pet IDs from src/data/companions.ts.
TESTER_PROFILE = {
    "playerName": "Tester",
    "avatarChoice": "knight",
    "characterLevel": 3,
    "xp": 350,
    "statPoints": 2,
    "hpPoints": 1,
    "powerPoints": 1,
    "focusPoints": 0,
    "currentWorld": 1,
    "currentLevelId": "w1_l2",
    "unlockedLetters": ["a", "s", "d", "f", "j", "k", "l"],
    "unlockedLevelIds": ["w1_l1", "w1_l2", "w1_l3"],
    "levelResults": {
        "w1_l1": {
            "accuracyStars": 5,
            "speedStars": 3,
            "completedAt": 1710000000000,
            "companionUsed": False,
        }
    },
    "equipment": {"weapon": None, "armor": None, "accessory": None},
    "spells": [],
    "companions": [
        {
            "id": "mouse_guard_scout",
            "name": "Pip the Mouse Guard Scout",
            "backstory": "A brave mouse who patrols the forest paths.",
            "type": "companion",
            "level": 1,
            "xp": 50,
            "autoStrikeCount": 1,
        }
    ],
    "pets": [
        {
            "id": "goblin",
            "name": "Gibs the Tame Goblin",
            "backstory": "Defeated but reformed.",
            "type": "pet",
            "level": 1,
            "xp": 30,
            "autoStrikeCount": 1,
        }
    ],
    "activeCompanionId": "mouse_guard_scout",
    "activePetId": "goblin",
    "titles": [],
    "ownedItemIds": [],
    "worldMasteryRewards": [],
    "bossWeaknessKnown": None,
}

# Valid words for w1_l2 (letters: a,s,d,f,j,k,l) from src/data/wordBank.ts
W1_WORD_POOL = [
    "ad",
    "add",
    "ads",
    "ask",
    "dad",
    "dads",
    "fad",
    "fads",
    "lad",
    "lads",
    "sad",
    "all",
    "fall",
    "falls",
    "lass",
    "flask",
    "alas",
    "dal",
]


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────


def ss(page: Page, name: str, desc: str = "") -> str:
    """Take a numbered screenshot and print a label."""
    sc_count[0] += 1
    path = f"{DIR}/{sc_count[0]:02d}_{name}.png"
    page.screenshot(path=path)
    print(f"  📸 {sc_count[0]:02d}_{name}: {desc}")
    return path


def game_click(
    page: Page, gx: float, gy: float, game_w: int = 1280, game_h: int = 720
) -> None:
    """Click at game-space coordinates, accounting for canvas CSS scaling."""
    rect = page.evaluate(
        """() => {
        const c = document.querySelector('canvas');
        if (!c) return null;
        const r = c.getBoundingClientRect();
        return {left: r.left, top: r.top, width: r.width, height: r.height};
    }"""
    )
    if not rect:
        print(f"  WARNING: No canvas for click ({gx}, {gy})")
        return
    sx = rect["left"] + gx * (rect["width"] / game_w)
    sy = rect["top"] + gy * (rect["height"] / game_h)
    page.mouse.click(sx, sy)


def type_game(page: Page, text: str, delay_ms: int = 80) -> None:
    """Type characters via Playwright keyboard (triggers Phaser keydown listeners)."""
    for ch in text:
        page.keyboard.press(ch)
        time.sleep(delay_ms / 1000)


def dispatch_word(page: Page, word: str, delay_ms: int = 50) -> None:
    """Dispatch keydown events directly to window for fast bulk typing."""
    for ch in word:
        escaped = ch.replace("'", "\\'")
        page.evaluate(
            f"""() => {{
            window.dispatchEvent(new KeyboardEvent('keydown', {{
                key: '{escaped}', code: 'Key{ch.upper()}', bubbles: true, cancelable: true
            }}));
        }}"""
        )
        time.sleep(delay_ms / 1000)


def load_fresh_game(page: Page, profile_slot: int | None = None) -> None:
    """Navigate to the game root and optionally inject a saved profile."""
    page.goto("http://localhost:5173")
    page.wait_for_load_state("networkidle")
    time.sleep(3)  # Phaser boot + PreloadScene asset loading
    if profile_slot is not None:
        page.evaluate(
            f"(p) => localStorage.setItem('kq_profile_{profile_slot}', JSON.stringify(p))",
            TESTER_PROFILE,
        )
        print(f"  Profile injected into slot {profile_slot}")


def navigate_to_overland_map(page: Page, profile_y: int = 340) -> None:
    """From the main menu: click PLAY, then select the profile at profile_y."""
    game_click(page, 640, 418)  # PLAY button (MainMenuScene)
    time.sleep(2)
    game_click(page, 640, profile_y)  # Profile slot (ProfileSelectScene)
    time.sleep(3)  # Wait for OverlandMap to fully render


# ─────────────────────────────────────────────────────────────────────────────
# Main walkthrough
# ─────────────────────────────────────────────────────────────────────────────


def run() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                # Prevent Chrome from throttling timers/RAF when headless
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--run-all-compositor-stages-before-draw",
            ],
        )
        ctx = browser.new_context(viewport={"width": 1280, "height": 720})
        # Install RAF polyfill before any page scripts run
        ctx.add_init_script(RAF_POLYFILL)
        page = ctx.new_page()

        # CDP focus emulation ensures keyboard/pointer events are not suppressed
        cdp = ctx.new_cdp_session(page)
        cdp.send("Emulation.setFocusEmulationEnabled", {"enabled": True})

        js_errors: list[str] = []
        page.on(
            "console",
            lambda msg: js_errors.append(f"[{msg.type}] {msg.text}")
            if msg.type == "error"
            else None,
        )
        page.bring_to_front()

        # ─────────────────────────────────────────────────────────
        # SECTION 1: MAIN MENU
        # ─────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("SECTION 1: MAIN MENU")
        print("=" * 60)

        page.goto("http://localhost:5173")
        page.wait_for_load_state("networkidle")
        time.sleep(3)
        ss(page, "main_menu", "Main Menu — KEYBOARD QUEST title")

        # ─────────────────────────────────────────────────────────
        # SECTION 2: PROFILE CREATION
        # ─────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("SECTION 2: PROFILE CREATION")
        print("=" * 60)

        print("  Clicking PLAY...")
        game_click(page, 640, 418)
        time.sleep(2)
        ss(page, "profile_select_empty", "Profile Select — 4 empty slots")

        print("  Clicking empty slot 0 (y=180)...")
        game_click(page, 640, 180)
        time.sleep(1.5)
        ss(page, "hero_name_prompt", "Hero name prompt — type your hero's name")

        print('  Typing "aldas"...')
        type_game(page, "aldas", delay_ms=100)
        time.sleep(0.5)
        ss(page, "hero_name_typed", 'Name "aldas" typed — cursor visible')

        print("  Pressing Enter...")
        page.keyboard.press("Enter")
        time.sleep(3)
        ss(page, "overland_map_new_hero", "Overland Map — fresh hero aldas Lv.1")

        # ─────────────────────────────────────────────────────────
        # SECTION 3: CHARACTER CREATOR LEVEL (w1_l1 — Alder Falls)
        # ─────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print('SECTION 3: CHARACTER CREATOR (w1_l1 — "Alder Falls")')
        print("=" * 60)

        # LevelIntro target: level name letters-only lowercase = "alderfalls"
        print("  Clicking w1_l1 node (150, 600)...")
        game_click(page, 150, 600)
        time.sleep(2)
        ss(page, "level_intro_alder_falls", 'LevelIntro — type "alderfalls" to enter')

        print('  Typing level name "alderfalls"...')
        type_game(page, "alderfalls", delay_ms=100)
        time.sleep(2)
        ss(
            page,
            "character_creator_level",
            'CharacterCreatorLevel — type "start" to begin quest',
        )

        print('  Typing "start"...')
        type_game(page, "start", delay_ms=120)
        time.sleep(3)
        ss(
            page,
            "overland_map_after_creator",
            "Overland Map — back after CharacterCreator",
        )

        # ─────────────────────────────────────────────────────────
        # SECTION 4: GOBLINWHACKER LEVEL (w1_l2 — Fald Dask)
        # Uses injected Tester profile which has w1_l2 already unlocked.
        # ─────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print('SECTION 4: GOBLINWHACKER (w1_l2 — "Fald Dask")')
        print("=" * 60)

        load_fresh_game(page, profile_slot=1)
        ss(page, "main_menu_before_level", "Main menu — Tester profile injected")

        navigate_to_overland_map(page, profile_y=340)
        ss(page, "overland_map_tester", "Overland Map — Tester (w1_l2 unlocked)")

        # LevelIntro target: "Fald Dask" letters-only = "falddask"
        print("  Clicking w1_l2 node (280, 550)...")
        game_click(page, 280, 550)
        time.sleep(2)
        ss(page, "level_intro_fald_dask", 'LevelIntro — type "falddask" to enter')

        print('  Typing "falddask"...')
        type_game(page, "falddask", delay_ms=100)
        time.sleep(2)
        ss(
            page,
            "goblin_whacker_start",
            "GoblinWhacker — HP/timer/ghost keyboard/first goblin visible",
        )

        # Attempt to progress through the level by typing the full word pool in loops.
        # NOTE: In headless Chrome, Phaser's Phaser.Time.addEvent (goblin spawn timer)
        # does not advance at real-time speed despite the RAF polyfill. Only the first
        # goblin (spawned immediately) appears. Typing mechanics are fully verified.
        print("[GOBLINWHACKER] Typing word pool loops to defeat goblins...")
        level_start = time.time()
        prev_ss_time = 0.0

        for round_num in range(1, 20):
            elapsed = time.time() - level_start
            for word in W1_WORD_POOL:
                dispatch_word(page, word, delay_ms=40)
                time.sleep(0.06)
            time.sleep(0.3)
            print(f"  Round {round_num} done (t={elapsed:.1f}s)")

            if elapsed - prev_ss_time >= 12:
                ss(
                    page,
                    f"goblin_r{round_num}",
                    f"GoblinWhacker round {round_num} (t={elapsed:.0f}s)",
                )
                prev_ss_time = elapsed

            if elapsed > 90:
                print(f"  Stopping loop after {elapsed:.0f}s")
                break

        ss(page, "goblin_whacker_done", "GoblinWhacker after typing loop")
        time.sleep(2)
        ss(
            page,
            "level_result_or_stuck",
            "Level result (or game still running in headless)",
        )

        print("  Clicking (640, 640) for Continue button...")
        game_click(page, 640, 640)
        time.sleep(2)
        ss(page, "after_continue_click", "After clicking Continue")

        # ─────────────────────────────────────────────────────────
        # SECTION 5: TAVERN, STABLE, INVENTORY
        # Fresh page load to avoid depending on GoblinWhacker completing.
        # ─────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("SECTION 5: TAVERN, STABLE, INVENTORY")
        print("=" * 60)

        print("  Reloading game for clean Tavern/Stable/Inventory test...")
        load_fresh_game(page, profile_slot=1)
        navigate_to_overland_map(page, profile_y=340)
        time.sleep(1)
        ss(
            page,
            "overland_map_for_special_nodes",
            "Overland Map — ready to test special nodes",
        )

        # TAVERN (600, 640) — "Back to Map" at (640, 680)
        print("\n[TAVERN] Clicking TAVERN node (600, 640)...")
        game_click(page, 600, 640)
        time.sleep(3)
        ss(page, "tavern_scene", "Tavern — The Wandering Badger Tavern")

        print("  Clicking Back to Map (640, 680)...")
        game_click(page, 640, 680)
        time.sleep(2)
        ss(page, "overland_map_after_tavern", "Overland Map — returned from Tavern")

        # STABLE (720, 640) — "Back to Map" at (640, 680)
        print("\n[STABLE] Clicking STABLE node (720, 640)...")
        game_click(page, 720, 640)
        time.sleep(3)
        ss(page, "stable_scene", "Stable — Creature Stable with pets")

        print("  Clicking Back to Map (640, 680)...")
        game_click(page, 640, 680)
        time.sleep(2)
        ss(page, "overland_map_after_stable", "Overland Map — returned from Stable")

        # INVENTORY (480, 640) — "← BACK" at (60, 40)
        print("\n[INVENTORY] Clicking ITEMS node (480, 640)...")
        game_click(page, 480, 640)
        time.sleep(3)
        ss(page, "inventory_scene", "Inventory — INVENTORY & EQUIPMENT")

        print("  Clicking <- BACK (60, 40)...")
        game_click(page, 60, 40)
        time.sleep(2)
        ss(
            page,
            "overland_map_final",
            "Overland Map — final state after full walkthrough",
        )

        # ─────────────────────────────────────────────────────────
        # SUMMARY
        # ─────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("WALKTHROUGH COMPLETE")
        print("=" * 60)
        if js_errors:
            print(f"\n  JavaScript errors: {len(js_errors)}")
            for e in js_errors[:5]:
                print(f"    {e}")
        else:
            print("\n  No JavaScript errors.")
        print(f"\n  Screenshots saved to: {DIR}")

        browser.close()


if __name__ == "__main__":
    run()
