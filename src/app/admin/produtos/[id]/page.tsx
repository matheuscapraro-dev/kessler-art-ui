"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import { adminCatalogService } from "@/services/admin-catalog";

export default function EditarPecaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: () => adminCatalogService.getProduct(id),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!product) return <p className="text-muted-foreground">Peça não encontrada.</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Editar peça</h1>
      <ProductForm product={product} />
      <ProductImageManager product={product} />
    </div>
  );
}
