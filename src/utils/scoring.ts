import { StarRating } from '../types'

// Accuracy: 95-100%=5, 85-94%=4, 75-84%=3, 60-74%=2, <60%=1
export function calcAccuracyStars(correct: number, total: number): StarRating {
  if (total === 0) return 1
  const pct = (correct / total) * 100
  if (pct >= 95) return 5
  if (pct >= 85) return 4
  if (pct >= 75) return 3
  if (pct >= 60) return 2
  return 1
}

// Speed: 50+WPM=5, 35+=4, 25+=3, 15+=2, <15=1
// Scaled by world (early worlds have lower thresholds)
export function calcSpeedStars(wpm: number, world: number = 3): StarRating {
  const scale = 0.6 + world * 0.1  // world 1=0.7, world 5=1.1
  if (wpm >= 50 * scale) return 5
  if (wpm >= 35 * scale) return 4
  if (wpm >= 25 * scale) return 3
  if (wpm >= 15 * scale) return 2
  return 1
}

// Base XP + bonus per star
export function calcXpReward(accStars: number, spdStars: number, baseXp: number): number {
  const totalStars = accStars + spdStars  // 2-10
  const multiplier = 0.5 + (totalStars / 10) * 1.0  // 0.6 to 1.5
  return Math.round(baseXp * multiplier)
}

// XP curve: level = floor(sqrt(xp / 50)) + 1, capped at 50
export function calcCharacterLevel(xp: number): number {
  return Math.min(50, Math.floor(Math.sqrt(xp / 50)) + 1)
}

// XP needed to reach a character level
export function xpForLevel(level: number): number {
  return (level - 1) ** 2 * 50
}