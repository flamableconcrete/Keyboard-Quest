import Phaser from 'phaser'

export function drawSlimeCaveBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Base cave fill
  g.fillStyle(0x0a0a0e)
  g.fillRect(0, 0, width, height)

  // Rocky ceiling (top 20%) with pixel variation
  g.fillStyle(0x111118)
  g.fillRect(0, 0, width, height * 0.2)
  g.fillStyle(0x0d0d15)
  for (let x = 0; x < width; x += 48) {
    const rockH = 16 + (Math.sin(x * 0.08) * 12 + 12)
    g.fillRect(x, 0, 44, rockH)
  }

  // Stalactites
  const stalactiteXs = [70, 190, 310, 430, 560, 690, 820, 950, 1080, 1190]
  for (const sx of stalactiteXs) {
    const sh = 44 + ((sx * 7) % 56)
    g.fillStyle(0x1c1c2a)
    g.fillRect(sx - 7, 0, 14, sh)
    g.fillRect(sx - 4, sh, 8, 10)
    g.fillRect(sx - 2, sh + 10, 4, 6)
    // Slime drip trail (static)
    g.fillStyle(0x0f3a0f)
    g.fillRect(sx - 2, sh + 4, 4, 28 + ((sx * 5) % 24))
  }

  // Wet walls
  g.fillStyle(0x141420)
  g.fillRect(0, 0, 44, height)
  g.fillRect(width - 44, 0, 44, height)
  g.fillStyle(0x1a4a1a)
  for (let y = 80; y < height * 0.75; y += 90) {
    g.fillRect(10, y, 6, 50)
    g.fillRect(width - 16, y + 30, 6, 50)
  }

  // Stone floor (bottom 25%)
  g.fillStyle(0x0e0e14)
  g.fillRect(0, height * 0.75, width, height * 0.25)
  g.fillStyle(0x0a0a10)
  g.fillRect(80, height * 0.77, 220, 2)
  g.fillRect(420, height * 0.80, 160, 2)
  g.fillRect(730, height * 0.77, 200, 2)
  g.fillRect(1000, height * 0.82, 140, 2)

  // Slime pools (static base)
  const pools: Array<{ x: number; y: number; w: number; h: number }> = [
    { x: 110, y: height * 0.82, w: 90, h: 18 },
    { x: 490, y: height * 0.85, w: 130, h: 22 },
    { x: 820, y: height * 0.80, w: 70, h: 14 },
    { x: 1020, y: height * 0.87, w: 100, h: 18 },
  ]
  for (const p of pools) {
    g.fillStyle(0x0a2a0a)
    g.fillRect(p.x, p.y, p.w, p.h)
    g.fillStyle(0x195019)
    g.fillRect(p.x + 4, p.y + 3, p.w - 8, 5)
  }
  g.destroy()

  // Pool shimmer (tweened rectangles)
  for (let i = 0; i < pools.length; i++) {
    const p = pools[i]
    const shimmer = scene.add.rectangle(
      p.x + p.w / 2, p.y + p.h / 2,
      p.w - 8, 6,
      0x33ff33, 0.25
    )
    scene.tweens.add({
      targets: shimmer,
      alpha: 0.55,
      duration: 1100 + i * 280,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // Animated slime drips
  const stalactiteXsCopy = [...stalactiteXs]
  let dripsAlive = 0
  const MAX_DRIPS = 8
  scene.time.addEvent({
    delay: 550,
    loop: true,
    callback: () => {
      if (dripsAlive >= MAX_DRIPS) return
      const sx = stalactiteXsCopy[Math.floor(Math.random() * stalactiteXsCopy.length)]
      const sh = 44 + ((sx * 7) % 56)
      const startY = sh + 32
      const drip = scene.add.rectangle(sx, startY, 4, 10, 0x22cc22, 0.85)
      dripsAlive++
      scene.tweens.add({
        targets: drip,
        y: startY + 130,
        alpha: 0,
        duration: 1400,
        ease: 'Quad.easeIn',
        onComplete: () => { drip.destroy(); dripsAlive-- },
      })
    },
  })
}
export function drawSwampBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale

  // ── Static base — persistent Graphics object (do NOT destroy) ───────────────
  const g = scene.add.graphics()

  // Layer 1: Murky sky — 5-band sickly-green gradient
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.12, 0x030804],
    [height * 0.12, height * 0.25, 0x060e06],
    [height * 0.25, height * 0.40, 0x091408],
    [height * 0.40, height * 0.52, 0x0c1a0a],
    [height * 0.52, height * 0.60, 0x0f2010],
  ]
  for (const [y1, y2, color] of skySections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }

  // Layer 2: Far dead tree silhouettes — sine-varied heights
  g.fillStyle(0x040904)
  for (let x = 0; x < width; x += 52) {
    const th = 100 + Math.sin(x * 0.07) * 35 + Math.sin(x * 0.17) * 18
    g.fillRect(x - 6,  height * 0.57 - th, 12, th)
    g.fillRect(x - 28, height * 0.57 - th + 18, 56, 4)
    g.fillRect(x - 18, height * 0.57 - th + 36, 36, 3)
  }

  // Layer 3: Mid mangrove trees — wider, with root tendrils
  g.fillStyle(0x030703)
  const mangroves = [70, 180, 310, 470, 640, 800, 950, 1090, 1210]
  for (const mx of mangroves) {
    const mh = 140 + ((mx * 3) % 60)
    const baseY = height * 0.60
    g.fillRect(mx - 9, baseY - mh, 18, mh)
    g.fillRect(mx - 38, baseY - mh + 22, 76, 5)
    g.fillRect(mx - 26, baseY - mh + 44, 52, 4)
    g.fillRect(mx + 10, baseY - mh + 33, 34, 3)
    g.fillRect(mx - 44, baseY - mh + 33, 26, 3)
    // Root tendrils into water
    g.fillRect(mx - 14, baseY - 24, 4, 28)
    g.fillRect(mx - 6,  baseY - 18, 3, 22)
    g.fillRect(mx + 8,  baseY - 20, 4, 24)
    g.fillRect(mx + 16, baseY - 16, 3, 20)
  }

  // Layer 4: Water surface — 4-band gradient (dark → murky green)
  const waterSections: Array<[number, number, number]> = [
    [height * 0.60, height * 0.70, 0x060e06],
    [height * 0.70, height * 0.80, 0x050c05],
    [height * 0.80, height * 0.90, 0x040a04],
    [height * 0.90, height,        0x030803],
  ]
  for (const [y1, y2, color] of waterSections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }
  // Water shimmer lines
  g.fillStyle(0x0a1a0a)
  for (let wy = height * 0.62; wy < height; wy += 20) {
    g.fillRect(18, wy, width - 36, 2)
  }

  // Lily pads — 7 pads, varied sizes
  const lilies = [
    { x: 130, y: height * 0.68, r: 18 },
    { x: 310, y: height * 0.72, r: 22 },
    { x: 490, y: height * 0.66, r: 16 },
    { x: 680, y: height * 0.74, r: 24 },
    { x: 860, y: height * 0.67, r: 19 },
    { x: 1020, y: height * 0.71, r: 21 },
    { x: 1170, y: height * 0.69, r: 17 },
  ]
  for (const lily of lilies) {
    const r = lily.r
    g.fillStyle(0x1a4a1a)
    g.fillRect(lily.x - r, lily.y - r / 2, r * 2, r)
    g.fillRect(lily.x - r / 2, lily.y - r, r, r * 2)
    g.fillStyle(0x060e06)
    g.fillRect(lily.x - 2, lily.y - r, 4, r + 2)  // notch
    g.fillStyle(0xddcc88)
    g.fillRect(lily.x - 2, lily.y - 2, 4, 4)  // flower
  }

  // Hydra neck silhouettes — 4 serpent necks breaking the surface
  g.fillStyle(0x020502)
  const necks = [
    { x: 250, baseY: height * 0.68, h: 55, lean: -8 },
    { x: 550, baseY: height * 0.65, h: 75, lean: 5 },
    { x: 820, baseY: height * 0.70, h: 60, lean: -4 },
    { x: 1060, baseY: height * 0.67, h: 65, lean: 6 },
  ]
  for (const nk of necks) {
    g.fillRect(nk.x + nk.lean - 9, nk.baseY - nk.h, 18, nk.h)  // neck
    g.fillRect(nk.x + nk.lean - 14, nk.baseY - nk.h - 8, 28, 10)  // head base
    g.fillRect(nk.x + nk.lean - 10, nk.baseY - nk.h - 16, 20, 10)  // snout
    // Eyes (toxic yellow)
    g.fillStyle(0x223300)
    g.fillRect(nk.x + nk.lean - 8, nk.baseY - nk.h - 12, 3, 3)
    g.fillRect(nk.x + nk.lean + 5, nk.baseY - nk.h - 12, 3, 3)
    g.fillStyle(0x020502)
  }

  // Surface debris
  g.fillStyle(0x080e08)
  const debris: Array<[number, number]> = [
    [200, height * 0.65], [570, height * 0.73], [840, height * 0.66], [1050, height * 0.71],
  ]
  for (const [dx, dy] of debris) {
    g.fillRect(dx, dy, 22, 7)
    g.fillRect(dx + 4, dy - 4, 14, 5)
  }

  // ── Fog layers × 3 ──────────────────────────────────────────────────────────
  const fog1 = scene.add.rectangle(width / 2,       height * 0.61, width + 200, 50, 0x1a3a1a, 1)
  const fog2 = scene.add.rectangle(width / 2 + 25,  height * 0.65, width + 200, 36, 0x122a12, 1)
  const fog3 = scene.add.rectangle(width / 2 - 15,  height * 0.70, width * 0.85, 26, 0x0e220e, 1)
  fog1.setAlpha(0.20); fog2.setAlpha(0.16); fog3.setAlpha(0.12)
  scene.tweens.add({ targets: fog1, x: width / 2 + 50,  duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog2, x: width / 2 - 40,  duration: 7000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog3, x: width / 2 + 65,  duration: 9500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  // ── Water ripple pool (5 ripples, recycled) ──────────────────────────────────
  const MAX_RIPPLES = 5
  const ripples: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_RIPPLES }, () => {
    const rg = scene.add.graphics()
    rg.lineStyle(1, 0x1a4a1a, 1)
    rg.strokeEllipse(0, 0, 24, 10)
    rg.setAlpha(0)
    return rg
  })
  const launchRipple = (index: number): void => {
    const rg = ripples[index]
    rg.setPosition(80 + Math.random() * (width - 160), height * 0.63 + Math.random() * (height * 0.26))
    rg.setScale(1).setAlpha(0.5)
    scene.tweens.add({
      targets: rg,
      scaleX: 3.5, scaleY: 3.5, alpha: 0,
      duration: 2000,
      ease: 'Quad.easeOut',
      onComplete: () => { scene.time.delayedCall(800 + Math.random() * 1200, () => launchRipple(index)) },
    })
  }
  for (let i = 0; i < MAX_RIPPLES; i++) scene.time.delayedCall(i * 1300, () => launchRipple(i))

  // ── Bubble pool (12 bubbles, recycled) ──────────────────────────────────────
  const MAX_BUBBLES = 12
  const bubbles: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_BUBBLES }, () => {
    const bg = scene.add.graphics()
    bg.lineStyle(1, 0x226622, 1)
    bg.strokeCircle(0, 0, 3 + Math.floor(Math.random() * 3))
    bg.setAlpha(0)
    return bg
  })
  const launchBubble = (index: number): void => {
    const bg = bubbles[index]
    const bx = 50 + Math.random() * (width - 100)
    const by = height * 0.80 + Math.random() * (height * 0.15)
    bg.setPosition(bx, by).setAlpha(0.55)
    scene.tweens.add({
      targets: bg,
      y: height * 0.60 + Math.random() * (height * 0.05),
      alpha: 0,
      duration: 2500 + Math.random() * 2000,
      ease: 'Linear',
      onComplete: () => { scene.time.delayedCall(Math.random() * 1500 + 400, () => launchBubble(index)) },
    })
  }
  for (let i = 0; i < MAX_BUBBLES; i++) scene.time.delayedCall(i * 350, () => launchBubble(i))
}
export function drawWebCavernBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Black cave fill
  g.fillStyle(0x06060e)
  g.fillRect(0, 0, width, height)

  // Stone wall texture (pixel dots)
  g.fillStyle(0x0c0c18)
  for (let x = 0; x < width; x += 64) {
    for (let y = 0; y < height; y += 64) {
      g.fillRect(x + 8, y + 8, 4, 4)
      g.fillRect(x + 36, y + 28, 4, 4)
      g.fillRect(x + 52, y + 48, 4, 4)
      g.fillRect(x + 20, y + 52, 4, 4)
    }
  }

  // Wall outlines (sides)
  g.fillStyle(0x0e0e1c)
  g.fillRect(0, 0, 56, height)
  g.fillRect(width - 56, 0, 56, height)

  // Corner cobwebs — top-left
  g.fillStyle(0x1a1a2a)
  for (let i = 1; i <= 7; i++) {
    const span = i * 28
    g.fillRect(0, span, span, 1)   // horizontal strand
    g.fillRect(span, 0, 1, span)   // vertical strand
    // diagonal strands
    g.fillRect(0, 0, i * 14, 1)
    g.fillRect(0, 0, 1, i * 14)
  }
  // Top-right corner
  for (let i = 1; i <= 7; i++) {
    const span = i * 28
    g.fillRect(width - span, span, span, 1)
    g.fillRect(width - span - 1, 0, 1, span)
  }
  // Bottom-left corner
  for (let i = 1; i <= 5; i++) {
    const span = i * 24
    g.fillRect(0, height - span, span, 1)
    g.fillRect(span, height - span, 1, span)
  }

  // Mid-wall web clusters (left and right wall edges only)
  g.fillStyle(0x181828)
  const midWebL = { x: 40, y: height * 0.45 }
  const midWebR = { x: width - 40, y: height * 0.5 }
  for (let r = 20; r <= 100; r += 20) {
    g.fillRect(midWebL.x - r, midWebL.y, r * 2, 1)
    g.fillRect(midWebL.x, midWebL.y - r, 1, r * 2)
  }
  for (let r = 20; r <= 80; r += 20) {
    g.fillRect(midWebR.x - r, midWebR.y, r * 2, 1)
    g.fillRect(midWebR.x, midWebR.y - r, 1, r * 2)
  }
  g.destroy()

  // Egg sacs — glowing blue circles
  const eggs = [
    { x: 160, y: height * 0.15 },
    { x: width - 180, y: height * 0.12 },
    { x: 90, y: height * 0.35 },
    { x: width - 100, y: height * 0.38 },
    { x: 260, y: height * 0.08 },
  ]
  for (const egg of eggs) {
    const eg = scene.add.graphics()
    eg.fillStyle(0x334488, 0.7)
    eg.fillCircle(0, 0, 12)
    eg.fillStyle(0x6688cc, 0.4)
    eg.fillCircle(-3, -3, 5)
    eg.x = egg.x; eg.y = egg.y
    scene.tweens.add({
      targets: eg,
      alpha: 0.4,
      duration: 1600 + Math.random() * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // Web strand sway — corner strands as individual Rectangle objects
  const strandData = [
    { x: 100, y: 80, w: 120, h: 2, angle: -20 },
    { x: width - 110, y: 70, w: 110, h: 2, angle: 25 },
    { x: 60, y: 200, w: 90, h: 2, angle: -35 },
    { x: width - 70, y: 220, w: 90, h: 2, angle: 30 },
  ]
  for (const sd of strandData) {
    const strand = scene.add.rectangle(sd.x, sd.y, sd.w, sd.h, 0x2a2a44, 0.6)
    strand.angle = sd.angle
    scene.tweens.add({
      targets: strand,
      angle: sd.angle + 6,
      duration: 2400 + Math.random() * 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // Crawling spiders
  let spidersAlive = 0
  const MAX_SPIDERS = 3
  scene.time.addEvent({
    delay: 3000,
    loop: true,
    callback: () => {
      if (spidersAlive >= MAX_SPIDERS) return
      // Spawn on wall edges, crawl across
      const startLeft = Math.random() < 0.5
      const startX = startLeft ? 20 : width - 20
      const endX = startLeft ? 180 : width - 180
      const sy = 50 + Math.random() * (height * 0.3)
      const spider = scene.add.graphics()
      spider.fillStyle(0x222222, 0.9)
      spider.fillRect(-5, -3, 10, 6)
      spider.fillRect(-8, -2, 4, 4)
      spider.fillRect(4, -2, 4, 4)
      spider.x = startX; spider.y = sy
      spidersAlive++
      scene.tweens.add({
        targets: spider,
        x: endX,
        duration: 4000,
        ease: 'Linear',
        onComplete: () => { spider.destroy(); spidersAlive-- },
      })
    },
  })
}
export function drawCryptBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Black upper half
  g.fillStyle(0x050505)
  g.fillRect(0, 0, width, height * 0.6)

  // Gothic arches (left and right framing)
  g.fillStyle(0x111111)
  g.fillRect(0, 0, 80, height * 0.7)
  g.fillStyle(0x0a0a0a)
  g.fillRect(80, 0, 16, height * 0.65)
  g.fillStyle(0x111111)
  g.fillRect(width - 80, 0, 80, height * 0.7)
  g.fillStyle(0x0a0a0a)
  g.fillRect(width - 96, 0, 16, height * 0.65)

  // Stone tile floor (bottom 35%)
  g.fillStyle(0x141414)
  g.fillRect(0, height * 0.65, width, height * 0.35)
  g.fillStyle(0x0a0a0a)
  for (let x = 0; x < width; x += 64) {
    g.fillRect(x, height * 0.65, 2, height * 0.35)
  }
  for (let y = height * 0.65; y < height; y += 48) {
    g.fillRect(0, y, width, 2)
  }
  // Offset alternate rows
  g.fillStyle(0x0d0d0d)
  for (let row = 0; row < 4; row++) {
    const rowY = height * 0.65 + row * 48
    const offset = row % 2 === 1 ? 32 : 0
    for (let x = offset; x < width; x += 64) {
      g.fillRect(x - 1, rowY, 2, 48)
    }
  }

  // Wall torch brackets
  g.fillStyle(0x2a1a0a)
  g.fillRect(100, height * 0.25, 12, 30)
  g.fillRect(100, height * 0.22, 24, 8)
  g.fillRect(width - 112, height * 0.25, 12, 30)
  g.fillRect(width - 124, height * 0.22, 24, 8)

  // Floating rune glyphs (static, drawn)
  g.fillStyle(0x440066)
  const runePositions = [
    { x: width * 0.3, y: height * 0.15 },
    { x: width * 0.5, y: height * 0.08 },
    { x: width * 0.7, y: height * 0.18 },
    { x: width * 0.2, y: height * 0.35 },
    { x: width * 0.8, y: height * 0.32 },
  ]
  for (const rp of runePositions) {
    g.fillRect(rp.x - 2, rp.y - 10, 4, 20)
    g.fillRect(rp.x - 10, rp.y - 2, 20, 4)
    g.fillRect(rp.x - 6, rp.y - 6, 4, 4)
    g.fillRect(rp.x + 2, rp.y - 6, 4, 4)
    g.fillRect(rp.x - 6, rp.y + 2, 4, 4)
    g.fillRect(rp.x + 2, rp.y + 2, 4, 4)
  }
  g.destroy()

  // Torch flames (animated)
  const torchPositions = [
    { x: 106, y: height * 0.22 },
    { x: width - 106, y: height * 0.22 },
  ]
  for (const tp of torchPositions) {
    const flame1 = scene.add.graphics()
    flame1.fillStyle(0xff6600, 0.9)
    flame1.fillRect(-5, -16, 10, 16)
    flame1.fillRect(-3, -20, 6, 6)
    flame1.fillRect(-1, -24, 2, 6)
    flame1.x = tp.x; flame1.y = tp.y
    const flame2 = scene.add.graphics()
    flame2.fillStyle(0xffcc00, 0.8)
    flame2.fillRect(-3, -12, 6, 12)
    flame2.fillRect(-1, -16, 2, 5)
    flame2.x = tp.x; flame2.y = tp.y
    scene.tweens.add({
      targets: flame1,
      alpha: 0.4, scaleY: 0.8, scaleX: 1.2,
      duration: 120, yoyo: true, repeat: -1,
    })
    scene.tweens.add({
      targets: flame2,
      alpha: 0.5, scaleY: 0.75,
      duration: 90, yoyo: true, repeat: -1,
    })
  }

  // Rune pulse + slow rotation
  for (let i = 0; i < runePositions.length; i++) {
    const rp = runePositions[i]
    const runeGfx = scene.add.graphics()
    runeGfx.fillStyle(0x6600aa, 0.6)
    runeGfx.fillRect(-2, -10, 4, 20)
    runeGfx.fillRect(-10, -2, 20, 4)
    runeGfx.x = rp.x; runeGfx.y = rp.y
    scene.tweens.add({
      targets: runeGfx,
      angle: 360,
      alpha: { from: 0.3, to: 0.9 },
      duration: 4000 + i * 600,
      repeat: -1,
      ease: 'Linear',
    })
  }
}
export function drawCastleThroneRoomBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale

  // ── Static base — persistent Graphics object (do NOT destroy) ───────────────
  const g = scene.add.graphics()

  // Layer 1: Stone brick wall — 4-band gradient
  const wallSections: Array<[number, number, number]> = [
    [0,             height * 0.18, 0x100c18],
    [height * 0.18, height * 0.38, 0x141020],
    [height * 0.38, height * 0.52, 0x18142a],
    [height * 0.52, height * 0.65, 0x1c1830],
  ]
  for (const [y1, y2, color] of wallSections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }
  // Mortar lines
  const brickH = 28, brickW = 64
  for (let row = 0; row < Math.ceil(height * 0.65 / brickH); row++) {
    const offsetX = row % 2 === 0 ? 0 : brickW / 2
    g.fillStyle(0x0c0918)
    for (let col = -1; col < Math.ceil(width / brickW) + 1; col++) {
      const bx = col * brickW + offsetX, by = row * brickH
      g.fillRect(bx, by, brickW, 2)
      g.fillRect(bx, by, 2, brickH)
    }
  }

  // Layer 2: Stone pillars — 3 each side
  g.fillStyle(0x1a1228)
  for (let i = 0; i < 3; i++) {
    const lx = 64 + i * 160, rx = width - 64 - i * 160
    g.fillRect(lx - 22, 0, 44, height * 0.65)
    g.fillRect(rx - 22, 0, 44, height * 0.65)
    g.fillStyle(0x221a36)
    g.fillRect(lx - 28, height * 0.08, 56, 14)
    g.fillRect(rx - 28, height * 0.08, 56, 14)
    g.fillStyle(0x1a1228)
  }

  // Layer 3: Stained glass window (top center) — 6 panels
  const winX = width / 2, winY = 22, winW = 140, winH = 155
  g.fillStyle(0x220033)
  g.fillRect(winX - winW / 2, winY, winW, winH)
  const panels = [
    { dx: -62, dy: 8, w: 48, h: 60, color: 0x770099 },
    { dx: -12, dy: 8, w: 24, h: 95, color: 0x996600 },
    { dx: 14,  dy: 8, w: 48, h: 60, color: 0x005588 },
    { dx: -62, dy: 72, w: 48, h: 67, color: 0x440066 },
    { dx: 14,  dy: 72, w: 48, h: 67, color: 0x003344 },
    { dx: -12, dy: 107, w: 24, h: 30, color: 0x884400 },
  ]
  for (const p of panels) {
    g.fillStyle(p.color)
    g.fillRect(winX + p.dx, winY + p.dy, p.w, p.h)
  }
  // Window frame
  g.fillStyle(0x0e0c18)
  g.fillRect(winX - winW / 2 - 8, winY - 8, winW + 16, 8)
  g.fillRect(winX - winW / 2 - 8, winY + winH, winW + 16, 10)
  g.fillRect(winX - winW / 2 - 8, winY, 8, winH + 10)
  g.fillRect(winX + winW / 2, winY, 8, winH + 10)

  // Layer 4: Purple tapestries with gold trim and letter 'B' motif
  g.fillStyle(0x2a0840)
  g.fillRect(238, 8, 66, height * 0.55)
  g.fillRect(width - 304, 8, 66, height * 0.55)
  g.fillStyle(0x886600)
  g.fillRect(238, 8, 4, height * 0.55);  g.fillRect(300, 8, 4, height * 0.55)
  g.fillRect(238, 8, 66, 4)
  g.fillRect(width - 304, 8, 4, height * 0.55); g.fillRect(width - 242, 8, 4, height * 0.55)
  g.fillRect(width - 304, 8, 66, 4)
  // 'B' motif on tapestries
  g.fillStyle(0xcc9900)
  for (const [tx] of [[248], [width - 294]]) {
    g.fillRect(tx, 50, 4, 32)
    g.fillRect(tx, 50, 20, 3); g.fillRect(tx + 16, 50, 3, 14); g.fillRect(tx, 63, 20, 3)
    g.fillRect(tx + 16, 64, 3, 18); g.fillRect(tx, 79, 20, 3)
  }

  // Layer 5: Stone throne silhouette (center-back)
  g.fillStyle(0x0a0814)
  const tX = width / 2, tY = height * 0.65
  g.fillRect(tX - 50, tY - 68, 100, 68)          // seat
  g.fillRect(tX - 70, tY - 54, 20, 54)            // left arm
  g.fillRect(tX + 50, tY - 54, 20, 54)            // right arm
  g.fillRect(tX - 42, tY - 168, 84, 102)          // backrest
  // Crown spikes
  g.fillRect(tX - 42, tY - 188, 16, 22)
  g.fillRect(tX - 20, tY - 198, 16, 32)
  g.fillRect(tX + 4,  tY - 198, 16, 32)
  g.fillRect(tX + 26, tY - 188, 16, 22)

  // Layer 6: Stone floor — 4-band gradient
  const floorSections: Array<[number, number, number]> = [
    [height * 0.65, height * 0.74, 0x0e0c14],
    [height * 0.74, height * 0.83, 0x0b0a10],
    [height * 0.83, height * 0.92, 0x09080e],
    [height * 0.92, height,        0x07060c],
  ]
  for (const [y1, y2, color] of floorSections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }
  g.fillStyle(0x0a0812)
  for (let x = 0; x < width; x += 80) g.fillRect(x, height * 0.65, 2, height * 0.35)
  for (let y = height * 0.65; y < height; y += 60) g.fillRect(0, y, width, 2)

  // Torch sconces on pillars
  g.fillStyle(0x2a1a0a)
  const torchXs = [86, 246, 406, width - 86, width - 246, width - 406]
  for (const tx of torchXs) {
    g.fillRect(tx - 3, height * 0.42, 6, 28)
    g.fillRect(tx - 14, height * 0.42, 28, 6)
    g.fillRect(tx - 10, height * 0.38, 20, 6)
  }

  // ── Torch flames (animated, one per sconce) ──────────────────────────────────
  for (let i = 0; i < torchXs.length; i++) {
    const tx = torchXs[i]
    const flame = scene.add.graphics()
    flame.fillStyle(0xff8800, 1); flame.fillRect(-3, -10, 6, 10)
    flame.fillStyle(0xffdd00, 1); flame.fillRect(-2, -14, 4, 6)
    flame.fillStyle(0xffffff, 1); flame.fillRect(-1, -16, 2, 3)
    flame.setPosition(tx, height * 0.38).setAlpha(0.9)
    scene.tweens.add({
      targets: flame,
      alpha: 0.45, scaleY: 0.74, scaleX: 1.38,
      duration: 80 + i * 22,
      yoyo: true, repeat: -1,
    })
  }

  // ── Candelabras (separate Graphics objects so they render correctly) ──────────
  const candleXs = [width * 0.32, width * 0.68]
  for (let ci = 0; ci < candleXs.length; ci++) {
    const cx = candleXs[ci]
    const stand = scene.add.graphics()
    stand.fillStyle(0x221a2a, 1)
    stand.fillRect(-3, 0, 6, 100)      // shaft
    stand.fillRect(-20, 0, 40, 5)     // top plate
    stand.fillRect(-18, height * 0.44 - 22, 4, 10)
    stand.fillRect(14,  height * 0.44 - 22, 4, 10)
    stand.fillRect(-2,  height * 0.44 - 12, 4, 10)
    stand.setPosition(cx, height * 0.44).setAlpha(1)

    const flameOffsets = [{ ox: -18, oy: -20 }, { ox: 0, oy: -32 }, { ox: 16, oy: -20 }]
    for (let fi = 0; fi < flameOffsets.length; fi++) {
      const fo = flameOffsets[fi]
      const cf = scene.add.graphics()
      cf.fillStyle(0xff8800, 1); cf.fillRect(-2, -8, 4, 8)
      cf.fillStyle(0xffdd00, 1); cf.fillRect(-1, -11, 2, 4)
      cf.setPosition(cx + fo.ox, height * 0.44 + fo.oy).setAlpha(0.9)
      scene.tweens.add({
        targets: cf,
        alpha: 0.38, scaleY: 0.72, scaleX: 1.42,
        duration: 90 + fi * 28 + ci * 14,
        yoyo: true, repeat: -1,
      })
    }
  }

  // ── Floating corrupted-letter pool (8 letters, recycled) ─────────────────────
  const typoLetters = ['T', 'Y', 'P', 'O', 'W', 'R', 'D', 'S']
  const MAX_LETTERS = 8
  const letterObjs: Phaser.GameObjects.Text[] = Array.from({ length: MAX_LETTERS }, (_, i) =>
    scene.add.text(0, 0, typoLetters[i], {
      fontSize: `${16 + (i % 3) * 6}px`,
      color: i % 2 === 0 ? '#9944ff' : '#ffaa00',
    }).setOrigin(0.5).setAlpha(0)
  )
  const launchLetter = (index: number): void => {
    const lt = letterObjs[index]
    const lx = 120 + Math.random() * (width - 240)
    const ly = height * 0.55 + Math.random() * (height * 0.25)
    lt.setPosition(lx, ly).setAlpha(0.42)
    scene.tweens.add({
      targets: lt,
      y: ly - 75,
      alpha: 0,
      duration: 4000 + Math.random() * 2000,
      ease: 'Sine.easeInOut',
      onComplete: () => { scene.time.delayedCall(Math.random() * 3000 + 1000, () => launchLetter(index)) },
    })
  }
  for (let i = 0; i < MAX_LETTERS; i++) scene.time.delayedCall(i * 700, () => launchLetter(i))

  // ── Window glow pulse ────────────────────────────────────────────────────────
  const winGlow = scene.add.rectangle(winX, winY + winH / 2, winW + 24, winH + 24, 0x8800cc, 1)
  winGlow.setAlpha(0.05)
  scene.tweens.add({
    targets: winGlow,
    alpha: 0.13,
    duration: 3200,
    yoyo: true, repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // ── Tapestry sway — actual Graphics objects (not invisible proxies) ───────────
  const tapL = scene.add.graphics()
  tapL.fillStyle(0x2a0840, 1); tapL.fillRect(-33, 0, 66, height * 0.55)
  tapL.fillStyle(0x886600, 1)
  tapL.fillRect(-33, 0, 4, height * 0.55); tapL.fillRect(29, 0, 4, height * 0.55); tapL.fillRect(-33, 0, 66, 4)
  tapL.setPosition(271, 8).setAlpha(0.85)
  scene.tweens.add({ targets: tapL, angle: 1.8, duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  const tapR = scene.add.graphics()
  tapR.fillStyle(0x2a0840, 1); tapR.fillRect(-33, 0, 66, height * 0.55)
  tapR.fillStyle(0x886600, 1)
  tapR.fillRect(-33, 0, 4, height * 0.55); tapR.fillRect(29, 0, 4, height * 0.55); tapR.fillRect(-33, 0, 66, 4)
  tapR.setPosition(width - 271, 8).setAlpha(0.85)
  scene.tweens.add({ targets: tapR, angle: -2.0, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
}
export function drawEtherealVoidBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Pure black base
  g.fillStyle(0x000000)
  g.fillRect(0, 0, width, height)

  // Static arcane light rings
  const rings = [
    { x: width * 0.5, y: height * 0.5, r: 180, color: 0x220044, a: 0.3 },
    { x: width * 0.5, y: height * 0.5, r: 280, color: 0x110033, a: 0.2 },
    { x: width * 0.3, y: height * 0.3, r: 80, color: 0x330055, a: 0.25 },
    { x: width * 0.7, y: height * 0.4, r: 60, color: 0x220055, a: 0.2 },
  ]
  for (const ring of rings) {
    g.lineStyle(2, ring.color, ring.a)
    g.strokeCircle(ring.x, ring.y, ring.r)
    g.lineStyle(1, ring.color, ring.a * 0.5)
    g.strokeCircle(ring.x, ring.y, ring.r + 12)
  }
  g.destroy()

  // Drifting glyph text objects
  const glyphs = ['Ω', 'Σ', 'Ψ', 'Δ', 'Λ', 'Φ', 'Γ', 'Θ', '∞', '⌬', '⊕', '✦']
  for (let i = 0; i < 14; i++) {
    const glyph = glyphs[i % glyphs.length]
    const startX = 60 + Math.random() * (width - 120)
    const startY = height * 0.3 + Math.random() * (height * 0.5)
    const gt = scene.add.text(startX, startY, glyph, {
      fontSize: `${14 + Math.floor(Math.random() * 20)}px`,
      color: i % 2 === 0 ? '#8800ff' : '#ff44ff',
    }).setOrigin(0.5).setAlpha(0.6)
    scene.tweens.add({
      targets: gt,
      y: startY - 80 - Math.random() * 60,
      alpha: 0,
      duration: 5000 + Math.random() * 4000,
      delay: Math.random() * 3000,
      repeat: -1,
      repeatDelay: Math.random() * 2000,
      onRepeat: () => {
        gt.y = height * 0.3 + Math.random() * (height * 0.5)
        gt.x = 60 + Math.random() * (width - 120)
        gt.setAlpha(0.6)
      },
    })
  }

  // Expanding ring pulses from center
  let ringsAlive = 0
  const MAX_RINGS = 4
  scene.time.addEvent({
    delay: 1500,
    loop: true,
    callback: () => {
      if (ringsAlive >= MAX_RINGS) return
      const rg = scene.add.graphics()
      rg.lineStyle(2, 0x6600cc, 0.6)
      rg.strokeCircle(0, 0, 10)
      rg.x = width * 0.5; rg.y = height * 0.45
      ringsAlive++
      scene.tweens.add({
        targets: rg,
        scaleX: 18, scaleY: 18, alpha: 0,
        duration: 2500,
        ease: 'Quad.easeOut',
        onComplete: () => { rg.destroy(); ringsAlive-- },
      })
    },
  })
}
export function drawVolcanicLairBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Ash-gray sky
  g.fillStyle(0x1a1212)
  g.fillRect(0, 0, width, height * 0.55)
  g.fillStyle(0x1f1616)
  for (let x = 0; x < width; x += 120) {
    const cy = 40 + ((x * 3) % 60)
    g.fillRect(x, cy, 100, 20)
    g.fillRect(x + 10, cy - 8, 80, 10)
    g.fillRect(x + 20, cy + 20, 60, 8)
  }

  // Black rock spires
  g.fillStyle(0x0a0808)
  const spires = [
    { x: 80, baseY: height * 0.55, h: 220 },
    { x: 200, baseY: height * 0.55, h: 160 },
    { x: width - 80, baseY: height * 0.55, h: 240 },
    { x: width - 200, baseY: height * 0.55, h: 180 },
    { x: 380, baseY: height * 0.55, h: 110 },
    { x: width - 380, baseY: height * 0.55, h: 130 },
  ]
  for (const sp of spires) {
    const w = 30 + sp.h * 0.15
    g.fillRect(sp.x - w / 2, sp.baseY - sp.h, w, sp.h)
    g.fillRect(sp.x - w / 4, sp.baseY - sp.h - 20, w / 2, 22)
    g.fillRect(sp.x - w / 8, sp.baseY - sp.h - 32, w / 4, 14)
  }

  // Rocky ground (mid section)
  g.fillStyle(0x120a0a)
  g.fillRect(0, height * 0.55, width, height * 0.12)
  g.fillStyle(0x6a2200)
  for (let x = 60; x < width; x += 180) {
    g.fillRect(x, height * 0.55, 3, height * 0.12)
    g.fillRect(x + 60, height * 0.57, 3, height * 0.08)
  }

  // Lava river (lower third)
  g.fillStyle(0x3a0f00)
  g.fillRect(0, height * 0.67, width, height * 0.33)
  g.fillStyle(0x1a0800)
  for (let x = 0; x < width; x += 90) {
    g.fillRect(x, height * 0.67, 70, 14)
    g.fillRect(x + 40, height * 0.72, 50, 10)
  }
  g.fillStyle(0xcc4400)
  for (let x = 10; x < width; x += 90) {
    g.fillRect(x, height * 0.68, 50, 6)
    g.fillRect(x + 35, height * 0.73, 35, 4)
  }
  g.destroy()

  // Lava glow overlay (alpha tween — NOT fillColor tween)
  const lavaGlow = scene.add.rectangle(width / 2, height * 0.835, width, height * 0.33, 0xff5500, 0.08)
  scene.tweens.add({
    targets: lavaGlow,
    alpha: 0.18,
    duration: 1800,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // Rising ash particles
  let ashAlive = 0
  const MAX_ASH = 12
  scene.time.addEvent({
    delay: 400,
    loop: true,
    callback: () => {
      if (ashAlive >= MAX_ASH) return
      const ax = 40 + Math.random() * (width - 80)
      const ash = scene.add.rectangle(ax, height * 0.65, 3, 3, 0x442222, 0.7)
      ashAlive++
      scene.tweens.add({
        targets: ash,
        y: height * 0.1,
        x: ax + (Math.random() - 0.5) * 80,
        alpha: 0,
        duration: 3500 + Math.random() * 2000,
        ease: 'Linear',
        onComplete: () => { ash.destroy(); ashAlive-- },
      })
    },
  })

  // Steam vents
  const ventXs = [160, 520, 880, width - 160]
  let steamsAlive = 0
  const MAX_STEAMS = 6
  scene.time.addEvent({
    delay: 700,
    loop: true,
    callback: () => {
      if (steamsAlive >= MAX_STEAMS) return
      const vx = ventXs[Math.floor(Math.random() * ventXs.length)]
      const sg = scene.add.graphics()
      sg.fillStyle(0xaaaaaa, 0.15)
      sg.fillEllipse(0, 0, 24, 32)
      sg.x = vx; sg.y = height * 0.67
      steamsAlive++
      scene.tweens.add({
        targets: sg,
        y: height * 0.67 - 80,
        scaleX: 2.5, scaleY: 2,
        alpha: 0,
        duration: 1200,
        onComplete: () => { sg.destroy(); steamsAlive-- },
      })
    },
  })
}
export function drawSteampunkWorkshopBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Dark metal panel wall (upper 65%)
  g.fillStyle(0x141414)
  g.fillRect(0, 0, width, height * 0.65)
  const panelW = 80, panelH = 80
  for (let col = 0; col < Math.ceil(width / panelW); col++) {
    for (let row = 0; row < Math.ceil(height * 0.65 / panelH); row++) {
      const px = col * panelW, py = row * panelH
      g.fillStyle(0x1a1a1a)
      g.fillRect(px + 2, py + 2, panelW - 4, panelH - 4)
      g.fillStyle(0x0a0a0a)
      g.fillRect(px + 5, py + 5, 4, 4)
      g.fillRect(px + panelW - 9, py + 5, 4, 4)
      g.fillRect(px + 5, py + panelH - 9, 4, 4)
      g.fillRect(px + panelW - 9, py + panelH - 9, 4, 4)
    }
  }

  // Metal floor (bottom 35%)
  g.fillStyle(0x1c1c1c)
  g.fillRect(0, height * 0.65, width, height * 0.35)
  g.fillStyle(0x141414)
  for (let x = 0; x < width; x += 40) g.fillRect(x, height * 0.65, 2, height * 0.35)
  for (let y = height * 0.65; y < height; y += 40) g.fillRect(0, y, width, 2)

  // Pipe network along walls
  g.fillStyle(0x2a2a2a)
  g.fillRect(0, height * 0.2, width, 12)
  g.fillRect(0, height * 0.45, width * 0.3, 10)
  g.fillRect(width * 0.7, height * 0.45, width * 0.3, 10)
  g.fillRect(width * 0.1, 0, 10, height * 0.65)
  g.fillRect(width * 0.9 - 10, 0, 10, height * 0.65)
  g.fillStyle(0x333333)
  const joints = [
    { x: width * 0.1 + 5, y: height * 0.2 + 6 },
    { x: width * 0.9 - 5, y: height * 0.2 + 6 },
    { x: width * 0.3, y: height * 0.45 + 5 },
    { x: width * 0.7, y: height * 0.45 + 5 },
  ]
  for (const jt of joints) {
    g.fillCircle(jt.x, jt.y, 10)
  }

  // Gauge/dial details
  g.fillStyle(0x222222)
  g.fillCircle(width * 0.15, height * 0.55, 20)
  g.fillCircle(width * 0.85, height * 0.55, 20)
  g.fillStyle(0x111111)
  g.fillCircle(width * 0.15, height * 0.55, 14)
  g.fillCircle(width * 0.85, height * 0.55, 14)
  g.fillStyle(0xcc4400)
  g.fillRect(width * 0.15 - 1, height * 0.55 - 12, 2, 12)
  g.fillRect(width * 0.85 - 1, height * 0.55 - 12, 2, 12)
  g.destroy()

  // Background gears (large, slow rotating)
  function drawGear(gfx: Phaser.GameObjects.Graphics, r: number, teeth: number, color: number): void {
    gfx.fillStyle(color, 0.5)
    gfx.fillCircle(0, 0, r)
    gfx.fillStyle(color, 0.4)
    for (let t = 0; t < teeth; t++) {
      const angle = (t / teeth) * Math.PI * 2
      const tx = Math.cos(angle) * (r + 10)
      const ty = Math.sin(angle) * (r + 10)
      gfx.fillRect(tx - 5, ty - 5, 10, 10)
    }
    gfx.fillStyle(0x111111, 0.8)
    gfx.fillCircle(0, 0, r * 0.35)
    gfx.fillStyle(color, 0.3)
    gfx.fillCircle(0, 0, r * 0.15)
  }

  const gearConfigs = [
    { x: width * 0.05, y: height * 0.1, r: 70, teeth: 14, color: 0x444444, speed: 8000 },
    { x: width * 0.92, y: height * 0.15, r: 55, teeth: 12, color: 0x3a3a3a, speed: 6000 },
    { x: width * 0.08, y: height * 0.62, r: 45, teeth: 10, color: 0x3a3a3a, speed: 10000 },
    { x: width * 0.88, y: height * 0.58, r: 50, teeth: 11, color: 0x444444, speed: 7500 },
  ]
  for (const gc of gearConfigs) {
    const gearGfx = scene.add.graphics()
    drawGear(gearGfx, gc.r, gc.teeth, gc.color)
    gearGfx.x = gc.x; gearGfx.y = gc.y
    scene.tweens.add({
      targets: gearGfx,
      angle: 360,
      duration: gc.speed,
      repeat: -1,
      ease: 'Linear',
    })
  }

  // Steam puffs from pipe joints
  let steamsAlive = 0
  const MAX_STEAMS = 5
  scene.time.addEvent({
    delay: 800,
    loop: true,
    callback: () => {
      if (steamsAlive >= MAX_STEAMS) return
      const jt = joints[Math.floor(Math.random() * joints.length)]
      const sg = scene.add.graphics()
      sg.fillStyle(0xcccccc, 0.12)
      sg.fillEllipse(0, 0, 20, 28)
      sg.x = jt.x; sg.y = jt.y
      steamsAlive++
      scene.tweens.add({
        targets: sg,
        y: jt.y - 60,
        scaleX: 2.5, scaleY: 2,
        alpha: 0,
        duration: 1000,
        onComplete: () => { sg.destroy(); steamsAlive-- },
      })
    },
  })
}
export function drawGraveyardBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale

  // ── Static base — persistent Graphics object (do NOT destroy) ───────────────
  const g = scene.add.graphics()

  // Layer 1: Stormy sky — 4-band gradient
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.15, 0x060308],
    [height * 0.15, height * 0.30, 0x0a0612],
    [height * 0.30, height * 0.45, 0x0e0918],
    [height * 0.45, height * 0.60, 0x120c1e],
  ]
  for (const [y1, y2, color] of skySections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }

  // Layer 2: Storm clouds — irregular blobs
  g.fillStyle(0x0f0b1a)
  for (let x = 0; x < width; x += 140) {
    const cy = 18 + ((x * 7) % 50)
    g.fillRect(x, cy, 120, 28)
    g.fillRect(x + 15, cy - 10, 90, 14)
    g.fillRect(x + 30, cy + 28, 60, 10)
  }

  // Layer 3: Distant ruined chapel silhouette (center)
  g.fillStyle(0x070509)
  const chapelX = width * 0.5, chapelBase = height * 0.58
  g.fillRect(chapelX - 80, chapelBase - 90, 160, 90)
  g.fillRect(chapelX - 90, chapelBase - 140, 38, 54)
  g.fillRect(chapelX - 96, chapelBase - 148, 50, 12)
  g.fillRect(chapelX - 88, chapelBase - 160, 22, 14)
  g.fillRect(chapelX + 52, chapelBase - 130, 38, 44)
  g.fillRect(chapelX + 46, chapelBase - 138, 50, 12)
  // Arched window (negative space)
  g.fillStyle(0x060308)
  g.fillRect(chapelX - 12, chapelBase - 80, 24, 36)
  g.fillRect(chapelX - 8, chapelBase - 88, 16, 10)

  // Layer 4: Back tree layer — far, darkest, sine-varied
  g.fillStyle(0x050307)
  for (let x = 0; x < width; x += 60) {
    if (x > width * 0.36 && x < width * 0.64) continue  // gap for chapel
    const th = 100 + Math.sin(x * 0.09) * 30 + Math.sin(x * 0.19) * 15
    g.fillRect(x - 10, height * 0.58 - th, 20, th)
    g.fillRect(x - 26, height * 0.58 - th + 15, 52, 4)
    g.fillRect(x - 18, height * 0.58 - th + 30, 36, 3)
  }

  // Layer 5: Mid tree layer — dead gnarled, closer
  g.fillStyle(0x070508)
  const treeDefs = [
    { x: 90, h: 170 }, { x: 210, h: 140 }, { x: 330, h: 115 },
    { x: width - 90, h: 180 }, { x: width - 210, h: 150 }, { x: width - 330, h: 120 },
  ]
  for (const td of treeDefs) {
    const baseY = height * 0.58
    g.fillRect(td.x - 8, baseY - td.h, 16, td.h)
    g.fillRect(td.x - 40, baseY - td.h + 18, 80, 5)
    g.fillRect(td.x - 28, baseY - td.h + 38, 56, 4)
    g.fillRect(td.x + 10, baseY - td.h + 28, 36, 3)
    g.fillRect(td.x - 44, baseY - td.h + 28, 28, 3)
    g.fillRect(td.x - 52, baseY - td.h + 18, 12, 3)
    g.fillRect(td.x + 42, baseY - td.h + 18, 12, 3)
  }

  // Layer 6: Ground — 4-band gradient
  const groundSections: Array<[number, number, number]> = [
    [height * 0.58, height * 0.68, 0x0c0c0f],
    [height * 0.68, height * 0.78, 0x09090c],
    [height * 0.78, height * 0.88, 0x070709],
    [height * 0.88, height,        0x050507],
  ]
  for (const [y1, y2, color] of groundSections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }
  // Dead grass tufts along treeline
  g.fillStyle(0x0e0e0e)
  for (let x = 0; x < width; x += 28) {
    const bh = 10 + ((x * 3) % 12)
    g.fillRect(x, height * 0.58, 20, bh)
  }

  // Layer 7: Tombstones — 8 varied
  const tombstones = [
    { x: 140, y: height * 0.70, w: 36, h: 52, cross: true },
    { x: 260, y: height * 0.72, w: 30, h: 44, cross: false },
    { x: 420, y: height * 0.68, w: 40, h: 56, cross: true },
    { x: 600, y: height * 0.71, w: 28, h: 40, cross: false },
    { x: 760, y: height * 0.70, w: 38, h: 54, cross: true },
    { x: 900, y: height * 0.73, w: 32, h: 46, cross: false },
    { x: 1050, y: height * 0.69, w: 40, h: 58, cross: true },
    { x: 1170, y: height * 0.72, w: 30, h: 44, cross: false },
  ]
  for (const ts of tombstones) {
    g.fillStyle(0x1a1a22)
    g.fillRect(ts.x - ts.w / 2, ts.y - ts.h, ts.w, ts.h)
    g.fillRect(ts.x - ts.w / 2 + 4, ts.y - ts.h - 10, ts.w - 8, 12)
    g.fillRect(ts.x - ts.w / 2 + 8, ts.y - ts.h - 18, ts.w - 16, 10)
    if (ts.cross) {
      g.fillStyle(0x0d0d14)
      g.fillRect(ts.x - 2, ts.y - ts.h + 8, 4, 22)
      g.fillRect(ts.x - 9, ts.y - ts.h + 14, 18, 4)
      g.fillStyle(0x1a1a22)
    }
    // Grave mound
    g.fillStyle(0x141418)
    g.fillRect(ts.x - ts.w / 2 - 6, ts.y - 8, ts.w + 12, 8)
    g.fillStyle(0x1a1a22)
  }

  // Iron fence (foreground)
  g.fillStyle(0x101010)
  for (let fx = 0; fx < width; fx += 22) {
    g.fillRect(fx, height * 0.73, 3, 34)
    g.fillRect(fx + 1, height * 0.73 - 4, 1, 5)  // spike tip
    if (fx + 22 < width) {
      g.fillRect(fx + 3, height * 0.73 + 10, 19, 2)
      g.fillRect(fx + 3, height * 0.73 + 24, 19, 2)
    }
  }

  // ── Ground fog layers × 3 ────────────────────────────────────────────────────
  const fog1 = scene.add.rectangle(width / 2,       height * 0.73, width + 300, 48, 0x221a44, 1)
  const fog2 = scene.add.rectangle(width / 2 + 30,  height * 0.78, width + 300, 34, 0x1a1233, 1)
  const fog3 = scene.add.rectangle(width / 2 - 20,  height * 0.83, width * 0.85, 26, 0x140e28, 1)
  fog1.setAlpha(0.22); fog2.setAlpha(0.18); fog3.setAlpha(0.14)
  scene.tweens.add({ targets: fog1, x: width / 2 + 60,  duration: 7000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog2, x: width / 2 - 50,  duration: 5500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog3, x: width / 2 + 40,  duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  // ── Ghostly orb pool (6 orbs, recycled) ─────────────────────────────────────
  const MAX_ORBS = 6
  const orbs: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_ORBS }, () => {
    const orb = scene.add.graphics()
    orb.fillStyle(0x8888ff, 1); orb.fillCircle(0, 0, 6)
    orb.fillStyle(0xbbbbff, 1); orb.fillCircle(0, 0, 3)
    orb.setAlpha(0)
    return orb
  })
  const launchOrb = (index: number): void => {
    const orb = orbs[index]
    const ox = 80 + Math.random() * (width - 160)
    const oy = height * 0.68 + Math.random() * (height * 0.15)
    orb.setPosition(ox, oy).setAlpha(0.55)
    scene.tweens.add({
      targets: orb,
      y: oy - 90 - Math.random() * 60,
      x: ox + (Math.random() - 0.5) * 60,
      alpha: 0,
      duration: 4000 + Math.random() * 2500,
      ease: 'Sine.easeInOut',
      onComplete: () => { scene.time.delayedCall(Math.random() * 3000 + 1000, () => launchOrb(index)) },
    })
  }
  for (let i = 0; i < MAX_ORBS; i++) scene.time.delayedCall(i * 800, () => launchOrb(i))

  // ── Bone fragment pool (10 shards, recycled) ─────────────────────────────────
  const MAX_BONES = 10
  const bones: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_BONES }, () => {
    const bone = scene.add.graphics()
    bone.fillStyle(0xccccbb, 1); bone.fillRect(-3, -1, 6, 2)
    bone.setAlpha(0)
    return bone
  })
  const launchBone = (index: number): void => {
    const bone = bones[index]
    const bx = 80 + Math.random() * (width - 160)
    const by = height * 0.75 + Math.random() * (height * 0.12)
    bone.setPosition(bx, by).setAlpha(0.5).setAngle(Math.random() * 360)
    scene.tweens.add({
      targets: bone,
      y: by - 50 - Math.random() * 40,
      alpha: 0,
      angle: bone.angle + (Math.random() - 0.5) * 90,
      duration: 2500 + Math.random() * 1500,
      ease: 'Quad.easeOut',
      onComplete: () => { scene.time.delayedCall(Math.random() * 2500 + 500, () => launchBone(index)) },
    })
  }
  for (let i = 0; i < MAX_BONES; i++) scene.time.delayedCall(i * 500, () => launchBone(i))

  // ── Lightning — recursive double-flash ───────────────────────────────────────
  const lightning = scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 1)
  lightning.setAlpha(0)
  const triggerLightning = (): void => {
    scene.time.delayedCall(Math.random() * 4000, () => {
      scene.tweens.add({
        targets: lightning,
        alpha: 0.20,
        duration: 55,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (Math.random() > 0.45) {
            scene.time.delayedCall(100, () => {
              scene.tweens.add({
                targets: lightning,
                alpha: 0.10,
                duration: 40,
                yoyo: true,
                onComplete: () => { scene.time.delayedCall(4500 + Math.random() * 5500, triggerLightning) },
              })
            })
          } else {
            scene.time.delayedCall(4500 + Math.random() * 5500, triggerLightning)
          }
        },
      })
    })
  }
  scene.time.delayedCall(2000, triggerLightning)
}
export function drawDarkForestBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale

  // ── Static base — persistent Graphics object (do NOT destroy) ───────────────
  const g = scene.add.graphics()

  // Layer 1: Deep blue-black sky — 4-band gradient with blood-moon tint
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.15, 0x04050a],
    [height * 0.15, height * 0.30, 0x060810],
    [height * 0.30, height * 0.45, 0x070914],
    [height * 0.45, height * 0.56, 0x090b18],
  ]
  for (const [y1, y2, color] of skySections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }

  // Layer 2: Blood moon — red-tinged, 5 concentric layers
  const moonX = width * 0.52, moonY = 60
  g.fillStyle(0x440000); g.fillCircle(moonX, moonY, 38)
  g.fillStyle(0x772200); g.fillCircle(moonX, moonY, 30)
  g.fillStyle(0xaa4400); g.fillCircle(moonX, moonY, 22)
  g.fillStyle(0xcc6622); g.fillCircle(moonX, moonY, 14)
  // Cloud occlusion
  g.fillStyle(0x04050a)
  g.fillRect(moonX - 30, moonY - 16, 22, 12)
  g.fillRect(moonX + 8,  moonY - 20, 26, 14)

  // Layer 3: Far tree layer — sine-varied, darkest
  g.fillStyle(0x040608)
  for (let x = 0; x < width; x += 56) {
    const th = 130 + Math.sin(x * 0.08) * 38 + Math.sin(x * 0.20) * 20
    const tw = 34 + ((x * 7) % 16)
    g.fillRect(x - tw / 2, height * 0.56 - th, tw, th)
    g.fillRect(x - tw * 0.7, height * 0.56 - th + 20, tw * 1.4, 18)
    g.fillRect(x - tw * 0.5, height * 0.56 - th + 40, tw, 14)
  }

  // Layer 4: Mid tree layer
  g.fillStyle(0x060a0e)
  for (let x = -20; x < width; x += 76) {
    const th = 110 + Math.sin(x * 0.06) * 32 + Math.sin(x * 0.15) * 16
    const tw = 36 + ((x * 5) % 20)
    g.fillRect(x - tw / 2, height * 0.58 - th, tw, th)
    g.fillRect(x - tw * 0.8, height * 0.58 - th + 12, tw * 1.6, 20)
    g.fillRect(x - tw * 0.6, height * 0.58 - th + 32, tw * 1.2, 16)
  }

  // Layer 5: Foreground trunk columns — 4 each side (massive ogre-forest trunks)
  g.fillStyle(0x030406)
  for (let i = 0; i < 4; i++) {
    g.fillRect(i * 20 - 6,           0, 22, height)   // left
    g.fillRect(width - i * 20 - 16,  0, 22, height)   // right
    if (i < 3) {
      g.fillRect(i * 20 + 14,          height * 0.18 + i * 22, 60, 7)
      g.fillRect(width - i * 20 - 74,  height * 0.22 + i * 18, 60, 7)
    }
  }

  // Layer 6: Dense undergrowth — 4-band ground gradient
  const groundSections: Array<[number, number, number]> = [
    [height * 0.56, height * 0.66, 0x060908],
    [height * 0.66, height * 0.76, 0x040706],
    [height * 0.76, height * 0.88, 0x030505],
    [height * 0.88, height,        0x020403],
  ]
  for (const [y1, y2, color] of groundSections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }
  // Undergrowth tufts
  g.fillStyle(0x060a08)
  for (let x = 0; x < width; x += 48) {
    const bh = 16 + ((x * 3) % 22)
    g.fillRect(x, height * 0.56, 42, bh)
  }
  // Exposed roots from ogre-trunk columns
  g.lineStyle(3, 0x030604, 1)
  const rootLines: Array<[number, number, number, number]> = [
    [20,         height * 0.58, 70,          height * 0.74],
    [36,         height * 0.60, 120,         height * 0.82],
    [width - 58, height * 0.58, width - 18,  height * 0.76],
    [width - 36, height * 0.60, width - 88,  height * 0.80],
  ]
  for (const [x1, y1, x2, y2] of rootLines) g.lineBetween(x1, y1, x2, y2)

  // ── Blood moon light shaft ───────────────────────────────────────────────────
  const moonShaft = scene.add.graphics()
  moonShaft.fillStyle(0xaa3300, 1)
  moonShaft.fillTriangle(moonX - 15, 0, moonX + 15, 0, moonX - 12, height)
  moonShaft.fillTriangle(moonX + 15, 0, moonX + 38, height, moonX - 12, height)
  moonShaft.setAlpha(0.06)
  scene.tweens.add({
    targets: moonShaft,
    alpha: 0.11,
    duration: 3500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // ── Ground fog layers × 3 ────────────────────────────────────────────────────
  const fog1 = scene.add.rectangle(width / 2,       height * 0.60, width + 200, 36, 0x0a1408, 1)
  const fog2 = scene.add.rectangle(width / 2 + 20,  height * 0.66, width + 200, 26, 0x080e06, 1)
  const fog3 = scene.add.rectangle(width / 2 - 15,  height * 0.72, width * 0.9, 20, 0x060c05, 1)
  fog1.setAlpha(0.28); fog2.setAlpha(0.22); fog3.setAlpha(0.16)
  scene.tweens.add({ targets: fog1, x: width / 2 + 45, duration: 6500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog2, x: width / 2 - 35, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog3, x: width / 2 + 55, duration: 8500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  // ── Firefly pool (10 fireflies, recycled — no destroy) ───────────────────────
  const MAX_FIREFLIES = 10
  const fireflies: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_FIREFLIES }, () => {
    const ff = scene.add.graphics()
    ff.fillStyle(0xffff88, 1)
    ff.fillRect(-2, -2, 4, 4)
    ff.setAlpha(0)
    return ff
  })
  const launchFirefly = (index: number): void => {
    const ff = fireflies[index]
    const fx = 100 + Math.random() * (width - 200)
    const fy = height * 0.25 + Math.random() * (height * 0.40)
    ff.setPosition(fx, fy).setAlpha(0.75)
    scene.tweens.add({
      targets: ff,
      x: fx + (Math.random() - 0.5) * 100,
      y: fy + (Math.random() - 0.5) * 60,
      alpha: 0,
      duration: 3000 + Math.random() * 2000,
      ease: 'Sine.easeInOut',
      onComplete: () => { scene.time.delayedCall(Math.random() * 2000 + 600, () => launchFirefly(index)) },
    })
  }
  for (let i = 0; i < MAX_FIREFLIES; i++) scene.time.delayedCall(i * 600, () => launchFirefly(i))

  // ── Glowing eyes — 3 pairs in the darkness ───────────────────────────────────
  type EyeConfig = { ex: number; ey: number; initDelay: number }
  const eyeConfigs: EyeConfig[] = [
    { ex: 48,           ey: height * 0.42, initDelay: 0 },
    { ex: width - 52,   ey: height * 0.38, initDelay: 3000 },
    { ex: width * 0.5,  ey: height * 0.30, initDelay: 6000 },
  ]
  for (const { ex, ey, initDelay } of eyeConfigs) {
    const eyeGfx = scene.add.graphics()
    eyeGfx.fillStyle(0xff4400, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 10, 7)
    eyeGfx.fillEllipse(ex + 7, ey, 10, 7)
    eyeGfx.fillStyle(0x220000, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 5, 4)
    eyeGfx.fillEllipse(ex + 7, ey, 5, 4)
    eyeGfx.setAlpha(0)

    const scheduleBlink = (): void => {
      scene.tweens.add({
        targets: eyeGfx,
        alpha: 0.9,
        duration: 180,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          scene.time.delayedCall(2500 + Math.random() * 2000, () => {
            scene.tweens.add({
              targets: eyeGfx,
              alpha: 0,
              duration: 350,
              ease: 'Sine.easeInOut',
              onComplete: () => { scene.time.delayedCall(4000 + Math.random() * 5000, scheduleBlink) },
            })
          })
        },
      })
    }
    scene.time.delayedCall(initDelay, scheduleBlink)
  }
}
export function drawDigitalVoidBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Pure black
  g.fillStyle(0x000000)
  g.fillRect(0, 0, width, height)

  // Energy rift cracks (static jagged lines)
  g.lineStyle(2, 0x00ffcc, 0.3)
  const riftY = height * 0.45
  const segments = 18
  const segW = width / segments
  let ry = riftY
  for (let i = 0; i < segments; i++) {
    const nextRy = riftY + (Math.sin(i * 1.7) * 30)
    g.lineBetween(i * segW, ry, (i + 1) * segW, nextRy)
    ry = nextRy
  }
  g.lineStyle(1, 0xcc00ff, 0.2)
  let ry2 = height * 0.3
  for (let i = 0; i < segments; i++) {
    const nextRy2 = height * 0.3 + (Math.sin(i * 2.3 + 1) * 20)
    g.lineBetween(i * segW, ry2, (i + 1) * segW, nextRy2)
    ry2 = nextRy2
  }
  g.destroy()

  // Letter rain columns
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?@#$%'
  const columnCount = 18
  const columnSpacing = width / columnCount

  for (let col = 0; col < columnCount; col++) {
    const cx = (col + 0.5) * columnSpacing
    const color = col % 3 === 0 ? '#00ff88' : col % 3 === 1 ? '#aa00ff' : '#00aaff'
    const speed = 4000 + Math.random() * 3000
    let charY = -(Math.random() * height)
    let charAlive = false

    scene.time.addEvent({
      delay: Math.floor(speed / 8),
      loop: true,
      callback: () => {
        if (charAlive) return
        const ch = letters[Math.floor(Math.random() * letters.length)]
        const ct = scene.add.text(cx, charY, ch, {
          fontSize: '14px',
          color,
        }).setOrigin(0.5).setAlpha(0.7)
        charAlive = true
        scene.tweens.add({
          targets: ct,
          y: charY + height * 1.2,
          duration: speed,
          ease: 'Linear',
          onComplete: () => { ct.destroy(); charY = -30; charAlive = false },
        })
      },
    })
  }

  // Rift pulse from center
  let riftsAlive = 0
  const MAX_RIFTS = 3
  scene.time.addEvent({
    delay: 2000,
    loop: true,
    callback: () => {
      if (riftsAlive >= MAX_RIFTS) return
      const rg = scene.add.graphics()
      rg.lineStyle(3, 0x00ffcc, 0.5)
      rg.strokeRect(-80, -20, 160, 40)
      rg.x = width * 0.5; rg.y = height * 0.45
      riftsAlive++
      scene.tweens.add({
        targets: rg,
        scaleX: 8, scaleY: 12, alpha: 0,
        duration: 1800,
        ease: 'Quad.easeOut',
        onComplete: () => { rg.destroy(); riftsAlive-- },
      })
    },
  })
}
// ── Private mini-boss helpers ────────────────────────────────────────────────

function drawForestClearingBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale

  // ── Static base — single persistent Graphics object (do NOT destroy) ──────
  const g = scene.add.graphics()

  // Layer 1: Sky — 4-band stacked-rect gradient (GoblinWhacker technique)
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.18, 0x050c03],
    [height * 0.18, height * 0.35, 0x081508],
    [height * 0.35, height * 0.50, 0x0c200a],
    [height * 0.50, height * 0.58, 0x102808],
  ]
  for (const [y1, y2, color] of skySections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }

  // Layer 2: Canopy overhang — irregular silhouette using two additive sin terms
  // Narrow vertical slices build the organic lower edge (GoblinWhacker mountain technique)
  g.fillStyle(0x0d1e0b)
  for (let x = 0; x <= width * 0.42; x += 6) {
    const edgeY = 30 + Math.sin(x * 0.06) * 18 + Math.sin(x * 0.13) * 10
    g.fillRect(x, 0, 6, edgeY)
  }
  for (let x = width; x >= width * 0.52; x -= 6) {
    const edgeY = 35 + Math.sin(x * 0.07) * 20 + Math.sin(x * 0.11) * 12
    g.fillRect(x - 6, 0, 6, edgeY)
  }

  // Layer 3: Far trees — sin-varied heights, darkest
  g.fillStyle(0x0f2810)
  for (let x = 0; x < width; x += 28) {
    const th = 55 + Math.sin(x * 0.09) * 25 + Math.sin(x * 0.21) * 12
    g.fillRect(x, height * 0.58 - th, 24, th + height * 0.45)
  }

  // Layer 4: Mid trees — slightly lighter, with two branch forks each
  g.fillStyle(0x0a1e08)
  for (let x = 8; x < width; x += 42) {
    const th = 80 + Math.sin(x * 0.07) * 30 + Math.sin(x * 0.18) * 15
    g.fillRect(x, height * 0.58 - th, 32, th + height * 0.42)
    g.fillRect(x + 10, height * 0.58 - th + 20, 30, 4)  // right fork
    g.fillRect(x - 18, height * 0.58 - th + 38, 20, 3)  // left fork
  }

  // Layer 5: Foreground trunk columns — 6 each side, branches cross inward
  g.fillStyle(0x060e04)
  for (let i = 0; i < 6; i++) {
    g.fillRect(i * 16 - 6,          0, 17, height)  // left column
    g.fillRect(width - i * 16 - 11, 0, 17, height)  // right column
    if (i < 3) {
      // Inward branches (drawn into static base; swaying branches are separate objects in Task 4)
      g.fillRect(i * 16 + 8,          height * 0.20 + i * 18, 50, 6)
      g.fillRect(i * 16 + 6,          height * 0.38 + i * 12, 38, 5)
      g.fillRect(width - i * 16 - 58, height * 0.25 + i * 14, 50, 6)
      g.fillRect(width - i * 16 - 44, height * 0.40 + i * 10, 38, 5)
    }
  }

  // Layer 6: Ground — 4-band gradient
  const groundSections: Array<[number, number, number]> = [
    [height * 0.55, height * 0.65, 0x1a2e0c],
    [height * 0.65, height * 0.78, 0x142408],
    [height * 0.78, height * 0.88, 0x0e1c06],
    [height * 0.88, height,        0x091504],
  ]
  for (const [y1, y2, color] of groundSections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }

  // Exposed roots — 5 lines from foreground tree bases across floor
  g.lineStyle(3, 0x0a1204, 1)
  const rootLines: Array<[number, number, number, number]> = [
    [18,          height * 0.57, 65,          height * 0.72],
    [28,          height * 0.59, 110,         height * 0.80],
    [width - 55,  height * 0.57, width - 15,  height * 0.74],
    [width - 30,  height * 0.59, width - 80,  height * 0.78],
    [80,          height * 0.56, 160,         height * 0.76],
  ]
  for (const [x1, y1, x2, y2] of rootLines) {
    g.lineBetween(x1, y1, x2, y2)
  }

  // ── Layer 7: Sickly light shaft — trapezoid, slow alpha pulse ─────────────
  const shaft = scene.add.graphics()
  shaft.fillStyle(0x88cc44, 1)
  shaft.fillTriangle(width * 0.44, 0, width * 0.56, 0, width * 0.35, height)
  shaft.fillTriangle(width * 0.56, 0, width * 0.65, height, width * 0.35, height)
  shaft.setAlpha(0.08)
  scene.tweens.add({
    targets: shaft,
    alpha: 0.14,
    duration: 4000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // ── Layer 8: Fog layers × 3 — drift at different speeds and phases ────────
  const fog1 = scene.add.rectangle(width / 2,      height * 0.57, width + 200, 22, 0x2a4a18, 0.28)
  const fog2 = scene.add.rectangle(width / 2 + 20,  height * 0.63, width + 200, 16, 0x223a12, 0.20)
  const fog3 = scene.add.rectangle(width / 2 - 10,  height * 0.69, width * 0.9, 13, 0x1a3010, 0.15)
  scene.tweens.add({ targets: fog1, x: width / 2 + 40, duration: 7000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog2, x: width / 2 - 30, duration: 5500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog3, x: width / 2 + 60, duration: 9000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  // ── Layer 9: Green motes — recycled pool, spawn in center clearing ────────
  const MAX_MOTES = 12
  const MOTE_X1 = 100
  const MOTE_X2 = width - 100
  const MOTE_Y1 = height * 0.60
  const MOTE_Y2 = height * 0.68

  const motes: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_MOTES }, () => {
    const m = scene.add.graphics()
    m.fillStyle(0x66ff44, 1)
    m.fillCircle(0, 0, 3)
    m.setAlpha(0)
    return m
  })

  const launchMote = (index: number): void => {
    const mote = motes[index]
    const mx = MOTE_X1 + Math.random() * (MOTE_X2 - MOTE_X1)
    const my = MOTE_Y1 + Math.random() * (MOTE_Y2 - MOTE_Y1)
    mote.setPosition(mx, my)
    mote.setAlpha(0.75)
    scene.tweens.add({
      targets: mote,
      y: my - 80,
      x: mx + (Math.random() - 0.5) * 40,
      alpha: 0,
      duration: 3000 + Math.random() * 2000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        scene.time.delayedCall(Math.random() * 2000, () => launchMote(index))
      },
    })
  }

  // Stagger initial launches so they don't all appear at once
  for (let i = 0; i < MAX_MOTES; i++) {
    scene.time.delayedCall(i * 600, () => launchMote(i))
  }

  // ── Layer 10: Watching eyes — 3 pairs blink independently in tree columns ─
  type EyeConfig = { ex: number; ey: number; initDelay: number }
  const eyeConfigs: EyeConfig[] = [
    { ex: 55,                ey: height * 0.38, initDelay: 0 },
    { ex: width - 60,        ey: height * 0.42, initDelay: 2500 },
    { ex: width * 0.5 + 10,  ey: height * 0.31, initDelay: 5000 },
  ]

  for (const { ex, ey, initDelay } of eyeConfigs) {
    const eyeGfx = scene.add.graphics()
    // Whites
    eyeGfx.fillStyle(0x99ff66, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 10, 7)
    eyeGfx.fillEllipse(ex + 7, ey, 10, 7)
    // Pupils
    eyeGfx.fillStyle(0x001500, 1)
    eyeGfx.fillEllipse(ex - 5, ey, 5, 4)
    eyeGfx.fillEllipse(ex + 7, ey, 5, 4)
    eyeGfx.setAlpha(0)

    const scheduleBlink = (): void => {
      scene.tweens.add({
        targets: eyeGfx,
        alpha: 1,
        duration: 200,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          scene.time.delayedCall(2000 + Math.random() * 2000, () => {
            scene.tweens.add({
              targets: eyeGfx,
              alpha: 0,
              duration: 400,
              ease: 'Sine.easeInOut',
              onComplete: () => {
                scene.time.delayedCall(3000 + Math.random() * 5000, scheduleBlink)
              },
            })
          })
        },
      })
    }

    scene.time.delayedCall(initDelay, scheduleBlink)
  }

  // ── Branch sway — innermost branch of first 2 columns, each side ──────────
  type BranchDef = { bx: number; by: number; bw: number; delay: number }
  const swayBranches: BranchDef[] = [
    { bx: 8,           by: height * 0.20, bw: 50, delay: 0 },     // left col 0 upper
    { bx: 24,          by: height * 0.38, bw: 38, delay: 400 },   // left col 1 lower
    { bx: width - 58,  by: height * 0.25, bw: 50, delay: 800 },   // right col 0 upper
    { bx: width - 44,  by: height * 0.40, bw: 38, delay: 1200 },  // right col 1 lower
  ]

  for (const { bx, by, bw, delay } of swayBranches) {
    const branchGfx = scene.add.graphics()
    branchGfx.fillStyle(0x060e04, 1)
    branchGfx.fillRect(0, -3, bw, 6)  // pivot at left edge, centered vertically
    branchGfx.setPosition(bx, by)
    branchGfx.setAngle(-3)  // start at -3° so sway is symmetric around resting position
    scene.time.delayedCall(delay, () => {
      scene.tweens.add({
        targets: branchGfx,
        angle: 3,
        duration: 2500 + delay * 0.25,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }
}

function drawMoonlitGladeBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale

  // ── Static base — persistent Graphics object (do NOT destroy) ───────────────
  const g = scene.add.graphics()

  // Layer 1: Deep night sky — 5-band gradient
  const skySections: Array<[number, number, number]> = [
    [0,             height * 0.12, 0x020308],
    [height * 0.12, height * 0.25, 0x040612],
    [height * 0.25, height * 0.38, 0x05081a],
    [height * 0.38, height * 0.52, 0x060a20],
    [height * 0.52, height * 0.60, 0x080c28],
  ]
  for (const [y1, y2, color] of skySections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }

  // Layer 2: Stars — bright 2×2 and faint 1×1 pixels
  g.fillStyle(0xddddff)
  const stars2x: Array<[number, number]> = [
    [90, 28], [200, 52], [380, 22], [520, 48], [680, 18], [820, 60], [990, 36],
    [1140, 50], [1210, 22], [160, 110], [320, 88], [600, 102], [780, 80],
    [1060, 96], [460, 130], [730, 120], [950, 108], [290, 145], [670, 138], [860, 148],
  ]
  for (const [sx, sy] of stars2x) g.fillRect(sx - 1, sy - 1, 2, 2)
  g.fillStyle(0xaaaacc)
  const stars1x: Array<[number, number]> = [
    [55, 35], [145, 70], [265, 45], [435, 82], [575, 25], [705, 75],
    [850, 42], [1010, 62], [1155, 38], [1240, 68], [190, 135], [415, 158],
    [545, 95], [640, 165], [775, 42], [1080, 140],
  ]
  for (const [sx, sy] of stars1x) g.fillRect(sx, sy, 1, 1)

  // Layer 3: Full moon — 5 concentric layers + craters
  const moonX = width * 0.72, moonY = 72
  g.fillStyle(0x333355); g.fillCircle(moonX, moonY, 58)
  g.fillStyle(0x5555aa); g.fillCircle(moonX, moonY, 50)
  g.fillStyle(0x8888bb); g.fillCircle(moonX, moonY, 40)
  g.fillStyle(0xbbbbcc); g.fillCircle(moonX, moonY, 30)
  g.fillStyle(0xdddde8); g.fillCircle(moonX, moonY, 20)
  g.fillStyle(0xaaaabc)
  g.fillCircle(moonX + 10, moonY - 8, 5)
  g.fillCircle(moonX - 8,  moonY + 9, 4)
  g.fillCircle(moonX + 3,  moonY + 14, 3)

  // Layer 4: Far tree layer — sine-varied dark silhouettes
  g.fillStyle(0x060a1a)
  for (let x = 0; x < width; x += 44) {
    const th = 80 + Math.sin(x * 0.08) * 30 + Math.sin(x * 0.18) * 15
    g.fillRect(x - 10, height * 0.59 - th, 20, th)
    g.fillRect(x - 22, height * 0.59 - th + 16, 44, 5)
    g.fillRect(x - 14, height * 0.59 - th + 32, 28, 4)
  }

  // Layer 5: Mid tree layer — closer, slightly wider with branch forks
  g.fillStyle(0x04060e)
  for (let x = 14; x < width; x += 66) {
    const th = 110 + Math.sin(x * 0.06) * 35 + Math.sin(x * 0.14) * 18
    g.fillRect(x - 14, height * 0.59 - th, 28, th)
    g.fillRect(x - 30, height * 0.59 - th + 20, 60, 5)
    g.fillRect(x - 20, height * 0.59 - th + 40, 40, 4)
    g.fillRect(x + 12, height * 0.59 - th + 30, 26, 3)
  }

  // Layer 6: Foreground trunk columns — 3 each side
  g.fillStyle(0x030408)
  for (let i = 0; i < 3; i++) {
    g.fillRect(i * 18 - 4,           0, 16, height)  // left
    g.fillRect(width - i * 18 - 12,  0, 16, height)  // right
    if (i < 2) {
      g.fillRect(i * 18 + 10,          height * 0.22 + i * 20, 42, 5)
      g.fillRect(width - i * 18 - 52,  height * 0.28 + i * 16, 42, 5)
    }
  }

  // Layer 7: Ground — 4-band silver-blue gradient
  const groundSections: Array<[number, number, number]> = [
    [height * 0.59, height * 0.68, 0x0c1022],
    [height * 0.68, height * 0.78, 0x090d1a],
    [height * 0.78, height * 0.88, 0x060a14],
    [height * 0.88, height,        0x04070e],
  ]
  for (const [y1, y2, color] of groundSections) {
    g.fillStyle(color)
    g.fillRect(0, y1, width, y2 - y1 + 1)
  }
  // Silver-grass tufts along treeline
  g.fillStyle(0x0e1428)
  for (let x = 0; x < width; x += 32) {
    const bh = 12 + ((x * 5) % 14)
    g.fillRect(x, height * 0.59, 24, bh)
  }

  // Layer 8: Crystal formations — 5 clusters
  const crystalClusters: Array<{ x: number; y: number }> = [
    { x: 160, y: height * 0.74 },
    { x: 400, y: height * 0.76 },
    { x: 680, y: height * 0.73 },
    { x: 900, y: height * 0.75 },
    { x: 1120, y: height * 0.74 },
  ]
  for (const cc of crystalClusters) {
    g.fillStyle(0x1a3388)
    g.fillRect(cc.x - 4,  cc.y - 22, 8,  22)
    g.fillRect(cc.x - 14, cc.y - 14, 6,  14)
    g.fillRect(cc.x + 8,  cc.y - 18, 6,  18)
    g.fillStyle(0x3366cc)
    g.fillRect(cc.x - 2,  cc.y - 22, 4,  8)
    g.fillRect(cc.x - 13, cc.y - 14, 3,  5)
    g.fillRect(cc.x + 9,  cc.y - 18, 3,  6)
  }

  // ── Moonbeam shaft (animated alpha pulse) ───────────────────────────────────
  const moonbeam = scene.add.graphics()
  moonbeam.fillStyle(0xaaaadd, 1)
  moonbeam.fillTriangle(moonX - 20, 0, moonX + 20, 0, moonX - 18, height)
  moonbeam.fillTriangle(moonX + 20, 0, moonX + 42, height, moonX - 18, height)
  moonbeam.setAlpha(0.05)
  scene.tweens.add({
    targets: moonbeam,
    alpha: 0.10,
    duration: 5000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // ── Moon halo rings (animated pulse) ────────────────────────────────────────
  const moonHalo = scene.add.graphics()
  moonHalo.lineStyle(2, 0x8888bb, 1); moonHalo.strokeCircle(moonX, moonY, 72)
  moonHalo.lineStyle(1, 0x6666aa, 1); moonHalo.strokeCircle(moonX, moonY, 88)
  moonHalo.lineStyle(1, 0x444499, 1); moonHalo.strokeCircle(moonX, moonY, 106)
  moonHalo.setAlpha(0.12)
  scene.tweens.add({
    targets: moonHalo,
    alpha: 0.22,
    duration: 4500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // ── Mist layers × 3 — drift at different speeds ──────────────────────────────
  const mist1 = scene.add.rectangle(width / 2,       height * 0.62, width + 200, 40, 0x8888bb, 1)
  const mist2 = scene.add.rectangle(width / 2 + 20,  height * 0.68, width + 200, 28, 0x6666aa, 1)
  const mist3 = scene.add.rectangle(width / 2 - 15,  height * 0.74, width * 0.85, 20, 0x555599, 1)
  mist1.setAlpha(0.14); mist2.setAlpha(0.10); mist3.setAlpha(0.08)
  scene.tweens.add({ targets: mist1, x: width / 2 + 50, duration: 6000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: mist2, x: width / 2 - 40, duration: 8000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: mist3, x: width / 2 + 60, duration: 5500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  // ── Crystal glow pulses ──────────────────────────────────────────────────────
  for (let ci = 0; ci < crystalClusters.length; ci++) {
    const cc = crystalClusters[ci]
    const cg = scene.add.rectangle(cc.x, cc.y - 12, 28, 28, 0x4488ff, 1)
    cg.setAlpha(0.04)
    scene.tweens.add({
      targets: cg,
      alpha: 0.14,
      duration: 2500 + ci * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // ── Silver firefly pool (10 fireflies, recycled) ─────────────────────────────
  const MAX_FIREFLIES = 10
  const fireflies: Phaser.GameObjects.Graphics[] = Array.from({ length: MAX_FIREFLIES }, () => {
    const ff = scene.add.graphics()
    ff.fillStyle(0xaaccff, 1)
    ff.fillCircle(0, 0, 2)
    ff.setAlpha(0)
    return ff
  })
  const launchFirefly = (index: number): void => {
    const ff = fireflies[index]
    const fx = 80 + Math.random() * (width - 160)
    const fy = height * 0.28 + Math.random() * (height * 0.38)
    ff.setPosition(fx, fy).setAlpha(0.72)
    scene.tweens.add({
      targets: ff,
      x: fx + (Math.random() - 0.5) * 80,
      y: fy + (Math.random() - 0.5) * 50,
      alpha: 0,
      duration: 3000 + Math.random() * 2000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        scene.time.delayedCall(Math.random() * 2500 + 800, () => launchFirefly(index))
      },
    })
  }
  for (let i = 0; i < MAX_FIREFLIES; i++) {
    scene.time.delayedCall(i * 500, () => launchFirefly(i))
  }

  // ── Floating 'N' rune pool (4 runes, recycled) ───────────────────────────────
  const MAX_RUNES = 4
  const runeSizes = [18, 22, 16, 20]
  const runeObjs: Phaser.GameObjects.Text[] = Array.from({ length: MAX_RUNES }, (_, i) =>
    scene.add.text(0, 0, 'N', {
      fontSize: `${runeSizes[i]}px`,
      color: i % 2 === 0 ? '#6688ff' : '#8844cc',
    }).setOrigin(0.5).setAlpha(0)
  )
  const launchRune = (index: number): void => {
    const rune = runeObjs[index]
    const rx = 100 + Math.random() * (width - 200)
    const ry = height * 0.50 + Math.random() * (height * 0.20)
    rune.setPosition(rx, ry).setAlpha(0.30)
    scene.tweens.add({
      targets: rune,
      y: ry - 60,
      alpha: 0,
      duration: 4500 + Math.random() * 2000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        scene.time.delayedCall(Math.random() * 4000 + 2000, () => launchRune(index))
      },
    })
  }
  for (let i = 0; i < MAX_RUNES; i++) {
    scene.time.delayedCall(i * 1200, () => launchRune(i))
  }
}

function drawVolcanicArenaBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Red-tinted rocky sky
  g.fillStyle(0x1a0808)
  g.fillRect(0, 0, width, height * 0.5)
  g.fillStyle(0x220a0a)
  for (let x = 0; x < width; x += 100) {
    const cy = 30 + ((x * 7) % 50)
    g.fillRect(x, cy, 88, 22)
  }

  // Jagged rock outcrops
  g.fillStyle(0x0e0808)
  const rocks = [
    { x: 60, h: 120, w: 50 }, { x: 130, h: 80, w: 40 },
    { x: width - 60, h: 130, w: 50 }, { x: width - 130, h: 90, w: 42 },
    { x: 220, h: 60, w: 34 }, { x: width - 220, h: 70, w: 36 },
  ]
  for (const rk of rocks) {
    const baseY = height * 0.5
    g.fillRect(rk.x - rk.w / 2, baseY - rk.h, rk.w, rk.h)
    g.fillRect(rk.x - rk.w / 4, baseY - rk.h - 16, rk.w / 2, 18)
    g.fillRect(rk.x - rk.w / 8, baseY - rk.h - 28, rk.w / 4, 14)
  }

  // Cracked stone floor
  g.fillStyle(0x120808)
  g.fillRect(0, height * 0.5, width, height * 0.5)
  g.fillStyle(0x883300)
  for (let x = 40; x < width; x += 160) {
    g.fillRect(x, height * 0.5, 3, height * 0.5)
    g.fillRect(x + 80, height * 0.6, 3, height * 0.4)
    g.fillRect(x + 40, height * 0.55, width * 0.08, 2)
  }
  g.destroy()

  const crackGlow = scene.add.rectangle(width / 2, height * 0.75, width, height * 0.5, 0xff4400, 0.06)
  scene.tweens.add({
    targets: crackGlow,
    alpha: 0.12,
    duration: 1400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  let embersAlive = 0
  const MAX_EMBERS = 12
  scene.time.addEvent({
    delay: 350,
    loop: true,
    callback: () => {
      if (embersAlive >= MAX_EMBERS) return
      const ex = 50 + Math.random() * (width - 100)
      const ember = scene.add.rectangle(ex, height * 0.9, 3, 3, 0xff6600, 0.8)
      embersAlive++
      scene.tweens.add({
        targets: ember,
        y: height * 0.3,
        x: ex + (Math.random() - 0.5) * 60,
        alpha: 0,
        duration: 2000 + Math.random() * 1500,
        ease: 'Quad.easeOut',
        onComplete: () => { ember.destroy(); embersAlive-- },
      })
    },
  })
}

function drawGenericArenaBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  g.fillStyle(0x1a1420)
  g.fillRect(0, 0, width, height * 0.65)
  const brickH = 28, brickW = 56
  g.fillStyle(0x120e18)
  for (let row = 0; row < Math.ceil(height * 0.65 / brickH); row++) {
    const offsetX = row % 2 === 0 ? 0 : brickW / 2
    for (let col = -1; col < Math.ceil(width / brickW) + 1; col++) {
      g.fillRect(col * brickW + offsetX, row * brickH, brickW, 2)
      g.fillRect(col * brickW + offsetX, row * brickH, 2, brickH)
    }
  }
  g.fillStyle(0x0e0c12)
  g.fillRect(0, height * 0.65, width, height * 0.35)
  g.fillStyle(0x0a0810)
  for (let x = 0; x < width; x += 60) g.fillRect(x, height * 0.65, 2, height * 0.35)
  for (let y = height * 0.65; y < height; y += 50) g.fillRect(0, y, width, 2)

  // Archway
  g.fillStyle(0x111118)
  g.fillRect(width / 2 - 80, 0, 160, height * 0.5)
  g.fillStyle(0x1a1420)
  g.fillRect(width / 2 - 60, 0, 120, height * 0.45)

  g.fillStyle(0x2a1a0a)
  g.fillRect(180, height * 0.3, 10, 24)
  g.fillRect(180, height * 0.27, 20, 7)
  g.fillRect(width - 190, height * 0.3, 10, 24)
  g.fillRect(width - 200, height * 0.27, 20, 7)
  g.destroy()

  for (const tx of [185, width - 185]) {
    const flame = scene.add.graphics()
    flame.fillStyle(0xff7700, 0.9)
    flame.fillRect(-4, -14, 8, 14)
    flame.fillStyle(0xffcc00, 0.8)
    flame.fillRect(-2, -18, 4, 10)
    flame.x = tx; flame.y = height * 0.27
    scene.tweens.add({
      targets: flame,
      alpha: 0.4, scaleY: 0.78, scaleX: 1.25,
      duration: 110, yoyo: true, repeat: -1,
    })
  }
}

// ── Exported dispatch function ────────────────────────────────────────────────

const miniBossVariants: Record<string, (scene: Phaser.Scene) => void> = {
  knuckle_keeper_of_e: drawForestClearingBg,
  nessa_keeper_of_n: drawMoonlitGladeBg,
  rend_the_red: drawVolcanicArenaBg,
  // Add future world mini-boss bossIds here
}

export function drawMiniBossBg(scene: Phaser.Scene, bossId: string): void {
  const drawFn = miniBossVariants[bossId] ?? drawGenericArenaBg
  drawFn(scene)
}
