import { evaluateConditions } from "./ConditionEvaluator";
import { assertWorldState, createRawInitialWorldState } from "./WorldState";
import type {
  ContentRepository,
  KnowledgeRecord,
  NarrativeCommand,
  NarrativeDispatchResult,
  NarrativeEffect,
  NarrativeTransaction,
  PatronRuntimeState,
  WorldState,
} from "./types";

const MIN_PATRON_VALUE = -100;
const MAX_PATRON_VALUE = 100;

function clampPatronValue(value: number): number {
  return Math.min(MAX_PATRON_VALUE, Math.max(MIN_PATRON_VALUE, value));
}

function relationshipKey(fromId: string, toId: string): string {
  return `${fromId}->${toId}`;
}

function contradictionKey(firstClaimId: string, secondClaimId: string): string {
  return [firstClaimId, secondClaimId].toSorted().join("|");
}

function appendKnowledge(
  state: WorldState,
  knowledgeId: string,
  record: KnowledgeRecord,
): WorldState {
  return {
    ...state,
    knowledge: {
      ...state.knowledge,
      [knowledgeId]: [...(state.knowledge[knowledgeId] ?? []), record],
    },
  };
}

function updatePatron(
  state: WorldState,
  patronId: string,
  update: (patron: PatronRuntimeState) => PatronRuntimeState,
): WorldState {
  const patron = state.patrons[patronId];
  if (patron === undefined) {
    throw new Error(`Unknown patron in effect: ${patronId}`);
  }
  return {
    ...state,
    patrons: { ...state.patrons, [patronId]: update(patron) },
  };
}

function applyEffect(
  repository: ContentRepository,
  state: WorldState,
  effect: NarrativeEffect,
): WorldState {
  switch (effect.type) {
    case "advance-time": {
      if (!Number.isSafeInteger(effect.minutes) || effect.minutes < 0) {
        throw new Error("Time effects require non-negative integer minutes.");
      }
      return { ...state, clockMinutes: state.clockMinutes + effect.minutes };
    }
    case "set-flag":
      return { ...state, flags: { ...state.flags, [effect.flagId]: effect.value } };
    case "adjust-patron":
      return updatePatron(state, effect.patronId, (patron) => ({
        ...patron,
        [effect.metric]: clampPatronValue(patron[effect.metric] + effect.amount),
      }));
    case "adjust-relationship": {
      const key = relationshipKey(effect.fromId, effect.toId);
      return {
        ...state,
        relationships: {
          ...state.relationships,
          [key]: clampPatronValue((state.relationships[key] ?? 0) + effect.amount),
        },
      };
    }
    case "add-knowledge":
      return appendKnowledge(state, effect.knowledgeId, {
        provenance: effect.provenance,
        acquiredAt: state.clockMinutes,
        ...(effect.sourceCharacterId === undefined
          ? {}
          : { sourceCharacterId: effect.sourceCharacterId }),
        ...(effect.sourceEventId === undefined ? {} : { sourceEventId: effect.sourceEventId }),
      });
    case "add-claim": {
      if (repository.claims[effect.claimId] === undefined) {
        throw new Error(`Unknown claim in effect: ${effect.claimId}`);
      }
      const occurrence = {
        provenance: effect.provenance,
        acquiredAt: state.clockMinutes,
        ...(effect.sourceCharacterId === undefined
          ? {}
          : { sourceCharacterId: effect.sourceCharacterId }),
      };
      const withClaim = {
        ...state,
        claims: {
          ...state.claims,
          [effect.claimId]: [...(state.claims[effect.claimId] ?? []), occurrence],
        },
      };
      return appendKnowledge(withClaim, effect.claimId, {
        provenance: effect.provenance,
        acquiredAt: state.clockMinutes,
        ...(effect.sourceCharacterId === undefined
          ? {}
          : { sourceCharacterId: effect.sourceCharacterId }),
      });
    }
    case "mark-contradiction": {
      if (
        (state.knowledge[effect.firstClaimId]?.length ?? 0) === 0 ||
        (state.knowledge[effect.secondClaimId]?.length ?? 0) === 0
      ) {
        throw new Error("A contradiction cannot be exposed before both claims are known.");
      }
      const key = contradictionKey(effect.firstClaimId, effect.secondClaimId);
      return state.contradictionsExposed.includes(key)
        ? state
        : { ...state, contradictionsExposed: [...state.contradictionsExposed, key] };
    }
    case "set-object-state": {
      const object = repository.objects[effect.objectId];
      if (object === undefined || !object.states.includes(effect.state)) {
        throw new Error(`Invalid object effect ${effect.objectId}:${effect.state}.`);
      }
      return { ...state, objects: { ...state.objects, [effect.objectId]: effect.state } };
    }
    case "set-event-status": {
      const event = state.timeline[effect.eventId];
      if (event === undefined) {
        throw new Error(`Unknown event in effect: ${effect.eventId}`);
      }
      return {
        ...state,
        timeline: { ...state.timeline, [effect.eventId]: { ...event, status: effect.status } },
      };
    }
    case "open-attention": {
      if (repository.attentionWindows[effect.windowId] === undefined) {
        throw new Error(`Unknown attention window: ${effect.windowId}`);
      }
      return {
        ...state,
        mode: "attention",
        attention: { windowId: effect.windowId, selectedOfferId: null, outcomes: {} },
      };
    }
    case "set-chapter":
      if (repository.chapters[effect.chapterId] === undefined) {
        throw new Error(`Unknown chapter in effect: ${effect.chapterId}`);
      }
      return { ...state, chapterId: effect.chapterId };
    case "goto": {
      const destination = repository.nodes[effect.nodeId];
      if (destination === undefined) {
        throw new Error(`Unknown dialogue destination: ${effect.nodeId}`);
      }
      if (!evaluateConditions(repository, state, destination.requires)) {
        throw new Error(`Dialogue destination is not currently reachable: ${effect.nodeId}`);
      }
      return { ...state, mode: "dialogue", currentNodeId: effect.nodeId };
    }
    case "append-epilogue-fact":
      return state.epilogueFacts.includes(effect.factId)
        ? state
        : { ...state, epilogueFacts: [...state.epilogueFacts, effect.factId] };
    case "set-summary":
      if (repository.summaries[effect.summaryId] === undefined) {
        throw new Error(`Unknown summary in effect: ${effect.summaryId}`);
      }
      return { ...state, summaryId: effect.summaryId };
    case "complete":
      if (state.summaryId === null) {
        throw new Error("Scene cannot complete without a selected summary.");
      }
      return { ...state, mode: "complete", currentNodeId: null, attention: null };
  }
}

