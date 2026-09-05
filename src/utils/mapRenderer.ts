// src/utils/mapRenderer.ts

import Phaser from 'phaser'
import type {
  WorldMapData,
  TileGrid,
  DecorationPlacement,
  AtmosphereEmitter,
} from '../data/maps/types'
import { getOverworldPalette } from './overworldArtDirection'
import { frameForElapsedTime } from './animatedTiles'

const TILE_SIZE = 32

export class MapRenderer {
  private scene: Phaser.Scene
  private mapData: WorldMapData
  private xOffset: number

  /** All tile images created by renderTileLayers */
  private tileImages: Phaser.GameObjects.Image[] = []
  /** All decoration sprites */
  private decorationSprites: Phaser.GameObjects.Image[] = []
  /** All tweens we created (for cleanup) */
  private tweens: Phaser.Tweens.Tween[] = []
  /** Path graphics objects */
  private pathGraphics: Phaser.GameObjects.Graphics[] = []
  /** Light, bevel, and shadow overlays for the shallow 2.5D map treatment. */
  private depthObjects: Phaser.GameObjects.GameObject[] = []
  /** Tile images that take part in a water/lava/void animation. */
  private animatedTileImages: { image: Phaser.GameObjects.Image; frames: number[]; frameDuration: number }[] = []
  /** Scene timers used by this renderer. */
  private timerEvents: Phaser.Time.TimerEvent[] = []
  /** Particle emitters */
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []

  constructor(scene: Phaser.Scene, mapData: WorldMapData, xOffset = 0) {
    this.scene = scene
    this.mapData = mapData
    this.xOffset = xOffset
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Render ground + detail tile grids as Phaser images. */
  renderTileLayers(): void {
    this.renderGrid(this.mapData.ground, 0)
    this.renderGrid(this.mapData.detail, 1)
    this.renderTileBevels()
    this.renderWorldLighting()
  }

  /** Place decoration sprites with ambient animations. */
  renderDecorations(): void {
    for (const deco of this.mapData.decorations) {
      const img = this.placeDecorationSprite(deco)
      this.decorationSprites.push(img)
      this.applyDecorationTweens(img, deco)
    }
  }

  /**
   * Draw curved bezier paths between consecutive nodes.
   * Returns a composite Phaser.Curves.Path for avatar path-following.
   */
  renderPaths(
    levels: { id: string }[],
    completedIds: Set<string>,
  ): Phaser.Curves.Path {
    const { nodePositions, pathSegments } = this.mapData
    const ox = this.xOffset  // shorthand
    const gfx = this.scene.add.graphics()
    this.pathGraphics.push(gfx)

    const first = nodePositions[0] ?? { x: 0, y: 0 }
    const compositePath = new Phaser.Curves.Path(ox + first.x, first.y)

    for (let i = 0; i < levels.length - 1; i++) {
      const from = nodePositions[i]
      const to = nodePositions[i + 1]
      if (!from || !to) continue

      const segment = pathSegments[i]
      const isCompleted = completedIds.has(levels[i].id)
      const color = isCompleted ? 0xaa8844 : 0x665533
      const alpha = isCompleted ? 1 : 0.6

      // A shadowed under-stroke plus a fine highlight makes each route read
      // like a raised ribbon instead of a flat painted line.
      gfx.lineStyle(11, 0x21180f, alpha * 0.42)

      const fx = ox + from.x, fy = from.y
      const tx = ox + to.x,   ty = to.y

      if (segment?.cx !== undefined && segment?.cy !== undefined) {
        const bezier = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(fx, fy),
          new Phaser.Math.Vector2(ox + segment.cx, segment.cy),
          new Phaser.Math.Vector2(tx, ty),
        )
        gfx.beginPath()
        const points = bezier.getPoints(32)
        gfx.moveTo(points[0].x, points[0].y)
        for (let p = 1; p < points.length; p++) {
          gfx.lineTo(points[p].x, points[p].y)
        }
        gfx.strokePath()
        gfx.lineStyle(6, color, alpha)
        gfx.strokePath()
        gfx.lineStyle(1.5, 0xffe7a3, alpha * 0.55)
        gfx.strokePath()
        compositePath.quadraticBezierTo(tx, ty, ox + segment.cx, segment.cy)
      } else {
        gfx.beginPath()
        gfx.moveTo(fx, fy)
        gfx.lineTo(tx, ty)
        gfx.strokePath()
        gfx.lineStyle(6, color, alpha)
        gfx.strokePath()
        gfx.lineStyle(1.5, 0xffe7a3, alpha * 0.55)
        gfx.strokePath()
        compositePath.lineTo(tx, ty)
      }
    }

    return compositePath
  }

