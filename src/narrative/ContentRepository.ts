import Ajv2020, { type ErrorObject, type Schema } from "ajv/dist/2020";

import rawSchema from "../../content/schemas/phase-2-sample.schema.json";
import type {
  AttentionOfferDefinition,
  AttentionWindowDefinition,
  ChapterDefinition,
  CharacterDefinition,
  ClaimDefinition,
  Condition,
  ContentRepository,
  DialogueChoiceDefinition,
  DialogueGraphDefinition,
  DialogueNodeDefinition,
  EpilogueSummaryDefinition,
  EventDefinition,
  InteractionObjectDefinition,
  NarrativeContentBundle,
  NarrativeEffect,
} from "./types";

export interface ContentRepositoryOptions {
  readonly historicalLedgerIds?: ReadonlySet<string>;
}

export interface ContentDiagnostic {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export class ContentValidationError extends Error {
  public readonly diagnostics: readonly ContentDiagnostic[];

  public constructor(diagnostics: readonly ContentDiagnostic[]) {
    const sortedDiagnostics = [...diagnostics].sort((left, right) => {
      const byPath = compareOrdinal(left.path, right.path);
      return byPath === 0 ? compareOrdinal(left.code, right.code) : byPath;
    });
    super(
      `Phase 2 content validation failed\n${sortedDiagnostics
        .map((diagnostic) => `${diagnostic.code} ${diagnostic.path}: ${diagnostic.message}`)
        .join("\n")}`,
    );
    this.name = "ContentValidationError";
    this.diagnostics = Object.freeze(sortedDiagnostics);
  }
}

interface ReachabilityAnnotation {
  readonly reachability: "intentionally-unreachable";
  readonly reason: string;
}

interface AnnotatedNode extends DialogueNodeDefinition {
  readonly validation?: ReachabilityAnnotation;
}

interface Indexes {
  readonly characters: Record<string, CharacterDefinition>;
  readonly claims: Record<string, ClaimDefinition>;
  readonly chapters: Record<string, ChapterDefinition>;
  readonly events: Record<string, EventDefinition>;
  readonly windows: Record<string, AttentionWindowDefinition>;
  readonly objects: Record<string, InteractionObjectDefinition>;
  readonly graphs: Record<string, DialogueGraphDefinition>;
  readonly nodes: Record<string, DialogueNodeDefinition>;
  readonly choices: Record<string, DialogueChoiceDefinition>;
  readonly summaries: Record<string, EpilogueSummaryDefinition>;
  readonly locale: Record<string, string>;
  readonly offers: Record<string, AttentionOfferDefinition>;
}

interface ConstraintSet {
  readonly flags: Map<string, boolean>;
  readonly knowledge: Map<string, Set<string>>;
  readonly objectStates: Map<string, string>;
  readonly patronMetrics: Map<string, { minimum: number; maximum: number }>;
}

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateBundleSchema = ajv.compile<NarrativeContentBundle>(rawSchema as Schema);

function compareOrdinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function formatSchemaErrors(
  errors: readonly ErrorObject[] | null | undefined,
): ContentDiagnostic[] {
  if (errors === null || errors === undefined || errors.length === 0) {
    return [{ code: "schema.invalid", path: "/", message: "unknown schema error" }];
  }

  return errors.map((error) => ({
    code: `schema.${error.keyword}`,
    path: error.instancePath || "/",
    message: error.message ?? "is invalid",
  }));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child);
  }
  return value;
}

function createRecord<T>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

function register<T extends { readonly id: string }>(
  target: Record<string, T>,
  values: readonly T[],
  kind: string,
  path: string,
  globalIds: Map<string, string>,
  diagnostics: ContentDiagnostic[],
): void {
  for (const [index, value] of values.entries()) {
    const itemPath = `${path}/${index.toString()}/id`;
    if (target[value.id] !== undefined) {
      diagnostics.push({
        code: "id.duplicate",
        path: itemPath,
        message: `duplicate ${kind} ID ${value.id}`,
      });
      continue;
    }

    const priorKind = globalIds.get(value.id);
    if (priorKind !== undefined) {
      diagnostics.push({
        code: "id.conflict",
        path: itemPath,
        message: `${kind} ID ${value.id} is already used by ${priorKind}`,
      });
    } else {
      globalIds.set(value.id, kind);
    }
    target[value.id] = value;
  }
}

function requireReference(
  value: string,
  target: Readonly<Record<string, unknown>>,
  kind: string,
  path: string,
  diagnostics: ContentDiagnostic[],
): void {
  if (target[value] === undefined) {
    diagnostics.push({
      code: "reference.missing",
      path,
      message: `unknown ${kind} ID ${value}`,
    });
  }
}

