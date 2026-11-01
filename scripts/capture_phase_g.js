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
    viewport: { width: 1280, height: 950 },
    deviceScaleFactor: 2,
    permissions: ['geolocation', 'microphone']
  });

  const page = await context.newPage();

  // 1. Visit /safety (Women's Safety & 112 PCR Hub)
  console.log("Navigating to /safety (Safety Hub)...");
  await page.goto('http://127.0.0.1:8000/safety');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  const portalPath = path.join(screenshotsDir, 'phase_g_1_safety_portal.png');
  await page.screenshot({ path: portalPath, fullPage: true });
  console.log(`Saved screenshot: ${portalPath}`);

  // 2. Trigger SOS with 5-second countdown buffer
  console.log("Triggering SOS countdown buffer...");
  const sosBtn = page.getByRole('button', { name: /TRIGGER SILENT SOS/i });
  await sosBtn.click();
  await page.waitForTimeout(500); // During countdown 4 or 5

  const countdownPath = path.join(screenshotsDir, 'phase_g_2_sos_countdown_buffer.png');
  await page.screenshot({ path: countdownPath });
  console.log(`Saved screenshot: ${countdownPath}`);

  // Cancel false alarm to avoid lingering state
  const cancelBtn = page.getByRole('button', { name: /CANCEL FALSE ALARM/i });
  if (await cancelBtn.isVisible()) {
    await cancelBtn.click();
  }

  // 3. Visit anonymous shared trip tracker /t/8s1ZmfbIgB0
  console.log("Navigating to /t/8s1ZmfbIgB0 (Anonymous Trip Viewer)...");
  const anonContext = await browser.newContext({
    viewport: { width: 1200, height: 950 },
    deviceScaleFactor: 2
  });
  const anonPage = await anonContext.newPage();
  await anonPage.goto('http://127.0.0.1:8000/t/8s1ZmfbIgB0');
  await anonPage.waitForLoadState('networkidle');
  await anonPage.waitForTimeout(1000);

  const sharedTripPath = path.join(screenshotsDir, 'phase_g_3_shared_trip_viewer.png');
  await anonPage.screenshot({ path: sharedTripPath, fullPage: true });
  console.log(`Saved screenshot: ${sharedTripPath}`);

  // 4. Mobile Anonymous Tracking Viewport
  console.log("Capturing Mobile Anonymous Viewer...");
  const mobileContext = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:8000/t/8s1ZmfbIgB0');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.waitForTimeout(800);

  const mobilePath = path.join(screenshotsDir, 'phase_g_4_shared_trip_mobile.png');
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log(`Saved screenshot: ${mobilePath}`);

  await browser.close();
  console.log("Phase G visual verification complete!");
}

main().catch(err => {
  console.error("Capture failed:", err);
  process.exit(1);
});
