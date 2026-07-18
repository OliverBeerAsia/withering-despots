import {
  GRAYBOX_END_MINUTE,
  GRAYBOX_EXCHANGE_PATRON_ID,
  GRAYBOX_PATRON_IDS,
  GRAYBOX_SERVICE_PATRON_ID,
  GRAYBOX_START_MINUTE,
} from "./content";
import type {
  GrayboxCommand,
  GrayboxDispatchResult,
  GrayboxEffect,
  GrayboxGameplayCommand,
  GrayboxRejectionReason,
  GrayboxScheduledEvent,
  GrayboxState,
  GrayboxUiCommand,
  PatronId,
} from "./types";

interface EffectResolution {
  readonly ok: true;
  readonly effects: readonly GrayboxEffect[];
}

interface EffectRejection {
  readonly ok: false;
  readonly reason: GrayboxRejectionReason;
}

type ResolveResult = EffectResolution | EffectRejection;

function reject(state: GrayboxState, reason: GrayboxRejectionReason): GrayboxDispatchResult {
  return { ok: false, state, reason };
}

function isGameplayCommand(command: GrayboxCommand): command is GrayboxGameplayCommand {
  return (
    command.type === "observe" ||
    command.type === "speak" ||
    command.type === "serve" ||
    command.type === "tune" ||
    command.type === "select-attention" ||
    command.type === "wait"
  );
}

function isPatronId(target: string): target is PatronId {
  return GRAYBOX_PATRON_IDS.some((patronId) => patronId === target);
}

function allPatronsObservedAfter(state: GrayboxState, patronId: PatronId): boolean {
  return GRAYBOX_PATRON_IDS.every(
    (candidateId) => candidateId === patronId || state.patrons[candidateId].observed,
  );
}

function resolveGameplayCommand(
  state: GrayboxState,
  command: GrayboxGameplayCommand,
): ResolveResult {
  if (state.step === "complete") {
    return { ok: false, reason: "already-completed" };
  }

  switch (command.type) {
    case "observe": {
      if (state.step === "inspect-room") {
        if (command.target !== "room") {
          return { ok: false, reason: "invalid-target" };
        }

        return {
          ok: true,
          effects: [
            { type: "mark-room-inspected" },
            { type: "advance-clock", minutes: 1, reason: "observe room" },
            { type: "set-step", step: "observe-patrons" },
          ],
        };
      }

      if (state.step !== "observe-patrons") {
        return { ok: false, reason: "step-mismatch" };
      }

      if (!isPatronId(command.target) || state.patrons[command.target].observed) {
        return { ok: false, reason: "invalid-target" };
      }

      const effects: GrayboxEffect[] = [
        { type: "mark-patron-observed", patronId: command.target },
        { type: "advance-clock", minutes: 1, reason: `observe ${command.target}` },
      ];

      if (allPatronsObservedAfter(state, command.target)) {
        effects.push({ type: "set-step", step: "exchange" });
      }

      return { ok: true, effects };
    }

    case "speak":
      if (state.step !== "exchange") {
        return { ok: false, reason: "step-mismatch" };
      }
      if (command.target !== GRAYBOX_EXCHANGE_PATRON_ID) {
        return { ok: false, reason: "invalid-target" };
      }
      return {
        ok: true,
        effects: [
          {
            type: "record-exchange",
            patronId: command.target,
            outcome: command.response,
          },
          { type: "advance-clock", minutes: 1, reason: `speak: ${command.response}` },
          { type: "set-step", step: "serve" },
        ],
      };

    case "serve":
      if (state.step !== "serve") {
        return { ok: false, reason: "step-mismatch" };
      }
      if (command.target !== GRAYBOX_SERVICE_PATRON_ID) {
        return { ok: false, reason: "invalid-target" };
      }
      return {
        ok: true,
        effects: [
          { type: "record-service", patronId: command.target, drink: command.drink },
          { type: "advance-clock", minutes: 1, reason: `serve ${command.drink}` },
          { type: "set-step", step: "tune" },
        ],
      };

    case "tune":
      if (state.step !== "tune") {
        return { ok: false, reason: "step-mismatch" };
      }
      return {
        ok: true,
        effects: [
          { type: "set-television-tuned" },
          { type: "advance-clock", minutes: 1, reason: "tune television" },
        ],
      };

    case "select-attention":
      if (state.step !== "attention" || state.attention.status !== "open") {
        return { ok: false, reason: "step-mismatch" };
      }
      return {
        ok: true,
        effects: [
          { type: "resolve-attention", selected: command.offer },
          { type: "advance-clock", minutes: 1, reason: `attend to ${command.offer}` },
          { type: "set-step", step: "wait" },
        ],
      };

    case "wait":
      if (state.step !== "wait") {
        return { ok: false, reason: "step-mismatch" };
      }
      return {
        ok: true,
        effects: [{ type: "advance-clock", minutes: 1, reason: "wait" }],
      };
  }
}

