import { describe, it, expect } from 'vitest'
import { levelNodeTextureKey } from './levelNodeTextures'
import { LevelConfig } from '../types'

const makeLevel = (overrides: Partial<LevelConfig>): LevelConfig => ({
  id: 'test',
  name: 'Test',
  type: 'GoblinWhacker',
  world: 1,
  unlockedLetters: ['a'],
  wordCount: 10,
  timeLimit: 60,
  rewards: { xp: 50 },
  bossGate: null,
  ...overrides,
})

describe('levelNodeTextureKey', () => {
  it('returns null for boss levels', () => {
    expect(levelNodeTextureKey(makeLevel({ isBoss: true, type: 'BossBattle' }))).toBeNull()
  })

  it('returns null for mini-boss levels', () => {
    expect(levelNodeTextureKey(makeLevel({ isMiniBoss: true, type: 'BossBattle' }))).toBeNull()
  })

  it('returns node_GoblinWhacker for a regular GoblinWhacker level', () => {
    expect(levelNodeTextureKey(makeLevel({ type: 'GoblinWhacker' }))).toBe('node_GoblinWhacker')
  })

  it('returns node_CrazedCook for a CrazedCook level', () => {
    expect(levelNodeTextureKey(makeLevel({ type: 'CrazedCook' }))).toBe('node_CrazedCook')
  })

  it('returns node_<type> for every non-boss level type', () => {
    const regularTypes: LevelConfig['type'][] = [
      'GoblinWhacker', 'SkeletonSwarm', 'MonsterArena', 'UndeadSiege',
      'SlimeSplitting', 'DungeonTrapDisarm', 'DungeonPlatformer', 'DungeonEscape',
      'PotionBrewingLab', 'MagicRuneTyping', 'MonsterManual', 'GuildRecruitment',
      'WoodlandFestival', 'CrazedCook',
    ]
    for (const type of regularTypes) {
      expect(levelNodeTextureKey(makeLevel({ type }))).toBe(`node_${type}`)
    }
  })
})
