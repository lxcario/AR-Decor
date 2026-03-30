# PIPELINE_PROMPT.md
# AR Decor — Amazon PA API + Depth Map 3D Model Pipeline
# Target: Codex / ChatGPT 5.4
# Stack: Node.js (Hono) + Python (Depth Anything V2) + Supabase + React frontend hook

---

## HOW TO USE THIS PROMPT

**Do not execute any tasks yet.**
Read this entire document, then reply only with: "Ready. Awaiting task instruction."
I will then prompt you with "Execute Task 0", "Execute Task 1", etc., one at a time.
Do not proceed to the next task until I ask.

When executing a task:
- Output only the files listed in that task's `## OUTPUT` block.
- Do not modify files outside the listed outputs unless the task explicitly says so.
- After writing each file, run the build or lint check specified in that task's `## VERIFY` block.
- If a decision is ambiguous, use the type contracts in TASK 1 as source of truth.
- Everything under `## OUT OF SCOPE` must not appear in any generated code.

---

## WHAT THIS PIPELINE DOES

```
User opens AR page for a product
          ↓
Frontend checks Supabase: does this product have a model URL?
          ↓
NO MODEL:
  Frontend calls POST /api/models/generate { productId }
  Backend fetches product data from Amazon PA API
  Backend downloads best product image
  Python script runs Depth Anything V2 → generates depth map
  Python script builds displaced mesh → exports GLB
  Backend uploads GLB to Supabase Storage
  Backend updates product record with modelGlb URL
  Backend returns { modelUrl }
          ↓
CACHED MODEL:
  Return existing Supabase Storage URL immediately
          ↓
Frontend loads GLB into existing AR session
```

---

## REPO CONTEXT

This pipeline connects to an existing React + Vite AR frontend repo.
The frontend already has:
- `src/types/app.ts` with `ARCatalogProduct` type
- `src/data/products.json` with product seed data
- `src/components/InlineModelViewer.tsx` that loads GLB files
- `src/components/WebXRSession.tsx` that places GLB files in AR
- Supabase already initialized at `src/lib/supabaseClient.ts`

The backend lives in a new `server/` directory at the repo root.
The Python script lives in `scripts/generate_depth_model.py`.
Do not modify any existing `src/` files except where TASK 11 explicitly says to.

---

## REPO SHAPE (to create)

```
server/
  src/
    index.ts              ← Hono server entry
    routes/
      models.ts           ← /api/models routes
      products.ts         ← /api/products routes
    services/
      amazonApi.ts        ← Amazon PA API client
      modelGenerator.ts   ← spawns Python script
      supabaseStorage.ts  ← upload + URL helpers
    types/
      pipeline.ts         ← shared backend types
    lib/
      queue.ts            ← simple in-memory job queue
  package.json
  tsconfig.json

scripts/
  generate_depth_model.py ← depth map + mesh generation
  requirements.txt        ← Python dependencies

supabase/
  schema.sql              ← DB schema for products + model_jobs tables
```

---

## TASK 0 — Environment and dependencies

### OUTPUT

**`server/package.json`**

```json
{
  "name": "ar-decor-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "amazon-paapi": "^1.0.0",
    "dotenv": "^16.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.0"
  }
}
```

**`server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**`scripts/requirements.txt`**

```
torch
torchvision
transformers
accelerate
Pillow
numpy
trimesh
rembg
requests
```

**`.env.example`** (at repo root)

```
# Amazon PA API
AMAZON_ACCESS_KEY=your_access_key
AMAZON_SECRET_KEY=your_secret_key
AMAZON_PARTNER_TAG=your_associate_tag
AMAZON_MARKETPLACE=www.amazon.com.tr

# Supabase
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key

# Server
PORT=3001
PYTHON_PATH=python

# Storage
MODEL_BUCKET=ar-models
TEMP_DIR=./tmp
```

### VERIFY

```bash
cd server && npm install
```

Must complete without errors.

---

## TASK 1 — Backend types

### OUTPUT

**`server/src/types/pipeline.ts`**

```ts
// ─── Amazon PA API ────────────────────────────────────────────────

export interface AmazonProduct {
  asin: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrls: string[];       // ordered best-first
  detailPageUrl: string;
  dimensions: AmazonDimensions | null;
  category: string;
  dominantColor: string | null;
}

