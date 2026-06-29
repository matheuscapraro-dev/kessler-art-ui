"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { whatsappLink } from "@/lib/config";

export function ContactWhatsAppForm() {
  const [message, setMessage] = useState("");
  const text = message.trim() || "Olá! Vim pelo site e gostaria de conversar.";

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
      <Label htmlFor="msg" className="text-base">Escreva sua mensagem</Label>
      <Textarea
        id="msg"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Conte o que você procura — uma peça pronta, uma encomenda, uma dúvida..."
        rows={4}
      />
      <Button asChild size="lg" className="w-full">
        <a href={whatsappLink(text)} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" /> Enviar no WhatsApp
        </a>
      </Button>
    </div>
  );
}
