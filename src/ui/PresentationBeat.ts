export type PacingPreference = "full" | "brief" | "immediate";

export const BRIEF_HOLD_CAP_MS = 5000;

export function resolvePresentationHoldMs(
  authoredHoldMs: number,
  preference: PacingPreference,
): number {
  if (preference === "immediate") {
    return 0;
  }
  return preference === "brief" ? Math.min(authoredHoldMs, BRIEF_HOLD_CAP_MS) : authoredHoldMs;
}

export interface PresentationBeatScheduler<TimerHandle> {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): TimerHandle;
  clearTimeout(handle: TimerHandle): void;
}

/**
 * One skippable presentation-only hold. It owns no narrative state, so natural
 * completion, skipping, pausing, and resuming cannot move the game clock.
 */
export class PresentationBeat<TimerHandle> {
  private timer: TimerHandle | null = null;
  private completion: (() => void) | null = null;
  private remainingMs = 0;
  private startedAtMs = 0;
  private paused = false;

  public constructor(private readonly scheduler: PresentationBeatScheduler<TimerHandle>) {}

  public start(durationMs: number, onComplete: () => void): void {
    this.cancel();
    if (durationMs <= 0) {
      onComplete();
      return;
    }
    this.completion = onComplete;
    this.remainingMs = durationMs;
    this.paused = false;
    this.schedule();
  }

  public cancel(): void {
    this.clearTimer();
    this.completion = null;
    this.remainingMs = 0;
    this.paused = false;
  }

  public skip(): boolean {
    if (this.completion === null) {
      return false;
    }
    this.finish();
    return true;
  }

  public pause(): void {
    if (this.completion === null || this.paused) {
      return;
    }
    this.refreshRemaining();
    this.clearTimer();
    this.paused = true;
  }

  public resume(): void {
    if (this.completion === null || !this.paused) {
      return;
    }
    this.paused = false;
    if (this.remainingMs <= 0) {
      this.finish();
    } else {
      this.schedule();
    }
  }

  public capRemaining(maximumMs: number): void {
    if (this.completion === null) {
      return;
    }
    if (!this.paused) {
      this.refreshRemaining();
    }
    this.remainingMs = Math.min(this.remainingMs, Math.max(0, maximumMs));
    if (this.remainingMs <= 0) {
      this.finish();
    } else if (!this.paused) {
      this.clearTimer();
      this.schedule();
    }
  }

  public isActive(): boolean {
    return this.completion !== null;
  }

  public isPaused(): boolean {
    return this.completion !== null && this.paused;
  }

  public getRemainingMs(): number {
    if (this.completion === null) {
      return 0;
    }
    if (this.paused) {
      return this.remainingMs;
    }
    return Math.max(0, this.remainingMs - (this.scheduler.now() - this.startedAtMs));
  }

  private schedule(): void {
    this.startedAtMs = this.scheduler.now();
    this.timer = this.scheduler.setTimeout(() => {
      this.timer = null;
      this.finish();
    }, this.remainingMs);
  }

  private refreshRemaining(): void {
    if (this.timer === null) {
      return;
    }
    const elapsed = Math.max(0, this.scheduler.now() - this.startedAtMs);
    this.remainingMs = Math.max(0, this.remainingMs - elapsed);
    this.startedAtMs = this.scheduler.now();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      this.scheduler.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private finish(): void {
    this.clearTimer();
    const pending = this.completion;
    this.completion = null;
    this.remainingMs = 0;
    this.paused = false;
    pending?.();
  }
}
