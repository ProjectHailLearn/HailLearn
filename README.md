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
cp .env.example .env   # set MONGODB_URI, JWT_SECRET (and optionally the AI key)
npm run dev
```
Backend API runs on `http://localhost:5001` (health check: `/health`). On first start it seeds mentors, courses, study rooms, knowledge items and sample doubts.

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env   # optional: VITE_API_URL if the API isn't on localhost:5001
npm run dev
```
Frontend runs on `http://localhost:5173`. Sign up as **student**, **mentor** or **faculty**; mentor/faculty accounts automatically get a public mentor profile.

### 3. AI Provider (optional)
Doubts are answered by Gemini or Grok. Without a key, a structured template answer is returned so the app still works end to end.
```bash
# backend/.env
AI_PROVIDER=gemini        # or grok
AI_API_KEY=your_key
AI_MODEL=                 # optional override (Gemini default: gemini-3.5-flash, falling back to lite models when busy; Grok: grok-2-latest)
```

### 4. Admin & Email (optional)
```bash
# backend/.env
ADMIN_EMAILS=you@university.edu   # these accounts become admins at signup/startup
SMTP_HOST=... SMTP_PORT=587 SMTP_USER=... SMTP_PASS=... EMAIL_FROM=noreply@your.edu
```
Without SMTP, password-reset emails are printed to the backend console (development).

### 5. Quality Checks
```bash
cd backend && npm test && npm run lint
cd frontend && npm run lint && npm run build
```

---

## ✨ Features
- **AI Doubt Studio**: ask a question with optional code; AI returns step-by-step reasoning (detailed, concise, or Socratic hints).
- **Doubt lifecycle**: `AI_RESOLVED → MENTOR_ESCALATED → FACULTY_VERIFIED → CLOSED`, with mentor/faculty answers and role-based permissions.
- **Knowledge Vault**: faculty-verified doubts are published automatically; search, filter by category, upvote, view counts.
- **Mentorship**: browse mentors with live online status, send 1-on-1 requests, mentors accept/decline, then chat in real time.
- **Courses**: enroll, open-doubt counts per course, personal progress.
- **Study Rooms**: host or join scheduled/live peer sessions with optional meeting links.
- **Real-time notifications** over Socket.IO (JWT-authenticated), karma points and campus rank.
- **Accounts**: forgot/reset password by email, change password, profile and AI preferences.
- **Admin console**: change user roles, link seeded mentor profiles to real accounts, manage the course catalog (faculty can update syllabus progress and lecture times).

## 🔌 API Reference
All routes except register/login require `Authorization: Bearer <token>`.

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | roles: student, mentor, faculty |
| GET/PUT | `/api/auth/me` | profile + preferences |
| POST | `/api/auth/forgot-password`, `/api/auth/reset-password` | rate-limited; reset links expire after 1 hour |
| PUT | `/api/auth/password` | change password (requires current) |
| GET/POST | `/api/doubts` | filters: `status`, `mine`, `courseCode`, `search`; POST runs the AI |
| GET | `/api/doubts/:id` | increments views |
| PUT | `/api/doubts/:id/upvote` · `/escalate` · `/close` | upvote once per user |
| POST | `/api/doubts/:id/answer` | mentor/faculty/admin |
| PUT | `/api/doubts/:id/verify` | faculty/admin; publishes to Knowledge Vault |
| GET | `/api/mentors` | |
| GET/POST, PUT | `/api/requests`, `/api/requests/:id` | mentorship requests; accept/decline |
| GET/POST | `/api/requests/:id/messages` | chat on accepted requests; pushed via Socket.IO `message` |
| GET, PUT | `/api/knowledge`, `/categories`, `/:id/upvote`, `/:id/view` | |
| GET, PUT | `/api/courses`, `/api/courses/:id/enroll`, `/api/courses/:id` | edit: faculty/admin |
| GET, PUT, POST, DELETE | `/api/admin/users`, `/users/:id/role`, `/mentors`, `/mentors/:id/link`, `/courses` | admin only |
| GET | `/api/system` | AI provider status, online mentor count |
| GET/POST, PUT, DELETE | `/api/rooms`, `/:id/join`, `/:id` | study rooms |
| GET, PUT | `/api/notifications`, `/:id/read`, `/read-all` | also pushed via Socket.IO `notification` |
| GET | `/api/stats` | dashboard metrics, karma rank |

---

## 🛡️ Engineering Standards
- **Clean Architecture**: Presentation $\rightarrow$ Route $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Database.
- **Strict Typing**: No `any` types; strict compiler flags enabled.
- **Security**: Strict CORS, Helmet, JWT access/refresh token rotation, rate-limiting, and sanitized inputs.
- **Scalability**: Redis/BullMQ and MongoDB Atlas Vector Search ready.
