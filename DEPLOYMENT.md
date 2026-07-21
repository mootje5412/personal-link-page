# Deployment Guide for BreachBase.xyz

This site is built with React + TypeScript + Vite and can be easily deployed to various platforms.

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. Push this code to GitHub (already done ✅)
2. Go to [vercel.com](https://vercel.com)
3. Sign up/login with your GitHub account
4. Click "New Project"
5. Import the `personal-link-page` repository
6. Select the branch: `cursor/breachbase-landing-ca3c`
7. Click "Deploy"

That's it! Vercel will automatically build and deploy your site. You'll get a live URL instantly.

### Option 2: Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up/login with GitHub
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select the repository
5. Select branch: `cursor/breachbase-landing-ca3c`
6. Build settings are auto-detected from `netlify.toml`
7. Click "Deploy"

Your site will be live in minutes!

### Option 3: GitHub Pages

```bash
npm run build
# Then use GitHub Pages to serve the dist/ folder
```

### Option 4: Cloudflare Pages

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub account
3. Select the repository
4. Build command: `npm run build`
5. Output directory: `dist`
6. Deploy!

## Custom Domain Setup

After deploying to any platform above, you can add your custom domain `breachbase.xyz`:

1. In your hosting platform dashboard, go to Domain Settings
2. Add custom domain: `breachbase.xyz`
3. Follow the DNS configuration instructions
4. Add the provided DNS records to your domain registrar

## Build Locally

```bash
npm install
npm run build
```

The production build will be in the `dist/` folder.

## Environment

- Node.js 18+
- No environment variables needed for the landing page
- All features work client-side only

---

**The site is ready to deploy! Just connect your GitHub to Vercel or Netlify and you'll have a live URL in minutes.**
