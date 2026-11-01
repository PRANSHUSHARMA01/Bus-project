import { chromium } from "playwright";

async function verifyScreens() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\prans\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  await page.addInitScript(() => {
    localStorage.setItem("smart_bus_user", JSON.stringify({
      id: "pranshu_usr",
      email: "pranshu@example.com",
      full_name: "Pranshu",
      role: "passenger",
      language: "en"
    }));
    localStorage.setItem("smart_bus_token", "dev-user-pranshu_usr-passenger");
    localStorage.setItem("user_selected_stop", "4");
    localStorage.setItem("user_theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
  });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // 1. Capture Homepage
  await page.screenshot({ path: "../screenshots/verified_homepage.png" });
  console.log("Captured ../screenshots/verified_homepage.png");

  // Verify homepage elements
  const recentRows = await page.locator(".recent-card .recent-row").all();
  console.log("Recent rows on homepage count:", recentRows.length);
  for (let i = 0; i < recentRows.length; i++) {
    console.log(`Row ${i + 1}:`, (await recentRows[i].innerText()).replace(/\n/g, " | "));
  }

  // 2. Open Map & Track a Bus
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="View live bus tracking map"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Find a bus marker or arrival card
  const trackBtn = await page.locator("button:has-text('Track')").first();
  if (await trackBtn.isVisible()) {
    console.log("Clicking Track button...");
    await trackBtn.click();
    await page.waitForTimeout(1500);
  } else {
    // Click on bus marker
    const busMarker = await page.locator(".uber-bus-marker").first();
    if (await busMarker.isVisible()) {
      console.log("Clicking bus marker...");
      await busMarker.click();
      await page.waitForTimeout(1500);
    }
  }

  // Check the tracking sheet
  const trackingInfo = await page.evaluate(() => {
    const sheet = document.querySelector(".uber-sheet");
    if (!sheet) return { hasSheet: false };
    const corridorTimeline = sheet.querySelector(".corridor-timeline-container");
    const stopRows = sheet.querySelectorAll(".stop-row-item");
    const liveBusChips = sheet.querySelectorAll(".stop-chip");
    return {
      hasSheet: true,
      hasCorridorTimeline: Boolean(corridorTimeline),
      stopRowsCount: stopRows.length,
      firstStopName: stopRows[0] ? stopRows[0].querySelector(".stop-row-title")?.textContent : null,
      liveBusChipsCount: liveBusChips.length
    };
  });

  console.log("Tracking sheet info:", trackingInfo);

  // Capture tracking view
  await page.screenshot({ path: "../screenshots/verified_tracking_tab.png" });
  console.log("Captured ../screenshots/verified_tracking_tab.png");

  // Scroll sheet down to see the stop rows clearly
  await page.evaluate(() => {
    const sheet = document.querySelector(".uber-sheet");
    if (sheet) sheet.scrollTop = 200;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: "../screenshots/verified_tracking_tab_scrolled.png" });
  console.log("Captured ../screenshots/verified_tracking_tab_scrolled.png");

  await browser.close();
}

verifyScreens();
