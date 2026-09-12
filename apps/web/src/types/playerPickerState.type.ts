import { PlayerAward } from "./playerAward.type";
import { PlayerPosition } from "./playerPosition.type";

export type PlayerPickerState =
  | { kind: 'regular'; position: PlayerPosition; slot: number }
  | { kind: 'award'; award: PlayerAward };
