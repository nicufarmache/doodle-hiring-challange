import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3002";
const API_URL = process.env.CHAT_API_URL || "http://localhost:3000";
const TOKEN = process.env.CHAT_API_TOKEN || "super-secret-doodle-token";

async function runE2E() {
  console.log(`Starting E2E test suite against ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
  });
  const page = await context.newPage();

  try {
    // 1. Visit landing page
    console.log("1. Visiting landing page...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const title = await page.locator("h1").innerText();
    assert.match(title, /Join the Chat/i, "Landing title mismatch");

    // 2. Submit user display name
    console.log("2. Submitting display name 'PlaywrightTester'...");
    const nameInput = page.locator("#display-name");
    await nameInput.fill("PlaywrightTester");
    await page.locator('button[type="submit"]').click();

    // 3. Arrive at /chat
    await page.waitForURL("**/chat");
    console.log("3. Successfully navigated to /chat");

    // Verify header display name
    const userBadge = page.locator("header");
    await userBadge.waitFor({ state: "visible" });
    const headerText = await userBadge.innerText();
    assert.match(headerText, /PlaywrightTester/, "Header missing user name");

    // 4. Verify messages stream rendered
    console.log("4. Verifying message feed renders...");
    await page.waitForSelector("article", { timeout: 8000 });
    const initialCount = await page.locator("article").count();
    assert.ok(initialCount > 0, "No messages loaded in feed");
    console.log(`   Found ${initialCount} initial messages.`);

    // 5. Send optimistic message
    console.log("5. Testing optimistic message sending...");
    const chatInput = page.locator('input[aria-label="Chat message"]');
    const sendMsgText = `E2E Test Message ${Date.now()}`;
    await chatInput.fill(sendMsgText);
    await page.locator('footer button[type="submit"]').click();

    // Verify it appears immediately in the DOM
    const optimisticBubble = page.locator(`text="${sendMsgText}"`);
    await optimisticBubble.waitFor({ state: "visible", timeout: 2000 });
    console.log("   Optimistic bubble appeared immediately!");

    // Wait for server reconciliation
    await page.waitForTimeout(1500);

    // 6. Test background adaptive polling synchronization
    console.log("6. Testing background polling sync from external sender...");
    const externalText = `External E2E Message ${Date.now()}`;
    const externalRes = await fetch(`${API_URL}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        author: "RemoteTeammate",
        message: externalText,
      }),
    });
    assert.equal(externalRes.status, 201, "Failed to post external message");

    // Wait for adaptive poll to pull the new message
    const externalBubble = page.locator(`text="${externalText}"`);
    await externalBubble.waitFor({ state: "visible", timeout: 8000 });
    console.log("   Successfully received external message via polling sync!");

    // 7. Test 'Change' display name flow
    console.log("7. Testing 'Change' user name link...");
    await page.locator('header a:has-text("Change")').click();
    await page.waitForURL(`${BASE_URL}/`);
    const prefilledValue = await page.locator("#display-name").inputValue();
    assert.equal(prefilledValue, "PlaywrightTester", "User name not pre-filled");

    console.log("\n✅ All E2E verification tests passed successfully!");
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error("❌ E2E tests failed:", err);
  process.exit(1);
});
