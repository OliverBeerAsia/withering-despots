import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validatePhaseTwoContentFile } from "../../scripts/content-validation";
import {
  ContentValidationError,
  loadContentRepository,
} from "../../src/narrative/ContentRepository";
import type { DialogueNodeDefinition, NarrativeContentBundle } from "../../src/narrative/types";
import rawPhaseTwoContent from "../../content/phase-2-sample.json";

function cloneContent(): NarrativeContentBundle {
  return structuredClone(rawPhaseTwoContent) as unknown as NarrativeContentBundle;
}

function replaceNode(
  bundle: NarrativeContentBundle,
  nodeId: string,
  replacement: DialogueNodeDefinition,
): NarrativeContentBundle {
  return {
    ...bundle,
    dialogueGraphs: bundle.dialogueGraphs.map((graph) => ({
      ...graph,
      nodes: graph.nodes.map((node) => (node.id === nodeId ? replacement : node)),
    })),
  };
}

function expectDiagnostic(input: unknown, code: string): void {
  try {
    loadContentRepository(input, { historicalLedgerIds: new Set(["EVENT-001", "EVENT-002"]) });
  } catch (error: unknown) {
    expect(error).toBeInstanceOf(ContentValidationError);
    if (error instanceof ContentValidationError) {
      expect(error.diagnostics.map((diagnostic) => diagnostic.code)).toContain(code);
      return;
    }
  }
  throw new Error(`Expected content diagnostic ${code}.`);
}

