import {
  GRAYBOX_END_MINUTE,
  GRAYBOX_EXCHANGE_PATRON_ID,
  GRAYBOX_PATRON_IDS,
  GRAYBOX_SERVICE_PATRON_ID,
  GRAYBOX_START_MINUTE,
} from "./content";
import type {
  AttentionOfferId,
  DrinkChoice,
  ExchangeOutcome,
  GrayboxScheduledEvent,
  GrayboxState,
  InteractionVerb,
} from "./types";

export interface GrayboxCompletionSummary {
  readonly completedAt: number;
  readonly elapsedMinutes: 10;
  readonly exchangeOutcome: ExchangeOutcome;
  readonly servedDrink: DrinkChoice;
  readonly attentionSelection: AttentionOfferId;
  readonly completedVerbs: readonly InteractionVerb[];
}

export type GrayboxSashaAnchorId =
  "anchor-sasha-bar" | "anchor-sasha-television" | "anchor-sasha-telephone";

export function selectObservedPatronCount(state: GrayboxState): number {
  return GRAYBOX_PATRON_IDS.filter((patronId) => state.patrons[patronId].observed).length;
}

export function selectPendingScheduledEvents(
  state: GrayboxState,
): readonly GrayboxScheduledEvent[] {
  return state.scheduledEvents
    .filter((event) => event.status === "pending")
    .toSorted(
      (left, right) =>
        left.dueMinute - right.dueMinute ||
        left.priority - right.priority ||
        left.id.localeCompare(right.id),
    );
}

export function selectClockLabel(state: GrayboxState): string {
  const hours = Math.floor(state.clockMinutes / 60);
  const minutes = state.clockMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function selectSashaAnchorId(state: GrayboxState): GrayboxSashaAnchorId {
  if (state.attention.selected === "telephone") {
    return "anchor-sasha-telephone";
  }

  if (
    state.step === "tune" ||
    state.attention.status === "open" ||
    state.attention.selected === "television"
  ) {
    return "anchor-sasha-television";
  }

  return "anchor-sasha-bar";
}

export function selectCompletionSummary(state: GrayboxState): GrayboxCompletionSummary | null {
  if (state.step !== "complete") {
    return null;
  }

  const exchangeMark = state.patrons[GRAYBOX_EXCHANGE_PATRON_ID].exchangeMark;
  const servedPatron = state.patrons[GRAYBOX_SERVICE_PATRON_ID];
  const exchangeOutcome =
    exchangeMark === "answered" ? "answer" : exchangeMark === "silence" ? "silence" : null;
  const servedDrink =
    servedPatron.composure === 1 ? "tea" : servedPatron.intoxication === 1 ? "vodka" : null;

  if (
    state.completedAt !== GRAYBOX_END_MINUTE ||
    state.clockMinutes - GRAYBOX_START_MINUTE !== 10 ||
    exchangeOutcome === null ||
    servedDrink === null ||
    state.attention.selected === null
  ) {
    throw new Error("Completed graybox state is missing a required sequence outcome.");
  }

  return {
    completedAt: state.completedAt,
    elapsedMinutes: 10,
    exchangeOutcome,
    servedDrink,
    attentionSelection: state.attention.selected,
    completedVerbs: ["observe", "speak", "serve", "tune", "wait"],
  };
}
