import type {
  ActionRecord,
  AttentionOutcome,
  ContentRepository,
  NarrativeEffect,
  WorldState,
} from "../narrative/types";
import { assertWorldState as assertNarrativeWorldState } from "../narrative/WorldState";

export const SAVE_FORMAT = "withering-despots.save" as const;
export const CURRENT_SAVE_SCHEMA_VERSION = 1 as const;

export type SaveKind = "autosave" | "manual" | "debug";

export interface SaveMetadata {
  readonly kind: SaveKind;
  readonly writtenAtUtc: string;
  readonly buildId: string;
}

export interface VersionedSavePayload {
  readonly format: typeof SAVE_FORMAT;
  readonly schemaVersion: number;
  readonly contentId: string;
  readonly metadata: SaveMetadata;
  readonly state: unknown;
}

export interface SaveEnvelope {
  readonly payload: VersionedSavePayload;
  readonly integrity: {
    readonly algorithm: "SHA-256";
    readonly digestHex: string;
  };
}

export interface SaveMigration {
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly migrate: (state: unknown) => unknown;
}

export class SaveCodecError extends Error {
  constructor(
    message: string,
    readonly code:
      | "invalid-json"
      | "invalid-envelope"
      | "invalid-integrity"
      | "unsupported-version"
      | "invalid-state"
      | "content-mismatch",
  ) {
    super(message);
    this.name = "SaveCodecError";
  }
}

type JsonPrimitive = null | boolean | number | string;
type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

function canonicalize(value: unknown, ancestors: ReadonlySet<object>): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
      throw new SaveCodecError("Save data may contain only safe integer numbers.", "invalid-state");
    }
    return value;
  }

  if (typeof value !== "object") {
    throw new SaveCodecError(
      "Save data contains a value that JSON cannot represent.",
      "invalid-state",
    );
  }

  if (ancestors.has(value)) {
    throw new SaveCodecError("Save data must not contain circular references.", "invalid-state");
  }

  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);

  if (Array.isArray(value)) {
    const enumerableKeys = Object.keys(value);
    if (
      enumerableKeys.some((key) => !/^0$|^[1-9][0-9]*$/u.test(key) || Number(key) >= value.length)
    ) {
      throw new SaveCodecError("Save arrays must not contain named properties.", "invalid-state");
    }
    const output: JsonValue[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) {
        throw new SaveCodecError("Save arrays must not contain empty slots.", "invalid-state");
      }
      output.push(canonicalize(value[index], nextAncestors));
    }
    return output;
  }

  const prototype = Object.getPrototypeOf(value) as object | null;
  if (prototype !== Object.prototype && prototype !== null) {
    throw new SaveCodecError(
      "Save data may contain only plain objects and arrays.",
      "invalid-state",
    );
  }

  const record = value as Record<string, unknown>;
  for (const key of Reflect.ownKeys(record)) {
    if (typeof key !== "string") {
      throw new SaveCodecError("Save objects must not contain symbol keys.", "invalid-state");
    }
    const descriptor = Object.getOwnPropertyDescriptor(record, key);
    if (descriptor?.enumerable !== true || !("value" in descriptor)) {
      throw new SaveCodecError(
        "Save objects may contain only enumerable data properties.",
        "invalid-state",
      );
    }
  }
  const output = Object.create(null) as Record<string, JsonValue>;
  for (const key of Object.keys(record).toSorted()) {
    output[key] = canonicalize(record[key], nextAncestors);
  }
  return output;
}

export function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value, new Set()));
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new SaveCodecError(`${path} must be an object.`, "invalid-envelope");
  }
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new SaveCodecError(`${path} must be a non-empty string.`, "invalid-state");
  }
  return value;
}

function requireNullableString(value: unknown, path: string): string | null {
  if (value === null) {
    return null;
  }
  return requireString(value, path);
}

function requireSafeInteger(value: unknown, path: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum || Object.is(value, -0)) {
    throw new SaveCodecError(
      `${path} must be a safe integer of at least ${String(minimum)}.`,
      "invalid-state",
    );
  }
  return value as number;
}

