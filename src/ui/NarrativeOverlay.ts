import type { NarrativeController } from "../app/NarrativeController";
import {
  formatNarrativeClock,
  selectAttentionView,
  selectDialogueView,
  selectSummaryView,
} from "../narrative/selectors";
import type {
  AttentionOfferView,
  ChoiceView,
  ContentRepository,
  NarrativeCommand,
  WorldState,
} from "../narrative/types";
import type { AmbientMusic } from "../audio/AmbientMusic";
import type { RoomAmbience } from "../audio/RoomAmbience";
import { decodeSave, encodeSave, type SaveKind } from "../save/SaveCodec";
import { LocalStorageSaveStorage, type SaveStorageAdapter } from "../save/SaveStorage";
import {
  BRIEF_HOLD_CAP_MS,
  PresentationBeat,
  resolvePresentationHoldMs,
  type PacingPreference,
} from "./PresentationBeat";

const AUTOSAVE_KEY = "autosave";
const CHECKPOINT_KEY = "checkpoint";
const SETTINGS_KEY = "settings";

// Presentation pacing is UI-only; the engine state has already advanced.
// Dialogue holds are authored per node. A completed conversation still leaves
// the room quietly visible for a short, skippable beat before its summary.
const INTER_CONVERSATION_HOLD_MS = 3000;
const CHOICE_REVEAL_STAGGER_MS = 120;

type ModalView = "pause" | "settings" | null;

interface InterfaceSettings {
  readonly largeText: boolean;
  readonly highContrast: boolean;
  readonly reduceMotion: boolean;
  readonly backgroundMusic: boolean;
  readonly roomAmbience: boolean;
  readonly lowRoomEffects: boolean;
  readonly pacing: PacingPreference;
}

export interface NarrativeOverlayOptions {
  readonly storage?: SaveStorageAdapter;
  readonly buildId?: string;
  readonly onAutosaveError?: (error: unknown) => void;
  readonly ambientMusic?: AmbientMusic;
  readonly roomAmbience?: RoomAmbience;
  readonly onReduceMotionChange?: (enabled: boolean) => void;
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

function setText<T extends HTMLElement>(element: T, value: string): T {
  element.textContent = value;
  return element;
}

function safeDomId(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_-]/g, "-");
}

function createDefaultSettings(): InterfaceSettings {
  return {
    largeText: false,
    highContrast: false,
    reduceMotion: false,
    backgroundMusic: true,
    roomAmbience: true,
    lowRoomEffects: false,
    pacing: "full",
  };
}

function isPacingPreference(value: unknown): value is PacingPreference {
  return value === "full" || value === "brief" || value === "immediate";
}

function loadSettings(storage: SaveStorageAdapter): InterfaceSettings {
  try {
    const serialized = storage.read(SETTINGS_KEY);
    if (serialized === null) {
      return createDefaultSettings();
    }
    const parsed = JSON.parse(serialized) as Partial<InterfaceSettings>;
    if (
      typeof parsed.largeText === "boolean" &&
      typeof parsed.highContrast === "boolean" &&
      typeof parsed.reduceMotion === "boolean"
    ) {
      return {
        largeText: parsed.largeText,
        highContrast: parsed.highContrast,
        reduceMotion: parsed.reduceMotion,
        // Background music was added later; default it ON for older records.
        backgroundMusic:
          typeof parsed.backgroundMusic === "boolean" ? parsed.backgroundMusic : true,
        roomAmbience: typeof parsed.roomAmbience === "boolean" ? parsed.roomAmbience : true,
        lowRoomEffects: typeof parsed.lowRoomEffects === "boolean" ? parsed.lowRoomEffects : false,
        pacing: isPacingPreference(parsed.pacing) ? parsed.pacing : "full",
      };
    }
  } catch {
    // A damaged preference record must not prevent the game from opening.
  }
  return createDefaultSettings();
}

