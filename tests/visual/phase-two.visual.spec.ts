import { expect, test, type Page, type TestInfo } from "@playwright/test";

test.setTimeout(60_000);

const viewportSuffixByProject: Readonly<Record<string, string>> = {
  "chromium-1920x1080": "1920x1080",
  "chromium-1366x768": "1366x768",
};

type PhaseTwoVisualState =
  | "opening-dialogue"
  | "opening-maintenance"
  | "attention-window"
  | "post-report-held"
  | "post-report-quiet"
  | "fragment-wording"
  | "public-break-summary";

function captureName(state: PhaseTwoVisualState, testInfo: TestInfo): string {
  const suffix = viewportSuffixByProject[testInfo.project.name];
  expect(suffix).toBeDefined();
  if (suffix === undefined) {
    throw new Error(`Missing visual viewport suffix for ${testInfo.project.name}.`);
  }
  return `phase-2-${state}-${suffix}.png`;
}

async function settlePaint(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
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
}

async function skipAuthoredHold(page: Page): Promise<void> {
  const overlay = page.getByTestId("narrative-overlay");
  if ((await overlay.getAttribute("data-beat")) === "hold") {
    await page.keyboard.press("Enter");
    await expect(overlay).not.toHaveAttribute("data-beat", "hold");
  }
}

async function choose(page: Page, choiceId: string): Promise<void> {
  const choice = page.getByTestId(`choice-${choiceId}`);
  await expect(choice).toBeVisible();
  await choice.click();
  await skipAuthoredHold(page);
  await settlePaint(page);
}

async function openPhaseTwo(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("narrative-overlay")).toBeVisible();
  await expect(page.getByTestId("narrative-dialogue")).toBeVisible();
  await settlePaint(page);
}

async function playToAttention(page: Page): Promise<void> {
  await choose(page, "choice_sample_ask_tasks");
  await choose(page, "choice_sample_wait_opening_phrase");
  await choose(page, "choice_sample_music_to_table");
  await choose(page, "choice_sample_name_galina_labor");
  await choose(page, "choice_sample_let_nikolai_answer");
  await choose(page, "choice_sample_turn_to_arkady");
  await choose(page, "choice_sample_ask_authority");
  await choose(page, "choice_sample_look_to_lev");
  await choose(page, "choice_sample_check_the_table");
  await choose(page, "choice_sample_tune_signal_now");
  await choose(page, "choice_sample_tuned_to_glass");
  await choose(page, "choice_sample_clear_glass");
  await choose(page, "choice_sample_observe_photo_after_clear");
  await choose(page, "choice_sample_ask_why_photo_moved");
  await choose(page, "choice_sample_silence_gennady_private");
  await choose(page, "choice_sample_hold_private_claim");
  await expect(page.getByTestId("narrative-attention")).toBeVisible();
  await expect(page.getByTestId("narrative-clock")).toContainText("19:42");
}

async function playToOpeningMaintenance(page: Page): Promise<void> {
  await choose(page, "choice_sample_ask_tasks");
  await expect(page.getByTestId("dialogue-line")).toContainText(
    "A thin instrumental phrase sits under the receiver hiss",
  );
}

async function playToPostReportQuiet(page: Page): Promise<void> {
  await playToAttention(page);
  await page.getByTestId("attention-offer_sample_television").click();
  await skipAuthoredHold(page);
  await choose(page, "choice_sample_turn_from_tv");
  await expect(page.getByTestId("dialogue-line")).toContainText(
    "The music is gone. The television stays on.",
  );
}

async function playToPostReportHeld(page: Page): Promise<void> {
  await playToAttention(page);
  await page.getByTestId("attention-offer_sample_television").click();
  await skipAuthoredHold(page);
  await choose(page, "choice_sample_turn_from_tv");

  const wait = page.getByTestId("choice-choice_sample_wait_after_report");
  await expect(wait).toBeVisible();
  await wait.click();
  await expect(page.getByTestId("narrative-overlay")).toHaveAttribute("data-beat", "hold");
  await expect(page.getByTestId("dialogue-line")).toHaveText(
    "The receiver hum returns beneath the chairs. Arkady still has to answer.",
  );
  await expect(page.locator("[data-choice-id]")).toHaveCount(0);
  await expect(page.getByTestId("presentation-continue")).toBeVisible();
  await settlePaint(page);
}

