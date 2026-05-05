'use client';

import { useI18n } from '@/i18n/client';
import { countryWithFlag } from '@/lib/country-flags';
import { Badge } from '@/components/ui/Badge';

interface BracketMatch {
  bracketMatchId: string;
  poolId: string;
  phase: string;
  matchNumber: number;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  homeResult?: number;
  awayResult?: number;
  status?: string;
}

interface Team {
  teamId: string;
  name: string;
  group?: string;
  code?: string;
}

interface BracketPrediction {
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  predictedWinnerTeamId?: string;
  predictedWinnerTeamName?: string;
  points?: number;
  homeTeamExactPosition?: boolean;
  awayTeamExactPosition?: boolean;
  homeTeamCorrectButWrongPosition?: boolean;
  awayTeamCorrectButWrongPosition?: boolean;
  tournamentWinnerCorrect?: boolean;
}

interface BracketVisualizationProps {
  bracket: Record<string, BracketMatch[]>;
  teams: Team[];
  poolId: string;
  // Admin mode props
  mode?: 'admin' | 'user';
  updatingMatch?: string | null;
  onUpdateTeam?: (bracketMatchId: string, side: 'home' | 'away', teamId: string, teamName: string) => void;
  onBracketResultChange?: (bracketMatchId: string, homeResult: number | '', awayResult: number | '') => void;
  onUpdateResult?: (bracketMatchId: string, homeResult: number, awayResult: number) => void;
  bracketResults?: Record<string, { homeResult: number | ''; awayResult: number | '' }>;
  submittingResult?: string | null;
  // User mode props
  bracketPredictions?: Record<string, BracketPrediction>;
  deadline?: number;
  onPredictionChange?: (
    bracketMatchId: string,
    side: 'home' | 'away' | 'winner',
    teamId: string,
    teamName: string,
  ) => void;
  // Scoring config for displaying points
  exactPositionPoints?: number;
  correctTeamWrongPositionPoints?: number;
  roundScoring?: Record<string, { exactPositionPoints?: number; correctTeamWrongPositionPoints?: number }>;
}

const MATCH_HEIGHT = 110;
const MATCH_GAP = 10;
const ROUND_GAP = 24;
const MATCH_BOX_WIDTH = 140;

type Slot = 'home' | 'away';
type SlotState = 'empty' | 'selected' | 'exact' | 'correct-wrong-position';

/**
 * Per-phase visual identity. Each round gets its own accent — used for both
 * the round label chip at the top of the column and a coloured top stripe on
 * each match box. The progression goes cool-to-hot-to-trophy, giving the
 * bracket a clear sense of escalation as you move toward the final.
 */
const PHASE_TONE: Record<
  string,
  { token: string; label: string; tint: string; border: string; ring: string; bg: string }
> = {
  '16th-finals': {
    token: 'pitch',
    label: 'rgb(var(--pitch))',
    tint: 'rgb(var(--pitch) / 0.10)',
    border: 'rgb(var(--pitch) / 0.40)',
    ring: 'rgb(var(--pitch) / 0.18)',
    bg: 'rgb(var(--pitch) / 0.045)',
  },
  '8th-finals': {
    token: 'info',
    label: 'rgb(var(--info))',
    tint: 'rgb(var(--info) / 0.10)',
    border: 'rgb(var(--info) / 0.40)',
    ring: 'rgb(var(--info) / 0.18)',
    bg: 'rgb(var(--info) / 0.045)',
  },
  'quarter-finals': {
    token: 'sunset',
    label: 'rgb(var(--sunset))',
    tint: 'rgb(var(--sunset) / 0.12)',
    border: 'rgb(var(--sunset) / 0.45)',
    ring: 'rgb(var(--sunset) / 0.20)',
    bg: 'rgb(var(--sunset) / 0.05)',
  },
  'semi-finals': {
    token: 'live',
    label: 'rgb(var(--live))',
    tint: 'rgb(var(--live) / 0.10)',
    border: 'rgb(var(--live) / 0.40)',
    ring: 'rgb(var(--live) / 0.18)',
    bg: 'rgb(var(--live) / 0.045)',
  },
  finals: {
    token: 'gold',
    label: 'rgb(var(--gold))',
    tint: 'rgb(var(--gold) / 0.14)',
    border: 'rgb(var(--gold) / 0.55)',
    ring: 'rgb(var(--gold) / 0.25)',
    bg: 'rgb(var(--gold) / 0.06)',
  },
};

