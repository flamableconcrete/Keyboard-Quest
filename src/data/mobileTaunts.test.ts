import { describe, it, expect } from 'vitest';
import { mobileTaunts, fallbackTaunt, getTaunt } from './mobileTaunts';

describe('mobileTaunts', () => {
  it('has a non-empty fallback taunt', () => {
    expect(fallbackTaunt.length).toBeGreaterThan(0);
  });

  it('getTaunt returns a boss-specific taunt when bossId matches', () => {
    const taunt = getTaunt('grizzlefang', 'BossBattle');
    expect(mobileTaunts['grizzlefang']).toBeDefined();
    expect(mobileTaunts['grizzlefang']).toContain(taunt);
  });

  it('getTaunt falls back to level type when bossId has no taunt', () => {
    const taunt = getTaunt('unknown_boss_id', 'GoblinWhacker');
    expect(mobileTaunts['GoblinWhacker']).toBeDefined();
    expect(mobileTaunts['GoblinWhacker']).toContain(taunt);
  });

  it('getTaunt returns fallback when neither bossId nor type matches', () => {
    const taunt = getTaunt(undefined, 'CompletelyUnknownType' as any);
    expect(taunt).toBe(fallbackTaunt);
  });

  it('every taunt array is non-empty', () => {
    for (const [key, taunts] of Object.entries(mobileTaunts)) {
      expect(taunts.length, `taunts for "${key}" should not be empty`).toBeGreaterThan(0);
    }
  });
});
