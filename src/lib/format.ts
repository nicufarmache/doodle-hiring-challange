const messageDateFormatter = new Intl.DateTimeFormat("en-US", {
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

    const parts = Object.fromEntries(
      messageDateFormatter.formatToParts(date).map((p) => [p.type, p.value])
    );

    const hour = parseInt(parts.hour, 10);
    return `${parts.day} ${parts.month} ${parts.year} ${hour}:${parts.minute}`;
  } catch {
    return "";
  }
}

/**
 * Decodes common HTML entities returned by the API (e.g. &#39; -> ')
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
