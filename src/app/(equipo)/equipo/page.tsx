import { AlertTriangle, PackageCheck, RefreshCw, ShoppingBasket } from "lucide-react";
import {
  consumirMaterial,
  devolverMaterial,
  pedirMaterial,
} from "@/lib/actions/prestamos";
import { ManagedForm } from "@/components/forms/managed-form";
import { SearchBox } from "@/components/search-box";
import { createClient } from "@/lib/supabase/server";
import { getSearchParam, matchesSearch } from "@/lib/search";

interface MaterialRow {
  id: string;
  nombre: string;
  categoria: string;
  cantidad_total: number;
  stock_minimo: number;
  estado: string;
}

interface PrestamoActivoRow {
  id: string;
  material_id: string;
  cantidad_prestada: number;
  cantidad_devuelta: number | null;
  created_at: string;
  material: { nombre: string; categoria: string } | { nombre: string; categoria: string }[] | null;
}

interface PrestamoStockRow {
  material_id: string;
  cantidad_prestada: number;
  cantidad_devuelta: number | null;
}

function relatedMaterialName(
  value: { nombre: string; categoria: string } | { nombre: string; categoria: string }[] | null
) {
  if (Array.isArray(value)) return value[0]?.nombre;
  return value?.nombre;
}

function categoryLabel(value: string) {
  const labels: Record<string, string> = {
    herramienta_manual: "Herramienta",
    consumible: "Consumible",
    equipo_proteccion: "Protección",
    equipo_medicion: "Medición",
  };
  return labels[value] ?? value;
}

