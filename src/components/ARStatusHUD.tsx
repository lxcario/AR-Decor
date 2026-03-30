import type { TrackingState } from "../types/app";

interface ARStatusHUDProps {
  trackingState: TrackingState;
  placedCount: number;
}

const guidanceByState: Partial<Record<TrackingState, string>> = {
  scanning: "Move your phone slowly to find a surface",
  surface_found: "Tap to place",
  placing: "Tap to confirm placement",
  limited: "Move to a better-lit area",
  lost: "Tracking lost - move slowly",
};

export function ARStatusHUD({ trackingState, placedCount }: ARStatusHUDProps) {
  const guidance = guidanceByState[trackingState];

  if (!guidance) {
    return null;
  }

  const liveLabel = placedCount > 0 ? `${guidance}. ${placedCount} items placed.` : guidance;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+1rem)] z-[var(--z-hud)] flex justify-center px-4">
      <div
        aria-live="polite"
        aria-atomic="true"
        aria-label={liveLabel}
        className="inline-flex max-w-sm items-center rounded-full bg-[var(--color-surface-ar-hud)] px-4 py-2 text-center text-sm font-medium text-content-inverse shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl"
      >
        {guidance}
      </div>
    </div>
  );
}
