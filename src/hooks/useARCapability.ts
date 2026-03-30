import { useEffect, useState } from "react";
import type { ARCapability } from "../types/app";

interface UseARCapabilityResult {
  capability: ARCapability | null;
  isDetecting: boolean;
}

const FALLBACK_CAPABILITY: ARCapability = {
  level: "inline3d",
  isSecureContext: false,
  hasCamera: false,
  webxrSessionTypes: [],
};

function isAndroid(userAgent: string) {
  return /Android/i.test(userAgent);
}

function isAppleMobileDevice(userAgent: string) {
  return /iP(hone|ad|od)/i.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function supportsQuickLook() {
  const anchor = document.createElement("a");
  return typeof anchor.relList?.supports === "function" && anchor.relList.supports("ar");
}

async function detectCapability(): Promise<ARCapability> {
  try {
    const secureContext = window.isSecureContext;
    let hasCamera = false;

    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.();
      hasCamera = Boolean(devices?.some((device) => device.kind === "videoinput"));
    } catch {
      hasCamera = false;
    }

    const webxrSessionTypes: string[] = [];
    const xr =
      "xr" in navigator
        ? (navigator as Navigator & { xr?: XRSystem }).xr
        : undefined;

    if (xr && secureContext) {
      for (const sessionType of ["immersive-ar", "immersive-vr"] as const) {
        try {
          const isSupported = await xr.isSessionSupported(sessionType);

          if (isSupported) {
            webxrSessionTypes.push(sessionType);
          }
        } catch {
          continue;
        }
      }
    }

    const userAgent = navigator.userAgent;
    let level: ARCapability["level"] = "inline3d";

    if (webxrSessionTypes.includes("immersive-ar")) {
      level = "webxr";
    } else if (isAppleMobileDevice(userAgent) && supportsQuickLook()) {
      level = "quicklook";
    } else if (isAndroid(userAgent)) {
      level = "sceneviewer";
    }

    return {
      level,
      isSecureContext: secureContext,
      hasCamera,
      webxrSessionTypes,
    };
  } catch {
    return FALLBACK_CAPABILITY;
  }
}

export function useARCapability(): UseARCapabilityResult {
  const [capability, setCapability] = useState<ARCapability | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    void detectCapability()
      .then((result) => {
        if (!isCancelled) {
          setCapability(result);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setCapability(FALLBACK_CAPABILITY);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsDetecting(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return {
    capability,
    isDetecting,
  };
}
