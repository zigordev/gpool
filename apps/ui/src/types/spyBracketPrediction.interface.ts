interface SpyBracketPrediction {
  bracketMatchId: string;
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