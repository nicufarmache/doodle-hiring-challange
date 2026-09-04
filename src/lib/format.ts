const messageDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Formats ISO timestamp using Intl.DateTimeFormat to match design mockup: "10 Mar 2018 9:55"
 */
export function formatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    return messageDateFormatter.format(date).replace(",", "");
  } catch {
    return "";
  }
}

/**
 * Decodes HTML entities using the modern browser DOMParser API.
 * Includes a lightweight fallback for SSR / non-browser environments.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";

  if (typeof DOMParser !== "undefined") {
    try {
      const doc = new DOMParser().parseFromString(text, "text/html");
      return doc.documentElement.textContent || "";
    } catch {
      return text;
    }
  }

  // Fallback for SSR / Node environments
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
