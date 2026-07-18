import { resolve } from "node:path";

import {
  validateGrayboxLayoutFile,
  validatePhaseTwoContentFile,
  validatePhaseZeroContentFile,
} from "./content-validation";

const requestedPath = process.argv[2];
const contentPaths =
  requestedPath === undefined
    ? [
        resolve("content/phase-0.json"),
        resolve("content/graybox-layout.json"),
        resolve("content/phase-2-sample.json"),
      ]
    : [resolve(requestedPath)];

try {
  for (const contentPath of contentPaths) {
    if (contentPath.endsWith("graybox-layout.json")) {
      await validateGrayboxLayoutFile(contentPath);
    } else if (contentPath.endsWith("phase-2-sample.json")) {
      await validatePhaseTwoContentFile(contentPath);
    } else {
      await validatePhaseZeroContentFile(contentPath);
    }
    process.stdout.write(`Content valid: ${contentPath}\n`);
  }
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown validation failure";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
