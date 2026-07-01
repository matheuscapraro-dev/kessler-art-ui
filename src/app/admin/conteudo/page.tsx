"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AboutPhotoManager } from "@/components/admin/about-photo-manager";
import { contentService, type UpdateContentPayload } from "@/services/content";
import { ApiError } from "@/lib/api-client";
import type { SiteContent } from "@/types/content";

const empty: UpdateContentPayload = {
  whatsApp: "",
  instagramUrl: "",
  aboutTitle: "",
  aboutIntro: "",
  aboutStoryTitle: "",
  aboutStory: "",
};

export default function AdminConteudoPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<UpdateContentPayload>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-content"],
    queryFn: () => contentService.get(),
  });

  useEffect(() => {
    if (data) {
      setForm({
        whatsApp: data.whatsApp ?? "",
        instagramUrl: data.instagramUrl ?? "",
        aboutTitle: data.aboutTitle ?? "",
        aboutIntro: data.aboutIntro ?? "",
        aboutStoryTitle: data.aboutStoryTitle ?? "",
        aboutStory: data.aboutStory ?? "",
      });
    }
  }, [data]);

  const save = useMutation<SiteContent, ApiError, void>({
    mutationFn: () => contentService.update(form),
    onSuccess: (updated) => {
      qc.setQueryData(["admin-content"], updated);
      qc.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Conteúdo salvo.");
    },
    onError: (e) => toast.error(e.detail ?? "Não foi possível salvar."),
  });

  const set = (k: keyof UpdateContentPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Conteúdo do site</h1>
        <p className="text-muted-foreground">Edite os textos, o contato e as fotos — sem precisar de ninguém.</p>
      </div>

      {/* Contato */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg">Contato & redes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="wa">WhatsApp</Label>
            <Input id="wa" value={form.whatsApp} onChange={set("whatsApp")} placeholder="5547999999999 (com DDI 55)" />
            <p className="text-xs text-muted-foreground">Só números, com 55 na frente. Usado nos botões de WhatsApp.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ig">Instagram (link)</Label>
            <Input id="ig" value={form.instagramUrl} onChange={set("instagramUrl")} placeholder="https://instagram.com/kesslerartcroche" />
          </div>
        </div>
      </section>

      {/* Página Sobre — textos */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg">Página “Sobre” — textos</h2>
        <div className="space-y-1.5">
          <Label htmlFor="at">Título</Label>
          <Input id="at" value={form.aboutTitle} onChange={set("aboutTitle")} placeholder="Crochê com propósito e carinho" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ai">Introdução</Label>
          <Textarea id="ai" rows={3} value={form.aboutIntro} onChange={set("aboutIntro")} placeholder="Um parágrafo de abertura..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ast">Título da história</Label>
          <Input id="ast" value={form.aboutStoryTitle} onChange={set("aboutStoryTitle")} placeholder="Nossa história" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="as">História</Label>
          <Textarea id="as" rows={6} value={form.aboutStory} onChange={set("aboutStory")} placeholder="Conte a sua história... (deixe uma linha em branco para separar parágrafos)" />
          <p className="text-xs text-muted-foreground">Uma linha em branco começa um novo parágrafo.</p>
        </div>
      </section>

      <div className="sticky bottom-4 z-10">
        <Button size="lg" className="w-full shadow-soft-lg" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar textos e contato"}
        </Button>
      </div>

      {/* Página Sobre — fotos */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h2 className="font-heading text-lg">Página “Sobre” — fotos</h2>
          <p className="text-sm text-muted-foreground">
            As fotos salvam sozinhas ao enviar. A primeira vira o destaque do topo.
          </p>
        </div>
        <AboutPhotoManager photos={data?.aboutPhotos ?? []} />
      </section>
    </div>
  );
}
