import { PlayerSelection } from "./playerSelection.interface";

export interface SpyPicksData {
  user: { userId: string; userName: string; userEmail?: string };
  predictions: Array<{
    matchId: string;
    homeScore: number;
    awayScore: number;
    isCorrect?: boolean | null;
    isExactMatch?: boolean | null;
    points?: number;
  }>;
  bracketPredictions: SpyBracketPrediction[];
  playerSelections: PlayerSelection[];
  playerAwardSelections: PlayerAwardSelection[];
}