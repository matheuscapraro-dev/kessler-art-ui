import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { catalogService } from "@/services/catalog";
import { safe } from "@/lib/fetch-safe";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = config.siteUrl;
  const now = new Date();

  const staticRoutes = ["", "/galeria", "/loja", "/encomendar", "/sobre", "/contato"].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));

  const products = await safe(() => catalogService.listProducts({}, { next: { revalidate: 3600 } }), []);
  const productRoutes = products.map((p) => ({
    url: `${base}/peca/${p.slug}`,
    lastModified: now,
  }));

  return [...staticRoutes, ...productRoutes];
}