export default async function EquipoPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  const search = getSearchParam(searchParams);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("equipo_id")
    .eq("id", user?.id)
    .single();

  const [{ data: materiales }, { data: prestamosActivos }, { data: prestamosStock }] =
    await Promise.all([
      supabase
        .from("materiales")
        .select("id, nombre, categoria, cantidad_total, stock_minimo, estado")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("prestamos")
        .select("id, material_id, cantidad_prestada, cantidad_devuelta, created_at, material:materiales(nombre, categoria)")
        .eq("equipo_id", perfil?.equipo_id)
        .eq("estado", "activo")
        .order("created_at", { ascending: false }),
      supabase
        .from("prestamos")
        .select("material_id, cantidad_prestada, cantidad_devuelta")
        .eq("estado", "activo"),
    ]);

  const prestadoPorMaterial = new Map<string, number>();
  for (const prestamo of (prestamosStock ?? []) as PrestamoStockRow[]) {
    const pendiente = prestamo.cantidad_prestada - (prestamo.cantidad_devuelta ?? 0);
    prestadoPorMaterial.set(
      prestamo.material_id,
      (prestadoPorMaterial.get(prestamo.material_id) ?? 0) + pendiente
    );
  }

  const materialesConDisponible = ((materiales ?? []) as MaterialRow[]).map((material) => {
    const prestado = prestadoPorMaterial.get(material.id) ?? 0;
    return {
      ...material,
      disponible: Math.max(0, material.cantidad_total - prestado),
    };
  });

  const prestamos = (prestamosActivos ?? []) as unknown as PrestamoActivoRow[];
  const filteredPrestamos = prestamos.filter((prestamo) =>
    matchesSearch(search, [
      relatedMaterialName(prestamo.material),
      Array.isArray(prestamo.material)
        ? prestamo.material[0]?.categoria
        : prestamo.material?.categoria,
      categoryLabel(
        Array.isArray(prestamo.material)
          ? prestamo.material[0]?.categoria ?? ""
          : prestamo.material?.categoria ?? ""
      ),
    ])
  );
  const filteredMateriales = materialesConDisponible.filter((material) =>
    matchesSearch(search, [
      material.nombre,
      material.categoria,
      categoryLabel(material.categoria),
      material.estado,
    ])
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Materiales disponibles</p>
          <p className="text-2xl font-bold text-cecyte-primary">
            {materialesConDisponible.filter((m) => m.disponible > 0).length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Préstamos activos</p>
          <p className="text-2xl font-bold text-cecyte-primary">{prestamos.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Stock bajo visible</p>
          <p className="text-2xl font-bold text-orange-600">
            {materialesConDisponible.filter((m) => m.disponible <= m.stock_minimo).length}
          </p>
        </div>
      </section>

      <SearchBox
        value={search}
        placeholder="Buscar material por nombre, categoría o estado..."
        total={materialesConDisponible.length + prestamos.length}
        filtered={filteredMateriales.length + filteredPrestamos.length}
        clearHref="/equipo"
      />

      <section id="prestamos" className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-cecyte-primary" />
          <h2 className="text-lg font-bold">Mis préstamos activos</h2>
        </div>

        {filteredPrestamos.length === 0 ? (
          <div className="rounded-xl bg-white p-4 text-sm text-muted-foreground shadow-sm">
            {search ? "No encontramos préstamos activos con ese texto." : "No tienes préstamos activos por devolver."}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredPrestamos.map((prestamo) => {
              const pendiente = prestamo.cantidad_prestada - (prestamo.cantidad_devuelta ?? 0);
              return (
                <article key={prestamo.id} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{relatedMaterialName(prestamo.material) ?? "Material"}</h3>
                      <p className="text-xs text-muted-foreground">
                        Pendiente: {pendiente} de {prestamo.cantidad_prestada}
                      </p>
                    </div>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                      Activo
                    </span>
                  </div>
                  <ManagedForm
                    action={devolverMaterial}
                    successMessage="Devolución registrada."
                    className="grid gap-2 sm:grid-cols-[120px_1fr_auto]"
                  >
                    <input type="hidden" name="prestamo_id" value={prestamo.id} />
                    <input
                      name="cantidad"
                      type="number"
                      min="1"
                      max={pendiente}
                      defaultValue={pendiente}
                      className="rounded-md border px-3 py-3 text-sm"
                    />
                    <input
                      name="comentario"
                      placeholder="Comentario opcional"
                      className="rounded-md border px-3 py-3 text-sm"
                    />
                    <button className="min-h-12 rounded-md bg-cecyte-primary px-4 py-3 text-sm font-medium text-white hover:bg-cecyte-dark">
                      Devolver
                    </button>
                  </ManagedForm>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section id="catalogo" className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBasket className="h-5 w-5 text-cecyte-primary" />
          <h2 className="text-lg font-bold">Pedir material</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {filteredMateriales.map((material) => {
            const agotado = material.disponible <= 0;
            const bajo = material.disponible <= material.stock_minimo;
            return (
              <article key={material.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{material.nombre}</h3>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabel(material.categoria)} · Estado {material.estado}
                    </p>
                  </div>
                  <span className={bajo ? "rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800" : "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"}>
                    {material.disponible} disp.
                  </span>
                </div>

                {agotado && (
                  <div className="mb-3 flex items-center gap-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Sin stock disponible para préstamo.
                  </div>
                )}

                <ManagedForm
                  action={pedirMaterial}
                  successMessage="Préstamo registrado."
                  className="grid gap-2 sm:grid-cols-[100px_1fr]"
                >
                  <input type="hidden" name="material_id" value={material.id} />
                  <input
                    name="cantidad"
                    type="number"
                    min="1"
                    max={material.disponible}
                    defaultValue={material.disponible > 0 ? 1 : 0}
                    disabled={agotado}
                    className="rounded-md border px-3 py-3 text-sm disabled:bg-muted"
                  />
                  <button
                    disabled={agotado}
                    className="min-h-12 rounded-md bg-cecyte-primary px-4 py-3 text-sm font-medium text-white hover:bg-cecyte-dark disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                  >
                    Pedir
                  </button>
                </ManagedForm>

                {material.categoria === "consumible" && (
                  <ManagedForm
                    action={consumirMaterial}
                    successMessage="Consumo registrado."
                    className="mt-2 grid gap-2 sm:grid-cols-[100px_1fr]"
                  >
                    <input type="hidden" name="material_id" value={material.id} />
                    <input
                      name="cantidad"
                      type="number"
                      min="1"
                      max={material.disponible}
                      defaultValue={material.disponible > 0 ? 1 : 0}
                      disabled={agotado}
                      className="rounded-md border px-3 py-3 text-sm disabled:bg-muted"
                    />
                    <button
                      disabled={agotado}
                      className="flex min-h-12 items-center justify-center gap-2 rounded-md border border-orange-300 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800 hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-muted disabled:bg-muted disabled:text-muted-foreground"
                    >
                      <PackageCheck className="h-4 w-4" />
                      Consumir
                    </button>
                  </ManagedForm>
                )}
              </article>
            );
          })}
          {filteredMateriales.length === 0 && (
            <div className="rounded-xl bg-white p-4 text-sm text-muted-foreground shadow-sm md:col-span-2">
              No encontramos materiales con ese texto.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
