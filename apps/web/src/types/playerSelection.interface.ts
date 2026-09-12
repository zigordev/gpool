import { TournamentPlayer } from "./tournamentPlayer.interface";

export interface PlayerSelection extends TournamentPlayer {
  poolId: string;
  userId: string;
  slot: number;
}