import { describe, expect, it } from "vitest";

import { evaluateCondition } from "../../src/narrative/ConditionEvaluator";
import {
  dispatchNarrativeCommand,
  initializeNarrativeState,
} from "../../src/narrative/NarrativeEngine";
import { selectDialogueView, selectSummaryView } from "../../src/narrative/selectors";
import type {
  ContentRepository,
  DialogueNodeDefinition,
  EventDefinition,
  NarrativeEffect,
} from "../../src/narrative/types";
import {
  availableNarrativeCommands,
  commitNarrativeCommand,
  createPhaseTwoRepository,
  findNarrativeState,
} from "./PhaseTwoTestSupport";

describe("Phase 2 conditions and provenance", () => {
  it("keeps the ending summary hidden until its final choice completes", () => {
    const repository = createPhaseTwoRepository();
    const beforeCompletion = findNarrativeState(
      repository,
      (candidate) => candidate.mode === "dialogue" && candidate.summaryId !== null,
    ).state;
    const completed = findNarrativeState(
      repository,
      (candidate) => candidate.mode === "complete" && candidate.summaryId !== null,
    ).state;

    expect(selectDialogueView(repository, beforeCompletion)).not.toBeNull();
    expect(selectSummaryView(repository, beforeCompletion)).toBeNull();
    expect(selectSummaryView(repository, completed)).not.toBeNull();
  });

  it.each([
    {
      nodeId: "sample_arkady_direct_wording",
      provenance: "direct" as const,
      expected:
        "You said an emergency could require it. Now you say you opposed it from the start.",
    },
    {
      nodeId: "sample_arkady_fragment_wording",
      provenance: "fragment" as const,
      expected: "I heard you say something about opposing it from the start. What changed?",
    },
    {
      nodeId: "sample_arkady_secondhand_wording",
      provenance: "secondhand" as const,
      expected: "Lev says your account changed. Did it?",
    },
  ])(
    "uses $provenance wording only from $provenance knowledge",
    ({ nodeId, provenance, expected }) => {
      const repository = createPhaseTwoRepository();
      const { state } = findNarrativeState(
        repository,
        (candidate) => candidate.currentNodeId === nodeId,
      );
      const records = state.knowledge.knowledge_arkady_rewrite ?? [];
      const view = selectDialogueView(repository, state);

      expect(records.some((record) => record.provenance === provenance)).toBe(true);
      expect(view?.text).toBe(expected);
      expect(
        evaluateCondition(repository, state, {
          type: "knowledge",
          knowledgeId: "knowledge_arkady_rewrite",
          levels: [provenance],
        }),
      ).toBe(true);
      expect(
        evaluateCondition(repository, state, {
          type: "knowledge",
          knowledgeId: "knowledge_arkady_rewrite",
          levels: ["direct", "fragment", "secondhand"],
        }),
      ).toBe(true);
    },
  );

  it("evaluates nested flags, object state, claim knowledge, and patron thresholds", () => {
    const repository = createPhaseTwoRepository();
    const { state } = findNarrativeState(
      repository,
      (candidate) => candidate.currentNodeId === "sample_private_claim_decision",
    );

    expect(
      evaluateCondition(repository, state, {
        type: "all",
        conditions: [
          {
            type: "object-state",
            objectId: "prop_galina_stock_notebook",
            state: "open",
          },
          {
            type: "patron-metric",
            patronId: "gennady",
            metric: "agitation",
            operator: "gte",
            value: -100,
          },
          {
            type: "any",
            conditions: [
              { type: "claim-known", claimId: "claim_gennady_workers_outlast_bosses" },
              { type: "flag", flagId: "never_set_test_flag", value: true },
            ],
          },
          {
            type: "not",
            condition: { type: "flag", flagId: "never_set_test_flag", value: true },
          },
        ],
      }),
    ).toBe(true);
  });
});

