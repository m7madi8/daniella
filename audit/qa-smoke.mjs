import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const url = "file:///" + path.join(root, "index.html").replace(/\\/g, "/");

const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const jsErrors = [];
page.on("pageerror", (e) => jsErrors.push(e.message));

await page.goto(url, { waitUntil: "networkidle" });
for (const sel of ["#practices", ".motion", "#contact"]) {
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
}
await page.locator("#top").scrollIntoViewIfNeeded();

const imgs = await page.evaluate(() =>
  [...document.images].map((i) => ({
    src: (i.currentSrc || i.src).split("/").pop(),
    ok: i.complete && i.naturalWidth > 0,
  }))
);
const anchors = await page.evaluate(() =>
  [...document.querySelectorAll('a[href^="#"]')].map((a) => {
    const id = a.getAttribute("href").slice(1);
    return { href: a.getAttribute("href"), found: !id || !!document.getElementById(id) };
  })
);
await page.keyboard.press("Tab");
const skipFocused = await page.evaluate(() => document.activeElement?.classList.contains("skip"));

await browser.close();
const out = {
  jsErrors,
  imgs,
  brokenImgs: imgs.filter((i) => !i.ok),
  anchorsMissing: anchors.filter((a) => !a.found),
  skipFocused,
};
console.log(JSON.stringify(out, null, 2));
process.exit(out.brokenImgs.length || out.anchorsMissing.length || jsErrors.length ? 1 : 0);
