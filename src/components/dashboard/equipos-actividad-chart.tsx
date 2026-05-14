"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EquipoActividadData } from "@/lib/db/queries";

interface EquiposActividadChartProps {
  data: EquipoActividadData[];
}

export function EquiposActividadChart({
  data,
}: EquiposActividadChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Sin actividad en este período
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Equipos con más actividad
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            formatter={(value) => [`${value} acciones`, ""]}
          />
          <Bar
            dataKey="count"
            fill="#006341"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
