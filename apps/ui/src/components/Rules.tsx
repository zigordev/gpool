import { BracketScoringConfig } from "@/types/bracketScoringConfig.type";
import { PrizePayout } from "@/types/prizePayout.type";
import { BsFillDiagram3Fill } from "react-icons/bs";
import { FaFutbol, FaMagic, FaShieldAlt, FaClock, FaMedal, FaStar, FaTrophy } from "react-icons/fa";
import { FaDollarSign, FaPerson } from "react-icons/fa6";
import { GiLeatherBoot } from "react-icons/gi";
import { IoMdCloseCircle } from "react-icons/io";
import { LuRectangleVertical } from "react-icons/lu";
import { MdOnlinePrediction } from "react-icons/md";
import { PiBoxingGlove } from "react-icons/pi";
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
              <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>{t('poolDetail.rules.poolConfig.title')}</h3>
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
            </section>

            <section className="surface" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>{t('poolDetail.rules.howTo.title')}</h3>
              <div style={{ display: 'grid', gap: '0.55rem' }}>
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
            </section>
    
            <section className="surface" style={{ padding: '1rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{t('poolDetail.rules.points.title')}</h3>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.groupPhase')}</p>
              <div style={{ display: 'grid', gap: '0.55rem' }}>
                <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  <strong>{t('poolDetail.rules.points.correctWinner')}</strong>
                  {`+ ${groupScoring.winnerPoints}`}
                </p>
                <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  <strong>{t('poolDetail.rules.points.exactResult')}</strong>
                  {`+ ${groupScoring.exactResultPoints}`}
                </p>

                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.finalPhase')}</p>
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
                </div>

                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.players')}</p>
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
                </div>
              </div>
            </section>
          </div>
    );
}

function pointsLabel(points: number): string {
    return points > 0 ? `+${points}` : String(points);
}
