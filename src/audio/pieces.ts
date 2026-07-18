/**
 * Original instrumental cues for the bar's television speaker. These short-form
 * compositions were authored for this project from simple interval cells. They do
 * not quote, arrange, or identify an existing composition.
 *
 * Frequencies are equal-tempered (A4 = 440 Hz). Durations are in beats, with a
 * `null` frequency representing a rest. The deliberately sparse writing leaves
 * room for dialogue, glasses, the refrigerator, and the set's own low hiss.
 */

export interface Note {
  /** Pitch in Hz, or `null` for a rest. */
  readonly freq: number | null;
  /** Duration in beats (quarter = 1). Always positive. */
  readonly beats: number;
}

export interface Piece {
  readonly id: string;
  readonly title: string;
  readonly origin: "original-project-composition";
  readonly recognizableSource: false;
  /** Beats per minute for the quarter-note pulse. */
  readonly tempo: number;
  /** Authored quiet after the cue. This is not randomized at runtime. */
  readonly gapAfterSeconds: number;
  readonly melody: readonly Note[];
  readonly accompaniment: readonly Note[];
}

const MIDI: Readonly<Record<string, number>> = {
  A2: 45,
  B2: 47,
  C3: 48,
  D3: 50,
  E3: 52,
  "F#3": 54,
  G3: 55,
  A3: 57,
  B3: 59,
  C4: 60,
  D4: 62,
  E4: 64,
  "F#4": 66,
  G4: 67,
  A4: 69,
  B4: 71,
  C5: 72,
  D5: 74,
  E5: 76,
};

function freqOf(name: string): number {
  const midi = MIDI[name];
  if (midi === undefined) {
    throw new Error(`Unknown pitch: ${name}`);
  }
  return 440 * 2 ** ((midi - 69) / 12);
}

function n(name: string, beats: number): Note {
  return { freq: freqOf(name), beats };
}

function r(beats: number): Note {
  return { freq: null, beats };
}

function repeatPhrase(phrase: readonly Note[], count: number): readonly Note[] {
  return Array.from({ length: count }, () => phrase).flat();
}

function totalBeats(notes: readonly Note[]): number {
  return notes.reduce((sum, note) => sum + note.beats, 0);
}

export function pieceDurationSeconds(piece: Piece): number {
  return Math.max(totalBeats(piece.melody), totalBeats(piece.accompaniment)) * (60 / piece.tempo);
}

const LAST_LIGHT: Piece = {
  id: "last-light",
  title: "Last Light",
  origin: "original-project-composition",
  recognizableSource: false,
  tempo: 54,
  gapAfterSeconds: 14,
  melody: [
    ...repeatPhrase(
      [
        n("E4", 2),
        n("G4", 1),
        n("B4", 1),
        r(2),
        n("A4", 2),
        n("G4", 2),
        n("E4", 2),
        n("D4", 2),
        r(2),
      ],
      2,
    ),
    ...repeatPhrase(
      [n("E4", 2), n("F#4", 2), n("A4", 2), r(2), n("G4", 1), n("E4", 3), n("D4", 2), n("B3", 2)],
      2,
    ),
  ],
  accompaniment: repeatPhrase([n("E3", 4), n("B2", 4), n("G3", 4), n("D3", 2), r(2)], 4),
};

const GLASSES_AFTER_NINE: Piece = {
  id: "glasses-after-nine",
  title: "Glasses After Nine",
  origin: "original-project-composition",
  recognizableSource: false,
  tempo: 60,
  gapAfterSeconds: 18,
  melody: [
    ...repeatPhrase(
      [n("A3", 2), n("C4", 2), n("E4", 2), r(2), n("D4", 2), n("B3", 2), n("A3", 2), r(2)],
      2,
    ),
    ...repeatPhrase(
      [
        n("C4", 2),
        n("E4", 1),
        n("G4", 1),
        n("F#4", 2),
        r(2),
        n("E4", 2),
        n("D4", 2),
        n("B3", 2),
        r(2),
      ],
      2,
    ),
    [n("A3", 4), n("C4", 2), n("B3", 2)],
  ].flat(),
  accompaniment: [
    ...repeatPhrase([n("A2", 4), n("E3", 4), n("C3", 4), n("G3", 2), r(2)], 4),
    n("A2", 4),
    n("E3", 4),
  ],
};

const BETWEEN_STATIONS: Piece = {
  id: "between-stations",
  title: "Between Stations",
  origin: "original-project-composition",
  recognizableSource: false,
  tempo: 58,
  gapAfterSeconds: 22,
  melody: [
    ...repeatPhrase(
      [n("D4", 2), n("A4", 2), r(2), n("F#4", 2), n("E4", 2), n("C4", 2), n("D4", 2), r(2)],
      2,
    ),
    ...repeatPhrase(
      [n("G4", 2), n("E4", 2), n("D4", 2), r(2), n("A3", 2), n("C4", 2), n("E4", 2), r(2)],
      2,
    ),
    [n("D4", 2), n("F#4", 2), n("E4", 2), r(2)],
  ].flat(),
  accompaniment: [
    ...repeatPhrase([n("D3", 4), n("A2", 4), n("C3", 4), n("G3", 2), r(2)], 4),
    n("D3", 4),
    n("A2", 4),
  ],
};

/** The fixed authored rotation. Order is part of the room's pacing. */
export const PIECES: readonly Piece[] = [LAST_LIGHT, GLASSES_AFTER_NINE, BETWEEN_STATIONS];
