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
      permissions: ["geolocation"],
      geolocation: { latitude: 28.5245, longitude: 77.1855 }, // Mehrauli, Delhi
    });
    const page = await context.newPage();

    // Set local auth state so app is unlocked
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

    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Open location sheet by clicking the location pill or shortcut
    const locBtn = await page.$("button[aria-label='Choose location'], .top-location-btn, button:has-text('Where to')");
    if (locBtn) {
      await locBtn.click();
      await page.waitForTimeout(600);
    } else {
      // Click shortcut
      const nearestBtn = await page.$("button:has-text('Nearest stop')");
      if (nearestBtn) await nearestBtn.click();
      await page.waitForTimeout(600);
    }

    await page.screenshot({ path: path.join(outDir, `10_location_sheet_${vp.name}.png`) });
    await context.close();
  }

  await browser.close();
  console.log("Phase 4 screenshots captured successfully!");
}

run().catch(console.error);