function requireSignedSafeInteger(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
    throw new SaveCodecError(`${path} must be a safe integer.`, "invalid-state");
  }
  return value as number;
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    throw new SaveCodecError(`${path} must be a boolean.`, "invalid-state");
  }
  return value;
}

function requireStringArray(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value)) {
    throw new SaveCodecError(`${path} must be an array.`, "invalid-state");
  }
  return value.map((item, index) => requireString(item, `${path}[${String(index)}]`));
}

function assertExactKeys(
  record: Record<string, unknown>,
  keys: readonly string[],
  path: string,
): void {
  const expected = new Set(keys);
  for (const key of Object.keys(record)) {
    if (!expected.has(key)) {
      throw new SaveCodecError(`${path} contains unknown property ${key}.`, "invalid-state");
    }
  }
  for (const key of keys) {
    if (!(key in record)) {
      throw new SaveCodecError(`${path} is missing property ${key}.`, "invalid-state");
    }
  }
}

function parsePayload(value: unknown): VersionedSavePayload {
  const payload = requireRecord(value, "payload");
  assertExactKeys(
    payload,
    ["format", "schemaVersion", "contentId", "metadata", "state"],
    "payload",
  );
  if (payload.format !== SAVE_FORMAT) {
    throw new SaveCodecError("Save format is not recognized.", "invalid-envelope");
  }

  const metadata = requireRecord(payload.metadata, "payload.metadata");
  assertExactKeys(metadata, ["kind", "writtenAtUtc", "buildId"], "payload.metadata");
  if (metadata.kind !== "autosave" && metadata.kind !== "manual" && metadata.kind !== "debug") {
    throw new SaveCodecError("payload.metadata.kind is invalid.", "invalid-envelope");
  }

  return {
    format: SAVE_FORMAT,
    schemaVersion: requireSafeInteger(payload.schemaVersion, "payload.schemaVersion", 1),
    contentId: requireString(payload.contentId, "payload.contentId"),
    metadata: {
      kind: metadata.kind,
      writtenAtUtc: requireString(metadata.writtenAtUtc, "payload.metadata.writtenAtUtc"),
      buildId: requireString(metadata.buildId, "payload.metadata.buildId"),
    },
    state: payload.state,
  };
}

function parseEnvelope(value: unknown): SaveEnvelope {
  const envelope = requireRecord(value, "save");
  assertExactKeys(envelope, ["payload", "integrity"], "save");
  const integrity = requireRecord(envelope.integrity, "integrity");
  assertExactKeys(integrity, ["algorithm", "digestHex"], "integrity");
  if (integrity.algorithm !== "SHA-256") {
    throw new SaveCodecError("Save integrity algorithm is not supported.", "invalid-integrity");
  }
  if (typeof integrity.digestHex !== "string" || !/^[0-9a-f]{64}$/u.test(integrity.digestHex)) {
    throw new SaveCodecError("Save integrity digest is malformed.", "invalid-integrity");
  }
  return {
    payload: parsePayload(envelope.payload),
    integrity: { algorithm: "SHA-256", digestHex: integrity.digestHex },
  };
}

export function runSequentialMigrations(
  payload: VersionedSavePayload,
  targetVersion: number,
  migrations: readonly SaveMigration[],
): VersionedSavePayload {
  requireSafeInteger(targetVersion, "targetVersion", 1);
  if (payload.schemaVersion > targetVersion) {
    throw new SaveCodecError(
      `Save version ${String(payload.schemaVersion)} is newer than supported version ${String(targetVersion)}.`,
      "unsupported-version",
    );
  }

  let current = payload;
  while (current.schemaVersion < targetVersion) {
    const matches = migrations.filter(
      (migration) =>
        migration.fromVersion === current.schemaVersion &&
        migration.toVersion === current.schemaVersion + 1,
    );
    if (matches.length !== 1) {
      throw new SaveCodecError(
        `Save migration ${String(current.schemaVersion)} to ${String(current.schemaVersion + 1)} is unavailable or ambiguous.`,
        "unsupported-version",
      );
    }
    const migration = matches[0];
    if (migration === undefined) {
      throw new SaveCodecError("Save migration lookup failed.", "unsupported-version");
    }
    current = {
      ...current,
      schemaVersion: migration.toVersion,
      state: migration.migrate(current.state),
    };
    canonicalJsonStringify(current);
  }
  return current;
}

