'use client';

import { useCallback, useRef } from 'react';
import { useI18n } from '@/i18n/client';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
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
  onMatchClick?: (match: BracketMatch) => void;
  onWinnerClick?: () => void;
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
    token: 'neutral',
    label: 'rgb(var(--fg-muted))',
    tint: 'rgb(var(--fg) / 0.06)',
    border: 'rgb(var(--border) / 0.70)',
    ring: 'rgb(var(--border) / 0.35)',
    bg: 'rgb(var(--fg) / 0.020)',
  },
  '8th-finals': {
    token: 'neutral',
    label: 'rgb(var(--fg-muted))',
    tint: 'rgb(var(--fg) / 0.06)',
    border: 'rgb(var(--border) / 0.70)',
    ring: 'rgb(var(--border) / 0.35)',
    bg: 'rgb(var(--fg) / 0.020)',
  },
  'quarter-finals': {
    token: 'neutral',
    label: 'rgb(var(--fg-muted))',
    tint: 'rgb(var(--fg) / 0.06)',
    border: 'rgb(var(--border) / 0.70)',
    ring: 'rgb(var(--border) / 0.35)',
    bg: 'rgb(var(--fg) / 0.020)',
  },
  'semi-finals': {
    token: 'neutral',
    label: 'rgb(var(--fg-muted))',
    tint: 'rgb(var(--fg) / 0.06)',
    border: 'rgb(var(--border) / 0.70)',
    ring: 'rgb(var(--border) / 0.35)',
    bg: 'rgb(var(--fg) / 0.020)',
  },
  finals: {
    token: 'neutral',
    label: 'rgb(var(--fg-muted))',
    tint: 'rgb(var(--fg) / 0.06)',
    border: 'rgb(var(--border) / 0.70)',
    ring: 'rgb(var(--border) / 0.35)',
    bg: 'rgb(var(--fg) / 0.020)',
  },
};

const WINNER_TONE = {
  token: 'pitch',
  label: 'rgb(var(--pitch))',
  tint: 'rgb(var(--pitch) / 0.16)',
  border: 'rgb(var(--pitch) / 0.50)',
  ring: 'rgb(var(--pitch) / 0.24)',
  bg: 'rgb(var(--pitch) / 0.060)',
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
    case 'finals':
      return 'semi-finals';
    default:
      return null;
  }
}

function toneFor(phase: string | undefined): typeof FALLBACK_TONE {
  return (phase && PHASE_TONE[phase]) || FALLBACK_TONE;
}

