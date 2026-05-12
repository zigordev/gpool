import { BracketRoundScoring } from "./bracketRoundScoring.type";

export type BracketScoringConfig = BracketRoundScoring & {
  rounds: Record<string, BracketRoundScoring>;
  tournamentWinnerPoints: number;
};