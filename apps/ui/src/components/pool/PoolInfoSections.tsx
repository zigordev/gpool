import type { ReactNode } from "react";
import { BracketScoringConfig } from "@/types/bracketScoringConfig.type";
import { PrizePayout } from "@/types/prizePayout.type";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { FaFutbol, FaMagic, FaShieldAlt, FaClock, FaInfo, FaMedal, FaStar, FaTrophy } from "react-icons/fa";
import { FaDollarSign, FaPerson } from "react-icons/fa6";
import { GiLeatherBoot } from "react-icons/gi";
import { IoMdCloseCircle } from "react-icons/io";
import { LuRectangleVertical } from "react-icons/lu";
import { MdOnlinePrediction } from "react-icons/md";
import { PiBoxingGlove } from "react-icons/pi";
import { PlayerPosition } from "@/types/playerPosition.type";
import { useI18n } from "@/i18n/client";
import { Section } from "../ui/Section";

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
}: Readonly<{
  deadlineLabel: string;
  entryFeeLabel: string | number | null;
  prizeDistribution: PrizePayout[];
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
                {t(`poolDetail.rules.howTo.${key}`)}
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
            <strong>{t('poolDetail.rules.points.correctWinner')}</strong>
            {`+ ${groupScoring.winnerPoints}`}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <strong>{t('poolDetail.rules.points.exactResult')}</strong>
            {`+ ${groupScoring.exactResultPoints}`}
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
    const { t } = useI18n();

    const playerRows = [
      {
        label: t('poolDetail.rules.points.goals'),
        values: playerScoring.goal,
        icon: <FaFutbol style={ {color: 'rgb(var(--fg))' } }/>
      },
      {
        label: t('poolDetail.rules.points.assists'),
        values: playerScoring.assist,
        icon: <FaMagic style={ {color: 'rgb(var(--fg))' } }/>
      },
      {
        label: t('poolDetail.rules.points.cleanSheets'),
        values: playerScoring.cleanSheet,
        icon: <FaShieldAlt style={ {color: 'rgb(var(--fg))' } }/>
      },
    ];

    return (
      <Section title={<InfoSectionTitle>{t('poolDetail.rules.points.title')}</InfoSectionTitle>} collapsible defaultExpanded density="compact" tone="muted">
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          {playerRows.map((row) => (
            <p key={row.label} style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
                {row.icon}
                <strong>{row.label}</strong>
              </span>
              {PLAYER_POSITIONS.map((position, i) => (
                <span key={position.key}>{i > 0 ? ' / ' : ''}{t(`poolDetail.players.positions.${position.key}`)} {pointsLabel(row.values[position.key])}</span>
              ))}
            </p>
          ))}
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <FaStar style={{ color: 'rgb(var(--fg))' }} />
              <strong>{t('poolDetail.rules.points.mvp')}</strong>
            </span>
            {`+ ${playerScoring.mvp}`}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <PiBoxingGlove style={{ color: 'rgb(var(--fg))' }} />
              <strong>{t('poolDetail.rules.points.penaltySaved')}</strong>
            </span>
            {`+ ${playerScoring.penaltySaved}`}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <IoMdCloseCircle style={{ color: 'red' }} />
              <strong>{t('poolDetail.rules.points.missedPenalty')}</strong>
            </span>
            {playerScoring.missedPenalty}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <LuRectangleVertical style={{ color: 'yellow', fill: 'yellow' }} />
              <strong>{t('poolDetail.rules.points.yellowCard')}</strong>
            </span>
            {playerScoring.yellowCard}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <LuRectangleVertical style={{ color: 'red', fill: 'red' }} />
              <strong>{t('poolDetail.rules.points.redCard')}</strong>
            </span>
            {playerScoring.redCard}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <GiLeatherBoot style={{ color: 'gold' }} />
              <strong>{t('poolDetail.rules.points.goldenBoot')}</strong>
            </span>
            {`+ ${playerScoring.award.goldenBoot}`}
          </p>
          <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.35rem' }}>
              <FaStar style={{ color: 'gold' }} />
              <strong>{t('poolDetail.rules.points.tournamentMvp')}</strong>
            </span>
            {`+ ${playerScoring.award.tournamentMvp}`}
          </p>
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

function pointsLabel(points: number): string {
    return points > 0 ? `+${points}` : String(points);
}