export interface AmazonDimensions {
  widthCm: number;
  heightCm: number;
  depthCm: number;
}

// ─── Model generation ─────────────────────────────────────────────

export type ModelStrategy =
  | 'depth_mesh'    // depth map displacement — most products
  | 'flat_plane'    // image plane only — rugs, wall art
  | 'skip';         // category not supported

export type JobStatus =
  | 'queued'
  | 'downloading'
  | 'generating'
  | 'uploading'
  | 'done'
  | 'failed';

export interface ModelJob {
  jobId: string;
  productId: string;
  asin: string;
  status: JobStatus;
  strategy: ModelStrategy;
  modelUrl: string | null;
  error: string | null;
  createdAt: number;
  updatedAt: number;
}

// ─── API responses ────────────────────────────────────────────────

export interface GenerateModelResponse {
  jobId: string;
  status: JobStatus;
  modelUrl: string | null;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  modelUrl: string | null;
  error: string | null;
}

// ─── Category routing ─────────────────────────────────────────────

export interface CategoryRoute {
  category: string;
  strategy: ModelStrategy;
  depthStrengthMultiplier: number;  // 0.1 - 0.5
}
```

---

## TASK 2 — Category router

This determines which generation strategy to use per product category.
It is the most important routing decision in the pipeline.

### OUTPUT

**`server/src/services/categoryRouter.ts`**

Implement exactly this routing table. Do not add or remove categories.

```ts
import type { ModelStrategy, CategoryRoute } from '../types/pipeline.js';

const CATEGORY_ROUTES: CategoryRoute[] = [
  // depth_mesh — good 3D pop, works well
  { category: 'sofa',            strategy: 'depth_mesh', depthStrengthMultiplier: 0.25 },
  { category: 'armchair',        strategy: 'depth_mesh', depthStrengthMultiplier: 0.25 },
  { category: 'chair',           strategy: 'depth_mesh', depthStrengthMultiplier: 0.20 },
  { category: 'table',           strategy: 'depth_mesh', depthStrengthMultiplier: 0.15 },
  { category: 'desk',            strategy: 'depth_mesh', depthStrengthMultiplier: 0.15 },
  { category: 'shelf',           strategy: 'depth_mesh', depthStrengthMultiplier: 0.15 },
  { category: 'cabinet',         strategy: 'depth_mesh', depthStrengthMultiplier: 0.15 },
  { category: 'vase',            strategy: 'depth_mesh', depthStrengthMultiplier: 0.35 },
  { category: 'bowl',            strategy: 'depth_mesh', depthStrengthMultiplier: 0.35 },
  { category: 'sculpture',       strategy: 'depth_mesh', depthStrengthMultiplier: 0.40 },
  { category: 'figurine',        strategy: 'depth_mesh', depthStrengthMultiplier: 0.40 },
  { category: 'candle',          strategy: 'depth_mesh', depthStrengthMultiplier: 0.30 },
  { category: 'clock',           strategy: 'depth_mesh', depthStrengthMultiplier: 0.10 },
  { category: 'lamp',            strategy: 'depth_mesh', depthStrengthMultiplier: 0.20 },
  { category: 'mirror',          strategy: 'depth_mesh', depthStrengthMultiplier: 0.08 },
  { category: 'cushion',         strategy: 'depth_mesh', depthStrengthMultiplier: 0.20 },
  { category: 'pillow',          strategy: 'depth_mesh', depthStrengthMultiplier: 0.20 },
  { category: 'basket',          strategy: 'depth_mesh', depthStrengthMultiplier: 0.30 },
  { category: 'pot',             strategy: 'depth_mesh', depthStrengthMultiplier: 0.35 },
  { category: 'tray',            strategy: 'depth_mesh', depthStrengthMultiplier: 0.12 },

  // flat_plane — image projected onto correct-scale plane
  { category: 'rug',             strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'carpet',          strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'wall_art',        strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'painting',        strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'poster',          strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'curtain',         strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'blanket',         strategy: 'flat_plane', depthStrengthMultiplier: 0 },
  { category: 'throw',           strategy: 'flat_plane', depthStrengthMultiplier: 0 },
];

