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

  const viewports = [
    { width: 360, height: 780, name: "360" },
    { width: 390, height: 844, name: "390" },
    { width: 430, height: 932, name: "430" },
  ];

  let testReport = [];

  for (const vp of viewports) {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

      await page.addInitScript(({ th }) => {
        localStorage.setItem("smart_bus_user", JSON.stringify({
          id: "pranshu_usr",
          email: "pranshu@example.com",
          full_name: "Pranshu",
          role: "passenger",
          language: "en"
        }));
        localStorage.setItem("smart_bus_token", "dev-user-pranshu_usr-passenger");
        localStorage.setItem("user_selected_stop", "4");
        localStorage.setItem("user_theme", th);
        document.documentElement.setAttribute("data-theme", th);
      }, { th: theme });

      await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      await page.waitForSelector(".stop-row", { timeout: 10000 });

      // Verification measurements
      const metrics = await page.evaluate(() => {
        const rows = document.querySelectorAll(".stop-row");
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const hasHorizontalOverflow = docWidth > winWidth;

        let nodeCenterDiffs = [];
        let etaBaselineDiffs = [];
        let heights = [];

        rows.forEach((row, i) => {
          const rRect = row.getBoundingClientRect();
          heights.push(Math.round(rRect.height));

          const node = row.querySelector(".stop-node");
          const title = row.querySelector(".stop-row-title");
          const etaVal = row.querySelector(".stop-row-eta-val");

          if (node && title) {
            const nRect = node.getBoundingClientRect();
            const tRect = title.getBoundingClientRect();
            // First line center in 1rem/1.4 text box = top + 11.2px
            const firstLineCenter = tRect.top + 11.2;
            const nodeCenter = nRect.top + nRect.height / 2;
            nodeCenterDiffs.push(Math.abs(nodeCenter - firstLineCenter));
          }

          if (etaVal && title) {
            const eRect = etaVal.getBoundingClientRect();
            const tRect = title.getBoundingClientRect();
            // Baseline of title text
            const titleBaseline = tRect.top + 16.0;
            // Baseline of ETA text
            const etaBaseline = eRect.top + 17.0;
            etaBaselineDiffs.push(Math.abs(etaBaseline - titleBaseline));
          }
        });

        return {
          rowCount: rows.length,
          minHeight: Math.min(...heights),
          maxHeight: Math.max(...heights),
          maxNodeDiff: nodeCenterDiffs.length ? Math.round(Math.max(...nodeCenterDiffs) * 10) / 10 : 0,
          maxEtaDiff: etaBaselineDiffs.length ? Math.round(Math.max(...etaBaselineDiffs) * 10) / 10 : 0,
          hasHorizontalOverflow,
          docWidth,
          winWidth
        };
      });

      testReport.push({ viewport: `${vp.name}px`, theme, ...metrics });

      // Save screenshot
      const shotPath = path.join(outDir, `after_stoprow_${vp.name}_${theme}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot: ${shotPath}`, metrics);

      // In 390px light, click row 1 to expand the panel and capture
      if (vp.name === "390" && theme === "light") {
        const rowToExpand = page.locator(".stop-row").nth(0);
        await rowToExpand.click();
        await page.waitForTimeout(400);
        const expPath = path.join(outDir, `after_stoprow_390_expanded.png`);
        await page.screenshot({ path: expPath });
        console.log(`Saved expanded screenshot: ${expPath}`);
      }

      await page.close();
    }
  }

  await browser.close();
  console.log("\n--- Verification Summary Report ---");
  console.table(testReport);
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
