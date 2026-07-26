"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CommissionSuccess } from "@/components/orders/commission-success";
import { commissionService } from "@/services/commissions";
import { formatPrice } from "@/lib/format";
import type { ApiError } from "@/lib/api-client";
import type { Product, ProductVariant } from "@/types/catalog";
import type { Commission } from "@/types/orders";

const schema = z.object({
  size: z.string().optional(),
  colors: z.string().optional(),
  desiredDeadline: z.string().optional(),
  notes: z.string().optional(),
  customerName: z.string().min(1, "Informe seu nome."),
  customerEmail: z.string().email("E-mail inválido."),
  customerPhone: z.string().min(8, "Informe um telefone para contato."),
});

type FormValues = z.infer<typeof schema>;

/**
 * Painel leve de "encomenda desta peça" — abre na própria página da peça e envia 1 encomenda
 * na hora, referenciando a peça (`referenceProductSlug`). A peça já é o briefing; o cliente só
 * passa a personalização (tamanho, cor, prazo, observações) + contato. Sem upload de foto.
 */
export function CommissionPieceDialog({
  product,
  defaultVariant = null,
  trigger,
}: {
  product: Product;
  defaultVariant?: ProductVariant | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const variants = [...product.variants].sort((a, b) => a.displayOrder - b.displayOrder);
  const [sizeVariantId, setSizeVariantId] = useState<string | null>(
    defaultVariant?.id ?? variants[0]?.id ?? null
  );
  const selectedVariant = variants.find((v) => v.id === sizeVariantId) ?? null;

  const { data: session } = useSession();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      size: "",
      colors: "",
      desiredDeadline: "",
      notes: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  // Cliente logado: pré-preenche o contato com os dados da conta (tudo editável).
  useEffect(() => {
    if (open && session?.user && !form.formState.isDirty) {
      form.setValue("customerName", session.user.name ?? "");
      form.setValue("customerEmail", session.user.email ?? "");
      form.setValue("customerPhone", session.user.phone ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, open]);

  const mutation = useMutation<Commission, ApiError, FormValues>({
    mutationFn: (values) => {
      // Com tamanhos, o tamanho é o do seletor; senão, o texto livre.
      const size = (variants.length > 0 ? selectedVariant?.name ?? "" : values.size ?? "").trim();
      const notes = (values.notes ?? "").trim();
      // Descrição legível para o acompanhamento e o Kanban (o prefixo garante o mínimo do backend).
      const description =
        `Encomenda da peça "${product.name}"${size ? ` (tamanho ${size})` : ""}.` +
        (notes ? ` ${notes}` : "");

      return commissionService.create({
        description,
        title: product.name,
        referenceProductSlug: product.slug,
        desiredCategory: product.categoryName,
        size: size || undefined,
        colors: (values.colors ?? "").trim() || undefined,
        desiredDeadline: values.desiredDeadline || null,
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
      });
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) mutation.reset(); // reabrir volta ao formulário limpo
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {mutation.isSuccess ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Encomenda enviada</DialogTitle>
            </DialogHeader>
            <CommissionSuccess commission={mutation.data} isGuest={!session?.user} />
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                {product.images[0]?.url && (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    width={56}
                    height={56}
                    className="warm-img size-14 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0">
                  <DialogTitle>Encomendar esta peça</DialogTitle>
                  <DialogDescription className="truncate">{product.name}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
                className="space-y-4"
              >
                {variants.length > 0 ? (
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">
                      Tamanho
                      {selectedVariant && (
                        <span className="ml-1.5 text-muted-foreground">· {selectedVariant.name}</span>
                      )}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => {
                        const active = variant.id === sizeVariantId;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setSizeVariantId(variant.id)}
                            aria-pressed={active}
                            className={cn(
                              "flex flex-col items-center rounded-xl border px-4 py-2 transition-colors",
                              active
                                ? "border-primary bg-primary/10 text-primary shadow-soft"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            <span className="text-sm font-semibold">{variant.name}</span>
                            <span className="text-xs">{formatPrice(variant.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                ) : (
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
                )}

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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Algum detalhe especial? (opcional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-medium">Como te encontro?</p>
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seu nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Como posso te chamar?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
