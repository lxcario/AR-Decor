# Deployment Guide

AR Decor is a static Vite application. The recommended deployment approach is to build the app and publish the generated `dist/` directory on an HTTPS host.

## Recommended Hosts

- Cloudflare Pages
- Vercel
- Netlify

## Build Command

```bash
npm run build
```

## Output Directory

```text
dist
```

## Required Environment Variables

Create the variables in your hosting dashboard as needed:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
```

If Sentry or PostHog are not configured, the app will still run.

## Why HTTPS Matters

AR Decor includes WebXR flows. Real immersive AR requires a secure context.

Use one of these:

- a real HTTPS deployment
- `localhost` via USB port forwarding during development

Plain LAN URLs such as `http://192.168.x.x:5173` are useful for checking mobile UI access, but they are not sufficient for real WebXR AR sessions.

## Cloudflare Pages

Recommended settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: `20` or newer

After deployment:

- add environment variables in the Pages project settings
- redeploy after adding or changing env vars
- test the `/products/:slug/ar` route on a real Android device over HTTPS

## Vercel

Recommended settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

After deployment:

- configure the same `VITE_*` environment variables
- verify the deployed site serves over HTTPS
- test product pages, the 3D viewer, and the AR route on-device

## Pre-Deploy Checklist

Before publishing:

- run `npm run build`
- ensure `.env` is not committed
- verify `README.md` and `.env.example` are up to date
- confirm no local debug artifacts are included

## Production Caveats

Deployment does not solve the asset pipeline automatically.

The following are still required for a full AR product experience:

- real `.glb` files for inline 3D and Scene Viewer
- real `.usdz` files for Apple Quick Look
- product asset URLs that resolve correctly in production

Without those files, the app will still deploy successfully, but several AR branches will degrade to fallback behavior.

## Suggested Validation After Deploy

1. Open the storefront on mobile and desktop.
2. Verify product detail pages render metadata correctly.
3. Open `View in 3D` and confirm the fallback behavior is stable.
4. Visit `/products/:slug/ar` on Android Chrome.
5. Confirm the app chooses the correct AR branch for the device.
6. Check Sentry and PostHog dashboards if those integrations are enabled.
