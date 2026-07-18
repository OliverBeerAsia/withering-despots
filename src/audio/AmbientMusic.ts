/**
 * Quiet diegetic instrumental sound from the bar's television speaker. The
 * implementation stays deliberately small: Web Audio oscillators, a limited
 * receiver passband, gentle pitch instability, and deterministic low hiss.
 *
 * Audio begins only after a user gesture. Pausing, hiding the document, or using
 * silent mode tears down the active cue and its one scheduling timer. Resuming
 * restarts that cue without creating a second playback loop.
 */

import { SeededRandomSource } from "../engine/Rng";
import { PIECES, pieceDurationSeconds, type Piece } from "./pieces";

export type AmbientMusicMode = "instrumental_low" | "lowered" | "silent";

const MODE_GAIN: Readonly<Record<AmbientMusicMode, number>> = {
  instrumental_low: 0.12,
  lowered: 0.052,
  silent: 0,
};

const BAND_LOW_HZ = 300;
const BAND_HIGH_HZ = 3400;
const WOW_RATE_HZ = 0.32;
const WOW_DEPTH_CENTS = 4;
const HISS_GAIN = 0.012;
const FADE_SECONDS = 3;
const START_LATENCY_SECONDS = 0.05;

export interface AmbientMusic {
  /** Compatibility wrapper for the existing Background music setting. */
  setEnabled(enabled: boolean): void;
  /** The user's persisted music preference. Scene mode and pause do not change it. */
  isEnabled(): boolean;
  setMode(mode: AmbientMusicMode): void;
  getMode(): AmbientMusicMode;
  /** Pause playback without changing the selected mode. */
  pause(): void;
  /** Resume after a manual pause. Autoplay policy still applies. */
  resume(): void;
  isPaused(): boolean;
  dispose(): void;
}

interface AudioGraph {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly band: AudioNode;
  readonly wow: GainNode;
}

interface ActivePlayback {
  readonly pieceIndex: number;
  readonly pieceGain: GainNode;
  readonly sources: readonly OscillatorNode[];
}

export function ambientMusicGain(mode: AmbientMusicMode): number {
  return MODE_GAIN[mode];
}

export function createAmbientMusic(): AmbientMusic {
  let mode: AmbientMusicMode = "instrumental_low";
  let userEnabled = true;
  let graph: AudioGraph | null = null;
  let disposed = false;
  let gestureUnlocked = false;
  let manuallyPaused = false;
  let visibilityPaused = document.hidden;
  let resumePending = false;
  let nextCueIndex = 0;
  let resumeCueIndex: number | null = null;
  let activePlayback: ActivePlayback | null = null;
  let nextTimer: ReturnType<typeof setTimeout> | null = null;
  const noiseRng = new SeededRandomSource("withering-despots-tv-hiss-v1");

  function clearNextTimer(): void {
    if (nextTimer !== null) {
      clearTimeout(nextTimer);
      nextTimer = null;
    }
  }

  function buildGraph(): AudioGraph {
    const ctx = new AudioContext();

    const master = ctx.createGain();
    master.gain.value = ambientMusicGain(mode);
    master.connect(ctx.destination);

    const highPass = ctx.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = BAND_LOW_HZ;
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = BAND_HIGH_HZ;
    highPass.connect(lowPass).connect(master);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = WOW_RATE_HZ;
    const wow = ctx.createGain();
    wow.gain.value = WOW_DEPTH_CENTS;
    lfo.connect(wow);
    lfo.start();

    const hiss = ctx.createGain();
    hiss.gain.value = HISS_GAIN;
    hiss.connect(highPass);
    const noise = ctx.createBufferSource();
    noise.buffer = createPinkNoiseBuffer(ctx, noiseRng);
    noise.loop = true;
    noise.connect(hiss);
    noise.start();

    return { ctx, master, band: highPass, wow };
  }

  function ensureGraph(): AudioGraph | null {
    if (graph === null && !disposed) {
      graph = buildGraph();
    }
    return graph;
  }

  function applyModeGain(): void {
    if (graph === null) {
      return;
    }
    const now = graph.ctx.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.setTargetAtTime(ambientMusicGain(mode), now, 0.12);
  }

  function stopActivePlayback(replayOnResume: boolean): void {
    clearNextTimer();
    const playback = activePlayback;
    activePlayback = null;
    if (playback === null) {
      return;
    }
    if (replayOnResume) {
      resumeCueIndex = playback.pieceIndex;
    }
    for (const source of playback.sources) {
      try {
        source.stop();
      } catch {
        // A source that reached its scheduled stop is already silent.
      }
      try {
        graph?.wow.disconnect(source.detune);
      } catch {
        // Some browsers release the AudioParam connection with the source.
      }
      source.disconnect();
    }
    playback.pieceGain.disconnect();
  }

  function shouldPlay(): boolean {
    return (
      !disposed &&
      gestureUnlocked &&
      userEnabled &&
      mode !== "silent" &&
      !manuallyPaused &&
      !visibilityPaused
    );
  }

  function takeCue(): { piece: Piece; index: number } {
    const index = resumeCueIndex ?? nextCueIndex;
    resumeCueIndex = null;
    if (index === nextCueIndex) {
      nextCueIndex = (nextCueIndex + 1) % PIECES.length;
    }
    const piece = PIECES[index];
    if (piece === undefined) {
      throw new Error("Ambient cue rotation must not be empty.");
    }
    return { piece, index };
  }

  function playNextCue(): void {
    if (!shouldPlay() || activePlayback !== null || nextTimer !== null) {
      return;
    }
    const active = ensureGraph();
    if (active === null || active.ctx.state !== "running") {
      return;
    }
    const { piece, index } = takeCue();
    activePlayback = renderPiece(active, piece, index);
    nextTimer = setTimeout(
      () => {
        nextTimer = null;
        stopActivePlayback(false);
        playNextCue();
      },
      (pieceDurationSeconds(piece) + piece.gapAfterSeconds) * 1000,
    );
  }

  function requestResume(): void {
    if (!shouldPlay() || resumePending) {
      return;
    }
    const active = ensureGraph();
    if (active === null) {
      return;
    }
    if (active.ctx.state === "running") {
      playNextCue();
      return;
    }
    resumePending = true;
    void active.ctx
      .resume()
      .then(() => {
        resumePending = false;
        if (shouldPlay()) {
          if (active.ctx.state === "running") {
            playNextCue();
          } else {
            requestResume();
          }
        }
      })
      .catch(() => {
        resumePending = false;
        // A later user gesture or visibility change can retry.
      });
  }

  function suspendPlayback(): void {
    stopActivePlayback(true);
    if (graph !== null) {
      void graph.ctx.suspend().catch(() => {
        // Suspending an already closed context is harmless.
      });
    }
  }

  function reconcilePlayback(): void {
    applyModeGain();
    if (shouldPlay()) {
      requestResume();
    } else {
      suspendPlayback();
    }
  }

  function handleFirstGesture(): void {
    if (gestureUnlocked) {
      return;
    }
    gestureUnlocked = true;
    window.removeEventListener("pointerdown", handleFirstGesture);
    window.removeEventListener("keydown", handleFirstGesture);
    reconcilePlayback();
  }
  window.addEventListener("pointerdown", handleFirstGesture);
  window.addEventListener("keydown", handleFirstGesture);

  function handleVisibility(): void {
    visibilityPaused = document.hidden;
    reconcilePlayback();
  }
  document.addEventListener("visibilitychange", handleVisibility);

  return {
    setEnabled(enabled: boolean): void {
      if (userEnabled !== enabled) {
        userEnabled = enabled;
        reconcilePlayback();
      }
    },
    isEnabled(): boolean {
      return userEnabled;
    },
    setMode(nextMode: AmbientMusicMode): void {
      if (mode === nextMode) {
        return;
      }
      mode = nextMode;
      reconcilePlayback();
    },
    getMode(): AmbientMusicMode {
      return mode;
    },
    pause(): void {
      if (!manuallyPaused) {
        manuallyPaused = true;
        reconcilePlayback();
      }
    },
    resume(): void {
      if (manuallyPaused) {
        manuallyPaused = false;
        reconcilePlayback();
      }
    },
    isPaused(): boolean {
      return manuallyPaused;
    },
    dispose(): void {
      if (disposed) {
        return;
      }
      disposed = true;
      clearNextTimer();
      stopActivePlayback(false);
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (graph !== null) {
        void graph.ctx.close().catch(() => {
          // Closing an already closed context is harmless.
        });
        graph = null;
      }
    },
  };
}

