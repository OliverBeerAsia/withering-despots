import { Application } from "pixi.js";

import { createAmbientMusic } from "../audio/AmbientMusic";
import { createRoomAmbience } from "../audio/RoomAmbience";
import rawNarrativeContent from "../../content/phase-2-sample.json";
import { loadContentRepository } from "../narrative/ContentRepository";
import { initializeNarrativeState } from "../narrative/NarrativeEngine";
import { GrayboxScene, LOGICAL_STAGE } from "../scene/GrayboxScene";
import { selectNarrativeGrayboxProjection } from "../scene/NarrativeGrayboxProjection";
import { PIXEL_STAGE, PixelBarScene } from "../scene/PixelBarScene";
import { createGrayboxOverlay } from "../ui/GrayboxOverlay";
import { createNarrativeOverlay } from "../ui/NarrativeOverlay";
import { createGrayboxController } from "./GrayboxController";
import { createNarrativeController } from "./NarrativeController";

function requireAppRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#app");

  if (root === null) {
    throw new Error("Missing required #app mount point.");
  }

  return root;
}

/** Size the stage to an exact integer multiple of the native 640x360 canvas. */
function applyIntegerStageScale(stage: HTMLElement): void {
  const scale = Math.max(
    1,
    Math.floor(
      Math.min(window.innerWidth / PIXEL_STAGE.width, window.innerHeight / PIXEL_STAGE.height),
    ),
  );
  stage.style.width = `${String(PIXEL_STAGE.width * scale)}px`;
  stage.style.height = `${String(PIXEL_STAGE.height * scale)}px`;
}

export async function bootstrap(): Promise<Application> {
  const root = requireAppRoot();
  const main = document.createElement("main");
  const viewport = document.createElement("div");
  const stage = document.createElement("div");
  const renderer = new Application();

  main.className = "app-shell";
  main.setAttribute("aria-labelledby", "game-title");

  viewport.className = "stage-viewport";
  viewport.dataset.testid = "stage-viewport";

  stage.className = "stage";
  stage.dataset.testid = "logical-stage";

  const requestedPhase = new URLSearchParams(window.location.search).get("phase");
  const isPhaseOne = requestedPhase === "1";

  await renderer.init({
    width: isPhaseOne ? LOGICAL_STAGE.width : PIXEL_STAGE.width,
    height: isPhaseOne ? LOGICAL_STAGE.height : PIXEL_STAGE.height,
    antialias: isPhaseOne,
    roundPixels: !isPhaseOne,
    autoDensity: false,
    backgroundColor: 0x11171d,
    preference: "webgl",
    powerPreference: "low-power",
  });

  renderer.canvas.dataset.testid = "pixi-canvas";
  renderer.canvas.setAttribute("aria-hidden", "true");
  renderer.canvas.tabIndex = -1;

  if (isPhaseOne) {
    const scene = new GrayboxScene();
    renderer.stage.addChild(scene);
    const controller = createGrayboxController();
    scene.render(controller.getState());
    controller.subscribe((state) => {
      scene.render(state);
    });
    stage.append(renderer.canvas, createGrayboxOverlay(controller));
  } else {
    stage.classList.add("stage--pixel");
    applyIntegerStageScale(stage);
    window.addEventListener("resize", () => {
      applyIntegerStageScale(stage);
    });
    const scene = await PixelBarScene.create();
    renderer.stage.addChild(scene);
    const repository = loadContentRepository(rawNarrativeContent);
    const controller = createNarrativeController(repository, initializeNarrativeState(repository));
    const ambientMusic = createAmbientMusic();
    const ambienceCaption = document.createElement("p");
    let ambienceCaptionTimer: number | null = null;
    ambienceCaption.className = "ambient-caption";
    ambienceCaption.dataset.testid = "ambient-caption";
    ambienceCaption.hidden = true;
    ambienceCaption.setAttribute("role", "status");
    ambienceCaption.setAttribute("aria-live", "polite");
    ambienceCaption.setAttribute("aria-atomic", "true");
    const roomAmbience = createRoomAmbience({
      onCue: (cue) => {
        if (cue.captionPriority !== "significant") {
          return;
        }
        if (ambienceCaptionTimer !== null) {
          window.clearTimeout(ambienceCaptionTimer);
        }
        ambienceCaption.textContent = cue.caption;
        ambienceCaption.hidden = false;
        ambienceCaptionTimer = window.setTimeout(() => {
          ambienceCaption.hidden = true;
          ambienceCaption.textContent = "";
          ambienceCaptionTimer = null;
        }, 5000);
      },
    });
    const renderNarrativeState = (): void => {
      const projection = selectNarrativeGrayboxProjection(repository, controller.getState());
      scene.renderNarrative(projection);
      ambientMusic.setMode(projection.radioMusicState);
    };
    renderNarrativeState();
    controller.subscribe((state) => {
      const projection = selectNarrativeGrayboxProjection(repository, state);
      scene.renderNarrative(projection);
      ambientMusic.setMode(projection.radioMusicState);
    });
    stage.append(
      renderer.canvas,
      ambienceCaption,
      createNarrativeOverlay(controller, repository, {
        ambientMusic,
        roomAmbience,
        onReduceMotionChange: (enabled) => {
          scene.setReducedMotion(enabled);
          stage.dataset.reducedMotion = String(enabled);
        },
      }),
    );
  }
  viewport.append(stage);
  main.append(viewport);
  root.replaceChildren(main);

  return renderer;
}
