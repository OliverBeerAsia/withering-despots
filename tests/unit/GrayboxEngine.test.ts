import { describe, expect, it } from "vitest";

import { GRAYBOX_LAYOUT } from "../../src/content-types/GrayboxLayout";
import {
  GRAYBOX_END_MINUTE,
  GRAYBOX_EXCHANGE_PATRON_ID,
  GRAYBOX_PATRON_IDS,
  GRAYBOX_SERVICE_PATRON_ID,
  GRAYBOX_START_MINUTE,
} from "../../src/engine/graybox/content";
import { createInitialGrayboxState } from "../../src/engine/graybox/createInitialState";
import { dispatchGrayboxCommand } from "../../src/engine/graybox/reducer";
import { selectSashaAnchorId } from "../../src/engine/graybox/selectors";
import type {
  AttentionOfferId,
  DrinkChoice,
  ExchangeOutcome,
  GrayboxCommand,
  GrayboxState,
} from "../../src/engine/graybox/types";
import {
  selectGrayboxRouteAnchorIds,
  selectGrayboxRoutePoints,
} from "../../src/scene/grayboxRoutes";

function commit(state: GrayboxState, command: GrayboxCommand): GrayboxState {
  const result = dispatchGrayboxCommand(state, command);
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(`Expected ${command.type} to commit, received ${result.reason}.`);
  }
  return result.state;
}

function playToAttention(
  exchange: ExchangeOutcome = "answer",
  drink: DrinkChoice = "tea",
): GrayboxState {
  let state = createInitialGrayboxState();
  state = commit(state, { type: "observe", target: "room" });
  for (const patronId of GRAYBOX_PATRON_IDS) {
    state = commit(state, { type: "observe", target: patronId });
  }
  state = commit(state, {
    type: "speak",
    target: GRAYBOX_EXCHANGE_PATRON_ID,
    response: exchange,
  });
  state = commit(state, {
    type: "serve",
    target: GRAYBOX_SERVICE_PATRON_ID,
    drink,
  });
  return commit(state, { type: "tune", target: "television" });
}

function completeFromAttention(state: GrayboxState, offer: AttentionOfferId): GrayboxState {
  state = commit(state, { type: "select-attention", offer });
  return commit(state, { type: "wait" });
}

function rectanglesOverlap(
  left: (typeof GRAYBOX_LAYOUT.hotspots)[number],
  right: (typeof GRAYBOX_LAYOUT.hotspots)[number],
): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

