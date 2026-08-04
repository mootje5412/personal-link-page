# ViralAI

AI-powered viral content creator PWA. Generate captions, video ideas, scripts, hashtags, and analyze your content — optimized for iPhone Home Screen install.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS 4**
- **Framer Motion** for animations
- **PWA** with service worker, manifest, and Apple touch icons

## Features

- Caption Generator (6 tones)
- Video Idea Generator (20 ideas with viral scores)
- Script Generator (15/30/60 sec)
- Hashtag Generator (trending, niche, low competition, high reach)
- Viral Analyzer (0-100 score with improvements)
- Trends dashboard
- Premium pricing page
- History, favorites, settings
- iOS Add to Home Screen banner
- Haptic feedback
- Offline support via service worker

## Getting Started

```bash
cd viralai
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## OpenAI Integration

Set `OPENAI_API_KEY` in `.env.local` to enable live AI generation. Without it, the app uses realistic placeholder responses.

```env
OPENAI_API_KEY=sk-...
```

## PWA Install

1. Open in Safari on iPhone
2. Tap Share → Add to Home Screen
3. Launch from Home Screen for native app experience

## Build

```bash
npm run build
npm start
```
