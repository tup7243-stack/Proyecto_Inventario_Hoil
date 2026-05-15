import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth Callback Route — maneja el redirect post-autenticación de Supabase.
 *
 * Supabase redirige a /auth/callback?code=xxx después de:
 * - Confirmación de email (signup flow)
 * - OAuth (Google login institucional)
 *
 * Intercambiamos el code por una sesión de usuario y redirigimos
 * al dashboard correspondiente según el rol en perfiles.
 *
 * Spec: auth-session / Login success → redirect by role
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // Sin código de autorización → redirigir al login con error
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_missing_code`
    );
  }

  const supabase = await createClient();

  // Intercambiar el code por una sesión
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Recuperar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=no_user_found`
    );
  }

  // Obtener rol desde perfiles
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Tu cuenta no está habilitada en el sistema. Solicita acceso al administrador."
      )}`
    );
  }

  // Redirigir al dashboard correcto según el rol
  // Design: admin → /dashboard, representante → /equipo
  const dashboard =
    perfil?.rol === "admin" ? "/dashboard" : "/equipo";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${dashboard}`);
  }

  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${dashboard}`);
  }

  return NextResponse.redirect(`${origin}${dashboard}`);
}
