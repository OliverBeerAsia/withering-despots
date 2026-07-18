import { Assets, Container, Rectangle, Sprite, Texture } from "pixi.js";

import { findGrayboxAnchor } from "../content-types/GrayboxLayout";
import type { NarrativeGrayboxProjection } from "./NarrativeGrayboxProjection";

/** Native pixel-art resolution (graybox logical stage / 3). */
export const PIXEL_STAGE = Object.freeze({ width: 640, height: 360 });

const LOGICAL_TO_NATIVE = 3;

/** Character sheet geometry (identical across all six approved sheets). */
const SHEET = Object.freeze({
  frameWidth: 48,
  frameHeight: 96,
  seatPlaneY: 69,
  footLineY: 93,
  standingCenterX: 24,
});

const FRAME_INDEX = Object.freeze({
  seated_listen: 0,
  seated_listen_breath: 1,
  seated_listen_blink: 2,
  seated_talk: 3,
  lean_in: 4,
  lean_back: 5,
  standing: 6,
  signature: 7,
  exhausted: 8,
});

type FrameName = keyof typeof FRAME_INDEX;

interface CharacterPlacement {
  readonly id: string;
  readonly mode: "seated" | "standing";
  /**
   * "rear" renders beneath bg_mid so counter/tabletops occlude the lower body;
   * "main" renders above bg_mid and is occluded by furniture_front only.
   */
  readonly layer: "rear" | "main";
  /** Native-pixel anchor: seat plane point for seated, foot line point for standing. */
  readonly anchorX: number;
  readonly anchorY: number;
  /** Horizontal sheet pixel that must land on anchorX. */
  readonly centerX: number;
}

function nativeAnchor(anchorId: string): { x: number; y: number } {
  const anchor = findGrayboxAnchor(anchorId);
  return {
    x: Math.round(anchor.x / LOGICAL_TO_NATIVE),
    y: Math.round(anchor.y / LOGICAL_TO_NATIVE),
  };
}

/**
 * Graybox standing anchors mark the torso center; the foot line sits lower so
 * the counter (bg_mid) cuts staff at the waist, matching its rear-edge height.
 */
const STANDING_FOOT_OFFSET = 38;

function characterPlacements(): readonly CharacterPlacement[] {
  const seat02 = nativeAnchor("anchor-seat-02");
  const seat06 = nativeAnchor("anchor-seat-06");
  const seat09 = nativeAnchor("anchor-seat-09");
  const seat13 = nativeAnchor("anchor-seat-13");
  const sashaBar = nativeAnchor("anchor-sasha-bar");
  // Galina has no layout anchor; graybox hardcodes her at logical (610, 500).
  const galina = {
    x: Math.round(610 / LOGICAL_TO_NATIVE),
    y: Math.round(500 / LOGICAL_TO_NATIVE),
  };
  // Rear-to-front paint order within each layer (painter's algorithm by depth).
  // Arkady and Lev sit on their tables' EAST chairs (seat-02/seat-06): the
  // north seats put the figure behind the tabletop with knees/feet painting
  // above its far rim (QA P0 "levitating over the table"); the east chairs sit
  // clear of the table footprint while the tabletop still tucks over the
  // table-side thigh and furniture_front supplies the chair's front edge.
  return [
    {
      id: "arkady",
      mode: "seated",
      layer: "rear",
      anchorX: seat02.x,
      anchorY: seat02.y,
      centerX: 26,
    },
    {
      id: "lev",
      mode: "seated",
      layer: "rear",
      anchorX: seat06.x,
      anchorY: seat06.y,
      centerX: 26,
    },
    {
      id: "sasha",
      mode: "standing",
      layer: "rear",
      anchorX: sashaBar.x,
      anchorY: sashaBar.y + STANDING_FOOT_OFFSET,
      centerX: SHEET.standingCenterX,
    },
    {
      id: "galina",
      mode: "standing",
      layer: "rear",
      anchorX: galina.x,
      anchorY: galina.y + STANDING_FOOT_OFFSET,
      centerX: SHEET.standingCenterX,
    },
    {
      id: "nikolai",
      mode: "seated",
      layer: "rear",
      anchorX: seat09.x,
      anchorY: seat09.y,
      centerX: 26,
    },
    // Gennady's patron-west seat (seat-12) is fully inside the counter's
    // occlusion footprint; the adjacent table-d side chair (seat-13) keeps him
    // readable while staying at his table.
    {
      id: "gennady",
      mode: "seated",
      layer: "main",
      anchorX: seat13.x,
      anchorY: seat13.y,
      centerX: 26,
    },
  ];
}