function createIndexes(bundle: NarrativeContentBundle, diagnostics: ContentDiagnostic[]): Indexes {
  const globalIds = new Map<string, string>();
  const indexes: Indexes = {
    characters: createRecord<CharacterDefinition>(),
    claims: createRecord<ClaimDefinition>(),
    chapters: createRecord<ChapterDefinition>(),
    events: createRecord<EventDefinition>(),
    windows: createRecord<AttentionWindowDefinition>(),
    objects: createRecord<InteractionObjectDefinition>(),
    graphs: createRecord<DialogueGraphDefinition>(),
    nodes: createRecord<DialogueNodeDefinition>(),
    choices: createRecord<DialogueChoiceDefinition>(),
    summaries: createRecord<EpilogueSummaryDefinition>(),
    locale: createRecord<string>(),
    offers: createRecord<AttentionOfferDefinition>(),
  };

  register(
    indexes.characters,
    bundle.characters,
    "character",
    "/characters",
    globalIds,
    diagnostics,
  );
  register(indexes.claims, bundle.claims, "claim", "/claims", globalIds, diagnostics);
  register(indexes.chapters, bundle.chapters, "chapter", "/chapters", globalIds, diagnostics);
  register(indexes.events, bundle.events, "event", "/events", globalIds, diagnostics);
  register(
    indexes.windows,
    bundle.attentionWindows,
    "attention window",
    "/attentionWindows",
    globalIds,
    diagnostics,
  );
  register(
    indexes.objects,
    bundle.interactionObjects,
    "interaction object",
    "/interactionObjects",
    globalIds,
    diagnostics,
  );
  register(
    indexes.graphs,
    bundle.dialogueGraphs,
    "dialogue graph",
    "/dialogueGraphs",
    globalIds,
    diagnostics,
  );
  register(
    indexes.summaries,
    bundle.epilogueSummaries,
    "epilogue summary",
    "/epilogueSummaries",
    globalIds,
    diagnostics,
  );

  for (const [graphIndex, graph] of bundle.dialogueGraphs.entries()) {
    register(
      indexes.nodes,
      graph.nodes,
      "dialogue node",
      `/dialogueGraphs/${graphIndex.toString()}/nodes`,
      globalIds,
      diagnostics,
    );
    for (const [nodeIndex, node] of graph.nodes.entries()) {
      register(
        indexes.choices,
        node.choices,
        "dialogue choice",
        `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/choices`,
        globalIds,
        diagnostics,
      );
    }
  }

  for (const [windowIndex, window] of bundle.attentionWindows.entries()) {
    register(
      indexes.offers,
      window.offers,
      "attention offer",
      `/attentionWindows/${windowIndex.toString()}/offers`,
      globalIds,
      diagnostics,
    );
  }

  for (const [index, entry] of bundle.locale.entries.entries()) {
    if (indexes.locale[entry.key] !== undefined) {
      diagnostics.push({
        code: "locale.duplicate",
        path: `/locale/entries/${index.toString()}/key`,
        message: `duplicate locale key ${entry.key}`,
      });
    } else {
      indexes.locale[entry.key] = entry.text;
    }
  }

  return indexes;
}

function collectLocaleReferences(bundle: NarrativeContentBundle): Map<string, string[]> {
  const references = new Map<string, string[]>();
  const add = (key: string, path: string): void => {
    const paths = references.get(key) ?? [];
    paths.push(path);
    references.set(key, paths);
  };

  add("common.room", "/runtime/common.room");

  for (const [index, character] of bundle.characters.entries()) {
    add(character.nameKey, `/characters/${index.toString()}/nameKey`);
  }
  for (const [index, chapter] of bundle.chapters.entries()) {
    add(chapter.titleKey, `/chapters/${index.toString()}/titleKey`);
  }
  for (const [windowIndex, window] of bundle.attentionWindows.entries()) {
    add(window.promptKey, `/attentionWindows/${windowIndex.toString()}/promptKey`);
    for (const [offerIndex, offer] of window.offers.entries()) {
      add(
        offer.labelKey,
        `/attentionWindows/${windowIndex.toString()}/offers/${offerIndex.toString()}/labelKey`,
      );
    }
  }
  for (const [index, object] of bundle.interactionObjects.entries()) {
    add(object.labelKey, `/interactionObjects/${index.toString()}/labelKey`);
  }
  for (const [graphIndex, graph] of bundle.dialogueGraphs.entries()) {
    for (const [nodeIndex, node] of graph.nodes.entries()) {
      add(
        node.textKey,
        `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/textKey`,
      );
      for (const [choiceIndex, choice] of node.choices.entries()) {
        add(
          choice.textKey,
          `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/choices/${choiceIndex.toString()}/textKey`,
        );
      }
    }
  }
  for (const [summaryIndex, summary] of bundle.epilogueSummaries.entries()) {
    add(summary.titleKey, `/epilogueSummaries/${summaryIndex.toString()}/titleKey`);
    for (const [lineIndex, line] of summary.lines.entries()) {
      add(
        line.textKey,
        `/epilogueSummaries/${summaryIndex.toString()}/lines/${lineIndex.toString()}/textKey`,
      );
    }
  }
  return references;
}

