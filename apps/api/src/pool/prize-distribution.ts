import { BadRequestException } from '@nestjs/common';

export function validatePrizeDistribution(
  entryFeeValue: unknown,
  memberCount: number,
  prizeDistribution: any,
) {
  const entryFee = Number(entryFeeValue ?? 0);
  if (!Number.isFinite(entryFee) || entryFee < 0) {
    throw new BadRequestException('Entry fee must be a non-negative number');
  }

  if (!prizeDistribution || typeof prizeDistribution !== 'object' || Array.isArray(prizeDistribution)) {
    if (entryFee === 0) return;
    throw new BadRequestException('All prize money must be assigned to ranking positions');
  }

  const paidPositionCount = Number(prizeDistribution.paidPositions);
  if (!Number.isInteger(paidPositionCount) || paidPositionCount < 0) {
    throw new BadRequestException('Prize paid positions must be a non-negative integer');
  }
  if (paidPositionCount > memberCount) {
    throw new BadRequestException(
      `Prize paid positions cannot exceed the number of pool members (${memberCount})`,
    );
  }

  const payouts = Array.isArray(prizeDistribution.payouts)
    ? prizeDistribution.payouts
    : [];
  if (payouts.length !== paidPositionCount) {
    throw new BadRequestException('Every prize position must have exactly one payout');
  }

  const ranks = payouts.map((payout: any) => Number(payout?.rank));
  if (ranks.some((rank: number) => !Number.isInteger(rank) || rank < 1 || rank > memberCount)) {
    throw new BadRequestException(
      `Prize payout ranks must be between 1 and the number of pool members (${memberCount})`,
    );
  }
  if (new Set(ranks).size !== ranks.length) {
    throw new BadRequestException('Prize payout ranks must be unique');
  }

  if (entryFee === 0) {
    if (payouts.length > 0) {
      throw new BadRequestException('Free pools cannot configure prize payouts');
    }
    return;
  }

  const usesAmounts = payouts.every(
    (payout: any) =>
      typeof payout?.amount === 'number' &&
      Number.isFinite(payout.amount) &&
      payout.percentage === undefined,
  );
  const usesLegacyPercentages = payouts.every(
    (payout: any) =>
      typeof payout?.percentage === 'number' &&
      Number.isFinite(payout.percentage) &&
      payout.amount === undefined,
  );

  if (usesAmounts) {
    if (payouts.some((payout: any) => payout.amount <= 0)) {
      throw new BadRequestException('Prize payout amounts must be greater than zero');
    }
    const configuredTotal = payouts.reduce(
      (sum: number, payout: any) => sum + payout.amount,
      0,
    );
    const availableTotal = entryFee * memberCount;
    if (Math.abs(configuredTotal - availableTotal) > 0.01) {
      throw new BadRequestException(
        `Prize payout amounts must add up to the available prize pool (${availableTotal.toFixed(2)})`,
      );
    }
    return;
  }

  if (usesLegacyPercentages) {
    const configuredTotal = payouts.reduce(
      (sum: number, payout: any) => sum + payout.percentage,
      0,
    );
    if (
      payouts.some((payout: any) => payout.percentage < 0 || payout.percentage > 100) ||
      Math.abs(configuredTotal - 100) > 0.01
    ) {
      throw new BadRequestException('Legacy prize payout percentages must add up to 100');
    }
    return;
  }

  throw new BadRequestException(
    'Prize payouts must use either fixed amounts or legacy percentages, not both',
  );
}