  /** Create particle emitters from atmosphere config. */
  startAtmosphere(): void {
    for (const cfg of this.mapData.atmosphere) {
      const emitter = this.createAtmosphereEmitter(cfg)
      this.emitters.push(emitter)
    }
  }

  /** Animate water, lava, moss, and void tiles using their map-defined frames. */
  startAnimatedTiles(): void {
    if (this.animatedTileImages.length === 0) return

    const startTime = this.scene.time.now
    const timer = this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const elapsed = this.scene.time.now - startTime
        for (const animated of this.animatedTileImages) {
          const frame = frameForElapsedTime(animated.frames, animated.frameDuration, elapsed)
          if (frame !== undefined) animated.image.setFrame(frame)
        }
      },
    })
    this.timerEvents.push(timer)
  }

  /** Clean up all created objects. */
  destroy(): void {
    for (const img of this.tileImages) {
      img.destroy()
    }
    this.tileImages.length = 0

    for (const spr of this.decorationSprites) {
      spr.destroy()
    }
    this.decorationSprites.length = 0

    for (const tw of this.tweens) {
      tw.destroy()
    }
    this.tweens.length = 0

    for (const gfx of this.pathGraphics) {
      gfx.destroy()
    }
    this.pathGraphics.length = 0

    for (const obj of this.depthObjects) {
      obj.destroy()
    }
    this.depthObjects.length = 0

    for (const timer of this.timerEvents) {
      timer.destroy()
    }
    this.timerEvents.length = 0
    this.animatedTileImages.length = 0

    for (const em of this.emitters) {
      em.destroy()
    }
    this.emitters.length = 0
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Render a single TileGrid layer as Phaser images using spritesheet frames. */
  private renderGrid(grid: TileGrid, depth: number): void {
    const { tilesetKey } = this.mapData

    for (let row = 0; row < grid.length; row++) {
      const rowData = grid[row]
      for (let col = 0; col < rowData.length; col++) {
        const tileIndex = rowData[col]
        if (tileIndex < 0) continue // -1 = empty

        const img = this.scene.add.image(
          this.xOffset + col * TILE_SIZE,
          row * TILE_SIZE,
          tilesetKey,
          tileIndex,
        )
        img.setOrigin(0, 0)
        img.setDepth(depth)

        const animation = this.mapData.animatedTiles.find(definition => definition.frames.includes(tileIndex))
        if (animation) {
          this.animatedTileImages.push({
            image: img,
            frames: animation.frames,
            frameDuration: animation.frameDuration,
          })
        }

        this.tileImages.push(img)
      }
    }
  }

  /**
   * Bevel only paths and water; outlining every grass tile would turn the map
   * into visual noise. The small light/shadow pairs supply depth while keeping
   * the pixel-art materials crisp and readable.
   */
  private renderTileBevels(): void {
    const gfx = this.scene.add.graphics().setDepth(2)
    const ground = this.mapData.ground
    const palette = getOverworldPalette(this.mapData.world)

    for (let row = 0; row < ground.length; row++) {
      for (let col = 0; col < ground[row].length; col++) {
        const tile = ground[row][col]
        const x = this.xOffset + col * TILE_SIZE
        const y = row * TILE_SIZE

        // Indices 2–4 are route tiles in each current world tileset; 10 is water.
        if (tile >= 2 && tile <= 4) {
          gfx.fillStyle(0xffedbd, 0.18)
          gfx.fillRect(x + 1, y + 1, TILE_SIZE - 2, 2)
          gfx.fillStyle(palette.shadow, 0.32)
          gfx.fillRect(x + 1, y + TILE_SIZE - 3, TILE_SIZE - 2, 2)
          gfx.fillRect(x + TILE_SIZE - 3, y + 3, 2, TILE_SIZE - 6)
        } else if (tile === 10) {
          gfx.fillStyle(palette.accent, 0.23)
          gfx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 1)
          gfx.fillStyle(palette.shadow, 0.36)
          gfx.fillRect(x + 1, y + TILE_SIZE - 3, TILE_SIZE - 2, 2)
        }
      }
    }

    this.depthObjects.push(gfx)
  }

  /**
   * A few broad, translucent forms make each world read as a place with air,
   * light, and a foreground canopy—not just a sheet of tiles. They are
   * deliberately low contrast so level nodes and routes remain the focus.
   */
  private renderWorldLighting(): void {
    const gfx = this.scene.add.graphics().setDepth(3)
    const palette = getOverworldPalette(this.mapData.world)
    const width = this.mapData.ground[0].length * TILE_SIZE
    const x = this.xOffset

    // Shared late-afternoon / moonlit wash, brightest at the upper-left.
    gfx.fillStyle(palette.haze, 0.055)
    gfx.fillTriangle(x, 0, x + width * 0.62, 0, x, 500)
    gfx.fillStyle(palette.shadow, 0.05)
    gfx.fillTriangle(x + width, 720, x + width * 0.34, 720, x + width, 210)

    if (this.mapData.world === 1) {
      // Soft, rounded cloud shadows drifting over the Heartland.
      gfx.fillStyle(0xffffff, 0.07)
      for (let i = 0; i < 6; i++) gfx.fillEllipse(x + 160 + i * 360, 92 + (i % 2) * 90, 260, 48)
    } else if (this.mapData.world === 2) {
      // Low rolling fog banks in the Shadowed Fen.
      gfx.fillStyle(palette.haze, 0.11)
      for (let i = 0; i < 8; i++) gfx.fillEllipse(x + 80 + i * 330, 590 + (i % 3) * 28, 300, 74)
    } else if (this.mapData.world === 3) {
      // Lava's warm bounce light stains nearby volcanic rock.
      gfx.fillStyle(palette.accent, 0.08)
      for (let i = 0; i < 6; i++) gfx.fillCircle(x + 350 + i * 390, 420 - (i % 2) * 160, 118)
    } else if (this.mapData.world === 4) {
      // Dark leaf masses frame the Wilds, creating a strong foreground layer.
      gfx.fillStyle(palette.shadow, 0.16)
      for (let i = 0; i < 12; i++) gfx.fillCircle(x + 60 + i * 230, 22 + (i % 3) * 18, 92)
      gfx.fillStyle(palette.accent, 0.06)
      for (let i = 0; i < 7; i++) gfx.fillCircle(x + 120 + i * 385, 650, 76)
    } else if (this.mapData.world === 5) {
      // Star motes behind the tower's floor plates give the void actual depth.
      gfx.fillStyle(palette.accent, 0.45)
      for (let i = 0; i < 24; i++) {
        const starX = x + 38 + ((i * 137) % Math.max(1, width - 76))
        const starY = 38 + ((i * 83) % 640)
        gfx.fillCircle(starX, starY, i % 5 === 0 ? 2 : 1)
      }
    }

    this.depthObjects.push(gfx)
  }

  /** Place a single decoration sprite using spritesheet frame from the tileset. */
  private placeDecorationSprite(
    deco: DecorationPlacement,
  ): Phaser.GameObjects.Image {
    const { tilesetKey } = this.mapData

    const worldX = this.xOffset + deco.x
    // Contact shadows make props feel planted above the terrain plane.
    const palette = getOverworldPalette(this.mapData.world)
    const shadow = this.scene.add.ellipse(worldX + 17, deco.y + 29, 25, 8, palette.shadow, 0.28)
      .setDepth(deco.y - 0.25)
    this.depthObjects.push(shadow)

    const img = this.scene.add.image(worldX, deco.y, tilesetKey, deco.tileIndex)
    img.setOrigin(0, 0)

    if (deco.depthOffset !== undefined) {
      img.setDepth(deco.y + deco.depthOffset)
    } else {
      img.setDepth(deco.y)
    }

    return img
  }

  /** Apply ambient tweens to a decoration sprite based on its config flags. */
  private applyDecorationTweens(
    img: Phaser.GameObjects.Image,
    deco: DecorationPlacement,
  ): void {
    if (deco.sway) {
      const duration = Phaser.Math.Between(2000, 3000)
      const tw = this.scene.tweens.add({
        targets: img,
        angle: { from: -2, to: 2 },
        duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })
      this.tweens.push(tw)
    }

    if (deco.pulse) {
      const duration = Phaser.Math.Between(1500, 2000)
      const tw = this.scene.tweens.add({
        targets: img,
        scaleX: { from: 1, to: 1.05 },
        scaleY: { from: 1, to: 1.05 },
        duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })
      this.tweens.push(tw)
    }

    if (deco.flicker) {
      const duration = Phaser.Math.Between(300, 500)
      const tw = this.scene.tweens.add({
        targets: img,
        alpha: { from: 0.7, to: 1 },
        duration,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      })
      this.tweens.push(tw)
    }
  }

  /** Create a single particle emitter from atmosphere config. */
  private createAtmosphereEmitter(
    cfg: AtmosphereEmitter,
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const emitter = this.scene.add.particles(0, 0, 'map-common', {
      frame: cfg.particleFrame,
      tint: cfg.tint,
      frequency: cfg.frequency,
      lifespan: cfg.lifespan,
      speed: cfg.speed,
      gravityY: cfg.gravityY ?? 0,
      scale: cfg.scale
        ? { start: cfg.scale.start, end: cfg.scale.end }
        : undefined,
      alpha: cfg.alpha
        ? { start: cfg.alpha.start, end: cfg.alpha.end }
        : undefined,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(
          this.xOffset + cfg.zone.x,
          cfg.zone.y,
          cfg.zone.width,
          cfg.zone.height,
        ),
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterRandomZoneConfig,
    })

    return emitter
  }
}
