const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const { execSync } = require('child_process');
const fs = require('fs');

async function main() {
  console.log("Seeding demo user for Phase C...");
  const seedScript = path.resolve(__dirname, 'seed_demo_phase_c.py');
  const seedOutput = execSync(`python "${seedScript}"`, { encoding: 'utf-8' });
  const seedData = JSON.parse(seedOutput.trim());
  const { user, token } = seedData;

  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2
  });

  // Add cookies for authentication
  await context.addCookies([
    {
      name: 'access_token',
      value: token,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);

  const page = await context.newPage();

  // 1. Visit Account Page
  console.log("Navigating to Account page...");
  await page.goto('http://127.0.0.1:8000/account');
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('smart_bus_user', JSON.stringify(user));
    localStorage.setItem('smart_bus_token', token);
  }, { user, token });

  // Reload to pick up localStorage and show authenticated account state
  await page.goto('http://127.0.0.1:8000/account');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const profileScreenPath = path.join(screenshotsDir, 'phase_c_profile_screen.png');
  await page.screenshot({ path: profileScreenPath, fullPage: true });
  console.log(`Saved screenshot: ${profileScreenPath}`);

  // 2. Open Add Emergency Contact Form
  const addContactBtn = await page.getByRole('button', { name: /Add/i }).nth(3); // or search for Emergency contacts add button
  const emergencyHeading = await page.locator('text=Emergency contacts');
  if (await emergencyHeading.isVisible()) {
    const addBtn = emergencyHeading.locator('..').locator('..').getByRole('button', { name: /Add/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(400);
      const contactFormPath = path.join(screenshotsDir, 'phase_c_emergency_contact_form.png');
      await page.screenshot({ path: contactFormPath, fullPage: false });
      console.log(`Saved screenshot: ${contactFormPath}`);
    }
  }

  // 3. Visit Activity Page
  console.log("Navigating to Activity / Trips page...");
  await page.goto('http://127.0.0.1:8000/activity');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const activityScreenPath = path.join(screenshotsDir, 'phase_c_activity_trips.png');
  await page.screenshot({ path: activityScreenPath, fullPage: true });
  console.log(`Saved screenshot: ${activityScreenPath}`);

  await browser.close();
  console.log("Phase C visual verification complete!");
}

main().catch(err => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