function validateLocales(
  bundle: NarrativeContentBundle,
  indexes: Indexes,
  diagnostics: ContentDiagnostic[],
): void {
  const references = collectLocaleReferences(bundle);
  if (!bundle.metadata.requiredLocales.includes(bundle.locale.id)) {
    diagnostics.push({
      code: "locale.required",
      path: "/locale/id",
      message: `locale ${bundle.locale.id} is not listed in metadata.requiredLocales`,
    });
  }

  for (const [key, paths] of references) {
    if (indexes.locale[key] === undefined) {
      diagnostics.push({
        code: "locale.missing",
        path: paths[0] ?? "/locale",
        message: `missing locale key ${key}`,
      });
    }
  }

  for (const [index, entry] of bundle.locale.entries.entries()) {
    if (!references.has(entry.key) && entry.allowUnusedReason?.trim() === "") {
      diagnostics.push({
        code: "locale.unused-reason",
        path: `/locale/entries/${index.toString()}/allowUnusedReason`,
        message: `unused locale key ${entry.key} has an empty reason`,
      });
    } else if (!references.has(entry.key) && entry.allowUnusedReason === undefined) {
      diagnostics.push({
        code: "locale.unused",
        path: `/locale/entries/${index.toString()}/key`,
        message: `unused locale key ${entry.key} requires allowUnusedReason`,
      });
    }
  }
}

function emptyConstraints(): ConstraintSet {
  return {
    flags: new Map<string, boolean>(),
    knowledge: new Map<string, Set<string>>(),
    objectStates: new Map<string, string>(),
    patronMetrics: new Map<string, { minimum: number; maximum: number }>(),
  };
}

function applyAtomicConstraint(condition: Condition, constraints: ConstraintSet): string | null {
  switch (condition.type) {
    case "flag": {
      const existing = constraints.flags.get(condition.flagId);
      if (existing !== undefined && existing !== condition.value) {
        return `flag ${condition.flagId} is required both true and false`;
      }
      constraints.flags.set(condition.flagId, condition.value);
      return null;
    }
    case "knowledge": {
      const existing = constraints.knowledge.get(condition.knowledgeId);
      const levels = new Set<string>(condition.levels);
      if (existing !== undefined) {
        const intersection = new Set([...existing].filter((level) => levels.has(level)));
        if (intersection.size === 0) {
          return `knowledge ${condition.knowledgeId} requires incompatible provenance levels`;
        }
        constraints.knowledge.set(condition.knowledgeId, intersection);
      } else {
        constraints.knowledge.set(condition.knowledgeId, levels);
      }
      return null;
    }
    case "object-state": {
      const existing = constraints.objectStates.get(condition.objectId);
      if (existing !== undefined && existing !== condition.state) {
        return `object ${condition.objectId} is required in incompatible states`;
      }
      constraints.objectStates.set(condition.objectId, condition.state);
      return null;
    }
    case "patron-metric": {
      const key = `${condition.patronId}:${condition.metric}`;
      const existing = constraints.patronMetrics.get(key) ?? {
        minimum: Number.NEGATIVE_INFINITY,
        maximum: Number.POSITIVE_INFINITY,
      };
      const next =
        condition.operator === "gte"
          ? { minimum: Math.max(existing.minimum, condition.value), maximum: existing.maximum }
          : { minimum: existing.minimum, maximum: Math.min(existing.maximum, condition.value) };
      if (next.minimum > next.maximum) {
        return `${key} has incompatible numeric bounds`;
      }
      constraints.patronMetrics.set(key, next);
      return null;
    }
    case "claim-known":
      return null;
    case "all":
    case "any":
    case "not":
      return null;
  }
}

function findImpossibleConditionSet(conditions: readonly Condition[]): string | null {
  const constraints = emptyConstraints();
  const visitAll = (items: readonly Condition[]): string | null => {
    for (const condition of items) {
      if (condition.type === "all") {
        const nested = visitAll(condition.conditions);
        if (nested !== null) {
          return nested;
        }
        continue;
      }
      if (condition.type === "any") {
        if (
          condition.conditions.length === 0 ||
          condition.conditions.every(
            (candidate) => findImpossibleConditionSet([candidate]) !== null,
          )
        ) {
          return "every branch of an any condition is impossible";
        }
        continue;
      }
      if (condition.type === "not" && condition.condition.type === "flag") {
        const inverted: Condition = {
          type: "flag",
          flagId: condition.condition.flagId,
          value: !condition.condition.value,
        };
        const issue = applyAtomicConstraint(inverted, constraints);
        if (issue !== null) {
          return issue;
        }
        continue;
      }
      const issue = applyAtomicConstraint(condition, constraints);
      if (issue !== null) {
        return issue;
      }
    }
    return null;
  };
  return visitAll(conditions);
}

