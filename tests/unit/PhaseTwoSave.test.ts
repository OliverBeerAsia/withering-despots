import { describe, expect, it, vi } from "vitest";

import {
  dispatchNarrativeCommand,
  initializeNarrativeState,
} from "../../src/narrative/NarrativeEngine";
import {
  CURRENT_SAVE_SCHEMA_VERSION,
  decodeSave,
  encodeSave,
  runSequentialMigrations,
  SAVE_FORMAT,
  type SaveMetadata,
  type VersionedSavePayload,
} from "../../src/save/SaveCodec";
import { createPhaseTwoRepository, findNarrativeState } from "./PhaseTwoTestSupport";

const TEST_METADATA: SaveMetadata = {
  kind: "debug",
  writtenAtUtc: "1991-08-21T16:17:00.000Z",
  buildId: "phase-2-test",
};

describe("Phase 2 save codec", () => {
  it("rejects checksum tampering before reading world state", async () => {
    const repository = createPhaseTwoRepository();
    const state = findNarrativeState(
      repository,
      (candidate) => candidate.mode === "attention",
    ).state;
    const encoded = await encodeSave(state, repository, TEST_METADATA);
    const tampered = encoded.replace(
      `"clockMinutes":${String(state.clockMinutes)}`,
      `"clockMinutes":${String(state.clockMinutes + 1)}`,
    );
    expect(tampered).not.toBe(encoded);

    await expect(decodeSave(tampered, repository)).rejects.toMatchObject({
      code: "invalid-integrity",
    });
  });

  it("round-trips an unresolved attention state with deep equality", async () => {
    const repository = createPhaseTwoRepository();
    const state = findNarrativeState(
      repository,
      (candidate) => candidate.mode === "attention",
    ).state;
    const encoded = await encodeSave(state, repository, TEST_METADATA);
    const restored = await decodeSave(encoded, repository);

    expect(restored).toEqual(state);
    expect(restored).not.toBe(state);
    expect(restored.attention).toEqual({
      windowId: "attention_sample_three_way",
      selectedOfferId: null,
      outcomes: {},
    });
  });

  it("round-trips the opening, mid-dialogue, attention, and completed states", async () => {
    const repository = createPhaseTwoRepository();
    const states = [
      initializeNarrativeState(repository, "phase-2-save-opening"),
      findNarrativeState(
        repository,
        (candidate) => candidate.currentNodeId === "sample_gennady_accident_approach",
      ).state,
      findNarrativeState(repository, (candidate) => candidate.mode === "attention").state,
      findNarrativeState(repository, (candidate) => candidate.mode === "complete").state,
    ];

    for (const state of states) {
      const restored = await decodeSave(
        await encodeSave(state, repository, TEST_METADATA),
        repository,
      );
      expect(restored).toEqual(state);
    }
  });

  it("round-trips persistent television, volume, radio, and service states", async () => {
    const repository = createPhaseTwoRepository();
    const state = findNarrativeState(
      repository,
      (candidate) =>
        candidate.currentNodeId === "sample_post_report_quiet" &&
        candidate.objects.prop_nikolai_tea === "served",
    ).state;
    const restored = await decodeSave(
      await encodeSave(state, repository, TEST_METADATA),
      repository,
    );

    expect(restored).toEqual(state);
    expect(restored.objects).toMatchObject({
      television: "after_report",
      television_volume: "low",
      radio_music: "silent",
      prop_nikolai_tea: "served",
    });
  });

  it("produces the same next transaction and state after restore", async () => {
    const repository = createPhaseTwoRepository();
    const state = findNarrativeState(
      repository,
      (candidate) => candidate.mode === "attention",
    ).state;
    const restored = await decodeSave(
      await encodeSave(state, repository, TEST_METADATA),
      repository,
    );
    const command = { type: "select-attention", offerId: "offer_sample_arkady_rewrite" } as const;
    const originalResult = dispatchNarrativeCommand(repository, state, command);
    const restoredResult = dispatchNarrativeCommand(repository, restored, command);

    expect(originalResult).toEqual(restoredResult);
    expect(originalResult.ok).toBe(true);
    if (originalResult.ok && restoredResult.ok) {
      expect(originalResult.transaction).toEqual(restoredResult.transaction);
      expect(originalResult.state).toEqual(restoredResult.state);
      expect(originalResult.state.timeline.event_sample_attention?.status).toBe("complete");
    }
  });

  it("runs migrations sequentially and exactly once", () => {
    const first = vi.fn((state: unknown) => ({ ...(state as object), first: true }));
    const second = vi.fn((state: unknown) => ({ ...(state as object), second: true }));
    const payload: VersionedSavePayload = {
      format: SAVE_FORMAT,
      schemaVersion: 1,
      contentId: "phase-2-sample",
      metadata: TEST_METADATA,
      state: { original: true },
    };

    const migrated = runSequentialMigrations(payload, 3, [
      { fromVersion: 2, toVersion: 3, migrate: second },
      { fromVersion: 1, toVersion: 2, migrate: first },
    ]);
    expect(migrated).toMatchObject({
      schemaVersion: 3,
      state: { original: true, first: true, second: true },
    });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
    expect(payload).toMatchObject({ schemaVersion: 1, state: { original: true } });
  });

  it("fails loudly for missing, ambiguous, and future migrations", () => {
    const payload: VersionedSavePayload = {
      format: SAVE_FORMAT,
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      contentId: "phase-2-sample",
      metadata: TEST_METADATA,
      state: {},
    };
    expect(() => runSequentialMigrations(payload, 2, [])).toThrow(/unavailable or ambiguous/);
    expect(() =>
      runSequentialMigrations(payload, 2, [
        { fromVersion: 1, toVersion: 2, migrate: (state) => state },
        { fromVersion: 1, toVersion: 2, migrate: (state) => state },
      ]),
    ).toThrow(/unavailable or ambiguous/);
    expect(() => runSequentialMigrations({ ...payload, schemaVersion: 2 }, 1, [])).toThrow(
      /newer than supported/,
    );
  });

  it("rejects malformed JSON and a save for different content", async () => {
    const repository = createPhaseTwoRepository();
    await expect(decodeSave("not-json", repository)).rejects.toMatchObject({
      code: "invalid-json",
    });

    const state = findNarrativeState(
      repository,
      (candidate) => candidate.mode === "attention",
    ).state;
    const encoded = await encodeSave(state, repository, TEST_METADATA);
    const differentRepository = {
      ...repository,
      bundle: { ...repository.bundle, id: "different-content" },
    } as unknown as typeof repository;
    await expect(decodeSave(encoded, differentRepository)).rejects.toMatchObject({
      code: "content-mismatch",
    });
  });
});
