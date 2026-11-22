# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # Start with tsx watch (hot reload)
npm run build        # Compile TypeScript → dist/
npm start            # Run compiled dist/server.js
npm run lint         # ESLint over src/
npm test             # Jest
npm run test:watch   # Jest in watch mode
npm run test:coverage
```
Backend runs on `http://localhost:5001`. Health check: `GET /health`.

### Frontend (`cd frontend`)
```bash
npm run dev    # Vite dev server → http://localhost:5173
npm run build  # tsc + vite build
npm run lint   # ESLint
```

### Environment
Copy `backend/.env.example` → `backend/.env` and fill in:
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — access token signing key
- `AI_PROVIDER` (`gemini` | `grok`) and `AI_API_KEY` — optional; without a key `services/aiService.ts` returns a template answer

The database is seeded automatically on first startup (`seedDatabase()` in `server.ts`) with mentors, courses, study rooms, knowledge items, and doubts. Frontend API base URL comes from `VITE_API_URL` (default `http://localhost:5001/api`).

---

## Architecture

### Request Flow (Backend)
```
HTTP Request → Route → Middleware (protect) → Controller → Model → Response
```
Controllers live in `src/controllers/`, routes in `src/routes/`. Controllers call Mongoose models directly (no repository layer). Cross-cutting logic lives in `src/services/` (`aiService` — Gemini/Grok with fallback; `notificationService.notify()` — persists + pushes via Socket.IO). Request bodies are validated with zod schemas in `src/validators/index.ts` via `validate(schema)`. Protected routers use `router.use(protect)` then `router.param('id', validateObjectId)`; role checks use `authorize(...roles)`.

Socket.IO (`src/socket/index.ts`) authenticates with the JWT in `handshake.auth.token`; each user joins `user:<id>`. Events: `notification`, `rooms:changed`, `message` (mentor chat), `mentors:presence`. Mentor presence is a `lastSeenAt` heartbeat (`services/presenceService.ts`); sockets and `POST /api/presence` both update it.

Admins come from `ADMIN_EMAILS` (promoted at startup and signup); admin routes live under `/api/admin`. Without SMTP config, `services/emailService.ts` logs emails to the console.

### Authentication
- Signup emails a 6-digit code; no session until `/auth/verify-email`. Sessions are a 15-minute access JWT (`{ userId, role }`, signed with `JWT_SECRET`) plus a rotating refresh token (`services/tokenService.ts`; hash stored on the user, reuse revokes all sessions). The client refreshes silently on 401 (`services/api.ts`).
- `protect` loads the user on every request, so suspension and role changes apply immediately.
- The `protect` middleware (`src/middlewares/auth.ts`) attaches `req.userId` and `req.userRole` to `AuthRequest`.
- The frontend stores the access token in `localStorage` under `hl_token`, the refresh token under `hl_refresh` and the user object under `hl_user`. Both are read on app boot to rehydrate Redux `auth` state (`store/slices/authSlice.ts`).
- On a 401 the Axios interceptor tries one refresh, then clears localStorage and redirects to `/login`.

### Frontend State
- **Redux Toolkit** manages: `auth`, `doubts`, `mentors`, `ui` slices.
- Pages fetch through `src/services/*Service.ts` (Axios) and keep page-local state; the dashboard pushes doubts/mentors into Redux. **TanStack Query** is configured but unused. There is no mock data.
- `DashboardLayout` connects the socket (`services/socketService.ts`) and loads notifications.
- `useAppDispatch` / `useAppSelector` are the typed hooks exported from `store/index.ts`.

### Routing & Layout
- `App.tsx` wraps routes in `<ProtectedLayout>` which checks `state.auth.isAuthenticated`; unauthenticated users are redirected to `/login`.
- `DashboardLayout` is the authenticated shell wrapping all protected pages.

### Domain Models
Mongoose models (also `Course`, `StudyRoom`, `MentorRequest`, `Notification`):
- **User** — roles: `student | mentor | faculty | admin`; stores karma, specializations, department
- **Doubt** — lifecycle: `ANALYZING → AI_RESOLVED | MENTOR_ESCALATED → FACULTY_VERIFIED → CLOSED`; embeds `aiSolution` (steps + citations) and `assignedMentor`
- **Mentor** — separate from User; seeded mentors have no `userId`. Mentor/faculty users get a linked Mentor doc (`userId`) on register/profile update. Holds `reputationScore` (Bayesian average of ratings, `services/reputationService.ts`), `verifiedBadge`, and weekly `availability`
- **Rating** (one per doubt, on `/confirm`) and **Flag** (content reports; low-rated AI answers are auto-flagged)
- **KnowledgeItem** — verified community answers (`content` = full article, `doubtId` = source doubt); tracks upvotes, views

### Search engine (`src/search/`)
Elasticsearch-style engine stored in MongoDB: `analyzer.ts` (tokenizer, stop words, abbreviation synonyms, light stemmer), inverted index in `search_postings` + document store `search_docs`, `scoring.ts` (BM25F with title^3/meta^2/body boosts, coverage, RRF), `vectors.ts` (Gemini `gemini-embedding-001` 768-d embeddings when the key allows, else local character-trigram vectors). `engine.search()` fuses keyword and vector rankings with reciprocal rank fusion and multiplies by each document's `qualityWeight`. Indexes: `vault` (Knowledge Vault) and `mentors` (expertise profiles); `indexers.ts` updates them on verify/answer/profile changes and `ensureIndex()` rebuilds when counts drift.

### RAG & confidence
`services/retrievalService.ts` wraps the engine for RAG (`retrieveForQuestion`) and vault search; `services/doubtPipeline.ts` runs retrieval → generation → gate → routing for new doubts and `/resolve-ai`. `createDoubt` retrieves up to 3 entries covering ≥30% of the question's terms, `aiService.buildPrompt` passes them as `[K1]…` context, and the model returns `usedSources`. `scoreConfidence`: with cited sources, final = 0.75 × model self-rating + 0.25 × best cited match; otherwise the self-rating capped at 90. If the model lists `missingContext`, its self-rating is capped at 60 first. Doubts store `retrievedSources` and `confidenceBreakdown`; vault search uses the same ranking.

**Confidence gate** (`services/routingService.ts`): a final score above `CONFIDENCE_THRESHOLD` (default 70) keeps the doubt `AI_RESOLVED`; otherwise, or when the AI is unavailable, it is assigned (`MENTOR_ESCALATED`) to the top-ranked mentor with an account: rank = 0.6 × BM25 match against specializations/bio/answered doubts + 0.25 × reputation (rating + karma) + 0.15 × online. The decision and top 3 candidates are stored in `doubt.routing`.

### API Surface
See the API Reference table in `README.md`. Tests (`backend/src/tests/`, Jest + supertest) cover only paths that don't need MongoDB.

### TypeScript Conventions
- Strict mode enabled on both frontend and backend tsconfigs.
- No `any` — the `IUser`, `IDoubt`, etc. interfaces in `src/interfaces/` (backend) and `src/types/index.ts` (frontend) are the canonical type contracts.
- Backend imports use `.js` extensions (ESM interop with `tsx`).
