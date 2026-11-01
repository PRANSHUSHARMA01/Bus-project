const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function run() {
  const screenshotsDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // 1. Privacy Policy Page (DPDP Act 2023 & GDPR)
  console.log('Capturing phase_h_1_privacy_policy.png...');
  const page1 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page1.goto('http://localhost:8000/privacy', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(1000);
  await page1.screenshot({
    path: path.join(screenshotsDir, 'phase_h_1_privacy_policy.png'),
    fullPage: false,
  });

  // 2. Terms of Service Page (Transit conditions & AIS-140 emergency terms)
  console.log('Capturing phase_h_2_terms_of_service.png...');
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page2.goto('http://localhost:8000/terms', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(1000);
  await page2.screenshot({
    path: path.join(screenshotsDir, 'phase_h_2_terms_of_service.png'),
    fullPage: false,
  });

  // 3. Cookie & Telemetry Consent Banner on Live Home Screen
  console.log('Capturing phase_h_3_cookie_consent_banner.png...');
  const context3 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  // Ensure user is authenticated to stay on map, but consent banner is unconfirmed
  await context3.addInitScript(() => {
    localStorage.removeItem('delhi_bus_consent');
    localStorage.setItem('delhi_bus_user', JSON.stringify({
      id: 'demo_passenger_1',
      email: 'passenger@pranshusharma.tech',
      name: 'Delhi Commuter'
    }));
    localStorage.setItem('auth_token', 'demo_token_header');
  });
  const page3 = await context3.newPage();
  await page3.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  // Wait for CookieBanner delay (1.2s in component)
  await page3.waitForTimeout(2000);
  await page3.screenshot({
    path: path.join(screenshotsDir, 'phase_h_3_cookie_consent_banner.png'),
    fullPage: false,
  });

  // 4. Account Page Data & Privacy Rights
  console.log('Capturing phase_h_4_data_export_workflow.png...');
  const context4 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context4.addInitScript(() => {
    localStorage.setItem('delhi_bus_consent', 'accepted');
    localStorage.setItem('delhi_bus_user', JSON.stringify({
      id: 'demo_passenger_1',
      email: 'passenger@pranshusharma.tech',
      name: 'Delhi Commuter'
    }));
  });
  const page4 = await context4.newPage();
  await page4.goto('http://localhost:8000/account', { waitUntil: 'networkidle' });
  await page4.waitForTimeout(1000);
  // Scroll down to the Data & Privacy section
  await page4.evaluate(() => {
    window.scrollTo({ top: 920, behavior: 'instant' });
  });
  await page4.waitForTimeout(500);
  await page4.screenshot({
    path: path.join(screenshotsDir, 'phase_h_4_data_export_workflow.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('All Phase H screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
