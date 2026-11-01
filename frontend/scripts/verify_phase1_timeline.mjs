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

  const widths = [360, 390, 430];
  let allPassed = true;

  for (const w of widths) {
    console.log(`\n--- Testing Timeline at ${w}px ---`);
    const page = await browser.newPage({ viewport: { width: w, height: 844 } });

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

    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Click Live Bus Map button
    await page.click('button[aria-label="View live bus tracking map"]');
    await page.waitForTimeout(2000);

    // Wait for arrival card to load and click it to track bus
    await page.waitForSelector(".arrival-card", { timeout: 10000 });
    await page.click(".arrival-card");
    await page.waitForTimeout(2000);

    // Expand sheet to full height so timeline is visible
    await page.evaluate(() => {
      const sheet = document.querySelector(".uber-sheet");
      if (sheet) sheet.style.height = "88vh";
    });
    await page.waitForTimeout(500);

    // 1. Check No horizontal overflow
    const scrollInfo = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    if (scrollInfo.scrollWidth > scrollInfo.innerWidth) {
      console.error(`FAILED: Horizontal scroll detected at ${w}px!`);
      allPassed = false;
    } else {
      console.log(`PASSED: 0px horizontal scroll at ${w}px.`);
    }

    // 2. Check timeline rows count and rail elements
    const timelineInfo = await page.evaluate(() => {
      const rows = document.querySelectorAll(".timeline-row");
      const nextRow = document.querySelector(".timeline-row-next");
      const passedRows = document.querySelectorAll(".timeline-row-passed");
      return {
        count: rows.length,
        hasNext: !!nextRow,
        passedCount: passedRows.length,
      };
    });
    console.log(`Timeline details at ${w}px:`, timelineInfo);

    // Save screenshot
    await page.screenshot({ path: path.join(outDir, `15_timeline_${w}.png`) });

    // For 390px, also test expand and dark mode
    if (w === 390) {
      // Test inline panel expansion by clicking a stop row
      const firstRow = await page.$(".timeline-row");
      if (firstRow) {
        await firstRow.click();
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(outDir, "15_timeline_expanded_390.png") });
        console.log("Captured 15_timeline_expanded_390.png");
      }

      // Switch to Dark mode
      await page.evaluate(() => {
        document.documentElement.setAttribute("data-theme", "dark");
      });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(outDir, "15_timeline_dark_390.png") });
      console.log("Captured 15_timeline_dark_390.png");
    }

    await page.close();
  }

  await browser.close();

  if (allPassed) {
    console.log("\nALL PHASE 1 TIMELINE CHECKS PASSED!");
  } else {
    console.error("\nSOME CHECKS FAILED!");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
