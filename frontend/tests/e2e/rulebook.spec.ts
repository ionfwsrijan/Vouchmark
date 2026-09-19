import { expect, test } from "@playwright/test";

test("the rulebook page filters grounds and explains each one", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox").selectOption("English");
  await page.getByRole("button", { name: "The rulebook" }).click();

  await expect(
    page.getByRole("heading", { name: /Why each reason is/ }),
  ).toBeVisible();
  await expect(page.getByText("Pre-existing disease (PED) exclusion")).toBeVisible();
  await expect(page.getByText("Maternity waiting period")).toBeVisible();

  await page.getByRole("button", { name: /Often contestable/ }).click();
  await expect(page.getByText("Late / non-intimation")).toBeVisible();
  await expect(page.getByText("Claims officer")).toBeVisible();
  await expect(page.getByText("Maternity waiting period")).toBeHidden();

  await page.getByRole("button", { name: /All grounds/ }).click();
  await page.getByRole("searchbox").fill("maternity");
  await expect(page.getByText("Maternity waiting period")).toBeVisible();
  await expect(page.getByText("Pre-existing disease (PED) exclusion")).toBeHidden();
});