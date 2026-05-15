import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface MovimientoRow {
  id: string;
  tipo: string;
  cantidad: number;
  created_at: string;
  comentario: string | null;
  material: { nombre: string } | { nombre: string }[] | null;
  equipo: { nombre: string } | { nombre: string }[] | null;
  usuario: { nombre: string } | { nombre: string }[] | null;
}

function relatedName(value: { nombre: string } | { nombre: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.nombre;
  return value?.nombre;
}

const tipoLabels: Record<string, string> = {
  entrada_stock: "Entrada de stock",
  salida_prestamo: "Préstamo",
  entrada_devolucion: "Devolución",
  consumo: "Consumo",
  eliminacion_material: "Material eliminado",
};

function clampDateRange(desdeParam?: string, hastaParam?: string) {
  const now = new Date();
  const maxPast = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const hasta = hastaParam ? new Date(`${hastaParam}T23:59:59`) : now;
  const desiredDesde = desdeParam ? new Date(`${desdeParam}T00:00:00`) : maxPast;
  const desde = desiredDesde < maxPast ? maxPast : desiredDesde;

  return {
    desde,
    hasta: hasta > now ? now : hasta,
    desdeValue: desde.toISOString().slice(0, 10),
    hastaValue: (hasta > now ? now : hasta).toISOString().slice(0, 10),
  };
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; tipo?: string };
}) {
  const supabase = await createClient();
  const { desde, hasta, desdeValue, hastaValue } = clampDateRange(
    searchParams.desde,
    searchParams.hasta
  );
  const tipo = searchParams.tipo ?? "todos";

  let query = supabase
    .from("movimientos")
    .select(
      "id, tipo, cantidad, created_at, comentario, material:materiales(nombre), equipo:equipos(nombre), usuario:perfiles(nombre)"
    )
    .gte("created_at", desde.toISOString())
    .lte("created_at", hasta.toISOString())
    .order("created_at", { ascending: false });

  if (tipo !== "todos") {
    query = query.eq("tipo", tipo);
  }

  const { data: movimientos } = await query;
  const rows = (movimientos ?? []) as unknown as MovimientoRow[];

  const resumen = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.tipo] = (acc[row.tipo] ?? 0) + row.cantidad;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Consulta movimientos por período. El rango máximo permitido es de 6 meses.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5">
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Desde</span>
            <input name="desde" type="date" defaultValue={desdeValue} className="rounded-md border px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Hasta</span>
            <input name="hasta" type="date" defaultValue={hastaValue} className="rounded-md border px-3 py-2" />
          </label>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Tipo</span>
            <select name="tipo" defaultValue={tipo} className="rounded-md border px-3 py-2">
              <option value="todos">Todos</option>
              <option value="entrada_stock">Entrada de stock</option>
              <option value="salida_prestamo">Préstamos</option>
              <option value="entrada_devolucion">Devoluciones</option>
              <option value="consumo">Consumos</option>
              <option value="eliminacion_material">Materiales eliminados</option>
            </select>
          </label>
          <button className="self-end rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark">
            Filtrar
          </button>
        </form>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {Object.entries(tipoLabels).map(([key, label]) => (
          <div key={key} className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{resumen[key] ?? 0}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cecyte-primary" />
          <h2 className="font-semibold">Movimientos</h2>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay movimientos en este rango.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Material</th>
                  <th className="pb-2 font-medium">Cantidad</th>
                  <th className="pb-2 font-medium">Equipo</th>
                  <th className="pb-2 font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(row.created_at).toLocaleString("es-MX")}</td>
                    <td className="py-2 pr-4">{tipoLabels[row.tipo] ?? row.tipo}</td>
                    <td className="py-2 pr-4">{relatedName(row.material) ?? "—"}</td>
                    <td className="py-2 pr-4">{row.cantidad}</td>
                    <td className="py-2 pr-4">{relatedName(row.equipo) ?? "—"}</td>
                    <td className="py-2 pr-4">{relatedName(row.usuario) ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
