import Ajv2020, { type ErrorObject, type Schema } from "ajv/dist/2020";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { GrayboxLayout } from "../src/content-types/GrayboxLayout";
import {
  ContentValidationError,
  validateNarrativeContent,
} from "../src/narrative/ContentRepository";
import type { NarrativeContentBundle } from "../src/narrative/types";

export interface PhaseZeroContent {
  readonly schemaVersion: 1;
  readonly id: "phase-0-placeholder";
  readonly scene: {
    readonly logicalWidth: 1920;
    readonly logicalHeight: 1080;
  };
  readonly ui: {
    readonly statusKey: string;
  };
}

const DEFAULT_SCHEMA_PATH = "content/schemas/phase-0.schema.json";
const DEFAULT_GRAYBOX_SCHEMA_PATH = "content/schemas/graybox-layout.schema.json";
const DEFAULT_PHASE_TWO_SCHEMA_PATH = "content/schemas/phase-2-sample.schema.json";
const DEFAULT_HISTORICAL_LEDGER_PATH = "research/HISTORICAL_LEDGER.csv";

const REQUIRED_BASE_ANCHORS = [
  "anchor-room-center",
  "anchor-counter",
  "anchor-service-door",
  "anchor-entrance",
  "anchor-television",
  "anchor-telephone",
  "anchor-table-a",
  "anchor-table-b",
  "anchor-table-c",
  "anchor-table-d",
  "anchor-table-e",
  "anchor-patron-north",
  "anchor-patron-east",
  "anchor-patron-south",
  "anchor-patron-west",
  "anchor-sasha-bar",
  "anchor-sasha-television",
  "anchor-sasha-telephone",
  "anchor-walk-center",
  "anchor-walk-east",
  "anchor-walk-west",
] as const;

const REQUIRED_SEAT_ANCHORS = Array.from(
  { length: 18 },
  (_, index) => `anchor-seat-${String(index + 1).padStart(2, "0")}`,
);

const REQUIRED_GRAYBOX_ANCHORS: readonly string[] = [
  ...REQUIRED_BASE_ANCHORS,
  ...REQUIRED_SEAT_ANCHORS,
];

const REQUIRED_POLYGONS = [
  "rear-wall",
  "left-wall",
  "right-wall",
  "floor-plane",
  "service-corridor",
  "service-door",
  "street-entrance",
  "counter-top",
  "counter-front",
] as const;

const REQUIRED_ROUTES = [
  "route-bar-to-television",
  "route-television-to-telephone",
  "route-television-to-bar",
  "route-telephone-to-bar",
] as const;

const REQUIRED_GRAYBOX_VERBS = ["observe", "speak", "serve", "tune", "wait"] as const;

function formatErrors(errors: readonly ErrorObject[] | null | undefined): string {
  if (errors === null || errors === undefined || errors.length === 0) {
    return "unknown schema validation error";
  }

  return errors
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("\n");
}

async function parseJsonFile(filePath: string): Promise<unknown> {
  const source = await readFile(filePath, "utf8");

  try {
    return JSON.parse(source) as unknown;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown JSON parse error";
    throw new Error(`${filePath}: invalid JSON: ${message}`, { cause: error });
  }
}