function assertDefinedId(
  record: Readonly<Record<string, unknown>>,
  id: string,
  path: string,
): void {
  if (!(id in record)) {
    throw new SaveCodecError(`${path} references unknown ID ${id}.`, "content-mismatch");
  }
}

function knownKnowledgeIds(repository: ContentRepository): ReadonlySet<string> {
  const ids = new Set<string>(Object.keys(repository.claims));
  for (const window of Object.values(repository.attentionWindows)) {
    for (const offer of window.offers) {
      for (const outcome of offer.outcomes) {
        ids.add(outcome.knowledgeId);
      }
    }
  }
  const visitEffects = (effects: readonly NarrativeEffect[]): void => {
    for (const effect of effects) {
      if (effect.type === "add-knowledge") {
        ids.add(effect.knowledgeId);
      }
    }
  };
  for (const node of Object.values(repository.nodes)) {
    visitEffects(node.onEnter);
    for (const choice of node.choices) {
      visitEffects(choice.effects);
    }
  }
  for (const event of Object.values(repository.events)) {
    visitEffects(event.effects);
  }
  return ids;
}

function assertSourceIds(
  record: Record<string, unknown>,
  repository: ContentRepository,
  path: string,
): void {
  const sourceCharacterId = record.sourceCharacterId;
  if (sourceCharacterId !== undefined) {
    assertDefinedId(
      repository.characters,
      requireString(sourceCharacterId, `${path}.sourceCharacterId`),
      path,
    );
  }
  const sourceEventId = record.sourceEventId;
  if (sourceEventId !== undefined) {
    assertDefinedId(repository.events, requireString(sourceEventId, `${path}.sourceEventId`), path);
  }
}

function assertStateReferences(state: WorldState, repository: ContentRepository): void {
  if (state.contentId !== repository.bundle.id) {
    throw new SaveCodecError(
      "World state content ID does not match loaded content.",
      "content-mismatch",
    );
  }
  assertDefinedId(repository.chapters, state.chapterId, "state.chapterId");
  if (state.currentNodeId !== null) {
    assertDefinedId(repository.nodes, state.currentNodeId, "state.currentNodeId");
  }

  for (const patronId of Object.keys(state.patrons)) {
    assertDefinedId(repository.characters, patronId, "state.patrons");
  }
  for (const [objectId, objectState] of Object.entries(state.objects)) {
    assertDefinedId(repository.objects, objectId, "state.objects");
    const definition = repository.objects[objectId];
    if (definition === undefined || !definition.states.includes(objectState)) {
      throw new SaveCodecError(
        `state.objects.${objectId} references unknown state ${objectState}.`,
        "content-mismatch",
      );
    }
  }

  const knowledgeIds = knownKnowledgeIds(repository);
  for (const [knowledgeId, records] of Object.entries(state.knowledge)) {
    if (!knowledgeIds.has(knowledgeId)) {
      throw new SaveCodecError(
        `state.knowledge references unknown ID ${knowledgeId}.`,
        "content-mismatch",
      );
    }
    for (const [index, record] of records.entries()) {
      assertSourceIds(
        record as unknown as Record<string, unknown>,
        repository,
        `state.knowledge.${knowledgeId}[${String(index)}]`,
      );
    }
  }
  for (const [claimId, occurrences] of Object.entries(state.claims)) {
    assertDefinedId(repository.claims, claimId, "state.claims");
    for (const [index, occurrence] of occurrences.entries()) {
      assertSourceIds(
        occurrence as unknown as Record<string, unknown>,
        repository,
        `state.claims.${claimId}[${String(index)}]`,
      );
    }
  }
  for (const eventId of Object.keys(state.timeline)) {
    assertDefinedId(repository.events, eventId, "state.timeline");
  }
  if (state.attention !== null) {
    assertDefinedId(
      repository.attentionWindows,
      state.attention.windowId,
      "state.attention.windowId",
    );
    const window = repository.attentionWindows[state.attention.windowId];
    const offerIds = new Set(window?.offers.map((offer) => offer.id));
    if (
      state.attention.selectedOfferId !== null &&
      !offerIds.has(state.attention.selectedOfferId)
    ) {
      throw new SaveCodecError(
        "Selected attention offer is not in its window.",
        "content-mismatch",
      );
    }
    for (const offerId of Object.keys(state.attention.outcomes)) {
      if (!offerIds.has(offerId)) {
        throw new SaveCodecError(
          `Attention outcome references unknown offer ${offerId}.`,
          "content-mismatch",
        );
      }
    }
  }
  if (state.summaryId !== null) {
    assertDefinedId(repository.summaries, state.summaryId, "state.summaryId");
  }
}

