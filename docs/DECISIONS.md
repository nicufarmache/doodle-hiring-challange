# Architecture & Technical Decisions

This document outlines the architectural decisions, assumptions, trade-offs, and technical rationale behind the Doodle Frontend Challenge chat application.

---

## 1. Project Objectives & Scope

The primary objective is to deliver a responsive, accessible, secure, and performant real-time chat application matching the visual specification provided in the Doodle challenge brief.

### Key Evaluation Criteria
- **Clean Architecture & Readability:** Predictable directory structure, modular hooks, separation of concerns.
- **Accessibility (a11y):** Full keyboard operability, screen-reader live announcements (`aria-live`), semantic HTML.
- **Performance & Network Resilience:** Efficient message synchronization, instant load times, zero redundant requests.
- **Visual Fidelity:** Strict adherence to the provided design mockups and color palette.

---

## 2. Assumptions & Clarifications

| Topic | Assumption | Rationale |
| :--- | :--- | :--- |
| **User Identity** | The user identity is initialized via an inline bottom prompt or customizable via URL query parameter (`?author=...`), without `localStorage`. | Eliminates storage synchronization complexity, prevents SSR/client hydration mismatches, and allows evaluating multi-user conversations simply by opening multiple tabs with different author names. |
| **Backend Availability** | The backend API is configured via an environment variable `CHAT_API_URL`. | Decouples local development from external environments and supports containerized or remote backends. |
| **Pagination & History** | Initial load fetches the latest 25 messages; older messages are loaded on demand by querying timestamps before the oldest visible message. | Mirrors real-world chat applications (Slack, WhatsApp), minimizing initial payload while allowing users to access full historical context. |
| **Realtime Updates** | Sync is handled via adaptive short-polling. | The provided backend specification only exposes REST endpoints (`GET` / `POST`), without WebSocket or Server-Sent Events (SSE) support. |

---

## 3. Key Technical Decisions

### 1. Framework: Next.js 16 App Router & React 19
- **Context:** The challenge recommends React with TypeScript and allows modern frameworks like Next.js.
- **Decision:** Use Next.js 16 (App Router) with React 19 and TypeScript.
- **Alternatives Considered:**
  - *Vite + Single Page Application (SPA):* Fast to scaffold, but lacks native server-side Route Handlers to securely proxy API calls without exposing the master Bearer token in the client bundle.
- **Trade-offs & Rationale:**
  - Next.js provides built-in server Route Handlers that act as a Backend-for-Frontend (BFF) proxy.
  - Native TypeScript support, Turbopack for ultra-fast HMR, and zero third-party build tooling required.

---

### 2. Backend-for-Frontend (BFF) API Proxy for Security & CORS
- **Context:** The Doodle Chat API requires a master Bearer token (`super-secret-doodle-token`). Exposing this secret in client-side bundles (`NEXT_PUBLIC_*`) is a severe security antipattern that also triggers browser Cross-Origin Resource Sharing (CORS) friction.
- **Decision:** Implement a Next.js Route Handler (`/api/messages/route.ts`) as a Backend-for-Frontend (BFF) proxy for all message retrieval and dispatch operations.
- **Security & Endpoint Protection Strategy:**
  - **Secret Isolation:** The master Bearer token is strictly injected server-side and never exposed to the client.
  - **Reverse-Chronological Initial Fetch:** The upstream backend API sorts ascending by default when queried without bounds, returning the *oldest* messages from history. The BFF proxy remedies this by defaulting unconstrained requests to `before = new Date()`, instructing the backend to retrieve the latest messages up to the present in chronological order.
  - **Same-Origin / CSRF Protection:** Rejects cross-site requests (`Sec-Fetch-Site: cross-site`) with HTTP 403 Forbidden.
  - **Payload Validation:** Enforces string boundaries (e.g. `message` <= 1,000 characters, `author` <= 30 characters) and validates JSON payloads before forwarding to the upstream service.
- **Trade-offs:**
  - Adds a negligible local network hop, but completely protects upstream credentials, guarantees payload safety, and avoids CORS overhead.

---

