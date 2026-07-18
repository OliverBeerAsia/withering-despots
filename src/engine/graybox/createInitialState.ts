import { GRAYBOX_PATRON_IDS, GRAYBOX_SCHEDULED_EVENTS, GRAYBOX_START_MINUTE } from "./content";
import type { GrayboxPatronState, GrayboxState, PatronId } from "./types";

function createPatronState(): GrayboxPatronState {
  return {
    observed: false,
    exchangeMark: "none",
    composure: 0,
    intoxication: 0,
  };
}

function createPatrons(): Record<PatronId, GrayboxPatronState> {
  return {
    [GRAYBOX_PATRON_IDS[0]]: createPatronState(),
    [GRAYBOX_PATRON_IDS[1]]: createPatronState(),
    [GRAYBOX_PATRON_IDS[2]]: createPatronState(),
    [GRAYBOX_PATRON_IDS[3]]: createPatronState(),
  };
}

export function createInitialGrayboxState(): GrayboxState {
  return {
    step: "inspect-room",
    clockMinutes: GRAYBOX_START_MINUTE,
    currentFocus: null,
    roomInspected: false,
    patrons: createPatrons(),
    television: "untuned",
    telephone: "idle",
    attention: {
      id: "television-or-telephone",
      status: "dormant",
      selected: null,
      televisionOutcome: "pending",
      telephoneOutcome: "pending",
    },
    scheduledEvents: GRAYBOX_SCHEDULED_EVENTS.map((event) => ({ ...event })),
    uiMode: "playing",
    debugVisible: false,
    completedAt: null,
    lastCommittedTransaction: null,
  };
}
