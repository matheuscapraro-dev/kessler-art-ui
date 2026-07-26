"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ReferenceImageUploader } from "@/components/orders/reference-image-uploader";
import { CommissionSuccess } from "@/components/orders/commission-success";
import { commissionService, type CommissionReferenceInput } from "@/services/commissions";
import { ApiError } from "@/lib/api-client";
import type { Commission } from "@/types/orders";

const schema = z.object({
  description: z.string().min(10, "Conte um pouco mais sobre a peça (mín. 10 caracteres)."),
  desiredCategory: z.string().optional(),
  colors: z.string().optional(),
  size: z.string().optional(),
  desiredDeadline: z.string().optional(),
  customerName: z.string().min(1, "Informe seu nome."),
  customerEmail: z.string().email("E-mail inválido."),
  customerPhone: z.string().min(8, "Informe um telefone para contato."),
});

type FormValues = z.infer<typeof schema>;

export function CommissionForm() {
  const [references, setReferences] = useState<CommissionReferenceInput[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: "",
      desiredCategory: "",
      colors: "",
      size: "",
      desiredDeadline: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  // Cliente logado: pré-preenche o contato com os dados da conta (tudo editável).
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user && !form.formState.isDirty) {
      form.setValue("customerName", session.user.name ?? "");
      form.setValue("customerEmail", session.user.email ?? "");
      form.setValue("customerPhone", session.user.phone ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const mutation = useMutation<Commission, ApiError, FormValues>({
    mutationFn: (values) =>
      commissionService.create({
        ...values,
        desiredDeadline: values.desiredDeadline || null,
        referenceImages: references,
      }),
  });

  if (mutation.isSuccess) {
    return <CommissionSuccess commission={mutation.data} isGuest={!session?.user} />;
  }

  return (
    <Form {...form}>
      {!session?.user && (
        <p className="mb-5 rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <a
            href={`/entrar?callbackUrl=${encodeURIComponent("/encomendar")}`}
            className="font-medium text-primary hover:underline"
          >
            Entre
          </a>{" "}
          para preencher seu contato e acompanhar a encomenda sem precisar do código.
        </p>
      )}
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-8"
      >
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-xl">O que você imaginou?</h2>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da peça *</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="Ex.: um amigurumi de coelho, ~25cm, tons pastéis, para presente de bebê..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="desiredCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de peça</FormLabel>
                  <FormControl>
                    <Input placeholder="Amigurumi, manta, decoração..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="colors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cores</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: bege, terracota, verde sage" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: ~30cm, casal, P/M/G" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="desiredDeadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Prazo desejado</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Quando você gostaria de receber?"
                    disablePast
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Fotos de referência (opcional)</Label>
            <p className="text-sm text-muted-foreground">
              Tem alguma imagem que te inspira? Anexe aqui — ajuda muito a entender o que você quer.
            </p>
            <ReferenceImageUploader value={references} onChange={setReferences} />
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-heading text-xl">Como te encontro?</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Seu nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Como posso te chamar?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="voce@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone *</FormLabel>
                  <FormControl>
                    <Input type="tel" autoComplete="tel" placeholder="(47) 99999-9999" {...field} />
                  </FormControl>
                  <FormDescription>É por aqui que combinamos os detalhes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {mutation.isError && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {mutation.error.detail ?? "Não consegui enviar agora. Tente novamente em instantes."}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Enviando..." : "Enviar encomenda"}
        </Button>
      </form>
    </Form>
  );
}