function renderConnectorPath(
  fromX: number,
  fromY1: number,
  fromY2: number,
  toX: number,
  toY: number,
  side: 'left' | 'right',
): string {
  const direction = side === 'left' ? 1 : -1;
  const elbowX = fromX + direction * (ROUND_GAP / 2);
  return [
    `M ${fromX} ${fromY1}`,
    `H ${elbowX}`,
    `V ${fromY2}`,
    `H ${fromX}`,
    `M ${elbowX} ${toY}`,
    `H ${toX}`,
  ].join(' ');
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
  onMatchClick,
  onWinnerClick,
}: Readonly<BracketVisualizationProps>) {
  const { t, locale } = useI18n();
  const isDeadlinePassed = deadline ? Date.now() >= deadline : false;
  const bracketScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollLockRef = useRef<{ left: number; until: number } | null>(null);

  const preserveBracketScrollPosition = useCallback(() => {
    const scrollContainer = bracketScrollRef.current;
    if (!scrollContainer) return;

    const now = Date.now();
    const activeLock = scrollLockRef.current;
    const left = activeLock && activeLock.until > now ? activeLock.left : scrollContainer.scrollLeft;
    scrollLockRef.current = { left, until: now + 800 };

    const restore = () => {
      const lock = scrollLockRef.current;
      const current = bracketScrollRef.current;
      if (!lock || !current || lock.until < Date.now()) return;
      if (Math.abs(current.scrollLeft - lock.left) > 1) {
        current.scrollLeft = lock.left;
      }
    };

    requestAnimationFrame(restore);
    globalThis.setTimeout(restore, 0);
    globalThis.setTimeout(restore, 80);
    globalThis.setTimeout(restore, 180);
    globalThis.setTimeout(restore, 360);
  }, []);

  const handleBracketScroll = useCallback(() => {
    const lock = scrollLockRef.current;
    const current = bracketScrollRef.current;
    if (!lock || !current || lock.until < Date.now()) return;
    if (Math.abs(current.scrollLeft - lock.left) > 1) {
      requestAnimationFrame(() => {
        const latestLock = scrollLockRef.current;
        const latestCurrent = bracketScrollRef.current;
        if (!latestLock || !latestCurrent || latestLock.until < Date.now()) return;
        latestCurrent.scrollLeft = latestLock.left;
      });
    }
  }, []);

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
  ) => {
    if (!matches || matches.length === 0) return null;

    const tone = toneFor(phaseKey);

    return (
      <div
        style={{
          width: `${MATCH_BOX_WIDTH}px`,
          flexShrink: 0,
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
              padding: '0.2rem 0.1rem 0.35rem',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: tone.label,
              borderBottom: `2px solid ${tone.border}`,
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
                background: 'rgb(var(--pitch))',
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
          const top = getMatchTop(idx, phaseKey, bracket);
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
          const advancedTeamId = getAdvancedTeamId(bracket, phaseKey, idx);
          const isFinished = isFinishedBracketMatch(match, advancedTeamId);

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
                isFinal={false}
                phaseKey={phaseKey}
                onSelectInteractionStart={preserveBracketScrollPosition}
                homeTeamExactPosition={homeTeamExactPosition}
                awayTeamExactPosition={awayTeamExactPosition}
                homeTeamCorrectButWrongPosition={homeTeamCorrectButWrongPosition}
                awayTeamCorrectButWrongPosition={awayTeamCorrectButWrongPosition}
                homeTeamIncorrect={homeTeamIncorrect}
                awayTeamIncorrect={awayTeamIncorrect}
                points={points}
                onMatchClick={onMatchClick}
                locale={locale}
                isFinished={isFinished}
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
    const isFinished = isFinishedBracketMatch(match);

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
              padding: '0.2rem 0.1rem 0.35rem',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: tone.label,
              borderBottom: `2px solid ${tone.border}`,
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
                background: 'rgb(var(--pitch))',
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
          onSelectInteractionStart={preserveBracketScrollPosition}
          homeTeamExactPosition={homeTeamExactPosition}
          awayTeamExactPosition={awayTeamExactPosition}
          homeTeamCorrectButWrongPosition={homeTeamCorrectButWrongPosition}
          awayTeamCorrectButWrongPosition={awayTeamCorrectButWrongPosition}
          homeTeamIncorrect={homeTeamIncorrect}
          awayTeamIncorrect={awayTeamIncorrect}
          points={points}
          onMatchClick={onMatchClick}
          locale={locale}
          isFinished={isFinished}
        />
      </div>
    );
  };

  const renderTournamentWinnerCard = (match: BracketMatch | undefined) => {
    if (!match) return null;

    const tone = WINNER_TONE;
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
    const homeTeamDisplayName = countryDisplayName(homeTeamName, t);
    const awayTeamDisplayName = countryDisplayName(awayTeamName, t);
    const selectedWinnerTeamId = isAdmin
      ? resultHome !== null && resultAway !== null && resultHome !== resultAway
        ? resultHome > resultAway
          ? homeTeamId
          : awayTeamId
        : ''
      : prediction.predictedWinnerTeamId || '';
    const isDisabled = isAdmin
      ? submittingResult === match.bracketMatchId ||
        !homeTeamId ||
        !awayTeamId ||
        !onUpdateResult
      : Boolean(isDeadlinePassed) ||
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
                  {` ${homeTeamDisplayName}`}
                </span>
              </>
            ),
            displayLabel: homeTeamDisplayName,
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
                  {` ${awayTeamDisplayName}`}
                </span>
              </>
            ),
            displayLabel: awayTeamDisplayName,
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
          role={onWinnerClick ? 'button' : undefined}
          tabIndex={onWinnerClick ? 0 : undefined}
          onClick={() => onWinnerClick?.()}
          onKeyDown={(event) => {
            if (onWinnerClick && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              onWinnerClick();
            }
          }}
          style={{
            background: 'rgb(var(--bg-elevated) / 0.92)',
            border: `1px solid ${tone.border}`,
            borderLeft: `3px solid ${tone.label}`,
            boxShadow: '0 3px 10px rgb(15 23 28 / 0.07)',
            padding: '0.48rem',
            borderRadius: 'var(--radius-md)',
            minWidth: `${MATCH_BOX_WIDTH - 8}px`,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            overflow: 'hidden',
            position: 'relative',
            cursor: onWinnerClick ? 'pointer' : undefined,
          }}
        >
          {onWinnerClick ? (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 3,
                borderRadius: 'inherit',
                cursor: 'pointer',
              }}
            />
          ) : null}
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
          <div onPointerDownCapture={preserveBracketScrollPosition}>
            <Select<{ value: string; label: React.ReactNode; displayLabel: string }, false>
              isSearchable={false}
              placeholder={t('bracket.selectTournamentWinner')}
              value={selectedOption}
              options={options}
              getOptionLabel={(option) => option.displayLabel}
              formatOptionLabel={(option) => option.label}
              isDisabled={isDisabled}
              onFocus={preserveBracketScrollPosition}
              onMenuOpen={preserveBracketScrollPosition}
              onChange={(option) => handleWinnerChange(option?.value ?? '')}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              menuPosition="fixed"
              menuPlacement="auto"
              menuShouldScrollIntoView={false}
              maxMenuHeight={220}
              styles={selectStyles({
                control: (base) => ({
                  ...base,
                  backgroundColor: prediction.tournamentWinnerCorrect === true || selectedWinnerTeamId
                    ? 'rgb(var(--gold) / 0.08)'
                    : isDisabled
                    ? 'rgb(var(--disabled-bg))'
                    : 'rgb(var(--input-bg))',
                  border: `1px solid ${
                    prediction.tournamentWinnerCorrect === true || selectedWinnerTeamId
                      ? 'rgb(var(--gold))'
                      : isDisabled
                      ? 'rgb(var(--disabled-border))'
                      : 'rgb(var(--border))'
                  }`,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: 1,
                }),
              })}
            />
          </div>
        </article>
      </div>
    );
  };

  let maxHeight = 0;
  const checkPhase = (phaseKey: string) => {
    const phaseMatches = bracket[phaseKey] || [];
    if (phaseMatches.length === 0) return;

    for (let idx = 0; idx < phaseMatches.length; idx++) {
      const top = getMatchTop(idx, phaseKey, bracket);
      const bottom = top + MATCH_HEIGHT;
      if (bottom > maxHeight) maxHeight = bottom;
    }
  };

  BRACKET_PHASES.forEach((phaseKey) => {
    checkPhase(phaseKey);
  });

  // The match-span (`maxHeight` so far) sits inside a flex column whose first
  // child is the round label chip. Reserve just enough for the chip + its
  // margin so the side container is exactly tall enough — no trailing empty
  // space below the bottom match.
  const LABEL_RESERVE = 30;
  maxHeight = Math.max(maxHeight, 140) + LABEL_RESERVE;
  const bracketWidth = BRACKET_PHASES.length * MATCH_BOX_WIDTH + (BRACKET_PHASES.length - 1) * ROUND_GAP;
  const matchCenterY = (top: number) => LABEL_RESERVE + top + MATCH_HEIGHT / 2;
  const connectorPaths: string[] = [];

  BRACKET_PHASES.slice(0, -1).forEach((phaseKey, phaseIndex) => {
    const nextPhaseKey = BRACKET_PHASES[phaseIndex + 1];
    const phaseMatches = bracket[phaseKey] || [];
    const nextMatches = bracket[nextPhaseKey] || [];

    nextMatches.forEach((_match, targetIndex) => {
      const sourceIndex1 = targetIndex * 2;
      const sourceIndex2 = sourceIndex1 + 1;
      if (!phaseMatches[sourceIndex1] || !phaseMatches[sourceIndex2]) return;

      const fromTop1 = getMatchTop(sourceIndex1, phaseKey, bracket);
      const fromTop2 = getMatchTop(sourceIndex2, phaseKey, bracket);
      const toTop = getMatchTop(targetIndex, nextPhaseKey, bracket);
      const fromX = phaseIndex * (MATCH_BOX_WIDTH + ROUND_GAP) + MATCH_BOX_WIDTH;
      const toX = (phaseIndex + 1) * (MATCH_BOX_WIDTH + ROUND_GAP);
      connectorPaths.push(renderConnectorPath(fromX, matchCenterY(fromTop1), matchCenterY(fromTop2), toX, matchCenterY(toTop), 'left'));
    });
  });

  return (
    <div
      ref={bracketScrollRef}
      className="bracket-scroll"
      onScroll={handleBracketScroll}
      style={{
        overflowX: 'auto',
        overflowY: 'visible',
        padding: '0.35rem 0 0.65rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: `${ROUND_GAP}px`,
          alignItems: 'flex-start',
          minHeight: `${maxHeight}px`,
          position: 'relative',
          width: `${bracketWidth}px`,
        }}
      >
        <svg
          aria-hidden
          width={bracketWidth}
          height={maxHeight}
          viewBox={`0 0 ${bracketWidth} ${maxHeight}`}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <path
            d={connectorPaths.join(' ')}
            fill="none"
            stroke="rgb(var(--fg))"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.28"
          />
        </svg>
        <div
          style={{
            display: 'flex',
            gap: `${ROUND_GAP}px`,
            alignItems: 'flex-start',
            height: `${maxHeight}px`,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {renderRound('16th-finals', t('bracket.round.16th'), bracket['16th-finals'] || [])}
          {renderRound('8th-finals', t('bracket.round.8th'), bracket['8th-finals'] || [])}
          {renderRound('quarter-finals', t('bracket.round.quarter'), bracket['quarter-finals'] || [])}
          {renderRound('semi-finals', t('bracket.round.semi'), bracket['semi-finals'] || [])}
        </div>

        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            width: `${MATCH_BOX_WIDTH}px`,
            height: `${maxHeight}px`,
            zIndex: 1,
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
  onSelectInteractionStart?: () => void;
  onMatchClick?: (match: BracketMatch) => void;
  locale: string;
  isFinished?: boolean;
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
  onSelectInteractionStart,
  onMatchClick,
  locale,
  isFinished = false,
}: Readonly<BracketMatchBoxProps>) {
  const phaseTone = toneFor(phaseKey ?? match.phase);
  const { t } = useI18n();
  const isAdmin = mode === 'admin';
  const formattedSchedule = formatBracketSchedule(match.scheduledAt, locale);
  const isDisabled = isAdmin
    ? updatingMatch === match.bracketMatchId
    : Boolean(isDeadlinePassed);

  const homeTeamId = isAdmin ? match.homeTeamId : prediction?.homeTeamId || '';
  const awayTeamId = isAdmin ? match.awayTeamId : prediction?.awayTeamId || '';
  const hasBothTeams = isAdmin
    ? Boolean(match.homeTeamId && match.awayTeamId)
    : Boolean(homeTeamId && awayTeamId);
  // Use candidates from the source match. If candidates exist (even empty array), respect them —
  // an empty array means the feeding match hasn't been filled yet (cascade not satisfied).
  // Fall back to all teams only when no candidate data was computed at all (undefined).
  const homeOptions = candidateTeams?.home ?? teams;
  const awayOptions = candidateTeams?.away ?? teams;

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
      role={onMatchClick ? 'button' : undefined}
      tabIndex={onMatchClick ? 0 : undefined}
      onClick={() => onMatchClick?.(match)}
      onKeyDown={(event) => {
        if (onMatchClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onMatchClick(match);
        }
      }}
      style={{
        background: isFinished ? 'rgb(var(--fg) / 0.035)' : 'rgb(var(--match-neutral-bg))',
        border: isFinished
          ? '1px solid rgb(var(--border) / 0.55)'
          : '1px solid rgb(var(--control-border))',
        borderLeft: `3px solid ${isFinished ? 'rgb(var(--fg-muted) / 0.55)' : 'rgb(var(--control-border))'}`,
        boxShadow: isFinished ? 'none' : 'var(--shadow-sm)',
        padding: '0.42rem 0.48rem',
        borderRadius: 'var(--radius-md)',
        minWidth: `${MATCH_BOX_WIDTH - 8}px`,
        minHeight: 112,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        position: 'relative',
        cursor: onMatchClick ? 'pointer' : undefined,
        filter: isFinished ? 'grayscale(0.35)' : undefined,
        opacity: isFinished ? 0.72 : 1,
      }}
    >
      {onMatchClick ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            borderRadius: 'inherit',
            cursor: 'pointer',
          }}
        />
      ) : null}
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
            color: isFinished ? 'rgb(var(--fg-muted))' : phaseTone.label,
          }}
        >
          {isFinal ? `${t('bracket.round.final')} · P${match.matchNumber}` : `P${match.matchNumber}`}
        </span>
        {formattedSchedule ? (
          <span
            style={{
              color: 'rgb(var(--fg-muted))',
              fontSize: '0.58rem',
              fontWeight: 650,
              minWidth: 0,
              overflow: 'hidden',
              textAlign: 'right',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {formattedSchedule}
          </span>
        ) : null}
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
        onSelectInteractionStart={onSelectInteractionStart}
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
        onSelectInteractionStart={onSelectInteractionStart}
      />

    </article>
  );
}

