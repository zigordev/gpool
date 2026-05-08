interface PlayerAwardSelection extends TournamentPlayer {
  poolId: string;
  userId: string;
  award: PlayerAward;
  awardPoints?: number;
}