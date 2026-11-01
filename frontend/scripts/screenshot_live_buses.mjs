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

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Authenticate session
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

  // 1. Home View with Live Map Banner
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "13_home_with_live_buses_390.png") });
  console.log("Captured 13_home_with_live_buses_390.png");

  // 2. Open Live Map
  await page.click('button[aria-label="View live bus tracking map"]');
  await page.waitForTimeout(2500);

  // Check how many bus markers are rendered
  const busCount = await page.evaluate(() => {
    return document.querySelectorAll(".uber-bus-marker").length;
  });
  console.log(`Rendered bus markers on map: ${busCount}`);

  await page.screenshot({ path: path.join(outDir, "14_live_map_buses_390.png") });
  console.log("Captured 14_live_map_buses_390.png");

  // Desktop view
  const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await desktopPage.addInitScript(() => {
    localStorage.setItem("smart_bus_user", JSON.stringify({
      id: "pranshu_usr",
      email: "pranshu@example.com",
      full_name: "Pranshu",
      role: "passenger",
      language: "en"
    }));
    localStorage.setItem("smart_bus_token", "dev-user-pranshu_usr-passenger");
  });
  await desktopPage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1500);
  await desktopPage.click('button[aria-label="View live bus tracking map"]');
  await desktopPage.waitForTimeout(2500);
  await desktopPage.screenshot({ path: path.join(outDir, "14_live_map_buses_1280.png") });
  console.log("Captured 14_live_map_buses_1280.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
