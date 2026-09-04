import { describe, expect, it } from 'vitest'
import { getOverworldPalette } from './overworldArtDirection'

describe('getOverworldPalette', () => {
  it('returns distinct atmospheric palettes for every world', () => {
    const palettes = [1, 2, 3, 4, 5].map(getOverworldPalette)

    expect(new Set(palettes.map(palette => palette.haze)).size).toBe(5)
    expect(new Set(palettes.map(palette => palette.accent)).size).toBe(5)
    expect(palettes[0]).toMatchObject({ haze: 0xffe8a3, accent: 0x7ac943 })
    expect(palettes[4]).toMatchObject({ haze: 0x9d8cff, accent: 0xe5b7ff })
  })

  it('falls back to the Heartland palette for an unknown world', () => {
    expect(getOverworldPalette(99)).toEqual(getOverworldPalette(1))
  })
})