const FALLBACK_TONE = PHASE_TONE['16th-finals'];
const BRACKET_PHASES = [
  '16th-finals',
  '8th-finals',
  'quarter-finals',
  'semi-finals',
  'finals',
] as const;

function getParentPhase(phaseKey: string): string | null {
  switch (phaseKey) {
    case '8th-finals':
      return '16th-finals';
    case 'quarter-finals':
      return '8th-finals';
    case 'semi-finals':
      return 'quarter-finals';
    default:
      return null;
  }
}

function getSideSplit(matches: BracketMatch[] | undefined): number {
  return Math.ceil((matches?.length ?? 0) / 2);
}

function toneFor(phase: string | undefined): typeof FALLBACK_TONE {
  return (phase && PHASE_TONE[phase]) || FALLBACK_TONE;
}

function slotState(
  isAdmin: boolean,
  hasBothTeams: boolean,
  selected: boolean,
  exactPosition: boolean,
  correctButWrongPosition: boolean,
): SlotState {
  if (!selected) return 'empty';
  if (isAdmin || !hasBothTeams) return 'selected';
  if (exactPosition) return 'exact';
  if (correctButWrongPosition) return 'correct-wrong-position';
  return 'selected';
}

function slotBorderColor(state: SlotState): string {
  switch (state) {
    case 'exact':
      return 'rgb(var(--info))';
    case 'correct-wrong-position':
      return 'rgb(var(--pitch))';
    case 'empty':
    default:
      return 'rgb(var(--border))';
  }
}

