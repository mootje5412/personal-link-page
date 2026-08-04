# Loop — TikTok-style PWA

A short-video app built with **React**, **TypeScript**, **Vite**, and a **SQLite** backend. Designed for iPhone — add it to your Home Screen for a native app feel.

## Features

- **For You feed** — full-screen vertical videos with swipe navigation
- **Discover** — browse trending clips in a grid
- **Account system** — register, log in, JWT sessions
- **Profiles** — username, display name, bio, avatar, stats
- **Social** — like videos, follow creators
- **PWA** — installable on iPhone via Safari → Share → Add to Home Screen

## Quick start

```bash
# Install dependencies
npm install
npm install --prefix server

# Run API + frontend
npm run dev:all

# Or separately:
npm run dev:server   # API on http://localhost:3001
npm run dev          # App on http://localhost:5173
```

## iPhone Home Screen

1. Open the app in **Safari** on your iPhone
2. Tap **Share** → **Add to Home Screen**
3. Launch **Loop** from your home screen — full-screen, no browser chrome

## Tech stack

| Layer    | Stack                                      |
|----------|--------------------------------------------|
| Frontend | React 18, TypeScript, Vite, React Router   |
| Backend  | Express, SQLite (better-sqlite3), bcrypt   |
| Auth     | JWT (30-day sessions)                      |
| PWA      | vite-plugin-pwa, service worker, manifest  |

## API

| Method | Endpoint                    | Description        |
|--------|-----------------------------|--------------------|
| POST   | `/api/auth/register`        | Create account     |
| POST   | `/api/auth/login`           | Log in             |
| GET    | `/api/auth/me`              | Current user       |
| PATCH  | `/api/auth/profile`         | Update profile     |
| GET    | `/api/videos/feed`          | For You feed       |
| GET    | `/api/users/:username`      | User profile       |
| POST   | `/api/videos/:id/like`      | Toggle like        |
| POST   | `/api/users/:username/follow` | Toggle follow    |

User data is stored in `server/data/loop.db`.

## Build

```bash
npm run build
npm run preview
```
