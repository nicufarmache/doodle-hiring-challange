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
    // 1. Visit root chat page with default author
    console.log("1. Visiting root chat page with default author...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const header = page.locator("header");
    await header.waitFor({ state: "visible" });
    const defaultHeaderText = await header.innerText();
    assert.match(defaultHeaderText, /Chatting as You/, "Default author not 'You'");

    // 2. Visit with custom author parameter ?author=PlaywrightTester
    console.log("2. Visiting with custom ?author=PlaywrightTester...");
    await page.goto(`${BASE_URL}/?author=PlaywrightTester`, { waitUntil: "networkidle" });
    const customHeaderText = await header.innerText();
    assert.match(customHeaderText, /Chatting as PlaywrightTester/, "Custom author mismatch");

    // 3. Verify message feed renders immediately (no landing page gate)
    console.log("3. Verifying message feed renders...");
    await page.waitForSelector("article", { timeout: 8000 });
    const initialCount = await page.locator("article").count();
    assert.ok(initialCount > 0, "No messages loaded in feed");
    console.log(`   Found ${initialCount} initial messages.`);

    // 4. Send optimistic message
    console.log("4. Testing optimistic message sending...");
    const chatInput = page.locator('input[aria-label="Chat message"]');
    const sendMsgText = `E2E Test Message ${Date.now()}`;
    await chatInput.fill(sendMsgText);
    await page.locator('footer button[type="submit"]').click();

    // Verify optimistic self bubble appears immediately
    const optimisticBubble = page.locator(`text="${sendMsgText}"`);
    await optimisticBubble.waitFor({ state: "visible", timeout: 2000 });
    console.log("   Optimistic self-bubble appeared immediately!");

    // Wait for server reconciliation
    await page.waitForTimeout(1500);

    // 5. Test background adaptive polling sync
    console.log("5. Testing background polling sync from external sender...");
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

    // 6. Test legacy /chat redirect to /
    console.log("6. Testing /chat redirects to /...");
    await page.goto(`${BASE_URL}/chat`, { waitUntil: "networkidle" });
    assert.equal(new URL(page.url()).pathname, "/", "Failed to redirect /chat to /");

    console.log("\n✅ All E2E verification tests passed successfully!");
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error("❌ E2E tests failed:", err);
  process.exit(1);
});