function validateConditionReferences(
  condition: Condition,
  path: string,
  indexes: Indexes,
  producedFlags: ReadonlySet<string>,
  producedKnowledge: ReadonlySet<string>,
  diagnostics: ContentDiagnostic[],
): void {
  switch (condition.type) {
    case "all":
    case "any":
      if (condition.conditions.length === 0) {
        diagnostics.push({
          code: "condition.empty",
          path,
          message: `${condition.type} condition must contain at least one child`,
        });
      }
      for (const [index, nested] of condition.conditions.entries()) {
        validateConditionReferences(
          nested,
          `${path}/conditions/${index.toString()}`,
          indexes,
          producedFlags,
          producedKnowledge,
          diagnostics,
        );
      }
      break;
    case "not":
      validateConditionReferences(
        condition.condition,
        `${path}/condition`,
        indexes,
        producedFlags,
        producedKnowledge,
        diagnostics,
      );
      break;
    case "flag":
      if (!producedFlags.has(condition.flagId)) {
        diagnostics.push({
          code: "condition.unknown-flag",
          path: `${path}/flagId`,
          message: `flag ${condition.flagId} is never defined by content`,
        });
      }
      break;
    case "knowledge":
      if (condition.levels.length === 0) {
        diagnostics.push({
          code: "condition.empty-knowledge",
          path: `${path}/levels`,
          message: "knowledge condition must allow at least one provenance level",
        });
      }
      if (!producedKnowledge.has(condition.knowledgeId)) {
        diagnostics.push({
          code: "condition.unknown-knowledge",
          path: `${path}/knowledgeId`,
          message: `knowledge ${condition.knowledgeId} is never produced by content`,
        });
      }
      break;
    case "object-state": {
      requireReference(
        condition.objectId,
        indexes.objects,
        "object",
        `${path}/objectId`,
        diagnostics,
      );
      const object = indexes.objects[condition.objectId];
      if (object !== undefined && !object.states.includes(condition.state)) {
        diagnostics.push({
          code: "object.unknown-state",
          path: `${path}/state`,
          message: `object ${condition.objectId} has no state ${condition.state}`,
        });
      }
      break;
    }
    case "claim-known":
      requireReference(condition.claimId, indexes.claims, "claim", `${path}/claimId`, diagnostics);
      break;
    case "patron-metric":
      requireReference(
        condition.patronId,
        indexes.characters,
        "character",
        `${path}/patronId`,
        diagnostics,
      );
      break;
  }
}

function everyEffectList(bundle: NarrativeContentBundle): Array<{
  readonly effects: readonly NarrativeEffect[];
  readonly path: string;
}> {
  const lists: Array<{ effects: readonly NarrativeEffect[]; path: string }> = [];
  for (const [eventIndex, event] of bundle.events.entries()) {
    lists.push({ effects: event.effects, path: `/events/${eventIndex.toString()}/effects` });
  }
  for (const [graphIndex, graph] of bundle.dialogueGraphs.entries()) {
    for (const [nodeIndex, node] of graph.nodes.entries()) {
      lists.push({
        effects: node.onEnter,
        path: `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/onEnter`,
      });
      for (const [choiceIndex, choice] of node.choices.entries()) {
        lists.push({
          effects: choice.effects,
          path: `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/choices/${choiceIndex.toString()}/effects`,
        });
      }
    }
  }
  return lists;
}

function everyConditionList(bundle: NarrativeContentBundle): Array<{
  readonly conditions: readonly Condition[];
  readonly path: string;
}> {
  const lists: Array<{ conditions: readonly Condition[]; path: string }> = [];
  for (const [graphIndex, graph] of bundle.dialogueGraphs.entries()) {
    for (const [nodeIndex, node] of graph.nodes.entries()) {
      lists.push({
        conditions: node.requires,
        path: `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/requires`,
      });
      for (const [choiceIndex, choice] of node.choices.entries()) {
        lists.push({
          conditions: choice.requires,
          path: `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/choices/${choiceIndex.toString()}/requires`,
        });
      }
    }
  }
  for (const [summaryIndex, summary] of bundle.epilogueSummaries.entries()) {
    lists.push({
      conditions: summary.requires,
      path: `/epilogueSummaries/${summaryIndex.toString()}/requires`,
    });
    for (const [lineIndex, line] of summary.lines.entries()) {
      lists.push({
        conditions: line.requires,
        path: `/epilogueSummaries/${summaryIndex.toString()}/lines/${lineIndex.toString()}/requires`,
      });
    }
  }
  return lists;
}

