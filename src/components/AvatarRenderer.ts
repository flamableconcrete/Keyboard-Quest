import Phaser from 'phaser'
import { AVATAR_CONFIGS, type AvatarConfig } from '../data/avatars'
import type { EquipmentData } from '../types'

const GRID = 16
const PIXEL = 3
const WIDTH = GRID * PIXEL // 48
const HEIGHT = 32 * PIXEL // 96

export class AvatarRenderer {
  static generateAll(scene: Phaser.Scene): void {
    for (const config of AVATAR_CONFIGS) {
      if (scene.textures.exists(config.id)) continue
      AvatarRenderer.generateOne(scene, config)
    }
  }

  static generateOne(scene: Phaser.Scene, config: AvatarConfig, equipment?: EquipmentData | null): void {
    const rt = scene.make.renderTexture({ width: WIDTH, height: HEIGHT }, false)
    const gfx = scene.make.graphics({}, false)

AvatarRenderer.drawHead(gfx, config.skinTone)
    AvatarRenderer.drawEyes(gfx, config.eyeColor, config.hairColor)
    AvatarRenderer.drawMouth(gfx)
    AvatarRenderer.drawHair(gfx, config.hairStyle, config.hairColor)
    AvatarRenderer.drawBody(gfx, config)
    AvatarRenderer.drawAccessory(gfx, config.accessory, config.hairColor)

    if (equipment) {
      AvatarRenderer.drawEquipment(gfx, equipment)
    }

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

  // ── Body ──────────────────────────────────────────────────

  private static drawBody(gfx: Phaser.GameObjects.Graphics, config: AvatarConfig): void {
    const { skinTone, shirtColor, pantsColor, shoeColor } = config

    // Torso (shirt): cols 4-11, rows 16-23
    AvatarRenderer.rect(gfx, 4, 16, 8, 8, shirtColor)

    // Shoulders/Arms (shirt): cols 2-3 and 12-13, rows 16-20
    AvatarRenderer.rect(gfx, 2, 16, 2, 5, shirtColor)
    AvatarRenderer.rect(gfx, 12, 16, 2, 5, shirtColor)

    // Hands (skin): cols 2-3 and 12-13, rows 21-23
    AvatarRenderer.rect(gfx, 2, 21, 2, 3, skinTone)
    AvatarRenderer.rect(gfx, 12, 21, 2, 3, skinTone)

    // Pants (Left Leg): cols 4-7, rows 24-28
    AvatarRenderer.rect(gfx, 4, 24, 3, 5, pantsColor)

    // Pants (Right Leg): cols 9-12, rows 24-28
    AvatarRenderer.rect(gfx, 9, 24, 3, 5, pantsColor)

    // Waistband
    AvatarRenderer.rect(gfx, 4, 24, 8, 1, pantsColor)

    // Shoes: cols 3-6 and 9-12, rows 29-30
    AvatarRenderer.rect(gfx, 4, 29, 3, 2, shoeColor)
    AvatarRenderer.rect(gfx, 9, 29, 3, 2, shoeColor)
    // Shoe tips
    AvatarRenderer.rect(gfx, 3, 30, 1, 1, shoeColor)
    AvatarRenderer.rect(gfx, 12, 30, 1, 1, shoeColor)
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

  private static drawEquipment(
    gfx: Phaser.GameObjects.Graphics,
    equipment: EquipmentData
  ): void {
    if (equipment.armor) {
      switch (equipment.armor) {
        case 'leather_tunic':
        case 'padded_envelope':
          AvatarRenderer.rect(gfx, 4, 16, 8, 8, 0x8b4513)
          AvatarRenderer.rect(gfx, 2, 16, 2, 5, 0x8b4513)
          AvatarRenderer.rect(gfx, 12, 16, 2, 5, 0x8b4513)
          break
        case 'chainmail_shirt':
          AvatarRenderer.rect(gfx, 4, 16, 8, 8, 0xaaaaaa)
          AvatarRenderer.rect(gfx, 2, 16, 2, 5, 0xaaaaaa)
          AvatarRenderer.rect(gfx, 12, 16, 2, 5, 0xaaaaaa)
          break
        case 'steel_plate':
        case 'iron_gauntlet':
          AvatarRenderer.rect(gfx, 4, 16, 8, 8, 0xcccccc)
          AvatarRenderer.rect(gfx, 5, 17, 2, 6, 0xeeeeee)
          AvatarRenderer.rect(gfx, 2, 16, 2, 5, 0xcccccc)
          AvatarRenderer.rect(gfx, 12, 16, 2, 5, 0xcccccc)
          break
        case 'dragon_scale_mail':
          AvatarRenderer.rect(gfx, 4, 16, 8, 8, 0x228b22)
          AvatarRenderer.rect(gfx, 2, 16, 2, 5, 0x228b22)
          AvatarRenderer.rect(gfx, 12, 16, 2, 5, 0x228b22)
          AvatarRenderer.rect(gfx, 5, 17, 1, 1, 0xff4444); AvatarRenderer.rect(gfx, 7, 19, 1, 1, 0xff4444); AvatarRenderer.rect(gfx, 9, 17, 1, 1, 0xff4444)
          break
        case 'aegis_armor':
          AvatarRenderer.rect(gfx, 4, 16, 8, 8, 0xffd700)
          AvatarRenderer.rect(gfx, 6, 18, 4, 4, 0xffffff)
          AvatarRenderer.rect(gfx, 2, 16, 2, 5, 0xffd700)
          AvatarRenderer.rect(gfx, 12, 16, 2, 5, 0xffd700)
          AvatarRenderer.px(gfx, 7, 19, 0x88aaff); AvatarRenderer.px(gfx, 8, 19, 0x88aaff)
          break
        case 'ink_blotter':
          AvatarRenderer.rect(gfx, 4, 16, 8, 8, 0xc19a6b)
          AvatarRenderer.px(gfx, 6, 18, 0x111111); AvatarRenderer.px(gfx, 7, 19, 0x111111); AvatarRenderer.px(gfx, 6, 20, 0x111111)
          break
      }
    }

    if (equipment.weapon) {
      // Base drawn on left side (right hand): cols 1-3, rows 10-23
      const drawSword = (bladeC: number, guardC: number, handleC: number, h: number, glowC?: number) => {
        AvatarRenderer.rect(gfx, 1, 20, 2, 1, guardC)
        AvatarRenderer.rect(gfx, 1, 21, 1, 2, handleC)
        AvatarRenderer.rect(gfx, 1, 20 - h, 1, h, bladeC)
        if (glowC) AvatarRenderer.px(gfx, 0, 20 - Math.floor(h/2), glowC)
      }
      switch (equipment.weapon) {
        case 'rusty_quill':
          AvatarRenderer.rect(gfx, 1, 18, 2, 5, 0x8b4513)
          AvatarRenderer.rect(gfx, 0, 14, 3, 4, 0xdddddd)
          AvatarRenderer.px(gfx, 1, 23, 0x555555) // nib point
          break
        case 'obsidian_nib':
          AvatarRenderer.rect(gfx, 1, 19, 1, 4, 0x111111)
          AvatarRenderer.rect(gfx, 0, 15, 3, 4, 0x222222)
          AvatarRenderer.px(gfx, 1, 23, 0x444444)
          break
        case 'copper_shortsword': drawSword(0xb87333, 0x8b4513, 0x5c4033, 6); break
        case 'iron_broadsword': 
          AvatarRenderer.rect(gfx, 1, 20, 3, 1, 0x606060)
          AvatarRenderer.rect(gfx, 2, 21, 1, 2, 0x303030)
          AvatarRenderer.rect(gfx, 1, 12, 3, 8, 0xa0a0a0)
          break
        case 'steel_longsword': drawSword(0xdcdcdc, 0x808080, 0x404040, 9); break
        case 'mithril_blade': drawSword(0xaaffff, 0x008888, 0x004444, 10, 0xaaffff); break
        case 'excalibur': 
          AvatarRenderer.rect(gfx, 0, 20, 4, 1, 0xffd700)
          AvatarRenderer.rect(gfx, 1, 21, 2, 2, 0x222288)
          AvatarRenderer.rect(gfx, 1, 10, 2, 10, 0xffffff)
          AvatarRenderer.px(gfx, 1, 9, 0xaaddff); AvatarRenderer.px(gfx, 2, 9, 0xaaddff)
          break
      }
    }

    if (equipment.accessory) {
      // Accessories can be drawn as necklaces, rings, floating pets, etc.
      switch (equipment.accessory) {
        case 'focus_ring': AvatarRenderer.px(gfx, 2, 23, 0x4488ff); break // ring on hand
        case 'lucky_charm': AvatarRenderer.px(gfx, 8, 17, 0x00cc00); break // clover pin on chest
        case 'scholars_monocle': 
          AvatarRenderer.px(gfx, 10, 8, 0xaaffff) // monocle over eye
          AvatarRenderer.px(gfx, 11, 8, 0xffd700); AvatarRenderer.px(gfx, 12, 9, 0xffd700)
          break
        case 'lucky_coin': AvatarRenderer.rect(gfx, 7, 18, 2, 2, 0xffd700); break // coin medallion
        case 'hunters_charm': AvatarRenderer.px(gfx, 8, 17, 0xeeeeee); break // bone tooth necklace
        case 'golden_idol': 
          AvatarRenderer.rect(gfx, 13, 10, 2, 3, 0xffd700) // floating idol companion
          AvatarRenderer.px(gfx, 13, 11, 0xff0000)
          break
        case 'taming_bell': AvatarRenderer.rect(gfx, 14, 23, 2, 2, 0xffaa00); break // bell in offhand
        case 'midas_ring': AvatarRenderer.px(gfx, 2, 23, 0xffaa00); break // ring on hand
      }
    }
  }
}