const DEFAULT_ROUTE: CategoryRoute = {
  category: 'unknown',
  strategy: 'depth_mesh',
  depthStrengthMultiplier: 0.20,
};

export function routeCategory(category: string): CategoryRoute {
  const normalized = category.toLowerCase().trim();
  const match = CATEGORY_ROUTES.find(r =>
    normalized.includes(r.category) || r.category.includes(normalized)
  );
  return match ?? DEFAULT_ROUTE;
}

export function getStrategy(category: string): ModelStrategy {
  return routeCategory(category).strategy;
}
```

### VERIFY

No build step needed. TypeScript types must resolve without error when imported.

---

## TASK 3 — Amazon PA API client

### OUTPUT

**`server/src/services/amazonApi.ts`**

- Use the `amazon-paapi` npm package.
- Export one function: `searchProducts(query: string, count: number): Promise<AmazonProduct[]>`
- Export one function: `getProduct(asin: string): Promise<AmazonProduct | null>`
- Map the PA API response to the `AmazonProduct` type.
- Parse dimensions from the API's `ItemInfo.ProductInfo` fields. Dimensions come in as strings like `"82.5 centimeters"` — parse the numeric value and unit, convert to cm.
- If dimensions are missing from the API, set `dimensions: null`. Never invent dimensions.
- `imageUrls`: extract all `Images.Primary` and `Images.Variants` URLs, order by size descending, take the largest as index 0.
- `dominantColor`: extract from `ItemInfo.Features` or `VariationAttributes` if present. Set null if not found.
- All API errors must be caught and thrown as `new Error('AMAZON_API_ERROR: ' + message)`.

### GUARD — Partner tag is required

Every PA API request must include the `PartnerTag` from `process.env.AMAZON_PARTNER_TAG`.
If this env var is missing at startup, throw immediately with a clear error message.
Do not make any API request without a partner tag — Amazon will reject it silently.

### VERIFY

```bash
cd server && npx tsc --noEmit
```

Must pass without errors.

---

## TASK 4 — Python depth model generator

This is the core generation script. It runs as a child process spawned by Node.js.

### OUTPUT

**`scripts/generate_depth_model.py`**

Implement exactly this pipeline in order. Do not reorder steps.

```
STEP 1 — Load image
  Open from file path argument
  Convert to RGB
  Resize to 1024px longest side (preserve aspect ratio)

STEP 2 — Remove background
  Use rembg to remove background
  Convert result to RGBA

STEP 3 — Generate depth map
  Load model: "depth-anything/Depth-Anything-V2-Small-hf"
  Use device="cuda" if torch.cuda.is_available() else "cpu"
  Run depth estimation on the RGB image (before bg removal)
  Output: numpy array, same size as image

STEP 4 — Normalize depth
  depth = (depth - depth.min()) / (depth.max() - depth.min())
  Invert if needed: objects should be bright (close), background dark
  Apply gentle gaussian blur (sigma=2) to smooth depth discontinuities

STEP 5 — Build displaced mesh
  Grid resolution: 192x192 vertices
  x range: -width/2 to +width/2 (real meters from dimensions arg)
  y range: 0 to height (real meters, Y is up)
  z displacement: depth_value * depth_strength
    where depth_strength = depth_dimension * depth_multiplier
  UV coordinates: map 0-1 across grid

STEP 6 — Apply product image as texture
  Resize original image (with bg removed, RGBA) to 512x512
  Use as diffuse texture on the mesh

STEP 7 — Center pivot
  X: center at 0
  Y: bottom of mesh at Y=0 (floor placement)
  Z: center at 0

STEP 8 — Export GLB
  Export with trimesh to output path argument
  Include texture in export

STEP 9 — Print result
  Print exactly: DONE:{output_path}
  This is parsed by the Node.js caller to confirm success
```

**Command line interface:**

```bash
python scripts/generate_depth_model.py \
  --image /tmp/product_abc123.jpg \
  --width 0.82 \
  --height 0.74 \
  --depth 0.88 \
  --depth-multiplier 0.25 \
  --output /tmp/product_abc123.glb
