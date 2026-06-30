"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Check, MessageCircle, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { whatsappLink } from "@/lib/config";
import {
  commissionStatusLabel,
  commissionStatusOrder,
  workPriorityLabel,
  workTypeEmoji,
  workTypeLabel,
  type Commission,
  type CommissionStatus,
  type WorkPriority,
  type WorkType,
} from "@/types/orders";
import type {
  CommissionTaskInput,
  CreateCommissionPayload,
  UpdateCommissionPayload,
} from "@/services/commissions";
import { priorityDot } from "./utils";

const workTypes = Object.keys(workTypeLabel) as WorkType[];
const priorities = Object.keys(workPriorityLabel) as WorkPriority[];

interface FormState {
  type: WorkType;
  title: string;
  description: string;
  priority: WorkPriority;
  status: CommissionStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  desiredCategory: string;
  colors: string;
  size: string;
  desiredDeadline: string;
  quotedPrice: string;
  adminNotes: string;
}

function blank(status: CommissionStatus): FormState {
  return {
    type: "Encomenda",
    title: "",
    description: "",
    priority: "Normal",
    status,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    desiredCategory: "",
    colors: "",
    size: "",
    desiredDeadline: "",
    quotedPrice: "",
    adminNotes: "",
  };
}

function fromDetail(d: Commission): FormState {
  return {
    type: d.type,
    title: d.title ?? "",
    description: d.description,
    priority: d.priority,
    status: d.status,
    customerName: d.customerName ?? "",
    customerEmail: d.customerEmail ?? "",
    customerPhone: d.customerPhone ?? "",
    desiredCategory: d.desiredCategory ?? "",
    colors: d.colors ?? "",
    size: d.size ?? "",
    desiredDeadline: d.desiredDeadline ? d.desiredDeadline.slice(0, 10) : "",
    quotedPrice: d.quotedPrice != null ? String(d.quotedPrice) : "",
    adminNotes: d.adminNotes ?? "",
  };
}

interface WorkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  detail: Commission | null;
  defaultStatus: CommissionStatus;
  saving: boolean;
  onCreate: (payload: CreateCommissionPayload) => void;
  onUpdate: (payload: UpdateCommissionPayload) => void;
  onSaveTasks: (tasks: CommissionTaskInput[]) => void;
  onDelete: () => void;
}

