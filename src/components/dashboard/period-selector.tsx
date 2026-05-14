"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const periods = [
  { key: "hora", label: "Hora" },
  { key: "dia", label: "Día" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
] as const;

export type PeriodKey = (typeof periods)[number]["key"];

interface PeriodSelectorProps {
  className?: string;
}

export function PeriodSelector({ className }: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get("periodo") || "semana";

  function handleSelect(period: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", period);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className={cn("inline-flex rounded-lg border bg-background p-1", className)}>
      {periods.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => handleSelect(key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            currentPeriod === key
              ? "bg-cecyte-primary text-white shadow"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