```

**Error handling:**

- Any unhandled exception must print: `ERROR:{message}` and exit with code 1
- CUDA out of memory: catch `torch.cuda.OutOfMemoryError`, retry with `device="cpu"`, print `WARN:fell back to CPU`
- Missing model weights (no internet): print `ERROR:model_download_failed` and exit 1

**`scripts/generate_flat_plane.py`**

Simpler script for the `flat_plane` strategy.

```
STEP 1 — Load image, resize to 512x512
STEP 2 — Create PlaneGeometry: width x height meters, 2x2 vertices
STEP 3 — Apply image as texture
STEP 4 — Rotate plane:
  If placement = "floor": rotate X by -90 degrees (lay flat)
  If placement = "wall":  no rotation (faces forward)
STEP 5 — Center pivot at bottom (floor) or center-left (wall)
STEP 6 — Export GLB
STEP 7 — Print DONE:{output_path}
```

Same CLI interface as generate_depth_model.py plus `--placement floor|wall`.

### VERIFY

```bash
python scripts/generate_depth_model.py --help
```

Must print usage without error. Full generation test will happen in TASK 6.

---

## TASK 5 — Model generator service (Node.js)

This Node.js service spawns the Python scripts and manages temp files.

### OUTPUT

**`server/src/services/modelGenerator.ts`**

```ts
interface GenerationInput {
  imageUrl: string;
  dimensions: { widthM: number; heightM: number; depthM: number };
  depthMultiplier: number;
  strategy: 'depth_mesh' | 'flat_plane';
  placement?: 'floor' | 'wall';
  productId: string;
}

interface GenerationResult {
  glbPath: string;   // local tmp path
  strategy: string;
}

export async function generateModel(input: GenerationInput): Promise<GenerationResult>
```

Implement exactly this logic:

```
1. Create tmp directory if not exists (process.env.TEMP_DIR)
2. Download image from imageUrl to tmp/{productId}_source.jpg
   Use native fetch. If fetch fails, throw Error('IMAGE_DOWNLOAD_FAILED')
3. Choose script:
   strategy === 'depth_mesh' → scripts/generate_depth_model.py
   strategy === 'flat_plane' → scripts/generate_flat_plane.py
4. Build args array from input dimensions and multiplier
5. Spawn Python process:
   command: process.env.PYTHON_PATH ?? 'python'
   args: [scriptPath, ...argsArray]
   timeout: 120000ms (2 minutes)
6. Collect stdout and stderr
7. On process exit:
   code 0 AND stdout contains 'DONE:' → extract path, return result
   stdout contains 'ERROR:' → throw Error(extracted message)
   code non-zero → throw Error('GENERATION_FAILED: ' + stderr)
   timeout → kill process, throw Error('GENERATION_TIMEOUT')
8. Never leave tmp files on failure — delete in catch block
```

### GUARD — Never call setState or React from this file

This is a pure Node.js service. No React imports. No browser APIs.

### VERIFY

```bash
cd server && npx tsc --noEmit
```

---

## TASK 6 — Supabase storage service

### OUTPUT

**`server/src/services/supabaseStorage.ts`**

```ts
export async function uploadModel(
  localPath: string,
  productId: string
): Promise<string>  // returns public URL
```

```ts
export async function modelExists(productId: string): Promise<string | null>
// returns existing public URL or null
```

Implement exactly:

```
uploadModel:
  1. Read file from localPath as Buffer
  2. Upload to Supabase Storage bucket: process.env.MODEL_BUCKET
  3. Storage path: models/{productId}.glb
  4. upsert: true (overwrite if regenerating)
  5. contentType: 'model/gltf-binary'
  6. Get public URL via supabase.storage.from(bucket).getPublicUrl(path)
  7. Update products table: set model_glb = publicUrl where id = productId
  8. Delete local tmp file after successful upload
  9. Return publicUrl

modelExists:
  1. Query products table: select model_glb where id = productId
  2. If model_glb is not null and not empty string: return it
  3. Otherwise: return null
