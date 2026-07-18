import { expect, test, type Locator, type Page } from "@playwright/test";

test.describe.configure({ timeout: 120_000 });

interface BrowserErrors {
  readonly console: string[];
  readonly page: string[];
}

const errorsByPage = new WeakMap<Page, BrowserErrors>();

test.beforeEach(async ({ page }) => {
  const errors: BrowserErrors = { console: [], page: [] };
  errorsByPage.set(page, errors);
  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      // The e2e webServer is Vite DEV, which opens an HMR WebSocket. When the
      // harness recycles the server or the machine is under load, the browser
      // logs a transient ws connect/reconnect failure. This is dev-only noise.
      // The production build has no HMR ws. This is never an application error, so
      // it must not trip the strict console assertion below. Scope kept to
      // exactly the Vite HMR ws messages; every other console error still fails.
      if (
        /WebSocket connection to 'ws:\/\/[^']*' failed/i.test(text) ||
        /\[vite\] failed to connect to websocket/i.test(text)
      ) {
        return;
      }
      errors.console.push(text);
    }
  });
  page.on("pageerror", (error) => errors.page.push(error.message));
  await page.addInitScript(() => {
    const trackedWindow = window as Window & {
      __phaseTwoAudioLifecycle?: { created: number; resume: number; suspend: number };
      __phaseTwoPointerDownCount?: number;
    };
    trackedWindow.__phaseTwoPointerDownCount = 0;
    trackedWindow.__phaseTwoAudioLifecycle = { created: 0, resume: 0, suspend: 0 };

    const OriginalAudioContext = AudioContext;
    const originalResume = Reflect.get(AudioContext.prototype, "resume");
    const originalSuspend = Reflect.get(AudioContext.prototype, "suspend");
    AudioContext.prototype.resume = function trackedResume(): Promise<void> {
      const counters = trackedWindow.__phaseTwoAudioLifecycle;
      if (counters !== undefined) {
        counters.resume += 1;
      }
      return originalResume.call(this);
    };
    AudioContext.prototype.suspend = function trackedSuspend(): Promise<void> {
      const counters = trackedWindow.__phaseTwoAudioLifecycle;
      if (counters !== undefined) {
        counters.suspend += 1;
      }
      return originalSuspend.call(this);
    };
    window.AudioContext = new Proxy(OriginalAudioContext, {
      construct(target, argumentsList) {
        const counters = trackedWindow.__phaseTwoAudioLifecycle;
        if (counters !== undefined) {
          counters.created += 1;
        }
        return Reflect.construct(target, argumentsList) as AudioContext;
      },
    });

    window.addEventListener("pointerdown", () => {
      trackedWindow.__phaseTwoPointerDownCount =
        (trackedWindow.__phaseTwoPointerDownCount ?? 0) + 1;
    });
  });
});

test.afterEach(({ page }) => {
  const errors = errorsByPage.get(page);
  expect(errors?.console ?? []).toEqual([]);
  expect(errors?.page ?? []).toEqual([]);
});

function choice(page: Page, id: string): Locator {
  return page.getByTestId(`choice-${id}`);
}

function attention(page: Page, id: string): Locator {
  return page.getByTestId(`attention-${id}`);
}

// A pick can start an authored presentation beat of up to one minute. Route
// coverage collapses it through the shipped Continue control instead of racing
// a browser timer or increasing test timeouts.
async function skipHold(page: Page): Promise<void> {
  const overlay = page.getByTestId("narrative-overlay");
  if ((await overlay.getAttribute("data-beat")) === "hold") {
    await page.keyboard.press("Enter");
    await expect(overlay).not.toHaveAttribute("data-beat", "hold");
  }
}

async function pressFocused(page: Page, control: Locator): Promise<void> {
  await expect(control).toBeFocused();
  await page.keyboard.press("Enter");
  await skipHold(page);
}

