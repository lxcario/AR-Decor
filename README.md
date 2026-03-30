# AR Decor

A premium, mobile-first AR commerce prototype for discovering furniture, previewing products in 3D, and routing users into the best available AR experience for their device.

AR Decor is built as a web-first React application with a polished editorial storefront, capability-based AR launch flow, fullscreen WebXR session support on compatible Android devices, and graceful fallback paths for unsupported browsers.

## Status

AR Decor is currently a production-grade frontend foundation with observability, analytics hooks, route-level testing, and dynamic backend wiring points. The biggest remaining product blocker is the asset pipeline: real `.glb` and `.usdz` furniture files are not yet included in the repository, so true end-to-end model placement is still limited.

## Highlights

- Mobile-first storefront with premium editorial layout and motion-driven transitions
- Product detail flow with image gallery, finish selection, and lazy-loaded 3D preview
- Capability-based AR launcher
  - WebXR on supported Android Chrome devices
  - Quick Look on supported Apple environments
  - Scene Viewer fallback on Android
  - Inline 3D preview fallback everywhere else
- WebXR session lifecycle, hit testing, reticle rendering, and capture flow
- Dynamic metadata via `react-helmet-async`
- Supabase client and product hooks for future live catalog integration
- Sentry crash capture and PostHog event tracking scaffolding
- Vitest gateway tests and Playwright funnel coverage

## Tech Stack

- React 19
- Vite 7
- TypeScript 5
- Tailwind CSS v4
- Motion (`motion/react`)
- React Router DOM 7
- Three.js
- `@react-three/fiber`
- `@react-three/drei`
- Supabase JS
- Sentry React SDK
- PostHog JS
- Vitest + Testing Library
- Playwright

## Product Architecture

### Storefront

The storefront lives inside the main application shell and focuses on premium browsing, merchandising, and product discovery.

Routes:
- `/`
- `/products/:slug`
- `/guide`

### Fullscreen AR Route

The AR experience is isolated as a top-level fullscreen route so it does not inherit shell padding or navigation chrome.

Route:
- `/products/:slug/ar`

### Capability Routing

The AR route chooses the best available runtime based on browser and device support:

- `webxr` › immersive AR session on supported Android Chrome devices
- `quicklook` › Apple Quick Look launcher when supported
- `sceneviewer` › Android Scene Viewer handoff
- `inline3d` / `unknown` › inline 3D fallback viewer

## Repository Structure

```text
src/
  app/
    App.tsx
    router.tsx
    routes.ts
  components/
    ARLauncher.tsx
    ARStatusHUD.tsx
    BottomSheet.tsx
    FallbackViewer.tsx
    GlobalErrorBoundary.tsx
    InlineModelViewer.tsx
    PermissionPrompt.tsx
    QuickLookLauncher.tsx
    SceneViewerLauncher.tsx
    WebXRSession.tsx
    layout/
  data/
    ar-products.ts
    categories.ts
    products.json
    products.ts
  hooks/
    useARCapability.ts
    useHitTest.ts
    useProducts.ts
    useSceneStorage.ts
    useTracking.ts
    useWebXRSession.ts
  lib/
    currency.ts
    storage.ts
    supabaseClient.ts
  pages/
    ARPage.tsx
    GuidePage.tsx
    HomePage.tsx
    NotFoundPage.tsx
    ProductDetailPage.tsx
    ProductPage.tsx
  store/
    useAppStore.ts
  styles/
    index.css
    tokens.css
  test/
    setup.ts
tests/
  funnel.spec.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Chrome for local development
- A real Android device with Chrome for WebXR testing

### Install

```bash
npm install
```

### Start the app

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build locally

```bash
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values you need.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
```

Notes:
- Supabase is required only for the Phase 3 live-data hooks.
- Sentry and PostHog both fail gracefully when their keys are omitted.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:unit
npm run test:e2e
npm run test:e2e:list
```

## Testing

### Unit / integration coverage

Vitest currently covers the AR capability gateway to ensure only one runtime branch mounts at a time and that loading states behave correctly.

Run:

```bash
npm run test:unit
```

### End-to-end coverage

Playwright covers the core funnel:
- Home to product navigation
- Inline 3D viewer launch
- AR route navigation and fallback rendering

List tests:

```bash
npm run test:e2e:list
```

Run E2E tests:

```bash
npm run test:e2e
```

## Device Testing Notes

### Android WebXR

For real WebXR testing on Android Chrome, the app must be served from a secure context:
- `localhost` via working USB port forwarding, or
- a real HTTPS deployment

Plain LAN URLs such as `http://192.168.x.x:5173` are useful for checking UI access on-device, but they are not sufficient for immersive WebXR AR.

### Apple Quick Look

Quick Look requires:
- a supported Apple environment
- valid `.usdz` assets
- a real `rel="ar"` launcher path

### Current asset limitation

The repository does **not** currently include real `public/models/*.glb` or `public/models/*.usdz` assets. That means:
- inline 3D preview can render only when valid model URLs are provided
- Quick Look and Scene Viewer cannot complete a real product placement handoff yet
- the current WebXR path still relies on proxy scene geometry rather than true furniture models

## Deployment

AR Decor is a standard Vite static app. Any static host that serves the `dist/` folder over HTTPS is a good fit.

Recommended platforms:
- Cloudflare Pages
- Vercel
- Netlify

Baseline deploy flow:

```bash
npm run build
```

Publish the generated `dist/` directory.

Important:
- HTTPS is required for production AR testing.
- A deployed app without real model assets will still be limited to fallback behavior in several AR paths.

## Observability

### Error Tracking

Sentry is initialized in `src/main.tsx` and wired into the global error boundary in `src/components/GlobalErrorBoundary.tsx`.

### Analytics

PostHog is initialized in `src/hooks/useTracking.ts` and currently tracks `ar_session_launched` from the AR launcher flow.

## Current Limitations

- Real `.glb` / `.usdz` furniture assets are not yet bundled in the repo
- `WebXRSession` still places proxy geometry instead of real product models
- No true cross-session spatial persistence or relocalization
- No backend-authenticated cart or checkout flow yet
- No CMS publishing workflow yet
- Room understanding is surface-based only; there is no full semantic room scanning

## Roadmap Priorities

1. Add a real model pipeline with optimized `.glb` and `.usdz` assets
2. Replace proxy WebXR objects with actual product models
3. Connect live product pages to Supabase-backed content end-to-end
4. Add checkout, favorites, and authenticated user flows
5. Expand observability dashboards and production deployment automation

## Git Identity

This repo is currently configured with:
- Git user: `lxcario`
- Git email: `resquedzn05@gmail.com`

## License

No license file is currently included in this repository.
