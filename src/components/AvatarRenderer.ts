import Phaser from 'phaser'
import { AVATAR_CONFIGS, type AvatarConfig } from '../data/avatars'

const GRID = 16
const PIXEL = 3
const SIZE = GRID * PIXEL // 48

export class AvatarRenderer {
  static generateAll(scene: Phaser.Scene): void {
    for (const config of AVATAR_CONFIGS) {
      AvatarRenderer.generateOne(scene, config)
    }
  }

  static generateOne(scene: Phaser.Scene, config: AvatarConfig): void {
    const rt = scene.make.renderTexture({ width: SIZE, height: SIZE }, false)
    const gfx = scene.make.graphics({}, false)

    AvatarRenderer.drawHead(gfx, config.skinTone)
    AvatarRenderer.drawEyes(gfx, config.eyeColor, config.hairColor)
    AvatarRenderer.drawMouth(gfx)
    AvatarRenderer.drawHair(gfx, config.hairStyle, config.hairColor)
    AvatarRenderer.drawAccessory(gfx, config.accessory, config.hairColor)

    rt.draw(gfx)
    rt.saveTexture(config.id)
    gfx.destroy()
    rt.destroy()
  }

  private static px(gfx: Phaser.GameObjects.Graphics, col: number, row: number, color: number): void {
    gfx.fillStyle(color)
    gfx.fillRect(col * PIXEL, row * PIXEL, PIXEL, PIXEL)
  }

  private static rect(
    gfx: Phaser.GameObjects.Graphics,
    col: number,
    row: number,
    w: number,
    h: number,
    color: number
  ): void {
    gfx.fillStyle(color)
    gfx.fillRect(col * PIXEL, row * PIXEL, w * PIXEL, h * PIXEL)
  }

  private static darken(color: number, amount = 30): number {
    return Phaser.Display.Color.IntegerToColor(color).darken(amount).color
  }

  // ── Head ──────────────────────────────────────────────────

  private static drawHead(gfx: Phaser.GameObjects.Graphics, skin: number): void {
    // Main face: cols 4-11, rows 4-13
    AvatarRenderer.rect(gfx, 4, 4, 8, 10, skin)
    // Wider middle: cols 3-12, rows 6-11
    AvatarRenderer.rect(gfx, 3, 6, 10, 6, skin)
    // Top rounding: cols 5-10, row 3
    AvatarRenderer.rect(gfx, 5, 3, 6, 1, skin)
    // Bottom rounding: cols 5-10, row 14
    AvatarRenderer.rect(gfx, 5, 14, 6, 1, skin)
    // Ears: col 2 and 13, rows 7-9
    AvatarRenderer.rect(gfx, 2, 7, 1, 3, skin)
    AvatarRenderer.rect(gfx, 13, 7, 1, 3, skin)
    // Neck: cols 6-9, row 15
    AvatarRenderer.rect(gfx, 6, 15, 4, 1, skin)
  }

  // ── Eyes ──────────────────────────────────────────────────

  private static drawEyes(
    gfx: Phaser.GameObjects.Graphics,
    eyeColor: number,
    hairColor: number
  ): void {
    // Whites: 2x2 at (5,8) and (9,8)
    AvatarRenderer.rect(gfx, 5, 8, 2, 2, 0xffffff)
    AvatarRenderer.rect(gfx, 9, 8, 2, 2, 0xffffff)
    // Pupils: single pixel at (6,9) and (10,9)
    AvatarRenderer.px(gfx, 6, 9, eyeColor)
    AvatarRenderer.px(gfx, 10, 9, eyeColor)
    // Eyebrows: 2x1 at (5,7) and (9,7) — darkened hair color
    const browColor = AvatarRenderer.darken(hairColor, 30)
    AvatarRenderer.rect(gfx, 5, 7, 2, 1, browColor)
    AvatarRenderer.rect(gfx, 9, 7, 2, 1, browColor)
  }

  // ── Mouth ─────────────────────────────────────────────────

  private static drawMouth(gfx: Phaser.GameObjects.Graphics): void {
    // 4x1 line at (6,12)
    AvatarRenderer.rect(gfx, 6, 12, 4, 1, 0xcc6666)
  }

  // ── Hair ──────────────────────────────────────────────────

