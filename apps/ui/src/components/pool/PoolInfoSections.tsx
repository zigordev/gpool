import { BracketScoringConfig } from "@/types/bracketScoringConfig.type";
import { PrizePayout } from "@/types/prizePayout.type";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { FaExternalLinkAlt, FaFutbol, FaMagic, FaShieldAlt, FaClock, FaInfo, FaMedal, FaStar, FaTrophy } from "react-icons/fa";
import { FaDollarSign } from "react-icons/fa6";
import { GiGoalKeeper, GiLeatherBoot, GiSoccerKick } from "react-icons/gi";
import { IoMdCloseCircle } from "react-icons/io";
import { LuRectangleVertical } from "react-icons/lu";
import { MdOnlinePrediction } from "react-icons/md";
import { PlayerPosition } from "@/types/playerPosition.type";
import { useI18n } from "@/i18n/client";
import { PlayerSelectionLimits } from "@/lib/player-selection-limits";
import { PoolDetailModalButton } from "@/components/pool/PoolDetailModalButton";

function PointValue({
  points,
  color,
}: Readonly<{
  points: number;
  color?: string;
}>) {
  return (
    <strong
      style={{
        color: color ?? (points < 0 ? 'rgb(var(--live))' : 'rgb(var(--pitch))'),
        marginLeft: '0.3rem',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {points > 0 ? `+${points}` : String(points)}
    </strong>
  );
}

export function GeneralPoolInfoSection({
  deadlineLabel,
  entryFeeLabel,
  prizeDistribution,
  formatCurrency,
  playerSelectionLimits,
}: Readonly<{
  deadlineLabel: string;
  entryFeeLabel: string | number | null;
  prizeDistribution: PrizePayout[];
  formatCurrency?: (value: number) => string;
  playerSelectionLimits: PlayerSelectionLimits;
}>) {
    const { t } = useI18n();
    const isFreePool = entryFeeLabel !== null && Number(entryFeeLabel) === 0;
    const hasPrizeDistribution = !isFreePool && prizeDistribution.length > 0;

    return (
      <PoolDetailModalButton title={t('poolDetail.rules.poolConfig.title')} icon={<FaInfo size={13} />}>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3rem minmax(0, 1fr)', gap: '0.55rem' }}>
            <FaClock style={ {color: 'rgb(var(--fg))' } }/>
            <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
              <strong>{t('poolDetail.rules.poolConfig.deadline')}</strong>
              <span style={{ marginLeft: '0.3rem' }}>{deadlineLabel}</span>
            </p>
            <FaDollarSign style={ {color: 'rgb(var(--fg))' } }/>
            <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
              <strong>{t('poolDetail.rules.poolConfig.entryFee')}</strong>
              <span style={{ marginLeft: '0.3rem' }}>
                {isFreePool
                  ? t('poolDetail.info.entryFeeFree')
                  : `${entryFeeLabel}€ (${t('poolDetail.rules.poolConfig.prizes', { count: prizeDistribution.length })})`}
              </span>
            </p>
          </div>
          {hasPrizeDistribution ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3rem minmax(0, 1fr)',
                gap: '0.55rem',
                alignItems: 'start',
              }}
            >
              <FaTrophy style={{ color: 'rgb(var(--fg))' }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  <strong>{t('poolDetail.ranking.prize')}</strong>
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.35rem',
                    marginTop: '0.35rem',
                  }}
                >
                  {prizeDistribution.map((payout) => (
                    <span
                      key={`${payout.rank}-${payout.amount}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        borderRadius: '999px',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--bg-elevated))',
                        color: 'rgb(var(--fg))',
                        fontSize: '0.78rem',
                        fontWeight: 750,
                        lineHeight: 1,
                        padding: '0.32rem 0.5rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ color: 'rgb(var(--fg-muted))' }}>#{payout.rank}</span>
                      <span>{formatCurrency ? formatCurrency(payout.amount) : `${payout.amount}€`}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'grid',
            gap: '0.55rem',
            marginTop: '0.85rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgb(var(--border-subtle))',
          }}
        >
          <h3 style={{ fontSize: '0.9rem', margin: 0 }}>{t('poolDetail.rules.howTo.title')}</h3>
          {['predict', 'final', 'players', 'deadline', 'ranking'].map((key) => (
            <div key={key} style={{ display: 'grid', gridTemplateColumns: '1.3rem minmax(0, 1fr)', gap: '0.55rem' }}>
              {(() => {
                switch(key) {
                  case 'predict':
                    return <MdOnlinePrediction style={ {color: 'rgb(var(--fg))' } }/>
                  case 'final':
                    return <BsFillDiagram3Fill style={ {color: 'rgb(var(--fg))' } }/>
                  case 'players':
                    return <GiSoccerKick style={ {color: 'rgb(var(--fg))' } }/>
                  case 'deadline':
                    return <FaClock style={ {color: 'rgb(var(--fg))' } }/>
                  case 'ranking':
                    return <FaMedal style={ {color: 'rgb(var(--fg))' } }/>
                }
              })()}
              <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                {key === 'players'
                  ? t('poolDetail.rules.howTo.players', {
                      goalkeepers: playerSelectionLimits.goalkeeper,
                      defenders: playerSelectionLimits.defender,
                      midfielders: playerSelectionLimits.midfielder,
                      forwards: playerSelectionLimits.forward,
                    })
                  : t(`poolDetail.rules.howTo.${key}`)}
              </p>
            </div>
          ))}
        </div>
      </PoolDetailModalButton>
    );
}

export function GroupScoringInfoSection({
  groupScoring,
}: Readonly<{
  groupScoring: { winnerPoints: number; exactResultPoints: number };
  defaultExpanded?: boolean;
}>) {
    const { t } = useI18n();

    return (
      <PoolDetailModalButton title={t('poolDetail.rules.points.title')} icon={<FaInfo size={13} />}>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            {t('poolDetail.rules.points.groupPhaseDescription')}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <strong>{t('poolDetail.rules.points.correctWinner')}</strong>
            <PointValue points={groupScoring.winnerPoints} color="rgb(var(--info))" />
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <strong>{t('poolDetail.rules.points.exactResult')}</strong>
            <PointValue points={groupScoring.exactResultPoints} color="rgb(var(--pitch))" />
          </p>
        </div>
      </PoolDetailModalButton>
    );
}

export function FinalScoringInfoSection({
  bracketScoring,
}: Readonly<{
  bracketScoring: BracketScoringConfig;
  defaultExpanded?: boolean;
}>) {
    const { t } = useI18n();

    return (
      <PoolDetailModalButton title={t('poolDetail.rules.points.title')} icon={<FaInfo size={13} />}>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            {t('poolDetail.rules.points.finalPhaseDescription')}
          </p>
          {BRACKET_PHASES.map((phase) => {
            const round = bracketScoring.rounds[phase.key] || bracketScoring;
            return (
              <p key={phase.key} style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                <strong>{t(phase.labelKey)}</strong>
                <span style={{ marginLeft: '0.55rem' }}>
                  {t('poolDetail.rules.points.correctBracketPosition')}
                  <PointValue points={round.exactPositionPoints} color="rgb(var(--pitch))" />
                </span>
                <span style={{ marginLeft: '0.75rem' }}>
                  {t('poolDetail.rules.points.wrongBracketPosition')}
                  <PointValue points={round.correctTeamWrongPositionPoints} color="rgb(var(--info))" />
                </span>
              </p>
            );
          })}
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <FaTrophy style={{ color: '#D4A017', fill: '#D4A017' }} />
              <strong>{t('poolDetail.rules.points.tournamentWinner')}</strong>
            </span>
            <PointValue points={bracketScoring.tournamentWinnerPoints} />
          </p>
        </div>
      </PoolDetailModalButton>
    );
}

export function PlayerScoringInfoSection({
  playerScoring,
}: Readonly<{
  playerScoring: any;
  defaultExpanded?: boolean;
}>) {
    const { t, locale } = useI18n();
    const officialPlayerListUrl = locale === 'es'
      ? 'https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-Spanish.pdf'
      : 'https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf';

    const playerRows = [
      {
        key: 'goals',
        group: 'match',
        label: t('poolDetail.rules.points.goals'),
        values: playerScoring.goal,
        icon: <FaFutbol style={ {color: 'rgb(var(--fg))' } }/>
      },
      {
        key: 'assists',
        group: 'match',
        label: t('poolDetail.rules.points.assists'),
        values: playerScoring.assist,
        icon: <FaMagic style={ {color: 'rgb(var(--fg))' } }/>
      },
      {
        key: 'cleanSheets',
        group: 'match',
        label: t('poolDetail.rules.points.cleanSheets'),
        values: playerScoring.cleanSheet,
        icon: <FaShieldAlt style={ {color: 'rgb(var(--fg))' } }/>
      },
      {
        key: 'penaltyGoal',
        group: 'penalty',
        label: t('poolDetail.rules.points.penaltyGoal'),
        values: playerScoring.penaltyGoal,
        icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} />,
      },
    ];
    const singleActionRows = [
      {
        key: 'mvp',
        group: 'match',
        label: t('poolDetail.rules.points.mvp'),
        value: playerScoring.mvp,
        icon: <FaStar style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'yellowCard',
        group: 'match',
        label: t('poolDetail.rules.points.yellowCard'),
        value: playerScoring.yellowCard,
        icon: <LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} />,
      },
      {
        key: 'redCard',
        group: 'match',
        label: t('poolDetail.rules.points.redCard'),
        value: playerScoring.redCard,
        icon: <LuRectangleVertical style={{ color: 'rgb(var(--live))', fill: 'rgb(var(--live))' }} />,
      },
      {
        key: 'penaltySaved',
        group: 'penalty',
        label: t('poolDetail.rules.points.penaltySaved'),
        value: playerScoring.penaltySaved,
        icon: <GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'forcedPenaltyMiss',
        group: 'penalty',
        label: t('poolDetail.rules.points.forcedPenaltyMiss'),
        value: playerScoring.forcedPenaltyMiss,
        icon: <IoMdCloseCircle style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'missedPenalty',
        group: 'penalty',
        label: t('poolDetail.rules.points.missedPenalty'),
        value: playerScoring.missedPenalty,
        icon: <IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} />,
      },
      {
        key: 'shootoutGoal',
        group: 'shootout',
        label: t('poolDetail.rules.points.shootoutGoal'),
        value: playerScoring.shootoutGoal,
        icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'shootoutPenaltySaved',
        group: 'shootout',
        label: t('poolDetail.rules.points.shootoutPenaltySaved'),
        value: playerScoring.shootoutPenaltySaved,
        icon: <GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'shootoutMissedPenalty',
        group: 'shootout',
        label: t('poolDetail.rules.points.shootoutMissedPenalty'),
        value: playerScoring.shootoutMissedPenalty,
        icon: <IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} />,
      },
      {
        key: 'shootoutForcedPenaltyMiss',
        group: 'shootout',
        label: t('poolDetail.rules.points.shootoutForcedPenaltyMiss'),
        value: playerScoring.shootoutForcedPenaltyMiss,
        icon: <IoMdCloseCircle style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'goldenBoot',
        group: 'tournament',
        label: t('poolDetail.rules.points.goldenBoot'),
        value: playerScoring.award.goldenBoot,
        icon: <GiLeatherBoot style={{ color: '#D4A017', fill: '#D4A017' }} />,
      },
      {
        key: 'tournamentMvp',
        group: 'tournament',
        label: t('poolDetail.rules.points.tournamentMvp'),
        value: playerScoring.award.tournamentMvp,
        icon: <FaStar style={{ color: '#D4A017', fill: '#D4A017' }} />,
      },
    ].filter((row) => isVisibleScoringValue(row.value));
    const actionGroups = [
      { key: 'match', label: t('poolDetail.players.actionGroups.match') },
      { key: 'penalty', label: t('poolDetail.players.actionGroups.penalty') },
      { key: 'shootout', label: t('poolDetail.players.actionGroups.shootout') },
      { key: 'tournament', label: t('poolDetail.players.actionGroups.tournament') },
    ];
    const visiblePositionRows = playerRows.filter((row) =>
      PLAYER_POSITIONS.some((position) => isVisibleScoringValue(row.values[position.key])),
    );
    const visibleActionGroups = actionGroups.filter((group) =>
      visiblePositionRows.some((row) => row.group === group.key) ||
      singleActionRows.some((row) => row.group === group.key),
    );

    return (
      <PoolDetailModalButton title={t('poolDetail.rules.points.title')} icon={<FaInfo size={13} />}>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            {t('poolDetail.rules.points.officialPlayerListLabel')}{' '}
            <a
              href={officialPlayerListUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'rgb(var(--fg))', fontWeight: 600 }}
            >
              {t('poolDetail.rules.points.officialPlayerListLink')}
              <FaExternalLinkAlt size={11} aria-hidden />
            </a>
          </p>
          {visibleActionGroups.map((group, groupIndex) => (
            <div
              key={group.key}
              style={{
                display: 'grid',
                gap: '0.35rem',
                paddingTop: groupIndex > 0 ? '0.55rem' : '0.2rem',
                borderTop: groupIndex > 0 ? '1px solid rgb(var(--border-subtle))' : undefined,
              }}
            >
              <p style={{ margin: 0, color: 'rgb(var(--fg-subtle))', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase' }}>
                {group.label}
              </p>
              {visiblePositionRows.filter((row) => row.group === group.key).map((row) => {
                const visiblePositions = PLAYER_POSITIONS.filter((position) => isVisibleScoringValue(row.values[position.key]));
                return (
                  <div key={row.key} style={{ display: 'grid', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
                        {row.icon}
                        <strong>{row.label}</strong>
                      </span>
                      {visiblePositions.map((position) => (
                        <span
                          key={position.key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'baseline',
                            padding: '0.08rem 0.35rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgb(var(--bg-subtle))',
                          }}
                        >
                          {t(`poolDetail.players.positions.${position.key}`)}
                          <PointValue points={row.values[position.key]} />
                        </span>
                      ))}
                    </div>
                    {row.key === 'cleanSheets' ? (
                      <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.8rem', lineHeight: 1.4 }}>
                        {t('poolDetail.rules.points.cleanSheetMinutesHint')}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              {singleActionRows.filter((row) => row.group === group.key).map((row) => (
                <p key={row.key} style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
                    {row.icon}
                    <strong>{row.label}</strong>
                  </span>
                  <PointValue points={row.value} />
                </p>
              ))}
            </div>
          ))}
        </div>
      </PoolDetailModalButton>
    );
}

export function resolvePlayerInfoScoring(value: any) {
  return {
    goal: resolvePositionScoring(value?.goal, DEFAULT_PLAYER_RULE_SCORING.goal),
    penaltyGoal: resolvePositionScoring(
      value?.penaltyGoal,
      DEFAULT_PLAYER_RULE_SCORING.penaltyGoal,
      true,
    ),
    missedPenalty: Number.isFinite(Number(value?.missedPenalty)) ? Number(value.missedPenalty) : DEFAULT_PLAYER_RULE_SCORING.missedPenalty,
    mvp: Number.isFinite(Number(value?.mvp)) ? Number(value.mvp) : DEFAULT_PLAYER_RULE_SCORING.mvp,
    penaltySaved: Number.isFinite(Number(value?.penaltySaved)) ? Number(value.penaltySaved) : DEFAULT_PLAYER_RULE_SCORING.penaltySaved,
    forcedPenaltyMiss: Number.isFinite(Number(value?.forcedPenaltyMiss)) ? Number(value.forcedPenaltyMiss) : DEFAULT_PLAYER_RULE_SCORING.forcedPenaltyMiss,
    shootoutPenaltySaved: Number.isFinite(Number(value?.shootoutPenaltySaved)) ? Math.max(0, Number(value.shootoutPenaltySaved)) : DEFAULT_PLAYER_RULE_SCORING.shootoutPenaltySaved,
    shootoutGoal: Number.isFinite(Number(value?.shootoutGoal)) ? Math.max(0, Number(value.shootoutGoal)) : DEFAULT_PLAYER_RULE_SCORING.shootoutGoal,
    shootoutMissedPenalty: Number.isFinite(Number(value?.shootoutMissedPenalty)) ? Number(value.shootoutMissedPenalty) : DEFAULT_PLAYER_RULE_SCORING.shootoutMissedPenalty,
    shootoutForcedPenaltyMiss: Number.isFinite(Number(value?.shootoutForcedPenaltyMiss)) ? Number(value.shootoutForcedPenaltyMiss) : DEFAULT_PLAYER_RULE_SCORING.shootoutForcedPenaltyMiss,
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

function resolvePositionScoring<T extends Record<PlayerPosition, number>>(
  value: any,
  fallback: T,
  useLegacyScalar = false,
): T {
  const legacy = Number(value);
  const legacyFallback = useLegacyScalar && Number.isFinite(legacy) ? Math.max(0, legacy) : null;
  return {
    goalkeeper: Number.isFinite(Number(value?.goalkeeper)) ? Number(value.goalkeeper) : legacyFallback ?? fallback.goalkeeper,
    defender: Number.isFinite(Number(value?.defender)) ? Number(value.defender) : legacyFallback ?? fallback.defender,
    midfielder: Number.isFinite(Number(value?.midfielder)) ? Number(value.midfielder) : legacyFallback ?? fallback.midfielder,
    forward: Number.isFinite(Number(value?.forward)) ? Number(value.forward) : legacyFallback ?? fallback.forward,
  } as T;
}

const PLAYER_POSITIONS: Array<{ key: PlayerPosition; labelKey: string; }> = [
  { key: 'goalkeeper', labelKey: 'poolDetail.players.positions.goalkeeper' },
  { key: 'defender', labelKey: 'poolDetail.players.positions.defender' },
  { key: 'midfielder', labelKey: 'poolDetail.players.positions.midfielder' },
  { key: 'forward', labelKey: 'poolDetail.players.positions.forward' },
];

const BRACKET_PHASES = [
  { key: '16th-finals', labelKey: 'bracket.round.16th' },
  { key: '8th-finals', labelKey: 'bracket.round.8th' },
  { key: 'quarter-finals', labelKey: 'bracket.round.quarter' },
  { key: 'semi-finals', labelKey: 'bracket.round.semi' },
  { key: 'finals', labelKey: 'bracket.round.final' },
] as const;

const DEFAULT_PLAYER_RULE_SCORING = {
  goal: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
  penaltyGoal: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
  missedPenalty: 0,
  mvp: 0,
  penaltySaved: 0,
  forcedPenaltyMiss: 0,
  shootoutPenaltySaved: 0,
  shootoutGoal: 0,
  shootoutMissedPenalty: 0,
  shootoutForcedPenaltyMiss: 0,
  cleanSheet: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
  assist: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
  yellowCard: 0,
  redCard: 0,
  award: { goldenBoot: 0, tournamentMvp: 0 },
};

function isVisibleScoringValue(value: unknown): value is number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0;
}
