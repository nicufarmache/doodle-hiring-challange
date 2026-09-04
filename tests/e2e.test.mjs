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
    // 1. Visit root chat page with no username chosen yet
    console.log("1. Visiting root page...");
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const header = page.locator("header");
    await header.waitFor({ state: "visible" });
    const headerText = await header.innerText();
    assert.match(headerText, /Pick a name below to chat/, "Header should prompt to pick a name");

    // 2. Verify messages stream is displayed immediately
    console.log("2. Verifying message feed renders before name selection...");
    await page.waitForSelector("article", { timeout: 8000 });
    const initialCount = await page.locator("article").count();
    assert.ok(initialCount > 0, "Messages should be visible even before joining");
    console.log(`   Found ${initialCount} initial messages displayed.`);

    // 3. Verify bottom bar has username entry form
    console.log("3. Submitting username via bottom entry bar...");
    const nameInput = page.locator('input[aria-label="Your display name"]');
    await nameInput.waitFor({ state: "visible" });
    await nameInput.fill("PlaywrightTester");
    await page.locator('footer button:has-text("Join")').click();

    // 4. Verify bottom bar flips to chat message input
    console.log("4. Verifying transition to message input bar...");
    const chatInput = page.locator('input[aria-label="Chat message"]');
    await chatInput.waitFor({ state: "visible", timeout: 2000 });
    const joinedHeaderText = await header.innerText();
    assert.match(joinedHeaderText, /Chatting as PlaywrightTester/, "Header did not update with chosen name");

    // 5. Send optimistic message
    console.log("5. Testing optimistic message sending...");
    const sendMsgText = `Bottom bar E2E Test ${Date.now()}`;
    await chatInput.fill(sendMsgText);
    await page.locator('footer button:has-text("Send")').click();

    // Verify optimistic self bubble appears immediately
    const optimisticBubble = page.locator(`text="${sendMsgText}"`);
    await optimisticBubble.waitFor({ state: "visible", timeout: 2000 });
    console.log("   Optimistic self-bubble appeared immediately!");

    // Wait for server reconciliation
    await page.waitForTimeout(1500);

    // 6. Test background adaptive polling sync
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

    // 7. Test 'Change' name button switches bottom bar back to name entry
    console.log("7. Testing 'Change' button returns to name entry bar...");
    await page.locator('header button:has-text("Change")').click();
    await nameInput.waitFor({ state: "visible", timeout: 2000 });
    console.log("   Bottom bar successfully reverted to name entry!");

    console.log("\n✅ All E2E verification tests passed successfully!");
  } finally {
    await browser.close();
  }
}

runE2E().catch((err) => {
  console.error("❌ E2E tests failed:", err);
  process.exit(1);
});
