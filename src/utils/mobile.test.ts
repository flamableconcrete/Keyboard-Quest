// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isMobile } from './mobile';

describe('isMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for phone-width viewports (< 768)', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
    expect(isMobile()).toBe(true);
  });

  it('returns false for tablet-width viewports (>= 768)', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(768);
    expect(isMobile()).toBe(false);
  });

  it('returns false for desktop-width viewports', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1280);
    expect(isMobile()).toBe(false);
  });
});
