"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Busca um pedido/encomenda pelo código de acompanhamento.
 * Códigos ENC-XXXXX vão para /encomenda; os demais (KES-XXXXX) para /pedido.
 */
export function TrackLookupForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;
    router.push(
      normalized.startsWith("ENC") ? `/encomenda/${normalized}` : `/pedido/${normalized}`
    );
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="KES-XXXXX ou ENC-XXXXX"
        aria-label="Código de acompanhamento"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        className="uppercase placeholder:normal-case"
      />
      <Button type="submit" variant="secondary" disabled={!code.trim()}>
        <Search className="size-4" /> Buscar
      </Button>
    </form>
  );
}
