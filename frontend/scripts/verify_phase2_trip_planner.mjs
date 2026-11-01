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

  console.log("Navigating to home...");
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Click Live Bus Map button
  await page.click('button[aria-label="View live bus tracking map"]');
  await page.waitForTimeout(2000);

  // Track bus to open Corridor stops
  await page.waitForSelector(".arrival-card", { timeout: 10000 });
  await page.click(".arrival-card");
  await page.waitForTimeout(2000);

  // Expand bottom sheet to full height so timeline is visible
  await page.evaluate(() => {
    const sheet = document.querySelector(".uber-sheet");
    if (sheet) sheet.style.height = "88vh";
  });
  await page.waitForTimeout(600);

  // Tap a downstream stop row to expand inline panel (row index 6)
  const stopRows = await page.$$(".timeline-row");
  if (stopRows.length >= 7) {
    await stopRows[6].click();
    await page.waitForTimeout(600);

    // Click "Set as destination" button
    const setDestBtn = await page.$("button:has-text('Set as destination')");
    if (setDestBtn) {
      console.log("Clicking 'Set as destination' to launch Multi-bus Trip Planner...");
      await setDestBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Verify TripPlannerView elements
  const tripCards = await page.$$(".trip-option-card");
  console.log(`Trip planner rendered options: ${tripCards.length}`);

  await page.screenshot({ path: path.join(outDir, "16_trip_planner_390.png") });
  console.log("Captured 16_trip_planner_390.png");

  // Desktop check
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await desktop.addInitScript(() => {
    localStorage.setItem("smart_bus_user", JSON.stringify({
      id: "pranshu_usr",
      email: "pranshu@example.com",
      full_name: "Pranshu",
      role: "passenger",
      language: "en"
    }));
    localStorage.setItem("smart_bus_token", "dev-user-pranshu_usr-passenger");
  });
  await desktop.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await desktop.waitForTimeout(1500);
  await desktop.click('button[aria-label="View live bus tracking map"]');
  await desktop.waitForTimeout(2000);
  await desktop.screenshot({ path: path.join(outDir, "16_fleet_dense_map_1280.png") });
  console.log("Captured 16_fleet_dense_map_1280.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
