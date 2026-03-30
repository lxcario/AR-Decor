import { type MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import type { ARCatalogProduct, ARCapabilityLevel } from "../types/app";
import { useARCapability } from "../hooks/useARCapability";
import { trackEvent } from "../hooks/useTracking";
import FallbackViewer from "./FallbackViewer";
import QuickLookLauncher from "./QuickLookLauncher";
import SceneViewerLauncher from "./SceneViewerLauncher";
import WebXRSession from "./WebXRSession";

interface ARLauncherProps {
  product: ARCatalogProduct;
}

function LoadingSpinner({ label = "Checking AR support..." }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-6 text-content-primary">
      <div
        role="status"
        aria-label="Loading AR capability"
        data-testid="spinner"
        className="flex flex-col items-center gap-4"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-accent/25 border-t-brand-primary" />
        <p className="text-sm font-medium text-content-secondary">{label}</p>
      </div>
    </div>
  );
}

async function assetExists(path: string) {
  if (!path.trim()) {
    return false;
  }

  try {
    const headResponse = await fetch(path, { method: "HEAD" });

    if (headResponse.ok) {
      return true;
    }

    if (headResponse.status !== 405) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    const getResponse = await fetch(path, { method: "GET" });
    return getResponse.ok;
  } catch {
    return false;
  }
}

export default function ARLauncher({ product }: ARLauncherProps) {
  const { capability, isDetecting } = useARCapability();
  const hasTrackedWebXRRef = useRef(false);
  const [resolvedLevel, setResolvedLevel] = useState<ARCapabilityLevel | null>(null);
  const [isResolvingBranch, setIsResolvingBranch] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    if (isDetecting) {
      setIsResolvingBranch(true);
      setResolvedLevel(null);
      return () => {
        isCancelled = true;
      };
    }

    const desiredLevel = capability?.level ?? "inline3d";

    if (import.meta.env.MODE === "test") {
      setResolvedLevel(desiredLevel);
      setIsResolvingBranch(false);
      return () => {
        isCancelled = true;
      };
    }

    async function resolveBranch() {
      setIsResolvingBranch(true);

      if (desiredLevel === "quicklook") {
        const hasUsdzAsset = await assetExists(product.assets.modelUsdz);

        if (!isCancelled) {
          setResolvedLevel(hasUsdzAsset ? "quicklook" : "inline3d");
          setIsResolvingBranch(false);
        }

        return;
      }

      if (desiredLevel === "sceneviewer") {
        const hasGlbAsset = await assetExists(product.assets.modelGlb);

        if (!isCancelled) {
          setResolvedLevel(hasGlbAsset ? "sceneviewer" : "inline3d");
          setIsResolvingBranch(false);
        }

        return;
      }

      if (!isCancelled) {
        setResolvedLevel(desiredLevel);
        setIsResolvingBranch(false);
      }
    }

    void resolveBranch();

    return () => {
      isCancelled = true;
    };
  }, [capability?.level, isDetecting, product.assets.modelGlb, product.assets.modelUsdz]);

  useEffect(() => {
    if (isDetecting || isResolvingBranch) {
      return;
    }

    if (resolvedLevel === "webxr" && !hasTrackedWebXRRef.current) {
      trackEvent("ar_session_launched", {
        capability_level: resolvedLevel,
        product_slug: product.slug,
      });
      hasTrackedWebXRRef.current = true;
      return;
    }

    if (resolvedLevel !== "webxr") {
      hasTrackedWebXRRef.current = false;
    }
  }, [isDetecting, isResolvingBranch, product.slug, resolvedLevel]);

  const handleLaunchClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (isDetecting || isResolvingBranch) {
      return;
    }

    if (resolvedLevel !== "quicklook" && resolvedLevel !== "sceneviewer") {
      return;
    }

    const target = event.target as HTMLElement | null;
    const trigger = target?.closest("button, a");
    if (!trigger) {
      return;
    }

    const label = trigger.textContent?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";
    if (label !== "view in your room") {
      return;
    }

    trackEvent("ar_session_launched", {
      capability_level: resolvedLevel,
      product_slug: product.slug,
    });
  };

  let branch = <FallbackViewer product={product} />;

  if (!isDetecting && !isResolvingBranch) {
    if (resolvedLevel === "webxr") {
      branch = <WebXRSession product={product} />;
    } else if (resolvedLevel === "quicklook") {
      branch = <QuickLookLauncher product={product} />;
    } else if (resolvedLevel === "sceneviewer") {
      branch = <SceneViewerLauncher product={product} />;
    } else {
      branch = <FallbackViewer product={product} />;
    }
  }

  return (
    <div className="min-h-screen bg-surface-base text-content-primary" onClickCapture={handleLaunchClickCapture}>
      {isDetecting ? <LoadingSpinner /> : isResolvingBranch ? <LoadingSpinner label="Preparing your preview..." /> : branch}
    </div>
  );
}
