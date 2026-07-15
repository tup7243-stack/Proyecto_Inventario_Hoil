import { createEquipo, createEquipoPrestamo, deleteEquipo, devolverPrestamo, updateEquipo } from "@/lib/actions/admin";
import { ManagedForm } from "@/components/forms/managed-form";
import { SearchBox } from "@/components/search-box";
import { createClient } from "@/lib/supabase/server";
import { getSearchParam, matchesSearch } from "@/lib/search";

interface EquipoPrestamoRow {
  id: string;
  estado: string;
  cantidad_prestada: number;
  cantidad_devuelta: number;
  material_id: string;
  representante_id: string;
  equipo_id: string;
}

interface EquipoRow {
  id: string;
  nombre: string;
  perfiles: { id: string; nombre: string; matricula: string; rol: string }[] | null;
  prestamos: EquipoPrestamoRow[] | null;
}

interface MaterialRow {
  id: string;
  nombre: string;
  cantidad_total: number;
}

interface PrestamoRow {
  material_id: string;
  cantidad_prestada: number;
  cantidad_devuelta: number | null;
}

export default async function EquiposPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  const search = getSearchParam(searchParams);
  const supabase = await createClient();
  const [
    { data: equipos },
    { data: materiales },
    { data: prestamos },
  ] = await Promise.all([
    supabase
      .from("equipos")
      .select("id, nombre, perfiles(id, nombre, matricula, rol), prestamos(id, estado, cantidad_prestada, cantidad_devuelta, material_id, representante_id, equipo_id)")
      .order("nombre"),
    supabase
      .from("materiales")
      .select("id, nombre, cantidad_total")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("prestamos")
      .select("material_id, cantidad_prestada, cantidad_devuelta")
      .eq("estado", "activo"),
  ]);

  const allEquipos = (equipos ?? []) as EquipoRow[];
  const allMaterials = (materiales ?? []) as MaterialRow[];
  const filteredEquipos = allEquipos.filter((equipo) =>
    matchesSearch(search, [
      equipo.nombre,
      ...(equipo.perfiles ?? []).flatMap((perfil) => [
        perfil.nombre,
        perfil.matricula,
      ]),
    ])
  );

  const prestadoPorMaterial = new Map<string, number>();
  for (const prestamo of (prestamos ?? []) as PrestamoRow[]) {
    const pendiente =
      prestamo.cantidad_prestada - (prestamo.cantidad_devuelta ?? 0);
    prestadoPorMaterial.set(
      prestamo.material_id,
      (prestadoPorMaterial.get(prestamo.material_id) ?? 0) + pendiente,
    );
  }

  const materialesConDisponible = allMaterials.map((material) => ({
    ...material,
    disponible: Math.max(
      0,
      material.cantidad_total - (prestadoPorMaterial.get(material.id) ?? 0)
    ),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Equipos</h1>
        <p className="text-sm text-muted-foreground">
          Crea equipos de trabajo y revisa sus representantes/préstamos.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Nuevo equipo</h2>
        <ManagedForm
          action={createEquipo}
          successMessage="Equipo creado correctamente."
          resetOnSuccess
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            name="nombre"
            required
            placeholder="Ej. Equipo 3 - Refrigeración"
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark">
            Crear equipo
          </button>
        </ManagedForm>
      </section>

      <SearchBox
        value={search}
        placeholder="Buscar equipo, representante o matrícula..."
        total={allEquipos.length}
        filtered={filteredEquipos.length}
        clearHref="/dashboard/equipos"
      />

      <section className="grid gap-4 md:grid-cols-2">
        {filteredEquipos.map((equipo) => {
          const representantes = (equipo.perfiles ?? []).filter((perfil) => perfil.rol === "representante");
          const puedeCrearPrestamo =
            representantes.length > 0 &&
            materialesConDisponible.some((material) => material.disponible > 0);
          const prestamosActivos = (equipo.prestamos ?? []).filter(
            (prestamo) => prestamo.estado === "activo"
          );
          const prestamosActivosCount = prestamosActivos.length;

          return (
            <article key={equipo.id} className="rounded-lg border bg-card p-4 shadow-sm">
              <ManagedForm
                action={updateEquipo}
                successMessage="Nombre del equipo actualizado."
                className="space-y-3"
              >
                <input type="hidden" name="id" value={equipo.id} />
                <input
                  name="nombre"
                  defaultValue={equipo.nombre}
                  className="w-full rounded-md border px-3 py-2 text-sm font-medium"
                />
                <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                  Actualizar nombre
                </button>
              </ManagedForm>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Representantes</p>
                  <p className="font-semibold">{representantes.length}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Préstamos activos</p>
                  <p className="font-semibold">{prestamosActivosCount}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {representantes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin representante asignado.</p>
                ) : (
                  representantes.map((perfil) => (
                    <div key={perfil.id} className="rounded-md border px-3 py-2 text-sm">
                      {perfil.nombre} · Matrícula {perfil.matricula}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 border-t pt-4">
                <h3 className="mb-2 text-sm font-medium">Crear préstamo</h3>
                {representantes.length > 0 ? (
                  <ManagedForm
                    action={createEquipoPrestamo}
                    successMessage="Préstamo creado correctamente."
                    resetOnSuccess
                    className="space-y-2"
                  >
                    <input type="hidden" name="equipo_id" value={equipo.id} />
                    <select
                      name="representante_id"
                      required
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="" disabled>
                        Selecciona un representante
                      </option>
                      {representantes.map((perfil) => (
                        <option key={perfil.id} value={perfil.id}>
                          {perfil.nombre} · {perfil.matricula}
                        </option>
                      ))}
                    </select>
                    <select
                      name="material_id"
                      required
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona un material</option>
                      {materialesConDisponible.map((m) => {
                        const disp = m.disponible;
                        return (
                          <option
                            key={m.id}
                            value={m.id}
                            disabled={disp === 0}
                          >
                            {m.nombre} (Disponible: {disp})
                          </option>
                        );
                      })}
                    </select>
                    <input
                      name="cantidad"
                      type="number"
                      min="1"
                      placeholder="Cantidad a prestar"
                      required
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <button
                      disabled={!puedeCrearPrestamo}
                      className="w-full rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                    >
                      Crear préstamo
                    </button>
                  </ManagedForm>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Asigna al menos un representante para crear préstamos.
                  </p>
                )}
              </div>

              {prestamosActivos.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="mb-2 text-sm font-medium">Préstamos activos</h3>
                  <div className="space-y-2">
                    {prestamosActivos.map((prestamo) => {
                      const material = allMaterials.find((m) => m.id === prestamo.material_id);
                      const representante = representantes.find(
                        (p) => p.id === prestamo.representante_id,
                      );
                      const pendiente = prestamo.cantidad_prestada - prestamo.cantidad_devuelta;

                      return (
                        <div
                          key={prestamo.id}
                          className="rounded-md border px-3 py-2 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {material?.nombre ?? "Material desconocido"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Pendiente: {pendiente} · {representante?.nombre ?? "—"}
                              </p>
                            </div>
                            <ManagedForm
                              action={devolverPrestamo}
                              successMessage="Devolución registrada correctamente."
                              resetOnSuccess
                              className="flex shrink-0 items-center gap-1"
                            >
                              <input type="hidden" name="prestamo_id" value={prestamo.id} />
                              <input type="hidden" name="equipo_id" value={equipo.id} />
                              <input
                                name="cantidad"
                                type="number"
                                min="1"
                                max={pendiente}
                                defaultValue={pendiente}
                                required
                                className="w-14 rounded-md border px-2 py-1 text-xs"
                              />
                              <button className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700">
                                Devolver
                              </button>
                            </ManagedForm>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <ManagedForm
                action={deleteEquipo}
                successMessage="Equipo eliminado."
                confirmMessage={`¿Eliminar "${equipo.nombre}"? Solo funcionará si no tiene representantes ni historial.`}
                className="mt-4"
              >
                <input type="hidden" name="id" value={equipo.id} />
                <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                  Eliminar equipo
                </button>
              </ManagedForm>
            </article>
          );
        })}
        {filteredEquipos.length === 0 && (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm md:col-span-2">
            No encontramos equipos con ese texto.
          </div>
        )}
      </section>
    </div>
  );
}