describe("Phase 1 graybox engine", () => {
  it("commits exactly ten deterministic one-minute transactions from 19:15 to 19:25", () => {
    const first = completeFromAttention(playToAttention(), "television");
    const second = completeFromAttention(playToAttention(), "television");

    expect(first).toEqual(second);
    expect(GRAYBOX_START_MINUTE).toBe(19 * 60 + 15);
    expect(first.clockMinutes).toBe(GRAYBOX_END_MINUTE);
    expect(first.completedAt).toBe(19 * 60 + 25);
    expect(first.step).toBe("complete");
    expect(first.lastCommittedTransaction).toMatchObject({
      sequence: 10,
      clockBefore: GRAYBOX_END_MINUTE - 1,
      clockAfter: GRAYBOX_END_MINUTE,
    });
    expect(first.scheduledEvents).toEqual([
      expect.objectContaining({ id: "phone-rings", status: "fired" }),
      expect.objectContaining({ id: "graybox-ends", status: "fired" }),
    ]);
  });

  it("returns a typed rejection with the exact unchanged state for an invalid command", () => {
    const state = createInitialGrayboxState();
    const result = dispatchGrayboxCommand(state, {
      type: "observe",
      target: GRAYBOX_PATRON_IDS[0],
    });

    expect(result).toEqual({ ok: false, state, reason: "invalid-target" });
    expect(result.state).toBe(state);
    expect(result.state.clockMinutes).toBe(GRAYBOX_START_MINUTE);
  });

  it("resolves attention exclusively and rejects a second resolution without mutation", () => {
    const attentionState = playToAttention("silence", "vodka");
    expect(attentionState.attention.status).toBe("open");

    const firstResolution = dispatchGrayboxCommand(attentionState, {
      type: "select-attention",
      offer: "telephone",
    });
    expect(firstResolution.ok).toBe(true);
    if (!firstResolution.ok) {
      throw new Error("Expected first attention selection to commit.");
    }

    expect(firstResolution.state.attention).toMatchObject({
      status: "resolved",
      selected: "telephone",
      telephoneOutcome: "direct",
      televisionOutcome: "missed",
    });

    const secondResolution = dispatchGrayboxCommand(firstResolution.state, {
      type: "select-attention",
      offer: "television",
    });
    expect(secondResolution).toEqual({
      ok: false,
      state: firstResolution.state,
      reason: "step-mismatch",
    });
    expect(secondResolution.state).toBe(firstResolution.state);
  });

  it("rejects gameplay while pause or settings is open without advancing time", () => {
    const initial = createInitialGrayboxState();
    const paused = commit(initial, { type: "toggle-pause" });
    const pausedAttempt = dispatchGrayboxCommand(paused, { type: "observe", target: "room" });

    expect(pausedAttempt).toEqual({ ok: false, state: paused, reason: "gameplay-disabled" });
    expect(pausedAttempt.state).toBe(paused);
    expect(pausedAttempt.state.clockMinutes).toBe(GRAYBOX_START_MINUTE);

    const settings = commit(paused, { type: "open-settings" });
    const settingsAttempt = dispatchGrayboxCommand(settings, {
      type: "observe",
      target: "room",
    });

    expect(settingsAttempt).toEqual({
      ok: false,
      state: settings,
      reason: "gameplay-disabled",
    });
    expect(settingsAttempt.state).toBe(settings);
    expect(settingsAttempt.state.clockMinutes).toBe(GRAYBOX_START_MINUTE);
  });

  it("keeps every simultaneously enabled hotspot rectangle disjoint", () => {
    const simultaneousGroups = [
      ["patron-north", "patron-east", "patron-south", "patron-west"],
      ["television", "telephone"],
    ] as const;

    for (const group of simultaneousGroups) {
      const hotspots = group.map((id) => {
        const hotspot = GRAYBOX_LAYOUT.hotspots.find((candidate) => candidate.id === id);
        expect(hotspot, `Missing simultaneous hotspot ${id}.`).toBeDefined();
        if (hotspot === undefined) {
          throw new Error(`Missing simultaneous hotspot ${id}.`);
        }
        return hotspot;
      });

      for (let leftIndex = 0; leftIndex < hotspots.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < hotspots.length; rightIndex += 1) {
          const left = hotspots[leftIndex];
          const right = hotspots[rightIndex];
          expect(left).toBeDefined();
          expect(right).toBeDefined();
          if (left !== undefined && right !== undefined) {
            expect(rectanglesOverlap(left, right), `${left.id} overlaps ${right.id}.`).toBe(false);
          }
        }
      }
    }
  });

  it("selects Sasha's authored standing anchor for each graybox state", () => {
    let state = createInitialGrayboxState();
    expect(selectSashaAnchorId(state)).toBe("anchor-sasha-bar");

    state = commit(state, { type: "observe", target: "room" });
    for (const patronId of GRAYBOX_PATRON_IDS) {
      state = commit(state, { type: "observe", target: patronId });
    }
    state = commit(state, {
      type: "speak",
      target: GRAYBOX_EXCHANGE_PATRON_ID,
      response: "answer",
    });
    state = commit(state, {
      type: "serve",
      target: GRAYBOX_SERVICE_PATRON_ID,
      drink: "tea",
    });
    expect(state.step).toBe("tune");
    expect(selectSashaAnchorId(state)).toBe("anchor-sasha-television");

    const openAttention = commit(state, { type: "tune", target: "television" });
    expect(openAttention.attention.status).toBe("open");
    expect(selectSashaAnchorId(openAttention)).toBe("anchor-sasha-television");

    const television = commit(openAttention, {
      type: "select-attention",
      offer: "television",
    });
    expect(selectSashaAnchorId(television)).toBe("anchor-sasha-television");

    const telephone = commit(openAttention, {
      type: "select-attention",
      offer: "telephone",
    });
    expect(selectSashaAnchorId(telephone)).toBe("anchor-sasha-telephone");
  });

  it("returns ordered authored waypoints for bar to television and television to telephone", () => {
    const barToTelevision = [
      "anchor-sasha-bar",
      "anchor-walk-west",
      "anchor-walk-center",
      "anchor-walk-east",
      "anchor-sasha-television",
    ];
    const televisionToTelephone = [
      "anchor-sasha-television",
      "anchor-walk-east",
      "anchor-walk-center",
      "anchor-walk-west",
      "anchor-sasha-telephone",
    ];

    expect(selectGrayboxRouteAnchorIds("anchor-sasha-bar", "anchor-sasha-television")).toEqual(
      barToTelevision,
    );
    expect(
      selectGrayboxRouteAnchorIds("anchor-sasha-television", "anchor-sasha-telephone"),
    ).toEqual(televisionToTelephone);

    expect(selectGrayboxRoutePoints("anchor-sasha-bar", "anchor-sasha-television")).toEqual([
      { anchorId: "anchor-sasha-bar", x: 430, y: 500 },
      { anchorId: "anchor-walk-west", x: 620, y: 750 },
      { anchorId: "anchor-walk-center", x: 1000, y: 790 },
      { anchorId: "anchor-walk-east", x: 1450, y: 720 },
      { anchorId: "anchor-sasha-television", x: 1380, y: 660 },
    ]);
    expect(selectGrayboxRoutePoints("anchor-sasha-television", "anchor-sasha-telephone")).toEqual([
      { anchorId: "anchor-sasha-television", x: 1380, y: 660 },
      { anchorId: "anchor-walk-east", x: 1450, y: 720 },
      { anchorId: "anchor-walk-center", x: 1000, y: 790 },
      { anchorId: "anchor-walk-west", x: 620, y: 750 },
      { anchorId: "anchor-sasha-telephone", x: 610, y: 530 },
    ]);
  });
});