// Belt-and-suspenders: after skipHold the overlay is already interactive, so
// this resolves immediately; it also covers the initial (beat-free) render.
async function settleBeat(page: Page): Promise<void> {
  await expect(page.getByTestId("narrative-overlay")).not.toHaveAttribute("data-beat", "hold");
}

async function moveAndPress(
  page: Page,
  key: "ArrowDown" | "ArrowRight" | "End",
  control: Locator,
): Promise<void> {
  await settleBeat(page);
  await page.keyboard.press(key);
  await pressFocused(page, control);
}

async function moveDownAndPress(page: Page, steps: number, control: Locator): Promise<void> {
  await settleBeat(page);
  for (let index = 0; index < steps; index += 1) {
    await page.keyboard.press("ArrowDown");
  }
  await pressFocused(page, control);
}

async function pressSilence(page: Page): Promise<void> {
  await settleBeat(page);
  await page.keyboard.press("s");
  await skipHold(page);
}

async function openPhaseTwoWithKeyboard(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByTestId("narrative-overlay")).toBeVisible();
  await expect(page.getByTestId("narrative-dialogue")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(choice(page, "choice_sample_observe_room")).toBeFocused();
}

async function playToAttention(page: Page): Promise<void> {
  await moveAndPress(page, "ArrowDown", choice(page, "choice_sample_ask_tasks"));
  await moveDownAndPress(page, 3, choice(page, "choice_sample_wait_opening_phrase"));
  await pressFocused(page, choice(page, "choice_sample_music_to_table"));
  await moveAndPress(page, "ArrowDown", choice(page, "choice_sample_name_galina_labor"));
  await pressFocused(page, choice(page, "choice_sample_let_nikolai_answer"));
  await pressFocused(page, choice(page, "choice_sample_turn_to_arkady"));
  await pressFocused(page, choice(page, "choice_sample_ask_authority"));
  await pressFocused(page, choice(page, "choice_sample_look_to_lev"));
  await pressFocused(page, choice(page, "choice_sample_check_the_table"));
  await pressFocused(page, choice(page, "choice_sample_tune_signal_now"));
  await pressFocused(page, choice(page, "choice_sample_tuned_to_glass"));
  await pressFocused(page, choice(page, "choice_sample_clear_glass"));
  await pressFocused(page, choice(page, "choice_sample_observe_photo_after_clear"));
  await moveAndPress(page, "ArrowDown", choice(page, "choice_sample_ask_why_photo_moved"));
  await pressSilence(page);
  await pressFocused(page, choice(page, "choice_sample_hold_private_claim"));

  await expect(page.getByTestId("narrative-attention")).toBeVisible();
  await expect(page.getByTestId("narrative-clock")).toContainText("19:42");
  await expect(attention(page, "offer_sample_television")).toBeFocused();
}

async function playToSixtySecondPostReportHold(page: Page): Promise<void> {
  await playToAttention(page);
  await pressFocused(page, attention(page, "offer_sample_television"));
  await pressFocused(page, choice(page, "choice_sample_turn_from_tv"));

  await settleBeat(page);
  for (let index = 0; index < 3; index += 1) {
    await page.keyboard.press("ArrowDown");
  }
  const wait = choice(page, "choice_sample_wait_after_report");
  await expect(wait).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("narrative-overlay")).toHaveAttribute("data-beat", "hold");
  await expect(page.getByTestId("dialogue-line")).toHaveText(
    "The receiver hum returns beneath the chairs. Arkady still has to answer.",
  );
}

async function expectContainedBy(container: Locator, controls: readonly Locator[]): Promise<void> {
  const containerBox = await container.boundingBox();
  expect(containerBox).not.toBeNull();
  if (containerBox === null) {
    return;
  }

  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    if (box === null) {
      continue;
    }
    expect(box.x).toBeGreaterThanOrEqual(containerBox.x - 0.5);
    expect(box.y).toBeGreaterThanOrEqual(containerBox.y - 0.5);
    expect(box.x + box.width).toBeLessThanOrEqual(containerBox.x + containerBox.width + 0.5);
    expect(box.y + box.height).toBeLessThanOrEqual(containerBox.y + containerBox.height + 0.5);
  }
}