function chapterTitle(repository: ContentRepository, state: WorldState): string {
  const key = repository.chapters[state.chapterId]?.titleKey;
  return key === undefined ? state.chapterId : (repository.locale[key] ?? state.chapterId);
}

export function selectAuthoredHoldMs(repository: ContentRepository, state: WorldState): number {
  if (state.mode !== "dialogue" || state.currentNodeId === null) {
    return 0;
  }
  return repository.nodes[state.currentNodeId]?.presentation?.holdMs ?? 0;
}

function rejectionMessage(reason: string): string {
  switch (reason) {
    case "choice-unavailable":
      return "That reply is no longer available.";
    case "attention-resolved":
      return "Your attention is already elsewhere.";
    case "scene-complete":
      return "The room has reached its end.";
    default:
      return "That action is not available now.";
  }
}

function wireRovingFocus(buttons: readonly HTMLButtonElement[]): void {
  for (const [index, button] of buttons.entries()) {
    button.tabIndex = index === 0 ? 0 : -1;
    button.addEventListener("keydown", (event) => {
      let nextIndex: number | null = null;
      if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = buttons.length - 1;
      } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = (index + 1) % buttons.length;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = (index - 1 + buttons.length) % buttons.length;
      }

      if (nextIndex === null) {
        return;
      }
      event.preventDefault();
      for (const [candidateIndex, candidate] of buttons.entries()) {
        candidate.tabIndex = candidateIndex === nextIndex ? 0 : -1;
      }
      const next = buttons[nextIndex];
      next?.focus({ preventScroll: true });
      // Keep the focused choice visible when the panel has to scroll (short
      // viewports): preventScroll stops the page jumping; this scrolls only the
      // panel to reveal the choice.
      next?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }
}

