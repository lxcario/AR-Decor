import { ArrowRight, Box, Ruler } from "lucide-react";
import { useMemo, useRef } from "react";
import type { ARCatalogProduct } from "../types/app";
import { PermissionPrompt } from "./PermissionPrompt";

interface QuickLookLauncherProps {
  product: ARCatalogProduct;
}

function formatCentimeters(value: number) {
  return Math.round(value * 100);
}

export default function QuickLookLauncher({ product }: QuickLookLauncherProps) {
  const quickLookAnchorRef = useRef<HTMLAnchorElement | null>(null);

  const dimensionsLabel = useMemo(() => {
    const width = formatCentimeters(product.dimensionsMeters.width);
    const depth = formatCentimeters(product.dimensionsMeters.depth);
    const height = formatCentimeters(product.dimensionsMeters.height);

    return `${width} × ${depth} × ${height} cm`;
  }, [product.dimensionsMeters.depth, product.dimensionsMeters.height, product.dimensionsMeters.width]);

  if (!product.assets.modelUsdz.trim()) {
    return (
      <div className="relative min-h-screen bg-surface-base">
        <PermissionPrompt reason="webxr_unavailable" />
        <div className="pointer-events-none absolute inset-x-6 bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-10 rounded-[24px] border border-black/8 bg-white/90 px-5 py-4 text-center shadow-[0_18px_50px_rgba(18,18,18,0.08)] backdrop-blur-xl">
          <p className="text-sm font-medium text-content-primary">This AR model is not yet available for Quick Look.</p>
        </div>
      </div>
    );
  }

  const handleLaunch = () => {
    quickLookAnchorRef.current?.click();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e0d0c] text-white">
      <a
        ref={quickLookAnchorRef}
        href={product.assets.modelUsdz}
        rel="ar"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute left-0 top-0 h-px w-px overflow-hidden opacity-0 pointer-events-none"
      >
        <img
          src={product.assets.poster}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="h-px w-px"
        />
      </a>

      <img
        src={product.assets.poster}
        alt={product.name}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,12,0.12),rgba(12,12,12,0.28)_35%,rgba(12,12,12,0.92)_100%)]" />

      <div className="relative flex min-h-screen flex-col px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/78 backdrop-blur-xl">
          <Box size={13} />
          <span>Quick Look</span>
        </div>

        <div className="flex-1" />

        <div className="rounded-[32px] border border-white/14 bg-black/28 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">{product.brand}</p>
              <h1 className="mt-3 max-w-[11ch] text-[2.35rem] font-semibold leading-[0.94] text-white">
                {product.name}
              </h1>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/76">
              {product.currency} {product.price.toLocaleString("en-US")}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-white/72">{product.description}</p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur-xl">
            <Ruler size={16} />
            <span>{dimensionsLabel}</span>
          </div>

          <button
            type="button"
            onClick={handleLaunch}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-medium text-neutral-950 transition-all duration-[var(--duration-base)] active:scale-95"
          >
            View in Your Room
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}

