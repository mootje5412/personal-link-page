# Nexus OSINT

Professional Open Source Intelligence Platform — premium cybersecurity PWA.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4 + Framer Motion
- React Query + React Router + Axios
- PWA with offline support

## Development

```bash
npm install
npm run dev
```

## Environment

Copy `.env.example` to `.env.local`:

```env
VITE_API_URL=https://your-api.com
VITE_API_KEY=your-key
```

Without API config, mock data is used.

## Deploy

```bash
./deploy.sh
```

Deploys to `109.71.252.128` via SSH.

## PWA Install (iPhone)

Open in Safari → Share → Add to Home Screen
