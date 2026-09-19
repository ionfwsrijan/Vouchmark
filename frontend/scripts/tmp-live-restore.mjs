// Capture README screenshots from the live deployed app (DemoMode).
// Run: cd frontend && node scripts/capture-screenshots.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../docs/screenshots",
);
const SITE =
  "http://vouchmark-frontendbucket-iqsq8qbdvv2j.s3-website.ap-south-1.amazonaws.com";

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

async function shot(name) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log(`captured ${name}`);
}

await page.goto(SITE, { waitUntil: "networkidle" });
await page.getByText(/If an insurer says/).waitFor();
await shot("landing.png");

// How it works modal
await page.getByText("How it works", { exact: true }).first().click();
await page.getByRole("dialog").waitFor();
await shot("how-it-works.png");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// Run the demo flow
await page.getByRole("button", { name: "Try a sample" }).first().click();
await page.getByRole("textbox").waitFor();
await page.getByRole("button", { name: "Check this rejection" }).click();
await page.getByText("grounds look weak").waitFor({ timeout: 15_000 });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, "verdict.png"), fullPage: true });
console.log("captured verdict.png");

// History drawer (a case now exists)
await page.getByText("Case history", { exact: true }).first().click();
await page.locator(".history-panel").waitFor();
await page.waitForTimeout(400);
await shot("history.png");

const mob = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const mpage = await mob.newPage();
await mpage.goto(SITE, { waitUntil: "networkidle" });
await mpage.getByText(/If an insurer says/).waitFor();
await mpage.screenshot({ path: path.join(OUT, "landing-mobile.png"), fullPage: true });
console.log("captured landing-mobile.png");
await mob.close();

await ctx.close();
await browser.close();
console.log("done");