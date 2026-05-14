"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PeriodDataPoint } from "@/lib/db/queries";

interface MovimientosPorPeriodoChartProps {
  data: PeriodDataPoint[];
}

export function MovimientosPorPeriodoChart({
  data,
}: MovimientosPorPeriodoChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Sin movimientos en este período
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Movimientos por período
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            formatter={(value) => [`${value} movimientos`, ""]}
          />
          <Line
            type="monotone"
            dataKey="movimientos"
            stroke="#006341"
            strokeWidth={2}
            dot={{ r: 3, fill: "#006341" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