describe("Phase 2 command transactions and effects", () => {
  it("rejects invalid and unavailable commands with the exact unchanged state", () => {
    const repository = createPhaseTwoRepository();
    const initial = initializeNarrativeState(repository, "phase-2-rejection");
    const unknown = dispatchNarrativeCommand(repository, initial, {
      type: "choose",
      choiceId: "choice_missing_test",
    });
    expect(unknown).toEqual({ ok: false, state: initial, reason: "unknown-choice" });
    expect(unknown.state).toBe(initial);

    const located = findNarrativeState(
      repository,
      (candidate) =>
        candidate.currentNodeId === "sample_private_claim_decision" &&
        (candidate.claims.claim_gennady_concealed_shop_accident?.length ?? 0) === 0,
    );
    const unavailable = dispatchNarrativeCommand(repository, located.state, {
      type: "choose",
      choiceId: "choice_sample_repeat_private_claim",
    });
    expect(unavailable).toEqual({
      ok: false,
      state: located.state,
      reason: "choice-unavailable",
    });
    expect(unavailable.state).toBe(located.state);
  });

  it("does not expose partial state when a later effect throws", () => {
    const repository = createPhaseTwoRepository();
    const initial = initializeNarrativeState(repository, "phase-2-atomicity");
    const nodeId = initial.currentNodeId;
    const node = nodeId === null ? undefined : repository.nodes[nodeId];
    const choice = node?.choices[0];
    if (nodeId === null || node === undefined || choice === undefined) {
      throw new Error("The Phase 2 entry choice is missing.");
    }
    const invalidEffects: readonly NarrativeEffect[] = [
      { type: "set-flag", flagId: "partial_effect_must_not_escape", value: true },
      {
        type: "set-object-state",
        objectId: "prop_galina_stock_notebook",
        state: "invalid_test_state",
      },
    ];
    const invalidNode: DialogueNodeDefinition = {
      ...node,
      choices: [{ ...choice, effects: invalidEffects }, ...node.choices.slice(1)],
    };
    const invalidRepository: ContentRepository = {
      ...repository,
      nodes: { ...repository.nodes, [nodeId]: invalidNode },
    };
    const snapshot = structuredClone(initial);

    expect(() =>
      dispatchNarrativeCommand(invalidRepository, initial, {
        type: "choose",
        choiceId: choice.id,
      }),
    ).toThrow(/Invalid object effect/);
    expect(initial).toEqual(snapshot);
    expect(initial.flags.partial_effect_must_not_escape).toBeUndefined();
    expect(initial.actionHistory).toHaveLength(0);
  });

  it("records one deterministic transaction with node-entry and scheduled effects", () => {
    const repository = createPhaseTwoRepository();
    const initial = initializeNarrativeState(repository, "phase-2-transaction");
    const command = availableNarrativeCommands(repository, initial)[0];
    if (command === undefined) {
      throw new Error("The Phase 2 entry command is missing.");
    }
    const first = dispatchNarrativeCommand(repository, initial, command);
    const replay = dispatchNarrativeCommand(repository, initial, command);

    expect(first).toEqual(replay);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.transaction).toMatchObject({
        sequence: 1,
        clockBefore: 1165,
        clockAfter: 1166,
        nodeBefore: "sample_galina_shift_terms",
      });
      expect(first.state.revision).toBe(1);
      expect(first.state.actionHistory).toEqual([first.transaction]);
      expect(first.state.objects.prop_galina_stock_notebook).toBe("open");
    }
  });
});

