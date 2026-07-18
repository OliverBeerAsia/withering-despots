import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { validatePhaseZeroContentFile } from "../../scripts/content-validation";

describe("Phase 0 content validation", () => {
  it("accepts the production placeholder content", async () => {
    await expect(
      validatePhaseZeroContentFile(resolve("content/phase-0.json")),
    ).resolves.toMatchObject({
      schemaVersion: 1,
      id: "phase-0-placeholder",
      scene: { logicalWidth: 1920, logicalHeight: 1080 },
    });
  });

  it("rejects invalid content with file and schema-path context", async () => {
    const invalidPath = resolve("tests/content/fixtures/phase-0.invalid.json");

    await expect(validatePhaseZeroContentFile(invalidPath)).rejects.toThrow(
      /phase-0\.invalid\.json: content validation failed[\s\S]*\/scene\/logicalWidth must be equal to constant/,
    );
  });
});
