import { ArrowLeft, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routes } from "../app/routes";
import type { ARCatalogProduct } from "../types/app";
import { InlineModelViewer } from "./InlineModelViewer";

interface FallbackViewerProps {
  product: ARCatalogProduct;
}

function formatCentimeters(value: number) {
  return Math.round(value * 100);
}

export default function FallbackViewer({ product }: FallbackViewerProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(routes.product(product.slug));
  };

  const dimensionsLabel = `${formatCentimeters(product.dimensionsMeters.width)} × ${formatCentimeters(product.dimensionsMeters.depth)} × ${formatCentimeters(product.dimensionsMeters.height)} cm`;

  return (
    <main className="flex min-h-screen flex-col bg-surface-base px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] text-content-primary">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-content-secondary">3D preview</p>
          <h1 className="mt-2 text-2xl font-semibold">{product.name}</h1>
          <p className="mt-1 text-sm text-content-secondary">{product.brand}</p>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm font-medium text-content-primary transition-all duration-[var(--duration-fast)] active:scale-95"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      <div className="mt-5 flex flex-1 items-center">
        <InlineModelViewer product={product} className="h-full min-h-[52vh] w-full" />
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-[24px] border border-black/8 bg-white/80 px-4 py-4 text-sm text-content-secondary shadow-[0_18px_50px_rgba(18,18,18,0.05)]">
          <div className="inline-flex items-center gap-2">
            <Ruler size={16} />
            <span>{dimensionsLabel}</span>
          </div>
        </div>
        <div
          className="rounded-[24px] px-4 py-4 text-sm leading-6 text-content-primary"
          style={{
            border: "1px solid color-mix(in srgb, var(--color-status-info) 20%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--color-status-info) 10%, transparent)",
          }}
        >
          Augmented reality requires Chrome on Android or Safari on iPhone. You're viewing an interactive 3D preview instead.
        </div>
      </div>
    </main>
  );
}
