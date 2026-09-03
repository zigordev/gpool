import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PLAYER_SELECTION_LIMIT,
  DEFAULT_PLAYER_SELECTION_LIMITS,
  MAX_PLAYER_SELECTION_LIMIT,
  resolvePlayerSelectionLimits,
} from './player-selection-limits';

/**
 * `resolvePlayerSelectionLimits` parses a value that arrives from the API — so
 * it is a boundary, and every branch of it is about refusing to trust its
 * input. These are the cases that decide whether a malformed or hostile pool
 * configuration silently changes how many players someone may pick.
 */
describe('resolvePlayerSelectionLimits', () => {
  it('returns the defaults for anything that is not an object', () => {
    for (const input of [null, undefined, 42, 'six', [], true]) {
      expect(resolvePlayerSelectionLimits(input)).toEqual(DEFAULT_PLAYER_SELECTION_LIMITS);
    }
  });

  it('keeps valid per-position limits', () => {
    expect(resolvePlayerSelectionLimits({ goalkeeper: 1, forward: 12 })).toEqual({
      ...DEFAULT_PLAYER_SELECTION_LIMITS,
      goalkeeper: 1,
      forward: 12,
    });
  });

  it('falls back to the default for values outside the allowed range', () => {
    const limits = resolvePlayerSelectionLimits({
      goalkeeper: 0,
      defender: MAX_PLAYER_SELECTION_LIMIT + 1,
      midfielder: -3,
    });
    expect(limits.goalkeeper).toBe(DEFAULT_PLAYER_SELECTION_LIMIT);
    expect(limits.defender).toBe(DEFAULT_PLAYER_SELECTION_LIMIT);
    expect(limits.midfielder).toBe(DEFAULT_PLAYER_SELECTION_LIMIT);
  });

  it('rejects non-integers rather than rounding them', () => {
    const limits = resolvePlayerSelectionLimits({ goalkeeper: 3.5, defender: NaN });
    expect(limits.goalkeeper).toBe(DEFAULT_PLAYER_SELECTION_LIMIT);
    expect(limits.defender).toBe(DEFAULT_PLAYER_SELECTION_LIMIT);
  });

  it('ignores unknown positions instead of adding them', () => {
    expect(resolvePlayerSelectionLimits({ manager: 9 })).toEqual(DEFAULT_PLAYER_SELECTION_LIMITS);
  });
});
