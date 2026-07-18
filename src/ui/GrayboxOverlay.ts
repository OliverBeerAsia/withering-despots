import type { GrayboxController } from "../app/GrayboxController";
import { GRAYBOX_LAYOUT } from "../content-types/GrayboxLayout";
import { GRAYBOX_PATRON_IDS } from "../engine/graybox/content";
import { selectSashaAnchorId } from "../engine/graybox/selectors";
import type {
  FocusTargetId,
  GrayboxCommand,
  GrayboxState,
  GrayboxTransaction,
  InteractionVerb,
  PatronId,
} from "../engine/graybox/types";

const PATRON_LABELS: Readonly<Record<PatronId, string>> = {
  "patron-north": "North table patron",
  "patron-east": "East table patron",
  "patron-south": "South table patron",
  "patron-west": "West table patron",
};

const STEP_COPY: Readonly<
  Record<
    GrayboxState["step"],
    {
      readonly objective: string;
      readonly factLabel: "Verb" | "Mode" | "State";
      readonly factValue: string;
    }
  >
> = {
  "inspect-room": { objective: "Inspect the room", factLabel: "Verb", factValue: "Observe" },
  "observe-patrons": {
    objective: "Observe all four patrons",
    factLabel: "Verb",
    factValue: "Observe",
  },
  exchange: {
    objective: "Answer briefly or remain silent",
    factLabel: "Verb",
    factValue: "Speak",
  },
  serve: { objective: "Serve tea or vodka", factLabel: "Verb", factValue: "Serve" },
  tune: { objective: "Tune the television", factLabel: "Verb", factValue: "Tune" },
  attention: {
    objective: "The television and telephone compete",
    factLabel: "Mode",
    factValue: "Attention",
  },
  wait: { objective: "Let the room move", factLabel: "Verb", factValue: "Wait" },
  complete: { objective: "The ten-minute scene is over", factLabel: "State", factValue: "Ended" },
};

function setText(element: HTMLElement, text: string): HTMLElement {
  element.textContent = text;
  return element;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className !== undefined) {
    element.className = className;
  }
  return element;
}

