/**
 * Restrained room tone for the bar, synthesized entirely with Web Audio.
 *
 * A steady ventilation and refrigerator bed sits beneath sparse, deterministic
 * incidental cues. The cue callback carries reviewed text so a future subtitle
 * surface can caption sounds without having to infer what played.
 */

import { SeededRandomSource } from "../engine/Rng";

export type RoomAmbienceEffectsLevel = "full" | "low";
export type RoomAmbienceCueId = "glass_settle" | "chair_scrape" | "receiver_relay";

export interface RoomAmbienceCue {
  readonly id: RoomAmbienceCueId;
  readonly caption: string;
  /** Significant cues should be offered to the caption surface when it is active. */
  readonly captionPriority: "incidental" | "significant";
}

export interface RoomAmbienceOptions {
  readonly seed?: string;
  readonly onCue?: (cue: RoomAmbienceCue) => void;
}

export interface RoomAmbience {
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  setEffectsLevel(level: RoomAmbienceEffectsLevel): void;
  getEffectsLevel(): RoomAmbienceEffectsLevel;
  /**
   * Removes off-screen movement cues while preserving a quieter steady room bed.
   * This can follow the game's reduced-motion setting without treating silence as
   * an accessibility requirement.
   */
  setReducedMotion(enabled: boolean): void;
  isReducedMotion(): boolean;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  dispose(): void;
}

const AMBIENCE_SEED = "withering-despots-room-ambience-v1";
const MIN_CUE_DELAY_SECONDS = 24;
const MAX_CUE_DELAY_SECONDS = 49;
const MASTER_GAIN: Readonly<Record<RoomAmbienceEffectsLevel, number>> = {
  full: 0.1,
  low: 0.055,
};

export const ROOM_AMBIENCE_CUES: Readonly<Record<RoomAmbienceCueId, RoomAmbienceCue>> = {
  glass_settle: {
    id: "glass_settle",
    caption: "[A glass settles behind the counter.]",
    captionPriority: "incidental",
  },
  chair_scrape: {
    id: "chair_scrape",
    caption: "[A chair shifts across the floor.]",
    captionPriority: "incidental",
  },
  receiver_relay: {
    id: "receiver_relay",
    caption: "[The telephone relay clicks.]",
    captionPriority: "significant",
  },
};

const CUE_ORDER: readonly RoomAmbienceCueId[] = ["glass_settle", "chair_scrape", "receiver_relay"];

interface RoomAudioGraph {
  readonly ctx: AudioContext;
  readonly master: GainNode;
  readonly incidentBus: GainNode;
  readonly humSources: readonly OscillatorNode[];
  readonly humNodes: readonly AudioNode[];
}

/** Pure deterministic sequence used by the runtime and focused tests. */
export class RoomAmbienceSequence {
  private readonly rng: SeededRandomSource;
  private previousCue: RoomAmbienceCueId | null = null;

  constructor(seed = AMBIENCE_SEED) {
    this.rng = new SeededRandomSource(seed);
  }

  nextDelaySeconds(): number {
    return this.rng.integer(MIN_CUE_DELAY_SECONDS, MAX_CUE_DELAY_SECONDS + 1);
  }

  nextCue(): RoomAmbienceCue {
    let index = this.rng.integer(0, CUE_ORDER.length);
    let id = CUE_ORDER[index];
    if (id === undefined) {
      throw new Error("Room ambience cue order must not be empty.");
    }
    if (id === this.previousCue) {
      index = (index + 1) % CUE_ORDER.length;
      id = CUE_ORDER[index];
      if (id === undefined) {
        throw new Error("Room ambience cue order must not be empty.");
      }
    }
    this.previousCue = id;
    return ROOM_AMBIENCE_CUES[id];
  }
}

export function roomAmbienceGain(level: RoomAmbienceEffectsLevel, reducedMotion: boolean): number {
  return MASTER_GAIN[level] * (reducedMotion ? 0.72 : 1);
}

