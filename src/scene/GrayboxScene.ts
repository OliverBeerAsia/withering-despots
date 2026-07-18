import { Container, Graphics } from "pixi.js";

import {
  findGrayboxAnchor,
  GRAYBOX_LAYOUT,
  type GrayboxGeometryPolygon,
} from "../content-types/GrayboxLayout";
import { GRAYBOX_PATRON_IDS } from "../engine/graybox/content";
import { selectSashaAnchorId } from "../engine/graybox/selectors";
import type { GrayboxState } from "../engine/graybox/types";
import { selectGrayboxRoutePoints } from "./grayboxRoutes";
import type { NarrativeGrayboxProjection } from "./NarrativeGrayboxProjection";

export const LOGICAL_STAGE = Object.freeze({
  width: GRAYBOX_LAYOUT.logicalStage.width,
  height: GRAYBOX_LAYOUT.logicalStage.height,
});

const PALETTE = Object.freeze({
  wallBack: 0x1a2227,
  wallSide: 0x232c30,
  floor: 0x39352f,
  floorLine: 0x635d52,
  counter: 0x3d4949,
  counterEdge: 0xa5b8b3,
  table: 0x5b5146,
  tableEdge: 0xb9aa91,
  chair: 0x3e4544,
  fixture: 0x161b1e,
  fixtureActive: 0xd6b66a,
  fixtureMissed: 0x4f5555,
  patron: 0x76888b,
  patronObserved: 0xb8d6cf,
  patronFocus: 0xf0cd72,
  sasha: 0xa77962,
  debug: 0x62d8ed,
  completion: 0x93aaa7,
});

const TABLE_IDS = ["a", "b", "c", "d", "e"] as const;

function drawPerson(
  graphics: Graphics,
  x: number,
  y: number,
  color: number,
  scale = 1,
  headOffsetX = 0,
): void {
  graphics
    .circle(x + headOffsetX * scale, y - 62 * scale, 24 * scale)
    .fill(color)
    .roundRect(x - 34 * scale, y - 37 * scale, 68 * scale, 92 * scale, 20 * scale)
    .fill(color)
    .rect(x - 28 * scale, y + 44 * scale, 22 * scale, 58 * scale)
    .fill(color)
    .rect(x + 6 * scale, y + 44 * scale, 22 * scale, 58 * scale)
    .fill(color);
}

function polygonColor(polygon: GrayboxGeometryPolygon): number {
  switch (polygon.id) {
    case "floor-plane":
      return PALETTE.floor;
    case "left-wall":
    case "right-wall":
      return PALETTE.wallSide;
    case "service-corridor":
    case "service-door":
    case "street-entrance":
      return PALETTE.fixture;
    case "counter-top":
      return PALETTE.counterEdge;
    case "counter-front":
      return PALETTE.counter;
    case "rear-wall":
      return PALETTE.wallBack;
  }
}

export class GrayboxScene extends Container {
  readonly staticLayer = new Graphics({ label: "graybox-room" });
  readonly sashaLayer = new Graphics({ label: "graybox-sasha" });
  readonly galinaLayer = new Graphics({ label: "graybox-galina" });
  readonly foregroundLayer = new Graphics({ label: "graybox-counter-foreground" });
  private stateLayer = new Container({ label: "graybox-state" });
  private patronLayers = new Map<string, Graphics>();
  private eastAnswerReaction = new Graphics({ label: "graybox-east-answer" });
  private eastSilenceReaction = new Graphics({ label: "graybox-east-silence" });
  private teaReaction = new Graphics({ label: "graybox-tea" });
  private vodkaReaction = new Graphics({ label: "graybox-vodka" });
  private missedTelevisionReaction = new Graphics({ label: "graybox-missed-television" });
  private missedTelephoneReaction = new Graphics({ label: "graybox-missed-telephone" });
  private completionReaction = new Graphics({ label: "graybox-completion" });
  private photographReaction = new Graphics({ label: "graybox-photograph" });
  readonly debugLayer = new Graphics({ label: "graybox-debug" });
  private sashaAnchorId: string | null = null;
  private sashaAnimationFrame: number | null = null;