function validateEffectList(
  effects: readonly NarrativeEffect[],
  path: string,
  indexes: Indexes,
  diagnostics: ContentDiagnostic[],
): void {
  const gotoEffects = effects.filter((effect) => effect.type === "goto");
  const completes = effects.filter((effect) => effect.type === "complete");
  if (gotoEffects.length > 1 || (gotoEffects.length > 0 && completes.length > 0)) {
    diagnostics.push({
      code: "effect.conflicting-control-flow",
      path,
      message: "one transaction cannot contain multiple destinations or both goto and complete",
    });
  }

  const flagWrites = new Map<string, boolean>();
  const objectWrites = new Map<string, string>();
  const chapterWrites = new Set<string>();
  const summaryWrites = new Set<string>();

  for (const [index, effect] of effects.entries()) {
    const effectPath = `${path}/${index.toString()}`;
    switch (effect.type) {
      case "advance-time":
        if (!Number.isInteger(effect.minutes) || effect.minutes <= 0) {
          diagnostics.push({
            code: "effect.invalid-time",
            path: `${effectPath}/minutes`,
            message: "advance-time minutes must be a positive integer",
          });
        }
        break;
      case "set-flag": {
        const previous = flagWrites.get(effect.flagId);
        if (previous !== undefined && previous !== effect.value) {
          diagnostics.push({
            code: "effect.conflicting-flag",
            path: effectPath,
            message: `transaction writes conflicting values to flag ${effect.flagId}`,
          });
        }
        flagWrites.set(effect.flagId, effect.value);
        break;
      }
      case "adjust-patron":
        requireReference(
          effect.patronId,
          indexes.characters,
          "character",
          `${effectPath}/patronId`,
          diagnostics,
        );
        break;
      case "adjust-relationship":
        requireReference(
          effect.fromId,
          indexes.characters,
          "character",
          `${effectPath}/fromId`,
          diagnostics,
        );
        requireReference(
          effect.toId,
          indexes.characters,
          "character",
          `${effectPath}/toId`,
          diagnostics,
        );
        if (effect.fromId === effect.toId) {
          diagnostics.push({
            code: "effect.self-relationship",
            path: effectPath,
            message: "relationship adjustment requires two different characters",
          });
        }
        break;
      case "add-knowledge":
        if (effect.sourceCharacterId !== undefined) {
          requireReference(
            effect.sourceCharacterId,
            indexes.characters,
            "character",
            `${effectPath}/sourceCharacterId`,
            diagnostics,
          );
        }
        if (effect.sourceEventId !== undefined) {
          requireReference(
            effect.sourceEventId,
            indexes.events,
            "event",
            `${effectPath}/sourceEventId`,
            diagnostics,
          );
        }
        break;
      case "add-claim":
        requireReference(
          effect.claimId,
          indexes.claims,
          "claim",
          `${effectPath}/claimId`,
          diagnostics,
        );
        if (effect.sourceCharacterId !== undefined) {
          requireReference(
            effect.sourceCharacterId,
            indexes.characters,
            "character",
            `${effectPath}/sourceCharacterId`,
            diagnostics,
          );
        }
        break;
      case "mark-contradiction": {
        requireReference(
          effect.firstClaimId,
          indexes.claims,
          "claim",
          `${effectPath}/firstClaimId`,
          diagnostics,
        );
        requireReference(
          effect.secondClaimId,
          indexes.claims,
          "claim",
          `${effectPath}/secondClaimId`,
          diagnostics,
        );
        if (effect.firstClaimId === effect.secondClaimId) {
          diagnostics.push({
            code: "claim.self-contradiction",
            path: effectPath,
            message: `claim ${effect.firstClaimId} cannot contradict itself`,
          });
        } else {
          const first = indexes.claims[effect.firstClaimId];
          const second = indexes.claims[effect.secondClaimId];
          if (
            first !== undefined &&
            second !== undefined &&
            !first.contradicts.includes(second.id) &&
            !second.contradicts.includes(first.id)
          ) {
            diagnostics.push({
              code: "claim.undeclared-contradiction",
              path: effectPath,
              message: `contradiction ${first.id}/${second.id} is not declared by either claim`,
            });
          }
        }
        break;
      }
      case "set-object-state": {
        requireReference(
          effect.objectId,
          indexes.objects,
          "object",
          `${effectPath}/objectId`,
          diagnostics,
        );
        const object = indexes.objects[effect.objectId];
        if (object !== undefined && !object.states.includes(effect.state)) {
          diagnostics.push({
            code: "object.unknown-state",
            path: `${effectPath}/state`,
            message: `object ${effect.objectId} has no state ${effect.state}`,
          });
        }
        const priorState = objectWrites.get(effect.objectId);
        if (priorState !== undefined && priorState !== effect.state) {
          diagnostics.push({
            code: "effect.conflicting-object-state",
            path: effectPath,
            message: `transaction writes conflicting states to object ${effect.objectId}`,
          });
        }
        objectWrites.set(effect.objectId, effect.state);
        break;
      }
      case "set-event-status":
        requireReference(
          effect.eventId,
          indexes.events,
          "event",
          `${effectPath}/eventId`,
          diagnostics,
        );
        break;
      case "open-attention":
        requireReference(
          effect.windowId,
          indexes.windows,
          "attention window",
          `${effectPath}/windowId`,
          diagnostics,
        );
        break;
      case "set-chapter":
        requireReference(
          effect.chapterId,
          indexes.chapters,
          "chapter",
          `${effectPath}/chapterId`,
          diagnostics,
        );
        chapterWrites.add(effect.chapterId);
        break;
      case "goto":
        requireReference(
          effect.nodeId,
          indexes.nodes,
          "dialogue node",
          `${effectPath}/nodeId`,
          diagnostics,
        );
        break;
      case "append-epilogue-fact":
        break;
      case "set-summary":
        requireReference(
          effect.summaryId,
          indexes.summaries,
          "epilogue summary",
          `${effectPath}/summaryId`,
          diagnostics,
        );
        summaryWrites.add(effect.summaryId);
        break;
      case "complete":
        break;
    }
  }

  if (chapterWrites.size > 1) {
    diagnostics.push({
      code: "effect.conflicting-chapter",
      path,
      message: "one transaction cannot set more than one chapter",
    });
  }
  if (summaryWrites.size > 1) {
    diagnostics.push({
      code: "effect.conflicting-summary",
      path,
      message: "one transaction cannot set more than one summary",
    });
  }
}

