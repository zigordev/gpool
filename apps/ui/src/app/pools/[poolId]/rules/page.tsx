'use client';

import { useI18n } from '@/i18n/client';
import { usePoolContext, resolveGroupScoring, resolvePrizeDistribution } from '@/contexts/PoolContext';
import { Rules } from '@/components/Rules';
import { PlayerPosition } from '@/types/playerPosition.type';

export default function RulesPage() {
  const { locale } = useI18n();
  const { pool, poolDeadline, bracketScoringConfig } = usePoolContext();

  const deadlineHint = new Date(poolDeadline).toLocaleString(locale, {
    second: '2-digit', hour: '2-digit', minute: '2-digit',
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const groupScoringConfig = resolveGroupScoring(pool?.config?.scoring);
  const playerRuleScoring = resolvePlayerRuleScoring(pool?.config?.playerScoring);
  const prizeDistribution = resolvePrizeDistribution(pool);
  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;

  return (
    <div className="content-panel">
      <Rules
        deadlineLabel={deadlineHint}
        groupScoring={groupScoringConfig}
        bracketScoring={bracketScoringConfig}
        entryFeeLabel={entryFee}
        playerScoring={playerRuleScoring}
        prizeDistribution={prizeDistribution}
      />
    </div>
  );
}

export function resolvePlayerRuleScoring(value: any) {
  return {
    goal: resolvePositionScoring(value?.goal, DEFAULT_PLAYER_RULE_SCORING.goal),
    missedPenalty: Number.isFinite(Number(value?.missedPenalty)) ? Number(value.missedPenalty) : DEFAULT_PLAYER_RULE_SCORING.missedPenalty,
    mvp: Number.isFinite(Number(value?.mvp)) ? Number(value.mvp) : DEFAULT_PLAYER_RULE_SCORING.mvp,
    penaltySaved: Number.isFinite(Number(value?.penaltySaved)) ? Number(value.penaltySaved) : DEFAULT_PLAYER_RULE_SCORING.penaltySaved,
    cleanSheet: resolvePositionScoring(value?.cleanSheet, DEFAULT_PLAYER_RULE_SCORING.cleanSheet),
    assist: resolvePositionScoring(value?.assist, DEFAULT_PLAYER_RULE_SCORING.assist),
    yellowCard: Number.isFinite(Number(value?.yellowCard)) ? Number(value.yellowCard) : DEFAULT_PLAYER_RULE_SCORING.yellowCard,
    redCard: Number.isFinite(Number(value?.redCard)) ? Number(value.redCard) : DEFAULT_PLAYER_RULE_SCORING.redCard,
    award: {
      goldenBoot: Number.isFinite(Number(value?.award?.goldenBoot)) ? Math.max(0, Number(value.award.goldenBoot)) : DEFAULT_PLAYER_RULE_SCORING.award.goldenBoot,
      tournamentMvp: Number.isFinite(Number(value?.award?.tournamentMvp)) ? Math.max(0, Number(value.award.tournamentMvp)) : DEFAULT_PLAYER_RULE_SCORING.award.tournamentMvp,
    },
  };
}

function resolvePositionScoring<T extends Record<PlayerPosition, number>>(value: any, fallback: T): T {
  return {
    goalkeeper: Number.isFinite(Number(value?.goalkeeper)) ? Number(value.goalkeeper) : fallback.goalkeeper,
    defender: Number.isFinite(Number(value?.defender)) ? Number(value.defender) : fallback.defender,
    midfielder: Number.isFinite(Number(value?.midfielder)) ? Number(value.midfielder) : fallback.midfielder,
    forward: Number.isFinite(Number(value?.forward)) ? Number(value.forward) : fallback.forward,
  } as T;
}

const DEFAULT_PLAYER_RULE_SCORING = {
  goal: { goalkeeper: 10, defender: 6, midfielder: 4, forward: 3 },
  missedPenalty: -2,
  mvp: 5,
  penaltySaved: 5,
  cleanSheet: { goalkeeper: 4, defender: 3, midfielder: 1, forward: 0 },
  assist: { goalkeeper: 0, defender: 4, midfielder: 3, forward: 2 },
  yellowCard: -1,
  redCard: -3,
  award: { goldenBoot: 15, tournamentMvp: 15 },
};
