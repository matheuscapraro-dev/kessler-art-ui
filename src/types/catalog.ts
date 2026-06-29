export type ProductAvailability = "Showcase" | "ReadyToBuy" | "MadeToOrder";

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

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  availability: ProductAvailability;
  price?: number | null;
  categoryName: string;
  coverImageUrl?: string | null;
  isFeatured: boolean;
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
}

export const availabilityLabel: Record<ProductAvailability, string> = {
  Showcase: "Portfólio",
  ReadyToBuy: "Pronta entrega",
  MadeToOrder: "Sob encomenda",
};
