export interface RandomSource {
  next(): number;
  integer(minInclusive: number, maxExclusive: number): number;
  snapshot(): number;
  restore(state: number): void;
}

const UINT32_RANGE = 0x1_0000_0000;

function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export class SeededRandomSource implements RandomSource {
  private state: number;

  constructor(seed: string) {
    if (seed.length === 0) {
      throw new Error("A deterministic seed must not be empty.");
    }

    this.state = hashSeed(seed);
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;

    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  }

  integer(minInclusive: number, maxExclusive: number): number {
    if (!Number.isSafeInteger(minInclusive) || !Number.isSafeInteger(maxExclusive)) {
      throw new Error("Random integer bounds must be safe integers.");
    }

    if (maxExclusive <= minInclusive) {
      throw new Error("Random integer upper bound must exceed the lower bound.");
    }

    return minInclusive + Math.floor(this.next() * (maxExclusive - minInclusive));
  }

  snapshot(): number {
    return this.state;
  }

  restore(state: number): void {
    if (!Number.isInteger(state) || state < 0 || state >= UINT32_RANGE) {
      throw new Error("Random source state must be an unsigned 32-bit integer.");
    }

    this.state = state >>> 0;
  }
}
