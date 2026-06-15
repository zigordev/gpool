import { PlayerPosition } from './playerPosition.type';

export interface TournamentPlayer {
  playerId: string;
  teamId: string;
  teamName: string;
  name: string;
  position: PlayerPosition;
  imageUrl?: string;
  countryCode?: string;
  flagEmoji?: string;
  goals?: number;
  penaltyGoals?: number;
  missedPenalties?: number;
  mvps?: number;
  penaltiesSaved?: number;
  shootoutPenaltiesSaved?: number;
  shootoutGoals?: number;
  shootoutMissedPenalties?: number;
  cleanSheets?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  totalPoints?: number;
}
