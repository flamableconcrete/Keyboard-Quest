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
  const g = scene.add.graphics()

  // Murky sky (stacked gradient strips)
  const skyBands = [0x061206, 0x081608, 0x0a1a0a, 0x0c1e0c, 0x0e220e, 0x102610]
  const bandH = (height * 0.58) / skyBands.length
  for (let i = 0; i < skyBands.length; i++) {
    g.fillStyle(skyBands[i])
    g.fillRect(0, i * bandH, width, bandH + 1)
  }

  // Dead tree silhouettes (back layer)
  g.fillStyle(0x040c04)
  const trees = [50, 160, 290, 400, 540, 680, 810, 940, 1080, 1200]
  for (const tx of trees) {
    const th = 130 + ((tx * 3) % 70)
    const baseY = height * 0.55 - th
    // Trunk
    g.fillRect(tx - 6, baseY, 12, th)
    // Branches
    g.fillRect(tx - 32, baseY + 20, 64, 5)
    g.fillRect(tx - 22, baseY + 45, 44, 4)
    g.fillRect(tx + 8, baseY + 32, 32, 3)
    g.fillRect(tx - 38, baseY + 32, 28, 3)
    // Bare twigs
    g.fillRect(tx - 44, baseY + 20, 14, 3)
    g.fillRect(tx + 38, baseY + 20, 14, 3)
    g.fillRect(tx - 52, baseY + 17, 6, 3)
    g.fillRect(tx + 46, baseY + 17, 6, 3)
  }

  // Water surface
  g.fillStyle(0x050e05)
  g.fillRect(0, height * 0.58, width, height * 0.42)
  // Water shimmer lines
  g.fillStyle(0x0a1a0a)
  for (let wy = height * 0.60; wy < height; wy += 22) {
    g.fillRect(20, wy, width - 40, 2)
  }

  // Lily pads
  const lilies = [
    { x: 160, y: height * 0.68, r: 20 },
    { x: 430, y: height * 0.72, r: 24 },
    { x: 700, y: height * 0.64, r: 18 },
    { x: 960, y: height * 0.76, r: 22 },
    { x: 1120, y: height * 0.68, r: 15 },
  ]
  for (const lily of lilies) {
    g.fillStyle(0x1a4a1a)
    const r = lily.r
    g.fillRect(lily.x - r, lily.y - r / 2, r * 2, r)
    g.fillRect(lily.x - r / 2, lily.y - r, r, r * 2)
    // Notch (lily pad gap)
    g.fillStyle(0x050e05)
    g.fillRect(lily.x - 2, lily.y - r, 4, r + 2)
    // Tiny flower
    g.fillStyle(0xeeddaa)
    g.fillRect(lily.x - 2, lily.y - 2, 4, 4)
  }

  // Surface debris / dead leaves
  g.fillStyle(0x080f08)
  const debris = [[200, height * 0.65], [570, height * 0.73], [840, height * 0.66], [1050, height * 0.71]]
  for (const [dx, dy] of debris) {
    g.fillRect(dx, dy, 22, 7)
    g.fillRect(dx + 4, dy - 4, 14, 5)
  }
  g.destroy()

  // Fog layer (tweened)
  const fog1 = scene.add.rectangle(width / 2, height * 0.59, width + 200, 55, 0x1a3a1a, 0.2)
  const fog2 = scene.add.rectangle(width / 2, height * 0.62, width + 200, 40, 0x1a3a1a, 0.15)
  scene.tweens.add({ targets: fog1, x: width / 2 + 50, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: fog2, x: width / 2 - 40, duration: 7000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

  // Water ripples
  let ripplesAlive = 0
  const MAX_RIPPLES = 5
  scene.time.addEvent({
    delay: 1300,
    loop: true,
    callback: () => {
      if (ripplesAlive >= MAX_RIPPLES) return
      const rx = 80 + Math.random() * (width - 160)
      const ry = height * 0.63 + Math.random() * (height * 0.28)
      const rg = scene.add.graphics()
      rg.lineStyle(1, 0x1a4a1a, 0.5)
      rg.strokeEllipse(0, 0, 24, 10)
      rg.x = rx; rg.y = ry
      ripplesAlive++
      scene.tweens.add({
        targets: rg,
        scaleX: 3.5, scaleY: 3.5, alpha: 0,
        duration: 2000,
        onComplete: () => { rg.destroy(); ripplesAlive-- },
      })
    },
  })
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
  const g = scene.add.graphics()

  // Stone brick wall (upper 65%)
  g.fillStyle(0x1a1420)
  g.fillRect(0, 0, width, height * 0.65)
  const brickH = 28, brickW = 64
  for (let row = 0; row < Math.ceil(height * 0.65 / brickH); row++) {
    const offsetX = row % 2 === 0 ? 0 : brickW / 2
    g.fillStyle(0x120e1a)
    for (let col = -1; col < Math.ceil(width / brickW) + 1; col++) {
      const bx = col * brickW + offsetX
      const by = row * brickH
      g.fillRect(bx, by, brickW, 2)
      g.fillRect(bx, by, 2, brickH)
    }
  }

  // Dark stone floor (bottom 35%)
  g.fillStyle(0x0e0c12)
  g.fillRect(0, height * 0.65, width, height * 0.35)
  g.fillStyle(0x0a0810)
  for (let x = 0; x < width; x += 80) g.fillRect(x, height * 0.65, 2, height * 0.35)
  for (let y = height * 0.65; y < height; y += 60) g.fillRect(0, y, width, 2)

  // Stained glass window (top center)
  const winX = width / 2, winY = 60, winW = 120, winH = 140
  g.fillStyle(0x330044)
  g.fillRect(winX - winW / 2, winY, winW, winH)
  const panels = [
    { dx: -50, dy: 10, w: 40, h: 50, color: 0x8800aa },
    { dx: -8, dy: 10, w: 16, h: 80, color: 0xaa6600 },
    { dx: 10, dy: 10, w: 40, h: 50, color: 0x006688 },
    { dx: -50, dy: 65, w: 40, h: 50, color: 0x554400 },
    { dx: 10, dy: 65, w: 40, h: 50, color: 0x004455 },
  ]
  for (const p of panels) {
    g.fillStyle(p.color)
    g.fillRect(winX + p.dx, winY + p.dy, p.w, p.h)
  }
  // Window frame
  g.fillStyle(0x221a2a)
  g.fillRect(winX - winW / 2 - 6, winY - 6, winW + 12, 6)
  g.fillRect(winX - winW / 2 - 6, winY + winH, winW + 12, 6)
  g.fillRect(winX - winW / 2 - 6, winY, 6, winH)
  g.fillRect(winX + winW / 2, winY, 6, winH)

  // Purple tapestries
  g.fillStyle(0x3a0a50)
  g.fillRect(200, 10, 60, height * 0.55)
  g.fillRect(width - 260, 10, 60, height * 0.55)
  g.fillStyle(0x886600)
  g.fillRect(200, 10, 4, height * 0.55)
  g.fillRect(256, 10, 4, height * 0.55)
  g.fillRect(width - 260, 10, 4, height * 0.55)
  g.fillRect(width - 204, 10, 4, height * 0.55)
  g.fillRect(200, 10, 60, 4)
  g.fillRect(width - 260, 10, 60, 4)

  // Candelabra silhouettes
  const candleXs = [360, width - 360]
  for (const cx of candleXs) {
    g.fillStyle(0x221a2a)
    g.fillRect(cx - 3, height * 0.5, 6, height * 0.18)
    g.fillRect(cx - 18, height * 0.5, 36, 5)
    g.fillRect(cx - 18, height * 0.47, 5, 8)
    g.fillRect(cx + 13, height * 0.47, 5, 8)
    g.fillRect(cx - 2, height * 0.44, 4, 8)
  }
  g.destroy()

  // Candle flames (animated)
  const candleFlamePositions = [
    { x: 342, y: height * 0.44 },
    { x: 358, y: height * 0.44 },
    { x: 350, y: height * 0.41 },
    { x: width - 342, y: height * 0.44 },
    { x: width - 358, y: height * 0.44 },
    { x: width - 350, y: height * 0.41 },
  ]
  for (let i = 0; i < candleFlamePositions.length; i++) {
    const cf = candleFlamePositions[i]
    const flame = scene.add.graphics()
    flame.fillStyle(0xff8800, 0.95)
    flame.fillRect(-2, -8, 4, 8)
    flame.fillStyle(0xffdd00, 0.8)
    flame.fillRect(-1, -10, 2, 5)
    flame.x = cf.x; flame.y = cf.y
    scene.tweens.add({
      targets: flame,
      alpha: 0.4 + (i % 3) * 0.1,
      scaleY: 0.75,
      scaleX: 1.3,
      duration: 80 + i * 20,
      yoyo: true,
      repeat: -1,
    })
  }

  // Tapestry sway (invisible pivot rectangles — just for tweening)
  const tapestryL = scene.add.rectangle(230, height * 0.275 + 10, 60, height * 0.55, 0x3a0a50, 0.01)
  const tapestryR = scene.add.rectangle(width - 230, height * 0.275 + 10, 60, height * 0.55, 0x3a0a50, 0.01)
  scene.tweens.add({ targets: tapestryL, angle: 1.5, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
  scene.tweens.add({ targets: tapestryR, angle: -1.5, duration: 3500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
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
  const g = scene.add.graphics()

  // Stormy sky (near-black purple)
  g.fillStyle(0x0e0810)
  g.fillRect(0, 0, width, height * 0.6)
  g.fillStyle(0x110d14)
  for (let x = 0; x < width; x += 160) {
    const cy = 20 + ((x * 5) % 80)
    g.fillRect(x, cy, 140, 30)
    g.fillRect(x + 20, cy - 12, 100, 14)
  }

  // Dead gnarled trees
  g.fillStyle(0x070508)
  const treeDefs = [
    { x: 80, h: 180 }, { x: 200, h: 140 }, { x: width - 80, h: 200 },
    { x: width - 200, h: 150 }, { x: 440, h: 100 }, { x: width - 440, h: 110 },
  ]
  for (const td of treeDefs) {
    const baseY = height * 0.58
    g.fillRect(td.x - 8, baseY - td.h, 16, td.h)
    g.fillRect(td.x - 40, baseY - td.h + 20, 80, 5)
    g.fillRect(td.x - 28, baseY - td.h + 40, 56, 4)
    g.fillRect(td.x + 10, baseY - td.h + 30, 36, 3)
    g.fillRect(td.x - 44, baseY - td.h + 30, 26, 3)
    g.fillRect(td.x - 48, baseY - td.h + 20, 10, 3)
    g.fillRect(td.x + 38, baseY - td.h + 20, 10, 3)
    g.fillRect(td.x - 52, baseY - td.h + 17, 6, 3)
    g.fillRect(td.x + 46, baseY - td.h + 17, 6, 3)
  }

  // Dead grass ground (lower 40%)
  g.fillStyle(0x0c0c0c)
  g.fillRect(0, height * 0.6, width, height * 0.4)
  g.fillStyle(0x0f0f0f)
  for (let x = 0; x < width; x += 30) {
    g.fillRect(x, height * 0.6, 20, 4)
  }

  // Tombstones
  const tombstones = [
    { x: 140, y: height * 0.68, w: 36, h: 50 },
    { x: 320, y: height * 0.7, w: 30, h: 44 },
    { x: 550, y: height * 0.66, w: 40, h: 54 },
    { x: 780, y: height * 0.69, w: 34, h: 48 },
    { x: 990, y: height * 0.67, w: 38, h: 52 },
    { x: 1150, y: height * 0.71, w: 28, h: 42 },
  ]
  for (const ts of tombstones) {
    g.fillStyle(0x1a1a1a)
    g.fillRect(ts.x - ts.w / 2, ts.y - ts.h, ts.w, ts.h)
    g.fillRect(ts.x - ts.w / 2 + 4, ts.y - ts.h - 8, ts.w - 8, 10)
    g.fillStyle(0x0d0d0d)
    g.fillRect(ts.x - 2, ts.y - ts.h + 8, 4, 18)
    g.fillRect(ts.x - 8, ts.y - ts.h + 12, 16, 4)
    g.fillStyle(0x141414)
    g.fillRect(ts.x - ts.w / 2 - 4, ts.y - 6, ts.w + 8, 6)
  }
  g.destroy()

  // Ground fog layer
  const fog = scene.add.rectangle(width / 2, height * 0.66, width + 300, 70, 0x221a33, 0.2)
  scene.tweens.add({
    targets: fog,
    x: width / 2 + 60,
    duration: 6000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // Lightning flash (white overlay, triggered by timer)
  const lightning = scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0)
  scene.time.addEvent({
    delay: 5000,
    loop: true,
    callback: () => {
      const flashDelay = Math.random() * 4000
      scene.time.delayedCall(flashDelay, () => {
        scene.tweens.add({
          targets: lightning,
          alpha: 0.18,
          duration: 60,
          yoyo: true,
          repeat: 1,
        })
      })
    },
  })
}
export function drawDarkForestBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  // Deep blue-black sky
  g.fillStyle(0x050810)
  g.fillRect(0, 0, width, height * 0.55)

  // Background tree layer (farthest, darkest)
  g.fillStyle(0x040608)
  for (let x = 0; x < width; x += 70) {
    const th = 140 + ((x * 3) % 80)
    const tw = 40 + ((x * 7) % 20)
    g.fillRect(x, height * 0.55 - th, tw, th)
    g.fillRect(x - 10, height * 0.55 - th + 20, tw + 20, 20)
    g.fillRect(x - 5, height * 0.55 - th + 40, tw + 10, 20)
  }

  // Mid tree layer
  g.fillStyle(0x060a0e)
  for (let x = -20; x < width; x += 90) {
    const th = 110 + ((x * 11) % 60)
    const tw = 36 + ((x * 5) % 22)
    g.fillRect(x, height * 0.58 - th, tw, th)
    g.fillRect(x - 14, height * 0.58 - th + 10, tw + 28, 22)
    g.fillRect(x - 8, height * 0.58 - th + 30, tw + 16, 18)
  }

  // Foreground tree layer (closest, tallest)
  g.fillStyle(0x040507)
  for (let x = -30; x < width + 30; x += 120) {
    const _th = 200 + ((x * 7) % 100)
    void _th
    const tw = 50 + ((x * 3) % 30)
    g.fillRect(x, 0, tw, height * 0.65)
    g.fillRect(x - 20, height * 0.1, tw + 40, 30)
    g.fillRect(x - 12, height * 0.2, tw + 24, 24)
  }

  // Dense undergrowth
  g.fillStyle(0x040706)
  g.fillRect(0, height * 0.58, width, height * 0.42)
  g.fillStyle(0x060a08)
  for (let x = 0; x < width; x += 50) {
    const bh = 16 + ((x * 3) % 20)
    g.fillRect(x, height * 0.58, 44, bh)
  }

  // Pale moon
  g.fillStyle(0x8888aa)
  g.fillCircle(width * 0.52, 60, 30)
  g.fillStyle(0xaaaabb)
  g.fillCircle(width * 0.52, 60, 22)
  g.fillStyle(0xccccdd)
  g.fillCircle(width * 0.52, 60, 14)
  // Cloud occlusion
  g.fillStyle(0x050810)
  g.fillRect(width * 0.52 - 28, 44, 20, 10)
  g.fillRect(width * 0.52 + 8, 38, 24, 12)
  g.destroy()

  // Moonlight shaft
  const moonShaft = scene.add.rectangle(width * 0.52, height * 0.35, 60, height * 0.7, 0xffffff, 0.04)
  scene.tweens.add({
    targets: moonShaft,
    alpha: 0.07,
    duration: 3000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  // Firefly particles
  let firefliesAlive = 0
  const MAX_FIREFLIES = 10
  scene.time.addEvent({
    delay: 600,
    loop: true,
    callback: () => {
      if (firefliesAlive >= MAX_FIREFLIES) return
      const fx = 100 + Math.random() * (width - 200)
      const fy = height * 0.25 + Math.random() * (height * 0.4)
      const ff = scene.add.graphics()
      ff.fillStyle(0xffff88, 0.8)
      ff.fillRect(-2, -2, 4, 4)
      ff.x = fx; ff.y = fy
      firefliesAlive++
      scene.tweens.add({
        targets: ff,
        x: fx + (Math.random() - 0.5) * 100,
        y: fy + (Math.random() - 0.5) * 60,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        onComplete: () => { ff.destroy(); firefliesAlive-- },
      })
    },
  })
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
    m.fillStyle(0x66ff44, 0.75)
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
}

function drawMoonlitGladeBg(scene: Phaser.Scene): void {
  const { width, height } = scene.scale
  const g = scene.add.graphics()

  g.fillStyle(0x05081a)
  g.fillRect(0, 0, width, height * 0.6)

  // Stars
  g.fillStyle(0xccccdd)
  const starPositions = [
    [120, 40], [240, 80], [400, 30], [560, 60], [720, 25], [880, 70],
    [1040, 45], [1180, 55], [180, 120], [340, 100], [660, 110], [820, 90],
    [1100, 115], [500, 140], [760, 135], [980, 125], [300, 160], [700, 155],
  ]
  for (const [sx, sy] of starPositions) {
    g.fillRect(sx - 1, sy - 1, 2, 2)
  }

  // Large full moon
  g.fillStyle(0x9999aa)
  g.fillCircle(width * 0.72, 80, 48)
  g.fillStyle(0xbbbbcc)
  g.fillCircle(width * 0.72, 80, 38)
  g.fillStyle(0xccccdd)
  g.fillCircle(width * 0.72, 80, 28)
  g.fillStyle(0xaaaabc)
  g.fillCircle(width * 0.72 + 12, 68, 7)
  g.fillCircle(width * 0.72 - 10, 88, 5)

  // Silver-lit tree silhouettes
  g.fillStyle(0x0a0f1e)
  for (let x = 20; x < width; x += 80) {
    const th = 160 + ((x * 5) % 80)
    const tw = 32 + ((x * 3) % 18)
    g.fillRect(x - tw / 2, height * 0.58 - th, tw, th)
    g.fillRect(x - tw, height * 0.58 - th + 15, tw * 2, 22)
    g.fillRect(x - tw * 0.7, height * 0.58 - th + 38, tw * 1.4, 18)
  }

  // Silver ground
  g.fillStyle(0x0e1020)
  g.fillRect(0, height * 0.58, width, height * 0.42)
  g.fillStyle(0x131525)
  for (let x = 0; x < width; x += 50) g.fillRect(x, height * 0.58, 36, 5)
  g.destroy()

  const moonbeam = scene.add.rectangle(width * 0.72, height * 0.78, 100, height * 0.44, 0xaaaadd, 0.05)
  scene.tweens.add({
    targets: moonbeam,
    alpha: 0.1,
    duration: 4000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })

  const mist = scene.add.rectangle(width / 2, height * 0.65, width + 200, 50, 0x8888aa, 0.15)
  scene.tweens.add({
    targets: mist,
    x: width / 2 + 50,
    duration: 5500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })
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
