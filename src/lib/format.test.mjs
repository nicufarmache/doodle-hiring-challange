import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { formatMessageTime, decodeHtmlEntities } from "./format.ts";

describe("Format Utilities", () => {
  test("decodeHtmlEntities decodes common HTML entities", () => {
    assert.equal(decodeHtmlEntities("It&#39;s a test"), "It's a test");
    assert.equal(decodeHtmlEntities("&quot;Hello&quot;"), '"Hello"');
    assert.equal(decodeHtmlEntities("Rock &amp; Roll"), "Rock & Roll");
    assert.equal(decodeHtmlEntities("&lt;tag&gt;"), "<tag>");
    assert.equal(decodeHtmlEntities(""), "");
  });

  test("formatMessageTime formats valid ISO date string correctly", () => {
    // 2026-03-10T09:55:00.000Z
    const date = new Date(2026, 2, 10, 9, 55);
    const formatted = formatMessageTime(date.toISOString());
    assert.equal(formatted, "10 Mar 2026 9:55");
  });

  test("formatMessageTime handles invalid date strings gracefully", () => {
    assert.equal(formatMessageTime("invalid-date"), "");
    assert.equal(formatMessageTime(""), "");
  });
});
