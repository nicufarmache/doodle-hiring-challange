import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { formatMessageTime, decodeHtmlEntities } from "./format.ts";

describe("Format Utilities", () => {
  test("decodeHtmlEntities decodes common HTML entities via fallback", () => {
    assert.equal(decodeHtmlEntities("It&#39;s a test"), "It's a test");
    assert.equal(decodeHtmlEntities("&quot;Hello&quot;"), '"Hello"');
    assert.equal(decodeHtmlEntities("Rock &amp; Roll"), "Rock & Roll");
    assert.equal(decodeHtmlEntities("&lt;tag&gt;"), "<tag>");
    assert.equal(decodeHtmlEntities(""), "");
  });

  test("decodeHtmlEntities uses DOMParser when available in browser scope", () => {
    const originalDOMParser = globalThis.DOMParser;
    try {
      globalThis.DOMParser = class MockDOMParser {
        parseFromString(str) {
          return {
            documentElement: {
              textContent: str
                .replace(/&#39;/g, "'")
                .replace(/&quot;/g, '"')
                .replace(/&copy;/g, "©"),
            },
          };
        }
      };

      assert.equal(
        decodeHtmlEntities("Copyright &copy; &quot;Doodle&#39;s Team&quot;"),
        'Copyright © "Doodle\'s Team"'
      );
    } finally {
      if (originalDOMParser === undefined) {
        delete globalThis.DOMParser;
      } else {
        globalThis.DOMParser = originalDOMParser;
      }
    }
  });

  test("formatMessageTime formats valid ISO date string correctly", () => {
    const date = new Date(2026, 2, 10, 9, 55);
    const formatted = formatMessageTime(date.toISOString());
    assert.equal(formatted, "10 Mar 2026 9:55");
  });

  test("formatMessageTime handles invalid date strings gracefully", () => {
    assert.equal(formatMessageTime("invalid-date"), "");
    assert.equal(formatMessageTime(""), "");
  });
});
