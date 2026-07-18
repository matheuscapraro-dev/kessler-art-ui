"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyCommissions } from "@/hooks/use-account";
import { formatPrice } from "@/lib/format";
import { commissionStatusLabel } from "@/types/orders";

export default function MyCommissionsPage() {
  const { data: commissions, isLoading } = useMyCommissions();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!commissions?.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <Sparkles className="mx-auto size-10 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">Você ainda não tem encomendas por aqui.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Encomendas feitas como convidado aparecem depois que você confirma seu e-mail.
        </p>
        <Button asChild className="mt-6">
          <Link href="/encomendar">Fazer uma encomenda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commissions.map((commission) => (
        <Link
          key={commission.id}
          href={`/encomenda/${commission.code}`}
          className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-heading text-lg text-primary">{commission.code}</span>
            <Badge variant="secondary" className="rounded-full">
              {commissionStatusLabel[commission.status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(commission.createdAt).toLocaleDateString("pt-BR")}
            {commission.quotedPrice != null && (
              <>
                {" "}
                · orçamento:{" "}
                <span className="font-medium text-foreground">
                  {formatPrice(commission.quotedPrice)}
                </span>
              </>
            )}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{commission.description}</p>
        </Link>
      ))}
    </div>
  );
}
