const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function main() {
  const afterDir = path.resolve(__dirname, '../docs/after');
  if (!fs.existsSync(afterDir)) {
    fs.mkdirSync(afterDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: ['geolocation']
  });

  // Set mock user so screens render with proper profile info
  await context.addInitScript(() => {
    localStorage.setItem('smart_bus_user', JSON.stringify({
      id: 'usr_test_commuter',
      email: 'pranshusharma5136@gmail.com',
      full_name: 'Pranshu Sharma',
      role: 'passenger',
      language: 'en'
    }));
    localStorage.setItem('delhi_bus_user', JSON.stringify({
      id: 'usr_test_commuter',
      email: 'pranshusharma5136@gmail.com',
      full_name: 'Pranshu Sharma'
    }));
    localStorage.setItem('delhi_bus_consent', 'accepted');
  });

  const page = await context.newPage();

  // 1. Home
  console.log('Capturing docs/after/home.png...');
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(afterDir, 'home.png') });

  // 2. Tracking sheet
  console.log('Capturing docs/after/tracking_sheet.png...');
  try {
    const liveMapBtn = await page.$('button[aria-label="View live bus tracking map"]');
    if (liveMapBtn) {
      await liveMapBtn.click();
      await page.waitForTimeout(1500);
    }
  } catch (e) {}
  await page.screenshot({ path: path.join(afterDir, 'tracking_sheet.png') });

  // 3. Services (Overhauled from blank page to 13-card catalogue!)
  console.log('Capturing docs/after/services.png...');
  await page.goto('http://localhost:8000/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(afterDir, 'services.png') });

  // 4. Activity
  console.log('Capturing docs/after/activity.png...');
  await page.goto('http://localhost:8000/activity', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(afterDir, 'activity.png') });

  // 5. Account (With 64x64 deterministic avatar and MovingBus footer)
  console.log('Capturing docs/after/account.png...');
  await page.goto('http://localhost:8000/account', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(afterDir, 'account.png') });

  // 6. Login
  console.log('Capturing docs/after/login.png...');
  const loginContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  await loginContext.addInitScript(() => {
    localStorage.setItem('delhi_bus_consent', 'accepted');
  });
  const loginPage = await loginContext.newPage();
  await loginPage.goto('http://localhost:8000/login', { waitUntil: 'networkidle' });
  await loginPage.waitForTimeout(1500);
  await loginPage.screenshot({ path: path.join(afterDir, 'login.png') });

  await browser.close();
  console.log('>>> All 6 after screenshots captured into docs/after/ successfully! <<<');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
