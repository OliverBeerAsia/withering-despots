import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ambientMusicGain, createAmbientMusic } from "../../src/audio/AmbientMusic";

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

  constructor(private readonly onStart: () => void) {
    super();
  }

  start(): void {
    this.onStart();
  }

  stop(): void {}
}

class FakeBufferSourceNode extends FakeAudioNode {
  buffer: AudioBuffer | null = null;
  loop = false;

  start(): void {}
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

let latestContext: FakeAudioContext | null = null;

class FakeAudioContext {
  state: AudioContextState = "suspended";
  readonly currentTime = 0;
  readonly sampleRate = 20;
  readonly destination = new FakeAudioNode();
  oscillatorStarts = 0;

  createGain(): GainNode {
    return new FakeGainNode() as unknown as GainNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    return new FakeBiquadFilterNode() as unknown as BiquadFilterNode;
  }

  createOscillator(): OscillatorNode {
    return new FakeOscillatorNode(() => {
      this.oscillatorStarts += 1;
    }) as unknown as OscillatorNode;
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

function createFakeAudioContext(): FakeAudioContext {
  const context = new FakeAudioContext();
  latestContext = context;
  return context;
}

class FakeDocument extends EventTarget {
  hidden = false;
}

async function settlePromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("ambient music lifecycle", () => {
  let fakeWindow: EventTarget;
  let fakeDocument: FakeDocument;

  beforeEach(() => {
    latestContext = null;
    fakeWindow = new EventTarget();
    fakeDocument = new FakeDocument();
    vi.useFakeTimers();
    vi.stubGlobal("window", fakeWindow);
    vi.stubGlobal("document", fakeDocument);
    vi.stubGlobal("AudioContext", createFakeAudioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps user preference separate from the authoritative scene mode", () => {
    expect(ambientMusicGain("instrumental_low")).toBeGreaterThan(ambientMusicGain("lowered"));
    expect(ambientMusicGain("silent")).toBe(0);

    const music = createAmbientMusic();
    expect(music.getMode()).toBe("instrumental_low");
    music.setMode("lowered");
    expect(music.getMode()).toBe("lowered");
    music.setEnabled(false);
    expect(music.isEnabled()).toBe(false);
    expect(music.getMode()).toBe("lowered");
    music.setMode("silent");
    music.setEnabled(true);
    expect(music.isEnabled()).toBe(true);
    expect(music.getMode()).toBe("silent");
    music.dispose();
  });

  it("does not let setEnabled resurrect a scene placed in silent mode", async () => {
    const music = createAmbientMusic();
    fakeWindow.dispatchEvent(new Event("pointerdown"));
    await settlePromises();
    expect(vi.getTimerCount()).toBe(1);

    music.setMode("silent");
    expect(vi.getTimerCount()).toBe(0);
    music.setEnabled(false);
    music.setEnabled(true);
    await settlePromises();
    expect(music.getMode()).toBe("silent");
    expect(vi.getTimerCount()).toBe(0);
    music.dispose();
  });

  it("keeps one authored scheduling timer across pause and repeated resume calls", async () => {
    const music = createAmbientMusic();
    fakeWindow.dispatchEvent(new Event("pointerdown"));
    await settlePromises();

    const context = latestContext;
    expect(context).not.toBeNull();
    if (context === null) {
      return;
    }
    const firstCueStarts = context.oscillatorStarts;
    expect(firstCueStarts).toBeGreaterThan(1);
    expect(vi.getTimerCount()).toBe(1);

    music.pause();
    expect(music.isPaused()).toBe(true);
    expect(vi.getTimerCount()).toBe(0);

    music.resume();
    music.resume();
    await settlePromises();
    expect(music.isPaused()).toBe(false);
    expect(context.oscillatorStarts - firstCueStarts).toBe(firstCueStarts - 1);
    expect(vi.getTimerCount()).toBe(1);

    music.setMode("lowered");
    expect(vi.getTimerCount()).toBe(1);
    music.setMode("silent");
    expect(vi.getTimerCount()).toBe(0);
    expect(context.state).toBe("suspended");
    const startsBeforeModeResume = context.oscillatorStarts;
    music.setMode("instrumental_low");
    music.setMode("instrumental_low");
    await settlePromises();
    expect(context.state).toBe("running");
    expect(context.oscillatorStarts).toBeGreaterThan(startsBeforeModeResume);
    expect(vi.getTimerCount()).toBe(1);

    music.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });
});
