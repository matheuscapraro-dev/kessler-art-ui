"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authService } from "@/services/auth";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation<unknown, ApiError, FormValues>({
    mutationFn: (values) => authService.login(values.email, values.password),
    onSuccess: () => router.replace("/admin"),
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <p className="font-heading text-2xl font-semibold">Kessler Art Crochê</p>
          <p className="text-sm text-muted-foreground">Painel da artista</p>
        </div>

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
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mutation.isError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mutation.error.detail ?? "Não foi possível entrar."}
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
