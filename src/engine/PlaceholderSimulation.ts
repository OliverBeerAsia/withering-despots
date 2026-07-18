import { SeededRandomSource } from "./Rng";

export interface PlaceholderSimulationResult {
  readonly seed: string;
  readonly steps: number;
  readonly ambientSamples: readonly number[];
  readonly finalRandomState: number;
}

export function runPlaceholderSimulation(seed: string, steps: number): PlaceholderSimulationResult {
  if (!Number.isSafeInteger(steps) || steps < 0) {
    throw new Error("Simulation steps must be a non-negative safe integer.");
  }

  const random = new SeededRandomSource(seed);
  const ambientSamples = Array.from({ length: steps }, () => random.integer(0, 4));

  return {
    seed,
    steps,
    ambientSamples,
    finalRandomState: random.snapshot(),
  };
}