const ASSET_MANIFEST: readonly { alias: string; src: string }[] = [
  { alias: "bg_far", src: "assets/env/bg_far.png" },
  { alias: "bg_mid", src: "assets/env/bg_mid.png" },
  { alias: "seat_back", src: "assets/env/seat_back.png" },
  { alias: "furniture_front", src: "assets/env/furniture_front.png" },
  { alias: "char_sasha", src: "assets/char/sasha.png" },
  { alias: "char_galina", src: "assets/char/galina.png" },
  { alias: "char_arkady", src: "assets/char/arkady.png" },
  { alias: "char_lev", src: "assets/char/lev.png" },
  { alias: "char_nikolai", src: "assets/char/nikolai.png" },
  { alias: "char_gennady", src: "assets/char/gennady.png" },
  { alias: "tv_off", src: "assets/props/tv_screen_off.png" },
  { alias: "tv_static_a", src: "assets/props/tv_screen_static_a.png" },
  { alias: "tv_static_b", src: "assets/props/tv_screen_static_b.png" },
  { alias: "tv_broadcast_a", src: "assets/props/tv_screen_broadcast_a.png" },
  { alias: "tv_broadcast_b", src: "assets/props/tv_screen_broadcast_b.png" },
  { alias: "glass_medium", src: "assets/props/faceted_glass_medium.png" },
  { alias: "glass_small", src: "assets/props/faceted_glass_small.png" },
  { alias: "tea_glass", src: "assets/props/tea_glass_holder.png" },
  { alias: "ashtray", src: "assets/props/metal_ashtray.png" },
  { alias: "notebook", src: "assets/props/stock_notebook.png" },
  { alias: "photograph", src: "assets/props/factory_photograph.png" },
  { alias: "telephone", src: "assets/props/telephone.png" },
  { alias: "fx_tv_light", src: "assets/fx/tv_light_mask.png" },
  { alias: "fx_door_light", src: "assets/fx/door_light_overlay.png" },
  { alias: "fx_smoke_1", src: "assets/fx/smoke_wisp_01.png" },
  { alias: "fx_smoke_2", src: "assets/fx/smoke_wisp_02.png" },
  { alias: "fx_smoke_3", src: "assets/fx/smoke_wisp_03.png" },
];

const ANIMATION_TICK_MS = 300;
const TV_FRAME_TICKS = 2;

type AmbientCharacterFrame = "seated_listen" | "seated_listen_breath" | "seated_listen_blink";

interface AmbientCharacterSchedule {
  readonly blinkPeriodTicks: number;
  readonly blinkPhase: number;
  readonly settlePeriodTicks: number;
  readonly settlePhase: number;
}

/**
 * Long, character-specific cycles keep the room from looking like a shared
 * animation loop. Each variation occupies one 300 ms tick; the neutral pose
 * carries nearly all of the interval.
 */
const AMBIENT_CHARACTER_SCHEDULES: Readonly<Record<string, AmbientCharacterSchedule>> = {
  arkady: { blinkPeriodTicks: 53, blinkPhase: 11, settlePeriodTicks: 157, settlePhase: 71 },
  lev: { blinkPeriodTicks: 67, blinkPhase: 29, settlePeriodTicks: 181, settlePhase: 103 },
  nikolai: { blinkPeriodTicks: 71, blinkPhase: 43, settlePeriodTicks: 193, settlePhase: 137 },
  gennady: { blinkPeriodTicks: 59, blinkPhase: 17, settlePeriodTicks: 167, settlePhase: 89 },
};

