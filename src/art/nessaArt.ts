import Phaser from 'phaser'

/**
 * Nessa, Keeper of N — coiled cobra mini-boss.
 * Canvas: 18 × 22 pixel-art units at scale s=4 → 72 × 88 px.
 * 8-colour palette for discipline:
 *   DARK   darkest green / shadow / outlines
 *   BODY   main body fill
 *   MID    midtone / scale transitions
 *   LIGHT  highlights on head & coil
 *   BELLY  pale belly scales
 *   GOLD   crown prongs + slit eyes
 *   RED    forked tongue + ruby gem
 *   BLACK  pupils + hard outlines
 */
export function generateNessaTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('nessa_boss')) return

  const g = scene.add.graphics()
  const s = 4  // pixel-art scale: 4 px per unit

  const DARK  = 0x0d3018
  const BODY  = 0x185f2e
  const MID   = 0x267a40
  const LIGHT = 0x39a85a
  const BELLY = 0xb8d97a
  const GOLD  = 0xffca28
  const RED   = 0xbb1111
  const BLACK = 0x070c07

  const W = 18 * s  // 72 px
  const H = 22 * s  // 88 px

  // ─── COBRA HOOD (drawn first — behind head) ────────────
  g.fillStyle(BODY)
  g.fillRect(2 * s, 4 * s, 3 * s, 4 * s)   // left lobe
  g.fillRect(13 * s, 4 * s, 3 * s, 4 * s)  // right lobe

  // Inner lighter ring on each hood lobe (creates depth)
  g.fillStyle(MID)
  g.fillRect(2 * s, 5 * s, 2 * s, 2 * s)
  g.fillRect(14 * s, 5 * s, 2 * s, 2 * s)

  // Eye-spot pattern on hood lobes (classic cobra marking)
  g.fillStyle(DARK)
  g.fillRect(2 * s, 5 * s, s, s)    // top-left of left spot
  g.fillRect(3 * s, 6 * s, s, s)    // bot-right of left spot
  g.fillRect(15 * s, 5 * s, s, s)   // top-right of right spot
  g.fillRect(14 * s, 6 * s, s, s)   // bot-left of right spot

  // ─── NECK ─────────────────────────────────────────────
  g.fillStyle(BODY)
  g.fillRect(8 * s, 9 * s, 2 * s, 4 * s)

  // Scale lines on neck (dithered horizontal bands)
  g.fillStyle(DARK)
  g.fillRect(8 * s, 10 * s, 2 * s, 1)
  g.fillRect(8 * s, 12 * s, 2 * s, 1)

  // ─── COILED BODY ──────────────────────────────────────
  // Two distinct windings separated by a dark groove so it reads
  // as an actual snake body looping around itself, not a bullseye.
  //
  // Build up in layers (each layer paints over the previous):
  //   A  outer fill  (BODY, 15×10 units)
  //   B  carve out   (dark, 11×7)   ← leaves outer ring of BODY visible
  //   C  inner fill  (MID,  8×5)    ← inner winding sits inside the groove
  //   D  carve out   (dark, 4×3)    ← leaves inner ring of MID visible
  //   E  belly patch (BELLY, 3×2)
  //
  // Groove width at equator: (B_w - C_w) / 2 = (44 - 32) / 2 = 6 px — clear!

  // A — outer winding fill
  g.fillStyle(BODY)
  g.fillEllipse(9 * s, 17 * s, 15 * s, 10 * s)

  // B — dark carve: removes inner area of outer winding, exposes groove
  g.fillStyle(0x0c1a0c)
  g.fillEllipse(9 * s, 17 * s, 11 * s, 7 * s)

  // C — inner winding fill (slightly lighter shade for depth/separation)
  g.fillStyle(MID)
  g.fillEllipse(9 * s, 17 * s, 8 * s, 5 * s)

  // D — dark carve: removes centre of inner winding
  g.fillStyle(0x0c1a0c)
  g.fillEllipse(9 * s, 17 * s, 4 * s, 3 * s)

  // Tail tip curling inside the hollow (drawn before belly so belly sits on top)
  g.fillStyle(MID)
  g.fillRect(9 * s - 2 * s, 17 * s - s, 3 * s, s)  // horizontal tail segment
  g.fillStyle(DARK)
  g.fillRect(9 * s + s, 17 * s - s, s, s)           // rattle tip

  // E — belly patch in the very centre
  g.fillStyle(BELLY)
  g.fillEllipse(9 * s, 17 * s, 3 * s, 2 * s)

  // Scale texture — horizontal dark bands mark every scale row across both rings.
  // Lines on the dark carved areas are invisible; on green body they show as texture.
  g.fillStyle(DARK)
  g.fillRect(s, 14 * s, 16 * s, 1)
  g.fillRect(s, 16 * s, 16 * s, 1)
  g.fillRect(s, 18 * s, 16 * s, 1)
  g.fillRect(s, 20 * s, 16 * s, 1)

  // Short vertical ticks between rows — alternating offset creates a
  // brick/scale pattern rather than plain stripes.
  for (let i = 2; i <= 16; i += 2) {
    g.fillRect(i * s,           15 * s, 1, s)   // ticks on row 1→2
    g.fillRect(i * s + s / 2,   17 * s, 1, s)   // offset: row 2→3
    g.fillRect(i * s,           19 * s, 1, s)   // ticks on row 3→4
  }

  // ─── HEAD (drawn over hood) ────────────────────────────
  g.fillStyle(LIGHT)
  g.fillRect(6 * s, 3 * s, 6 * s, 5 * s)  // core head
  g.fillRect(5 * s, 4 * s, s, 3 * s)       // left rounded edge
  g.fillRect(12 * s, 4 * s, s, 3 * s)      // right rounded edge

  // Top cap slightly darker (implied curvature)
  g.fillStyle(MID)
  g.fillRect(6 * s, 3 * s, 6 * s, s)

  // Lower jaw / chin band
  g.fillStyle(MID)
  g.fillRect(7 * s, 7 * s, 4 * s, s)

  // ─── CROWN (Keeper of N) ──────────────────────────────
  g.fillStyle(GOLD)
  g.fillRect(6 * s, 0, s, 2 * s)       // left prong
  g.fillRect(8 * s, 0, 2 * s, 3 * s)   // centre prong (tallest)
  g.fillRect(11 * s, 0, s, 2 * s)      // right prong
  g.fillRect(6 * s, 2 * s, 6 * s, s)   // crown base bar

  g.fillStyle(RED)
  g.fillRect(9 * s, 0, s, s)           // ruby gem in centre prong

  // ─── EYES (gold slit) ─────────────────────────────────
  g.fillStyle(GOLD)
  g.fillRect(6 * s, 4 * s, 2 * s, 2 * s)   // left eye
  g.fillRect(10 * s, 4 * s, 2 * s, 2 * s)  // right eye

  // Vertical slit pupils (2 actual pixels wide, centred in 8px eye)
  g.fillStyle(BLACK)
  g.fillRect(7 * s - 1, 4 * s, 2, 2 * s)   // left slit
  g.fillRect(11 * s - 1, 4 * s, 2, 2 * s)  // right slit

  // ─── NOSTRIL DOTS ─────────────────────────────────────
  g.fillStyle(DARK)
  g.fillRect(8 * s, 7 * s, 2, 2)       // left nostril
  g.fillRect(10 * s - 2, 7 * s, 2, 2)  // right nostril

  // ─── FORKED TONGUE (drawn last — on top of neck) ───────
  g.fillStyle(RED)
  g.fillRect(8 * s, 8 * s, 2 * s, s)   // tongue base (sticking out from jaw)
  g.fillRect(7 * s, 9 * s, s, s)        // left fork tip
  g.fillRect(10 * s, 9 * s, s, s)       // right fork tip

  // ─── OUTLINES (selective — head and hood only) ─────────
  g.lineStyle(1, BLACK, 0.85)
  g.strokeRect(6 * s, 3 * s, 6 * s, 5 * s)   // head
  g.strokeRect(2 * s, 4 * s, 3 * s, 4 * s)   // left hood
  g.strokeRect(13 * s, 4 * s, 3 * s, 4 * s)  // right hood
  g.strokeRect(6 * s, 2 * s, 6 * s, s)        // crown base

  g.generateTexture('nessa_boss', W, H)
  g.destroy()
}
