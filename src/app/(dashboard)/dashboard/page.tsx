import { Suspense } from "react";
import {
  Package,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { PrestadoVsDisponibleChart } from "@/components/dashboard/prestado-vs-disponible-chart";
import { MovimientosPorPeriodoChart } from "@/components/dashboard/movimientos-por-periodo-chart";
import { TopMaterialesChart } from "@/components/dashboard/top-materiales-chart";
import { EquiposActividadChart } from "@/components/dashboard/equipos-actividad-chart";
import { EstadoMaterialesChart } from "@/components/dashboard/estado-materiales-chart";
import {
  getKpiMaterialesTotal,
  getKpiStockBajo,
  getKpiTasaDevolucion,
  getPrestadoVsDisponible,
  getMovimientosPorPeriodo,
  getTopMateriales,
  getEquiposActividad,
  getEstadoMateriales,
  getConsumiblesAgotados,
} from "@/lib/db/queries";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { periodo?: string };
}) {
  const periodo = searchParams.periodo || "semana";

  // Fetch all KPI data in parallel
  const [
    kpiMaterialesTotal,
    kpiStockBajo,
    kpiTasaDevolucion,
    prestadoVsDisponible,
    movimientosPorPeriodo,
    topMateriales,
    equiposActividad,
    estadoMateriales,
    consumiblesAgotados,
  ] = await Promise.all([
    getKpiMaterialesTotal(),
    getKpiStockBajo(),
    getKpiTasaDevolucion(),
    getPrestadoVsDisponible(),
    getMovimientosPorPeriodo(periodo),
    getTopMateriales(periodo),
    getEquiposActividad(periodo),
    getEstadoMateriales(),
    getConsumiblesAgotados(),
  ]);

  // Determine color for tasa de devolución
  const tasaColor =
    kpiTasaDevolucion >= 80
      ? "green"
      : kpiTasaDevolucion >= 50
        ? "orange"
        : "red";

  // Determine color for stock bajo
  const stockColor = kpiStockBajo.count > 0 ? "orange" : "green";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Panel de Administración
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo de inventario en tiempo real
          </p>
        </div>
        <Suspense
          fallback={
            <div className="h-9 w-48 animate-pulse rounded-lg bg-muted" />
          }
        >
          <PeriodSelector />
        </Suspense>
      </div>

      {/* Row 1: 3 KPI cards + Donut chart */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1 — Materiales totales */}
        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded-lg bg-muted" />
          }
        >
          <KpiCard
            icon={Package}
            title="Materiales totales"
            value={kpiMaterialesTotal}
            color="green"
          />
        </Suspense>

        {/* KPI 3 — Stock bajo */}
        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded-lg bg-muted" />
          }
        >
          <KpiCard
            icon={AlertTriangle}
            title="Stock bajo"
            value={kpiStockBajo.count}
            color={stockColor}
          />
        </Suspense>

        {/* KPI 7 — Tasa de devolución */}
        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded-lg bg-muted" />
          }
        >
          <KpiCard
            icon={RefreshCw}
            title="Tasa devolución"
            value={`${kpiTasaDevolucion}%`}
            color={tasaColor}
          />
        </Suspense>

        {/* KPI 2 — Prestado vs Disponible (donut) */}
        <Suspense
          fallback={
            <div className="h-28 animate-pulse rounded-lg bg-muted" />
          }
        >
          <div className="rounded-lg border bg-card p-4">
            <PrestadoVsDisponibleChart
              prestado={prestadoVsDisponible.prestado}
              disponible={prestadoVsDisponible.disponible}
            />
          </div>
        </Suspense>
      </div>

      {/* Row 2: Movimientos por período (full width line chart) */}
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-lg bg-muted" />
        }
      >
        <div className="rounded-lg border bg-card p-4">
          <MovimientosPorPeriodoChart data={movimientosPorPeriodo} />
        </div>
      </Suspense>

      {/* Row 3: Top materiales + Equipos actividad (side by side) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense
          fallback={
            <div className="h-72 animate-pulse rounded-lg bg-muted" />
          }
        >
          <div className="rounded-lg border bg-card p-4">
            <TopMaterialesChart data={topMateriales} />
          </div>
        </Suspense>

        <Suspense
          fallback={
            <div className="h-72 animate-pulse rounded-lg bg-muted" />
          }
        >
          <div className="rounded-lg border bg-card p-4">
            <EquiposActividadChart data={equiposActividad} />
          </div>
        </Suspense>
      </div>

      {/* Row 4: Consumibles agotados (table) */}
      <Suspense
        fallback={
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        }
      >
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Consumibles agotados o cercanos
          </h3>
          {consumiblesAgotados.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay consumibles con stock bajo
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nombre</th>
                    <th className="pb-2 font-medium">Stock actual</th>
                    <th className="pb-2 font-medium">Stock mínimo</th>
                    <th className="pb-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {consumiblesAgotados.map((c) => (
                    <tr
                      key={c.id}
                      className={
                        c.stock_actual === 0
                          ? "bg-red-50 text-red-800"
                          : "bg-orange-50 text-orange-800"
                      }
                    >
                      <td className="py-2 pr-4 font-medium">{c.nombre}</td>
                      <td className="py-2 pr-4">{c.stock_actual}</td>
                      <td className="py-2 pr-4">{c.stock_minimo}</td>
                      <td className="py-2">{c.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Suspense>

      {/* Row 5: Estado de materiales (donut chart) */}
      <Suspense
        fallback={
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        }
      >
        <div className="rounded-lg border bg-card p-4">
          <EstadoMaterialesChart
            bueno={estadoMateriales.bueno}
            desgastado={estadoMateriales.desgastado}
            dañado={estadoMateriales.dañado}
          />
        </div>
      </Suspense>
    </div>
  );
}
