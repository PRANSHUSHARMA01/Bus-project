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

  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  console.log("Navigating to /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Take email step screenshot
  await page.screenshot({ path: path.join(outDir, "17_login_email_390.png") });
  console.log("Captured 17_login_email_390.png");

  // Type email and submit
  await page.fill('input[type="email"]', "rider@pranshusharma.tech");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  // Take OTP step screenshot
  await page.screenshot({ path: path.join(outDir, "17_login_otp_390.png") });
  console.log("Captured 17_login_otp_390.png");

  await browser.close();
  console.log("Phase 3 Auth screenshots captured successfully.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
