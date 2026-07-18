import { findGrayboxAnchor, GRAYBOX_LAYOUT } from "../content-types/GrayboxLayout";

export interface GrayboxRoutePoint {
  readonly anchorId: string;
  readonly x: number;
  readonly y: number;
}

export function selectGrayboxRouteAnchorIds(
  fromAnchorId: string,
  toAnchorId: string,
): readonly string[] {
  const route = GRAYBOX_LAYOUT.routes.find(
    (candidate) => candidate.fromAnchorId === fromAnchorId && candidate.toAnchorId === toAnchorId,
  );

  return route === undefined
    ? [fromAnchorId, toAnchorId]
    : [route.fromAnchorId, ...route.waypointAnchorIds, route.toAnchorId];
}

export function selectGrayboxRoutePoints(
  fromAnchorId: string,
  toAnchorId: string,
): readonly GrayboxRoutePoint[] {
  return selectGrayboxRouteAnchorIds(fromAnchorId, toAnchorId).map((anchorId) => {
    const anchor = findGrayboxAnchor(anchorId);
    return { anchorId, x: anchor.x, y: anchor.y };
  });
}
