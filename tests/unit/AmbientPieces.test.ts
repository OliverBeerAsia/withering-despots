import { describe, expect, it } from "vitest";

import { PIECES, pieceDurationSeconds } from "../../src/audio/pieces";

describe("ambient radio pieces", () => {
  it("provides a non-empty repertoire", () => {
    expect(PIECES.length).toBeGreaterThan(0);
  });

  it("gives every piece a non-empty melody and accompaniment", () => {
    for (const piece of PIECES) {
      expect(piece.melody.length, piece.id).toBeGreaterThan(0);
      expect(piece.accompaniment.length, piece.id).toBeGreaterThan(0);
    }
  });

  it("contains only original non-identifiable project compositions", () => {
    for (const piece of PIECES) {
      expect(piece.origin, piece.id).toBe("original-project-composition");
      expect(piece.recognizableSource, piece.id).toBe(false);
    }
    expect(PIECES.map((piece) => piece.id)).toEqual([
      "last-light",
      "glasses-after-nine",
      "between-stations",
    ]);
  });

  it("keeps every authored cue between 60 and 90 seconds", () => {
    for (const piece of PIECES) {
      expect(pieceDurationSeconds(piece), piece.id).toBeGreaterThanOrEqual(60);
      expect(pieceDurationSeconds(piece), piece.id).toBeLessThanOrEqual(90);
      expect(piece.gapAfterSeconds, piece.id).toBeGreaterThan(0);
    }
  });

  it("uses positive durations and in-range pitches", () => {
    for (const piece of PIECES) {
      expect(piece.tempo, piece.id).toBeGreaterThan(0);
      for (const note of [...piece.melody, ...piece.accompaniment]) {
        expect(note.beats, piece.id).toBeGreaterThan(0);
        if (note.freq !== null) {
          expect(note.freq, piece.id).toBeGreaterThanOrEqual(100);
          expect(note.freq, piece.id).toBeLessThanOrEqual(2000);
        }
      }
    }
  });

  it("keeps piece ids unique", () => {
    const ids = PIECES.map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
