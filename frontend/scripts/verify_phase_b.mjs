import { chromium } from "playwright";
import { execSync } from "child_process";

async function getLatestOtp(email) {
  const result = execSync(`python get_otp.py "${email}"`, {
    cwd: "../backend"
  }).toString().trim();
  return result;
}

async function run() {
  console.log("Starting Phase B Playwright Verification...");
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile viewport (iPhone 14)
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  // 1. Navigate to Login Page
  console.log("Step 1: Navigating to http://localhost:8000/login...");
  await page.goto("http://localhost:8000/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase_b_login_screen.png" });
  console.log("Captured: ../screenshots/phase_b_login_screen.png");

  // 2. Enter email and request OTP
  const testEmail = "delhi_rider@pranshusharma.tech";
  console.log(`Step 2: Entering email ${testEmail}...`);
  await page.fill('input[type="email"]', testEmail);
  await page.click('button[type="submit"]');

  // Wait for OTP step (6 input boxes)
  console.log("Step 3: Waiting for OTP input step...");
  await page.waitForSelector('input[inputmode="numeric"], input[type="text"]', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "../screenshots/phase_b_otp_screen.png" });
  console.log("Captured: ../screenshots/phase_b_otp_screen.png");

  // 3. Retrieve generated OTP code
  const code = await getLatestOtp(testEmail);
  console.log(`Step 4: Dispatched OTP code retrieved: ${code}`);

  // 4. Fill digits into the OTP fields
  const inputs = await page.$$('input[inputmode="numeric"], input[type="text"]');
  console.log(`Found ${inputs.length} OTP input boxes. Filling code...`);
  for (let i = 0; i < 6 && i < inputs.length; i++) {
    await inputs[i].fill(code[i]);
    await page.waitForTimeout(80);
  }

  // 5. Wait for successful verification and navigation to home
  console.log("Step 5: Waiting for navigation after verification...");
  await page.waitForURL("http://localhost:8000/", { timeout: 10000 });
  await page.waitForTimeout(2500); // Allow live map and buses to hydrate
  await page.screenshot({ path: "../screenshots/phase_b_authenticated_home.png" });
  console.log("Captured: ../screenshots/phase_b_authenticated_home.png");

  // 6. Check cookies
  const cookies = await context.cookies();
  const hasAccessCookie = cookies.some(c => c.name === "access_token");
  const hasRefreshCookie = cookies.some(c => c.name === "refresh_token");
  console.log("Verification checks:");
  console.log("- Access Token Cookie present:", hasAccessCookie);
  console.log("- Refresh Token Cookie present:", hasRefreshCookie);

  await browser.close();
  console.log("Phase B verification successfully completed!");
}

run().catch((err) => {
  console.error("Playwright verification error:", err);
  process.exit(1);
});
