import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { modelQueue } from '../lib/queue.js';
import { routeCategory } from '../services/categoryRouter.js';
import { modelExists } from '../services/supabaseStorage.js';

interface MockCatalogEntry {
  id: string;
  slug: string;
  category: string;
  assets: {
    poster: string;
    modelGlb: string | null;
  };
  dimensionsMeters: {
    width: number;
    height: number;
    depth: number;
  };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function testCategoryRouter() {
  const sofaRoute = routeCategory('sofa');
  const rugRoute = routeCategory('rug');
  const unknownRoute = routeCategory('xyz_unknown');

  assert(sofaRoute.strategy === 'depth_mesh', 'sofa should route to depth_mesh');
  assert(rugRoute.strategy === 'flat_plane', 'rug should route to flat_plane');
  assert(unknownRoute.strategy === 'depth_mesh', 'unknown category should default to depth_mesh');

  console.log('PASS Test 1 - Category router');
}

async function testMockCatalogIntegrity() {
  const catalogPath = resolve(process.cwd(), '../mock-catalog.json');
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8')) as MockCatalogEntry[];

  assert(catalog.length > 0, 'mock catalog should not be empty');

  for (const entry of catalog) {
    assert(Boolean(entry.id), 'every entry must have id');
    assert(Boolean(entry.slug), 'every entry must have slug');
    assert(Boolean(entry.category), 'every entry must have category');
    assert(Boolean(entry.assets?.poster), 'every entry must have assets.poster');
    assert(Boolean(entry.dimensionsMeters), 'every entry must have dimensionsMeters');
    assert(entry.dimensionsMeters.width > 0, `${entry.id} width must be > 0`);
    assert(entry.dimensionsMeters.height > 0, `${entry.id} height must be > 0`);
    assert(entry.dimensionsMeters.depth > 0, `${entry.id} depth must be > 0`);
  }

  const nullModelCount = catalog.filter((entry) => entry.assets.modelGlb === null).length;
  assert(nullModelCount > 0, 'entries with modelGlb === null should be detectable');

  console.log('PASS Test 2 - Mock catalog integrity');
}

async function testQueueDeduplication() {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('[]', {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const productId = `queue-test-${randomUUID()}`;
    let releaseRunner = () => {};
    const blocker = new Promise<void>((resolve) => {
      releaseRunner = resolve;
    });

    const firstJob = modelQueue.enqueue({
      jobId: `job-${randomUUID()}`,
      productId,
      run: async () => blocker,
    });

    const secondJob = modelQueue.enqueue({
      jobId: `job-${randomUUID()}`,
      productId,
      run: async () => undefined,
    });

    assert(firstJob.jobId === secondJob.jobId, 'duplicate product should return the existing job');
    assert(secondJob.status === 'generating' || secondJob.status === 'queued', 'existing job should remain active');

    releaseRunner();
    await new Promise((resolve) => setTimeout(resolve, 0));
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log('PASS Test 3 - Job queue deduplication');
}

async function testModelExistsUnknownProduct() {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    const result = await modelExists(`missing-${randomUUID()}`);
    assert(result === null, 'unknown product should resolve to null');
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log('PASS Test 4 - modelExists unknown product');
}

async function main() {
  await testCategoryRouter();
  await testMockCatalogIntegrity();
  await testQueueDeduplication();
  await testModelExistsUnknownProduct();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});