export function BracketVisualization({
  bracket,
  teams,
  poolId,
  mode = 'admin',
  updatingMatch = null,
  onUpdateTeam,
  bracketPredictions = {},
  deadline,
  onPredictionChange,
  exactPositionPoints = 5,
  correctTeamWrongPositionPoints = 3,
  roundScoring = {},
}: BracketVisualizationProps) {
  const { t } = useI18n();
  const isDeadlinePassed = deadline ? Date.now() >= deadline : false;

  const getMatchTop = (
    matchIndex: number,
    phaseKey: string,
    allPhases: Record<string, BracketMatch[]>,
  ): number => {
    if (phaseKey === '16th-finals') {
      return matchIndex * (MATCH_HEIGHT + MATCH_GAP);
    }

    if (phaseKey === 'finals') {
      // Center the final between the left and right semis. Each side displays
      // half of the first-round matches stacked vertically, so the visible side
      // height is computed from one side, not the full first round.
      const totalFirstRound = allPhases['16th-finals']?.length ?? 16;
      const sideMatches = Math.max(1, Math.floor(totalFirstRound / 2));
      const sideHeight = sideMatches * MATCH_HEIGHT + (sideMatches - 1) * MATCH_GAP;
      return sideHeight / 2 - MATCH_HEIGHT / 2;
    }

    const parentPhaseKey = getParentPhase(phaseKey);
    if (!parentPhaseKey) {
      return matchIndex * (MATCH_HEIGHT + MATCH_GAP);
    }
    const parentMatchIndex1 = matchIndex * 2;
    const parentMatchIndex2 = matchIndex * 2 + 1;

    const parentMatches = allPhases[parentPhaseKey] || [];
    if (parentMatches.length === 0) {
      return matchIndex * (MATCH_HEIGHT + MATCH_GAP);
    }

    const parentTop1: number = getMatchTop(parentMatchIndex1, parentPhaseKey, allPhases);
    const parentTop2: number = getMatchTop(parentMatchIndex2, parentPhaseKey, allPhases);
    const parentCenter1: number = parentTop1 + MATCH_HEIGHT / 2;
    const parentCenter2: number = parentTop2 + MATCH_HEIGHT / 2;
    const centerBetween: number = (parentCenter1 + parentCenter2) / 2;
    return centerBetween - MATCH_HEIGHT / 2;
  };

  const renderRound = (
    phaseKey: string,
    label: string,
    matches: BracketMatch[],
    isLeft: boolean,
    _isRight: boolean,
    isFinal: boolean = false,
  ) => {
    if (!matches || matches.length === 0) return null;

    const tone = toneFor(phaseKey);

    return (
      <div
        style={{
          width: `${MATCH_BOX_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '0.5rem',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.55rem',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: tone.label,
              background: tone.tint,
              border: `1px solid ${tone.border}`,
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={label}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '999px',
                background: tone.label,
                flexShrink: 0,
              }}
            />
            {label}
          </span>
        </div>
        <div
          style={{
            position: 'relative',
            flex: 1,
            background: tone.bg,
            borderRadius: 'var(--radius-md)',
          }}
        >
        {matches.map((match, idx) => {
          const phaseMatches = bracket[phaseKey] || [];
          const split = getSideSplit(phaseMatches);
          const actualIndex = isLeft || isFinal ? idx : split + idx;
          let top = getMatchTop(actualIndex, phaseKey, bracket);

          if (!isLeft && !isFinal) {
            const firstLeftIndex = 0;
            const firstRightIndex = split;
            const firstLeftTop = getMatchTop(firstLeftIndex, phaseKey, bracket);
            const firstRightTop = getMatchTop(firstRightIndex, phaseKey, bracket);
            const offset = firstLeftTop - firstRightTop;
            top = top + offset;
          }

          const prediction = bracketPredictions[match.bracketMatchId] || {};
          const hasBothTeams = Boolean(match.homeTeamId && match.awayTeamId);
          const homeTeamExactPosition = hasBothTeams && prediction.homeTeamExactPosition === true;
          const awayTeamExactPosition = hasBothTeams && prediction.awayTeamExactPosition === true;
          const homeTeamCorrectButWrongPosition =
            hasBothTeams && prediction.homeTeamCorrectButWrongPosition === true;
          const awayTeamCorrectButWrongPosition =
            hasBothTeams && prediction.awayTeamCorrectButWrongPosition === true;
          const points = prediction.points || 0;

          return (
            <div
              key={match.bracketMatchId}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
              }}
            >
              <BracketMatchBox
                match={match}
                teams={teams}
                poolId={poolId}
                mode={mode}
                updatingMatch={updatingMatch}
                onUpdateTeam={onUpdateTeam}
                prediction={prediction}
                isDeadlinePassed={isDeadlinePassed}
                onPredictionChange={onPredictionChange}
                isFinal={isFinal}
                phaseKey={phaseKey}
                homeTeamExactPosition={homeTeamExactPosition}
                awayTeamExactPosition={awayTeamExactPosition}
                homeTeamCorrectButWrongPosition={homeTeamCorrectButWrongPosition}
                awayTeamCorrectButWrongPosition={awayTeamCorrectButWrongPosition}
                points={points}
                exactPositionPoints={roundScoring[phaseKey]?.exactPositionPoints ?? exactPositionPoints}
                correctTeamWrongPositionPoints={
                  roundScoring[phaseKey]?.correctTeamWrongPositionPoints ?? correctTeamWrongPositionPoints
                }
              />
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  let maxHeight = 0;
  const checkPhase = (phaseKey: string, isLeft: boolean) => {
    const phaseMatches = bracket[phaseKey] || [];
    if (phaseMatches.length === 0) return;

    const split = getSideSplit(phaseMatches);
    const sideMatches = phaseKey === 'finals'
      ? phaseMatches.length
      : isLeft
      ? split
      : Math.max(0, phaseMatches.length - split);
    const startIdx = isLeft || phaseKey === 'finals' ? 0 : split;

    for (let idx = 0; idx < sideMatches; idx++) {
      const actualIndex = isLeft ? idx : startIdx + idx;
      let top = getMatchTop(actualIndex, phaseKey, bracket);

      if (!isLeft) {
        const firstLeftIndex = 0;
        const firstRightIndex = startIdx;
        const firstLeftTop = getMatchTop(firstLeftIndex, phaseKey, bracket);
        const firstRightTop = getMatchTop(firstRightIndex, phaseKey, bracket);
        const offset = firstLeftTop - firstRightTop;
        top = top + offset;
      }

      const bottom = top + MATCH_HEIGHT;
      if (bottom > maxHeight) maxHeight = bottom;
    }
  };

  BRACKET_PHASES.forEach((phaseKey) => {
    checkPhase(phaseKey, true);
    checkPhase(phaseKey, false);
  });

  // The match-span (`maxHeight` so far) sits inside a flex column whose first
  // child is the round label chip. Reserve just enough for the chip + its
  // margin so the side container is exactly tall enough — no trailing empty
  // space below the bottom match.
  const LABEL_RESERVE = 30;
  maxHeight = Math.max(maxHeight, 140) + LABEL_RESERVE;

  return (
    <div
      style={{
        overflowX: 'auto',
        overflowY: 'visible',
        padding: '0.5rem 0.5rem 0.5rem',
        margin: '0 -0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: `${ROUND_GAP}px`,
          alignItems: 'flex-start',
          minHeight: `${maxHeight}px`,
          position: 'relative',
        }}
      >
        {/* Left side */}
        <div
          style={{
            display: 'flex',
            gap: `${ROUND_GAP}px`,
            alignItems: 'flex-start',
            height: `${maxHeight}px`,
          }}
        >
          {renderRound('16th-finals', t('bracket.round.16th'), bracket['16th-finals']?.slice(0, getSideSplit(bracket['16th-finals'])) || [], true, false)}
          {renderRound('8th-finals', t('bracket.round.8th'), bracket['8th-finals']?.slice(0, getSideSplit(bracket['8th-finals'])) || [], true, false)}
          {renderRound('quarter-finals', t('bracket.round.quarter'), bracket['quarter-finals']?.slice(0, getSideSplit(bracket['quarter-finals'])) || [], true, false)}
          {renderRound('semi-finals', t('bracket.round.semi'), bracket['semi-finals']?.slice(0, getSideSplit(bracket['semi-finals'])) || [], true, false)}
        </div>

        {/* Center: Final */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: `${maxHeight}px`,
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {renderRound('finals', t('bracket.round.final'), bracket['finals'] || [], false, false, true)}
        </div>

        {/* Right side */}
        <div
          style={{
            display: 'flex',
            gap: `${ROUND_GAP}px`,
            alignItems: 'flex-start',
            height: `${maxHeight}px`,
          }}
        >
          {renderRound('semi-finals', t('bracket.round.semi'), bracket['semi-finals']?.slice(getSideSplit(bracket['semi-finals'])) || [], false, true)}
          {renderRound('quarter-finals', t('bracket.round.quarter'), bracket['quarter-finals']?.slice(getSideSplit(bracket['quarter-finals'])) || [], false, true)}
          {renderRound('8th-finals', t('bracket.round.8th'), bracket['8th-finals']?.slice(getSideSplit(bracket['8th-finals'])) || [], false, true)}
          {renderRound('16th-finals', t('bracket.round.16th'), bracket['16th-finals']?.slice(getSideSplit(bracket['16th-finals'])) || [], false, true)}
        </div>
      </div>
    </div>
  );
}

interface BracketMatchBoxProps {
  match: BracketMatch;
  teams: Team[];
  poolId: string;
  mode: 'admin' | 'user';
  updatingMatch?: string | null;
  onUpdateTeam?: (bracketMatchId: string, side: 'home' | 'away', teamId: string, teamName: string) => void;
  prediction?: BracketPrediction;
  isDeadlinePassed?: boolean;
  onPredictionChange?: (
    bracketMatchId: string,
    side: 'home' | 'away' | 'winner',
    teamId: string,
    teamName: string,
  ) => void;
  isFinal?: boolean;
  /** Phase key used to look up the round's accent colour. */
  phaseKey?: string;
  homeTeamExactPosition?: boolean;
  awayTeamExactPosition?: boolean;
  homeTeamCorrectButWrongPosition?: boolean;
  awayTeamCorrectButWrongPosition?: boolean;
  points?: number;
  exactPositionPoints?: number;
  correctTeamWrongPositionPoints?: number;
}

function BracketMatchBox({
  match,
  teams,
  poolId,
  mode,
  updatingMatch,
  onUpdateTeam,
  prediction,
  isDeadlinePassed,
  onPredictionChange,
  isFinal = false,
  phaseKey,
  homeTeamExactPosition = false,
  awayTeamExactPosition = false,
  homeTeamCorrectButWrongPosition = false,
  awayTeamCorrectButWrongPosition = false,
  points = 0,
  exactPositionPoints = 5,
  correctTeamWrongPositionPoints = 3,
}: BracketMatchBoxProps) {
  const phaseTone = toneFor(phaseKey ?? match.phase);
  const { t } = useI18n();
  const isAdmin = mode === 'admin';
  const isDisabled = isAdmin
    ? updatingMatch === match.bracketMatchId || poolId === 'all-pools'
    : poolId === 'all-pools' || Boolean(isDeadlinePassed);

  const homeTeamId = isAdmin ? match.homeTeamId : prediction?.homeTeamId || '';
  const awayTeamId = isAdmin ? match.awayTeamId : prediction?.awayTeamId || '';
  const homeTeamName = isAdmin ? match.homeTeamName : prediction?.homeTeamName || '';
  const awayTeamName = isAdmin ? match.awayTeamName : prediction?.awayTeamName || '';
  const predictedWinnerTeamId = prediction?.predictedWinnerTeamId || '';
  const hasBothTeams = Boolean(match.homeTeamId && match.awayTeamId);

  const homeState: SlotState = slotState(
    isAdmin,
    hasBothTeams,
    Boolean(homeTeamId),
    homeTeamExactPosition,
    homeTeamCorrectButWrongPosition,
  );
  const awayState: SlotState = slotState(
    isAdmin,
    hasBothTeams,
    Boolean(awayTeamId),
    awayTeamExactPosition,
    awayTeamCorrectButWrongPosition,
  );

  const handleTeamChange = (side: Slot, teamId: string, teamName: string) => {
    if (isAdmin && onUpdateTeam) {
      onUpdateTeam(match.bracketMatchId, side, teamId, teamName);
    } else if (!isAdmin && onPredictionChange) {
      onPredictionChange(match.bracketMatchId, side, teamId, teamName);
    }
  };

  const handleWinnerChange = (teamId: string) => {
    if (!onPredictionChange) return;
    if (teamId === homeTeamId) {
      onPredictionChange(match.bracketMatchId, 'winner', homeTeamId, homeTeamName || '');
    } else if (teamId === awayTeamId) {
      onPredictionChange(match.bracketMatchId, 'winner', awayTeamId, awayTeamName || '');
    } else {
      onPredictionChange(match.bracketMatchId, 'winner', '', '');
    }
  };

  return (
    <article
      style={{
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border))',
        borderTop: `3px solid ${phaseTone.label}`,
        boxShadow: `var(--shadow-sm), 0 0 0 1px ${phaseTone.ring}`,
        padding: '0.35rem 0.45rem',
        borderRadius: 'var(--radius-sm)',
        minWidth: `${MATCH_BOX_WIDTH - 8}px`,
        minHeight: !isAdmin && isFinal ? 132 : 102,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.35rem',
        }}
      >
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: phaseTone.label,
          }}
        >
          {isFinal ? t('bracket.round.final') : t('bracket.match', { number: match.matchNumber })}
        </span>
        {!isAdmin && points > 0 ? <Badge variant="gold">{points}</Badge> : null}
      </div>

      <BracketSlot
        teamId={homeTeamId || ''}
        teams={teams}
        disabled={isDisabled}
        state={homeState}
        onChange={(teamId, teamName) => handleTeamChange('home', teamId, teamName)}
        ariaLabel={t('bracket.selectTeam')}
      />

      <BracketSlot
        teamId={awayTeamId || ''}
        teams={teams}
        disabled={isDisabled}
        state={awayState}
        onChange={(teamId, teamName) => handleTeamChange('away', teamId, teamName)}
        ariaLabel={t('bracket.selectTeam')}
      />

      {!isAdmin && isFinal ? (
        <select
          aria-label={t('bracket.selectTournamentWinner')}
          value={predictedWinnerTeamId}
          onChange={(e) => handleWinnerChange(e.target.value)}
          disabled={isDisabled || !homeTeamId || !awayTeamId}
          style={{
            width: '100%',
            padding: '0.3rem 0.4rem',
            border: `1px solid ${
              prediction?.tournamentWinnerCorrect === true ? 'rgb(var(--gold))' : 'rgb(var(--border))'
            }`,
            borderRadius: 'var(--radius-sm)',
            background:
              prediction?.tournamentWinnerCorrect === true
                ? 'rgb(var(--gold) / 0.08)'
                : isDisabled || !homeTeamId || !awayTeamId
                ? 'rgb(var(--bg-subtle))'
                : 'rgb(var(--bg))',
            color: 'rgb(var(--fg))',
            fontSize: '0.76rem',
            fontWeight: 700,
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: isDisabled || !homeTeamId || !awayTeamId ? 'not-allowed' : 'pointer',
            opacity: isDisabled || !homeTeamId || !awayTeamId ? 0.7 : 1,
          }}
        >
          <option value="" style={{ color: '#000' }}>
            {t('bracket.selectTournamentWinner')}
          </option>
          {homeTeamId ? (
            <option value={homeTeamId} style={{ color: '#000' }}>
              {countryWithFlag(homeTeamName || homeTeamId)}
            </option>
          ) : null}
          {awayTeamId ? (
            <option value={awayTeamId} style={{ color: '#000' }}>
              {countryWithFlag(awayTeamName || awayTeamId)}
            </option>
          ) : null}
        </select>
      ) : null}
    </article>
  );
}

interface BracketSlotProps {
  teamId: string;
  teams: Team[];
  disabled: boolean;
  state: SlotState;
  onChange: (teamId: string, teamName: string) => void;
  ariaLabel: string;
}

function BracketSlot({ teamId, teams, disabled, state, onChange, ariaLabel }: BracketSlotProps) {
  const borderColor = slotBorderColor(state);
  const isExact = state === 'exact';
  const isCorrect = state === 'correct-wrong-position';

  const tintBg = isExact
    ? 'rgb(var(--info) / 0.06)'
    : isCorrect
    ? 'rgb(var(--pitch) / 0.06)'
    : disabled
    ? 'rgb(var(--bg-subtle))'
    : 'rgb(var(--bg))';

  return (
    <select
      aria-label={ariaLabel}
      value={teamId || ''}
      onChange={(e) => {
        const selected = teams.find((team) => team.teamId === e.target.value);
        if (selected) onChange(selected.teamId, selected.name);
      }}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '0.3rem 0.4rem',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-sm)',
        background: tintBg,
        color: 'rgb(var(--fg))',
        fontSize: '0.78rem',
        fontWeight: 600,
        appearance: 'none',
        WebkitAppearance: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      <option value="" style={{ color: '#000' }}>
        {ariaLabel}
      </option>
      {teams.map((team) => (
        <option key={team.teamId} value={team.teamId} style={{ color: '#000' }}>
          {countryWithFlag(team.name)}
        </option>
      ))}
    </select>
  );
}
