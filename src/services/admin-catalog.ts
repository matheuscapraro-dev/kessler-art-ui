import { api } from "@/lib/api-client";
import type { Category, Product, ProductAvailability, ProductImage, ProductSummary } from "@/types/catalog";

export interface CategoryPayload {
  name: string;
  description?: string;
  displayOrder: number;
  isPublished: boolean;
}

export interface ProductPayload {
  name: string;
  categoryId: string;
  availability: ProductAvailability;
  description?: string;
  price?: number | null;
  stockQuantity?: number | null;
  leadTimeDays?: number | null;
  isFeatured: boolean;
  isPublished: boolean;
}

export const adminCatalogService = {
  // ── Categorias ──
  listCategories: (): Promise<Category[]> =>
    api.get<Category[]>("/api/categories?publishedOnly=false"),
  createCategory: (payload: CategoryPayload): Promise<Category> =>
    api.post<Category>("/api/categories", payload),
  updateCategory: (id: string, payload: CategoryPayload): Promise<Category> =>
    api.put<Category>(`/api/categories/${id}`, payload),
  deleteCategory: (id: string): Promise<void> => api.del<void>(`/api/categories/${id}`),

  // ── Peças ──
  listProducts: (): Promise<ProductSummary[]> => api.get<ProductSummary[]>("/api/products/admin"),
  getProduct: (id: string): Promise<Product> => api.get<Product>(`/api/products/by-id/${id}`),
  createProduct: (payload: ProductPayload): Promise<Product> =>
    api.post<Product>("/api/products", payload),
  updateProduct: (id: string, payload: ProductPayload): Promise<Product> =>
    api.put<Product>(`/api/products/${id}`, payload),
  deleteProduct: (id: string): Promise<void> => api.del<void>(`/api/products/${id}`),

  // ── Imagens ──
  uploadImage: (productId: string, file: File, altText?: string): Promise<ProductImage> => {
    const fd = new FormData();
    fd.append("file", file);
    if (altText) fd.append("altText", altText);
    return api.upload<ProductImage>(`/api/products/${productId}/images`, fd);
  },
  removeImage: (productId: string, imageId: string): Promise<void> =>
    api.del<void>(`/api/products/${productId}/images/${imageId}`),
  setCover: (productId: string, imageId: string): Promise<void> =>
    api.put<void>(`/api/products/${productId}/images/${imageId}/cover`),
};