test("completes through meaningful silence and a semantic attention choice using only the keyboard", async ({
  page,
}) => {
  await openPhaseTwoWithKeyboard(page);
  await playToAttention(page);

  const attentionRegion = page.getByTestId("narrative-attention");
  await expect(attentionRegion.getByRole("button")).toHaveCount(3);
  await expect(attention(page, "offer_sample_television")).toHaveAccessibleName(/television/i);
  await expect(attention(page, "offer_sample_arkady_rewrite")).toHaveAccessibleName(/Arkady/i);
  await expect(attention(page, "offer_sample_galina_aside")).toHaveAccessibleName(/Galina/i);
  await moveAndPress(page, "ArrowRight", attention(page, "offer_sample_arkady_rewrite"));

  await expect(page.getByTestId("dialogue-line")).toContainText(
    "I opposed this from the beginning",
  );
  await pressFocused(page, choice(page, "choice_sample_answer_directly"));
  await moveDownAndPress(page, 3, choice(page, "choice_sample_wait_after_report"));
  await pressFocused(page, choice(page, "choice_sample_resume_arkady_route"));
  await expect(page.getByTestId("dialogue-line")).toContainText(
    "You said an emergency could require it",
  );
  await expect(page.getByTestId("dialogue-line")).not.toContainText("I heard you say something");
  await pressFocused(page, choice(page, "choice_sample_let_arkady_answer_direct"));
  await pressFocused(page, choice(page, "choice_sample_return_to_gennady"));

  await expect(choice(page, "choice_sample_repeat_private_claim")).toBeVisible();
  await expect(choice(page, "choice_sample_keep_private_claim")).toBeVisible();
  await pressSilence(page);
  await expect(page.getByTestId("dialogue-line")).toContainText("does not ask what was said");
  await pressFocused(page, choice(page, "choice_sample_finish_private_record"));
  await pressFocused(page, choice(page, "choice_sample_complete_private_record"));

  await expect(page.getByTestId("narrative-summary")).toContainText("A Private Record");
  await expect(page.getByTestId("narrative-summary")).toContainText("did not give it to the room");
  await expect(page.getByTestId("narrative-summary")).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __phaseTwoPointerDownCount?: number }).__phaseTwoPointerDownCount ??
        0,
    ),
  ).toBe(0);
});

test("keeps fragmentary and second-hand wording distinct from direct witness wording", async ({
  page,
}) => {
  await openPhaseTwoWithKeyboard(page);
  await playToAttention(page);
  await pressFocused(page, attention(page, "offer_sample_television"));
  await pressFocused(page, choice(page, "choice_sample_turn_from_tv"));
  await moveDownAndPress(page, 3, choice(page, "choice_sample_wait_after_report"));
  await pressFocused(page, choice(page, "choice_sample_resume_tv_route"));

  const fragmentLine = page.getByTestId("dialogue-line");
  await expect(fragmentLine).toContainText("I heard you say something about opposing it");
  await expect(fragmentLine).not.toContainText("You said an emergency could require it");
  await expect(choice(page, "choice_sample_answer_directly")).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("narrative-dialogue")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(choice(page, "choice_sample_observe_room")).toBeFocused();
  await playToAttention(page);
  await moveAndPress(page, "End", attention(page, "offer_sample_galina_aside"));
  await pressFocused(page, choice(page, "choice_sample_ask_lev_what_changed"));
  await moveDownAndPress(page, 3, choice(page, "choice_sample_wait_after_report"));
  await pressFocused(page, choice(page, "choice_sample_resume_galina_route"));

  await expect(page.getByTestId("dialogue-line")).toHaveText(
    "While you were away, Arkady discovered he had always objected.",
  );
  await expect(choice(page, "choice_sample_use_secondhand_wording")).toHaveText(
    "Ask with Lev named as the source.",
  );
  await expect(choice(page, "choice_sample_answer_directly")).toHaveCount(0);
  await pressFocused(page, choice(page, "choice_sample_use_secondhand_wording"));
  await expect(page.getByTestId("dialogue-line")).toHaveText(
    "Lev says your account changed. Did it?",
  );
});

