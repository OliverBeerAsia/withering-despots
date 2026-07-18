import { evaluateConditions } from "./ConditionEvaluator";
import type {
  AttentionView,
  ContentRepository,
  DialogueView,
  SummaryView,
  WorldState,
} from "./types";

function localize(repository: ContentRepository, key: string): string {
  const text = repository.locale[key];
  if (text === undefined) {
    throw new Error(`Missing localization key at runtime: ${key}`);
  }
  return text;
}

export function selectDialogueView(
  repository: ContentRepository,
  state: WorldState,
): DialogueView | null {
  if (state.mode !== "dialogue" || state.currentNodeId === null) {
    return null;
  }
  const node = repository.nodes[state.currentNodeId];
  if (node === undefined) {
    throw new Error(`Unknown dialogue node: ${state.currentNodeId}`);
  }
  const speakerName =
    node.speakerId === null
      ? localize(repository, "common.room")
      : localize(repository, repository.characters[node.speakerId]?.nameKey ?? "");
  return {
    nodeId: node.id,
    speakerName,
    text: localize(repository, node.textKey),
    choices: node.choices
      .filter((choice) => evaluateConditions(repository, state, choice.requires))
      .map((choice) => ({
        id: choice.id,
        text: localize(repository, choice.textKey),
        kind: choice.kind,
      })),
  };
}

export function selectAttentionView(
  repository: ContentRepository,
  state: WorldState,
): AttentionView | null {
  if (state.mode !== "attention" || state.attention === null) {
    return null;
  }
  const window = repository.attentionWindows[state.attention.windowId];
  if (window === undefined) {
    throw new Error(`Unknown attention window: ${state.attention.windowId}`);
  }
  return {
    windowId: window.id,
    prompt: localize(repository, window.promptKey),
    offers: window.offers.map((offer) => ({
      id: offer.id,
      targetId: offer.targetId,
      label: localize(repository, offer.labelKey),
    })),
  };
}

export function selectSummaryView(
  repository: ContentRepository,
  state: WorldState,
): SummaryView | null {
  if (state.mode !== "complete" || state.summaryId === null) {
    return null;
  }
  const summary = repository.summaries[state.summaryId];
  if (summary === undefined) {
    throw new Error(`Unknown summary: ${state.summaryId}`);
  }
  return {
    id: summary.id,
    title: localize(repository, summary.titleKey),
    lines: summary.lines
      .filter((line) => evaluateConditions(repository, state, line.requires))
      .map((line) => localize(repository, line.textKey)),
  };
}

export function formatNarrativeClock(minutes: number): string {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const remainder = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${remainder}`;
}
