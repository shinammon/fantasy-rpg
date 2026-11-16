
export type AttributeName = "courage" | "insight" | "bond";

export interface CharacterAttributes {
  courage: number; // 勇氣
  insight: number; // 洞察
  bond: number; // 羈絆
}

export interface DiceRoll {
  die1: number;
  die2: number;
}

export type Outcome = "SUCCESS" | "PARTIAL" | "FAILURE";

export interface ActionResult {
  dice: DiceRoll;
  attribute: AttributeName;
  attributeValue: number;
  usedSpark: boolean;
  remainingSpark: number;
  total: number;
  outcome: Outcome;
  progressGain: number;
  crisisGain: number;
}

export type GameStatus =
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILURE"
  | "INCOMPLETE";

export interface GameState {
  round: number;
  progress: number;
  crisis: number;
  status: GameStatus;
}
