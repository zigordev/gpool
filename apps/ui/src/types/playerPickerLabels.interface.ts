import { PlayerPosition } from "./playerPosition.type";

export interface PlayerPickerLabels {
  edit: string;
  positionLabel: (position: PlayerPosition) => string;
  awardLabel: (award: PlayerAward) => string;
  awardDescription: (award: PlayerAward) => string;
  slotLabel: (slot: number) => string;
  searchPlaceholder: string;
  clear: string;
  cancel: string;
  noResults: string;
}