function assertAttentionOutcome(value: unknown, path: string): asserts value is AttentionOutcome {
  if (value !== "direct" && value !== "fragment" && value !== "secondhand" && value !== "missed") {
    throw new SaveCodecError(`${path} has an invalid attention outcome.`, "invalid-state");
  }
}

function assertProvenance(value: unknown, path: string): void {
  if (value !== "direct" && value !== "fragment" && value !== "secondhand") {
    throw new SaveCodecError(`${path} has invalid knowledge provenance.`, "invalid-state");
  }
}

function assertEffects(value: unknown, path: string): void {
  if (!Array.isArray(value)) {
    throw new SaveCodecError(`${path} must be an array.`, "invalid-state");
  }
  for (const [index, effect] of value.entries()) {
    assertEffectShape(effect, `${path}[${String(index)}]`);
  }
}

function assertAllowedKeys(
  record: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  path: string,
): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      throw new SaveCodecError(`${path} contains unknown property ${key}.`, "invalid-state");
    }
  }
  for (const key of required) {
    if (!(key in record)) {
      throw new SaveCodecError(`${path} is missing property ${key}.`, "invalid-state");
    }
  }
}

function assertPatronMetric(value: unknown, path: string): void {
  if (
    value !== "trust" &&
    value !== "agitation" &&
    value !== "publicCertainty" &&
    value !== "privatePressure"
  ) {
    throw new SaveCodecError(`${path} is not a patron metric.`, "invalid-state");
  }
}

function assertEffectShape(value: unknown, path: string): void {
  const effect = requireRecord(value, path);
  const type = requireString(effect.type, `${path}.type`);
  switch (type) {
    case "advance-time":
      assertExactKeys(effect, ["type", "minutes", "reason"], path);
      requireSafeInteger(effect.minutes, `${path}.minutes`, 1);
      requireString(effect.reason, `${path}.reason`);
      return;
    case "set-flag":
      assertExactKeys(effect, ["type", "flagId", "value"], path);
      requireString(effect.flagId, `${path}.flagId`);
      requireBoolean(effect.value, `${path}.value`);
      return;
    case "adjust-patron":
      assertExactKeys(effect, ["type", "patronId", "metric", "amount"], path);
      requireString(effect.patronId, `${path}.patronId`);
      assertPatronMetric(effect.metric, `${path}.metric`);
      requireSignedSafeInteger(effect.amount, `${path}.amount`);
      return;
    case "adjust-relationship":
      assertExactKeys(effect, ["type", "fromId", "toId", "amount"], path);
      requireString(effect.fromId, `${path}.fromId`);
      requireString(effect.toId, `${path}.toId`);
      requireSignedSafeInteger(effect.amount, `${path}.amount`);
      return;
    case "add-knowledge":
      assertAllowedKeys(
        effect,
        ["type", "knowledgeId", "provenance"],
        ["sourceCharacterId", "sourceEventId"],
        path,
      );
      requireString(effect.knowledgeId, `${path}.knowledgeId`);
      assertProvenance(effect.provenance, `${path}.provenance`);
      if (effect.sourceCharacterId !== undefined) {
        requireString(effect.sourceCharacterId, `${path}.sourceCharacterId`);
      }
      if (effect.sourceEventId !== undefined) {
        requireString(effect.sourceEventId, `${path}.sourceEventId`);
      }
      return;
    case "add-claim":
      assertAllowedKeys(effect, ["type", "claimId", "provenance"], ["sourceCharacterId"], path);
      requireString(effect.claimId, `${path}.claimId`);
      assertProvenance(effect.provenance, `${path}.provenance`);
      if (effect.sourceCharacterId !== undefined) {
        requireString(effect.sourceCharacterId, `${path}.sourceCharacterId`);
      }
      return;
    case "mark-contradiction":
      assertExactKeys(effect, ["type", "firstClaimId", "secondClaimId"], path);
      requireString(effect.firstClaimId, `${path}.firstClaimId`);
      requireString(effect.secondClaimId, `${path}.secondClaimId`);
      return;
    case "set-object-state":
      assertExactKeys(effect, ["type", "objectId", "state"], path);
      requireString(effect.objectId, `${path}.objectId`);
      requireString(effect.state, `${path}.state`);
      return;
    case "set-event-status":
      assertExactKeys(effect, ["type", "eventId", "status"], path);
      requireString(effect.eventId, `${path}.eventId`);
      if (
        effect.status !== "pending" &&
        effect.status !== "announced" &&
        effect.status !== "complete" &&
        effect.status !== "missed"
      ) {
        throw new SaveCodecError(`${path}.status is invalid.`, "invalid-state");
      }
      return;
    case "open-attention":
      assertExactKeys(effect, ["type", "windowId"], path);
      requireString(effect.windowId, `${path}.windowId`);
      return;
    case "set-chapter":
      assertExactKeys(effect, ["type", "chapterId"], path);
      requireString(effect.chapterId, `${path}.chapterId`);
      return;
    case "goto":
      assertExactKeys(effect, ["type", "nodeId"], path);
      requireString(effect.nodeId, `${path}.nodeId`);
      return;
    case "append-epilogue-fact":
      assertExactKeys(effect, ["type", "factId"], path);
      requireString(effect.factId, `${path}.factId`);
      return;
    case "set-summary":
      assertExactKeys(effect, ["type", "summaryId"], path);
      requireString(effect.summaryId, `${path}.summaryId`);
      return;
    case "complete":
      assertExactKeys(effect, ["type"], path);
      return;
    default:
      throw new SaveCodecError(`${path}.type is not recognized.`, "invalid-state");
  }
}

