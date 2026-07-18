import type { GrayboxScheduledEvent, PatronId } from "./types";

export const GRAYBOX_START_MINUTE = 19 * 60 + 15;
export const GRAYBOX_END_MINUTE = GRAYBOX_START_MINUTE + 10;

export const GRAYBOX_PATRON_IDS = [
  "patron-north",
  "patron-east",
  "patron-south",
  "patron-west",
] as const satisfies readonly PatronId[];

export const GRAYBOX_EXCHANGE_PATRON_ID: PatronId = "patron-east";
export const GRAYBOX_SERVICE_PATRON_ID: PatronId = "patron-south";

export const GRAYBOX_SCHEDULED_EVENTS = [
  {
    id: "phone-rings",
    dueMinute: GRAYBOX_START_MINUTE + 8,
    priority: 10,
    status: "pending",
  },
  {
    id: "graybox-ends",
    dueMinute: GRAYBOX_END_MINUTE,
    priority: 10,
    status: "pending",
  },
] as const satisfies readonly GrayboxScheduledEvent[];