export function WorkSheet({
  open,
  onOpenChange,
  mode,
  detail,
  defaultStatus,
  saving,
  onCreate,
  onUpdate,
  onSaveTasks,
  onDelete,
}: WorkSheetProps) {
  const [form, setForm] = useState<FormState>(blank(defaultStatus));
  const [showContact, setShowContact] = useState(false);
  const [tasks, setTasks] = useState<CommissionTaskInput[]>([]);
  const [newTask, setNewTask] = useState("");

  // (Re)inicializa o formulário quando o painel abre.
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && detail) {
      setForm(fromDetail(detail));
      setTasks(detail.tasks.map((t) => ({ title: t.title, isDone: t.isDone })));
      setShowContact(!!detail.customerName);
    } else {
      setForm(blank(defaultStatus));
      setTasks([]);
      setShowContact(false);
    }
    setNewTask("");
  }, [open, mode, detail, defaultStatus]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isEncomenda = form.type === "Encomenda";
  const contactVisible = isEncomenda || showContact;

  const valid =
    form.description.trim().length >= 10 &&
    (!isEncomenda || (form.customerName.trim() !== "" && form.customerPhone.trim() !== ""));

  function submit() {
    const deadline = form.desiredDeadline || null;
    const price = form.quotedPrice.trim() === "" ? null : Number(form.quotedPrice);

    if (mode === "create") {
      const payload: CreateCommissionPayload = {
        description: form.description.trim(),
        type: form.type,
        title: form.title.trim() || undefined,
        priority: form.priority,
        status: form.status,
        desiredCategory: form.desiredCategory.trim() || undefined,
        colors: form.colors.trim() || undefined,
        size: form.size.trim() || undefined,
        desiredDeadline: deadline,
        quotedPrice: price,
      };
      if (contactVisible) {
        payload.customerName = form.customerName.trim() || undefined;
        payload.customerEmail = form.customerEmail.trim() || undefined;
        payload.customerPhone = form.customerPhone.trim() || undefined;
      }
      onCreate(payload);
    } else {
      onUpdate({
        description: form.description.trim(),
        type: form.type,
        title: form.title.trim() || undefined,
        priority: form.priority,
        status: form.status,
        desiredCategory: form.desiredCategory.trim() || undefined,
        colors: form.colors.trim() || undefined,
        size: form.size.trim() || undefined,
        desiredDeadline: deadline,
        quotedPrice: price,
        adminNotes: form.adminNotes.trim() || undefined,
      });
    }
  }

  // Edição de checklist (salva imediato — substitui a lista inteira).
  function commitTasks(next: CommissionTaskInput[]) {
    setTasks(next);
    onSaveTasks(next);
  }
  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    commitTasks([...tasks, { title, isDone: false }]);
    setNewTask("");
  };
  const toggleTask = (i: number) =>
    commitTasks(tasks.map((t, idx) => (idx === i ? { ...t, isDone: !t.isDone } : t)));
  const removeTask = (i: number) => commitTasks(tasks.filter((_, idx) => idx !== i));

  const doneCount = useMemo(() => tasks.filter((t) => t.isDone).length, [tasks]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader className="sticky top-0 z-10 border-b bg-popover">
          <SheetTitle>
            {mode === "create" ? "Novo trabalho" : detail?.title?.trim() || detail?.code || "Trabalho"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "Encomenda de cliente ou um projeto seu — escolha o tipo."
              : `${workTypeLabel[form.type]}${detail ? ` · ${detail.code}` : ""}`}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-4">
          {/* tipo — grade de chips */}
          <div className="space-y-2">
            <Label>Tipo de trabalho</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {workTypes.map((t) => {
                const active = form.type === t;
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => set("type", t)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-2 text-center text-[0.7rem] font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted",
                    )}
                  >
                    <span className="text-lg leading-none">{workTypeEmoji[t]}</span>
                    {workTypeLabel[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* título */}
          <div className="space-y-1.5">
            <Label htmlFor="w-title">Título</Label>
            <Input
              id="w-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Ex.: Amigurumi coelho rosa"
            />
          </div>

          {/* descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="w-desc">Descrição *</Label>
            <Textarea
              id="w-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="O que será feito (mín. 10 caracteres)"
            />
          </div>

          {/* prioridade — controle segmentado */}
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
              {priorities.map((p) => {
                const active = form.priority === p;
                return (
                  <button
                    type="button"
                    key={p}
                    onClick={() => set("priority", p)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                      active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className={cn("size-2 rounded-full", priorityDot[p])} />
                    {workPriorityLabel[p]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* status / coluna */}
          <div className="space-y-1.5">
            <Label>{mode === "create" ? "Coluna inicial" : "Status"}</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as CommissionStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commissionStatusOrder.map((s) => (
                  <SelectItem key={s} value={s}>
                    {commissionStatusLabel[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* cliente */}
          {contactVisible ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Contato {isEncomenda ? "(cliente)" : "(opcional)"}
                </p>
                {detail?.customerPhone && (
                  <Button asChild size="xs" variant="outline">
                    <a
                      href={whatsappLink(`Olá! Sobre ${detail.title?.trim() || detail.code}...`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w-cn">Nome {isEncomenda && "*"}</Label>
                <Input id="w-cn" value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="w-cp">WhatsApp {isEncomenda && "*"}</Label>
                  <Input id="w-cp" value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} placeholder="(47) 99999-9999" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w-ce">E-mail</Label>
                  <Input id="w-ce" type="email" value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} placeholder="opcional" />
                </div>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowContact(true)}>
              <Plus /> Adicionar contato
            </Button>
          )}

          {/* detalhes da peça */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="w-cat">Categoria</Label>
              <Input id="w-cat" value={form.desiredCategory} onChange={(e) => set("desiredCategory", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-col">Cores</Label>
              <Input id="w-col" value={form.colors} onChange={(e) => set("colors", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-siz">Tamanho</Label>
              <Input id="w-siz" value={form.size} onChange={(e) => set("size", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Prazo</Label>
              <DatePicker value={form.desiredDeadline} onChange={(v) => set("desiredDeadline", v)} placeholder="Opcional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w-price">Orçamento (R$)</Label>
              <Input id="w-price" type="number" step="0.01" value={form.quotedPrice} onChange={(e) => set("quotedPrice", e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          {/* checklist — só na edição (precisa de id) */}
          {mode === "edit" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Checklist</Label>
                {tasks.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {doneCount}/{tasks.length} concluídas
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {tasks.map((t, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTask(i)}
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        t.isDone ? "border-chart-2 bg-chart-2 text-white" : "border-muted-foreground/40"
                      )}
                    >
                      {t.isDone && <Check className="size-3" />}
                    </button>
                    <span className={cn("flex-1 text-sm", t.isDone && "text-muted-foreground line-through")}>
                      {t.title}
                    </span>
                    <Button variant="ghost" size="icon-xs" onClick={() => removeTask(i)}>
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTask();
                    }
                  }}
                  placeholder="Adicionar tarefa…"
                />
                <Button type="button" variant="outline" size="icon" onClick={addTask}>
                  <Plus />
                </Button>
              </div>
            </div>
          )}

          {/* notas internas + fotos — só na edição */}
          {mode === "edit" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="w-notes">Notas internas</Label>
                <Textarea id="w-notes" rows={2} value={form.adminNotes} onChange={(e) => set("adminNotes", e.target.value)} />
              </div>

              {detail && detail.referenceImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Fotos de referência</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {detail.referenceImages.map((img) => (
                      <a
                        key={img.id}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                      >
                        <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <SheetFooter className="sticky bottom-0 z-10 border-t bg-popover">
          <div className="flex items-center gap-2">
            {mode === "edit" && (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 /> Excluir
              </Button>
            )}
            <Button className="ml-auto" disabled={!valid || saving} onClick={submit}>
              {saving ? "Salvando..." : mode === "create" ? "Criar" : "Salvar"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
