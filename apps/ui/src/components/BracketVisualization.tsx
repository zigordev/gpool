'use client';

import { useI18n } from '@/i18n/client';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { SlotState } from '@/types/slotState.type';
import { Slot } from '@/types/slot.type';
import Select from 'react-select';
import { selectStyles } from '@/lib/select-styles';
import { PointsBadge } from './PointsBadge';
import { FaTrophy } from 'react-icons/fa';

interface BracketVisualizationProps {
  bracket: Record<string, BracketMatch[]>;
  teams: Team[];
  poolId: string;
  mode?: 'admin' | 'user';
  updatingMatch?: string | null;
  onUpdateTeam?: (bracketMatchId: string, side: 'home' | 'away', teamId: string, teamName: string) => void;
  onUpdateResult?: (bracketMatchId: string, homeResult: number, awayResult: number) => void;
  bracketResults?: Record<string, { homeResult: number | ''; awayResult: number | '' }>;
  submittingResult?: string | null;
  bracketPredictions?: Record<string, BracketPrediction>;
  candidateOptions?: Record<string, { home: Team[]; away: Team[] }>;
  deadline?: number;
  onPredictionChange?: (
    bracketMatchId: string,
    side: 'home' | 'away' | 'winner',
    teamId: string,
    teamName: string,
  ) => void;
  exactPositionPoints?: number;
  correctTeamWrongPositionPoints?: number;
  roundScoring?: Record<string, { exactPositionPoints?: number; correctTeamWrongPositionPoints?: number }>;
}

const MATCH_HEIGHT = 152;
const MATCH_GAP = 14;
const ROUND_GAP = 24;
const MATCH_BOX_WIDTH = 280;

const PHASE_TONE: Record<
  string,
  { token: string; label: string; tint: string; border: string; ring: string; bg: string }