```

**`supabase/schema.sql`**

```sql
-- Products table (extend existing if present)
create table if not exists products (
  id           text primary key,
  slug         text unique not null,
  name         text not null,
  brand        text,
  price        numeric,
  currency     text default 'TRY',
  description  text,
  asin         text,
  category     text,
  model_glb    text,
  model_usdz   text,
  poster_url   text,
  width_m      numeric,
  height_m     numeric,
  depth_m      numeric,
  placement    text default 'floor',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Model generation jobs
create table if not exists model_jobs (
  job_id       text primary key,
  product_id   text references products(id),
  status       text not null default 'queued',
  strategy     text,
  model_url    text,
  error        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Index for polling
create index if not exists model_jobs_product_id on model_jobs(product_id);
create index if not exists model_jobs_status on model_jobs(status);
```

### VERIFY

```bash
cd server && npx tsc --noEmit
```

---

## TASK 7 — Job queue

A simple in-memory queue. No Redis, no external dependencies.
One job per product at a time. Duplicate requests return the existing job.

### OUTPUT

**`server/src/lib/queue.ts`**

```ts
// In-memory queue. Restarts clear the queue — that is acceptable.
// Jobs that were running when the server restarted will have status
// 'queued' or 'generating' forever. The frontend polling will time out
// and show an error after 3 minutes. This is acceptable for v1.

interface QueueJob {
  jobId: string;
  productId: string;
  run: () => Promise<void>;
}

class ModelQueue {
  private jobs = new Map<string, ModelJob>();    // jobId → ModelJob
  private productIndex = new Map<string, string>(); // productId → jobId
  private running = 0;
  private readonly concurrency = 1;
  // concurrency = 1 because RTX 3060 laptop can only run one generation at a time

  enqueue(job: QueueJob): ModelJob
  getJob(jobId: string): ModelJob | null
  getJobByProductId(productId: string): ModelJob | null
  private processNext(): void
}

export const modelQueue = new ModelQueue();
```

Rules:
- If a job for `productId` already exists with status `queued` or `generating`, return that existing job instead of creating a new one.
- If a job for `productId` exists with status `done`, return it immediately.
- If a job for `productId` exists with status `failed`, allow re-queuing (create new job).
- `concurrency: 1` — never run two Python processes simultaneously.
- On job completion (done or failed), update `updatedAt` and persist status to Supabase `model_jobs` table.

### VERIFY

```bash
cd server && npx tsc --noEmit
```

---

## TASK 8 — API routes

### OUTPUT

**`server/src/routes/models.ts`**

Implement these exact endpoints:

```
POST /api/models/generate
  body: { productId: string, asin?: string }
  
  Logic:
  1. Check modelExists(productId) → if URL exists return { status: 'done', modelUrl }
  2. Check queue for existing job → if queued/generating return existing job
  3. Fetch product from DB to get asin, dimensions, category
  4. If asin not in DB and asin provided in body, fetch from Amazon PA API
  5. Determine strategy via routeCategory(product.category)
  6. Create and enqueue job:
     - download best image
     - run generateModel()
     - upload result via uploadModel()
     - update job status throughout
  7. Return { jobId, status: 'queued', modelUrl: null }

GET /api/models/status/:jobId
  Logic:
  1. Look up job in queue
  2. Return { jobId, status, modelUrl, error }
  3. If jobId not found: 404

GET /api/models/product/:productId
  Logic:
  1. Check modelExists(productId) → return { modelUrl } or { modelUrl: null }

DELETE /api/models/product/:productId
  Logic:
  1. Delete from Supabase Storage: models/{productId}.glb
  2. Set products.model_glb = null in DB
  3. Return { deleted: true }
  Use case: force regeneration
```

**`server/src/routes/products.ts`**

```
GET /api/products/search?q={query}&limit={n}
  Calls amazonApi.searchProducts(query, limit)
  Returns AmazonProduct[]

GET /api/products/asin/:asin
  Calls amazonApi.getProduct(asin)
  Returns AmazonProduct or 404
```

**`server/src/index.ts`**

```ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import 'dotenv/config';

const app = new Hono();

app.use('*', cors({ origin: 'http://localhost:5173' })); // Vite dev server
app.use('*', logger());

app.route('/api/models', modelsRouter);
app.route('/api/products', productsRouter);

app.get('/health', (c) => c.json({ ok: true }));

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: app.fetch, port });
console.log(`Server running on http://localhost:${port}`);
```

### VERIFY

```bash
cd server && npm run dev
# Must start without errors
# curl http://localhost:3001/health must return {"ok":true}
```

---

## TASK 9 — Frontend hook

This is the only task that modifies the existing frontend `src/` directory.

### OUTPUT

**`src/hooks/useProductModel.ts`**

```ts
interface UseProductModelReturn {
  modelUrl: string | null;
  isGenerating: boolean;
  generationStatus: JobStatus | null;
  error: string | null;
  requestGeneration: () => void;
}

