/**
 * Computes tween duration (ms) for a cook moving between two points.
 * baseMsPerHundredPx: how many ms to travel 100px (cook-specific base speed)
 * Minimum 150ms regardless of distance.
 */
export function calcMoveDuration(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  baseMsPerHundredPx: number
): number {
  const dist = Math.hypot(toX - fromX, toY - fromY)
  return Math.max(150, (dist / 100) * baseMsPerHundredPx)
}

/**
 * Picks a random station index from [0, stationCount), guaranteed != currentIndex.
 * Requires stationCount >= 2.
 */
export function pickNextStationIndex(currentIndex: number, stationCount: number): number {
  if (stationCount < 2) {
    throw new Error(`pickNextStationIndex requires stationCount >= 2, got ${stationCount}`)
  }
  let next: number
  do {
    next = Math.floor(Math.random() * stationCount)
  } while (next === currentIndex)
  return next
}
