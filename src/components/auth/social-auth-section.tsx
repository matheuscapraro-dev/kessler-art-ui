"use client";

import { useQuery } from "@tanstack/react-query";
import { getProviders } from "next-auth/react";
import { Separator } from "@/components/ui/separator";
import { GoogleButton } from "@/components/auth/google-button";

/**
 * Botão Google + divisor "ou". Consulta os provedores registrados no NextAuth
 * e some por inteiro quando o Google não está configurado (ex.: dev sem OAuth),
 * em vez de exibir um botão que clicaria para uma tela de erro.
 */
export function SocialAuthSection({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const { data: providers } = useQuery({
    queryKey: ["auth", "providers"],
    queryFn: () => getProviders(),
    staleTime: Infinity,
  });

  if (!providers?.google) return null;

  return (
    <>
      <GoogleButton callbackUrl={callbackUrl} />
      <div className="my-5 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">ou</span>
        <Separator className="flex-1" />
      </div>
    </>
  );
}
