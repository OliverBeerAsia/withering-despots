import { describe, expect, it } from "vitest";

import { runPlaceholderSimulation } from "../../src/engine/PlaceholderSimulation";

describe("runPlaceholderSimulation", () => {
  it("produces deeply equal output for the same seed and steps", () => {
    const first = runPlaceholderSimulation("phase-zero", 24);
    const second = runPlaceholderSimulation("phase-zero", 24);

    expect(first).toEqual(second);
  });

  it("produces a distinct ambient sequence for a different seed", () => {
    const first = runPlaceholderSimulation("phase-zero-a", 24);
    const second = runPlaceholderSimulation("phase-zero-b", 24);

    expect(first.ambientSamples).not.toEqual(second.ambientSamples);
  });

  it("rejects invalid step counts", () => {
    expect(() => runPlaceholderSimulation("phase-zero", -1)).toThrow(
      "Simulation steps must be a non-negative safe integer.",
    );
    expect(() => runPlaceholderSimulation("phase-zero", 1.5)).toThrow(
      "Simulation steps must be a non-negative safe integer.",
    );
  });
});
