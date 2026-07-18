import { expect, test } from "@playwright/test";

const observeCaptureByProject: Readonly<Record<string, string>> = {
  "chromium-1920x1080": "phase-1-graybox-representative-1920x1080.png",
  "chromium-1366x768": "phase-1-graybox-representative-1366x768.png",
};

const attentionCaptureByProject: Readonly<Record<string, string>> = {
  "chromium-1920x1080": "phase-1-attention-conflict-1920x1080.png",
  "chromium-1366x768": "phase-1-attention-conflict-1366x768.png",
};

async function playToAttention(page: import("@playwright/test").Page): Promise<void> {
  const clickAndPaint = async (testId: string): Promise<void> => {
    await page.getByTestId(testId).click();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        }),
    );
  };

  await clickAndPaint("hotspot-room");
  for (const patron of ["north", "east", "south", "west"]) {
    await clickAndPaint(`hotspot-patron-${patron}`);
  }
  await clickAndPaint("action-answer");
  await clickAndPaint("action-tea");
  await clickAndPaint("action-tune");
  await expect(page.getByTestId("clock")).toContainText("19:23");
}

test("captures the deterministic populated graybox with keyboard focus", async ({
  page,
}, testInfo) => {
  await page.goto("/?phase=1");
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("hotspot-room")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("hotspot-patron-north")).toBeFocused();
  await expect(page.getByTestId("objective")).toContainText(/patron/i);
  await expect(page.getByTestId("clock")).toContainText("19:16");

  const captureName = observeCaptureByProject[testInfo.project.name];
  expect(captureName).toBeDefined();
  if (captureName === undefined) {
    return;
  }

  await expect(page).toHaveScreenshot(captureName, {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});

test("captures the deterministic spatial television and telephone attention conflict", async ({
  page,
}, testInfo) => {
  await page.goto("/?phase=1");
  await playToAttention(page);

  const television = page.getByTestId("hotspot-television");
  const telephone = page.getByTestId("hotspot-telephone");
  await expect(television).toBeVisible();
  await expect(telephone).toBeVisible();
  await expect(television).toHaveJSProperty("tagName", "BUTTON");
  await expect(telephone).toHaveJSProperty("tagName", "BUTTON");
  await television.focus();
  await expect(television).toBeFocused();
  await page.waitForTimeout(900);

  const captureName = attentionCaptureByProject[testInfo.project.name];
  expect(captureName).toBeDefined();
  if (captureName === undefined) {
    return;
  }

  await expect(page).toHaveScreenshot(captureName, {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});
