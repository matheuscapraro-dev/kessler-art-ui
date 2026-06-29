"use client";

import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  /** Valor no formato ISO "yyyy-MM-dd" (ou vazio). */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Bloqueia datas anteriores a hoje (ex.: prazo de entrega). */
  disablePast?: boolean;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Escolha uma data",
  disablePast = false,
  id,
}: DatePickerProps) {
  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="size-4 opacity-70" />
          {selected ? format(selected, "PPP", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
          locale={ptBR}
          autoFocus
          disabled={disablePast ? { before: today } : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
