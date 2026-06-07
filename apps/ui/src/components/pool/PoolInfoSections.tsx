import type { ReactNode } from "react";
import { BracketScoringConfig } from "@/types/bracketScoringConfig.type";
import { PrizePayout } from "@/types/prizePayout.type";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { FaExternalLinkAlt, FaFutbol, FaMagic, FaShieldAlt, FaClock, FaInfo, FaMedal, FaStar, FaTrophy } from "react-icons/fa";
import { FaDollarSign, FaPerson } from "react-icons/fa6";
import { GiLeatherBoot } from "react-icons/gi";
import { IoMdCloseCircle } from "react-icons/io";
import { IoWarning } from "react-icons/io5";
import { LuRectangleVertical } from "react-icons/lu";
import { MdOnlinePrediction } from "react-icons/md";
import { PiBoxingGlove } from "react-icons/pi";
import { PlayerPosition } from "@/types/playerPosition.type";
import { useI18n } from "@/i18n/client";
import { Section } from "../ui/Section";
import { PlayerSelectionLimits } from "@/lib/player-selection-limits";

function InfoSectionTitle({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <FaInfo size={13} aria-hidden />
      {children}
    </span>
  );
}

export function GeneralPoolInfoSection({
  deadlineLabel,
  entryFeeLabel,
  prizeDistribution,
  playerSelectionLimits,
}: Readonly<{
  deadlineLabel: string;
  entryFeeLabel: string | number | null;
  prizeDistribution: PrizePayout[];
  playerSelectionLimits: PlayerSelectionLimits;
}>) {
    const { t } = useI18n();

    return (
      <Section title={<InfoSectionTitle>{t('poolDetail.rules.poolConfig.title')}</InfoSectionTitle>} collapsible defaultExpanded density="compact" tone="muted">
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3rem minmax(0, 1fr)', gap: '0.55rem' }}>
            <FaClock style={ {color: 'rgb(var(--fg))' } }/>
            <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
              <strong>{t('poolDetail.rules.poolConfig.deadline')}</strong>
              {deadlineLabel}
            </p>
            <FaDollarSign style={ {color: 'rgb(var(--fg))' } }/>
            <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
              <strong>{t('poolDetail.rules.poolConfig.entryFee')}</strong>
              {`${entryFeeLabel}€ (${t('poolDetail.rules.poolConfig.prizes', { count: prizeDistribution.length })})`}
            </p>
          </div>
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
                    return <FaPerson style={ {color: 'rgb(var(--fg))' } }/>
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
      </Section>
    );
}

export function GroupScoringInfoSection({
  groupScoring,
}: Readonly<{
  groupScoring: { winnerPoints: number; exactResultPoints: number };
}>) {
    const { t } = useI18n();

    return (
      <Section title={<InfoSectionTitle>{t('poolDetail.rules.points.title')}</InfoSectionTitle>} collapsible defaultExpanded density="compact" tone="muted">
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            {t('poolDetail.rules.points.groupPhaseDescription')}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <strong>{t('poolDetail.rules.points.correctWinner')}</strong>
            {`+ ${groupScoring.winnerPoints}`}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <strong>{t('poolDetail.rules.points.exactResult')}</strong>
            {`+ ${groupScoring.exactResultPoints}`}
          </p>
          <p
            style={{
              display: 'grid',
              gridTemplateColumns: '1.25rem minmax(0, 1fr)',
              gap: '0.45rem',
              alignItems: 'start',
              margin: '0.15rem 0 0',
              color: 'rgb(var(--fg-muted))',
              fontSize: '0.84rem',
              lineHeight: 1.45,
            }}
          >
            <IoWarning aria-hidden style={{ color: 'rgb(var(--gold))', marginTop: '0.1rem' }} />
            <span>
              {t('poolDetail.rules.points.predictedStandingsWarning')}{' '}
              <a
                href="https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'rgb(var(--fg))', fontWeight: 600 }}
              >
                {t('poolDetail.rules.points.fifaRegulationsLink')}
                <FaExternalLinkAlt size={11} aria-hidden />
              </a>
            </span>
          </p>
        </div>
      </Section>
    );
}

export function FinalScoringInfoSection({
  bracketScoring,
}: Readonly<{
  bracketScoring: BracketScoringConfig;
}>) {
    const { t } = useI18n();

    return (
      <Section title={<InfoSectionTitle>{t('poolDetail.rules.points.title')}</InfoSectionTitle>} collapsible defaultExpanded density="compact" tone="muted">
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            {t('poolDetail.rules.points.finalPhaseDescription')}
          </p>
          {BRACKET_PHASES.map((phase) => {
            const round = bracketScoring.rounds[phase.key] || bracketScoring;
            return (
              <p key={phase.key} style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                <strong>{t(phase.labelKey)}: </strong>
                {t('poolDetail.rules.points.bracketRound', { exact: round.exactPositionPoints, wrong: round.correctTeamWrongPositionPoints })}
              </p>
            );
          })}
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <FaTrophy style={{ color: 'gold' }} />
              <strong>{t('poolDetail.rules.points.tournamentWinner')}</strong>
            </span>
            {`+ ${bracketScoring.tournamentWinnerPoints}`}
          </p>
        </div>
      </Section>
    );
}

