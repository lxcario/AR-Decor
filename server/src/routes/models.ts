import { createClient } from '@supabase/supabase-js';
import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import { routeCategory } from '../services/categoryRouter.js';
import { generateModel } from '../services/modelGenerator.js';
import { getProduct } from '../services/mockCatalog.js';
import { modelExists, uploadModel } from '../services/supabaseStorage.js';
import { modelQueue } from '../lib/queue.js';
import type { AmazonProduct, CategoryRoute, GenerateModelResponse, JobStatusResponse } from '../types/pipeline.js';

interface GenerateBody {
  productId: string;
  asin?: string;
}

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  asin: string | null;
  category: string | null;
  poster_url: string | null;
  width_m: number | null;
  height_m: number | null;
  depth_m: number | null;
  placement: string | null;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_KEY'),
    );
  }

  return supabaseClient;
}

async function fetchProductRow(productId: string): Promise<ProductRow | null> {
  const result = await getSupabase()
    .from('products')
    .select('id, slug, name, asin, category, poster_url, width_m, height_m, depth_m, placement')
    .eq('id', productId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return (result.data as ProductRow | null) ?? null;
}

function resolvePlacement(value: string | null | undefined): 'floor' | 'wall' {
  return value === 'wall' ? 'wall' : 'floor';
}

function resolveDimensions(product: ProductRow, amazonProduct: AmazonProduct | null) {
  const widthM = product.width_m ?? (amazonProduct?.dimensions ? amazonProduct.dimensions.widthCm / 100 : null);
  const heightM = product.height_m ?? (amazonProduct?.dimensions ? amazonProduct.dimensions.heightCm / 100 : null);
  const depthM = product.depth_m ?? (amazonProduct?.dimensions ? amazonProduct.dimensions.depthCm / 100 : null);

  if (widthM == null || heightM == null || depthM == null) {
    throw new Error('PRODUCT_DIMENSIONS_MISSING');
  }

  return { widthM: Number(widthM), heightM: Number(heightM), depthM: Number(depthM) };
}

function resolveCategory(product: ProductRow, amazonProduct: AmazonProduct | null) {
  const category = product.category?.trim() || amazonProduct?.category?.trim();
  if (!category) {
    throw new Error('PRODUCT_CATEGORY_MISSING');
  }

  return category;
}

function resolveImageUrl(product: ProductRow, amazonProduct: AmazonProduct | null) {
  const imageUrl = amazonProduct?.imageUrls[0] ?? product.poster_url?.trim() ?? null;
  if (!imageUrl) {
    throw new Error('PRODUCT_IMAGE_MISSING');
  }

  return imageUrl;
}

async function clearStoredModel(productId: string) {
  const supabase = getSupabase();
  const bucket = getRequiredEnv('MODEL_BUCKET');
  const storagePath = `models/${productId}.glb`;

  const deleteResult = await supabase.storage.from(bucket).remove([storagePath]);
  if (deleteResult.error) {
    throw deleteResult.error;
  }

  const updateResult = await supabase
    .from('products')
    .update({ model_glb: null } as never)
    .eq('id', productId);

  if (updateResult.error) {
    throw updateResult.error;
  }
}

export const modelsRouter = new Hono();

modelsRouter.post('/generate', async (c) => {
  try {
    const body = (await c.req.json()) as GenerateBody;
    const productId = body.productId?.trim();

    if (!productId) {
      return c.json({ error: 'productId is required' }, 400);
    }

    const existingModelUrl = await modelExists(productId);
    if (existingModelUrl) {
      const response: GenerateModelResponse = {
        jobId: productId,
        status: 'done',
        modelUrl: existingModelUrl,
      };
      return c.json(response);
    }

    const existingJob = modelQueue.getJobByProductId(productId);
    if (existingJob && (existingJob.status === 'queued' || existingJob.status === 'generating' || existingJob.status === 'done')) {
      const response: GenerateModelResponse = {
        jobId: existingJob.jobId,
        status: existingJob.status,
        modelUrl: existingJob.modelUrl,
      };
      return c.json(response);
    }

    const product = await fetchProductRow(productId);
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    const shouldFetchAmazon = !product.asin && Boolean(body.asin?.trim());
    const amazonProduct = shouldFetchAmazon ? await getProduct(body.asin!.trim()) : null;
    const category = resolveCategory(product, amazonProduct);
    const route = routeCategory(category);
    const dimensions = resolveDimensions(product, amazonProduct);
    const imageUrl = resolveImageUrl(product, amazonProduct);
    const jobId = randomUUID();

    const queuedJob = modelQueue.enqueue({
      jobId,
      productId,
      run: async () => {
        modelQueue.updateJob(jobId, {
          asin: product.asin ?? body.asin ?? amazonProduct?.asin ?? '',
          strategy: route.strategy,
          status: 'downloading',
          error: null,
        });

        modelQueue.updateJob(jobId, { status: 'generating' });
        const generationResult = await generateModel({
          imageUrl,
          dimensions,
          depthMultiplier: route.depthStrengthMultiplier,
          strategy: route.strategy as 'depth_mesh' | 'flat_plane',
          placement: resolvePlacement(product.placement),
          productId,
        });

        modelQueue.updateJob(jobId, { status: 'uploading', strategy: route.strategy });
        const modelUrl = await uploadModel(generationResult.glbPath, productId);
        modelQueue.updateJob(jobId, {
          status: 'done',
          strategy: route.strategy,
          modelUrl,
          asin: product.asin ?? body.asin ?? amazonProduct?.asin ?? '',
          error: null,
        });
      },
    });

    modelQueue.updateJob(queuedJob.jobId, {
      asin: product.asin ?? body.asin ?? amazonProduct?.asin ?? '',
      strategy: route.strategy,
    });

    const response: GenerateModelResponse = {
      jobId: queuedJob.jobId,
      status: 'queued',
      modelUrl: null,
    };
    return c.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generation error';
    return c.json({ error: message }, 500);
  }
});

modelsRouter.get('/status/:jobId', (c) => {
  const jobId = c.req.param('jobId');
  const job = modelQueue.getJob(jobId);

  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }

  const response: JobStatusResponse = {
    jobId: job.jobId,
    status: job.status,
    modelUrl: job.modelUrl,
    error: job.error,
  };

  return c.json(response);
});

modelsRouter.get('/product/:productId', async (c) => {
  try {
    const modelUrl = await modelExists(c.req.param('productId'));
    return c.json({ modelUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown storage error';
    return c.json({ error: message }, 500);
  }
});

modelsRouter.delete('/product/:productId', async (c) => {
  try {
    await clearStoredModel(c.req.param('productId'));
    return c.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown deletion error';
    return c.json({ error: message }, 500);
  }
});