async function playToFragmentWording(page: Page): Promise<void> {
  await playToAttention(page);
  await page.getByTestId("attention-offer_sample_television").click();
  await skipAuthoredHold(page);
  await settlePaint(page);
  await choose(page, "choice_sample_turn_from_tv");
  await choose(page, "choice_sample_wait_after_report");
  await choose(page, "choice_sample_resume_tv_route");
  await expect(page.getByTestId("dialogue-line")).toContainText(
    "I heard you say something about opposing it from the start",
  );
}

async function playToPublicBreakSummary(page: Page): Promise<void> {
  await playToFragmentWording(page);
  await choose(page, "choice_sample_let_arkady_answer_fragment");
  await choose(page, "choice_sample_return_to_gennady");
  await choose(page, "choice_sample_repeat_private_claim");
  await choose(page, "choice_sample_let_public_room_settle");

  // The summary is set on the final narrative node. Complete the node through
  // its semantic control so the capture shows the stable end state only.
  await page
    .getByTestId("choice-choice_sample_complete_public_rupture")
    .evaluate((button: HTMLButtonElement) => {
      button.click();
    });
  await skipAuthoredHold(page);
  await settlePaint(page);
  await expect(page.getByTestId("narrative-summary")).toBeVisible();
  await expect(page.getByTestId("narrative-summary")).toContainText("A Public Break");
  await expect(page.getByTestId("narrative-summary")).toContainText("face-down");
}

test("captures the Phase 2 opening dialogue", async ({ page }, testInfo) => {
  await openPhaseTwo(page);
  await page.keyboard.press("Tab");
  await expect(page.getByTestId("choice-choice_sample_observe_room")).toBeFocused();

  await expect(page).toHaveScreenshot(captureName("opening-dialogue", testInfo), {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});

test("captures opening maintenance with the television music still low", async ({
  page,
}, testInfo) => {
  await openPhaseTwo(page);
  await playToOpeningMaintenance(page);
  await page.getByTestId("choice-choice_sample_wait_opening_phrase").focus();

  await expect(page).toHaveScreenshot(captureName("opening-maintenance", testInfo), {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});

test("captures the three-way attention window", async ({ page }, testInfo) => {
  await openPhaseTwo(page);
  await playToAttention(page);
  const television = page.getByTestId("attention-offer_sample_television");
  await television.focus();
  await expect(television).toBeFocused();

  await expect(page).toHaveScreenshot(captureName("attention-window", testInfo), {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});

test("captures fragment-safe provenance wording", async ({ page }, testInfo) => {
  await openPhaseTwo(page);
  await playToFragmentWording(page);
  await page.getByTestId("choice-choice_sample_let_arkady_answer_fragment").focus();

  await expect(page).toHaveScreenshot(captureName("fragment-wording", testInfo), {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});

test("captures the post-report quiet with the television left on", async ({ page }, testInfo) => {
  await openPhaseTwo(page);
  await playToPostReportQuiet(page);
  await page.getByTestId("choice-choice_sample_wait_after_report").focus();

  await expect(page).toHaveScreenshot(captureName("post-report-quiet", testInfo), {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});

test("captures the held post-report room before choices return", async ({ page }, testInfo) => {
  await openPhaseTwo(page);
  await playToPostReportHeld(page);
  await page.getByTestId("presentation-continue").focus();

  await expect(page).toHaveScreenshot(captureName("post-report-held", testInfo), {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});

test("captures the public break summary and object consequence", async ({ page }, testInfo) => {
  await openPhaseTwo(page);
  await playToPublicBreakSummary(page);
  await page.getByTestId("narrative-summary").focus();

  await expect(page).toHaveScreenshot(captureName("public-break-summary", testInfo), {
    animations: "disabled",
    caret: "hide",
    fullPage: true,
  });
});
