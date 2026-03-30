# MASTER_PROMPT.md
# AR Decor — Web-First Implementation
# Target: Codex / ChatGPT 5.4
# Stack: React 19 + Vite + Tailwind v4 + three + @react-three/fiber + @react-three/drei

---

## HOW TO USE THIS PROMPT

**Do not execute any tasks yet.**
Read this entire document, then reply only with: "Ready. Awaiting task instruction."
I will then prompt you with "Execute Task 0", "Execute Task 1", etc., one at a time.
Do not proceed to the next task until I ask.

When executing a task:
- Output only the files listed in that task's `## OUTPUT` block.
- Do not modify files outside the listed outputs unless the task explicitly says so.
- Do not skip ahead. Each task depends on the previous.
- If a decision is ambiguous, use the type contracts in TASK 1 as the source of truth.
- Everything under `## OUT OF SCOPE` must not appear in any generated code.

---

## REPO SHAPE (existing)

```
src/
  components/
  hooks/
  pages/
  types/
    app.ts          ← extend this in TASK 1, do not replace it
  lib/
  assets/
  styles/
public/
  models/           ← .glb and .usdz files live here
  posters/          ← product poster images live here
index.html
vite.config.ts
tailwind.config.ts
```

---

## EXISTING ROUTE TO REPLACE

`src/app/router.tsx` currently renders `ARViewPage` at `/products/:slug/ar`.
Replace that import and route with `ARPage` from `src/pages/ARPage.tsx`.
Do not modify any other routes.

---

## TASK 0 — Seed data

Create one fully-specified product entry that satisfies the asset contract defined in TASK 1.
All other tasks will import from this file. Do not use placeholder strings like `"TODO"` or `"/path/to/model"`.

### OUTPUT

**`src/data/products.json`**

```json
[
  {
    "id": "arc-lounge-001",
    "slug": "arc-lounge-chair",
    "name": "Arc Lounge Chair",
    "brand": "Forma Studio",
    "price": 1290,
    "currency": "USD",
    "description": "A low-profile lounge chair with an oak frame and boucle upholstery. Designed for corner placement.",
    "tags": ["seating", "lounge", "oak", "boucle"],
    "assets": {
      "modelGlb": "/models/arc-lounge-chair.glb",
      "modelUsdz": "/models/arc-lounge-chair.usdz",
      "poster": "/posters/arc-lounge-chair.webp",
      "images": [
        "/posters/arc-lounge-chair.webp",
        "/posters/arc-lounge-chair-side.webp"
      ]
    },
    "dimensionsMeters": {
      "width": 0.82,
      "depth": 0.88,
      "height": 0.74
    },
    "placement": {
      "surface": "floor",
      "defaultScale": 1.0,
      "allowRotate": true,
      "allowScale": false
    }
  }
]
```

> NOTE: The `.glb` and `.usdz` files do not need to exist yet. All 3D components must handle a missing/loading model gracefully using the `poster` image as a fallback.

---

## TASK 1 — Types

Extend `src/types/app.ts`. Do not delete any existing types. Only add the types below.

### OUTPUT

**`src/types/app.ts`** — append only

```ts
// ─── Asset Contract ───────────────────────────────────────────────

export interface ProductAssets {
  modelGlb: string;
  modelUsdz: string;
  poster: string;
  images: string[];
}

export interface ProductDimensions {
  width: number;   // meters
  depth: number;   // meters
  height: number;  // meters
}

export interface ProductPlacement {
  surface: 'floor' | 'wall' | 'tabletop';
  defaultScale: number;
  allowRotate: boolean;
  allowScale: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  tags: string[];
  assets: ProductAssets;
  dimensionsMeters: ProductDimensions;
  placement: ProductPlacement;
}

// ─── AR Capability ────────────────────────────────────────────────

export type ARCapabilityLevel =
  | 'webxr'        // Android Chrome, secure context, immersive-ar supported
  | 'quicklook'    // iOS Safari, can open usdz via anchor[rel=ar]
  | 'sceneviewer'  // Android without WebXR, can fire Scene Viewer intent
  | 'inline3d'     // Anything else: show three.js viewer, no camera AR
  | 'unknown';     // Detection not yet run

export interface ARCapability {
  level: ARCapabilityLevel;
  isSecureContext: boolean;
  hasCamera: boolean;
  webxrSessionTypes: string[];  // from xr.isSessionSupported checks
}

// ─── Tracking & Session ───────────────────────────────────────────

export type TrackingState =
  | 'idle'
  | 'requesting_permission'
  | 'scanning'
  | 'surface_found'
  | 'placing'
  | 'refining'
  | 'limited'
  | 'lost'
  | 'fallback';

export interface PlacedObject {
  instanceId: string;       // uuid
  productId: string;
  anchorId?: string;        // XRAnchor id if available
  transform: {
    positionMeters: [number, number, number];
    rotationY: number;      // radians
    scale: number;
  };
  persistedAt: number;      // Date.now()
}

// ─── UI State ─────────────────────────────────────────────────────

export type ARMode =
  | 'scanning'
  | 'previewing'
  | 'placing'
  | 'editing'
  | 'capturing'
  | 'fallback';

export interface CaptureState {
  isCapturing: boolean;
  lastCaptureDataUrl: string | null;
  error: string | null;
}

export interface InspectorState {
  isOpen: boolean;
  targetInstanceId: string | null;
}
```