export function createRoomAmbience(options: RoomAmbienceOptions = {}): RoomAmbience {
  let enabled = true;
  let effectsLevel: RoomAmbienceEffectsLevel = "full";
  let reducedMotion = false;
  let manuallyPaused = false;
  let visibilityPaused = document.hidden;
  let gestureUnlocked = false;
  let disposed = false;
  let resumePending = false;
  let graph: RoomAudioGraph | null = null;
  let cueTimer: ReturnType<typeof setTimeout> | null = null;
  const sequence = new RoomAmbienceSequence(options.seed);
  const noiseRng = new SeededRandomSource(`${options.seed ?? AMBIENCE_SEED}-noise`);

  function shouldRun(): boolean {
    return enabled && gestureUnlocked && !manuallyPaused && !visibilityPaused && !disposed;
  }

  function shouldPlayIncidents(): boolean {
    return shouldRun() && effectsLevel === "full" && !reducedMotion;
  }

  function clearCueTimer(): void {
    if (cueTimer !== null) {
      clearTimeout(cueTimer);
      cueTimer = null;
    }
  }

  function buildGraph(): RoomAudioGraph {
    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = roomAmbienceGain(effectsLevel, reducedMotion);
    master.connect(ctx.destination);

    const lowPass = ctx.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 230;
    lowPass.connect(master);

    const humBus = ctx.createGain();
    humBus.gain.value = 0.058;
    humBus.connect(lowPass);

    const ventilation = ctx.createOscillator();
    ventilation.type = "sine";
    ventilation.frequency.value = 47;
    const refrigerator = ctx.createOscillator();
    refrigerator.type = "triangle";
    refrigerator.frequency.value = 93;

    const slowDrift = ctx.createOscillator();
    slowDrift.type = "sine";
    slowDrift.frequency.value = 0.083;
    const driftDepth = ctx.createGain();
    driftDepth.gain.value = 0.011;
    slowDrift.connect(driftDepth).connect(humBus.gain);

    const ventilationGain = ctx.createGain();
    ventilationGain.gain.value = 0.68;
    const refrigeratorGain = ctx.createGain();
    refrigeratorGain.gain.value = 0.22;
    ventilation.connect(ventilationGain).connect(humBus);
    refrigerator.connect(refrigeratorGain).connect(humBus);

    const noise = ctx.createBufferSource();
    noise.buffer = createBrownNoiseBuffer(ctx, noiseRng);
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.024;
    noise.connect(noiseGain).connect(lowPass);

    const incidentBus = ctx.createGain();
    incidentBus.gain.value = 0.085;
    incidentBus.connect(master);

    ventilation.start();
    refrigerator.start();
    slowDrift.start();
    noise.start();

    return {
      ctx,
      master,
      incidentBus,
      humSources: [ventilation, refrigerator, slowDrift],
      humNodes: [lowPass, humBus, driftDepth, ventilationGain, refrigeratorGain, noise, noiseGain],
    };
  }

  function ensureGraph(): RoomAudioGraph | null {
    if (graph === null && !disposed) {
      graph = buildGraph();
    }
    return graph;
  }

  function applyGain(): void {
    if (graph === null) {
      return;
    }
    const now = graph.ctx.currentTime;
    graph.master.gain.cancelScheduledValues(now);
    graph.master.gain.setTargetAtTime(roomAmbienceGain(effectsLevel, reducedMotion), now, 0.18);
  }

  function scheduleNextCue(): void {
    clearCueTimer();
    if (!shouldPlayIncidents()) {
      return;
    }
    cueTimer = setTimeout(() => {
      cueTimer = null;
      if (!shouldPlayIncidents() || graph === null || graph.ctx.state !== "running") {
        return;
      }
      const cue = sequence.nextCue();
      renderCue(graph, cue.id, noiseRng);
      options.onCue?.(cue);
      scheduleNextCue();
    }, sequence.nextDelaySeconds() * 1000);
  }

  function requestResume(): void {
    if (!shouldRun() || resumePending) {
      return;
    }
    const active = ensureGraph();
    if (active === null) {
      return;
    }
    if (active.ctx.state === "running") {
      return;
    }
    resumePending = true;
    void active.ctx
      .resume()
      .then(() => {
        resumePending = false;
        if (shouldRun() && active.ctx.state === "running") {
          scheduleNextCue();
        }
      })
      .catch(() => {
        resumePending = false;
      });
  }

  function suspend(): void {
    clearCueTimer();
    if (graph !== null) {
      void graph.ctx.suspend().catch(() => {
        // Suspending an already closed context is harmless.
      });
    }
  }

  function reconcile(): void {
    applyGain();
    if (shouldRun()) {
      requestResume();
      if (graph?.ctx.state === "running") {
        scheduleNextCue();
      }
    } else {
      suspend();
    }
  }

  function handleFirstGesture(): void {
    if (gestureUnlocked) {
      return;
    }
    gestureUnlocked = true;
    window.removeEventListener("pointerdown", handleFirstGesture);
    window.removeEventListener("keydown", handleFirstGesture);
    reconcile();
  }
  window.addEventListener("pointerdown", handleFirstGesture);
  window.addEventListener("keydown", handleFirstGesture);

  function handleVisibility(): void {
    visibilityPaused = document.hidden;
    reconcile();
  }
  document.addEventListener("visibilitychange", handleVisibility);

  return {
    setEnabled(nextEnabled: boolean): void {
      if (enabled !== nextEnabled) {
        enabled = nextEnabled;
        reconcile();
      }
    },
    isEnabled(): boolean {
      return enabled;
    },
    setEffectsLevel(level: RoomAmbienceEffectsLevel): void {
      if (effectsLevel !== level) {
        effectsLevel = level;
        reconcile();
      }
    },
    getEffectsLevel(): RoomAmbienceEffectsLevel {
      return effectsLevel;
    },
    setReducedMotion(nextReducedMotion: boolean): void {
      if (reducedMotion !== nextReducedMotion) {
        reducedMotion = nextReducedMotion;
        reconcile();
      }
    },
    isReducedMotion(): boolean {
      return reducedMotion;
    },
    pause(): void {
      if (!manuallyPaused) {
        manuallyPaused = true;
        reconcile();
      }
    },
    resume(): void {
      if (manuallyPaused) {
        manuallyPaused = false;
        reconcile();
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
      clearCueTimer();
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (graph !== null) {
        for (const source of graph.humSources) {
          try {
            source.stop();
          } catch {
            // A stopped source is already silent.
          }
          source.disconnect();
        }
        for (const node of graph.humNodes) {
          node.disconnect();
        }
        graph.incidentBus.disconnect();
        graph.master.disconnect();
        void graph.ctx.close().catch(() => {
          // Closing an already closed context is harmless.
        });
        graph = null;
      }
    },
  };
}

function renderCue(graph: RoomAudioGraph, cueId: RoomAmbienceCueId, rng: SeededRandomSource): void {
  if (cueId === "glass_settle") {
    renderGlassSettle(graph);
  } else if (cueId === "chair_scrape") {
    renderChairScrape(graph, rng);
  } else {
    renderReceiverRelay(graph);
  }
}

function renderGlassSettle({ ctx, incidentBus }: RoomAudioGraph): void {
  const start = ctx.currentTime + 0.015;
  for (const [offset, frequency, peak] of [
    [0, 920, 0.28],
    [0.035, 1380, 0.16],
  ] as const) {
    const tone = ctx.createOscillator();
    tone.type = "sine";
    tone.frequency.value = frequency;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(peak, start + offset);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.24);
    tone.connect(envelope).connect(incidentBus);
    tone.start(start + offset);
    tone.stop(start + offset + 0.25);
  }
}

