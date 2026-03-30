// ─── Amazon PA API ──────────────────────────────────────────────────

export interface AmazonProduct {
  asin: string;
  title: string;
  brand: string;
  price: number;
  currency: string;
  imageUrls: string[]; // ordered best-first
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

// ─── Model generation ───────────────────────────────────────────────

export type ModelStrategy =
  | 'depth_mesh' // depth map displacement — most products
  | 'flat_plane' // image plane only — rugs, wall art
  | 'skip'; // category not supported

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

// ─── API responses ──────────────────────────────────────────────────

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

// ─── Category routing ───────────────────────────────────────────────

export interface CategoryRoute {
  category: string;
  strategy: ModelStrategy;
  depthStrengthMultiplier: number; // 0.1 - 0.5
}
