import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '../.env') });

async function clearModels() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  
  // Get all products that have a model
  console.log('Fetching products with models...');
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, model_glb')
    .not('model_glb', 'is', null);

  if (fetchError) {
    console.error('Error fetching products:', fetchError);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('No models to clear.');
    return;
  }

  console.log(`Found ${products.length} products with models. Clearing...`);

  const pathsToDelete = products.map(p => `models/${p.id}.glb`);
  
  console.log('Deleting from storage bucket...');
  const { error: storageError } = await supabase.storage
    .from(process.env.MODEL_BUCKET || 'ar-models')
    .remove(pathsToDelete);

  if (storageError) {
    console.error('Warning: Error deleting from storage:', storageError);
  }

  console.log('Setting model_glb to null in database...');
  const { error: updateError } = await supabase
    .from('products')
    .update({ model_glb: null })
    .in('id', products.map(p => p.id));

  if (updateError) {
    console.error('Error updating products:', updateError);
    process.exit(1);
  }

  console.log('Successfully cleared all existing models.');
}

clearModels().catch(console.error);
