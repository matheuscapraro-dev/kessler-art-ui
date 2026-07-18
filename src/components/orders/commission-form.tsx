"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { CheckCircle2, MessageCircle } from "lucide-react";
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
import { commissionService, type CommissionReferenceInput } from "@/services/commissions";
import { Celebrate } from "@/components/motion/celebrate";
import { ApiError } from "@/lib/api-client";
import { whatsappLink } from "@/lib/config";
import type { Commission } from "@/types/orders";

const schema = z.object({
  description: z.string().min(10, "Conte um pouco mais sobre a peça (mín. 10 caracteres)."),
  desiredCategory: z.string().optional(),
  colors: z.string().optional(),
  size: z.string().optional(),
  desiredDeadline: z.string().optional(),
  customerName: z.string().min(1, "Informe seu nome."),
  customerEmail: z.string().email("E-mail inválido."),
  customerPhone: z.string().min(8, "Informe um WhatsApp para contato."),
});

type FormValues = z.infer<typeof schema>;

export function CommissionForm() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;
  // Tamanho escolhido na página da peça (quando ela tem tamanhos) — já chega preenchido.
  const tamanho = searchParams.get("tamanho") ?? "";

  const [references, setReferences] = useState<CommissionReferenceInput[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: ref ? `Tenho interesse em algo parecido com a peça "${ref}". ` : "",
      desiredCategory: "",
      colors: "",
      size: tamanho,
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
        referenceProductSlug: ref,
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
        <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
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

        <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
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
                  <FormLabel>WhatsApp *</FormLabel>
                  <FormControl>
                    <Input placeholder="(47) 99999-9999" {...field} />
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

function CommissionSuccess({ commission, isGuest }: { commission: Commission; isGuest: boolean }) {
  const message =
    `Olá! Acabei de enviar a encomenda ${commission.code} pelo site. ` +
    `Resumo: ${commission.description}`;

  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl border border-border bg-card p-8 text-center">
        <Celebrate />
        <CheckCircle2 className="mx-auto size-12 text-primary" />
        <h2 className="mt-4 font-heading text-2xl">Encomenda recebida! 🧶</h2>
        <p className="mt-4 inline-block rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-2.5 font-heading text-2xl tracking-wide text-primary">
          {commission.code}
        </p>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Guardei tudo certinho — esse é o seu código de acompanhamento. Vamos combinar os
          detalhes e o orçamento pelo WhatsApp.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" /> Continuar no WhatsApp
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`/encomenda/${commission.code}`}>Acompanhar encomenda</a>
          </Button>
        </div>
      </div>

      {/* Convite pós-envio: guest vira conta e a encomenda entra no histórico ao verificar o e-mail. */}
      {isGuest && commission.customerEmail && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
          <p className="text-sm text-foreground">
            Quer acompanhar tudo num só lugar? Crie sua conta com o mesmo e-mail e esta encomenda
            aparece no seu histórico. 🧶
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3">
            <a
              href={`/cadastrar?email=${encodeURIComponent(commission.customerEmail)}&callbackUrl=${encodeURIComponent("/conta/encomendas")}`}
            >
              Criar minha conta
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