export function PlayerScoringInfoSection({
  playerScoring,
}: Readonly<{
  playerScoring: any;
}>) {
    const { t, locale } = useI18n();
    const officialPlayerListUrl = locale === 'es'
      ? 'https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-Spanish.pdf'
      : 'https://fdp.fifa.org/assetspublic/ce281/pdf/SquadLists-English.pdf';

    const playerRows = [
      {
        key: 'goals',
        label: t('poolDetail.rules.points.goals'),
        values: playerScoring.goal,
        icon: <FaFutbol style={ {color: 'rgb(var(--fg))' } }/>
      },
      {
        key: 'assists',
        label: t('poolDetail.rules.points.assists'),
        values: playerScoring.assist,
        icon: <FaMagic style={ {color: 'rgb(var(--fg))' } }/>
      },
      {
        key: 'cleanSheets',
        label: t('poolDetail.rules.points.cleanSheets'),
        values: playerScoring.cleanSheet,
        icon: <FaShieldAlt style={ {color: 'rgb(var(--fg))' } }/>
      },
    ];
    const singleActionRows = [
      {
        key: 'mvp',
        label: t('poolDetail.rules.points.mvp'),
        value: playerScoring.mvp,
        icon: <FaStar style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'penaltySaved',
        label: t('poolDetail.rules.points.penaltySaved'),
        value: playerScoring.penaltySaved,
        icon: <PiBoxingGlove style={{ color: 'rgb(var(--fg))' }} />,
      },
      {
        key: 'missedPenalty',
        label: t('poolDetail.rules.points.missedPenalty'),
        value: playerScoring.missedPenalty,
        icon: <IoMdCloseCircle style={{ color: 'red' }} />,
      },
      {
        key: 'yellowCard',
        label: t('poolDetail.rules.points.yellowCard'),
        value: playerScoring.yellowCard,
        icon: <LuRectangleVertical style={{ color: 'yellow', fill: 'yellow' }} />,
      },
      {
        key: 'redCard',
        label: t('poolDetail.rules.points.redCard'),
        value: playerScoring.redCard,
        icon: <LuRectangleVertical style={{ color: 'red', fill: 'red' }} />,
      },
      {
        key: 'goldenBoot',
        label: t('poolDetail.rules.points.goldenBoot'),
        value: playerScoring.award.goldenBoot,
        icon: <GiLeatherBoot style={{ color: 'gold' }} />,
      },
      {
        key: 'tournamentMvp',
        label: t('poolDetail.rules.points.tournamentMvp'),
        value: playerScoring.award.tournamentMvp,
        icon: <FaStar style={{ color: 'gold' }} />,
      },
    ].filter((row) => isVisibleScoringValue(row.value));

    return (
      <Section title={<InfoSectionTitle>{t('poolDetail.rules.points.title')}</InfoSectionTitle>} collapsible defaultExpanded density="compact" tone="muted">
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
          {playerRows.map((row) => {
            const visiblePositions = PLAYER_POSITIONS.filter((position) => isVisibleScoringValue(row.values[position.key]));
            if (visiblePositions.length === 0) return null;
            return (
              <div key={row.key} style={{ display: 'grid', gap: '0.2rem' }}>
                <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
                    {row.icon}
                    <strong>{row.label}</strong>
                  </span>
                  {visiblePositions.map((position, i) => (
                    <span key={position.key}>{i > 0 ? ' / ' : ''}{t(`poolDetail.players.positions.${position.key}`)} {pointsLabel(row.values[position.key])}</span>
                  ))}
                </p>
                {row.key === 'cleanSheets' ? (
                  <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {t('poolDetail.rules.points.cleanSheetMinutesHint')}
                  </p>
                ) : null}
                {row.key === 'goals' ? (
                  <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {t('poolDetail.rules.points.penaltyShootoutHint')}
                  </p>
                ) : null}
              </div>
            );
          })}
          {singleActionRows.map((row) => (
            <div key={row.key} style={{ display: 'grid', gap: '0.2rem' }}>
              <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
                  {row.icon}
                  <strong>{row.label}</strong>
                </span>
                {pointsLabel(row.value)}
              </p>
              {row.key === 'penaltySaved' ? (
                <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.8rem', lineHeight: 1.4 }}>
                  {t('poolDetail.rules.points.penaltyShootoutHint')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>
    );
}

export function resolvePlayerInfoScoring(value: any) {
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
  missedPenalty: 0,
  mvp: 0,
  penaltySaved: 0,
  cleanSheet: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
  assist: { goalkeeper: 0, defender: 0, midfielder: 0, forward: 0 },
  yellowCard: 0,
  redCard: 0,
  award: { goldenBoot: 0, tournamentMvp: 0 },
};

function pointsLabel(points: number): string {
    return points > 0 ? `+${points}` : String(points);
}

function isVisibleScoringValue(value: unknown): value is number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed !== 0;
}
