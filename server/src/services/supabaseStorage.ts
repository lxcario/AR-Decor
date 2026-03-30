import { readFile, rm } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

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

function getBucketName() {
  return getRequiredEnv('MODEL_BUCKET');
}

export async function uploadModel(localPath: string, productId: string): Promise<string> {
  const supabase = getSupabase();
  const bucket = getBucketName();
  const storagePath = `models/${productId}.glb`;
  const fileBuffer = await readFile(localPath);

  const uploadResult = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
    upsert: true,
    contentType: 'model/gltf-binary',
  });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const publicUrlResult = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const publicUrl = publicUrlResult.data.publicUrl;

  const updateResult = await supabase
    .from('products')
    .update({ model_glb: publicUrl } as never)
    .eq('id', productId);

  if (updateResult.error) {
    throw updateResult.error;
  }

  await rm(localPath, { force: true });
  return publicUrl;
}

export async function modelExists(productId: string): Promise<string | null> {
  const supabase = getSupabase();
  const query = await supabase
    .from('products')
    .select('model_glb')
    .eq('id', productId)
    .maybeSingle();

  if (query.error) {
    throw query.error;
  }

  const modelUrl = (query.data as { model_glb?: string | null } | null)?.model_glb;
  if (typeof modelUrl === 'string' && modelUrl.trim()) {
    return modelUrl;
  }

  return null;
}