function validateReferences(
  bundle: NarrativeContentBundle,
  indexes: Indexes,
  options: ContentRepositoryOptions,
  diagnostics: ContentDiagnostic[],
): void {
  const effectLists = everyEffectList(bundle);
  const producedFlags = new Set<string>();
  const producedKnowledge = new Set<string>();
  for (const { effects } of effectLists) {
    for (const effect of effects) {
      if (effect.type === "set-flag") {
        producedFlags.add(effect.flagId);
      } else if (effect.type === "add-knowledge") {
        producedKnowledge.add(effect.knowledgeId);
      }
    }
  }
  for (const window of bundle.attentionWindows) {
    for (const offer of window.offers) {
      for (const outcome of offer.outcomes) {
        if (outcome.outcome !== "missed") {
          producedKnowledge.add(outcome.knowledgeId);
        }
      }
    }
  }

  const validateLedgerIds = (ids: readonly string[], path: string): void => {
    for (const [index, id] of ids.entries()) {
      if (options.historicalLedgerIds !== undefined && !options.historicalLedgerIds.has(id)) {
        diagnostics.push({
          code: "ledger.missing",
          path: `${path}/${index.toString()}`,
          message: `unknown historical ledger ID ${id}`,
        });
      }
    }
  };

  for (const [claimIndex, claim] of bundle.claims.entries()) {
    requireReference(
      claim.speakerId,
      indexes.characters,
      "character",
      `/claims/${claimIndex.toString()}/speakerId`,
      diagnostics,
    );
    validateLedgerIds(
      claim.historicalLedgerIds,
      `/claims/${claimIndex.toString()}/historicalLedgerIds`,
    );
    if (claim.context === "private" && claim.repeatable && claim.socialRisk === "none") {
      diagnostics.push({
        code: "claim.private-without-cost",
        path: `/claims/${claimIndex.toString()}/socialRisk`,
        message: `repeatable private claim ${claim.id} requires a social cost`,
      });
    }
    for (const [contradictionIndex, targetId] of claim.contradicts.entries()) {
      requireReference(
        targetId,
        indexes.claims,
        "claim",
        `/claims/${claimIndex.toString()}/contradicts/${contradictionIndex.toString()}`,
        diagnostics,
      );
      if (targetId === claim.id) {
        diagnostics.push({
          code: "claim.self-contradiction",
          path: `/claims/${claimIndex.toString()}/contradicts/${contradictionIndex.toString()}`,
          message: `claim ${claim.id} cannot contradict itself`,
        });
      }
    }
  }

  for (const [eventIndex, event] of bundle.events.entries()) {
    validateLedgerIds(
      event.historicalLedgerIds,
      `/events/${eventIndex.toString()}/historicalLedgerIds`,
    );
  }

  for (const [objectIndex, object] of bundle.interactionObjects.entries()) {
    if (!object.states.includes(object.initialState)) {
      diagnostics.push({
        code: "object.invalid-initial-state",
        path: `/interactionObjects/${objectIndex.toString()}/initialState`,
        message: `initial state ${object.initialState} is not declared by object ${object.id}`,
      });
    }
  }

  for (const [graphIndex, graph] of bundle.dialogueGraphs.entries()) {
    requireReference(
      graph.entryNodeId,
      indexes.nodes,
      "dialogue node",
      `/dialogueGraphs/${graphIndex.toString()}/entryNodeId`,
      diagnostics,
    );
    for (const [nodeIndex, node] of graph.nodes.entries()) {
      if (node.speakerId !== null) {
        requireReference(
          node.speakerId,
          indexes.characters,
          "character",
          `/dialogueGraphs/${graphIndex.toString()}/nodes/${nodeIndex.toString()}/speakerId`,
          diagnostics,
        );
      }
    }
  }

  for (const [windowIndex, window] of bundle.attentionWindows.entries()) {
    requireReference(
      window.eventId,
      indexes.events,
      "event",
      `/attentionWindows/${windowIndex.toString()}/eventId`,
      diagnostics,
    );
    const offerIds = new Set(window.offers.map((offer) => offer.id));
    for (const [offerIndex, offer] of window.offers.entries()) {
      const offerPath = `/attentionWindows/${windowIndex.toString()}/offers/${offerIndex.toString()}`;
      if (
        indexes.characters[offer.targetId] === undefined &&
        indexes.objects[offer.targetId] === undefined
      ) {
        diagnostics.push({
          code: "attention.unknown-target",
          path: `${offerPath}/targetId`,
          message: `attention target ${offer.targetId} is neither a character nor an interaction object`,
        });
      }
      requireReference(
        offer.gotoNodeId,
        indexes.nodes,
        "dialogue node",
        `${offerPath}/gotoNodeId`,
        diagnostics,
      );
      const outcomeOfferIds = new Set<string>();
      const outcomes = new Set<string>();
      for (const [outcomeIndex, outcome] of offer.outcomes.entries()) {
        const outcomePath = `${offerPath}/outcomes/${outcomeIndex.toString()}`;
        if (!offerIds.has(outcome.offerId)) {
          diagnostics.push({
            code: "attention.unknown-offer",
            path: `${outcomePath}/offerId`,
            message: `outcome references unknown offer ${outcome.offerId}`,
          });
        }
        if (outcomeOfferIds.has(outcome.offerId)) {
          diagnostics.push({
            code: "attention.duplicate-outcome",
            path: `${outcomePath}/offerId`,
            message: `offer ${outcome.offerId} has more than one outcome for selection ${offer.id}`,
          });
        }
        outcomeOfferIds.add(outcome.offerId);
        outcomes.add(outcome.outcome);
        if (outcome.sourceCharacterId !== undefined) {
          requireReference(
            outcome.sourceCharacterId,
            indexes.characters,
            "character",
            `${outcomePath}/sourceCharacterId`,
            diagnostics,
          );
        }
        if (outcome.sourceEventId !== undefined) {
          requireReference(
            outcome.sourceEventId,
            indexes.events,
            "event",
            `${outcomePath}/sourceEventId`,
            diagnostics,
          );
        }
      }
      if (outcomeOfferIds.size !== offerIds.size) {
        diagnostics.push({
          code: "attention.incomplete-outcomes",
          path: `${offerPath}/outcomes`,
          message: `selection ${offer.id} must define one outcome for every offer`,
        });
      }
      const ownOutcome = offer.outcomes.find((outcome) => outcome.offerId === offer.id);
      if (ownOutcome?.outcome !== "direct") {
        diagnostics.push({
          code: "attention.selected-not-direct",
          path: `${offerPath}/outcomes`,
          message: `selected offer ${offer.id} must resolve to direct knowledge`,
        });
      }
      if (!outcomes.has("fragment") || !outcomes.has("missed")) {
        diagnostics.push({
          code: "attention.missing-outcome-kind",
          path: `${offerPath}/outcomes`,
          message: `selection ${offer.id} must also produce fragment and missed outcomes`,
        });
      }
    }
  }

  for (const { effects, path } of effectLists) {
    validateEffectList(effects, path, indexes, diagnostics);
  }

  for (const { conditions, path } of everyConditionList(bundle)) {
    const impossibleReason = findImpossibleConditionSet(conditions);
    if (impossibleReason !== null) {
      diagnostics.push({ code: "condition.impossible", path, message: impossibleReason });
    }
    for (const [index, condition] of conditions.entries()) {
      validateConditionReferences(
        condition,
        `${path}/${index.toString()}`,
        indexes,
        producedFlags,
        producedKnowledge,
        diagnostics,
      );
    }
  }
}

