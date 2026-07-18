"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader } from "@/components/layout/page-header";
import { cartLineKey, useCart } from "@/components/cart/cart-provider";
import { orderService } from "@/services/orders";
import { Celebrate } from "@/components/motion/celebrate";
import { ApiError } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { whatsappLink } from "@/lib/config";
import type { Order } from "@/types/orders";

const schema = z.object({
  customerName: z.string().min(1, "Informe seu nome."),
  customerEmail: z.string().email("E-mail inválido."),
  customerPhone: z.string().min(8, "Informe um telefone."),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: "", customerEmail: "", customerPhone: "", notes: "" },
  });

  // Cliente logado: pré-preenche com os dados da conta (tudo continua editável).
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.user && !form.formState.isDirty) {
      form.reset({
        customerName: session.user.name ?? "",
        customerEmail: session.user.email ?? "",
        customerPhone: session.user.phone ?? "",
        notes: form.getValues("notes"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  const mutation = useMutation<Order, ApiError, FormValues>({
    mutationFn: (values) =>
      orderService.create({
        ...values,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variantId: i.variantId,
        })),
      }),
    onSuccess: (order) => {
      setConfirmedOrder(order);
      clear();
    },
  });

  if (confirmedOrder) {
    const message =
      `Olá! Fiz o pedido ${confirmedOrder.code} no site ` +
      `(total ${formatPrice(confirmedOrder.totalAmount)}). Como combinamos o pagamento?`;
    return (
      <>
        <PageHeader title="Pedido recebido!" />
        <div className="mx-auto max-w-md px-4 pb-16">
          <div className="relative rounded-2xl border border-border bg-card p-8 text-center">
            <Celebrate />
            <CheckCircle2 className="mx-auto size-12 text-primary" />
            <p className="mt-5 inline-block rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-5 py-2.5 font-heading text-2xl tracking-wide text-primary">
              {confirmedOrder.code}
            </p>
            <p className="mt-4 text-muted-foreground">
              Guarde esse código para acompanhar seu pedido. Agora é só combinar o pagamento (Pix)
              pelo WhatsApp que eu separo tudo com carinho.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild size="lg">
                <a href={whatsappLink(message)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> Combinar pagamento
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={`/pedido/${confirmedOrder.code}`}>Acompanhar pedido</Link>
              </Button>
            </div>
          </div>

          {/* Convite pós-compra: guest vira conta e o pedido entra no histórico ao verificar o e-mail. */}
          {!session?.user && (
            <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center">
              <p className="text-sm text-foreground">
                Quer acompanhar tudo num só lugar? Crie sua conta com o mesmo e-mail e este pedido
                aparece no seu histórico. 🧶
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link
                  href={`/cadastrar?email=${encodeURIComponent(confirmedOrder.customerEmail)}&callbackUrl=${encodeURIComponent("/conta/pedidos")}`}
                >
                  Criar minha conta
                </Link>
              </Button>
            </div>
          )}
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <div className="mx-auto max-w-md px-4 pb-16 text-center">
          <p className="text-muted-foreground">Não há itens para finalizar.</p>
          <Button asChild className="mt-6">
            <Link href="/galeria">Ver a galeria</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Finalizar pedido" subtitle="Seus dados para combinar entrega e pagamento." />
      {!session?.user && (
        <div className="mx-auto max-w-4xl px-4 pb-5">
          <p className="rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              href={`/entrar?callbackUrl=${encodeURIComponent("/checkout")}`}
              className="font-medium text-primary hover:underline"
            >
              Entre
            </Link>{" "}
            para preencher seus dados e acompanhar o pedido sem precisar do código.
          </p>
        </div>
      )}
      <div className="mx-auto grid max-w-4xl gap-8 px-4 pb-16 md:grid-cols-[1fr_300px]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-5 rounded-2xl border border-border bg-card p-6"
          >
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-5 sm:grid-cols-2">
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
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Endereço de entrega, preferências..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mutation.isError && (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {mutation.error.detail ?? "Não consegui finalizar agora. Tente novamente."}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Enviando..." : "Confirmar pedido"}
            </Button>
          </form>
        </Form>

        <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg">Resumo</h2>
          <ul className="space-y-2 text-sm">
            {items.map((i) => (
              <li key={cartLineKey(i)} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {i.quantity}× {i.name}
                  {i.variantName ? ` · ${i.variantName}` : ""}
                </span>
                <span>{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-border pt-3 font-medium">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
          <p className="rounded-lg bg-secondary/40 px-3 py-2.5 text-xs text-muted-foreground">
            Nada é cobrado agora: depois de confirmar, combinamos o Pix e a entrega pelo WhatsApp.
          </p>
        </aside>
      </div>
    </>
  );
}
