# Geoloca

A mobile-friendly **Progressive Web App (PWA)** that lets you pick any location on a map and use it as your spoofed GPS position inside the app.

## Features

- Interactive OpenStreetMap map — tap or drag to place your pin
- Search cities, addresses, and places
- Apply / stop location spoofing
- Copy coordinates to clipboard
- Install to Home Screen (Android & iOS)
- Remembers your last location between sessions

## Quick start

```bash
cd geoloca
npm install
npm run dev
```

Open `http://localhost:5174` on your phone (same Wi‑Fi) or desktop.

## Build for production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, etc.).

## Install on Home Screen

**Android (Chrome):** Open the site → menu → **Install app** / **Add to Home screen**

**iPhone (Safari):** Share → **Add to Home Screen**

## Note

Geoloca overrides the browser geolocation API **inside this app only**. It cannot change GPS for other native apps on your phone — that requires system-level mock location settings.
