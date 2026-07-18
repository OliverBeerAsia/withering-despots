import rawPhaseTwoContent from "../../content/phase-2-sample.json";
import {
  dispatchNarrativeCommand,
  initializeNarrativeState,
} from "../../src/narrative/NarrativeEngine";
import { loadContentRepository } from "../../src/narrative/ContentRepository";
import { selectAttentionView, selectDialogueView } from "../../src/narrative/selectors";
import type {
  ContentRepository,
  NarrativeCommand,
  NarrativeContentBundle,
  WorldState,
} from "../../src/narrative/types";

export interface LocatedNarrativeState {
  readonly state: WorldState;
  readonly commands: readonly NarrativeCommand[];
}

export function createPhaseTwoRepository(): ContentRepository {
  return loadContentRepository(rawPhaseTwoContent);
}

export function clonePhaseTwoContent(): NarrativeContentBundle {
  return structuredClone(rawPhaseTwoContent) as unknown as NarrativeContentBundle;
}

export function availableNarrativeCommands(
  repository: ContentRepository,
  state: WorldState,
): readonly NarrativeCommand[] {
  const dialogue = selectDialogueView(repository, state);
  if (dialogue !== null) {
    return dialogue.choices.map((choice) => ({ type: "choose", choiceId: choice.id }));
  }

  const attention = selectAttentionView(repository, state);
  if (attention !== null) {
    return attention.offers.map((offer) => ({
      type: "select-attention",
      offerId: offer.id,
    }));
  }

  return [];
}

export function commitNarrativeCommand(
  repository: ContentRepository,
  state: WorldState,
  command: NarrativeCommand,
): WorldState {
  const result = dispatchNarrativeCommand(repository, state, command);
  if (!result.ok) {
    throw new Error(`Expected ${command.type} to commit, received ${result.reason}.`);
  }
  return result.state;
}

export function findNarrativeState(
  repository: ContentRepository,
  predicate: (state: WorldState) => boolean,
  maxActions = 80,
): LocatedNarrativeState {
  const stack: LocatedNarrativeState[] = [
    { state: initializeNarrativeState(repository, "phase-2-test-search"), commands: [] },
  ];

  while (stack.length > 0) {
    const entry = stack.pop();
    if (entry === undefined) {
      break;
    }
    if (predicate(entry.state)) {
      return entry;
    }
    if (entry.commands.length >= maxActions || entry.state.mode === "complete") {
      continue;
    }

    for (const command of availableNarrativeCommands(repository, entry.state).toReversed()) {
      const result = dispatchNarrativeCommand(repository, entry.state, command);
      if (result.ok) {
        stack.push({ state: result.state, commands: [...entry.commands, command] });
      }
    }
  }

  throw new Error(`No matching narrative state found within ${String(maxActions)} actions.`);
}
