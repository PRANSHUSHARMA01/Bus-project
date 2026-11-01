import { chromium } from "playwright";

async function run() {
  console.log("Launching browser to verify Phase A single-origin deployment at http://localhost:8000...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile viewport (iPhone 14)
    deviceScaleFactor: 2,
  });

  // Inject authentication and user state so we can view the app
  await context.addInitScript(() => {
    localStorage.setItem("smart_bus_user", JSON.stringify({
      id: "usr_pranshu_01",
      email: "pranshusharma5136@gmail.com",
      full_name: "Pranshu",
      language: "en",
      role: "passenger"
    }));
    localStorage.setItem("smart_bus_token", "demo-token-session");
    localStorage.setItem("user_selected_stop", "7572");
    localStorage.setItem("user_theme", "light");
  });

  const page = await context.newPage();

  // Test 1: Load Homepage at http://localhost:8000/
  console.log("Navigating to http://localhost:8000/ (FastAPI serving Next.js static export)...");
  const homeRes = await page.goto("http://localhost:8000/", { waitUntil: "networkidle" });
  console.log("Homepage HTTP Status:", homeRes.status());
  console.log("Homepage Content-Type:", homeRes.headers()["content-type"]);
  console.log("Homepage Cache-Control:", homeRes.headers()["cache-control"]);

  await page.waitForTimeout(2000);
  await page.screenshot({ path: "../screenshots/phase_a_single_origin_home.png" });
  console.log("Captured ../screenshots/phase_a_single_origin_home.png");

  // Test 2: Deep Link to /activity
  console.log("Navigating to http://localhost:8000/activity directly...");
  const activityRes = await page.goto("http://localhost:8000/activity", { waitUntil: "networkidle" });
  console.log("Activity HTTP Status:", activityRes.status());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase_a_single_origin_activity.png" });
  console.log("Captured ../screenshots/phase_a_single_origin_activity.png");

  // Test 3: Deep Link to /services
  console.log("Navigating to http://localhost:8000/services directly...");
  const servicesRes = await page.goto("http://localhost:8000/services", { waitUntil: "networkidle" });
  console.log("Services HTTP Status:", servicesRes.status());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase_a_single_origin_services.png" });
  console.log("Captured ../screenshots/phase_a_single_origin_services.png");

  // Test 4: SPA Fallback Route /t/shared-demo-trip
  console.log("Navigating to http://localhost:8000/t/shared-demo-trip directly (SPA Fallback)...");
  const spaRes = await page.goto("http://localhost:8000/t/shared-demo-trip", { waitUntil: "networkidle" });
  console.log("SPA Fallback HTTP Status:", spaRes.status());
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase_a_single_origin_spa_fallback.png" });
  console.log("Captured ../screenshots/phase_a_single_origin_spa_fallback.png");

  await browser.close();
  console.log("Phase A verification completed successfully!");
}

run().catch((err) => {
  console.error("Playwright verification error:", err);
  process.exit(1);
});
