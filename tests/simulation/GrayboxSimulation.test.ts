import { describe, expect, it } from "vitest";

import {
  GRAYBOX_END_MINUTE,
  GRAYBOX_EXCHANGE_PATRON_ID,
  GRAYBOX_PATRON_IDS,
  GRAYBOX_SERVICE_PATRON_ID,
} from "../../src/engine/graybox/content";
import { createInitialGrayboxState } from "../../src/engine/graybox/createInitialState";
import { dispatchGrayboxCommand } from "../../src/engine/graybox/reducer";
import { selectCompletionSummary } from "../../src/engine/graybox/selectors";
import type {
  AttentionOfferId,
  DrinkChoice,
  ExchangeOutcome,
  GrayboxGameplayCommand,
  GrayboxState,
} from "../../src/engine/graybox/types";

interface GrayboxPolicy {
  readonly exchange: ExchangeOutcome;
  readonly drink: DrinkChoice;
  readonly attention: AttentionOfferId;
}

interface GrayboxSimulationResult {
  readonly state: GrayboxState;
  readonly commands: readonly GrayboxGameplayCommand[];
  readonly visitedSteps: readonly string[];
}

function runPolicy(policy: GrayboxPolicy): GrayboxSimulationResult {
  const commands: GrayboxGameplayCommand[] = [
    { type: "observe", target: "room" },
    ...GRAYBOX_PATRON_IDS.map((target): GrayboxGameplayCommand => ({ type: "observe", target })),
    {
      type: "speak",
      target: GRAYBOX_EXCHANGE_PATRON_ID,
      response: policy.exchange,
    },
    {
      type: "serve",
      target: GRAYBOX_SERVICE_PATRON_ID,
      drink: policy.drink,
    },
    { type: "tune", target: "television" },
    { type: "select-attention", offer: policy.attention },
    { type: "wait" },
  ];

  let state = createInitialGrayboxState();
  const visitedSteps = [state.step];

  for (const command of commands) {
    const result = dispatchGrayboxCommand(state, command);
    if (!result.ok) {
      throw new Error(
        `Policy deadlocked on ${command.type} during ${state.step}: ${result.reason}.`,
      );
    }
    state = result.state;
    visitedSteps.push(state.step);
  }

  return { state, commands, visitedSteps };
}

describe("Phase 1 graybox simulations", () => {
  it.each([
    {
      label: "answer, tea, and television",
      policy: { exchange: "answer", drink: "tea", attention: "television" } as const,
    },
    {
      label: "silence, vodka, and telephone",
      policy: { exchange: "silence", drink: "vodka", attention: "telephone" } as const,
    },
  ])("completes without deadlock for the $label policy", ({ policy }) => {
    const result = runPolicy(policy);
    const summary = selectCompletionSummary(result.state);

    expect(result.commands).toHaveLength(10);
    expect(result.state.step).toBe("complete");
    expect(result.state.clockMinutes).toBe(GRAYBOX_END_MINUTE);
    expect(result.visitedSteps).toContain("attention");
    expect(result.visitedSteps.at(-1)).toBe("complete");
    expect(summary).toEqual({
      completedAt: GRAYBOX_END_MINUTE,
      elapsedMinutes: 10,
      exchangeOutcome: policy.exchange,
      servedDrink: policy.drink,
      attentionSelection: policy.attention,
      completedVerbs: ["observe", "speak", "serve", "tune", "wait"],
    });
  });

  it("replays an identical policy into deeply equal deterministic state", () => {
    const policy = { exchange: "answer", drink: "tea", attention: "television" } as const;

    expect(runPolicy(policy)).toEqual(runPolicy(policy));
  });

  it("preserves the distinct service and mutually exclusive attention outcomes", () => {
    const television = runPolicy({
      exchange: "answer",
      drink: "tea",
      attention: "television",
    }).state;
    const telephone = runPolicy({
      exchange: "silence",
      drink: "vodka",
      attention: "telephone",
    }).state;

    expect(television.patrons[GRAYBOX_SERVICE_PATRON_ID]).toMatchObject({
      composure: 1,
      intoxication: 0,
    });
    expect(telephone.patrons[GRAYBOX_SERVICE_PATRON_ID]).toMatchObject({
      composure: 0,
      intoxication: 1,
    });
    expect(television.attention).toMatchObject({
      selected: "television",
      televisionOutcome: "direct",
      telephoneOutcome: "missed",
    });
    expect(telephone.attention).toMatchObject({
      selected: "telephone",
      televisionOutcome: "missed",
      telephoneOutcome: "direct",
    });
  });
});
