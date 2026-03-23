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
export function drawCryptBg(_scene: Phaser.Scene): void {}
export function drawCastleThroneRoomBg(_scene: Phaser.Scene): void {}
export function drawEtherealVoidBg(_scene: Phaser.Scene): void {}
export function drawVolcanicLairBg(_scene: Phaser.Scene): void {}
export function drawSteampunkWorkshopBg(_scene: Phaser.Scene): void {}
export function drawGraveyardBg(_scene: Phaser.Scene): void {}
export function drawDarkForestBg(_scene: Phaser.Scene): void {}
export function drawDigitalVoidBg(_scene: Phaser.Scene): void {}
export function drawMiniBossBg(_scene: Phaser.Scene, _bossId: string): void {}
