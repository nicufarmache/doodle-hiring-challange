import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3002";

test("API Suite: /api/messages Proxy & Validation", async (t) => {
  await t.test("GET /api/messages returns message array and no-store headers", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`);
    assert.equal(res.status, 200);

    const cacheControl = res.headers.get("cache-control");
    assert.match(cacheControl || "", /no-store/);

    const data = await res.json();
    assert.ok(Array.isArray(data), "Expected response to be an array");
    assert.ok(data.length > 0, "Expected at least one message in response");

    const first = data[0];
    assert.ok(first._id, "Message should have _id");
    assert.ok(first.message, "Message should have message text");
    assert.ok(first.author, "Message should have author");
    assert.ok(first.createdAt, "Message should have createdAt timestamp");
  });

  await t.test("GET /api/messages?limit=2 returns limited messages", async () => {
    const res = await fetch(`${BASE_URL}/api/messages?limit=2`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length <= 2, `Expected at most 2 messages, got ${data.length}`);
  });

  await t.test("GET /api/messages?after=<timestamp> filters messages", async () => {
    // 1. Fetch latest messages first
    const initialRes = await fetch(`${BASE_URL}/api/messages?limit=1`);
    const initialData = await initialRes.json();
    assert.ok(initialData.length > 0);

    const latest = initialData[0];
    const afterTime = new Date(new Date(latest.createdAt).getTime() - 5000).toISOString();

    const filteredRes = await fetch(`${BASE_URL}/api/messages?after=${encodeURIComponent(afterTime)}`);
    assert.equal(filteredRes.status, 200);
    const filteredData = await filteredRes.json();
    assert.ok(Array.isArray(filteredData));
    assert.ok(filteredData.length > 0);
  });

  await t.test("GET /api/messages?before=<timestamp> queries historical messages", async () => {
    const listRes = await fetch(`${BASE_URL}/api/messages?limit=5`);
    const list = await listRes.json();
    if (list.length >= 2) {
      const mid = list[Math.floor(list.length / 2)];
      const beforeRes = await fetch(`${BASE_URL}/api/messages?before=${encodeURIComponent(mid.createdAt)}&limit=2`);
      assert.equal(beforeRes.status, 200);
      const beforeData = await beforeRes.json();
      assert.ok(Array.isArray(beforeData));
      for (const m of beforeData) {
        assert.ok(new Date(m.createdAt).getTime() < new Date(mid.createdAt).getTime());
      }
    }
  });

  await t.test("POST /api/messages successfully creates a message (status 201)", async () => {
    const payload = {
      author: "Test Runner",
      message: `Automated test message at ${new Date().toISOString()}`,
    };

    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const created = await res.json();
    assert.ok(created._id, "Created message should have _id");
    assert.equal(created.author, payload.author);
    assert.equal(created.message, payload.message);
    assert.ok(created.createdAt, "Created message should have createdAt");
  });

  await t.test("POST /api/messages rejects empty author with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: "   ", message: "Valid message content" }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Author name must be between/);
  });

  await t.test("POST /api/messages rejects author exceeding 30 chars with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: "A".repeat(31),
        message: "Valid message content",
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Author name must be between/);
  });

  await t.test("POST /api/messages rejects empty message with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: "Test User", message: "   " }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Message content must be between/);
  });

  await t.test("POST /api/messages rejects message exceeding 1000 chars with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: "Test User",
        message: "X".repeat(1001),
      }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /Message content must be between/);
  });

  await t.test("POST /api/messages rejects invalid JSON body with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{",
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /body must be valid JSON/);
  });

  await t.test("POST /api/messages rejects cross-site requests with 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Sec-Fetch-Site": "cross-site",
      },
      body: JSON.stringify({
        author: "Attacker",
        message: "CSRF attempt",
      }),
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.match(body.error, /Forbidden/);
  });
});