function renderPiece(active: AudioGraph, piece: Piece, pieceIndex: number): ActivePlayback {
  const { ctx, band, wow } = active;
  const beat = 60 / piece.tempo;
  const start = ctx.currentTime + START_LATENCY_SECONDS;
  const durationSeconds = pieceDurationSeconds(piece);

  const pieceGain = ctx.createGain();
  pieceGain.connect(band);
  const fade = Math.min(FADE_SECONDS, durationSeconds / 2);
  pieceGain.gain.setValueAtTime(0, start);
  pieceGain.gain.linearRampToValueAtTime(1, start + fade);
  pieceGain.gain.setValueAtTime(1, start + durationSeconds - fade);
  pieceGain.gain.linearRampToValueAtTime(0, start + durationSeconds);

  const melody = scheduleLine(ctx, pieceGain, wow, piece.melody, start, beat, "triangle", 0.5);
  const accompaniment = scheduleLine(
    ctx,
    pieceGain,
    wow,
    piece.accompaniment,
    start,
    beat,
    "sine",
    0.32,
  );
  return { pieceIndex, pieceGain, sources: [...melody, ...accompaniment] };
}

function scheduleLine(
  ctx: AudioContext,
  dest: GainNode,
  wow: GainNode,
  notes: Piece["melody"],
  start: number,
  beat: number,
  type: OscillatorType,
  peak: number,
): readonly OscillatorNode[] {
  const sources: OscillatorNode[] = [];
  let time = start;
  for (const note of notes) {
    const duration = note.beats * beat;
    if (note.freq !== null) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = note.freq;
      wow.connect(osc.detune);

      const env = ctx.createGain();
      const attack = Math.min(0.08, duration * 0.3);
      const release = Math.min(0.35, duration * 0.45);
      env.gain.setValueAtTime(0, time);
      env.gain.linearRampToValueAtTime(peak, time + attack);
      env.gain.setValueAtTime(peak, Math.max(time + attack, time + duration - release));
      env.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(env).connect(dest);
      osc.start(time);
      osc.stop(time + duration + START_LATENCY_SECONDS);
      sources.push(osc);
    }
    time += duration;
  }
  return sources;
}

function createPinkNoiseBuffer(ctx: AudioContext, rng: SeededRandomSource): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let index = 0; index < length; index += 1) {
    const white = rng.next() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[index] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
  }
  return buffer;
}
