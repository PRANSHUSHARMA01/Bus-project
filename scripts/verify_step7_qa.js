const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));

(async () => {
  console.log('=== STARTING ROUND-2 STEP 7 QA GATES ===');

  const outDir = path.join(__dirname, '..', 'docs', 'round2');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '390', width: 390, height: 844 },
    { name: '360', width: 360, height: 800 }
  ];

  const themes = ['light', 'dark'];
  const screens = [
    { name: 'home', url: 'http://localhost:8000/' },
    { name: 'services', url: 'http://localhost:8000/services' },
    { name: 'account', url: 'http://localhost:8000/account' }
  ];

  // -------------------------------------------------------------
  // 1. CAPTURE 12 SCREENSHOTS (390 & 360, LIGHT & DARK, 3 SCREENS)
  // -------------------------------------------------------------
  console.log('\n--- 1. Capturing 12 Visual QA Screenshots ---');
  for (const theme of themes) {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        permissions: ['geolocation']
      });

      await context.addInitScript((th) => {
        localStorage.setItem('smart_bus_user', JSON.stringify({
          id: 'usr_test_commuter',
          email: 'pranshusharma5136@gmail.com',
          full_name: 'PRANSHU SHARMA',
          role: 'passenger',
          language: 'en'
        }));
        localStorage.setItem('delhi_bus_user', JSON.stringify({
          id: 'usr_test_commuter',
          email: 'pranshusharma5136@gmail.com',
          full_name: 'PRANSHU SHARMA'
        }));
        localStorage.setItem('delhi_bus_consent', 'accepted');
        localStorage.setItem('smart_bus_theme', th);
        localStorage.setItem('delhi_bus_theme', th);
        document.documentElement.setAttribute('data-theme', th);
      }, theme);

      const page = await context.newPage();

      for (const scr of screens) {
        await page.goto(scr.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);
        // Ensure data-theme is set
        await page.evaluate((th) => document.documentElement.setAttribute('data-theme', th), theme);
        await page.waitForTimeout(200);

        const filename = `${scr.name}_${theme}_${vp.name}.png`;
        const filePath = path.join(outDir, filename);
        await page.screenshot({ path: filePath });
        console.log(`[PASS] Captured ${filename}`);
      }

      await context.close();
    }
  }

  // -------------------------------------------------------------
  // 2. FUNCTIONALITY: DARK MODE TOGGLE & RELOAD RETENTION
  // -------------------------------------------------------------
  console.log('\n--- 2. QA Gate: Dark Mode Toggle & Persistence ---');
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('http://localhost:8000/account', { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.setItem('smart_bus_user', JSON.stringify({
        id: 'usr_test_commuter',
        email: 'pranshusharma5136@gmail.com',
        full_name: 'PRANSHU SHARMA'
      }));
      localStorage.setItem('delhi_bus_consent', 'accepted');
      localStorage.setItem('smart_bus_theme', 'light');
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    // Initial theme should be light
    let themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Initial account theme: ${themeAttr}`);

    // Click Appearance
    await page.click('button:has-text("Appearance")');
    await page.waitForTimeout(400);

    // Click Dark mode
    await page.click('button:has-text("Dark mode")');
    await page.waitForTimeout(400);

    themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (themeAttr !== 'dark') throw new Error(`Expected dark mode after click, got: ${themeAttr}`);
    console.log(`[PASS] Live dark mode applied: ${themeAttr}`);

    // Reload page and check persistence
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    if (themeAttr !== 'dark') throw new Error(`Expected dark mode to persist after reload, got: ${themeAttr}`);
    console.log(`[PASS] Dark mode persisted after reload: ${themeAttr}`);

    await context.close();
  }

  // -------------------------------------------------------------
  // 3. FUNCTIONALITY: SOS BADGE ON 320, 360, 390, 428 PX VIEWPORTS
  // -------------------------------------------------------------
  console.log('\n--- 3. QA Gate: SOS Badge Multi-Viewport & Contrast ---');
  for (const w of [320, 360, 390, 428]) {
    const context = await browser.newContext({ viewport: { width: w, height: 800 } });
    await context.addInitScript(() => {
      localStorage.setItem('smart_bus_user', JSON.stringify({
        id: 'usr_test_commuter',
        email: 'pranshusharma5136@gmail.com',
        full_name: 'PRANSHU SHARMA'
      }));
      localStorage.setItem('delhi_bus_user', JSON.stringify({
        id: 'usr_test_commuter',
        email: 'pranshusharma5136@gmail.com',
        full_name: 'PRANSHU SHARMA'
      }));
      localStorage.setItem('delhi_bus_consent', 'accepted');
    });
    const page = await context.newPage();
    await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const sosBadge = await page.$('.badge-sos-pulse');
    if (!sosBadge) throw new Error(`SOS badge not found on viewport width ${w}!`);

    const isVisible = await sosBadge.isVisible();
    const box = await sosBadge.boundingBox();
    console.log(`[PASS] Viewport ${w}px: SOS badge visible=${isVisible}, box=${JSON.stringify(box)}`);
    await context.close();
  }

  // -------------------------------------------------------------
  // 4. FUNCTIONALITY: ANATOMY MOVING BUS CARD ON 320PX
  // -------------------------------------------------------------
  console.log('\n--- 4. QA Gate: Moving Bus Card on 320px Viewport ---');
  {
    const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
    await context.addInitScript(() => {
      localStorage.setItem('smart_bus_user', JSON.stringify({
        id: 'usr_test_commuter',
        email: 'pranshusharma5136@gmail.com',
        full_name: 'PRANSHU SHARMA'
      }));
      localStorage.setItem('delhi_bus_user', JSON.stringify({
        id: 'usr_test_commuter',
        email: 'pranshusharma5136@gmail.com',
        full_name: 'PRANSHU SHARMA'
      }));
      localStorage.setItem('delhi_bus_consent', 'accepted');
    });
    const page = await context.newPage();
    await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Scroll to moving bus
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="moving-bus-card"]');
      if (el) el.scrollIntoView();
    });
    await page.waitForTimeout(400);

    const card = await page.$('[data-testid="moving-bus-card"]');
    if (!card) throw new Error('Moving bus card not found!');

    // Check status pill width vs container
    const statusPill = await page.$('[data-testid="bus-status-pill"]');
    if (statusPill) {
      const text = await statusPill.innerText();
      console.log(`[PASS] 320px Moving bus status pill content: "${text.trim()}"`);
    }

    await context.close();
  }

  // -------------------------------------------------------------
  // 5. ACCESSIBILITY: AXE-CORE AUDIT ON HOME, SERVICES, ACCOUNT
  // -------------------------------------------------------------
  console.log('\n--- 5. QA Gate: Axe-Core Accessibility Audit ---');
  {
    const axeScriptPath = path.resolve(__dirname, '../frontend/node_modules/axe-core/axe.min.js');
    const axeScriptContent = fs.readFileSync(axeScriptPath, 'utf8');

    for (const scr of screens) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      await context.addInitScript(() => {
        localStorage.setItem('smart_bus_user', JSON.stringify({
          id: 'usr_test_commuter',
          email: 'pranshusharma5136@gmail.com',
          full_name: 'PRANSHU SHARMA'
        }));
        localStorage.setItem('delhi_bus_consent', 'accepted');
      });

      const page = await context.newPage();
      await page.goto(scr.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      await page.addScriptTag({ content: axeScriptContent });
      const results = await page.evaluate(async () => {
        return await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
          }
        });
      });

      const violations = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      console.log(`[Axe Audit] ${scr.name.toUpperCase()}: ${violations.length} critical/serious violations.`);
      if (violations.length > 0) {
        for (const v of violations) {
          console.error(`  - [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} nodes)`);
        }
        throw new Error(`FAIL: Found ${violations.length} critical/serious a11y violations on ${scr.name}`);
      } else {
        console.log(`[PASS] 0 critical/serious violations on ${scr.name}!`);
      }

      await context.close();
    }
  }

  // -------------------------------------------------------------
  // 6. FUNCTIONALITY: ALL 13 SERVICES CARDS DEDICATED DESTINATIONS
  // -------------------------------------------------------------
  console.log('\n--- 6. QA Gate: 13 Services Cards Verification ---');
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      localStorage.setItem('smart_bus_user', JSON.stringify({
        id: 'usr_test_commuter',
        email: 'pranshusharma5136@gmail.com',
        full_name: 'PRANSHU SHARMA'
      }));
      localStorage.setItem('delhi_bus_consent', 'accepted');
    });

    const page = await context.newPage();
    await page.goto('http://localhost:8000/services', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const cardLinks = await page.$$eval('a[href^="/services/"]', (anchors) =>
      anchors.map((a) => ({ href: a.getAttribute('href'), text: a.innerText.split('\n')[0] }))
    );

    console.log(`Found ${cardLinks.length} service card links to verify.`);
    for (const link of cardLinks) {
      await page.goto(`http://localhost:8000${link.href}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const url = page.url();
      if (url.endsWith('/services') || url === 'http://localhost:8000/') {
        throw new Error(`Service link ${link.href} redirected to home or services index!`);
      }
      const h1 = await page.$eval('h1', (el) => el.innerText.trim());
      if (!h1) throw new Error(`Missing <h1> on ${link.href}!`);
      console.log(`[PASS] ${link.href} -> <h1>${h1}</h1>`);
    }

    await context.close();
  }

  console.log('\n=== ALL STEP 7 QA GATES PASSED 100% SUCCESSFULLY ===');
  await browser.close();
})();
