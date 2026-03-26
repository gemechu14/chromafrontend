"use client";

import { useQueries } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/types";

/**
 * Resolves an array of global product UUIDs into a lookup map.
 *
 * Each product is fetched individually and cached by React Query so
 * results are shared across every component that calls this hook.
 *
 * @param productIds - Array of global product IDs (from TenantProduct.product_id)
 * @returns Record<productId, Product> — map is empty until all queries resolve
 */
export function useProductLookup(productIds: string[]): Record<string, Product> {
  // Deduplicate
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));

  const results = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: ["product", id],
      queryFn: () => productsApi.getProductById(id),
      staleTime: 5 * 60 * 1000, // 5 min — global catalog rarely changes
      enabled: !!id,
    })),
  });

  const lookup: Record<string, Product> = {};
  results.forEach((result, i) => {
    if (result.data) {
      lookup[uniqueIds[i]] = result.data;
    }
  });

  return lookup;
}

