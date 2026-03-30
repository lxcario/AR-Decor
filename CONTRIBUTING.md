# Contributing to AR Decor

Thanks for contributing to AR Decor.

This project is a web-first AR commerce experience built with React, Vite, Tailwind CSS v4, Three.js, WebXR, and a capability-based AR launcher. The codebase is optimized for a premium mobile UX, so changes should preserve both product polish and runtime reliability.

## Ground Rules

- Keep the app mobile-first.
- Preserve the existing visual direction: warm editorial surfaces, dark-neutral contrast, rounded geometry, and premium spacing.
- Do not revert unrelated changes in the working tree.
- Prefer small, reviewable changes over broad refactors.
- Keep TypeScript strict and avoid `any` unless there is a strong reason.

## Prerequisites

- Node.js 20+
- npm 10+
- Chrome for local browser testing
- An Android device with Chrome for real WebXR validation

## Local Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Preview the production build:

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

If analytics or error tracking keys are omitted, the app should continue to run gracefully.

## Testing

Unit and integration tests:

```bash
npm run test:unit
```

End-to-end tests:

```bash
npm run test:e2e
```

List Playwright tests:

```bash
npm run test:e2e:list
```

Before opening a PR, at minimum:

- run `npm run build`
- run `npm run test:unit` for logic changes
- run `npm run test:e2e` for funnel, routing, or AR entry changes when practical

## Branching and Commits

- Prefer feature branches using the `codex/` prefix when creating branches from this workspace.
- Use clear, descriptive commit messages.
- Keep PRs focused on one change set where possible.

Examples:

- `codex/fix-ar-capability-detection`
- `codex/add-supabase-product-hooks`
- `codex/docs-readme-contributing`

## Code Style

### React and TypeScript

- Use functional components by default.
- Use class components only where React error boundaries require them.
- Prefer explicit interfaces for public props and shared state.
- Keep render logic readable; extract helpers when a component grows too dense.

### Styling

- Prefer Tailwind utilities backed by the existing token system.
- Reuse the CSS variables and semantic tokens already defined in `src/styles/tokens.css`.
- Avoid introducing generic component-library aesthetics that break the current brand direction.

### AR and 3D Code

- Keep frame-loop work out of React state updates.
- Do not call React state setters from XR animation loops unless the update is truly discrete.
- Preserve capability-based degradation: WebXR, Quick Look, Scene Viewer, then inline 3D fallback.
- Treat missing `.glb` / `.usdz` assets as a first-class failure mode.

## Data and Backend Notes

- The repo currently has both storefront product data and AR-specific product data.
- Supabase hooks were added in Phase 3, but the live product pages are not fully migrated yet.
- Do not assume real production assets exist in `public/models/` unless they have been added explicitly.

## Documentation Expectations

If you add or change a major feature, update the relevant docs:

- `README.md` for user-facing setup or architecture changes
- `DEPLOYMENT.md` for hosting or environment changes
- `.env.example` when new environment variables are introduced

## Pull Request Checklist

Before submitting:

- confirm the app builds
- verify no unrelated generated files are included
- update docs when behavior changes
- note any known limitations or device-specific caveats in the PR description

## Known Product Caveats

At the current stage of the project:

- real `.glb` and `.usdz` furniture assets are not yet bundled in the repo
- the WebXR experience still relies on proxy objects rather than final product models
- full room understanding is not implemented; AR is surface-based, not semantic scene understanding

Contributions that improve these areas are especially valuable.
