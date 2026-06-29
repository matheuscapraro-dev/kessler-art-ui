"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { orderService } from "@/services/orders";
import { commissionService } from "@/services/commissions";
import { authService } from "@/services/auth";

function StatCard({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
      <p className="text-3xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => orderService.list() });
  const commissions = useQuery({ queryKey: ["admin-commissions"], queryFn: () => commissionService.list() });

  const pendingOrders = orders.data?.filter((o) => o.status === "Pendente").length ?? 0;
  const newCommissions = commissions.data?.filter((c) => c.status === "Nova").length ?? 0;
  const user = authService.getUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Olá, {user?.name ?? "Kessler"} 👋</h1>
        <p className="text-muted-foreground">Um resumo do que está acontecendo na sua loja.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pedidos pendentes" value={pendingOrders} href="/admin/pedidos" />
        <StatCard label="Pedidos no total" value={orders.data?.length ?? 0} href="/admin/pedidos" />
        <StatCard label="Encomendas novas" value={newCommissions} href="/admin/encomendas" />
        <StatCard label="Encomendas no total" value={commissions.data?.length ?? 0} href="/admin/encomendas" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/produtos" className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40">
          <p className="font-heading text-lg">Gerenciar peças</p>
          <p className="text-sm text-muted-foreground">Adicione, edite e publique suas criações.</p>
        </Link>
        <Link href="/admin/categorias" className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40">
          <p className="font-heading text-lg">Categorias</p>
          <p className="text-sm text-muted-foreground">Organize a galeria e a loja.</p>
        </Link>
      </div>
    </div>
  );
}
