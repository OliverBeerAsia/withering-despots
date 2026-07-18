import { createInitialGrayboxState } from "../engine/graybox/createInitialState";
import { dispatchGrayboxCommand } from "../engine/graybox/reducer";
import type { GrayboxCommand, GrayboxDispatchResult, GrayboxState } from "../engine/graybox/types";

export type GrayboxStateListener = (state: GrayboxState) => void;

export interface GrayboxController {
  readonly getState: () => GrayboxState;
  readonly dispatch: (command: GrayboxCommand) => GrayboxDispatchResult;
  readonly subscribe: (listener: GrayboxStateListener) => () => void;
}

export function createGrayboxController(
  initialState: GrayboxState = createInitialGrayboxState(),
): GrayboxController {
  let state = initialState;
  const listeners = new Set<GrayboxStateListener>();

  return {
    getState: () => state,
    dispatch: (command) => {
      const result = dispatchGrayboxCommand(state, command);

      if (result.ok && result.state !== state) {
        state = result.state;
        for (const listener of listeners) {
          listener(state);
        }
      }

      return result;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
