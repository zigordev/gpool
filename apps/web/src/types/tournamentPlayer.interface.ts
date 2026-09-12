import { PlayerPosition } from './playerPosition.type';

export interface TournamentPlayer {
  playerId: string;
  teamId: string;
  teamName: string;
  teamEliminated?: boolean;
  name: string;
  position: PlayerPosition;
  imageUrl?: string;
  countryCode?: string;
  flagEmoji?: string;
  shirtNumber?: number | null;
  goals?: number;
  penaltyGoals?: number;
  missedPenalties?: number;
  mvps?: number;
  penaltiesSaved?: number;
  forcedPenaltyMisses?: number;
  shootoutPenaltiesSaved?: number;
  shootoutGoals?: number;
  shootoutMissedPenalties?: number;
  shootoutForcedPenaltyMisses?: number;
  cleanSheets?: number;
  assists?: number;
  yellowCards?: number;
  doubleYellowCards?: number;
  redCards?: number;
  totalPoints?: number;
}
