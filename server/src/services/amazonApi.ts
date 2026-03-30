import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { AmazonDimensions, AmazonProduct } from '../types/pipeline.js';

interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  description: string;
  category: string;
  tags: string[];
  assets: {
    modelGlb: string | null;
    modelUsdz: string | null;
    poster: string;
    images: string[];
  };
  dimensionsMeters: {
    width: number;
    depth: number;
    height: number;
  };
}

const CATALOG_PATH = resolve(process.cwd(), '../src/data/products.json');

function metersToCentimeters(value: number) {
  return Math.round(value * 100 * 100) / 100;
}

function mapDimensions(product: CatalogProduct): AmazonDimensions {
  return {
    widthCm: metersToCentimeters(product.dimensionsMeters.width),
    heightCm: metersToCentimeters(product.dimensionsMeters.height),
    depthCm: metersToCentimeters(product.dimensionsMeters.depth),
  };
}

function normalizeImageUrls(product: CatalogProduct) {
  const candidates = [...product.assets.images, product.assets.poster].filter(
    (url, index, array): url is string => Boolean(url?.trim()) && array.indexOf(url) === index,
  );

  return candidates;
}

function mapProduct(product: CatalogProduct): AmazonProduct {
  return {
    asin: product.id,
    title: product.name,
    brand: product.brand,
    price: product.price,
    currency: product.currency,
    imageUrls: normalizeImageUrls(product),
    detailPageUrl: `https://www.amazon.com.tr/dp/${encodeURIComponent(product.id)}`,
    dimensions: mapDimensions(product),
    category: product.category,
    dominantColor: null,
  };
}

async function loadCatalog(): Promise<CatalogProduct[]> {
  const raw = await readFile(CATALOG_PATH, 'utf8');
  return JSON.parse(raw) as CatalogProduct[];
}

export async function searchProducts(query: string, count: number): Promise<AmazonProduct[]> {
  try {
    const catalog = await loadCatalog();
    const normalizedQuery = query.toLowerCase().trim();
    const matches = catalog.filter((product) => {
      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        product.id,
        product.slug,
        product.name,
        product.brand,
        product.category,
        product.description,
        ...product.tags,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return matches.slice(0, count).map(mapProduct);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Amazon stub error';
    throw new Error(`AMAZON_API_ERROR: ${message}`);
  }
}

export async function getProduct(asin: string): Promise<AmazonProduct | null> {
  try {
    const catalog = await loadCatalog();
    const match = catalog.find((product) => product.id === asin || product.slug === asin);

    return match ? mapProduct(match) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Amazon stub error';
    throw new Error(`AMAZON_API_ERROR: ${message}`);
  }
}
