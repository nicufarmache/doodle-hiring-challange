# Doodle Frontend Challenge

A modern, responsive, and accessible real-time chat application built for the Doodle Frontend Engineer Hiring Challenge using **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🚀 Live Demo

- **Production URL:** [https://nf-doodle-frontend-challange.vercel.app/](https://nf-doodle-frontend-challange.vercel.app/)
- **Repository:** [github.com/nicufarmache/doodle-hiring-challange](https://github.com/nicufarmache/doodle-hiring-challange)

---

## ✨ Features & UX Highlights

- **Pixel-True Visual Fidelity:**
  - Designed according to the challenge mockup and Figma assets: Doodle brand blue header (`#1c8fca`), coral send button (`#ff7865`), yellow self-message bubbles (`#fef4c0`), white teammate bubbles, 640px max-width layout, and authentic Doodle wallpaper background (`body-bg.png`).
- **Instant Load & Scroll Architecture:**
  - **Single initial fetch:** Queries the last 25 messages directly on mount with zero duplicate requests.
  - **Instant bottom positioning:** Renders immediately at the bottom of the feed without jarring animated scroll sweeps.
  - **Smooth auto-scroll for active conversation:** Automatically scrolls smoothly when you or other participants send new messages.
  - **Scroll preservation:** If you scroll up to read history, incoming messages will not hijack your scroll position.
  - **Unread notification badge:** Displays a sticky *"New messages below ↓"* button when messages arrive while you are reading earlier history.
- **History Pagination:**
  - *"Load earlier messages"* button at the top of the feed to seamlessly page through historical messages via `GET /api/v1/messages?before=<timestamp>&limit=25`, maintaining precise scroll offsets without jumping.
- **Zero-`localStorage` Identity Management:**
  - Open the chat and start reading messages immediately.
  - Choose your display name via the bottom dock, automatically transitioning focus directly into the message input upon joining.
  - Customizable via query param (`?author=Alice`), making it effortless to open multiple browser tabs and simulate live conversation between different users.
- **Resilient Real-Time Sync:**
  - Adaptive short-polling (`?after=<latestTimestamp>`) every 3–4 seconds.
  - **Page Visibility API integration:** Pauses polling when the browser tab is hidden or backgrounded, conserving CPU, mobile battery, and network bandwidth, with an immediate sync check when the user returns.
- **Optimistic UI with Failure Handling:**
  - Outgoing messages appear instantly in the feed with a pending indicator (`sending`).
  - Automatic reconciliation upon server acknowledgement (`sent`).
  - Graceful error states (`failed`) with an inline **Retry** option if a network glitch occurs.
- **First-Class Accessibility (WCAG Compliant):**
  - Screen reader live updates via `aria-live="polite"` and `role="log"`.
  - Accessible form labeling, semantic markup (`<main>`, `<article>`, `<header>`, `<footer>`), and complete keyboard navigation (`Enter` to submit, auto-focus transitions).
  - Character counter gauge warning users as they approach the 1,000-character limit.
- **Secure Backend-for-Frontend (BFF) Proxy:**
  - All client traffic routes through `/api/messages` Route Handler.
  - Keeps the backend Bearer token strictly isolated on the server.
  - Protects against cross-site CSRF attacks (`Sec-Fetch-Site: cross-site` rejection) and validates payload bounds before querying the upstream API.

---

## 🛠️ Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | High-performance React framework with server Route Handlers for BFF proxying |
| **UI Library** | React 19 | Latest concurrent features and clean hooks |
| **Language** | TypeScript 5 | End-to-end type safety across API schemas, components, and hooks |
| **Styling** | Tailwind CSS 4 | Utility-first, zero runtime CSS matching design specifications |
| **Testing** | Node.js Test Runner + Playwright | Fast native unit/API tests and headless Chrome browser E2E test suite |

---

## 🏁 Getting Started

### Prerequisites

- **Node.js**: v20.x or later (`v26` recommended)
- **Docker**: For running the Doodle Chat API backend service locally

### 1. Start the Chat API Backend

In the root of the backend repository (or via docker-compose):

```bash
docker compose up -d
```

Verify that the backend is running at `http://localhost:3000`.

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Environment Configuration

The repository includes a `.env.local` configured for local development:

```env
CHAT_API_URL=http://localhost:3000
CHAT_API_TOKEN=super-secret-doodle-token
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port indicated in your console) in your browser.

---

## 🧪 Testing Suite

The repository includes both unit/integration tests and browser-based end-to-end (E2E) tests.

### Run All Unit & Integration Tests

Executes fast native tests for the BFF API proxy routes, security boundaries, entity decoders, and date formatting:

```bash
npm test
```

### Run End-to-End (E2E) Browser Tests

Executes full browser automation with Playwright against Google Chrome, testing the complete user journey (name entry, message rendering, optimistic send, background polling sync, and pagination):

```bash
npm run test:e2e
```

### Linting & Build Verification

```bash
npm run lint
npm run build
```

---

## 📁 Project Structure

```
.
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── messages/
│   │   │       ├── route.ts         # Secure BFF Proxy (GET with sorting, POST with validation)
│   │   │       └── route.test.mjs   # API integration tests (CSRF, validation, queries)
│   │   ├── favicon.ico
│   │   ├── globals.css              # Global styles & wallpaper background
│   │   ├── layout.tsx               # Root layout & font definitions
│   │   └── page.tsx                 # Single-page chat interface & scroll orchestrator
│   ├── components/
│   │   ├── Header.tsx               # Header with active user indicator & change action
│   │   ├── MessageBubble.tsx        # Message bubble with status, timestamps, and retry
│   │   └── MessageInput.tsx         # Input field with Send button and character counter
│   ├── hooks/
│   │   └── useChat.ts               # Core chat state, polling, visibility API, optimistic UI
│   ├── lib/
│   │   ├── format.ts                # Intl.DateTimeFormat & HTML entity decoding utilities
│   │   └── format.test.mjs          # Unit tests for format utilities
│   └── types/
│       └── message.ts               # TypeScript interfaces & types
├── tests/
│   └── e2e.test.mjs                 # Playwright browser E2E test suite
├── docs/
│   ├── DECISIONS.md                 # In-depth architectural decisions, trade-offs & security
│   └── requirements/                # Original challenge brief & design assets
└── package.json
```

---

## 📚 Architectural Documentation

For an in-depth breakdown of architectural choices, security considerations, and production roadmap, please see:
👉 **[Key Technical Decisions (docs/DECISIONS.md)](docs/DECISIONS.md)**
