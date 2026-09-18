import { expect, test } from "@playwright/test";

async function useEnglish(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("combobox").selectOption("English");
}

test("sample letter loads into the paste box, then runs end-to-end", async ({ page }) => {
  await useEnglish(page);
  await expect(page.getByText("If an insurer says “no”, is that the whole story?")).toBeVisible();

  await page.locator("header").getByRole("button", { name: "Try a sample" }).click();
  await expect(page.getByRole("textbox")).toHaveValue(/Claim No: CLM20260828-00741/);

  await page.getByRole("button", { name: "Check this rejection" }).click();

  await expect(page.getByText("grounds look weak")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("The numbers")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Counter letter draft" })).toBeVisible();
  await expect(page.getByText("Re: Request for reconsideration —", { exact: false })).toBeVisible();
});

test("pasting a letter and checking the rejection produces a verdict and a letter", async ({ page }) => {
  await useEnglish(page);

  const letterText = [
    "Policy No: EHAI/FLA/21/ID-0012354",
    "Your claim for acute myocardial infarction was rejected because:",
    "1) The ailment is a pre-existing disease not disclosed at inception.",
    "2) Intimation was not given within 24 hours of hospitalization.",
    "3) Treating surgeon's case papers are awaited; claim held pending.",
  ].join("\n");

  await page.getByRole("textbox").fill(letterText);
  await page.getByRole("button", { name: "Check this rejection" }).click();

  await expect(page.getByText("grounds look weak")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("The numbers")).toBeVisible();
  await expect(page.getByText("Your next moves")).toBeVisible();
  await expect(page.getByText("each reason", { exact: false }).first()).toBeVisible();
});