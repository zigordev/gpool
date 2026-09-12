export interface BracketPredictionProjection {
  bracketPredictionId?: string;
  poolId?: string;
  bracketMatchId?: string;
  userId?: string;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  predictedWinnerTeamId?: string;
  predictedWinnerTeamName?: string;
  points?: number;
  [key: string]: any;
}