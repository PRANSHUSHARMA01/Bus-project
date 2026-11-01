const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function main() {
  const screenshotsDir = path.resolve(__dirname, '../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();

  // 1. Visit /design-system (Default: Color Tokens & Contrast tab)
  console.log("Navigating to /design-system (Colors & Tokens)...");
  await page.goto('http://127.0.0.1:8000/design-system');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  const colorsPath = path.join(screenshotsDir, 'phase_e_design_system_tokens.png');
  await page.screenshot({ path: colorsPath, fullPage: true });
  console.log(`Saved screenshot: ${colorsPath}`);

  // 2. Click "Transit Icon Library" tab
  console.log("Switching to Transit Icon Library tab...");
  await page.getByRole('button', { name: /Transit Icon Library/i }).click();
  await page.waitForTimeout(500);

  const iconsPath = path.join(screenshotsDir, 'phase_e_design_system_icons.png');
  await page.screenshot({ path: iconsPath, fullPage: true });
  console.log(`Saved screenshot: ${iconsPath}`);

  // 3. Click "Original Vector Artwork" tab
  console.log("Switching to Original Vector Artwork tab...");
  await page.getByRole('button', { name: /Original Vector Artwork/i }).click();
  await page.waitForTimeout(500);

  const artworkPath = path.join(screenshotsDir, 'phase_e_design_system_artwork.png');
  await page.screenshot({ path: artworkPath, fullPage: true });
  console.log(`Saved screenshot: ${artworkPath}`);

  // 4. Visit non-existent corridor to test custom 404 page with mobile viewport
  console.log("Navigating to unknown route to capture custom 404 artwork...");
  const mobileContext = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:8000/corridor/unknown-route-404');
  await mobilePage.waitForLoadState('networkidle');
  await mobilePage.waitForTimeout(600);

  const notFoundPath = path.join(screenshotsDir, 'phase_e_404_not_found.png');
  await mobilePage.screenshot({ path: notFoundPath, fullPage: true });
  console.log(`Saved screenshot: ${notFoundPath}`);

  await browser.close();
  console.log("Phase E visual verification complete!");
}

main().catch(err => {
  console.error("Error capturing Phase E screenshots:", err);
  process.exit(1);
});