function isCompletedBracketMatch(match: BracketMatch): boolean {
  const hasDecidedResult =
    typeof match.homeResult === 'number' &&
    typeof match.awayResult === 'number' &&
    match.homeResult !== match.awayResult;

  return match.status === 'completed' || hasDecidedResult;
}

function isFinishedBracketMatch(match: BracketMatch, advancedTeamId = ''): boolean {
  const hasAdvancedTeam =
    Boolean(advancedTeamId) &&
    (advancedTeamId === match.homeTeamId || advancedTeamId === match.awayTeamId);

  return isCompletedBracketMatch(match) || hasAdvancedTeam;
}

function getAdvancedTeamId(
  bracket: Record<string, BracketMatch[]>,
  phaseKey: string,
  matchIndex: number,
): string {
  const phaseIndex = BRACKET_PHASES.findIndex((phase) => phase === phaseKey);
  const nextPhase = phaseIndex >= 0 ? BRACKET_PHASES[phaseIndex + 1] : undefined;
  if (!nextPhase) return '';

  const nextMatch = bracket[nextPhase]?.[Math.floor(matchIndex / 2)];
  if (!nextMatch) return '';

  return matchIndex % 2 === 0 ? nextMatch.homeTeamId || '' : nextMatch.awayTeamId || '';
}