function updatePatron(
  state: GrayboxState,
  patronId: PatronId,
  update: (patron: GrayboxState["patrons"][PatronId]) => GrayboxState["patrons"][PatronId],
): GrayboxState {
  return {
    ...state,
    patrons: {
      ...state.patrons,
      [patronId]: update(state.patrons[patronId]),
    },
  };
}

function applyEffect(state: GrayboxState, effect: GrayboxEffect): GrayboxState {
  switch (effect.type) {
    case "advance-clock": {
      const nextMinute = state.clockMinutes + effect.minutes;
      if (nextMinute > GRAYBOX_END_MINUTE) {
        throw new Error("Graybox clock cannot advance beyond its ten-minute boundary.");
      }
      return { ...state, clockMinutes: nextMinute };
    }

    case "mark-room-inspected":
      return { ...state, roomInspected: true };

    case "mark-patron-observed":
      return updatePatron(state, effect.patronId, (patron) => ({ ...patron, observed: true }));

    case "record-exchange":
      return updatePatron(state, effect.patronId, (patron) => ({
        ...patron,
        exchangeMark: effect.outcome === "answer" ? "answered" : "silence",
      }));

    case "record-service":
      return updatePatron(state, effect.patronId, (patron) => ({
        ...patron,
        composure: effect.drink === "tea" ? 1 : 0,
        intoxication: effect.drink === "vodka" ? 1 : 0,
      }));

    case "set-television-tuned":
      return { ...state, television: "tuned" };

    case "set-telephone-ringing":
      return { ...state, telephone: "ringing" };

    case "open-attention":
      return {
        ...state,
        attention: { ...state.attention, status: "open" },
      };

    case "resolve-attention":
      return {
        ...state,
        attention: {
          ...state.attention,
          status: "resolved",
          selected: effect.selected,
          televisionOutcome: effect.selected === "television" ? "direct" : "missed",
          telephoneOutcome: effect.selected === "telephone" ? "direct" : "missed",
        },
      };

    case "fire-event":
      return {
        ...state,
        scheduledEvents: state.scheduledEvents.map((event) =>
          event.id === effect.eventId ? { ...event, status: "fired" } : event,
        ),
      };

    case "set-step":
      return { ...state, step: effect.step };

    case "complete-graybox":
      return { ...state, step: "complete", completedAt: effect.atMinute };
  }
}

function eventEffects(event: GrayboxScheduledEvent, state: GrayboxState): readonly GrayboxEffect[] {
  switch (event.id) {
    case "phone-rings":
      return [
        { type: "fire-event", eventId: event.id },
        { type: "set-telephone-ringing" },
        { type: "open-attention" },
        { type: "set-step", step: "attention" },
      ];
    case "graybox-ends":
      return [
        { type: "fire-event", eventId: event.id },
        { type: "complete-graybox", atMinute: state.clockMinutes },
      ];
  }
}

