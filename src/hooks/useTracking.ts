import posthog from "posthog-js";

const posthogKey = import.meta.env.VITE_POSTHOG_KEY;

if (typeof window !== "undefined" && posthogKey) {
  posthog.init(posthogKey, {
    api_host: "https://us.i.posthog.com",
  });
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (!posthogKey) {
    return;
  }

  posthog.capture(eventName, properties);
}
