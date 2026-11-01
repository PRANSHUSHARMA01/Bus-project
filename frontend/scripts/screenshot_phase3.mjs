import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.join("..", "screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\prans\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe",
  });

  const viewports = [
    { name: "mobile_390", width: 390, height: 844 },
    { name: "desktop_1280", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    // 1. Login Page
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, `07_login_${vp.name}.png`) });

    // 2. Onboarding Page
    await page.goto("http://localhost:3000/onboarding", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, `08_onboarding_${vp.name}.png`) });

    // 3. Account Page
    await page.goto("http://localhost:3000/account", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, `09_account_${vp.name}.png`) });

    await page.close();
  }

  await browser.close();
  console.log("Phase 3 screenshots captured successfully!");
}

run().catch(console.error);