  private static drawHair(
    gfx: Phaser.GameObjects.Graphics,
    style: string,
    color: number
  ): void {
    switch (style) {
      case 'short':
        // Top cap rows 3-4
        AvatarRenderer.rect(gfx, 4, 3, 8, 2, color)
        AvatarRenderer.rect(gfx, 5, 2, 6, 1, color)
        // Side strips
        AvatarRenderer.rect(gfx, 3, 4, 1, 4, color)
        AvatarRenderer.rect(gfx, 12, 4, 1, 4, color)
        break

      case 'long':
        // Larger cap
        AvatarRenderer.rect(gfx, 4, 2, 8, 3, color)
        AvatarRenderer.rect(gfx, 5, 1, 6, 1, color)
        // Long sides down to row 12
        AvatarRenderer.rect(gfx, 3, 4, 1, 9, color)
        AvatarRenderer.rect(gfx, 12, 4, 1, 9, color)
        AvatarRenderer.rect(gfx, 2, 5, 1, 6, color)
        AvatarRenderer.rect(gfx, 13, 5, 1, 6, color)
        break

      case 'mohawk':
        // Center spike rows 0-3
        AvatarRenderer.rect(gfx, 6, 0, 4, 1, color)
        AvatarRenderer.rect(gfx, 7, 1, 2, 1, color)
        AvatarRenderer.rect(gfx, 6, 2, 4, 1, color)
        AvatarRenderer.rect(gfx, 5, 3, 6, 1, color)
        break

      case 'bald':
        // Just a shine pixel at (7,4)
        AvatarRenderer.px(gfx, 7, 4, 0xffffff)
        break

      case 'spiky':
        // Top cap
        AvatarRenderer.rect(gfx, 4, 3, 8, 2, color)
        AvatarRenderer.rect(gfx, 5, 2, 6, 1, color)
        // Scattered spike pixels above
        AvatarRenderer.px(gfx, 5, 0, color)
        AvatarRenderer.px(gfx, 8, 0, color)
        AvatarRenderer.px(gfx, 11, 0, color)
        AvatarRenderer.px(gfx, 6, 1, color)
        AvatarRenderer.px(gfx, 9, 1, color)
        AvatarRenderer.px(gfx, 4, 1, color)
        break

      case 'ponytail':
        // Top cap
        AvatarRenderer.rect(gfx, 4, 3, 8, 2, color)
        AvatarRenderer.rect(gfx, 5, 2, 6, 1, color)
        // Trailing tail on right side
        AvatarRenderer.rect(gfx, 13, 3, 1, 2, color)
        AvatarRenderer.rect(gfx, 14, 4, 1, 3, color)
        AvatarRenderer.rect(gfx, 15, 6, 1, 3, color)
        break
    }
  }

  // ── Accessories ───────────────────────────────────────────

  private static drawAccessory(
    gfx: Phaser.GameObjects.Graphics,
    accessory: string,
    hairColor: number
  ): void {
    switch (accessory) {
      case 'none':
        break

      case 'helmet':
        // Gray cap covering top, rows 0-4
        AvatarRenderer.rect(gfx, 4, 0, 8, 5, 0x888888)
        AvatarRenderer.rect(gfx, 3, 2, 10, 3, 0x888888)
        AvatarRenderer.rect(gfx, 5, 0, 6, 1, 0xaaaaaa)
        break

      case 'headband':
        // Red 10x1 strip at row 5
        AvatarRenderer.rect(gfx, 3, 5, 10, 1, 0xcc2222)
        break

      case 'scar':
        // Diagonal red pixels on right cheek
        AvatarRenderer.px(gfx, 10, 9, 0xcc3333)
        AvatarRenderer.px(gfx, 11, 10, 0xcc3333)
        AvatarRenderer.px(gfx, 11, 11, 0xcc3333)
        break

      case 'glasses':
        // Blue-tinted frames around eyes with bridge
        AvatarRenderer.rect(gfx, 4, 7, 4, 4, 0x4466cc)
        AvatarRenderer.rect(gfx, 5, 8, 2, 2, 0xffffff) // clear left lens
        AvatarRenderer.rect(gfx, 8, 7, 4, 4, 0x4466cc)
        AvatarRenderer.rect(gfx, 9, 8, 2, 2, 0xffffff) // clear right lens
        // Bridge
        AvatarRenderer.rect(gfx, 8, 8, 1, 1, 0x4466cc)
        break

      case 'beard':
        // Hair-colored block below mouth, rows 12-15
        AvatarRenderer.rect(gfx, 5, 12, 6, 4, hairColor)
        break

      case 'eyepatch':
        // Dark block over right eye
        AvatarRenderer.rect(gfx, 9, 7, 3, 3, 0x222222)
        // Strap
        AvatarRenderer.rect(gfx, 3, 7, 1, 1, 0x222222)
        AvatarRenderer.rect(gfx, 12, 7, 1, 1, 0x222222)
        break

      case 'crown':
        // Gold base
        AvatarRenderer.rect(gfx, 4, 2, 8, 2, 0xffd700)
        // Points
        AvatarRenderer.px(gfx, 4, 1, 0xffd700)
        AvatarRenderer.px(gfx, 7, 0, 0xffd700)
        AvatarRenderer.px(gfx, 8, 0, 0xffd700)
        AvatarRenderer.px(gfx, 11, 1, 0xffd700)
        // Gems
        AvatarRenderer.px(gfx, 6, 2, 0xff0000)
        AvatarRenderer.px(gfx, 9, 2, 0x0044ff)
        break

      case 'horns':
        // Brown protrusions on sides
        AvatarRenderer.rect(gfx, 2, 3, 2, 2, 0x8b4513)
        AvatarRenderer.px(gfx, 1, 2, 0x8b4513)
        AvatarRenderer.rect(gfx, 12, 3, 2, 2, 0x8b4513)
        AvatarRenderer.px(gfx, 14, 2, 0x8b4513)
        break

      case 'bandana':
        // Blue band at row 4-5 with trailing end
        AvatarRenderer.rect(gfx, 3, 4, 10, 2, 0x2255cc)
        // Trailing end on right
        AvatarRenderer.rect(gfx, 13, 5, 1, 2, 0x2255cc)
        AvatarRenderer.rect(gfx, 14, 6, 1, 2, 0x2255cc)
        break
    }
  }
}
