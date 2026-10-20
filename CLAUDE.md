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

Socket.IO (`src/socket/index.ts`) authenticates with the JWT in `handshake.auth.token`; each user joins `user:<id>`. Events: `notification`, `rooms:changed`.

### Authentication
- JWT is signed with `JWT_SECRET` and embeds `{ userId, role }`.
- The `protect` middleware (`src/middlewares/auth.ts`) attaches `req.userId` and `req.userRole` to `AuthRequest`.
- The frontend stores the token in `localStorage` under `hl_token` and the user object under `hl_user`. Both are read on app boot to rehydrate Redux `auth` state (`store/slices/authSlice.ts`).
- On a 401 response, the Axios interceptor (`services/api.ts`) clears localStorage and redirects to `/login`.

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
- **Mentor** — separate from User; seeded mentors have no `userId`. Mentor/faculty users get a linked Mentor doc (`userId`) on register/profile update
- **KnowledgeItem** — verified community answers; tracks upvotes, views, similarityScore (for future RAG)

### API Surface
See the API Reference table in `README.md`. Tests (`backend/src/tests/`, Jest + supertest) cover only paths that don't need MongoDB.

### TypeScript Conventions
- Strict mode enabled on both frontend and backend tsconfigs.
- No `any` — the `IUser`, `IDoubt`, etc. interfaces in `src/interfaces/` (backend) and `src/types/index.ts` (frontend) are the canonical type contracts.
- Backend imports use `.js` extensions (ESM interop with `tsx`).
