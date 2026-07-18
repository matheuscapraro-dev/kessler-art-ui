"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { MailWarning } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useChangePassword, useProfile, useUpdateProfile } from "@/hooks/use-account";
import { authService } from "@/services/auth";
import { ApiError } from "@/lib/api-client";

const profileSchema = z.object({
  name: z.string().min(1, "Informe seu nome."),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "A senha precisa de pelo menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((data) => data.newPassword === data.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem.",
  });

export default function ProfilePage() {
  const { data: me, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", phone: "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
  });

  useEffect(() => {
    if (me) profileForm.reset({ name: me.name, phone: me.phone ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const [resent, setResent] = useState(false);
  const resend = useMutation({
    mutationFn: () => authService.resendVerification(me!.email),
    onSuccess: () => setResent(true),
  });

  if (isLoading || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!me.emailVerified && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
          <MailWarning className="size-5 shrink-0 text-primary" />
          <p className="flex-1 text-sm text-foreground">
            Confirme seu e-mail para vincular pedidos antigos e proteger sua conta.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={resend.isPending || resent}
            onClick={() => resend.mutate()}
          >
            {resent ? "Link enviado!" : resend.isPending ? "Enviando..." : "Reenviar link"}
          </Button>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl">Meus dados</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Usados para pré-preencher o checkout e as encomendas.
        </p>
        <Form {...profileForm}>
          <form
            onSubmit={profileForm.handleSubmit((values) =>
              updateProfile.mutate(values, {
                onSuccess: () => toast.success("Dados atualizados! 🧶"),
                onError: (err) =>
                  toast.error(err instanceof ApiError ? err.message : "Não consegui salvar agora."),
              })
            )}
            className="mt-5 space-y-4"
          >
            <FormField
              control={profileForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <Input value={me.email} disabled />
              </FormItem>
              <FormField
                control={profileForm.control}
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
            </div>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Salvando..." : "Salvar dados"}
            </Button>
          </form>
        </Form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-xl">{me.hasPassword ? "Senha" : "Criar senha"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {me.hasPassword
            ? "Troque sua senha de acesso."
            : "Você entrou com o Google. Crie uma senha para também poder entrar com e-mail."}
        </p>
        <Form {...passwordForm}>
          <form
            onSubmit={passwordForm.handleSubmit((values) =>
              changePassword.mutate(
                { currentPassword: values.currentPassword || undefined, newPassword: values.newPassword },
                {
                  onSuccess: () => {
                    toast.success(me.hasPassword ? "Senha atualizada!" : "Senha criada! 🧶");
                    passwordForm.reset();
                  },
                  onError: (err) =>
                    toast.error(err instanceof ApiError ? err.message : "Não consegui trocar a senha."),
                }
              )
            )}
            className="mt-5 space-y-4"
          >
            {me.hasPassword && (
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha atual</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={passwordForm.control}
                name="newPassword"
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
                control={passwordForm.control}
                name="confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nova senha</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" variant="outline" disabled={changePassword.isPending}>
              {changePassword.isPending
                ? "Salvando..."
                : me.hasPassword
                  ? "Trocar senha"
                  : "Criar senha"}
            </Button>
          </form>
        </Form>
      </section>
    </div>
  );
}
