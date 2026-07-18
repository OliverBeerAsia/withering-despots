import type { InteractionVerb } from "../engine/graybox/types";

export type KnowledgeProvenance = "direct" | "fragment" | "secondhand";
export type AttentionOutcome = KnowledgeProvenance | "missed";
export type NarrativeMode = "dialogue" | "attention" | "complete";
export type PatronMetric = "trust" | "agitation" | "publicCertainty" | "privatePressure";
export type EventStatus = "pending" | "announced" | "complete" | "missed";

export interface CharacterDefinition {
  readonly id: string;
  readonly nameKey: string;
  readonly role: "player" | "manager" | "patron";
  readonly historicalStatus: "fictional-composite";
  readonly initial: {
    readonly present: boolean;
    readonly trust: number;
    readonly agitation: number;
    readonly publicCertainty: number;
    readonly privatePressure: number;
  };
}

export interface ClaimDefinition {
  readonly id: string;
  readonly speakerId: string;
  readonly context: "public" | "private";
  readonly repeatable: boolean;
  readonly socialRisk: "none" | "low" | "high";
  readonly contradicts: readonly string[];
  readonly historicalLedgerIds: readonly string[];
}

export interface ChapterDefinition {
  readonly id: string;
  readonly titleKey: string;
  readonly startsAt: number;
}

export interface EventDefinition {
  readonly id: string;
  readonly kind: "room" | "broadcast" | "telephone";
  readonly dueMinute: number;
  readonly priority: number;
  readonly effects: readonly NarrativeEffect[];
  readonly historicalLedgerIds: readonly string[];
  readonly wordingPolicy: "none" | "original-fictionalized";
}

export interface AttentionOutcomeDefinition {
  readonly offerId: string;
  readonly outcome: AttentionOutcome;
  readonly knowledgeId: string;
  readonly sourceCharacterId?: string;
  readonly sourceEventId?: string;
}

export interface AttentionOfferDefinition {
  readonly id: string;
  readonly targetId: string;
  readonly labelKey: string;
  readonly gotoNodeId: string;
  readonly outcomes: readonly AttentionOutcomeDefinition[];
}

export interface AttentionWindowDefinition {
  readonly id: string;
  readonly eventId: string;
  readonly promptKey: string;
  readonly selectionMode: "primary-plus-fragment";
  readonly timeoutMode: "none";
  readonly offers: readonly AttentionOfferDefinition[];
}

export interface InteractionObjectDefinition {
  readonly id: string;
  readonly labelKey: string;
  readonly initialState: string;
  readonly states: readonly string[];
}

export type Condition =
  | { readonly type: "all"; readonly conditions: readonly Condition[] }
  | { readonly type: "any"; readonly conditions: readonly Condition[] }
  | { readonly type: "not"; readonly condition: Condition }
  | { readonly type: "flag"; readonly flagId: string; readonly value: boolean }
  | {
      readonly type: "knowledge";
      readonly knowledgeId: string;
      readonly levels: readonly KnowledgeProvenance[];
    }
  | { readonly type: "object-state"; readonly objectId: string; readonly state: string }
  | { readonly type: "claim-known"; readonly claimId: string }
  | {
      readonly type: "patron-metric";
      readonly patronId: string;
      readonly metric: PatronMetric;
      readonly operator: "gte" | "lte";
      readonly value: number;
    };

