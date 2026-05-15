import { createEquipo, deleteEquipo, updateEquipo } from "@/lib/actions/admin";
import { ManagedForm } from "@/components/forms/managed-form";
import { createClient } from "@/lib/supabase/server";

interface EquipoRow {
  id: string;
  nombre: string;
  perfiles: { id: string; nombre: string; matricula: string }[] | null;
  prestamos: { id: string; estado: string }[] | null;
}

export default async function EquiposPage() {
  const supabase = await createClient();
  const { data: equipos } = await supabase
    .from("equipos")
    .select("id, nombre, perfiles(id, nombre, matricula), prestamos(id, estado)")
    .order("nombre");

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

      <section className="grid gap-4 md:grid-cols-2">
        {((equipos ?? []) as EquipoRow[]).map((equipo) => {
          const prestamosActivos = (equipo.prestamos ?? []).filter(
            (prestamo) => prestamo.estado === "activo"
          ).length;

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
                  <p className="font-semibold">{equipo.perfiles?.length ?? 0}</p>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Préstamos activos</p>
                  <p className="font-semibold">{prestamosActivos}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {(equipo.perfiles ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin representante asignado.</p>
                ) : (
                  equipo.perfiles?.map((perfil) => (
                    <div key={perfil.id} className="rounded-md border px-3 py-2 text-sm">
                      {perfil.nombre} · Matrícula {perfil.matricula}
                    </div>
                  ))
                )}
              </div>

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
      </section>
    </div>
  );
}