export type AmbientPropMotionId = "glass-a" | "glass-e";

interface AmbientPropSchedule {
  readonly periodTicks: number;
  readonly phase: number;
  readonly durationTicks: number;
  readonly dx: -1 | 1;
}

const AMBIENT_PROP_SCHEDULES: Readonly<Record<AmbientPropMotionId, AmbientPropSchedule>> = {
  // The two 41 to 54 second cycles never share a phase. The one-pixel shift is
  // held briefly, then returns to the documented table anchor.
  "glass-a": { periodTicks: 137, phase: 31, durationTicks: 2, dx: 1 },
  "glass-e": { periodTicks: 181, phase: 73, durationTicks: 2, dx: -1 },
};

export interface AmbientPropOffset {
  readonly x: number;
  readonly y: number;
}

/** Resolve a rare, deterministic whole-pixel table-prop movement. */
export function resolveAmbientPropOffset(
  id: AmbientPropMotionId,
  tick: number,
  reducedMotion: boolean,
): AmbientPropOffset {
  if (reducedMotion) {
    return { x: 0, y: 0 };
  }
  const schedule = AMBIENT_PROP_SCHEDULES[id];
  const localTick = ((tick % schedule.periodTicks) + schedule.periodTicks) % schedule.periodTicks;
  const active = localTick >= schedule.phase && localTick < schedule.phase + schedule.durationTicks;
  return active ? { x: schedule.dx, y: 0 } : { x: 0, y: 0 };
}

