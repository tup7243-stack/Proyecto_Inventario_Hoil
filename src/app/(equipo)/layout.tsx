import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Package, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export default async function EquipoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol, nombre, equipo:equipos(nombre)")
    .eq("id", user.id)
    .single();

  if (perfil?.rol !== "representante") redirect("/dashboard");

  const equipoRelation = perfil?.equipo as
    | { nombre: string }
    | { nombre: string }[]
    | null
    | undefined;
  const equipo = Array.isArray(equipoRelation)
    ? equipoRelation[0]?.nombre
    : equipoRelation?.nombre;

  return (
    <div className="min-h-screen bg-cecyte-light">
      <header className="sticky top-0 z-40 border-b bg-cecyte-primary text-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/equipo" className="flex items-center gap-2 font-bold">
            <Package className="h-6 w-6" />
            Inventario CECYTE
          </Link>
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20">
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5 pb-24">
        <div className="mb-5 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-cecyte-light p-2 text-cecyte-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Representante</p>
              <h1 className="font-semibold text-foreground">{perfil?.nombre}</h1>
              <p className="text-xs text-muted-foreground">{equipo ?? "Equipo sin asignar"}</p>
            </div>
          </div>
        </div>
        <div className="mb-4 flex justify-end">
          <RealtimeRefresh showStatus label="Inventario en vivo" />
        </div>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-2 text-center text-xs font-medium">
          <a href="#catalogo" className="px-3 py-3 text-cecyte-primary">Pedir</a>
          <a href="#prestamos" className="px-3 py-3 text-cecyte-primary">Devolver</a>
        </div>
      </nav>
    </div>
  );
}
