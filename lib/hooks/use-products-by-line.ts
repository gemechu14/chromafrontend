"use client";

import { useQueries } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import type { Product } from "@/lib/types";

/**
 * Fetches products grouped by product_line_id for efficient batch loading.
 * 
 * @param productLineIds - Array of product line IDs to fetch products for
 * @returns Record<productId, Product> — lookup map of all products from the given lines
 */
export function useProductsByLine(productLineIds: string[]): Record<string, Product> {
  // Deduplicate
  const uniqueLineIds = Array.from(new Set(productLineIds.filter(Boolean)));

  const results = useQueries({
    queries: uniqueLineIds.map((lineId) => ({
      queryKey: ["products", "by-line", lineId],
      queryFn: async () => {
        // Fetch first page
        const firstPage = await productsApi.listProducts({ product_line_id: lineId, page: 1, page_size: 100 });
        const allProducts = [...firstPage.items];
        
        // Fetch remaining pages if any
        const totalPages = firstPage.total_pages;
        if (totalPages > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
              productsApi.listProducts({ product_line_id: lineId, page: i + 2, page_size: 100 })
            )
          );
          remainingPages.forEach((page) => {
            allProducts.push(...page.items);
          });
        }
        
        return allProducts;
      },
      staleTime: 5 * 60 * 1000, // 5 min — global catalog rarely changes
      enabled: !!lineId,
    })),
  });

  const lookup: Record<string, Product> = {};
  results.forEach((result) => {
    if (result.data) {
      result.data.forEach((product) => {
        lookup[product.id] = product;
      });
    }
  });

  return lookup;
}

