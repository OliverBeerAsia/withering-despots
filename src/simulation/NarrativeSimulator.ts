import { dispatchNarrativeCommand, initializeNarrativeState } from "../narrative/NarrativeEngine";
import { selectAttentionView, selectDialogueView } from "../narrative/selectors";
import type { ContentRepository, NarrativeCommand, WorldState } from "../narrative/types";

export interface CompletedNarrativePath {
  readonly commands: readonly NarrativeCommand[];
  readonly state: WorldState;
}

function validCommands(
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

export function runNarrativeCommands(
  repository: ContentRepository,
  commands: readonly NarrativeCommand[],
  seed = "phase-2-scripted",
): WorldState {
  let state = initializeNarrativeState(repository, seed);
  for (const command of commands) {
    const result = dispatchNarrativeCommand(repository, state, command);
    if (!result.ok) {
      throw new Error(
        `Narrative simulation rejected ${command.type} at action ${String(
          state.actionHistory.length + 1,
        )}: ${result.reason}`,
      );
    }
    state = result.state;
  }
  return state;
}

export function exploreNarrativePaths(
  repository: ContentRepository,
  limit = 500,
  maxActions = 80,
): readonly CompletedNarrativePath[] {
  const completed: CompletedNarrativePath[] = [];
  const stack: Array<{
    readonly state: WorldState;
    readonly commands: readonly NarrativeCommand[];
  }> = [{ state: initializeNarrativeState(repository, "phase-2-exhaustive"), commands: [] }];

  while (stack.length > 0 && completed.length < limit) {
    const entry = stack.pop();
    if (entry === undefined) {
      break;
    }
    if (entry.state.mode === "complete") {
      completed.push({ commands: entry.commands, state: entry.state });
      continue;
    }
    if (entry.commands.length >= maxActions) {
      throw new Error(`Narrative path exceeded ${String(maxActions)} actions without completing.`);
    }
    const commands = validCommands(repository, entry.state);
    if (commands.length === 0) {
      throw new Error(
        `Narrative deadlock at node ${entry.state.currentNodeId ?? "none"} after ${String(
          entry.commands.length,
        )} actions.`,
      );
    }
    for (const command of commands.toReversed()) {
      const result = dispatchNarrativeCommand(repository, entry.state, command);
      if (!result.ok) {
        throw new Error(`A projected valid command was rejected: ${result.reason}.`);
      }
      stack.push({ state: result.state, commands: [...entry.commands, command] });
    }
  }
  return completed;
}