function formatBracketSchedule(scheduledAt: string | undefined, locale: string): string | null {
  if (!scheduledAt) return null;
  const timestamp = new Date(scheduledAt).getTime();
  if (!Number.isFinite(timestamp)) return null;

  return new Date(timestamp).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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
  onSelectInteractionStart?: () => void;
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
  onSelectInteractionStart,
}: Readonly<BracketSlotProps>) {
  const { t } = useI18n();
  const borderColor = slotBorderColor(state);
  const isExact = state === 'exact';
  const isCorrect = state === 'correct-wrong-position';

  const isIncorrect = state === 'incorrect';
  const hasStatusBorder = isExact || isCorrect || isIncorrect;

  let tintBg = 'rgb(var(--input-bg))';
    if (isExact) {
      tintBg = 'rgb(var(--pitch) / 0.06)';
    } else if (isCorrect) {
      tintBg = 'rgb(var(--info) / 0.06)';
    } else if (isIncorrect) {
      tintBg = 'rgb(var(--live) / 0.06)';
    } else if (disabled) {
      tintBg = 'rgb(var(--disabled-bg))';
    }

  const options = teams.map((team) => {
    const isUnavailable = team.teamId !== teamId && Boolean(unavailableTeamIds?.has(team.teamId));
    const displayName = countryDisplayName(team.name, t);

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
            {` ${displayName}`}
            {isUnavailable
              ? ` - ${t('bracket.alreadySelected')}`
              : ''}
          </span>
        </>
      ),
      displayLabel: displayName,
      isDisabled: isUnavailable
    };
  });

  const selectedOption = options.find((option) => option.value === teamId) ?? null;

  return (
    <div
      onPointerDownCapture={onSelectInteractionStart}
      style={{ display: 'grid', gap: sourceLabel ? '0.12rem' : 0 }}
    >
      <Select<{ value: string; label: React.ReactNode; displayLabel: string; isDisabled: boolean }, false>
        isSearchable={false}
        aria-label={ariaLabel}
        placeholder={t('bracket.selectTeam')}
        value={selectedOption}
        options={options}
        getOptionLabel={(option) => option.displayLabel}
        formatOptionLabel={(option) => option.label}
        isDisabled={disabled}
        onFocus={onSelectInteractionStart}
        onMenuOpen={onSelectInteractionStart}
        onChange={(option) => {
          const selected = teams.find((team) => team.teamId === option?.value);
          if (selected) onChange(selected.teamId, selected.name);
        }}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
        menuPlacement="auto"
        menuShouldScrollIntoView={false}
        maxMenuHeight={220}
        styles={selectStyles({
          control: (base) => ({
            ...base,
            backgroundColor: tintBg,
            border: `${hasStatusBorder ? 3 : 1}px solid ${
              disabled && !hasStatusBorder ? 'rgb(var(--disabled-border))' : borderColor
            }`,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: 1,
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
