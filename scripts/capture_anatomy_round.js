const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
const fs = require('fs');

async function main() {
  const roundName = process.argv[2] || 'round1';
  const outDir = path.resolve(__dirname, '../docs/anatomy-rounds');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // 1. 360x300 Light
  const ctx360Light = await browser.newContext({ viewport: { width: 360, height: 420 }, deviceScaleFactor: 2 });
  await ctx360Light.addInitScript(() => localStorage.setItem('delhi_bus_consent', 'accepted'));
  const p1 = await ctx360Light.newPage();
  await p1.goto('http://localhost:8000/anatomy-test?theme=light', { waitUntil: 'networkidle' });
  await p1.waitForTimeout(1000);
  const el1 = await p1.$('#bus-harness');
  if (el1) await el1.screenshot({ path: path.join(outDir, `${roundName}-360-light.png`) });
  await ctx360Light.close();

  // 2. 360x300 Dark
  const ctx360Dark = await browser.newContext({ viewport: { width: 360, height: 420 }, deviceScaleFactor: 2 });
  await ctx360Dark.addInitScript(() => localStorage.setItem('delhi_bus_consent', 'accepted'));
  const p2 = await ctx360Dark.newPage();
  await p2.goto('http://localhost:8000/anatomy-test?theme=dark', { waitUntil: 'networkidle' });
  await p2.waitForTimeout(1000);
  const el2 = await p2.$('#bus-harness');
  if (el2) await el2.screenshot({ path: path.join(outDir, `${roundName}-360-dark.png`) });
  await ctx360Dark.close();

  // 3. 720x600 Light
  const ctx720Light = await browser.newContext({ viewport: { width: 720, height: 720 }, deviceScaleFactor: 2 });
  await ctx720Light.addInitScript(() => localStorage.setItem('delhi_bus_consent', 'accepted'));
  const p3 = await ctx720Light.newPage();
  await p3.goto('http://localhost:8000/anatomy-test?theme=light', { waitUntil: 'networkidle' });
  await p3.waitForTimeout(1000);
  const el3 = await p3.$('#bus-harness');
  if (el3) await el3.screenshot({ path: path.join(outDir, `${roundName}-720-light.png`) });
  await ctx720Light.close();

  // 4. 720x600 Dark
  const ctx720Dark = await browser.newContext({ viewport: { width: 720, height: 720 }, deviceScaleFactor: 2 });
  await ctx720Dark.addInitScript(() => localStorage.setItem('delhi_bus_consent', 'accepted'));
  const p4 = await ctx720Dark.newPage();
  await p4.goto('http://localhost:8000/anatomy-test?theme=dark', { waitUntil: 'networkidle' });
  await p4.waitForTimeout(1000);
  const el4 = await p4.$('#bus-harness');
  if (el4) await el4.screenshot({ path: path.join(outDir, `${roundName}-720-dark.png`) });
  await ctx720Dark.close();

  await browser.close();
  console.log(`>>> Captured ${roundName} screenshots at 360 and 720 in light & dark! <<<`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