function applyEffects(
  repository: ContentRepository,
  initialState: WorldState,
  effects: readonly NarrativeEffect[],
): WorldState {
  let state = initialState;
  for (const effect of effects) {
    state = applyEffect(repository, state, effect);
  }
  return state;
}

function applyNodeEntry(
  repository: ContentRepository,
  initialState: WorldState,
  previousNodeId: string | null,
): { readonly state: WorldState; readonly effects: readonly NarrativeEffect[] } {
  if (
    initialState.mode !== "dialogue" ||
    initialState.currentNodeId === null ||
    initialState.currentNodeId === previousNodeId
  ) {
    return { state: initialState, effects: [] };
  }
  const node = repository.nodes[initialState.currentNodeId];
  if (node === undefined) {
    throw new Error(`Missing entered node ${initialState.currentNodeId}.`);
  }
  return {
    state: applyEffects(repository, initialState, node.onEnter),
    effects: node.onEnter,
  };
}

function compareIds(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function applyDueEvents(
  repository: ContentRepository,
  initialState: WorldState,
): { readonly state: WorldState; readonly effects: readonly NarrativeEffect[] } {
  let state = initialState;
  const effects: NarrativeEffect[] = [];
  const dueEvents = repository.bundle.events
    .filter(
      (event) =>
        state.timeline[event.id]?.status === "pending" && event.dueMinute <= state.clockMinutes,
    )
    .toSorted(
      (left, right) =>
        left.dueMinute - right.dueMinute ||
        left.priority - right.priority ||
        compareIds(left.id, right.id),
    );

  for (const event of dueEvents) {
    if (state.mode === "attention") {
      break;
    }
    const statusEffect: NarrativeEffect = {
      type: "set-event-status",
      eventId: event.id,
      status: "announced",
    };
    state = applyEffect(repository, state, statusEffect);
    effects.push(statusEffect);
    state = applyEffects(repository, state, event.effects);
    effects.push(...event.effects);
    if (state.mode !== "attention") {
      const completeEffect: NarrativeEffect = {
        type: "set-event-status",
        eventId: event.id,
        status: "complete",
      };
      state = applyEffect(repository, state, completeEffect);
      effects.push(completeEffect);
    }
  }
  return { state, effects };
}

function resolveAttentionEffects(
  repository: ContentRepository,
  state: WorldState,
  offerId: string,
): readonly NarrativeEffect[] {
  if (state.attention === null) {
    throw new Error("Attention selection requires an open window.");
  }
  const window = repository.attentionWindows[state.attention.windowId];
  const offer = window?.offers.find((candidate) => candidate.id === offerId);
  if (window === undefined || offer === undefined) {
    throw new Error(`Unknown attention offer: ${offerId}`);
  }
  const effects: NarrativeEffect[] = [];
  for (const outcome of offer.outcomes) {
    if (outcome.outcome !== "missed") {
      effects.push({
        type: "add-knowledge",
        knowledgeId: outcome.knowledgeId,
        provenance: outcome.outcome,
        ...(outcome.sourceCharacterId === undefined
          ? {}
          : { sourceCharacterId: outcome.sourceCharacterId }),
        ...(outcome.sourceEventId === undefined ? {} : { sourceEventId: outcome.sourceEventId }),
      });
    }
  }
  effects.push({ type: "set-event-status", eventId: window.eventId, status: "complete" });
  effects.push({ type: "goto", nodeId: offer.gotoNodeId });
  return effects;
}

function withAttentionOutcomes(
  repository: ContentRepository,
  state: WorldState,
  offerId: string,
): WorldState {
  if (state.attention === null) {
    throw new Error("Attention selection requires an open window.");
  }
  const window = repository.attentionWindows[state.attention.windowId];
  const offer = window?.offers.find((candidate) => candidate.id === offerId);
  if (offer === undefined) {
    throw new Error(`Unknown attention offer: ${offerId}`);
  }
  return {
    ...state,
    attention: {
      ...state.attention,
      selectedOfferId: offerId,
      outcomes: Object.fromEntries(
        offer.outcomes.map((outcome) => [outcome.offerId, outcome.outcome]),
      ),
    },
  };
}

export function initializeNarrativeState(repository: ContentRepository, seed?: string): WorldState {
  const rawState = createRawInitialWorldState(repository, seed);
  const node = repository.nodes[rawState.currentNodeId ?? ""];
  if (node === undefined) {
    throw new Error("Narrative entry node is missing.");
  }
  const state = applyEffects(repository, rawState, node.onEnter);
  assertWorldState(repository, state);
  return state;
}

export function dispatchNarrativeCommand(
  repository: ContentRepository,
  state: WorldState,
  command: NarrativeCommand,
): NarrativeDispatchResult {
  if (state.mode === "complete") {
    return { ok: false, state, reason: "scene-complete" };
  }

  let authoredEffects: readonly NarrativeEffect[];
  let stateBeforeEffects = state;
  if (command.type === "choose") {
    if (state.mode !== "dialogue" || state.currentNodeId === null) {
      return { ok: false, state, reason: "wrong-mode" };
    }
    const node = repository.nodes[state.currentNodeId];
    const choice = node?.choices.find((candidate) => candidate.id === command.choiceId);
    if (choice === undefined) {
      return { ok: false, state, reason: "unknown-choice" };
    }
    if (!evaluateConditions(repository, state, choice.requires)) {
      return { ok: false, state, reason: "choice-unavailable" };
    }
    authoredEffects = choice.effects;
  } else {
    if (state.mode !== "attention" || state.attention === null) {
      return { ok: false, state, reason: "wrong-mode" };
    }
    if (state.attention.selectedOfferId !== null) {
      return { ok: false, state, reason: "attention-resolved" };
    }
    const window = repository.attentionWindows[state.attention.windowId];
    if (window?.offers.some((offer) => offer.id === command.offerId) !== true) {
      return { ok: false, state, reason: "unknown-offer" };
    }
    stateBeforeEffects = withAttentionOutcomes(repository, state, command.offerId);
    authoredEffects = resolveAttentionEffects(repository, state, command.offerId);
  }

  const nodeBefore = state.currentNodeId;
  let nextState = applyEffects(repository, stateBeforeEffects, authoredEffects);
  const entry = applyNodeEntry(repository, nextState, nodeBefore);
  nextState = entry.state;
  const scheduled = applyDueEvents(repository, nextState);
  nextState = scheduled.state;
  const allEffects = [...authoredEffects, ...entry.effects, ...scheduled.effects];
  const sequence = state.actionHistory.length + 1;
  const transaction: NarrativeTransaction = {
    sequence,
    command,
    effects: allEffects,
    clockBefore: state.clockMinutes,
    clockAfter: nextState.clockMinutes,
    nodeBefore,
    nodeAfter: nextState.currentNodeId,
  };
  nextState = {
    ...nextState,
    revision: state.revision + 1,
    actionHistory: [...state.actionHistory, transaction],
  };
  assertWorldState(repository, nextState);
  return { ok: true, state: nextState, transaction };
}