  constructor() {
    super({ label: "phase-one-graybox" });
    this.addChild(
      this.staticLayer,
      this.sashaLayer,
      this.galinaLayer,
      this.foregroundLayer,
      this.stateLayer,
      this.debugLayer,
    );
    this.drawRoom();
    drawPerson(this.sashaLayer, 0, 0, PALETTE.sasha, 0.92);
    drawPerson(this.galinaLayer, 610, 500, PALETTE.patronObserved, 0.76);
    this.drawStateGeometry();
  }

  private drawRoom(): void {
    const graphics = this.staticLayer.clear();
    this.foregroundLayer.clear();

    graphics.rect(0, 0, LOGICAL_STAGE.width, LOGICAL_STAGE.height).fill(0x10171c);
    for (const polygon of GRAYBOX_LAYOUT.geometry.polygons) {
      if (polygon.role !== "counter") {
        graphics
          .poly([...polygon.points])
          .fill(polygonColor(polygon))
          .stroke({ color: PALETTE.floorLine, width: 3, alpha: 0.5 });
      }
    }

    for (const [vanishingX, floorX] of [
      [20, 240],
      [20, 960],
      [20, 1680],
      [1900, 240],
      [1900, 960],
      [1900, 1680],
    ] as const) {
      graphics
        .moveTo(vanishingX, GRAYBOX_LAYOUT.logicalStage.horizonY)
        .lineTo(floorX, 1080)
        .stroke({ color: PALETTE.floorLine, width: 2, alpha: 0.24 });
    }

    for (const y of [700, 850, 1020]) {
      graphics
        .moveTo(80, y)
        .lineTo(1840, y)
        .stroke({ color: PALETTE.floorLine, width: 2, alpha: 0.22 });
    }

    for (const tableId of TABLE_IDS) {
      const anchor = findGrayboxAnchor(`anchor-table-${tableId}`);
      const depthScale = Math.max(0.72, anchor.y / 900);
      const width = 190 * depthScale;
      const height = 76 * depthScale;
      graphics
        .ellipse(anchor.x, anchor.y, width / 2, height / 2)
        .fill(PALETTE.table)
        .stroke({ color: PALETTE.tableEdge, width: 5 })
        .rect(anchor.x - 12, anchor.y + height / 3, 24, 80 * depthScale)
        .fill(PALETTE.chair);
    }

    for (const anchor of GRAYBOX_LAYOUT.anchors.filter((candidate) => candidate.kind === "seat")) {
      graphics
        .ellipse(anchor.x, anchor.y, 28, 11)
        .fill({ color: PALETTE.chair, alpha: 0.7 })
        .stroke({ color: PALETTE.tableEdge, width: 2, alpha: 0.45 });
    }

    const television = findGrayboxAnchor("anchor-television");
    graphics
      .rect(television.x - 104, television.y - 78, 208, 156)
      .fill(PALETTE.counter)
      .stroke({ color: PALETTE.counterEdge, width: 7 })
      .rect(television.x - 82, television.y - 58, 148, 104)
      .fill(PALETTE.fixture)
      .circle(television.x + 82, television.y - 22, 8)
      .fill(PALETTE.counterEdge)
      .circle(television.x + 82, television.y + 14, 8)
      .fill(PALETTE.counterEdge);

    const telephone = findGrayboxAnchor("anchor-telephone");
    graphics
      .rect(telephone.x - 55, telephone.y - 30, 110, 60)
      .fill(PALETTE.fixture)
      .stroke({ color: PALETTE.counterEdge, width: 5 })
      .moveTo(telephone.x - 40, telephone.y - 4)
      .bezierCurveTo(
        telephone.x - 18,
        telephone.y - 35,
        telephone.x + 18,
        telephone.y - 35,
        telephone.x + 40,
        telephone.y - 4,
      )
      .stroke({ color: PALETTE.counterEdge, width: 9 })
      .moveTo(telephone.x + 44, telephone.y + 20)
      .bezierCurveTo(
        telephone.x + 72,
        telephone.y + 38,
        telephone.x + 56,
        telephone.y + 62,
        telephone.x + 82,
        telephone.y + 74,
      )
      .stroke({ color: PALETTE.counterEdge, width: 3, alpha: 0.75 });

    for (const polygon of GRAYBOX_LAYOUT.geometry.polygons.filter(
      (candidate) => candidate.role === "counter",
    )) {
      this.foregroundLayer
        .poly([...polygon.points])
        .fill(polygonColor(polygon))
        .stroke({ color: PALETTE.counterEdge, width: 4, alpha: 0.75 });
    }
  }