describe("Phase 2 content gate", () => {
  it("validates the production sample against its schema, semantic rules, and ledger", async () => {
    await expect(
      validatePhaseTwoContentFile(resolve("content/phase-2-sample.json")),
    ).resolves.toMatchObject({
      schemaVersion: 1,
      id: "phase-2-sample",
      metadata: { status: "sample_not_final_dialogue" },
    });
  });

  it("meets the Phase 2 sample quotas and consequence contract", () => {
    const repository = loadContentRepository(cloneContent());
    const nodes = Object.values(repository.nodes);
    const choices = Object.values(repository.choices);
    const silences = choices.filter((choice) => choice.kind === "silence");

    expect(nodes.length).toBeGreaterThanOrEqual(20);
    expect(silences.length).toBeGreaterThanOrEqual(3);
    for (const silence of silences) {
      const destinationIds = silence.effects.flatMap((effect) =>
        effect.type === "goto" ? [effect.nodeId] : [],
      );
      const consequenceEffects = [
        ...silence.effects,
        ...destinationIds.flatMap((nodeId) => repository.nodes[nodeId]?.onEnter ?? []),
      ];
      expect(
        consequenceEffects.some(
          (effect) => effect.type !== "goto" && effect.type !== "advance-time",
        ),
        `${silence.id} has no authored consequence beyond navigation and time.`,
      ).toBe(true);
    }

    const publicContradiction = repository.bundle.claims.find(
      (claim) =>
        claim.context === "public" &&
        claim.contradicts.some(
          (targetId) => repository.claims[targetId]?.speakerId === claim.speakerId,
        ),
    );
    expect(publicContradiction).toBeDefined();
    expect(
      repository.bundle.claims.some(
        (claim) => claim.context === "private" && claim.repeatable && claim.socialRisk !== "none",
      ),
    ).toBe(true);

    const attention = repository.bundle.attentionWindows[0];
    expect(attention?.offers).toHaveLength(3);
    for (const offer of attention?.offers ?? []) {
      expect(new Set(offer.outcomes.map((outcome) => outcome.outcome))).toEqual(
        new Set(["direct", "fragment", "missed"]),
      );
    }

    expect(
      nodes.some((node) => node.onEnter.some((effect) => effect.type === "set-object-state")),
    ).toBe(true);
    expect(repository.bundle.epilogueSummaries).toHaveLength(2);
  });

  it("defines the three atmospheric intervals and exact persistent media states", () => {
    const repository = loadContentRepository(cloneContent());
    const expectedIntervalNodes = [
      "sample_opening_maintenance",
      "sample_opening_tv_reflection",
      "sample_opening_tea_set",
      "sample_opening_signal_tuned",
      "sample_opening_music_finishes",
      "sample_signal_service_interval",
      "sample_signal_tuned",
      "sample_signal_tea_served",
      "sample_signal_lev_listening",
      "sample_signal_phrase_ends",
      "sample_post_report_quiet",
      "sample_post_report_resolves",
    ] as const;
    const practicalChoiceIds = [
      "choice_sample_observe_tv_reflection",
      "choice_sample_serve_opening_tea",
      "choice_sample_tune_opening_picture",
      "choice_sample_wait_opening_phrase",
      "choice_sample_tune_signal_now",
      "choice_sample_serve_nikolai_tea",
      "choice_sample_observe_lev_listening",
      "choice_sample_ask_lev_signal",
      "choice_sample_wait_signal_phrase",
      "choice_sample_observe_after_report",
      "choice_sample_serve_after_report",
      "choice_sample_tune_after_report",
      "choice_sample_wait_after_report",
    ] as const;

    expect(repository.objects.television).toMatchObject({
      initialState: "music_low",
      states: ["music_low", "signal_unstable", "signal_clear", "bulletin", "after_report"],
    });
    expect(repository.objects.television_volume).toMatchObject({
      initialState: "low",
      states: ["muted", "low", "normal"],
    });
    expect(repository.objects.radio_music).toMatchObject({
      initialState: "instrumental_low",
      states: ["instrumental_low", "lowered", "silent"],
    });
    expect(repository.bundle.metadata.endMinute).toBe(1185);

    for (const nodeId of expectedIntervalNodes) {
      const node = repository.nodes[nodeId];
      expect(node, nodeId).toBeDefined();
      expect(node?.presentation?.holdMs ?? -1).toBeGreaterThanOrEqual(10000);
      expect(node?.presentation?.holdMs ?? 60001).toBeLessThanOrEqual(60000);
    }

    const practicalChoices = practicalChoiceIds.map((choiceId) => repository.choices[choiceId]);
    expect(practicalChoices.every((choice) => choice !== undefined)).toBe(true);
    expect(new Set(practicalChoices.map((choice) => choice?.kind))).toEqual(
      new Set(["observe", "serve", "tune", "wait", "speak"]),
    );
    expect(
      repository.attentionWindows.attention_sample_three_way?.offers.map((offer) => offer.id),
    ).toEqual([
      "offer_sample_television",
      "offer_sample_arkady_rewrite",
      "offer_sample_galina_aside",
    ]);
    expect(repository.summaries.summary_sample_public_rupture).toBeDefined();
    expect(repository.summaries.summary_sample_private_record).toBeDefined();
  });

  it("fails loudly for an unknown destination", () => {
    const bundle = cloneContent();
    const node = bundle.dialogueGraphs[0]?.nodes[0];
    const choice = node?.choices[0];
    if (node === undefined || choice === undefined) {
      throw new Error("Phase 2 fixture is missing its entry choice.");
    }
    const replacement: DialogueNodeDefinition = {
      ...node,
      choices: [
        { ...choice, effects: [{ type: "goto", nodeId: "sample_missing_destination" }] },
        ...node.choices.slice(1),
      ],
    };

    expectDiagnostic(replaceNode(bundle, node.id, replacement), "reference.missing");
  });

  it("fails loudly for a state-unreachable node", () => {
    const bundle = cloneContent();
    const graph = bundle.dialogueGraphs[0];
    const template = graph?.nodes[0];
    const templateChoice = template?.choices[0];
    if (graph === undefined || template === undefined || templateChoice === undefined) {
      throw new Error("Phase 2 fixture is missing its graph template.");
    }
    const unreachable: DialogueNodeDefinition = {
      ...template,
      id: "sample_test_unreachable",
      onEnter: [],
      choices: [
        {
          ...templateChoice,
          id: "choice_sample_test_unreachable",
          effects: [{ type: "complete" }],
        },
      ],
    };
    const mutated: NarrativeContentBundle = {
      ...bundle,
      dialogueGraphs: [{ ...graph, nodes: [...graph.nodes, unreachable] }],
    };

    expectDiagnostic(mutated, "reachability.unreachable");
  });

  it("fails loudly for impossible conditions and missing localization", () => {
    const bundle = cloneContent();
    const node = bundle.dialogueGraphs[0]?.nodes[0];
    if (node === undefined) {
      throw new Error("Phase 2 fixture is missing its entry node.");
    }
    const impossible: DialogueNodeDefinition = {
      ...node,
      requires: [
        {
          type: "all",
          conditions: [
            { type: "flag", flagId: "test_impossible", value: true },
            { type: "flag", flagId: "test_impossible", value: false },
          ],
        },
      ],
    };
    expectDiagnostic(replaceNode(bundle, node.id, impossible), "condition.impossible");

    const missingLocale: DialogueNodeDefinition = {
      ...node,
      textKey: "dialogue.sample.missing_test_key",
    };
    expectDiagnostic(replaceNode(cloneContent(), node.id, missingLocale), "locale.missing");
  });

  it("rejects private repetition without cost and missing historical ledger links", () => {
    const bundle = cloneContent();
    const privateClaim = bundle.claims.find((claim) => claim.context === "private");
    const event = bundle.events[0];
    if (privateClaim === undefined || event === undefined) {
      throw new Error("Phase 2 fixture is missing its private claim or event.");
    }
    expectDiagnostic(
      {
        ...bundle,
        claims: bundle.claims.map((claim) =>
          claim.id === privateClaim.id ? { ...claim, socialRisk: "none" as const } : claim,
        ),
      },
      "claim.private-without-cost",
    );
    expectDiagnostic(
      {
        ...bundle,
        events: bundle.events.map((candidate) =>
          candidate.id === event.id
            ? { ...candidate, historicalLedgerIds: ["EVENT-MISSING-TEST"] }
            : candidate,
        ),
      },
      "ledger.missing",
    );
  });

  it("rejects self-contradictions and incomplete attention outcomes", () => {
    const bundle = cloneContent();
    const claim = bundle.claims[0];
    const window = bundle.attentionWindows[0];
    const offer = window?.offers[0];
    if (claim === undefined || window === undefined || offer === undefined) {
      throw new Error("Phase 2 fixture is missing its claim or attention offer.");
    }
    expectDiagnostic(
      {
        ...bundle,
        claims: bundle.claims.map((candidate) =>
          candidate.id === claim.id ? { ...candidate, contradicts: [claim.id] } : candidate,
        ),
      },
      "claim.self-contradiction",
    );

    const ownOutcome = offer.outcomes.find((outcome) => outcome.offerId === offer.id);
    if (ownOutcome === undefined) {
      throw new Error("Phase 2 fixture is missing its selected attention outcome.");
    }
    expectDiagnostic(
      {
        ...bundle,
        attentionWindows: bundle.attentionWindows.map((candidateWindow) =>
          candidateWindow.id === window.id
            ? {
                ...candidateWindow,
                offers: candidateWindow.offers.map((candidateOffer) =>
                  candidateOffer.id === offer.id
                    ? {
                        ...candidateOffer,
                        outcomes: candidateOffer.outcomes.map((outcome) =>
                          outcome.offerId === ownOutcome.offerId
                            ? { ...outcome, outcome: "fragment" as const }
                            : outcome,
                        ),
                      }
                    : candidateOffer,
                ),
              }
            : candidateWindow,
        ),
      },
      "attention.selected-not-direct",
    );
  });

  it("rejects schema drift before semantic validation", () => {
    expectDiagnostic({ ...cloneContent(), schemaVersion: 2 }, "schema.const");
  });

  it("keeps the reviewed long-pause map exact", () => {
    const repository = loadContentRepository(cloneContent());
    const actual: Record<string, number> = {};
    for (const node of Object.values(repository.nodes)) {
      if (node.presentation !== undefined) {
        actual[node.id] = node.presentation.holdMs;
      }
    }

    expect(actual).toEqual({
      sample_arkady_avoids_name: 18000,
      sample_arkady_contradiction_response: 15000,
      sample_arkady_emergency_claim: 12000,
      sample_attention_arkady_direct: 12000,
      sample_attention_galina_direct: 15000,
      sample_attention_tv_direct: 15000,
      sample_galina_believed_arkady: 18000,
      sample_galina_tired_answer: 12000,
      sample_gennady_accident_approach: 18000,
      sample_gennady_claim_preserved: 18000,
      sample_gennady_claim_repeated: 12000,
      sample_gennady_in_photo: 18000,
      sample_gennady_what_he_wants: 18000,
      sample_gennady_workers_claim: 10000,
      sample_glass_overturned: 12000,
      sample_lev_earlier_signal: 15000,
      sample_nikolai_responsibility: 12000,
      sample_nikolai_tea_answer: 15000,
      sample_nikolai_what_remains: 18000,
      sample_opening_maintenance: 10000,
      sample_opening_music_finishes: 30000,
      sample_opening_signal_tuned: 15000,
      sample_opening_tea_set: 12000,
      sample_opening_tv_reflection: 14000,
      sample_post_report_quiet: 10000,
      sample_post_report_resolves: 60000,
      sample_private_claim_decision: 10000,
      sample_signal_lev_listening: 15000,
      sample_signal_phrase_ends: 30000,
      sample_signal_service_interval: 10000,
      sample_signal_tea_served: 12000,
      sample_signal_tuned: 15000,
      sample_silence_arkady_qualifies: 18000,
      sample_silence_gennady_continues: 45000,
    });
  });

  it("accepts bounded node holds and rejects pacing metadata outside 10 to 60 seconds", () => {
    const bundle = cloneContent();
    const node = bundle.dialogueGraphs[0]?.nodes[0];
    if (node === undefined) {
      throw new Error("Phase 2 fixture is missing its entry node.");
    }

    expect(() =>
      loadContentRepository(
        replaceNode(bundle, node.id, {
          ...node,
          presentation: { holdMs: 60000 },
        }),
      ),
    ).not.toThrow();

    expectDiagnostic(
      replaceNode(cloneContent(), node.id, {
        ...node,
        presentation: { holdMs: 9999 },
      }),
      "schema.minimum",
    );
    expectDiagnostic(
      replaceNode(cloneContent(), node.id, {
        ...node,
        presentation: { holdMs: 60001 },
      }),
      "schema.maximum",
    );
  });
});
