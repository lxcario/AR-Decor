import { createClient } from '@supabase/supabase-js';
import type { JobStatus, ModelJob, ModelStrategy } from '../types/pipeline.js';

// In-memory queue. Restarts clear the queue — that is acceptable.
// Jobs that were running when the server restarted will have status
// 'queued' or 'generating' forever. The frontend polling will time out
// and show an error after 3 minutes. This is acceptable for v1.

interface QueueJob {
  jobId: string;
  productId: string;
  run: () => Promise<void>;
}

type JobPatch = Partial<Pick<ModelJob, 'asin' | 'status' | 'strategy' | 'modelUrl' | 'error'>>;

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

async function persistJob(job: ModelJob) {
  const supabase = getSupabase();
  const payload = {
    job_id: job.jobId,
    product_id: job.productId,
    status: job.status,
    strategy: job.strategy,
    model_url: job.modelUrl,
    error: job.error,
    created_at: new Date(job.createdAt).toISOString(),
    updated_at: new Date(job.updatedAt).toISOString(),
  };

  const result = await supabase.from('model_jobs').upsert(payload as never, { onConflict: 'job_id' });
  if (result.error) {
    throw result.error;
  }
}

function schedulePersistence(job: ModelJob) {
  void persistJob(job).catch((error) => {
    console.error('[Queue] Failed to persist model job:', error);
  });
}

class ModelQueue {
  private jobs = new Map<string, ModelJob>();
  private productIndex = new Map<string, string>();
  private runners = new Map<string, () => Promise<void>>();
  private running = 0;
  private readonly concurrency = 1;
  // concurrency = 1 because RTX 3060 laptop can only run one generation at a time

  enqueue(job: QueueJob): ModelJob {
    const existingJob = this.getJobByProductId(job.productId);

    if (existingJob) {
      if (existingJob.status === 'queued' || existingJob.status === 'generating' || existingJob.status === 'done') {
        return existingJob;
      }
    }

    const nextJob: ModelJob = {
      jobId: job.jobId,
      productId: job.productId,
      asin: '',
      status: 'queued',
      strategy: 'depth_mesh',
      modelUrl: null,
      error: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.jobs.set(nextJob.jobId, nextJob);
    this.productIndex.set(nextJob.productId, nextJob.jobId);
    this.runners.set(nextJob.jobId, job.run);
    schedulePersistence(nextJob);
    this.processNext();

    return nextJob;
  }

  getJob(jobId: string): ModelJob | null {
    return this.jobs.get(jobId) ?? null;
  }

  getJobByProductId(productId: string): ModelJob | null {
    const jobId = this.productIndex.get(productId);
    if (!jobId) {
      return null;
    }

    return this.jobs.get(jobId) ?? null;
  }

  updateJob(jobId: string, patch: JobPatch): ModelJob | null {
    const currentJob = this.jobs.get(jobId);
    if (!currentJob) {
      return null;
    }

    const nextJob: ModelJob = {
      ...currentJob,
      ...patch,
      updatedAt: Date.now(),
    };

    this.jobs.set(jobId, nextJob);
    schedulePersistence(nextJob);
    return nextJob;
  }

  private processNext(): void {
    if (this.running >= this.concurrency) {
      return;
    }

    const nextJob = Array.from(this.jobs.values()).find((job) => job.status === 'queued');
    if (!nextJob) {
      return;
    }

    const runner = this.runners.get(nextJob.jobId);
    if (!runner) {
      return;
    }

    this.running += 1;
    this.updateJob(nextJob.jobId, { status: 'generating', error: null });

    void runner()
      .then(() => {
        this.updateJob(nextJob.jobId, { status: 'done' });
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        this.updateJob(nextJob.jobId, {
          status: 'failed',
          error: message,
        });
      })
      .finally(() => {
        this.running -= 1;
        this.processNext();
      });
  }
}

export const modelQueue = new ModelQueue();
export type { QueueJob };