  private drawStateGeometry(): void {
    for (const patronId of GRAYBOX_PATRON_IDS) {
      const anchor = findGrayboxAnchor(`anchor-${patronId}`);
      const patronLayer = new Graphics({ label: `graybox-${patronId}` });
      drawPerson(
        patronLayer,
        anchor.x,
        anchor.y,
        0xffffff,
        patronId === "patron-south" ? 1.08 : 0.9,
      );
      this.patronLayers.set(patronId, patronLayer);
      this.stateLayer.addChild(patronLayer);
    }

    const east = findGrayboxAnchor("anchor-patron-east");
    this.eastAnswerReaction
      .moveTo(east.x - 28, east.y - 4)
      .lineTo(east.x - 58, east.y + 12)
      .moveTo(east.x + 28, east.y - 4)
      .lineTo(east.x + 58, east.y + 12)
      .stroke({ color: 0xffffff, width: 8 });
    this.eastSilenceReaction
      .moveTo(east.x - 30, east.y + 2)
      .lineTo(east.x + 30, east.y + 26)
      .moveTo(east.x + 30, east.y + 2)
      .lineTo(east.x - 30, east.y + 26)
      .stroke({ color: 0xffffff, width: 8 });

    const serviceTable = findGrayboxAnchor("anchor-table-c");
    this.teaReaction
      .rect(serviceTable.x + 38, serviceTable.y - 52, 28, 30)
      .fill(PALETTE.patronObserved)
      .circle(serviceTable.x + 69, serviceTable.y - 37, 10)
      .stroke({ color: PALETTE.patronObserved, width: 5 })
      .moveTo(serviceTable.x + 45, serviceTable.y - 58)
      .bezierCurveTo(
        serviceTable.x + 34,
        serviceTable.y - 76,
        serviceTable.x + 58,
        serviceTable.y - 84,
        serviceTable.x + 48,
        serviceTable.y - 98,
      )
      .stroke({ color: PALETTE.patronObserved, width: 3, alpha: 0.8 });
    this.vodkaReaction
      .poly([
        serviceTable.x + 40,
        serviceTable.y - 52,
        serviceTable.x + 70,
        serviceTable.y - 52,
        serviceTable.x + 64,
        serviceTable.y - 20,
        serviceTable.x + 46,
        serviceTable.y - 20,
      ])
      .fill(PALETTE.fixtureActive)
      .stroke({ color: PALETTE.counterEdge, width: 3 });

    const television = findGrayboxAnchor("anchor-television");
    const telephone = findGrayboxAnchor("anchor-telephone");
    for (const [reaction, fixture] of [
      [this.missedTelevisionReaction, television],
      [this.missedTelephoneReaction, telephone],
    ] as const) {
      reaction
        .moveTo(fixture.x - 44, fixture.y - 44)
        .lineTo(fixture.x + 44, fixture.y + 44)
        .moveTo(fixture.x + 44, fixture.y - 44)
        .lineTo(fixture.x - 44, fixture.y + 44)
        .stroke({ color: PALETTE.fixtureMissed, width: 10, alpha: 0.9 });
    }
    this.completionReaction
      .rect(1694, 292, 18, 372)
      .fill({ color: PALETTE.completion, alpha: 0.85 });

    this.photographReaction
      .rect(630, 620, 74, 48)
      .fill(PALETTE.fixtureActive)
      .stroke({ color: PALETTE.counterEdge, width: 3 });

    this.stateLayer.addChild(
      this.eastAnswerReaction,
      this.eastSilenceReaction,
      this.teaReaction,
      this.vodkaReaction,
      this.missedTelevisionReaction,
      this.missedTelephoneReaction,
      this.completionReaction,
      this.photographReaction,
    );
  }

