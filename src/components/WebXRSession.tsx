import { ArrowLeft, Camera, Check, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import { routes } from "../app/routes";
import { useHitTest } from "../hooks/useHitTest";
import { useWebXRSession } from "../hooks/useWebXRSession";
import type { ARCatalogProduct, CaptureState, PlacedObject, TrackingState } from "../types/app";
import { ARStatusHUD } from "./ARStatusHUD";
import { PermissionPrompt } from "./PermissionPrompt";

interface WebXRSessionProps {
  product: ARCatalogProduct;
}

type WebXRPresentationMode =
  | "idle"
  | "scanning"
  | "surface_found"
  | "placing"
  | "editing"
  | "capturing"
  | "fallback";

function createInstanceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `placed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function quaternionToYaw(orientation: DOMPointReadOnly) {
  const { x, y, z, w } = orientation;
  return Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + z * z));
}

function buildPlacedObject(product: ARCatalogProduct, pose: XRPose): PlacedObject {
  const { position, orientation } = pose.transform;

  return {
    instanceId: createInstanceId(),
    productId: product.id,
    transform: {
      positionMeters: [position.x, position.y, position.z],
      rotationY: quaternionToYaw(orientation),
      scale: product.placement.defaultScale,
    },
    persistedAt: Date.now(),
  };
}

function createProxyMesh(product: ARCatalogProduct, placedObject: PlacedObject, ghost = false) {
  const width = product.dimensionsMeters.width;
  const depth = product.dimensionsMeters.depth;
  const height = product.dimensionsMeters.height;
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhysicalMaterial({
    color: ghost ? "#b5a48b" : "#f0eadf",
    transparent: true,
    opacity: ghost ? 0.45 : 0.88,
    roughness: 0.42,
    metalness: 0.04,
  });
  const mesh = new THREE.Mesh(geometry, material);
  const [x, y, z] = placedObject.transform.positionMeters;
  const scaledHeight = height * placedObject.transform.scale;

  mesh.position.set(x, y + scaledHeight / 2, z);
  mesh.rotation.y = placedObject.transform.rotationY;
  mesh.scale.setScalar(placedObject.transform.scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.instanceId = placedObject.instanceId;

  return mesh;
}

function disposeObject3D(object: THREE.Object3D) {
  object.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry.dispose();

      const material = node.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    }
  });
}

function permissionReasonFromError(error: string | null) {
  if (!window.isSecureContext) {
    return "insecure_context" as const;
  }

  if (error === "camera_denied") {
    return "camera" as const;
  }

  return "webxr_unavailable" as const;
}

export default function WebXRSession({ product }: WebXRSessionProps) {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const currentTrackingStateRef = useRef<TrackingState>("idle");
  const liveHitPoseRef = useRef<XRPose | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const captureDataUrlRef = useRef<string | null>(null);
  const captureErrorRef = useRef<string | null>(null);
  const hasRequestedSessionRef = useRef(false);
  const hasSeenSurfaceRef = useRef(false);
  const isExitingRef = useRef(false);
  const placedGroupRef = useRef<THREE.Group | null>(null);

  const [overlayRoot, setOverlayRoot] = useState<HTMLDivElement | null>(null);
  const [referenceSpace, setReferenceSpace] = useState<XRReferenceSpace | null>(null);
  const [trackingState, setTrackingState] = useState<TrackingState>("idle");
  const [presentationMode, setPresentationMode] = useState<WebXRPresentationMode>("idle");
  const [draftObject, setDraftObject] = useState<PlacedObject | null>(null);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [captureState, setCaptureState] = useState<CaptureState>({
    isCapturing: false,
    lastCaptureDataUrl: null,
    error: null,
  });
  const [showFlashOverlay, setShowFlashOverlay] = useState(false);

  const {
    session,
    trackingState: sessionTrackingState,
    startSession,
    endSession,
    error: sessionError,
  } = useWebXRSession(overlayRoot);
  const { hitPose, isTracking } = useHitTest(session, referenceSpace, liveHitPoseRef);

  currentTrackingStateRef.current = trackingState;


  useEffect(() => {
    if (overlayRoot && !session && !hasRequestedSessionRef.current) {
      hasRequestedSessionRef.current = true;
      void startSession();
    }
  }, [overlayRoot, session, startSession]);

  useEffect(() => {
    let isCancelled = false;

    if (!session) {
      setReferenceSpace(null);
      return undefined;
    }

    hasSeenSurfaceRef.current = false;

    void session
      .requestReferenceSpace("local")
      .then((space) => {
        if (!isCancelled) {
          setReferenceSpace(space);
          setTrackingState("scanning");
          setPresentationMode("scanning");
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setTrackingState("fallback");
          setPresentationMode("fallback");
        }
      });

    return () => {
      isCancelled = true;
      setReferenceSpace(null);
    };
  }, [session]);

  useEffect(() => {
    if (sessionTrackingState === "fallback") {
      setTrackingState("fallback");
      setPresentationMode("fallback");
      return;
    }

    if (!session && hasRequestedSessionRef.current && !isExitingRef.current && sessionTrackingState === "idle") {
      setTrackingState("fallback");
      setPresentationMode("fallback");
    }
  }, [session, sessionTrackingState]);

  useEffect(() => {
    if (!session || !referenceSpace) {
      return;
    }

    if (["placing", "editing", "capturing", "fallback"].includes(presentationMode)) {
      return;
    }

    if (isTracking && hitPose) {
      hasSeenSurfaceRef.current = true;
      setTrackingState("surface_found");
      setPresentationMode("surface_found");
      return;
    }

    setTrackingState(hasSeenSurfaceRef.current ? "lost" : "scanning");
    setPresentationMode("scanning");
  }, [hitPose, isTracking, presentationMode, referenceSpace, session]);

  useEffect(() => {
    if (!session || !referenceSpace || !viewportRef.current) {
      return undefined;
    }

    const computedStyle = getComputedStyle(document.documentElement);
    const readyColor = computedStyle.getPropertyValue("--color-reticle-ready").trim() || "#b5a48b";
    const idleColor = computedStyle.getPropertyValue("--color-reticle-idle").trim() || "rgba(255,255,255,0.6)";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 30);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    const reticleMaterial = new THREE.MeshBasicMaterial({ color: readyColor, transparent: true, opacity: 0.6 });
    const reticle = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 48), reticleMaterial);
    const placedGroup = new THREE.Group();
    let isDisposed = false;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local");

    reticle.rotation.x = -Math.PI / 2;
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;

    scene.add(new THREE.HemisphereLight("#ffffff", "#6f5b49", 1.15));
    const directionalLight = new THREE.DirectionalLight("#ffffff", 1.1);
    directionalLight.position.set(0, 6, 3);
    scene.add(directionalLight);
    scene.add(reticle);
    scene.add(placedGroup);

    viewportRef.current.innerHTML = "";
    viewportRef.current.appendChild(renderer.domElement);

    rendererRef.current = renderer;
    placedGroupRef.current = placedGroup;

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const renderXRFrame = (_time: number, frame?: XRFrame) => {
      if (frame && liveHitPoseRef.current) {
        const activePose = liveHitPoseRef.current;
        const matrixArray = Array.from(activePose.transform.matrix);
        reticle.visible = true;
        reticle.matrix.fromArray(matrixArray);
        reticle.matrix.decompose(reticle.position, reticle.quaternion, reticle.scale);
        reticle.position.y += 0.001;
        reticle.updateMatrix();

        const activeTrackingState = currentTrackingStateRef.current;
        const isReady = activeTrackingState === "surface_found" || activeTrackingState === "placing";
        reticleMaterial.color.set(isReady ? readyColor : idleColor);
        reticleMaterial.opacity = isReady ? 1 : 0.6;
      } else {
        reticle.visible = false;
      }

      renderer.render(scene, camera);
    };

    window.addEventListener("resize", handleResize);

    void renderer.xr
      .setSession(session)
      .then(() => {
        if (!isDisposed) {
          renderer.setAnimationLoop(renderXRFrame);
        }
      })
      .catch(() => {
        if (!isDisposed) {
          setTrackingState("fallback");
          setPresentationMode("fallback");
        }
      });

    return () => {
      isDisposed = true;
      window.removeEventListener("resize", handleResize);
      renderer.setAnimationLoop(null);

      if (viewportRef.current?.contains(renderer.domElement)) {
        viewportRef.current.removeChild(renderer.domElement);
      }

      disposeObject3D(scene);
      renderer.dispose();
      rendererRef.current = null;
      placedGroupRef.current = null;
    };
  }, [referenceSpace, session]);

  useEffect(() => {
    const placedGroup = placedGroupRef.current;

    if (!placedGroup) {
      return;
    }

    while (placedGroup.children.length > 0) {
      const child = placedGroup.children[0];
      placedGroup.remove(child);
      disposeObject3D(child);
    }

    placedObjects.forEach((placedObject) => {
      placedGroup.add(createProxyMesh(product, placedObject));
    });

    if (draftObject) {
      placedGroup.add(createProxyMesh(product, draftObject, true));
    }
  }, [draftObject, placedObjects, product]);

  useEffect(() => {
    let syncHandle = 0;

    const syncCaptureState = () => {
      if (captureDataUrlRef.current || captureErrorRef.current) {
        const nextDataUrl = captureDataUrlRef.current;
        const nextError = captureErrorRef.current;

        captureDataUrlRef.current = null;
        captureErrorRef.current = null;
        setCaptureState((currentState) => ({
          isCapturing: false,
          lastCaptureDataUrl: nextDataUrl ?? currentState.lastCaptureDataUrl,
          error: nextError,
        }));
        setPresentationMode("editing");
        setTrackingState("refining");

        if (nextDataUrl) {
          setShowFlashOverlay(true);

          if (flashTimerRef.current) {
            window.clearTimeout(flashTimerRef.current);
          }

          flashTimerRef.current = window.setTimeout(() => {
            setShowFlashOverlay(false);
          }, 140);
        }
      }

      syncHandle = window.setTimeout(syncCaptureState, 32);
    };

    syncHandle = window.setTimeout(syncCaptureState, 32);

    return () => {
      window.clearTimeout(syncHandle);

      if (flashTimerRef.current) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const handleExit = () => {
    isExitingRef.current = true;
    endSession();

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(routes.product(product.slug));
  };

  const handleRetrySession = () => {
    setTrackingState("idle");
    setPresentationMode("idle");
    void startSession();
  };

  const handleTapToPlace = () => {
    if (!liveHitPoseRef.current) {
      return;
    }

    const nextDraftObject = buildPlacedObject(product, liveHitPoseRef.current);
    setDraftObject(nextDraftObject);
    setSelectedInstanceId(nextDraftObject.instanceId);
    setTrackingState("placing");
    setPresentationMode("placing");
  };

  const handleConfirmPlacement = () => {
    if (!draftObject) {
      return;
    }

    setPlacedObjects((currentObjects) => [...currentObjects, draftObject]);
    setSelectedInstanceId(draftObject.instanceId);
    setDraftObject(null);
    setTrackingState("refining");
    setPresentationMode("editing");
  };

  const handleCancelPlacement = () => {
    const nextMode = isTracking && hitPose ? "surface_found" : "scanning";
    const nextTrackingState = isTracking && hitPose ? "surface_found" : "scanning";

    setDraftObject(null);
    setSelectedInstanceId(null);
    setTrackingState(nextTrackingState);
    setPresentationMode(nextMode);
  };

  const handleDoneEditing = () => {
    setSelectedInstanceId(null);
    setTrackingState("scanning");
    setPresentationMode("scanning");
  };

  const handleDelete = () => {
    const targetId = selectedInstanceId ?? placedObjects.at(-1)?.instanceId ?? null;

    if (!targetId) {
      setTrackingState("scanning");
      setPresentationMode("scanning");
      return;
    }

    setPlacedObjects((currentObjects) => currentObjects.filter((object) => object.instanceId !== targetId));
    setSelectedInstanceId(null);
    setTrackingState("scanning");
    setPresentationMode("scanning");
  };

  const handleCapture = () => {
    if (!session || !rendererRef.current) {
      return;
    }

    setCaptureState((currentState) => ({
      ...currentState,
      isCapturing: true,
      error: null,
    }));
    setPresentationMode("capturing");
    setTrackingState("refining");

    session.requestAnimationFrame(() => {
      try {
        captureDataUrlRef.current = rendererRef.current?.domElement.toDataURL("image/png") ?? null;
        captureErrorRef.current = null;
      } catch {
        captureErrorRef.current = "Unable to capture the current AR frame.";
      }
    });
  };

  const topStatusLabel = useMemo(() => {
    if (presentationMode === "scanning") {
      return "Finding surface...";
    }

    if (presentationMode === "surface_found" || presentationMode === "placing" || presentationMode === "editing") {
      return product.name;
    }

    return "";
  }, [presentationMode, product.name]);

  const permissionReason = permissionReasonFromError(sessionError);
  const isPreparing = presentationMode === "idle" || sessionTrackingState === "requesting_permission";
  const showActionBar = ["surface_found", "placing", "editing", "capturing"].includes(presentationMode);

  return (
    <div
      ref={setOverlayRoot}
      className="relative min-h-screen overflow-hidden bg-[#0d0b0a] text-white"
    >
      <div ref={viewportRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.06),rgba(10,10,10,0.14)_30%,rgba(10,10,10,0.42)_100%)]" />
      {showFlashOverlay ? <div className="pointer-events-none absolute inset-0 z-30 bg-white/75" /> : null}
      <ARStatusHUD trackingState={trackingState} placedCount={placedObjects.length} />

      <div className="relative z-20 flex min-h-screen flex-col px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleExit}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 backdrop-blur-xl transition-all duration-[var(--duration-fast)] active:scale-95"
            aria-label="Exit AR"
          >
            <ArrowLeft size={18} />
          </button>

          {presentationMode !== "fallback" ? (
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/82 backdrop-blur-xl">
              {topStatusLabel}
            </div>
          ) : (
            <div />
          )}
        </div>

        <div className="flex-1" />

        {isPreparing ? (
          <div className="mx-auto mb-6 w-full max-w-sm rounded-[28px] border border-white/12 bg-black/38 p-5 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
              <Camera size={20} />
            </div>
            <p className="mt-4 text-sm font-medium text-white">Preparing your AR session</p>
            <p className="mt-2 text-xs leading-5 text-white/64">Allow camera access if prompted to continue into immersive preview.</p>
          </div>
        ) : null}

        {presentationMode === "fallback" ? (
          <div className="mt-auto">
            <PermissionPrompt reason={permissionReason} onRetry={permissionReason === "camera" ? handleRetrySession : undefined} />
          </div>
        ) : null}

        {showActionBar ? (
          <div className="mt-auto rounded-[30px] border border-white/12 bg-black/34 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            {presentationMode === "surface_found" ? (
              <button
                type="button"
                onClick={handleTapToPlace}
                className="w-full rounded-full border border-white/18 bg-white/12 px-5 py-4 text-sm font-medium text-white transition-all duration-[var(--duration-fast)] active:scale-95"
              >
                Tap to place
              </button>
            ) : null}

            {presentationMode === "placing" ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleConfirmPlacement}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-4 text-sm font-medium text-neutral-950 transition-all duration-[var(--duration-fast)] active:scale-95"
                >
                  <Check size={16} />
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={handleCancelPlacement}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-white/10 px-5 py-4 text-sm font-medium text-white transition-all duration-[var(--duration-fast)] active:scale-95"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ) : null}

            {presentationMode === "editing" ? (
              <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                <button
                  type="button"
                  onClick={handleDoneEditing}
                  className="rounded-full bg-white px-5 py-4 text-sm font-medium text-neutral-950 transition-all duration-[var(--duration-fast)] active:scale-95"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  className="rounded-full border border-white/18 bg-white/10 px-5 py-4 text-sm font-medium text-white transition-all duration-[var(--duration-fast)] active:scale-95"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/18 bg-white/10 text-white transition-all duration-[var(--duration-fast)] active:scale-95"
                  aria-label="Delete placed object"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : null}

            {presentationMode === "capturing" ? (
              <div className="text-center text-sm font-medium text-white/80">Capturing frame...</div>
            ) : null}
          </div>
        ) : null}

        {captureState.lastCaptureDataUrl && presentationMode === "editing" ? (
          <div className="mt-3 self-end rounded-[22px] border border-white/15 bg-black/32 p-2 backdrop-blur-xl">
            <img
              src={captureState.lastCaptureDataUrl}
              alt="Latest AR capture"
              className="h-20 w-20 rounded-[16px] object-cover"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}


