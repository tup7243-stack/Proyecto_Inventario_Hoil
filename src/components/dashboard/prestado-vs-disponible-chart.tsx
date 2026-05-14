"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface PrestadoVsDisponibleChartProps {
  prestado: number;
  disponible: number;
}

const COLORS = {
  prestado: "#F97316", // orange
  disponible: "#006341", // CECYTE green
};

export function PrestadoVsDisponibleChart({
  prestado,
  disponible,
}: PrestadoVsDisponibleChartProps) {
  const data = [
    { name: "Prestado", value: prestado, fill: COLORS.prestado },
    { name: "Disponible", value: disponible, fill: COLORS.disponible },
  ];

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Prestado vs Disponible
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} unidades`, ""]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
