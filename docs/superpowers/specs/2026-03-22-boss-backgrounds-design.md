# Boss & Mini-Boss Unique Backgrounds — Design Spec

**Date:** 2026-03-22
**Issue:** [#94](https://github.com/flamableconcrete/Keyboard-Quest/issues/94)

## Problem

Every boss and mini-boss level currently uses a single flat-color rectangle as its background. There is no visual differentiation between encounters — each scene just paints a dark solid fill and places sprites on top.

## Goal

Give each boss and mini-boss level a unique, richly layered pixel-art-style background with animations that evoke the character and setting of the boss.

## Acceptance Criteria

- Each boss/mini-boss scene has its own distinct background.
- Backgrounds are layered (sky/ground, midground, foreground details).
- Art style matches existing procedural pixel art in `PreloadScene` (hard-edged rectangular fills, no anti-aliasing).
- Each background has meaningful animations (tweens or time-driven particle spawns).
- `MiniBossTypical` dispatches to per-bossId background variants, extensible for future worlds.
- No changes to `BaseBossScene`, `BossBattleScene`, data files, or test files.

---

## Architecture

### New File: `src/utils/bossBackgrounds.ts`

Single utility module. Exports one function per boss scene plus a dispatch function for mini-bosses. All functions have the signature:

```ts
function drawXxxBg(scene: Phaser.Scene): void
```

They use `scene.add.graphics()`, `scene.add.rectangle()`, `scene.tweens.add()`, and `scene.time.addEvent()` to build the background in-place. Phaser automatically cleans up all scene-owned tweens and time events when a scene stops — no manual teardown required.

### Exported Functions

| Function | Used by |
|---|---|
| `drawSlimeCaveBg(scene)` | `SlimeKingBoss` |
| `drawSwampBg(scene)` | `HydraBoss` |
| `drawWebCavernBg(scene)` | `SpiderBoss` |
| `drawCryptBg(scene)` | `DiceLichBoss` |
| `drawCastleThroneRoomBg(scene)` | `BaronTypoBoss` |
| `drawEtherealVoidBg(scene)` | `FlashWordBoss` |
| `drawVolcanicLairBg(scene)` | `AncientDragonBoss` |
| `drawSteampunkWorkshopBg(scene)` | `ClockworkDragonBoss` |
| `drawGraveyardBg(scene)` | `BoneKnightBoss` |
| `drawDarkForestBg(scene)` | `GrizzlefangBoss` |
| `drawDigitalVoidBg(scene)` | `TypemancerBoss` |
| `drawMiniBossBg(scene, bossId)` | `MiniBossTypical` |

### Private Helper Functions (mini-boss variants, not exported)

These are called only via `drawMiniBossBg`. They are not exported.

| Function | Visual |
|---|---|
| `drawForestClearingBg(scene)` | Sunlit forest clearing (Knuckle) |
| `drawMoonlitGladeBg(scene)` | Moonlit glade (Nessa) |
| `drawVolcanicArenaBg(scene)` | Volcanic rock arena (Rend) |
| `drawGenericArenaBg(scene)` | Fallback dark stone arena |

### Boss Scene Changes

Each boss scene's `create()` method replaces its single background rectangle:

```ts
// Before
this.add.rectangle(width / 2, height / 2, width, height, 0x111111)

// After
drawSlimeCaveBg(this)
```

`MiniBossTypical` also passes `this.level.bossId`:

```ts
drawMiniBossBg(this, this.level.bossId ?? '')
```

### Mini-Boss Dispatch (extensible)

```ts
const variants: Record<string, (scene: Phaser.Scene) => void> = {
  knuckle_keeper_of_e: drawForestClearingBg,
  nessa_keeper_of_n:   drawMoonlitGladeBg,
  rend_the_red:        drawVolcanicArenaBg,
  // future world mini-bosses added here
}
const drawFn = variants[bossId] ?? drawGenericArenaBg
drawFn(scene)
```

Adding a future world's mini-boss background requires only: implement the function, add one entry to this map.

---

## Visual Designs

All backgrounds draw bottom-up: sky/ground layer → midground → foreground details → animated elements.

### SlimeKingBoss — Slimy Underground Cave
- **Sky/ground:** Dark cave ceiling (near black), wet stone floor with pooled green slime
- **Midground:** Stalactites hanging from ceiling (triangular pixel shapes), slime-coated walls
- **Foreground:** Glowing green slime pools on floor, dripping wall streaks
- **Animations:** Slime drips fall from stalactite tips (time-spawned); pool shimmer (alpha tween)

### HydraBoss — Fetid Swamp
- **Sky/ground:** Murky dark green sky gradient (stacked rectangles), dark water surface
- **Midground:** Dead tree silhouettes (branching pixel shapes), lily pads
- **Foreground:** Floating surface debris, fog layer near ground
- **Animations:** Fog layer drifts left/right (x tween); water ripple circles expand and fade

### SpiderBoss — Web Cavern
- **Sky/ground:** Black cave walls with faint stone texture (small pixel dots)
- **Midground:** Large cobweb patterns radiating from corners and mid-wall (lines of single pixels)
- **Foreground:** Glowing blue egg sacs (small circles with alpha pulse)
- **Animations:** Small spider shapes crawl along web lines (path tween); web strands sway — each strand is a separate `Rectangle` game object so it can be tweened individually via `rotation` tween (not a `Graphics` object; `scaleX` tweens on `Graphics` apply to the whole object from its origin and cannot animate individual drawn lines)
- **Note:** `SpiderBoss` draws its own central radial gameplay web in `create()`. The background cobwebs must be visually distinct: positioned in corners and along wall edges, not the screen center, to avoid conflating background decoration with the interactive gameplay web.

### DiceLichBoss — Necromantic Crypt
- **Sky/ground:** Stone tile floor (grid of 32×32 dark gray squares with darker border lines), black upper half
- **Midground:** Gothic arch silhouettes framing sides, wall torch brackets
- **Foreground:** Torch flame shapes (pixel triangles), floating magical rune symbols (text or graphics)
- **Animations:** Torch flicker (alpha + scaleY tween, yoyo); runes rotate slowly and pulse in/out

### BaronTypoBoss — Castle Throne Room
- **Sky/ground:** Stone brick wall texture (rows of offset rectangles), dark floor with tile lines
- **Midground:** Purple tapestry panels hanging from upper wall, tall candelabra silhouettes
- **Foreground:** Stained glass window silhouette at top center (colored pixel panels), candle flame tips
- **Animations:** Candle flicker (alpha tween, yoyo, fast); tapestry sway (rotation tween, small angle)

### FlashWordBoss — Ethereal Void
- **Sky/ground:** Pure black fill
- **Midground:** Floating arcane light rings of varying sizes (circle stroke graphics)
- **Foreground:** Drifting glowing glyphs (text objects with random placement)
- **Animations:** Glyphs drift upward and fade (y + alpha tween); rings expand outward and dissolve; rippling pulse from center

### AncientDragonBoss — Volcanic Dragon Lair
- **Sky/ground:** Dark ash-gray sky, black rocky ground with glowing orange cracks
- **Midground:** Black rock spires (irregular triangular shapes), lava river stripe across lower third
- **Foreground:** Molten floor cracks (thin orange/red lines), steam vent openings
- **Animations:** Lava river glow pulses via a semi-transparent orange overlay rectangle whose alpha tweens yoyo (Phaser 3 cannot tween `fillColor` on `Graphics` objects; use an alpha-animated overlay instead); ash particles float upward (time-spawned); steam puffs billow from vents

### ClockworkDragonBoss — Steampunk Workshop
- **Sky/ground:** Dark metal panel wall (grid pattern of charcoal squares with rivet dots at corners), metal floor
- **Midground:** Large gear silhouettes in background (circle with rectangular teeth), pipe network along walls
- **Foreground:** Gauge/dial details on walls, bolted panel borders
- **Animations:** Background gears rotate slowly (rotation tween, continuous); steam puffs emit from pipe joints (time-spawned alpha-fade circles)

### BoneKnightBoss — Cursed Graveyard
- **Sky/ground:** Dark stormy sky (near-black purple), patchy dead grass ground
- **Midground:** Tombstone silhouettes (rectangular with rounded tops, pixel-carved), gnarled leafless tree shapes
- **Foreground:** Ground fog layer (low semi-transparent rectangles)
- **Animations:** Fog rolls slowly (x tween); occasional lightning flash (white flash overlay alpha tween, triggered by timer)

### GrizzlefangBoss — Ancient Dark Forest
- **Sky/ground:** Deep blue-black sky, dark undergrowth ground strip
- **Midground:** Layered tree silhouettes at 3 depths (darkening toward back), dense canopy line
- **Foreground:** Ground bushes, single pale moonlight shaft (tall narrow semi-transparent white rectangle)
- **Animations:** Firefly particles drift in slow arcs (multiple tweened small yellow circles, looping paths)

### TypemancerBoss — Dimensional Void
- **Sky/ground:** Pure black
- **Midground:** Vertical columns of cascading glowing letters/runes (like letter rain), in green/purple
- **Foreground:** Energy rift cracks across the scene (jagged line shapes in cyan/white)
- **Animations:** Letter columns scroll downward (time-driven, new characters spawn at top, fade at bottom); rifts pulse (alpha tween); occasional burst of light from rift center

### MiniBossTypical — Three Variants

**Knuckle (knuckle_keeper_of_e) — Sunlit Forest Clearing**
- Bright blue sky, sunlit grass floor, tree border silhouettes framing edges
- Dappled light patches (semi-transparent yellow circles on ground)
- Animations: Floating light motes drift upward (small circles, slow y tween + alpha fade loop)

**Nessa (nessa_keeper_of_n) — Moonlit Glade**
- Deep navy sky, silver-tinted grass, large full moon near top center
- Misty blue-white tree silhouettes, faint starfield (small dots)
- Animations: Mist layer drifts (x tween); moon shimmer (faint alpha pulse)

**Rend (rend_the_red) — Volcanic Rock Arena**
- Red-tinted rocky sky, cracked dark stone floor
- Jagged rock outcrops framing sides, orange glow lines in floor cracks
- Animations: Embers/sparks rise from cracks (time-spawned); crack glow pulses (alpha tween)

**Fallback (unknown bossId) — Generic Arena**
- Dark stone arena floor, torch-lit walls, simple archway silhouette
- Torch flicker animation

---

## Layering and Depth

All background objects use Phaser's default depth (0). Boss sprites, HUD, and typing engine objects are added after the background call in each scene's `create()`, so they naturally render on top via draw order.

**Do not call `setDepth()` on any background object.** Assigning explicit depth values risks pushing background elements above HUD or gameplay objects if those objects also use default depth.

---

## Implementation Notes

- Use `scene.scale.width` / `scene.scale.height` throughout — never hardcoded pixel values.
- Pixel art texture: prefer `fillRect` calls with 2–8px block sizes over `fillCircle` or anti-aliased shapes, except for large smooth elements (moon, lava glow overlay).
- Time-driven particle emitters: use `scene.time.addEvent({ loop: true, delay: N, callback: spawnFn })`. Each spawned object (drip, ember, letter, etc.) must be destroyed when its animation completes — call `obj.destroy()` in the tween's `onComplete` callback. Also cap concurrent live particles (e.g. skip spawning if a local counter ≥ N) to prevent accumulation in long sessions.
- No new files needed beyond `bossBackgrounds.ts` and the 12 boss scene edits.
- No changes to types, data files, `BaseBossScene`, `BossBattleScene`, or tests.
- `bossId: 'grizzlefang'` appears in `world1.ts`, `world3.ts`, and `world5.ts` — all three map to `GrizzlefangBoss` and will use `drawDarkForestBg`. This is intentional: the same boss reappears in World 3, and the shared forest background is appropriate for both encounters.

---

## Files Changed

| File | Change |
|---|---|
| `src/utils/bossBackgrounds.ts` | **New** — all background drawing functions |
| `src/scenes/boss-types/SlimeKingBoss.ts` | Replace bg rect with `drawSlimeCaveBg(this)` |
| `src/scenes/boss-types/HydraBoss.ts` | Replace bg rect with `drawSwampBg(this)` |
| `src/scenes/boss-types/SpiderBoss.ts` | Replace bg rect with `drawWebCavernBg(this)` |
| `src/scenes/boss-types/DiceLichBoss.ts` | Replace bg rect with `drawCryptBg(this)` |
| `src/scenes/boss-types/BaronTypoBoss.ts` | Replace bg rect with `drawCastleThroneRoomBg(this)` |
| `src/scenes/boss-types/FlashWordBoss.ts` | Replace bg rect with `drawEtherealVoidBg(this)` |
| `src/scenes/boss-types/AncientDragonBoss.ts` | Replace bg rect with `drawVolcanicLairBg(this)` |
| `src/scenes/boss-types/ClockworkDragonBoss.ts` | Replace bg rect with `drawSteampunkWorkshopBg(this)` |
| `src/scenes/boss-types/BoneKnightBoss.ts` | Replace bg rect with `drawGraveyardBg(this)` |
| `src/scenes/boss-types/GrizzlefangBoss.ts` | Replace bg rect with `drawDarkForestBg(this)` |
| `src/scenes/boss-types/TypemancerBoss.ts` | Replace bg rect with `drawDigitalVoidBg(this)` |
| `src/scenes/boss-types/MiniBossTypical.ts` | Replace bg rect with `drawMiniBossBg(this, this.level.bossId ?? '')` |
