"use client";

import { useQuery } from "@tanstack/react-query";
import { catalogService, type ListProductsParams } from "@/services/catalog";

export const catalogKeys = {
  products: (params: ListProductsParams) => ["products", params] as const,
  product: (slug: string) => ["product", slug] as const,
  categories: ["categories"] as const,
};

/** Lista peças com filtros — usado nas páginas interativas (galeria/loja). */
export function useProducts(params: ListProductsParams = {}) {
  return useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: ({ signal }) => catalogService.listProducts(params, { signal }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: ({ signal }) => catalogService.listCategories({ signal }),
  });
}