export function useProductModel(
  productId: string,
  existingModelUrl: string | null
): UseProductModelReturn
```

Implement exactly this logic:

```
On mount:
  If existingModelUrl is not null → set modelUrl, done. No server call.
  If existingModelUrl is null → do nothing, wait for requestGeneration()

requestGeneration():
  1. POST /api/models/generate { productId }
  2. Set isGenerating: true
  3. Start polling GET /api/models/status/:jobId every 3 seconds
  4. Poll for maximum 3 minutes (60 polls)
  5. On status === 'done': set modelUrl, isGenerating: false, stop polling
  6. On status === 'failed': set error, isGenerating: false, stop polling
  7. On timeout: set error: 'Generation timed out', isGenerating: false

Polling rules:
  - Use setInterval, clear on unmount
  - If component unmounts while polling, clear interval, do not setState
  - Never poll faster than every 3 seconds
```

**`src/components/ModelGenerationPrompt.tsx`**

Props:
```ts
interface ModelGenerationPromptProps {
  product: ARCatalogProduct;
  onModelReady: (modelUrl: string) => void;
}
```

- Renders when a product has no model yet.
- Shows product poster image.
- Shows "Generate 3D Model" button.
- On button press: calls `requestGeneration()`.
- While generating: shows animated progress indicator and status text:
  - `queued` → "Waiting in queue..."
  - `downloading` → "Downloading product image..."
  - `generating` → "Generating 3D model... (this takes ~20 seconds)"
  - `uploading` → "Almost done..."
- On done: calls `onModelReady(modelUrl)`.
- On error: shows error message and a "Try Again" button.
- Uses existing design tokens from `src/styles/tokens.css`.

### VERIFY

```bash
# In the frontend repo root:
npm run build
# Must pass without TypeScript errors
```

---

## TASK 10 — Wire into AR page

Modify `src/pages/ARPage.tsx` to use the model generation flow.

### OUTPUT

**`src/pages/ARPage.tsx`** — modify only

Change the AR page to handle the three possible model states:

```
State 1 — Product has modelGlb:
  Render <ARLauncher product={product} /> as before. No change.

State 2 — Product has no modelGlb, generation not started:
  Render <ModelGenerationPrompt> centered on screen.
  When onModelReady fires: update local product state with new modelUrl,
  then render <ARLauncher> with updated product.

State 3 — Product not found:
  Render "Product not found" with back link. No change.
```

Do not change ARLauncher, WebXRSession, or any other component.
The model URL flows in through the product prop only.

### VERIFY

```bash
npm run build
# Must pass without TypeScript errors
```

---

## TASK 11 — End-to-end test

### OUTPUT

**`server/src/test/pipeline.test.ts`**

Write one integration test per pipeline stage.
Use Node's built-in `assert` module. No test framework needed.

```ts
// Test 1 — Category router
// Input: 'sofa' → must return strategy: 'depth_mesh'
// Input: 'rug' → must return strategy: 'flat_plane'
// Input: 'xyz_unknown' → must return strategy: 'depth_mesh' (default)

// Test 2 — Amazon dimensions parser
// Input: '82.5 centimeters' → must return 82.5
// Input: '32.5 inches' → must return 82.55 (converted to cm)
// Input: '' → must return null

// Test 3 — Job queue deduplication
// Enqueue job for productId 'A'
// Enqueue job for productId 'A' again
// Must return same jobId both times