---

## TASK 2 — Capability detection hook

Create `src/hooks/useARCapability.ts`.

### DETECTION LOGIC (implement exactly this, in this order)

```
function detectCapability(): Promise<ARCapability>

  isSecureContext = window.isSecureContext

  hasCamera = false
  try:
    devices = await navigator.mediaDevices.enumerateDevices()
    hasCamera = devices.some(d => d.kind === 'videoinput')
  catch:
    hasCamera = false

  webxrSessionTypes = []
  if window.XRSystem exists AND isSecureContext:
    for each type in ['immersive-ar', 'immersive-vr']:
      try:
        supported = await navigator.xr.isSessionSupported(type)
        if supported: push type to webxrSessionTypes
      catch:
        continue

  // Determine level
  if 'immersive-ar' in webxrSessionTypes:
    level = 'webxr'

  else if iOS Safari:
    // detect: /iP(hone|ad|od)/.test(navigator.userAgent) AND /Safari/.test(navigator.userAgent)
    level = 'quicklook'

  else if Android:
    // detect: /Android/.test(navigator.userAgent)
    level = 'sceneviewer'

  else:
    level = 'inline3d'

  return { level, isSecureContext, hasCamera, webxrSessionTypes }
```

### OUTPUT

**`src/hooks/useARCapability.ts`**

- Run detection once on mount.
- Return `{ capability: ARCapability | null, isDetecting: boolean }`.
- While detecting, `capability` is `null` and `isDetecting` is `true`.
- Never throw. Catch all errors and fall back to `level: 'inline3d'`.

---

## TASK 3 — Design tokens

### OUTPUT

**`src/styles/tokens.css`**

Define CSS custom properties and the Tailwind v4 `@theme` block in a single file.
In Tailwind v4, `tailwind.config.ts` is not used — all theme configuration lives in CSS via `@theme`.

```css
@import "tailwindcss";

@theme {
  /* Surfaces */
  --color-surface-base: #ffffff;
  --color-surface-raised: #f5f5f4;
  --color-surface-overlay: rgba(0, 0, 0, 0.48);
  --color-surface-ar-hud: rgba(15, 15, 15, 0.72);

  /* Content */
  --color-content-primary: #0f0f0f;
  --color-content-secondary: #6b7280;
  --color-content-inverse: #ffffff;
  --color-content-disabled: #d1d5db;

  /* Brand */
  --color-brand-primary: #1a1a1a;
  --color-brand-accent: #b5a48b;

  /* Status */
  --color-status-success: #16a34a;
  --color-status-warning: #d97706;
  --color-status-error: #dc2626;
  --color-status-info: #2563eb;

  /* Reticle (runtime-only, not Tailwind utilities) */
  --color-reticle-idle: rgba(255, 255, 255, 0.6);
  --color-reticle-ready: rgba(181, 164, 139, 1);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  /* Spacing scale (base 4px) */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;

  /* Typography */
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 15px;
  --font-size-lg: 17px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;

  /* Motion */
  --duration-fast: 120ms;
  --duration-base: 220ms;
  --duration-slow: 380ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0, 0, 0.2, 1);

  /* Z-index layers (runtime-only, not Tailwind utilities) */
  --z-base: 0;
  --z-raised: 10;
  --z-overlay: 100;
  --z-sheet: 200;
  --z-hud: 300;
  --z-modal: 400;
  --z-toast: 500;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-surface-base: #0f0f0f;
    --color-surface-raised: #1c1c1c;
    --color-content-primary: #f5f5f4;
    --color-content-secondary: #9ca3af;
    --color-brand-primary: #f5f5f4;
  }
}

@media (prefers-reduced-motion: reduce) {
  @theme {
    --duration-fast: 0ms;
    --duration-base: 0ms;
    --duration-slow: 0ms;
  }
}
```

