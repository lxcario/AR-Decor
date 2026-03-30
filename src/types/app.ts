export type ProductCategoryId =
  | "sofas"
  | "tables"
  | "lighting"
  | "seating"
  | "storage"
  | "textiles"
  | "decor";

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
}

export interface ProductCategory {
  id: ProductCategoryId;
  label: string;
  description: string;
  coverImage: string;
  accentLabel: string;
}

export interface ProductDimensions {
  widthIn: number;
  depthIn: number;
  heightIn: number;
  seatHeightIn?: number;
}

export interface ProductFinish {
  name: string;
  swatch: string;
  material: string;
}

export interface ProductInventory {
  status: "in_stock" | "limited" | "made_to_order";
  leadTimeLabel: string;
  piecesLeft?: number;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  collection: string;
  designer: string;
  categoryId: ProductCategoryId;
  badge?: string;
  tagline: string;
  shortDescription: string;
  description: string;
  roomSceneLabel: string;
  priceUsd: number;
  compareAtUsd?: number;
  rating: number;
  reviewCount: number;
  heroImage: ProductImage;
  gallery: ProductImage[];
  arPlacementImage: ProductImage;
  inventory: ProductInventory;
  finishes: ProductFinish[];
  materials: string[];
  dimensions: ProductDimensions;
  features: string[];
  care: string[];
  demoPrompt: string;
  brand?: string;
  price?: number;
  currency?: string;
  tags?: string[];
  assets?: ProductAssetBundle;
  dimensionsMeters?: ProductDimensionsMeters;
  placement?: ProductPlacementConfig;
}

export interface ProductAssetBundle {
  modelGlb: string | null;
  modelUsdz: string | null;
  poster: string;
  images: string[];
}


export type ARCatalogCategory =
  | "armchair"
  | "basket"
  | "candle"
  | "clock"
  | "cushion"
  | "lamp"
  | "mirror"
  | "pot"
  | "rug"
  | "sculpture"
  | "shelf"
  | "sofa"
  | "table"
  | "tray"
  | "vase"
  | "wall_art";
export interface ProductDimensionsMeters {
  width: number;
  depth: number;
  height: number;
}

export interface ProductPlacementConfig {
  surface: "floor" | "wall" | "tabletop";
  defaultScale: number;
  allowRotate: boolean;
  allowScale: boolean;
}

export interface ARCatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  category: ARCatalogCategory;
  tags: string[];
  assets: ProductAssetBundle;
  dimensionsMeters: ProductDimensionsMeters;
  placement: ProductPlacementConfig;
}

export type ARCapabilityLevel =
  | "webxr"
  | "quicklook"
  | "sceneviewer"
  | "inline3d"
  | "unknown";

export interface ARCapability {
  level: ARCapabilityLevel;
  isSecureContext: boolean;
  hasCamera: boolean;
  webxrSessionTypes: string[];
}

export type TrackingState =
  | "idle"
  | "requesting_permission"
  | "scanning"
  | "surface_found"
  | "placing"
  | "refining"
  | "limited"
  | "lost"
  | "fallback";

export interface PlacedObject {
  instanceId: string;
  productId: string;
  anchorId?: string;
  transform: {
    positionMeters: [number, number, number];
    rotationY: number;
    scale: number;
  };
  persistedAt: number;
}

export type ARMode =
  | "scanning"
  | "previewing"
  | "placing"
  | "editing"
  | "capturing"
  | "fallback";

export interface CaptureState {
  isCapturing: boolean;
  lastCaptureDataUrl: string | null;
  error: string | null;
}

export interface InspectorState {
  isOpen: boolean;
  targetInstanceId: string | null;
}




