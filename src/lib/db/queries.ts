import "server-only";

import { createClient } from "@/lib/supabase/server";

// ============================================================
// TIPOS
// ============================================================

export interface MaterialBajo {
  id: string;
  nombre: string;
  cantidad_total: number;
  stock_minimo: number;
  estado: string;
  cantidad_disponible: number;
}

export interface PeriodDataPoint {
  label: string;
  movimientos: number;
}

export interface TopMaterialData {
  name: string;
  count: number;
}

export interface EquipoActividadData {
  name: string;
  count: number;
}

export interface ConsumibleAgotado {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  estado: string;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Calcula la fecha de corte para el filtrado por período.
 */
function getPeriodCutoff(periodo: string): Date {
  const now = new Date();
  switch (periodo) {
    case "hora":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "dia":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "semana":
      return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    case "mes":
      return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Agrupa una fecha en string según el período.
 */
function formatPeriodLabel(date: Date, periodo: string): string {
  switch (periodo) {
    case "hora": {
      const d = new Date(date);
      d.setMinutes(0, 0, 0);
      return `${String(d.getHours()).padStart(2, "0")}:00`;
    }
    case "dia": {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    case "semana": {
      // ISO week: usar string de la semana
      const d = new Date(date);
      const dayOfWeek = d.getDay();
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return `Sem ${String(monday.getDate()).padStart(2, "0")}/${String(monday.getMonth() + 1).padStart(2, "0")}`;
    }
    case "mes": {
      const meses = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
      ];
      return `${meses[date.getMonth()]} ${date.getFullYear()}`;
    }
    default:
      return date.toISOString().slice(0, 10);
  }
}

/**
 * Obtiene un mapa de material_id → cantidad prestada pendiente
 * (préstamos activos: cantidad_prestada - cantidad_devuelta).
 */
async function getActiveLoansByMaterial(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prestamos")
    .select("material_id, cantidad_prestada, cantidad_devuelta")
    .eq("estado", "activo");

  const byMaterial: Record<string, number> = {};
  for (const loan of data || []) {
    const outstanding =
      loan.cantidad_prestada - (loan.cantidad_devuelta || 0);
    byMaterial[loan.material_id] =
      (byMaterial[loan.material_id] || 0) + outstanding;
  }
  return byMaterial;
}

// ============================================================
// KPI 1: Materiales totales en inventario
// ============================================================

export async function getKpiMaterialesTotal(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiales")
    .select("cantidad_total")
    .eq("activo", true);

  return (data || []).reduce(
    (sum, m) => sum + (m.cantidad_total || 0),
    0
  );
}

// ============================================================
// KPI 3: Materiales con stock bajo
// ============================================================

export async function getKpiStockBajo(): Promise<{
  count: number;
  materiales: MaterialBajo[];
}> {
  const supabase = await createClient();
  const [{ data: materiales }, activeLoans] = await Promise.all([
    supabase
      .from("materiales")
      .select("id, nombre, cantidad_total, stock_minimo, estado")
      .eq("activo", true),
    getActiveLoansByMaterial(),
  ]);

  const bajo = (materiales || [])
    .map((m) => {
      const outstanding = activeLoans[m.id] || 0;
      const cantidad_disponible = m.cantidad_total - outstanding;
      return { ...m, cantidad_disponible };
    })
    .filter(
      (m) =>
        m.cantidad_disponible <= m.stock_minimo && m.cantidad_total > 0
    );

  return { count: bajo.length, materiales: bajo };
}

// ============================================================
// KPI 7: Tasa de devolución
// ============================================================

export async function getKpiTasaDevolucion(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prestamos")
    .select("estado");

  if (!data || data.length === 0) return 0;

  const devueltos = data.filter((p) => p.estado === "devuelto").length;
  return Math.round((devueltos / data.length) * 100);
}

// ============================================================
// KPI 2: Prestado vs Disponible (donut chart)
// ============================================================

export async function getPrestadoVsDisponible(): Promise<{
  prestado: number;
  disponible: number;
}> {
  const supabase = await createClient();
  const [{ data: materiales }, activeLoans] = await Promise.all([
    supabase.from("materiales").select("cantidad_total").eq("activo", true),
    getActiveLoansByMaterial(),
  ]);

  const totalMateriales = (materiales || []).reduce(
    (sum, m) => sum + (m.cantidad_total || 0),
    0
  );
  const totalPrestado = Object.values(activeLoans).reduce(
    (sum, v) => sum + v,
    0
  );

  return {
    prestado: totalPrestado,
    disponible: Math.max(0, totalMateriales - totalPrestado),
  };
}

// ============================================================
// KPI 6: Movimientos por período (line chart)
// ============================================================

export async function getMovimientosPorPeriodo(
  periodo: string
): Promise<PeriodDataPoint[]> {
  const supabase = await createClient();
  const cutoff = getPeriodCutoff(periodo);
  const cutoffStr = cutoff.toISOString();

  const { data } = await supabase
    .from("movimientos")
    .select("created_at")
    .gte("created_at", cutoffStr)
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return [];

  // Agrupar por período
  const groups: Record<string, number> = {};
  for (const m of data) {
    const label = formatPeriodLabel(new Date(m.created_at), periodo);
    groups[label] = (groups[label] || 0) + 1;
  }

  return Object.entries(groups).map(([label, movimientos]) => ({
    label,
    movimientos,
  }));
}

// ============================================================
// KPI 4: Top 5 materiales más prestados (horizontal bar chart)
// ============================================================

export async function getTopMateriales(
  periodo: string,
  limit = 5
): Promise<TopMaterialData[]> {
  const supabase = await createClient();
  const cutoff = getCutoffISO(periodo);

  const { data } = await supabase
    .from("prestamos")
    .select("material_id, material:materiales(nombre)")
    .gte("created_at", cutoff);

  if (!data || data.length === 0) return [];

  // Contar por material
  const counts: Record<string, { name: string; count: number }> = {};
  for (const row of data) {
    const materialName =
      (row.material as unknown as { nombre: string } | null)?.nombre ??
      "Desconocido";
    if (!counts[row.material_id]) {
      counts[row.material_id] = { name: materialName, count: 0 };
    }
    counts[row.material_id].count++;
  }

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================================
// KPI 5: Equipos con más actividad (vertical bar chart)
// ============================================================

export async function getEquiposActividad(
  periodo: string
): Promise<EquipoActividadData[]> {
  const supabase = await createClient();
  const cutoff = getCutoffISO(periodo);

  // Combinar movimientos y préstamos para medir actividad total
  const [{ data: movs }, { data: prests }] = await Promise.all([
    supabase
      .from("movimientos")
      .select("equipo_id, equipo:equipos(nombre)")
      .gte("created_at", cutoff),
    supabase
      .from("prestamos")
      .select("equipo_id, equipo:equipos(nombre)")
      .gte("created_at", cutoff),
  ]);

  const counts: Record<string, { name: string; count: number }> = {};

  for (const row of [...(movs || []), ...(prests || [])]) {
    if (!row.equipo_id) continue;
    const equipoName =
      (row.equipo as unknown as { nombre: string } | null)?.nombre ??
      "Sin equipo";
    if (!counts[row.equipo_id]) {
      counts[row.equipo_id] = { name: equipoName, count: 0 };
    }
    counts[row.equipo_id].count++;
  }

  return Object.values(counts).sort((a, b) => b.count - a.count);
}

// ============================================================
// KPI 8: Distribución de estado de materiales (donut chart)
// ============================================================

export async function getEstadoMateriales(): Promise<{
  bueno: number;
  desgastado: number;
  dañado: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("materiales")
    .select("estado")
    .eq("activo", true);

  const counts = { bueno: 0, desgastado: 0, dañado: 0 };
  for (const m of data || []) {
    if (m.estado === "bueno") counts.bueno++;
    else if (m.estado === "desgastado") counts.desgastado++;
    else if (m.estado === "dañado") counts.dañado++;
  }

  return counts;
}

// ============================================================
// KPI 9: Consumibles agotados
// ============================================================

export async function getConsumiblesAgotados(): Promise<
  ConsumibleAgotado[]
> {
  const supabase = await createClient();
  const [{ data: materiales }, activeLoans] = await Promise.all([
    supabase
      .from("materiales")
      .select("id, nombre, cantidad_total, stock_minimo, estado")
      .eq("categoria", "consumible")
      .eq("activo", true),
    getActiveLoansByMaterial(),
  ]);

  if (!materiales) return [];

  return materiales
    .map((m) => {
      const outstanding = activeLoans[m.id] || 0;
      const stock_actual = m.cantidad_total - outstanding;
      return {
        id: m.id,
        nombre: m.nombre,
        stock_actual,
        stock_minimo: m.stock_minimo,
        estado: m.estado,
      };
    })
    .filter((m) => m.stock_actual <= m.stock_minimo);
}

// ============================================================
// HELPERS INTERNOS
// ============================================================

function getCutoffISO(periodo: string): string {
  return getPeriodCutoff(periodo).toISOString();
}
