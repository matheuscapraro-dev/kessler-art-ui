import { api } from "@/lib/api-client";
import type { ProductSummary } from "@/types/catalog";

/** Wishlist do cliente logado. */
export const favoritesService = {
  /** Só os Ids — pinta os corações nos grids com payload mínimo. */
  ids() {
    return api.get<string[]>("/api/account/favorites/ids");
  },

  /** Peças completas para a página de favoritos. */
  list() {
    return api.get<ProductSummary[]>("/api/account/favorites");
  },

  add(productId: string) {
    return api.post<void>(`/api/account/favorites/${productId}`);
  },

  remove(productId: string) {
    return api.del<void>(`/api/account/favorites/${productId}`);
  },
};
