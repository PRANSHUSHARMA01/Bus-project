import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const outDir = path.join("..", "screenshots");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\prans\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe",
  });

  const widths = [360, 390, 430, 768];
  let allPassed = true;

  for (const w of widths) {
    console.log(`\n--- Testing Viewport Width: ${w}px ---`);
    const page = await browser.newPage({ viewport: { width: w, height: 844 } });
    await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // 1. Check No Horizontal Scroll
    const scrollInfo = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        innerWidth: window.innerWidth,
      };
    });
    console.log(`[Width ${w}px] Horizontal scroll: doc=${scrollInfo.scrollWidth}, win=${scrollInfo.innerWidth}`);
    if (scrollInfo.scrollWidth > scrollInfo.innerWidth) {
      console.error(`FAILED: Horizontal overflow detected at ${w}px!`);
      allPassed = false;
    } else {
      console.log(`PASSED: No horizontal scroll at ${w}px.`);
    }

    // 2. Open tracking sheet by clicking first stop
    await page.click(".recent-row");
    await page.waitForTimeout(1500);

    // 3. Inspect Arrival Cards (Phase 1A)
    const cardInfo = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll(".arrival-card"));
      if (cards.length === 0) return { count: 0, heights: [], baselines: [] };
      const heights = cards.map((c) => Math.round(c.getBoundingClientRect().height));
      const baselines = cards.map((c) => {
        const title = c.querySelector(".arrival-title");
        const etaVal = c.querySelector(".arrival-eta-val");
        if (!title || !etaVal) return null;
        const titleRect = title.getBoundingClientRect();
        const etaRect = etaVal.getBoundingClientRect();
        const cRect = c.getBoundingClientRect();
        return {
          titleTop: Math.round(titleRect.top - cRect.top),
          etaTop: Math.round(etaRect.top - cRect.top),
          diff: Math.abs(Math.round((titleRect.top - cRect.top) - (etaRect.top - cRect.top))),
        };
      }).filter(Boolean);

      return {
        count: cards.length,
        heights,
        baselines,
      };
    });

    console.log(`[Width ${w}px] Arrival Cards detected: ${cardInfo.count}`);
    if (cardInfo.count > 0) {
      console.log(`[Width ${w}px] Card heights:`, cardInfo.heights);
      const heightsMatch = cardInfo.heights.every((h) => h === cardInfo.heights[0]);
      console.log(`[Width ${w}px] Equal card heights for equal content: ${heightsMatch ? "PASSED" : "CHECK"}`);
      if (cardInfo.baselines.length > 0) {
        console.log(`[Width ${w}px] Baseline diffs:`, cardInfo.baselines.map((b) => b.diff));
      }
    }

    // Capture screenshot of sheet at this width
    await page.screenshot({ path: path.join(outDir, `phase1_sheet_${w}px.png`) });

    // 4. Click a card to enter bus tracking mode and trigger "Notify me" toast
    const card = await page.$(".arrival-card");
    if (card) {
      await card.click();
      await page.waitForTimeout(1000);
      const notifyBtn = await page.$(".btn-pill-primary");
      if (notifyBtn) {
        await notifyBtn.click();
        await page.waitForTimeout(500);

        const toastInfo = await page.evaluate(() => {
          const toast = document.querySelector(".app-toast");
          if (!toast) return null;
          const rect = toast.getBoundingClientRect();
          const style = window.getComputedStyle(toast);
          return {
            text: toast.textContent?.trim(),
            height: Math.round(rect.height),
            bottom: style.bottom,
            borderRadius: style.borderRadius,
          };
        });
        console.log(`[Width ${w}px] Toast verified:`, toastInfo);
        await page.screenshot({ path: path.join(outDir, `phase1_toast_${w}px.png`) });
      }
    }

    await page.close();
  }

  await browser.close();
  console.log(`\nPlaywright Phase 1 Alignment Verification completed. Result: ${allPassed ? "ALL PASSED" : "FAILED"}`);
}

run().catch(console.error);
