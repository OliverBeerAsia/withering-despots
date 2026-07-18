import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { validateGrayboxLayoutFile } from "../../scripts/content-validation";
import type { GrayboxLayout } from "../../src/content-types/GrayboxLayout";

interface InvalidCases {
  readonly duplicateAnchorId: { readonly sourceId: string; readonly targetId: string };
  readonly missingAnchorId: { readonly sourceId: string; readonly replacementId: string };
  readonly overlapHotspots: { readonly sourceId: string; readonly targetId: string };
}

const temporaryDirectories: string[] = [];

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function validateMutation(
  mutate: (layout: GrayboxLayout) => GrayboxLayout,
): Promise<ReturnType<typeof validateGrayboxLayoutFile>> {
  const directory = await mkdtemp(join(tmpdir(), "withering-despots-graybox-test-"));
  temporaryDirectories.push(directory);
  const outputPath = join(directory, "graybox-layout.invalid.json");
  const layout = await readJson<GrayboxLayout>(resolve("content/graybox-layout.json"));
  await writeFile(outputPath, JSON.stringify(mutate(layout)), "utf8");
  return validateGrayboxLayoutFile(outputPath);
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map(async (directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("Phase 1 graybox content validation", () => {
  it("accepts the production layout and its five-verb geometry contract", async () => {
    const layout = await validateGrayboxLayoutFile(resolve("content/graybox-layout.json"));
    expect(layout).toMatchObject({
      schemaVersion: 1,
      id: "phase-1-graybox",
      logicalStage: { width: 1920, height: 1080 },
      roomMeters: { width: 7.2, depth: 5.8, height: 2.7 },
      verbs: ["observe", "speak", "serve", "tune", "wait"],
    });

    expect(layout.anchors).toHaveLength(39);
    expect(layout.anchors.filter((anchor) => anchor.kind === "seat")).toHaveLength(18);
    expect(layout.anchors.filter((anchor) => anchor.kind === "standing")).toEqual([
      expect.objectContaining({ id: "anchor-sasha-bar" }),
      expect.objectContaining({ id: "anchor-sasha-television" }),
      expect.objectContaining({ id: "anchor-sasha-telephone" }),
    ]);
    expect(layout.geometry.polygons).toHaveLength(9);
    expect(new Set(layout.geometry.polygons.map((polygon) => polygon.id)).size).toBe(9);

    expect(layout.routes).toHaveLength(4);
    const anchorById = new Map(layout.anchors.map((anchor) => [anchor.id, anchor]));
    for (const route of layout.routes) {
      expect(anchorById.get(route.fromAnchorId)?.kind).toBe("standing");
      expect(anchorById.get(route.toAnchorId)?.kind).toBe("standing");
      expect(route.waypointAnchorIds.length).toBeGreaterThan(0);
      for (const waypointId of route.waypointAnchorIds) {
        expect(anchorById.get(waypointId)?.kind).toBe("walk");
      }
    }

    expect(
      Object.fromEntries(layout.hotspots.map((hotspot) => [hotspot.id, hotspot.supportedVerbs])),
    ).toEqual({
      room: ["observe"],
      "patron-north": ["observe"],
      "patron-east": ["observe", "speak"],
      "patron-west": ["observe"],
      "patron-south": ["observe", "serve"],
      television: ["tune"],
      telephone: [],
    });
  });

  it("keeps every one of the 39 runtime anchor IDs in both SVG sources of truth", async () => {
    const layout = await validateGrayboxLayoutFile(resolve("content/graybox-layout.json"));
    const [floorPlan, perspective] = await Promise.all([
      readFile(resolve("art/blockout/bar_floor_plan.svg"), "utf8"),
      readFile(resolve("art/blockout/bar_perspective.svg"), "utf8"),
    ]);

    for (const anchor of layout.anchors) {
      expect(floorPlan, `Floor plan is missing ${anchor.id}.`).toContain(`id="${anchor.id}"`);
      expect(perspective, `Perspective is missing ${anchor.id}.`).toContain(`id="${anchor.id}"`);
    }
  });

  it("rejects duplicate anchor IDs from the invalid fixture", async () => {
    const cases = await readJson<InvalidCases>(
      resolve("tests/content/fixtures/graybox-layout.invalid-cases.json"),
    );

    await expect(
      validateMutation((layout) => ({
        ...layout,
        anchors: layout.anchors.map((anchor) =>
          anchor.id === cases.duplicateAnchorId.sourceId
            ? { ...anchor, id: cases.duplicateAnchorId.targetId }
            : anchor,
        ),
      })),
    ).rejects.toThrow(/anchor IDs must be unique/);
  });

  it("rejects a missing required anchor from the invalid fixture", async () => {
    const cases = await readJson<InvalidCases>(
      resolve("tests/content/fixtures/graybox-layout.invalid-cases.json"),
    );

    await expect(
      validateMutation((layout) => ({
        ...layout,
        anchors: layout.anchors.map((anchor) =>
          anchor.id === cases.missingAnchorId.sourceId
            ? { ...anchor, id: cases.missingAnchorId.replacementId }
            : anchor,
        ),
      })),
    ).rejects.toThrow(/missing required anchor anchor-counter/);
  });

  it("rejects overlapping simultaneous hotspots from the invalid fixture", async () => {
    const cases = await readJson<InvalidCases>(
      resolve("tests/content/fixtures/graybox-layout.invalid-cases.json"),
    );

    await expect(
      validateMutation((layout) => {
        const target = layout.hotspots.find(
          (hotspot) => hotspot.id === cases.overlapHotspots.targetId,
        );
        if (target === undefined) {
          throw new Error("Invalid fixture target hotspot is missing.");
        }
        return {
          ...layout,
          hotspots: layout.hotspots.map((hotspot) =>
            hotspot.id === cases.overlapHotspots.sourceId
              ? { ...hotspot, x: target.x, y: target.y }
              : hotspot,
          ),
        };
      }),
    ).rejects.toThrow(/simultaneous hotspots television and telephone overlap/);
  });
});
