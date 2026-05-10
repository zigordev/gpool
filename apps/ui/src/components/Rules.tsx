import { BracketScoringConfig } from "@/types/bracketScoringConfig.type";
import { PrizePayout } from "@/types/prizePayout.type";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { FaFutbol, FaMagic, FaShieldAlt, FaClock, FaMedal } from "react-icons/fa";
import { FaPerson } from "react-icons/fa6";
import { MdOnlinePrediction } from "react-icons/md";
import { Badge } from "./ui/Badge";
import { PlayerPosition } from "@/types/playerPosition.type";
import { useI18n } from "@/i18n/client";

export function Rules({
  deadlineLabel,
  groupScoring,
  bracketScoring,
  playerScoring,
  entryFeeLabel,
  prizeDistribution,
}: Readonly<{
  deadlineLabel: string;
  groupScoring: { winnerPoints: number; exactResultPoints: number };
  bracketScoring: BracketScoringConfig;
  playerScoring: any;
  entryFeeLabel: string;
  prizeDistribution: PrizePayout[];
}>) {
    const { t } = useI18n();
    
    const playerRows = [
        {
          label: t('poolDetail.rules.points.goals'),
          values: playerScoring.goal,
          icon: <FaFutbol style={ {color: 'black' } }/>
        },
        {
          label: t('poolDetail.rules.points.assists'),
          values: playerScoring.assist,
          icon: <FaMagic style={ {color: 'black' } }/>
        },
        {
          label: t('poolDetail.rules.points.cleanSheets'),
          values: playerScoring.cleanSheet,
          icon: <FaShieldAlt style={ {color: 'black' } }/>
        },
    ];

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

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <section className="surface" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>{t('poolDetail.rules.howTo.title')}</h3>
              <div style={{ display: 'grid', gap: '0.55rem' }}>
                {['predict', 'final', 'players', 'deadline', 'ranking'].map((key) => (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '1.3rem minmax(0, 1fr)', gap: '0.55rem' }}>
                    {(() => {
                      switch(key) {
                        case 'predict':
                          return <MdOnlinePrediction style={ {color: 'black' } }/>
                        case 'final':
                          return <BsFillDiagram3Fill style={ {color: 'black' } }/>
                        case 'players':
                          return <FaPerson style={ {color: 'black' } }/>
                        case 'deadline':
                          return <FaClock style={ {color: 'black' } }/>
                        case 'ranking':
                          return <FaMedal style={ {color: 'black' } }/>
                      }
                    })()}
                    <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                      {t(`poolDetail.rules.howTo.${key}`)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
    
            <section className="surface" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{t('poolDetail.rules.points.title')}</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.groupPhase')}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <Badge variant="info">
                      {t('poolDetail.rules.points.exactResult', { points: groupScoring.exactResultPoints })}
                    </Badge>
                    <Badge variant="pitch">
                      {t('poolDetail.rules.points.correctWinner', { points: groupScoring.winnerPoints })}
                    </Badge>
                  </div>
                </div>
    
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.finalPhase')}</p>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {BRACKET_PHASES.map((phase) => {
                      const round = bracketScoring.rounds[phase.key] || bracketScoring;
                      return (
                        <div
                          key={phase.key}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            padding: '0.45rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgb(var(--bg-subtle) / 0.68)',
                            fontSize: '0.82rem',
                            color: 'rgb(var(--fg-muted))',
                          }}
                        >
                          <strong style={{ color: 'rgb(var(--fg))' }}>{t(phase.labelKey)}</strong>
                          <span>
                            {t('poolDetail.rules.points.bracketRound', {
                              exact: round.exactPositionPoints,
                              wrong: round.correctTeamWrongPositionPoints,
                            })}
                          </span>
                        </div>
                      );
                    })}
                    <Badge variant="gold">
                      {t('poolDetail.rules.points.tournamentWinner', { points: bracketScoring.tournamentWinnerPoints })}
                    </Badge>
                  </div>
                </div>
    
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.players')}</p>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    {playerRows.map((row) => (
                      <div
                        key={row.label}
                        style={{ display: 'grid', gridTemplateColumns: '1.3rem minmax(0, 1fr)', gap: '0.55rem' }}
                      >
                        {row.icon}
                        <strong>{row.label}</strong>
                        {PLAYER_POSITIONS.map((position) => (
                          <span key={position.key} className="display-number" style={{ color: 'rgb(var(--fg-muted))' }}>
                            {t(`poolDetail.players.positionShort.${position.key}`)} {pointsLabel(row.values[position.key])}
                          </span>
                        ))}
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <Badge variant="neutral">{t('poolDetail.rules.points.mvp', { points: playerScoring.mvp })}</Badge>
                      <Badge variant="neutral">{t('poolDetail.rules.points.penaltySaved', { points: playerScoring.penaltySaved })}</Badge>
                      <Badge variant="live">{t('poolDetail.rules.points.missedPenalty', { points: playerScoring.missedPenalty })}</Badge>
                      <Badge variant="live">{t('poolDetail.rules.points.yellowCard', { points: playerScoring.yellowCard })}</Badge>
                      <Badge variant="live">{t('poolDetail.rules.points.redCard', { points: playerScoring.redCard })}</Badge>
                      <Badge variant="gold">{t('poolDetail.rules.points.goldenBoot', { points: playerScoring.award.goldenBoot })}</Badge>
                      <Badge variant="gold">{t('poolDetail.rules.points.tournamentMvp', { points: playerScoring.award.tournamentMvp })}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </section>
    
            <section className="surface" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>{t('poolDetail.rules.poolConfig.title')}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                <Badge variant="neutral">{t('poolDetail.rules.poolConfig.deadline', { deadline: deadlineLabel })}</Badge>
                <Badge variant="neutral">{t('poolDetail.rules.poolConfig.entryFee', { fee: entryFeeLabel })}</Badge>
                {prizeDistribution.length > 0 ? (
                  <Badge variant="gold">
                    {t('poolDetail.rules.poolConfig.prizes', { count: prizeDistribution.length })}
                  </Badge>
                ) : null}
              </div>
            </section>
          </div>
    );
}

function pointsLabel(points: number): string {
    return points > 0 ? `+${points}` : String(points);
}
