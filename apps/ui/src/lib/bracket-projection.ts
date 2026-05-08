import { BracketCandidateMap } from "@/types/bracketCandidateMap.type";
import { BracketPredictionProjection } from "@/types/bracketPredictionProjection.interface";
import { GroupMatchProjection } from "@/types/groupMatchProjection.interface";
import { ScorePredictionProjection } from "@/types/scorePredictionProjection.interface";

const PHASE_ORDER = [
  '16th-finals',
  '8th-finals',
  'quarter-finals',
  'semi-finals',
  'finals',
];

function scoreValue(value: number | ''): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function matchPredictionComplete(prediction: ScorePredictionProjection | undefined): prediction is {
  homeScore: number;
  awayScore: number;
} {
  const homeScore = scoreValue(prediction?.homeScore ?? '');
  const awayScore = scoreValue(prediction?.awayScore ?? '');
  return homeScore !== null && awayScore !== null && !(homeScore === 0 && awayScore === 0);
}

function teamFromMatchSide(
  teamId: string | undefined,
  teamName: string,
  group: string,
  teamsById: Map<string, Team>,
  teamsByName: Map<string, Team>,
): Team {
  const byId = teamId ? teamsById.get(teamId) : undefined;
  const byName = teamsByName.get(teamName);
  return {
    teamId: byId?.teamId || byName?.teamId || teamId || teamName,
    name: byId?.name || byName?.name || teamName,
    group: byId?.group || byName?.group || group,
    code: byId?.code || byName?.code,
  };
}

function compareRows(a: StandingRow, b: StandingRow): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    b.fairPlay - a.fairPlay ||
    String(a.group || '').localeCompare(String(b.group || '')) ||
    a.name.localeCompare(b.name)
  );
}

function rankGroup(
  rows: StandingRow[],
  groupMatches: GroupMatchProjection[],
  predictions: Record<string, ScorePredictionProjection>,
): StandingRow[] {
  const byPoints = new Map<number, StandingRow[]>();
  rows.forEach((row) => {
    const bucket = byPoints.get(row.points) || [];
    bucket.push(row);
    byPoints.set(row.points, bucket);
  });

  return Array.from(byPoints.entries())
    .sort(([a], [b]) => b - a)
    .flatMap(([, tiedRows]: [number, StandingRow[]]) => {
      if (tiedRows.length <= 1) return tiedRows;

      const tiedIds = new Set(tiedRows.map((row: StandingRow) => row.teamId));
      const headToHead = new Map<string, { points: number; goalDifference: number; goalsFor: number }>();
      tiedRows.forEach((row: StandingRow) => headToHead.set(row.teamId, { points: 0, goalDifference: 0, goalsFor: 0 }));

      groupMatches.forEach((match) => {
        if (!match.homeTeamId || !match.awayTeamId) return;
        if (!tiedIds.has(match.homeTeamId) || !tiedIds.has(match.awayTeamId)) return;
        const prediction = predictions[match.matchId];
        if (!matchPredictionComplete(prediction)) return;

        const home = headToHead.get(match.homeTeamId);
        const away = headToHead.get(match.awayTeamId);
        if (!home || !away) return;

        home.goalsFor += prediction.homeScore;
        away.goalsFor += prediction.awayScore;
        home.goalDifference += prediction.homeScore - prediction.awayScore;
        away.goalDifference += prediction.awayScore - prediction.homeScore;
        if (prediction.homeScore > prediction.awayScore) {
          home.points += 3;
        } else if (prediction.homeScore < prediction.awayScore) {
          away.points += 3;
        } else {
          home.points += 1;
          away.points += 1;
        }
      });

      return tiedRows.slice().sort((a: StandingRow, b: StandingRow) => {
        const home = headToHead.get(a.teamId);
        const away = headToHead.get(b.teamId);
        return (
          (away?.points ?? 0) - (home?.points ?? 0) ||
          (away?.goalDifference ?? 0) - (home?.goalDifference ?? 0) ||
          (away?.goalsFor ?? 0) - (home?.goalsFor ?? 0) ||
          compareRows(a, b)
        );
      });
    });
}

function computeGroupStandings(
  matchesByGroup: Record<string, GroupMatchProjection[]>,
  predictions: Record<string, ScorePredictionProjection>,
  teams: Team[],
): Record<string, StandingRow[]> {
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const teamsByName = new Map(teams.map((team) => [team.name, team]));
  const standings: Record<string, StandingRow[]> = {};

  Object.entries(matchesByGroup).forEach(([group, groupMatches]) => {
    const rowsByTeam = new Map<string, StandingRow>();
    const ensureRow = (team: Team) => {
      const existing = rowsByTeam.get(team.teamId);
      if (existing) return existing;
      const row: StandingRow = {
        ...team,
        group,
        played: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        fairPlay: 0,
      };
      rowsByTeam.set(team.teamId, row);
      return row;
    };

    groupMatches.forEach((match) => {
      const home = ensureRow(
        teamFromMatchSide(match.homeTeamId, match.homeTeamName, group, teamsById, teamsByName),
      );
      const away = ensureRow(
        teamFromMatchSide(match.awayTeamId, match.awayTeamName, group, teamsById, teamsByName),
      );
      const prediction = predictions[match.matchId];
      if (!matchPredictionComplete(prediction)) return;

      home.played += 1;
      away.played += 1;
      home.goalsFor += prediction.homeScore;
      home.goalsAgainst += prediction.awayScore;
      away.goalsFor += prediction.awayScore;
      away.goalsAgainst += prediction.homeScore;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (prediction.homeScore > prediction.awayScore) {
        home.points += 3;
      } else if (prediction.homeScore < prediction.awayScore) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    });

    standings[group] = rankGroup(Array.from(rowsByTeam.values()), groupMatches, predictions);
  });

  return standings;
}

