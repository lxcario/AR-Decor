import * as Sentry from "@sentry/react";
import { type ErrorInfo, type ReactNode } from "react";
import { Component } from "react";

interface GlobalErrorBoundaryProps {
  children: ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  public state: GlobalErrorBoundaryState = {
    hasError: false,
    errorMsg: "",
  };

  public static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return {
      hasError: true,
      errorMsg: error.message || "An unexpected error occurred.",
    };
  }

  public componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    console.error("[Observability] React Tree Crash:", error);
    Sentry.captureException(error);
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center"
        style={{
          backgroundColor: "var(--color-surface-base)",
          color: "var(--color-content-primary)",
        }}
      >
        <div className="space-y-3">
          <p className="font-sans text-xs uppercase tracking-[0.32em] text-neutral-500">AR Decor</p>
          <h1 className="font-serif text-3xl text-neutral-900">Something went wrong</h1>
          <p className="max-w-sm text-sm leading-6 text-neutral-600">
            The app hit an unexpected problem. Reload to start a fresh session.
          </p>
          {this.state.errorMsg ? (
            <p className="mx-auto max-w-sm rounded-full border border-neutral-200/70 bg-white/80 px-4 py-2 text-xs text-neutral-500">
              {this.state.errorMsg}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-medium text-white transition-all active:scale-95"
          style={{
            backgroundColor: "var(--color-brand-primary)",
          }}
          onClick={() => window.location.reload()}
        >
          Reload App
        </button>
      </div>
    );
  }
}
