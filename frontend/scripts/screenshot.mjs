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

    // 1. Home Light
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, `01_home_${vp.name}_light.png`) });

    // 2. Open Location Sheet
    await page.click(".location-picker-btn");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `02_location_sheet_${vp.name}.png`) });
    await page.click('button[aria-label="Close dialog"]');
    await page.waitForTimeout(400);

    // 3. Open Alerts Sheet
    await page.click("header button:last-child");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `03_alerts_sheet_${vp.name}.png`) });
    await page.click('button[aria-label="Close dialog"]');
    await page.waitForTimeout(400);

    // 4. Open Tracking Map (click first recent stop)
    await page.click(".recent-row");
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, `04_tracking_map_${vp.name}.png`) });

    // 5. Conductor Page
    await page.goto("http://localhost:3000/conductor", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, `05_conductor_${vp.name}.png`) });

    // 6. Admin Page
    await page.goto("http://localhost:3000/admin", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, `06_admin_${vp.name}.png`) });

    await page.close();
  }

  await browser.close();
  console.log("All screenshots captured cleanly!");
}

run().catch(console.error);
