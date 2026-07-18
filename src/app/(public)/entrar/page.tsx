"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthCard } from "@/components/auth/auth-card";
import { SocialAuthSection } from "@/components/auth/social-auth-section";
import { clearAccessTokenCache } from "@/lib/session-token";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

type FormValues = z.infer<typeof schema>;

/** Erros que o NextAuth devolve via ?error= (ex.: falha no fluxo do Google). */
function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "AccessDenied":
      return "O acesso foi negado pelo provedor. Tente novamente.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "Callback":
      return "Não foi possível entrar com o Google agora. Tente de novo ou use e-mail e senha.";
    case "SessionRequired":
      return null; // só redirecionamento de rota protegida — sem alarde
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const expired = params.has("expirado");
  const [error, setError] = useState<string | null>(oauthErrorMessage(params.get("error")));
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    setError(null);
    const result = await signIn("email-password", { ...values, redirect: false });
    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "E-mail ou senha inválidos." : result.error);
      setSubmitting(false);
      return;
    }
    clearAccessTokenCache(); // sessão nova — não servir token antigo do cache
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard title="Entrar" subtitle="Acompanhe pedidos, encomendas e favoritos.">
      {expired && (
        <p className="mb-4 rounded-lg bg-secondary/60 px-3 py-2 text-center text-sm text-secondary-foreground">
          Sua sessão expirou. Entre novamente para continuar. 🧶
        </p>
      )}

      <SocialAuthSection callbackUrl={callbackUrl} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="voce@email.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Senha</FormLabel>
                  <Link href="/esqueci-senha" className="text-xs text-primary hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href={`/cadastrar?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-primary hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
