import { ArrowRight, Box, Ruler } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ARCatalogProduct } from "../types/app";
import { InlineModelViewer } from "./InlineModelViewer";

interface SceneViewerLauncherProps {
  product: ARCatalogProduct;
}

function formatCentimeters(value: number) {
  return Math.round(value * 100);
}

function buildSceneViewerIntentUrl(product: ARCatalogProduct) {
  const absoluteGlbUrl = `${window.location.origin}${product.assets.modelGlb}`;
  const params = new URLSearchParams({
    file: absoluteGlbUrl,
    mode: "ar_preferred",
    title: product.name,
  });

  return `intent://arvr.google.com/scene-viewer/1.0?${params.toString()}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
}

export default function SceneViewerLauncher({ product }: SceneViewerLauncherProps) {
  const [hasFallenBack, setHasFallenBack] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const fallbackTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const dimensionsLabel = useMemo(() => {
    const width = formatCentimeters(product.dimensionsMeters.width);
    const depth = formatCentimeters(product.dimensionsMeters.depth);
    const height = formatCentimeters(product.dimensionsMeters.height);

    return `${width} × ${depth} × ${height} cm`;
  }, [product.dimensionsMeters.depth, product.dimensionsMeters.height, product.dimensionsMeters.width]);

  const intentUrl = useMemo(() => buildSceneViewerIntentUrl(product), [product]);

  const handleLaunch = () => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
    }

    fallbackTimerRef.current = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        setShowToast(true);
        setHasFallenBack(true);

        if (toastTimerRef.current) {
          window.clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = window.setTimeout(() => {
          setShowToast(false);
        }, 2600);
      }
    }, 500);

    window.location.href = intentUrl;
  };

  if (hasFallenBack) {
    return (
      <div className="relative min-h-screen bg-surface-base px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] text-content-primary">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-content-secondary">Scene Viewer fallback</p>
            <h1 className="mt-2 text-2xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-sm text-content-secondary">{product.brand}</p>
          </div>
          <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-sm font-medium text-content-primary">
            3D
          </div>
        </div>

        <div className="mt-5">
          <InlineModelViewer product={product} className="min-h-[58vh]" />
        </div>

        {showToast ? (
          <div className="pointer-events-none fixed inset-x-5 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] z-[var(--z-toast)] flex justify-center">
            <div className="rounded-full bg-brand-primary px-5 py-3 text-sm font-medium text-content-inverse shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              Scene Viewer not available on this device
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0e0d0c] text-white">
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
          <span>Scene Viewer</span>
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