> = {
  '16th-finals': {
    token: 'pitch',
    label: 'rgb(var(--pitch))',
    tint: 'rgb(var(--pitch) / 0.08)',
    border: 'rgb(var(--pitch) / 0.30)',
    ring: 'rgb(var(--pitch) / 0.12)',
    bg: 'rgb(var(--pitch) / 0.030)',
  },
  '8th-finals': {
    token: 'pitch',
    label: 'rgb(var(--pitch))',
    tint: 'rgb(var(--pitch) / 0.10)',
    border: 'rgb(var(--pitch) / 0.36)',
    ring: 'rgb(var(--pitch) / 0.16)',
    bg: 'rgb(var(--pitch) / 0.040)',
  },
  'quarter-finals': {
    token: 'pitch',
    label: 'rgb(var(--pitch))',
    tint: 'rgb(var(--pitch) / 0.13)',
    border: 'rgb(var(--pitch) / 0.42)',
    ring: 'rgb(var(--pitch) / 0.20)',
    bg: 'rgb(var(--pitch) / 0.050)',
  },
  'semi-finals': {
    token: 'pitch',
    label: 'rgb(var(--pitch))',
    tint: 'rgb(var(--pitch) / 0.16)',
    border: 'rgb(var(--pitch) / 0.50)',
    ring: 'rgb(var(--pitch) / 0.24)',
    bg: 'rgb(var(--pitch) / 0.060)',
  },
  finals: {
    token: 'pitch',
    label: 'rgb(var(--pitch))',
    tint: 'rgb(var(--pitch) / 0.16)',
    border: 'rgb(var(--pitch) / 0.50)',
    ring: 'rgb(var(--pitch) / 0.24)',
    bg: 'rgb(var(--pitch) / 0.060)',
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
  incorrect: boolean,
): SlotState {
  if (!selected) return 'empty';
  if (isAdmin || !hasBothTeams) return 'selected';
  if (exactPosition) return 'exact';
  if (correctButWrongPosition) return 'correct-wrong-position';
  if (incorrect) return 'incorrect';
  return 'selected';
}

function slotBorderColor(state: SlotState): string {
  switch (state) {
    case 'exact':
      return 'rgb(var(--pitch))';
    case 'correct-wrong-position':
      return 'rgb(var(--info))';
    case 'incorrect':
      return 'rgb(var(--live))';
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
  onUpdateResult,
  bracketResults = {},
  submittingResult = null,
  bracketPredictions = {},
  candidateOptions = {},
  deadline,
  onPredictionChange,
  exactPositionPoints = 5,
  correctTeamWrongPositionPoints = 3,
  roundScoring = {},
}: Readonly<BracketVisualizationProps>) {
  const { t } = useI18n();
  const isDeadlinePassed = deadline ? Date.now() >= deadline : false;

  const selectedTeamIdsInPhase = (
    phaseKey: string,
    excludeMatchId: string,
    excludeSide: Slot,
  ): Set<string> => {
    const ids = new Set<string>();
    (bracket[phaseKey] || []).forEach((match) => {
      const prediction = bracketPredictions[match.bracketMatchId] || {};
      const homeTeamId = mode === 'admin' ? match.homeTeamId : prediction.homeTeamId;
      const awayTeamId = mode === 'admin' ? match.awayTeamId : prediction.awayTeamId;

      if (!(match.bracketMatchId === excludeMatchId && excludeSide === 'home') && homeTeamId) {
        ids.add(homeTeamId);
      }
      if (!(match.bracketMatchId === excludeMatchId && excludeSide === 'away') && awayTeamId) {
        ids.add(awayTeamId);
      }
    });
    return ids;
  };

  const getMatchTop = (
    matchIndex: number,
    phaseKey: string,
    allPhases: Record<string, BracketMatch[]>,
  ): number => {
    if (phaseKey === '16th-finals') {
      return matchIndex * (MATCH_HEIGHT + MATCH_GAP);
    }

    if (phaseKey === 'finals') {
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
          const matchCandidates = candidateOptions[match.bracketMatchId];
          const unavailableTeamIds = {
            home: selectedTeamIdsInPhase(phaseKey, match.bracketMatchId, 'home'),
            away: selectedTeamIdsInPhase(phaseKey, match.bracketMatchId, 'away'),
          };
          const hasBothTeams = mode === 'user'
            ? Boolean(prediction.homeTeamId && prediction.awayTeamId)
            : Boolean(match.homeTeamId && match.awayTeamId);
          const homeTeamExactPosition = isDeadlinePassed && hasBothTeams && prediction.homeTeamExactPosition === true;
          const awayTeamExactPosition = isDeadlinePassed && hasBothTeams && prediction.awayTeamExactPosition === true;
          const homeTeamCorrectButWrongPosition =
            isDeadlinePassed && hasBothTeams && prediction.homeTeamCorrectButWrongPosition === true;
          const awayTeamCorrectButWrongPosition =
            isDeadlinePassed && hasBothTeams && prediction.awayTeamCorrectButWrongPosition === true;
          const homeTeamIncorrect =
            isDeadlinePassed &&
            hasBothTeams &&
            prediction.homeTeamExactPosition === false &&
            prediction.homeTeamCorrectButWrongPosition === false;
          const awayTeamIncorrect =
            isDeadlinePassed &&
            hasBothTeams &&
            prediction.awayTeamExactPosition === false &&
            prediction.awayTeamCorrectButWrongPosition === false;
          const points = isDeadlinePassed ? (prediction.points || 0) : 0;

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
                candidateTeams={matchCandidates}
                unavailableTeamIds={unavailableTeamIds}
                isDeadlinePassed={isDeadlinePassed}
                onPredictionChange={onPredictionChange}
                isFinal={isFinal}
                phaseKey={phaseKey}
                homeTeamExactPosition={homeTeamExactPosition}
                awayTeamExactPosition={awayTeamExactPosition}
                homeTeamCorrectButWrongPosition={homeTeamCorrectButWrongPosition}
                awayTeamCorrectButWrongPosition={awayTeamCorrectButWrongPosition}
                homeTeamIncorrect={homeTeamIncorrect}
                awayTeamIncorrect={awayTeamIncorrect}
                points={points}
              />
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  const renderStandaloneMatch = (
    phaseKey: string,
    label: string,
    match: BracketMatch | undefined,
    isFinal: boolean = false,
  ) => {
    if (!match) return null;

    const tone = toneFor(phaseKey);
    const prediction = bracketPredictions[match.bracketMatchId] || {};
    const matchCandidates = candidateOptions[match.bracketMatchId];
    const unavailableTeamIds = {
      home: selectedTeamIdsInPhase(phaseKey, match.bracketMatchId, 'home'),
      away: selectedTeamIdsInPhase(phaseKey, match.bracketMatchId, 'away'),
    };
    const hasBothTeams = mode === 'user'
      ? Boolean(prediction.homeTeamId && prediction.awayTeamId)
      : Boolean(match.homeTeamId && match.awayTeamId);
    const homeTeamExactPosition = isDeadlinePassed && hasBothTeams && prediction.homeTeamExactPosition === true;
    const awayTeamExactPosition = isDeadlinePassed && hasBothTeams && prediction.awayTeamExactPosition === true;
    const homeTeamCorrectButWrongPosition =
      isDeadlinePassed && hasBothTeams && prediction.homeTeamCorrectButWrongPosition === true;
    const awayTeamCorrectButWrongPosition =
      isDeadlinePassed && hasBothTeams && prediction.awayTeamCorrectButWrongPosition === true;
    const homeTeamIncorrect =
      isDeadlinePassed &&
      hasBothTeams &&
      prediction.homeTeamExactPosition === false &&
      prediction.homeTeamCorrectButWrongPosition === false;
    const awayTeamIncorrect =
      isDeadlinePassed &&
      hasBothTeams &&
      prediction.awayTeamExactPosition === false &&
      prediction.awayTeamCorrectButWrongPosition === false;
    const points = isDeadlinePassed ? (prediction.points || 0) : 0;

    return (
      <div
        style={{
          width: `${MATCH_BOX_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
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
            }}
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
        <BracketMatchBox
          match={match}
          teams={teams}
          poolId={poolId}
          mode={mode}
          updatingMatch={updatingMatch}
          onUpdateTeam={onUpdateTeam}
          prediction={prediction}
          candidateTeams={matchCandidates}
          unavailableTeamIds={unavailableTeamIds}
          isDeadlinePassed={isDeadlinePassed}
          onPredictionChange={onPredictionChange}
          isFinal={isFinal}
          phaseKey={phaseKey}
          homeTeamExactPosition={homeTeamExactPosition}
          awayTeamExactPosition={awayTeamExactPosition}
          homeTeamCorrectButWrongPosition={homeTeamCorrectButWrongPosition}
          awayTeamCorrectButWrongPosition={awayTeamCorrectButWrongPosition}
          homeTeamIncorrect={homeTeamIncorrect}
          awayTeamIncorrect={awayTeamIncorrect}
          points={points}
        />
      </div>
    );
  };

  const renderTournamentWinnerCard = (match: BracketMatch | undefined) => {
    if (!match) return null;

    const tone = toneFor('finals');
    const prediction = bracketPredictions[match.bracketMatchId] || {};
    const isAdmin = mode === 'admin';
    const finalResult = bracketResults[match.bracketMatchId];
    const resultHome =
      typeof finalResult?.homeResult === 'number'
        ? finalResult.homeResult
        : typeof match.homeResult === 'number'
        ? match.homeResult
        : null;
    const resultAway =
      typeof finalResult?.awayResult === 'number'
        ? finalResult.awayResult
        : typeof match.awayResult === 'number'
        ? match.awayResult
        : null;
    const homeTeamId = isAdmin ? match.homeTeamId || '' : prediction.homeTeamId || '';
    const awayTeamId = isAdmin ? match.awayTeamId || '' : prediction.awayTeamId || '';
    const homeTeamName = isAdmin ? match.homeTeamName || '' : prediction.homeTeamName || '';
    const awayTeamName = isAdmin ? match.awayTeamName || '' : prediction.awayTeamName || '';
    const selectedWinnerTeamId = isAdmin
      ? resultHome !== null && resultAway !== null && resultHome !== resultAway
        ? resultHome > resultAway
          ? homeTeamId
          : awayTeamId
        : ''
      : prediction.predictedWinnerTeamId || '';
    const isDisabled = isAdmin
      ? poolId === 'all-pools' ||
        submittingResult === match.bracketMatchId ||
        !homeTeamId ||
        !awayTeamId ||
        !onUpdateResult
      : poolId === 'all-pools' ||
        Boolean(isDeadlinePassed) ||
        !onPredictionChange;
    const handleWinnerChange = (teamId: string) => {
      if (isAdmin) {
        if (!onUpdateResult || !teamId) return;
        if (teamId === homeTeamId) {
          onUpdateResult(match.bracketMatchId, 1, 0);
        } else if (teamId === awayTeamId) {
          onUpdateResult(match.bracketMatchId, 0, 1);
        }
        return;
      }

      if (!onPredictionChange) return;
      if (teamId === homeTeamId) {
        onPredictionChange(match.bracketMatchId, 'winner', homeTeamId, homeTeamName || '');
      } else if (teamId === awayTeamId) {
        onPredictionChange(match.bracketMatchId, 'winner', awayTeamId, awayTeamName || '');
      } else {
        onPredictionChange(match.bracketMatchId, 'winner', '', '');
      }
    };

    const options = [
      ...(homeTeamId
        ? [{ value: homeTeamId, label: (
              <>
                <ReactCountryFlag
                  countryCode={countryIsoCode(homeTeamName)}
                  svg
                  style={{ width: '2em', height: '2em' }}
                />
                <span>
                  {` ${homeTeamName}`}
                </span>
              </>
            ) 
          }]
        : []),
      ...(awayTeamId
        ? [{ value: awayTeamId, label: (
              <>
                <ReactCountryFlag
                  countryCode={countryIsoCode(awayTeamName)}
                  svg
                  style={{ width: '2em', height: '2em' }}
                />
                <span>
                  {` ${awayTeamName}`}
                </span>
              </>
            )
          }]
        : []),
    ];

    const selectedOption = options.find((option) => option.value === selectedWinnerTeamId) ?? null;

    return (
      <div
        style={{
          width: `${MATCH_BOX_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
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
            }}
          >
            <FaTrophy aria-hidden style={{ color: 'rgb(var(--gold))', flexShrink: 0 }} />
            {t('bracket.winner')}
          </span>
        </div>
        <article
          style={{
            background: `linear-gradient(var(--card-sheen), var(--card-sheen)), rgb(var(--bg-elevated))`,
            backdropFilter: 'blur(12px) saturate(140%)',
            WebkitBackdropFilter: 'blur(12px) saturate(140%)',
            border: '1px solid rgb(var(--border))',
            borderTop: `3px solid ${tone.label}`,
            boxShadow: `inset 0 1px 0 var(--card-inset-highlight), 0 3px 10px rgb(0 0 0 / 0.10), 0 0 0 1px ${tone.ring}`,
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            minWidth: `${MATCH_BOX_WIDTH - 8}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.6rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: tone.label,
            }}
          >
            <FaTrophy aria-hidden style={{ color: 'rgb(var(--gold))' }} />
            {t('bracket.winner')}
          </span>
          <Select<{ value: string; label: React.ReactNode; }, false>
            isSearchable={false}
            placeholder={t('bracket.selectTournamentWinner')}
            value={selectedOption}
            options={options}
            isDisabled={isDisabled}
            onChange={(option) => handleWinnerChange(option?.value ?? '')}
            menuPortalTarget={document.body}
            styles={selectStyles({
              control: (base) => ({
                ...base,
                backgroundColor: prediction.tournamentWinnerCorrect === true || selectedWinnerTeamId
                  ? 'rgb(var(--gold) / 0.08)'
                  : isDisabled
                  ? 'rgb(var(--bg-subtle))'
                  : 'rgb(var(--input-bg))',
                border: `1px solid ${
                  prediction.tournamentWinnerCorrect === true || selectedWinnerTeamId
                    ? 'rgb(var(--gold))'
                    : 'rgb(var(--border))'
                }`,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.7 : 1,
              }),
            })}
          />
        </article>
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

        {/* Center: Final — absolute positioning so the final match aligns with semi-finals */}
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            width: `${MATCH_BOX_WIDTH}px`,
            height: `${maxHeight}px`,
          }}
        >
          {(() => {
            const finalsMatch = bracket['finals']?.[0];
            if (!finalsMatch) return null;
            // renderStandaloneMatch renders its own chip (~LABEL_RESERVE height) above the match
            // box, so positioning it at finalTop aligns the inner match box with the side columns.
            const finalTop = getMatchTop(0, 'finals', bracket);
            const winnerTop = Math.max(0, finalTop - 130);
            return (
              <>
                <div style={{ position: 'absolute', top: `${winnerTop}px`, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  {renderTournamentWinnerCard(finalsMatch)}
                </div>
                <div style={{ position: 'absolute', top: `${finalTop}px`, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  {renderStandaloneMatch('finals', t('bracket.round.final'), finalsMatch, true)}
                </div>
              </>
            );
          })()}
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
  candidateTeams?: { home: Team[]; away: Team[] };
  unavailableTeamIds?: { home: Set<string>; away: Set<string> };
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
  homeTeamIncorrect?: boolean;
  awayTeamIncorrect?: boolean;
  points?: number;
}

function BracketMatchBox({
  match,
  teams,
  poolId,
  mode,
  updatingMatch,
  onUpdateTeam,
  prediction,
  candidateTeams,
  unavailableTeamIds,
  isDeadlinePassed,
  onPredictionChange,
  isFinal = false,
  phaseKey,
  homeTeamExactPosition = false,
  awayTeamExactPosition = false,
  homeTeamCorrectButWrongPosition = false,
  awayTeamCorrectButWrongPosition = false,
  homeTeamIncorrect = false,
  awayTeamIncorrect = false,
  points,
}: Readonly<BracketMatchBoxProps>) {
  const phaseTone = toneFor(phaseKey ?? match.phase);
  const { t } = useI18n();
  const isAdmin = mode === 'admin';
  const isDisabled = isAdmin
    ? updatingMatch === match.bracketMatchId || poolId === 'all-pools'
    : poolId === 'all-pools' || Boolean(isDeadlinePassed);

  const homeTeamId = isAdmin ? match.homeTeamId : prediction?.homeTeamId || '';
  const awayTeamId = isAdmin ? match.awayTeamId : prediction?.awayTeamId || '';
  const hasBothTeams = isAdmin
    ? Boolean(match.homeTeamId && match.awayTeamId)
    : Boolean(homeTeamId && awayTeamId);
  const homeOptions = candidateTeams?.home?.length ? candidateTeams.home : teams;
  const awayOptions = candidateTeams?.away?.length ? candidateTeams.away : teams;

  const homeState: SlotState = slotState(
    isAdmin,
    hasBothTeams,
    Boolean(homeTeamId),
    homeTeamExactPosition,
    homeTeamCorrectButWrongPosition,
    homeTeamIncorrect,
  );
  const awayState: SlotState = slotState(
    isAdmin,
    hasBothTeams,
    Boolean(awayTeamId),
    awayTeamExactPosition,
    awayTeamCorrectButWrongPosition,
    awayTeamIncorrect,
  );

  const handleTeamChange = (side: Slot, teamId: string, teamName: string) => {
    if (isAdmin && onUpdateTeam) {
      onUpdateTeam(match.bracketMatchId, side, teamId, teamName);
    } else if (!isAdmin && onPredictionChange) {
      onPredictionChange(match.bracketMatchId, side, teamId, teamName);
    }
  };

  return (
    <article
      style={{
        background: `linear-gradient(var(--card-sheen), var(--card-sheen)), rgb(var(--bg-elevated))`,
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid rgb(var(--border))',
        borderTop: `3px solid ${phaseTone.label}`,
        boxShadow: `inset 0 1px 0 var(--card-inset-highlight), 0 3px 10px rgb(0 0 0 / 0.10), 0 0 0 1px ${phaseTone.ring}`,
        padding: '0.35rem 0.45rem',
        borderRadius: 'var(--radius-sm)',
        minWidth: `${MATCH_BOX_WIDTH - 8}px`,
        minHeight: 102,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        position: 'relative',
      }}
    >
      {!isAdmin && points ? ( 
        <PointsBadge
          points={points}
          label={t('poolDetail.players.points', { points: points })}
        />
      ) : null}
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
          {isFinal ? `${t('bracket.round.final')} · P${match.matchNumber}` : `P${match.matchNumber}`}
        </span>
      </div>

      <BracketSlot
        teamId={homeTeamId || ''}
        teams={homeOptions}
        disabled={isDisabled}
        state={homeState}
        onChange={(teamId, teamName) => handleTeamChange('home', teamId, teamName)}
        ariaLabel={t('bracket.selectTeam')}
        sourceLabel={match.homeSourceLabel}
        unavailableTeamIds={unavailableTeamIds?.home}
      />

      <BracketSlot
        teamId={awayTeamId || ''}
        teams={awayOptions}
        disabled={isDisabled}
        state={awayState}
        onChange={(teamId, teamName) => handleTeamChange('away', teamId, teamName)}
        ariaLabel={t('bracket.selectTeam')}
        sourceLabel={match.awaySourceLabel}
        unavailableTeamIds={unavailableTeamIds?.away}
      />

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
  sourceLabel?: string;
  unavailableTeamIds?: Set<string>;
}

function BracketSlot({
  teamId,
  teams,
  disabled,
  state,
  onChange,
  ariaLabel,
  sourceLabel,
  unavailableTeamIds,
}: Readonly<BracketSlotProps>) {
  const { t } = useI18n();
  const borderColor = slotBorderColor(state);
  const isExact = state === 'exact';
  const isCorrect = state === 'correct-wrong-position';

  const isIncorrect = state === 'incorrect';

  let tintBg = 'rgb(var(--input-bg))';
    if (isExact) {
      tintBg = 'rgb(var(--pitch) / 0.06)';
    } else if (isCorrect) {
      tintBg = 'rgb(var(--info) / 0.06)';
    } else if (isIncorrect) {
      tintBg = 'rgb(var(--live) / 0.06)';
    } else if (disabled) {
      tintBg = 'rgb(var(--bg-subtle))';
    }

  const options = teams.map((team) => {
    const isUnavailable = team.teamId !== teamId && Boolean(unavailableTeamIds?.has(team.teamId));

    return {
      value: team.teamId,
      label: (
        <>
          <ReactCountryFlag
            countryCode={countryIsoCode(team.name)}
            svg
            style={{ width: '2em', height: '2em' }}
          />
          <span>
            {` ${team.name}`}
            {isUnavailable
              ? ` - ${t('bracket.alreadySelected')}`
              : ''}
          </span>
        </>
      ),
      isDisabled: isUnavailable
    };
  });

  const selectedOption = options.find((option) => option.value === teamId) ?? null;

  return (
    <div style={{ display: 'grid', gap: sourceLabel ? '0.12rem' : 0 }}>
      <Select<{ value: string; label: React.ReactNode; }, false>
        isSearchable={false}
        aria-label={ariaLabel}
        placeholder={t('bracket.selectTeam')}
        value={selectedOption}
        options={options}
        isDisabled={disabled}
        onChange={(option) => {
          const selected = teams.find((team) => team.teamId === option?.value);
          if (selected) onChange(selected.teamId, selected.name);
        }}
        menuPortalTarget={document.body}
        styles={selectStyles({
          control: (base) => ({
            ...base,
            backgroundColor: tintBg,
            border: `1px solid ${borderColor}`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.7 : 1,
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
        })}
      />
      {sourceLabel ? (
        <span style={{
          fontSize: '0.58rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          color: 'rgb(var(--fg-subtle))',
          paddingLeft: '0.2rem',
        }}>
          {sourceLabel}
        </span>
      ) : null}
    </div>
  );
}