> NOTE: Do not create `tailwind.config.ts`. In Tailwind v4, all theme values are declared in `@theme` above. Tailwind utilities like `bg-surface-base`, `text-content-primary`, `rounded-md` are automatically available from the `@theme` declarations.

---

## TASK 4 — Shared UI components

Create these components. Each must be standalone — no inter-component imports except from `src/types/app.ts`.

### OUTPUT

**`src/components/BottomSheet.tsx`**

Props:
```ts
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: ('half' | 'full');  // default 'half'
}
```
- Renders a sheet that slides up from the bottom.
- Traps focus when open. Returns focus to trigger on close.
- Backdrop click calls `onClose`.
- Uses `--z-sheet`, `--color-surface-raised`, `--radius-lg` tokens.
- Reduced-motion: skip slide animation, appear instantly.

**`src/components/ARStatusHUD.tsx`**

Props:
```ts
interface ARStatusHUDProps {
  trackingState: TrackingState;
  placedCount: number;
}
```
- Renders a single line of guidance text based on `trackingState`:
  - `scanning` → "Move your phone slowly to find a surface"
  - `surface_found` → "Tap to place"
  - `placing` → "Tap to confirm placement"
  - `limited` → "Move to a better-lit area"
  - `lost` → "Tracking lost — move slowly"
  - All others → no text rendered
- Uses `--color-surface-ar-hud`, `--color-content-inverse` tokens.
- Fixed to top-center of viewport. `z-index: var(--z-hud)`.

**`src/components/PermissionPrompt.tsx`**

Props:
```ts
interface PermissionPromptProps {
  reason: 'camera' | 'insecure_context' | 'webxr_unavailable';
  onRetry?: () => void;
}
```
- Renders a full-screen overlay explaining why AR is unavailable.
- For `camera`: show camera icon, explain permission, show retry button if `onRetry` provided.
- For `insecure_context`: explain HTTPS requirement, no retry.
- For `webxr_unavailable`: explain browser requirement, show link to supported browsers.
- Uses `--color-surface-base`, `--color-content-primary` tokens.

**`src/components/CatalogCard.tsx`**

Props:
```ts
interface CatalogCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  isSelected?: boolean;
}
```
- Shows poster image, name, brand, price.
- Tappable. `isSelected` shows a brand-accent border.
- Lazy-loads image.

---

## TASK 5 — Inline 3D viewer

Create a three.js viewer used when `capability.level === 'inline3d'`.
This is the fallback experience — no camera, no AR, just an inspectable 3D model.

### OUTPUT

**`src/components/InlineModelViewer.tsx`**

Props:
```ts
interface InlineModelViewerProps {
  product: Product;
  className?: string;
}
```

- Use `@react-three/fiber` Canvas with `@react-three/drei` OrbitControls, useGLTF, Suspense, and Environment.
- Load `product.assets.modelGlb` via `useGLTF`.
- Wrap the `useGLTF` call in a React `ErrorBoundary` component defined in the same file. If `useGLTF` throws for any reason (404, parse error, empty string), the `ErrorBoundary` must catch it and render the poster image fallback with a "3D preview unavailable" label — the app must not crash.
- While loading (inside `Suspense`), show `product.assets.poster` as a centered image fallback.
- Auto-rotate until the user interacts.
- Lighting: `Environment preset="apartment"` plus one directional light.
- Camera: position based on `product.dimensionsMeters` so the object fills ~70% of the viewport.
- No UI chrome inside this component — it renders only the canvas.

---

## TASK 6 — AR launcher (capability gateway)

This component is the entry point for `/products/:slug/ar`.
It reads capability and routes to the correct experience.

### OUTPUT

**`src/components/ARLauncher.tsx`**

Props:
```ts
interface ARLauncherProps {
  product: Product;
}
```

Implement exactly this routing logic:

```
if isDetecting:
  render full-screen spinner

if capability.level === 'webxr':
  render <WebXRSession product={product} />

if capability.level === 'quicklook':
  render <QuickLookLauncher product={product} />

if capability.level === 'sceneviewer':
  render <SceneViewerLauncher product={product} />

if capability.level === 'inline3d' or 'unknown':
  render <FallbackViewer product={product} />
```

