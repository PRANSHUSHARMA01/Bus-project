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
  await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll down 180px so content slides smoothly under the sticky search pill
  await page.evaluate(() => {
    window.scrollBy({ top: 180, behavior: 'instant' });
  });
  await page.waitForTimeout(600);

  const outPath = path.join(__dirname, '..', 'docs', 'step5_scroll_fade.png');
  await page.screenshot({ path: outPath });
  console.log(`Saved screenshot to docs/step5_scroll_fade.png`);
  await browser.close();
})();
