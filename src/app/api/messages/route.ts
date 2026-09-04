import { NextRequest, NextResponse } from "next/server";
import { CreateMessagePayload } from "@/types/message";

const CHAT_API_URL = process.env.CHAT_API_URL || "http://localhost:3000";
const CHAT_API_TOKEN = process.env.CHAT_API_TOKEN || "super-secret-doodle-token";

/**
 * GET /api/messages
 * Proxies message polling requests to the Doodle Chat backend.
 * Supports ?after=<timestamp>&limit=<number>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const after = searchParams.get("after");
    const before = searchParams.get("before");
    const limit = searchParams.get("limit");

    const targetUrl = new URL("/api/v1/messages", CHAT_API_URL);
    if (after) {
      targetUrl.searchParams.set("after", after);
    } else if (before) {
      targetUrl.searchParams.set("before", before);
    } else {
      // Default: fetch the most recent messages (the last X messages)
      // Upstream API only sorts in reverse chronological order when `before` is set.
      // Providing a near-future boundary queries the latest messages ending at the present.
      targetUrl.searchParams.set("before", new Date(Date.now() + 300_000).toISOString());
    }
    if (limit) targetUrl.searchParams.set("limit", limit);

    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CHAT_API_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return NextResponse.json(
        { error: "Upstream chat service error", details: errorText },
        { status: upstreamResponse.status }
      );
    }

    const data = await upstreamResponse.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("GET /api/messages proxy error:", error);
    return NextResponse.json(
      { error: "Internal proxy error connecting to chat API" },
      { status: 502 }
    );
  }
}

/**
 * POST /api/messages
 * Validates payload, verifies origin, and proxies new messages to the backend.
 */
export async function POST(request: NextRequest) {
  // 1. Same-Origin & CSRF verification
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return NextResponse.json(
      { error: "Forbidden: cross-site requests are rejected" },
      { status: 403 }
    );
  }

  // 2. Parse request JSON body safely
  let body: Partial<CreateMessagePayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request: body must be valid JSON" },
      { status: 400 }
    );
  }

  // 3. Validate author and message
  const author = typeof body.author === "string" ? body.author.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!author || author.length < 1 || author.length > 30) {
    return NextResponse.json(
      { error: "Author name must be between 1 and 30 characters" },
      { status: 400 }
    );
  }

  if (!message || message.length < 1 || message.length > 1000) {
    return NextResponse.json(
      { error: "Message content must be between 1 and 1000 characters" },
      { status: 400 }
    );
  }

  // 4. Proxy request to upstream Doodle Chat API with secure Bearer token
  try {
    const targetUrl = new URL("/api/v1/messages", CHAT_API_URL);
    const upstreamResponse = await fetch(targetUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAT_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ author, message }),
    });

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text();
      return NextResponse.json(
        { error: "Upstream chat service rejected message", details: errorText },
        { status: upstreamResponse.status }
      );
    }

    const createdMessage = await upstreamResponse.json();
    return NextResponse.json(createdMessage, { status: 201 });
  } catch (error) {
    console.error("POST /api/messages proxy error:", error);
    return NextResponse.json(
      { error: "Internal proxy error connecting to chat API" },
      { status: 502 }
    );
  }
}
