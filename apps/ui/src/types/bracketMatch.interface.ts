interface BracketMatch {
  bracketMatchId: string;
  poolId: string;
  phase: string;
  matchNumber: number;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  homeSourceLabel?: string;
  awaySourceLabel?: string;
  scheduledAt?: string;
  homeResult?: number;
  awayResult?: number;
  status?: string;
}
