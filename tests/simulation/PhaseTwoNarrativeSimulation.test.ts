import { describe, expect, it } from "vitest";

import {
  dispatchNarrativeCommand,
  initializeNarrativeState,
} from "../../src/narrative/NarrativeEngine";
import { exploreNarrativePaths } from "../../src/simulation/NarrativeSimulator";
import {
  availableNarrativeCommands,
  createPhaseTwoRepository,
  findNarrativeState,
} from "../unit/PhaseTwoTestSupport";

function traceKey(commands: readonly { readonly type: string }[]): string {
  return JSON.stringify(commands);
}

describe("Phase 2 narrative simulations", () => {
  it("completes at least 500 distinct valid action traces", () => {
    const repository = createPhaseTwoRepository();
    const paths = exploreNarrativePaths(repository, 500, 80);
    const traceKeys = new Set(paths.map((path) => traceKey(path.commands)));

    expect(paths).toHaveLength(500);
    expect(traceKeys.size).toBe(500);
    for (const path of paths) {
      expect(path.state.mode).toBe("complete");
      expect(path.state.summaryId).not.toBeNull();
      expect(path.state.clockMinutes).toBeLessThanOrEqual(repository.bundle.metadata.endMinute);
      expect(path.state.timeline.event_sample_attention?.status).toBe("complete");
      expect(path.state.attention).toBeNull();
      expect(path.state.actionHistory).toHaveLength(path.commands.length);
    }
  });

  it("repeats the same 500-path corpus deterministically", () => {
    const repository = createPhaseTwoRepository();
    const first = exploreNarrativePaths(repository, 500, 80);
    const second = exploreNarrativePaths(repository, 500, 80);

    expect(second.map((path) => path.commands)).toEqual(first.map((path) => path.commands));
    expect(second.map((path) => path.state)).toEqual(first.map((path) => path.state));
  });

  it("reaches every authored sample node through executable state", () => {
    const repository = createPhaseTwoRepository();
    const expectedNodeIds = new Set(Object.keys(repository.nodes));
    const reachedNodeIds = new Set<string>();
    const visitedStates = new Set<string>();
    const pending = [initializeNarrativeState(repository, "phase-2-reachability")];
    const volatileStateKeys = new Set([
      "actionHistory",
      "revision",
      "rngState",
      "seed",
      "patrons",
      "relationships",
      "contradictionsExposed",
      "epilogueFacts",
    ]);

    while (pending.length > 0 && reachedNodeIds.size < expectedNodeIds.size) {
      const state = pending.pop();
      if (state === undefined) {
        break;
      }

      const stateWithoutHistory = Object.fromEntries(
        Object.entries(state).filter(([key]) => !volatileStateKeys.has(key)),
      );
      const stateKey = JSON.stringify(stateWithoutHistory);
      if (visitedStates.has(stateKey)) {
        continue;
      }
      visitedStates.add(stateKey);

      if (state.currentNodeId !== null) {
        reachedNodeIds.add(state.currentNodeId);
      }
      if (state.mode === "complete") {
        continue;
      }

      for (const command of availableNarrativeCommands(repository, state)) {
        const result = dispatchNarrativeCommand(repository, state, command);
        if (result.ok) {
          pending.push(result.state);
        }
      }
    }

    expect([...expectedNodeIds].filter((nodeId) => !reachedNodeIds.has(nodeId))).toEqual([]);
  });

  it("keeps persistent media state distinct across authored room activities", () => {
    const repository = createPhaseTwoRepository();
    const tuned = findNarrativeState(
      repository,
      (candidate) =>
        candidate.currentNodeId === "sample_signal_tuned" &&
        candidate.objects.television === "signal_clear",
    ).state;
    const waited = findNarrativeState(
      repository,
      (candidate) =>
        candidate.currentNodeId === "sample_signal_phrase_ends" &&
        candidate.objects.radio_music === "silent",
    ).state;
    const afterReport = findNarrativeState(
      repository,
      (candidate) => candidate.currentNodeId === "sample_post_report_quiet",
    ).state;

    expect(tuned.objects).toMatchObject({
      television: "signal_clear",
      television_volume: "normal",
      radio_music: "lowered",
    });
    expect(waited.objects).toMatchObject({
      television: "signal_unstable",
      radio_music: "silent",
    });
    expect(afterReport.objects).toMatchObject({
      television: "after_report",
      radio_music: "silent",
    });
  });

  it("supports two private interpretations without changing public history", () => {
    const repository = createPhaseTwoRepository();
    const paths = exploreNarrativePaths(repository, 500, 80);
    const privateRecord = paths.find(
      (path) => path.state.summaryId === "summary_sample_private_record",
    );
    const publicRupture = paths.find(
      (path) => path.state.summaryId === "summary_sample_public_rupture",
    );

    expect(privateRecord).toBeDefined();
    expect(publicRupture).toBeDefined();
    expect(privateRecord?.state.timeline).toEqual(publicRupture?.state.timeline);
    expect(privateRecord?.state.clockMinutes).toBe(publicRupture?.state.clockMinutes);
    expect(privateRecord?.state.contradictionsExposed).toEqual(
      publicRupture?.state.contradictionsExposed,
    );
    expect(privateRecord?.state.summaryId).not.toBe(publicRupture?.state.summaryId);
    expect(privateRecord?.state.objects.prop_gennady_factory_photo).toBe("face_up");
    expect(publicRupture?.state.objects.prop_gennady_factory_photo).toBe("face_down");
    expect(privateRecord?.state.flags.gennady_private_claim_repeated).not.toBe(true);
    expect(publicRupture?.state.flags.gennady_private_claim_repeated).toBe(true);
  });
});
