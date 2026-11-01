const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

const stepName = process.argv[2] || 'step_screenshot';
const targetUrl = process.argv[3] || 'http://localhost:8000/';

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
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const outPath = path.join(__dirname, '..', 'docs', `${stepName}.png`);
  await page.screenshot({ path: outPath });
  await browser.close();
  console.log(`Saved screenshot to docs/${stepName}.png`);
})();