function formatClock(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${remainder}`;
}

function describeTransaction(transaction: GrayboxTransaction | null): string {
  if (transaction === null) {
    return "None";
  }

  const effectNames = transaction.effects.map((effect) => effect.type).join(", ");
  return `#${String(transaction.sequence)} ${transaction.command.type}; ${formatClock(
    transaction.clockBefore,
  )} to ${formatClock(transaction.clockAfter)}; effects: ${effectNames}`;
}

function appendDiagnostic(list: HTMLDListElement, label: string, value: string): void {
  const term = createElement("dt");
  const description = createElement("dd");
  setText(term, label);
  setText(description, value);
  list.append(term, description);
}

function getHotspot(id: string) {
  const hotspot = GRAYBOX_LAYOUT.hotspots.find((candidate) => candidate.id === id);
  if (hotspot === undefined) {
    throw new Error(`Missing graybox hotspot: ${id}`);
  }
  return hotspot;
}

function positionAtHotspot(element: HTMLElement, hotspotId: string): void {
  const hotspot = getHotspot(hotspotId);
  const width = GRAYBOX_LAYOUT.logicalStage.width;
  const height = GRAYBOX_LAYOUT.logicalStage.height;
  element.style.left = `${String((hotspot.x / width) * 100)}%`;
  element.style.top = `${String((hotspot.y / height) * 100)}%`;
  element.style.width = `${String((hotspot.width / width) * 100)}%`;
  element.style.height = `${String((hotspot.height / height) * 100)}%`;
}

function requireHotspotVerb(hotspotId: string, verb: InteractionVerb): void {
  if (!getHotspot(hotspotId).supportedVerbs.includes(verb)) {
    throw new Error(`${hotspotId} does not support ${verb}.`);
  }
}

function createActionButton(
  label: string,
  testId: string,
  focusKey: string,
  onActivate: () => void,
): HTMLButtonElement {
  const button = createElement("button", "choice-button");
  button.type = "button";
  button.dataset.testid = testId;
  button.dataset.focusKey = focusKey;
  setText(button, label);
  button.addEventListener("click", onActivate);
  return button;
}

function summaryValue(state: GrayboxState): string {
  const exchange = state.patrons["patron-east"].exchangeMark;
  const served = state.patrons["patron-south"];
  const drink = served.composure === 1 ? "tea" : served.intoxication === 1 ? "vodka" : "nothing";
  const attention = state.attention.selected ?? "nothing";
  return `Observe, Speak, Serve, Tune, and Wait all completed. Exchange: ${exchange}. Served: ${drink}. Followed: ${attention}.`;
}

export function createGrayboxOverlay(controller: GrayboxController): HTMLElement {
  const overlay = createElement("section", "semantic-overlay graybox-overlay");
  const renderRoot = createElement("div", "overlay-render-root");
  const liveStatus = createElement("p", "game-announcement visually-hidden");
  overlay.setAttribute("aria-label", "Game controls");
  liveStatus.setAttribute("role", "status");
  liveStatus.setAttribute("aria-live", "polite");
  liveStatus.setAttribute("aria-atomic", "true");
  overlay.append(renderRoot, liveStatus);

  let announcement = "Inspect the room to begin.";
  let pendingFocusKey: string | null = null;
  let lastGameplayFocusKey = "hotspot-room";
  let renderVersion = 0;
  let largeText = false;
  let highContrast = false;
  let reduceMotion = false;
  let pointerFocusInProgress = false;

  function focusAfterRender(focusKey: string | null, version: number): void {
    if (focusKey === null) {
      return;
    }

    window.setTimeout(() => {
      if (version !== renderVersion) {
        return;
      }
      overlay
        .querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`)
        ?.focus({ preventScroll: true });
    }, 0);
  }

  function dispatch(command: GrayboxCommand, message: string, focusKey?: string): void {
    announcement = message;
    if (focusKey !== undefined) {
      pendingFocusKey = focusKey;
      if (!focusKey.startsWith("pause-") && !focusKey.startsWith("settings-")) {
        lastGameplayFocusKey = focusKey;
      }
    }

    const result = controller.dispatch(command);
    if (!result.ok) {
      announcement = `That action is unavailable: ${result.reason}.`;
      const failedFocusKey = pendingFocusKey;
      pendingFocusKey = null;
      render(result.state, failedFocusKey);
    }
  }

  function setFocus(target: FocusTargetId, focusKey: string): void {
    lastGameplayFocusKey = focusKey;
    if (pointerFocusInProgress) {
      return;
    }

    const state = controller.getState();
    if (state.currentFocus === target) {
      return;
    }
    pendingFocusKey = focusKey;
    controller.dispatch({ type: "set-focus", target });
  }

  function trackControlFocus(target: FocusTargetId, focusKey: string): void {
    lastGameplayFocusKey = focusKey;
    if (!pointerFocusInProgress) {
      setFocus(target, focusKey);
    }
  }

  function createHud(state: GrayboxState): HTMLElement {
    const hud = createElement("header", "graybox-hud");
    const title = createElement("h1", "visually-hidden");
    title.id = "game-title";
    setText(title, "Withering Despots");

    const eyebrow = createElement("p", "hud-eyebrow");
    setText(eyebrow, "The Shift · Evening watch");

    const objective = createElement("p", "hud-objective");
    objective.dataset.testid = "objective";
    setText(objective, STEP_COPY[state.step].objective);

    const facts = createElement("dl", "hud-facts");
    appendDiagnostic(facts, STEP_COPY[state.step].factLabel, STEP_COPY[state.step].factValue);
    const clockTerm = createElement("dt");
    const clock = createElement("dd");
    setText(clockTerm, "Clock");
    setText(clock, formatClock(state.clockMinutes));
    clock.dataset.testid = "clock";
    facts.append(clockTerm, clock);

    hud.append(title, eyebrow, objective, facts);
    return hud;
  }

  function createHotspotButton(
    state: GrayboxState,
    target: "room" | PatronId,
    label: string,
    tabIndex: number,
    onActivate: () => void,
  ): HTMLButtonElement {
    requireHotspotVerb(target, "observe");
    const button = createElement("button", "hotspot-button");
    button.type = "button";
    button.tabIndex = tabIndex;
    button.dataset.hotspotId = target;
    button.dataset.testid = `hotspot-${target}`;
    button.dataset.focusKey = `hotspot-${target}`;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-keyshortcuts", "Enter Space");
    if (state.currentFocus === target) {
      button.setAttribute("aria-current", "true");
    }
    positionAtHotspot(button, target);

    const visibleLabel = createElement("span", "hotspot-label");
    setText(visibleLabel, label);
    button.append(visibleLabel);
    button.addEventListener("focus", () => {
      trackControlFocus(target, `hotspot-${target}`);
    });
    button.addEventListener("click", onActivate);
    return button;
  }

  function createPatronHotspots(state: GrayboxState): HTMLElement {
    const layer = createElement("div", "hotspot-layer");
    layer.setAttribute("aria-label", "Patrons");
    const available = GRAYBOX_PATRON_IDS.filter((id) => !state.patrons[id].observed);
    const currentIndex = Math.max(0, available.indexOf(state.currentFocus as PatronId));

    for (const [index, patronId] of available.entries()) {
      const button = createHotspotButton(
        state,
        patronId,
        `Observe ${PATRON_LABELS[patronId].toLowerCase()}`,
        index === currentIndex ? 0 : -1,
        () => {
          const nextPatron = available[index + 1] ?? available[index - 1];
          const focusKey =
            available.length === 1 ? "action-answer" : `hotspot-${String(nextPatron)}`;
          dispatch(
            { type: "observe", target: patronId },
            `${PATRON_LABELS[patronId]} observed.`,
            focusKey,
          );
        },
      );

      button.addEventListener("keydown", (event) => {
        const direction =
          event.key === "ArrowRight" || event.key === "ArrowDown"
            ? 1
            : event.key === "ArrowLeft" || event.key === "ArrowUp"
              ? -1
              : 0;
        if (direction === 0) {
          return;
        }
        event.preventDefault();
        const nextIndex = (index + direction + available.length) % available.length;
        const next = available[nextIndex];
        if (next !== undefined) {
          setFocus(next, `hotspot-${next}`);
        }
      });
      layer.append(button);
    }

    return layer;
  }

  function createChoiceSheet(
    titleText: string,
    descriptionText: string,
    buttons: readonly HTMLButtonElement[],
  ): HTMLElement {
    const sheet = createElement("section", "choice-sheet");
    const heading = createElement("h2");
    const description = createElement("p", "choice-description");
    const choices = createElement("div", "choice-buttons");
    heading.id = "graybox-choice-title";
    description.id = "graybox-choice-description";
    sheet.setAttribute("aria-labelledby", heading.id);
    sheet.setAttribute("aria-describedby", description.id);
    setText(heading, titleText);
    setText(description, descriptionText);
    choices.append(...buttons);
    sheet.append(heading, description, choices);
    return sheet;
  }

  function createAttentionHotspot(
    state: GrayboxState,
    id: "television" | "telephone",
    tabIndex: number,
  ): HTMLButtonElement {
    const otherId = id === "television" ? "telephone" : "television";
    const label = id === "television" ? "Stay with the television" : "Answer the telephone";
    const button = createElement("button", "hotspot-button fixture-hotspot attention-hotspot");
    button.type = "button";
    button.tabIndex = tabIndex;
    button.dataset.hotspotId = id;
    button.dataset.testid = `hotspot-${id}`;
    button.dataset.focusKey = `hotspot-${id}`;
    button.setAttribute("aria-label", label);
    if (state.currentFocus === id) {
      button.setAttribute("aria-current", "true");
    }
    positionAtHotspot(button, id);

    const visibleLabel = createElement("span", "hotspot-label");
    setText(visibleLabel, label);
    button.append(visibleLabel);
    button.addEventListener("focus", () => {
      trackControlFocus(id, `hotspot-${id}`);
    });
    button.addEventListener("keydown", (event) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        setFocus(otherId, `hotspot-${otherId}`);
      }
    });
    button.addEventListener("click", () => {
      dispatch(
        { type: "select-attention", offer: id },
        id === "television"
          ? "You stay with the television. The phone goes unanswered."
          : "You answer the telephone. The television carries on without you.",
        "action-wait",
      );
    });
    return button;
  }

  function createStepControls(state: GrayboxState): HTMLElement {
    const controls = createElement("div", "step-controls");
    controls.dataset.step = state.step;

    switch (state.step) {
      case "inspect-room": {
        const layer = createElement("div", "hotspot-layer");
        layer.append(
          createHotspotButton(state, "room", "Observe room", 0, () => {
            dispatch({ type: "observe", target: "room" }, "Four patrons come into view.");
          }),
        );
        controls.append(layer);
        break;
      }

      case "observe-patrons":
        controls.append(createPatronHotspots(state));
        break;

      case "exchange": {
        requireHotspotVerb("patron-east", "speak");
        const answer = createActionButton(
          "Answer briefly",
          "action-answer",
          "action-answer",
          () => {
            dispatch(
              { type: "speak", target: "patron-east", response: "answer" },
              "You answer briefly.",
              "action-tea",
            );
          },
        );
        answer.addEventListener("focus", () => {
          trackControlFocus("patron-east", "action-answer");
        });
        const silence = createActionButton(
          "Remain silent",
          "action-silence",
          "action-silence",
          () => {
            dispatch(
              { type: "speak", target: "patron-east", response: "silence" },
              "You let the silence stand.",
              "action-tea",
            );
          },
        );
        silence.setAttribute("aria-keyshortcuts", "S");
        silence.addEventListener("focus", () => {
          trackControlFocus("patron-east", "action-silence");
        });
        controls.append(
          createChoiceSheet(
            "He waits for your answer",
            "The east table patron watches you. Answer briefly, or leave the silence alone.",
            [answer, silence],
          ),
        );
        break;
      }

      case "serve": {
        requireHotspotVerb("patron-south", "serve");
        const tea = createActionButton("Serve tea", "action-tea", "action-tea", () => {
          dispatch(
            { type: "serve", target: "patron-south", drink: "tea" },
            "Tea set down. The south table patron steadies.",
            "action-tune",
          );
        });
        const vodka = createActionButton("Serve vodka", "action-vodka", "action-vodka", () => {
          dispatch(
            { type: "serve", target: "patron-south", drink: "vodka" },
            "Vodka set down. The south table patron loosens.",
            "action-tune",
          );
        });
        for (const button of [tea, vodka]) {
          button.addEventListener("focus", () => {
            trackControlFocus("patron-south", button.dataset.focusKey ?? "action-tea");
          });
        }
        controls.append(
          createChoiceSheet(
            "Serve the south table",
            "Tea or vodka. He will not take them the same way.",
            [tea, vodka],
          ),
        );
        break;
      }

      case "tune": {
        requireHotspotVerb("television", "tune");
        const layer = createElement("div", "hotspot-layer");
        const wrapper = createElement("div");
        wrapper.dataset.testid = "hotspot-television";
        positionAtHotspot(wrapper, "television");
        const tune = createActionButton("Tune television", "action-tune", "action-tune", () => {
          dispatch(
            { type: "tune", target: "television" },
            "The television is tuned as the telephone begins ringing.",
            "hotspot-television",
          );
        });
        tune.classList.add("hotspot-button", "fixture-hotspot");
        tune.dataset.hotspotId = "television";
        tune.addEventListener("focus", () => {
          trackControlFocus("television", "action-tune");
        });
        wrapper.append(tune);
        layer.append(wrapper);
        controls.append(layer);
        break;
      }

      case "attention": {
        const layer = createElement("div", "hotspot-layer");
        const television = createAttentionHotspot(state, "television", 0);
        const telephone = createAttentionHotspot(state, "telephone", -1);
        const note = createElement("p", "attention-note");
        setText(note, "Choose one. The other will be missed.");
        layer.append(television, telephone);
        controls.append(layer, note);
        break;
      }

      case "wait": {
        const wait = createActionButton("Wait deliberately", "action-wait", "action-wait", () => {
          dispatch({ type: "wait" }, "You wait. The room moves on.", "completion-summary");
        });
        wait.setAttribute("aria-keyshortcuts", "W");
        wait.addEventListener("focus", () => {
          trackControlFocus("wait-control", "action-wait");
        });
        controls.append(
          createChoiceSheet("Hold back", "Let the room move without intervening.", [wait]),
        );
        break;
      }

      case "complete": {
        const summary = createElement("section", "completion-summary");
        const heading = createElement("h2");
        const outcome = createElement("p");
        summary.dataset.testid = "completion-summary";
        summary.dataset.focusKey = "completion-summary";
        summary.tabIndex = -1;
        setText(heading, "The ten-minute scene is over");
        setText(
          outcome,
          `${summaryValue(state)} The clock reached ${formatClock(
            state.completedAt ?? state.clockMinutes,
          )}.`,
        );
        summary.append(heading, outcome);
        controls.append(summary);
        break;
      }
    }

    return controls;
  }

  function createUtilityControls(state: GrayboxState): HTMLElement {
    const utility = createElement("nav", "utility-controls");
    utility.setAttribute("aria-label", "Game options");
    const pause = createElement("button", "utility-button");
    pause.type = "button";
    pause.dataset.testid = "pause-button";
    pause.dataset.focusKey = "pause-button";
    pause.setAttribute("aria-keyshortcuts", "Escape");
    setText(pause, state.uiMode === "playing" ? "Pause" : "Paused");
    pause.disabled = state.uiMode !== "playing";
    pause.addEventListener("click", () => {
      const active = document.activeElement as HTMLElement | null;
      lastGameplayFocusKey = active?.dataset.focusKey ?? lastGameplayFocusKey;
      dispatch({ type: "toggle-pause" }, "Game paused. The clock is frozen.", "pause-dialog");
    });
    utility.append(pause);
    return utility;
  }

  function createKeyboardHelp(state: GrayboxState): HTMLElement {
    const help = createElement("p", "keyboard-help");
    help.id = "keyboard-help";
    setText(
      help,
      state.step === "wait"
        ? "Tab enters controls · Arrows move targets · Enter acts · W waits · Esc pauses"
        : "Tab enters controls · Arrows move targets · Enter acts · Esc pauses",
    );
    return help;
  }

  function createDebugPanel(state: GrayboxState): HTMLElement | null {
    if (!import.meta.env.DEV) {
      return null;
    }

    const details = createElement("details", "debug-panel");
    const summary = createElement("summary");
    const fields = createElement("dl", "debug-fields");
    details.dataset.testid = "debug-panel";
    details.open = state.debugVisible;
    summary.dataset.testid = "debug-toggle";
    summary.dataset.focusKey = "debug-toggle";
    summary.setAttribute("aria-label", `${state.debugVisible ? "Hide" : "Show"} development debug`);
    setText(summary, "Development debug");
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      dispatch(
        { type: "toggle-debug" },
        state.debugVisible ? "Development debug hidden." : "Development debug shown.",
        "debug-toggle",
      );
    });

    const patronSummary = GRAYBOX_PATRON_IDS.map((id) => {
      const patron = state.patrons[id];
      return `${id}: observed=${String(patron.observed)}, exchange=${patron.exchangeMark}, composure=${String(patron.composure)}, intoxication=${String(patron.intoxication)}`;
    }).join("; ");
    const pendingEvents = state.scheduledEvents
      .filter((event) => event.status === "pending")
      .map((event) => `${event.id} at ${formatClock(event.dueMinute)}`)
      .join(", ");

    appendDiagnostic(fields, "Game clock", formatClock(state.clockMinutes));
    appendDiagnostic(fields, "Current focus", state.currentFocus ?? "none");
    appendDiagnostic(fields, "Sasha anchor", selectSashaAnchorId(state));
    appendDiagnostic(
      fields,
      "Active attention",
      `${state.attention.status}; selected=${state.attention.selected ?? "none"}`,
    );
    appendDiagnostic(fields, "Patron state", patronSummary);
    appendDiagnostic(
      fields,
      "Hotspot polygons and anchor IDs",
      `${state.debugVisible ? "shown in scene" : "hidden"}; ${GRAYBOX_LAYOUT.anchors
        .map((anchor) => anchor.id)
        .join(", ")}`,
    );
    appendDiagnostic(fields, "Pending scheduled events", pendingEvents || "none");
    appendDiagnostic(
      fields,
      "Last command/effect transaction",
      describeTransaction(state.lastCommittedTransaction),
    );
    details.append(summary, fields);
    return details;
  }

  function createPauseDialog(state: GrayboxState): HTMLDialogElement | null {
    if (state.uiMode === "playing") {
      return null;
    }

    const dialog = createElement("dialog", "pause-dialog");
    dialog.dataset.focusKey = "pause-dialog";
    dialog.tabIndex = -1;
    dialog.setAttribute("aria-labelledby", "pause-dialog-title");

    const heading = createElement("h2");
    heading.id = "pause-dialog-title";
    dialog.append(heading);

    if (state.uiMode === "paused") {
      setText(heading, "Game paused");
      const status = createElement("p");
      setText(status, `The clock remains at ${formatClock(state.clockMinutes)}.`);
      const actions = createElement("div", "dialog-actions");
      const resume = createActionButton("Resume game", "resume-button", "pause-resume", () => {
        dispatch({ type: "toggle-pause" }, "Game resumed.", lastGameplayFocusKey);
      });
      const settings = createActionButton("Settings", "settings-button", "pause-settings", () => {
        dispatch({ type: "open-settings" }, "Settings opened.", "settings-text-size");
      });
      actions.append(resume, settings);
      dialog.append(status, actions);
    } else {
      setText(heading, "Settings");
      const note = createElement("p");
      setText(note, "These interface settings do not advance the game clock.");

      const textLabel = createElement("label");
      const textToggle = createElement("input");
      textToggle.type = "checkbox";
      textToggle.checked = largeText;
      textToggle.dataset.focusKey = "settings-text-size";
      textLabel.append(textToggle, " Larger interface text");
      textToggle.addEventListener("change", () => {
        largeText = textToggle.checked;
        overlay.classList.toggle("large-text", largeText);
      });

      const contrastLabel = createElement("label");
      const contrastToggle = createElement("input");
      contrastToggle.type = "checkbox";
      contrastToggle.checked = highContrast;
      contrastLabel.append(contrastToggle, " High-contrast panels");
      contrastToggle.addEventListener("change", () => {
        highContrast = contrastToggle.checked;
        overlay.classList.toggle("high-contrast", highContrast);
      });

      const motionLabel = createElement("label");
      const motionToggle = createElement("input");
      motionToggle.type = "checkbox";
      motionToggle.checked = reduceMotion;
      motionLabel.append(motionToggle, " Reduce interface motion");
      motionToggle.addEventListener("change", () => {
        reduceMotion = motionToggle.checked;
        overlay.classList.toggle("reduce-motion", reduceMotion);
      });

      const form = createElement("div", "settings-controls");
      form.append(textLabel, contrastLabel, motionLabel);
      const back = createActionButton("Back to pause", "settings-back", "settings-back", () => {
        dispatch({ type: "close-settings" }, "Returned to pause menu.", "pause-resume");
      });
      dialog.append(note, form, back);
    }

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (state.uiMode === "settings") {
        dispatch({ type: "close-settings" }, "Returned to pause menu.", "pause-resume");
      } else {
        dispatch({ type: "toggle-pause" }, "Game resumed.", lastGameplayFocusKey);
      }
    });
    return dialog;
  }

  function render(state: GrayboxState, forcedFocusKey?: string | null): void {
    const version = ++renderVersion;
    const active = document.activeElement as HTMLElement | null;
    const activeFocusKey = overlay.contains(active) ? (active?.dataset.focusKey ?? null) : null;
    const requestedFocusKey = forcedFocusKey ?? pendingFocusKey ?? activeFocusKey;
    pendingFocusKey = null;

    overlay.classList.toggle("large-text", largeText);
    overlay.classList.toggle("high-contrast", highContrast);
    overlay.classList.toggle("reduce-motion", reduceMotion);

    const children: HTMLElement[] = [
      createHud(state),
      createStepControls(state),
      createKeyboardHelp(state),
      createUtilityControls(state),
    ];
    const debug = createDebugPanel(state);
    if (debug !== null) {
      children.push(debug);
    }
    const dialog = createPauseDialog(state);
    if (dialog !== null) {
      children.push(dialog);
    }

    renderRoot.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((openDialog) => {
      openDialog.close();
    });
    renderRoot.replaceChildren(...children);
    queueMicrotask(() => {
      setText(liveStatus, announcement);
    });

    if (dialog !== null) {
      queueMicrotask(() => {
        if (version !== renderVersion || dialog.open) {
          return;
        }
        dialog.showModal();
        focusAfterRender(requestedFocusKey ?? "pause-resume", version);
      });
    } else {
      focusAfterRender(requestedFocusKey, version);
    }
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const state = controller.getState();
    const target = event.target;
    if (target instanceof HTMLElement && target.matches("input, select, textarea")) {
      return;
    }

    if (
      (event.key === "w" || event.key === "W") &&
      state.uiMode === "playing" &&
      state.step === "wait"
    ) {
      event.preventDefault();
      dispatch({ type: "wait" }, "You wait. The room moves on.", "completion-summary");
      return;
    }

    if (
      (event.key === "s" || event.key === "S") &&
      state.uiMode === "playing" &&
      state.step === "exchange"
    ) {
      event.preventDefault();
      dispatch(
        { type: "speak", target: "patron-east", response: "silence" },
        "You let the silence stand.",
        "action-tea",
      );
      return;
    }

    if (event.key === "Escape" && state.uiMode === "playing") {
      event.preventDefault();
      const activeFocusKey = (document.activeElement as HTMLElement | null)?.dataset.focusKey;
      if (activeFocusKey !== undefined) {
        lastGameplayFocusKey = activeFocusKey;
      }
      dispatch({ type: "toggle-pause" }, "Game paused. The clock is frozen.", "pause-dialog");
    }
  }

  overlay.addEventListener(
    "pointerdown",
    () => {
      pointerFocusInProgress = true;
    },
    { capture: true },
  );
  for (const eventName of ["pointerup", "pointercancel"] as const) {
    overlay.addEventListener(
      eventName,
      () => {
        pointerFocusInProgress = false;
      },
      { capture: true },
    );
  }
  document.addEventListener("keydown", handleGlobalKeydown);

  controller.subscribe((state) => {
    render(state);
  });
  render(controller.getState());
  return overlay;
}
