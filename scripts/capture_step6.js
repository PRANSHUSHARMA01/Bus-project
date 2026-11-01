const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    permissions: ['geolocation']
  });

  await context.addInitScript(() => {
    localStorage.setItem('smart_bus_user', JSON.stringify({
      id: 'usr_test_commuter',
      email: 'pranshusharma5136@gmail.com',
      full_name: 'PRANSHU SHARMA',
      role: 'passenger',
      language: 'en'
    }));
    localStorage.setItem('delhi_bus_user', JSON.stringify({
      id: 'usr_test_commuter',
      email: 'pranshusharma5136@gmail.com',
      full_name: 'PRANSHU SHARMA'
    }));
    localStorage.setItem('delhi_bus_consent', 'accepted');
    localStorage.setItem('smart_bus_theme', 'light');
    localStorage.setItem('delhi_bus_theme', 'light');
  });

  const page = await context.newPage();
  console.log('Navigating to http://localhost:8000/account...');
  await page.goto('http://localhost:8000/account', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const lightOutPath = path.join(__dirname, '..', 'docs', 'step6_account_light.png');
  await page.screenshot({ path: lightOutPath });
  console.log(`Saved screenshot to docs/step6_account_light.png`);

  // Open Appearance sheet
  console.log('Opening Appearance sheet...');
  await page.click('button:has-text("Appearance")');
  await page.waitForTimeout(600);

  // Click Dark mode
  console.log('Switching to Dark mode...');
  await page.click('button:has-text("Dark mode")');
  await page.waitForTimeout(600);

  // Click Done
  await page.click('button:has-text("Done")');
  await page.waitForTimeout(600);

  const darkOutPath = path.join(__dirname, '..', 'docs', 'step6_account_dark.png');
  await page.screenshot({ path: darkOutPath });
  console.log(`Saved screenshot to docs/step6_account_dark.png`);

  await browser.close();
})();
