import { dispatchNarrativeCommand } from "../narrative/NarrativeEngine";
import type {
  ContentRepository,
  NarrativeCommand,
  NarrativeDispatchResult,
  WorldState,
} from "../narrative/types";

export type NarrativeStateListener = (state: WorldState) => void;

export interface NarrativeController {
  readonly getState: () => WorldState;
  readonly dispatch: (command: NarrativeCommand) => NarrativeDispatchResult;
  readonly replaceState: (state: WorldState) => void;
  readonly subscribe: (listener: NarrativeStateListener) => () => void;
}

export function createNarrativeController(
  repository: ContentRepository,
  initialState: WorldState,
): NarrativeController {
  let state = initialState;
  const listeners = new Set<NarrativeStateListener>();
  const publish = (): void => {
    for (const listener of listeners) {
      listener(state);
    }
  };
  return {
    getState: () => state,
    dispatch: (command) => {
      const result = dispatchNarrativeCommand(repository, state, command);
      if (result.ok) {
        state = result.state;
        publish();
      }
      return result;
    },
    replaceState: (replacement) => {
      state = replacement;
      publish();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
