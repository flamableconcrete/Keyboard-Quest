import Phaser from 'phaser'

export function generateAllItemTextures(scene: Phaser.Scene) {
  const items = [
    'rusty_quill', 'ink_blotter', 'iron_gauntlet', 'focus_ring', 'lucky_charm', 'obsidian_nib', 'padded_envelope', 'scholars_monocle',
    'copper_shortsword', 'iron_broadsword', 'steel_longsword', 'mithril_blade', 'excalibur',
    'leather_tunic', 'chainmail_shirt', 'steel_plate', 'dragon_scale_mail', 'aegis_armor',
    'lucky_coin', 'hunters_charm', 'golden_idol', 'taming_bell', 'midas_ring',
    'mastery_speed_boots', 'mastery_arcane_focus', 'mastery_shadow_cloak', 'mastery_forest_crown', 'mastery_quill_of_power'
  ]
  items.forEach(id => generateItemTexture(scene, id))
}

export function generateItemTexture(scene: Phaser.Scene, itemId: string) {
  if (scene.textures.exists(itemId)) return

  const g = scene.add.graphics()
  const s = 3 // pixel scale

  switch (itemId) {
    // Weapons
    case 'rusty_quill':
      g.fillStyle(0xdddddd); g.fillRect(6*s, 2*s, 4*s, 8*s) // feather
      g.fillStyle(0x8b4513); g.fillRect(7*s, 10*s, 2*s, 5*s) // shaft
      g.fillStyle(0x555555); g.fillRect(7.5*s, 15*s, 1*s, 1*s) // nib
      break
    case 'obsidian_nib':
      g.fillStyle(0x222222); g.fillRect(6*s, 4*s, 4*s, 8*s)
      g.fillStyle(0x111111); g.fillRect(7*s, 12*s, 2*s, 3*s)
      g.fillStyle(0x444444); g.fillRect(7.5*s, 15*s, 1*s, 1*s)
      break
    case 'copper_shortsword':
      g.fillStyle(0xb87333); g.fillRect(7*s, 2*s, 2*s, 9*s) // blade
      g.fillStyle(0x8b4513); g.fillRect(5*s, 11*s, 6*s, 1*s) // guard
      g.fillStyle(0x5c4033); g.fillRect(7*s, 12*s, 2*s, 3*s) // handle
      break
    case 'iron_broadsword':
      g.fillStyle(0xa0a0a0); g.fillRect(6*s, 2*s, 4*s, 10*s) // wide blade
      g.fillStyle(0x606060); g.fillRect(4*s, 12*s, 8*s, 1*s) // guard
      g.fillStyle(0x303030); g.fillRect(7*s, 13*s, 2*s, 2*s) // handle
      break
    case 'steel_longsword':
      g.fillStyle(0xdcdcdc); g.fillRect(7*s, 1*s, 2*s, 11*s) // long blade
      g.fillStyle(0x808080); g.fillRect(5*s, 12*s, 6*s, 1*s) // guard
      g.fillStyle(0x404040); g.fillRect(7*s, 13*s, 2*s, 2*s) // handle
      g.fillStyle(0xffd700); g.fillRect(7*s, 15*s, 2*s, 1*s) // pommel
      break
    case 'mithril_blade':
      g.fillStyle(0xaaffff); g.fillRect(7*s, 1*s, 2*s, 11*s) // glowing blade
      g.fillStyle(0x008888); g.fillRect(5*s, 12*s, 6*s, 1*s) // guard
      g.fillStyle(0x004444); g.fillRect(7*s, 13*s, 2*s, 2*s) // handle
      break
    case 'excalibur':
      g.fillStyle(0xffffff); g.fillRect(7*s, 1*s, 2*s, 10*s) // bright blade
      g.fillStyle(0xaaddff); g.fillRect(7.5*s, 1*s, 1*s, 10*s) // inner glow
      g.fillStyle(0xffd700); g.fillRect(4*s, 11*s, 8*s, 1.5*s) // gold guard
      g.fillStyle(0x222288); g.fillRect(7*s, 12.5*s, 2*s, 2.5*s) // handle
      g.fillStyle(0xffd700); g.fillRect(6.5*s, 15*s, 3*s, 1*s) // pommel
      break

    // Armor
    case 'ink_blotter':
      g.fillStyle(0xc19a6b); g.fillRect(4*s, 4*s, 8*s, 8*s) // wood block
      g.fillStyle(0x111111); g.fillRect(5*s, 5*s, 3*s, 3*s) // ink
      g.fillRect(8*s, 8*s, 2*s, 2*s)
      break
    case 'iron_gauntlet':
      g.fillStyle(0x888888); g.fillRect(5*s, 4*s, 6*s, 8*s)
      g.fillStyle(0x555555); g.fillRect(5*s, 4*s, 2*s, 3*s) // fingers
      g.fillRect(7*s, 3*s, 2*s, 4*s)
      g.fillRect(9*s, 4*s, 2*s, 3*s)
      break
    case 'padded_envelope':
      g.fillStyle(0xf5deb3); g.fillRect(3*s, 4*s, 10*s, 8*s)
      g.fillStyle(0xd2b48c); g.fillTriangle(3*s, 4*s, 13*s, 4*s, 8*s, 8*s) // flap
      break
    case 'leather_tunic':
      g.fillStyle(0x8b4513); g.fillRect(4*s, 3*s, 8*s, 10*s) // chest
      g.fillRect(2*s, 3*s, 2*s, 4*s) // sleeves
      g.fillRect(12*s, 3*s, 2*s, 4*s)
      break
    case 'chainmail_shirt':
      g.fillStyle(0xaaaaaa); g.fillRect(4*s, 3*s, 8*s, 10*s)
      g.fillStyle(0x777777) // chain pattern
      for (let i=4; i<12; i+=2) for (let j=3; j<13; j+=2) g.fillRect(i*s, j*s, 1*s, 1*s)
      break
    case 'steel_plate':
      g.fillStyle(0xcccccc); g.fillRect(4*s, 3*s, 8*s, 10*s)
      g.fillStyle(0xeeeeee); g.fillRect(5*s, 4*s, 2*s, 8*s) // highlight
      g.fillStyle(0x888888); g.fillRect(4*s, 7*s, 8*s, 1*s) // belt
      break
    case 'dragon_scale_mail':
      g.fillStyle(0x228b22); g.fillRect(4*s, 3*s, 8*s, 10*s) // green base
      g.fillStyle(0xff4444) // red scales
      for (let i=4; i<12; i+=2) for (let j=3; j<13; j+=2) g.fillRect(i*s, j*s, 1*s, 1*s)
      break
    case 'aegis_armor':
      g.fillStyle(0xffd700); g.fillRect(4*s, 3*s, 8*s, 10*s) // gold base
      g.fillStyle(0xffffff); g.fillRect(6*s, 5*s, 4*s, 6*s) // white center
      g.fillStyle(0x88aaff); g.fillCircle(8*s, 8*s, 1.5*s) // blue gem
      break

    // Accessories
    case 'focus_ring':
      g.fillStyle(0xffd700); g.strokeCircle(8*s, 8*s, 3*s)
      g.fillStyle(0x4488ff); g.fillCircle(8*s, 5*s, 1.5*s) // gem
      break
    case 'lucky_charm':
      g.fillStyle(0x00cc00);
      g.fillCircle(6.5*s, 6.5*s, 2*s)
      g.fillCircle(9.5*s, 6.5*s, 2*s)
      g.fillCircle(6.5*s, 9.5*s, 2*s)
      g.fillCircle(9.5*s, 9.5*s, 2*s)
      break
    case 'scholars_monocle':
      g.fillStyle(0xaaaaaa); g.strokeCircle(8*s, 7*s, 3*s) // frame
      g.fillStyle(0xaaffff); g.fillCircle(8*s, 7*s, 2*s) // lens
      g.fillStyle(0xffd700); g.fillRect(10*s, 10*s, 4*s, 1*s) // chain
      break
    case 'lucky_coin':
      g.fillStyle(0xffd700); g.fillCircle(8*s, 8*s, 4*s)
      g.fillStyle(0xffaa00); g.fillCircle(8*s, 8*s, 2.5*s) // inner
      break
    case 'hunters_charm':
      g.fillStyle(0x8b4513); g.strokeCircle(8*s, 6*s, 3*s) // cord
      g.fillStyle(0xeeeeee); g.fillTriangle(7*s, 8*s, 9*s, 8*s, 8*s, 13*s) // tooth
      break
    case 'golden_idol':
      g.fillStyle(0xffd700); g.fillRect(6*s, 5*s, 4*s, 7*s) // body
      g.fillRect(5*s, 3*s, 6*s, 4*s) // head
      g.fillStyle(0xff0000); g.fillRect(6*s, 4*s, 1*s, 1*s); g.fillRect(9*s, 4*s, 1*s, 1*s) // eyes
      break
    case 'taming_bell':
      g.fillStyle(0xffaa00); g.fillTriangle(8*s, 4*s, 4*s, 10*s, 12*s, 10*s) // bell
      g.fillStyle(0x444444); g.fillCircle(8*s, 11*s, 1.5*s) // clapper
      g.fillStyle(0x8b4513); g.fillRect(7*s, 2*s, 2*s, 2*s) // handle
      break
    case 'midas_ring':
      g.fillStyle(0xffaa00); g.strokeCircle(8*s, 8*s, 3*s)
      g.fillStyle(0xffffff); g.fillRect(6*s, 5*s, 1*s, 1*s); g.fillRect(10*s, 10*s, 1*s, 1*s) // gleam
      break

    // Mastery Trophies
    case 'mastery_speed_boots':
      // Winged boots — blue boot with lightning bolt wing
      g.fillStyle(0x3366cc); g.fillRect(4*s, 8*s, 5*s, 6*s) // boot body
      g.fillStyle(0x3366cc); g.fillRect(3*s, 14*s, 7*s, 1*s) // sole
      g.fillStyle(0x2244aa); g.fillRect(4*s, 8*s, 5*s, 1*s) // top trim
      g.fillStyle(0xffd700); g.fillRect(9*s, 6*s, 1*s, 3*s) // wing top
      g.fillStyle(0xffd700); g.fillRect(10*s, 7*s, 1*s, 3*s) // wing mid
      g.fillStyle(0xffd700); g.fillRect(11*s, 8*s, 1*s, 3*s) // wing tip
      g.fillStyle(0xaaddff); g.fillRect(5*s, 10*s, 1*s, 1*s) // lightning
      g.fillStyle(0xaaddff); g.fillRect(6*s, 11*s, 1*s, 1*s)
      g.fillStyle(0xaaddff); g.fillRect(5*s, 12*s, 1*s, 1*s)
      break
    case 'mastery_arcane_focus':
      // Crystal orb on a staff — purple orb with energy
      g.fillStyle(0x8b4513); g.fillRect(7*s, 8*s, 2*s, 7*s) // staff
      g.fillStyle(0x4444aa); g.fillRect(6*s, 3*s, 4*s, 4*s) // orb base
      g.fillStyle(0x8844cc); g.fillRect(7*s, 4*s, 2*s, 2*s) // orb center
      g.fillStyle(0xcc66ff); g.fillRect(7*s, 4*s, 1*s, 1*s) // highlight
      g.fillStyle(0xffd700); g.fillRect(6*s, 7*s, 4*s, 1*s) // gold mount
      g.fillStyle(0xcc66ff); g.fillRect(5*s, 5*s, 1*s, 1*s) // spark left
      g.fillStyle(0xcc66ff); g.fillRect(10*s, 3*s, 1*s, 1*s) // spark right
      break
    case 'mastery_shadow_cloak':
      // Dark dagger wreathed in shadow wisps
      g.fillStyle(0x222233); g.fillRect(7*s, 2*s, 2*s, 9*s) // dark blade
      g.fillStyle(0x111122); g.fillRect(8*s, 3*s, 1*s, 7*s) // edge
      g.fillStyle(0x555566); g.fillRect(5*s, 11*s, 6*s, 1*s) // guard
      g.fillStyle(0x333344); g.fillRect(7*s, 12*s, 2*s, 3*s) // handle
      g.fillStyle(0x6644aa); g.fillRect(5*s, 5*s, 1*s, 1*s) // shadow wisps
      g.fillStyle(0x6644aa); g.fillRect(10*s, 7*s, 1*s, 1*s)
      g.fillStyle(0x8866cc); g.fillRect(4*s, 8*s, 1*s, 1*s)
      g.fillStyle(0x8866cc); g.fillRect(11*s, 4*s, 1*s, 1*s)
      break
    case 'mastery_forest_crown':
      // Leaf-topped scepter — green and gold
      g.fillStyle(0x8b6914); g.fillRect(7*s, 7*s, 2*s, 8*s) // shaft
      g.fillStyle(0xffd700); g.fillRect(6*s, 6*s, 4*s, 1*s) // gold band
      g.fillStyle(0x228b22); g.fillRect(5*s, 3*s, 2*s, 3*s) // left leaf
      g.fillStyle(0x228b22); g.fillRect(9*s, 3*s, 2*s, 3*s) // right leaf
      g.fillStyle(0x228b22); g.fillRect(7*s, 2*s, 2*s, 2*s) // top leaf
      g.fillStyle(0x33aa33); g.fillRect(6*s, 3*s, 1*s, 1*s) // vein left
      g.fillStyle(0x33aa33); g.fillRect(9*s, 3*s, 1*s, 1*s) // vein right
      g.fillStyle(0x33aa33); g.fillRect(7*s, 2*s, 1*s, 1*s) // vein top
      g.fillStyle(0xffd700); g.fillRect(7*s, 15*s, 2*s, 1*s) // pommel
      break
    case 'mastery_quill_of_power':
      // Mighty quill radiating power — golden feather with energy
      g.fillStyle(0xffd700); g.fillRect(5*s, 1*s, 5*s, 8*s) // golden feather
      g.fillStyle(0xffaa00); g.fillRect(6*s, 2*s, 3*s, 6*s) // feather inner
      g.fillStyle(0xffffff); g.fillRect(7*s, 3*s, 1*s, 4*s) // feather highlight
      g.fillStyle(0x8b4513); g.fillRect(7*s, 9*s, 2*s, 5*s) // shaft
      g.fillStyle(0x222222); g.fillRect(7.5*s, 14*s, 1*s, 2*s) // nib
      g.fillStyle(0xaaddff); g.fillRect(4*s, 3*s, 1*s, 1*s) // energy sparks
      g.fillStyle(0xaaddff); g.fillRect(10*s, 2*s, 1*s, 1*s)
      g.fillStyle(0xaaddff); g.fillRect(3*s, 6*s, 1*s, 1*s)
      g.fillStyle(0xaaddff); g.fillRect(11*s, 5*s, 1*s, 1*s)
      break

    default:
      // Fallback
      g.fillStyle(0xff00ff)
      g.fillRect(4*s, 4*s, 8*s, 8*s)
      break
  }

  g.generateTexture(itemId, 16 * s, 16 * s)
  g.destroy()
}
