import { PlayerPosition } from "./playerPosition.type";

export interface SpyPicksLabels {
  title: (name: string) => string;
  description: string;
  close: string;
  loading: string;
  tabs: { groups: string; final: string; players: string };
  empty: { predictions: string; bracket: string; players: string };
  noPick: string;
  groupLabel: (group: string) => string;
  positionLabel: (p: PlayerPosition) => string;
  awardLabel: (award: PlayerAward) => string;
  bracketRoundLabel: (phase: string) => string;
  vs: string;
  slotLabel: (slot: number) => string;
  pointsLabel: (n: number) => string;
  ftLabel: string;
}