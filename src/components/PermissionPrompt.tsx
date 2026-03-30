import { Camera, Globe, ShieldAlert } from "lucide-react";

interface PermissionPromptProps {
  reason: "camera" | "insecure_context" | "webxr_unavailable";
  onRetry?: () => void;
}

const copyByReason = {
  camera: {
    title: "Camera access is required",
    body: "Allow camera access so we can place decor in your room. No photos are stored unless you capture one.",
    icon: Camera,
  },
  insecure_context: {
    title: "AR needs a secure connection",
    body: "This AR experience requires HTTPS or localhost. Open the app from a secure origin to continue.",
    icon: ShieldAlert,
  },
  webxr_unavailable: {
    title: "AR is not available in this browser",
    body: "Use Chrome on Android for WebXR AR, or Safari on iPhone for Quick Look.",
    icon: Globe,
  },
} satisfies Record<PermissionPromptProps["reason"], {
  title: string;
  body: string;
  icon: typeof Camera;
}>;

export function PermissionPrompt({ reason, onRetry }: PermissionPromptProps) {
  const content = copyByReason[reason];
  const Icon = content.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-6 py-10 text-content-primary">
      <div className="w-full max-w-sm rounded-[28px] border border-black/8 bg-white/90 p-6 text-center shadow-[0_24px_80px_rgba(18,18,18,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-content-inverse">
          <Icon size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-content-primary">{content.title}</h1>
        <p className="mt-3 text-sm leading-6 text-content-secondary">{content.body}</p>

        {reason === "webxr_unavailable" ? (
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full border border-black/8 bg-surface-raised px-5 py-3 text-sm font-medium text-content-primary transition-all duration-[var(--duration-fast)] active:scale-95"
          >
            Supported browsers
          </a>
        ) : null}

        {reason === "camera" && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-medium text-content-inverse transition-all duration-[var(--duration-fast)] active:scale-95"
          >
            Retry camera access
          </button>
        ) : null}
      </div>
    </div>
  );
}
