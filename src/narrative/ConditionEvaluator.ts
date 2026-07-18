import type { Condition, ContentRepository, PatronMetric, WorldState } from "./types";

function compare(left: number, operator: "gte" | "lte", right: number): boolean {
  return operator === "gte" ? left >= right : left <= right;
}

function patronMetric(state: WorldState, patronId: string, metric: PatronMetric): number {
  const patron = state.patrons[patronId];
  if (patron === undefined) {
    throw new Error(`Unknown patron in condition: ${patronId}`);
  }
  return patron[metric];
}

export function evaluateCondition(
  repository: ContentRepository,
  state: WorldState,
  condition: Condition,
): boolean {
  switch (condition.type) {
    case "all":
      return condition.conditions.every((entry) => evaluateCondition(repository, state, entry));
    case "any":
      return condition.conditions.some((entry) => evaluateCondition(repository, state, entry));
    case "not":
      return !evaluateCondition(repository, state, condition.condition);
    case "flag":
      return (state.flags[condition.flagId] ?? false) === condition.value;
    case "knowledge":
      return (state.knowledge[condition.knowledgeId] ?? []).some((record) =>
        condition.levels.includes(record.provenance),
      );
    case "object-state":
      return state.objects[condition.objectId] === condition.state;
    case "claim-known":
      return (state.claims[condition.claimId]?.length ?? 0) > 0;
    case "patron-metric":
      return compare(
        patronMetric(state, condition.patronId, condition.metric),
        condition.operator,
        condition.value,
      );
  }
}

export function evaluateConditions(
  repository: ContentRepository,
  state: WorldState,
  conditions: readonly Condition[],
): boolean {
  return conditions.every((condition) => evaluateCondition(repository, state, condition));
}
