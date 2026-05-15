import { PackagePlus, PlusCircle } from "lucide-react";
import {
  addMaterialStock,
  createMaterial,
  deleteMaterial,
  updateMaterial,
} from "@/lib/actions/admin";
import { ManagedForm } from "@/components/forms/managed-form";
import { createClient } from "@/lib/supabase/server";

const categorias = [
  ["herramienta_manual", "Herramienta manual"],
  ["consumible", "Consumible"],
  ["equipo_proteccion", "Equipo de protección"],
  ["equipo_medicion", "Equipo de medición"],
];

const estados = [
  ["bueno", "Bueno"],
  ["desgastado", "Desgastado"],
  ["dañado", "Dañado"],
];

interface MaterialRow {
  id: string;
  nombre: string;
  categoria: string;
  cantidad_total: number;
  stock_minimo: number;
  estado: string;
}

interface PrestamoRow {
  material_id: string;
  cantidad_prestada: number;
  cantidad_devuelta: number | null;
}

export default async function MaterialesPage() {
  const supabase = await createClient();
  const [{ data: materiales }, { data: prestamos }] = await Promise.all([
    supabase
      .from("materiales")
      .select("id, nombre, categoria, cantidad_total, stock_minimo, estado")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("prestamos")
      .select("material_id, cantidad_prestada, cantidad_devuelta")
      .eq("estado", "activo"),
  ]);

  const prestadoPorMaterial = new Map<string, number>();
  for (const prestamo of (prestamos ?? []) as PrestamoRow[]) {
    const pendiente =
      prestamo.cantidad_prestada - (prestamo.cantidad_devuelta ?? 0);
    prestadoPorMaterial.set(
      prestamo.material_id,
      (prestadoPorMaterial.get(prestamo.material_id) ?? 0) + pendiente
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Materiales</h1>
        <p className="text-sm text-muted-foreground">
          Administra catálogo, estado, stock mínimo y entradas de inventario.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <PlusCircle className="h-5 w-5 text-cecyte-primary" />
          <h2 className="font-semibold">Nuevo material</h2>
        </div>
        <ManagedForm
          action={createMaterial}
          successMessage="Material guardado correctamente."
          resetOnSuccess
          className="grid gap-3 md:grid-cols-6"
        >
          <input
            name="nombre"
            placeholder="Nombre"
            required
            className="rounded-md border px-3 py-2 text-sm md:col-span-2"
          />
          <select name="categoria" className="rounded-md border px-3 py-2 text-sm">
            {categorias.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Cantidad inicial
            <input
              name="cantidad_total"
              type="number"
              min="0"
              defaultValue="0"
              className="rounded-md border px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Stock mínimo
            <input
              name="stock_minimo"
              type="number"
              min="0"
              defaultValue="1"
              className="rounded-md border px-3 py-2 text-sm text-foreground"
            />
          </label>
          <select name="estado" className="rounded-md border px-3 py-2 text-sm">
            {estados.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button className="rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark md:col-span-6">
            Guardar material
          </button>
        </ManagedForm>
      </section>

      <section className="grid gap-4">
        {((materiales ?? []) as MaterialRow[]).map((material) => {
          const prestado = prestadoPorMaterial.get(material.id) ?? 0;
          const disponible = Math.max(0, material.cantidad_total - prestado);
          const bajo = disponible <= material.stock_minimo;

          return (
            <article key={material.id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{material.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{material.categoria} · {material.estado}</p>
                </div>
                <div className={bajo ? "rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800" : "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"}>
                  Disponible: {disponible} / Total: {material.cantidad_total}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <ManagedForm
                  action={updateMaterial}
                  successMessage="Datos del material actualizados."
                  className="grid gap-3 md:grid-cols-5"
                >
                  <input type="hidden" name="id" value={material.id} />
                  <input name="nombre" defaultValue={material.nombre} className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
                  <select name="categoria" defaultValue={material.categoria} className="rounded-md border px-3 py-2 text-sm">
                    {categorias.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <input name="stock_minimo" type="number" min="0" defaultValue={material.stock_minimo} className="rounded-md border px-3 py-2 text-sm" />
                  <select name="estado" defaultValue={material.estado} className="rounded-md border px-3 py-2 text-sm">
                    {estados.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted md:col-span-5">
                    Actualizar datos
                  </button>
                </ManagedForm>

                <ManagedForm
                  action={addMaterialStock}
                  successMessage="Entrada de stock registrada."
                  className="rounded-md bg-cecyte-light p-3"
                >
                  <input type="hidden" name="id" value={material.id} />
                  <label className="text-xs font-medium text-muted-foreground">Añadir stock</label>
                  <div className="mt-2 flex gap-2">
                    <input name="cantidad" type="number" min="1" defaultValue="1" className="w-24 rounded-md border px-3 py-2 text-sm" />
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-md bg-cecyte-primary px-3 py-2 text-sm font-medium text-white hover:bg-cecyte-dark">
                      <PackagePlus className="h-4 w-4" /> Entrada
                    </button>
                  </div>
                  <input name="comentario" placeholder="Comentario opcional" className="mt-2 w-full rounded-md border px-3 py-2 text-xs" />
                </ManagedForm>
              </div>

              <ManagedForm
                action={deleteMaterial}
                successMessage="Material eliminado."
                confirmMessage={`¿Eliminar "${material.nombre}"? Esta acción solo funcionará si no tiene historial.`}
                className="mt-4"
              >
                <input type="hidden" name="id" value={material.id} />
                <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  Eliminar material
                </button>
              </ManagedForm>
            </article>
          );
        })}
      </section>
    </div>
  );
}
