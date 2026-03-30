import rawProducts from "./products.json";
import type { ARCatalogProduct } from "../types/app";

export const arProducts = rawProducts as ARCatalogProduct[];

export const featuredARProduct = arProducts[0] ?? null;

export function getARProductBySlug(slug: string) {
  return arProducts.find((product) => product.slug === slug);
}
