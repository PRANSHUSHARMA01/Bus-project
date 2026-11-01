import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Users\\prans\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe",
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
  page.on("console", (msg) => console.log("CONSOLE:", msg.text()));

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
  });

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click View Live Bus Map
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="View live bus tracking map"]');
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Wait for arrival card
  const arrCard = await page.locator(".arrival-card").first();
  if (await arrCard.isVisible()) {
    console.log("Arrival card text:", await arrCard.innerText());
    await arrCard.click();
    await page.waitForTimeout(1500);
  }

  // Check state inside uber-sheet
  const sheetInfo = await page.evaluate(() => {
    const sheet = document.querySelector(".uber-sheet");
    if (!sheet) return "No uber-sheet";
    const stopRows = sheet.querySelectorAll(".stop-row");
    return {
      sheetHTML: sheet.innerHTML.slice(0, 500),
      stopRowsCount: stopRows.length,
      firstStopText: stopRows[0] ? stopRows[0].textContent : null
    };
  });

  console.log("Sheet info:", sheetInfo);

  await page.screenshot({ path: "../screenshots/debug_tracking_bus.png" });
  console.log("Screenshot saved to ../screenshots/debug_tracking_bus.png");

  await browser.close();
}

run();
