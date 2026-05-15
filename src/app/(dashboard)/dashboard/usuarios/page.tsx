import {
  createUsuario,
  deletePerfil,
  resetUsuarioPassword,
  updatePerfil,
} from "@/lib/actions/admin";
import { ManagedForm } from "@/components/forms/managed-form";
import { createAdminClient, createClient } from "@/lib/supabase/server";

interface EquipoRow {
  id: string;
  nombre: string;
}

interface PerfilRow {
  id: string;
  nombre: string;
  matricula: string;
  rol: "admin" | "representante";
  equipo_id: string | null;
  equipo: { nombre: string } | { nombre: string }[] | null;
}

function relatedName(value: { nombre: string } | { nombre: string }[] | null) {
  if (Array.isArray(value)) return value[0]?.nombre;
  return value?.nombre;
}

export default async function UsuariosPage() {
  const supabase = await createClient();
  const adminSupabase = await createAdminClient();
  const [{ data: perfiles }, { data: equipos }, { data: authUsers }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("id, nombre, matricula, rol, equipo_id, equipo:equipos(nombre)")
      .order("nombre"),
    supabase.from("equipos").select("id, nombre").order("nombre"),
    adminSupabase.auth.admin.listUsers(),
  ]);
  const emailByUserId = new Map(
    (authUsers?.users ?? []).map((user) => [user.id, user.email ?? "Sin correo"])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona perfiles de dominio, roles y asignación de equipo.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Nuevo usuario</h2>
        <ManagedForm
          action={createUsuario}
          successMessage="Usuario creado correctamente."
          resetOnSuccess
          className="grid gap-3 md:grid-cols-6"
        >
          <input
            name="nombre"
            placeholder="Nombre completo"
            required
            className="rounded-md border px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="matricula"
            placeholder="Matrícula"
            required
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="correo@cecyte.edu.mx"
            required
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            name="password"
            type="password"
            minLength={6}
            placeholder="Contraseña inicial"
            required
            className="rounded-md border px-3 py-2 text-sm"
          />
          <select name="rol" defaultValue="representante" className="rounded-md border px-3 py-2 text-sm">
            <option value="admin">Admin</option>
            <option value="representante">Representante</option>
          </select>
          <select name="equipo_id" defaultValue="" className="rounded-md border px-3 py-2 text-sm md:col-span-2">
            <option value="">Sin equipo</option>
            {((equipos ?? []) as EquipoRow[]).map((equipo) => (
              <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
            ))}
          </select>
          <button className="rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark md:col-span-4">
            Crear usuario
          </button>
        </ManagedForm>
      </section>

      <section className="grid gap-4">
        {((perfiles ?? []) as unknown as PerfilRow[]).map((perfil) => (
          <article key={perfil.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <ManagedForm
              action={updatePerfil}
              successMessage="Usuario actualizado."
              className="grid gap-3 md:grid-cols-6"
            >
              <input type="hidden" name="id" value={perfil.id} />
              <input
                name="nombre"
                defaultValue={perfil.nombre}
                className="rounded-md border px-3 py-2 text-sm md:col-span-2"
              />
              <input
                name="matricula"
                defaultValue={perfil.matricula}
                className="rounded-md border px-3 py-2 text-sm"
              />
              <select name="rol" defaultValue={perfil.rol} className="rounded-md border px-3 py-2 text-sm">
                <option value="admin">Admin</option>
                <option value="representante">Representante</option>
              </select>
              <select name="equipo_id" defaultValue={perfil.equipo_id ?? ""} className="rounded-md border px-3 py-2 text-sm">
                <option value="">Sin equipo</option>
                {((equipos ?? []) as EquipoRow[]).map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>{equipo.nombre}</option>
                ))}
              </select>
              <button className="rounded-md bg-cecyte-primary px-4 py-2 text-sm font-medium text-white hover:bg-cecyte-dark">
                Guardar
              </button>
            </ManagedForm>
            <p className="mt-2 text-xs text-muted-foreground">
              Correo: {emailByUserId.get(perfil.id) ?? "Sin correo"} ·{" "}
              Equipo actual: {relatedName(perfil.equipo) ?? "Sin equipo"}
            </p>
            <ManagedForm
              action={resetUsuarioPassword}
              successMessage="Contraseña actualizada."
              className="mt-3 flex flex-col gap-2 sm:flex-row"
            >
              <input type="hidden" name="id" value={perfil.id} />
              <input
                name="password"
                type="password"
                minLength={6}
                placeholder="Nueva contraseña"
                required
                className="rounded-md border px-3 py-2 text-sm"
              />
              <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
                Restablecer contraseña
              </button>
            </ManagedForm>
            <ManagedForm
              action={deletePerfil}
              successMessage="Usuario eliminado."
              confirmMessage={`¿Eliminar a "${perfil.nombre}"? Solo funcionará si no tiene historial.`}
              className="mt-3"
            >
              <input type="hidden" name="id" value={perfil.id} />
              <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                Eliminar usuario
              </button>
            </ManagedForm>
          </article>
        ))}
      </section>
    </div>
  );
}
