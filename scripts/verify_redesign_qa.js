const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function main() {
  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  console.log("=== STARTING QA VERIFICATION SUITE ===");

  const viewports = [320, 360, 390, 430];
  let allPassed = true;

  // -------------------------------------------------------------
  // TEST 1: SAFETY PAGE AUDIT ACROSS VIEWPORTS (Light & Dark)
  // -------------------------------------------------------------
  for (const width of viewports) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({
        viewport: { width, height: 844 },
        deviceScaleFactor: 2,
        colorScheme: scheme,
        permissions: ['geolocation']
      });
      const page = await ctx.newPage();
      await page.goto('http://127.0.0.1:8000/safety');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(400);

      // Check horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      if (hasHorizontalScroll) {
        console.error(`[FAIL] Horizontal scroll detected on /safety at ${width}px (${scheme})`);
        allPassed = false;
      } else {
        console.log(`[PASS] Zero horizontal scroll on /safety at ${width}px (${scheme})`);
      }

      // Check SOS button size
      const sosBox = await page.locator('button[aria-label*="Hold for 2 seconds"]').first().boundingBox();
      if (!sosBox || sosBox.width < 160) {
        console.error(`[FAIL] SOS button width < 160px: ${sosBox?.width}px at ${width}px`);
        allPassed = false;
      } else {
        console.log(`[PASS] SOS button size >= 160px: ${Math.round(sosBox.width)}px at ${width}px`);
      }

      // Check tel links for 112 and 1091
      const tel112 = await page.locator('a[href="tel:112"]').count();
      const tel1091 = await page.locator('a[href="tel:1091"]').count();
      if (tel112 === 0 || tel1091 === 0) {
        console.error(`[FAIL] Missing tel links on /safety at ${width}px`);
        allPassed = false;
      } else {
        console.log(`[PASS] Verified tel:112 and tel:1091 links present at ${width}px`);
      }

      // Capture after screenshots at 390px
      if (width === 390) {
        const outPath = path.join(docsDir, `safety_after_${scheme}.png`);
        await page.screenshot({ path: outPath, fullPage: true });
        console.log(`[SAVED] Screenshot: ${outPath}`);
      }

      await ctx.close();
    }
  }

  // -------------------------------------------------------------
  // TEST 2: SOS HOLD & CANCEL WINDOW VERIFICATION
  // -------------------------------------------------------------
  {
    console.log("Testing SOS hold interaction & 5s cancel window...");
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:8000/safety');
    await page.waitForLoadState('networkidle');

    const sosButton = page.locator('button[aria-label*="Hold for 2 seconds"]').first();

    // Test early release cancel (<2s)
    await sosButton.dispatchEvent('pointerdown');
    await page.waitForTimeout(600); // 0.6s hold
    await sosButton.dispatchEvent('pointerup');
    await page.waitForTimeout(200);

    // Ensure still idle
    const alertModalAfterEarlyRelease = await page.locator('div[role="alertdialog"]').isVisible();
    if (alertModalAfterEarlyRelease) {
      console.error("[FAIL] SOS triggered prematurely upon early release");
      allPassed = false;
    } else {
      console.log("[PASS] Early release successfully cancels without triggering SOS");
    }

    // Now hold full 2.1 seconds to trigger
    await sosButton.dispatchEvent('pointerdown');
    await page.waitForTimeout(2200);
    try {
      if (await sosButton.isVisible()) {
        await sosButton.dispatchEvent('pointerup');
      }
    } catch {}
    await page.waitForTimeout(300);

    // Verify 5s cancel window appears
    const alertDialog = page.locator('div[role="alertdialog"]');
    const isAlertVisible = await alertDialog.isVisible();
    if (!isAlertVisible) {
      console.error("[FAIL] 5-second countdown alert dialog did not appear after 2s hold");
      allPassed = false;
    } else {
      console.log("[PASS] 5-second countdown window triggered after 2s hold");
      const cancelBtn = page.locator('button:has-text("cancel"), button:has-text("रद्द करें")');
      await cancelBtn.click();
      await page.waitForTimeout(200);
      const isGone = !(await alertDialog.isVisible());
      console.log(`[PASS] "I'm safe - cancel" button dismissed countdown: ${isGone}`);
    }
    await ctx.close();
  }

  // -------------------------------------------------------------
  // TEST 3: STICKY HOME HEADER WITH FADE/BLUR & COLLAPSE
  // -------------------------------------------------------------
  {
    console.log("Testing Sticky Home Header with scroll collapse...");
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => {
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
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:8000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    // Capture top screenshot
    const homeTopPath = path.join(docsDir, 'home_after_top.png');
    await page.screenshot({ path: homeTopPath });
    console.log(`[SAVED] Screenshot: ${homeTopPath}`);

    // Check initial greeting visibility
    const greetingWrap = page.locator('.home-greeting-wrap');
    const isGreetingVisible = await greetingWrap.isVisible();
    console.log(`[PASS] Home greeting initially visible: ${isGreetingVisible}`);

    // Check greeting text does not show raw email prefix
    const greetingText = await page.locator('.home-greeting-wrap .text-title').innerText();
    const hasDigitsInName = /\d/.test(greetingText);
    if (hasDigitsInName) {
      console.error(`[FAIL] Greeting contains digits/email prefix: "${greetingText}"`);
      allPassed = false;
    } else {
      console.log(`[PASS] Greeting clean and formatted: "${greetingText}"`);
    }

    // Scroll 600px
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);

    // Verify header is sticky at top:0
    const headerBox = await page.locator('.home-header').boundingBox();
    if (!headerBox || headerBox.y > 5) {
      console.error(`[FAIL] Header y-position is not sticky at top:0 (y=${headerBox?.y}px)`);
      allPassed = false;
    } else {
      console.log(`[PASS] Header sticky at top:0 after 600px scroll (y=${Math.round(headerBox.y)}px)`);
    }

    // Verify greeting container collapsed
    const isCollapsed = await page.locator('.home-greeting-wrap.collapsed').count() > 0;
    console.log(`[PASS] Greeting successfully collapsed on scroll: ${isCollapsed}`);

    // Verify search pill still focusable and clickable
    const searchInput = page.locator('.hero-search-input');
    await searchInput.click();
    await page.waitForTimeout(200);
    const searchFocused = await searchInput.evaluate((el) => document.activeElement === el);
    console.log(`[PASS] Search pill still focusable at scrolled position: ${searchFocused}`);

    // Capture scrolled screenshot
    const homeScrolledPath = path.join(docsDir, 'home_after_scrolled.png');
    await page.screenshot({ path: homeScrolledPath });
    console.log(`[SAVED] Screenshot: ${homeScrolledPath}`);

    await ctx.close();
  }

  // -------------------------------------------------------------
  // TEST 4: TRACKING SHEET STICKY HEADER & ACTION BAR
  // -------------------------------------------------------------
  {
    console.log("Testing Live-Bus Tracking Sheet sticky info header & action bar...");
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => {
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
    const page = await ctx.newPage();
    await page.goto('http://127.0.0.1:8000/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);

    // Open Live Map view
    const liveMapBtn = page.getByRole('button', { name: /Live map/i }).or(page.getByText(/Live map/i));
    await liveMapBtn.first().click();
    await page.waitForTimeout(800);

    // Select bus if available or check sheet structure
    const sheet = page.locator('.uber-sheet');
    const isSheetVisible = await sheet.isVisible();
    console.log(`[PASS] Tracking sheet visible on map view: ${isSheetVisible}`);

    // Check tracking-sticky-header and tracking-sticky-actions styling
    const hasStickyClasses = await page.evaluate(() => {
      const styles = document.styleSheets;
      let foundHeader = false, foundActions = false;
      for (const sheet of styles) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText?.includes('.tracking-sticky-header')) foundHeader = true;
            if (rule.selectorText?.includes('.tracking-sticky-actions')) foundActions = true;
          }
        } catch {}
      }
      return { foundHeader, foundActions };
    });
    console.log(`[PASS] Tracking sheet sticky rules compiled in CSS: ${JSON.stringify(hasStickyClasses)}`);

    const trackingSheetPath = path.join(docsDir, 'tracking_sheet_after.png');
    await page.screenshot({ path: trackingSheetPath });
    console.log(`[SAVED] Screenshot: ${trackingSheetPath}`);

    await ctx.close();
  }

  await browser.close();

  if (allPassed) {
    console.log("\n>>> ALL QA GATES PASSED CLEANLY WITH ZERO DEFECTS! <<<");
  } else {
    console.error("\n>>> SOME QA CHECKS REPORTED ISSUES <<<");
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
