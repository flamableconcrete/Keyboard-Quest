/** Select the correct frame for a looping tile animation at a given elapsed time. */
export function frameForElapsedTime(
  frames: readonly number[],
  frameDuration: number,
  elapsed: number,
): number | undefined {
  if (frames.length === 0) return undefined
  if (frameDuration <= 0) return frames[0]
  return frames[Math.floor(Math.max(0, elapsed) / frameDuration) % frames.length]
}
