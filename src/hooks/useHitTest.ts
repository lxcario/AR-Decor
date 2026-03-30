import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";

export interface UseHitTestReturn {
  hitPose: XRPose | null;
  isTracking: boolean;
}

export function useHitTest(
  session: XRSession | null,
  referenceSpace: XRReferenceSpace | null,
  liveHitPoseRef?: MutableRefObject<XRPose | null>,
): UseHitTestReturn {
  const [hitPose, setHitPose] = useState<XRPose | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const latestHitPoseRef = useRef<XRPose | null>(null);
  const latestTrackingRef = useRef(false);
  const emittedHasPoseRef = useRef(false);
  const emittedTrackingRef = useRef(false);
  const xrFrameHandleRef = useRef<number | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    latestHitPoseRef.current = null;
    latestTrackingRef.current = false;
    emittedHasPoseRef.current = false;
    emittedTrackingRef.current = false;
    setHitPose(null);
    setIsTracking(false);

    if (liveHitPoseRef) {
      liveHitPoseRef.current = null;
    }

    if (!session || !referenceSpace) {
      return undefined;
    }

    let isDisposed = false;
    let viewerSpace: XRReferenceSpace | null = null;
    let hitTestSource: XRHitTestSource | null = null;

    const syncState = () => {
      if (isDisposed) {
        return;
      }

      syncTimerRef.current = window.setTimeout(syncState, 32);
      const nextTracking = latestTrackingRef.current;
      const nextPose = latestHitPoseRef.current;
      const nextHasPose = nextPose !== null;

      if (emittedTrackingRef.current !== nextTracking) {
        emittedTrackingRef.current = nextTracking;
        setIsTracking(nextTracking);
      }

      if (emittedHasPoseRef.current !== nextHasPose) {
        emittedHasPoseRef.current = nextHasPose;
        setHitPose(nextPose);
      }
    };

    const handleXRFrame = (_time: number, frame: XRFrame) => {
      if (isDisposed) {
        return;
      }

      xrFrameHandleRef.current = session.requestAnimationFrame(handleXRFrame);
      const viewerPose = frame.getViewerPose(referenceSpace);

      if (!viewerPose || !hitTestSource || !viewerSpace) {
        latestTrackingRef.current = false;
        latestHitPoseRef.current = null;

        if (liveHitPoseRef) {
          liveHitPoseRef.current = null;
        }

        return;
      }

      const hitResults = frame.getHitTestResults(hitTestSource);
      const nextPose = hitResults[0]?.getPose(referenceSpace) ?? null;

      latestHitPoseRef.current = nextPose;
      latestTrackingRef.current = nextPose !== null;

      if (liveHitPoseRef) {
        liveHitPoseRef.current = nextPose;
      }
    };

    void session
      .requestReferenceSpace("viewer")
      .then((nextViewerSpace) => {
        if (isDisposed) {
          return null;
        }

        viewerSpace = nextViewerSpace;

        if (!session.requestHitTestSource) {
          throw new Error("Hit testing is not available for this session.");
        }

        return session.requestHitTestSource({ space: nextViewerSpace });
      })
      .then((source) => {
        if (!source || isDisposed) {
          source?.cancel();
          return;
        }

        hitTestSource = source;
        xrFrameHandleRef.current = session.requestAnimationFrame(handleXRFrame);
        syncTimerRef.current = window.setTimeout(syncState, 32);
      })
      .catch(() => {
        latestTrackingRef.current = false;
        latestHitPoseRef.current = null;

        if (liveHitPoseRef) {
          liveHitPoseRef.current = null;
        }

        syncTimerRef.current = window.setTimeout(syncState, 32);
      });

    return () => {
      isDisposed = true;

      if (xrFrameHandleRef.current !== null) {
        session.cancelAnimationFrame(xrFrameHandleRef.current);
      }

      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }

      hitTestSource?.cancel();
      hitTestSource = null;
      viewerSpace = null;

      if (liveHitPoseRef) {
        liveHitPoseRef.current = null;
      }
    };
  }, [liveHitPoseRef, referenceSpace, session]);

  return {
    hitPose,
    isTracking,
  };
}
