import { describe, it, expect } from 'vitest'
import { computeSlotPositions, applySeparationForce } from './skeletonSpacing'

describe('computeSlotPositions', () => {
  const BATTLE_X = 350
  const LABEL_PAD = 24
  const MIN_SPACING = 80
  const MAX_X = 1220 // scene.scale.width - 60

  it('returns empty array for no skeletons', () => {
    expect(computeSlotPositions([], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)).toEqual([])
  })

  it('places single skeleton at BATTLE_X', () => {
    expect(computeSlotPositions([60], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)).toEqual([350])
  })

  it('spaces two skeletons by labelWidth + LABEL_PAD when wider than MIN_SPACING', () => {
    // first label is 80px wide → slot gap = 80 + 24 = 104 (> MIN_SPACING 80)
    const result = computeSlotPositions([80, 60], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(350 + 80 + 24) // 454
  })

  it('uses MIN_SPACING when label + pad is narrower', () => {
    // first label is 40px wide → 40 + 24 = 64, less than MIN_SPACING 80
    const result = computeSlotPositions([40, 40], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(350 + 80) // 430 — MIN_SPACING wins
  })

  it('clamps slot when label-driven position exceeds MAX_X', () => {
    // slot[0]=350, slot[1]=350+500+24=874 (fits), slot[2]=874+500+24=1398 → clamped to 1220
    const result = computeSlotPositions([500, 500, 500], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(874)
    expect(result[2]).toBe(MAX_X) // 1398 clamped to 1220
  })

  it('clamps to MAX_X and propagates clamped value for subsequent slots', () => {
    // label widths chosen so slot[1] is just within bounds but slot[2] would exceed
    const result = computeSlotPositions([800, 800, 800], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    // slot[0] = 350
    // slot[1] = 350 + 800 + 24 = 1174  (< 1220, not clamped)
    // slot[2] = 1174 + 800 + 24 = 1998 → clamped to 1220
    expect(result[0]).toBe(350)
    expect(result[1]).toBe(1174)
    expect(result[2]).toBe(1220)
  })

  it('propagates clamped value: further slots also clamp', () => {
    const result = computeSlotPositions([800, 800, 800, 800], BATTLE_X, LABEL_PAD, MIN_SPACING, MAX_X)
    // slot[2] = 1220 (clamped), slot[3] = 1220 + 800 + 24 = 2044 → clamped to 1220
    expect(result[2]).toBe(1220)
    expect(result[3]).toBe(1220)
  })
})

describe('applySeparationForce', () => {
  const LABEL_PAD = 24
  const MIN_X = 285  // BARRIER_X + 20
  const MAX_X = 1220

  it('returns positions unchanged when no overlap', () => {
    // Two skeletons 200px apart with 60px labels: minGap = (60+60)/2 + 24 = 84, gap = 200 > 84
    const result = applySeparationForce([300, 500], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[0]).toBe(300)
    expect(result[1]).toBe(500)
  })

  it('pushes overlapping pair apart by half the overlap each', () => {
    // Two skeletons 50px apart, labels 60px each: minGap = (60+60)/2 + 24 = 84, overlap = 84-50 = 34
    // a pushed left by 17 → 400-17=383 (well above MIN_X=285, no clamping)
    // b pushed right by 17 → 450+17=467
    const result = applySeparationForce([400, 450], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[0]).toBeCloseTo(383)
    expect(result[1]).toBeCloseTo(467)
  })

  it('clamps left skeleton to MIN_X', () => {
    // Skeleton a would be pushed left of MIN_X
    const result = applySeparationForce([290, 295], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[0]).toBeGreaterThanOrEqual(MIN_X)
  })

  it('clamps right skeleton to MAX_X', () => {
    const result = applySeparationForce([1210, 1215], [60, 60], LABEL_PAD, MIN_X, MAX_X)
    expect(result[1]).toBeLessThanOrEqual(MAX_X)
  })

  it('handles three skeletons — resolves consecutive pairs', () => {
    // Three skeletons at x=300, labels 60px each.
    // minGap = (60+60)/2 + 24 = 84 per pair.
    // Pair(0,1): overlap=84, a→300-42=258→clamped to 285, b→300+42=342.
    // Pair(1,2): new gap=300-342=-42, overlap=84+42=126, b→342-63=279→clamped to 285, c→300+63=363.
    const result = applySeparationForce([300, 300, 300], [60, 60, 60], LABEL_PAD, MIN_X, MAX_X)
    // The right-most skeleton must have been pushed rightward
    expect(result[2]).toBeGreaterThan(300)
    // The left-most skeleton must be clamped at MIN_X
    expect(result[0]).toBe(MIN_X)
  })
})
