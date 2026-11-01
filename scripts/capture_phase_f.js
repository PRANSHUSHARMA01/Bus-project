const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function main() {
  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 950 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // 1. Visit /anatomy in Cutaway mode (AIS-140 selected by default)
  console.log("Navigating to /anatomy (Cutaway mode)...");
  await page.goto('http://127.0.0.1:8000/anatomy');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  const cutawayPath = path.join(screenshotsDir, 'phase_f_anatomy_cutaway_overview.png');
  await page.screenshot({ path: cutawayPath, fullPage: true });
  console.log(`Saved screenshot: ${cutawayPath}`);

  // 2. Click "Passenger Panic SOS Buttons" hotspot filter
  console.log("Selecting Panic SOS subsystem...");
  await page.getByRole('button', { name: /Passenger Panic/i }).click();
  await page.waitForTimeout(400);

  const sosPath = path.join(screenshotsDir, 'phase_f_anatomy_sensor_inspected.png');
  await page.screenshot({ path: sosPath, fullPage: true });
  console.log(`Saved screenshot: ${sosPath}`);

  // 3. Switch to "DTC Livery" exterior view
  console.log("Switching to DTC Livery exterior view...");
  await page.getByRole('button', { name: /DTC Livery/i }).click();
  await page.waitForTimeout(400);

  const exteriorPath = path.join(screenshotsDir, 'phase_f_anatomy_exterior_livery.png');
  await page.screenshot({ path: exteriorPath, fullPage: true });
  console.log(`Saved screenshot: ${exteriorPath}`);

  // 4. Mobile Viewport
  console.log("Capturing Mobile viewport...");
  const mobileContext = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:8000/anatomy');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.waitForTimeout(600);

  const mobilePath = path.join(screenshotsDir, 'phase_f_anatomy_mobile.png');
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log(`Saved screenshot: ${mobilePath}`);

  await browser.close();
  console.log("Phase F visual verification complete!");
}

main().catch(err => {
  console.error("Error capturing Phase F screenshots:", err);
  process.exit(1);
});
