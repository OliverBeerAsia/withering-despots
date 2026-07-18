export type GrayboxStep =
  | "inspect-room"
  | "observe-patrons"
  | "exchange"
  | "serve"
  | "tune"
  | "attention"
  | "wait"
  | "complete";

export type InteractionVerb = "observe" | "speak" | "serve" | "tune" | "wait";

export type PatronId = "patron-north" | "patron-east" | "patron-south" | "patron-west";

export type AttentionOfferId = "television" | "telephone";

export type FocusTargetId =
  "room" | PatronId | "counter-tea" | "counter-vodka" | AttentionOfferId | "wait-control";

export type ExchangeOutcome = "answer" | "silence";
export type DrinkChoice = "tea" | "vodka";
export type UiMode = "playing" | "paused" | "settings";
export type ScheduledEventId = "phone-rings" | "graybox-ends";

export interface GrayboxPatronState {
  readonly observed: boolean;
  readonly exchangeMark: "none" | "answered" | "silence";
  readonly composure: 0 | 1;
  readonly intoxication: 0 | 1;
}

export interface GrayboxAttentionState {
  readonly id: "television-or-telephone";
  readonly status: "dormant" | "open" | "resolved";
  readonly selected: AttentionOfferId | null;
  readonly televisionOutcome: "pending" | "direct" | "missed";
  readonly telephoneOutcome: "pending" | "direct" | "missed";
}

export interface GrayboxScheduledEvent {
  readonly id: ScheduledEventId;
  readonly dueMinute: number;
  readonly priority: number;
  readonly status: "pending" | "fired";
}

export interface ObserveCommand {
  readonly type: "observe";
  readonly target: "room" | PatronId;
}

export interface SpeakCommand {
  readonly type: "speak";
  readonly target: PatronId;
  readonly response: ExchangeOutcome;
}

export interface ServeCommand {
  readonly type: "serve";
  readonly target: PatronId;
  readonly drink: DrinkChoice;
}

export interface TuneCommand {
  readonly type: "tune";
  readonly target: "television";
}

export interface SelectAttentionCommand {
  readonly type: "select-attention";
  readonly offer: AttentionOfferId;
}

export interface WaitCommand {
  readonly type: "wait";
}

export type GrayboxGameplayCommand =
  ObserveCommand | SpeakCommand | ServeCommand | TuneCommand | SelectAttentionCommand | WaitCommand;

export type GrayboxUiCommand =
  | { readonly type: "set-focus"; readonly target: FocusTargetId | null }
  | { readonly type: "toggle-pause" }
  | { readonly type: "open-settings" }
  | { readonly type: "close-settings" }
  | { readonly type: "toggle-debug" };

export type GrayboxCommand = GrayboxGameplayCommand | GrayboxUiCommand;

export type GrayboxEffect =
  | { readonly type: "advance-clock"; readonly minutes: 1; readonly reason: string }
  | { readonly type: "mark-room-inspected" }
  | { readonly type: "mark-patron-observed"; readonly patronId: PatronId }
  | {
      readonly type: "record-exchange";
      readonly patronId: PatronId;
      readonly outcome: ExchangeOutcome;
    }
  | {
      readonly type: "record-service";
      readonly patronId: PatronId;
      readonly drink: DrinkChoice;
    }
  | { readonly type: "set-television-tuned" }
  | { readonly type: "set-telephone-ringing" }
  | { readonly type: "open-attention" }
  | { readonly type: "resolve-attention"; readonly selected: AttentionOfferId }
  | { readonly type: "fire-event"; readonly eventId: ScheduledEventId }
  | { readonly type: "set-step"; readonly step: GrayboxStep }
  | { readonly type: "complete-graybox"; readonly atMinute: number };

export interface GrayboxTransaction {
  readonly sequence: number;
  readonly command: GrayboxGameplayCommand;
  readonly effects: readonly GrayboxEffect[];
  readonly clockBefore: number;
  readonly clockAfter: number;
}

export interface GrayboxState {
  readonly step: GrayboxStep;
  readonly clockMinutes: number;
  readonly currentFocus: FocusTargetId | null;
  readonly roomInspected: boolean;
  readonly patrons: Readonly<Record<PatronId, GrayboxPatronState>>;
  readonly television: "untuned" | "tuned";
  readonly telephone: "idle" | "ringing";
  readonly attention: GrayboxAttentionState;
  readonly scheduledEvents: readonly GrayboxScheduledEvent[];
  readonly uiMode: UiMode;
  readonly debugVisible: boolean;
  readonly completedAt: number | null;
  readonly lastCommittedTransaction: GrayboxTransaction | null;
}

export type GrayboxRejectionReason =
  | "gameplay-disabled"
  | "step-mismatch"
  | "invalid-target"
  | "already-completed"
  | "invalid-ui-transition";

export type GrayboxDispatchResult =
  | { readonly ok: true; readonly state: GrayboxState }
  | {
      readonly ok: false;
      readonly state: GrayboxState;
      readonly reason: GrayboxRejectionReason;
    };
