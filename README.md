# HailLearn — The AI Learning Operating System for Universities

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2B%20Vector-47A248.svg)](https://www.mongodb.com/)

HailLearn is an AI-native collaborative learning operating system built specifically for universities. Unlike generic chatbots, HailLearn orchestrates learning by pairing generative AI with real institutional human mentorship, turning every solved student doubt into persistent institutional knowledge.

---

## 🏛️ Architecture Overview

HailLearn follows **Clean Architecture** principles to guarantee strict decoupling of business logic, presentation layers, data repositories, and AI inference engines:

```
HailLearn/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment, database, and third-party configs
│   │   ├── controllers/     # Request ingestion, status orchestration
│   │   ├── routes/          # Express route declarations
│   │   ├── middlewares/     # JWT Auth, RBAC, error handlers, rate limiting
│   │   ├── models/          # Mongoose normalized schemas & vector indexes
│   │   ├── repositories/    # Data access layer & query abstractions
│   │   ├── services/        # Core business logic & AI orchestration
│   │   ├── validators/      # Zod / express-validator schema validations
│   │   ├── interfaces/      # Strict TypeScript contracts & domain types
│   │   ├── constants/       # Enums, error codes, system constants
│   │   ├── utils/           # Helper functions, formatters, tokens
│   │   ├── socket/          # Socket.IO real-time event handlers
│   │   ├── jobs/            # Background async workers & batch pipelines
│   │   ├── docs/            # Swagger / OpenAPI contracts
│   │   ├── tests/           # Unit, integration, and mock suites
│   │   ├── app.ts           # Express app setup & middleware pipeline
│   │   └── server.ts        # HTTP & Socket.IO server bootstrap
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Route-level view components
│   │   ├── layouts/         # App shell, student/mentor/admin dashboards
│   │   ├── components/      # Reusable atomic UI components (Button, Modal, Card)
│   │   ├── features/        # Feature-sliced modules (Auth, DoubtEngine, MentorMatch)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── contexts/        # Global React contexts
│   │   ├── services/        # Axios API clients & WebSocket services
│   │   ├── store/           # Redux Toolkit store, slices, and selectors
│   │   ├── types/           # TypeScript types & DTO definitions
│   │   ├── utils/           # Client-side utility functions
│   │   ├── constants/       # Route paths, theme tokens, UI constants
│   │   ├── assets/          # Static SVGs, images, animations
│   │   ├── styles/          # Tailwind additions & custom CSS modules
│   │   ├── App.tsx          # Root routing & state provider layout
│   │   ├── main.tsx         # React DOM entrypoint
│   │   └── index.css        # Tailwind directives & design tokens
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10+
- **MongoDB**: Local instance or MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # Configure your environment variables
npm run dev
```
Backend API will be live on `http://localhost:5000` (Health Check: `http://localhost:5000/health`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend Web App will be live on `http://localhost:5173`.

---

## 🛡️ Engineering Standards
- **Clean Architecture**: Presentation $\rightarrow$ Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database.
- **Strict Typing**: No `any` types; strict compiler flags enabled.
- **Security**: Strict CORS, Helmet, JWT access/refresh token rotation, rate-limiting, and sanitized inputs.
- **Scalability**: Redis/BullMQ and MongoDB Atlas Vector Search ready.