describe("Phase 2 attention, contradictions, and social cost", () => {
  it("resolves every attention selection into direct, fragment, and missed outcomes", () => {
    const repository = createPhaseTwoRepository();
    const { state } = findNarrativeState(repository, (candidate) => candidate.mode === "attention");
    const window = repository.attentionWindows[state.attention?.windowId ?? ""];
    expect(window).toBeDefined();

    for (const offer of window?.offers ?? []) {
      const result = dispatchNarrativeCommand(repository, state, {
        type: "select-attention",
        offerId: offer.id,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        continue;
      }
      expect(result.state.attention?.outcomes).toEqual(
        Object.fromEntries(offer.outcomes.map((outcome) => [outcome.offerId, outcome.outcome])),
      );
      expect(new Set(Object.values(result.state.attention?.outcomes ?? {}))).toEqual(
        new Set(["direct", "fragment", "missed"]),
      );
      for (const outcome of offer.outcomes) {
        const records = result.state.knowledge[outcome.knowledgeId] ?? [];
        if (outcome.outcome === "missed") {
          expect(records).toHaveLength(0);
        } else {
          expect(records).toContainEqual(expect.objectContaining({ provenance: outcome.outcome }));
        }
      }
      expect(result.state.timeline[window?.eventId ?? ""]?.status).toBe("complete");
    }
  });

  it("exposes the declared contradiction only after both claims are known", () => {
    const repository = createPhaseTwoRepository();
    const before = findNarrativeState(
      repository,
      (candidate) => candidate.mode === "attention",
    ).state;
    expect(before.contradictionsExposed).toEqual([]);

    const after = findNarrativeState(
      repository,
      (candidate) => candidate.currentNodeId === "sample_arkady_direct_wording",
    ).state;
    expect(after.claims.claim_arkady_emergency_may_be_necessary?.length).toBeGreaterThan(0);
    expect(after.claims.claim_arkady_opposed_from_start?.length).toBeGreaterThan(0);
    expect(after.contradictionsExposed).toEqual([
      "claim_arkady_emergency_may_be_necessary|claim_arkady_opposed_from_start",
    ]);
  });

  it("applies the authored cost when Sasha repeats the private claim", () => {
    const repository = createPhaseTwoRepository();
    const before = findNarrativeState(
      repository,
      (candidate) =>
        candidate.currentNodeId === "sample_private_claim_decision" &&
        (candidate.claims.claim_gennady_concealed_shop_accident?.length ?? 0) > 0,
    ).state;
    const beforeGennady = before.patrons.gennady;
    if (beforeGennady === undefined) {
      throw new Error("Gennady state is missing.");
    }
    const after = commitNarrativeCommand(repository, before, {
      type: "choose",
      choiceId: "choice_sample_repeat_private_claim",
    });

    expect(after.flags.gennady_private_claim_repeated).toBe(true);
    expect(after.patrons.gennady?.trust).toBe(beforeGennady.trust - 4);
    expect(after.patrons.gennady?.agitation).toBe(beforeGennady.agitation + 4);
    expect(after.relationships["gennady->sasha"]).toBe(-3);
    expect(after.objects.prop_gennady_factory_photo).toBe("face_down");
    expect(after.epilogueFacts).toContain("fact_private_claim_repeated");
  });
});

describe("Phase 2 scheduler", () => {
  it("opens the due event deterministically and pauses until attention resolves", () => {
    const repository = createPhaseTwoRepository();
    const located = findNarrativeState(repository, (candidate) => candidate.mode === "attention");
    const replay = located.commands.reduce(
      (state, command) => commitNarrativeCommand(repository, state, command),
      initializeNarrativeState(repository, "phase-2-test-search"),
    );

    expect(replay).toEqual(located.state);
    expect(located.state.clockMinutes).toBe(repository.events.event_sample_attention?.dueMinute);
    expect(located.state.timeline.event_sample_attention?.status).toBe("announced");
    const blocked = dispatchNarrativeCommand(repository, located.state, {
      type: "choose",
      choiceId: "choice_sample_attention_fallback",
    });
    expect(blocked).toEqual({ ok: false, state: located.state, reason: "wrong-mode" });
  });

  it("uses due minute, explicit priority, and ID as a stable ordering rule", () => {
    const base = createPhaseTwoRepository();
    const eventLate: EventDefinition = {
      id: "event_test_same_minute_late",
      kind: "room",
      dueMinute: 1166,
      priority: 20,
      effects: [{ type: "set-flag", flagId: "event_test_late_fired", value: true }],
      historicalLedgerIds: [],
      wordingPolicy: "none",
    };
    const eventEarly: EventDefinition = {
      ...eventLate,
      id: "event_test_same_minute_early",
      priority: 10,
      effects: [{ type: "set-flag", flagId: "event_test_early_fired", value: true }],
    };
    const repository: ContentRepository = {
      ...base,
      bundle: {
        ...base.bundle,
        events: [eventLate, eventEarly, ...base.bundle.events],
      },
      events: {
        ...base.events,
        [eventLate.id]: eventLate,
        [eventEarly.id]: eventEarly,
      },
    };
    const initial = initializeNarrativeState(repository, "phase-2-scheduler-order");
    const command = availableNarrativeCommands(repository, initial)[0];
    if (command === undefined) {
      throw new Error("The Phase 2 entry command is missing.");
    }
    const result = dispatchNarrativeCommand(repository, initial, command);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const flagOrder = result.transaction.effects.flatMap((effect) =>
      effect.type === "set-flag" && effect.flagId.startsWith("event_test_") ? [effect.flagId] : [],
    );
    expect(flagOrder).toEqual(["event_test_early_fired", "event_test_late_fired"]);
    expect(result.state.timeline[eventEarly.id]?.status).toBe("complete");
    expect(result.state.timeline[eventLate.id]?.status).toBe("complete");
  });
});
