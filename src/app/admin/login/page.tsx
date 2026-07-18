"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { getSession, signIn, signOut } from "next-auth/react";
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
import { clearAccessTokenCache } from "@/lib/session-token";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [expired, setExpired] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  // Sessão expirada (token inválido) vem do api-client com ?expirado=1.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setExpired(new URLSearchParams(window.location.search).has("expirado"));
    }
  }, []);

  const mutation = useMutation<void, Error, FormValues>({
    mutationFn: async (values) => {
      const result = await signIn("email-password", { ...values, redirect: false });
      if (result?.error) {
        throw new Error(result.error === "CredentialsSignin" ? "E-mail ou senha inválidos." : result.error);
      }
      clearAccessTokenCache();
      // A tela é da artista: cliente comum logando aqui volta para o site.
      const session = await getSession();
      if (session?.user.role !== "Admin") {
        await signOut({ redirect: false });
        throw new Error("Esta área é restrita à artista.");
      }
    },
    onSuccess: () => {
      router.replace("/admin");
      router.refresh();
    },
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <p className="font-heading text-2xl font-semibold">Kessler Art Crochê</p>
          <p className="text-sm text-muted-foreground">Painel da artista</p>
        </div>

        {expired && (
          <p className="rounded-lg bg-secondary/60 px-3 py-2 text-center text-sm text-secondary-foreground">
            Sua sessão expirou. Entre novamente para continuar. 🧶
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mutation.isError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mutation.error.message || "Não foi possível entrar."}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
