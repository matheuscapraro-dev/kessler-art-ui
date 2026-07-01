"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { contentService } from "@/services/content";
import { setRuntimeWhatsApp } from "@/lib/config";
import type { SiteContent } from "@/types/content";

const ContentContext = createContext<SiteContent | null>(null);

/**
 * Disponibiliza o conteúdo do site (WhatsApp, Instagram) para os componentes de cliente
 * e mantém `whatsappLink` apontando para o número cadastrado no painel.
 */
export function ContentProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: () => contentService.get(),
    staleTime: 5 * 60_000,
  });

  if (data?.whatsApp) setRuntimeWhatsApp(data.whatsApp);

  return <ContentContext.Provider value={data ?? null}>{children}</ContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(ContentContext);
}
