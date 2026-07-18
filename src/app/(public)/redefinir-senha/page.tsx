"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { authService } from "@/services/auth";
import { ApiError } from "@/lib/api-client";

const schema = z
  .object({
    password: z.string().min(8, "A senha precisa de pelo menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem.",
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => authService.resetPassword(token, values.password),
    onSuccess: () => setDone(true),
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Não consegui redefinir agora. Tente novamente."),
  });

  if (!token) {
    return (
      <AuthCard title="Link inválido">
        <p className="text-center text-sm text-muted-foreground">
          Este link de redefinição não é válido. Peça um novo na página de recuperação.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/esqueci-senha">Pedir novo link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Senha redefinida!">
        <div className="text-center">
          <CheckCircle2 className="mx-auto size-10 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Sua nova senha já vale. Por segurança, todas as sessões antigas foram encerradas.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/entrar">Entrar com a nova senha</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nova senha" subtitle="Escolha a nova senha da sua conta.">
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova senha</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar senha</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
