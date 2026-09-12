import { TournamentPlayer } from "./tournamentPlayer.interface";
import { PlayerAward } from "./playerAward.type";

export interface PlayerAwardSelection extends TournamentPlayer {
  poolId: string;
  userId: string;
  award: PlayerAward;
  awardPoints?: number;
}