function selectedTeam(prediction: BracketPredictionProjection | undefined, side: 'home' | 'away'): Team | null {
  const teamId = side === 'home' ? prediction?.homeTeamId : prediction?.awayTeamId;
  const name = side === 'home' ? prediction?.homeTeamName : prediction?.awayTeamName;
  return teamId && name ? { teamId, name } : null;
}

function selectedTeams(prediction: BracketPredictionProjection | undefined): Team[] {
  return [selectedTeam(prediction, 'home'), selectedTeam(prediction, 'away')].filter(Boolean) as Team[];
}

function teamAllowed(teamId: string | undefined, candidates: Team[]): boolean {
  if (!teamId) return true;
  return candidates.some((candidate) => candidate.teamId === teamId);
}

function matchByNumber(bracket: Record<string, BracketMatch[]>, matchNumber: number) {
  return Object.values(bracket)
    .flat()
    .find((match) => match.matchNumber === matchNumber);
}

function sourceMatchNumber(sourceLabel: string | undefined): number | null {
  const match = sourceLabel?.match(/^W(\d+)$/);
  return match ? Number(match[1]) : null;
}

function sourceCandidates(
  sourceLabel: string | undefined,
  standings: Record<string, StandingRow[]>,
  qualifiedThirds: StandingRow[],
  bracket: Record<string, BracketMatch[]>,
  effectivePredictions: Record<string, BracketPredictionProjection>,
): Team[] {
  if (!sourceLabel) return [];

  const direct = sourceLabel.match(/^([12])([A-L])$/);
  if (direct) {
    const rank = Number(direct[1]) - 1;
    const group = direct[2];
    const groupRows = standings[group] || [];
    const projectedDefault = groupRows[rank];
    return projectedDefault
      ? [projectedDefault, ...groupRows.filter((row) => row.teamId !== projectedDefault.teamId)]
      : groupRows;
  }

  const third = sourceLabel.match(/^3([A-L]+)$/);
  if (third) {
    const allowedGroups = new Set(third[1].split(''));
    const projectedThirds = qualifiedThirds.filter((row) => row.group && allowedGroups.has(row.group));
    const projectedIds = new Set(projectedThirds.map((row) => row.teamId));
    const allowedGroupTeams = Object.values(standings)
      .flat()
      .filter((row) => row.group && allowedGroups.has(row.group) && !projectedIds.has(row.teamId));
    return [...projectedThirds, ...allowedGroupTeams];
  }

  const winnerMatchNumber = sourceMatchNumber(sourceLabel);
  if (winnerMatchNumber) {
    const sourceMatch = matchByNumber(bracket, winnerMatchNumber);
    return selectedTeams(sourceMatch ? effectivePredictions[sourceMatch.bracketMatchId] : undefined);
  }

  return [];
}

function assignThirdPlaceDefaults(
  bracket: Record<string, BracketMatch[]>,
  qualifiedThirds: StandingRow[],
): Record<string, Team> {
  const byGroup = new Map(qualifiedThirds.map((row, index) => [row.group || '', { row, index }]));
  const slots = (bracket['16th-finals'] || []).flatMap((match) =>
    ([
      ['home', match.homeSourceLabel],
      ['away', match.awaySourceLabel],
    ] as const)
      .filter(([, sourceLabel]) => /^3[A-L]+$/.test(sourceLabel || ''))
      .map(([side, sourceLabel]) => ({
        key: `${match.bracketMatchId}:${side}`,
        sourceLabel: sourceLabel || '',
        allowedGroups: (sourceLabel || '').replace(/^3/, '').split(''),
      })),
  );

  const assigned: Record<string, Team> = {};
  const orderedSlots = slots.slice().sort((a, b) => a.allowedGroups.length - b.allowedGroups.length);
  const slotCandidates = orderedSlots.map((slot) => ({
    ...slot,
    candidates: slot.allowedGroups
      .map((group) => byGroup.get(group))
      .filter((entry): entry is { row: StandingRow; index: number } => Boolean(entry))
      .sort((a, b) => a.index - b.index),
  }));
  let bestAssignments: Record<string, Team> | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  const search = (
    index: number,
    usedGroups: Set<string>,
    assignments: Record<string, Team>,
    score: number,
  ) => {
    if (index >= slotCandidates.length) {
      if (score < bestScore) {
        bestAssignments = { ...assignments };
        bestScore = score;
      }
      return;
    }

    const slot = slotCandidates[index];
    for (const candidate of slot.candidates) {
      const group = candidate.row.group || '';
      if (!group || usedGroups.has(group)) continue;
      usedGroups.add(group);
      assignments[slot.key] = candidate.row;
      search(index + 1, usedGroups, assignments, score + candidate.index);
      delete assignments[slot.key];
      usedGroups.delete(group);
    }
  };

  search(0, new Set<string>(), {}, 0);
  Object.assign(assigned, bestAssignments || {});

  return assigned;
}

