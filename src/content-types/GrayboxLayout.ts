import rawLayout from "../../content/graybox-layout.json";

import type { InteractionVerb, PatronId } from "../engine/graybox/types";

export type GrayboxAnchorKind =
  "room" | "fixture" | "door" | "prop" | "table" | "patron" | "standing" | "seat" | "walk";

export type GrayboxGeometryPolygonId =
  | "rear-wall"
  | "left-wall"
  | "right-wall"
  | "floor-plane"
  | "service-corridor"
  | "service-door"
  | "street-entrance"
  | "counter-top"
  | "counter-front";

export interface GrayboxGeometryPolygon {
  readonly id: GrayboxGeometryPolygonId;
  readonly role: "room" | "service" | "door" | "counter";
  readonly points: readonly number[];
}

export interface GrayboxRoute {
  readonly id:
    | "route-bar-to-television"
    | "route-television-to-telephone"
    | "route-television-to-bar"
    | "route-telephone-to-bar";
  readonly fromAnchorId: string;
  readonly toAnchorId: string;
  readonly waypointAnchorIds: readonly string[];
}

export interface GrayboxAnchor {
  readonly id: string;
  readonly kind: GrayboxAnchorKind;
  readonly x: number;
  readonly y: number;
}

export interface GrayboxHotspot {
  readonly id: "room" | PatronId | "television" | "telephone";
  readonly anchorId: string;
  readonly label: string;
  readonly supportedVerbs: readonly InteractionVerb[];
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly spatialOrder: number;
}

export interface GrayboxLayout {
  readonly schemaVersion: 1;
  readonly id: "phase-1-graybox";
  readonly logicalStage: {
    readonly width: 1920;
    readonly height: 1080;
    readonly horizonY: 360;
    readonly subtitleSafeY: 840;
  };
  readonly roomMeters: {
    readonly width: 7.2;
    readonly depth: 5.8;
    readonly height: 2.7;
  };
  readonly geometry: {
    readonly polygons: readonly GrayboxGeometryPolygon[];
  };
  readonly verbs: readonly InteractionVerb[];
  readonly anchors: readonly GrayboxAnchor[];
  readonly routes: readonly GrayboxRoute[];
  readonly hotspots: readonly GrayboxHotspot[];
}

export const GRAYBOX_LAYOUT = rawLayout as GrayboxLayout;

export function findGrayboxAnchor(id: string): GrayboxAnchor {
  const anchor = GRAYBOX_LAYOUT.anchors.find((candidate) => candidate.id === id);

  if (anchor === undefined) {
    throw new Error(`Unknown graybox anchor: ${id}`);
  }

  return anchor;
}
