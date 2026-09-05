export interface OverworldPalette {
  /** Soft directional light laid across the tile field. */
  haze: number
  /** Signature glow for magic, lava, moss, or sunlit scenery. */
  accent: number
  /** Darkest material used for contact shadows and recessed water. */
  shadow: number
  /** Main stone/soil tone used by node plinths. */
  plinth: number
  /** Light-catching top surface for node plinths. */
  plinthHighlight: number
}

const HEARTLAND: OverworldPalette = {
  haze: 0xffe8a3, accent: 0x7ac943, shadow: 0x23431d,
  plinth: 0x75522d, plinthHighlight: 0xdcbf7c,
}

const PALETTES: Record<number, OverworldPalette> = {
  1: HEARTLAND,
  2: {
    haze: 0x9bd7c3, accent: 0xc9ef70, shadow: 0x142f2b,
    plinth: 0x435348, plinthHighlight: 0x9cb58b,
  },
  3: {
    haze: 0xffa35a, accent: 0xffd061, shadow: 0x28110e,
    plinth: 0x5a3329, plinthHighlight: 0xe67a3f,
  },
  4: {
    haze: 0x8fcf8a, accent: 0xb4eb67, shadow: 0x102d1b,
    plinth: 0x385132, plinthHighlight: 0x9bc77d,
  },
  5: {
    haze: 0x9d8cff, accent: 0xe5b7ff, shadow: 0x16112f,
    plinth: 0x423760, plinthHighlight: 0xb9a6ff,
  },
}

/** Return the scene palette for a world, with a safe Heartland fallback. */
export function getOverworldPalette(world: number): OverworldPalette {
  return PALETTES[world] ?? HEARTLAND
}
