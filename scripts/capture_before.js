const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function main() {
  const beforeDir = path.resolve(__dirname, '../docs/before');
  if (!fs.existsSync(beforeDir)) {
    fs.mkdirSync(beforeDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: ['geolocation']
  });

  // Set mock user so screens render without login redirect
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
  console.log('Capturing docs/before/home.png...');
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(beforeDir, 'home.png') });

  // 2. Tracking sheet (click on first bus card or marker)
  console.log('Capturing docs/before/tracking_sheet.png...');
  try {
    const busItem = await page.$('[data-testid="bus-card"], .bus-card, [role="button"]');
    if (busItem) {
      await busItem.click();
      await page.waitForTimeout(1000);
    }
  } catch (e) {}
  await page.screenshot({ path: path.join(beforeDir, 'tracking_sheet.png') });

  // 3. Services (Current blank page state!)
  console.log('Capturing docs/before/services.png...');
  await page.goto('http://localhost:8000/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(beforeDir, 'services.png') });

  // 4. Activity
  console.log('Capturing docs/before/activity.png...');
  await page.goto('http://localhost:8000/activity', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(beforeDir, 'activity.png') });

  // 5. Account
  console.log('Capturing docs/before/account.png...');
  await page.goto('http://localhost:8000/account', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(beforeDir, 'account.png') });

  // 6. Login
  console.log('Capturing docs/before/login.png...');
  const loginContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });
  const loginPage = await loginContext.newPage();
  await loginPage.goto('http://localhost:8000/login', { waitUntil: 'networkidle' });
  await loginPage.waitForTimeout(1500);
  await loginPage.screenshot({ path: path.join(beforeDir, 'login.png') });

  await browser.close();
  console.log('P0.1 Before screenshots captured successfully in docs/before/!');
}

main().catch(err => {
  console.error('Error taking before screenshots:', err);
  process.exit(1);
});
