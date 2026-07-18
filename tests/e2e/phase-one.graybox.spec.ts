import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

interface BrowserErrors {
  readonly console: string[];
  readonly page: string[];
}

function observeBrowserErrors(page: Page): BrowserErrors {
  const errors: BrowserErrors = { console: [], page: [] };
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.console.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.page.push(error.message));
  return errors;
}

async function clickToPatrons(page: Page): Promise<void> {
  await page.getByTestId("hotspot-room").click();
  await expect(page.getByTestId("clock")).toContainText("19:16");
}

async function clickThroughPatrons(page: Page): Promise<void> {
  await clickToPatrons(page);
  for (const patron of ["north", "east", "south", "west"]) {
    await page.getByTestId(`hotspot-patron-${patron}`).click();
  }
}

async function expectNoRectangleOverlap(locators: readonly Locator[]): Promise<void> {
  const boxes = await Promise.all(locators.map(async (locator) => locator.boundingBox()));
  expect(boxes.every((box) => box !== null)).toBe(true);

  for (let leftIndex = 0; leftIndex < boxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < boxes.length; rightIndex += 1) {
      const left = boxes[leftIndex];
      const right = boxes[rightIndex];
      if (left === undefined || right === undefined || left === null || right === null) {
        continue;
      }
      const overlapWidth =
        Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
      const overlapHeight =
        Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
      expect(Math.max(0, overlapWidth) * Math.max(0, overlapHeight)).toBe(0);
    }
  }
}

async function expectContainedCenteredStage(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  const box = await page.getByTestId("logical-stage").boundingBox();
  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();
  if (viewport === null || box === null) {
    return;
  }

  expect(box.width / box.height).toBeCloseTo(16 / 9, 2);
  expect(box.x).toBeGreaterThanOrEqual(-0.5);
  expect(box.y).toBeGreaterThanOrEqual(-0.5);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 0.5);
  expect(box.x * 2 + box.width).toBeCloseTo(viewport.width, 0);
  expect(box.y * 2 + box.height).toBeCloseTo(viewport.height, 0);
}

test("a fresh tester receives a clear objective and completes using only the keyboard", async ({
  page,
}) => {
  const errors = observeBrowserErrors(page);
  await page.goto("/?phase=1");

  await expect(page.getByTestId("objective")).toBeVisible();
  await expect(page.getByTestId("objective")).toContainText(/room/i);
  await expect(page.getByTestId("clock")).toContainText("19:15");

  await page.keyboard.press("Tab");
  await expect(page.getByTestId("hotspot-room")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("objective")).toContainText(/patron/i);
  await page.keyboard.press("Tab");
  for (const patron of ["north", "east", "south", "west"]) {
    await expect(page.getByTestId(`hotspot-patron-${patron}`)).toBeFocused();
    await page.keyboard.press("Enter");
  }
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("action-silence")).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("action-vodka")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("action-tune")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("hotspot-television")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("hotspot-telephone")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("action-wait")).toBeFocused();
  await page.keyboard.press("Enter");

  const summary = page.getByTestId("completion-summary");
  await expect(summary).toBeVisible();
  const summaryText = await summary.textContent();
  expect(summaryText).toMatch(/19:25/);
  expect(summaryText).toMatch(/observe/i);
  expect(summaryText).toMatch(/speak/i);
  expect(summaryText).toMatch(/serve/i);
  expect(summaryText).toMatch(/tune/i);
  expect(summaryText).toMatch(/wait/i);
  expect(summaryText).toMatch(/silence/i);
  expect(summaryText).toMatch(/vodka/i);
  expect(summaryText).toMatch(/telephone/i);

  expect(errors.console).toEqual([]);
  expect(errors.page).toEqual([]);
});

test("simultaneous hotspot hit rectangles remain unambiguous at the canonical viewport", async ({
  page,
}) => {
  await page.goto("/?phase=1");
  await expectContainedCenteredStage(page);
  await clickToPatrons(page);

  const patrons = ["north", "east", "south", "west"].map((id) =>
    page.getByTestId(`hotspot-patron-${id}`),
  );
  await Promise.all(patrons.map(async (patron) => expect(patron).toBeVisible()));
  await expectNoRectangleOverlap(patrons);

  for (const patron of ["north", "east", "south", "west"]) {
    await page.getByTestId(`hotspot-patron-${patron}`).click();
  }
  await page.getByTestId("action-answer").click();
  await page.getByTestId("action-tea").click();
  await page.getByTestId("action-tune").click();

  const televisionOffer = page.getByTestId("hotspot-television");
  const telephoneOffer = page.getByTestId("hotspot-telephone");
  const attentionOffers = [televisionOffer, telephoneOffer];
  await Promise.all(attentionOffers.map(async (offer) => expect(offer).toBeVisible()));
  await expect(televisionOffer).toHaveJSProperty("tagName", "BUTTON");
  await expect(telephoneOffer).toHaveJSProperty("tagName", "BUTTON");
  await expectNoRectangleOverlap(attentionOffers);
  await expect(televisionOffer).toHaveAccessibleName(/television/i);
  await expect(telephoneOffer).toHaveAccessibleName(/telephone/i);
  await televisionOffer.focus();
  await expect(televisionOffer).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(telephoneOffer).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(televisionOffer).toBeFocused();
});

