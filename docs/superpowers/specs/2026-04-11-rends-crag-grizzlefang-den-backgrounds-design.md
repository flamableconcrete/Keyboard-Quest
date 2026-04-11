# Rend's Crag & Grizzlefang's Den Background Overhaul

**Date:** 2026-04-11
**Issue:** [#94](https://github.com/flamableconcrete/Keyboard-Quest/issues/94) — Unique epic pixel-art backgrounds for every boss/mini-boss
**Scope:** World 1 — Rend's Crag (`rend_the_red`) and Grizzlefang's Den (`grizzlefang`)
**Not in scope:** Knuckle's Thicket and Nessa's Coil (already approved)

---

## Background

Both backgrounds live in `src/utils/bossBackgrounds.ts`:

- `drawVolcanicArenaBg` — currently used for Rend's Crag via `miniBossVariants['rend_the_red']`. ~70 lines, very bare-bones: flat red sky, 6 simple rocks, cracked floor, one pulsing glow rect, embers. Well below the quality bar of `drawMoonlitGladeBg` / `drawForestClearingBg`.
- `drawDarkForestBg` — used for Grizzlefang's Den directly in `GrizzlefangBoss.ts`. ~175 lines, structurally complete (blood moon, multi-layer trees, fog, fireflies, glowing eyes) but the entire palette is near-black (`0x04050a`, `0x030406`, etc.) making all detail invisible in practice.

---

## Rend's Crag — Full Overhaul (`drawVolcanicCragBg`)

Replace the body of `drawVolcanicArenaBg` with the new implementation and rename it `drawVolcanicCragBg`. Update `miniBossVariants['rend_the_red']` to reference `drawVolcanicCragBg`. (The old function is private and only used via `miniBossVariants`, so it is safe to rename in place.)

### Scene Composition

**Sky (top 55%):**
- 5-band gradient from `#0d0202` (top) → `#3d0404` (horizon) — deep red that actually reads as red
- 2–3 horizontal ash-cloud bands breaking up the sky (dark semi-opaque rects)
- Single distant volcano silhouette at the horizon center: dark triangle shape with a faint orange glow at the peak (animated brightness pulse)

**Obsidian spire clusters (left and right flanks):**
- 3–4 spires per side, pixel-art triangles (`fillTriangle`) in `#0e0202` / `#110303`
- Taller spires behind, shorter in front — depth layering
- Inner edges (facing center) get a thin 1–2px highlight in `#cc3300` to read against the dark background

**Lava floor (bottom 30%):**
- Base fill: `#0e0202` (very dark cracked rock)
- Primary crack network: 3–4 long horizontal cracks in `#ff4400` (bright, vivid)
- Secondary crack web: shorter diagonal/branching cracks in `#ff6600` and `#ffaa00`
- Animated: wide ground-bloom rectangle pulsing between `alpha 0.12` and `alpha 0.22` in orange-red
- Animated: thin crack-light lines oscillating alpha independently

**Particles — embers (animated):**
- Pool of up to 16 ember rectangles (3×3 px), color `#ff6600` / `#ffaa00`
- Spawn at floor level, float upward and drift sideways, fade out over 1.5–2.5s
- Spawned on a `time.addEvent` loop at ~300ms interval

**Atmosphere:**
- Distant fire column: tall thin rectangle behind the volcano silhouette, animated brightness (`alpha 0.3 → 0.7`, 2s yoyo)
- Heat-haze: full-width rectangle at `alpha 0.04 → 0.08`, very slow 6s yoyo — subtle shimmer

### Palette

| Element | Color |
|---|---|
| Sky top | `#0d0202` |
| Sky horizon | `#3d0404` |
| Obsidian spires | `#0e0202` / `#110303` |
| Spire edge highlight | `#cc3300` |
| Rock floor base | `#0e0202` |
| Primary lava cracks | `#ff4400` |
| Secondary cracks | `#ff6600` |
| Bright crack tips | `#ffaa00` |
| Ground bloom | `#ff4400` (alpha 0.12–0.22) |
| Embers | `#ff6600` / `#ffaa00` |

---

## Grizzlefang's Den — Palette Overhaul (`drawDarkForestBg`)

Keep the full structure of `drawDarkForestBg` unchanged. Only update color values throughout.

### What Stays the Same

- 4-band sky gradient (structure)
- Blood moon with cloud occlusion (structure)
- Far tree layer (sine-varied)
- Mid tree layer
- Foreground trunk columns with branch stubs
- 4-band ground gradient
- Undergrowth tufts + exposed root lines
- Blood moon light shaft (tweened)
- 3 ground fog layers (tweened drift)
- Firefly pool (10 fireflies, recycled)
- 3 glowing eye pairs (scheduled blink)

### Color Changes

**Sky:**
- Was: `0x04050a` → `0x090b18` (near-black to dark blue)
- Now: `0x160806` → `0x2a1008` (warm dark red-brown)

**Blood moon:**
- Was: `0x440000` outer / `0xcc6622` core
- Now: `0x882200` outer / `0xff8844` core, glow at `#cc2200` (visibly glowing)
- Cloud occlusion color: `0x1e0c0a` (match new sky)

**Far tree layer:**
- Was: `0x040608` (near-black)
- Now: `0x160804` (dark warm brown — reads as shapes)

**Mid tree layer:**
- Was: `0x060a0e`
- Now: `0x1a0a04`

**Foreground trunks:**
- Was: `0x030406`
- Now: `0x0c0402`

**Ground gradient:**
- Was: `0x060908` → `0x020403`
- Now: `0x1c0a06` → `0x0c0402`

**Undergrowth tufts:**
- Was: `0x060a08`
- Now: `0x180a04`

**Root lines:**
- Was: `0x030604`
- Now: `0x0e0602`

**Moon shaft:**
- Was: `0xaa3300` (alpha 0.06–0.11)
- Now: `0xcc3300` (alpha 0.10–0.18) — noticeably brighter

**Fog layers:**
- Was: `0x0a1408` / `0x080e06` / `0x060c05` (greenish near-black)
- Now: `0x280c06` / `0x1e0804` / `0x180604` (warm red-tinged)

**Fireflies:**
- Was: `0xffff88` (cold pale yellow)
- Now: `0xffcc44` (warm amber)

**Glowing eyes:**
- Was: `0xff4400` (orange-red, alpha 0.9)
- Now: `0xff3300` (brighter red), increase glow by drawing a slightly larger outer ellipse at lower alpha

---

## File Changes

| File | Change |
|---|---|
| `src/utils/bossBackgrounds.ts` | Add `drawVolcanicCragBg`, update `miniBossVariants['rend_the_red']` to point to it; update all color values in `drawDarkForestBg` |

No changes needed to `GrizzlefangBoss.ts`, `MiniBossTypical.ts`, or level configs.

---

## Acceptance Criteria

- Rend's Crag has a visually distinct volcanic crag scene: obsidian spires, vivid lava crack floor, animated embers and fire column
- All lava/fire elements use bright saturated reds/oranges (not muted)
- Grizzlefang's Den retains all existing animations and structure; every element is clearly visible against its background
- Both backgrounds match the pixel-art aesthetic of `drawMoonlitGladeBg` and `drawForestClearingBg`