function assertActionRecord(value: unknown, index: number): asserts value is ActionRecord {
  const path = `state.actionHistory[${String(index)}]`;
  const record = requireRecord(value, path);
  assertExactKeys(
    record,
    ["sequence", "command", "effects", "clockBefore", "clockAfter", "nodeBefore", "nodeAfter"],
    path,
  );
  requireSafeInteger(record.sequence, `${path}.sequence`);
  requireSafeInteger(record.clockBefore, `${path}.clockBefore`);
  requireSafeInteger(record.clockAfter, `${path}.clockAfter`);
  requireNullableString(record.nodeBefore, `${path}.nodeBefore`);
  requireNullableString(record.nodeAfter, `${path}.nodeAfter`);
  const command = requireRecord(record.command, `${path}.command`);
  if (command.type === "choose") {
    assertExactKeys(command, ["type", "choiceId"], `${path}.command`);
    requireString(command.choiceId, `${path}.command.choiceId`);
  } else if (command.type === "select-attention") {
    assertExactKeys(command, ["type", "offerId"], `${path}.command`);
    requireString(command.offerId, `${path}.command.offerId`);
  } else {
    throw new SaveCodecError(`${path}.command has an invalid type.`, "invalid-state");
  }
  assertEffects(record.effects, `${path}.effects`);
}

function assertPatrons(value: unknown): void {
  const patrons = requireRecord(value, "state.patrons");
  for (const [patronId, patronValue] of Object.entries(patrons)) {
    const path = `state.patrons.${patronId}`;
    const patron = requireRecord(patronValue, path);
    assertExactKeys(
      patron,
      ["present", "trust", "agitation", "publicCertainty", "privatePressure"],
      path,
    );
    requireBoolean(patron.present, `${path}.present`);
    requireSignedSafeInteger(patron.trust, `${path}.trust`);
    requireSignedSafeInteger(patron.agitation, `${path}.agitation`);
    requireSignedSafeInteger(patron.publicCertainty, `${path}.publicCertainty`);
    requireSignedSafeInteger(patron.privatePressure, `${path}.privatePressure`);
  }
}

