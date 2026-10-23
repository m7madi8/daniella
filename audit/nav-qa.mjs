import { chromium } from "playwright";
import path from "path";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = "file:///" + path.join(root, "index.html").replace(/\\/g, "/");
const outDir = path.join(root, "audit", "visual", "nav-after");
const viewports = [
  [320, 600],
  [360, 640],
  [375, 812],
  [390, 844],
  [430, 932],
  [375, 667],
  [430, 900],
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage();
const results = { viewports: [], a11y: {}, desktopOk: null, overflow: [] };

for (const [w, h] of viewports) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.click(".nav__toggle");
  await page.waitForTimeout(650);
  const shot = `${w}x${h}.png`;
  await page.screenshot({ path: path.join(outDir, shot) });
  const metrics = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    innerW: window.innerWidth,
    menuOpen: document.querySelector(".nav__links")?.classList.contains("is-open"),
    dialog: document.querySelector("#menu")?.getAttribute("aria-modal"),
    bodyLock: document.body.classList.contains("nav-open"),
  }));
  results.viewports.push({ w, h, shot, ...metrics });
  if (metrics.scrollW > metrics.innerW) results.overflow.push(`${w}x${h}`);
  await page.click(".nav__panel-close");
  await page.waitForTimeout(200);
}

await page.setViewportSize({ width: 375, height: 812 });
await page.goto(url, { waitUntil: "networkidle" });
await page.click(".nav__toggle");
await page.keyboard.press("Escape");
const afterEscape = await page.evaluate(() => ({
  open: document.querySelector(".nav__links")?.classList.contains("is-open"),
  expanded: document.querySelector(".nav__toggle")?.getAttribute("aria-expanded"),
  focused: document.activeElement?.className,
}));
await page.click(".nav__toggle");
await page.click('.nav__menu a[href="#practices"]');
await page.waitForTimeout(400);
const afterLink = await page.evaluate(() => ({
  open: document.querySelector(".nav__links")?.classList.contains("is-open"),
  hash: location.hash,
}));

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle" });
results.desktopOk = await page.evaluate(() => ({
  menuDisplay: getComputedStyle(document.querySelector(".nav__links")).display,
  linkCount: document.querySelectorAll(".nav__menu a").length,
  panelHeadHidden: getComputedStyle(document.querySelector(".nav__panel-head")).display === "none",
  horizontal: document.documentElement.scrollWidth <= window.innerWidth,
}));

await browser.close();
results.a11y = { afterEscape, afterLink };
console.log(JSON.stringify(results, null, 2));
