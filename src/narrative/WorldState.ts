import type { ContentRepository, PatronRuntimeState, WorldState } from "./types";

function createPatronState(
  repository: ContentRepository,
): Readonly<Record<string, PatronRuntimeState>> {
  return Object.fromEntries(
    repository.bundle.characters
      .filter((character) => character.role !== "player")
      .map((character) => [character.id, { ...character.initial }]),
  );
}

export function createRawInitialWorldState(
  repository: ContentRepository,
  seed = "phase-2-sample-seed",
): WorldState {
  const firstChapter = repository.bundle.chapters[0];
  if (firstChapter === undefined) {
    throw new Error("Narrative content requires one chapter.");
  }

  return {
    schemaVersion: 1,
    contentId: repository.bundle.id,
    seed,
    rngState: 0x91_08_21,
    revision: 0,
    clockMinutes: repository.bundle.metadata.startMinute,
    chapterId: firstChapter.id,
    mode: "dialogue",
    currentNodeId: repository.entryNodeId,
    patrons: createPatronState(repository),
    relationships: {},
    objects: Object.fromEntries(
      repository.bundle.interactionObjects.map((object) => [object.id, object.initialState]),
    ),
    knowledge: {},
    claims: {},
    contradictionsExposed: [],
    timeline: Object.fromEntries(
      repository.bundle.events.map((event) => [
        event.id,
        { status: "pending", dueMinute: event.dueMinute, priority: event.priority },
      ]),
    ),
    attention: null,
    flags: {},
    epilogueFacts: [],
    summaryId: null,
    actionHistory: [],
  };
}

export function assertWorldState(repository: ContentRepository, state: WorldState): void {
  if (state.contentId !== repository.bundle.id) {
    throw new Error("World state does not match the current Phase 2 content.");
  }
  if (!Number.isSafeInteger(state.clockMinutes) || state.clockMinutes < 0) {
    throw new Error("World clock must be a non-negative safe integer.");
  }
  if (state.clockMinutes > repository.bundle.metadata.endMinute) {
    throw new Error("World clock exceeded the Phase 2 sample boundary.");
  }
  if (repository.chapters[state.chapterId] === undefined) {
    throw new Error(`World state references unknown chapter ${state.chapterId}.`);
  }
  if (state.mode === "dialogue" && state.currentNodeId === null) {
    throw new Error("Dialogue mode requires a current node.");
  }
  if (state.currentNodeId !== null && repository.nodes[state.currentNodeId] === undefined) {
    throw new Error(`World state references unknown node ${state.currentNodeId}.`);
  }
  if (state.mode === "attention" && state.attention === null) {
    throw new Error("Attention mode requires an attention window.");
  }
  if (state.mode === "complete" && state.summaryId === null) {
    throw new Error("Completed state requires a summary.");
  }
  if (state.summaryId !== null && repository.summaries[state.summaryId] === undefined) {
    throw new Error(`World state references unknown summary ${state.summaryId}.`);
  }
  for (const [objectId, objectState] of Object.entries(state.objects)) {
    const definition = repository.objects[objectId];
    if (definition === undefined || !definition.states.includes(objectState)) {
      throw new Error(`World state has invalid object state ${objectId}:${objectState}.`);
    }
  }
}
