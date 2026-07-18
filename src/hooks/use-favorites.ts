"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { favoritesService } from "@/services/favorites";

const IDS_KEY = ["favorites", "ids"] as const;
const LIST_KEY = ["favorites", "list"] as const;

/** Ids favoritados do usuário logado (deslogado = conjunto vazio, sem chamada). */
export function useFavoriteIds() {
  const { status } = useSession();
  return useQuery({
    queryKey: IDS_KEY,
    queryFn: () => favoritesService.ids(),
    enabled: status === "authenticated",
  });
}

/** Peças completas da página de favoritos. */
export function useFavorites() {
  const { status } = useSession();
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => favoritesService.list(),
    enabled: status === "authenticated",
  });
}

/**
 * Alterna favorito com update otimista (coração responde na hora; rollback se a
 * API falhar). Deslogado, leva ao login preservando a página como callback.
 */
export function useToggleFavorite() {
  const { status } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const mutation = useMutation({
    mutationFn: ({ productId, favorited }: { productId: string; favorited: boolean }) =>
      favorited ? favoritesService.remove(productId) : favoritesService.add(productId),
    onMutate: async ({ productId, favorited }) => {
      await queryClient.cancelQueries({ queryKey: IDS_KEY });
      const previous = queryClient.getQueryData<string[]>(IDS_KEY);
      queryClient.setQueryData<string[]>(IDS_KEY, (ids = []) =>
        favorited ? ids.filter((id) => id !== productId) : [...ids, productId]
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      // Desfaz o coração otimista e avisa — sem isso o rollback pareceria um bug.
      if (context?.previous) queryClient.setQueryData(IDS_KEY, context.previous);
      toast.error("Não consegui salvar o favorito. Tente de novo.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: IDS_KEY });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });

  return {
    ...mutation,
    toggle(productId: string, favorited: boolean) {
      if (status !== "authenticated") {
        router.push(`/entrar?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }
      mutation.mutate({ productId, favorited });
    },
  };
}
