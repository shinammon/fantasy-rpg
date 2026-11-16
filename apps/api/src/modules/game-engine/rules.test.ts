
import { describe, it, expect } from "vitest";

import {
  validateAttributes,
  rollDice,
  validateDice,
  determineOutcome,
  resolveAction,
  applyRoundResults
} from "./rules.js";

const attributes = {
  courage: 2,
  insight: 1,
  bond: 0
};

describe("Character Attributes", () => {
  it("accepts valid attributes", () => {
    expect(validateAttributes(attributes)).toBe(true);
  });

  it("rejects incorrect total points", () => {
    expect(validateAttributes({
      courage: 2,
      insight: 2,
      bond: 0
    })).toBe(false);
  });

  it("rejects values above the maximum", () => {
    expect(validateAttributes({
      courage: 3,
      insight: 0,
      bond: 0
    })).toBe(false);
  });
});

describe("Dice System", () => {
  it("generates two valid six-sided dice", () => {
    for (let i = 0; i < 100; i++) {
      expect(validateDice(rollDice())).toBe(true);
    }
  });

  it("rejects invalid dice", () => {
    expect(validateDice({
      die1: 0,
      die2: 7
    })).toBe(false);
  });
});

describe("Outcome Calculation", () => {
  it("returns SUCCESS when total is 10", () => {
    expect(determineOutcome(10)).toBe("SUCCESS");
  });

  it("returns PARTIAL when total is 7", () => {
    expect(determineOutcome(7)).toBe("PARTIAL");
  });

  it("returns FAILURE when total is 6", () => {
    expect(determineOutcome(6)).toBe("FAILURE");
  });
});

describe("Spark System", () => {
  it("adds 2 and consumes one spark", () => {
    const result = resolveAction({
      attributes,
      attribute: "courage",
      dice: { die1: 3, die2: 3 },
      currentSpark: 2,
      useSpark: true
    });

    expect(result.total).toBe(10);
    expect(result.outcome).toBe("SUCCESS");
    expect(result.remainingSpark).toBe(1);
    expect(result.progressGain).toBe(2);
    expect(result.crisisGain).toBe(0);
  });

  it("does not consume spark when unused", () => {
    const result = resolveAction({
      attributes,
      attribute: "courage",
      dice: { die1: 3, die2: 3 },
      currentSpark: 2,
      useSpark: false
    });

    expect(result.total).toBe(8);
    expect(result.outcome).toBe("PARTIAL");
    expect(result.remainingSpark).toBe(2);
  });

  it("rejects use when spark is zero", () => {
    expect(() => resolveAction({
      attributes,
      attribute: "courage",
      dice: { die1: 3, die2: 3 },
      currentSpark: 0,
      useSpark: true
    })).toThrow("Not enough spark");
  });
});

describe("Round Resolution", () => {
  const success = resolveAction({
    attributes,
    attribute: "courage",
    dice: { die1: 4, die2: 4 },
    currentSpark: 2,
    useSpark: false
  });

  const failure = resolveAction({
    attributes,
    attribute: "bond",
    dice: { die1: 1, die2: 1 },
    currentSpark: 2,
    useSpark: false
  });

  it("advances to the next round", () => {
    const next = applyRoundResults({
      round: 1,
      progress: 0,
      crisis: 0,
      status: "IN_PROGRESS"
    }, [success]);

    expect(next.round).toBe(2);
    expect(next.progress).toBe(2);
    expect(next.status).toBe("IN_PROGRESS");
  });

  it("ends with success at progress 10", () => {
    const next = applyRoundResults({
      round: 3,
      progress: 8,
      crisis: 1,
      status: "IN_PROGRESS"
    }, [success]);

    expect(next.status).toBe("SUCCESS");
  });

  it("prioritizes crisis over success", () => {
    const next = applyRoundResults({
      round: 3,
      progress: 8,
      crisis: 4,
      status: "IN_PROGRESS"
    }, [success, failure]);

    expect(next.status).toBe("FAILURE");
  });

  it("ends as incomplete at round eight", () => {
    const next = applyRoundResults({
      round: 8,
      progress: 2,
      crisis: 0,
      status: "IN_PROGRESS"
    }, [success]);

    expect(next.status).toBe("INCOMPLETE");
  });

  it("does not resolve an already finished game", () => {
    expect(() => applyRoundResults({
      round: 4,
      progress: 10,
      crisis: 0,
      status: "SUCCESS"
    }, [success])).toThrow("Game already finished");
  });
});
