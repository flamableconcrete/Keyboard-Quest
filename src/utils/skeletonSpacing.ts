/**
 * Computes target X positions for skeletons in regular mode queue.
 * Queue grows rightward: index 0 is at BATTLE_X (closest to barrier).
 *
 * @param labelWidths  Array of Text.width values for each skeleton, in queue order
 * @param battleX      X position for the first skeleton (BATTLE_X constant)
 * @param labelPad     Minimum padding added to labelWidth to get slot gap
 * @param minSpacing   Minimum slot width regardless of label width
 * @param maxX         Right-edge clamp (scene.scale.width - 60)
 * @returns            Array of target X values, one per skeleton
 */
export function computeSlotPositions(
  labelWidths: number[],
  battleX: number,
  labelPad: number,
  minSpacing: number,
  maxX: number,
): number[] {
  if (labelWidths.length === 0) return []

  const positions: number[] = []
  let cursor = battleX

  for (let i = 0; i < labelWidths.length; i++) {
    const clamped = Math.min(cursor, maxX)
    positions.push(clamped)
    const gap = Math.max(labelWidths[i] + labelPad, minSpacing)
    cursor = clamped + gap
  }

  return positions
}

/**
 * Applies one separation-force pass to prevent label overlap in advanced mode.
 * Input array is sorted by ascending X before the pass; the returned positions
 * correspond to the same sort order as the input.
 *
 * @param positions   Current X positions of skeletons (may be in any order)
 * @param labelWidths Corresponding Text.width values
 * @param labelPad    Total padding between adjacent label edges
 * @param minX        Lower clamp (BARRIER_X + 20 = 285)
 * @param maxX        Upper clamp (scene.scale.width - 60)
 * @returns           New positions after separation, in the same order as input
 */
export function applySeparationForce(
  positions: number[],
  labelWidths: number[],
  labelPad: number,
  minX: number,
  maxX: number,
): number[] {
  if (positions.length <= 1) return [...positions]

  // Build index array sorted by ascending X
  const indices = positions.map((_, i) => i).sort((a, b) => positions[a] - positions[b])
  const result = [...positions]

  for (let i = 0; i < indices.length - 1; i++) {
    const ai = indices[i]
    const bi = indices[i + 1]
    const minGap = (labelWidths[ai] + labelWidths[bi]) / 2 + labelPad
    const overlap = minGap - (result[bi] - result[ai])
    if (overlap > 0) {
      result[ai] = Math.max(result[ai] - overlap / 2, minX)
      result[bi] = Math.min(result[bi] + overlap / 2, maxX)
    }
  }

  return result
}