function applyDueEvents(
  initialState: GrayboxState,
  initialEffects: readonly GrayboxEffect[],
): { readonly state: GrayboxState; readonly effects: readonly GrayboxEffect[] } {
  let state = initialState;
  const effects = [...initialEffects];
  const dueEvents = state.scheduledEvents
    .filter((event) => event.status === "pending" && event.dueMinute <= state.clockMinutes)
    .toSorted(
      (left, right) =>
        left.dueMinute - right.dueMinute ||
        left.priority - right.priority ||
        left.id.localeCompare(right.id),
    );

  for (const event of dueEvents) {
    const resolvedEffects = eventEffects(event, state);
    for (const effect of resolvedEffects) {
      state = applyEffect(state, effect);
      effects.push(effect);
    }
  }

  return { state, effects };
}

function assertStateInvariants(state: GrayboxState): void {
  if (state.clockMinutes < GRAYBOX_START_MINUTE || state.clockMinutes > GRAYBOX_END_MINUTE) {
    throw new Error("Graybox clock is outside its deterministic ten-minute range.");
  }

  if (state.attention.status === "resolved") {
    const outcomes = [state.attention.televisionOutcome, state.attention.telephoneOutcome];
    if (
      state.attention.selected === null ||
      outcomes.filter((outcome) => outcome === "direct").length !== 1 ||
      outcomes.filter((outcome) => outcome === "missed").length !== 1
    ) {
      throw new Error("A resolved attention window must have one direct and one missed outcome.");
    }
  }

  if (state.step === "complete") {
    const endEvent = state.scheduledEvents.find((event) => event.id === "graybox-ends");
    if (
      state.clockMinutes !== GRAYBOX_END_MINUTE ||
      state.completedAt !== GRAYBOX_END_MINUTE ||
      endEvent?.status !== "fired"
    ) {
      throw new Error("Graybox completion must occur at 19:25 after the end event fires.");
    }
  }
}

function dispatchUiCommand(state: GrayboxState, command: GrayboxUiCommand): GrayboxDispatchResult {
  switch (command.type) {
    case "set-focus":
      return { ok: true, state: { ...state, currentFocus: command.target } };
    case "toggle-debug":
      return { ok: true, state: { ...state, debugVisible: !state.debugVisible } };
    case "toggle-pause":
      if (state.uiMode === "settings") {
        return reject(state, "invalid-ui-transition");
      }
      return {
        ok: true,
        state: { ...state, uiMode: state.uiMode === "playing" ? "paused" : "playing" },
      };
    case "open-settings":
      if (state.uiMode !== "paused") {
        return reject(state, "invalid-ui-transition");
      }
      return { ok: true, state: { ...state, uiMode: "settings" } };
    case "close-settings":
      if (state.uiMode !== "settings") {
        return reject(state, "invalid-ui-transition");
      }
      return { ok: true, state: { ...state, uiMode: "paused" } };
  }
}

export function dispatchGrayboxCommand(
  state: GrayboxState,
  command: GrayboxCommand,
): GrayboxDispatchResult {
  if (!isGameplayCommand(command)) {
    return dispatchUiCommand(state, command);
  }

  if (state.uiMode !== "playing") {
    return reject(state, "gameplay-disabled");
  }

  const resolution = resolveGameplayCommand(state, command);
  if (!resolution.ok) {
    return reject(state, resolution.reason);
  }

  const advanceEffects = resolution.effects.filter((effect) => effect.type === "advance-clock");
  if (advanceEffects.length !== 1 || advanceEffects[0]?.minutes !== 1) {
    throw new Error("Every committed graybox gameplay command must advance exactly one minute.");
  }

  let nextState = state;
  for (const effect of resolution.effects) {
    nextState = applyEffect(nextState, effect);
  }

  const scheduled = applyDueEvents(nextState, resolution.effects);
  nextState = scheduled.state;
  assertStateInvariants(nextState);

  nextState = {
    ...nextState,
    lastCommittedTransaction: {
      sequence: nextState.clockMinutes - GRAYBOX_START_MINUTE,
      command,
      effects: scheduled.effects,
      clockBefore: state.clockMinutes,
      clockAfter: nextState.clockMinutes,
    },
  };

  return { ok: true, state: nextState };
}
