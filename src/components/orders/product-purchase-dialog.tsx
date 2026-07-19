"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { OrderSuccess } from "@/components/orders/order-success";
import { orderService } from "@/services/orders";
import { formatPrice } from "@/lib/format";
import type { ApiError } from "@/lib/api-client";
import type { Product, ProductVariant } from "@/types/catalog";
import type { Order } from "@/types/orders";

const schema = z.object({
  notes: z.string().optional(),
  customerName: z.string().min(1, "Informe seu nome."),
  customerEmail: z.string().email("E-mail inválido."),
  customerPhone: z.string().min(8, "Informe um telefone para contato."),
});

type FormValues = z.infer<typeof schema>;

/**
 * Compra direta de uma peça pronta — sem carrinho. Abre na própria página da peça,
 * o cliente escolhe tamanho/quantidade e contato, e o pedido é enviado na hora
 * (mesma UX "um a um" da encomenda de peça, ver commission-piece-dialog.tsx).
 */
export function ProductPurchaseDialog({
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
  const [variantId, setVariantId] = useState<string | null>(defaultVariant?.id ?? variants[0]?.id ?? null);
  const selectedVariant = variants.find((v) => v.id === variantId) ?? null;
  const [quantity, setQuantity] = useState(1);

  const unitPrice = selectedVariant ? selectedVariant.price : (product.price ?? 0);

  const { data: session } = useSession();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
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

  const mutation = useMutation<Order, ApiError, FormValues>({
    mutationFn: (values) =>
      orderService.create({
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        notes: (values.notes ?? "").trim() || undefined,
        items: [{ productId: product.id, quantity, variantId: selectedVariant?.id ?? null }],
      }),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          mutation.reset(); // reabrir volta ao formulário limpo
          setQuantity(1);
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        {mutation.isSuccess ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Pedido enviado</DialogTitle>
            </DialogHeader>
            <OrderSuccess order={mutation.data} isGuest={!session?.user} />
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
                  <DialogTitle>Comprar esta peça</DialogTitle>
                  <DialogDescription className="truncate">{product.name}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
                className="space-y-4"
              >
                {variants.length > 0 && (
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">
                      Tamanho
                      {selectedVariant && (
                        <span className="ml-1.5 text-muted-foreground">· {selectedVariant.name}</span>
                      )}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((variant) => {
                        const active = variant.id === variantId;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => setVariantId(variant.id)}
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
                )}

                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-sm font-medium">Quantidade</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Diminuir"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Aumentar"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1 text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium text-primary">{formatPrice(unitPrice * quantity)}</span>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Endereço de entrega, preferências... (opcional)"
                          {...field}
                        />
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
                            <Input placeholder="(47) 99999-9999" {...field} />
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

                <p className="rounded-lg bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
                  Nada é cobrado agora: depois de confirmar, combinamos o Pix e a entrega pelo
                  WhatsApp.
                </p>

                <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? "Enviando..." : "Confirmar pedido"}
                </Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