export function createNarrativeOverlay(
  controller: NarrativeController,
  repository: ContentRepository,
  options: NarrativeOverlayOptions = {},
): HTMLElement {
  const storage =
    options.storage ??
    new LocalStorageSaveStorage(window.localStorage, "withering-despots.narrative");
  const buildId = options.buildId ?? "local";
  const overlay = createElement("section", "semantic-overlay narrative-overlay");
  const renderRoot = createElement("div", "narrative-render-root");
  const liveStatus = createElement("p", "visually-hidden");
  overlay.dataset.testid = "narrative-overlay";
  overlay.setAttribute("aria-label", "Game controls");
  liveStatus.dataset.testid = "narrative-status";
  liveStatus.setAttribute("role", "status");
  liveStatus.setAttribute("aria-live", "polite");
  liveStatus.setAttribute("aria-atomic", "true");
  overlay.append(renderRoot, liveStatus);

  let settings = loadSettings(storage);
  // Honour a persisted "off" before any audio can start.
  options.ambientMusic?.setEnabled(settings.backgroundMusic);
  options.roomAmbience?.setEnabled(settings.roomAmbience);
  options.roomAmbience?.setEffectsLevel(settings.lowRoomEffects ? "low" : "full");
  options.roomAmbience?.setReducedMotion(settings.reduceMotion);
  options.onReduceMotionChange?.(settings.reduceMotion);
  let modalView: ModalView = null;
  let renderVersion = 0;
  let pendingFocusKey: string | null = null;
  let lastGameplayFocusKey: string | null = null;
  let autosaveGeneration = 0;
  let hasRendered = false;
  let announcementPrefix: string | null = null;

  // Presentation beats. The engine advances immediately; these only pace what
  // the room shows. `holdInteractive` withholds a node's choices / a window's
  // offers so the line can land first; `holdResolution` withholds the closing
  // summary so the room can simply be watched; `staggerReveal` fades the
  // choices/offers in once the beat ends.
  const presentationBeat = new PresentationBeat<number>({
    now: () => performance.now(),
    setTimeout: (callback, delayMs) => window.setTimeout(callback, delayMs),
    clearTimeout: (handle) => {
      window.clearTimeout(handle);
    },
  });
  let holdInteractive = false;
  let holdResolution = false;
  let staggerReveal = false;
  let activeInteraction: NarrativeCommand["type"] | null = null;

  function reducedMotion(): boolean {
    return settings.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function cancelBeat(): void {
    presentationBeat.cancel();
  }

  function runBeat(delayMs: number, reveal: () => void): void {
    presentationBeat.start(delayMs, reveal);
  }

  // Impatient players are never blocked: a click on the dialogue panel or a
  // Space/Enter press collapses the remaining delay at once.
  function skipBeat(): boolean {
    return presentationBeat.skip();
  }

  // A click anywhere on a dialogue/attention panel skips the pending beat,
  // unless it lands on a control that should act on its own.
  function handlePanelClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("button") !== null) {
      return;
    }
    skipBeat();
  }

  // Fade choices/offers in with a slight per-item stagger. Skipped entirely
  // under reduced motion, where the items simply appear.
  function markReveal(container: HTMLElement, items: readonly HTMLElement[]): void {
    if (!staggerReveal) {
      return;
    }
    container.classList.add("narrative-reveal");
    for (const [index, item] of items.entries()) {
      item.style.setProperty("--reveal-delay", `${String(index * CHOICE_REVEAL_STAGGER_MS)}ms`);
    }
  }

  function announce(message: string): void {
    liveStatus.textContent = "";
    queueMicrotask(() => {
      liveStatus.textContent = message;
    });
  }

  function applySettingsClasses(): void {
    overlay.classList.toggle("large-text", settings.largeText);
    overlay.classList.toggle("high-contrast", settings.highContrast);
    overlay.classList.toggle("reduce-motion", settings.reduceMotion);
  }

  function storeSettings(): void {
    try {
      storage.write(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      announce("These settings will last until this window closes.");
    }
  }

  function focusAfterRender(focusKey: string | null, version: number): void {
    if (focusKey === null) {
      return;
    }
    window.setTimeout(() => {
      if (version !== renderVersion) {
        return;
      }
      const target = overlay.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }, 0);
  }

  function primaryFocusKey(state: WorldState): string {
    const dialogue = selectDialogueView(repository, state);
    if (dialogue?.choices[0] !== undefined) {
      return `choice-${dialogue.choices[0].id}`;
    }
    const attention = selectAttentionView(repository, state);
    if (attention?.offers[0] !== undefined) {
      return `attention-${attention.offers[0].id}`;
    }
    return "narrative-summary";
  }

  function describeState(state: WorldState): string {
    const dialogue = selectDialogueView(repository, state);
    if (dialogue !== null) {
      return `${dialogue.speakerName}: ${dialogue.text}`;
    }
    const attention = selectAttentionView(repository, state);
    if (attention !== null) {
      return `${attention.prompt} Choose one place to listen. There is no timer.`;
    }
    const summary = selectSummaryView(repository, state);
    if (summary !== null) {
      return `${summary.title}. ${summary.lines.join(" ")}`;
    }
    return "The room is quiet.";
  }

  function dispatch(command: NarrativeCommand, focusKey: string): void {
    pendingFocusKey = null;
    // The controller publishes synchronously; flag the interaction so the
    // subscriber can pace the resulting state behind a presentation beat.
    activeInteraction = command.type;
    const result = controller.dispatch(command);
    activeInteraction = null;
    if (!result.ok) {
      announce(rejectionMessage(result.reason));
      render(result.state, focusKey);
    }
  }

  function makeMetadata(kind: SaveKind) {
    return {
      kind,
      writtenAtUtc: new Date().toISOString(),
      buildId,
    } as const;
  }

  function scheduleAutosave(state: WorldState): void {
    const generation = ++autosaveGeneration;
    void encodeSave(state, repository, makeMetadata("autosave"))
      .then((serialized) => {
        if (generation === autosaveGeneration) {
          storage.write(AUTOSAVE_KEY, serialized);
        }
      })
      .catch((error: unknown) => {
        options.onAutosaveError?.(error);
      });
  }

  async function saveCheckpoint(button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    try {
      const serialized = await encodeSave(
        controller.getState(),
        repository,
        makeMetadata("manual"),
      );
      storage.write(CHECKPOINT_KEY, serialized);
      announce(`Checkpoint saved at ${formatNarrativeClock(controller.getState().clockMinutes)}.`);
    } catch {
      announce("The checkpoint could not be saved.");
    } finally {
      button.disabled = false;
      button.focus({ preventScroll: true });
    }
  }

  async function loadCheckpoint(button: HTMLButtonElement): Promise<void> {
    button.disabled = true;
    try {
      const serialized = storage.read(CHECKPOINT_KEY);
      if (serialized === null) {
        announce("There is no checkpoint to load.");
        return;
      }
      const state = await decodeSave(serialized, repository);
      modalView = null;
      options.ambientMusic?.resume();
      options.roomAmbience?.resume();
      pendingFocusKey = primaryFocusKey(state);
      announcementPrefix = `Checkpoint loaded at ${formatNarrativeClock(state.clockMinutes)}.`;
      controller.replaceState(state);
    } catch {
      announce("The checkpoint could not be loaded. The current scene is unchanged.");
    } finally {
      button.disabled = false;
      if (modalView !== null) {
        button.focus({ preventScroll: true });
      }
    }
  }

  function createHeader(state: WorldState): HTMLElement {
    const header = createElement("header", "narrative-hud");
    const clockText = formatNarrativeClock(state.clockMinutes);
    const title = setText(createElement("h1", "visually-hidden"), "Withering Despots");
    const chapter = setText(
      createElement("p", "narrative-chapter"),
      chapterTitle(repository, state),
    );
    const clock = setText(createElement("p", "narrative-clock"), clockText);
    title.id = "game-title";
    clock.dataset.testid = "narrative-clock";
    clock.setAttribute("aria-label", `Room clock ${clockText}`);
    header.append(title, chapter, clock);
    return header;
  }

  function createChoiceButton(choice: ChoiceView): HTMLButtonElement {
    const button = setText(createElement("button", "narrative-choice"), choice.text);
    button.type = "button";
    button.dataset.testid = `choice-${choice.id}`;
    button.dataset.focusKey = `choice-${choice.id}`;
    button.dataset.choiceId = choice.id;
    button.dataset.choiceKind = choice.kind;
    if (choice.kind === "silence") {
      button.classList.add("narrative-choice-silence");
      button.setAttribute("aria-keyshortcuts", "S");
    }
    button.addEventListener("focus", () => {
      lastGameplayFocusKey = button.dataset.focusKey ?? null;
    });
    button.addEventListener("click", () => {
      dispatch({ type: "choose", choiceId: choice.id }, `choice-${choice.id}`);
    });
    return button;
  }

  function createDialogue(state: WorldState): HTMLElement | null {
    const view = selectDialogueView(repository, state);
    if (view === null) {
      return null;
    }
    const safeNodeId = safeDomId(view.nodeId);
    const section = createElement("section", "narrative-dialogue");
    const speaker = setText(createElement("h2", "narrative-speaker"), view.speakerName);
    const line = setText(createElement("p", "narrative-line"), view.text);
    const list = createElement("ol", "narrative-choice-list");
    speaker.id = `narrative-speaker-${safeNodeId}`;
    line.id = `narrative-line-${safeNodeId}`;
    line.dataset.testid = "dialogue-line";
    section.dataset.testid = "narrative-dialogue";
    section.setAttribute("aria-labelledby", speaker.id);
    section.setAttribute("aria-describedby", line.id);

    if (holdInteractive) {
      // The response line lands alone for a beat; Continue is always visible
      // so the player never has to guess how to move on.
      const continueButton = setText(
        createElement("button", "narrative-choice narrative-continue"),
        "Continue",
      );
      const item = createElement("li");
      continueButton.type = "button";
      continueButton.dataset.testid = "presentation-continue";
      continueButton.dataset.focusKey = "presentation-continue";
      continueButton.setAttribute("aria-keyshortcuts", "Enter Space");
      continueButton.addEventListener("click", (event) => {
        event.stopPropagation();
        skipBeat();
      });
      item.append(continueButton);
      list.append(item);
      wireRovingFocus([continueButton]);
    } else {
      const buttons = view.choices.map((choice) => createChoiceButton(choice));
      const items = buttons.map((button) => {
        const item = createElement("li");
        item.append(button);
        return item;
      });
      for (const item of items) {
        list.append(item);
      }
      markReveal(list, items);
      wireRovingFocus(buttons);
    }
    section.addEventListener("click", handlePanelClick);
    section.append(speaker, line, list);
    return section;
  }

  function createAttentionButton(offer: AttentionOfferView): HTMLButtonElement {
    const targetClass = safeDomId(offer.targetId);
    const button = setText(
      createElement("button", `narrative-attention-offer attention-target-${targetClass}`),
      offer.label,
    );
    button.type = "button";
    button.dataset.testid = `attention-${offer.id}`;
    button.dataset.focusKey = `attention-${offer.id}`;
    button.dataset.offerId = offer.id;
    button.addEventListener("focus", () => {
      lastGameplayFocusKey = button.dataset.focusKey ?? null;
    });
    button.addEventListener("click", () => {
      dispatch({ type: "select-attention", offerId: offer.id }, `attention-${offer.id}`);
    });
    return button;
  }

  function createAttention(state: WorldState): HTMLElement | null {
    const view = selectAttentionView(repository, state);
    if (view === null) {
      return null;
    }
    const safeWindowId = safeDomId(view.windowId);
    const section = createElement("section", "narrative-attention");
    const heading = setText(createElement("h2", "visually-hidden"), "Choose where to listen");
    const prompt = setText(createElement("p", "narrative-attention-prompt"), view.prompt);
    const group = createElement("div", "narrative-attention-offers");
    heading.id = `narrative-attention-title-${safeWindowId}`;
    prompt.id = `narrative-attention-prompt-${safeWindowId}`;
    section.dataset.testid = "narrative-attention";
    section.setAttribute("aria-labelledby", heading.id);
    section.setAttribute("aria-describedby", prompt.id);
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", heading.id);
    group.setAttribute("aria-describedby", prompt.id);
    if (holdInteractive) {
      // The prompt sits alone for a beat before the places to listen appear.
      section.dataset.focusKey = "attention-panel";
      section.tabIndex = -1;
    } else {
      const buttons = view.offers.map((offer) => createAttentionButton(offer));
      wireRovingFocus(buttons);
      group.append(...buttons);
      markReveal(group, buttons);
    }
    section.addEventListener("click", handlePanelClick);
    section.append(heading, prompt, group);
    return section;
  }

  function createSummary(state: WorldState): HTMLElement | null {
    const view = selectSummaryView(repository, state);
    if (view === null) {
      return null;
    }
    const section = createElement("section", "narrative-summary");
    const heading = setText(createElement("h2"), view.title);
    const lines = createElement("div", "narrative-summary-lines");
    section.dataset.testid = "narrative-summary";
    section.dataset.focusKey = "narrative-summary";
    section.tabIndex = -1;
    for (const text of view.lines) {
      lines.append(setText(createElement("p"), text));
    }
    section.append(heading, lines);
    return section;
  }

  function openPause(): void {
    const active = document.activeElement as HTMLElement | null;
    lastGameplayFocusKey = active?.dataset.focusKey ?? lastGameplayFocusKey;
    modalView = "pause";
    presentationBeat.pause();
    options.ambientMusic?.pause();
    options.roomAmbience?.pause();
    pendingFocusKey = "narrative-resume";
    render(controller.getState());
  }

  function closePause(): void {
    modalView = null;
    options.ambientMusic?.resume();
    options.roomAmbience?.resume();
    pendingFocusKey = lastGameplayFocusKey ?? primaryFocusKey(controller.getState());
    render(controller.getState());
    presentationBeat.resume();
  }

  function createUtilityControls(): HTMLElement {
    const navigation = createElement("nav", "narrative-utility");
    const pause = setText(createElement("button", "utility-button"), "Pause");
    navigation.setAttribute("aria-label", "Game options");
    pause.type = "button";
    pause.dataset.testid = "narrative-pause";
    pause.dataset.focusKey = "narrative-pause";
    pause.setAttribute("aria-keyshortcuts", "Escape");
    pause.addEventListener("click", openPause);
    navigation.append(pause);
    return navigation;
  }

  function createSettingToggle(
    labelText: string,
    focusKey: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
  ): HTMLLabelElement {
    const label = createElement("label");
    const input = createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.dataset.focusKey = focusKey;
    input.addEventListener("change", () => {
      onChange(input.checked);
      applySettingsClasses();
      storeSettings();
    });
    label.append(input, labelText);
    return label;
  }

  function createPacingSettings(): HTMLFieldSetElement {
    const fieldset = createElement("fieldset", "narrative-settings-group");
    const legend = setText(createElement("legend"), "Dialogue pacing");
    const choices: ReadonlyArray<readonly [PacingPreference, string]> = [
      ["full", "Full"],
      ["brief", "Brief (up to five seconds)"],
      ["immediate", "Immediate"],
    ];
    fieldset.append(legend);
    for (const [value, labelText] of choices) {
      const label = createElement("label");
      const input = createElement("input");
      input.type = "radio";
      input.name = "narrative-pacing";
      input.value = value;
      input.checked = settings.pacing === value;
      input.dataset.focusKey = `narrative-pacing-${value}`;
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        settings = { ...settings, pacing: value };
        if (value === "immediate") {
          skipBeat();
        } else if (value === "brief") {
          presentationBeat.capRemaining(BRIEF_HOLD_CAP_MS);
        }
        storeSettings();
      });
      label.append(input, ` ${labelText}`);
      fieldset.append(label);
    }
    return fieldset;
  }

  function createModal(state: WorldState): HTMLDialogElement | null {
    if (modalView === null) {
      return null;
    }
    const dialog = createElement("dialog", "pause-dialog narrative-modal");
    const heading = createElement("h2");
    const headingId = "narrative-modal-title";
    heading.id = headingId;
    dialog.setAttribute("aria-labelledby", headingId);
    dialog.dataset.testid = modalView === "pause" ? "narrative-pause-dialog" : "narrative-settings";

    if (modalView === "pause") {
      setText(heading, "Game paused");
      const clock = setText(
        createElement("p"),
        `The room remains at ${formatNarrativeClock(state.clockMinutes)}.`,
      );
      const actions = createElement("div", "dialog-actions narrative-modal-actions");
      const resume = setText(createElement("button", "choice-button"), "Resume game");
      const save = setText(createElement("button", "choice-button"), "Save checkpoint");
      const load = setText(createElement("button", "choice-button"), "Load checkpoint");
      const settingsButton = setText(createElement("button", "choice-button"), "Settings");
      resume.type = save.type = load.type = settingsButton.type = "button";
      resume.dataset.focusKey = "narrative-resume";
      resume.dataset.testid = "narrative-resume";
      save.dataset.focusKey = "save-checkpoint";
      save.dataset.testid = "save-checkpoint";
      load.dataset.focusKey = "load-checkpoint";
      load.dataset.testid = "load-checkpoint";
      settingsButton.dataset.focusKey = "open-narrative-settings";
      settingsButton.dataset.testid = "open-narrative-settings";
      resume.addEventListener("click", closePause);
      save.addEventListener("click", () => void saveCheckpoint(save));
      load.addEventListener("click", () => void loadCheckpoint(load));
      settingsButton.addEventListener("click", () => {
        modalView = "settings";
        pendingFocusKey = "narrative-large-text";
        render(controller.getState());
      });
      actions.append(resume, save, load, settingsButton);
      dialog.append(heading, clock, actions);
    } else {
      setText(heading, "Settings");
      const note = setText(createElement("p"), "These settings do not move the room clock.");
      const fieldset = createElement("fieldset", "narrative-settings-group");
      const legend = setText(createElement("legend"), "Reading and motion");
      fieldset.append(
        legend,
        createSettingToggle(
          " Larger interface text",
          "narrative-large-text",
          settings.largeText,
          (checked) => {
            settings = { ...settings, largeText: checked };
          },
        ),
        createSettingToggle(
          " High-contrast panels",
          "narrative-high-contrast",
          settings.highContrast,
          (checked) => {
            settings = { ...settings, highContrast: checked };
          },
        ),
        createSettingToggle(
          " Reduce interface motion",
          "narrative-reduce-motion",
          settings.reduceMotion,
          (checked) => {
            settings = { ...settings, reduceMotion: checked };
            options.onReduceMotionChange?.(checked);
            options.roomAmbience?.setReducedMotion(checked);
          },
        ),
        createSettingToggle(
          " Background music",
          "narrative-background-music",
          settings.backgroundMusic,
          (checked) => {
            settings = { ...settings, backgroundMusic: checked };
            options.ambientMusic?.setEnabled(checked);
          },
        ),
        createSettingToggle(
          " Room ambience",
          "narrative-room-ambience",
          settings.roomAmbience,
          (checked) => {
            settings = { ...settings, roomAmbience: checked };
            options.roomAmbience?.setEnabled(checked);
          },
        ),
        createSettingToggle(
          " Reduce incidental room sounds",
          "narrative-low-room-effects",
          settings.lowRoomEffects,
          (checked) => {
            settings = { ...settings, lowRoomEffects: checked };
            options.roomAmbience?.setEffectsLevel(checked ? "low" : "full");
          },
        ),
      );
      const pacing = createPacingSettings();
      const back = setText(createElement("button", "choice-button"), "Back to pause");
      back.type = "button";
      back.dataset.focusKey = "narrative-settings-back";
      back.dataset.testid = "narrative-settings-back";
      back.addEventListener("click", () => {
        modalView = "pause";
        pendingFocusKey = "narrative-resume";
        render(controller.getState());
      });
      dialog.append(heading, note, fieldset, pacing, back);
    }

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      if (modalView === "settings") {
        modalView = "pause";
        pendingFocusKey = "narrative-resume";
        render(controller.getState());
      } else {
        closePause();
      }
    });
    return dialog;
  }

  function render(state: WorldState, forcedFocusKey?: string | null): void {
    const version = ++renderVersion;
    const active = document.activeElement as HTMLElement | null;
    const activeFocusKey = overlay.contains(active) ? (active?.dataset.focusKey ?? null) : null;
    const requestedFocusKey =
      forcedFocusKey ?? pendingFocusKey ?? (hasRendered ? activeFocusKey : null);
    pendingFocusKey = null;
    applySettingsClasses();
    if (holdInteractive || holdResolution) {
      overlay.dataset.beat = "hold";
    } else {
      delete overlay.dataset.beat;
    }

    const children: HTMLElement[] = [createHeader(state)];
    const dialogue = createDialogue(state);
    const attention = createAttention(state);
    const summary = holdResolution ? null : createSummary(state);
    if (dialogue !== null) {
      children.push(dialogue);
    }
    if (attention !== null) {
      children.push(attention);
    }
    if (summary !== null) {
      children.push(summary);
    }
    children.push(createUtilityControls());
    const modal = createModal(state);
    if (modal !== null) {
      children.push(modal);
    }

    renderRoot.querySelectorAll<HTMLDialogElement>("dialog[open]").forEach((dialog) => {
      dialog.close();
    });
    renderRoot.replaceChildren(...children);
    hasRendered = true;

    if (modal !== null) {
      queueMicrotask(() => {
        if (version !== renderVersion || modal.open) {
          return;
        }
        modal.showModal();
        focusAfterRender(requestedFocusKey ?? "narrative-resume", version);
      });
    } else {
      focusAfterRender(requestedFocusKey, version);
    }
  }

  function handleGlobalKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.matches("input, select, textarea, [contenteditable='true']")
    ) {
      return;
    }
    if (
      modalView === null &&
      presentationBeat.isActive() &&
      (event.key === "Enter" || event.key === " " || event.key === "Spacebar")
    ) {
      // During a beat, focus rests on the panel (not a control), so Space/Enter
      // is free to collapse the remaining delay rather than activate anything.
      if (target instanceof HTMLElement && target.closest("button") !== null) {
        return;
      }
      event.preventDefault();
      skipBeat();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (modalView === null) {
        openPause();
      } else if (modalView === "settings") {
        modalView = "pause";
        pendingFocusKey = "narrative-resume";
        render(controller.getState());
      } else {
        closePause();
      }
      return;
    }
    if ((event.key === "s" || event.key === "S") && modalView === null) {
      const silence = overlay.querySelector<HTMLButtonElement>("[data-choice-kind='silence']");
      if (silence !== null) {
        event.preventDefault();
        silence.click();
      }
    }
  }

  // Focus target while a panel's choices/offers are held back: keep the spoken
  // line in view and reachable so it can be read and skipped. Never pulls focus
  // out of an open modal.
  function holdFocusKey(state: WorldState): string | null {
    if (modalView !== null) {
      return null;
    }
    if (selectDialogueView(repository, state) !== null) {
      return "presentation-continue";
    }
    if (selectAttentionView(repository, state) !== null) {
      return "attention-panel";
    }
    return null;
  }

  function presentState(state: WorldState, interaction: NarrativeCommand["type"] | null): void {
    cancelBeat();
    staggerReveal = false;
    holdInteractive = false;
    holdResolution = false;

    if (interaction === null) {
      // Initial paint, checkpoint load, or a rejected action: show at once.
      render(state, pendingFocusKey ?? primaryFocusKey(state));
      return;
    }

    if (state.mode === "complete") {
      // Inter-conversation breathing room: let the room simply be seen first.
      const holdMs = resolvePresentationHoldMs(INTER_CONVERSATION_HOLD_MS, settings.pacing);
      if (holdMs === 0) {
        render(state, primaryFocusKey(state));
        return;
      }
      holdResolution = true;
      render(state, holdFocusKey(state));
      runBeat(holdMs, () => {
        holdResolution = false;
        if (modalView !== null) {
          // A pause opened mid-beat: paint the summary when it closes so we
          // never wrestle focus away from the modal.
          return;
        }
        staggerReveal = !reducedMotion();
        render(state, primaryFocusKey(state));
        staggerReveal = false;
      });
      return;
    }

    // A choice or attention pick may lead to an authored dialogue hold. Nodes
    // without presentation metadata render immediately instead of inheriting a
    // uniform delay.
    const holdMs = resolvePresentationHoldMs(
      selectAuthoredHoldMs(repository, state),
      settings.pacing,
    );
    if (holdMs === 0) {
      render(state, primaryFocusKey(state));
      return;
    }
    holdInteractive = true;
    render(state, holdFocusKey(state));
    runBeat(holdMs, () => {
      holdInteractive = false;
      if (modalView !== null) {
        return;
      }
      staggerReveal = !reducedMotion();
      render(state, primaryFocusKey(state));
      staggerReveal = false;
    });
  }

  function handleVisibilityChange(): void {
    if (document.hidden) {
      presentationBeat.pause();
    } else if (modalView === null) {
      presentationBeat.resume();
    }
  }

  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  controller.subscribe((state) => {
    presentState(state, activeInteraction);
    const prefix = announcementPrefix;
    announcementPrefix = null;
    announce(prefix === null ? describeState(state) : `${prefix} ${describeState(state)}`);
    scheduleAutosave(state);
  });
  render(controller.getState());
  announce(describeState(controller.getState()));
  return overlay;
}
