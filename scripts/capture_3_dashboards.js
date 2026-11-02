const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const outDir = path.join(__dirname, '..', 'docs', 'dashboards');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Passenger Dashboard (Home / Live Tracking & ETA)
  const passengerContext = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page1 = await passengerContext.newPage();
  await page1.addInitScript(() => {
    localStorage.setItem('smart_bus_user', JSON.stringify({
      id: 'usr_pranshu',
      email: 'pranshusharma5136@gmail.com',
      full_name: 'PRANSHU SHARMA',
      role: 'passenger',
      language: 'en'
    }));
    localStorage.setItem('smart_bus_token', 'dev-user-pranshu-passenger');
    localStorage.setItem('smart_bus_cookie_consent', 'accepted');
  });

  console.log("Capturing Passenger Dashboard (http://localhost:8000/)...");
  await page1.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(1500);
  await page1.screenshot({ path: path.join(outDir, '1_passenger_dashboard.png'), fullPage: false });
  console.log("Saved docs/dashboards/1_passenger_dashboard.png");

  // Mobile Passenger App (390x844)
  console.log("Capturing Mobile Passenger App (390x844)...");
  await page1.setViewportSize({ width: 390, height: 844 });
  await page1.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
  await page1.waitForTimeout(1500);
  await page1.screenshot({ path: path.join(outDir, 'passenger_mobile.png'), fullPage: false });
  console.log("Saved docs/dashboards/passenger_mobile.png");

  // 2. Conductor Dashboard (Console with duty & ticketing active)
  console.log("Capturing Conductor Dashboard (http://localhost:8000/conductor)...");
  const conductorContext = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page2 = await conductorContext.newPage();
  await page2.addInitScript(() => {
    localStorage.setItem('smart_bus_cookie_consent', 'accepted');
  });
  await page2.goto('http://localhost:8000/conductor', { waitUntil: 'networkidle' });
  await page2.waitForTimeout(1000);
  const authBtn = await page2.$('button[type="submit"]');
  if (authBtn) {
    await authBtn.click();
    await page2.waitForTimeout(2000);
  }
  await page2.screenshot({ path: path.join(outDir, '2_conductor_dashboard.png'), fullPage: false });
  console.log("Saved docs/dashboards/2_conductor_dashboard.png");

  // 3. Admin Dashboard
  console.log("Capturing Admin Dashboard (http://localhost:8000/admin)...");
  const adminContext = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page3 = await adminContext.newPage();
  await page3.addInitScript(() => {
    localStorage.setItem('smart_bus_cookie_consent', 'accepted');
  });
  await page3.goto('http://localhost:8000/admin', { waitUntil: 'networkidle' });
  await page3.waitForTimeout(1500);
  await page3.screenshot({ path: path.join(outDir, '3_admin_dashboard.png'), fullPage: false });
  console.log("Saved docs/dashboards/3_admin_dashboard.png");

  await browser.close();
  console.log("All dashboards captured successfully!");
})();