function assertNumberRecord(value: unknown, path: string): void {
  const record = requireRecord(value, path);
  for (const [key, item] of Object.entries(record)) {
    requireString(key, `${path} key`);
    requireSignedSafeInteger(item, `${path}.${key}`);
  }
}

function assertStringRecord(value: unknown, path: string): void {
  const record = requireRecord(value, path);
  for (const [key, item] of Object.entries(record)) {
    requireString(key, `${path} key`);
    requireString(item, `${path}.${key}`);
  }
}

function assertBooleanRecord(value: unknown, path: string): void {
  const record = requireRecord(value, path);
  for (const [key, item] of Object.entries(record)) {
    requireString(key, `${path} key`);
    requireBoolean(item, `${path}.${key}`);
  }
}

function assertKnowledge(value: unknown): void {
  const knowledge = requireRecord(value, "state.knowledge");
  for (const [knowledgeId, occurrences] of Object.entries(knowledge)) {
    if (!Array.isArray(occurrences)) {
      throw new SaveCodecError(`state.knowledge.${knowledgeId} must be an array.`, "invalid-state");
    }
    for (const [index, occurrenceValue] of occurrences.entries()) {
      const path = `state.knowledge.${knowledgeId}[${String(index)}]`;
      const occurrence = requireRecord(occurrenceValue, path);
      const allowedKeys = ["provenance", "acquiredAt", "sourceCharacterId", "sourceEventId"];
      for (const key of Object.keys(occurrence)) {
        if (!allowedKeys.includes(key)) {
          throw new SaveCodecError(`${path} contains unknown property ${key}.`, "invalid-state");
        }
      }
      if (!("provenance" in occurrence) || !("acquiredAt" in occurrence)) {
        throw new SaveCodecError(`${path} is missing a required property.`, "invalid-state");
      }
      assertProvenance(occurrence.provenance, `${path}.provenance`);
      requireSafeInteger(occurrence.acquiredAt, `${path}.acquiredAt`);
      if (occurrence.sourceCharacterId !== undefined) {
        requireString(occurrence.sourceCharacterId, `${path}.sourceCharacterId`);
      }
      if (occurrence.sourceEventId !== undefined) {
        requireString(occurrence.sourceEventId, `${path}.sourceEventId`);
      }
    }
  }
}

function assertClaims(value: unknown): void {
  const claims = requireRecord(value, "state.claims");
  for (const [claimId, occurrences] of Object.entries(claims)) {
    if (!Array.isArray(occurrences)) {
      throw new SaveCodecError(`state.claims.${claimId} must be an array.`, "invalid-state");
    }
    for (const [index, occurrenceValue] of occurrences.entries()) {
      const path = `state.claims.${claimId}[${String(index)}]`;
      const occurrence = requireRecord(occurrenceValue, path);
      const allowedKeys = ["provenance", "acquiredAt", "sourceCharacterId"];
      for (const key of Object.keys(occurrence)) {
        if (!allowedKeys.includes(key)) {
          throw new SaveCodecError(`${path} contains unknown property ${key}.`, "invalid-state");
        }
      }
      for (const key of ["provenance", "acquiredAt"] as const) {
        if (!(key in occurrence)) {
          throw new SaveCodecError(`${path} is missing property ${key}.`, "invalid-state");
        }
      }
      assertProvenance(occurrence.provenance, `${path}.provenance`);
      requireSafeInteger(occurrence.acquiredAt, `${path}.acquiredAt`);
      if (occurrence.sourceCharacterId !== undefined) {
        requireString(occurrence.sourceCharacterId, `${path}.sourceCharacterId`);
      }
    }
  }
}

function assertTimeline(value: unknown): void {
  const timeline = requireRecord(value, "state.timeline");
  for (const [eventId, eventValue] of Object.entries(timeline)) {
    const path = `state.timeline.${eventId}`;
    const event = requireRecord(eventValue, path);
    assertExactKeys(event, ["status", "dueMinute", "priority"], path);
    if (
      event.status !== "pending" &&
      event.status !== "announced" &&
      event.status !== "complete" &&
      event.status !== "missed"
    ) {
      throw new SaveCodecError(`${path}.status is invalid.`, "invalid-state");
    }
    requireSafeInteger(event.dueMinute, `${path}.dueMinute`);
    requireSafeInteger(event.priority, `${path}.priority`);
  }
}

