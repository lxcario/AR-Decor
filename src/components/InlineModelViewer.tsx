import { Component, Suspense, useEffect, useMemo, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { ARCatalogProduct } from "../types/app";

interface InlineModelViewerProps {
  product: ARCatalogProduct;
  className?: string;
}

interface ViewerErrorBoundaryProps {
  fallback: (errorMsg: string) => ReactNode;
  children: ReactNode;
}

interface ViewerErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

const DRACO_DECODER_PATH = "/draco/";

class ViewerErrorBoundary extends Component<ViewerErrorBoundaryProps, ViewerErrorBoundaryState> {
  public constructor(props: ViewerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: "" };
  }

  public static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMsg: error.message || "Unable to load 3D preview.",
    };
  }

  public componentDidCatch(_error: Error, _info: ErrorInfo) {}

  public render() {
    if (this.state.hasError) {
      return this.props.fallback(this.state.errorMsg);
    }

    return this.props.children;
  }
}

function resolveFallbackLabel(errorMsg: string) {
  if (/missing glb asset|failed to fetch|404|load/i.test(errorMsg)) {
    return "Missing asset in /public/models";
  }

  return "3D preview unavailable";
}

function PosterFrame({ product, label }: { product: ARCatalogProduct; label?: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[#ede7dd]">
      <img
        src={product.assets.poster}
        alt={product.name}
        referrerPolicy="no-referrer"
        className="h-full w-full object-cover"
      />
      {label ? (
        <div className="absolute inset-x-4 bottom-4 rounded-full bg-black/65 px-4 py-2 text-center text-sm font-medium text-white backdrop-blur-xl">
          {label}
        </div>
      ) : null}
    </div>
  );
}

function PosterHtmlFallback({ product }: { product: ARCatalogProduct }) {
  return (
    <Html fullscreen>
      <PosterFrame product={product} />
    </Html>
  );
}

function ModelMesh({ product }: { product: ARCatalogProduct }) {
  const modelGlb = product.assets.modelGlb?.trim();

  if (!modelGlb) {
    throw new Error("Missing GLB asset.");
  }

  const gltf = useGLTF(modelGlb, DRACO_DECODER_PATH);
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export function InlineModelViewer({ product, className = "" }: InlineModelViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const maxDimension = Math.max(
    product.dimensionsMeters.width,
    product.dimensionsMeters.depth,
    product.dimensionsMeters.height,
  );
  const cameraPosition: [number, number, number] = [
    maxDimension * 1.8,
    maxDimension * 1.15,
    maxDimension * 2,
  ];

  useEffect(() => {
    const modelGlb = product.assets.modelGlb?.trim();

  if (!modelGlb) {
      return;
    }

    useGLTF.preload(modelGlb, DRACO_DECODER_PATH);
  }, [product.assets.modelGlb]);

  return (
    <div className={`relative h-full min-h-[320px] w-full overflow-hidden rounded-[28px] bg-[#ede7dd] ${className}`}>
      <ViewerErrorBoundary
        fallback={(errorMsg) => <PosterFrame product={product} label={resolveFallbackLabel(errorMsg)} />}
      >
        <Canvas
          camera={{ position: cameraPosition, fov: 36 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          className="h-full w-full"
        >
          <color attach="background" args={["#ede7dd"]} />
          <ambientLight intensity={0.95} />
          <hemisphereLight intensity={0.55} groundColor="#ccbca9" color="#fff8ef" />
          <directionalLight intensity={1.1} position={[4, 6, 5]} />
          <directionalLight intensity={0.45} position={[-3, 2, -4]} color="#f3dfc3" />
          <Suspense fallback={<PosterHtmlFallback product={product} />}>
            <ModelMesh product={product} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={1.1}
            onStart={() => setAutoRotate(false)}
            minDistance={maxDimension * 1.25}
            maxDistance={maxDimension * 3.5}
          />
        </Canvas>
      </ViewerErrorBoundary>
    </div>
  );
}


