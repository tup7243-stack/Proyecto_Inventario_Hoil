import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware — protección de rutas por rol.
 *
 * Flujo:
 * 1. Refresca la sesión de Supabase Auth (cookies)
 * 2. Si no hay sesión → redirige a /login
 * 3. Si es admin y va a /equipo → redirige a /dashboard
 * 4. Si es representante y va a /dashboard → redirige a /equipo
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refrescar sesión (importante: no uses getUser() porque hace request a Supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Rutas públicas (sin sesión requerida)
  const publicPaths = ["/login", "/auth"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  // Si el usuario no está autenticado
  if (!user) {
    // Permitir acceso a rutas públicas
    if (isPublicPath) {
      return supabaseResponse;
    }
    // Redirigir a /login para todo lo demás
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Usuario autenticado — obtener rol desde perfiles
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single();

  const rol = perfil?.rol;

  // Si está en /login pero ya tiene sesión, redirigir a su dashboard
  if (pathname === "/login") {
    const redirectUrl = new URL(
      rol === "admin" ? "/dashboard" : "/equipo",
      request.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Protección de rutas por rol
  if (rol === "admin" && pathname.startsWith("/equipo")) {
    // Admin intentando acceder a ruta de Representante
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (rol === "representante") {
    // Representante intentando acceder a ruta de Admin
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin")
    ) {
      const equipoUrl = new URL("/equipo", request.url);
      return NextResponse.redirect(equipoUrl);
    }
  }

  return supabaseResponse;
}

/**
 * Configuración de rutas que disparan el middleware.
 * Excluye archivos estáticos, imágenes, y la ruta de callback OAuth.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