function assertWorldStateShape(value: unknown): asserts value is WorldState {
  const state = requireRecord(value, "state");
  assertExactKeys(
    state,
    [
      "schemaVersion",
      "contentId",
      "seed",
      "rngState",
      "revision",
      "clockMinutes",
      "chapterId",
      "mode",
      "currentNodeId",
      "patrons",
      "relationships",
      "objects",
      "knowledge",
      "claims",
      "contradictionsExposed",
      "timeline",
      "attention",
      "flags",
      "epilogueFacts",
      "summaryId",
      "actionHistory",
    ],
    "state",
  );
  if (state.schemaVersion !== 1) {
    throw new SaveCodecError("World state schema version is unsupported.", "invalid-state");
  }
  requireString(state.contentId, "state.contentId");
  requireString(state.seed, "state.seed");
  const rngState = requireSafeInteger(state.rngState, "state.rngState");
  if (rngState > 0xffff_ffff) {
    throw new SaveCodecError("state.rngState must be an unsigned 32-bit integer.", "invalid-state");
  }
  requireSafeInteger(state.revision, "state.revision");
  requireSafeInteger(state.clockMinutes, "state.clockMinutes");
  requireString(state.chapterId, "state.chapterId");
  if (state.mode !== "dialogue" && state.mode !== "attention" && state.mode !== "complete") {
    throw new SaveCodecError("state.mode is invalid.", "invalid-state");
  }
  requireNullableString(state.currentNodeId, "state.currentNodeId");
  assertPatrons(state.patrons);
  assertNumberRecord(state.relationships, "state.relationships");
  assertStringRecord(state.objects, "state.objects");
  assertKnowledge(state.knowledge);
  assertClaims(state.claims);
  assertTimeline(state.timeline);
  assertBooleanRecord(state.flags, "state.flags");
  requireStringArray(state.contradictionsExposed, "state.contradictionsExposed");
  requireStringArray(state.epilogueFacts, "state.epilogueFacts");
  requireNullableString(state.summaryId, "state.summaryId");

  if (state.attention !== null) {
    const attention = requireRecord(state.attention, "state.attention");
    assertExactKeys(attention, ["windowId", "selectedOfferId", "outcomes"], "state.attention");
    requireString(attention.windowId, "state.attention.windowId");
    requireNullableString(attention.selectedOfferId, "state.attention.selectedOfferId");
    const outcomes = requireRecord(attention.outcomes, "state.attention.outcomes");
    for (const [offerId, outcome] of Object.entries(outcomes)) {
      requireString(offerId, "state.attention.outcomes key");
      assertAttentionOutcome(outcome, `state.attention.outcomes.${offerId}`);
    }
  }
  if (!Array.isArray(state.actionHistory)) {
    throw new SaveCodecError("state.actionHistory must be an array.", "invalid-state");
  }
  state.actionHistory.forEach(assertActionRecord);

  canonicalJsonStringify(state);
}

function assertActionReferences(action: ActionRecord, repository: ContentRepository): void {
  if (action.command.type === "choose") {
    assertDefinedId(repository.choices, action.command.choiceId, "action command");
  } else {
    const offerId = action.command.offerId;
    const knownOffers = Object.values(repository.attentionWindows).flatMap(
      (window) => window.offers,
    );
    if (!knownOffers.some((offer) => offer.id === offerId)) {
      throw new SaveCodecError(
        `Action command references unknown offer ${offerId}.`,
        "content-mismatch",
      );
    }
  }
  if (action.nodeBefore !== null) {
    assertDefinedId(repository.nodes, action.nodeBefore, "action.nodeBefore");
  }
  if (action.nodeAfter !== null) {
    assertDefinedId(repository.nodes, action.nodeAfter, "action.nodeAfter");
  }
  action.effects.forEach((effect, index) => {
    assertEffectReferences(effect, repository, `action.effects[${String(index)}]`);
  });
}

