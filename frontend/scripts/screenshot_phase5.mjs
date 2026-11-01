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
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();

    // Authenticated dev session
    await page.addInitScript(() => {
      localStorage.setItem("smart_bus_user", JSON.stringify({
        id: "pranshu_usr",
        email: "pranshu@example.com",
        full_name: "Pranshu",
        role: "passenger",
        language: "en"
      }));
      localStorage.setItem("smart_bus_token", "dev-user-pranshu_usr-passenger");
    });

    // 1. Services Page
    await page.goto("http://localhost:3000/services", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, `11_services_${vp.name}.png`) });

    // 2. Activity Page
    await page.goto("http://localhost:3000/activity", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, `12_activity_${vp.name}.png`) });

    await context.close();
  }

  await browser.close();
  console.log("Phase 5 screenshots captured successfully!");
}

run().catch(console.error);
