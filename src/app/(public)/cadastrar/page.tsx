"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
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
import { authService } from "@/services/auth";
import { ApiError } from "@/lib/api-client";
import { clearAccessTokenCache } from "@/lib/session-token";
import { safeCallbackUrl } from "@/lib/safe-callback-url";

const schema = z.object({
  name: z.string().min(1, "Informe seu nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres."),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    // O e-mail pode vir do CTA pós-pedido guest ("crie sua conta com este e-mail").
    defaultValues: { name: "", email: params.get("email") ?? "", password: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await authService.register(values);
      // Conta criada — abre a sessão NextAuth com as mesmas credenciais.
      const result = await signIn("email-password", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: () => {
      clearAccessTokenCache();
      toast.success("Conta criada! Enviamos um link de confirmação para o seu e-mail. 🧶");
      router.replace(callbackUrl);
      router.refresh();
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Não consegui criar a conta agora. Tente novamente."),
  });

  return (
    <AuthCard title="Criar conta" subtitle="Guarde seus pedidos, encomendas e favoritos num só lugar.">
      <SocialAuthSection callbackUrl={callbackUrl} />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            setError(null);
            mutation.mutate(values);
          })}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail *</FormLabel>
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
                <FormLabel>Senha *</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(47) 99999-9999" autoComplete="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href={`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
