"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { TopMaterialData } from "@/lib/db/queries";

interface TopMaterialesChartProps {
  data: TopMaterialData[];
}

const CECYTE_GREEN = "#006341";

export function TopMaterialesChart({ data }: TopMaterialesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Sin préstamos en este período
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Top materiales más prestados
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 12 }}
            width={130}
            className="text-muted-foreground"
          />
          <Tooltip
            formatter={(value) => [`${value} préstamos`, ""]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CECYTE_GREEN}
                opacity={1 - index * 0.12}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