> IMPORTANT: While `isDetecting` is true, render a full-screen centered
> spinner only. Do not render any branch component yet. The spinner must
> not unmount and remount when detection resolves - use conditional
> rendering inside a stable parent, not early returns that change the
> component tree shape.

Do not merge any two branches. Each branch renders a different component defined in tasks 7–10.

---

## TASK 7 — Quick Look launcher (iOS)

### OUTPUT

**`src/components/QuickLookLauncher.tsx`**

Props: `{ product: Product }`

- Render a full-screen poster image of the product.
- Overlay a prominent "View in Your Room" button.
- On button press, trigger Quick Look by programmatically clicking a hidden `<a>` element:
  ```html
  <a
    href="{product.assets.modelUsdz}"
    rel="ar"
    style="display:none"
  >
    <img src="{product.assets.poster}" />
  </a>
  ```
- If the `.usdz` asset is missing (empty string), show `<PermissionPrompt reason="webxr_unavailable" />` with a message that the AR model is not yet available.
- Show product name, dimensions (formatted as `W × D × H cm`), and brand below the poster.

---

## TASK 8 — Scene Viewer launcher (Android fallback)

### OUTPUT

**`src/components/SceneViewerLauncher.tsx`**

Props: `{ product: Product }`

- Build a Scene Viewer intent URL with this exact template:
  ```
  intent://arvr.google.com/scene-viewer/1.0
    ?file={absoluteGlbUrl}
    &mode=ar_preferred
    &title={product.name}
  #Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;
  ```
  Where `absoluteGlbUrl` = `window.location.origin + product.assets.modelGlb`

- Render a full-screen poster + "View in Your Room" button.
- On button press, set `window.location.href` to the intent URL.
- If the browser does not support the intent (catch via a 500ms timeout checking if the page is still visible), show a toast: "Scene Viewer not available on this device" and fall back to rendering `<InlineModelViewer product={product} />`.

---

## TASK 9 — Fallback 3D viewer page

### OUTPUT

**`src/components/FallbackViewer.tsx`**

Props: `{ product: Product }`

- Full-page layout:
  - Top: product name, brand, close/back button.
  - Center: `<InlineModelViewer product={product} />` filling available height.
  - Bottom: dimensions display + "AR not available on this browser" banner using `--color-status-info` token.
- The banner must include a brief explanation. Use this exact copy:
  > "Augmented reality requires Chrome on Android or Safari on iPhone. You're viewing an interactive 3D preview instead."

---

## TASK 10 — WebXR session (Android Chrome)

This is the full AR experience. It is the most complex task. Build it in layers — do not try to do everything in one component.

### OUTPUT

### GUARDS — read before writing any Task 10 code

These rules override any conflicting pattern you might infer from the rest of the task.
Violating any of these will cause silent failures that only appear on a real device.

---

**GUARD 1 — Never call setState inside the XR frame loop**

The XR requestAnimationFrame callback runs at 60–90fps.
Calling any React setState inside it will queue 60+ renders per second and crash the session.

The rule is absolute:
- Inside the XR frame callback: write to refs only (hitPose ref, reticle matrix ref, etc.)
- React setState: call only from discrete user events (tap, button press) or session lifecycle events (session start, session end, tracking state change from XRFrame.getViewerPose)

Correct pattern:
```ts
// In the XR frame loop — refs only
hitPoseRef.current = getHitPose(frame, hitTestSource);

// In a tap handler — setState allowed
const handleTap = () => {
  if (hitPoseRef.current) {
    setARMode('placing');
    setPlacedObject(buildPlacedObject(hitPoseRef.current));
  }
};
```

Incorrect pattern (do not do this):
```ts
// WRONG — setState inside frame loop
session.requestAnimationFrame((time, frame) => {
  const pose = getHitPose(frame, hitTestSource);
  setHitPose(pose); // ← causes 60+ renders/sec
});
```

---

**GUARD 2 — Call session.end() on component unmount**

If the WebXRSession component unmounts while a session is active (e.g. user navigates back),
session.end() must be called in the useEffect cleanup function.

If it is not called:
- The camera stays open
- The browser holds the XR lock
- The next AR launch fails with "InvalidStateError: Session already exists"

Required pattern in useWebXRSession.ts:
```ts
useEffect(() => {
  return () => {
    if (sessionRef.current && sessionRef.current.visibilityState !== 'hidden') {
      sessionRef.current.end().catch(() => {
        // session may already be ending — ignore
      });
    }
  };
}, []);
```