function effectDestinations(
  effects: readonly NarrativeEffect[],
  indexes: Indexes,
): { readonly nodes: string[]; readonly exits: boolean } {
  const nodes: string[] = [];
  let exits = false;
  for (const effect of effects) {
    if (effect.type === "goto") {
      nodes.push(effect.nodeId);
    } else if (effect.type === "open-attention") {
      const window = indexes.windows[effect.windowId];
      if (window !== undefined) {
        nodes.push(...window.offers.map((offer) => offer.gotoNodeId));
      }
    } else if (effect.type === "complete" || effect.type === "set-summary") {
      exits = true;
    }
  }
  return { nodes, exits };
}

function validateReachability(
  bundle: NarrativeContentBundle,
  indexes: Indexes,
  diagnostics: ContentDiagnostic[],
): Set<string> {
  const reachable = new Set<string>();
  const queue: string[] = [];
  for (const graph of bundle.dialogueGraphs) {
    queue.push(graph.entryNodeId);
  }
  for (const event of bundle.events) {
    queue.push(...effectDestinations(event.effects, indexes).nodes);
  }

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (nodeId === undefined || reachable.has(nodeId)) {
      continue;
    }
    const node = indexes.nodes[nodeId];
    if (node === undefined || findImpossibleConditionSet(node.requires) !== null) {
      continue;
    }
    reachable.add(nodeId);
    const nodeDestinations = effectDestinations(node.onEnter, indexes).nodes;
    queue.push(...nodeDestinations);
    for (const choice of node.choices) {
      if (findImpossibleConditionSet(choice.requires) === null) {
        queue.push(...effectDestinations(choice.effects, indexes).nodes);
      }
    }
  }

  for (const [nodeId, node] of Object.entries(indexes.nodes)) {
    const annotation = (node as AnnotatedNode).validation;
    if (reachable.has(nodeId)) {
      if (annotation?.reachability === "intentionally-unreachable") {
        diagnostics.push({
          code: "reachability.false-annotation",
          path: `/nodes/${nodeId}/validation`,
          message: `node ${nodeId} is reachable but marked intentionally unreachable`,
        });
      }
      continue;
    }
    if (
      annotation?.reachability === "intentionally-unreachable" &&
      annotation.reason.trim() !== ""
    ) {
      continue;
    }
    diagnostics.push({
      code: "reachability.unreachable",
      path: `/nodes/${nodeId}`,
      message: `node ${nodeId} is unreachable and has no intentional annotation`,
    });
  }

  const canExit = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const nodeId of reachable) {
      if (canExit.has(nodeId)) {
        continue;
      }
      const node = indexes.nodes[nodeId];
      if (node === undefined) {
        continue;
      }
      const paths = [node.onEnter, ...node.choices.map((choice) => choice.effects)];
      const hasExit = paths.some((effects) => {
        const destinations = effectDestinations(effects, indexes);
        return destinations.exits || destinations.nodes.some((target) => canExit.has(target));
      });
      if (hasExit) {
        canExit.add(nodeId);
        changed = true;
      }
    }
  }
  for (const nodeId of reachable) {
    if (!canExit.has(nodeId)) {
      diagnostics.push({
        code: "reachability.no-exit",
        path: `/nodes/${nodeId}`,
        message: `node ${nodeId} has no reachable completion path`,
      });
    }
  }

  const introducedClaims = new Set<string>();
  const selectedSummaries = new Set<string>();
  const reachableEffectLists = bundle.events.map((event) => event.effects);
  for (const nodeId of reachable) {
    const node = indexes.nodes[nodeId];
    if (node !== undefined) {
      reachableEffectLists.push(node.onEnter, ...node.choices.map((choice) => choice.effects));
    }
  }
  for (const effects of reachableEffectLists) {
    for (const effect of effects) {
      if (effect.type === "add-claim") {
        introducedClaims.add(effect.claimId);
      } else if (effect.type === "set-summary") {
        selectedSummaries.add(effect.summaryId);
      }
    }
  }
  for (const claim of bundle.claims) {
    if (!introducedClaims.has(claim.id)) {
      diagnostics.push({
        code: "claim.orphan",
        path: `/claims/${claim.id}`,
        message: `claim ${claim.id} is never introduced by an effect`,
      });
    }
  }
  for (const summary of bundle.epilogueSummaries) {
    if (!selectedSummaries.has(summary.id)) {
      diagnostics.push({
        code: "summary.orphan",
        path: `/epilogueSummaries/${summary.id}`,
        message: `summary ${summary.id} is never selected by an effect`,
      });
    }
  }

  return reachable;
}

