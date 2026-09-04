# Doodle Frontend Challenge

A chat application interface built for the Doodle frontend engineer hiring challenge using Next.js, React, and TypeScript.

## 🚀 Live Deployment

The live application is available at:
👉 **[https://nf-doodle-frontend-challange.vercel.app/](https://nf-doodle-frontend-challange.vercel.app/)**

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)

---

## 🏁 Getting Started

### Prerequisites

Ensure you have Node.js (v20+ recommended) and npm installed.

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 3. Production Build

```bash
npm run build
npm start
```

---

## 🧪 Testing

```bash
npm test          # Run unit & API integration tests
npm run test:e2e  # Run Playwright browser E2E tests
```

> **Note:** Ensure the local dev server (`npm run dev` on port 3000/3001/3002) and the upstream chat API backend are running before executing integration and E2E tests.


---

## 📐 Architecture & Key Decisions

- **Server-Side API Proxy (BFF):** Routes all message traffic through Next.js server Route Handlers to protect the Bearer token and eliminate browser CORS friction.
- **Adaptive Polling & Visibility API:** Polls `GET /api/v1/messages?after=<timestamp>` every 3–4s, pausing when the tab is backgrounded to conserve CPU and network resources.
- **Optimistic UI:** Immediately displays outgoing messages with pending/failed states and retry support.
- **Pagination & Scroll Handling:** Loads the latest 25 messages instantly on mount, with on-demand historical pagination ("Load earlier messages") preserving scroll position.
- **Accessibility:** Live region (`aria-live="polite"`), semantic markup, and keyboard-first interaction.

👉 **Read the full rationale, decisions, and trade-offs in [docs/DECISIONS.md](docs/DECISIONS.md)**.

---

## 📚 Documentation

- [Key Technical Decisions](docs/DECISIONS.md) — Technical choices, trade-offs, and production roadmap.
- [Challenge Brief & Requirements](docs/requirements/README.md) — Original challenge prompt, API specs, and design assets.
