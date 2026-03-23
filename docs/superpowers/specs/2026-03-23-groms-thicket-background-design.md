# Grom's Thicket Background Redesign

**Date:** 2026-03-23
**Scope:** Replace `drawForestClearingBg` in `src/utils/bossBackgrounds.ts` with a richer, more thematically charged background for the `knuckle_keeper_of_e` mini-boss encounter.
**File changed:** `src/utils/bossBackgrounds.ts` (function `drawForestClearingBg` only)

---

## Goals

- **Thematic identity**: The background should feel unmistakably like Grom's Thicket — an ancient, hostile, watching forest. Not a generic clearing.
- **Visual density**: Multiple depth layers, varied detail at every distance, ambient life in every corner.
- **Consistency**: Techniques borrowed directly from the two best existing backgrounds — `GoblinWhackerLevel` and `DungeonPlatformerLevel`.

---

## Mood

Dangerous. Ancient. The forest is alive — and it is watching the player. Dense canopy presses in. The only light is a sickly green shaft that barely reaches the ground. Eyes blink in the darkness. Fog rolls across the roots. This is Knuckle's domain.

---

## Layer Stack (back → front, depth order)

| # | Layer | Description |
|---|-------|-------------|
| 1 | **Sky** | 4-band stacked-rect gradient (technique from GoblinWhackerLevel). Near-black at top `#050c03` → deep forest green `#102808` at horizon. Occupies top 58% of screen height. |
| 2 | **Canopy overhang** | Irregular silhouette drooping from top edges. Left overhang covers ~42% of width, right ~48%. Outline uses two additive `Math.sin()` terms — `Math.sin(x * 0.06) + Math.sin(x * 0.13)` — for organic, non-uniform edge. Color `#0d1e0b`. |
| 3 | **Far tree layer** | Trees every 28px across full width. Heights sin-varied (`55 + sin(x*0.09)*25 + sin(x*0.21)*12`). Color `#0f2810`. Extends from horizon into ground. |
| 4 | **Mid tree layer** | Trees every 42px, offset 8px from far layer. Heights sin-varied. Each tree includes 2 branch forks (short `fillRect` extensions). Color `#0a1e08`. |
| 5 | **Foreground trunk columns** | 6 thick trunk columns per side (16px spacing). Branches cross inward on first 3 columns. These frame the scene and create the "forest closing in" effect. Color `#060e04`. |
| 6 | **Ground** | 4-band gradient ground. `#1a2e0c` at surface → `#091504` at bottom. Gnarled exposed roots drawn as quadratic bezier curves from foreground tree bases across the floor (5 roots total). |
| 7 | **Sickly light shaft** | Trapezoid shape, center of screen, blended with horizontal linear gradient (transparent edges, semi-opaque center). Alpha pulses 0.06 ↔ 0.15 via looping tween. |
| 8 | **Fog layers × 3** | Three wide `Rectangle` objects at y=56%, 63%, 69% screen height. Alpha 0.28 / 0.20 / 0.15. Each drifts horizontally at a different speed and direction (looping yoyo tweens: 7000ms, 5500ms, 9000ms). Opposite-phase on alternating layers for natural roll. |
| 9 | **Green motes** | Recycled pool of 12 `Graphics` circles. Green-tinted (`#66ff44`, glow shadow). Spawn at random x within the center clearing (between the foreground trunk columns, roughly x=100 to x=width-100), at ground-fog height. Drift upward ~80px with slight x-wander, fade alpha to 0. On complete: reset position to a new random point in the same zone rather than destroy (DungeonPlatformer technique). Timer interval: 600ms. |
| 10 | **Watching eyes** | 3 pairs of ellipse eyes embedded in the foreground tree columns at different x/y positions. Each eye pair: oval whites `#99ff66` with green glow shadow, black pupils. Blink animation: tween alpha 0→1 (200ms appear), hold 2–4s, tween alpha 1→0 (400ms vanish), then random delay 3–8s before repeating. Each pair runs an independent timer with staggered initial delay. |

---

## Animations

| Element | Tween / Timer | Parameters |
|---------|--------------|------------|
| Light shaft | Tween, looping | `alpha: 0.06 ↔ 0.15`, 4000ms, `Sine.easeInOut`, yoyo, repeat -1 |
| Fog layer 1 | Tween, looping | `x: -40 ↔ +40` offset, 7000ms, `Sine.easeInOut`, yoyo, repeat -1 |
| Fog layer 2 | Tween, looping | `x: +30 ↔ -30` offset (opposite phase), 5500ms, `Sine.easeInOut`, yoyo, repeat -1 |
| Fog layer 3 | Tween, looping | `x: -60 ↔ +20` offset, 9000ms, `Sine.easeInOut`, yoyo, repeat -1 |
| Green motes | Timer + tween | 600ms spawn interval, max 12 alive, 3000–5000ms drift, `Sine.easeInOut` |
| Eye pair blink | Timer + tween chain | Appear 200ms, hold 2–4s, vanish 400ms, delay 3–8s, repeat. Staggered start delays per pair. |
| Branch sway | Tween, looping | 4 branch `Graphics` objects — the innermost branch of each of the first 2 foreground columns on each side — created as **separate** `scene.add.graphics()` instances (not drawn into the static base), `angle: -3° ↔ +3°`, 2500–3500ms, `Sine.easeInOut`, yoyo, repeat -1, staggered delays |

---

## Technique References

- **4-band gradient sky/ground**: Directly mirrors `GoblinWhackerLevel.ts` — stacked `fillRect` calls simulate a gradient without canvas gradients.
- **Sin-varied tree heights**: Directly mirrors `GoblinWhackerLevel.ts` — `Math.sin(x * freq)` for organic non-uniform silhouettes.
- **Recycled mote pool**: Mirrors `DungeonPlatformerLevel.ts` dust particles — objects are repositioned on completion, never destroyed mid-scene.
- **Organic tween easing**: All tweens use `Sine.easeInOut` for natural, non-robotic motion (DungeonPlatformer standard).
- **Careful z-depth**: Static drawn layers (Graphics) at low depth, animated objects (fog rects, motes, eyes) added to scene at incrementally higher depths to prevent z-fighting.

---

## Constraints

- No new asset files — everything drawn procedurally with `Phaser.GameObjects.Graphics` and `scene.add.graphics()`.
- No changes to `MiniBossTypical.ts` or any scene outside `bossBackgrounds.ts`.
- The function signature `drawForestClearingBg(scene: Phaser.Scene): void` is unchanged — only the implementation is replaced.
- All animation timers must be non-blocking (use `scene.time.addEvent` and `scene.tweens.add`, not `setInterval`).
- Performance: all static layers (sky, trees, ground, roots) drawn into a **single persistent `Graphics` object** that remains in the scene — do NOT call `g.destroy()` on it, as that removes the visual. Animated objects (fog rects, motes, eyes, branches) are separate `scene.add.graphics()` or `scene.add.rectangle()` instances that Phaser's tween system updates (GPU-accelerated).

---

## Success Criteria

- The background is visually distinguishable from every other boss background in the game.
- It clearly communicates "dangerous ancient forest" before the player reads any text.
- The eyes, fog, and motes create constant peripheral motion without distracting from the typing area.
- No measurable frame rate impact on a mid-range device.