  renderNarrative(projection: NarrativeGrayboxProjection): void {
    this.galinaLayer.visible = true;
    const patronByCharacter: Readonly<Record<string, string>> = {
      arkady: "patron-north",
      lev: "patron-east",
      nikolai: "patron-south",
      gennady: "patron-west",
    };
    for (const [characterId, patronId] of Object.entries(patronByCharacter)) {
      const layer = this.patronLayers.get(patronId);
      if (layer !== undefined) {
        layer.tint =
          projection.focusedCharacterId === characterId ? PALETTE.patronFocus : PALETTE.patron;
        layer.position.set(0, 0);
      }
    }

    this.galinaLayer.tint =
      projection.focusedCharacterId === "galina" ? PALETTE.patronFocus : PALETTE.patronObserved;
    this.sashaLayer.tint =
      projection.focusedCharacterId === "sasha" ? PALETTE.patronFocus : PALETTE.sasha;
    this.eastAnswerReaction.visible = false;
    this.eastSilenceReaction.visible = false;
    this.teaReaction.visible = projection.glassState === "cleared";
    this.vodkaReaction.visible = projection.glassState === "overturned";
    this.missedTelevisionReaction.visible =
      projection.missedTargets.includes("offer_sample_television");
    this.missedTelephoneReaction.visible = false;
    this.completionReaction.visible = projection.complete;
    this.photographReaction.visible = projection.photographState !== "covered";
    this.photographReaction.alpha = projection.photographState === "face_down" ? 0.45 : 1;
    this.photographReaction.tint =
      projection.photographState === "face_down" ? PALETTE.fixtureMissed : 0xffffff;
    this.debugLayer.visible = false;

    if (projection.attentionOpen) {
      this.sashaLayer.tint = PALETTE.fixtureActive;
    }
    const sasha = findGrayboxAnchor("anchor-sasha-bar");
    this.moveSashaTo(sasha.id, sasha.x, sasha.y);
  }

  render(state: GrayboxState): void {
    this.galinaLayer.visible = false;
    this.photographReaction.visible = false;
    for (const patronId of GRAYBOX_PATRON_IDS) {
      const patron = state.patrons[patronId];
      const color =
        state.currentFocus === patronId
          ? PALETTE.patronFocus
          : patron.observed
            ? PALETTE.patronObserved
            : PALETTE.patron;
      const horizontalOffset =
        patronId === "patron-east" && patron.exchangeMark === "silence"
          ? -10
          : patronId === "patron-south" && patron.intoxication === 1
            ? 12
            : 0;
      const verticalOffset =
        patronId === "patron-south" && patron.composure === 1
          ? -10
          : patronId === "patron-east" && patron.exchangeMark === "silence"
            ? 7
            : 0;
      const patronLayer = this.patronLayers.get(patronId);
      if (patronLayer === undefined) {
        throw new Error(`Missing patron layer: ${patronId}`);
      }
      patronLayer.tint = color;
      patronLayer.position.set(horizontalOffset, verticalOffset);
    }

    const servedPatron = state.patrons["patron-south"];
    const eastPatron = state.patrons["patron-east"];
    const eastColor =
      state.currentFocus === "patron-east"
        ? PALETTE.patronFocus
        : eastPatron.observed
          ? PALETTE.patronObserved
          : PALETTE.patron;
    this.eastAnswerReaction.visible = eastPatron.exchangeMark === "answered";
    this.eastAnswerReaction.tint = eastColor;
    this.eastSilenceReaction.visible = eastPatron.exchangeMark === "silence";
    this.eastSilenceReaction.tint = eastColor;
    this.eastSilenceReaction.position.set(-10, 7);
    this.teaReaction.visible = servedPatron.composure === 1;
    this.vodkaReaction.visible = servedPatron.intoxication === 1;

    const sashaAnchorId = selectSashaAnchorId(state);
    const sasha = findGrayboxAnchor(sashaAnchorId);
    this.moveSashaTo(sashaAnchorId, sasha.x, sasha.y);

    this.missedTelevisionReaction.visible = state.attention.televisionOutcome === "missed";
    this.missedTelephoneReaction.visible = state.attention.telephoneOutcome === "missed";
    this.completionReaction.visible = state.step === "complete";

    this.drawDebug(state);
  }