export async function validatePhaseZeroContentFile(
  contentPath: string,
  schemaPath = resolve(DEFAULT_SCHEMA_PATH),
): Promise<PhaseZeroContent> {
  const [content, schema] = await Promise.all([
    parseJsonFile(contentPath),
    parseJsonFile(schemaPath),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile<PhaseZeroContent>(schema as Schema);

  if (validate(content)) {
    return content;
  }

  throw new Error(`${contentPath}: content validation failed\n${formatErrors(validate.errors)}`);
}

function assertUnique(values: readonly string[], label: string, contentPath: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${contentPath}: ${label} must be unique`);
  }
}

function rectanglesOverlap(
  left: GrayboxLayout["hotspots"][number],
  right: GrayboxLayout["hotspots"][number],
): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

function assertGrayboxSemantics(content: GrayboxLayout, contentPath: string): void {
  const anchorIds = content.anchors.map((anchor) => anchor.id);
  const hotspotIds = content.hotspots.map((hotspot) => hotspot.id);
  const spatialOrders = content.hotspots.map((hotspot) => hotspot.spatialOrder.toString());
  const polygonIds = content.geometry.polygons.map((polygon) => polygon.id);
  const routeIds = content.routes.map((route) => route.id);

  assertUnique(anchorIds, "anchor IDs", contentPath);
  assertUnique(hotspotIds, "hotspot IDs", contentPath);
  assertUnique(spatialOrders, "hotspot spatial orders", contentPath);
  assertUnique(polygonIds, "geometry polygon IDs", contentPath);
  assertUnique(routeIds, "route IDs", contentPath);

  for (const requiredId of REQUIRED_GRAYBOX_ANCHORS) {
    if (!anchorIds.includes(requiredId)) {
      throw new Error(`${contentPath}: missing required anchor ${requiredId}`);
    }
  }

  for (const requiredId of REQUIRED_SEAT_ANCHORS) {
    if (content.anchors.find((anchor) => anchor.id === requiredId)?.kind !== "seat") {
      throw new Error(`${contentPath}: ${requiredId} must be a seat anchor`);
    }
  }

  for (const sashaId of ["anchor-sasha-bar", "anchor-sasha-television", "anchor-sasha-telephone"]) {
    if (content.anchors.find((anchor) => anchor.id === sashaId)?.kind !== "standing") {
      throw new Error(`${contentPath}: ${sashaId} must be a standing anchor`);
    }
  }

  for (const requiredId of REQUIRED_POLYGONS) {
    const polygon = content.geometry.polygons.find((candidate) => candidate.id === requiredId);
    if (polygon === undefined) {
      throw new Error(`${contentPath}: missing required geometry polygon ${requiredId}`);
    }
    if (polygon.points.length % 2 !== 0) {
      throw new Error(`${contentPath}: polygon ${requiredId} must contain x/y coordinate pairs`);
    }
  }

  for (const requiredId of REQUIRED_ROUTES) {
    const route = content.routes.find((candidate) => candidate.id === requiredId);
    if (route === undefined) {
      throw new Error(`${contentPath}: missing required route ${requiredId}`);
    }
    for (const anchorId of [route.fromAnchorId, ...route.waypointAnchorIds, route.toAnchorId]) {
      if (!anchorIds.includes(anchorId)) {
        throw new Error(
          `${contentPath}: route ${requiredId} references unknown anchor ${anchorId}`,
        );
      }
    }
    for (const waypointId of route.waypointAnchorIds) {
      if (content.anchors.find((anchor) => anchor.id === waypointId)?.kind !== "walk") {
        throw new Error(
          `${contentPath}: route ${requiredId} waypoint ${waypointId} is not walkable`,
        );
      }
    }
  }

  if (
    content.verbs.length !== REQUIRED_GRAYBOX_VERBS.length ||
    !REQUIRED_GRAYBOX_VERBS.every((verb) => content.verbs.includes(verb))
  ) {
    throw new Error(`${contentPath}: graybox must expose exactly the five required verbs`);
  }

  for (const hotspot of content.hotspots) {
    if (!anchorIds.includes(hotspot.anchorId)) {
      throw new Error(`${contentPath}: hotspot ${hotspot.id} references an unknown anchor`);
    }
    if (
      hotspot.x + hotspot.width > content.logicalStage.width ||
      hotspot.y + hotspot.height > content.logicalStage.height
    ) {
      throw new Error(`${contentPath}: hotspot ${hotspot.id} exceeds the logical stage`);
    }
  }

  const supportedVerbContract = {
    room: ["observe"],
    "patron-north": ["observe"],
    "patron-east": ["observe", "speak"],
    "patron-south": ["observe", "serve"],
    "patron-west": ["observe"],
    television: ["tune"],
    telephone: [],
  } as const;

  for (const [hotspotId, supportedVerbs] of Object.entries(supportedVerbContract)) {
    const hotspot = content.hotspots.find((candidate) => candidate.id === hotspotId);
    if (
      hotspot === undefined ||
      hotspot.supportedVerbs.length !== supportedVerbs.length ||
      !supportedVerbs.every((verb) => hotspot.supportedVerbs.includes(verb))
    ) {
      throw new Error(`${contentPath}: hotspot ${hotspotId} has incorrect supported verbs`);
    }
  }

  const simultaneousGroups = [
    ["patron-north", "patron-east", "patron-south", "patron-west"],
    ["television", "telephone"],
  ] as const;

  for (const group of simultaneousGroups) {
    const hotspots = group.map((id) => {
      const hotspot = content.hotspots.find((candidate) => candidate.id === id);
      if (hotspot === undefined) {
        throw new Error(`${contentPath}: missing required hotspot ${id}`);
      }
      return hotspot;
    });

    for (let leftIndex = 0; leftIndex < hotspots.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < hotspots.length; rightIndex += 1) {
        const left = hotspots[leftIndex];
        const right = hotspots[rightIndex];
        if (left !== undefined && right !== undefined && rectanglesOverlap(left, right)) {
          throw new Error(
            `${contentPath}: simultaneous hotspots ${left.id} and ${right.id} overlap`,
          );
        }
      }
    }
  }
}

export async function validateGrayboxLayoutFile(
  contentPath: string,
  schemaPath = resolve(DEFAULT_GRAYBOX_SCHEMA_PATH),
): Promise<GrayboxLayout> {
  const [content, schema] = await Promise.all([
    parseJsonFile(contentPath),
    parseJsonFile(schemaPath),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile<GrayboxLayout>(schema as Schema);

  if (!validate(content)) {
    throw new Error(`${contentPath}: content validation failed\n${formatErrors(validate.errors)}`);
  }

  assertGrayboxSemantics(content, contentPath);
  return content;
}

function parseHistoricalLedgerIds(source: string, ledgerPath: string): ReadonlySet<string> {
  const lines = source.split(/\r?\n/u).filter((line) => line.trim() !== "");
  const header = lines.shift();
  if (header?.split(",", 1)[0] !== "ledger_id") {
    throw new Error(`${ledgerPath}: historical ledger must begin with ledger_id`);
  }

  const ids = new Set<string>();
  for (const [index, line] of lines.entries()) {
    const id = line.split(",", 1)[0]?.trim() ?? "";
    if (id === "") {
      throw new Error(`${ledgerPath}: row ${(index + 2).toString()} has no ledger_id`);
    }
    if (ids.has(id)) {
      throw new Error(`${ledgerPath}: duplicate ledger_id ${id}`);
    }
    ids.add(id);
  }
  return ids;
}

export async function validatePhaseTwoContentFile(
  contentPath: string,
  schemaPath = resolve(DEFAULT_PHASE_TWO_SCHEMA_PATH),
  ledgerPath = resolve(DEFAULT_HISTORICAL_LEDGER_PATH),
): Promise<NarrativeContentBundle> {
  const [content, schema, ledgerSource] = await Promise.all([
    parseJsonFile(contentPath),
    parseJsonFile(schemaPath),
    readFile(ledgerPath, "utf8"),
  ]);
  const phaseTwoAjv = new Ajv2020({ allErrors: true, strict: true });
  const validate = phaseTwoAjv.compile<NarrativeContentBundle>(schema as Schema);

  if (!validate(content)) {
    throw new Error(`${contentPath}: content validation failed\n${formatErrors(validate.errors)}`);
  }

  const historicalLedgerIds = parseHistoricalLedgerIds(ledgerSource, ledgerPath);
  try {
    return validateNarrativeContent(content, { historicalLedgerIds });
  } catch (error: unknown) {
    if (error instanceof ContentValidationError) {
      throw new Error(`${contentPath}: semantic validation failed\n${error.message}`, {
        cause: error,
      });
    }
    throw error;
  }
}