Also attach session.addEventListener('end', resetState) so that if the OS ends the session
(incoming call, app switch, permission revoked), the hook resets cleanly without a stale ref.

---

**GUARD 3 — Cancel the hit test source on session end**

XRSession.requestHitTestSource() returns an XRHitTestSource that must be cancelled
when the session ends. If it is not cancelled, it leaks across sessions.

Required pattern in useHitTest.ts:
```ts
useEffect(() => {
  if (!session || !referenceSpace) return;

  let hitTestSource: XRHitTestSource | null = null;

  session.requestHitTestSource({ space: viewerSpace })
    .then(source => { hitTestSource = source; })
    .catch(() => {});

  return () => {
    hitTestSource?.cancel();
    hitTestSource = null;
  };
}, [session, referenceSpace]);
```

Do not call hitTestSource.cancel() inside the frame loop.
Call it only in the useEffect cleanup.

---

**GUARD 4 — anchors is optional, not required**

The prompt specifies requiredFeatures: ['hit-test', 'anchors'].
The anchors API is not supported on all WebXR-capable Android devices.
Listing it as a required feature will cause requestSession to reject on those devices.

Use this instead:
```ts
navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['hit-test'],
  optionalFeatures: ['anchors', 'dom-overlay'],
});
```

If anchors is available, use it. If not, store transform data only in local state.
Do not make PlacedObject persistence depend on anchors being present.


**`src/hooks/useWebXRSession.ts`**

Manages the XRSession lifecycle.

```ts
interface UseWebXRSessionReturn {
  session: XRSession | null;
  trackingState: TrackingState;
  startSession: () => Promise<void>;
  endSession: () => void;
  error: string | null;
}
```

- `startSession`: calls `navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test', 'anchors'] })`.
- On permission denied error: set `trackingState = 'fallback'` and `error = 'camera_denied'`.
- On any other error: set `trackingState = 'fallback'` and `error = 'session_failed'`.
- Attach `session.addEventListener('end', ...)` to reset state on unexpected session end.

**`src/hooks/useHitTest.ts`**

```ts
interface UseHitTestReturn {
  hitPose: XRPose | null;   // null when no surface detected
  isTracking: boolean;
}
```

- Takes `session: XRSession | null` and `referenceSpace: XRReferenceSpace | null`.
- Runs hit test against `viewer` space on each XR frame.
- Returns the first hit result's pose, or `null` if no hits.

**`src/components/WebXRSession.tsx`**

Props: `{ product: Product }`

Modes and the exact UI rendered in each:

| Mode | Top bar | Bottom |
|------|---------|--------|
| `scanning` | Exit · "Finding surface…" | — |
| `surface_found` | Exit · Product name | Tap to place (ghost CTA) |
| `placing` | Exit · Product name | Confirm · Cancel |
| `editing` | Exit · Product name | Done · Delete · Capture |
| `capturing` | Exit · — | — (brief flash overlay) |
| `fallback` | Exit | `<PermissionPrompt reason={error} />` |

Rules:
- Only one primary action button visible at a time.
- `<ARStatusHUD>` always rendered, reads from current `trackingState`.
- Reticle: render a flat ring in the XR scene at the hit pose position. Use `--color-reticle-idle` when scanning, `--color-reticle-ready` when surface found.
- On tap when `surface_found`: place a `PlacedObject`, switch to `placing` mode.
- On Confirm: switch to `editing` mode. Record to local state.
- On Done: switch to `scanning` mode (allow placing another object).
- On Delete: remove `PlacedObject` from scene and state.
- On Capture: use `session.requestAnimationFrame` to extract the current frame as a canvas snapshot, store as `CaptureState.lastCaptureDataUrl`, briefly show a flash overlay, switch back to `editing`.

---

## TASK 11 — Route and page

### OUTPUT

**`src/pages/ARPage.tsx`**

- Route: `/products/:slug/ar`
- Read `slug` from params.
- Find product in `src/data/products.json` by `slug`.
- If product not found: render a centered "Product not found" message with a back link.
- If found: render `<ARLauncher product={product} />`.
- This page renders with no header, no footer, no padding. Full viewport.

**`src/pages/ProductPage.tsx`**

- Route: `/products/:slug`
- Shows product images, name, brand, price, description, dimensions.
- Primary CTA: "View in Your Room" button → navigates to `/products/:slug/ar`.
- Secondary CTA: "View in 3D" → opens `<InlineModelViewer>` in a `<BottomSheet>`.