function freezeRecord<T>(record: Record<string, T>): Readonly<Record<string, T>> {
  return Object.freeze(record);
}

export function loadContentRepository(
  input: unknown,
  options: ContentRepositoryOptions = {},
): ContentRepository {
  if (!validateBundleSchema(input)) {
    throw new ContentValidationError(formatSchemaErrors(validateBundleSchema.errors));
  }

  const bundle = input;
  const diagnostics: ContentDiagnostic[] = [];
  const indexes = createIndexes(bundle, diagnostics);
  validateLocales(bundle, indexes, diagnostics);
  validateReferences(bundle, indexes, options, diagnostics);
  validateReachability(bundle, indexes, diagnostics);

  if (bundle.dialogueGraphs.length !== 1) {
    diagnostics.push({
      code: "graph.entry-ambiguous",
      path: "/dialogueGraphs",
      message: "the Phase 2 sample requires exactly one dialogue graph",
    });
  }

  if (diagnostics.length > 0) {
    throw new ContentValidationError(diagnostics);
  }

  deepFreeze(bundle);
  return Object.freeze({
    bundle,
    characters: freezeRecord(indexes.characters),
    claims: freezeRecord(indexes.claims),
    chapters: freezeRecord(indexes.chapters),
    events: freezeRecord(indexes.events),
    attentionWindows: freezeRecord(indexes.windows),
    objects: freezeRecord(indexes.objects),
    nodes: freezeRecord(indexes.nodes),
    choices: freezeRecord(indexes.choices),
    summaries: freezeRecord(indexes.summaries),
    locale: freezeRecord(indexes.locale),
    entryNodeId: bundle.dialogueGraphs[0]?.entryNodeId ?? "",
  });
}

export function validateNarrativeContent(
  input: unknown,
  options: ContentRepositoryOptions = {},
): NarrativeContentBundle {
  return loadContentRepository(input, options).bundle;
}
