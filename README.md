# Client Hub — track your project in real-time

Public dashboard + per-client portal + magic-link auth + Telegram bot integration.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind + Framer Motion**. Zero external DB — JSON files as MVP store.

## Features

- **Public dashboard** (`/`) — active projects, completed projects, recent updates, stats, CTA
- **Magic-link login** (`/login`) — mock email-only auth, any email works in MVP
- **Per-client portal** (`/portal/[projectId]`) — timeline, progress, stack, post updates
- **Agent console** (`/agent-console`) — markdown editor with live preview, publishes to API
- **Admin dashboard** (`/admin`) — full project list + recent activity stream
- **Telegram bot** (`/api/telegram`) — mock webhook endpoint, logs notifications
- **Light/dark theme** with `next-themes`
- **Mobile-first** responsive design with Framer Motion animations

## Stack

- Next.js 14.2.18 (App Router)
- TypeScript 5.6
- Tailwind CSS 3.4
- Framer Motion 11
- Lucide React icons
- `next-themes` for theme switching
- `marked` for markdown rendering

## Mock Data

- 2 active projects (`iron-master`, `spa-canada`)
- 1 completed project (`vlob-landing`)
- 7 mock comments across active projects

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production build
```

## Deploy

Deployed on Vercel. Push to `main` triggers automatic deploy.

## Project Structure

```
app/
├── page.tsx                # Public dashboard
├── layout.tsx              # Theme + Nav + Footer
├── globals.css
├── login/page.tsx          # Magic link form
├── portal/[projectId]/     # Per-client portal
├── agent-console/          # Markdown editor
├── admin/                  # Admin overview
└── api/
    ├── auth/               # Magic link generation + cookie
    ├── comments/           # CRUD
    ├── projects/           # List/get
    └── telegram/           # Bot webhook (mock)
components/
├── nav.tsx, footer.tsx
├── theme-provider.tsx, theme-toggle.tsx
├── ui/                     # Card, Badge, Reveal
└── sections/               # Hero, Stats, ActiveProjects, etc.
lib/
├── projects.ts, comments.ts, sessions.ts, telegram.ts
├── utils.ts, types.ts
data/
├── projects.json, comments.json, sessions.json
```

## API

### `POST /api/auth`
```json
{ "email": "client@iron-master.example" }
```
Returns `{ projectId, magicLink }` and sets `ch_session` cookie.

### `POST /api/comments`
```json
{ "projectId": "iron-master", "type": "milestone", "message": "Booking form done", "author": "Agent" }
```
Writes to `data/comments.json` + fires Telegram notification.

### `GET /api/projects` — list all projects
### `GET /api/projects?status=active` — filter
### `GET /api/projects?id=iron-master` — single

### `POST /api/telegram` — mock webhook handler

## Auth Flow (MVP)

1. User enters email on `/login`
2. POST `/api/auth` creates session in `data/sessions.json` + sets cookie
3. Redirects to `/portal/{projectId}`
4. Portal layout verifies cookie; redirects to `/login` if missing

## Real Email / Telegram (v2)

Wire these env vars to upgrade:

```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
RESEND_API_KEY=...   # or any email provider
```

See `lib/telegram.ts` and `app/api/auth/route.ts` for integration points.

## License

MIT — by [Mykhailo Zhuk](https://zhuk.dev)