test("restores the checkpoint's visible state and focus after the room advances", async ({
  page,
}) => {
  await openPhaseTwoWithKeyboard(page);
  const clock = page.getByTestId("narrative-clock");
  const line = page.getByTestId("dialogue-line");
  const savedClock = await clock.textContent();
  const savedLine = await line.textContent();
  const savedChoices = await page.locator("[data-choice-id]").allTextContents();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("narrative-pause-dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  await pressFocused(page, page.getByTestId("save-checkpoint"));
  await expect(page.getByTestId("narrative-status")).toContainText("Checkpoint saved at");
  await page.keyboard.press("Shift+Tab");
  await pressFocused(page, page.getByTestId("narrative-resume"));
  await pressFocused(page, choice(page, "choice_sample_observe_room"));
  await pressFocused(page, choice(page, "choice_sample_let_room_continue"));
  await expect(line).not.toHaveText(savedLine ?? "");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("narrative-pause-dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await pressFocused(page, page.getByTestId("load-checkpoint"));

  await expect(clock).toHaveText(savedClock ?? "");
  await expect(line).toHaveText(savedLine ?? "");
  await expect(page.locator("[data-choice-id]")).toHaveText(savedChoices);
  await expect(choice(page, "choice_sample_observe_room")).toBeFocused();
  await expect(page.getByTestId("narrative-status")).toContainText("Checkpoint loaded at");
});

test("pause, settings, and 150 percent text do not move the clock or escape the stage", async ({
  page,
}) => {
  await openPhaseTwoWithKeyboard(page);
  const clock = page.getByTestId("narrative-clock");
  const before = await clock.textContent();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("narrative-pause-dialog")).toContainText(
    `The room remains at ${before ?? ""}.`,
  );
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await pressFocused(page, page.getByTestId("open-narrative-settings"));
  await expect(page.getByTestId("narrative-settings")).toBeVisible();
  await page.keyboard.press("Space");

  const overlay = page.getByTestId("narrative-overlay");
  await expect(overlay).toHaveClass(/large-text/);
  const fullPacing = page.getByLabel("Full", { exact: true });
  const briefPacing = page.getByLabel("Brief (up to five seconds)", { exact: true });
  const immediatePacing = page.getByLabel("Immediate", { exact: true });
  await expect(fullPacing).toBeChecked();
  await briefPacing.check();
  await expect(briefPacing).toBeChecked();
  await immediatePacing.check();
  await expect(immediatePacing).toBeChecked();
  const fontSizes = await overlay.evaluate((element) => ({
    overlay: Number.parseFloat(getComputedStyle(element).fontSize),
    root: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(fontSizes.overlay).toBeCloseTo(fontSizes.root * 1.5, 3);
  await expect(clock).toHaveText(before ?? "");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("narrative-pause-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(clock).toHaveText(before ?? "");
  await expect(choice(page, "choice_sample_observe_room")).toBeFocused();

  await expectContainedBy(page.getByTestId("logical-stage"), [
    page.locator(".narrative-hud"),
    page.locator(".narrative-dialogue"),
    page.locator(".narrative-utility"),
  ]);
  expect(
    await page
      .locator(".narrative-dialogue")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);

  await page.keyboard.press("ArrowDown");
  await expect(choice(page, "choice_sample_ask_tasks")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(overlay).not.toHaveAttribute("data-beat", "hold");
  await expect(choice(page, "choice_sample_wait_opening_phrase")).toBeVisible();
});

test("a panel click skips a held response without moving the room clock", async ({ page }) => {
  await openPhaseTwoWithKeyboard(page);
  await page.keyboard.press("ArrowDown");
  await expect(choice(page, "choice_sample_ask_tasks")).toBeFocused();
  await page.keyboard.press("Enter");

  const overlay = page.getByTestId("narrative-overlay");
  const clock = page.getByTestId("narrative-clock");
  const heldClock = await clock.textContent();
  await expect(overlay).toHaveAttribute("data-beat", "hold");
  await expect(page.getByTestId("dialogue-line")).toContainText(
    "The television picture rolls once",
  );
  await expect(page.locator("[data-choice-id]")).toHaveCount(0);
  await expect(page.getByTestId("presentation-continue")).toBeVisible();

  await page.getByTestId("dialogue-line").click();

  await expect(overlay).not.toHaveAttribute("data-beat", "hold");
  await expect(page.getByTestId("presentation-continue")).toHaveCount(0);
  await expect(choice(page, "choice_sample_wait_opening_phrase")).toBeVisible();
  await expect(clock).toHaveText(heldClock ?? "");
});

test("the one-minute hold remains skippable after an immediate pause and resume", async ({
  page,
}) => {
  await openPhaseTwoWithKeyboard(page);
  await playToSixtySecondPostReportHold(page);

  const overlay = page.getByTestId("narrative-overlay");
  const clock = page.getByTestId("narrative-clock");
  const heldClock = await clock.textContent();
  const continueButton = page.getByTestId("presentation-continue");
  await expect(page.locator("[data-choice-id]")).toHaveCount(0);
  await expect(continueButton).toBeVisible();
  await expect(continueButton).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("narrative-pause-dialog")).toBeVisible();
  await expect(overlay).toHaveAttribute("data-beat", "hold");
  await expect(clock).toHaveText(heldClock ?? "");

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("narrative-pause-dialog")).toHaveCount(0);
  await expect(overlay).toHaveAttribute("data-beat", "hold");
  await expect(continueButton).toBeFocused();
  await expect(clock).toHaveText(heldClock ?? "");

  await page.keyboard.press("Space");

  await expect(overlay).not.toHaveAttribute("data-beat", "hold");
  await expect(continueButton).toHaveCount(0);
  await expect(choice(page, "choice_sample_resume_tv_route")).toBeVisible();
  await expect(clock).toHaveText(heldClock ?? "");
});

test("pause suspends music, resume restarts it, and reduced motion reaches the scene", async ({
  page,
}) => {
  await openPhaseTwoWithKeyboard(page);
  const audioLifecycle = async (): Promise<{
    created: number;
    resume: number;
    suspend: number;
  }> =>
    page.evaluate(
      () =>
        (
          window as Window & {
            __phaseTwoAudioLifecycle?: { created: number; resume: number; suspend: number };
          }
        ).__phaseTwoAudioLifecycle ?? { created: 0, resume: 0, suspend: 0 },
    );

  await expect.poll(async () => (await audioLifecycle()).created).toBeGreaterThan(0);
  const beforePause = await audioLifecycle();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("narrative-pause-dialog")).toBeVisible();
  await expect
    .poll(async () => (await audioLifecycle()).suspend)
    .toBeGreaterThan(beforePause.suspend);

  const beforeResume = await audioLifecycle();
  await page.keyboard.press("Escape");
  await expect(choice(page, "choice_sample_observe_room")).toBeFocused();
  await expect
    .poll(async () => (await audioLifecycle()).resume)
    .toBeGreaterThan(beforeResume.resume);

  await page.keyboard.press("Escape");
  await page.getByTestId("open-narrative-settings").click();
  const reduceMotion = page.getByLabel("Reduce interface motion");
  const stage = page.getByTestId("logical-stage");
  const overlay = page.getByTestId("narrative-overlay");

  await expect(stage).toHaveAttribute("data-reduced-motion", "false");
  await reduceMotion.check();
  await expect(overlay).toHaveClass(/reduce-motion/);
  await expect(stage).toHaveAttribute("data-reduced-motion", "true");

  await reduceMotion.uncheck();
  await expect(overlay).not.toHaveClass(/reduce-motion/);
  await expect(stage).toHaveAttribute("data-reduced-motion", "false");
});