function renderChairScrape({ ctx, incidentBus }: RoomAudioGraph, rng: SeededRandomSource): void {
  const source = ctx.createBufferSource();
  source.buffer = createBrownNoiseBuffer(ctx, rng, 0.62);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(480, ctx.currentTime);
  band.frequency.linearRampToValueAtTime(250, ctx.currentTime + 0.58);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, ctx.currentTime);
  envelope.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.08);
  envelope.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.62);
  source.connect(band).connect(envelope).connect(incidentBus);
  source.start();
  source.stop(ctx.currentTime + 0.63);
}

function renderReceiverRelay({ ctx, incidentBus }: RoomAudioGraph): void {
  const start = ctx.currentTime + 0.01;
  for (const offset of [0, 0.11]) {
    const click = ctx.createOscillator();
    click.type = "square";
    click.frequency.value = offset === 0 ? 185 : 142;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.16, start + offset);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.035);
    click.connect(envelope).connect(incidentBus);
    click.start(start + offset);
    click.stop(start + offset + 0.04);
  }
}

function createBrownNoiseBuffer(
  ctx: AudioContext,
  rng: SeededRandomSource,
  durationSeconds = 2,
): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSeconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let index = 0; index < length; index += 1) {
    const white = rng.next() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[index] = last * 3.4;
  }
  return buffer;
}
