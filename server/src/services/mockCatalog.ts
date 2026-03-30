import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AmazonProduct } from '../types/pipeline.js';
interface MockCatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  category: string;
  assets: {
    poster: string;
  };
  dimensionsMeters: {
    width: number;
    height: number;
    depth: number;
  };
}
const MOCK_CATALOG_PATH = resolve(process.cwd(), '../mock-catalog.json');
let cachedProducts: AmazonProduct[] | null = null;
function metersToCentimeters(value: number) {
  return Math.round(value * 100 * 100) / 100;
}
function loadCatalog(): AmazonProduct[] {
  if (cachedProducts) {
    return cachedProducts;
  }
  const raw = readFileSync(MOCK_CATALOG_PATH, 'utf8');
  const catalog = JSON.parse(raw) as MockCatalogProduct[];
  cachedProducts = catalog.map((entry) => ({
    asin: entry.id,
    title: entry.name,
    brand: entry.brand,
    price: entry.price,
    currency: entry.currency,
    imageUrls: [entry.assets.poster],
    category: entry.category,
    dimensions: {
      widthCm: metersToCentimeters(entry.dimensionsMeters.width),
      heightCm: metersToCentimeters(entry.dimensionsMeters.height),
      depthCm: metersToCentimeters(entry.dimensionsMeters.depth),
    },
    dominantColor: null,
    detailPageUrl: '',
  }));
  return cachedProducts;
}
export function getProduct(productId: string): AmazonProduct | null {
  return loadCatalog().find((product) => product.asin === productId) ?? null;
}
export function searchProducts(query: string): AmazonProduct[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return loadCatalog();
  }
  return loadCatalog().filter((product) => {
    const haystack = [product.asin, product.title, product.brand, product.category]
      .join(' ')
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}