test("the mounted live status node survives gameplay rendering and updates its text", async ({
  page,
}) => {
  await page.goto("/?phase=1");
  const liveStatus = page.getByRole("status");
  await expect(liveStatus).toHaveText(/inspect the room/i);
  await liveStatus.evaluate((element) => {
    (window as Window & { __phaseOneStatusNode?: Element }).__phaseOneStatusNode = element;
  });

  await page.getByTestId("hotspot-room").click();

  await expect(liveStatus).toHaveText(/four patrons/i);
  expect(
    await liveStatus.evaluate(
      (element) =>
        element === (window as Window & { __phaseOneStatusNode?: Element }).__phaseOneStatusNode,
    ),
  ).toBe(true);
});

test("letterboxes the logical stage without stretching at 1024 by 768", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/?phase=1");
  await expectContainedCenteredStage(page);

  const canvas = page.getByTestId("pixi-canvas");
  await expect(canvas).toHaveAttribute("width", "1920");
  await expect(canvas).toHaveAttribute("height", "1080");
  const box = await page.getByTestId("logical-stage").boundingBox();
  expect(box).not.toBeNull();
  if (box !== null) {
    expect(box.x).toBeCloseTo(0, 0);
    expect(box.y).toBeCloseTo(96, 0);
    expect(box.width).toBeCloseTo(1024, 0);
    expect(box.height).toBeCloseTo(576, 0);
  }
});

test("pause and settings consume no game time", async ({ page }) => {
  await page.goto("/?phase=1");
  const clock = page.getByTestId("clock");
  await expect(clock).toContainText("19:15");

  await page.keyboard.press("Tab");
  await expect(page.getByTestId("hotspot-room")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("settings-button")).toBeVisible();
  await page.keyboard.press("w");
  await expect(clock).toContainText("19:15");
  await page.getByTestId("settings-button").click();
  await page.keyboard.press("w");
  await page.keyboard.press("Enter");
  await expect(clock).toContainText("19:15");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("resume-button")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByTestId("hotspot-room").click();
  await expect(clock).toContainText("19:16");
});

test("150 percent interface text remains contained and consumes no game time", async ({ page }) => {
  await page.goto("/?phase=1");
  await clickThroughPatrons(page);

  const clock = page.getByTestId("clock");
  await expect(clock).toContainText("19:20");
  await page.keyboard.press("Escape");
  await page.getByTestId("settings-button").click();

  const largeText = page.getByLabel("Larger interface text");
  await largeText.check();
  const overlay = page.locator(".graybox-overlay");
  const fontSizes = await overlay.evaluate((element) => ({
    overlay: Number.parseFloat(getComputedStyle(element).fontSize),
    root: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(fontSizes.overlay).toBeCloseTo(fontSizes.root * 1.5, 3);
  await expect(clock).toContainText("19:20");

  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("action-answer")).toBeVisible();

  const stage = page.getByTestId("logical-stage");
  const containedControls = [
    page.locator(".graybox-hud"),
    page.locator(".choice-sheet"),
    page.getByTestId("action-answer"),
    page.getByTestId("action-silence"),
  ];
  const stageBox = await stage.boundingBox();
  expect(stageBox).not.toBeNull();
  if (stageBox !== null) {
    for (const control of containedControls) {
      const box = await control.boundingBox();
      expect(box).not.toBeNull();
      if (box !== null) {
        expect(box.x).toBeGreaterThanOrEqual(stageBox.x);
        expect(box.y).toBeGreaterThanOrEqual(stageBox.y);
        expect(box.x + box.width).toBeLessThanOrEqual(stageBox.x + stageBox.width);
        expect(box.y + box.height).toBeLessThanOrEqual(stageBox.y + stageBox.height);
      }
    }
  }
  await expectNoRectangleOverlap([
    page.getByTestId("action-answer"),
    page.getByTestId("action-silence"),
  ]);
  await expectNoRectangleOverlap([page.locator(".graybox-hud"), page.locator(".choice-sheet")]);
  await expect(clock).toContainText("19:20");
});

test("development diagnostics expose live Phase 1 review state", async ({ page }) => {
  await page.goto("/?phase=1");
  await page.getByTestId("debug-toggle").click();

  const panel = page.getByTestId("debug-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(/clock/i);
  await expect(panel).toContainText("19:15");
  await expect(panel).toContainText(/focus/i);
  await expect(panel).toContainText(/attention/i);
  await expect(panel).toContainText(/patron/i);
  await expect(panel).toContainText(/hotspot/i);
  await expect(panel).toContainText(/anchor/i);
  await expect(panel).toContainText(/pending/i);
  await expect(panel).toContainText(/transaction/i);

  await page.getByTestId("hotspot-room").click();
  await expect(panel).toContainText("19:16");
  await expect(panel).toContainText(/observe/i);
  await expect(panel).toContainText(/anchor-patron-north/i);
});
