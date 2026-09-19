import { chromium } from "@playwright/test";

const URL1 =
  "http://vouchmark-frontendbucket-iqsq8qbdvv2j.s3-website.ap-south-1.amazonaws.com";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 2400 } });
const perrors = [];
page.on("pageerror", (e) => perrors.push(String(e).slice(0, 140)));
page.on("console", (m) => {
  if (m.type() === "error") perrors.push("c:" + m.text().slice(0, 120));
});

await page.goto(URL1, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1000);

const info = await page.evaluate(() => {
  const root = document.getElementById("root");
  const h1 = document.querySelector("h1");
  const allText = document.body.innerText.replace(/\s+/g, " ").trim();
  const links = Array.from(document.querySelectorAll("a,button,[role=tab]"))
    .map((a) => (a.textContent || "").trim())
    .filter(Boolean)
    .slice(0, 14);
  return {
    title: document.title.slice(0, 60),
    rootChildren: root ? root.children.length : -1,
    rootHtmlLen: root ? root.innerHTML.length : -1,
    h1: h1 ? h1.textContent.trim().slice(0, 50) : null,
    h1Font: h1 ? getComputedStyle(h1).fontFamily : null,
    h1Weight: h1 ? getComputedStyle(h1).fontWeight : null,
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    links,
    bodyTextStart: allText.slice(0, 160),
    hasRulebook: /rulebook/i.test(allText),
    hasVouchmark: /Vouchmark/i.test(allText),
  };
});

console.log("=== pageerrors: " + perrors.length + " ===");
perrors.forEach((e) => console.log("  - " + e));
console.log("=== info ===");
console.log(JSON.stringify(info, null, 2));
await browser.close();
