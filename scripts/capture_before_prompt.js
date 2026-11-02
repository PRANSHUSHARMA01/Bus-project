const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function main() {
  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  
  // 1. Safety page Light Mode (390px mobile)
  const ctxLight = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
    permissions: ['geolocation']
  });
  const pageLight = await ctxLight.newPage();
  await pageLight.goto('http://127.0.0.1:8000/safety');
  await pageLight.waitForLoadState('networkidle');
  await pageLight.waitForTimeout(500);
  await pageLight.screenshot({ path: path.join(docsDir, 'safety_before_light.png'), fullPage: true });

  // 2. Safety page Dark Mode (390px mobile)
  const ctxDark = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    permissions: ['geolocation']
  });
  const pageDark = await ctxDark.newPage();
  await pageDark.goto('http://127.0.0.1:8000/safety');
  await pageDark.waitForLoadState('networkidle');
  await pageDark.waitForTimeout(500);
  await pageDark.screenshot({ path: path.join(docsDir, 'safety_before_dark.png'), fullPage: true });

  // 3. Home page top (390px)
  const pageHome = await ctxLight.newPage();
  await pageHome.goto('http://127.0.0.1:8000/');
  await pageHome.waitForLoadState('networkidle');
  await pageHome.waitForTimeout(600);
  await pageHome.screenshot({ path: path.join(docsDir, 'home_before_top.png') });

  // 4. Home page scrolled (390px)
  await pageHome.evaluate(() => window.scrollBy(0, 400));
  await pageHome.waitForTimeout(400);
  await pageHome.screenshot({ path: path.join(docsDir, 'home_before_scrolled.png') });

  await browser.close();
  console.log("Before screenshots successfully captured in docs/");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