export function buildBracketProjection({
  matchesByGroup,
  groupPredictions,
  teams,
  bracket,
  bracketPredictions,
}: {
  matchesByGroup: Record<string, GroupMatchProjection[]>;
  groupPredictions: Record<string, ScorePredictionProjection>;
  teams: Team[];
  bracket: Record<string, BracketMatch[]>;
  bracketPredictions: Record<string, BracketPredictionProjection>;
}) {
  const standings = computeGroupStandings(matchesByGroup, groupPredictions, teams);
  const qualifiedThirds = Object.values(standings)
    .map((rows) => rows[2])
    .filter(Boolean)
    .sort(compareRows)
    .slice(0, 8);
  const thirdDefaults = assignThirdPlaceDefaults(bracket, qualifiedThirds);
  const effectivePredictions: Record<string, BracketPredictionProjection> = {};
  const candidateOptions: BracketCandidateMap = {};
  const resetPredictions: Record<string, BracketPredictionProjection> = {};

  PHASE_ORDER.forEach((phase) => {
    (bracket[phase] || []).forEach((match) => {
      const existing = bracketPredictions[match.bracketMatchId] || {};
      const candidates = {
        home: sourceCandidates(match.homeSourceLabel, standings, qualifiedThirds, bracket, effectivePredictions),
        away: sourceCandidates(match.awaySourceLabel, standings, qualifiedThirds, bracket, effectivePredictions),
      };

      if (phase === '16th-finals') {
        const homeThird = thirdDefaults[`${match.bracketMatchId}:home`];
        const awayThird = thirdDefaults[`${match.bracketMatchId}:away`];
        const homeDefault = homeThird || candidates.home[0];
        const awayDefault = awayThird || candidates.away[0];
        const existingHomeAllowed = teamAllowed(existing.homeTeamId, candidates.home);
        const existingAwayAllowed = teamAllowed(existing.awayTeamId, candidates.away);
        const homeTeamId = existingHomeAllowed && existing.homeTeamId ? existing.homeTeamId : homeDefault?.teamId || '';
        const homeTeamName = existingHomeAllowed && existing.homeTeamName ? existing.homeTeamName : homeDefault?.name || '';
        const awayTeamId = existingAwayAllowed && existing.awayTeamId ? existing.awayTeamId : awayDefault?.teamId || '';
        const awayTeamName = existingAwayAllowed && existing.awayTeamName ? existing.awayTeamName : awayDefault?.name || '';

        effectivePredictions[match.bracketMatchId] = {
          ...existing,
          bracketMatchId: match.bracketMatchId,
          homeTeamId,
          homeTeamName,
          awayTeamId,
          awayTeamName,
        };
        resetPredictions[match.bracketMatchId] = {
          bracketMatchId: match.bracketMatchId,
          homeTeamId: homeDefault?.teamId || '',
          homeTeamName: homeDefault?.name || '',
          awayTeamId: awayDefault?.teamId || '',
          awayTeamName: awayDefault?.name || '',
          predictedWinnerTeamId: '',
          predictedWinnerTeamName: '',
        };
      } else {
        const homeTeamId = teamAllowed(existing.homeTeamId, candidates.home) ? existing.homeTeamId || '' : '';
        const homeTeamName = homeTeamId ? existing.homeTeamName || '' : '';
        const awayTeamId = teamAllowed(existing.awayTeamId, candidates.away) ? existing.awayTeamId || '' : '';
        const awayTeamName = awayTeamId ? existing.awayTeamName || '' : '';
        const predictedWinnerTeamId =
          match.phase === 'finals' &&
          existing.predictedWinnerTeamId &&
          (existing.predictedWinnerTeamId === homeTeamId || existing.predictedWinnerTeamId === awayTeamId)
            ? existing.predictedWinnerTeamId
            : '';
        const predictedWinnerTeamName = predictedWinnerTeamId ? existing.predictedWinnerTeamName || '' : '';

        effectivePredictions[match.bracketMatchId] = {
          ...existing,
          bracketMatchId: match.bracketMatchId,
          homeTeamId,
          homeTeamName,
          awayTeamId,
          awayTeamName,
          predictedWinnerTeamId,
          predictedWinnerTeamName,
        };
        resetPredictions[match.bracketMatchId] = {
          bracketMatchId: match.bracketMatchId,
          homeTeamId: '',
          homeTeamName: '',
          awayTeamId: '',
          awayTeamName: '',
          predictedWinnerTeamId: '',
          predictedWinnerTeamName: '',
        };
      }

      candidateOptions[match.bracketMatchId] = candidates;
    });
  });

  return {
    candidateOptions,
    effectivePredictions,
    resetPredictions,
  };
}
