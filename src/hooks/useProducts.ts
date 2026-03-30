import { useEffect, useState } from "react";
import type { Product } from "../types/app";
import { supabase } from "../lib/supabaseClient";

interface UseProductsResult {
  data: Product[];
  isLoading: boolean;
  error: Error | null;
}

interface UseProductResult {
  data: Product | null;
  isLoading: boolean;
  error: Error | null;
}

const toError = (message: string) => new Error(message);

export function useProducts(): UseProductsResult {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      const { data: products, error: fetchError } = await supabase
        .from("products")
        .select("*");

      if (!isActive) {
        return;
      }

      if (fetchError) {
        setData([]);
        setError(toError(fetchError.message));
        setIsLoading(false);
        return;
      }

      setData((products ?? []) as Product[]);
      setIsLoading(false);
    }

    void fetchProducts();

    return () => {
      isActive = false;
    };
  }, []);

  return { data, isLoading, error };
}

export function useProduct(slug: string): UseProductResult {
  const [data, setData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchProduct() {
      if (!slug) {
        if (!isActive) {
          return;
        }

        setData(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!isActive) {
        return;
      }

      if (fetchError) {
        setData(null);
        setError(toError(fetchError.message));
        setIsLoading(false);
        return;
      }

      setData(product as Product);
      setIsLoading(false);
    }

    void fetchProduct();

    return () => {
      isActive = false;
    };
  }, [slug]);

  return { data, isLoading, error };
}
