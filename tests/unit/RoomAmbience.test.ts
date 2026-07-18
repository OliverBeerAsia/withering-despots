import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ROOM_AMBIENCE_CUES,
  RoomAmbienceSequence,
  createRoomAmbience,
  roomAmbienceGain,
  type RoomAmbienceCue,
} from "../../src/audio/RoomAmbience";

class FakeAudioParam {
  value = 0;

  cancelScheduledValues(): void {}

  setTargetAtTime(value: number): void {
    this.value = value;
  }

  setValueAtTime(value: number): void {
    this.value = value;
  }

  linearRampToValueAtTime(value: number): void {
    this.value = value;
  }

  exponentialRampToValueAtTime(value: number): void {
    this.value = value;
  }
}

class FakeAudioNode {
  connect<T>(destination: T): T {
    return destination;
  }

  disconnect(): void {}
}

class FakeGainNode extends FakeAudioNode {
  readonly gain = new FakeAudioParam();
}

class FakeBiquadFilterNode extends FakeAudioNode {
  type: BiquadFilterType = "lowpass";
  readonly frequency = new FakeAudioParam();
}

class FakeOscillatorNode extends FakeAudioNode {
  type: OscillatorType = "sine";
  readonly frequency = new FakeAudioParam();
  readonly detune = new FakeAudioParam();

  start(): void {}

  stop(): void {}
}

class FakeBufferSourceNode extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
  loop = false;

  start(): void {}

  stop(): void {}
}

class FakeAudioBuffer {
  private readonly samples: Float32Array;

  constructor(length: number) {
    this.samples = new Float32Array(length);
  }

  getChannelData(): Float32Array {
    return this.samples;
  }
}

class FakeAudioContext {
  state: AudioContextState = "suspended";
  readonly currentTime = 0;
  readonly sampleRate = 20;
  readonly destination = new FakeAudioNode();

  createGain(): GainNode {
    return new FakeGainNode() as unknown as GainNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    return new FakeBiquadFilterNode() as unknown as BiquadFilterNode;
  }

  createOscillator(): OscillatorNode {
    return new FakeOscillatorNode() as unknown as OscillatorNode;
  }

  createBufferSource(): AudioBufferSourceNode {
    return new FakeBufferSourceNode() as unknown as AudioBufferSourceNode;
  }

  createBuffer(_channels: number, length: number): AudioBuffer {
    return new FakeAudioBuffer(length) as unknown as AudioBuffer;
  }

  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }

  suspend(): Promise<void> {
    this.state = "suspended";
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.state = "closed";
    return Promise.resolve();
  }
}

class FakeDocument extends EventTarget {
  hidden = false;
}

async function settlePromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("room ambience sequence", () => {
  it("produces a sparse repeatable schedule without repeating a cue immediately", () => {
    const first = new RoomAmbienceSequence("test-room");
    const second = new RoomAmbienceSequence("test-room");
    const firstSchedule = Array.from({ length: 12 }, () => ({
      delay: first.nextDelaySeconds(),
      cue: first.nextCue().id,
    }));
    const secondSchedule = Array.from({ length: 12 }, () => ({
      delay: second.nextDelaySeconds(),
      cue: second.nextCue().id,
    }));

    expect(firstSchedule).toEqual(secondSchedule);
    expect(firstSchedule.every(({ delay }) => delay >= 24 && delay <= 49)).toBe(true);
    for (let index = 1; index < firstSchedule.length; index += 1) {
      expect(firstSchedule[index]?.cue).not.toBe(firstSchedule[index - 1]?.cue);
    }
  });

  it("provides reviewed caption text for each cue", () => {
    expect(Object.values(ROOM_AMBIENCE_CUES)).toHaveLength(3);
    expect(ROOM_AMBIENCE_CUES.receiver_relay.captionPriority).toBe("significant");
    for (const cue of Object.values(ROOM_AMBIENCE_CUES)) {
      expect(cue.caption).toMatch(/^\[.+\.\]$/);
    }
  });

  it("lowers the steady bed for low effects and reduced motion", () => {
    expect(roomAmbienceGain("full", false)).toBeGreaterThan(roomAmbienceGain("low", false));
    expect(roomAmbienceGain("full", false)).toBeGreaterThan(roomAmbienceGain("full", true));
  });
});

describe("room ambience lifecycle", () => {
  let fakeWindow: EventTarget;
  let fakeDocument: FakeDocument;

  beforeEach(() => {
    fakeWindow = new EventTarget();
    fakeDocument = new FakeDocument();
    vi.useFakeTimers();
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", fakeDocument);
    vi.stubGlobal("AudioContext", FakeAudioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps a single cue timer and suspends it for every quieting condition", async () => {
    const heard: RoomAmbienceCue[] = [];
    const ambience = createRoomAmbience({ seed: "lifecycle", onCue: (cue) => heard.push(cue) });

    expect(vi.getTimerCount()).toBe(0);
    fakeWindow.dispatchEvent(new Event("pointerdown"));
    await settlePromises();
    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersToNextTimerAsync();
    expect(heard).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(1);

    ambience.setReducedMotion(true);
    expect(ambience.isReducedMotion()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    ambience.setReducedMotion(false);
    expect(vi.getTimerCount()).toBe(1);

    ambience.setEffectsLevel("low");
    expect(ambience.getEffectsLevel()).toBe("low");
    expect(vi.getTimerCount()).toBe(0);
    ambience.setEffectsLevel("full");
    expect(vi.getTimerCount()).toBe(1);

    ambience.pause();
    expect(ambience.isPaused()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    ambience.resume();
    await settlePromises();
    expect(vi.getTimerCount()).toBe(1);

    fakeDocument.hidden = true;
    fakeDocument.dispatchEvent(new Event("visibilitychange"));
    expect(vi.getTimerCount()).toBe(0);
    fakeDocument.hidden = false;
    fakeDocument.dispatchEvent(new Event("visibilitychange"));
    await settlePromises();
    expect(vi.getTimerCount()).toBe(1);

    ambience.setEnabled(false);
    expect(ambience.isEnabled()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    ambience.setEnabled(true);
    await settlePromises();
    expect(vi.getTimerCount()).toBe(1);

    ambience.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});
