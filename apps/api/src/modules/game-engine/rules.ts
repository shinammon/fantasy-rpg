
import { randomInt } from "node:crypto";

import type {
  CharacterAttributes,
  AttributeName,
  DiceRoll,
  Outcome,
  ActionResult,
  GameState,
  GameStatus
} from "./types.js";

// MVP 遊戲規則
export const GAME_RULES = {
  ATTRIBUTE_TOTAL: 3,
  ATTRIBUTE_MAX: 2,
  INITIAL_SPARK: 2,
  SPARK_BONUS: 2,
  TARGET_PROGRESS: 10,
  MAX_CRISIS: 6,
  MAX_ROUNDS: 8
} as const;

// 1. 驗證角色屬性
export function validateAttributes(
  attributes: CharacterAttributes
): boolean {
  const values = [
    attributes.courage,
    attributes.insight,
    attributes.bond
  ];

  return (
    values.every(
      value =>
        Number.isInteger(value) &&
        value >= 0 &&
        value <= GAME_RULES.ATTRIBUTE_MAX
    ) &&
    values.reduce((sum, value) => sum + value, 0) ===
      GAME_RULES.ATTRIBUTE_TOTAL
  );
}

// 2. 擲出兩顆六面骰
export function rollDice(): DiceRoll {
  return {
    die1: randomInt(1, 7),
    die2: randomInt(1, 7)
  };
}

// 3. 驗證骰點
export function validateDice(dice: DiceRoll): boolean {
  return [dice.die1, dice.die2].every(
    value =>
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 6
  );
}

// 4. 判斷成功等級
export function determineOutcome(total: number): Outcome {
  if (!Number.isInteger(total)) {
    throw new Error("Invalid dice total");
  }

  if (total >= 10) return "SUCCESS";
  if (total >= 7) return "PARTIAL";
  return "FAILURE";
}

// 5. 根據結果取得進度與危機變化
export function getOutcomeEffects(outcome: Outcome) {
  switch (outcome) {
    case "SUCCESS":
      return { progressGain: 2, crisisGain: 0 };
    case "PARTIAL":
      return { progressGain: 1, crisisGain: 1 };
    case "FAILURE":
      return { progressGain: 0, crisisGain: 2 };
    default:
      throw new Error("Invalid outcome");
  }
}

// 6. 進行行動判定
// 骰點由外部傳入，避免使用星火時重新擲骰
export function resolveAction(params: {
  attributes: CharacterAttributes;
  attribute: AttributeName;
  dice: DiceRoll;
  currentSpark: number;
  useSpark: boolean;
}): ActionResult {
  const {
    attributes,
    attribute,
    dice,
    currentSpark,
    useSpark
  } = params;

  if (!validateAttributes(attributes)) {
    throw new Error("Invalid character attributes");
  }

  if (!validateDice(dice)) {
    throw new Error("Invalid dice roll");
  }

  if (!["courage", "insight", "bond"].includes(attribute)) {
    throw new Error("Invalid attribute");
  }

  if (
    !Number.isInteger(currentSpark) ||
    currentSpark < 0 ||
    currentSpark > GAME_RULES.INITIAL_SPARK
  ) {
    throw new Error("Invalid spark amount");
  }

  if (typeof useSpark !== "boolean") {
    throw new Error("Invalid spark decision");
  }

  if (useSpark && currentSpark === 0) {
    throw new Error("Not enough spark");
  }

  const attributeValue = attributes[attribute];

  const total =
    dice.die1 +
    dice.die2 +
    attributeValue +
    (useSpark ? GAME_RULES.SPARK_BONUS : 0);

  const outcome = determineOutcome(total);
  const effects = getOutcomeEffects(outcome);

  return {
    dice: { ...dice },
    attribute,
    attributeValue,
    usedSpark: useSpark,
    remainingSpark: currentSpark - (useSpark ? 1 : 0),
    total,
    outcome,
    ...effects
  };
}

// 7. 計算一整個回合的進度與危機
// 所有玩家結果一次彙總，避免玩家順序影響結局
export function applyRoundResults(
  state: GameState,
  results: readonly ActionResult[]
): GameState {
  if (state.status !== "IN_PROGRESS") {
    throw new Error("Game already finished");
  }

  if (
    !Number.isInteger(state.round) ||
    state.round < 1 ||
    state.round > GAME_RULES.MAX_ROUNDS ||
    !Number.isInteger(state.progress) ||
    state.progress < 0 ||
    !Number.isInteger(state.crisis) ||
    state.crisis < 0
  ) {
    throw new Error("Invalid game state");
  }

  if (results.length < 1 || results.length > 4) {
    throw new Error("Invalid number of action results");
  }

  const progressGain = results.reduce(
    (sum, result) => sum + result.progressGain,
    0
  );

  const crisisGain = results.reduce(
    (sum, result) => sum + result.crisisGain,
    0
  );

  const progress = state.progress + progressGain;
  const crisis = state.crisis + crisisGain;

  let status: GameStatus = "IN_PROGRESS";

  // 危機優先於成功
  if (crisis >= GAME_RULES.MAX_CRISIS) {
    status = "FAILURE";
  } else if (progress >= GAME_RULES.TARGET_PROGRESS) {
    status = "SUCCESS";
  } else if (state.round >= GAME_RULES.MAX_ROUNDS) {
    status = "INCOMPLETE";
  }

  return {
    round: status === "IN_PROGRESS"
      ? state.round + 1
      : state.round,
    progress,
    crisis,
    status
  };
}