/** Resolve asynchronous idle variation while leaving the authored anchor fixed. */
export function resolveAmbientCharacterFrame(
  characterId: string,
  tick: number,
  reducedMotion: boolean,
): AmbientCharacterFrame {
  if (reducedMotion) {
    return "seated_listen";
  }
  const schedule = AMBIENT_CHARACTER_SCHEDULES[characterId];
  if (schedule === undefined) {
    return "seated_listen";
  }
  if (tick % schedule.blinkPeriodTicks === schedule.blinkPhase) {
    return "seated_listen_blink";
  }
  if (tick % schedule.settlePeriodTicks === schedule.settlePhase) {
    return "seated_listen_breath";
  }
  return "seated_listen";
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface CharacterRuntime {
  readonly placement: CharacterPlacement;
  readonly sprite: Sprite;
  readonly frames: Readonly<Record<FrameName, Texture>>;
}

interface AmbientPropRuntime {
  readonly id: AmbientPropMotionId;
  readonly sprite: Sprite;
  readonly baseX: number;
  readonly baseY: number;
}

/**
 * Sprite-based pixel-art replacement for the graybox narrative rendering.
 * Consumes the same NarrativeGrayboxProjection that previously drove
 * GrayboxScene.renderNarrative; anchors come from content/graybox-layout.json
 * converted to the 640x360 native grid (logical / 3).
 */
export class PixelBarScene extends Container {
  private readonly characters = new Map<string, CharacterRuntime>();
  private readonly tvScreen: Sprite;
  private readonly tvTextures: Readonly<Record<string, Texture>>;
  private readonly tvLight: Sprite;
  private readonly doorLight: Sprite;
  private readonly teaGlass: Sprite;
  private readonly vodkaGlass: Sprite;
  private readonly serviceGlassPoint: { x: number; y: number };
  private readonly photograph: Sprite;
  private readonly ambientProps: AmbientPropRuntime[] = [];
  private readonly smokeWisps: {
    sprite: Sprite;
    frames: Texture[];
    phase: number;
    cadenceTicks: number;
  }[] = [];
  private projection: NarrativeGrayboxProjection | null = null;
  private tick = 0;
  private timer: number | null = null;
  private inGameReducedMotion = false;

  private constructor(textures: Record<string, Texture>) {
    super({ label: "phase-two-pixel-bar" });

    for (const { alias } of ASSET_MANIFEST) {
      const texture = textures[alias];
      if (texture === undefined) {
        throw new Error(`Missing pixel scene texture: ${alias}`);
      }
      texture.source.scaleMode = "nearest";
    }
    const texture = (alias: string): Texture => {
      const resolved = textures[alias];
      if (resolved === undefined) {
        throw new Error(`Missing pixel scene texture: ${alias}`);
      }
      return resolved;
    };

    const layer = (label: string): Container => {
      const container = new Container({ label });
      this.addChild(container);
      return container;
    };

    // seat_back and characters-rear sit beneath bg_mid so tabletops and the
    // counter (both painted in bg_mid) occlude rear chairs and lower bodies.
    const bgFar = layer("layer-bg-far");
    const seatBack = layer("layer-seat-back");
    const charactersRear = layer("layer-characters-rear");
    const bgMid = layer("layer-bg-mid");
    const charactersMain = layer("layer-characters-main");
    const tableProps = layer("layer-table-props");
    const furnitureFront = layer("layer-furniture-front");
    const lightOverlays = layer("layer-light-overlays");
    const atmosphere = layer("layer-atmosphere");

    bgFar.addChild(placed(texture("bg_far"), 0, 0));
    bgMid.addChild(placed(texture("bg_mid"), 0, 0));

    // TV screen fills the transparent aperture in bg_mid (native 471,59).
    this.tvTextures = {
      off: texture("tv_off"),
      static_a: texture("tv_static_a"),
      static_b: texture("tv_static_b"),
      broadcast_a: texture("tv_broadcast_a"),
      broadcast_b: texture("tv_broadcast_b"),
    };
    this.tvScreen = placed(texture("tv_off"), 471, 59);
    bgMid.addChild(this.tvScreen);

    seatBack.addChild(placed(texture("seat_back"), 0, 0));

    for (const placement of characterPlacements()) {
      const sheet = texture(`char_${placement.id}`);
      const frames = sliceFrames(sheet);
      const sprite = new Sprite({ texture: frames.seated_listen, label: `char-${placement.id}` });
      const referenceY = placement.mode === "seated" ? SHEET.seatPlaneY : SHEET.footLineY;
      sprite.position.set(placement.anchorX - placement.centerX, placement.anchorY - referenceY);
      (placement.layer === "rear" ? charactersRear : charactersMain).addChild(sprite);
      this.characters.set(placement.id, { placement, sprite, frames });
    }

    // Table props. Positions derive from graybox reaction geometry (logical / 3).
    const tableC = nativeAnchor("anchor-table-c");
    this.serviceGlassPoint = { x: tableC.x + 17, y: tableC.y - 7 };
    this.teaGlass = anchored(
      texture("tea_glass"),
      this.serviceGlassPoint.x,
      this.serviceGlassPoint.y,
      5,
      14,
    );
    this.vodkaGlass = anchored(
      texture("glass_medium"),
      this.serviceGlassPoint.x,
      this.serviceGlassPoint.y,
      5,
      14,
    );
    this.photograph = anchored(texture("photograph"), 222, 223, 5, 8);
    const tableA = nativeAnchor("anchor-table-a");
    const tableE = nativeAnchor("anchor-table-e");
    const ashtrayA = anchored(texture("ashtray"), tableA.x - 8, tableA.y - 4, 7, 7);
    const ashtrayE = anchored(texture("ashtray"), tableE.x + 6, tableE.y - 5, 7, 7);
    const glassA = anchored(texture("glass_small"), tableA.x + 9, tableA.y - 5, 4, 11);
    const glassE = anchored(texture("glass_small"), tableE.x - 10, tableE.y - 4, 4, 11);
    const notebook = anchored(texture("notebook"), 213, 172, 6, 9);
    const telephone = anchored(texture("telephone"), 180, 130, 7, 13);
    this.ambientProps.push(
      { id: "glass-a", sprite: glassA, baseX: glassA.x, baseY: glassA.y },
      { id: "glass-e", sprite: glassE, baseX: glassE.x, baseY: glassE.y },
    );
    tableProps.addChild(
      this.teaGlass,
      this.vodkaGlass,
      this.photograph,
      ashtrayA,
      ashtrayE,
      glassA,
      glassE,
      notebook,
      telephone,
    );

    furnitureFront.addChild(placed(texture("furniture_front"), 0, 0));

    this.tvLight = placed(texture("fx_tv_light"), 0, 0);
    this.tvLight.alpha = 0;
    this.doorLight = placed(texture("fx_door_light"), 0, 0);
    this.doorLight.alpha = 0.7;
    this.tvLight.visible = false;
    this.doorLight.visible = false;
    lightOverlays.addChild(this.tvLight, this.doorLight);

    const wispFrame1 = texture("fx_smoke_1");
    const wispFrame2 = texture("fx_smoke_2");
    const wispFrame3 = texture("fx_smoke_3");
    const wispFrames = [wispFrame1, wispFrame2, wispFrame3];
    const wispSpots: readonly {
      x: number;
      y: number;
      phase: number;
      cadenceTicks: number;
    }[] = [
      { x: tableA.x - 8, y: tableA.y - 6, phase: 0, cadenceTicks: 5 },
      { x: tableE.x + 6, y: tableE.y - 7, phase: 4, cadenceTicks: 9 },
    ];
    for (const spot of wispSpots) {
      const sprite = anchored(wispFrame1, spot.x, spot.y, 7, 25);
      this.smokeWisps.push({
        sprite,
        frames: wispFrames,
        phase: spot.phase,
        cadenceTicks: spot.cadenceTicks,
      });
      atmosphere.addChild(sprite);
    }

    this.timer = window.setInterval(() => {
      this.tick += 1;
      this.applyAnimatedState();
    }, ANIMATION_TICK_MS);
  }

  static async create(): Promise<PixelBarScene> {
    const textures: Record<string, Texture> = await Assets.load(
      ASSET_MANIFEST.map((asset) => ({ ...asset })),
    );
    return new PixelBarScene(textures);
  }

  renderNarrative(projection: NarrativeGrayboxProjection): void {
    this.projection = projection;
    this.applyAnimatedState();
  }

  /** Allows the semantic settings layer to freeze nonessential Pixi motion. */
  setReducedMotion(enabled: boolean): void {
    this.inGameReducedMotion = enabled;
    this.applyAnimatedState();
  }

  override destroy(options?: Parameters<Container["destroy"]>[0]): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    super.destroy(options);
  }

  private applyAnimatedState(): void {
    const projection = this.projection;
    if (projection === null) {
      return;
    }
    const reduced = this.inGameReducedMotion || prefersReducedMotion();

    for (const { placement, sprite, frames } of this.characters.values()) {
      sprite.texture = frames[selectFrame(placement, projection, this.tick, reduced)];
    }

    const televisionVisual = resolveTelevisionVisualState(
      projection.televisionState,
      this.tick,
      reduced,
    );
    const screenTexture = this.tvTextures[televisionVisual.screen];
    if (screenTexture !== undefined) {
      this.tvScreen.texture = screenTexture;
    }
    this.tvLight.visible = televisionVisual.lightAlpha > 0;
    this.tvLight.alpha = televisionVisual.lightAlpha;

    this.doorLight.visible = projection.doorState === "open";

    this.teaGlass.visible = projection.glassState === "cleared";
    this.vodkaGlass.visible = projection.glassState !== "cleared";
    if (projection.glassState === "overturned") {
      // Lay the faceted glass on its side (exact 90-degree turn keeps pixels crisp).
      this.vodkaGlass.angle = 90;
      this.vodkaGlass.position.set(this.serviceGlassPoint.x + 7, this.serviceGlassPoint.y - 11);
    } else {
      this.vodkaGlass.angle = 0;
      this.vodkaGlass.position.set(this.serviceGlassPoint.x - 5, this.serviceGlassPoint.y - 14);
    }

    this.photograph.visible = projection.photographState !== "covered";
    this.photograph.alpha = projection.photographState === "face_down" ? 0.55 : 1;

    for (const prop of this.ambientProps) {
      const offset = resolveAmbientPropOffset(prop.id, this.tick, reduced);
      prop.sprite.position.set(prop.baseX + offset.x, prop.baseY + offset.y);
    }

    for (const wisp of this.smokeWisps) {
      const frame = reduced
        ? wisp.phase % wisp.frames.length
        : Math.floor((this.tick + wisp.phase) / wisp.cadenceTicks) % wisp.frames.length;
      const nextTexture = wisp.frames[frame];
      if (nextTexture !== undefined) {
        wisp.sprite.texture = nextTexture;
      }
    }
  }
}