  private moveSashaTo(anchorId: string, targetX: number, targetY: number): void {
    if (anchorId === this.sashaAnchorId) {
      return;
    }

    if (this.sashaAnimationFrame !== null) {
      cancelAnimationFrame(this.sashaAnimationFrame);
      this.sashaAnimationFrame = null;
    }

    const startAnchorId = this.sashaAnchorId;
    const startX = this.sashaLayer.x;
    const startY = this.sashaLayer.y;
    this.sashaAnchorId = anchorId;

    if (startX === 0 && startY === 0) {
      this.sashaLayer.position.set(targetX, targetY);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.sashaLayer.position.set(targetX, targetY);
      return;
    }

    const authoredRoutePoints =
      startAnchorId === null ? [] : selectGrayboxRoutePoints(startAnchorId, anchorId);
    const hasAuthoredRoute = authoredRoutePoints.length > 2;
    const routePoints = [
      { x: startX, y: startY },
      ...authoredRoutePoints.slice(1, -1),
      { x: targetX, y: targetY },
    ];
    const segmentLengths = routePoints.slice(1).map((point, index) => {
      const previous = routePoints[index];
      return previous === undefined ? 0 : Math.hypot(point.x - previous.x, point.y - previous.y);
    });
    const totalLength = segmentLengths.reduce((total, length) => total + length, 0);
    const startedAt = performance.now();
    const durationMilliseconds = hasAuthoredRoute ? 720 : 320;
    const animate = (timestamp: number): void => {
      const progress = Math.min(1, (timestamp - startedAt) / durationMilliseconds);
      const eased = 1 - (1 - progress) ** 3;
      const targetDistance = totalLength * eased;
      let traversed = 0;
      let resolvedX = targetX;
      let resolvedY = targetY;
      for (let index = 0; index < segmentLengths.length; index += 1) {
        const segmentLength = segmentLengths[index];
        const from = routePoints[index];
        const to = routePoints[index + 1];
        if (segmentLength === undefined || from === undefined || to === undefined) {
          continue;
        }
        if (targetDistance <= traversed + segmentLength) {
          const segmentProgress =
            segmentLength === 0 ? 1 : (targetDistance - traversed) / segmentLength;
          resolvedX = from.x + (to.x - from.x) * segmentProgress;
          resolvedY = from.y + (to.y - from.y) * segmentProgress;
          break;
        }
        traversed += segmentLength;
      }
      this.sashaLayer.position.set(resolvedX, resolvedY);

      if (progress < 1) {
        this.sashaAnimationFrame = requestAnimationFrame(animate);
      } else {
        this.sashaAnimationFrame = null;
      }
    };

    this.sashaAnimationFrame = requestAnimationFrame(animate);
  }

  private drawDebug(state: GrayboxState): void {
    const graphics = this.debugLayer.clear();
    if (!state.debugVisible) {
      return;
    }

    for (const hotspot of GRAYBOX_LAYOUT.hotspots) {
      graphics
        .rect(hotspot.x, hotspot.y, hotspot.width, hotspot.height)
        .fill({ color: PALETTE.debug, alpha: 0.08 })
        .stroke({ color: PALETTE.debug, width: 4, alpha: 0.9 });
    }

    for (const anchor of GRAYBOX_LAYOUT.anchors) {
      graphics
        .circle(anchor.x, anchor.y, 8)
        .fill(PALETTE.debug)
        .moveTo(anchor.x - 18, anchor.y)
        .lineTo(anchor.x + 18, anchor.y)
        .moveTo(anchor.x, anchor.y - 18)
        .lineTo(anchor.x, anchor.y + 18)
        .stroke({ color: PALETTE.debug, width: 3 });
    }

    for (const route of GRAYBOX_LAYOUT.routes) {
      const points = selectGrayboxRoutePoints(route.fromAnchorId, route.toAnchorId);
      const first = points[0];
      if (first === undefined) {
        continue;
      }
      graphics.moveTo(first.x, first.y);
      for (const point of points.slice(1)) {
        graphics.lineTo(point.x, point.y);
      }
      graphics.stroke({ color: PALETTE.debug, width: 3, alpha: 0.48 });
    }
  }
}