---

## TASK 12 — Local scene persistence

### OUTPUT

> IMPORTANT for Task 12: Every localStorage access - getItem, setItem,
> removeItem - must be individually wrapped in try/catch. In iOS private
> browsing, even getItem throws SecurityError. A single top-level try/catch
> around the whole hook is not sufficient. On any storage error,
> silently fall back to the in-memory state and continue.

**`src/hooks/useSceneStorage.ts`**

```ts
interface UseSceneStorageReturn {
  savedObjects: PlacedObject[];
  saveObject: (obj: PlacedObject) => void;
  removeObject: (instanceId: string) => void;
  clearScene: () => void;
}
```

- Storage key: `ar_decor_scene_v1`
- Uses `localStorage`.
- On mount, read and parse the stored value. If parse fails, start with `[]`.
- `saveObject`: upsert by `instanceId`.
- `removeObject`: filter out by `instanceId`.
- `clearScene`: delete the localStorage key and reset to `[]`.
- This hook stores *scene intent* only — position and product ID. It does not attempt world relocalization. On next session load, placed objects are shown in the inline 3D fallback viewer only, not re-anchored in AR.

---

## ACCEPTANCE CRITERIA

Each task is done when all of the following pass:

**TASK 0** — `products.json` imports without TypeScript error against the `Product` type from TASK 1.

**TASK 1** — No existing types in `app.ts` were deleted or renamed.

**TASK 2** — `useARCapability` returns `isDetecting: true` on first render, then resolves to a non-null `capability`. Never throws. Returns `level: 'inline3d'` in a jsdom/test environment.

**TASK 3** — No `tailwind.config.ts` was created. All Tailwind utility classes referencing `surface-*`, `content-*`, `brand-*`, `status-*` resolve to the `@theme` declarations in `tokens.css`. Dark mode and reduced-motion overrides use `@theme` blocks, not `:root` selectors.

**TASK 4** — `BottomSheet` traps focus when `isOpen: true`. `ARStatusHUD` renders no DOM node when `trackingState` is not a guidance state. `PermissionPrompt` renders for all three `reason` values without error.

**TASK 5** — `InlineModelViewer` renders poster image while model loads. `ErrorBoundary` catches `useGLTF` errors and renders poster fallback without crashing. Does not throw if `modelGlb` is an empty string.

**TASK 6** — `ARLauncher` renders exactly one of the four branch components. Changing `capability.level` renders the correct branch without a full remount of `ARLauncher`.

**TASK 7** — `QuickLookLauncher` renders `PermissionPrompt` when `modelUsdz` is empty string.

**TASK 8** — `SceneViewerLauncher` falls back to `InlineModelViewer` when intent navigation fails.

**TASK 9** — `FallbackViewer` renders the exact copy string specified. Does not render any AR entry point or button.

**TASK 10** — WebXR components do not import `window.XRSession` directly — all XR types are imported from `@types/webxr`. Mode transitions follow the table exactly. No two primary action buttons are rendered simultaneously.

**TASK 11** — `ARPage` renders "Product not found" for an unknown slug. `ProductPage` navigates to the AR route on CTA press.

**TASK 12** — `useSceneStorage` does not throw when localStorage is unavailable (e.g., in private browsing). Returns `[]` on parse failure.

---

## OUT OF SCOPE

Do not generate any of the following. If a task description seems to imply them, it does not.

- React Native, Expo, or any native bridge code
- ARKit or ARCore native SDK calls
- Any backend, API route, database, or server-side code
- Multi-user sync or shared AR sessions
- Video capture (screenshot only)
- Cross-session world relocalization (saved objects are scene intent only)
- WebXR anchors persistence across sessions
- Storybook setup or story files
- Analytics implementation (event schema may be mentioned in comments only)
- Authentication or user accounts
- E-commerce cart or checkout
- Any file not listed in a task's `## OUTPUT` block

---

## DEPENDENCY REFERENCE

These packages are assumed to be installed. Do not add others without noting it explicitly.

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^6.0.0",
  "three": "^0.165.0",
  "@react-three/fiber": "^8.0.0",
  "@react-three/drei": "^9.0.0",
  "@types/webxr": "^0.5.0",
  "tailwindcss": "^4.0.0",
  "vite": "^5.0.0"
}
```

---

*End of MASTER_PROMPT.md*

