export type MatchPredictionState =
  | 'open'
  | 'incomplete'
  | 'locked'
  | 'exact'
  | 'correct-winner'
  | 'incorrect'
  | 'pending';