function selectFrame(
  placement: CharacterPlacement,
  projection: NarrativeGrayboxProjection,
  tick: number,
  reduced: boolean,
): FrameName {
  const focused = projection.focusedCharacterId === placement.id;
  const presentationPose = projection.presentationPoseByCharacterId[placement.id];
  if (presentationPose !== undefined) {
    return presentationPose;
  }
  if (placement.mode === "standing") {
    return "standing";
  }
  if (projection.complete) {
    return "exhausted";
  }
  if (focused) {
    return "seated_talk";
  }
  if (reduced) {
    return "seated_listen";
  }
  return resolveAmbientCharacterFrame(placement.id, tick, false);
}

export interface TelevisionVisualState {
  readonly screen: "off" | "static_a" | "static_b" | "broadcast_a" | "broadcast_b";
  readonly lightAlpha: number;
}

export function resolveTelevisionVisualState(
  televisionState: string,
  tick: number,
  reducedMotion: boolean,
): TelevisionVisualState {
  const alternate = !reducedMotion && Math.floor(tick / TV_FRAME_TICKS) % 2 === 1;
  switch (televisionState) {
    case "music_low":
      return { screen: alternate ? "static_b" : "static_a", lightAlpha: 0.18 };
    case "signal_unstable":
      return { screen: alternate ? "static_b" : "static_a", lightAlpha: 0.24 };
    case "signal_clear":
      return { screen: alternate ? "broadcast_b" : "broadcast_a", lightAlpha: 0.3 };
    case "bulletin":
      return { screen: alternate ? "broadcast_b" : "broadcast_a", lightAlpha: 0.42 };
    case "after_report":
      return { screen: alternate ? "static_b" : "static_a", lightAlpha: 0.14 };
    default:
      return { screen: "off", lightAlpha: 0 };
  }
}

function sliceFrames(sheet: Texture): Readonly<Record<FrameName, Texture>> {
  const entries = Object.entries(FRAME_INDEX).map(([name, index]) => [
    name,
    new Texture({
      source: sheet.source,
      frame: new Rectangle(index * SHEET.frameWidth, 0, SHEET.frameWidth, SHEET.frameHeight),
    }),
  ]);
  return Object.fromEntries(entries) as Record<FrameName, Texture>;
}

function placed(texture: Texture, x: number, y: number): Sprite {
  const sprite = new Sprite(texture);
  sprite.position.set(x, y);
  return sprite;
}

/** Position a sprite so its local anchor pixel lands on the native scene point. */
function anchored(
  texture: Texture,
  sceneX: number,
  sceneY: number,
  localX: number,
  localY: number,
): Sprite {
  return placed(texture, sceneX - localX, sceneY - localY);
}
