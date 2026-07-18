import { describe, expect, it } from "vitest";

import type { ContentRepository, WorldState } from "../../src/narrative/types";
import { selectNarrativeGrayboxProjection } from "../../src/scene/NarrativeGrayboxProjection";
import {
  resolveAmbientCharacterFrame,
  resolveAmbientPropOffset,
  resolveTelevisionVisualState,
} from "../../src/scene/PixelBarScene";

const REPOSITORY = {
  nodes: {
    sample_arkady_procedural_answer: {
      id: "sample_arkady_procedural_answer",
      speakerId: "arkady",
    },
  },
} as unknown as ContentRepository;

function projectionState(overrides: Partial<WorldState> = {}): WorldState {
  return {
    currentNodeId: null,
    objects: { television: "music_low" },
    mode: "dialogue",
    attention: null,
    ...overrides,
  } as unknown as WorldState;
}

describe("pixel bar presentation projection", () => {
  it("projects the durable television object state independently of attention outcome", () => {
    const state = projectionState({ objects: { television: "after_report" } });

    const projection = selectNarrativeGrayboxProjection(REPOSITORY, state);

    expect(projection.televisionState).toBe("after_report");
    expect(projection.attentionOpen).toBe(false);
  });

  it.each([
    ["instrumental_low", "instrumental_low"],
    ["lowered", "lowered"],
    ["silent", "silent"],
    ["unknown", "instrumental_low"],
  ] as const)("projects radio music state %s as %s", (objectState, expectedMode) => {
    const state = projectionState({
      objects: { television: "music_low", radio_music: objectState },
    });

    const projection = selectNarrativeGrayboxProjection(REPOSITORY, state);

    expect(projection.radioMusicState).toBe(expectedMode);
  });

  it("maps selected authored nodes onto existing conservative pose frames", () => {
    const state = projectionState({ currentNodeId: "sample_arkady_procedural_answer" });

    const projection = selectNarrativeGrayboxProjection(REPOSITORY, state);

    expect(projection.presentationPoseByCharacterId).toEqual({ arkady: "lean_back" });
  });
});

describe("television visual state", () => {
  it("keeps bulletin light local and alternates only the screen frame", () => {
    expect(resolveTelevisionVisualState("bulletin", 0, false)).toEqual({
      screen: "broadcast_a",
      lightAlpha: 0.42,
    });
    expect(resolveTelevisionVisualState("bulletin", 2, false)).toEqual({
      screen: "broadcast_b",
      lightAlpha: 0.42,
    });
  });

  it("freezes flicker under reduced motion while preserving the readable TV state", () => {
    expect(resolveTelevisionVisualState("signal_unstable", 99, true)).toEqual({
      screen: "static_a",
      lightAlpha: 0.24,
    });
  });

  it("falls back to an unlit off screen for an unknown state", () => {
    expect(resolveTelevisionVisualState("unknown", 0, false)).toEqual({
      screen: "off",
      lightAlpha: 0,
    });
  });
});

describe("restrained ambient room motion", () => {
  it("leaves seated characters still for most ticks and varies schedules by character", () => {
    expect(resolveAmbientCharacterFrame("arkady", 10, false)).toBe("seated_listen");
    expect(resolveAmbientCharacterFrame("arkady", 11, false)).toBe("seated_listen_blink");
    expect(resolveAmbientCharacterFrame("arkady", 71, false)).toBe("seated_listen_breath");

    expect(resolveAmbientCharacterFrame("lev", 11, false)).toBe("seated_listen");
    expect(resolveAmbientCharacterFrame("lev", 29, false)).toBe("seated_listen_blink");
    expect(resolveAmbientCharacterFrame("lev", 103, false)).toBe("seated_listen_breath");
  });

  it("keeps all nonessential character motion still under reduced motion", () => {
    expect(resolveAmbientCharacterFrame("arkady", 11, true)).toBe("seated_listen");
    expect(resolveAmbientCharacterFrame("lev", 103, true)).toBe("seated_listen");
  });

  it("nudges table glasses rarely, deterministically, and only by whole pixels", () => {
    expect(resolveAmbientPropOffset("glass-a", 30, false)).toEqual({ x: 0, y: 0 });
    expect(resolveAmbientPropOffset("glass-a", 31, false)).toEqual({ x: 1, y: 0 });
    expect(resolveAmbientPropOffset("glass-a", 32, false)).toEqual({ x: 1, y: 0 });
    expect(resolveAmbientPropOffset("glass-a", 33, false)).toEqual({ x: 0, y: 0 });
    expect(resolveAmbientPropOffset("glass-a", 168, false)).toEqual({ x: 1, y: 0 });

    expect(resolveAmbientPropOffset("glass-e", 73, false)).toEqual({ x: -1, y: 0 });
    expect(resolveAmbientPropOffset("glass-e", 73, true)).toEqual({ x: 0, y: 0 });
  });
});