function assertEffectReferences(
  effect: NarrativeEffect,
  repository: ContentRepository,
  path: string,
): void {
  switch (effect.type) {
    case "adjust-patron":
      assertDefinedId(repository.characters, effect.patronId, path);
      return;
    case "adjust-relationship":
      assertDefinedId(repository.characters, effect.fromId, path);
      assertDefinedId(repository.characters, effect.toId, path);
      return;
    case "add-knowledge":
      if (!knownKnowledgeIds(repository).has(effect.knowledgeId)) {
        throw new SaveCodecError(
          `${path} references unknown knowledge ID ${effect.knowledgeId}.`,
          "content-mismatch",
        );
      }
      if (effect.sourceCharacterId !== undefined) {
        assertDefinedId(repository.characters, effect.sourceCharacterId, path);
      }
      if (effect.sourceEventId !== undefined) {
        assertDefinedId(repository.events, effect.sourceEventId, path);
      }
      return;
    case "add-claim":
      assertDefinedId(repository.claims, effect.claimId, path);
      if (effect.sourceCharacterId !== undefined) {
        assertDefinedId(repository.characters, effect.sourceCharacterId, path);
      }
      return;
    case "mark-contradiction":
      assertDefinedId(repository.claims, effect.firstClaimId, path);
      assertDefinedId(repository.claims, effect.secondClaimId, path);
      return;
    case "set-object-state": {
      assertDefinedId(repository.objects, effect.objectId, path);
      const object = repository.objects[effect.objectId];
      if (object === undefined || !object.states.includes(effect.state)) {
        throw new SaveCodecError(`${path} references an unknown object state.`, "content-mismatch");
      }
      return;
    }
    case "set-event-status":
      assertDefinedId(repository.events, effect.eventId, path);
      return;
    case "open-attention":
      assertDefinedId(repository.attentionWindows, effect.windowId, path);
      return;
    case "set-chapter":
      assertDefinedId(repository.chapters, effect.chapterId, path);
      return;
    case "goto":
      assertDefinedId(repository.nodes, effect.nodeId, path);
      return;
    case "set-summary":
      assertDefinedId(repository.summaries, effect.summaryId, path);
      return;
    case "advance-time":
    case "set-flag":
    case "append-epilogue-fact":
    case "complete":
      return;
  }
}

function validateCurrentState(value: unknown, repository: ContentRepository): WorldState {
  assertWorldStateShape(value);
  assertStateReferences(value, repository);
  value.actionHistory.forEach((action) => {
    assertActionReferences(action, repository);
  });
  try {
    assertNarrativeWorldState(repository, value);
  } catch (error) {
    const message = error instanceof Error ? error.message : "World state invariant failed.";
    throw new SaveCodecError(message, "invalid-state");
  }
  return value;
}

export async function encodeSave(
  state: WorldState,
  repository: ContentRepository,
  metadata: SaveMetadata,
): Promise<string> {
  const validatedState = validateCurrentState(state, repository);
  const payload: VersionedSavePayload = {
    format: SAVE_FORMAT,
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    contentId: repository.bundle.id,
    metadata,
    state: validatedState,
  };
  const validatedPayload = parsePayload(payload);
  const digestHex = await sha256Hex(canonicalJsonStringify(validatedPayload));
  return canonicalJsonStringify({
    payload: validatedPayload,
    integrity: { algorithm: "SHA-256", digestHex },
  } satisfies SaveEnvelope);
}

export async function decodeSave(
  serialized: string,
  repository: ContentRepository,
  migrations: readonly SaveMigration[] = [],
): Promise<WorldState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    throw new SaveCodecError("Save data is not valid JSON.", "invalid-json");
  }

  const envelope = parseEnvelope(parsed);
  const actualDigest = await sha256Hex(canonicalJsonStringify(envelope.payload));
  if (actualDigest !== envelope.integrity.digestHex) {
    throw new SaveCodecError("Save checksum does not match its payload.", "invalid-integrity");
  }

  const payload = runSequentialMigrations(
    envelope.payload,
    CURRENT_SAVE_SCHEMA_VERSION,
    migrations,
  );
  if (payload.contentId !== repository.bundle.id) {
    throw new SaveCodecError(
      `Save content ${payload.contentId} does not match loaded content ${repository.bundle.id}.`,
      "content-mismatch",
    );
  }
  return validateCurrentState(payload.state, repository);
}
