export type ProductAvailability = "ReadyToBuy" | "MadeToOrder";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isPublished: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
  displayOrder: number;
  isCover: boolean;
}

/** Tamanho de uma peça com preço próprio (P/M/G, 20 cm...). */
export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  displayOrder: number;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  availability: ProductAvailability;
  price?: number | null;
  categoryName: string;
  coverImageUrl?: string | null;
  isFeatured: boolean;
  /** Com tamanhos, `price` é o menor deles — exibir como "a partir de". */
  hasVariants: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  categoryId: string;
  categoryName: string;
  availability: ProductAvailability;
  price?: number | null;
  stockQuantity?: number | null;
  leadTimeDays?: number | null;
  isFeatured: boolean;
  isPublished: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
}

export const availabilityLabel: Record<ProductAvailability, string> = {
  ReadyToBuy: "Pronta entrega",
  MadeToOrder: "Sob encomenda",
};

/** Mapeia o slug de disponibilidade da URL (?disponibilidade=) para o enum da API. */
export const availabilityFromSlug: Record<string, ProductAvailability> = {
  "pronta-entrega": "ReadyToBuy",
  "sob-encomenda": "MadeToOrder",
};

export const availabilitySlug: Record<ProductAvailability, string> = {
  ReadyToBuy: "pronta-entrega",
  MadeToOrder: "sob-encomenda",
};
