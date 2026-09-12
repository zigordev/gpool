interface Prediction {
  matchId: string;
  homeScore: number | '';
  awayScore: number | '';
  isCorrect?: boolean | null;
  isExactMatch?: boolean | null;
  points?: number;
}