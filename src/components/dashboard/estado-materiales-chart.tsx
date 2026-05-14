"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface EstadoMaterialesChartProps {
  bueno: number;
  desgastado: number;
  dañado: number;
}

const COLORS = {
  Bueno: "#006341", // CECYTE green
  Desgastado: "#F97316", // orange
  Dañado: "#EF4444", // red
};

export function EstadoMaterialesChart({
  bueno,
  desgastado,
  dañado,
}: EstadoMaterialesChartProps) {
  const data = [
    { name: "Bueno", value: bueno, fill: COLORS.Bueno },
    { name: "Desgastado", value: desgastado, fill: COLORS.Desgastado },
    { name: "Dañado", value: dañado, fill: COLORS.Dañado },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        Sin materiales registrados
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-2 text-sm font-semibold text-foreground">
        Estado de materiales
      </h3>
      <ResponsiveContainer width="100%" height={240}>
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
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} materiales`, ""]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
