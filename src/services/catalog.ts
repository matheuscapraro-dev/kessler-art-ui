import { api } from "@/lib/api-client";
import type { Category, Product, ProductAvailability, ProductSummary } from "@/types/catalog";

export interface ListProductsParams {
  categorySlug?: string;
  availability?: ProductAvailability;
  featuredOnly?: boolean;
  search?: string;
}

function buildQuery(params: ListProductsParams): string {
  const sp = new URLSearchParams();
  if (params.categorySlug) sp.set("categorySlug", params.categorySlug);
  if (params.availability) sp.set("availability", params.availability);
  if (params.featuredOnly) sp.set("featuredOnly", "true");
  if (params.search) sp.set("search", params.search);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const catalogService = {
  listProducts: (params: ListProductsParams = {}, options?: RequestInit): Promise<ProductSummary[]> =>
    api.get<ProductSummary[]>(`/api/products${buildQuery(params)}`, options),

  getProductBySlug: (slug: string, options?: RequestInit): Promise<Product> =>
    api.get<Product>(`/api/products/${slug}`, options),

  listCategories: (options?: RequestInit): Promise<Category[]> =>
    api.get<Category[]>(`/api/categories`, options),
};