### 3. Synchronization via Adaptive Polling & Page Visibility API
- **Context:** Without WebSocket or SSE push mechanisms, the frontend must pull new messages periodically.
- **Decision:** Implement adaptive short-polling using `GET /api/messages?after=<latestTimestamp>`.
- **Optimization Strategy:**
  - **Unified Lifecycle:** Polling intervals and tab-focus listeners only start *after* the initial message fetch resolves, preventing race conditions where tab focus could trigger concurrent duplicate initial fetches.
  - **Page Visibility API:** Polling automatically pauses when the browser tab is hidden (`document.visibilityState === 'hidden'`), conserving client CPU, battery life on mobile devices, and server capacity.
  - **Instant Refetch on Focus:** Immediately syncs new messages when the user switches back to the tab.
  - **AbortController Cleanups:** In-flight network requests are cleanly aborted on unmount or tab changes to prevent memory leaks and orphaned operations.
- **Trade-offs:**
  - Introduces a small latency window (equal to the 3–4 second polling interval) compared to WebSockets, but operates reliably on standard REST infrastructure.

---

### 4. Viewport & Scroll Orchestration
- **Context:** Chat applications have distinct scrolling requirements: users expect to open directly at the latest messages without watching a slow animated scroll sweep across history, but expect smooth auto-scrolling when new messages arrive.
- **Implementation:**
  - **Instant Initial Placement:** On first load, the viewport sets `scrollTop = scrollHeight` instantly, eliminating jarring scroll sweeps.
  - **Context-Aware Auto-Scroll:** If the user is at the bottom of the feed, incoming or sent messages trigger smooth scrolling to keep the latest message in view.
  - **Non-Intrusive History Reading:** If the user has scrolled up to inspect earlier messages, incoming messages do not hijack their scroll position. Instead, a floating *"New messages below ↓"* pill appears.
  - **Pagination Scroll Anchoring:** When prepending older messages via *"Load earlier messages"*, the scroll container dynamically recalculates and restores `scrollTop` using `prevScrollTop + (newScrollHeight - prevScrollHeight)`, ensuring zero visual jumping.

---

### 5. Optimistic UI Updates with Error Recovery
- **Context:** Users expect instantaneous feedback upon pressing Enter or clicking Send.
- **Flow:**
  1. Generate a temporary client ID (`temp-<timestamp>`).
  2. Append the message immediately to the UI feed with a `status: 'sending'` badge.
  3. Dispatch the `POST /api/messages` request.
  4. **Success:** Reconcile and replace the optimistic item with the server-confirmed message (`status: 'sent'`).
  5. **Failure:** Mark the item with `status: 'failed'` and display an accessible inline **Retry** trigger.
- **Trade-offs:**
  - Requires optimistic ID mapping and deduplication logic, but provides a fluid, responsive experience.

---

### 6. Accessibility (a11y) & Semantic Structure
- **Context:** Accessibility was highlighted as an essential challenge criterion.
- **Key Implementations:**
  - **Live Region:** Applied `aria-live="polite"` and `role="log"` to the message stream so screen readers announce incoming messages without interrupting ongoing speech.
  - **Keyboard Navigation:** Full keyboard navigation with `Enter` submission on both the username entry form and chat input.
  - **Accessible Form Controls:** Explicit `aria-label` attributes on inputs, buttons, and status indicators.
  - **Character Limit Feedback:** Dynamic visual character count counter alerting the user as they approach the 1,000-character boundary.

---

## 4. Comprehensive Testing Strategy

To guarantee reliability across all layers, the application uses a two-tiered testing approach:

1. **Unit & API Integration Tests (`npm test`):**
   - Implemented with Node.js built-in test runner (`node:test`) for zero overhead and near-instant execution.
   - Verifies the BFF proxy routes (`GET` filtering, `limit`, `after`, `before`, `POST` validation, payload constraints, CSRF blocking).
   - Verifies formatting helpers (HTML entity decoding, timestamp formatting).
2. **End-to-End Browser Tests (`npm run test:e2e`):**
   - Automated via Playwright against Google Chrome.
   - Validates the entire user flow: joining with a username, initial message rendering, optimistic message dispatch, pagination loading, and live polling sync from an external sender.

---

## 5. Production Roadmap & Future Improvements

If scaling this system into a multi-tenant enterprise product, the next iterative steps would include:
1. **Server-Sent Events (SSE) or WebSockets:** Replace polling with push notifications via WebSockets or SSE for sub-second latency.
2. **Virtualization:** Implement windowing (e.g. `@tanstack/react-virtual`) if message histories exceed several thousand items in memory.
3. **Rich Media & Reactions:** Support markdown formatting, emoji reactions, and file attachments via pre-signed S3/Blob storage URLs.
