interface Match {
  matchId: string;
  matchNumber?: number;
  groupId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledAt: string;
  phase: string;
  status: string;
  homeResult?: number | null;
  awayResult?: number | null;
}