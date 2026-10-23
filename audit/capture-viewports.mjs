import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = process.argv[2] || path.join(root, "audit", "visual", "before");
const file = path.join(root, "index.html");
const url = "file:///" + file.replace(/\\/g, "/");

const viewports = [
  { name: "320x700", width: 320, height: 700 },
  { name: "375x812", width: 375, height: 812 },
  { name: "430x932", width: 430, height: 932 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();

for (const vp of viewports) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  await page.screenshot({
    path: path.join(outDir, `hero-${vp.name}.png`),
    fullPage: false,
  });
}

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: "networkidle" });
const imgs = await page.$$eval("img[src]", (els) =>
  els.map((el) => ({ src: el.getAttribute("src"), ok: el.complete && el.naturalWidth > 0 }))
);
await browser.close();
console.log(JSON.stringify({ outDir, imgs, errors }, null, 2));
