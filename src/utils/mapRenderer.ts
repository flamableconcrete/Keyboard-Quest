// src/utils/mapRenderer.ts

import Phaser from 'phaser'
import type {
  WorldMapData,
  TileGrid,
  DecorationPlacement,
  AtmosphereEmitter,
} from '../data/maps/types'

const TILE_SIZE = 32

export class MapRenderer {
  private scene: Phaser.Scene
  private mapData: WorldMapData

  /** All tile images created by renderTileLayers */
  private tileImages: Phaser.GameObjects.Image[] = []
  /** All decoration sprites */
  private decorationSprites: Phaser.GameObjects.Image[] = []
  /** All tweens we created (for cleanup) */
  private tweens: Phaser.Tweens.Tween[] = []
  /** Path graphics objects */
  private pathGraphics: Phaser.GameObjects.Graphics[] = []
  /** Particle emitters */
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = []

  constructor(scene: Phaser.Scene, mapData: WorldMapData) {
    this.scene = scene
    this.mapData = mapData
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Render ground + detail tile grids as Phaser images. */
  renderTileLayers(): void {
    this.renderGrid(this.mapData.ground, 0)
    this.renderGrid(this.mapData.detail, 1)
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
    const gfx = this.scene.add.graphics()
    this.pathGraphics.push(gfx)

    // Build a single composite path for avatar movement
    const first = nodePositions[0] ?? { x: 0, y: 0 }
    const compositePath = new Phaser.Curves.Path(first.x, first.y)

    for (let i = 0; i < levels.length - 1; i++) {
      const from = nodePositions[i]
      const to = nodePositions[i + 1]
      if (!from || !to) continue

      const segment = pathSegments[i]
      const isCompleted = completedIds.has(levels[i].id)

      // Style: completed segments are brighter
      const color = isCompleted ? 0xaa8844 : 0x665533
      const alpha = isCompleted ? 1 : 0.6

      gfx.lineStyle(6, color, alpha)

      if (segment?.cx !== undefined && segment?.cy !== undefined) {
        // Quadratic bezier via control point
        const bezier = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(from.x, from.y),
          new Phaser.Math.Vector2(segment.cx, segment.cy),
          new Phaser.Math.Vector2(to.x, to.y),
        )
        // Draw the curve
        gfx.beginPath()
        const points = bezier.getPoints(32)
        gfx.moveTo(points[0].x, points[0].y)
        for (let p = 1; p < points.length; p++) {
          gfx.lineTo(points[p].x, points[p].y)
        }
        gfx.strokePath()

        // Add to composite path
        compositePath.quadraticBezierTo(to.x, to.y, segment.cx, segment.cy)
      } else {
        // Straight line
        gfx.beginPath()
        gfx.moveTo(from.x, from.y)
        gfx.lineTo(to.x, to.y)
        gfx.strokePath()

        compositePath.lineTo(to.x, to.y)
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

  /** Stub for animated tile cycling (to be implemented when tilesets are ready). */
  startAnimatedTiles(): void {
    // TODO: implement animated tile cycling once tileset spritesheets are finalized.
    // Will use this.mapData.animatedTiles to swap tile frames on a timer.
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

    for (const em of this.emitters) {
      em.destroy()
    }
    this.emitters.length = 0
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Render a single TileGrid layer as Phaser images with setCrop. */
  private renderGrid(grid: TileGrid, depth: number): void {
    const { tilesetKey, tilesetColumns } = this.mapData

    for (let row = 0; row < grid.length; row++) {
      const rowData = grid[row]
      for (let col = 0; col < rowData.length; col++) {
        const tileIndex = rowData[col]
        if (tileIndex < 0) continue // -1 = empty

        // Compute source position in tileset spritesheet
        const srcCol = tileIndex % tilesetColumns
        const srcRow = Math.floor(tileIndex / tilesetColumns)
        const srcX = srcCol * TILE_SIZE
        const srcY = srcRow * TILE_SIZE

        const img = this.scene.add.image(
          col * TILE_SIZE,
          row * TILE_SIZE,
          tilesetKey,
        )
        img.setOrigin(0, 0)
        img.setCrop(srcX, srcY, TILE_SIZE, TILE_SIZE)
        img.setDepth(depth)

        this.tileImages.push(img)
      }
    }
  }

  /** Place a single decoration sprite using setCrop from the tileset. */
  private placeDecorationSprite(
    deco: DecorationPlacement,
  ): Phaser.GameObjects.Image {
    const { tilesetKey, tilesetColumns } = this.mapData
    const srcCol = deco.tileIndex % tilesetColumns
    const srcRow = Math.floor(deco.tileIndex / tilesetColumns)
    const srcX = srcCol * TILE_SIZE
    const srcY = srcRow * TILE_SIZE

    const img = this.scene.add.image(deco.x, deco.y, tilesetKey)
    img.setOrigin(0, 0)
    img.setCrop(srcX, srcY, TILE_SIZE, TILE_SIZE)

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
          cfg.zone.x,
          cfg.zone.y,
          cfg.zone.width,
          cfg.zone.height,
        ),
      } as Phaser.Types.GameObjects.Particles.ParticleEmitterRandomZoneConfig,
    })

    return emitter
  }
}
