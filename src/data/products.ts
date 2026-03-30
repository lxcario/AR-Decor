import rawProducts from "./products.json";
import type { ARCatalogProduct, Product, ProductCategoryId, ProductImage, ProductInventory } from "../types/app";

const catalog = rawProducts as ARCatalogProduct[];

const categoryMap: Record<ARCatalogProduct["category"], ProductCategoryId> = {
  armchair: "seating",
  basket: "decor",
  candle: "decor",
  clock: "lighting",
  cushion: "textiles",
  lamp: "lighting",
  mirror: "decor",
  pot: "decor",
  rug: "textiles",
  sculpture: "decor",
  shelf: "storage",
  sofa: "sofas",
  table: "tables",
  tray: "decor",
  vase: "decor",
  wall_art: "decor",
};

const categoryTaglines: Record<ARCatalogProduct["category"], string> = {
  armchair: "An accent seat with presence from every angle.",
  basket: "Textural storage that softens corners and circulation.",
  candle: "A small-form accent for tables, trays, and shelves.",
  clock: "A clean wall detail with functional rhythm.",
  cushion: "A soft accent for layered seating and bedrooms.",
  lamp: "Soft ambient light with a decorative presence.",
  mirror: "Reflective styling that opens the room without clutter.",
  pot: "A ceramic accent for greenery and shelf styling.",
  rug: "Pattern and texture that grounds the room from the floor up.",
  sculpture: "A collectible accent with gallery-style presence.",
  shelf: "Slim storage that reads as architecture.",
  sofa: "Sink-in comfort with a room-anchoring silhouette.",
  table: "A grounded surface with sculptural proportion.",
  tray: "A tabletop layer that organizes and frames styling.",
  vase: "A sculptural accent sized for shelves and side tables.",
  wall_art: "A wall piece scaled for instant composition.",
};

const swatchByCategory: Record<ARCatalogProduct["category"], string> = {
  armchair: "#d9d2cb",
  basket: "#b48752",
  candle: "#e3d0bf",
  clock: "#c8c6bf",
  cushion: "#8f877d",
  lamp: "#d7c5a6",
  mirror: "#b8b1a8",
  pot: "#b56f42",
  rug: "#c4baa4",
  sculpture: "#d7d0c8",
  shelf: "#8a6547",
  sofa: "#c9c0b6",
  table: "#c2b39b",
  tray: "#d8d2cb",
  vase: "#c8b095",
  wall_art: "#cab79b",
};

function toTitleCase(value: string) {
  return value
    .split(/[_-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function metersToInches(value: number) {
  return Math.round(value * 39.3701);
}

function firstSentence(value: string) {
  const match = value.match(/.+?[.!?](?:\s|$)/);
  return (match?.[0] ?? value).trim();
}

function image(id: string, src: string, alt: string): ProductImage {
  return { id, src, alt };
}

function inventoryFor(product: ARCatalogProduct): ProductInventory {
  if (["sofa", "armchair", "table"].includes(product.category)) {
    return {
      status: "made_to_order",
      leadTimeLabel: "Made to order in 4-6 weeks",
    };
  }

  if (["mirror", "sculpture", "shelf"].includes(product.category)) {
    return {
      status: "limited",
      leadTimeLabel: "Small batch ships in 10-14 days",
      piecesLeft: 12,
    };
  }

  return {
    status: "in_stock",
    leadTimeLabel: "Ready to ship in 3-7 days",
  };
}

function roomSceneLabel(surface: ARCatalogProduct["placement"]["surface"]) {
  switch (surface) {
    case "wall":
      return "Wall styling";
    case "tabletop":
      return "Shelf and tabletop styling";
    default:
      return "Open room setting";
  }
}

function materialList(product: ARCatalogProduct) {
  const derived = product.tags.slice(0, 4).map(toTitleCase);
  return derived.length > 0 ? derived : [toTitleCase(product.category)];
}

function finishList(product: ARCatalogProduct) {
  const primary = toTitleCase(product.tags[0] ?? product.category);
  const secondary = toTitleCase(product.tags[1] ?? product.category);

  return [
    {
      name: primary,
      swatch: swatchByCategory[product.category],
      material: secondary,
    },
  ];
}

function createSku(product: ARCatalogProduct) {
  return `ARD-${product.category.toUpperCase().replace(/_/g, "-")}-${product.id.toUpperCase()}`;
}

function buildGallery(product: ARCatalogProduct) {
  return product.assets.images.slice(1, 4).map((src, index) =>
    image(`${product.id}-gallery-${index + 1}`, src, `${product.name} gallery view ${index + 1}`),
  );
}

function toStorefrontProduct(product: ARCatalogProduct, index: number): Product {
  const heroSrc = product.assets.images[0] ?? product.assets.poster;
  const shortDescription = firstSentence(product.description);

  return {
    id: product.id,
    slug: product.slug,
    sku: createSku(product),
    name: product.name,
    collection: product.brand,
    designer: product.brand,
    categoryId: categoryMap[product.category],
    badge: index === 0 ? "Featured in AR" : product.placement.surface === "wall" ? "Wall placement" : undefined,
    tagline: categoryTaglines[product.category],
    shortDescription,
    description: product.description,
    roomSceneLabel: roomSceneLabel(product.placement.surface),
    priceUsd: product.price,
    rating: 4.6 + ((index % 4) * 0.1),
    reviewCount: 28 + index * 7,
    heroImage: image(`${product.id}-hero`, heroSrc, `${product.name} hero image`),
    gallery: buildGallery(product),
    arPlacementImage: image(`${product.id}-ar`, product.assets.poster, `${product.name} placement preview`),
    inventory: inventoryFor(product),
    finishes: finishList(product),
    materials: materialList(product),
    dimensions: {
      widthIn: metersToInches(product.dimensionsMeters.width),
      depthIn: metersToInches(product.dimensionsMeters.depth),
      heightIn: metersToInches(product.dimensionsMeters.height),
    },
    features: [
      `Mapped for ${product.placement.surface} placement with real-world scale.`,
      `Uses the ${product.category.replace(/_/g, " ")} pipeline strategy for 3D generation.`,
      `Poster image and dimensions are ready for model generation and AR preview.`,
    ],
    care: [
      "Keep surfaces dust-free before capturing reference photos.",
      "Use even lighting for cleaner depth generation and better previews.",
      "Store away from direct moisture or prolonged heat when styling indoors.",
    ],
    demoPrompt: `A premium mobile AR decor demo of ${product.name} being previewed in a real room with accurate scale and calm editorial styling.`,
    brand: product.brand,
    price: product.price,
    currency: product.currency,
    tags: product.tags,
    assets: product.assets,
    dimensionsMeters: product.dimensionsMeters,
    placement: product.placement,
  };
}

export const products: Product[] = catalog.map(toStorefrontProduct);

export const featuredProduct = products.find((product) => product.categoryId === "sofas") ?? products[0];

export const trendingProducts = [
  featuredProduct,
  ...products.filter((product) => product.id !== featuredProduct.id).slice(0, 3),
].filter(Boolean);

export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);