export type NarrativeEffect =
  | { readonly type: "advance-time"; readonly minutes: number; readonly reason: string }
  | { readonly type: "set-flag"; readonly flagId: string; readonly value: boolean }
  | {
      readonly type: "adjust-patron";
      readonly patronId: string;
      readonly metric: PatronMetric;
      readonly amount: number;
    }
  | {
      readonly type: "adjust-relationship";
      readonly fromId: string;
      readonly toId: string;
      readonly amount: number;
    }
  | {
      readonly type: "add-knowledge";
      readonly knowledgeId: string;
      readonly provenance: KnowledgeProvenance;
      readonly sourceCharacterId?: string;
      readonly sourceEventId?: string;
    }
  | {
      readonly type: "add-claim";
      readonly claimId: string;
      readonly provenance: KnowledgeProvenance;
      readonly sourceCharacterId?: string;
    }
  | {
      readonly type: "mark-contradiction";
      readonly firstClaimId: string;
      readonly secondClaimId: string;
    }
  | { readonly type: "set-object-state"; readonly objectId: string; readonly state: string }
  | { readonly type: "set-event-status"; readonly eventId: string; readonly status: EventStatus }
  | { readonly type: "open-attention"; readonly windowId: string }
  | { readonly type: "set-chapter"; readonly chapterId: string }
  | { readonly type: "goto"; readonly nodeId: string }
  | { readonly type: "append-epilogue-fact"; readonly factId: string }
  | { readonly type: "set-summary"; readonly summaryId: string }
  | { readonly type: "complete" };

export interface DialogueChoiceDefinition {
  readonly id: string;
  readonly textKey: string;
  readonly kind: InteractionVerb | "silence";
  readonly requires: readonly Condition[];
  readonly effects: readonly NarrativeEffect[];
}

export interface DialoguePresentationDefinition {
  /**
   * Skippable wall-clock pause before this node's choices appear. Narrative
   * time remains authoritative and advances only through effects. Validated
   * content holds are between 10 and 60 seconds.
   */
  readonly holdMs: number;
}

export interface DialogueNodeDefinition {
  readonly id: string;
  readonly speakerId: string | null;
  readonly textKey: string;
  readonly requires: readonly Condition[];
  readonly onEnter: readonly NarrativeEffect[];
  readonly choices: readonly DialogueChoiceDefinition[];
  readonly presentation?: DialoguePresentationDefinition;
}

export interface DialogueGraphDefinition {
  readonly id: string;
  readonly entryNodeId: string;
  readonly nodes: readonly DialogueNodeDefinition[];
}

export interface EpilogueLineDefinition {
  readonly textKey: string;
  readonly requires: readonly Condition[];
}

export interface EpilogueSummaryDefinition {
  readonly id: string;
  readonly titleKey: string;
  readonly requires: readonly Condition[];
  readonly lines: readonly EpilogueLineDefinition[];
}

export interface LocaleEntry {
  readonly key: string;
  readonly text: string;
  readonly allowUnusedReason?: string;
}

export interface NarrativeContentBundle {
  readonly schemaVersion: 1;
  readonly id: "phase-2-sample";
  readonly metadata: {
    readonly status: "sample_not_final_dialogue";
    readonly startMinute: number;
    readonly endMinute: number;
    readonly requiredLocales: readonly ["en"];
    readonly historicalReviewRequired: true;
    readonly culturalReviewRequired: true;
    readonly nativeRussianDialogueReviewRequired: true;
  };
  readonly characters: readonly CharacterDefinition[];
  readonly claims: readonly ClaimDefinition[];
  readonly chapters: readonly ChapterDefinition[];
  readonly events: readonly EventDefinition[];
  readonly attentionWindows: readonly AttentionWindowDefinition[];
  readonly interactionObjects: readonly InteractionObjectDefinition[];
  readonly dialogueGraphs: readonly DialogueGraphDefinition[];
  readonly epilogueSummaries: readonly EpilogueSummaryDefinition[];
  readonly locale: {
    readonly id: "en";
    readonly entries: readonly LocaleEntry[];
  };
}

export interface ContentRepository {
  readonly bundle: NarrativeContentBundle;
  readonly characters: Readonly<Record<string, CharacterDefinition>>;
  readonly claims: Readonly<Record<string, ClaimDefinition>>;
  readonly chapters: Readonly<Record<string, ChapterDefinition>>;
  readonly events: Readonly<Record<string, EventDefinition>>;
  readonly attentionWindows: Readonly<Record<string, AttentionWindowDefinition>>;
  readonly objects: Readonly<Record<string, InteractionObjectDefinition>>;
  readonly nodes: Readonly<Record<string, DialogueNodeDefinition>>;
  readonly choices: Readonly<Record<string, DialogueChoiceDefinition>>;
  readonly summaries: Readonly<Record<string, EpilogueSummaryDefinition>>;
  readonly locale: Readonly<Record<string, string>>;
  readonly entryNodeId: string;
}

