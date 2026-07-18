import { describe, expect, it } from "vitest";

import { SeededRandomSource } from "../../src/engine/Rng";

function take(random: SeededRandomSource, count: number): number[] {
  return Array.from({ length: count }, () => random.next());
}

describe("SeededRandomSource", () => {
  it("returns the same sequence for the same seed", () => {
    expect(take(new SeededRandomSource("phase-zero"), 8)).toEqual(
      take(new SeededRandomSource("phase-zero"), 8),
    );
  });

  it("returns a different sequence for a different seed", () => {
    expect(take(new SeededRandomSource("phase-zero-a"), 8)).not.toEqual(
      take(new SeededRandomSource("phase-zero-b"), 8),
    );
  });

  it("resumes the sequence from a restored snapshot", () => {
    const random = new SeededRandomSource("snapshot-proof");
    take(random, 3);
    const snapshot = random.snapshot();
    const expectedContinuation = take(random, 5);

    random.restore(snapshot);

    expect(take(random, 5)).toEqual(expectedContinuation);
  });

  it("rejects invalid integer bounds", () => {
    const random = new SeededRandomSource("bounds-proof");

    expect(() => random.integer(2, 2)).toThrow(
      "Random integer upper bound must exceed the lower bound.",
    );
    expect(() => random.integer(0.5, 2)).toThrow("Random integer bounds must be safe integers.");
  });

  it("rejects invalid snapshots", () => {
    const random = new SeededRandomSource("snapshot-bounds-proof");

    expect(() => {
      random.restore(-1);
    }).toThrow("Random source state must be an unsigned 32-bit integer.");
    expect(() => {
      random.restore(0x1_0000_0000);
    }).toThrow("Random source state must be an unsigned 32-bit integer.");
  });
});
