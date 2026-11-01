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
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('Navigating to http://localhost:8000/services...');
  await page.goto('http://localhost:8000/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'step3_services_grid.png') });
  console.log('Saved docs/step3_services_grid.png');

  // Verify all 13 cards
  const cardElements = await page.$$('[data-testid="services-grid"] button');
  console.log(`Found ${cardElements.length} service cards in grid.`);

  if (cardElements.length !== 13) {
    throw new Error(`Expected 13 cards, found ${cardElements.length}`);
  }

  for (let i = 0; i < cardElements.length; i++) {
    // Re-navigate to services page to ensure clean state
    await page.goto('http://localhost:8000/services', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const cards = await page.$$('[data-testid="services-grid"] button');
    const card = cards[i];
    const cardTitle = await card.$eval('h2', (el) => el.innerText);
    console.log(`[Testing Card ${i + 1}/13]: "${cardTitle}"...`);

    await card.click();
    await page.waitForTimeout(600);

    const currentUrl = page.url();
    console.log(` -> Landed on URL: ${currentUrl}`);

    if (currentUrl === 'http://localhost:8000/' || currentUrl.endsWith(':8000/')) {
      throw new Error(`FAIL: Card "${cardTitle}" navigated to home root '/'!`);
    }

    const h1Count = await page.$$eval('h1', (els) => els.length);
    if (h1Count === 0) {
      throw new Error(`FAIL: Page at ${currentUrl} has no <h1>!`);
    }
    const h1Text = await page.$eval('h1', (el) => el.innerText);

    // Verify >= 1 content block
    const contentBlocks = await page.$$('div[style*="border-radius: 20px"], div[style*="border-radius: 24px"], div[style*="borderRadius: 20px"]');
    if (contentBlocks.length === 0) {
      throw new Error(`FAIL: Page at ${currentUrl} has no content block!`);
    }

    console.log(` -> PASS: <h1>: "${h1Text}", URL: ${currentUrl}, Content blocks: ${contentBlocks.length}`);

    // Verify back button returns to /services
    const backBtn = await page.$('button[aria-label="Back to Services"]');
    if (backBtn) {
      await backBtn.click();
      await page.waitForTimeout(400);
      if (!page.url().includes('/services')) {
        throw new Error(`FAIL: Back button at ${currentUrl} did not return to /services!`);
      }
    }
  }

  console.log('All 13 cards passed QA gate: non-home URLs, <h1>, content blocks, back buttons!');
  await browser.close();
})();
