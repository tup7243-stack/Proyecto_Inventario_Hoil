"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  color?: "green" | "orange" | "red";
  className?: string;
}

const colorMap = {
  green:
    "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
  orange:
    "bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200",
  red: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
};

const iconColorMap = {
  green: "text-green-500",
  orange: "text-orange-500",
  red: "text-red-500",
};

export function KpiCard({
  icon: Icon,
  title,
  value,
  color = "green",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-5 shadow-sm",
        colorMap[color],
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-5 w-5", iconColorMap[color])} />
        <span className="text-sm font-medium opacity-80">{title}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
