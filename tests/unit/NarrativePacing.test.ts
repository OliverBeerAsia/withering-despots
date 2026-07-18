import { afterEach, describe, expect, it, vi } from "vitest";

import rawPhaseTwoContent from "../../content/phase-2-sample.json";
import { loadContentRepository } from "../../src/narrative/ContentRepository";
import { initializeNarrativeState } from "../../src/narrative/NarrativeEngine";
import type { DialogueNodeDefinition, NarrativeContentBundle } from "../../src/narrative/types";
import { selectAuthoredHoldMs } from "../../src/ui/NarrativeOverlay";
import {
  PresentationBeat,
  resolvePresentationHoldMs,
  type PresentationBeatScheduler,
} from "../../src/ui/PresentationBeat";

type TimerHandle = ReturnType<typeof setTimeout>;

const scheduler: PresentationBeatScheduler<TimerHandle> = {
  now: () => Date.now(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => {
    clearTimeout(handle);
  },
};

function bundleWithEntryNode(
  update: (node: DialogueNodeDefinition) => DialogueNodeDefinition,
): NarrativeContentBundle {
  const bundle = structuredClone(rawPhaseTwoContent) as unknown as NarrativeContentBundle;
  const graph = bundle.dialogueGraphs[0];
  const entryNode = graph?.nodes.find((node) => node.id === graph.entryNodeId);
  if (graph === undefined || entryNode === undefined) {
    throw new Error("Phase 2 fixture is missing its entry node.");
  }
  return {
    ...bundle,
    dialogueGraphs: [
      {
        ...graph,
        nodes: graph.nodes.map((node) => (node.id === entryNode.id ? update(node) : node)),
      },
      ...bundle.dialogueGraphs.slice(1),
    ],
  };
}

describe("narrative presentation pacing", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not invent a hold for nodes without presentation metadata", () => {
    const repository = loadContentRepository(
      bundleWithEntryNode((node) => ({
        id: node.id,
        speakerId: node.speakerId,
        textKey: node.textKey,
        requires: node.requires,
        onEnter: node.onEnter,
        choices: node.choices,
      })),
    );
    expect(selectAuthoredHoldMs(repository, initializeNarrativeState(repository))).toBe(0);
  });

  it("selects the current node's authored hold without advancing narrative time", () => {
    const repository = loadContentRepository(
      bundleWithEntryNode((node) => ({ ...node, presentation: { holdMs: 60000 } })),
    );
    const state = initializeNarrativeState(repository);

    expect(selectAuthoredHoldMs(repository, state)).toBe(60000);
    expect(state.clockMinutes).toBe(repository.bundle.metadata.startMinute);
    expect(state.actionHistory).toHaveLength(0);
  });

  it("resolves Full, Brief, and Immediate without changing authored content", () => {
    expect(resolvePresentationHoldMs(60000, "full")).toBe(60000);
    expect(resolvePresentationHoldMs(60000, "brief")).toBe(5000);
    expect(resolvePresentationHoldMs(60000, "immediate")).toBe(0);
  });

  it("completes naturally once and does not mutate authoritative state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const repository = loadContentRepository(rawPhaseTwoContent);
    const state = initializeNarrativeState(repository);
    const before = structuredClone(state);
    const onComplete = vi.fn();
    const beat = new PresentationBeat(scheduler);

    beat.start(10000, onComplete);
    vi.advanceTimersByTime(9999);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(state).toEqual(before);
    expect(beat.isActive()).toBe(false);
  });

  it("skips a hold once without waiting or mutating authoritative state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const repository = loadContentRepository(rawPhaseTwoContent);
    const state = initializeNarrativeState(repository);
    const before = structuredClone(state);
    const onComplete = vi.fn();
    const beat = new PresentationBeat(scheduler);

    beat.start(60000, onComplete);
    expect(beat.skip()).toBe(true);
    expect(beat.skip()).toBe(false);
    vi.advanceTimersByTime(60000);

    expect(onComplete).toHaveBeenCalledOnce();
    expect(state).toEqual(before);
  });

  it("freezes the remaining duration while paused and resumes from that point", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const onComplete = vi.fn();
    const beat = new PresentationBeat(scheduler);

    beat.start(10000, onComplete);
    vi.advanceTimersByTime(4000);
    beat.pause();
    expect(beat.getRemainingMs()).toBe(6000);
    vi.advanceTimersByTime(30000);
    expect(onComplete).not.toHaveBeenCalled();

    beat.resume();
    vi.advanceTimersByTime(5999);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("caps a running Full hold when the preference changes to Brief", () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const onComplete = vi.fn();
    const beat = new PresentationBeat(scheduler);

    beat.start(60000, onComplete);
    vi.advanceTimersByTime(2000);
    beat.capRemaining(5000);
    expect(beat.getRemainingMs()).toBe(5000);
    vi.advanceTimersByTime(5000);

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