// Test 4 — modelExists returns null for unknown product
// Call modelExists('nonexistent-product-id')
// Must return null without throwing
```

Run with:
```bash
cd server && npx tsx src/test/pipeline.test.ts
```

---

## ACCEPTANCE CRITERIA

**TASK 0** — `npm install` in server/ completes. `requirements.txt` installs without conflict.

**TASK 1** — All types import cleanly. No `any` types.

**TASK 2** — Category router returns correct strategy for all 28 listed categories. Unknown categories return `depth_mesh`.

**TASK 3** — Amazon client maps all fields to `AmazonProduct` type. Dimension parsing handles cm and inches. Missing dimensions return null, never throw.

**TASK 4** — Python scripts accept CLI args and print `DONE:` or `ERROR:` correctly. CUDA OOM falls back to CPU automatically.

**TASK 5** — `generateModel` deletes tmp files on both success and failure. Timeout kills the Python process.

**TASK 6** — `uploadModel` deletes local tmp file after upload. `modelExists` never throws for unknown IDs.

**TASK 7** — Queue deduplicates jobs for the same productId. Concurrency never exceeds 1.

**TASK 8** — `/health` returns 200. `/api/models/generate` returns jobId. `/api/models/status/:jobId` returns correct status. CORS allows localhost:5173.

**TASK 9** — `useProductModel` clears polling interval on unmount. Never calls setState after unmount. Generation prompt shows correct status text per job status.

**TASK 10** — AR page renders generation prompt when modelGlb is null. AR page renders launcher when modelGlb is set. No prop drilling beyond product object.

**TASK 11** — All 4 tests pass.

---

## OUT OF SCOPE

Do not generate any of the following:

- TripoSR or any mesh reconstruction model (we use depth map only)
- Redis, BullMQ, or any external queue (in-memory only)
- Authentication or user accounts
- Payment or checkout
- Admin dashboard or CMS
- Video generation or multi-frame capture
- USDZ conversion (GLB only for now)
- WebSocket real-time updates (polling only)
- Docker or containerization
- Any deployment configuration
- Any file not listed in a task's `## OUTPUT` block

---

## DEPENDENCY REFERENCE

```
Node.js:  >= 20
Python:   >= 3.10
CUDA:     11.8 or 12.1 (for RTX 3060 laptop)
VRAM:     6GB (RTX 3060 laptop) — Python scripts must respect this

npm packages (server):
  hono ^4, @hono/node-server ^1, @supabase/supabase-js ^2,
  amazon-paapi ^1, dotenv ^16, uuid ^9, tsx ^4

pip packages:
  torch (cu121), transformers, accelerate,
  Pillow, numpy, trimesh, rembg, requests

Depth model:
  depth-anything/Depth-Anything-V2-Small-hf
  (Small variant — fits in 6GB VRAM alongside other processes)
  Downloaded automatically by transformers on first run (~400MB)
```

---

## IMPORTANT NOTES FOR CODEX

**Python process communication:**
Node.js and Python communicate only through stdout/stderr.
The Node.js caller parses `DONE:{path}` and `ERROR:{message}` from stdout.
Do not use stdin, files, or sockets for communication.

**VRAM budget:**
Depth Anything V2 Small uses ~1.5GB VRAM.
One generation runs at a time (queue concurrency = 1).
Do not load the model on every call — cache it as a module-level variable in Python so it loads once and stays in memory.

```python
# At module level — loaded once, reused for every generation
_depth_pipe = None

def get_depth_pipe():
    global _depth_pipe
    if _depth_pipe is None:
        _depth_pipe = pipeline(
            task="depth-estimation",
            model="depth-anything/Depth-Anything-V2-Small-hf",
            device=0 if torch.cuda.is_available() else -1,
        )
    return _depth_pipe
```

**Dimensions fallback:**
Amazon PA API often does not include dimensions.
When dimensions are null, use these category defaults (in meters):

```ts
const DIMENSION_DEFAULTS: Record<string, { w: number; h: number; d: number }> = {
  sofa:       { w: 2.0,  h: 0.85, d: 0.90 },
  armchair:   { w: 0.85, h: 0.85, d: 0.85 },
  table:      { w: 1.20, h: 0.75, d: 0.70 },
  vase:       { w: 0.20, h: 0.35, d: 0.20 },
  lamp:       { w: 0.40, h: 1.60, d: 0.40 },
  rug:        { w: 1.60, h: 0.01, d: 2.30 },
  cushion:    { w: 0.45, h: 0.15, d: 0.45 },
  clock:      { w: 0.30, h: 0.30, d: 0.05 },
  default:    { w: 0.40, h: 0.40, d: 0.40 },
};
```

---

*End of PIPELINE_PROMPT.md*