export interface PatronRuntimeState {
  readonly present: boolean;
  readonly trust: number;
  readonly agitation: number;
  readonly publicCertainty: number;
  readonly privatePressure: number;
}

export interface KnowledgeRecord {
  readonly provenance: KnowledgeProvenance;
  readonly acquiredAt: number;
  readonly sourceCharacterId?: string;
  readonly sourceEventId?: string;
}

export interface ClaimOccurrence {
  readonly provenance: KnowledgeProvenance;
  readonly acquiredAt: number;
  readonly sourceCharacterId?: string;
}

export interface EventRuntimeState {
  readonly status: EventStatus;
  readonly dueMinute: number;
  readonly priority: number;
}

export interface AttentionRuntimeState {
  readonly windowId: string;
  readonly selectedOfferId: string | null;
  readonly outcomes: Readonly<Record<string, AttentionOutcome>>;
}

export interface ActionRecord {
  readonly sequence: number;
  readonly command: NarrativeCommand;
  readonly effects: readonly NarrativeEffect[];
  readonly clockBefore: number;
  readonly clockAfter: number;
  readonly nodeBefore: string | null;
  readonly nodeAfter: string | null;
}

export interface WorldState {
  readonly schemaVersion: 1;
  readonly contentId: string;
  readonly seed: string;
  readonly rngState: number;
  readonly revision: number;
  readonly clockMinutes: number;
  readonly chapterId: string;
  readonly mode: NarrativeMode;
  readonly currentNodeId: string | null;
  readonly patrons: Readonly<Record<string, PatronRuntimeState>>;
  readonly relationships: Readonly<Record<string, number>>;
  readonly objects: Readonly<Record<string, string>>;
  readonly knowledge: Readonly<Record<string, readonly KnowledgeRecord[]>>;
  readonly claims: Readonly<Record<string, readonly ClaimOccurrence[]>>;
  readonly contradictionsExposed: readonly string[];
  readonly timeline: Readonly<Record<string, EventRuntimeState>>;
  readonly attention: AttentionRuntimeState | null;
  readonly flags: Readonly<Record<string, boolean>>;
  readonly epilogueFacts: readonly string[];
  readonly summaryId: string | null;
  readonly actionHistory: readonly ActionRecord[];
}

export type NarrativeCommand =
  | { readonly type: "choose"; readonly choiceId: string }
  | { readonly type: "select-attention"; readonly offerId: string };

export interface NarrativeTransaction {
  readonly sequence: number;
  readonly command: NarrativeCommand;
  readonly effects: readonly NarrativeEffect[];
  readonly clockBefore: number;
  readonly clockAfter: number;
  readonly nodeBefore: string | null;
  readonly nodeAfter: string | null;
}

export type NarrativeRejectionReason =
  | "scene-complete"
  | "wrong-mode"
  | "unknown-choice"
  | "choice-unavailable"
  | "unknown-offer"
  | "attention-resolved";

export type NarrativeDispatchResult =
  | {
      readonly ok: true;
      readonly state: WorldState;
      readonly transaction: NarrativeTransaction;
    }
  | {
      readonly ok: false;
      readonly state: WorldState;
      readonly reason: NarrativeRejectionReason;
    };

export interface ChoiceView {
  readonly id: string;
  readonly text: string;
  readonly kind: InteractionVerb | "silence";
}

export interface DialogueView {
  readonly nodeId: string;
  readonly speakerName: string;
  readonly text: string;
  readonly choices: readonly ChoiceView[];
}

export interface AttentionOfferView {
  readonly id: string;
  readonly targetId: string;
  readonly label: string;
}

export interface AttentionView {
  readonly windowId: string;
  readonly prompt: string;
  readonly offers: readonly AttentionOfferView[];
}

export interface SummaryView {
  readonly id: string;
  readonly title: string;
  readonly lines: readonly string[];
}
