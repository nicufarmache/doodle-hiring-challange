# Architecture & Technical Decisions

This document outlines the architectural decisions, assumptions, trade-offs, and technical rationale for the Doodle Frontend Challenge chat application.

---

## 1. Project Objectives & Scope

The goal is to deliver a responsive, accessible, and performant chat application in React & TypeScript matching the provided design specs.

### Key Evaluation Criteria
- **Clean Architecture & Readability:** Predictable folder structure, clear separation of concerns.
- **Accessibility (a11y):** Keyboard navigation, screen-reader friendly updates (`aria-live`), semantic markup.
- **Performance:** Efficient rendering, minimal bundle overhead, resilient network synchronization.

---

## 2. Assumptions & Clarifications

Since the challenge brief provides a minimal specification, the following engineering assumptions were made:

| Topic | Assumption | Rationale |
| :--- | :--- | :--- |
| **User Identity** | The user identity defaults to "You" and is customizable via URL query param (`?author=...`) or inline change prompt without `localStorage`. | Eliminates storage sync complexity, avoids SSR hydration divergence, and allows testing multiple users simultaneously across separate tabs. |
| **Backend Availability** | The backend API is configured in an env var `CHAT_API_URL`. | Keeps development decoupled from external network conditions. |
| **Pagination & History** | Initial load fetches recent messages; older messages can be loaded by querying timestamps before the oldest message. | The API supports `GET /api/v1/messages?after=<timestamp>&limit=<number>` in reverse chronological order. |
| **Realtime Updates** | Sync must be handled via intelligent polling. | The provided backend specification only exposes REST endpoints (no WebSocket / Server-Sent Events). |

---

## 3. Key Technical Decisions

### 1. Framework: Next.js App Router
- **Context:** The challenge allows React with TypeScript and suggests frameworks like Next.js.
- **Decision:** Use Next.js (App Router) with React 19 and TypeScript.
- **Alternatives Considered:**
  - *Vite + React SPA:* Faster build setup, but lacks built-in server-side API proxying and edge routing capabilities.
- **Trade-offs & Rationale:**
  - Next.js provides built-in Route Handlers to serve as a Backend-for-Frontend (BFF) proxy.
  - Native TypeScript, Turbopack, and automated font/script optimization out of the box.

---

### 2. Backend-for-Frontend (BFF) API Proxy for Security & CORS
- **Context:** The Doodle Chat API requires a master Bearer token (`super-secret-doodle-token`). Exposing this secret in client bundles (`NEXT_PUBLIC_*`) is a severe security antipattern and triggers browser CORS restrictions.
- **Decision:** Implement a Next.js Route Handler (`/api/messages/route.ts`) as a Backend-for-Frontend (BFF) proxy for both `GET` and `POST` operations.
- **Alternatives Considered:**
  - *Direct Client `fetch`:* Leaks the master token in client bundles and network tabs; exposes backend to CORS issues.
  - *Next.js Server Actions (`'use server'`):* Good for form mutations, but ill-suited for short-polling (transfers heavy RSC payloads over POST instead of lightweight GETs, lacks standard HTTP caching, and Server Actions are public HTTP endpoints anyway).
- **Endpoint Protection Strategy:**
  - **Upstream Secret Isolation:** Master Bearer token is strictly injected server-side and never exposed to the browser.
  - **Same-Origin / CSRF Protection:** Inspect `Sec-Fetch-Site` and `Origin` headers to reject cross-site requests from untrusted origins.
  - **Strict Input Validation:** Validate payload types, max lengths (e.g. `message` <= 1000 chars, `author` <= 30 chars), and reject invalid data before contacting the Doodle backend.
  - **Production Context:** In a full enterprise app with user authentication, the proxy would verify the user's session cookie/JWT prior to appending the backend token.
- **Trade-offs:**
  - Adds a small local network hop, but completely protects credentials, simplifies client networking, and eliminates CORS.

---

### 3. Synchronization via Adaptive Polling & Page Visibility API
- **Context:** In the absence of WebSocket or SSE push mechanisms, the client must pull new messages periodically.
- **Decision:** Implement adaptive short polling using `GET /api/v1/messages?after=<latestTimestamp>`.
- **Optimization Strategy:**
  - **Interval:** Poll every 3–4 seconds when the window is active.
  - **Page Visibility API:** Automatically pause polling when the tab/browser is inactive or in the background (`document.visibilityState === 'hidden'`) to save client CPU, battery, and server bandwidth.
  - **Window Focus Refetch:** Trigger an immediate sync when the user switches back to the tab.
- **Trade-offs:**
  - Small latency window (up to poll interval) compared to WebSockets, but standard and reliable for REST-only backends.

---

### 4. Optimistic UI Updates for Message Dispatch
- **Context:** Chat users expect instant feedback when clicking "Send" or pressing Enter. Network latency should not block message display.
- **Decision:** Implement optimistic updates for outgoing messages.
- **Flow:**
  1. Generate a temporary client ID (e.g., `temp-<timestamp>`).
  2. Append the message immediately to the message list with a `status: 'sending'` indicator.
  3. Send the POST request to `/api/messages`.
  4. On success: Replace the temporary message with the server-acknowledged message (`status: 'sent'`).
  5. On error: Mark the message with `status: 'failed'` and expose a "Retry" button.
- **Trade-offs:**
  - Requires temporary ID tracking and deduplication logic, but provides a modern, responsive user experience.

---

### 5. State Management Architecture
- **Context:** The application has a single primary domain (the chat room: message stream, sending state, author profile).
- **Decision:** Use a dedicated custom React hook (`useChat`) with `useReducer` / modular state, rather than heavyweight global stores (Redux, Zustand).
- **Alternatives Considered:**
  - *Redux Toolkit / Zustand:* Overhead and unnecessary boilerplate for a focused single-view chat room.
  - *TanStack Query / SWR:* Excellent for server cache, but a lightweight custom hook keeps dependencies minimal and demonstrates vanilla React 19 fundamentals.
- **Trade-offs:**
  - Minimal bundle size and zero third-party state library dependencies.

---

### 6. Accessibility (a11y) & Usability
- **Context:** The challenge explicitly highlights accessibility as a key grading criterion.
- **Key Choices:**
  - **Live Region:** Use `aria-live="polite"` and `role="log"` on the message container so screen readers announce incoming messages without interrupting ongoing speech.
  - **Keyboard Interaction:** Form submission triggers on `Enter` (with `Shift+Enter` for multiline text if a textarea is used).
  - **Semantic HTML:** `<main>`, `<section>`, `<article>` for message bubbles, `<form>`, and accessible `<button>` labels.
  - **Auto-Scroll Behavior:** Smoothly scroll to the bottom when a new message arrives, but *do not hijack* scroll position if the user has scrolled up to inspect history.
