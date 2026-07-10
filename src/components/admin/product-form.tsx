"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminCatalogService, type ProductPayload } from "@/services/admin-catalog";
import { ApiError } from "@/lib/api-client";
import type { Product } from "@/types/catalog";

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Dê um nome (ex.: P, M, G)."),
  price: z
    .string()
    .min(1, "Informe o preço.")
    .refine((s) => !Number.isNaN(Number(s)) && Number(s) >= 0, "Preço inválido."),
});

const schema = z
  .object({
    name: z.string().min(1, "Informe o nome."),
    categoryId: z.string().min(1, "Selecione uma categoria."),
    availability: z.enum(["ReadyToBuy", "MadeToOrder"]),
    description: z.string().optional(),
    price: z.string().optional(),
    stockQuantity: z.string().optional(),
    leadTimeDays: z.string().optional(),
    isFeatured: z.boolean(),
    isPublished: z.boolean(),
    variants: z.array(variantSchema),
  })
  .refine(
    (d) =>
      d.availability !== "ReadyToBuy" ||
      d.variants.length > 0 ||
      (!!d.price && Number(d.price) >= 0),
    {
      message: "Informe um preço (ou adicione tamanhos com preço).",
      path: ["price"],
    }
  );

type FormValues = z.infer<typeof schema>;

function toPayload(v: FormValues): ProductPayload {
  const num = (s?: string) => (s && s.trim() !== "" ? Number(s) : null);
  return {
    name: v.name,
    categoryId: v.categoryId,
    availability: v.availability,
    description: v.description || undefined,
    // Com tamanhos, o preço da peça é derivado no backend (menor tamanho).
    price: v.variants.length > 0 ? null : num(v.price),
    stockQuantity: v.availability === "ReadyToBuy" ? num(v.stockQuantity) : null,
    leadTimeDays: v.availability === "MadeToOrder" ? num(v.leadTimeDays) : null,
    isFeatured: v.isFeatured,
    isPublished: v.isPublished,
    variants: v.variants.map((x) => ({
      id: x.id || null,
      name: x.name,
      price: Number(x.price),
    })),
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminCatalogService.listCategories(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      categoryId: product?.categoryId ?? "",
      availability: product?.availability ?? "ReadyToBuy",
      description: product?.description ?? "",
      price: product?.price != null ? String(product.price) : "",
      stockQuantity: product?.stockQuantity != null ? String(product.stockQuantity) : "",
      leadTimeDays: product?.leadTimeDays != null ? String(product.leadTimeDays) : "",
      isFeatured: product?.isFeatured ?? false,
      isPublished: product?.isPublished ?? true,
      variants:
        product?.variants
          ?.slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((v) => ({ id: v.id, name: v.name, price: String(v.price) })) ?? [],
    },
  });

  const availability = form.watch("availability");
  const variantArray = useFieldArray({ control: form.control, name: "variants" });
  const hasVariants = form.watch("variants").length > 0;

  const mutation = useMutation<Product, ApiError, FormValues>({
    mutationFn: (values) =>
      product
        ? adminCatalogService.updateProduct(product.id, toPayload(values))
        : adminCatalogService.createProduct(toPayload(values)),
    onSuccess: (saved) => {
      toast.success(product ? "Peça atualizada." : "Peça criada — agora adicione fotos.");
      if (!product) router.replace(`/admin/produtos/${saved.id}`);
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível salvar."),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        className="space-y-5 rounded-2xl border border-border bg-card p-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disponibilidade</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ReadyToBuy">Pronta entrega</SelectItem>
                    <SelectItem value="MadeToOrder">Sob encomenda</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {!hasVariants && (
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{availability === "MadeToOrder" ? "Preço a partir de (R$)" : "Preço (R$)"}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {availability === "ReadyToBuy" && (
            <FormField
              control={form.control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estoque</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {availability === "MadeToOrder" && (
            <FormField
              control={form.control}
              name="leadTimeDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo (dias)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ── Tamanhos e preços ── */}
        <div className="space-y-4 rounded-xl border border-dashed border-border p-4">
          <div>
            <p className="text-sm font-medium">Tamanhos e preços</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Para peças vendidas em mais de um tamanho (P/M/G, 20 cm...). Com tamanhos, o site
              exibe &quot;a partir de&quot; com o menor preço e o cliente escolhe na página da peça.
            </p>
          </div>

          {variantArray.fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name={`variants.${index}.name`}
                render={({ field: f }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Tamanho (ex.: P, M, G, 20 cm)" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variants.${index}.price`}
                render={({ field: f }) => (
                  <FormItem className="w-36">
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Preço (R$)" {...f} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => variantArray.remove(index)}
                aria-label="Remover tamanho"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => variantArray.append({ name: "", price: "" })}
          >
            <Plus className="size-4" /> Adicionar tamanho
          </Button>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-6">
          <FormField
            control={form.control}
            name="isFeatured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Destaque na home</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <input type="checkbox" checked={field.value} onChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">Publicada</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {!product && (
          <FormDescription>Salve a peça para liberar o envio de fotos.</FormDescription>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/produtos")}>
            Voltar
          </Button>
        </div>
      </form>
    </Form>
  );
}
