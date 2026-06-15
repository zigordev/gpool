import { BadRequestException } from '@nestjs/common';
import { validatePrizeDistribution } from './prize-distribution';

describe('validatePrizeDistribution', () => {
  it('accepts fixed amounts assigned to non-consecutive ranking positions', () => {
    expect(() =>
      validatePrizeDistribution(10, 10, {
        paidPositions: 2,
        payouts: [
          { rank: 2, amount: 60 },
          { rank: 7, amount: 40 },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects duplicate ranking positions', () => {
    expect(() =>
      validatePrizeDistribution(10, 10, {
        paidPositions: 2,
        payouts: [
          { rank: 4, amount: 60 },
          { rank: 4, amount: 40 },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects fixed amounts that do not consume the full prize pool', () => {
    expect(() =>
      validatePrizeDistribution(10, 10, {
        paidPositions: 2,
        payouts: [
          { rank: 1, amount: 50 },
          { rank: 5, amount: 40 },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('keeps legacy percentage distributions valid', () => {
    expect(() =>
      validatePrizeDistribution(10, 10, {
        paidPositions: 2,
        payouts: [
          { rank: 1, percentage: 70 },
          { rank: 2, percentage: 30 },
        ],
      }),
    ).not.toThrow();
  });

  it('requires a distribution for paid pools', () => {
    expect(() => validatePrizeDistribution(10, 4, undefined)).toThrow(
      BadRequestException,
    );
  });
});
