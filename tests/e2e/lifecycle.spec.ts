import { expect, test, type Page } from "@playwright/test";

const business = {
  email: "maya@whoptasks.local",
  password: "WhopTasksDemo!2026",
};
const earner = {
  email: "jordan@whoptasks.local",
  password: "WhopTasksDemo!2026",
};

function moneyToCents(value: string): number {
  return Math.round(Number(value.replace(/[^0-9.-]/g, "")) * 100);
}

async function signIn(
  page: Page,
  account: typeof business,
  callbackUrl: string,
): Promise<void> {
  await page.goto(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(new RegExp(`${callbackUrl.replaceAll("/", "\\/")}`));
}

test("sign in, publish, claim, submit, approve, and transfer balances", async ({
  browser,
}) => {
  const runId = Date.now().toString(36);
  const title = `E2E lifecycle ${runId}`;
  const rewardCents = 1_234;
  const businessContext = await browser.newContext();
  const page = await businessContext.newPage();

  await signIn(page, business, "/business");
  const businessStartingBalance = moneyToCents(
    await page
      .getByText("Wallet available")
      .locator("..")
      .locator("dd")
      .innerText(),
  );

  await page.getByRole("link", { name: "Create campaign" }).click();
  await page.getByLabel("Campaign title").fill(title);
  await page
    .getByLabel("What outcome do you need?")
    .fill("Verify a complete marketplace lifecycle with structured evidence.");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Product QA" }).click();
  await page.getByLabel("Deadline").fill("2030-01-15T12:00");
  await page
    .getByLabel("Task instructions")
    .fill("Complete the test, summarize the result, and share a public proof URL.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Prompt").fill("Result summary");
  await page.getByRole("button", { name: "Add proof field" }).click();
  await page.getByLabel("Prompt").nth(1).fill("Public result URL");
  await page.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "URL", exact: true }).click();
  await page.getByRole("button", { name: "Add proof field" }).click();
  await page
    .getByLabel("Prompt")
    .nth(2)
    .fill("I confirm this work is original");
  await page.getByRole("combobox").nth(2).click();
  await page.getByRole("option", { name: "Confirmation" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Reward per approved task").fill("12.34");
  await page.getByLabel("Available slots").fill("1");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Fund and publish" }).click();

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("$12.34", { exact: true }).first()).toBeVisible();
  const taskUrl = await page
    .getByRole("link", { name: "View public task" })
    .getAttribute("href");
  expect(taskUrl).toBeTruthy();

  const earnerContext = await browser.newContext();
  const earnerPage = await earnerContext.newPage();
  await signIn(earnerPage, earner, taskUrl!);
  const earnerStartingBalance = moneyToCents(
    (await earnerPage
      .getByRole("link", { name: /^Wallet balance/ })
      .getAttribute("aria-label")) ?? "",
  );
  await earnerPage.getByRole("button", { name: "Claim task" }).click();
  await expect(
    earnerPage.getByRole("heading", { name: "Submit proof" }),
  ).toBeVisible();
  await earnerPage
    .getByLabel("Result summary")
    .fill("The full lifecycle completed successfully with all required states.");
  await earnerPage
    .getByLabel("Public result URL")
    .fill("https://example.test/e2e-proof");
  await earnerPage.getByRole("checkbox").check();
  await earnerPage.getByRole("button", { name: "Submit proof" }).click();
  await expect(
    earnerPage.getByText("Proof submitted. The business has been notified."),
  ).toBeVisible();

  await page.goto("/business");
  const reviewRow = page.locator("article").filter({ hasText: title });
  await reviewRow.getByRole("link", { name: "Review submission" }).click();
  await expect(page.getByText("https://example.test/e2e-proof")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Approve and pay" }).click();
  await expect(page.getByText("This reward has been paid.")).toBeVisible();

  await page.goto("/business");
  const businessFinalBalance = moneyToCents(
    await page
      .getByText("Wallet available")
      .locator("..")
      .locator("dd")
      .innerText(),
  );
  expect(businessFinalBalance).toBe(businessStartingBalance - rewardCents);

  await earnerPage.goto("/earn/earnings");
  const earnerFinalBalance = moneyToCents(
    (await earnerPage
      .getByRole("link", { name: /^Wallet balance/ })
      .getAttribute("aria-label")) ?? "",
  );
  expect(earnerFinalBalance).toBe(earnerStartingBalance + rewardCents);
  await expect(earnerPage.getByText(title)).toBeVisible();

  await Promise.all([businessContext.close(), earnerContext.close()]);
});

test("public marketplace stays branded and responsive in both themes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("whop-tasks-theme", "light");
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const brandValues = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return {
      accent: styles.getPropertyValue("--brand-vermilion").trim(),
      font: getComputedStyle(document.body).fontFamily,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  expect(brandValues.accent.toLowerCase()).toBe("#fa4616");
  expect(brandValues.font.toLowerCase()).toContain("acid");
  expect(brandValues.overflow).toBeLessThanOrEqual(0);
  await expect(
    page.locator('img[src*="/brand/logos/"]:visible').first(),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/marketplace-desktop-light.png",
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle color theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    ),
  ).toBeLessThanOrEqual(0);
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/marketplace-mobile-dark.png",
    fullPage: true,
  });
});
