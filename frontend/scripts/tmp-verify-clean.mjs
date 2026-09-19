import { chromium } from "@playwright/test";
const SITE = "http://vouchmark-frontendbucket-iqsq8qbdvv2j.s3-website.ap-south-1.amazonaws.com";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 2400 } });
const errs = [];
page.on("pageerror", (e) => errs.push("pageerror: " + String(e).slice(0, 160)));
page.on("requestfailed", (r) => errs.push("reqfail: " + (r.url().slice(-70) || "?")));
page.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 160)); });
await page.goto(SITE, { waitUntil: "networkidle", timeout: 45000 });
await page.waitForTimeout(1000);
const info = await page.evaluate(() => {
  const root = document.getElementById("root");
  const h1 = document.querySelector("h1");
  const p = document.querySelector("p");
  return {
    rootChildren: root ? root.children.length : -1,
    rootHtmlLen: root ? root.innerHTML.length : -1,
    h1: h1 ? h1.textContent.trim().slice(0, 60) : null,
    p: p ? p.textContent.trim().slice(0, 60) : null,
    hasReactMarker: document.body.hasAttribute("data-rh") || !!document.getElementById("root")?.hasAttribute("data-reactroot"),
    rootText: root ? root.textContent.slice(0, 160) : null,
    allText: document.body.innerText.slice(0, 160),
  };
});
console.log("=== errs " + errs.length + " ===");
errs.forEach((e) => console.log(" - " + e));
console.log("=== info ===");
console.log(JSON.stringify(info, null, 2));
await browser.close();
