import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Grip,
  RefreshCcw,
  ScanSearch,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { routes } from "../app/routes";
import { getProductBySlug } from "../data";
import { formatUsd } from "../lib/currency";
import { NotFoundPage } from "./NotFoundPage";

type CameraState = "requesting" | "scanning" | "ready" | "error" | "unsupported";

interface PlacementState {
  scale: number;
  x: number;
  y: number;
}

const initialPlacement: PlacementState = {
  x: 50,
  y: 67,
  scale: 1,
};

const scalePresets = [
  { label: "Small", value: 0.82 },
  { label: "True", value: 1 },
  { label: "Large", value: 1.18 },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function ARViewPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const product = slug ? getProductBySlug(slug) : undefined;
  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [placement, setPlacement] = useState<PlacementState>(initialPlacement);
  const [isDragging, setIsDragging] = useState(false);
  const [showPlacementHint, setShowPlacementHint] = useState(true);
  const [retrySeed, setRetrySeed] = useState(0);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<number | null>(null);
  const hintTimerRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    setPlacement(initialPlacement);
    setShowPlacementHint(true);
    setIsDragging(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const clearTimers = () => {
      if (scanTimerRef.current) {
        window.clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }

      if (hintTimerRef.current) {
        window.clearTimeout(hintTimerRef.current);
        hintTimerRef.current = null;
      }
    };

    let isCancelled = false;

    clearTimers();
    stopStream();
    setCameraState("requesting");
    setShowPlacementHint(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return () => {
        clearTimers();
        stopStream();
      };
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
      })
      .then((stream) => {
        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }

        setCameraState("scanning");
        scanTimerRef.current = window.setTimeout(() => {
          setCameraState("ready");
          hintTimerRef.current = window.setTimeout(() => {
            setShowPlacementHint(false);
          }, 2600);
        }, 2200);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        if (
          error instanceof DOMException &&
          (error.name === "NotAllowedError" || error.name === "SecurityError")
        ) {
          setCameraState("error");
          return;
        }

        setCameraState("unsupported");
      });

    return () => {
      isCancelled = true;
      clearTimers();
      stopStream();
    };
  }, [product, retrySeed]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragOffsetRef.current || !previewRef.current) {
        return;
      }

      const bounds = previewRef.current.getBoundingClientRect();
      const nextX = clamp(
        ((event.clientX - bounds.left - dragOffsetRef.current.offsetX) / bounds.width) * 100,
        18,
        82,
      );
      const nextY = clamp(
        ((event.clientY - bounds.top - dragOffsetRef.current.offsetY) / bounds.height) * 100,
        24,
        82,
      );

      setPlacement((currentPlacement) => ({
        ...currentPlacement,
        x: nextX,
        y: nextY,
      }));
    };

    const handlePointerUp = () => {
      if (!dragOffsetRef.current) {
        return;
      }

      dragOffsetRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  if (!product) {
    return <NotFoundPage />;
  }

  const statusLabel =
    cameraState === "ready"
      ? "Floor detected"
      : cameraState === "scanning"
        ? "Detecting floor..."
        : cameraState === "requesting"
          ? "Opening camera..."
          : cameraState === "error"
            ? "Camera blocked"
            : "Camera unsupported";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(routes.product(product.slug));
  };

  const handleRetry = () => {
    setRetrySeed((current) => current + 1);
  };

  const handleResetPlacement = () => {
    setPlacement(initialPlacement);
    setShowPlacementHint(true);
  };

  const handleScaleChange = (scale: number) => {
    setPlacement((currentPlacement) => ({
      ...currentPlacement,
      scale,
    }));
    setShowPlacementHint(false);
  };

  const handlePlacementPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (cameraState !== "ready" || !previewRef.current) {
      return;
    }

    const bounds = previewRef.current.getBoundingClientRect();
    const centerX = bounds.left + (placement.x / 100) * bounds.width;
    const centerY = bounds.top + (placement.y / 100) * bounds.height;

    dragOffsetRef.current = {
      offsetX: event.clientX - centerX,
      offsetY: event.clientY - centerY,
    };

    setIsDragging(true);
    setShowPlacementHint(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <main className="min-h-screen bg-white px-4 pb-6 pt-[calc(1rem+env(safe-area-inset-top))] text-neutral-900">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 transition-all duration-200 active:scale-95 text-neutral-900"
          aria-label="Back to product"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="rounded-full border border-brand-accent/20 bg-brand-accent/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-brand-accent font-semibold">
          {statusLabel}
        </div>

        <Link
          to={routes.product(product.slug)}
          className="inline-flex h-11 items-center rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs uppercase tracking-[0.18em] text-neutral-900 font-medium transition-all duration-200 active:scale-95"
        >
          Details
        </Link>
      </div>

      <section
        ref={previewRef}
        className="relative mt-4 min-h-[78vh] overflow-hidden rounded-[40px] border border-neutral-200 bg-neutral-100 shadow-2xl"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            cameraState === "unsupported" || cameraState === "error" ? "opacity-0" : "opacity-100"
          }`}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_34%),linear-gradient(180deg,rgba(12,11,10,0.28),rgba(12,11,10,0.08)_30%,rgba(12,11,10,0.56)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />

        <div className="absolute inset-x-4 top-4 z-20 rounded-[28px] border border-white/10 bg-black/22 p-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/58">AR Placement</p>
              <h1 className="mt-2 font-display text-3xl leading-tight text-white">{product.name}</h1>
              <p className="mt-2 max-w-[220px] text-xs leading-5 text-white/64">{product.roomSceneLabel}</p>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-white/76">
              {formatUsd(product.priceUsd)}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {cameraState === "requesting" || cameraState === "scanning" ? (
            <motion.div
              key={cameraState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-10"
            >
              <div className="absolute inset-0 bg-black/18" />
              <motion.div
                initial={{ y: "22%", opacity: 0.65 }}
                animate={{ y: "78%", opacity: 1 }}
                transition={{ repeat: Infinity, repeatType: "mirror", duration: 1.7, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-x-8 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent shadow-[0_0_22px_rgba(255,255,255,0.85)]"
              />
              <div className="absolute inset-x-6 top-28 rounded-[28px] border border-white/15 bg-black/28 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12">
                    <ScanSearch size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{cameraState === "requesting" ? "Preparing camera" : "Detecting Floor..."}</p>
                    <p className="mt-1 text-xs leading-5 text-white/64">
                      {cameraState === "requesting"
                        ? "Grant access to preview the room in real time."
                        : "Hold steady for a moment so the scene can settle."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {(cameraState === "error" || cameraState === "unsupported") && (
            <motion.div
              key={cameraState}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-0 z-20 flex items-center justify-center px-6"
            >
              <div className="w-full rounded-[34px] border border-white/12 bg-black/42 p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  <Camera size={22} />
                </div>
                <h1 className="mt-4 font-display text-4xl leading-tight text-white">
                  {cameraState === "error" ? "Camera access is needed." : "Camera preview isn't available here."}
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/68">
                  {cameraState === "error"
                    ? "Enable camera permission for this site, then retry to place the piece in your room."
                    : "This device or browser does not expose a rear-camera stream, so the AR preview cannot start."}
                </p>
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
                  >
                    <RefreshCcw size={16} />
                    Retry camera
                  </button>
                  <Link
                    to={routes.product(product.slug)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-all duration-200 active:scale-95"
                  >
                    Back to product
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {cameraState === "ready" ? (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="pointer-events-none absolute inset-x-[16%] bottom-[15%] z-10 h-[15%] rounded-full border border-white/10 bg-white/5 blur-[1px]"
            />

            <button
              type="button"
              onPointerDown={handlePlacementPointerDown}
              className={`absolute z-20 w-[46vw] max-w-[220px] min-w-[150px] touch-none select-none transition-transform duration-200 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              style={{
                left: `${placement.x}%`,
                top: `${placement.y}%`,
                transform: `translate(-50%, -50%) scale(${placement.scale}) rotate(-2deg)`,
              }}
            >
              <div className="relative">
                <div className="absolute inset-x-[14%] bottom-[-14px] h-7 rounded-full bg-black/45 blur-xl" />
                <img
                  src={product.arPlacementImage.src}
                  alt={product.arPlacementImage.alt}
                  referrerPolicy="no-referrer"
                  className={`relative w-full rounded-[30px] border border-white/18 object-cover shadow-[0_22px_60px_rgba(0,0,0,0.32)] transition-all duration-200 ${
                    isDragging ? "opacity-92" : "opacity-100"
                  }`}
                />
                <AnimatePresence>
                  {showPlacementHint ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/16 bg-black/55 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/88 backdrop-blur-xl"
                    >
                      <Grip size={12} />
                      <span>Drag to place</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </button>
          </>
        ) : null}

        <div className="absolute inset-x-4 bottom-4 z-30">
          <div className="rounded-[34px] border border-white/10 bg-black/28 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/58">Placement controls</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {cameraState === "ready"
                    ? "Drag the piece until it feels grounded in the room, then fine-tune the scale."
                    : "The room preview will unlock once the scan completes."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetPlacement}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white transition-all duration-200 active:scale-95"
              >
                <RefreshCcw size={14} />
                Reset
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {scalePresets.map((preset) => {
                const isSelected = Math.abs(placement.scale - preset.value) < 0.05;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleScaleChange(preset.value)}
                    disabled={cameraState !== "ready"}
                    className={`rounded-full px-4 py-3 text-xs font-medium uppercase tracking-[0.18em] transition-all duration-200 active:scale-95 disabled:cursor-default disabled:opacity-40 disabled:active:scale-100 ${
                      isSelected
                        ? "bg-white text-neutral-950"
                        : "border border-white/12 bg-white/8 text-white"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
              <div className="rounded-[24px] border border-white/12 bg-white/8 p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/58">Scene status</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {isDragging ? "Moving piece" : cameraState === "ready" ? "Placement ready" : statusLabel}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/56">
                  {showPlacementHint ? "Hint is visible for first placement." : "Hint is hidden for a cleaner preview."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPlacementHint((current) => !current)}
                className="inline-flex min-w-[112px] items-center justify-center rounded-[24px] bg-white px-4 py-4 text-sm font-medium text-neutral-950 transition-all duration-200 active:scale-95"
              >
                {showPlacementHint ? "Hide hint" : "Show hint"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
