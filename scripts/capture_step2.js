const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const w of [320, 360, 390]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 750 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => {
      localStorage.setItem('delhi_bus_consent', 'accepted');
    });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8000/anatomy-test?theme=light', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(__dirname, '..', 'docs', `step2_anatomy_${w}.png`) });
  }
  await browser.close();
  console.log('Saved step2 screenshots!');
})();
