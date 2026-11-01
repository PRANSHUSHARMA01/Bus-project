const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

async function testServices() {
  console.log('--- RUNNING SERVICES PAGE AUTOMATED TEST ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2
  });

  await context.addInitScript(() => {
    localStorage.setItem('delhi_bus_consent', 'accepted');
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Open /services
  await page.goto('http://localhost:8000/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 2. Expect >= 9 visible cards
  const cards = await page.$$('[data-testid="services-grid"] button');
  console.log(`Visible service cards detected: ${cards.length}`);
  if (cards.length < 9) {
    throw new Error(`Expected at least 9 visible cards, found ${cards.length}`);
  }

  // 3. Click each card and verify a non-empty screen opens
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const title = await card.$eval('h3', el => el.textContent?.trim() || '');
    console.log(`Testing card ${i + 1}/${cards.length}: "${title}"`);

    // Click card
    await card.click();
    await page.waitForTimeout(400);

    // Check if sheet opened or navigation occurred
    const sheetTitle = await page.$eval('[role="dialog"] h2, h1', el => el.textContent?.trim() || '').catch(() => '');
    if (!sheetTitle) {
      throw new Error(`Card "${title}" failed to open a valid detailed screen or modal`);
    }

    // Close sheet cleanly using Escape or aria-label="Close dialog"
    const closeBtn = await page.$('button[aria-label="Close dialog"]');
    if (closeBtn) {
      await closeBtn.click().catch(() => {});
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(200);
  }

  // Check console errors
  if (consoleErrors.length > 0) {
    console.warn(`Encountered ${consoleErrors.length} console warnings/errors:`, consoleErrors);
  }

  await browser.close();
  console.log('>>> SERVICES AUTOMATED TEST PASSED: ALL CARDS ACTIVE & INTERACTIVE! <<<');
}

testServices().catch(err => {
  console.error('FAILED SERVICES TEST:', err);
  process.exit(1);
});
