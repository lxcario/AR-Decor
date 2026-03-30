import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: "half" | "full";
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = "half",
}: BottomSheetProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!isOpen) {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const focusSheet = window.setTimeout(() => {
      const focusableElements = sheetRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const firstElement = focusableElements?.[0] ?? sheetRef.current;
      firstElement?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) {
        return;
      }

      const focusableElements = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        sheetRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusSheet);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const minHeightClass = snapPoints === "full" ? "min-h-[88vh]" : "min-h-[50vh]";
  const animationDuration = prefersReducedMotion ? 0 : 0.22;

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[var(--z-sheet)]">
          <motion.button
            type="button"
            aria-label="Close sheet"
            className="absolute inset-0 h-full w-full bg-[var(--color-surface-overlay)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: animationDuration }}
            onClick={onClose}
          />

          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ y: prefersReducedMotion ? 0 : "100%", opacity: prefersReducedMotion ? 1 : 0.98 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: prefersReducedMotion ? 0 : "100%", opacity: prefersReducedMotion ? 1 : 0.98 }}
            transition={{ duration: animationDuration, ease: [0.4, 0, 0.2, 1] }}
            className={`absolute inset-x-0 bottom-0 rounded-t-[var(--radius-lg)] bg-surface-raised px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 shadow-[0_-24px_60px_rgba(0,0,0,0.16)] ${minHeightClass}`}
          >
            <div className="mx-auto h-1.5 w-14 rounded-full bg-content-disabled/70" />
            {title ? (
              <div className="mt-4 flex items-center justify-between gap-4">
                <h2 id={titleId} className="text-lg font-semibold text-content-primary">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-content-primary transition-all duration-[var(--duration-fast)] active:scale-95"
                >
                  Close
                </button>
              </div>
            ) : null}
            <div className="mt-4 h-full overflow-y-auto pb-4">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
