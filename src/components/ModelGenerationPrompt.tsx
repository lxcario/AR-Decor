import { useEffect, useRef } from 'react';
import { Box, LoaderCircle, Sparkles } from 'lucide-react';
import type { ARCatalogProduct } from '../types/app';
import { type JobStatus, useProductModel } from '../hooks/useProductModel';

interface ModelGenerationPromptProps {
  product: ARCatalogProduct;
  onModelReady: (modelUrl: string) => void;
}

const statusCopy: Record<JobStatus, string> = {
  queued: 'Waiting in queue...',
  downloading: 'Downloading product image...',
  generating: 'Generating 3D model... (this takes ~20 seconds)',
  uploading: 'Almost done...',
  done: '3D model ready.',
  failed: 'Model generation failed.',
};

export function ModelGenerationPrompt({ product, onModelReady }: ModelGenerationPromptProps) {
  const { modelUrl, isGenerating, generationStatus, error, requestGeneration } = useProductModel(
    product.id,
    product.assets.modelGlb,
  );
  const lastDeliveredModelRef = useRef<string | null>(null);

  useEffect(() => {
    if (!modelUrl || lastDeliveredModelRef.current === modelUrl) {
      return;
    }

    lastDeliveredModelRef.current = modelUrl;
    onModelReady(modelUrl);
  }, [modelUrl, onModelReady]);

  const currentStatusText = generationStatus ? statusCopy[generationStatus] : 'Create a 3D model for this product before entering AR.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0b0a] px-5 py-10 text-white">
      <div className="w-full max-w-sm overflow-hidden rounded-[32px] border border-white/12 bg-white/8 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="relative h-64 overflow-hidden bg-[#151311]">
          <img
            src={product.assets.poster}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.04),rgba(10,10,10,0.18)_45%,rgba(10,10,10,0.72)_100%)]" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/12 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/78 backdrop-blur-xl">
            <Sparkles size={13} />
            <span>AR Pipeline</span>
          </div>
        </div>

        <div className="p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/54">{product.brand}</p>
          <h1 className="mt-3 font-display text-4xl leading-[0.98] text-white">{product.name}</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">{product.description}</p>

          <div className="mt-5 rounded-[24px] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/12 text-white">
                {isGenerating ? <LoaderCircle size={18} className="animate-spin" /> : <Box size={18} />}
              </div>
              <div>
                <p className="text-sm font-medium text-white">Generate 3D Model</p>
                <p className="mt-1 text-sm leading-6 text-white/68">{currentStatusText}</p>
              </div>
            </div>
          </div>

          {error ? (
            <div
              className="mt-4 rounded-[24px] px-4 py-4 text-sm leading-6"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-status-error) 14%, transparent)',
                border: '1px solid color-mix(in srgb, var(--color-status-error) 26%, transparent)',
                color: 'var(--color-content-inverse)',
              }}
            >
              <p className="font-medium">{error}</p>
              <button
                type="button"
                onClick={requestGeneration}
                className="mt-4 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition-all duration-[var(--duration-fast)] active:scale-95"
              >
                Try Again
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={requestGeneration}
              disabled={isGenerating}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-medium text-neutral-950 transition-all duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
            >
              {isGenerating ? <LoaderCircle size={16} className="animate-spin" /> : <Box size={16} />}
              {isGenerating ? 'Generating...' : 'Generate 3D Model'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
