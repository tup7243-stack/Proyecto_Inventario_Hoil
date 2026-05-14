import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Landing page (/) — punto de entrada principal.
 *
 * Redirige usuarios autenticados a su dashboard según el rol.
 * Si no hay sesión, el middleware ya redirige a /login, pero
 * mantenemos la verificación como defensa en profundidad.
 */
export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Obtener rol del perfil del dominio
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  // Design: admin → /dashboard, representante → /equipo
  if (perfil?.rol === "admin") {
    redirect("/dashboard");
  }

  redirect("/equipo");
}
