"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { authService } from "@/services/auth";
import { ApiError } from "@/lib/api-client";

type State = { status: "loading" } | { status: "success" } | { status: "error"; message: string };

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const { status: sessionStatus, update } = useSession();
  const [state, setState] = useState<State>(
    token ? { status: "loading" } : { status: "error", message: "Link de verificação inválido." }
  );
  const fired = useRef(false);

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true; // StrictMode/re-render: o token é de uso único
    authService
      .verifyEmail(token)
      .then(async () => {
        setState({ status: "success" });
        // Sessão aberta: ressincroniza o emailVerified sem exigir novo login.
        if (sessionStatus === "authenticated") await update();
      })
      .catch((err: unknown) =>
        setState({
          status: "error",
          message: err instanceof ApiError ? err.message : "Não consegui verificar agora. Tente de novo.",
        })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state.status === "loading") {
    return (
      <AuthCard title="Verificando...">
        <LoaderCircle className="mx-auto size-10 animate-spin text-primary" />
      </AuthCard>
    );
  }

  if (state.status === "success") {
    return (
      <AuthCard title="E-mail confirmado!">
        <div className="text-center">
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Sua conta está ativa. Pedidos e encomendas feitos antes com este e-mail já aparecem no
            seu histórico. 🧶
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href="/conta/pedidos">Ver meus pedidos</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/galeria">Explorar a galeria</Link>
            </Button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Link inválido ou expirado">
      <div className="text-center">
        <CircleAlert className="mx-auto size-10 text-destructive" />
        <p className="mt-4 text-sm text-muted-foreground">{state.message}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre na sua conta e peça um novo link de verificação na página do perfil.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/conta">Ir para minha conta</Link>
        </Button>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
