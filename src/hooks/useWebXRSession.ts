import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackingState } from "../types/app";

export interface UseWebXRSessionReturn {
  session: XRSession | null;
  trackingState: TrackingState;
  startSession: () => Promise<void>;
  endSession: () => void;
  error: string | null;
}

export function useWebXRSession(domOverlayRoot: HTMLElement | null): UseWebXRSessionReturn {
  const [session, setSession] = useState<XRSession | null>(null);
  const [trackingState, setTrackingState] = useState<TrackingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<XRSession | null>(null);

  const resetState = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
    setTrackingState("idle");
    setError(null);
  }, []);

  const endSession = useCallback(() => {
    const activeSession = sessionRef.current;

    if (!activeSession) {
      resetState();
      return;
    }

    activeSession.end().catch(() => {
      resetState();
    });
  }, [resetState]);

  const startSession = useCallback(async () => {
    if (!navigator.xr) {
      setTrackingState("fallback");
      setError("session_failed");
      return;
    }

    setTrackingState("requesting_permission");
    setError(null);

    const sessionOptions: XRSessionInit & { domOverlay?: { root: Element } } = {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["anchors"],
    };

    if (domOverlayRoot) {
      sessionOptions.optionalFeatures = ["anchors", "dom-overlay"];
      sessionOptions.domOverlay = { root: domOverlayRoot };
    }

    try {
      const nextSession = await navigator.xr.requestSession("immersive-ar", sessionOptions);

      const handleEnd = () => {
        nextSession.removeEventListener("end", handleEnd);
        resetState();
      };

      nextSession.addEventListener("end", handleEnd);
      sessionRef.current = nextSession;
      setSession(nextSession);
      setTrackingState("scanning");
      setError(null);
    } catch (sessionError) {
      const domException = sessionError instanceof DOMException ? sessionError : null;
      const nextError =
        domException && (domException.name === "NotAllowedError" || domException.name === "SecurityError")
          ? "camera_denied"
          : "session_failed";

      sessionRef.current = null;
      setSession(null);
      setTrackingState("fallback");
      setError(nextError);
    }
  }, [domOverlayRoot, resetState]);

  useEffect(() => {
    return () => {
      const activeSession = sessionRef.current;

      if (activeSession && activeSession.visibilityState !== "hidden") {
        activeSession.end().catch(() => {
          // Session may already be closing.
        });
      }
    };
  }, []);

  return {
    session,
    trackingState,
    startSession,
    endSession,
    error,
  };
}
