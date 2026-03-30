import { Component, Suspense, useMemo, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import type { ARCatalogProduct } from "../types/app";

interface InlineModelViewerProps {
  product: ARCatalogProduct;
  className?: string;
}

interface ViewerErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ViewerErrorBoundaryState {
  hasError: boolean;
}

const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.6/";

class ViewerErrorBoundary extends Component<ViewerErrorBoundaryProps, ViewerErrorBoundaryState> {
  public constructor(props: ViewerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError() {
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _info: ErrorInfo) {}

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
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
  if (!product.assets.modelGlb.trim()) {
    throw new Error("Missing GLB asset.");
  }

  const gltf = useGLTF(product.assets.modelGlb, DRACO_DECODER_PATH);
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
    maxDimension * 1.25,
    maxDimension * 2.1,
  ];

  return (
    <div className={`relative h-full min-h-[320px] w-full overflow-hidden rounded-[28px] bg-[#ede7dd] ${className}`}>
      <ViewerErrorBoundary
        fallback={<PosterFrame product={product} label="3D preview unavailable" />}
      >
        <Canvas
          camera={{ position: cameraPosition, fov: 36 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
          className="h-full w-full"
        >
          <color attach="background" args={["#ede7dd"]} />
          <ambientLight intensity={0.85} />
          <directionalLight intensity={1.15} position={[3, 4, 5]} />
          <Suspense fallback={<PosterHtmlFallback product={product} />}>
            <Environment preset="apartment" />
            <ModelMesh product={product} />
          </Suspense>
          <OrbitControls
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={1.25}
            onStart={() => setAutoRotate(false)}
            minDistance={maxDimension * 1.3}
            maxDistance={maxDimension * 4}
          />
        </Canvas>
      </ViewerErrorBoundary>
    </div>
  );
}
