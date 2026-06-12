export interface GroupMatchProjection {
  matchId: string;
  groupId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName: string;
  awayTeamName: string;
  homeResult: string;
  awayResult: string;
  status: string;
}