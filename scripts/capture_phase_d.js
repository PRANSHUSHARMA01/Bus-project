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
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // 1. Visit /conductor without auth to capture Staff PIN Gate
  console.log("Navigating to Conductor portal (Unauthenticated)...");
  await page.goto('http://127.0.0.1:8000/conductor');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('http://127.0.0.1:8000/conductor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  const loginGatePath = path.join(screenshotsDir, 'phase_d_conductor_login_gate.png');
  await page.screenshot({ path: loginGatePath, fullPage: true });
  console.log(`Saved screenshot: ${loginGatePath}`);

  // 2. Perform PIN login via form
  console.log("Submitting PIN login...");
  await page.fill('input[type="text"]', 'DTC-4021');
  await page.fill('input[type="password"]', '1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // Start Duty shift if not already active
  const startShiftBtn = page.getByRole('button', { name: /Start Shift/i });
  if (await startShiftBtn.isVisible()) {
    await startShiftBtn.click();
    await page.waitForTimeout(800);
  }

  // Issue one ticket to show shift tally
  const issueTicketBtn = page.getByRole('button', { name: /Issue ₹10 Ticket/i });
  if (await issueTicketBtn.isVisible()) {
    await issueTicketBtn.click();
    await page.waitForTimeout(800);
  }

  // Capture Conductor Active Operations Dashboard
  const activeDashboardPath = path.join(screenshotsDir, 'phase_d_conductor_active_dashboard.png');
  await page.screenshot({ path: activeDashboardPath, fullPage: true });
  console.log(`Saved screenshot: ${activeDashboardPath}`);

  // 3. Open Incident Confirmation Modal (Flat Tire)
  const flatTireBtn = page.getByRole('button', { name: /Flat Tire/i });
  if (await flatTireBtn.isVisible()) {
    await flatTireBtn.click();
    await page.waitForTimeout(400);

    const incidentModalPath = path.join(screenshotsDir, 'phase_d_conductor_incident_modal.png');
    await page.screenshot({ path: incidentModalPath, fullPage: false });
    console.log(`Saved screenshot: ${incidentModalPath}`);
  }

  await browser.close();
  console.log("Phase D visual verification complete!");
}

main().catch(err => {
  console.error("Error capturing Phase D screenshots:", err);
  process.exit(1);
});
